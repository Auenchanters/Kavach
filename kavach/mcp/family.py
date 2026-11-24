"""
MCP Server: kavach-family
Handles communications with the protected user and family guardian (Rahul).
Provides simulated Telegram notifications, interactive approval buttons, and voice notes.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid

class FamilyServer:
    def __init__(self, policy_gate):
        self.policy_gate = policy_gate
        self.messages: List[Dict[str, Any]] = []
        self.voice_notes: List[Dict[str, Any]] = []

    def notify_guardian(self, guardian_id: str, alert_level: str, title: str, details: List[str], actions: List[Dict[str, str]], incident_id: str = "INC-001") -> Dict[str, Any]:
        """
        Sends rich alert message to Rahul's Telegram channel with interactive callback buttons.
        TIER: AUTOMATIC
        """
        args = {"guardian_id": guardian_id, "alert_level": alert_level, "title": title}
        eval_res = self.policy_gate.evaluate("GuardianAgent", "family.notify_guardian", args)
        if not eval_res["allowed"]:
            return eval_res

        msg_id = f"TG-MSG-{len(self.messages)+1:03d}"
        formatted_message = {
            "id": msg_id,
            "guardian_id": guardian_id,
            "time": datetime.now().strftime("%I:%M %p"),
            "alert_level": alert_level,  # "CRITICAL", "WARNING", "INFO"
            "header": f"🛡️ KAVACH ALERT · {datetime.now().strftime('%I:%M %p')}",
            "title": title,
            "bullet_points": details,
            "actions": actions,  # e.g. [{"id": "approve_chakshu", "label": "Approve report", "type": "primary"}]
            "incident_id": incident_id,
            "status": "DELIVERED"
        }
        self.messages.insert(0, formatted_message)
        return {
            "status": "SUCCESS",
            "message_id": msg_id,
            "delivered_to": guardian_id
        }

    def request_approval(self, approval_id: str, action_name: str, description: str, impact: str) -> Dict[str, Any]:
        """
        Creates an actionable approval request card in Telegram.
        TIER: AUTOMATIC
        """
        args = {"approval_id": approval_id, "action_name": action_name}
        eval_res = self.policy_gate.evaluate("GuardianAgent", "family.request_approval", args)
        if not eval_res["allowed"]:
            return eval_res

        card = {
            "id": f"APPR-REQ-{approval_id}",
            "approval_id": approval_id,
            "time": datetime.now().strftime("%I:%M %p"),
            "action_name": action_name,
            "description": description,
            "impact": impact,
            "buttons": [
                {"action_id": approval_id, "label": "Approve", "value": "APPROVED", "color": "#4CC38A"},
                {"action_id": approval_id, "label": "Reject", "value": "REJECTED", "color": "#E5484D"}
            ]
        }
        return {"status": "SUCCESS", "card": card}

    def send_voice_note(self, recipient: str, transcript: str, audio_file: str = "warning.ogg", language: str = "kn") -> Dict[str, Any]:
        """
        Delivers an audio voice note to Amma's WhatsApp / KAVACH app.
        TIER: AUTOMATIC
        """
        args = {"recipient": recipient, "language": language}
        eval_res = self.policy_gate.evaluate("ShieldAgent", "family.send_voice_note", args)
        if not eval_res["allowed"]:
            return eval_res

        vn = {
            "id": f"VN-{uuid.uuid4().hex[:6]}",
            "time": datetime.now().strftime("%H:%M:%S"),
            "recipient": recipient,
            "language": language,
            "transcript": transcript,
            "audio_file": audio_file,
            "duration": "0:08"
        }
        self.voice_notes.insert(0, vn)
        return {"status": "SUCCESS", "voice_note": vn}

    def get_messages(self) -> List[Dict[str, Any]]:
        return self.messages

    def get_voice_notes(self) -> List[Dict[str, Any]]:
        return self.voice_notes
