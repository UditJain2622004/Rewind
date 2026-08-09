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


def _voice_batch_insights(assets: list[dict[str, Any]], workdir: Path) -> dict[str, str]:
    """Transcribe all voice notes in one concurrent-friendly Saaras job."""
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
        with_diarization=False,
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
        transcript = payload.get("transcript", "") if isinstance(payload, dict) else ""
        # SDK output names are commonly based on input names; the numeric form
        # is also supported by mapping in upload order below.
        by_name[result_file.stem] = transcript

    insights: dict[str, str] = {}
    result_files = sorted(result_dir.glob("*.json"))
    for index, asset in enumerate(assets):
        direct = by_name.get(asset["asset_id"])
        if direct is None and index < len(result_files):
            payload = json.loads(result_files[index].read_text(encoding="utf-8"))
            direct = payload.get("transcript", "") if isinstance(payload, dict) else ""
        insights[asset["asset_id"]] = direct or "Saaras returned no transcript."
    return insights


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
                voice_future = pool.submit(_voice_batch_insights, voices, workdir) if voices else None
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


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate free-form asset insights.")
    parser.add_argument("--manifest", default="assets_manifest.json")
    parser.add_argument("--output", default="asset_insights.md")
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--dry-run", action="store_true", help="Create the artifact without API calls")
    args = parser.parse_args()
    print(build_asset_insights(args.manifest, args.output, args.workers, args.dry_run))


if __name__ == "__main__":
    main()
