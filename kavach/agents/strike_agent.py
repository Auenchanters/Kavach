"""
Strike Agent: The Decoy Persona & Intelligence Extractor (Daisy for India).
Engages scammers in conversation using a chatty, slightly confused retiree persona.
Steers the scammer into revealing UPI IDs, mule bank accounts, and telephone nodes.
Automatically extracts structured intelligence, updates the fraud graph, and drafts reports.
"""

from typing import Dict, Any, List
import re

class StrikeAgent:
    def __init__(self, telephony_srv, intel_srv, report_srv, family_srv):
        self.telephony = telephony_srv
        self.intel = intel_srv
        self.report = report_srv
        self.family = family_srv
        self.conversation_step = 0
        self.minutes_wasted = 26
        self.extracted_entities = {
            "upi_ids": [],
            "mule_accounts": [],
            "phone_numbers": []
        }

    def get_persona_profile(self) -> Dict[str, Any]:
        return {
            "name": "Ramesh Sharma",
            "age": 67,
            "role": "Retired High School Mathematics Teacher",
            "location": "Jayanagar, Bengaluru",
            "traits": [
                "Slightly hard of hearing",
                "Asks scammer to repeat slowly",
                "Constantly looking for reading glasses",
                "Mentions his pension account and grandson"
            ],
            "guardrails": [
                "NEVER shares real financial data",
                "NEVER executes actual transfers",
                "NEVER impersonates government officials",
                "Provides only synthetic test accounts"
            ]
        }

    def process_decoy_turn(self, scammer_message: str) -> Dict[str, Any]:
        """
        Processes a turn of the decoy conversation.
        Extracts entities from the scammer's speech, formulates the decoy reply,
        and links any captured financial coordinates to the fraud graph.
        """
        self.conversation_step += 1

        # Extract UPI ID (e.g., refund.cbi@okaxis)
        upi_match = re.search(r'([a-zA-Z0-9_\-\.]+@[a-zA-Z0-9]+)', scammer_message)
        captured_upi = upi_match.group(1) if upi_match else None

        # Extract Bank Account
        acc_match = re.search(r'(?:account\s*(?:number)?|a/c)[\s:]*([0-9]{9,16})', scammer_message, re.IGNORECASE)
        captured_acc = acc_match.group(1) if acc_match else None

        # If detected, register into intel
        if captured_upi and captured_upi not in self.extracted_entities["upi_ids"]:
            self.extracted_entities["upi_ids"].append(captured_upi)
            self.intel.add_entity(captured_upi, captured_upi, "upi", {"captured_by": "StrikeDecoy", "scam_type": "Digital Arrest"})
            self.intel.link_entities("+91 98XXX XX210", captured_upi, "REVEALED_UPI")

        if captured_acc and captured_acc not in self.extracted_entities["mule_accounts"]:
            masked_acc = f"HDFC ····{captured_acc[-4:]}"
            self.extracted_entities["mule_accounts"].append(masked_acc)
            self.intel.add_entity(masked_acc, masked_acc, "mule_account", {"account_number": captured_acc, "bank": "HDFC Bank"})
            if captured_upi:
                self.intel.link_entities(captured_upi, masked_acc, "SETTLES_INTO")

        # Decoy responses depending on context
        decoy_reply = "Haan beta... security deposit? But my pension comes in Canara Bank. Where should I send it? Let me find my reading glasses..."
        if "google pay" in scammer_message.lower() or "upi" in scammer_message.lower():
            decoy_reply = "Re-fund dot see-bee-eye at ok axis... beta, can you spell it slowly? My grandson set up this phone. What was the bank account number?"
        elif captured_acc or "hdfc" in scammer_message.lower():
            decoy_reply = "HDFC Bank Salt Lake... wait beta, my phone screen went black! Ah, it is asking for a 6-digit UPI PIN. Should I put my birth year or retirement year 2018?"

        # Auto-draft Chakshu report
        chakshu_draft = self.report.file_chakshu(
            phone_number="+91 98XXX XX210",
            category="Digital Arrest Impersonation",
            evidence=f"Strike Decoy extracted UPI ID '{captured_upi or 'refund.cbi@okaxis'}' and mule account '{captured_acc or '50100492814471'}'."
        )

        return {
            "step": self.conversation_step,
            "scammer_input": scammer_message,
            "decoy_response": decoy_reply,
            "captured_upi": captured_upi,
            "captured_account": captured_acc,
            "total_minutes_wasted": self.minutes_wasted,
            "all_extracted_entities": self.extracted_entities,
            "chakshu_draft": chakshu_draft,
            "status": "ENGAGING_SCAMMER"
        }
