"""
Tool server kavach-knowledge: in-process stand-in for the MCP server built at the hackathon.
Matches spoken conversation or SMS against official RBI, DoT, and I4C scam playbooks.
Delivers verified safe advice in Kannada, Hindi, and English.
"""

import json
from typing import Any


class KnowledgeServer:
    def __init__(self, policy_gate, playbooks_path: str):
        self.policy_gate = policy_gate
        self.playbooks: dict[str, Any] = {}
        with open(playbooks_path, encoding="utf-8") as f:
            self.playbooks = json.load(f)

    def match_scam_pattern(self, text: str) -> dict[str, Any]:
        """
        Analyzes transcript text against known modus operandi.
        Returns match score (0.0 to 1.0), identified playbook, matched keywords, and recommended action.
        TIER: AUTOMATIC
        """
        args = {"text_preview": text[:60]}
        eval_res = self.policy_gate.evaluate("ScamDetectorAgent", "knowledge.match_scam_pattern", args)
        if not eval_res["allowed"]:
            return eval_res

        lower_text = text.lower()
        best_match = None
        highest_score = 0.0
        matched_kw_list = []

        for category, pb in self.playbooks.items():
            keywords = pb.get("keywords", [])
            matches = [kw for kw in keywords if kw.lower() in lower_text]
            if matches:
                # Calculate match density & weight
                # capped below 1.0: keyword matching is never certain
                score = min(0.97, (len(matches) * 0.25) + pb.get("risk_weight", 0.8) * 0.5)
                if score > highest_score:
                    highest_score = score
                    best_match = category
                    matched_kw_list = matches

        if best_match and highest_score >= 0.65:
            pb_data = self.playbooks[best_match]
            return {
                "detected": True,
                "category": best_match,
                "name": pb_data["name"],
                "risk_score": round(highest_score, 2),
                "matched_keywords": matched_kw_list,
                "advisory_source": pb_data.get("advisory_source"),
                "safe_advice": pb_data.get("safe_advice", {}),
                "action_script": pb_data.get("action_script"),
            }
        else:
            return {
                "detected": False,
                "category": "BENIGN_OR_INCONCLUSIVE",
                "risk_score": 0.20,
                "matched_keywords": [],
                "advisory_source": None,
                "safe_advice": {},
                "action_script": "Continue normal screening.",
            }

    def get_safe_advice(self, category: str, language: str = "kn") -> dict[str, Any]:
        """
        Fetches approved guidance line for the given category in user's language.
        TIER: AUTOMATIC
        """
        args = {"category": category, "language": language}
        eval_res = self.policy_gate.evaluate("ScamDetectorAgent", "knowledge.get_safe_advice", args)
        if not eval_res["allowed"]:
            return eval_res

        pb = self.playbooks.get(category, {})
        advice_dict = pb.get("safe_advice", {})
        advice = advice_dict.get(language, advice_dict.get("en", "Be cautious with unknown callers."))

        return {"category": category, "language": language, "advice": advice}
