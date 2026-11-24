# KAVACH — 4-minute pitch film (SPEC)

GOAL:    a judge finishes knowing exactly what KAVACH does during and after a scam call, why it needs MCP, and that it is safe and real enough to build in 24 h.
OUTPUT:  HyperFrames, 1920 x 1080, 30 fps. Blender clips (24 fps, 1080p) embedded as muted video.
TIME:    ~240 s x 30 = ~7200 frames. Narrated: the ElevenLabs voice is the clock (vo/segments.json -> vo/timing.json).
         Gaps: 0.35 s between lines in a scene, 0.8 s between scenes. Opening 4.0 s has no voice.

LOOK (same medium as the Blender phone film: a light graphite product studio with dark UI objects)
  ground:  radial #F4F4F5 centre -> #C9C9CC edge, flat, no grain, no vignette.
  objects: dark UI cards #19191B with a 1 px #2C2C2F hairline, radius 24 px (cards), 14 px (rows), soft neutral shadow
           0 24px 48px rgba(0,0,0,0.14). The phone is the Blender phone (graphite titanium).
  ink:     on ground #171717 / #525252 / #737373; on cards #EDEDED / #A1A1A6 / #85858B.
  accent:  indigo #2A2FD0 (on cards #6C70F0): KAVACH itself, the active layer, the one highlighted word per shot.
  semantic: red #E5484D only for scam / loss / "never allowed"; green #4CC38A only for safe / done / "automatic";
           amber #F5A524 only for "needs approval".
  type:    Segoe UI (local) 400 and 600 only. Display 96-140 px, -2% tracking, 1-2 lines. Body/labels 30-40 px.
           Figures in Consolas (local) for counters, IDs, phone numbers, server names. Sentence case, no trailing periods.
  shield:  the Blender steel + indigo enamel shield (rendered PNG/video), never redrawn as a flat icon.

OBJECTS: phone (Blender), shield (Blender), Telegram alert card (dark card, green dot, buttons Approve / Call Amma),
         debit SMS card, 1930 helpline, decoy waveform, UPI/mule tags as mono rows, fraud graph (nodes = numbers, UPI IDs,
         accounts; edges = shared mule accounts), architecture stack (5 slabs), policy gate (3 lanes), six server blocks,
         vault (banking apps, locked), India map (Natural Earth, India point of view).

MOTION:  enter expo.out 0.6-0.8 s; move power2.inOut 0.8-1.2 s; exit power3.in 0.35-0.45 s (45% of enter).
         Text: whole line blur 8 px -> 0 in 0.18 s, or per word blur 6 px -> 0, 0.08 s apart. Lists stagger 0.06 s.
         Counters tween with the voice, tabular figures. One hero move per shot; landed titles hold dead still.
         Transitions (5 kinds, each caused): object becomes the world (phone -> stat), blur swap on one stage,
         carry across (verdict card -> Telegram card), colour flood (ground -> #19191B for the architecture dive), dip cut.

SHOTS (scene: voice segments -> picture)
  open   0-4 s      Blender: phone ringing "Unknown +91 98XXX XX210", slow push. No voice; vibration + ring.
  hook   s1a-s1d    numbers that land, one per line, set huge: 32.4M calls · ₹22,931 cr · 3 of 4 rupees (four ₹ coins,
                    three go grey) · 1,03,488 seniors / ₹4,005 cr. Each number counts up on its anchor word.
  fail   s1e-s1g    myth turned over: three failing tools as dark rows struck through (awareness / caller ID with
                    SIMs rotating / helpline with a 60:00 golden-hour clock running). Last line: the phone alone, empty
                    space on its right = "nobody stands between".
  meet   s2a-s2c    the Blender shield lands in that empty space -> "KAVACH" title; Amma (65) and Rahul (guardian) as
                    two person cards; four concentric hairline rings around Amma light one by one (Shield, Strike,
                    Recover, Intelligence); MCP lines draw out to Phone, SMS, WhatsApp, Bank alerts, 1930, NCRP,
                    Sanchar Saathi.
  shield s3a-s3c    routing: trusted contacts pass (green), unknown -> screening. Then the Blender phone film
                    (tap -> listening -> verdict). Then carry across: verdict card -> Rahul's Telegram alert card;
                    side panel: SMS link -> voice-note reply.
  strike s3d-s3e    a red scam line reroutes into "Decoy: retired teacher" card; waveform talks; extraction rows pop:
                    UPI ID, mule account, phone; arrow to Sanchar Saathi Chakshu (pending approval).
  recover s3f-s3g   debit SMS "₹48,000 debited" (red) -> tap "I've been cheated" -> one line splits into four lanes
                    lighting together; golden-hour clock stops at 00:01:12 used; "Waiting for Rahul" approval chip.
  intel  s3h        fraud graph densifies: nodes added as they are named, one ring of 7 nodes lights up red.
  arch   s4a-s4g    colour flood to graphite; isometric stack of 5 slabs built top-down as each is named:
                    Voice (ElevenLabs) -> Orchestrator (Shield / Strike / Recover / Guardian) -> Policy gate (3 lanes:
                    green automatic, amber needs approval, red never) -> six server blocks in mono -> outside world.
                    Camera descends one slab per segment.
  safety s5a-s5b    phone x-ray: vault "Banking & UPI apps" with a lock, red dashed exclusion; three green consent pipes.
  scope  s5c        two columns, real vs mocked, rows tick in as named.
  roadmap s6a       India map (point of view: India) with shield nodes in cities; roadmap rail:
                    Dec 2026 prototype -> pilot 50 families -> banks, telecoms, more languages.
  close  s6b        the Blender end card: shield, KAVACH, "No Amma left alone with a scammer", Track 1 credit. Hold 2.5 s.

SOUND:   ElevenLabs voice at 1.0; CC0 music bed (Space Ranger loop, Nostromo) at 0.14 under the voice, up to 0.3 in
         the 4 s opening and the end card; CC0 Kenney effects only on visible actions (counter pops, card lands,
         scene whooshes rotated across 3 takes, approval click). Mix -14 LUFS, true peak <= -1 dBTP. Measured, not heard.

BANNED:  dark navy void; glow, bloom, neon, glowing rings; purple/blue gradients, glass cards; cream paper + serif;
         numbered 01/02 labels and mono caps labels; pill chips everywhere; everything centred; everything fading up;
         text moving while read; HUD corner brackets; three cards in a row; KPI grids; logo docked in a corner;
         bullet slides; a narrator line repeated word for word on screen; emoji; exclamation marks.

QA:      check every scene at its first anchor word and at its last frame; type >= 28 px; no text over the phone UI;
         the stats match the team brief exactly; India map shows India's official boundary (Natural Earth IND view).
