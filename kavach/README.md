# 🛡️ KAVACH: Multi-Agent Scam Defense System
> **"No Amma left alone with a scammer."**  
> Built for **wHACKiest 2026** (Ramaiah Institute of Technology) · **Track 1: Make MCP Matter** ("Less magic, more utility.")

---

## 📌 Executive Summary

Every second, an Indian falls victim to cyber fraud. In 2025 alone, **32.4 million victims** called the 1930 helpline, and **₹22,931 crore** was lost. Senior citizens and first-time smartphone users are targeted with ruthless psychological coercion ("digital arrest", fake CBI/police warrants, KYC cutoffs, courier parcels with contraband).

**KAVACH** is a voice-first, multi-agent AI system that stands directly between vulnerable parents and scammers. Its agents interact with the outside world exclusively through **Model Context Protocol (MCP)** tools, governed by a tamper-evident **Policy Gate** enforcing three strict action tiers.

---

## 🏛️ System Architecture

```
 Amma's Phone (PWA)         Scammer                   Rahul (Guardian Dashboard)
 Calls · SMS · KAVACH Button │                         Telegram Alerts · Approvals
         │                   │                                    ┆
         ▼                   ▼                                    ┆
 ┌────────────────── Multi-Lingual Voice & Speech Layer ──────────────────┐
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

## 🚀 Running the Prototype

### Prerequisites
- Python 3.10+
- Installed packages: `fastapi`, `uvicorn`, `networkx`, `jinja2`, `python-multipart`

### Launch
```bash
python3 run_kavach.py
```
Open **[http://localhost:8000](http://localhost:8000)** in your browser.

---

## 🧪 Interactive Live Demo Steps (Top Bar)

1. **Step 1: Incoming Call & Shield**  
   Simulates `+91 98XXX XX210` calling Amma. Amma taps the KAVACH button: the conference HUD activates, wave animates, risk meter hits 94%, Kannada warning is spoken, and Rahul's Telegram channel buzzes.
2. **Step 2: Strike Decoy (Daisy)**  
   Retiree Ramesh engages the scammer, extracting UPI ID `refund.cbi@okaxis` and mule account `HDFC ····4471`.
3. **Step 3: Recover Swarm (Golden Hour)**  
   Triggers panic response: 4 parallel agents activate, timer starts at `00:01:12`, and Rahul approves the bank hold with one tap.
4. **Step 4: Test Policy Violation**  
   Attempts `bank.move_money`: Policy Gate immediately intercepts and logs `BLOCKED (NEVER ALLOWED)`.
