Rewind AI — Multimodal AI Memory Storytelling Engine
Transform scattered photos, raw voice notes, and memories into personalized, voice-narrated vertical video reels.

🌟 Overview
Rewind AI is an intelligent multimodal memory platform designed to solve the problem of forgotten camera rolls. Instead of letting thousands of photos sit unused on your phone, Rewind AI processes your photos, voice recordings, and text notes to craft personalized, emotion-rich video stories narrated in natural voices across 11+ Indian languages.

Built with a mobile-first 9:16 vertical Reels/TikTok format, Rewind AI brings past experiences to life using dynamic camera motion, AI voice narration, and generative video clips.

🔥 Key Features
📸 1. Multimodal Asset Ingestion
Upload photos (JPG, PNG, WEBP, HEIC), voice notes (MP3, WAV, MPEG, M4A, AAC, FLAC, OGG, WEBM), or written story notes.
Direct browser microphone recording for instant voice note capture.
Assets uploaded and stored via Cloudinary CDN with draft persistence in MongoDB Atlas.
🧠 2. Deep Asset Understanding & OCR
Sarvam AI Vision analyzes photo composition, spatial details, and text within images.
Sarvam Saaras:v3 STT transcribes uploaded voice notes into multilingual text.
LLM-powered contextual enrichment of image descriptions via Sarvam-105B.
📜 3. AI Scriptwriting with 9 Viral Narrative Personas
Automatically generates engaging story scripts using tailored narrative playbooks. An AI variant selector picks the best-fit persona for each memory:

Roast: Playful insider self-roast where the group is in on the joke.
Roast Commentary: External comedian roasting the group in third person with sarcastic, dramatic commentary.
Village Elder: An ancient, dramatic cautionary tale told with comedic wisdom and sarcastic observations.
Couple Bickering: Playful back-and-forth banter in a viral "gf vs bf" format.
This or That: Rapid-fire binary choices framing real moments from the memory.
Expectation vs Reality: Viral split format contrasting the plan with what actually happened.
GRWM Storytime: Casual "get ready with me" storytelling with meandering, conversational tangents.
Hot Take / Debate: Confident "unpopular opinion" delivery reframing ordinary moments as bold stances.
Rate Out of Ten: Viral rating format scoring individual moments with comedic justifications.
🎙️ 4. Multilingual Indic Voice Narration
Powered by Sarvam Bulbul:v3 TTS supporting 11 Indian languages (Hindi, English, Bengali, Tamil, Telugu, Kannada, Malayalam, Marathi, Gujarati, Punjabi, Odia).
Automated language identification via Sarvam Text LID API.
CER-optimized speaker selection — each language maps to the best-performing voice speaker automatically.
Mood-aware TTS parameters: temperature and pace tuned per segment mood (excited, warm, nostalgic, funny, somber, neutral).
🎬 5. Mobile-First 9:16 Vertical Story Player
Portrait Reel Layout: Fits 100% of mobile screens natively.
Ambient Blur Backdrop: Full-screen atmospheric glow computed dynamically from photo colors.
Instagram-Style Progress Bars: Segmented progress indicators tracking story beats.
Mood-Aware Ken Burns 2.0 Motion: Camera pan, tilt, zoom, and rotate effects tailored to segment mood.
🤖 6. Character-Aware AI Image-to-Video Motion
Extracts character metadata from uploaded photos and pairs it with script segment text.
Generates 3-to-5 second AI video clips via Fal.ai Kling 1.6 / SVD models and plays them natively inside the vertical phone frame.
💬 7. Grounded Memory Q&A (Explore Mode)
Ask natural language questions about any stored experience (e.g., "Who slept during the hackathon?", "Where did we take photos?").
Answers are strictly grounded in memory artifacts (memory.json + memory.md) via Sarvam-105B LLM.
Falls back to keyword-based matching when AI artifacts are unavailable.
🔐 8. Authentication & Profile
User authentication flow with login and signup pages.
Profile dashboard for managing account settings.
🔗 9. Share & Landing
Shareable story links with format and style selectors.
Landing page with animated hero section, timeline, feature showcase, and CTA.
📐 High-Level Architecture
graph LR
    subgraph Ingestion ["1. Multimodal Data Ingestion"]
        Photos["📷 Photos (JPG, PNG, WEBP)"]
        Audio["🎙️ Voice Notes (MP3, WAV, MPEG)"]
        Text["📝 Story Notes & Quotes"]
    end

    subgraph Processing ["2. Rewind AI Core Engine"]
        AssetUnderstanding["Sarvam Vision & Saaras STT"]
        Enrichment["Sarvam-105B Contextual Enrichment"]
        MemorySynthesis["Memory Synthesis (JSON + MD)"]
        ScriptEngine["9-Persona Script Engine"]
        TTSAssembly["Sarvam Bulbul:v3 Indic TTS"]
        MotionGen["Fal.ai Image-to-Video Motion"]
    end

    subgraph Delivery ["3. Interactive Output & Player"]
        VerticalPlayer["📱 9:16 Vertical Phone Reel Player"]
        IndicAudio["🔊 Indic Voice Narration (11 Languages)"]
        GroundedQA["💬 Grounded Memory Q&A Explorer"]
    end

    Ingestion --> Processing
    Processing --> Delivery
🛠️ Low-Level Architecture Diagram
graph TD
    subgraph Client Layer ["Frontend (React 19 + Vite 8 + Tailwind CSS 4 + Framer Motion)"]
        UI["User Interface"]
        Landing["Landing Page & Auth"]
        Uploader["Media Uploader (Photos, Audio, Text)"]
        Player["Vertical 9:16 Story Player"]
        Explorer["Grounded Q&A Explorer"]
        Dashboard["Dashboard & Memory Grid"]
        Share["Share & Profile"]
    end

    subgraph API Layer ["Backend Framework (FastAPI + Uvicorn)"]
        Routes["FastAPI Router Engine"]
        UploadRoute["/api/upload"]
        DraftRoute["/api/memories/draft"]
        GenerateRoute["/api/memories/:id/generate"]
        FullGenRoute["/api/memories/:id/full-generate (SSE)"]
        MemListRoute["/api/memory-list & /api/memory/:id"]
        ReliveRoute["/api/relive-data & /api/assemble-relive"]
        VideoGenRoute["/api/generate-ai-video-story"]
        STTRoute["/api/speech-to-text"]
        TTSRoute["/api/text-to-speech"]
        ExploreRoute["/api/explore"]
    end

    subgraph AI Pipeline Engine ["Pipeline Service & Orchestrator"]
        Step1["1. Asset Insights (Sarvam Vision & Saaras STT)"]
        Step2["2. Contextual Enrichment (Sarvam-105B LLM)"]
        Step3["3. Memory Synthesis (memory.json & memory.md)"]
        Step4["4. AI Variant Selection + Scriptwriting"]
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
    Dashboard -->|Fetch Memory List| MemListRoute

    %% Routes to Pipeline
    Routes --> UploadRoute
    Routes --> DraftRoute
    Routes --> GenerateRoute
    Routes --> FullGenRoute
    Routes --> ReliveRoute
    Routes --> VideoGenRoute
    Routes --> STTRoute
    Routes --> TTSRoute
    Routes --> ExploreRoute

    FullGenRoute -->|Trigger Pipeline (SSE Stream)| AI Pipeline Engine

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
🛠️ Technology Stack
Layer	Technologies & Tools Used
Frontend	React 19, Vite 8, Tailwind CSS 4, Framer Motion, Lucide Icons, React Router DOM 7
Backend	Python 3.12, FastAPI, Uvicorn, Asyncio, Pydantic, Pydantic Settings, HTTPX, python-dotenv, python-multipart
AI Infrastructure	Sarvam AI (Vision, Sarvam-105B LLM, Bulbul:v3 TTS, Saaras:v3 STT, Text LID), Fal.ai (Kling 1.6 / SVD) via fal-client
Storage & Database	MongoDB Atlas (via PyMongo), Cloudinary CDN, Local Static Asset Storage
🔄 System Pipeline Workflow
[ Upload Assets ] ➔ [ Asset Insights ] ➔ [ Context Enrichment ] ➔ [ Memory Synthesis ] ➔ [ Variant Selection + Scriptwriting ] ➔ [ TTS Audio Assembly ] ➔ [ AI Video Generation ] ➔ [ Vertical Story Player ]
Media Upload: Photos, voice notes, and text notes are uploaded and stored via Cloudinary CDN. Draft metadata saved to MongoDB Atlas.
Asset Insights: Sarvam AI Vision processes photos; Sarvam Saaras:v3 STT transcribes voice recordings. Produces asset_insights.md.
Context Enrichment: Sarvam-105B LLM generates enriched image descriptions and contextual narratives. Produces enriched_asset_insights.md.
Memory Synthesis: Produces structured memory.json and narrative memory.md story artifacts from enriched insights.
Variant Selection + Script Generation: AI selects the best-fit persona from 9 viral narrative variants, then writes the story script with speaker mapping.
TTS Audio Assembly: Synthesizes Indic audio narration clips (.wav) via Sarvam Bulbul:v3 with mood-aware temperature and CER-optimized speaker selection.
AI Video Generation: Generates motion video clips (.mp4) via Fal.ai by pairing character metadata from photos with script segments.
Relive Player Delivery: Serves unified timeline data (script + assets manifest + TTS output + video output) to the vertical 9:16 phone story player.
📁 Repository Structure Overview
Rewind/
├── Frontend/                         # Mobile-first React Application
│   ├── src/
│   │   ├── App.jsx                   # Root app with routing & layout
│   │   ├── main.jsx                  # React DOM entry point
│   │   ├── index.css                 # Global styles (Tailwind CSS 4)
│   │   ├── components/
│   │   │   ├── create/               # ExperienceCreator, MediaUploader, AIProcessingAnimation
│   │   │   ├── dashboard/            # Dashboard, FeaturedMemory, MemoryGrid
│   │   │   ├── explore/              # MemoryExplorer, ExplorePrompt, ExploreResult
│   │   │   ├── landing/              # Hero, HeroTimeline, HowItWorks, ThreeModes, ChaosToMemory, FinalCTA
│   │   │   ├── layout/               # Navbar, MobileNav, PageTransition
│   │   │   ├── memory/               # MemoryCard, MemoryModeTabs, MemoryTimeline, MomentCard
│   │   │   ├── profile/              # ProfileDashboard
│   │   │   ├── relive/               # StoryPlayer, CinematicSlide, WhyThisMoment
│   │   │   ├── share/                # FormatSelector, StyleSelector, StoryGenerator, StoryPreview
│   │   │   └── shared/               # AnimatedText, GlassCard, MagneticButton, ParticleEffect, VoiceNotePlayer, WaterEffectCanvas, ContributorPanel
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Authentication context provider
│   │   ├── data/
│   │   │   └── mockData.js           # Development mock data
│   │   ├── hooks/                    # useMediaQuery, useMemoryLoader, useMouseParallax, useScrollAnimation
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx       # Marketing landing page
│   │   │   ├── AuthPage.jsx          # Login & Signup authentication
│   │   │   ├── DashboardPage.jsx     # Memory library dashboard
│   │   │   ├── CreatePage.jsx        # Memory creation flow
│   │   │   ├── MemoryViewPage.jsx    # Individual memory detail view
│   │   │   ├── RelivePage.jsx        # Fullscreen vertical story player
│   │   │   ├── ExplorePage.jsx       # Q&A explorer for memories
│   │   │   ├── SharePage.jsx         # Story sharing with format options
│   │   │   └── ProfilePage.jsx       # User profile dashboard
│   │   └── services/
│   │       └── api.js                # Centralized API integration layer
│   ├── package.json
│   └── vite.config.js
│
└── backend/                          # FastAPI Application & AI Engine
    ├── app/
    │   ├── __init__.py
    │   ├── main.py                   # FastAPI app factory (alternative entry)
    │   ├── config.py                 # Pydantic Settings (host, port, API keys)
    │   ├── routes/
    │   │   ├── __init__.py
    │   │   ├── stt.py                # POST /api/speech-to-text
    │   │   ├── tts.py                # POST /api/text-to-speech
    │   │   ├── relive.py             # Relive assembly, data, video gen, explore Q&A
    │   │   └── generate.py           # Full pipeline SSE, memory list, memory detail, artifacts
    │   └── services/
    │       ├── __init__.py
    │       ├── sarvam_service.py     # Sarvam AI SDK (TTS, STT, Language ID)
    │       └── video_service.py      # TTS assembly & relive data service
    ├── services/
    │   ├── __init__.py
    │   ├── cloudinary_service.py     # Cloudinary CDN upload & management
    │   ├── memory_service.py         # MongoDB draft CRUD & generation triggers
    │   ├── mongodb_service.py        # MongoDB Atlas connection & operations
    │   └── video_gen_service.py      # Fal.ai image-to-video generation service
    ├── asset_insights.py             # Vision & STT asset understanding + enrichment module
    ├── memory_generation.py          # Memory artifact synthesis module (JSON + MD)
    ├── script_generation.py          # 9-variant persona scriptwriting with AI variant selection
    ├── pipeline_service.py           # End-to-end pipeline orchestrator
    ├── config.py                     # Root-level config (MongoDB, Cloudinary, Sarvam keys)
    ├── models.py                     # Pydantic models (AssetRecord, ExperienceManifest)
    ├── app.py                        # Main backend entry point (python app.py)
    ├── main.py                       # Alternative uvicorn entry point
    ├── requirements.txt              # Python dependencies
    ├── .env.example                  # Environment variable template
    ├── static/                       # Generated audio, video, and experience artifacts
    └── tests/                        # Test suite (script TTS tests, video service tests)
🚀 Getting Started
Prerequisites
Node.js (v18+) and npm
Python 3.12+
API keys for: Sarvam AI, Cloudinary, MongoDB Atlas, Fal.ai
Backend Setup
cd backend
pip install -r requirements.txt
cp .env.example .env
# Fill in your API keys in .env
python app.py
The backend runs at http://localhost:8000. API docs available at /docs.

Frontend Setup
cd Frontend
npm install
npm run dev
The frontend runs at http://localhost:5173.

Environment Variables
Variable	Description
MONGODB_URI	MongoDB Atlas connection string
DB_NAME	Database name (default: rewind_db)
CLOUDINARY_CLOUD_NAME	Cloudinary cloud name
CLOUDINARY_API_KEY	Cloudinary API key
CLOUDINARY_API_SECRET	Cloudinary API secret
SARVAM_API_KEY	Sarvam AI API subscription key
FAL_KEY	Fal.ai API key for video generation
📡 API Endpoints
Method	Endpoint	Description
GET	/api/health	Health check
POST	/api/upload	Upload media asset to Cloudinary
POST	/api/memories/draft	Save/update memory draft in MongoDB
GET	/api/memories/draft	Fetch active draft
POST	/api/memories/{id}/generate	Trigger draft → processing status
GET	/api/memories/{id}/full-generate	Full AI pipeline via SSE stream
GET	/api/memory-list	List all memories (Dashboard)
GET	/api/memory/{id}	Get single memory by ID
GET	/api/memory/{id}/artifacts	Get generated memory.json & memory.md
POST	/api/speech-to-text	Transcribe audio via Sarvam Saaras:v3
POST	/api/text-to-speech	Generate speech via Sarvam Bulbul:v3
POST	/api/assemble-relive	TTS-assemble script for relive player
GET	/api/relive-data	Unified timeline data for player
POST	/api/generate-ai-video-story	Character-aware AI video generation
GET	/api/explore	Grounded Q&A via Sarvam-105B
