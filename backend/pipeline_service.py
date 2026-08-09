"""End-to-end AI Memory pipeline for a single experience.

Orchestrates:
  1. Build asset_insights.md  (asset_insights.build_asset_insights)
  2. Enrich image sections    (asset_insights.enrich_asset_insights)
  3. Generate memory.json + memory.md  (memory_generation.generate_memory)
  4. Generate all script variants      (script_generation.generate_all)

Designed to be called from an async FastAPI endpoint; CPU/IO heavy work runs
in a thread pool so the event loop is never blocked.
"""

from __future__ import annotations

import json
import logging
import os
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any, Callable, Generator

logger = logging.getLogger("rewind.pipeline")

# ---------------------------------------------------------------------------
# Paths — one sub-directory per experience under backend/static/experiences/
# ---------------------------------------------------------------------------

def _experience_dir(base_static: Path, memory_id: str) -> Path:
    """Return (and create) the canonical output directory for a memory."""
    directory = base_static / "experiences" / memory_id
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def _base_static() -> Path:
    """Absolute path to backend/static, regardless of cwd."""
    return Path(__file__).resolve().parent / "static"


# ---------------------------------------------------------------------------
# Sarvam LLM caller (shared across memory_generation and script_generation)
# ---------------------------------------------------------------------------

def _make_llm_caller(model: str = "sarvam-105b", temperature: float = 0.2, max_tokens: int = 3500) -> Callable:
    key = os.environ.get("SARVAM_API_KEY")
    if not key:
        raise RuntimeError("SARVAM_API_KEY is not set")
    try:
        from sarvamai import SarvamAI
    except ImportError as exc:
        raise RuntimeError("Install backend/requirements.txt (sarvamai package)") from exc

    client = SarvamAI(api_subscription_key=key)

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

    def call(messages: list[dict], _schema: dict | None = None) -> str:
        return _json_content(client.chat.completions(
            messages=messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
        ))

    return call


# ---------------------------------------------------------------------------
# Pipeline steps
# ---------------------------------------------------------------------------

def _step_asset_insights(
    manifest_path: Path, insights_path: Path, multiple_speakers: bool = False
) -> None:
    """Step 1 — raw per-asset understanding (Vision + Saaras STT)."""
    from asset_insights import build_asset_insights
    logger.info("Pipeline step 1: build_asset_insights → %s", insights_path)
    build_asset_insights(
        manifest_path=str(manifest_path),
        output_path=str(insights_path),
        multiple_speakers=multiple_speakers,
    )


def _step_enrich(insights_path: Path, enriched_path: Path, manifest_path: Path) -> None:
    """Step 2 — LLM-powered contextual enrichment of image sections."""
    from asset_insights import enrich_asset_insights
    logger.info("Pipeline step 2: enrich_asset_insights → %s", enriched_path)
    enrich_asset_insights(
        input_path=str(insights_path),
        output_path=str(enriched_path),
        manifest_path=str(manifest_path),
    )


def _step_memory(enriched_path: Path, memory_json_path: Path, memory_md_path: Path, llm: Callable) -> None:
    """Step 3 — Synthesise memory.json + memory.md."""
    from memory_generation import generate_memory
    logger.info("Pipeline step 3: generate_memory → %s, %s", memory_json_path, memory_md_path)
    generate_memory(
        input_path=str(enriched_path),
        memory_json_path=str(memory_json_path),
        memory_md_path=str(memory_md_path),
        call_llm=llm,
    )


def _step_scripts(memory_json_path: Path, memory_md_path: Path, scripts_dir: Path, llm_model: str) -> list[Path]:
    """Step 4 — Generate all script variants."""
    from script_generation import select_script_variant, generate_script, SPEAKER_MAP
    import json
    scripts_dir.mkdir(parents=True, exist_ok=True)
    
    memory_data = json.loads(memory_json_path.read_text(encoding="utf-8"))
    narrative_data = memory_md_path.read_text(encoding="utf-8") if memory_md_path.exists() else ""

    logger.info("Pipeline step 4a: AI selecting best script variant")
    best_variant = select_script_variant(memory_data, narrative_data, model=llm_model)
    mapped_speaker = SPEAKER_MAP.get(best_variant, "shubh").split(",")[0]
    
    logger.info("Pipeline step 4b: Generating '%s' script", best_variant)
    script_result = generate_script(
        memory=memory_data,
        narrative=narrative_data,
        variant=best_variant,
        model=llm_model,
        language_code="en-IN",
        speaker=mapped_speaker,
        max_tokens=3500,
    )
    
    script_path = scripts_dir / f"{best_variant}_v1.json"
    script_path.write_text(json.dumps(script_result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    
    return [script_path]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def run_pipeline(
    memory_id: str,
    manifest_data: list[dict],
    *,
    llm_model: str = "sarvam-105b",
    progress_cb: Callable[[str, float], None] | None = None,
    multiple_speakers: bool = False,
) -> dict[str, Any]:
    """Run the full pipeline synchronously (call from a thread pool).

    Returns a summary dict with paths to all produced artifacts.
    """

    def _progress(msg: str, pct: float) -> None:
        logger.info("[%s] %.0f%% — %s", memory_id, pct * 100, msg)
        if progress_cb:
            progress_cb(msg, pct)

    base_static = _base_static()
    exp_dir = _experience_dir(base_static, memory_id)

    # Save manifest inside the experience directory so all steps share one
    manifest_path = exp_dir / "assets_manifest.json"
    manifest_path.write_text(json.dumps(manifest_data, ensure_ascii=False, indent=2), encoding="utf-8")

    insights_path  = exp_dir / "asset_insights.md"
    enriched_path  = exp_dir / "enriched_asset_insights.md"
    memory_json    = exp_dir / "memory.json"
    memory_md      = exp_dir / "memory.md"
    scripts_dir    = exp_dir / "scripts"

    llm = _make_llm_caller(model=llm_model, temperature=0.2, max_tokens=3500)

    _progress("Understanding your assets…", 0.05)
    _step_asset_insights(manifest_path, insights_path, multiple_speakers)

    _progress("Enriching image descriptions…", 0.25)
    _step_enrich(insights_path, enriched_path, manifest_path)

    _progress("Synthesising your memory…", 0.50)
    _step_memory(enriched_path, memory_json, memory_md, llm)

    _progress("Writing your story scripts…", 0.75)
    script_paths = _step_scripts(memory_json, memory_md, scripts_dir, llm_model)

    _progress("Done!", 1.0)

    return {
        "memory_id": memory_id,
        "experience_dir": str(exp_dir),
        "memory_json": str(memory_json),
        "memory_md": str(memory_md),
        "scripts": [str(p) for p in script_paths],
    }
