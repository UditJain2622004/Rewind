# Hackathon Project Workflow: AI Memory

## Overview

This is a hackathon project for Sarvam AI focused on turning captured moments into experiences you can **relive**, **explore**, and **share**.

The product is not a generic photo organizer and not a generic content generator. The user already has meaningful photos/videos and provides a voice note or text notes that explain what happened. The AI then turns that raw material into a memory-like experience.

The idea is to preserve the **story behind the pictures**, not just the pictures themselves.

This is meant to be built as a **small but magical demo** in about **7 hours**, with a team of 3 and AI coding tools assisting heavily. The scope must stay tight.

---

## Product Goal

The core goal is:

> Take a curated set of photos/videos from an experience and turn it into a memory the user can revisit emotionally.

The experience could be:

- a trip
- a wedding
- a birthday
- a college event
- a family gathering
- a concert
- any meaningful life moment

The user can add photos/videos and voice notes at any time:

- during the experience
- at the end of the day
- after the trip/event is over

The system should then understand the material and produce a memory that can be experienced in three ways:

- **Relive** — a personal narrated memory
- **Explore** — ask questions about the memory
- **Share** — a shorter version for posting

---

## High-Level Product Idea

The product is essentially a **memory engine**.

The user decides what belongs in the memory. The AI does not decide what the memory is; it only helps bring it to life.

This is important because the product is not about automatically sorting random photos from a gallery. The user is already curating the photos into one experience. That makes the system much more focused and much more feasible for a hackathon.

The emotional promise is:

> Don’t just keep the pictures. Keep the story.

---

## Why This Is Interesting

Most existing photo apps show memories passively. This project goes a step further by letting the user:

- intentionally construct a memory from selected inputs
- hear the story narrated back to them
- ask about specific moments later
- optionally generate a shareable version

This makes the app feel more like a **memory experience** than a storage app.

---

## Major User Workflows

### 1. Create an Experience

The user creates a new experience, such as:

- Goa Trip
- Cousin’s Wedding
- College Farewell
- Diwali Night
- Road Trip

This experience becomes the container for everything that follows.

The user can add:

- photos
- videos
- voice notes
- short text notes
- multiple contributors’ inputs

The content can be added over time. It does not need to arrive all at once.

---

### 2. Memory Understanding

This is the most important and difficult part.

The system reads all the inputs and tries to understand:

- what happened
- which moments matter
- who is involved
- the likely order of events
- emotional tone
- funny, important, nostalgic, or surprising moments
- any uncertain or missing details

The result is a memory that is understood at a human level, not just a collection of files.

The AI should not invent facts. It should stay grounded in the user’s own material.

---

### 3. Relive

This is the main emotional output.

The AI turns the memory into a narrated experience that the user can watch and listen to later.

This should feel like:

- a small cinematic recap
- a personal documentary
- a memory capsule
- a story that helps the user feel the moment again

The narration should be warm, emotional, and natural rather than overly promotional or robotic.

---

### 4. Explore

The memory is not just something to watch once. It should also be something the user can query later.

The user can ask things like:

- What happened after this?
- Who was with us?
- What was the funniest part?
- Where was this photo taken?
- What did we do on the second day?

The AI answers based on the memory and can point the user back to relevant moments.

This makes the memory feel alive and revisit-able.

---

### 5. Share

The same memory can be turned into a shorter, more social version.

This is the “tell others” version:

- stronger hook
- tighter pacing
- shorter duration
- possibly more playful or emotional depending on the selected style

The share version is not separate AI magic. It is the same memory, repackaged for a public audience.

---

## Shared / Multi-Person Memories

A very interesting feature is that one experience can have multiple contributors.

For example:

- Udit uploads photos and a voice note
- Rahul uploads his own photos and a different version of the story
- Priya adds a couple of clips and notes

The memory engine should combine these inputs into one shared experience.

This is useful because:

- no single person has the complete set of photos
- different people remember different details
- the same event can feel richer when multiple perspectives are included

This does not need to become a full collaboration product for the hackathon. It can simply be represented as multiple contributors feeding one experience.

---

## Core Components

### 1. Input Layer

Handles:

- creating an experience
- uploading images/videos
- recording voice notes
- adding text notes
- adding contributor labels

This should be very simple.

---

### 2. Memory Understanding

This is the central intelligence layer.

It takes the inputs and builds the internal understanding of the experience.

Its job is to identify:

- timeline
- events
- important moments
- people
- emotion
- uncertainty
- relationships between assets and moments

This is the hardest component and the one that should receive the most attention.

---

### 3. Script Creation

From the understood memory, generate different scripts:

- one script for Relive
- one script for Share

The Relive script should feel personal and emotional.
The Share script should feel shorter, sharper, and more engaging.

---

### 4. Explore / Q&A

This is the conversational interface for asking about the memory.

It should be able to answer questions about:

- events
- people
- sequence
- specific moments
- missing details

---

### 5. Voice and Video Output

The generated script should be turned into a final media experience:

- AI narration
- photo sequencing
- transitions
- simple motion effects
- captions
- background music if time allows

This is the part that makes the output feel like a real product rather than a text response.

---

### 6. Storage / Persistence

The app should store:

- the original assets
- contributor info
- the experience name
- the memory output
- generated scripts
- final renders

This does not need to be overengineered for the hackathon, but it should exist cleanly enough to support the demo.

---

## Recommended Hackathon Scope

Because this is only a 7-hour build with 3 people, the MVP should be tightly scoped.

### Build these:

- create an experience
- upload multiple images
- add one or more voice notes
- generate one memory
- generate one Relive output
- enable basic Explore questions
- optionally generate one Share version

### Do not build:

- real-time collaboration
- account systems
- invite links
- deep social sharing integrations
- automatic photo discovery from a full gallery
- complicated editing controls
- full timeline scrubbing UI
- heavy backend infrastructure
- advanced memory graphs

The hackathon demo should be narrow, polished, and emotionally convincing.

---

## Sarvam AI Fit

This idea is a strong fit for Sarvam because it naturally uses:

- vision understanding for images
- speech-to-text for voice notes
- language generation for memory narration
- multilingual support for Indian-language storytelling
- text-to-speech for the narrated experience

A user should be able to speak naturally in the language they are most comfortable with. That is a major part of the value.

---

## Suggested Demo Flow

1. Open the app.
2. Create an experience called something like “Goa Trip”.
3. Upload 10–15 photos.
4. Add 1–2 voice notes describing what happened.
5. Click **Create Memory**.
6. Show the generated memory recap.
7. Play **Relive**.
8. Ask one or two questions using **Explore**.
9. Generate a short **Share** version.

The demo should feel emotional and easy to understand in under a minute.

---

## Key Product Philosophy

The important philosophy behind the product is:

- the user chooses what belongs to the experience
- the AI helps interpret and narrate it
- the AI should not invent the story
- the final result should feel personal, not generic
- the same memory should support revisiting, asking, and sharing

---

## One-Line Summary

**AI Memory turns curated photos, videos, and voice notes from an experience into something you can relive, explore, and share.**
