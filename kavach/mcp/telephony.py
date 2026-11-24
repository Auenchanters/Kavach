"""
Tool server kavach-telephony: in-process stand-in for the MCP server built at the hackathon.
Handles telephony integration (screen, answer, conference join, speak audio warning, transfer to decoy, disconnect).
In production: integrates with Exotel / SIP / Android CallScreeningService.
In prototype: provides high-fidelity stateful execution with audio synthesis cues.
"""

from datetime import datetime
from typing import Any


class TelephonyServer:
    def __init__(self, policy_gate):
        self.policy_gate = policy_gate
        self.active_calls: dict[str, dict[str, Any]] = {}

    def answer_call(self, call_id: str, caller_number: str) -> dict[str, Any]:
        """Screen and answer incoming call with KAVACH voice assistant"""
        args = {"call_id": call_id, "caller_number": caller_number}
        eval_res = self.policy_gate.evaluate("CallScreenerAgent", "telephony.answer_call", args)
        if not eval_res["allowed"]:
            return eval_res

        self.active_calls[call_id] = {
            "call_id": call_id,
            "caller_number": caller_number,
            "status": "ANSWERED",
            "connected_at": datetime.now().strftime("%H:%M:%S"),
            "conference_active": False,
            "decoy_active": False,
        }
        return {
            "status": "SUCCESS",
            "message": f"KAVACH Call Screener answered call {call_id} from {caller_number}",
            "call": self.active_calls[call_id],
        }

    def join_conference(self, call_id: str, participant: str = "KAVACH_SHIELD") -> dict[str, Any]:
        """Join live call as transparent conference participant when Amma taps the KAVACH button"""
        args = {"call_id": call_id, "participant": participant}
        eval_res = self.policy_gate.evaluate("ShieldAgent", "telephony.join_conference", args)
        if not eval_res["allowed"]:
            return eval_res

        if call_id in self.active_calls:
            self.active_calls[call_id]["conference_active"] = True
            self.active_calls[call_id]["joined_at"] = datetime.now().strftime("%H:%M:%S")

        return {
            "status": "SUCCESS",
            "conference_active": True,
            "announcement": (
                "KAVACH Shield has joined this call. For security and anti-fraud "
                "monitoring, this call is recorded and analyzed."
            ),
            "ui_cue": "HUD_ACTIVE",
        }

    def speak_warning(self, call_id: str, message: str, language: str = "kn") -> dict[str, Any]:
        """Speak urgent scam warning into the call channel directly to Amma in native language"""
        args = {"call_id": call_id, "language": language, "message_preview": message[:40]}
        eval_res = self.policy_gate.evaluate("ShieldAgent", "telephony.speak_warning", args)
        if not eval_res["allowed"]:
            return eval_res

        return {
            "status": "SUCCESS",
            "language": language,
            "message": message,
            "audio_synthesized": True,
            "urgency": "CRITICAL",
            "suggested_action": "HANG_UP_IMMEDIATELY",
        }

    def transfer_to_decoy(self, call_id: str, decoy_persona: str = "retired_teacher_67") -> dict[str, Any]:
        """Route caller seamlessly to Strike Decoy Persona"""
        args = {"call_id": call_id, "decoy_persona": decoy_persona}
        eval_res = self.policy_gate.evaluate("StrikeAgent", "telephony.transfer_to_decoy", args)
        if not eval_res["allowed"]:
            return eval_res

        if call_id in self.active_calls:
            self.active_calls[call_id]["decoy_active"] = True

        return {
            "status": "SUCCESS",
            "transferred_to": decoy_persona,
            "decoy_voice": "en-IN-Ramesh",
            "objective": "Engage scammer, waste time, extract UPI ID & mule account",
        }

    def end_call(self, call_id: str, reason: str = "CONFIRMED_FRAUD_DETECTED") -> dict[str, Any]:
        """Disconnect malicious call immediately"""
        args = {"call_id": call_id, "reason": reason}
        eval_res = self.policy_gate.evaluate("ShieldAgent", "telephony.end_call", args)
        if not eval_res["allowed"]:
            return eval_res

        if call_id in self.active_calls:
            self.active_calls[call_id]["status"] = "TERMINATED"
            self.active_calls[call_id]["ended_at"] = datetime.now().strftime("%H:%M:%S")

        return {"status": "SUCCESS", "call_id": call_id, "call_terminated": True, "reason": reason}
