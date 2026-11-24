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
# 1. Clone repository
git clone https://github.com/Pratun/kavach.git
cd kavach

# 2. Install dependencies
pip install -r requirements.txt

# 3. Launch local orchestrator
python run_kavach.py
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser.

---

## 📦 Project Structure

```
├── docs/                      # GitHub Pages standalone deployment folder
│   ├── index.html             # Standalone client-side simulator
│   └── static/                # Official CC0 audio and shield icon
├── kavach/                    # Python Backend Source
│   ├── orchestrator/          # FastAPI app, REST APIs, & policy gate
│   ├── mcp/                   # 6 FastMCP tool servers
│   ├── agents/                # Shield, Strike Decoy, Recover Swarm
│   ├── data/                  # Official playbooks & seed intelligence
│   └── web/                   # Web dashboard templates & static assets
├── Procfile                   # Cloud PaaS entry point
├── render.yaml                # Render 1-click cloud blueprint
├── requirements.txt           # Python dependencies
└── run_kavach.py              # Convenience launcher
```
