# KAVACH pitch: voice-over recording script

About 4 minutes 20 seconds of speech, 586 words, 12 short scenes.

## How to record
- Quiet room: no fan, AC, TV or music. Soft furnishings help (a bedroom beats a bathroom).
- Phone voice memo is fine. Hold the phone 20 to 30 cm from your mouth, a little to the side so breaths don't hit it.
- Speak calmly and warmly, as if explaining this to a friend's parent. Not a news anchor, not rushed.
- **One file per scene** is easiest: name them `01_hook`, `02_fail` ... `12_close` (any format: m4a, mp3, wav).
  A single long file also works: leave about 2 seconds of silence between scenes.
- If you stumble, pause, and re-read the whole sentence. I'll cut out the mistake.
- Put the files in `pitch/vo/recording/`, or send them on WhatsApp, and tell me where they are.

## Say these like this
| Written | Say |
|---|---|
| KAVACH | kuh-VUTCH (Hindi "kavach") |
| 2025 | twenty twenty-five |
| 1930 helpline | nineteen-thirty helpline |
| 32.4 million | thirty-two point four million |
| 22,931 crore | twenty-two thousand, nine hundred and thirty-one crore |
| 28 lakh | twenty-eight lakh |
| 4,005 crore | four thousand and five crore |
| WHACKiest 2026 | whackiest twenty twenty-six |
| MCP | M-C-P |
| UPI | U-P-I |
| Sanchar Saathi Chakshu | as in Hindi |
| FastMCP | fast M-C-P |
| RBI, OTPs, DPDP | letter by letter |

---

## 01 hook
Every second in India, someone falls victim to cyber fraud.
In 2025 alone, India's 1930 helpline received 32.4 million calls, with 22,931 crore rupees lost across 28 lakh reported cases.
And three out of four rupees were never recovered.
Over one lakh senior citizens lost 4,005 crore rupees, largely to digital arrest and fake investment scams.

## 02 fail
Awareness campaigns fail when fear takes over. Caller ID apps only flag known numbers, while scammers rotate SIMs.
And official helplines expect panicked victims to act within a single golden hour.
Nobody stands between your parents and the scammer during the call, or acts for them right after.

## 03 meet
That is why we built KAVACH, for WHACKiest 2026, Track 1: Make MCP Matter.
KAVACH is a voice-first, multi-agent AI system for ordinary families: elderly parents like Amma, and guardians like her son Rahul.
Four layers of agents, Shield, Strike, Recover and Intelligence, connect through MCP to the channels families already use, and to India's official fraud systems.

## 04 shield
First, Shield runs every day. Saved contacts ring normally, while risky unknown calls are screened first.
If Amma picks up a suspicious call, she taps one large KAVACH button. KAVACH joins as a three-way call, detects scam patterns live, and warns her calmly in Kannada, Hindi or English.
Rahul is alerted on Telegram. Suspicious SMS and WhatsApp links are checked too, with a voice note in reply.

## 05 strike
Second, Strike fights back. Forwarded scam calls route to a decoy AI retiree using strictly fake details.
It keeps scammers talking, draws out UPI IDs and mule accounts, and drafts reports for Sanchar Saathi Chakshu and banks.

## 06 recover
Third, Recover races the golden hour. Triggered by one tap or a debit SMS, four agents launch in parallel:
a bank block request, a 1930 briefing, a pre-filled cybercrime complaint, and a time-stamped evidence pack, all waiting on Rahul's one-tap approval.

## 07 intel
Fourth, Intelligence. Every confirmed scam number, URL and UPI ID becomes a node in a shared fraud graph, exposing whole scam rings, so one family's attack protects thousands.

## 08 arch
Technically, KAVACH isn't a chatbot with bolted-on plugins. It's a modular, MCP-first agent system.
At the top, ElevenLabs Agents handle speech, turn-taking and multilingual voice, talking to our MCP layer over streamable HTTP.
Under it sits the KAVACH Orchestrator, in Python and FastAPI, with Gemini Flash scoring scams across our Shield, Strike, Recover and Guardian agents.
Agents never talk to outside systems directly. Every tool call passes through a Policy Gate, with an audit log and three action tiers.
Automatic, for screening and warnings. Guardian-approved, through Telegram, for reports or bank holds. And never allowed: sharing real data, moving money, or posing as officials.
Below the gate sit six FastMCP servers: telephony, intel, bank, report, family and knowledge, plus a live fraud graph and a guardian dashboard.
So future bank or telecom agents can plug into the same governance layer.

## 09 safety
KAVACH never uses Android accessibility permissions and never reads your banking screens. That is exactly how malware steals OTPs.
It relies only on consent-based channels: announced conference calls, debit SMS, and RBI's Account Aggregator, aligned with India's DPDP Act.

## 10 scope
In our build, voice agents, scam detection, all six MCP servers, SMS parsing, Telegram approvals and the fraud graph are real. Only bank actions and official portal filings are mocked.

## 11 roadmap
Next: a 50-family Android pilot with Exotel, then bank and telecom partnerships that license our fraud graph, while KAVACH stays free for families.

## 12 close
Less magic, more utility. Six MCP servers, one mission: no Amma left alone with a scammer.
