"""
MCP Server: kavach-report
Prepares official legal submissions for Indian cybercrime authorities:
  - 1930 Cybercrime Helpline Verbal Briefing (Golden Hour phone brief)
  - NCRP (National Cyber Crime Reporting Portal - cybercrime.gov.in) Complaint Draft
  - DoT Sanchar Saathi Chakshu portal SIM disconnection filing
"""

from typing import Dict, Any, Optional
from datetime import datetime
import uuid

class ReportServer:
    def __init__(self, policy_gate):
        self.policy_gate = policy_gate
        self.filed_reports: Dict[str, Dict[str, Any]] = {}

    def prepare_1930_brief(self, incident_details: Dict[str, Any], approval_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Generates a word-for-word victim briefing script for Amma/Rahul when calling 1930.
        Eliminates panic and ensures every crucial detail is provided inside the Golden Hour.
        TIER: NEEDS_GUARDIAN_APPROVAL
        """
        args = {"incident_id": incident_details.get("incident_id", "INC-001")}
        eval_res = self.policy_gate.evaluate("RecoverSwarm-1930Agent", "report.prepare_1930_brief", args, approval_token)
        if not eval_res["allowed"]:
            return eval_res

        brief_id = f"1930-BRIEF-{uuid.uuid4().hex[:6].upper()}"
        amount = incident_details.get("amount", 48000)
        caller = incident_details.get("scammer_number", "+91 98XXX XX210")
        upi_ref = incident_details.get("transaction_id", "UPI-619284019284")
        mule_acc = incident_details.get("destination_mule", "HDFC ····4471")
        source_acc = incident_details.get("source_account", "Canara Bank ····9102")
        debited_at = incident_details.get("started_at", "11:42")

        script = f"""
[1930 HELPLINE CALL BRIEFING SCRIPT]
1. Incident Category: Financial Cyber Fraud / Digital Arrest Extortion.
2. Loss Amount: ₹{amount:,.0f} INR.
3. Debited From: {source_acc} at {debited_at}.
4. Transaction Reference (RRN): {upi_ref}.
5. Suspect Destination UPI: refund.cbi@okaxis.
6. Destination Mule Account: {mule_acc}.
7. Caller Phone Number: {caller}.
8. Requested Action: Immediate inter-bank freeze request via Indian Cybercrime Coordination Centre (I4C) API to HDFC Bank nodal officer.
        """.strip()

        return {
            "status": "SUCCESS",
            "brief_id": brief_id,
            "hotline_number": "1930",
            "verbal_script": script,
            "checklist": [
                "Keep Bank Statement SMS ready",
                "Mention Transaction RRN explicitly",
                "Request immediate Lien on recipient account"
            ]
        }

    def draft_ncrp_complaint(self, incident_details: Dict[str, Any], approval_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Pre-fills formal complaint for cybercrime.gov.in.
        TIER: NEEDS_GUARDIAN_APPROVAL
        """
        args = {"incident_id": incident_details.get("incident_id", "INC-001")}
        eval_res = self.policy_gate.evaluate(
            "RecoverSwarm-NCRPAgent", "report.draft_ncrp_complaint", args, approval_token,
            on_approve=lambda tok: self.draft_ncrp_complaint(incident_details, approval_token=tok))
        if not eval_res["allowed"]:
            return eval_res

        complaint_id = f"NCRP-2026-BLR-{uuid.uuid4().hex[:6].upper()}"
        draft = {
            "complaint_id": complaint_id,
            "portal": "cybercrime.gov.in",
            "complainant": "Smt. Amma (via Guardian Rahul)",
            "jurisdiction": "Cyber Crime Police Station, Bengaluru City",
            "incident_type": "Online Impersonation & Digital Arrest Extortion",
            "accused_details": {
                "phone": incident_details.get("scammer_number", "+91 98XXX XX210"),
                "alias": "Fake CBI Inspector Alok Verma",
                "upi_id": "refund.cbi@okaxis",
                "mule_account": incident_details.get("destination_mule", "HDFC ····4471"),
                "transaction_id": incident_details.get("transaction_id")
            },
            "loss_amount": incident_details.get("amount", 48000),
            "evidence_attached": [
                "call_transcript_hash_sha256.txt",
                "debit_sms_timestamped.png",
                "strike_decoy_extracted_upi.json"
            ],
            "status": "DRAFT_READY_FOR_SUBMISSION"
        }
        self.filed_reports[complaint_id] = draft
        return {
            "status": "SUCCESS",
            "complaint": draft
        }

    def file_chakshu(self, phone_number: str, category: str, evidence: str, approval_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Drafts and files suspicious telecom report with DoT Sanchar Saathi Chakshu portal.
        TIER: NEEDS_GUARDIAN_APPROVAL
        """
        args = {"phone_number": phone_number, "category": category}
        eval_res = self.policy_gate.evaluate(
            "ReporterAgent", "report.file_chakshu", args, approval_token,
            on_approve=lambda tok: self.file_chakshu(phone_number, category, evidence, approval_token=tok))
        if not eval_res["allowed"]:
            return eval_res

        chakshu_id = f"CHK-DOT-{uuid.uuid4().hex[:6].upper()}"
        submission = {
            "chakshu_report_id": chakshu_id,
            "target_number": phone_number,
            "complaint_category": category,
            "evidence_summary": evidence,
            "status": "QUEUED_FOR_CARRIER_DISCONNECTION",
            "dot_portal": "sancharsaathi.gov.in/sfc",
            "carrier_sla": "SIM disconnection & IMEI blocking within 2 hours"
        }
        self.filed_reports[chakshu_id] = submission
        return {
            "status": "SUCCESS",
            "chakshu_report": submission
        }
