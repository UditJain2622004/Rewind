"""Generate Relive and Share scripts from the memory artifacts with Sarvam LLM."""

from __future__ import annotations

import argparse
import json
import os
import re
import tempfile
from pathlib import Path
from typing import Any


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
    if isinstance(response, dict):
        return str(response.get("choices", [{}])[0].get("message", {}).get("content", ""))
    choices = getattr(response, "choices", None) or []
    if not choices:
        return ""
    return str(getattr(choices[0].message, "content", "") or "")


def _parse_script(content: str) -> dict[str, Any]:
    candidate = content.strip()
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
        narration = str(segment.get("narration_text") or "")
        segment["segment_id"] = segment.get("segment_id") or f"seg_{index:02d}"
        segment["narration_text"] = narration
        segment["asset_ids"] = segment.get("asset_ids") if isinstance(segment.get("asset_ids"), list) else fallback_assets
        segment["caption_text"] = str(segment.get("caption_text") or narration[:80])
        segment["mood"] = str(segment.get("mood") or "neutral")
        output.append(segment)
    script["segments"] = output
    return script


def _messages(variant: str, memory: dict[str, Any], narrative: str) -> list[dict[str, str]]:
    if variant == "relive":
        direction = (
            "Make this personal and intimate, speaking directly to the listener in second person. "
            "Use phrasing like 'you arrived', 'you explored', and 'you kept building'. Do not narrate as we/our/us."
        )
    else:
        direction = (
            "Make this a concise social recap in first-person plural. Use phrasing like 'we arrived', "
            "'we explored', and 'we kept building'. Do not address the audience as you. Begin with a hook."
        )
    return [
        {"role": "system", "content": (
            "You write grounded video narration for a personal memory. "
            f"{direction} Use only facts in the supplied memory. Return JSON with a segments array; "
            "each segment should contain narration_text, asset_ids, caption_text, and mood. "
            "Keep segments chronological and return JSON only."
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
    response = _client().chat.completions(
        messages=_messages(variant, memory, narrative),
        model=model,
        temperature=0.45 if variant == "relive" else 0.6,
        max_tokens=max_tokens,
    )
    return _normalise_script(_response_text(response), memory, variant, language_code, speaker)


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
) -> tuple[Path, Path]:
    memory = json.loads(Path(memory_json_path).read_text(encoding="utf-8"))
    narrative = Path(memory_md_path).read_text(encoding="utf-8")
    directory = Path(output_dir)
    paths: list[Path] = []
    for variant in ("relive", "share"):
        script = generate_script(memory, narrative, variant, model, language_code, speaker, max_tokens)
        path = directory / f"{variant}_v1.json"
        _atomic_write(path, json.dumps(script, ensure_ascii=False, indent=2) + "\n")
        paths.append(path)
    return paths[0], paths[1]


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate Relive and Share scripts with Sarvam LLM")
    parser.add_argument("--memory-json", default="memory.json")
    parser.add_argument("--memory-md", default="memory.md")
    parser.add_argument("--output-dir", default="scripts")
    parser.add_argument("--model", default="sarvam-105b")
    parser.add_argument("--language-code", default="en-IN")
    parser.add_argument("--speaker", default="shubh")
    parser.add_argument("--max-tokens", type=int, default=3500)
    args = parser.parse_args()
    for path in generate_all(
        args.memory_json, args.memory_md, args.output_dir, args.model,
        args.language_code, args.speaker, args.max_tokens,
    ):
        print(path)


if __name__ == "__main__":
    main()
