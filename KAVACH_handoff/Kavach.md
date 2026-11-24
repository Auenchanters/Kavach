# KAVACH: the complete handoff

One file that replaces the chat history. Anyone (a teammate, or a fresh Claude session) should be able to read
this and carry on: what the hackathon is, what KAVACH is, what has been built, how it was built, and the plan for
stage two, the 24-hour build.

- Written: 22 November 2026 (end of stage one: idea, brief, product film, pitch film)
- Stage two: prepare everything we can before the build, then build KAVACH in 24 hours on 1–2 December 2026
- Where things live: project root `Rit code hackathon/` (paths below are relative to it)
- Companion zip: `KAVACH_handoff.zip` (this file, the source briefs, the films, all source code and assets; no secrets)

Zip layout (`KAVACH_handoff/`): `Kavach.md` · `docs/` (the four source PDFs) · `films/` (the pitch film v4 and the
15 s Blender film; in the project they sit in `pitch/renders/` and `blender/render/`) · `blender/` (scripts, brief,
.blend, CC0 sounds) · `pitch/` (build.py, scene sources, generated compositions, voice scripts, timing, assets).
Not included on purpose: `pitch/.env` (API key), the teammate's raw recordings, the voice venv, old renders and old
ElevenLabs clips, `music_bed.wav` (build.py regenerates it).

---

## Contents

1. Status at a glance
2. The hackathon: wHACKiest 2026
3. Our track: Track 1, Make MCP Matter
4. The problem statement
5. The solution: KAVACH
6. How it works for Amma and Rahul
7. System architecture
8. Agents, MCP servers and tools
9. Policy gate and action tiers
10. Tech stack and repository layout
11. Guardrails, privacy, legal, and what we can and cannot access
12. The 3-minute live demo
13. Phase 1 pitch deck (12 slides)
14. Judge questions and our answers
15. Costs, risks and mitigations
16. Roadmap
17. What we have built so far (stage one products)
18. The build system (how every product was made)
19. Design system (look, type, colour, motion)
20. Websites and sources we used
21. Stage two plan: what to prepare before the hackathon
22. The 24-hour build plan
23. Open questions and decisions waiting on the team
24. Environment, accounts and security notes
25. Lessons learned (traps to avoid)

---

## 1. Status at a glance

| Item | State |
|---|---|
| Idea | KAVACH, agreed. Track 1 (Make MCP Matter). |
| Team brief (PDF) | Done: `docs/KAVACH_Team_Brief.pdf` (20 Nov 2026). The source of truth for product and plan. |
| 15-second product film (Blender) | Done: `blender/render/kavach_call_1080p_sound.mp4` (1080p, 24 fps, CC0 sound). |
| 4-minute pitch film | Done, v4: `pitch/renders/kavach_pitch_1080p_v4.mp4` (4:12, 1080p 30 fps, teammate's voice, -14.2 LUFS). |
| Idea PPT for registration | **Not built in this project.** Due on Devnovate by **24 Nov 2026, 11:59 PM IST**. Outline in section 13. |
| Online presentation round | 26–27 Nov 2026. The pitch film and the PPT are the material. |
| Shortlist | 28 Nov 2026. |
| 24-hour build | 1 Dec 2026, kick-off 00:00 IST, at Ramaiah Institute of Technology (RIT), Bengaluru. Demos 2 Dec. |
| Product code | **None written yet.** Section 21 lists what to prepare first; section 23 says what to check with organisers. |

---

## 2. The hackathon: wHACKiest 2026

Facts from the official site (whackiest-2026.vercel.app, read 22 Nov 2026) and its Announcements page.

- **Organiser:** CodeRIT, the official coding club of Ramaiah Institute of Technology (Dept. of Computer Science
  and Engineering). National level, 24 hours, offline.
- **Who can enter:** 1st, 2nd and 3rd year undergraduate engineering students. Teams of **2–4**, all from the
  **same college** (branches and years may differ). No solo entries. One team per person. Bring college ID.
- **Fee:** none at any stage.
- **Prize pool:** ₹1,50,000. Split and special awards "to be announced".
- **Registration:** on Devnovate (devnovate.co/event/whackiest). The team leader creates the team and invites
  members; the **idea PPT is attached in the registration questions**. There is no later PPT stage.
- **Round 1 is judged on the idea and PPT only** (problem, solution, why it matters). No code needed.
- **Sponsors:** Tryb (title sponsor), Devnovate (hosting partner), ElevenLabs, .xyz, AWS Student Builder Group.
  ElevenLabs and AWS matter to us: we use ElevenLabs Agents and can ask about AWS credits.
- **Venue:** Ramaiah Institute of Technology, MSR Nagar, MSRIT Post, Bengaluru, Karnataka 560054.
- **Contact:** coderit@msrit.edu (student coordinators' phone numbers are listed on the site).

### Timeline

| Date (2026) | What |
|---|---|
| 19 Nov | Problem statements released (online) |
| **24 Nov, 11:59 PM IST** | **Registration + idea PPT closes** |
| 26–27 Nov | Online presentation round (ideation and proposal) |
| 28 Nov | Shortlist announced on the site's Shortlisted Teams page |
| 1 Dec, 00:00 IST | 24-hour build starts, offline at RIT |
| 2 Dec | Demos and evaluation |

### The four tracks (for context)

1. **Make MCP Matter** (ours): MCP-powered agents a regular person uses every day. "Less magic, more utility."
2. **Beyond the Browser:** browser agents that make the web smoother and more accessible.
3. **Know Thyself:** personal intelligence from phone, watch and fitness data, privacy first.
4. **UnlockED** (mystery track): education, skills and employment for underserved communities.

---

## 3. Our track: Track 1, Make MCP Matter

The track asks for an MCP-powered solution an ordinary person would use every day: intelligent agents that work
with the apps, services and tools people already rely on, going beyond basic integrations, with useful, reliable
and controlled interactions. Tagline: **"Less magic, more utility."**

| What the track asks for | How KAVACH delivers it |
|---|---|
| MCP-powered | Six custom MCP servers (telephony, intel, bank, report, family, knowledge). ElevenLabs agents call MCP servers directly. |
| Used daily by an ordinary person | Every unknown call and suspicious message is screened, every day. The user is a 65-year-old parent. No new habits. |
| Works with what people already use | Phone dialer, SMS, WhatsApp, bank debit alerts, Telegram for family, plus 1930, cybercrime.gov.in, Sanchar Saathi Chakshu, RBI Account Aggregator. |
| Beyond basic integrations | Live scam detection, a live decoy conversation, entity extraction, a parallel recovery swarm, a shared fraud graph. |
| Useful | Measurable: calls blocked, scammer minutes wasted, mule accounts reported, money held in the golden hour. |
| Reliable | Rules + LLM judgement; every external action logged; fallbacks (e.g. the 1930 call script even if online filing fails). |
| Controlled | Three action tiers (automatic, guardian-approved, never allowed). Decoy uses only fake data. Never reads banking apps. |

Why this idea can win (patterns from recent winners, from the brief): protects vulnerable people; agents act
instead of chatting; native-language voice (sponsor ElevenLabs); visible guardrails; a working system rather
than slides.

---

## 4. The problem statement

India's digital payments boom made fraud fast, cheap and industrial. Scammers pose as police, CBI, bank staff or
couriers and pressure victims into transferring money within minutes. Elderly parents, first-time smartphone
users and people afraid of authority are hit hardest.

| Number | Meaning | Source |
|---|---|---|
| 32.4 million | calls to the 1930 cybercrime helpline in 2025, about one victim every second | Moneylife |
| 3 of 4 | rupees lost to cyber fraud are never recovered | Moneylife |
| ₹22,931 crore | lost across about 28 lakh reported cases in 2025 | Outlook Money (NCRP data) |
| 1,03,488 | senior citizens filed fraud complaints in 2025, worth ₹4,005 crore | MHA data in Rajya Sabha, via NewKerala |
| ₹1,250 crore | stolen from Delhi residents alone in 2025; "digital arrest" and fake investment scams dominate | Deccan Herald |
| 1 hour | the golden hour: reporting on 1930 within it gives a real chance of freezing the money | Moneylife |
| 39 lakh | fraud-linked mobile connections disconnected via Sanchar Saathi Chakshu | ANI / NewKerala |

**Why today's answers fail**

| What exists | Why it isn't enough |
|---|---|
| Awareness campaigns | Scams work through fear and urgency, not ignorance. Educated retirees still lose crores. |
| Caller-ID spam labels | Only flag known numbers; scammers rotate SIMs; a label can't talk a panicking person down. |
| 1930 and cybercrime.gov.in | Work only if the victim acts within minutes with every detail ready. In shock, most lose the golden hour. |
| Sanchar Saathi Chakshu | Powerful, but depends on citizens filing reports by hand. Most never do. |

**The gap:** nobody stands between the victim and the scammer *during* the call, and nobody acts for the victim
in the minutes *after* it. Both moments need speed, calm and process knowledge, which is what agents are good at.

---

## 5. The solution: KAVACH

KAVACH is a voice-first, multi-agent AI system that protects families from phone and online fraud, starting with
elderly parents. Its agents reach the outside world only through MCP tools: the phone, SMS, WhatsApp, bank alerts,
and India's official fraud channels.

One-line pitch: *"Every second, an Indian falls victim to fraud. KAVACH puts a team of AI agents between your
parents and the scammer. It warns them, fights back, and if money is lost, it races the clock to get it back."*

Closing line used everywhere: **"No Amma left alone with a scammer."**

Note: the Sanskrit meaning ("armour") was deliberately **removed from the narration** at the team's request.
Pronunciation of KAVACH: kuh-VUTCH.

### The four layers

| Layer | When | What it does |
|---|---|---|
| **Shield** | every day | Screens unknown calls and messages; detects scam patterns live; warns the user in Kannada, Hindi or English; alerts the guardian. |
| **Strike** | when a scammer calls | A decoy AI persona (a chatty, slightly confused retiree, fake details only) keeps the scammer talking, draws out UPI IDs and mule accounts, drafts reports to Chakshu and banks. |
| **Recover** | if money is lost | Four agents in parallel inside the golden hour: bank block/hold request, 1930 briefing, pre-filled cybercrime complaint, time-stamped evidence pack. |
| **Intelligence** | always | Every confirmed number, URL, UPI ID and account becomes a node in a shared fraud graph; links reveal scam rings; one family's attack protects thousands. |

Shield details:
- **Call screening:** saved contacts ring normally. Unknown numbers are checked against the scam database; risky
  ones are answered first by KAVACH ("Who's calling, and why?"). Genuine callers are put through with a summary.
- **Live-call protection:** a large KAVACH button on the call screen adds KAVACH as a **conference participant**.
  It listens for scam patterns (digital arrest, KYC expiry, parcel with drugs, electricity cut-off, investment
  tips), announces that the call is monitored, and tells the user calmly to hang up.
- **Message checks:** SMS scanned automatically; WhatsApp messages forwarded to the KAVACH number; links and
  numbers checked; verdict returned as a **voice note**.
- **Family alert:** the guardian is told instantly in plain words.

Strike: inspired by UK operator O2's "Daisy" (kept scammers on the line up to 40 minutes). KAVACH's decoy also
steers the scammer into revealing payment details, then files reports to official channels.

---

## 6. How it works for Amma and Rahul

Two users: **Amma**, 65, Bengaluru, speaks Kannada, the person protected; **Rahul**, her son, the guardian.

1. **Setup (5 minutes, once, by Rahul):** installs KAVACH on Amma's phone, sets Kannada, adds himself as guardian,
   saves trusted contacts, turns on call screening and forwarding of suspicious calls.
2. **Unknown number calls:** KAVACH checks it. A known courier or hospital goes through with a summary. A
   high-risk number is answered by KAVACH; a scammer goes to the Strike decoy and Amma's phone never rings.
3. **Amma already picked up and it turns suspicious:** she taps the big KAVACH button. KAVACH joins, tells the
   caller the call is monitored, and tells Amma in Kannada: "This is a scam. Real police never arrest anyone over a
   video call. Please hang up." Rahul gets an instant alert.
4. **A suspicious message arrives:** Amma gets a voice note: "Don't click this link. It's a fake electricity-bill
   message."
5. **Money is lost anyway:** Amma or Rahul taps "I've been cheated". The Recover swarm starts. Rahul approves each
   official submission with one tap.
6. **Rahul's dashboard:** live alerts, approvals, weekly report ("4 scam calls blocked, 2 fake links stopped, 1
   scammer kept busy for 26 minutes").

Example alert Rahul receives (Telegram):

```
🛡 KAVACH ALERT · 11:42 AM
Amma received a "digital arrest" scam call from +91 98XXX XX210.
• Caller claimed to be a CBI officer and asked her to stay on a video call.
• KAVACH joined the call, warned Amma, and the caller hung up.
• No money was moved. Number reported to Sanchar Saathi (pending your approval).
[ Approve report ]  [ Call Amma ]  [ View transcript ]
```

**Why a conference call:** Android does not let ordinary apps listen to call audio. A three-way conference works on
every phone and is transparent (everyone knows KAVACH is there). Forwarding unknown or rejected calls uses standard
carrier call-forwarding codes; Android's call-screening role lets an app label and filter incoming calls.

---

## 7. System architecture

Agents never talk to outside systems directly. They call MCP tools; every tool call passes a **policy gate** that
enforces the action tiers and writes the **audit log**.

```
 Amma's phone            Scammer                     Rahul (guardian)
 calls·SMS·WhatsApp·     calls Amma or a             dashboard · Telegram alerts
 KAVACH button           decoy number
        │                     │                            ┆
        ▼                     ▼                            ┆
 ┌──────────────── Voice layer: ElevenLabs Agents ────────────────┐
 │ speech-to-text · text-to-speech · turn-taking · kn / hi / en   │
 └────────────────────────────────┬───────────────────────────────┘
                                  ▼
 ┌──────────────── KAVACH Orchestrator (Python · FastAPI) ────────┐
 │ Shield agents   Strike agents    Recover swarm    Guardian     │
 │ Call Screener   Decoy Persona    Bank · 1930      Alerts &     │
 │ Scam Detector   Intel Extractor  Complaint ·      approvals    │
 │ Msg Checker     Reporter         Evidence (par.)  Weekly rpt   │
 └────────────────────────────────┬───────────────────────────────┘
                                  ▼
 ┌─ Policy gate: automatic · needs guardian approval · never allowed → audit log ─┐
                                  ▼
 MCP servers (streamable HTTP)
 telephony │ intel │ bank │ report │ family │ knowledge
                                  ▼
 Outside world: phone network · bank alerts / Account Aggregator · 1930 · cybercrime.gov.in · Sanchar Saathi · Telegram
```

In the hackathon demo, external systems without public APIs are mocked (bank actions, Account Aggregator,
1930 / NCRP / Chakshu submission).

### Data flow for a live scam call

1. Amma taps the KAVACH button; the call audio reaches the ElevenLabs agent.
2. The Scam Detector scores each sentence with rules (keywords like "digital arrest", "CBI", "parcel", "KYC") plus
   an LLM judgement, and calls `intel.check_number`.
3. Past the threshold, the agent speaks the warning to Amma and calls `family.notify_guardian` (automatic tier).
4. The transcript goes to the Intel Extractor, which pulls numbers, UPI IDs and claimed identities and drafts a
   `report.file_chakshu` request (approval tier).
5. Rahul approves on Telegram; the report is filed (mocked) and the fraud graph updates on the dashboard.

---

## 8. Agents, MCP servers and tools

### Agents

| Agent | Job | Main MCP servers |
|---|---|---|
| Orchestrator | Routes events (incoming call, SMS, button press, "I've been cheated"); tracks incident state | all, via the policy gate |
| Call Screener | Answers unknown risky calls, asks purpose, passes genuine callers through with a summary | telephony, intel |
| Scam Detector | Scores live transcripts and messages against scam playbooks; decides when to warn | knowledge, intel |
| Message Checker | Checks SMS and forwarded WhatsApp text, links and numbers; replies with a voice note | intel, knowledge |
| Decoy Persona | Talks to scammers with fake details only; steers toward payment details | telephony, knowledge |
| Intel Extractor | Pulls structured entities (numbers, UPI IDs, accounts, scripts) from transcripts | intel |
| Recover swarm (4) | Bank, 1930, Complaint, Evidence agents, in parallel after a loss | bank, report, family |
| Guardian agent | Alerts, approvals, weekly reports | family |

### MCP servers (Python, official MCP SDK / FastMCP, streamable HTTP)

| Server | Tools | Demo vs. production |
|---|---|---|
| `kavach-telephony` | `answer_call`, `join_conference`, `speak_warning`, `transfer_to_decoy`, `end_call` | Demo: browser voice widget. Production: Exotel / SIP numbers. |
| `kavach-intel` | `check_number`, `check_url`, `add_entity`, `link_entities`, `get_fraud_graph` | Real: our own DB and graph, seeded with sample data. |
| `kavach-bank` | `parse_debit_sms`, `list_transactions`, `request_block`, `request_hold` | SMS parser real; Account Aggregator and bank actions mocked. |
| `kavach-report` | `prepare_1930_brief`, `draft_ncrp_complaint`, `file_chakshu`, `get_status` | Drafts real; submission mocked (no public APIs). |
| `kavach-family` | `notify_guardian`, `request_approval`, `send_voice_note`, `weekly_summary` | Real, via Telegram Bot API. |
| `kavach-knowledge` | `match_scam_pattern`, `get_safe_advice` | Real: playbooks written from RBI, DoT and I4C advisories. |

---

## 9. Policy gate and action tiers

| Tier | Examples |
|---|---|
| **Automatic** | Check a number or link, warn Amma, alert Rahul, end a call to a confirmed scam number, log evidence. |
| **Needs guardian approval** | File a Chakshu report, submit a cybercrime complaint, request a card block or bank hold, share a transcript with police. |
| **Never allowed** | Share Amma's real details on a call, move money, impersonate police or officials, read banking or UPI apps. |

Every tool call goes through the gate, gets a tier, and is written to the audit log (time, agent, tool, args,
decision). The pitch film shows one log line: `audit log · 12:04:41 · move_money → blocked`.

---

## 10. Tech stack and repository layout

Chosen to be buildable in 24 hours, free or nearly free, and to use the event's sponsors (ElevenLabs, AWS).

| Layer | Choice | Why |
|---|---|---|
| Voice agent | ElevenLabs Agents | Sponsor. STT, TTS, natural turn-taking; connects to external MCP servers over SSE or streamable HTTP with tool approval modes. Hindi and English native; **test Kannada on day one**. |
| LLM | Gemini Flash (free tier), or the LLM built into ElevenLabs Agents | Fast and free for scoring, extraction, orchestration. |
| MCP servers | Python + official MCP SDK (FastMCP), streamable HTTP | One small service per server. |
| Orchestrator | Python, FastAPI; LangGraph optional for the Recover swarm | Event routing, incident state, policy gate, audit log in one service. |
| Database | PostgreSQL (Supabase free) or SQLite | Incidents, contacts, audit log, approvals. |
| Fraud graph | NetworkX in memory; Neo4j Aura Free if time | Links numbers, UPI IDs and accounts into rings. |
| Guardian dashboard | Next.js + Tailwind; react-force-graph | Live alerts, approvals, transcripts, graph animation. |
| Amma's phone (demo) | Mobile web app (PWA) styled as a call screen with the KAVACH button | Any phone browser; no app store or telephony setup. |
| Family alerts | Telegram Bot API | Free, instant, inline Approve / Reject buttons. |
| Hosting | AWS (ask about credits) or Render for backend; Vercel for frontend | Free tiers suffice. |
| Dev tools | GitHub, ngrok (expose local MCP servers), Postman / MCP Inspector | Fast iteration. |
| Production (roadmap only) | Native Android (Kotlin) with call-screening role, SMS access, conference merge; Exotel numbers; Account Aggregator as licensed data user | Shown on the roadmap slide, not built in 24 h. |

```
kavach/
├── orchestrator/    FastAPI app · event router · policy gate · audit log
├── agents/          prompts + logic per agent (shield, strike, recover, guardian)
├── mcp/
│   ├── telephony/   answer_call, join_conference, speak_warning …
│   ├── intel/       check_number, check_url, fraud graph
│   ├── bank/        parse_debit_sms, AA mock, block / hold mock
│   ├── report/      1930 brief, NCRP draft, Chakshu (mock)
│   ├── family/      Telegram bot, approvals
│   └── knowledge/   scam playbooks + safe-advice scripts
├── web/
│   ├── dashboard/   Next.js guardian dashboard + fraud graph
│   └── phone/       PWA call screen with KAVACH button
├── data/            seed scam numbers, sample SMS, mock bank data
└── docs/            demo script, pitch deck, architecture
```

---

## 11. Guardrails, privacy, legal, and what we can and cannot access

| Concern | How KAVACH handles it |
|---|---|
| Consent | Amma and Rahul consent at setup. KAVACH announces itself on every call it joins. Everything can be switched off. |
| Call recordings | Analysed live. Transcripts kept only for incidents, with consent, deletable. Raw audio not stored by default. |
| The decoy | Ordinary-citizen persona, never police or officials. Fake names, accounts, addresses only. Never sends money. |
| Reporting | Only to official channels (Chakshu, 1930, cybercrime.gov.in, banks). Never publishes or shames numbers. |
| False positives | A wrong warning costs seconds; KAVACH explains why. Trusted contacts never screened. Rahul can whitelist. |
| Data protection | Minimal, encrypted, deletable, in line with India's DPDP Act. Graph holds scammer identifiers, not victims' data. |
| Human in the loop | Anything with legal or financial consequences needs guardian approval. |

**KAVACH never reads banking or UPI apps.** The only way would be Android's Accessibility permission, which is
exactly how banking malware steals OTPs. Google Play policy says assistants and monitoring apps aren't accessibility
tools, and Android 17 Advanced Protection restricts that access. Say it as a strength: *"KAVACH never reads your
banking screens. That's exactly how scammers' malware works. We use only official, consent-based channels."*

Legitimate channels instead: bank debit SMS / email alerts (with permission); RBI's Account Aggregator framework
(consent-based, read-only, aggregators are data-blind; mocked in the demo); bank partnerships (future: banks query
the fraud graph before paying new payees).

---

## 12. The 3-minute live demo

Three screens on stage: Amma's phone (PWA on a real phone, mirrored), Rahul's Telegram, the guardian dashboard with
the fraud graph. Rehearse at least five times; record a backup video.

| Time | What happens |
|---|---|
| 0:00–0:20 | **Hook.** "Last year, Indians lost ₹22,931 crore to cyber fraud. Most of it was never recovered. Meet Amma." |
| 0:20–1:10 | **Shield.** A teammate calls Amma as a fake CBI officer ("Your Aadhaar was used for money laundering…"). Amma taps KAVACH. KAVACH warns her in Kannada and tells the caller the call is monitored. Rahul's Telegram buzzes. |
| 1:10–1:50 | **Strike.** The "officer" calls the decoy number. The AI plays a confused retiree and asks where to send the "security deposit". The scammer reveals a UPI ID; on the dashboard it links to an existing scam ring. |
| 1:50–2:30 | **Recover.** A fake debit SMS of ₹48,000 arrives. One tap on "I've been cheated". Four agents light up in parallel. Rahul approves on Telegram. Timer: "Golden hour: 00:01:12 used". |
| 2:30–3:00 | **Close.** Audit log and action tiers. "KAVACH never reads your banking apps, never shares real data, and asks the family before acting. Six MCP servers, one mission: no Amma left alone with a scammer." |

**Backup plan:** a text-mode fallback (typed scam transcript → same agents → same dashboard) and the recorded video,
in case of venue Wi-Fi or voice latency problems. The pitch film (section 17) is also usable as a fallback.

Demo constants already used in the films (keep them consistent): scammer `+91 98XXX XX210`, second number
`+91 70XXX XX451`, UPI ID `refund.cbi@ok····`, mule account `HDFC ····4471`, debit SMS "₹48,000 debited from A/c
····4471 via UPI. Not you? Call 1800 202 6161", alert time 11:42, golden-hour timer stops at 00:01:12, decoy
"retired teacher, 67", scam SMS "Power will be cut tonight. Pay now at bit.ly/eb-bill".

---

## 13. Phase 1 pitch deck (12 slides)

Due with registration on Devnovate by **24 Nov, 11:59 PM IST**. Round 1 judges idea and PPT only.

| # | Slide | Content |
|---|---|---|
| 1 | Title | KAVACH · tagline · team · Track 1 |
| 2 | A real story | One digital-arrest case: a retiree, a fake CBI call, life savings gone |
| 3 | The problem in numbers | 32.4 mn calls to 1930; 3 of 4 rupees not recovered; ₹4,005 cr lost by seniors; the golden hour |
| 4 | Why current solutions fail | Nobody stands with the victim during and after the attack |
| 5 | Meet KAVACH | Shield, Strike, Recover, Intelligence |
| 6 | How Amma uses it | The user journey as a storyboard |
| 7 | Architecture | Agents, policy gate, six MCP servers |
| 8 | Why it's safe | Action tiers, fake-data decoy, no banking-app access, consent |
| 9 | Track 1 fit | Track wording vs. KAVACH |
| 10 | Tech stack and feasibility | Stack; real vs. mocked in 24 h; near-zero cost |
| 11 | Impact and roadmap | Metrics; Android app; telecom and bank partnerships |
| 12 | Closing | "No Amma left alone with a scammer." Team and contact |

Stills from the pitch film can be used as slide visuals (render any frame with `npx hyperframes snapshot --at <s>`
in `pitch/`, see section 18).

---

## 14. Judge questions and our answers

| Question | Answer |
|---|---|
| Hasn't the UK already built this? | O2's Daisy only wastes scammers' time on its own numbers. KAVACH protects a specific family in real time, recovers money in the golden hour, maps the fraud network, and works in Indian languages through India's official channels. |
| How is this different from Truecaller? | Caller-ID labels known numbers. KAVACH understands what's said, intervenes during the call, acts after a loss, and turns every attack into intelligence. |
| Why MCP? | Each capability is a reusable MCP server. Any agent, including future bank or telecom agents, can plug in. The policy gate controls every tool call in one place. |
| Can it read UPI apps? | No, by design. Only malware does that. We use bank alerts and RBI's Account Aggregator. |
| What if the AI is wrong? | Warnings are cheap and explained. Anything legal or financial needs family approval. Everything is logged. |
| Is the decoy legal? | Ordinary-citizen persona with fake data, like Daisy; reports only to official channels; never impersonates officials or sends money. |
| Who pays? | Free for families; banks, telecoms and insurers license the fraud-intelligence feed. |
| What's real and what's mocked? | Real: voice agents, scam detection, all six MCP servers, fraud graph, Telegram approvals, SMS parsing. Mocked: bank actions, Account Aggregator, 1930 / NCRP / Chakshu submission (no public APIs). |

---

## 15. Costs, risks and mitigations

**Costs:** Phase 1 is free. The build is ₹0 to about ₹500.

| Item | Cost | Notes |
|---|---|---|
| ElevenLabs Agents | ₹0, or ~₹100 first month | Free: 15 call minutes/month. Starter: $1 first month, then $6, 75 minutes. Buy Starter for rehearsals. |
| LLM | ₹0 | Gemini Flash free tier, rate limited. |
| Phone numbers | ₹0 (skip for demo) | Browser voice widget. Indian numbers need paperwork; Twilio trial only calls verified numbers. |
| Hosting | ₹0 | Vercel, Render or AWS free tier; ask organisers about AWS credits. |
| Telegram, GitHub, ngrok | ₹0 | Free tiers. |

Recheck pricing before 1 December; free limits change.

| Risk | Mitigation |
|---|---|
| Kannada voice quality in the agent | Test on day one. If weak: demo in Hindi and English, Kannada on the roadmap, or try an Indic provider such as Sarvam AI. |
| Voice latency on stage | Fast model, short prompts, phone hotspot as backup internet, recorded video. |
| Live demo failure | Text-mode fallback, backup video, five or more rehearsals. |
| Legality of the decoy | Never impersonates officials, fake data only, reports only to official channels. |
| False positives | Trusted contacts bypass screening; warnings explain why; guardian can whitelist. |
| Scope creep | Shield first, then Recover, then Strike. Feature freeze at hour 20. Mock anything without a public API. |
| Free-tier limits | One shared account per service; text mode for development; save voice minutes for rehearsals. |
| ElevenLabs API on the free plan | **Learned in stage one:** the free plan returns 402 for library voices via the API, and 192 kbps output needs Creator. Buy Starter (or higher) before the event and verify with a real API call. |

---

## 16. Roadmap

1. **Hackathon (Dec 2026):** voice agents, six MCP servers, dashboard, mocked official systems.
2. **Pilot:** Android app with call screening and conference join; real numbers through Exotel; 50 families.
3. **Partnerships:** banks and telecoms license the fraud graph; Account Aggregator access.
4. **Scale:** more Indian languages; other vulnerable groups (first-time smartphone users, small shop owners).
   KAVACH stays free for families.

---

## 17. What we have built so far (stage one products)

### 17.1 The 15-second product film (Blender)

- **File:** `blender/render/kavach_call_1080p_sound.mp4` (1920×1080, 24 fps, 15 s, about -14.9 LUFS, 5.6 MB).
- **Story:** a graphite phone in a light studio is mid-call with an unknown number; a typed caption "Is this call
  real?"; the KAVACH shield on the side of the call screen is tapped; KAVACH listens (waveform, transcript chips);
  a risk meter fills to 94%; a verdict card lifts off the glass: **Scam call · Digital arrest · Fake CBI officer**,
  "Hang up now"; a macro punch-in on the card; the call is hung up → "Call ended", number blocked, report waiting for
  Rahul's approval; end card with shield, KAVACH, "No Amma left alone with a scammer", Track 1 credit.
- **Look:** light graphite studio; the shield is half brushed steel, half indigo enamel (team chose this over the
  logo's gradient after an "unslop" pass that removed AI-looking glow and gradients).
- **Variants:** `pitch/assets/video/phone_film.mp4` and `phone_film_nocap.mp4` (no caption, used inside the pitch
  film), `pitch/assets/video/open_ring.mp4` (5 s incoming-call buzz used as the pitch film's opening),
  `pitch/assets/shield.png` (1200×1200 transparent shield still).
- Older previews kept in `blender/render/` (violet look, v3, v4 unslop) for reference only.

### 17.2 The 4-minute pitch film

- **File:** `pitch/renders/kavach_pitch_1080p_v4.mp4` (4:12, 1920×1080, 30 fps, 27 MB, -14.2 LUFS, peak -1.0 dBFS).
- **Narration:** a teammate's real voice (recorded on a phone, read from `pitch/vo/RECORDING_SCRIPT.md`), cleaned
  and level-matched. Two lines were said differently from the script; the script was updated to match.
- **Music:** "Calm Ambient 3 (Lifewave 2k)" by The Cynic Project, CC0, about 18 dB under the voice and ducked
  further while speaking. Sound effects: Kenney Interface and Sci-fi packs, CC0, at half volume.
- **13 scenes** (all timed to the narration's words):

| Scene | Content |
|---|---|
| open | the Blender incoming-call buzz |
| hook | "every second" counter; 32.4M calls; ₹22,931 cr; 3 of 4 rupees coins; 1,03,488 seniors; ₹4,005 cr |
| fail | three struck-through rows: awareness campaigns, Caller-ID apps ("warn you · can't act for you"), official helplines with a golden-hour clock; Amma and the scammer with an empty slot between them |
| meet | the shield lands in the slot; KAVACH title + Track 1 credit; Amma and Rahul; four rings Shield/Strike/Recover/Intelligence; channels (phone, SMS, WhatsApp, bank alerts, 1930, cybercrime.gov.in, Sanchar Saathi) |
| shield | Mom rings normally vs. unknown number screened; the Blender phone film; Rahul's alert card; SMS + voice-note reply |
| strike | scam call → decoy AI retiree (live waveform, call timer) → extracted UPI ID, mule account, second number → reports drafted, needs Rahul's approval |
| recover | debit SMS + "I've been cheated" → four agents in parallel → golden-hour clock 00:01:12 → all four waiting on approval |
| intel | fraud graph builds node type by node type; one scam ring turns red; green dots for every family protected |
| arch | studio floods dark; "a chatbot with bolted-on plugins" struck out; the stack builds top-down (voice layer, orchestrator, policy gate with three tiers and audit line, six FastMCP servers, outside world); bank and telecom agents plug in |
| safety | phone with locked banking/UPI vault, OTP blocked at the fence; consent-based channels only; DPDP Act |
| scope | Real vs. Mocked columns |
| roadmap | India map with city mesh; Dec 2026 prototype → pilot → scale; always free for families |
| close | "Less magic, more utility" → shield, KAVACH, "No Amma left alone with a scammer", Track 1 credit |

- **History:** v1 (4:37) used ElevenLabs "George" in separate clips: gaps between lines felt stop-start and it
  mispronounced KAVACH and Hindi names. v2 used a Chatterbox clone of the teammate: rejected as robotic, with wrong
  pronunciations, and the music (Space Ranger) was far too loud. v3 used the teammate's real recording and the calm
  music. v4 added a full layout pass (equal gaps, nothing from the next scene showing early, no text spilling out
  of boxes). **v4 is current.** Older renders are kept in `pitch/renders/` only for reference.

### 17.3 Supporting material

- `pitch/vo/RECORDING_SCRIPT.md`: the narration script with a "say it like this" table (sent to the teammate).
- `pitch/vo/segments.json`: the 30 narration lines (ids s1a…s6b) grouped by scene: the single source of text.
- `pitch/SPEC.md`: look, objects, motion and shot list for the pitch film.
- `blender/BRIEF.md`: the restructured brief for the Blender shot.
- `pitch/assets/india.json`: India outline (Natural Earth 1:10m, India point of view, public domain) + city points.
- `pitch/assets/audio/SOURCES.md`, `blender/audio/SOURCES.md`: licences for every sound.

---

## 18. The build system (how every product was made)

### Machine and tools (all verified 22 Nov 2026)

| Tool | Version / note |
|---|---|
| OS | Windows 11; Git Bash and PowerShell both used |
| GPU | NVIDIA RTX 3050 Laptop, 6 GB. **Close games (Fortnite) before GPU jobs**: VRAM fills and jobs slow ~15×. |
| Blender | 5.2.2 LTS, EEVEE, view transform Standard, at `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe` |
| Blender MCP | add-on `blender_mcp.py` on socket localhost:9876 (`{"type":"execute_code","params":{"code":...}}`). The session's `mcp__Blender__*` tools time out (protocol mismatch): use `blender/bl.py` instead. |
| Node | v24.11.1 |
| HyperFrames | CLI pinned at 0.9.77 (`npx hyperframes …`), GSAP 3.15 from jsDelivr |
| Python | 3.10.11 (system). Run project scripts with `python -I`. |
| Voice tools venv | `tools/chatterbox-venv` (Python 3.10, torch 2.6.0+cu124, chatterbox-tts, openai-whisper). Whisper is still used for word timing. |
| ffmpeg | 8.0.1 (gyan.dev full build) |

### 18.1 Blender pipeline (`blender/`)

- `build_scene.py` builds the whole 15 s shot from code (objects, materials, UI on the phone, cameras, timeline
  markers). One clock: the `F_*` frame constants at the top (24 fps, END=360). Key frames: caption 6–56, tap 48,
  KAVACH active 66, verdict 126, macro 156–204, alert 222, hang-up tap 258, call ended 266, end card 292.
- Palette in code: UI bg #121214, card #19191B, raised #232325, line #2C2C2F, indigo #2A2FD0 (on dark #6C70F0),
  red #E5484D, green #4CC38A. Shield = steel (#A9AAAE, metallic, rough 0.3, anisotropic) + indigo enamel (#1C1F9E).
- Render headless at full size:
  ```
  blender -b --factory-startup --python blender/build_scene.py --python blender/render_preview.py -a
  ```
  Env vars: `KAVACH_PCT=100` (resolution %), `KAVACH_FRAMES=36,290` (range), `KAVACH_NO_CAPTION=1` (drop caption).
- `sfx.py <video>`: builds the soundtrack on the same clock (reads `F_*` from build_scene.py), mixes CC0 samples
  from `blender/audio/`, loudness-normalises, and writes `<video>_sound.mp4`.
- `build_open.py` → `pitch/assets/video/open_ring.mp4`; `build_shield_still.py` → `pitch/assets/shield.png`.
- `bl.py <script.py>` runs a script inside the open Blender through the add-on socket.

### 18.2 Pitch film pipeline (`pitch/`, HyperFrames = HTML + GSAP rendered to MP4)

```
vo/segments.json ──(teammate reads RECORDING_SCRIPT.md)──► vo/recording/*.m4a|mp3|mpeg
        │                                                          │
        │                       tools/chatterbox-venv/Scripts/python.exe -u vo/ingest_rec.py
        │                       (highpass + light denoise + trim, joins scenes, loudnorm -16 LUFS,
        │                        Whisper word timestamps aligned to the script)
        ▼                                                          ▼
 src/<scene>.html templates                          assets/audio/vo_take.wav + vo/timing.json
        └──────────────► python -I build.py ◄──────────────────────┘
                         (fills {{tokens}} with real word times, writes compositions/*.html + index.html,
                          bakes music_bed.wav ducked under the voice, places sfx on 4 lanes)
                                   │
                        npx hyperframes check  →  npx hyperframes snapshot --at …  (look at frames)
                                   │
                        npx hyperframes render --quality delivery --output renders/<name>_raw.mp4
                                   │
            ffmpeg -i raw -c:v copy -af loudnorm=I=-14:TP=-1:LRA=11 -c:a aac -b:a 256k renders/<name>.mp4
```

- **Time tokens in `src/*.html`:** `{{s1b}}` segment start, `{{s1b.end}}` its end, `{{s1b:32.4}}` the moment a word
  is spoken, `{{= S('s3b') - 0.3}}` arithmetic (helpers S, E, L, W, DUR), `{{dur}}` scene length, `{{CSS}}` shared
  stylesheet, `{{INDIA_*}}` map data. A scene starts 0.45 s before its first line.
- **Sound markers:** `<i data-sfx="file.ogg" data-at="{{…}}" data-vol="0.4"></i>` become root `<audio>` clips at
  half volume (`SFX_GAIN` in build.py).
- **Music:** `MUSIC = "lifewave2k.mp3"`, `MUSIC_DB = -13` in build.py; the track is crossfaded into itself to cover
  the film, then side-chain ducked under the voice.
- **Changing words:** edit `vo/segments.json` (and the matching `RECORDING_SCRIPT.md`), re-record or re-ingest,
  rebuild. Any `{{sid:word}}` anchor whose word disappeared will stop the build with a clear error.
- **Check findings we cleared:** dead stretches (nothing moving > 3 s), lines on screen too short to read, text
  under 28 px, overlaps. Remaining harmless notes: local fonts (Segoe UI / Consolas only exist on Windows), a
  duplicate image, and the nested video's start basis.
- **Render time:** about 4 minutes with 2 capture workers on a free GPU; 20–30 minutes if the GPU is busy.
- Voice scripts kept but no longer used for the film: `vo/gen_vo.py` (ElevenLabs), `vo/gen_vo_cb.py` (Chatterbox).

### 18.3 Layout rules the scenes now follow (from the v3 review)

- Cards that sit together live in one flex column or grid with **one 32 px gap**; positions are never hand-tuned.
- Lines, connectors, packets and camera stops are **measured from the real layout** at load time.
- Nothing animates in from a "from" state that is visible before its start time (render seeks frames out of order:
  use `tl.set(opacity)` around a move instead of `fromTo({opacity:1}, …, {immediateRender:false})`).
- Text that must stay on one line gets `white-space: nowrap` and copy short enough to fit; no orphan words.
- Labels stay off busy graphics (e.g. the scam-ring label sits on the legend line, not over the graph).

---

## 19. Design system (use it for the dashboard and phone PWA too)

From the "Studio in a Folder" cheat sheet (art-direction method) and the unslop pass (github.com/heydamir/unslop,
CC BY 4.0).

- **Ground:** light studio, radial #F4F4F5 → #C9C9CC. Dark UI objects on it.
- **Cards:** #19191B, 1 px #2C2C2F border, radius 24 px (rows 14 px), shadow `0 24px 48px rgba(0,0,0,0.14)`.
- **Ink:** on light #171717 / #525252 / #737373; on dark #EDEDED / #A1A1A6 / #85858B.
- **One accent:** indigo #2A2FD0 (on dark #6C70F0) for KAVACH itself and the one highlighted word per shot.
- **Semantic only:** red #E5484D scam/loss/never; green #4CC38A safe/done/automatic; amber #F5A524 needs approval.
- **Type:** Segoe UI 400 and 600 only; Consolas for numbers, IDs, server names. Sentence case, no trailing periods.
  Minimum 28 px in video.
- **No:** glow, gradients on UI, neon, bevels, overshoot/bounce, playful wobble.
- **Motion:** enter expo.out 0.6–0.8 s; move power2.inOut 0.8–1.2 s; exit power3.in ~45% of enter; one hero move
  per shot; titles hold still once landed; every event gets a sound on its frame.
- **Shield:** always the steel + indigo enamel render (`pitch/assets/shield.png`), never redrawn flat.

---

## 20. Websites and sources we used

| Site | What for |
|---|---|
| whackiest-2026.vercel.app and /announcements | Tracks, dates, rules, FAQs, sponsors, venue |
| devnovate.co/event/whackiest | Registration and PPT upload |
| vimeo.com/1246140026 ("Heft", fintech phone film, 24 s, 4:5) | Reference: UI layers floating off a black phone, steel card macro, number punch-in |
| vimeo.com/1246155969 ("Whence", SaaS film, 36 s) | Reference: typed question, scan line, huge faded number, end lockup |
| github.com/heydamir/unslop | Unslop rules (removing AI-looking design tells) |
| github.com/shinyobjectz/raea | Looked at; a separate Rust/Bevy render engine; not adopted |
| opengameart.org (Kenney Interface Sounds, Kenney Sci-fi Sounds, "Space Ranger" by Nostromo, "Calm Ambient 3 (Lifewave 2k)" by The Cynic Project) | CC0 sound effects and music |
| naturalearthdata.com (1:10m admin-0, India point of view) | Public-domain India map |
| elevenlabs.io (API, voice library, pricing) | v1 narration; plan limits learned |
| github.com/resemble-ai/chatterbox, huggingface.co/ResembleAI/chatterbox | v2 voice clone attempt (rejected) |
| hyperframes.heygen.com | The HTML-to-video framework used for the pitch film |

Sources cited in the team brief (for slides and Q&A): Moneylife (1930 volume, recovery rate, golden hour);
MHA data via NewKerala (seniors 2025); Outlook Money (28 lakh cases, ₹22,931 cr); Deccan Herald (Delhi ₹1,250 cr);
NPR on O2's Daisy; ANI/NewKerala and sancharsaathi.gov.in/sfc (Chakshu, 39 lakh disconnections); Google Play
Console Help on AccessibilityService and The Hacker News on Android 17 Advanced Protection; SBI and DFS on Account
Aggregator; ElevenLabs MCP docs (elevenlabs.io/docs/agents-platform/customization/mcp); ElevenLabs Agents pricing;
Gemini free tier; Twilio trial/India voice rules; hackathon-winner write-ups (TreeHacks 2026, Gemini API Developer
Competition, GitLab AI Hackathon 2026, ElevenLabs Worldwide Hackathon, WeMakeDevs "2 Fast 2 MCP", Google Cloud Gen
AI Exchange 2025). Full list: `docs/KAVACH_Team_Brief.pdf`, section 17.

---

## 21. Stage two plan: what to prepare before the hackathon

The site does not say whether code may be written before 1 December. The brief's assumption: accounts, research
and designs are fine; code is written during the event. **Ask the organisers (coderit@msrit.edu) before writing any
product code.** Until they answer, prepare everything in column A; do column B only if they say yes.

### A. Safe to prepare now (no product code)

| # | Item | Output | Owner (role) |
|---|---|---|---|
| A1 | **Accounts and keys** | ElevenLabs Starter (verify the API works with a library voice; free plan gives 402), Google AI Studio (Gemini key), Telegram bot via BotFather, GitHub org + empty repo, Vercel, Render/AWS (ask about credits), ngrok. Keys in a shared password manager, never in chat or git. | D |
| A2 | **Voice tests** | In an ElevenLabs agent: pick Kannada, Hindi, English voices; record 3 test calls; note latency. If Kannada is weak, test Sarvam AI. Decision written down. | A |
| A3 | **Scam playbooks** | 8–10 playbooks as JSON: digital arrest, KYC expiry, parcel with drugs, electricity cut-off, investment tips, job offer, lottery, OTP request. Each: red-flag phrases (en/hi/kn), score weights, safe advice lines in 3 languages, source advisory (RBI / DoT / I4C). | D |
| A4 | **Seed data** | 40–60 fake scam numbers, 15 UPI IDs, 8 mule accounts linked into 3 scam rings (including the film's `+91 98XXX XX210`, `refund.cbi@ok····`, `HDFC ····4471`); 20 sample debit SMS in real bank formats (HDFC, SBI, ICICI, Axis, Kotak); mock transactions; trusted contacts for Amma. | D |
| A5 | **API contract** | One markdown spec: every MCP tool (name, params, return, tier) for the six servers; orchestrator events (`incoming_call`, `sms_received`, `button_pressed`, `cheated_pressed`, `approval_result`); incident state machine; audit-log record; DB tables (incidents, contacts, entities, edges, approvals, audit_log). | B |
| A6 | **Agent prompts** | Call Screener, Scam Detector (with scoring rubric and threshold), Decoy Persona ("retired teacher, 67", fake identity card, never pays, never claims to be an official), Intel Extractor (JSON schema), Guardian summary, Recover agents. Test them in a chat UI against the playbooks. | A |
| A7 | **Screen designs** | Amma's PWA: incoming call, in-call with KAVACH button, KAVACH listening, verdict, "I've been cheated". Rahul's dashboard: alerts feed, approvals, transcript, fraud graph, audit log, golden-hour timer. Use the design system (section 19) so the product matches the films. | C |
| A8 | **Demo script** | Word-for-word 3-minute script (section 12) with who says what, the fake-CBI caller lines, the decoy exchange, and timings. Five rehearsal slots booked on build day. | D |
| A9 | **Text-mode fallback scenarios** | Typed transcripts for the Shield call, the decoy call and the debit SMS, so the demo works without voice. | A + D |
| A10 | **Idea PPT (urgent)** | 12 slides (section 13), due **24 Nov, 11:59 PM IST**. Use film stills. | D |
| A11 | **Online presentation (26–27 Nov)** | 5-minute idea pitch; play parts of the pitch film; rehearse Q&A (section 14). | all |
| A12 | **Kit list** | Two laptops with chargers, a real Android phone for Amma's PWA + a second phone for the "scammer", phone hotspot, HDMI/USB-C adapters, extension board, college IDs, earphones for voice tests. | all |
| A13 | **Dev environment checklist** | Python 3.11+, uv or pip, Node 20+, pnpm/npm, Git, VS Code, MCP Inspector, ngrok installed and logged in on every laptop. | all |

### B. Only if organisers allow pre-written code

| # | Item |
|---|---|
| B1 | Repo skeleton exactly as section 10, with a `make dev` / script that starts all services. |
| B2 | Six FastMCP servers with tool stubs returning seed data; MCP Inspector passes on each. |
| B3 | FastAPI orchestrator with the event router, policy gate and audit log. |
| B4 | ElevenLabs agent connected to one MCP tool end to end ("voice → MCP → response"): hour 0–2's checkpoint, done early. |
| B5 | Telegram bot with Approve / Reject inline buttons. |
| B6 | Next.js dashboard and PWA shells with the design system. |

If code is not allowed, keep A5 and A6 detailed enough that the build is typing, not thinking.

---

## 22. The 24-hour build plan

Roles for a team of four (for three people, merge C and D):

| Role | Owns |
|---|---|
| A · Voice & agents | ElevenLabs agents (Shield voice, Decoy), prompts, scam detection, Kannada/Hindi quality, latency |
| B · MCP & backend | Six MCP servers, orchestrator, policy gate, audit log, DB, mock bank / 1930 / Chakshu |
| C · Frontend | Amma's PWA (call screen, KAVACH button, "I've been cheated"), dashboard, fraud-graph animation |
| D · Data, integration & pitch | Playbooks, seed data, Telegram bot, end-to-end tests, demo script, backup video, final pitch |

| Hours | Goal |
|---|---|
| 0–2 | Repo skeleton; ElevenLabs agent talking end to end; MCP "hello world" called from the agent. **Checkpoint: voice → MCP → response.** |
| 2–6 | A: Shield agent + scam detection. B: intel, knowledge, family servers + orchestrator. C: PWA call screen. D: Telegram bot + seed data. |
| 6–10 | A: Decoy + intel extraction. B: bank and report servers + policy gate. C: dashboard alerts and approvals. D: integration tests. **Checkpoint: Shield demo end to end.** |
| 10–14 | Recover swarm in parallel; approvals through Telegram; fraud graph live on the dashboard. |
| 14–16 | Rest in shifts (two sleep at a time). **Checkpoint: full demo once, start to finish.** |
| 16–20 | Polish: voice latency, UI, error handling, text-mode fallback. **Feature freeze at hour 20.** |
| 20–22 | Rehearse the 3-minute demo five times; record the backup video. |
| 22–24 | Update slides with real screenshots; Q&A prep; buffer. |

Priority if time runs short: **Shield → Recover → Strike → Intelligence animation**. Mock anything without a public
API. Use text mode during development to save voice minutes.

---

## 23. Open questions and decisions waiting on the team

1. **Is pre-written code allowed?** Email coderit@msrit.edu. Decides whether section 21 column B happens.
2. **Idea PPT:** who builds it, and is it uploaded before 24 Nov 11:59 PM IST?
3. **Team list:** 2–4 members, same college, 1st–3rd year. Names and role letters (A–D) not recorded here yet.
4. **Kannada:** confirm voice quality in an ElevenLabs agent, or fall back to Hindi/English for the demo.
5. **ElevenLabs plan:** buy Starter (or higher) and confirm API access to library voices with a real call.
6. **Pitch film use:** play the 4:12 film (or a cut) in the online round? It runs longer than a 3-minute slot;
   a shorter cut can be made by dropping scenes in `pitch/build.py`'s `SCENES` list and re-rendering.
7. **Hosting:** AWS credits via the AWS Student Builder Group sponsor, or Render + Vercel free tiers.

---

## 24. Environment, accounts and security notes

- **Secrets:** `pitch/.env` holds `ELEVENLABS_API_KEY` (and an empty `ELEVENLABS_VOICE_ID`). Never print, paste or
  commit it. It is **excluded from the zip**. The current key is on the free plan and lacks the `user_read`
  permission; create a fresh key for the build.
- **Voice privacy:** the teammate's raw recordings (`pitch/vo/ref_voice.wav`, `pitch/vo/recording/`) are excluded
  from the zip. The cleaned narration (`pitch/assets/audio/vo_take.wav`) is included because the film is rebuilt
  from it.
- **Licences:** all sounds and music are CC0; the map is public domain; unslop is CC BY 4.0 (method only, no code
  shipped). Fonts are local Windows fonts (Segoe UI, Consolas): a render on another OS will substitute fonts.
- **Rebuild on another Windows machine:** install Node 20+, Python 3.10+, ffmpeg, Blender 5.2; `cd pitch`;
  `python -I build.py`; `npx hyperframes check`; `npx hyperframes render --quality delivery --output renders/x.mp4`.
  Re-timing to a new recording needs the voice venv (`pip install openai-whisper torch` with CUDA) and
  `vo/ingest_rec.py`.

---

## 25. Lessons learned (traps to avoid)

- Synthetic voices (ElevenLabs default, Chatterbox clone) mispronounce Indian names and numbers and sound robotic
  to this team. **A real teammate's recording won.** For the live demo, test the agent's Kannada/Hindi early.
- ElevenLabs free plan: 402 on library voices via API; higher bitrates need paid tiers. Verify plan access with a
  real call, not the dashboard.
- Music under narration must sit ~18–20 dB below the voice and duck; a "strong" loop at -5 dB under voice was
  called overwhelming and noxious.
- GPU jobs on a 6 GB laptop card: close games first.
- Video renders seek frames out of order: anything visible in an animation's "from" state shows up early.
- Hand-placed absolute positions drift into overlaps when text changes: use one layout container and one gap.
- Whisper writes numbers as digits and splits hyphenated words; the aligner handles both, but check the printed
  "not heard as written" list after every ingest for retakes or skipped lines.
- Keep demo constants identical across films, slides, seed data and the live demo (section 12).
