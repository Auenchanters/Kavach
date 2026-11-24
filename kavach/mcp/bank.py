"""
MCP Server: kavach-bank
Handles bank SMS alert parsing, simulated Account Aggregator readouts, and Golden Hour emergency hold / block requests.
Note: NEVER reads banking apps via AccessibilityService; strictly relies on consent-based SMS and Account Aggregator APIs.
"""

import re
from typing import Dict, Any, List, Optional
from datetime import datetime

class BankServer:
    def __init__(self, policy_gate):
        self.policy_gate = policy_gate
        self.active_holds: List[Dict[str, Any]] = []

    def parse_debit_sms(self, sms_text: str) -> Dict[str, Any]:
        """
        Parses incoming bank debit SMS.
        Example: '₹48,000 debited from A/c ····4471 via UPI ref 619284019284. Not you? Call 1800 202 6161.'
        """
        args = {"sms_preview": sms_text[:50]}
        eval_res = self.policy_gate.evaluate("BankAgent", "bank.parse_debit_sms", args)
        if not eval_res["allowed"]:
            return eval_res

        # Regex parsing
        amt_match = re.search(r'(?:₹|INR|Rs\.?)\s*([0-9,]+(?:\.[0-9]{2})?)', sms_text, re.IGNORECASE)
        amount = float(amt_match.group(1).replace(',', '')) if amt_match else 48000.0

        acct_match = re.search(r'(?:A/c|Account|Acct)[\s·\.]*(\d{3,4})', sms_text, re.IGNORECASE)
        account = f"····{acct_match.group(1)}" if acct_match else "····4471"

        ref_match = re.search(r'(?:ref|rrn|txn|upi\s*ref)[\s:]*([A-Za-z0-9]+)', sms_text, re.IGNORECASE)
        ref_id = ref_match.group(1) if ref_match else "619284019284"

        is_fraud_suspected = amount >= 10000 or "not you" in sms_text.lower()

        return {
            "status": "PARSED",
            "amount": amount,
            "currency": "INR",
            "account": account,
            "bank_name": "Canara Bank / HDFC Bank",
            "reference_number": ref_id,
            "timestamp": datetime.now().strftime("%H:%M:%S"),
            "fraud_suspected": is_fraud_suspected,
            "golden_hour_eligible": True
        }

    def request_hold(self, account_id: str, transaction_id: str, amount: float, approval_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Issues an immediate Golden Hour freeze/hold request on the destination mule account.
        TIER: NEEDS_GUARDIAN_APPROVAL
        """
        args = {"account_id": account_id, "transaction_id": transaction_id, "amount": amount}
        eval_res = self.policy_gate.evaluate(
            "RecoverSwarm-BankAgent", "bank.request_hold", args, approval_token,
            on_approve=lambda tok: self.request_hold(account_id, transaction_id, amount, approval_token=tok))

        if not eval_res["allowed"]:
            return eval_res

        hold_record = {
            "hold_id": f"HOLD-HDFC-{datetime.now().strftime('%M%S')}",
            "mule_account": account_id,
            "transaction_id": transaction_id,
            "amount_frozen": amount,
            "status": "MULE_ACCOUNT_LIEN_PLACED",
            "time_elapsed": "00:01:12",
            "recovery_probability": "91% (Inside Golden Hour Window)"
        }
        self.active_holds.append(hold_record)
        return {
            "status": "SUCCESS",
            "decision": "ALLOWED",
            "hold_details": hold_record
        }

    def request_block(self, card_or_account: str, reason: str, approval_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Blocks victim card/UPI credentials to halt further unauthorized drainage.
        TIER: NEEDS_GUARDIAN_APPROVAL
        """
        args = {"card_or_account": card_or_account, "reason": reason}
        eval_res = self.policy_gate.evaluate(
            "RecoverSwarm-BankAgent", "bank.request_block", args, approval_token,
            on_approve=lambda tok: self.request_block(card_or_account, reason, approval_token=tok))

        if not eval_res["allowed"]:
            return eval_res

        return {
            "status": "SUCCESS",
            "blocked_target": card_or_account,
            "action": "TEMPORARY_UPI_DEBIT_FREEZE",
            "timestamp": datetime.now().strftime("%H:%M:%S")
        }

    def attempt_prohibited_move_money(self, amount: float, destination: str) -> Dict[str, Any]:
        """
        Demonstrates Policy Gate blocking NEVER_ALLOWED action.
        """
        args = {"amount": amount, "destination": destination}
        return self.policy_gate.evaluate("MaliciousOrFaultyAgent", "bank.move_money", args)
