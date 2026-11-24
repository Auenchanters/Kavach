# KAVACH explainer prototype: implementation plan

> For agentic workers: executed natively (superpowers:executing-plans) in the session that wrote it.

**Goal:** a scripted, voiced, 3D explainer prototype: start page + Amma's phone + Rahul's admin panel, static in `docs/`.
**Architecture:** one shared story engine (grown from `docs/mock.js`) owns state; both apps render from it and sync over
`BroadcastChannel` + `localStorage`. Three.js `WebGPURenderer` scenes are islands inside normal DOM pages.
**Tech stack:** HTML/CSS/ES modules, Three.js (pinned CDN, import map), Indic Parler-TTS (offline, Python venv), Blender CLI, ffmpeg.
**Spec:** `specs/2026-11-25-explainer-prototype-design.md`

## Global constraints
- Tokens exactly as the spec's "Visual world" section; no violet, no glow, no gradients on UI, no emoji icons.
- Fonts Geist / Geist Mono; Indic text in Noto Sans Kannada / Devanagari.
- Demo constants: `+91 98XXX XX210`, `+91 70XXX XX451`, `refund.cbi@okaxis`, `HDFC ····4471`, ₹48,000, 11:42, golden hour stops at 00:01:12 in screenshots.
- Every page works with no server (GitHub Pages / static Space) and under `prefers-reduced-motion`.
- HF token only on the push command line; never in a file, remote URL or commit.

## Review focus
1. Phone and admin opened in two tabs stay in sync, including Reset → test: engine `subscribe` fires on a remote change.
2. WebGPU unavailable (Firefox, headless) → WebGL2 fallback still draws; no WebGL either → static image, no blank box.
3. Audio blocked until a user gesture → first tap unlocks; text always shown, so no voice never means no warning.
4. Deep link to a scene with no prior state (`?scene=recover`) → engine replays the steps leading there.
5. Phone at 360×740 and admin at 1024 wide → nothing overlaps, tap targets ≥ 44px.

## Files
- `docs/shared/tokens.css`: tokens, type, base components (button, card, tag, rows).
- `docs/shared/story.js`: ES module. `createStory({channel})` → `{state, dispatch(action), subscribe(fn), reset(), goto(scene)}`. Actions: `screen-call`, `tap-kavach`, `end-call`, `check-sms`, `decoy-turn`, `recover`, `decide`, `forbidden`. Policy gate / audit log / approvals logic ported from `mock.js`.
- `docs/shared/voice.js`: `play(clipId, {lang}) → Promise`, exposes an `AnalyserNode` for the shield pulse.
- `docs/shared/clips/*.opus` + `clips.json` (id, lang, text, speaker).
- `docs/shared/three/shield.js` (`mountShield(el, {analyser}) → {setState('idle'|'joined'|'ended'), dispose}`), `docs/shared/three/graph.js` (`mountGraph(el, graphData) → {update(graphData), dispose}`), `docs/shared/models/shield.glb`.
- `docs/index.html` (start), `docs/phone/index.html|phone.css|phone.js`, `docs/admin/index.html|admin.css|admin.js`.
- Removed: `docs/app.js`, `docs/app.css`, `docs/mock.js` (replaced). `sw.js`/manifest updated to the new files.
- `tools/voices/make_clips.py` (Indic Parler-TTS → wav → opus), `tools/blender/export_shield.py`.
- `tests/story.test.mjs` (`node --test`).

## Tasks
1. **Voices** (background): venv, `parler-tts`, `make_clips.py` writes 15 clips + `clips.json`. Check: every clip plays, 1–8 s, Kannada clip audibly Kannada.
2. **Shield model:** Blender CLI exports the shield object from `blender/kavach_call.blend` to GLB (< 1 MB). Check: loads in three.js.
3. **Story engine + tests:** port gate/approvals; add scenes and sync. Tests: approval runs gated action once; reject then approve → error; `goto('recover')` yields incident + 2 pending approvals; remote change notifies subscribers; reset clears.
4. **Tokens + start page.**
5. **Phone app** with all states, voice, shield mount, deep links.
6. **Admin app**: overview with streaming agent trace, approvals, recover, graph, audit, decoy.
7. **3D scenes**: shield + graph, fallbacks.
8. **Verify** at 1440, 1024, 390; both tabs in sync; screenshots; push GitHub; Space → `sdk: static`, push.
