"""
KAVACH Policy Gate and Action Tiers Engine.
Enforces the 3 security tiers:
  1. AUTOMATIC: Read-only intel, warnings to Amma, guardian alerts, defensive call termination.
  2. APPROVAL_REQUIRED: Filing official reports (Chakshu/NCRP), bank freezes/holds.
  3. NEVER_ALLOWED: Moving money, revealing real PII, screen-scraping banking apps, impersonating police.
Every invocation is recorded in an immutable audit trail.
"""

from datetime import datetime
import json
import uuid
from typing import Dict, Any, List, Optional

class PolicyGate:
    TIER_AUTOMATIC = "AUTOMATIC"
    TIER_APPROVAL_REQUIRED = "NEEDS_GUARDIAN_APPROVAL"
    TIER_NEVER_ALLOWED = "NEVER_ALLOWED"

    # Action mappings
    TOOL_TIERS = {
        # Telephony
        "telephony.answer_call": TIER_AUTOMATIC,
        "telephony.join_conference": TIER_AUTOMATIC,
        "telephony.speak_warning": TIER_AUTOMATIC,
        "telephony.transfer_to_decoy": TIER_AUTOMATIC,
        "telephony.end_call": TIER_AUTOMATIC,

        # Intel
        "intel.check_number": TIER_AUTOMATIC,
        "intel.check_url": TIER_AUTOMATIC,
        "intel.add_entity": TIER_AUTOMATIC,
        "intel.link_entities": TIER_AUTOMATIC,
        "intel.get_fraud_graph": TIER_AUTOMATIC,

        # Knowledge
        "knowledge.match_scam_pattern": TIER_AUTOMATIC,
        "knowledge.get_safe_advice": TIER_AUTOMATIC,

        # Family / Guardian
        "family.notify_guardian": TIER_AUTOMATIC,
        "family.send_voice_note": TIER_AUTOMATIC,
        "family.request_approval": TIER_AUTOMATIC,

        # Bank actions
        "bank.parse_debit_sms": TIER_AUTOMATIC,
        "bank.list_transactions": TIER_AUTOMATIC,
        "bank.request_hold": TIER_APPROVAL_REQUIRED,
        "bank.request_block": TIER_APPROVAL_REQUIRED,

        # Report actions
        "report.prepare_1930_brief": TIER_APPROVAL_REQUIRED,
        "report.draft_ncrp_complaint": TIER_APPROVAL_REQUIRED,
        "report.file_chakshu": TIER_APPROVAL_REQUIRED,
        "report.share_transcript": TIER_APPROVAL_REQUIRED,

        # Prohibited actions (Simulated or intercepted)
        "bank.move_money": TIER_NEVER_ALLOWED,
        "bank.transfer_funds": TIER_NEVER_ALLOWED,
        "auth.share_otp": TIER_NEVER_ALLOWED,
        "device.read_banking_app": TIER_NEVER_ALLOWED,
        "telephony.impersonate_police": TIER_NEVER_ALLOWED
    }

    def __init__(self):
        self.audit_log: List[Dict[str, Any]] = []
        self.pending_approvals: Dict[str, Dict[str, Any]] = {}
        # Seed initial system startup audit log entry
        self._record_log(
            agent="SYSTEM",
            tool="policy_gate.init",
            tier=self.TIER_AUTOMATIC,
            args={"version": "1.0-hackathon", "action_tiers_enforced": 3},
            decision="ALLOWED",
            reason="Policy gate initialized successfully with strict tier enforcement"
        )

    def evaluate(self, agent_name: str, tool_name: str, args: Dict[str, Any], approval_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Evaluate tool invocation against policy gate.
        Returns:
          {
            "allowed": bool,
            "tier": str,
            "decision": "ALLOWED" | "BLOCKED" | "APPROVAL_PENDING",
            "approval_id": Optional[str],
            "reason": str
          }
        """
        tier = self.TOOL_TIERS.get(tool_name, self.TIER_NEVER_ALLOWED)

        if tier == self.TIER_NEVER_ALLOWED:
            reason = f"Security Policy Violation: '{tool_name}' belongs to NEVER_ALLOWED tier. KAVACH never executes fund transfers, credentials sharing, or banking app inspection."
            self._record_log(agent_name, tool_name, tier, args, "BLOCKED", reason)
            return {
                "allowed": False,
                "tier": tier,
                "decision": "BLOCKED",
                "reason": reason
            }

        if tier == self.TIER_APPROVAL_REQUIRED:
            if approval_token and approval_token in self.pending_approvals and self.pending_approvals[approval_token].get("status") == "APPROVED":
                reason = f"Guardian approved action with token {approval_token}."
                self._record_log(agent_name, tool_name, tier, args, "ALLOWED", reason)
                return {
                    "allowed": True,
                    "tier": tier,
                    "decision": "ALLOWED",
                    "reason": reason
                }
            else:
                # Create pending approval request
                approval_id = f"APPR-{uuid.uuid4().hex[:6].upper()}"
                self.pending_approvals[approval_id] = {
                    "approval_id": approval_id,
                    "agent": agent_name,
                    "tool": tool_name,
                    "args": args,
                    "status": "PENDING",
                    "created_at": datetime.now().strftime("%H:%M:%S")
                }
                reason = f"Action '{tool_name}' requires explicit Guardian approval before execution."
                self._record_log(agent_name, tool_name, tier, args, "APPROVAL_PENDING", reason)
                return {
                    "allowed": False,
                    "tier": tier,
                    "decision": "APPROVAL_PENDING",
                    "approval_id": approval_id,
                    "reason": reason
                }

        # Automatic tier
        reason = f"Action '{tool_name}' executed automatically within safe boundaries."
        self._record_log(agent_name, tool_name, tier, args, "ALLOWED", reason)
        return {
            "allowed": True,
            "tier": tier,
            "decision": "ALLOWED",
            "reason": reason
        }

    def approve_action(self, approval_id: str, guardian_id: str = "Rahul") -> bool:
        """Guardian marks an action as approved"""
        if approval_id in self.pending_approvals:
            self.pending_approvals[approval_id]["status"] = "APPROVED"
            self.pending_approvals[approval_id]["approved_by"] = guardian_id
            self.pending_approvals[approval_id]["approved_at"] = datetime.now().strftime("%H:%M:%S")
            self._record_log(
                agent="GuardianAgent",
                tool="family.guardian_approval",
                tier=self.TIER_APPROVAL_REQUIRED,
                args={"approval_id": approval_id, "guardian": guardian_id},
                decision="APPROVED",
                reason=f"Guardian {guardian_id} confirmed execution of {self.pending_approvals[approval_id]['tool']}"
            )
            return True
        return False

    def reject_action(self, approval_id: str, guardian_id: str = "Rahul") -> bool:
        """Guardian marks an action as rejected"""
        if approval_id in self.pending_approvals:
            self.pending_approvals[approval_id]["status"] = "REJECTED"
            self.pending_approvals[approval_id]["rejected_by"] = guardian_id
            self._record_log(
                agent="GuardianAgent",
                tool="family.guardian_rejection",
                tier=self.TIER_APPROVAL_REQUIRED,
                args={"approval_id": approval_id, "guardian": guardian_id},
                decision="REJECTED",
                reason=f"Guardian {guardian_id} rejected execution of {self.pending_approvals[approval_id]['tool']}"
            )
            return True
        return False

    def _record_log(self, agent: str, tool: str, tier: str, args: Dict[str, Any], decision: str, reason: str):
        entry = {
            "id": f"LOG-{len(self.audit_log)+1:04d}",
            "time": datetime.now().strftime("%H:%M:%S"),
            "agent": agent,
            "tool": tool,
            "tier": tier,
            "args": args,
            "decision": decision,
            "reason": reason
        }
        self.audit_log.insert(0, entry)  # Newest first

    def get_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self.audit_log[:limit]

    def get_pending_approvals(self) -> List[Dict[str, Any]]:
        return [v for v in self.pending_approvals.values() if v.get("status") == "PENDING"]
