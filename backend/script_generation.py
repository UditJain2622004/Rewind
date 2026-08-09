"""Generate Relive and Share scripts from the memory artifacts with Sarvam LLM."""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import tempfile
from pathlib import Path
from typing import Any


LOGGER = logging.getLogger("ai_memory.script_generation")
SCRIPT_VARIANTS = ("relive", "share", "viral", "reaction")


def _client():
    key = os.environ.get("SARVAM_API_KEY")
    if not key:
        raise RuntimeError("SARVAM_API_KEY is not set")
    try:
        from sarvamai import SarvamAI
    except ImportError as exc:
        raise RuntimeError("Install backend/requirements.txt before calling Sarvam") from exc
    return SarvamAI(api_subscription_key=key)


def _response_text(response: Any) -> str:
    def content_text(content: Any) -> str:
        if isinstance(content, str):
            return content
        if isinstance(content, list):
            parts: list[str] = []
            for part in content:
                if isinstance(part, dict):
                    parts.append(str(part.get("text") or part.get("content") or ""))
                else:
                    parts.append(str(getattr(part, "text", "") or getattr(part, "content", "") or ""))
            return "".join(parts)
        return str(content or "")

    if isinstance(response, dict):
        choices = response.get("choices", []) or []
        content = choices[0].get("message", {}).get("content", "") if choices else ""
        return content_text(content)
    choices = getattr(response, "choices", None) or []
    if not choices:
        return ""
    return content_text(getattr(choices[0].message, "content", ""))


def _response_request_id(response: Any) -> str | None:
    if isinstance(response, dict):
        return response.get("request_id") or response.get("id")
    return getattr(response, "request_id", None) or getattr(response, "id", None)


def _parse_script(content: str) -> dict[str, Any]:
    candidate = content.strip()
    if not candidate:
        raise RuntimeError("Sarvam returned empty script content")
    fenced = re.search(r"```(?:json)?\s*(.*?)\s*```", candidate, flags=re.DOTALL | re.IGNORECASE)
    if fenced:
        candidate = fenced.group(1).strip()
    try:
        value = json.loads(candidate)
    except json.JSONDecodeError:
        return {"segments": [{"narration_text": content.strip()}]}
    if isinstance(value, list):
        return {"segments": value}
    if isinstance(value, dict):
        return value
    return {"segments": [{"narration_text": str(value)}]}


def _memory_asset_ids(memory: dict[str, Any]) -> list[str]:
    found: list[str] = []
    for moment in memory.get("moments", []):
        if not isinstance(moment, dict):
            continue
        assets = moment.get("assets", moment.get("asset_ids", []))
        for asset in assets if isinstance(assets, list) else []:
            asset_id = asset.get("asset_id") if isinstance(asset, dict) else asset
            if isinstance(asset_id, str) and asset_id not in found:
                found.append(asset_id)
    return found


def _normalise_script(
    content: str,
    memory: dict[str, Any],
    variant: str,
    language_code: str,
    speaker: str,
) -> dict[str, Any]:
    script = _parse_script(content)
    script["script_id"] = script.get("script_id") or f"{memory.get('experience_id', 'memory')}_{variant}_v1"
    script["experience_id"] = memory.get("experience_id", "exp_memory")
    script["variant"] = variant
    script["language_code"] = language_code
    script["speaker"] = speaker

    segments = script.get("segments")
    if not isinstance(segments, list) or not segments:
        segments = [{"narration_text": content.strip()}]
    fallback_assets = _memory_asset_ids(memory)
    output: list[dict[str, Any]] = []
    for index, raw_segment in enumerate(segments, start=1):
        segment = raw_segment if isinstance(raw_segment, dict) else {"narration_text": str(raw_segment)}
        narration = _remove_em_dashes(str(segment.get("narration_text") or ""))
        segment["segment_id"] = segment.get("segment_id") or f"seg_{index:02d}"
        segment["narration_text"] = narration
        segment["asset_ids"] = segment.get("asset_ids") if isinstance(segment.get("asset_ids"), list) else fallback_assets
        segment["caption_text"] = _remove_em_dashes(str(segment.get("caption_text") or narration[:80]))
        segment["mood"] = str(segment.get("mood") or "neutral")
        output.append(segment)
    if not any(segment["narration_text"].strip() for segment in output):
        raise RuntimeError(f"Sarvam returned a {variant} script with no narration text")
    script["segments"] = output
    return script


def _remove_em_dashes(text: str) -> str:
    """Keep TTS narration conversational without letting punctuation be read awkwardly."""
    text = text.replace("—", ", ").replace("–", "-")
    return re.sub(r"\s{2,}", " ", text).strip()


def _messages(variant: str, memory: dict[str, Any], narrative: str) -> list[dict[str, str]]:
    if variant == "relive":
        direction = (
            "Make this personal and intimate, speaking directly to the listener in second person. "
            "Use phrasing like 'you arrived', 'you explored', and 'you kept building'. Do not narrate as we/our/us."
        )
    elif variant == "share":
        direction = (
            "Make this a concise social recap in first-person plural. Use phrasing like 'we arrived', "
            "'we explored', and 'we kept building'. Do not address the audience as you. Begin with a hook."
        )
    elif variant == "viral":
        direction = (
            "Make this an aggressively catchy social-media recap in first-person plural. Open with a wild hook, "
            "escalate the chaos, land a memorable punchline, and make every line clip-worthy. Use we/our/us. "
            "Be playful and absurd, but never cruel or insulting toward real people."
        )
    elif variant == "reaction":
        direction = (
            "Make this a quick-witted, deadpan reaction-video host reacting to the experience. Be original, not an "
            "imitation of any real creator. Use playful observations, escalating jokes, and punchlines based only on "
            "the supplied facts. The host can say things like 'so apparently' and 'this is where it gets worse'."
        )
    else:
        raise ValueError(f"Unknown script variant: {variant}")
    return [
        {"role": "system", "content": (
            "You write grounded video narration for a personal memory. "
            f"{direction} Use only facts in the supplied memory. Return JSON with a segments array; "
            "each segment should contain narration_text, asset_ids, caption_text, and mood. "
            "Write for speech, not an article: use short natural phrases, contractions, conversational rhythm, and "
            "punctuation for pauses. Use emotion-bearing wording and choose one mood from excited, warm, nostalgic, "
            "funny, somber, or neutral for every segment so TTS can perform it well. Do not use em dashes, stage "
            "directions, brackets, or markup in narration_text. Keep segments chronological and return JSON only."
        )},
        {"role": "user", "content": (
            f"Variant: {variant}\n\nMemory JSON:\n{json.dumps(memory, ensure_ascii=False, indent=2)}"
            f"\n\nMemory narrative:\n{narrative}"
        )},
    ]


def generate_script(
    memory: dict[str, Any],
    narrative: str,
    variant: str,
    model: str,
    language_code: str,
    speaker: str,
    max_tokens: int,
) -> dict[str, Any]:
    client = _client()
    messages = _messages(variant, memory, narrative)
    for attempt in (1, 2):
        if attempt == 2:
            # A compact retry avoids losing the entire script when a long
            # narrative causes an empty response. Memory JSON still carries
            # the structured facts and asset references.
            messages = _messages(variant, memory, "")
            messages[0]["content"] += " Return 3-6 short segments and do not omit narration_text."
        response = client.chat.completions(
            messages=messages,
            model=model,
            temperature=0.45 if variant == "relive" else 0.75 if variant in {"viral", "reaction"} else 0.6,
            max_tokens=max_tokens,
        )
        content = _response_text(response)
        LOGGER.info(
            "script response: variant=%s attempt=%d request_id=%s content_chars=%d",
            variant, attempt, _response_request_id(response), len(content),
        )
        if content.strip():
            return _normalise_script(content, memory, variant, language_code, speaker)
        LOGGER.warning("empty Sarvam response: variant=%s attempt=%d", variant, attempt)
    raise RuntimeError(f"Sarvam returned no usable {variant} script after 2 attempts")


def _atomic_write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as handle:
        handle.write(content)
        temporary = Path(handle.name)
    temporary.replace(path)


def generate_all(
    memory_json_path: str | Path,
    memory_md_path: str | Path,
    output_dir: str | Path,
    model: str,
    language_code: str,
    speaker: str,
    max_tokens: int,
 ) -> list[Path]:
    memory = json.loads(Path(memory_json_path).read_text(encoding="utf-8"))
    narrative = Path(memory_md_path).read_text(encoding="utf-8")
    directory = Path(output_dir)
    paths: list[Path] = []
    for variant in SCRIPT_VARIANTS:
        script = generate_script(memory, narrative, variant, model, language_code, speaker, max_tokens)
        path = directory / f"{variant}_v1.json"
        _atomic_write(path, json.dumps(script, ensure_ascii=False, indent=2) + "\n")
        paths.append(path)
    return paths


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Relive, Share, Viral, and Reaction scripts with Sarvam LLM")
    parser.add_argument("--memory-json", default="memory.json")
    parser.add_argument("--memory-md", default="memory.md")
    parser.add_argument("--output-dir", default="scripts")
    parser.add_argument("--model", default="sarvam-105b")
    parser.add_argument("--language-code", default="en-IN")
    parser.add_argument("--speaker", default="shubh")
    parser.add_argument("--max-tokens", type=int, default=3500)
    parser.add_argument("--variants", nargs="+", choices=SCRIPT_VARIANTS, default=list(SCRIPT_VARIANTS))
    parser.add_argument("--log-level", default="INFO", choices=["DEBUG", "INFO", "WARNING", "ERROR"])
    args = parser.parse_args()
    logging.basicConfig(level=getattr(logging, args.log_level), format="%(asctime)s %(levelname)s %(name)s %(message)s")
    memory = json.loads(Path(args.memory_json).read_text(encoding="utf-8"))
    narrative = Path(args.memory_md).read_text(encoding="utf-8")
    paths: list[Path] = []
    for variant in args.variants:
        script = generate_script(memory, narrative, variant, args.model, args.language_code, args.speaker, args.max_tokens)
        path = Path(args.output_dir) / f"{variant}_v1.json"
        _atomic_write(path, json.dumps(script, ensure_ascii=False, indent=2) + "\n")
        paths.append(path)
    for path in paths:
        print(path)


if __name__ == "__main__":
    main()
