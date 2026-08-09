"""Test script generation and audio synthesis for a single script variant in one command.

Usage:
    python test_single_script.py --variant roast [--memory-json memory.json] [--memory-md memory.md] [--output-dir test_single_output] [--speaker shubh]

Available Variants:
    - roast
    - roast_commentary
    - village_elder
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from pathlib import Path

# Ensure backend root is in sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from script_generation import generate_script, SCRIPT_VARIANTS, SPEAKER_MAP, select_script_variant
from generate_audio_test import generate_audio_from_script, load_env_api_key

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("test_single_script")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate 1 script variant and synthesize its full audio in one step."
    )
    parser.add_argument(
        "--variant", "-v",
        choices=list(SCRIPT_VARIANTS),
        help="Script variant type to generate (overrides auto-selection)"
    )
    parser.add_argument(
        "--auto-variant",
        action="store_true",
        help="Use AI to automatically select the best script variant for the memory"
    )
    parser.add_argument(
        "--memory-json", "-j",
        default="memory.json",
        help="Path to memory.json file (default: memory.json)"
    )
    parser.add_argument(
        "--memory-md", "-m",
        default="memory.md",
        help="Path to memory.md file (default: memory.md)"
    )
    parser.add_argument(
        "--output-dir", "-o",
        default="test_single_output",
        help="Output directory for generated script and audio (default: test_single_output)"
    )
    parser.add_argument(
        "--model",
        default="sarvam-105b",
        help="Sarvam LLM model for script generation (default: sarvam-105b)"
    )
    parser.add_argument(
        "--speaker",
        help="Override TTS speaker (default: varun for village_elder, shubh for others)"
    )

    args = parser.parse_args()

    # Search for input files (check repo root if not in cwd)
    mem_json_path = Path(args.memory_json)
    if not mem_json_path.exists():
        mem_json_path = backend_dir.parent / args.memory_json
    if not mem_json_path.exists():
        logger.error(f"memory.json file not found at {args.memory_json}. Create or provide --memory-json path.")
        sys.exit(1)

    mem_md_path = Path(args.memory_md)
    if not mem_md_path.exists():
        mem_md_path = backend_dir.parent / args.memory_md
    if not mem_md_path.exists():
        mem_md_path = mem_json_path.with_name("memory.md")

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    print("\n==================================================")
    print(f" SINGLE SCRIPT & AUDIO GENERATOR")
    print(f" Variant:      {args.variant}")
    print(f" Memory JSON:  {mem_json_path.resolve()}")
    print(f" Output Dir:   {output_dir.resolve()}")
    print("==================================================\n")

    api_key = load_env_api_key()
    if api_key:
        os.environ["SARVAM_API_KEY"] = api_key

    memory_data = json.loads(mem_json_path.read_text(encoding="utf-8"))
    narrative_data = mem_md_path.read_text(encoding="utf-8") if mem_md_path.exists() else ""

    variant = args.variant
    if args.auto_variant or not variant:
        print(f"Step 0: AI auto-selecting best script variant based on memory...")
        variant = select_script_variant(memory_data, narrative_data, model=args.model)
        print(f"   [OK] Selected variant: {variant}")

    speaker = args.speaker or SPEAKER_MAP.get(variant, "shubh").split(",")[0]

    # Step 1: Generate Script Variant
    print(f"\nStep 1/2: Generating '{variant}' script using Sarvam LLM ({args.model})...")

    script_result = generate_script(
        memory=memory_data,
        narrative=narrative_data,
        variant=variant,
        model=args.model,
        language_code="en-IN",
        speaker=speaker,
        max_tokens=3500
    )

    script_filename = f"{variant}_v1.json"
    script_file_path = output_dir / script_filename
    script_file_path.write_text(json.dumps(script_result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f" [OK] Script generated successfully -> {script_file_path.resolve()}")
    print(f"   Total Segments: {len(script_result.get('segments', []))}\n")

    # Step 2: Generate Audio & Join
    print(f"Step 2/2: Generating TTS Audio & concatenating into master WAV file...")
    audio_output_dir = output_dir / "audio"
    api_key = load_env_api_key()

    tts_result = generate_audio_from_script(
        script_path=script_file_path,
        output_dir=audio_output_dir,
        api_key=api_key,
        override_speaker=speaker
    )

    print("\n==================================================")
    print(f" SUCCESS! Single Script & Audio Generation Finished")
    print(f" Script File:   {script_file_path.resolve()}")
    print(f" Master Audio:  {Path(tts_result['full_audio_path']).resolve()}")
    print(f" Total Audio:   {tts_result['total_duration_sec']} seconds ({len(tts_result['audio_segments'])} segments)")
    print("==================================================\n")


if __name__ == "__main__":
    main()
