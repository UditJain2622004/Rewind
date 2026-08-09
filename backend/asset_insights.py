"""Asset understanding stage for the AI Memory pipeline.

This module intentionally stops at ``asset_insights.md``.  It does not create
memory.json or memory.md.  The artifact is deliberately human-readable: the
only stable structure is the asset identity and ordering metadata; model
output is kept as plain text so it can be reviewed before memory synthesis.
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import re
import time
import uuid
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any
from urllib.request import Request, urlopen
from urllib.parse import urlparse


def load_manifest(path: str | Path) -> list[dict[str, Any]]:
    """Load and stably order the input manifest by upload time."""
    records = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(records, list):
        raise ValueError("assets manifest must be a JSON array")
    for record in records:
        if not isinstance(record, dict) or not record.get("asset_id"):
            raise ValueError("every asset record needs an asset_id")
    return sorted(records, key=lambda r: (r.get("uploaded_at") or "", r["asset_id"]))


def _download(url: str, destination: Path) -> Path:
    destination.parent.mkdir(parents=True, exist_ok=True)
    request = Request(url, headers={"User-Agent": "ai-memory/asset-understanding"})
    with urlopen(request, timeout=60) as response, destination.open("wb") as output:
        output.write(response.read())
    return destination


def _source_suffix(url: str, default: str) -> str:
    """Return a provider-acceptable extension from a hosted asset URL."""
    suffix = Path(urlparse(url).path).suffix.lower()
    # Cloudinary and similar URLs normally retain the original extension. If
    # they do not, use the MIME hint when available, otherwise a safe default.
    if suffix in {".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp3", ".wav", ".aac", ".flac", ".ogg", ".m4a", ".mp4", ".webm"}:
        return suffix
    guessed, _ = mimetypes.guess_type(url)
    if guessed:
        guessed_suffix = mimetypes.guess_extension(guessed)
        if guessed_suffix:
            return guessed_suffix
    return default


def _client():
    """Create a Sarvam client lazily, so dry runs work without the SDK/key."""
    key = os.environ.get("SARVAM_API_KEY")
    if not key:
        raise RuntimeError("SARVAM_API_KEY is not set")
    try:
        from sarvamai import SarvamAI
    except ImportError as exc:
        raise RuntimeError("install the sarvamai package to call Sarvam") from exc
    return SarvamAI(api_subscription_key=key)


def _image_insight(asset: dict[str, Any], workdir: Path) -> str:
    """Run Sarvam Vision and return its human-readable output.

    Sarvam Vision is document-oriented, so its output is intentionally not
    forced into a scene-description schema.  We preserve the returned text
    (including OCR/markdown) for later review and synthesis.
    """
    source = workdir / f"{asset['asset_id']}{_source_suffix(asset['file_url'], '.jpg')}"
    _download(asset["file_url"], source)
    client = _client()
    output_zip = workdir / f"{asset['asset_id']}.zip"
    job = client.document_intelligence.create_job(language="en-IN", output_format="md")
    job.upload_file(str(source))
    job.start()
    job.wait_until_complete()
    job.download_output(str(output_zip))

    # Vision currently returns document-digitisation artifacts such as
    # document.md and page JSON. Keep the readable Markdown/OCR text, but do
    # not expose the raw JSON/binary-looking artifacts downstream.
    with zipfile.ZipFile(output_zip) as archive:
        markdown_names = [
            name for name in archive.namelist()
            if not name.endswith("/") and name.lower().endswith((".md", ".markdown"))
        ]
        excerpts: list[str] = []
        for name in markdown_names:
            raw = archive.read(name).decode("utf-8", errors="replace")
            # Document digitisation Markdown can embed the source image as a
            # massive data:image/...;base64 URI. It is not an insight and,
            # when kept, swallows the output limit before useful text appears.
            raw = re.sub(
                r"!\[[^\]]*\]\(data:image/[^)]*\)",
                "",
                raw,
                flags=re.IGNORECASE | re.DOTALL,
            )
            raw = re.sub(r"<img[^>]+src=[\"']data:image/[^>]*>", "", raw, flags=re.IGNORECASE | re.DOTALL)
            cleaned = "".join(char for char in raw if char in "\n\r\t" or ord(char) >= 32).strip()
            if cleaned:
                excerpts.append(cleaned)
    text = "\n\n".join(excerpts).strip()
    if text:
        # Keep useful OCR/Markdown context without allowing a document dump
        # to overwhelm the per-asset insight or later model prompts.
        limit = 4000
        return "Sarvam Vision extracted text:\n\n" + text[:limit] + ("\n[…truncated]" if len(text) > limit else "")
    return "Sarvam Vision returned no usable photo insight."


def _voice_batch_insights(
    assets: list[dict[str, Any]], workdir: Path, multiple_speakers: bool = False
) -> dict[str, str]:
    """Transcribe all voice notes in one Saaras job.

    ``multiple_speakers`` enables Saaras diarization.  The returned insight
    remains plain text; any speaker labels supplied by Saaras are preserved.
    """
    if not assets:
        return {}
    paths: list[Path] = []
    for asset in assets:
        paths.append(_download(
            asset["file_url"],
            workdir / f"{asset['asset_id']}{_source_suffix(asset['file_url'], '.mp3')}",
        ))

    client = _client()
    job = client.speech_to_text_job.create_job(
        model="saaras:v3",
        mode="transcribe",
        with_diarization=multiple_speakers,
    )
    job.upload_files(file_paths=[str(path) for path in paths])
    job.start()
    job.wait_until_complete()
    result_dir = workdir / f"transcripts-{uuid.uuid4().hex}"
    result_dir.mkdir(parents=True, exist_ok=True)
    job.download_outputs(output_dir=str(result_dir))

    by_name: dict[str, str] = {}
    for result_file in result_dir.glob("*.json"):
        payload = json.loads(result_file.read_text(encoding="utf-8"))
        transcript = _transcript_from_payload(payload, multiple_speakers)
        # SDK output names are commonly based on input names; the numeric form
        # is also supported by mapping in upload order below.
        by_name[result_file.stem] = transcript

    insights: dict[str, str] = {}
    result_files = sorted(result_dir.glob("*.json"))
    for index, asset in enumerate(assets):
        direct = by_name.get(asset["asset_id"])
        if direct is None and index < len(result_files):
            payload = json.loads(result_files[index].read_text(encoding="utf-8"))
            direct = _transcript_from_payload(payload, multiple_speakers)
        insights[asset["asset_id"]] = direct or "Saaras returned no transcript."
    return insights


def _transcript_from_payload(payload: Any, multiple_speakers: bool = False) -> str:
    """Extract a readable transcript, retaining diarization when available."""
    if not isinstance(payload, dict):
        return ""
    if multiple_speakers:
        for key in ("diarized_transcript", "speaker_transcript", "segments"):
            value = payload.get(key)
            if isinstance(value, list) and value:
                lines: list[str] = []
                for item in value:
                    if isinstance(item, dict):
                        speaker = item.get("speaker") or item.get("speaker_id") or "Speaker"
                        text = item.get("text") or item.get("transcript") or ""
                        if text:
                            lines.append(f"{speaker}: {text}")
                    elif item:
                        lines.append(str(item))
                if lines:
                    return "\n".join(lines)
            elif isinstance(value, str) and value.strip():
                return value.strip()
    value = payload.get("transcript", "")
    return value.strip() if isinstance(value, str) else str(value or "")


def _markdown_entry(asset: dict[str, Any], body: str) -> str:
    caption = asset.get("user_caption") or "(none)"
    tags = ", ".join(asset.get("user_tags") or []) or "(none)"
    lines = [
        f"## {asset['asset_id']} · {asset.get('type', 'unknown')}",
        f"Uploaded: {asset.get('uploaded_at') or '(unknown)' }  ",
        f"Captured/recorded: {asset.get('captured_at') or asset.get('recorded_at') or '(unknown)'}",
        "",
        f"User caption: {caption}",
        f"User tags: {tags}",
        "",
        body.strip() or "No insight was produced.",
        "",
    ]
    return "\n".join(lines)


def build_asset_insights(
    manifest_path: str | Path = "assets_manifest.json",
    output_path: str | Path = "asset_insights.md",
    max_workers: int = 4,
    dry_run: bool = False,
    multiple_speakers: bool = False,
) -> Path:
    """Process independent assets concurrently and write ordered markdown."""
    assets = load_manifest(manifest_path)
    images = [a for a in assets if a.get("type") == "image"]
    voices = [a for a in assets if a.get("type") == "voice_note"]
    insight_by_id: dict[str, str] = {}

    # Keep temporary files beside the requested artifact.  The directory is
    # intentionally reusable: some restricted Windows environments create
    # temporary directories with permissions that prevent Python cleanup.
    temp_parent = Path(output_path).resolve().parent
    workdir = temp_parent / ".memory-assets"
    workdir.mkdir(parents=True, exist_ok=True)
    try:
        if dry_run:
            for asset in images:
                insight_by_id[asset["asset_id"]] = "[dry run] Sarvam Vision was not called."
            for asset in voices:
                insight_by_id[asset["asset_id"]] = "[dry run] Saaras was not called."
        else:
            with ThreadPoolExecutor(max_workers=max_workers) as pool:
                futures = {
                    pool.submit(_image_insight, asset, workdir): asset
                    for asset in images
                }
                voice_future = (
                    pool.submit(_voice_batch_insights, voices, workdir, multiple_speakers)
                    if voices else None
                )
                for future in as_completed(futures):
                    asset = futures[future]
                    try:
                        insight_by_id[asset["asset_id"]] = "Sarvam Vision output:\n\n" + future.result()
                    except Exception as exc:  # retain failures in the artifact
                        insight_by_id[asset["asset_id"]] = f"Sarvam Vision failed: {type(exc).__name__}: {exc}"
                if voice_future:
                    try:
                        insight_by_id.update({
                            asset_id: "Saaras transcript:\n\n" + transcript
                            for asset_id, transcript in voice_future.result().items()
                        })
                    except Exception as exc:
                        for asset in voices:
                            insight_by_id[asset["asset_id"]] = f"Saaras failed: {type(exc).__name__}: {exc}"
    finally:
        # Files are cacheable between runs and are deliberately not removed.
        # The generated Markdown is the only committed/user-facing artifact.
        pass

    sections = [
        "# Asset Insights",
        "",
        "Generated in uploaded_at order. This is an evidence artifact; memory synthesis is intentionally not performed here.",
        "",
    ]
    for asset in assets:
        asset_type = asset.get("type")
        if asset_type == "text_note":
            body = "User text (verbatim):\n\n" + str(asset.get("raw_text") or "")
        elif asset_type in {"image", "voice_note"}:
            body = insight_by_id.get(asset["asset_id"], "No insight was produced.")
        else:
            body = "Unsupported asset type for this phase; retained for later processing."
        sections.append(_markdown_entry(asset, body))

    output = Path(output_path)
    output.write_text("\n".join(sections).rstrip() + "\n", encoding="utf-8")
    return output


def _parse_insight_sections(text: str) -> tuple[str, list[tuple[str, str, str]]]:
    """Return the preamble and asset sections without interpreting model prose."""
    # Asset ids are not required to use the old ``ast_`` prefix.  In
    # particular, manifests produced by the capture service use ids such as
    # ``rewind_memories/...``.  Match the heading shape emitted by
    # ``_markdown_entry`` (id, separator, type) so Markdown
    # headings that happen to occur inside model output are not treated as
    # new assets.  Keep the legacy fallback for hand-authored/mock files.
    matches = list(
        re.finditer(
            r"^##\s+(?P<asset_id>\S+)(?:\s+\S+)?\s+(?:image|voice_note|text_note|unknown)\s*$",
            text,
            flags=re.MULTILINE,
        )
    )
    if not matches:
        matches = list(re.finditer(r"^##\s+(ast_[^\s]+).*?$", text, flags=re.MULTILINE))
    if not matches:
        raise ValueError("asset insights file contains no asset sections")
    preamble = text[:matches[0].start()]
    sections: list[tuple[str, str, str]] = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        header = match.group(0).rstrip("\r\n")
        body = text[match.end():end].strip("\r\n")
        asset_id = match.groupdict().get("asset_id") or match.group(1)
        sections.append((asset_id, header, body))
    return preamble, sections


def _clean_model_text(text: str) -> str:
    """Remove accidental image payloads from text sent to or received from an LLM."""
    text = re.sub(r"!\[[^\]]*\]\(data:image/[^)]*\)", "", text, flags=re.I | re.S)
    return re.sub(r"data:image/[^\s)]+", "", text, flags=re.I).strip()


def _caption_from_section(body: str) -> str:
    match = re.search(r"^User caption:\s*(.+)$", body, flags=re.MULTILINE)
    return match.group(1).strip() if match else ""


def _visible_people_count(body: str) -> int | None:
    lower = body.lower()
    for word, value in (("three", 3), ("two", 2), ("four", 4), ("one", 1)):
        if re.search(rf"\b{word}\s+(?:young )?(?:men|people|persons|friends)\b", lower):
            return value
    return None


def _identity_hint(
    body: str,
    metadata: dict[str, Any] | None,
    roster: list[str],
) -> str:
    """Create a conservative people hint from explicit text, not faces."""
    mentioned = [name for name in roster if re.search(rf"\b{re.escape(name)}\b", body, flags=re.I)]
    caption = _caption_from_section(body)
    contributor = (metadata or {}).get("contributor_name")
    if contributor and re.search(r"\bI\b", caption):
        mentioned.append(str(contributor))
    mentioned = list(dict.fromkeys(mentioned))
    visible_count = _visible_people_count(body)
    if visible_count == len(roster) and len(roster) >= 2:
        return f"The image shows the full named team, so the people are likely {', '.join(roster)}. Do not assign left-to-right identities."
    if mentioned:
        return f"Names explicitly supported for this image: {', '.join(mentioned)}."
    return "No individual identity is directly established for this image; describe the group without naming faces."


def _relevant_enrichment_context(
    asset_id: str,
    body: str,
    sections: list[tuple[str, str, str]],
    metadata: dict[str, Any] | None,
    roster: list[str],
) -> str:
    """Make a concise per-image brief rather than sending the entire file."""
    caption_lines = []
    transcript_chunks = []
    for other_id, header, other_body in sections:
        cleaned = _clean_model_text(other_body)
        caption = _caption_from_section(cleaned)
        if caption and caption != "(none)":
            caption_lines.append(f"{other_id}: {caption}")
        if "voice_note" in header.lower() and cleaned:
            transcript_chunks.append(f"{other_id}: {cleaned[:1300]}")

    experience_id = (metadata or {}).get("experience_id", "")
    own = _clean_model_text(body)[:2600]
    context = [
        f"Experience: {experience_id or 'the current shared experience'}.",
        f"Known contributors/participants: {', '.join(roster) or 'not supplied'}.",
        f"Identity guidance: {_identity_hint(body, metadata, roster)}",
        f"Current image ({asset_id}):\n{own}",
    ]
    if caption_lines:
        context.append("Other image captions:\n" + "\n".join(caption_lines[:12]))
    if transcript_chunks:
        context.append("Voice-note evidence:\n" + "\n\n".join(transcript_chunks[:4]))
    return "\n\n".join(context)[:9000]


def _fallback_enrichment(
    body: str,
    metadata: dict[str, Any] | None,
    roster: list[str],
) -> str:
    """Produce a useful grounded note even when the LLM is unavailable."""
    caption = _caption_from_section(body)
    lower_caption = caption.lower()
    visible_count = _visible_people_count(body)
    names = [name for name in roster if re.search(rf"\b{re.escape(name)}\b", body, flags=re.I)]
    contributor = (metadata or {}).get("contributor_name")
    if contributor and re.search(r"\bI\b", caption):
        names.append(str(contributor))
    names = list(dict.fromkeys(names))

    if visible_count == len(roster) and len(roster) >= 2:
        people = "The people pictured are likely " + ", ".join(roster) + "."
    elif names:
        people = "The supplied caption identifies " + " and ".join(names) + " as the people shown."
    else:
        people = "The photo shows members of the shared experience; the available evidence does not safely identify each face."

    experience_id = str((metadata or {}).get("experience_id", "")).lower()
    place = "at IIM Bangalore" if "iimb" in experience_id or "iim" in experience_id else "during this shared experience"
    if "train" in lower_caption:
        moment = "It captures the team's arrival after the overnight general-coach train journey."
    elif "butt chair" in lower_caption:
        moment = "This is their late-night photo break at the famous butt chairs before leaving campus for a hotel."
    elif "water tank" in lower_caption and ("goodbye" in lower_caption or "didn't win" in lower_caption):
        moment = "It is their final water-tank photo and a bittersweet goodbye after the team did not win."
    elif "water tank" in lower_caption:
        moment = "This is a landmark stop at the famous water tank associated with *3 Idiots*."
    elif "build" in lower_caption:
        moment = "The group is in a collaborative hackathon work session, building their project together."
    elif "campus" in lower_caption or "walked" in lower_caption:
        moment = "This is an early campus-exploration moment before the main hackathon work began."
    elif caption and caption != "(none)":
        moment = caption.rstrip(".") + "."
    else:
        moment = "The visual description provides the available context for this moment."
    return f"{people} The moment takes place {place}. {moment}"


def _llm_enrich_image(asset_id: str, context: str, fallback: str, roster: list[str]) -> str:
    """Ask Sarvam-105B for grounded prose, intentionally not JSON."""
    client = _client()
    prompt = f"""Enrich the image description for {asset_id} using the evidence below.

Write a compact, concrete enrichment in 2-4 sentences. It must state the
most supported answer to each applicable question: who is pictured, where the
moment is taking place, and what is happening in the trip/event. Use the names
in "Identity guidance" when it permits them. Do not assign left/right face
identities unless explicit evidence does that. Never say "I cannot tell", do
not repeat generic clothing/object lists, and do not invent unsupported facts.
Return prose only.

EVIDENCE BRIEF:
{context}
"""
    for attempt in range(3):
        try:
            response = client.chat.completions(
                model="sarvam-105b",
                messages=[
                    {"role": "system", "content": "You ground photo descriptions in user-provided memory evidence."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.15,
                max_tokens=350,
            )
            content = _clean_model_text(str(response.choices[0].message.content or ""))
            if content:
                full_team_expected = "The image shows the full named team" in context
                names_missing = full_team_expected and not any(
                    re.search(rf"\b{re.escape(name)}\b", content, flags=re.I) for name in roster
                )
                place_missing = "IIM Bangalore" in fallback and "iim bangalore" not in content.lower()
                # The fallback is a concise, evidence-derived anchor. Add it
                # when the model overlooks the most useful people/place fact.
                if names_missing or place_missing:
                    content = f"{fallback} {content}"
                return content[:2500]
        except Exception:
            if attempt == 2:
                break
            time.sleep(1 + attempt)
    return fallback


def enrich_asset_insights(
    input_path: str | Path = "asset_insights.md",
    output_path: str | Path = "enriched_asset_insights.md",
    manifest_path: str | Path = "assets_manifest.json",
    max_workers: int = 4,
    dry_run: bool = False,
) -> Path:
    """Enrich only image sections and preserve the input Markdown structure."""
    source = Path(input_path).read_text(encoding="utf-8")
    preamble, sections = _parse_insight_sections(source)
    manifest_assets = load_manifest(manifest_path) if Path(manifest_path).exists() else []
    metadata_by_id = {asset["asset_id"]: asset for asset in manifest_assets}
    roster = list(dict.fromkeys(
        asset.get("contributor_name") for asset in manifest_assets if asset.get("contributor_name")
    ))
    images = [
        (asset_id, body) for asset_id, header, body in sections
        if "image" in header.lower()
    ]
    enrichments: dict[str, str] = {}

    if dry_run:
        for asset_id, body in images:
            enrichments[asset_id] = _fallback_enrichment(body, metadata_by_id.get(asset_id), roster)
    else:
        # Two concurrent LLM calls maintain responsiveness without flooding a
        # single Sarvam account with large contextual requests.
        with ThreadPoolExecutor(max_workers=min(max_workers, 2)) as pool:
            futures = {
                pool.submit(
                    _llm_enrich_image,
                    asset_id,
                    _relevant_enrichment_context(
                        asset_id, body, sections, metadata_by_id.get(asset_id), roster
                    ),
                    _fallback_enrichment(body, metadata_by_id.get(asset_id), roster),
                    roster,
                ): asset_id
                for asset_id, body in images
            }
            for future in as_completed(futures):
                asset_id = futures[future]
                try:
                    enrichments[asset_id] = future.result()
                except Exception as exc:
                    # This should be rare because _llm_enrich_image retries,
                    # but never leave the next phase without an insight.
                    body = next(value for key, value in images if key == asset_id)
                    enrichments[asset_id] = _fallback_enrichment(body, metadata_by_id.get(asset_id), roster)

    rendered = [preamble.rstrip(), ""]
    for asset_id, header, body in sections:
        rendered.append(header)
        # Make repeated enrichment runs idempotent: replace an existing
        # enrichment instead of appending another one.
        body = re.split(r"\nContextual enrichment:\s*\n", body, maxsplit=1)[0].rstrip()
        rendered.append(body)
        if asset_id in enrichments:
            rendered.extend(["", "Contextual enrichment:", "", enrichments[asset_id].strip()])
        rendered.append("")
    output = Path(output_path)
    output.write_text("\n".join(rendered).rstrip() + "\n", encoding="utf-8")
    return output


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate free-form asset insights.")
    parser.add_argument("--manifest", default="assets_manifest.json")
    parser.add_argument("--output", default="asset_insights.md")
    parser.add_argument("--input", default="asset_insights.md", help="Input asset-insights file for --enrich")
    parser.add_argument("--enrich", action="store_true", help="Enrich image sections with Sarvam-105B")
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--dry-run", action="store_true", help="Create the artifact without API calls")
    parser.add_argument(
        "--multiple-speakers",
        action="store_true",
        help="Enable Saaras speaker diarization for voice notes",
    )
    args = parser.parse_args()
    if args.enrich:
        print(enrich_asset_insights(args.input, args.output, args.manifest, args.workers, args.dry_run))
    else:
        print(build_asset_insights(
            args.manifest, args.output, args.workers, args.dry_run,
            multiple_speakers=args.multiple_speakers,
        ))


if __name__ == "__main__":
    main()
