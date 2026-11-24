# 🛡️ KAVACH: Multi-Agent Anti-Fraud Defense System
> **"No Amma left alone with a scammer."**  
> Built for **wHACKiest 2026** (Ramaiah Institute of Technology) · **Track 1: Make MCP Matter** ("Less magic, more utility.")

[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-6366f1?style=for-the-badge&logo=github)](https://pratun.github.io/kavach/)
[![License: CC0](https://img.shields.io/badge/License-CC0-10b981?style=for-the-badge)](./LICENSE)
[![Track 1](https://img.shields.io/badge/Track-Make_MCP_Matter-4f46e5?style=for-the-badge)](#)

---

## 🌐 Live Interactive Demo
Try the standalone prototype directly in your browser with zero setup:
👉 **[Launch KAVACH Live Prototype](https://pratun.github.io/kavach/)**

---

## 📌 Executive Summary

Every second, an Indian falls victim to cyber fraud. In 2025, **32.4 million victims** dialed 1930, and **₹22,931 crore** was lost. Senior citizens and first-time smartphone users are targeted with ruthless psychological intimidation (Digital Arrest, fake CBI officers, KYC disconnection threats, and courier narcotics scams).

**KAVACH** is a voice-first, multi-agent AI defense system that stands directly between vulnerable parents and scammers. Its agents interact with the outside world exclusively through **Model Context Protocol (MCP)** tool servers, governed by a tamper-evident **Policy Gate** with three strict action tiers.

---

## 🏛️ System Architecture

```
 Amma's Phone (PWA)         Scammer                   Rahul (Guardian Dashboard)
 Calls · SMS · KAVACH Button │                         Telegram Alerts · Approvals
         │                   │                                    ┆
         ▼                   ▼                                    ┆
 ┌────────────────── Multi-Lingual Voice & Audio Layer ──────────────────┐
 │ Kannada (ಕನ್ನಡ) · Hindi (हिंदी) · English · Real-Time Audio HUD       │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     ▼
 ┌─────────────────── KAVACH FastAPI Orchestrator ────────────────────────┐
 │  • Shield Agent: Screening, live scam scoring, conference intervention │
 │  • Strike Agent: 67-yo retiree decoy ("Ramesh") & entity extraction    │
 │  • Recover Swarm: 4 parallel agents (Bank, 1930, NCRP, Evidence)      │
 │  • Guardian Agent: Telegram feed, inline approvals & telemetry         │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     ▼
 ┌─ Policy Gate: [AUTOMATIC] · [NEEDS GUARDIAN APPROVAL] · [NEVER ALLOWED] ─┐
 └───────────────────────────────────┬────────────────────────────────────┘
                                     ▼
       ┌─────────────────────────────┼─────────────────────────────┐
       ▼                             ▼                             ▼
kavach-telephony               kavach-intel                  kavach-bank
(screen, conf, warning, end)   (fraud graph, check number)   (SMS parser, lien hold)
       │                             │                             │
kavach-report                  kavach-family                 kavach-knowledge
(1930 brief, NCRP, Chakshu)    (Telegram bot, approvals)     (RBI/DoT scam playbooks)
```

---

## 🔑 The Four Core Layers

### 1. 🛡️ Shield (Everyday Defense)
- **Pre-Call Screening:** Saved contacts ring normally. Unknown numbers (`+91 98XXX XX210`) are checked against `kavach-intel`. High-risk calls are answered by KAVACH before the phone rings.
- **In-Call Conference Protection:** If Amma picks up an unknown caller that turns hostile, she taps the prominent **KAVACH Shield Button**. KAVACH joins as a conference participant, announces monitoring, analyzes speech transcripts, raises the risk meter to 94%, and speaks a calm warning in **Kannada**, **Hindi**, or **English**:
  > *"ಅಮ್ಮಾ, ಇದು ಸುಳ್ಳು ಕರೆ! ಭಾರತದ ಯಾವುದೇ ಪೊಲೀಸ್ ಅಥವಾ ಸಿಬಿಐ ವಿಡಿಯೋ ಕಾಲಿನಲ್ಲಿ ಯಾರನ್ನೂ ಬಂಧಿಸುವುದಿಲ್ಲ. ದಯವಿಟ್ಟು ಕೂಡಲೇ ಕರೆ ಕಟ್ ಮಾಡಿ."*
- **SMS & Message Scanner:** Parses electricity cut-off and banking phishing links, returning an instant audio voice note verdict.

### 2. 🎙️ Strike (The Indian "Daisy" Decoy)
- Inspired by O2's Daisy persona: engages confirmed scam callers using a chatty, slow, slightly confused 67-year-old retired Bangalore schoolteacher persona (**Ramesh Sharma**).
- Steers the scammer into revealing destination coordinates (`refund.cbi@okaxis`, `HDFC ····4471`), extracts entities live, updates the fraud graph, auto-drafts Sanchar Saathi Chakshu reports, and wastes 26+ minutes of scammer time.

### 3. ⚡ Recover Swarm (Golden Hour Rapid Response)
- If money is lost, Amma or Rahul taps **"I've been cheated"**.
- Four specialized agents execute concurrently within the critical 60-minute Golden Hour window:
  1. **Bank Hold Agent:** Issues an emergency lien/freeze request on the destination mule account (`HDFC ····4471`).
  2. **1930 Helpline Agent:** Generates an exact verbal briefing script for the victim to read when calling 1930.
  3. **NCRP Complaint Agent:** Pre-fills the formal `cybercrime.gov.in` complaint with suspect details.
  4. **Evidence Dossier Agent:** Compiles a cryptographically sealed SHA-256 evidence package compliant with Section 65B of the Indian Evidence Act.

### 4. 🕸️ Shared Fraud Intelligence Knowledge Graph
- Powered by `NetworkX` and `kavach-intel`. Links phone numbers, UPI IDs, bank accounts, scam syndicates (e.g. *Kolkata-Mewat Digital Arrest Ring*), and protected families.
- Interactive canvas visualization with force-directed physics.

---

## 🔒 Policy Gate & Action Tiers

Every agent tool invocation passes through the central Policy Gate and is recorded in an immutable audit log:

| Tier | Policy | Tool Examples |
|---|---|---|
| **Tier 1: AUTOMATIC** | Executed immediately within safe parameters | `intel.check_number`, `telephony.speak_warning`, `family.notify_guardian`, `knowledge.match_scam_pattern` |
| **Tier 2: GUARDIAN APPROVAL** | Pauses execution until Rahul approves via Telegram | `bank.request_hold`, `report.file_chakshu`, `report.draft_ncrp_complaint` |
| **Tier 3: NEVER ALLOWED** | Instantly blocked and flagged as security violation | `bank.move_money`, `auth.share_otp`, `device.read_banking_app`, `impersonate_police` |

---

## 🚀 Running Locally

```bash
git clone https://github.com/Auenchanters/Kavach.git
cd Kavach
pip install -r requirements.txt
python run_kavach.py
```
Open **http://localhost:8000**. The badge in the top bar says **Live server** when every action runs through the Python agents and policy gate.

With no server (for example on GitHub Pages, serving `docs/`), the same app runs in **Browser demo** mode: `docs/mock.js` stands in for the backend with the same routes and rules.

### Tests
```bash
pip install -r requirements-dev.txt
python -m pytest -q
```

---

## 📱 Desktop and phone

One responsive web app serves both:

| Screen | What you get |
|---|---|
| **Desktop** (≥1024px) | Rahul's guardian console beside a live preview of Amma's phone, plus Recover, Strike and Policy Gate in the left rail. In Chrome or Edge, *Install app* gives it its own window. |
| **Phone** | Amma's app full-screen, with a bottom tab bar (Amma · Rahul · Recover · Strike · Gate). *Add to Home Screen* installs it as an app (PWA, works offline). Open `#guardian` to install Rahul's view. |

The four demo steps in the top bar (Scam call → Decoy → Money lost → Forbidden action) walk the whole story; **Reset** clears server state.

---

## 📦 Project Structure

```
├── docs/                      # The web app (served by FastAPI at / and by GitHub Pages)
│   ├── index.html · app.css · app.js
│   ├── mock.js                # In-browser backend for the no-server demo
│   ├── manifest.webmanifest · sw.js · icons/   # PWA install + offline
├── kavach/                    # Python backend
│   ├── orchestrator/          # FastAPI app, REST API, policy gate
│   ├── mcp/                   # 6 MCP tool servers
│   ├── agents/                # Shield, Strike decoy, Recover swarm
│   └── data/                  # Scam playbooks & seed intelligence
├── tests/                     # API tests (pytest)
├── Procfile · render.yaml     # Cloud deploy
└── run_kavach.py              # Launcher
```
