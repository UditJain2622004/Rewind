# AI Memory — Component Contracts

Purpose: define the data handed across each boundary so the Input, Memory Understanding,
Script Generation, and Voice/Video teams can build in parallel without blocking on each other.
Each contract = a file format + schema. Whoever owns the upstream component just needs to
write files matching the schema; the downstream owner can start building against mock files
matching the schema *today*, before the real pipeline exists.

---

## Contract 1 — Input Layer → Memory Understanding

**Design principle:** Input layer captures *structural* metadata only (who, when, cheap optional
labels). It does NOT do content understanding (no vision captioning, no STT) — that's Memory
Understanding's job. Keeping this boundary strict is what lets uploads stay instant.

**Output:** one manifest file per experience — `assets_manifest.json` — an array of asset records.

### Image / video asset record
```json
{
  "asset_id": "ast_0001",
  "experience_id": "exp_goa_trip",
  "type": "image",
  "contributor_id": "udit",
  "contributor_name": "Udit",
  "file_url": "/assets/ast_0001.jpg",
  "uploaded_at": "2026-08-08T14:32:00Z",
  "captured_at": "2026-08-06T18:45:00+05:30",
  "geo": { "lat": 15.4989, "lng": 73.8278 },
  "user_caption": "sunset at the beach",
  "user_tags": ["beach", "sunset"]
}
```
- `type`: `"image" | "video"`
- `captured_at`: pulled from EXIF/file metadata if available, else `null`. This is your free
  timeline signal — use it before asking the AI to infer order.
- `geo`: optional, from EXIF, else omit.
- `user_caption` / `user_tags`: optional, only if the upload UI offers a quick field. Never required.

### Voice / text note record
```json
{
  "asset_id": "ast_0050",
  "experience_id": "exp_goa_trip",
  "type": "voice_note",
  "contributor_id": "udit",
  "contributor_name": "Udit",
  "file_url": "/assets/ast_0050.mp3",
  "uploaded_at": "2026-08-08T14:40:00Z",
  "recorded_at": "2026-08-06T19:00:00+05:30",
  "duration_sec": 42,
  "linked_asset_ids": ["ast_0001", "ast_0002"],
  "raw_text": null
}
```
- `type`: `"voice_note" | "text_note"`
- `linked_asset_ids`: **the highest-leverage field in this contract.** If your UI lets a user
  select photos before recording ("tell the story of these 3 photos"), populate this. It turns
  a free-floating transcript into a grounded one and massively de-risks Memory Understanding.
  Optional — leave `[]` if not implemented in time.
- `raw_text`: always `null` coming out of Input. Memory Understanding fills this in after
  transcription. (Input layer never runs STT.)

**What Input owns:** producing valid `assets_manifest.json` + the raw files at `file_url`.
**What Memory Understanding owns:** everything semantic — captioning, transcription, inference.

---

## Contract 2 — Memory Understanding → Script Generation (and Explore)

**Design principle (your instinct, confirmed):** one structured file for anything downstream
code needs to *parse*, one open file for anything that needs to *read well*. The only addition:
the open file needs a way to point back at real assets, or the prose becomes ungrounded and
Script Generation/Video Assembly can't map narration to photos.

**Output:** `memory.json` (structured skeleton) + `memory.md` (open narrative).

### `memory.json` — the skeleton
```json
{
  "experience_id": "exp_goa_trip",
  "title": "Goa Trip",
  "contributors": ["udit", "rahul", "priya"],
  "moments": [
    {
      "moment_id": "mom_01",
      "order": 1,
      "label": "Arrival & check-in",
      "asset_ids": ["ast_0001", "ast_0002"],
      "people": ["Udit", "Rahul"],
      "emotion_tags": ["excited"],
      "confidence": "high"
    },
    {
      "moment_id": "mom_02",
      "order": 2,
      "label": "Sunset at the beach",
      "asset_ids": ["ast_0001", "ast_0050"],
      "people": ["Udit", "Priya"],
      "emotion_tags": ["nostalgic", "funny"],
      "confidence": "medium"
    }
  ],
  "people": [
    { "name": "Udit", "asset_ids": ["ast_0001", "ast_0050"] },
    { "name": "Priya", "asset_ids": ["ast_0001"] }
  ],
  "open_questions": [
    "Unclear who took ast_0007 or exactly when"
  ]
}
```
This is what Script Generation and Explore actually query — moment order, which assets belong
to which moment, who's involved, and where the AI is *unsure* (`confidence`, `open_questions`)
so Script Generation can hedge language instead of inventing certainty.

### `memory.md` — the narrative, open format
Suggest sections, don't mandate them:
```markdown
# Goa Trip — Memory

## Overview
(the overall vibe / arc, free text)

## Timeline Narrative
It started with a long drive down... [[ast_0001]] by the time everyone checked in
the light was already golden...

## Key Moments
### Sunset at the beach [[mom_02]]
...

## People
...

## Uncertain / Missing
...
```
**One convention worth keeping non-negotiable:** inline references like `[[ast_0001]]` or
`[[mom_02]]` wherever the prose talks about a specific asset or moment. Costs nothing, and it's
what lets Script Generation and Video Assembly trace "this sentence" back to "this photo" later
even though the writing itself stays free-form.

**Bonus:** Explore/Q&A reads the *same two files* — no separate contract needed. It grounds
answers in `memory.json` for facts (who/when/which asset) and can quote/paraphrase from
`memory.md` for tone and detail.

---

## Contract 3 — Script Generation → TTS → Video Assembly

**Design principle:** this isn't really a single "script → TTS" handoff — the script feeds
*two* consumers (TTS and Video Assembly) that must stay in sync. The fix is to make the script
a sequence of small segments, each tied to one or more assets, rather than one paragraph.
Generating TTS **per segment** then gives you per-segment audio duration for free, which is
exactly the timing signal Video Assembly needs to know how long to hold each photo on screen.

**Output:** `script.json` (one per variant: relive / share) → `tts_output.json`.

### `script.json`
```json
{
  "script_id": "goa_trip_relive_v1",
  "experience_id": "exp_goa_trip",
  "variant": "relive",
  "language_code": "hi-IN",
  "speaker": "shubh",
  "segments": [
    {
      "segment_id": "seg_01",
      "narration_text": "It started with a long drive down to Goa...",
      "asset_ids": ["ast_0001"],
      "caption_text": "The drive down",
      "mood": "excited"
    },
    {
      "segment_id": "seg_02",
      "narration_text": "By evening we were on the beach, and the sky just...",
      "asset_ids": ["ast_0001", "ast_0050"],
      "caption_text": "Sunset on the beach",
      "mood": "nostalgic"
    }
  ]
}
```
- `variant`: `"relive" | "share"` — same shape, different tone/length/segment count.
- `speaker`: fixed **per script**, not per segment — switching voices mid-narration breaks the
  "one narrator telling your story" feel. Relive and Share can each use a different speaker if you want.
- `asset_ids` per segment: usually one, sometimes a couple (e.g. a quick montage beat).
- `caption_text`: optional, defaults to a trimmed `narration_text` if not set — for on-screen captions.
- `mood`: **controlled vocabulary, not free text** — `excited | warm | nostalgic | funny | somber | neutral`.
  Script Generation only ever picks from this list; it never needs to know Sarvam-specific parameter ranges.

### Driving emotion via Sarvam TTS params

Sarvam has no categorical emotion parameter and no inline SSML/emotion tags in the text —
expressiveness comes entirely from `pace` + `temperature` (bulbul:v3) or `pace` + `pitch` +
`loudness` (bulbul:v2). **Recommendation: use bulbul:v3** for this hackathon — better voices,
handles longer text per call, and `temperature` alone is a real expressiveness knob. Only reach
for v2 if a specific moment genuinely needs the deeper/sharper pitch shift and it's worth the
extra model-switching complexity.

The TTS component owns a small lookup table that translates `mood` → actual Sarvam params. This
keeps the boundary clean — if you ever swap TTS providers, only this file changes, not Script
Generation's prompt or output.

**`mood_tts_map.json`** (owned by TTS component):
```json
{
  "excited":   { "pace": 1.15, "temperature": 0.8 },
  "warm":      { "pace": 0.95, "temperature": 0.55 },
  "nostalgic": { "pace": 0.85, "temperature": 0.5 },
  "funny":     { "pace": 1.1,  "temperature": 0.9 },
  "somber":    { "pace": 0.8,  "temperature": 0.4 },
  "neutral":   { "pace": 1.0,  "temperature": 0.6 }
}
```

**The narration text itself is still the primary emotion carrier.** Since there's no inline
tagging, punctuation and phrasing in `narration_text` do more work than these params ever will —
Script Generation's prompt should lean into short sentences and natural pauses for somber
moments, exclamations for excited ones, rather than expecting `mood` alone to carry it.

### `tts_output.json` — TTS's response
```json
{
  "script_id": "goa_trip_relive_v1",
  "audio_segments": [
    {
      "segment_id": "seg_01",
      "audio_url": "/audio/seg_01.mp3",
      "duration_sec": 4.8,
      "mood": "excited",
      "tts_params_used": { "pace": 1.15, "temperature": 0.8 }
    },
    {
      "segment_id": "seg_02",
      "audio_url": "/audio/seg_02.mp3",
      "duration_sec": 6.1,
      "mood": "nostalgic",
      "tts_params_used": { "pace": 0.85, "temperature": 0.5 }
    }
  ],
  "full_audio_url": "/audio/goa_trip_relive_v1_full.mp3"
}
```
`duration_sec` per segment is the whole point of doing TTS per-segment instead of as one call —
Video Assembly just zips `script.json` segments with `tts_output.json` durations 1:1 to know
exactly how long each photo stays on screen. No manual timing, no separate sync step.
`tts_params_used` is just for debugging/tuning — not required by any downstream consumer.

---

## Suggested file layout
```
/experiences/exp_goa_trip/
  assets_manifest.json
  assets/                  (raw photo/video/audio files)
  memory.json
  memory.md
  scripts/
    relive_v1.json
    share_v1.json
  audio/
    relive_v1_tts.json
    seg_01.mp3, seg_02.mp3, ...
  final/
    relive_v1.mp4
```

## Why this unblocks parallel work
- **Input** can ship `assets_manifest.json` from mock uploads on day 1, no dependency on Memory Understanding.
- **Memory Understanding** can build against a hand-written fake `assets_manifest.json` without waiting for real uploads.
- **Script Generation** can build against a hand-written fake `memory.json` + `memory.md` without waiting for Understanding to work end-to-end.
- **TTS / Video Assembly** can build against a hand-written fake `script.json` without waiting for Script Generation to work end-to-end.

Each team writes one fake input file matching the schema above, builds their piece against it, and integration is just swapping the fake file for the real upstream output.