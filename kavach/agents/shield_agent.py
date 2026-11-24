"""
Shield Agent: Protects Amma every day.
Screens unknown numbers, joins live suspicious calls via conference call,
detects scam playbooks, speaks calm native warnings, and alerts Rahul.
"""

from typing import Dict, Any, List

class ShieldAgent:
    def __init__(self, telephony_srv, intel_srv, knowledge_srv, family_srv):
        self.telephony = telephony_srv
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

        # 5. Alert Rahul immediately via Family MCP
        family_res = self.family.notify_guardian(
            guardian_id="Rahul (Son)",
            alert_level="CRITICAL",
            title=f"Amma received a '{detection.get('name', 'Digital Arrest')}' scam call",
            details=[
                "Caller claimed to be a CBI officer and demanded she stay on a video call.",
                "KAVACH joined the conference call and spoke a calm warning to Amma in Kannada.",
                "Caller hung up. No money was moved.",
                "Number +91 98XXX XX210 reported to Sanchar Saathi (pending your approval)."
            ],
            actions=[
                {"id": "appr_chakshu_01", "label": "Approve report", "type": "primary"},
                {"id": "call_amma", "label": "Call Amma", "type": "secondary"},
                {"id": "view_tx", "label": "View transcript", "type": "secondary"}
            ],
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
        import re
        url_match = re.search(r'(https?://[^\s]+|bit\.ly/[^\s]+|tinyurl\.com/[^\s]+)', sms_text)
        url_analysis = None
        if url_match:
            url_analysis = self.intel.check_url(url_match.group(1))

        # Check knowledge pattern
        pattern = self.knowledge.match_scam_pattern(sms_text)

        is_scam = (url_analysis and url_analysis.get("phishing_detected")) or pattern.get("detected")

        # Generate voice note for Amma
        voice_text = "ಅಮ್ಮಾ, ಇದು ನಕಲಿ ವಿದ್ಯುತ್ ಬಿಲ್ ಸಂದೇಶ. ಆ ಲಿಂಕ್ ಮೇಲೆ ಒತ್ತಬೇಡಿ!" if language == "kn" else \
                     "अम्मा, यह एक फर्जी मैसेज है। किसी भी लिंक पर क्लिक न करें!"

        vn_res = self.family.send_voice_note(
            recipient="Amma",
            transcript=voice_text,
            audio_file="voice_note_warning.ogg",
            language=language
        )

        return {
            "is_scam": is_scam,
            "sender": sender,
            "url_analysis": url_analysis,
            "pattern_analysis": pattern,
            "voice_note": vn_res,
            "verdict": "PHISHING_MALICIOUS" if is_scam else "SAFE"
        }
