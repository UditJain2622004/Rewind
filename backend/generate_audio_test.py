"""Standalone test script to generate audio from any Contract 3 script JSON file using Sarvam AI TTS.

Usage:
    python generate_audio_test.py [--script script.json] [--output-dir output_audio] [--speaker shubh] [--api-key YOUR_KEY]

Requirements:
    - SARVAM_API_KEY set in environment or backend/.env file (or passed via --api-key)
"""

from __future__ import annotations

import argparse
import base64
import json
import logging
import os
import struct
import sys
import wave
import math
from pathlib import Path
from typing import Any

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("generate_audio_test")

MOOD_TTS_MAP = {
    "excited":   {"pace": 1.0, "temperature": 0.8},
    "warm":      {"pace": 1.0, "temperature": 0.55},
    "nostalgic": {"pace": 1.0, "temperature": 0.5},
    "funny":     {"pace": 1.0, "temperature": 0.9},
    "somber":    {"pace": 1.0, "temperature": 0.4},
    "neutral":   {"pace": 1.0, "temperature": 0.6}
}

# Best speaker voice per language
LANGUAGE_BEST_SPEAKER_MAP = {
    "hi-IN": "ritu",
    "en-IN": "mani",
    "bn-IN": "pooja",
    "ta-IN": "priya",
    "te-IN": "priya",
    "kn-IN": "roopa",
    "ml-IN": "roopa",
    "mr-IN": "pooja",
    "gu-IN": "neha",
    "pa-IN": "amit",
    "od-IN": "amit"
}


def load_env_api_key() -> str:
    """Load SARVAM_API_KEY from environment or .env file."""
    api_key = os.environ.get("SARVAM_API_KEY", "")
    if api_key:
        return api_key

    # Try searching for .env file in current directory or backend directory
    for path in [Path(".env"), Path("backend/.env"), Path("../.env")]:
        if path.exists():
            for line in path.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line.startswith("SARVAM_API_KEY="):
                    val = line.split("=", 1)[1].strip().strip('"').strip("'")
                    if val:
                        return val
    return ""


def get_wav_duration(file_path: Path) -> float:
    """Read actual duration of WAV file in seconds."""
    with wave.open(str(file_path), "rb") as wf:
        frames = wf.getnframes()
        rate = wf.getframerate()
        return round(frames / float(rate), 2)


def create_mock_wav(file_path: Path, text: str) -> float:
    """Fallback generator for mock pulsing WAV when API key is missing."""
    duration = max(3.0, round(len(text) / 12.0, 2))
    sample_rate = 24000
    num_samples = int(sample_rate * duration)
    frequency = 330.0
    amplitude = 8000

    file_path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(file_path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        for i in range(num_samples):
            envelope = 0.5 + 0.5 * math.sin(2.0 * math.pi * 2.0 * i / sample_rate)
            val = int(amplitude * envelope * math.sin(2.0 * math.pi * frequency * i / sample_rate))
            wf.writeframesraw(struct.pack("<h", val))
    return duration


def clean_text_for_tts(text: str) -> str:
    """Clean em-dashes and formatting for Sarvam TTS."""
    text = text.replace("—", ", ").replace("–", "-")
    import re
    return re.sub(r"\s{2,}", " ", text).strip()


def call_sarvam_tts(
    text: str,
    api_key: str,
    speaker: str = "shubh",
    language_code: str = "en-IN",
    pace: float = 1.0,
    temperature: float = 1.0,
    sample_rate: int = 24000
) -> bytes:
    """Make HTTP POST to Sarvam TTS REST API."""
    import urllib.request
    import urllib.error

    text = clean_text_for_tts(text)

    url = "https://api.sarvam.ai/text-to-speech"
    headers = {
        "api-subscription-key": api_key,
        "Content-Type": "application/json"
    }

    # Resolve default speaker if needed
    if not speaker or speaker == "shubh":
        speaker = LANGUAGE_BEST_SPEAKER_MAP.get(language_code, "shubh")

    payload = {
        "text": text,
        "language_code": language_code,
        "speaker": speaker,
        "model": "bulbul:v3",
        "pace": pace,
        "temperature": temperature,
        "speech_sample_rate": sample_rate
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            audios = data.get("audios", [])
            if not audios:
                raise ValueError("Sarvam API returned no audio content")
            return base64.b64decode(audios[0])
    except urllib.error.HTTPError as exc:
        err_msg = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Sarvam API HTTP {exc.code}: {err_msg}") from exc


def generate_audio_from_script(
    script_path: str | Path,
    output_dir: str | Path,
    api_key: str | None = None,
    override_speaker: str | None = None
) -> dict[str, Any]:
    """Reads script JSON, invokes Sarvam TTS for each segment, saves WAV files, and generates tts_output.json."""

    script_file = Path(script_path)
    out_dir = Path(output_dir)

    if not script_file.exists():
        raise FileNotFoundError(f"Script file not found: {script_file.resolve()}")

    script_data = json.loads(script_file.read_text(encoding="utf-8"))
    script_id = script_data.get("script_id", script_file.stem)
    language_code = script_data.get("language_code", "en-IN")
    default_speaker = override_speaker or script_data.get("speaker", "shubh")
    segments = script_data.get("segments", [])

    if not segments:
        raise ValueError(f"No segments found in script file: {script_file}")

    out_dir.mkdir(parents=True, exist_ok=True)
    resolved_api_key = api_key or load_env_api_key()

    if not resolved_api_key or resolved_api_key == "your_actual_sarvam_api_key_here":
        logger.warning("SARVAM_API_KEY is missing or unconfigured. Falling back to generated mock audio files.")
        using_api = False
    else:
        logger.info(f"Using Sarvam AI API for TTS generation (Language: {language_code}, Speaker: {default_speaker})")
        using_api = True

    audio_segments = []
    total_duration = 0.0

    print(f"\n==================================================")
    print(f" Generating Audio for Script: {script_id}")
    print(f" Total Segments: {len(segments)}")
    print(f" Output Directory: {out_dir.resolve()}")
    print(f" Mode: {'Sarvam AI API (bulbul:v3)' if using_api else 'Fallback Mock Audio'}")
    print(f"==================================================\n")

    for idx, seg in enumerate(segments, start=1):
        seg_id = seg.get("segment_id", f"seg_{idx:02d}")
        text = seg.get("narration_text", "").strip()
        mood = seg.get("mood", "neutral").lower()

        if not text:
            logger.warning(f"Segment {seg_id} has empty narration text, skipping.")
            continue

        mapped = MOOD_TTS_MAP.get(mood, {"pace": 1.0, "temperature": 0.6})
        wav_path = out_dir / f"{seg_id}.wav"

        print(f"[{idx}/{len(segments)}] {seg_id} (Mood: {mood}, Pace: {mapped['pace']}, Temp: {mapped['temperature']})")
        print(f"     Text: \"{text[:70]}{'...' if len(text) > 70 else ''}\"")

        duration = 0.0
        if using_api:
            try:
                audio_bytes = call_sarvam_tts(
                    text=text,
                    api_key=resolved_api_key,
                    speaker=default_speaker,
                    language_code=language_code,
                    pace=mapped["pace"],
                    temperature=mapped["temperature"]
                )
                wav_path.write_bytes(audio_bytes)
                duration = get_wav_duration(wav_path)
                print(f"     [OK] Generated Sarvam TTS audio -> {wav_path.name} ({duration}s)")
            except Exception as exc:
                logger.error(f"     [FAIL] Sarvam API call failed for {seg_id}: {exc}. Generating mock audio fallback.")
                duration = create_mock_wav(wav_path, text)
                print(f"     [FALLBACK] Created mock WAV fallback -> {wav_path.name} ({duration}s)")
        else:
            duration = create_mock_wav(wav_path, text)
            print(f"     [FALLBACK] Created mock WAV fallback -> {wav_path.name} ({duration}s)")

        total_duration += duration
        audio_segments.append({
            "segment_id": seg_id,
            "audio_file": wav_path.name,
            "audio_path": str(wav_path.resolve()),
            "duration_sec": duration,
            "mood": mood,
            "narration_text": text,
            "tts_params_used": mapped
        })

    tts_output = {
        "script_id": script_id,
        "language_code": language_code,
        "speaker": default_speaker,
        "total_duration_sec": round(total_duration, 2),
        "audio_segments": audio_segments
    }

    output_manifest_path = out_dir / "tts_output.json"
    output_manifest_path.write_text(json.dumps(tts_output, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\n==================================================")
    print(f" Generation Complete!")
    print(f" Total Audio Duration: {round(total_duration, 2)} seconds")
    print(f" Manifest Saved: {output_manifest_path.resolve()}")
    print(f"==================================================\n")

    return tts_output


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate audio files from a Contract 3 script JSON file.")
    parser.add_argument("--script", "-s", default="script.json", help="Path to input script JSON file (default: script.json)")
    parser.add_argument("--output-dir", "-o", default="test_audio_output", help="Output directory for generated WAV files (default: test_audio_output)")
    parser.add_argument("--speaker", help="Override speaker name (e.g. shubh, ritu, sumit, mani)")
    parser.add_argument("--api-key", help="Sarvam API Subscription Key (defaults to SARVAM_API_KEY env var)")

    args = parser.parse_args()

    try:
        generate_audio_from_script(
            script_path=args.script,
            output_dir=args.output_dir,
            api_key=args.api_key,
            override_speaker=args.speaker
        )
    except Exception as exc:
        logger.error(f"Failed to generate audio: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()
