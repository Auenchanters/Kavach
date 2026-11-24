"""
KAVACH Central Orchestrator & Web Server.
Exposes REST APIs and serves the dual-screen interactive prototype.
"""

import os
from pathlib import Path
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

# Import KAVACH Modules
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

app = FastAPI(title="KAVACH Prototype API", version="1.0.0")

# Mount static files
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "web" / "static")), name="static")

# Initialize System Singletons
policy_gate = PolicyGate()
telephony_srv = TelephonyServer(policy_gate)
intel_srv = IntelServer(policy_gate, str(DATA_DIR / "seed_intel.json"))
bank_srv = BankServer(policy_gate)
report_srv = ReportServer(policy_gate)
family_srv = FamilyServer(policy_gate)
knowledge_srv = KnowledgeServer(policy_gate, str(DATA_DIR / "playbooks.json"))

shield_agent = ShieldAgent(telephony_srv, intel_srv, knowledge_srv, family_srv)
strike_agent = StrikeAgent(telephony_srv, intel_srv, report_srv, family_srv)
recover_swarm = RecoverSwarm(bank_srv, report_srv, family_srv, intel_srv, policy_gate)

# Request Models
class ScreenCallRequest(BaseModel):
    caller_number: str = "+91 98XXX XX210"

class KavachTapRequest(BaseModel):
    call_id: str = "CALL-210"
    transcript: str = "This is Inspector Alok Verma from CBI Cyber Crime HQ New Delhi. Non-bailable digital arrest warrant is issued against your Aadhaar."
    language: str = "kn"

class CheckSmsRequest(BaseModel):
    sms_text: str = "Dear consumer, your electricity power will be cut tonight at 9:30 PM because previous month bill was not updated. Pay at bit.ly/eb-bill"
    sender: str = "VK-DISCOM-ALERT"
    language: str = "kn"

class DecoyTurnRequest(BaseModel):
    message: str = "Open Google Pay and transfer 50,000 security deposit to refund.cbi@okaxis and HDFC Bank account 50100492814471."

class RecoverTriggerRequest(BaseModel):
    amount: float = 48000.0
    scammer_number: str = "+91 98XXX XX210"
    destination_mule: str = "HDFC ····4471"
    transaction_id: str = "UPI-619284019284"

class ApprovalActionRequest(BaseModel):
    action: str = "APPROVE"  # "APPROVE" or "REJECT"
    guardian_id: str = "Rahul (Son)"

# ----------------- APIs -----------------

@app.get("/api/status")
def get_system_status():
    return {
        "status": "ONLINE",
        "system": "KAVACH Multi-Agent Scam Defense",
        "track": "Track 1: Make MCP Matter",
        "tagline": "No Amma left alone with a scammer.",
        "mcp_servers": {
            "kavach-telephony": "ACTIVE",
            "kavach-intel": "ACTIVE",
            "kavach-bank": "ACTIVE",
            "kavach-report": "ACTIVE",
            "kavach-family": "ACTIVE",
            "kavach-knowledge": "ACTIVE"
        },
        "agents": {
            "shield_screener": "LISTENING",
            "strike_decoy": "READY",
            "recover_swarm": "STANDBY",
            "guardian_telemetry": "CONNECTED"
        }
    }

@app.get("/api/audit-log")
def get_audit_log(limit: int = 50):
    return policy_gate.get_logs(limit)

@app.get("/api/fraud-graph")
def get_fraud_graph():
    return intel_srv.get_fraud_graph()

@app.get("/api/pending-approvals")
def get_pending_approvals():
    return policy_gate.get_pending_approvals()

@app.post("/api/approvals/{approval_id}/action")
def resolve_approval(approval_id: str, req: ApprovalActionRequest):
    if req.action.upper() == "APPROVE":
        success = policy_gate.approve_action(approval_id, req.guardian_id)
    else:
        success = policy_gate.reject_action(approval_id, req.guardian_id)
    return {"status": "SUCCESS" if success else "NOT_FOUND", "approval_id": approval_id, "action": req.action}

@app.get("/api/telegram-messages")
def get_telegram_messages():
    return family_srv.get_messages()

# Step 1: Shield Screening
@app.post("/api/shield/screen-call")
def screen_call(req: ScreenCallRequest):
    return shield_agent.screen_incoming_call(req.caller_number)

# Step 2: Amma taps KAVACH button
@app.post("/api/shield/kavach-tap")
def kavach_button_tap(req: KavachTapRequest):
    return shield_agent.handle_kavach_button_tap(req.call_id, req.transcript, req.language)

# Step 3: SMS Checking
@app.post("/api/shield/check-sms")
def check_sms_endpoint(req: CheckSmsRequest):
    return shield_agent.check_sms(req.sms_text, req.sender, req.language)

# Step 4: Strike Decoy turn
@app.post("/api/strike/turn")
def strike_decoy_turn(req: DecoyTurnRequest):
    return strike_agent.process_decoy_turn(req.message)

@app.get("/api/strike/persona")
def get_strike_persona():
    return strike_agent.get_persona_profile()

# Step 5: Golden Hour Recover Swarm
@app.post("/api/recover/trigger")
def trigger_recover_swarm(req: RecoverTriggerRequest):
    return recover_swarm.trigger_recovery(req.dict())

# Step 6: Security Violation Demonstration
@app.post("/api/policy/test-violation")
def test_policy_violation():
    """Attempts prohibited fund transfer to demonstrate Policy Gate security rejection"""
    return bank_srv.attempt_prohibited_move_money(50000.0, "MULE_ACCOUNT_XYZ")

# Reset Demo
@app.post("/api/reset")
def reset_demo():
    global policy_gate, telephony_srv, intel_srv, bank_srv, report_srv, family_srv, knowledge_srv
    global shield_agent, strike_agent, recover_swarm

    policy_gate = PolicyGate()
    telephony_srv = TelephonyServer(policy_gate)
    intel_srv = IntelServer(policy_gate, str(DATA_DIR / "seed_intel.json"))
    bank_srv = BankServer(policy_gate)
    report_srv = ReportServer(policy_gate)
    family_srv = FamilyServer(policy_gate)
    knowledge_srv = KnowledgeServer(policy_gate, str(DATA_DIR / "playbooks.json"))

    shield_agent = ShieldAgent(telephony_srv, intel_srv, knowledge_srv, family_srv)
    strike_agent = StrikeAgent(telephony_srv, intel_srv, report_srv, family_srv)
    recover_swarm = RecoverSwarm(bank_srv, report_srv, family_srv, intel_srv, policy_gate)

    return {"status": "SUCCESS", "message": "Demo state reset to clean baseline."}

# Web UI Route
@app.get("/", response_class=HTMLResponse)
def serve_dashboard():
    index_file = BASE_DIR / "web" / "templates" / "index.html"
    if index_file.exists():
        with open(index_file, "r", encoding="utf-8") as f:
            return f.read()
    return "<h1>KAVACH Web Interface Loading...</h1>"
