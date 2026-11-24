# KAVACH explainer prototype: design

Date: 25 Nov 2026 · Status: approved and built (25 Nov 2026)

## Why
Judges get a 4-minute film that gives them the idea. This prototype lets them click through what KAVACH
will actually do, and its screenshots go into the README. The hackathon forbids building the product
before 1 Dec, so this is a **scripted prototype**: no real MCP servers, no live models. It must look and
behave like the finished product and say honestly that it is a scripted replay.

## Goals
- Two separate apps a judge can open side by side: **Amma's phone** and **Rahul's admin panel**.
- A start page that explains KAVACH in one screen and sends the judge to both apps.
- Real voices in Kannada, Hindi and English (Amma's warnings, the fake CBI caller, Ramesh the decoy).
- Agentic behaviour made visible: every agent step shown as tool call → policy gate → result, replayed live.
- 3D with Three.js on WebGPU (WebGL2 fallback): the real steel-and-indigo shield on the phone, a 3D fraud graph in the admin panel.
- Deep links to every key state, so screenshots and judges can jump straight to a moment.

## Non-goals / anti-goals
- No live LLM, speech recognition or real telephony. No Telegram bot. No native app.
- Not a marketing landing page; the apps are working-product screens (impeccable "Operate" mode).
- Failure even if it works: anything that looks like a generic AI dashboard, emoji icons, glow, gradients on UI, violet.

## Approaches considered
- **A. Scripted prototype with pre-made real voices (chosen).** Same result on every click, no cost, can't break during judging, clearly a prototype.
- B. Live agents and voices on the Hugging Face Space. More impressive when it works, but slow on CPU, can fail mid-judging, and is product code the rules don't allow yet.
- C. One scrolling story page. Easiest to read, but no separate phone and admin screens to screenshot.

## Visual world: Studio & Enamel (chosen, matches the pitch film)
- Ground: light studio, radial #F4F4F5 → #C9C9CC. Dark objects on it.
- Cards #19191B, 1px #2C2C2F, radius 24 (rows 14), shadow `0 24px 48px rgba(0,0,0,.14)`.
- Ink on light #171717 / #525252 / #737373; on dark #EDEDED / #A1A1A6 / #85858B.
- One accent: indigo #2A2FD0 (on dark #6C70F0), only for KAVACH itself.
- Semantic only: red #E5484D scam / loss / never; green #4CC38A safe / done / automatic; amber #F5A524 needs approval.
- Type (my call): Geist + Geist Mono instead of Segoe UI, because both skills reject a system font as the display voice; same neutral character. Noto Sans Kannada / Devanagari for Indic text. Sentence case, no trailing periods.
- Motion: enter expo-out 0.6–0.8 s, moves 0.8–1.2 s, no bounce, no glow. One authored moment per screen.
- Shield: the real Blender model exported to GLB, never redrawn flat.

## Structure (all static, in `web/`, served by GitHub Pages, the Space and FastAPI)
- `web/index.html`: start page. One line of what KAVACH is, the two apps as large links, the four-step story, "scripted prototype" note.
- `web/phone/`: Amma's phone. Mobile-first; on desktop it sits centred in a phone frame on the studio ground.
  States: home (protected, latest SMS, "I've been cheated") → incoming screened call → KAVACH joined (3D shield, risk, warning spoken in her language) → call ended; SMS checked with voice note; recovery started.
- `web/admin/`: Rahul's panel. Desktop-first, responsive. Left rail: Overview, Approvals, Recover, Fraud graph, Audit log, Decoy.
  Overview shows live agent activity (a streaming trace), pending approvals, golden-hour timer when active.
- `web/shared/`: tokens CSS, the story engine (policy gate, approvals, audit log, graph data; grown from today's `mock.js`), audio list.
- **Phone ↔ admin link:** both apps share state through `BroadcastChannel` + `localStorage`, so tapping KAVACH on the phone in one tab makes Rahul's panel react in the other. Each app also runs alone.
- Deep links: `?scene=call-joined`, `?scene=recover`, etc.

## 3D
- Three.js from a pinned CDN build via import map, `WebGPURenderer` (auto WebGL2 fallback), reduced motion = still frame.
- Phone: shield GLB, slow turn; on "KAVACH joined" it lifts and a thin ring pulses with the speaking voice (Web Audio analyser).
- Admin: fraud graph as 3D force layout; scam entities red, protected families green, KAVACH's own captures indigo; labels as DOM overlays for accessibility; slow orbit, drag to rotate.

## Voices (pre-made once, shipped as audio files)
- Model: AI4Bharat **Indic Parler-TTS** (Apache-2.0; Kannada, Hindi, English; voice described in words, so we get a calm KAVACH voice, a hard-sounding fake officer and an elderly Ramesh). Fallback: Meta MMS-TTS.
- One-time download: about 3.5 GB of model weights plus the `parler-tts` Python package, on this machine only. Runs on CPU; ~15 clips.
- Clips: KAVACH warning ×3 languages, SMS voice note ×3, announcement to the caller, scammer ×3, Ramesh ×3, recovery confirmation. Encoded to small Opus/MP3 with ffmpeg; model and licence credited in the README.

## Research reuse
Scam phrasing for the caller and playbooks drawn from public sources already cited in the team brief and from the Hinglish scam-call dataset on Hugging Face; Ramesh's lines follow the persona patterns in Bot Wars (arXiv 2503.07036). Listed in the README.

## Hosting
- GitHub Pages: `web/` as today.
- Hugging Face Space: switch to `sdk: static`, push the `web/` site. Static Spaces run on free hardware; the Space currently requests paid `cpu-upgrade`, which static mode drops. The HF token is used only on the push command, never stored.

## Left to the builder
Exact copy, clip wording, layout details, graph physics, screenshot list (after the user sends the reference README).

## Waiting on the user
The reference README format for the screenshot section.
