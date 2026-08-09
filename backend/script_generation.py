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
        if "speaker" in segment:
            segment["speaker"] = str(segment["speaker"])
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


def _messages(variant: str, memory: dict[str, Any], narrative: str) -> list[dict[str, str]]:
    playbooks = {
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
        "roast_commentary": """ROAST COMMENTARY PLAYBOOK:
- Write as an external comedian roasting the group, not as a member of the group.
- Use third person for the people and situation. Do not say I did this, we did this, or my friends did this.
- The narrator has permission to be blunt, dramatic, sarcastic, and very funny about the documented chaos.
- Roast decisions, timing, exhaustion, overconfidence, and the gap between ambition and reality.
- Do not roast protected traits, appearance, private pain, or anything not supported by the memory.
- Begin with a sharp thesis about what kind of people would voluntarily create this story.
- Give every factual beat a comic angle, then escalate to the next more ridiculous beat.
- Use fake seriousness, mock analysis, courtroom language, sports commentary, or documentary authority for contrast.
- Include at least one callback to the opening thesis and one line that sounds like a shareable quote.
- Example rhythm only, do not copy: "The mission was innovation. The evidence suggests advanced sleep deprivation."
- Finish with a verdict that is savage in wording but affectionate in spirit.""",
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
        "couple_bickering": """COUPLE BICKERING PLAYBOOK:
- Narrate as a playful back-and-forth between two voices in a relationship, gently bickering about the memory.
- Use the viral "gf vs bf" banter format — one voice teasing, the other defending, both clearly affectionate underneath.
- Base every jab on real details from the memory (who planned it, who overslept, who forgot something), never invented flaws.
- Keep the tone like an inside joke a couple would actually post, not a real argument — no contempt, no genuine criticism.
- Let both voices get a turn to "win" a point so it feels balanced, not one-sided.
- Never touch appearance, insecurities, or anything not clearly part of the shared memory.
- Example rhythm only, do not copy: "'I said left.' 'You said it AFTER we turned right.' 'Details.'"
- End with a line that resolves the bicker into a warm, teasing truce — proof they're a team despite the chaos.""",
        "this_or_that": """THIS OR THAT PLAYBOOK:
- Narrate using the viral "this or that" rapid-fire format, framing real moments from the memory as binary choices.
- Structure each beat as a quick two-option setup followed by which one "won," based on what actually happened.
- Use snappy, fast-paced delivery — short phrases, minimal explanation, quick cuts between choices.
- Ground every "this or that" in a real detail from the memory (sleep or snacks, plan A or plan B, hype or panic).
- Let the choices build a mini-story of the memory when strung together, not just a random list.
- Example rhythm only, do not copy: "Sleep or snacks? Snacks. Plan or chaos? Also chaos, somehow both won."
- End with the ultimate "this or that" — the ending itself framed as the final, funniest choice they made.""",
        "expectation_vs_reality": """EXPECTATION VS REALITY PLAYBOOK:
- Narrate using the viral "expectation vs reality" split format, contrasting the plan with what actually happened.
- Open each beat with the confident "expectation" version, then cut to the messier "reality" version.
- Use a clean, punchy rhythm — short expectation line, short reality line, quick contrast, move on.
- Keep the reality beats grounded in true details from the memory, exaggerated only for comic timing, not fabricated.
- Maintain affection throughout — reality should feel endearing and funny, not disappointing.
- Example rhythm only, do not copy: "Expectation: arrive early, well rested, fully prepared. Reality: arrive, period."
- End by declaring reality the better story anyway, turning the gap into the punchline.""",
        "grwm_storytime": """GET READY WITH ME STORYTIME PLAYBOOK:
- Narrate as a casual "get ready with me" storytime — talking through the memory the way someone talks while doing their routine.
- Use the genre's meandering, conversational tone: tangents, asides, "okay so basically," "anyway—" transitions.
- Let the story unfold gradually with small real details revealed as if remembered mid-sentence.
- Include a "wait, it gets worse" or "wait, it gets better" pivot partway through, genre staple for retention.
- Keep it intimate and casual, like a close friend narrating, not performative or exaggerated.
- Example rhythm only, do not copy: "So okay — we had this whole plan, right? Anyway, none of it happened, but stay with me."
- End with a casual, trailing-off button line, like the story just naturally wraps up.""",
        "hot_take_debate": """HOT TAKE / UNPOPULAR OPINION PLAYBOOK:
- Narrate as someone delivering a confident "unpopular opinion" or "hot take" about the group's memory.
- Open with a bold, deadpan claim that reframes an ordinary moment as a controversial stance.
- Defend the take with mock-serious reasoning pulled from real details in the memory.
- Use the genre's confident, slightly combative delivery — daring the listener to disagree.
- Keep the "controversy" totally harmless and specific to the group's own choices, nothing genuinely divisive.
- Example rhythm only, do not copy: "Hot take: the trip wasn't ruined by no sleep. It was made by no sleep. Fight me."
- End by doubling down on the take as the final, unshakeable verdict.""",
        "rate_out_of_ten": """RATE OUT OF TEN PLAYBOOK:
- Narrate using the viral "rating things out of 10" format, scoring individual moments from the memory.
- Give each real beat a quick, confident numeric rating with a one-line justification.
- Use rapid pacing — score, reason, next score, building comedic momentum through the list.
- Let ratings be intentionally inconsistent or biased in funny ways (e.g. rating chaos a 10/10 despite it "going wrong").
- Base every score on something that actually happened, not invented details.
- Example rhythm only, do not copy: "The plan: 3 out of 10. The commitment to the plan anyway: 11 out of 10."
- End with an overall final score for the whole memory that ties every beat together.""",
    }
    if variant not in playbooks:
        raise ValueError(f"Unknown script variant: {variant}")
    viral_core = """VIRAL ENERGY CORE:
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
            "- For multiple speakers (e.g. couple bickering), include a 'speaker' field in each segment with their name (e.g., 'neha', 'rahul').\n"
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
            temperature=0.8 if variant in {"roast_commentary", "village_elder"} else 0.6,
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
