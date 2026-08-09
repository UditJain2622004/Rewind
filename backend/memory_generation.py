"""Generate Contract 2 memory artifacts from an asset-insights Markdown file.

The evidence parser and validators are deterministic. Narrative grouping and
both user-facing artifacts are produced by Sarvam's chat LLM so the memory
can adapt to different experiences without hard-coded moment rules.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import tempfile
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import Any, Callable


LLMCaller = Callable[[list[dict[str, str]], dict[str, Any] | None], str]
ASSET_HEADING = re.compile(r"^##\s+(?P<asset_id>\S+)\s+·\s+(?P<type>\S+)\s*$")


@dataclass(frozen=True)
class AssetEvidence:
    asset_id: str
    asset_type: str
    uploaded_at: str | None
    event_at: str | None
    user_caption: str | None
    user_tags: list[str]
    evidence: str

    def as_prompt_record(self) -> dict[str, Any]:
        return asdict(self)


def _parse_timestamp(value: str | None, field: str, asset_id: str) -> str | None:
    if not value or value == "(unknown)":
        return None
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError(f"{asset_id}: invalid {field} timestamp: {value}") from exc
    return value


def parse_asset_insights(path: str | Path) -> list[AssetEvidence]:
    """Parse the stable metadata envelope while preserving free-form evidence."""
    text = Path(path).read_text(encoding="utf-8")
    lines = text.splitlines()
    starts = [index for index, line in enumerate(lines) if ASSET_HEADING.match(line)]
    if not starts:
        raise ValueError(f"No asset sections found in {path}")

    records: list[AssetEvidence] = []
    seen: set[str] = set()
    for position, start in enumerate(starts):
        end = starts[position + 1] if position + 1 < len(starts) else len(lines)
        match = ASSET_HEADING.match(lines[start])
        assert match is not None
        asset_id = match.group("asset_id")
        if asset_id in seen:
            raise ValueError(f"Duplicate asset ID: {asset_id}")
        seen.add(asset_id)
        block = lines[start + 1:end]

        def field(prefix: str) -> str | None:
            for line in block:
                if line.startswith(prefix):
                    value = line[len(prefix):].strip()
                    value = value.removesuffix("  ")
                    return None if value in {"", "(none)", "(unknown)"} else value
            return None

        uploaded = field("Uploaded:")
        captured = field("Captured/recorded:")
        caption = field("User caption:")
        tags_text = field("User tags:") or ""
        tags = [] if not tags_text else [tag.strip() for tag in tags_text.split(",") if tag.strip()]

        metadata_prefixes = ("Uploaded:", "Captured/recorded:", "User caption:", "User tags:")
        evidence_lines: list[str] = []
        in_evidence = False
        for line in block:
            if line.startswith("User tags:"):
                in_evidence = True
                continue
            if in_evidence:
                evidence_lines.append(line)
        evidence = "\n".join(evidence_lines).strip()
        evidence = re.sub(r"^\s*(?:Image description \(mock\)|Saaras transcript(?:\s+—\s+mock)?|Saaras transcript|Sarvam Vision output):?\s*", "", evidence, flags=re.IGNORECASE)
        evidence = evidence.strip()
        if not evidence:
            raise ValueError(f"{asset_id}: no evidence body found")

        records.append(AssetEvidence(
            asset_id=asset_id,
            asset_type=match.group("type"),
            uploaded_at=_parse_timestamp(uploaded, "uploaded_at", asset_id),
            event_at=_parse_timestamp(captured, "captured/recorded", asset_id),
            user_caption=caption,
            user_tags=tags,
            evidence=evidence,
        ))

    return sorted(records, key=lambda record: (record.event_at or record.uploaded_at or "", record.asset_id))


def _json_content(response: Any) -> str:
    if isinstance(response, str):
        return response
    if isinstance(response, dict):
        return str(response.get("choices", [{}])[0].get("message", {}).get("content", ""))
    choices = getattr(response, "choices", None) or []
    if not choices:
        raise RuntimeError("Sarvam LLM returned no choices")
    message = getattr(choices[0], "message", None)
    content = getattr(message, "content", None) if message is not None else None
    if not content:
        raise RuntimeError("Sarvam LLM returned an empty message")
    return content


def _parse_json_response(raw: str, label: str, allow_array: bool = False) -> dict[str, Any]:
    candidate = raw.strip()
    fenced = re.search(r"```(?:json)?\s*(.*?)\s*```", candidate, flags=re.DOTALL | re.IGNORECASE)
    if fenced:
        candidate = fenced.group(1).strip()
    try:
        value = json.loads(candidate)
    except json.JSONDecodeError as exc:
        raise ValueError(f"{label} returned invalid JSON: {exc}") from exc
    if isinstance(value, list) and allow_array:
        # Without response_format support, Sarvam may return a useful list
        # without an object wrapper. Keep it as the moments payload.
        value = {"moments": value}
    if not isinstance(value, dict):
        # Preserve non-object JSON as content instead of rejecting it. The
        # pipeline intentionally does not impose a rigid response schema.
        value = {"content": value}
    return value


def _evidence_prompt(records: list[AssetEvidence]) -> str:
    return json.dumps([record.as_prompt_record() for record in records], ensure_ascii=False, indent=2)


def _make_sarvam_caller(model: str, temperature: float, max_tokens: int) -> LLMCaller:
    key = os.environ.get("SARVAM_API_KEY")
    if not key:
        raise RuntimeError("SARVAM_API_KEY is not set")
    try:
        from sarvamai import SarvamAI
    except ImportError as exc:
        raise RuntimeError("Install backend/requirements.txt before calling Sarvam") from exc
    client = SarvamAI(api_subscription_key=key)

    def call(messages: list[dict[str, str]], _response_schema: dict[str, Any] | None = None) -> str:
        kwargs: dict[str, Any] = {
            "messages": messages,
            "model": model,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        # The installed SDK may not support response_format. We intentionally
        # rely on a JSON-only prompt and flexible local normalization instead.
        return _json_content(client.chat.completions(**kwargs))

    return call


def group_moments(records: list[AssetEvidence], call_llm: LLMCaller) -> dict[str, Any]:
    messages = [
        {"role": "system", "content": "You are the Memory Understanding stage. Group evidence into meaningful chronological moments. Use only facts present in the evidence. Do not invent people, locations, outcomes, or times. Return a useful JSON representation of the moments; it does not need to follow a rigid schema."},
        {"role": "user", "content": f"Evidence records:\n{_evidence_prompt(records)}\n\nGroup related assets into moments and include asset IDs where useful. Use stable IDs such as mom_01, mom_02, etc. Return JSON only."},
    ]
    result = _parse_json_response(call_llm(messages, None), "moment grouping", allow_array=True)
    result.setdefault("moments", [])
    return result


def synthesize_memory_json(records: list[AssetEvidence], grouping: dict[str, Any], call_llm: LLMCaller) -> dict[str, Any]:
    messages = [
        {"role": "system", "content": "Create a grounded memory JSON from the supplied evidence and moment grouping. Preserve useful details and do not invent facts. Use the Contract 2 fields when they are useful, but do not force a rigid schema. Return JSON only."},
        {"role": "user", "content": f"Evidence:\n{_evidence_prompt(records)}\n\nApproved moment grouping:\n{json.dumps(grouping, ensure_ascii=False, indent=2)}\n\nUse experience_id exp_iimb_hackathon if the evidence clearly describes the IIM Bangalore hackathon; otherwise derive a stable exp_ slug. Contributors must be contributor names/IDs supported by evidence."},
    ]
    result = _parse_json_response(call_llm(messages, None), "memory.json synthesis", allow_array=True)
    result.setdefault("experience_id", "exp_memory")
    result.setdefault("title", "Memory")
    result.setdefault("contributors", [])
    result.setdefault("moments", grouping.get("moments", []))
    result.setdefault("people", [])
    result.setdefault("open_questions", [])
    return result


def synthesize_memory_md(records: list[AssetEvidence], memory: dict[str, Any], call_llm: LLMCaller) -> str:
    messages = [
        {"role": "system", "content": "Write memory.md for a personal memory experience. Use only the supplied evidence and approved memory.json. Required sections: Overview, Timeline Narrative, Key Moments, People, Uncertain / Missing. Keep the tone warm and natural, but never invent. Include [[ast_XXXX]] for asset-specific claims and [[mom_XX]] for moment headings or claims. Return Markdown only."},
        {"role": "user", "content": f"Evidence:\n{_evidence_prompt(records)}\n\nApproved memory.json:\n{json.dumps(memory, ensure_ascii=False, indent=2)}"},
    ]
    markdown = call_llm(messages, None).strip()
    return markdown + "\n"


def _atomic_write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as handle:
        handle.write(content)
        temporary = Path(handle.name)
    temporary.replace(path)


def generate_memory(input_path: str | Path, memory_json_path: str | Path, memory_md_path: str | Path, call_llm: LLMCaller) -> tuple[Path, Path]:
    records = parse_asset_insights(input_path)
    grouping = group_moments(records, call_llm)
    memory = synthesize_memory_json(records, grouping, call_llm)
    markdown = synthesize_memory_md(records, memory, call_llm)
    json_path = Path(memory_json_path)
    md_path = Path(memory_md_path)
    _atomic_write(json_path, json.dumps(memory, ensure_ascii=False, indent=2) + "\n")
    _atomic_write(md_path, markdown)
    return json_path, md_path


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate memory.json and memory.md with Sarvam LLM")
    parser.add_argument("--input", default="mock_asset_insights.md")
    parser.add_argument("--memory-json", default="memory.json")
    parser.add_argument("--memory-md", default="memory.md")
    parser.add_argument("--model", default="sarvam-105b")
    parser.add_argument("--temperature", type=float, default=0.2)
    parser.add_argument("--max-tokens", type=int, default=3500)
    args = parser.parse_args()
    caller = _make_sarvam_caller(args.model, args.temperature, args.max_tokens)
    paths = generate_memory(args.input, args.memory_json, args.memory_md, caller)
    for path in paths:
        print(path)


if __name__ == "__main__":
    main()
