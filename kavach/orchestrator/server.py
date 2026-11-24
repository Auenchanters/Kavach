"""
KAVACH Central Orchestrator & Web Server.
Exposes REST APIs and serves the web app (desktop guardian console + Amma's phone PWA) from /docs.
"""

from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from kavach.orchestrator.policy_gate import PolicyGate
from kavach.mcp.telephony import TelephonyServer
from kavach.mcp.intel import IntelServer
from kavach.mcp.bank import BankServer
from kavach.mcp.report import ReportServer
from kavach.mcp.family import FamilyServer
from kavach.mcp.knowledge import KnowledgeServer

from kavach.agents.shield_agent import ShieldAgent
from kavach.agents.strike_agent import StrikeAgent
from kavach.agents.recover_swarm import RecoverSwarm

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
WEB_DIR = BASE_DIR.parent / "docs"  # single frontend, also published as the GitHub Pages demo

app = FastAPI(title="KAVACH Prototype API", version="1.1.0")

Language = Literal["kn", "hi", "en"]


class System:
    """All MCP servers and agents for one demo session. Reset swaps in a fresh instance."""

    def __init__(self):
        self.policy_gate = PolicyGate()
        self.telephony = TelephonyServer(self.policy_gate)
        self.intel = IntelServer(self.policy_gate, str(DATA_DIR / "seed_intel.json"))
        self.bank = BankServer(self.policy_gate)
        self.report = ReportServer(self.policy_gate)
        self.family = FamilyServer(self.policy_gate)
        self.knowledge = KnowledgeServer(self.policy_gate, str(DATA_DIR / "playbooks.json"))
        self.shield = ShieldAgent(self.telephony, self.intel, self.knowledge, self.family, self.report)
        self.strike = StrikeAgent(self.telephony, self.intel, self.report, self.family)
        self.recover = RecoverSwarm(self.bank, self.report, self.family, self.intel, self.policy_gate)


sys_ = System()

# ----------------- Request models (trust boundary: bounded sizes) -----------------

class ScreenCallRequest(BaseModel):
    caller_number: str = Field("+91 98XXX XX210", max_length=32)

class KavachTapRequest(BaseModel):
    call_id: str = Field("CALL-X210", max_length=32)
    transcript: str = Field("This is Inspector Alok Verma from CBI Cyber Crime HQ New Delhi. Non-bailable digital arrest warrant is issued against your Aadhaar.", max_length=4000)
    language: Language = "kn"

class EndCallRequest(BaseModel):
    call_id: str = Field("CALL-X210", max_length=32)

class CheckSmsRequest(BaseModel):
    sms_text: str = Field("Dear consumer, your electricity power will be cut tonight at 9:30 PM because previous month bill was not updated. Pay at bit.ly/eb-bill", max_length=2000)
    sender: str = Field("VK-DISCOM-ALERT", max_length=40)
    language: Language = "kn"

class DecoyTurnRequest(BaseModel):
    message: str = Field("Open Google Pay and transfer 50,000 security deposit to refund.cbi@okaxis and HDFC Bank account 50100492814471.", min_length=1, max_length=1000)

class RecoverTriggerRequest(BaseModel):
    amount: float = Field(48000.0, gt=0, le=1e9)
    scammer_number: str = Field("+91 98XXX XX210", max_length=32)
    destination_mule: str = Field("HDFC ····4471", max_length=64)
    transaction_id: str = Field("UPI-619284019284", max_length=64)

class ApprovalActionRequest(BaseModel):
    action: Literal["APPROVE", "REJECT"] = "APPROVE"
    guardian_id: str = Field("Rahul (Son)", max_length=40)

# ----------------- APIs -----------------

@app.get("/api/status")
def get_system_status():
    return {
        "status": "ONLINE",
        "system": "KAVACH Multi-Agent Scam Defense",
        "track": "Track 1: Make MCP Matter",
        "tagline": "No Amma left alone with a scammer.",
        "mcp_servers": {name: "ACTIVE" for name in (
            "kavach-telephony", "kavach-intel", "kavach-bank",
            "kavach-report", "kavach-family", "kavach-knowledge")},
        "agents": {
            "shield_screener": "LISTENING",
            "strike_decoy": "READY",
            "recover_swarm": "STANDBY",
            "guardian_telemetry": "CONNECTED"
        }
    }

@app.get("/api/state")
def get_state():
    """Everything the dashboard draws, in one call."""
    return {
        "audit_log": sys_.policy_gate.get_logs(200),
        "approvals": list(sys_.policy_gate.pending_approvals.values()),
        "telegram_messages": sys_.family.get_messages(),
        "voice_notes": sys_.family.get_voice_notes(),
        "fraud_graph": sys_.intel.graph_payload(),
        "recovery": sys_.recover.last_run,
        "extracted_entities": sys_.strike.extracted_entities,
    }

@app.get("/api/audit-log")
def get_audit_log(limit: int = 50):
    return sys_.policy_gate.get_logs(limit)

@app.get("/api/fraud-graph")
def get_fraud_graph():
    return sys_.intel.get_fraud_graph()

@app.get("/api/pending-approvals")
def get_pending_approvals():
    return sys_.policy_gate.get_pending_approvals()

@app.post("/api/approvals/{approval_id}/action")
def resolve_approval(approval_id: str, req: ApprovalActionRequest):
    gate = sys_.policy_gate
    if approval_id not in gate.pending_approvals:
        raise HTTPException(404, f"Unknown approval {approval_id}")
    record = gate.approve_action(approval_id, req.guardian_id) if req.action == "APPROVE" \
        else gate.reject_action(approval_id, req.guardian_id)
    if record is None:
        raise HTTPException(409, f"Approval {approval_id} was already {gate.pending_approvals[approval_id]['status'].lower()}")
    return {"status": "SUCCESS", "approval": record}

@app.get("/api/telegram-messages")
def get_telegram_messages():
    return sys_.family.get_messages()

@app.post("/api/shield/screen-call")
def screen_call(req: ScreenCallRequest):
    return sys_.shield.screen_incoming_call(req.caller_number)

@app.post("/api/shield/kavach-tap")
def kavach_button_tap(req: KavachTapRequest):
    return sys_.shield.handle_kavach_button_tap(req.call_id, req.transcript, req.language)

@app.post("/api/shield/end-call")
def end_call(req: EndCallRequest):
    return sys_.telephony.end_call(req.call_id)

@app.post("/api/shield/check-sms")
def check_sms_endpoint(req: CheckSmsRequest):
    return sys_.shield.check_sms(req.sms_text, req.sender, req.language)

@app.post("/api/strike/turn")
def strike_decoy_turn(req: DecoyTurnRequest):
    return sys_.strike.process_decoy_turn(req.message)

@app.get("/api/strike/persona")
def get_strike_persona():
    return sys_.strike.get_persona_profile()

@app.post("/api/recover/trigger")
def trigger_recover_swarm(req: RecoverTriggerRequest):
    return sys_.recover.trigger_recovery(req.model_dump())

@app.post("/api/policy/test-violation")
def test_policy_violation():
    """Attempts prohibited fund transfer to demonstrate Policy Gate security rejection"""
    return sys_.bank.attempt_prohibited_move_money(50000.0, "MULE_ACCOUNT_XYZ")

@app.post("/api/reset")
def reset_demo():
    global sys_
    sys_ = System()
    return {"status": "SUCCESS", "message": "Demo state reset to clean baseline."}

# Web app last, so /api routes win. html=True serves index.html at "/".
app.mount("/", StaticFiles(directory=str(WEB_DIR), html=True), name="web")
