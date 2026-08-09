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
SCRIPT_VARIANTS = ("relive", "share", "viral", "reaction", "trailer", "roast")


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
    fenced = re.search(
        r"^\s*=?\s*```(?:json)?\s*(.*?)\s*```\s*$",
        candidate,
        flags=re.DOTALL | re.IGNORECASE,
    ) or re.search(r"```(?:json)?\s*(.*?)\s*```", candidate, flags=re.DOTALL | re.IGNORECASE)
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
    playbooks = {
        "relive": """RELIVE PLAYBOOK:
- Address one listener directly in second person. Say "you arrived", "you saw", and "you kept going".
- Do not use we, our, or us as the narrator. Friends can be named when the memory supports it.
- Open on one precise feeling or visual, then let the memory unfold gently.
- Sound like a close friend retelling a night that mattered, not a brand campaign.
- Let tiredness, excitement, nerves, relief, or warmth appear through specific actions.
- Give every key moment room to land. Do not race through the story just to cover facts.
- Use a quiet emotional turn near the end: effort mattered, even if the outcome was imperfect.
- Keep jokes affectionate and small. The listener should feel seen, never mocked.
- Example rhythm only, do not copy: "You were barely awake. Still, you showed up."
- End with a soft line that makes the listener want to revisit the photos.""",
        "share": """SHARE PLAYBOOK:
- Speak as the group in first-person plural only: we, our, and us.
- Start with a scroll-stopping first line that names the most surprising real contrast or setback.
- Make the recap feel like friends telling the story in one energetic breath.
- Build a clear mini-arc: why we came, what went wrong or got funny, what we remember most.
- Keep the language simple enough for captions and fast enough for a short video.
- Use one specific sensory or visual beat per major moment instead of generic excitement.
- Let the final line feel proud, funny, or warmly reflective, based on the actual evidence.
- Avoid explaining every detail. Leave a little curiosity so people want to watch the visuals.
- Example rhythm only, do not copy: "We had a plan. The plan had other plans."
- Never address the audience as you, and never turn the recap into an advertisement.""",
        "viral": """VIRAL PLAYBOOK:
- Use first-person plural. This is a bold, chaotic, highly shareable group recap.
- Start with the wildest supported hook in the first seven spoken words.
- Make the story escalate every few beats: optimism, complication, worse complication, absurd payoff.
- Turn real details into clean comedic contrasts. Grand ambition versus low battery energy is a valid pattern.
- Use punchy reversals such as "we thought X. Then Y happened", only when grounded in the memory.
- Write captions that can stand alone as short meme text.
- Keep jokes specific. Do not say "crazy" or "epic" without showing the real detail that earns it.
- Use a confident final callback to the opening hook or the funniest real moment.
- Example rhythm only, do not copy: "We came for glory. We left with a story and no sleep."
- Be absurd and energetic, but never cruel, hateful, humiliating, or insulting toward real people.""",
        "reaction": """REACTION PLAYBOOK:
- Write as an original, quick-witted reaction-video host. Do not imitate any real creator.
- The host is amused by the situation, not mean to the people in it.
- Open with an instant observation about the most ridiculous supported fact.
- Use short reaction setups followed by a sharp payoff. Let pauses do part of the joke.
- Escalate the commentary as the memory gets more sleep-deprived, ambitious, or chaotic.
- Use recurring phrases sparingly, such as "so apparently" or "this is where it gets worse".
- Describe what the host notices in the assets, then connect it to the voice-note context.
- Keep the host's persona clever and conversational, not loud for the sake of it.
- Example rhythm only, do not copy: "They said it was a quick trip. That was the first lie."
- End on a callback that feels like a final reaction, not a formal conclusion.""",
        "trailer": """TRAILER PLAYBOOK:
- Treat this real memory like the teaser for an unnecessarily dramatic blockbuster.
- Use cinematic stakes for ordinary facts, but do not invent any event or outcome.
- Open with a trailer-worthy premise and a deliberate pause.
- Build through three acts: arrival, rising pressure, and the final payoff or goodbye.
- Make small real setbacks sound enormous in a funny way, then undercut them with a grounded detail.
- Alternate big declarations with quiet, vivid moments so the performance has contrast.
- Use a title-card-worthy caption after the biggest beat, but keep it short.
- Include one line that feels like a trailer tag: a promise, a question, or a warning.
- Example rhythm only, do not copy: "One trip. No sleep. A very questionable plan."
- End with a dramatic sting that is emotional or funny, based on what really happened.""",
        "roast": """ROAST PLAYBOOK:
- Write a playful insider self-roast. The group and the situation are in on the joke.
- Punch up at overconfidence, exhaustion, terrible timing, minor bad luck, and chaotic planning.
- Never attack protected traits, appearance, private vulnerabilities, or people who are not part of the memory.
- Start by exposing the gap between the group's plan and what the evidence says actually happened.
- Make each joke fact-based, then move on. Do not repeat the same joke in different words.
- Pair every roast with affection or admiration so the memory still feels warm.
- Let the funniest low point become a badge of honour by the ending.
- Use spoken reactions and clean punchlines, not long written comedy paragraphs.
- Example rhythm only, do not copy: "We brought ambition. Sleep was apparently optional."
- End by making the imperfect outcome feel like the reason the memory is worth sharing.""",
    }
    if variant not in playbooks:
        raise ValueError(f"Unknown script variant: {variant}")
    direction = playbooks[variant]
    return [
        {"role": "system", "content": (
            "You write high-retention, spoken video narration for a personal memory. Your output is sent directly to "
            "text-to-speech and edited against photos, so write for ears, timing, and reaction, not for silent reading. "
            f"Variant direction: {direction}\n\n"
            "Grounding rules:\n"
            "- Use only facts supplied in the memory. You may heighten the comedy or emotion, but never fabricate a "
            "person, event, outcome, location, quote, or relationship.\n"
            "- Keep the story chronological unless the requested hook deliberately starts at the funniest or most "
            "dramatic real moment, then quickly returns to the beginning.\n"
            "- Attach each segment to the asset IDs that visibly support it. Voice-note IDs can support narration but "
            "do not pretend a voice note is a photograph.\n\n"
            "Spoken-word rules:\n"
            "- Treat each segment as one spoken line or beat. Write 1 to 2 short sentences per segment. Prefer 7 to "
            "22 spoken words per sentence.\n"
            "- Use contractions, fragments, repetition, direct verbs, and natural pauses. A line should sound good "
            "when read aloud once, not look impressive in an essay.\n"
            "- Use commas, full stops, ellipses, and occasional exclamation marks to signal pace and emotion. Do not "
            "use stage directions, bracketed notes, markdown, or em dashes.\n"
            "- Let emotion appear in the words. For example: 'You were exhausted. Still, you showed up.' is stronger "
            "for TTS than a detached factual sentence.\n\n"
            "Retention and comedy rules:\n"
            "- Give the first segment a hook within the first sentence. Use contrast, a surprising detail, a question, "
            "or an unfinished setup.\n"
            "- Alternate setup and payoff. Do not stack vague hype. Every joke needs a fact-based target and a clean "
            "payoff.\n"
            "- Escalate: arrival, ambition, complications, funniest low point, then the emotional or comic close.\n"
            "- Be vivid and specific. Instead of 'it was fun', use the supported moment that made it funny or moving.\n\n"
            "TTS and JSON requirements:\n"
            "- Return JSON only, as an object with a segments array.\n"
            "- Each segment needs narration_text, asset_ids, caption_text, and mood.\n"
            "- mood must be one of: excited, warm, nostalgic, funny, somber, neutral. Match it to the spoken line.\n"
            "- caption_text must be short, readable on screen, and not merely repeat the narration.\n"
            "- Do not use an em dash anywhere. If a pause is needed, use a comma, a full stop, or an ellipsis instead."
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
            messages[0]["content"] += " Return a complete script and do not omit narration_text."
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
            script = _normalise_script(content, memory, variant, language_code, speaker)
            return script
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
