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
SCRIPT_VARIANTS = (
    "roast", "roast_commentary", "village_elder",
    "couple_bickering", "this_or_that", "expectation_vs_reality",
    "grwm_storytime", "hot_take_debate", "rate_out_of_ten",
)
SPEAKER_MAP = {
    "roast": "shubh",
    "roast_commentary": "amit",
    "village_elder": "varun",
    "couple_bickering": "neha,rahul",  # multi-speaker
    "this_or_that": "tarun",
    "expectation_vs_reality": "shreya",
    "grwm_storytime": "suhani",
    "hot_take_debate": "kabir",
    "rate_out_of_ten": "ritu"
}


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
    except json.JSONDecodeError as exc:
        if candidate.strip().startswith("{") or candidate.strip().startswith("["):
            raise ValueError(f"Failed to parse JSON script: {exc}. Truncated output?")
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
    allowed_speakers = [s.strip() for s in SPEAKER_MAP.get(variant, speaker).split(",") if s.strip()]
    speaker_mapping: dict[str, str] = {}

    output: list[dict[str, Any]] = []
    for index, raw_segment in enumerate(segments, start=1):
        segment = raw_segment if isinstance(raw_segment, dict) else {"narration_text": str(raw_segment)}
        narration = _remove_em_dashes(str(segment.get("narration_text") or ""))
        segment["segment_id"] = segment.get("segment_id") or f"seg_{index:02d}"
        segment["narration_text"] = narration
        segment["asset_ids"] = segment.get("asset_ids") if isinstance(segment.get("asset_ids"), list) else fallback_assets
        segment["caption_text"] = _remove_em_dashes(str(segment.get("caption_text") or narration[:80]))
        segment["mood"] = str(segment.get("mood") or "neutral")

        seg_speaker = segment.get("speaker")
        if seg_speaker:
            seg_speaker_str = str(seg_speaker).strip().lower()
            if seg_speaker_str in allowed_speakers:
                segment["speaker"] = seg_speaker_str
            else:
                if seg_speaker_str not in speaker_mapping:
                    assigned_idx = len(speaker_mapping) % len(allowed_speakers)
                    speaker_mapping[seg_speaker_str] = allowed_speakers[assigned_idx]
                segment["speaker"] = speaker_mapping[seg_speaker_str]
        else:
            assigned_idx = (index - 1) % len(allowed_speakers)
            segment["speaker"] = allowed_speakers[assigned_idx]

        output.append(segment)
    if not any(segment["narration_text"].strip() for segment in output):
        raise RuntimeError(f"Sarvam returned a {variant} script with no narration text")
    script["segments"] = output
    return script


def _remove_em_dashes(text: str) -> str:
    """Keep TTS narration conversational without letting punctuation be read awkwardly."""
    text = re.sub(r"\[(?:laughs?|laughter)\]|\((?:laughs?|laughter)\)", " haha ", text, flags=re.IGNORECASE)
    text = re.sub(r"\[(?:sighs?|sigh)\]|\((?:sighs?|sigh)\)", " uff... ", text, flags=re.IGNORECASE)
    text = re.sub(r"\[(?:gasps?|gasp)\]|\((?:gasps?|gasp)\)", " oh! ", text, flags=re.IGNORECASE)
    text = text.replace("—", ", ").replace("–", "-")
    return re.sub(r"\s{2,}", " ", text).strip()


def _messages(variant: str, memory: dict[str, Any], narrative: str, speaker: str) -> list[dict[str, str]]:
    playbooks = {
        "couple_bickering": """COUPLE BICKERING PLAYBOOK:
- Narrate as two voices mid-bicker who clearly have this fight often and both find it a little funny even while committing to it.
- Structure as rapid interruption — voice two should regularly cut voice one off mid-sentence. Use dashes to mark the cut: "I was just trying to—" / "—no."
- Every jab must escalate the pettiness, not just restate the last one. Use a one-upping structure: each line raises the stakes of how "serious" this minor thing is.
- Include at least one moment of exaggerated mock-offense over something objectively tiny — treat it with the emotional weight of a real betrayal, then let the absurdity of that weight be the joke.
- Include one "receipt" — a suspiciously specific detail (exact time, exact word someone used) that the other voice clearly wasn't expecting to get called out on.
- Do NOT resolve into a clean, wholesome truce. End on a chaotic non-resolution — one voice getting the last word while the other is visibly still not over it, or both suddenly agreeing on something absurd instead of what they were fighting about.
- Never touch appearance, insecurities, or anything not clearly part of the shared memory.
- Example rhythm only, do not copy: "'I said five minutes.' 'You said five minutes forty minutes ago.' 'Time is a construct.' 'It's really not, though.'"
- End abruptly on the sharpest, pettiest line of the whole exchange — no soft landing, no "but we love each other" bow on top.""",

"village_elder": """VILLAGE ELDER PLAYBOOK:
- Narrate as an intense, ancient village elder telling a hilarious cautionary tale to the younger generation.
- This is an original character voice, not an imitation of any real person or comedian.
- Use a grave, commanding tone for ordinary facts. The comedy comes from the mismatch between seriousness and reality.
- Speak like the elder has witnessed many journeys and cannot believe this particular group survived its own planning.
- Use dramatic wisdom and sarcastic observations: "In my time, we called this a bad idea" or "the elders had warned them".
- Treat the overnight travel, ambitious hackathon, ridiculous exhaustion, and final outcome like epic folklore.
- Build intensity with repetition, pauses, declarations, and short punchy sentences that TTS can perform dramatically.
- Let the elder praise courage while clearly mocking the foolish choices that produced it.
- Include a moral or proverb-like line near the end, but make the moral funny and specific to the real memory.
- Example rhythm only, do not copy: "And so they entered the night without sleep. The night entered them instead."
- End with a thunderous final verdict that sounds wise, sarcastic, and completely unforgettable.""",

"this_or_that": """THIS OR THAT PLAYBOOK:
- Narrate using rapid-fire "this or that" binary choices pulled from real moments in the memory.
- Each round: state the two options fast, pick a winner instantly, add ONE word of justification max. No explaining, no lingering.
- Make at least one round a fake binary where both options are obviously terrible, and the "winner" is picked with total confidence anyway.
- Increase speed as it goes — later rounds should feel more clipped and rapid than the opening ones.
- Ground every choice in something that actually happened; the joke is the confident tone applied to trivial stakes, not the invention of drama.
- Example rhythm only, do not copy: "Sleep or snacks? Snacks. Dignity or the group photo? Neither. Deleted."
- End with the ultimate "this or that" delivered as if it's the biggest decision of their lives — then reveal it was nothing.""",

"expectation_vs_reality": """EXPECTATION VS REALITY PLAYBOOK:
- Narrate using tight expectation/reality pairs pulled from the memory — one confident line, one deflating line, repeat.
- Keep the expectation line grand and specific (not "we'd do great" but the literal plan they had).
- Land the reality line on the harshest, funniest possible word, placed last in the sentence — cut anything after the punchline.
- Use a widening gap structure: early pairs are a small mismatch, later pairs are an enormous mismatch, biggest gap saved for the final pair.
- Let one pair subvert the pattern — reality accidentally beats expectation — for a surprise beat before the ending.
- Example rhythm only, do not copy: "Expectation: arrive early, rested, prepared. Reality: arrived. That's the sentence. That's all reality gave us."
- End by crowning reality the funnier, better story — one confident final line, no explanation needed.""",

"grwm_storytime": """GET READY WITH ME STORYTIME PLAYBOOK:
- Narrate like a friend mid-routine casually spiraling into telling this story, getting more worked up as they go.
- Start deliberately low-energy and mundane, then let the energy visibly rise as the "story" hooks the narrator themselves.
- Include one interrupting tangent that seems like a detour but pays off as a setup later — genre staple, don't skip it.
- Build to a "wait, it gets worse" pivot that's actually the funniest, most specific detail in the whole memory — don't undersell it.
- Keep asides short and punchy ("anyway—", "so obviously") rather than long rambling explanations; ramble in energy, not in word count.
- Example rhythm only, do not copy: "So we had a plan. A whole plan. Anyway, we do not talk about the plan anymore."
- End mid-thought, like the narrator got distracted by how funny it still is, cutting off on the biggest laugh line.""",

"hot_take_debate": """HOT TAKE / UNPOPULAR OPINION PLAYBOOK:
- Open with a bold, confident claim stated as fact, zero hedging, designed to sound mildly insane for one second before it clicks.
- Defend the take with escalating "evidence" that gets more absurd and more specific with each point — three points max, funniest last.
- Use combative, unbothered delivery throughout — the narrator should sound annoyed anyone would disagree with something this obviously true.
- Include one moment where the narrator preemptively shuts down an imagined objection ("and before you say—") for extra confidence comedy.
- Keep the "controversy" harmless and specific to the group's own choices — the take should be objectively small stakes delivered like it's a hill to die on.
- Example rhythm only, do not copy: "Unpopular opinion: the trip wasn't ruined by zero sleep, it was CARRIED by zero sleep. Don't argue with results."
- End by refusing to back down at all — the most stubborn, funniest version of the original claim, no softening.""",

"rate_out_of_ten": """RATE OUT OF TEN PLAYBOOK:
- Score real moments from the memory rapid-fire, number first, reason second, one breath each — no throat-clearing.
- Make the scores intentionally, hilariously inconsistent — rate the disaster higher than the actual good decision, and don't acknowledge the inconsistency, just move on.
- Include one score that's deliberately impossible (negative, over 10, a fraction) for a rule-breaking laugh.
- Keep justifications under six words wherever possible — the shorter and more confident, the funnier.
- Build toward the highest-stakes-sounding score being reserved for the smallest, dumbest detail in the memory.
- Example rhythm only, do not copy: "The plan: 3 out of 10. Sticking to it anyway: 11 out of 10. Math isn't real."
- End with one absurdly overqualified final score for the whole memory — deliver it like an awards announcement, then cut immediately.""",

"glow_up_recap": """GLOW UP / THEN VS NOW PLAYBOOK:
- Open with the ambitious "before" stated with completely straight-faced confidence — no wink, no foreshadowing.
- Contrast with the chaotic "during" using short, escalating beats — each one a bigger gap from the plan than the last.
- Land the "after" as an unexpectedly triumphant, specific detail — not a vague "we made it," but the exact dumb thing that counted as victory.
- Use rule-of-three in the "during" section: two real chaos beats, then a third that breaks the pattern entirely for a surprise laugh.
- Keep the triumphant tone even while describing the mess — the confidence never wavers, only the facts get worse.
- Example rhythm only, do not copy: "We started with a plan. We ended with a plan, four typos, and a group photo nobody's allowed to post."
- End on the single funniest specific detail as the "glow up" — deliver it like a mic drop, no wrap-up sentence after.""",

"red_flag_green_flag": """RED FLAG GREEN FLAG PLAYBOOK:
- Call out real behaviors from the memory in quick alternating red flag / green flag verdicts — no build-up, just the flag and one sharp reason.
- Keep each verdict under eight words. If it needs more, it's not sharp enough yet — cut it down.
- Include one flag that's deliberately misjudged (an obvious green flag called a red flag, or vice versa) for a rule-breaking laugh.
- Escalate the flags — early ones mild, later ones dramatically overblown for a moment before snapping back to something trivial.
- Base every judgment on something real; the joke is confident overreaction to small stakes, not invented behavior.
- Example rhythm only, do not copy: "Booked it at midnight — red flag. Showed up anyway with snacks — green flag. Snacks were stale — also somehow a green flag."
- End with a final flag count delivered like a courtroom verdict, funny and decisive, no soft landing after.""",
    }
    if variant not in playbooks:
        raise ValueError(f"Unknown script variant: {variant}")

    speaker_list = speaker.split(",")
    if len(speaker_list) > 1:
        speaker_instruction = f"- This format requires multiple speakers. You MUST include a 'speaker' field in each segment and alternate between EXACTLY these allowed speaker IDs: {', '.join(speaker_list)}. Do NOT use any other speaker names."
    else:
        speaker_instruction = f"- If you include a 'speaker' field in a segment, it MUST be EXACTLY this allowed speaker ID: {speaker_list[0]}."

    viral_core = """VIRAL STORY STRUCTURE:
- Assume the audience is one swipe away from leaving. Earn attention in the first sentence.
- Every few beats must contain a turn: a reveal, contrast, escalation, joke, emotional hit, or visual payoff.
- Prefer specific absurdity over empty hype. The actual detail is funnier than the word hilarious.
- Build a recognizable arc: hook, context, confidence, complication, chaos, payoff, callback.
- Give the narrator a point of view. They should sound amused, shocked, affectionate, dramatic, or personally invested.
- Write lines that can be clipped individually and still make sense out of context.
- Use conversational connectors: okay, apparently, wait, then, somehow, and that is when.
- Vary speed. Follow a rapid joke with a short quiet line so the next punchline hits harder.
- Make the last beat quotable. It should reframe the whole memory in one funny or emotional sentence.
- Do not sand down the personality into generic travel or event narration.
- Examples are patterns only, never copy them: "The plan was simple. The evidence disagrees." / "We wanted a trophy. We got lore."
"""
    direction = viral_core + "\n" + playbooks[variant]
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
            "- Sound like an actual funny person talking to friends. Use simple words, contractions, unfinished "
            "thoughts, and occasional self-corrections like 'wait, no' or 'I mean'.\n"
            "- Prefer natural phrases such as 'okay, so', 'look', 'honestly', 'bro', 'dude', 'somehow', 'no way', "
            "'I cannot believe this', and 'that is actually wild' when they fit the narrator. Do not force slang.\n"
            "- Do not sound like a press release, essay, documentary critic, or advertising copy. Do not use heavy "
            "words such as 'unadulterated', 'breathtaking', 'strategic adventuring', 'sheer confidence', "
            "'meticulously', 'picturesque', 'profound', or 'remarkable' unless they are part of a supplied quote.\n"
            "- Replace abstract labels with spoken reactions. Say 'they looked finished' instead of 'they displayed "
            "extreme fatigue'. Say 'the plan went out the window' instead of 'the strategy evolved'.\n"
            "- Do not make every line sound perfectly polished or force a joke into every sentence. Human speech has "
            "small reactions, obvious observations, awkward pauses, and lines that simply move the story forward.\n"
            "- Add a small number of natural vocal beats across the script: umm, uh, hmm, wait, okay, oh no, uff, "
            "ahh, or haha. Use them only when the narrator would genuinely hesitate, react, laugh, or sigh.\n"
            "- Write laughs and sighs as speakable text such as 'haha', 'heh', 'uff...', or 'haa...', never as "
            "[laughs], (laughs), [sigh], SSML, or stage directions.\n"
            "- Do not put a filler in every line. One well-placed 'wait...' before a reveal is better than constant "
            "robotic umm and ahh.\n"
            "- Use commas, full stops, ellipses, and occasional exclamation marks to signal pace and emotion. Do not "
            "use stage directions, bracketed notes, markdown, or em dashes.\n"
            "- Let emotion appear in the words. For example: 'You were exhausted. Still, you showed up.' is stronger "
            "for TTS than a detached factual sentence.\n\n"
            "Retention and comedy rules:\n"
            "- Give the first segment a hook within the first sentence. Use contrast, a surprising detail, a question, "
            "or an unfinished setup.\n"
            "- Alternate setup and payoff. Do not stack vague hype. Every joke needs a fact-based target and a clean "
            "payoff.\n"
            "- For roast and reaction variants, roast the situation like a friend in a group chat, not like a judge "
            "writing a review. Use plain words, quick opinions, and a little disbelief.\n"
            "- Escalate: arrival, ambition, complications, funniest low point, then the emotional or comic close.\n"
            "- Be vivid and specific. Instead of 'it was fun', use the supported moment that made it funny or moving.\n\n"
            "TTS and JSON requirements:\n"
            "- Return JSON only, as an object with a segments array.\n"
            "- Each segment needs narration_text, asset_ids, caption_text, and mood.\n"
            f"{speaker_instruction}\n"
            "- mood must be one of: excited, warm, nostalgic, funny, somber, neutral. Match it to the spoken line.\n"
            "- caption_text must be short, readable on screen, and not merely repeat the narration.\n"
            "- Do not use an em dash anywhere. If a pause is needed, use a comma, a full stop, or an ellipsis instead."
        )},
        {"role": "user", "content": (
            f"Variant: {variant}\n\nMemory JSON:\n{json.dumps(memory, ensure_ascii=False, indent=2)}"
            f"\n\nMemory narrative:\n{narrative}"
        )},
    ]


def select_script_variant(memory: dict[str, Any], narrative: str, model: str = "sarvam-105b") -> str:
    """Uses LLM to pick the most suitable script variant based on memory context."""
    client = _client()
    messages = [
        {"role": "system", "content": (
            "You are a script selector. Based on the provided memory facts, choose exactly ONE script format that "
            "would be the funniest and most engaging fit.\n\n"
            f"Options: {', '.join(SCRIPT_VARIANTS)}\n\n"
            "Respond ONLY with the name of the variant, nothing else."
        )},
        {"role": "user", "content": f"Memory:\n{narrative}"}
    ]
    try:
        response = client.chat.completions(
            messages=messages,
            model=model,
            temperature=0.7,
            max_tokens=20,
        )
        content = _response_text(response).strip().lower()
        # Clean up in case it replied with a sentence
        for v in SCRIPT_VARIANTS:
            if v in content:
                return v
    except Exception as e:
        LOGGER.warning(f"select_script_variant failed: {e}. Defaulting to roast.")
    
    return "roast"


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
    messages = _messages(variant, memory, narrative, speaker)
    for attempt in (1, 2):
        if attempt == 2:
            # A compact retry avoids losing the entire script when a long
            # narrative causes an empty response. Memory JSON still carries
            # the structured facts and asset references.
            messages = _messages(variant, memory, "", speaker)
            messages[0]["content"] += " Return a complete script and do not omit narration_text."
        response = client.chat.completions(
            messages=messages,
            model=model,
            temperature=0.8 if variant in {"roast_commentary", "village_elder"} else 0.6,
            max_tokens=max_tokens,
        )
        content = _response_text(response)
        LOGGER.info(
            "script response: variant=%s attempt=%d request_id=%s content_chars=%d",
            variant, attempt, _response_request_id(response), len(content),
        )
        if content.strip():
            try:
                script = _normalise_script(content, memory, variant, language_code, speaker)
                return script
            except ValueError as exc:
                LOGGER.warning("Parsing failed on attempt %d: %s", attempt, exc)
        LOGGER.warning("empty or invalid Sarvam response: variant=%s attempt=%d", variant, attempt)
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
    village_elder_speaker: str = "varun",
) -> list[Path]:
    memory = json.loads(Path(memory_json_path).read_text(encoding="utf-8"))
    narrative = Path(memory_md_path).read_text(encoding="utf-8")
    directory = Path(output_dir)
    paths: list[Path] = []
    for variant in SCRIPT_VARIANTS:
        # Use SPEAKER_MAP to get the default speaker(s), split in case it's a comma-separated list of multi-speakers
        mapped_speaker = SPEAKER_MAP.get(variant, speaker).split(",")[0]
        script = generate_script(memory, narrative, variant, model, language_code, mapped_speaker, max_tokens)
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
    parser.add_argument("--village-elder-speaker", default="varun")
    parser.add_argument("--max-tokens", type=int, default=3500)
    parser.add_argument("--variants", nargs="+", choices=SCRIPT_VARIANTS, default=list(SCRIPT_VARIANTS))
    parser.add_argument("--log-level", default="INFO", choices=["DEBUG", "INFO", "WARNING", "ERROR"])
    args = parser.parse_args()
    logging.basicConfig(level=getattr(logging, args.log_level), format="%(asctime)s %(levelname)s %(name)s %(message)s")
    memory = json.loads(Path(args.memory_json).read_text(encoding="utf-8"))
    narrative = Path(args.memory_md).read_text(encoding="utf-8")
    paths: list[Path] = []
    for variant in args.variants:
        mapped_speaker = SPEAKER_MAP.get(variant, args.speaker).split(",")[0]
        script = generate_script(memory, narrative, variant, args.model, args.language_code, mapped_speaker, args.max_tokens)
        path = Path(args.output_dir) / f"{variant}_v1.json"
        _atomic_write(path, json.dumps(script, ensure_ascii=False, indent=2) + "\n")
        paths.append(path)
    for path in paths:
        print(path)


if __name__ == "__main__":
    main()
