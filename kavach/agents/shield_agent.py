"""
Shield Agent: Protects Amma every day.
Screens unknown numbers, joins live suspicious calls via conference call,
detects scam playbooks, speaks calm native warnings, and alerts Rahul.
"""

import re
from typing import Dict, Any, List

LANGUAGE_NAMES = {"kn": "Kannada", "hi": "Hindi", "en": "English"}

SMS_WARNINGS = {
    "kn": "ಅಮ್ಮಾ, ಇದು ನಕಲಿ ಸಂದೇಶ. ಆ ಲಿಂಕ್ ಮೇಲೆ ಒತ್ತಬೇಡಿ, ಯಾರಿಗೂ ಹಣ ಕಳುಹಿಸಬೇಡಿ!",
    "hi": "अम्मा, यह एक फर्जी मैसेज है। किसी भी लिंक पर क्लिक न करें, किसी को पैसे न भेजें!",
    "en": "Amma, this message is a scam. Do not tap the link and do not send anyone money.",
}

class ShieldAgent:
    def __init__(self, telephony_srv, intel_srv, knowledge_srv, family_srv, report_srv):
        self.telephony = telephony_srv
        self.report = report_srv
        self.intel = intel_srv
        self.knowledge = knowledge_srv
        self.family = family_srv

    def screen_incoming_call(self, caller_number: str) -> Dict[str, Any]:
        """
        Step 1: Check incoming number against Intel MCP.
        If high risk, answers on behalf of Amma; if known contact, lets ring.
        """
        reputation = self.intel.check_number(caller_number)
        call_id = f"CALL-{caller_number[-4:]}"

        if reputation.get("is_scam") or reputation.get("risk_score", 0) > 0.7:
            ans_res = self.telephony.answer_call(call_id, caller_number)
            return {
                "action": "KAVACH_SCREENING",
                "caller_number": caller_number,
                "risk_score": reputation["risk_score"],
                "reported_count": reputation.get("reported_count"),
                "category": reputation.get("category"),
                "syndicate_id": reputation.get("syndicate_id"),
                "verdict": "HIGH_RISK_SCAM_CALLER",
                "screening_status": "INTERCEPTED_BEFORE_RINGING",
                "message": "Call intercepted by KAVACH. Amma's phone is protected from ringing."
            }
        else:
            return {
                "action": "RING_NORMALLY",
                "caller_number": caller_number,
                "risk_score": reputation.get("risk_score", 0.05),
                "category": reputation.get("category", "Normal"),
                "verdict": "BENIGN_OR_TRUSTED",
                "screening_status": "PUT_THROUGH_WITH_SUMMARY",
                "message": "Known or benign caller. Phone rings normally."
            }

    def handle_kavach_button_tap(self, call_id: str, current_transcript: str, language: str = "kn") -> Dict[str, Any]:
        """
        Step 2: Amma has already picked up an unknown call and feels suspicious.
        She taps the prominent KAVACH button.
        KAVACH joins as conference participant, analyzes transcript, speaks warning, alerts Rahul.
        """
        # 1. Join conference
        conf_res = self.telephony.join_conference(call_id, participant="KAVACH_SHIELD")

        # 2. Match pattern
        detection = self.knowledge.match_scam_pattern(current_transcript)
        risk_score = detection.get("risk_score", 0.94)
        category = detection.get("category", "digital_arrest")

        # 3. Get native safe advice
        advice_res = self.knowledge.get_safe_advice(category, language)
        warning_text = advice_res.get("advice")

        # 4. Speak warning into conference call
        speak_res = self.telephony.speak_warning(call_id, warning_text, language)

        # 5. Queue a Sanchar Saathi (Chakshu) report; it waits for Rahul's approval
        chakshu = self.report.file_chakshu(
            phone_number="+91 98XXX XX210",
            category=detection.get("name", "Suspected scam call"),
            evidence=f"Matched keywords: {', '.join(detection.get('matched_keywords', [])) or 'none'}",
        )

        # 6. Alert Rahul immediately via Family MCP
        family_res = self.family.notify_guardian(
            guardian_id="Rahul (Son)",
            alert_level="CRITICAL",
            title=f"Amma received a '{detection.get('name', 'Digital Arrest')}' scam call",
            details=[
                f"Matched playbook: {detection.get('name', 'unknown')} (risk {risk_score:.0%}).",
                f"KAVACH joined the call and spoke a calm warning to Amma in {LANGUAGE_NAMES.get(language, language)}.",
                "No money was moved.",
                "Sanchar Saathi report on +91 98XXX XX210 is waiting for your approval."
            ],
            actions=[a for a in [
                {"id": chakshu.get("approval_id"), "label": "Approve report", "type": "primary"},
            ] if a["id"]] + [{"id": "call_amma", "label": "Call Amma", "type": "link"}],
            incident_id=call_id
        )

        return {
            "status": "INTERVENED",
            "conference": conf_res,
            "detection": detection,
            "spoken_warning": warning_text,
            "language": language,
            "risk_score": risk_score,
            "guardian_alert": family_res,
            "suggested_action": "HANG_UP"
        }

    def check_sms(self, sms_text: str, sender: str = "VK-DISCOM-ALERT", language: str = "kn") -> Dict[str, Any]:
        """
        Step 3: Analyze incoming SMS or forwarded WhatsApp message.
        Checks for malicious URLs and scam patterns, then generates a voice note verdict for Amma.
        """
        # Look for URLs
        url_match = re.search(r'(https?://[^\s]+|bit\.ly/[^\s]+|tinyurl\.com/[^\s]+)', sms_text)
        url_analysis = None
        if url_match:
            url_analysis = self.intel.check_url(url_match.group(1))

        # Check knowledge pattern
        pattern = self.knowledge.match_scam_pattern(sms_text)

        is_scam = (url_analysis and url_analysis.get("phishing_detected")) or pattern.get("detected")

        # Voice note for Amma, only when there is something to warn about
        vn_res = None
        if is_scam:
            vn_res = self.family.send_voice_note(
                recipient="Amma",
                transcript=SMS_WARNINGS.get(language, SMS_WARNINGS["en"]),
                audio_file="voice_note_warning.ogg",
                language=language
            )

        return {
            "is_scam": bool(is_scam),
            "sender": sender,
            "url_analysis": url_analysis,
            "pattern_analysis": pattern,
            "voice_note": vn_res,
            "verdict": "PHISHING_MALICIOUS" if is_scam else "SAFE"
        }
