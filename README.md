# Rewind AI — Multimodal AI Memory Storytelling Engine

> Transform scattered photos, raw voice notes, and memories into personalized, voice-narrated vertical video reels.

---

## 🌟 Overview

**Rewind AI** is an intelligent multimodal memory platform designed to solve the problem of forgotten camera rolls. Instead of letting thousands of photos sit unused on your phone, Rewind AI processes your photos, voice recordings, and text notes to craft personalized, emotion-rich video stories narrated in natural voices across 11+ Indian languages.

Built with a mobile-first **9:16 vertical Reels/TikTok format**, Rewind AI brings past experiences to life using dynamic camera motion, AI voice narration, and generative video clips.

---

## 🔥 Key Features

### 📸 1. Multimodal Asset Ingestion
- Upload photos (JPG, PNG, WEBP, HEIC), voice notes (MP3, WAV, MPEG, M4A, AAC), or written story notes.
- Direct browser microphone recording for instant voice note capture.

### 🧠 2. Deep Asset Understanding & OCR
- **Sarvam AI Vision** analyzes photo composition, spatial details, and text within images.
- **Sarvam Saaras:v3 STT** transcribes uploaded voice notes into multilingual text.

### 📜 3. Persona-Driven AI Scriptwriting
Automatically generates engaging story scripts using tailored narrative playbooks:
- **Relive Original**: Heartfelt, nostalgic memory recap.
- **Roast Commentary**: Hilarious, sarcastic commentary on the group's funny decisions and chaos.
- **Village Elder**: An ancient, dramatic cautionary tale told with comedic wisdom.
- **Hot Take & Debate**: High-energy commentary highlighting group debates and banter.
- **Viral Reel / Trailer**: Fast-paced, shareable social media trailer.

### 🎙️ 4. Multilingual Indic Voice Narration
- Powered by **Sarvam Bulbul:v3 TTS** supporting 11+ Indian languages (Hindi, English, Bengali, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Punjabi, Odia).
- Automated language identification (**Text LID**) and Critical-Error-Rate (CER) optimized speaker selection.

### 🎬 5. Mobile-First 9:16 Vertical Story Player
- **Portrait Reel Layout**: Fits 100% of mobile screens natively.
- **Ambient Blur Backdrop**: Full-screen atmospheric glow computed dynamically from photo colors.
- **Instagram-Style Progress Bars**: Segmented progress indicators tracking story beats.
- **Mood-Aware Ken Burns 2.0 Motion**: Camera pan, tilt, zoom, and rotate effects tailored to segment mood (`excited`, `nostalgic`, `funny`, `somber`, `warm`).

### 🤖 6. Character-Aware AI Image-to-Video Motion
- Extracts character metadata from uploaded photos and pairs it with script segment text.
- Generates 3-to-5 second AI video clips via **Fal.ai Kling 1.6 / SVD** models and plays them natively inside the vertical phone frame.

### 💬 7. Grounded Memory Q&A (Explore Mode)
- Ask natural language questions about any stored experience (e.g., *"Who slept during the hackathon?"*, *"Where did we take photos?"*).
- Answers are strictly grounded in memory artifacts via **Sarvam-105B LLM**.

---

## 📐 High-Level Architecture

```mermaid
graph LR
    subgraph Ingestion ["1. Multimodal Data Ingestion"]
        Photos["📷 Photos (JPG, PNG, WEBP)"]
        Audio["🎙️ Voice Notes (MP3, WAV, MPEG)"]
        Text["📝 Story Notes & Quotes"]
    end

    subgraph Processing ["2. Rewind AI Core Engine"]
        AssetUnderstanding["Sarvam Vision & Saaras STT"]
        MemorySynthesis["Sarvam-105B Narrative Synthesizer"]
        ScriptEngine["Multi-Persona Script Engine"]
        TTSAssembly["Sarvam Bulbul:v3 Indic TTS"]
        MotionGen["Fal.ai Image-to-Video Motion"]
    end

    subgraph Delivery ["3. Interactive Output & Player"]
        VerticalPlayer["📱 9:16 Vertical Phone Reel Player"]
        IndicAudio["🔊 Indic Voice Narration (11+ Languages)"]
        GroundedQA["💬 Grounded Memory Q&A Explorer"]
    end

    Ingestion --> Processing
    Processing --> Delivery
```

---

## 🛠️ Low-Level Architecture Diagram

```mermaid
graph TD
    subgraph Client Layer ["Frontend (React + Vite + Framer Motion)"]
        UI["User Interface"]
        Uploader["Media Uploader (Photos, Audio, Text)"]
        Player["Vertical 9:16 Story Player"]
        Explorer["Grounded Q&A Explorer"]
    end

    subgraph API Layer ["Backend Framework (FastAPI)"]
        Routes["FastAPI Router Engine"]
        MemRoute["/api/memories"]
        ReliveRoute["/api/relive-data & /api/assemble-relive"]
        VideoGenRoute["/api/generate-ai-video-story"]
        ExploreRoute["/api/explore"]
    end

    subgraph AI Pipeline Engine ["Pipeline Service & Orchestrator"]
        Step1["1. Asset Insights (Sarvam Vision & Saaras STT)"]
        Step2["2. Contextual Enrichment (Sarvam-105B)"]
        Step3["3. Memory Synthesis (memory.json & memory.md)"]
        Step4["4. Scriptwriting Engine (script_generation.py)"]
        Step5["5. Voice Narration Assembly (Sarvam Bulbul:v3 TTS)"]
        Step6["6. AI Video Motion Generation (Fal.ai Kling / SVD)"]
    end

    subgraph Storage Layer ["Data & Media Storage"]
        Cloudinary["Cloudinary CDN (Hosted Media Assets)"]
        MongoDB["MongoDB Atlas (Memory Drafts & Artifacts)"]
        LocalStorage["Static File Storage (WAV Audio & MP4 Video Clips)"]
    end

    %% Client to API
    Uploader -->|Upload Files & Drafts| Routes
    Player -->|Fetch Relive Timeline & Audio| ReliveRoute
    Explorer -->|Ask Memory Questions| ExploreRoute

    %% Routes to Pipeline
    Routes --> MemRoute
    Routes --> ReliveRoute
    Routes --> VideoGenRoute
    Routes --> ExploreRoute

    MemRoute -->|Trigger Pipeline| AI Pipeline Engine

    %% Pipeline Flow
    Step1 --> Step2
    Step2 --> Step3
    Step3 --> Step4
    Step4 --> Step5
    Step5 --> Step6

    %% AI Services Integration
    Step1 <-->|Vision & STT API| SarvamServices["Sarvam AI Platform"]
    Step2 <-->|Chat Completions| SarvamServices
    Step4 <-->|Sarvam-105B LLM| SarvamServices
    Step5 <-->|Bulbul:v3 TTS API| SarvamServices
    Step6 <-->|Image-to-Video API| FalAI["Fal.ai Engine"]

    %% Storage Connections
    Uploader -->|Upload Raw Files| Cloudinary
    AI Pipeline Engine -->|Store Drafts & Manifests| MongoDB
    Step5 -->|Save Combined WAV Audio| LocalStorage
    Step6 -->|Save MP4 Video Clips| LocalStorage
    ReliveRoute -->|Read Timeline & Assets| LocalStorage
```

---

## 🛠️ Technology Stack

| Layer | Technologies & Tools Used |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, Framer Motion, Lucide Icons, React Router |
| **Backend** | Python 3.12, FastAPI, Uvicorn, Asyncio, Pydantic |
| **AI Infrastructure** | Sarvam AI (Vision, Sarvam-105B LLM, Bulbul:v3 TTS, Saaras:v3 STT, Text LID), Fal.ai Kling 1.6 / SVD |
| **Storage & Database** | MongoDB Atlas, Cloudinary CDN, Local Static Asset Storage |

---

## 🔄 System Pipeline Workflow

```
[ Upload Assets ] ➔ [ Asset Insights ] ➔ [ Context Enrichment ] ➔ [ Memory Synthesis ] ➔ [ Scriptwriting ] ➔ [ TTS Audio & AI Video ] ➔ [ Vertical Story Player ]
```

1. **Media Upload**: Photos, voice notes, and text notes are uploaded and stored via Cloudinary CDN.
2. **Asset Insights**: Sarvam AI Vision processes photos; Sarvam Saaras STT transcribes voice recordings.
3. **Context Enrichment**: Sarvam-105B LLM generates detailed image descriptions and contextual narratives.
4. **Memory Synthesis**: Produces structured memory JSON and markdown story artifacts.
5. **Script Generation**: Writes multi-variant story scripts based on chosen persona playbooks.
6. **TTS Audio & AI Video Assembly**: Synthesizes Indic audio narration clips (`.wav`) via Sarvam Bulbul:v3 and generates motion video clips (`.mp4`) via Fal.ai.
7. **Relive Player Delivery**: Serves unified timeline data to the vertical 9:16 phone story player.

---

## 📁 Repository Structure Overview

```
Rewind/
├── Frontend/                 # Mobile-first React Application
│   ├── src/
│   │   ├── components/       # Relive Player, Media Uploader, Explorer Q&A
│   │   ├── pages/            # CreatePage, MemoryViewPage, RelivePage, Dashboard
│   │   └── services/         # API integration layer
│   └── package.json
│
└── backend/                  # FastAPI Application & AI Engine
    ├── app/
    │   ├── routes/           # REST Endpoints (relive, memories, STT, TTS, explore)
    │   └── services/         # Video assembly & Sarvam AI SDK integration
    ├── services/             # Video generation, MongoDB, & Cloudinary services
    ├── asset_insights.py     # Vision & STT asset understanding module
    ├── memory_generation.py  # Memory artifact synthesis module
    ├── script_generation.py  # Multi-variant persona scriptwriting module
    ├── pipeline_service.py   # End-to-end pipeline orchestrator
    └── app.py                # Main backend entry point
```
