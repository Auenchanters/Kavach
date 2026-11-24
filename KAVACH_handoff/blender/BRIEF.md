# KAVACH — Blender shot brief (the prompt, restructured)

## What we are building
KAVACH (Sanskrit "armour"): a voice-first, multi-agent AI that protects elderly parents from phone fraud.
wHACKiest 2026 (CodeRIT, RIT Bengaluru), **Track 1 "Make MCP Matter" — "Less magic, more utility."**
Track asks for an MCP-powered tool a regular person uses every day, working with apps they already use, with useful, reliable, controlled interactions.
Four layers: Shield (live call protection), Strike (decoy AI), Recover (golden-hour swarm), Intelligence (fraud graph).
Six MCP servers: telephony, intel, bank, report, family, knowledge. Policy gate with 3 tiers (auto / guardian-approved / never).
Users: Amma (65, protected parent), Rahul (son, guardian, gets Telegram alerts).

## This shot (the one the user asked for)
A phone mid-call with an unknown caller. The KAVACH shield icon sits on the side of the call screen.
The user taps it -> it activates instantly -> tells the user whether the caller is a scammer.
Tone: **fun and intuitive**, premium product-film quality (Heft-style). Must read at phone size with sound off.

## References
- Heft (vimeo 1246140026, "Studio in a Folder"): phone on a soft studio backdrop; UI cards float **off the glass** toward camera; numbers tick.
- Whence (vimeo 1246155969): one bold colour field, huge kinetic number ("-38%"), a floating UI card with a chart, typed caption.
- Logo (user image): 3D shield, vertical centre crease, blobby gradient indigo #2A2FD0 / violet #6B1FA8 / magenta #FF1FD0.

## Beat sheet (24 fps, 12 s = 288 f) — one clock: the `F_*` constants at the top of `build_scene.py`
| f | beat |
|---|------|
| 0–48 | Phone floats in, call screen: "Unknown · +91 98XXX XX210", timer ticking. Shield tab on right edge breathes. |
| 48–66 | Finger-tap ripple on the shield. Shield pops (overshoot) and slides onto the screen centre. |
| 66–126 | Listening: shield glows, scan ring sweeps the screen, live keywords pop as chips: "CBI", "digital arrest", "stay on video call". |
| 126–150 | Verdict card leaves the glass toward camera: **SCAM CALL** 94%, red (the loud colour). |
| 150–222 | Hold to read. Advice line: "Real police never arrest over a call. Hang up." |
| 222–288 | End-call button pulses; small toast "Rahul alerted ✓". Settle. |

## Rules applied (Studio in a Folder cheat sheet)
- AD-01 priority: product reads > light > material > motion > composition > effects.
- COL-02 one loud colour (alert red #FF3B30) used only for the verdict event; brand gradient on the shield only.
- UI-01 interface leaves the glass one way per film (verdict card lifts off). UI-05 type >= 22 px at phone size.
- TYP-06 no extruded / bevelled lettering. TYP-01 hold lines 0.8 s + 0.2 s/word.
- CAM-02 one camera move per shot; MOT-02 object acts, camera stays calm.
- Gates: brief -> hero frame -> 10 s proof in motion -> final. Approve a hero frame before any mass render.

## Open decisions for the user
- Backdrop: soft light studio (Heft) vs deep violet (brand). First pass uses deep violet.
- Language of the on-screen warning (English first pass; Kannada/Hindi later).
- Add a "safe call" contrast beat (green) before the scam? Not in first pass.

## Technical
- Blender 5.2.2 at `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe`.
- Drive it through `blender/bl.py <script.py>` (add-on socket localhost:9876, `execute_code`).
  The session's `mcp__Blender__*` tools time out: they speak a different protocol than the installed `blender_mcp.py` add-on.
- Scene is built entirely by `blender/build_scene.py` (idempotent: deletes and rebuilds the KAVACH collection).
- Stills: `python bl.py render_stills.py` -> `render/still_###.png` (half size).
- Motion preview (headless, does not block the GUI):
  `blender -b --factory-startup --python build_scene.py --python render_preview.py -a` -> `render/kavach_call_preview_0001-0288.mp4`.
  Full size: set env `KAVACH_PCT=100`.
- The timer / "94% match" counters are a frame_change_pre handler registered by build_scene.py; reopening the .blend
  without re-running build_scene.py loses them (text freezes).
