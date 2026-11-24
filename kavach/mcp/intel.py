"""
MCP Server: kavach-intel
Manages scam intelligence, reputation checks, entity extraction, and the shared fraud graph.
Uses NetworkX for graph relations, and exports Cytoscape / D3 graph JSON for the Guardian dashboard.
"""

import json
import networkx as nx
from typing import Dict, Any, List, Optional
from datetime import datetime

class IntelServer:
    def __init__(self, policy_gate, seed_intel_path: str):
        self.policy_gate = policy_gate
        self.graph = nx.DiGraph()
        self.intel_db: Dict[str, Any] = {}
        self._load_seed_data(seed_intel_path)

    def _load_seed_data(self, seed_intel_path: str):
        with open(seed_intel_path, "r", encoding="utf-8") as f:
            self.intel_db = json.load(f)

        # Build initial graph
        # 1. Add syndicates
        for syn_id, syn_data in self.intel_db.get("syndicates", {}).items():
            self.graph.add_node(
                syn_id,
                label=syn_data["name"],
                type="syndicate",
                color="#E5484D",
                size=28,
                details=syn_data
            )

        # 2. Add numbers
        for num, num_data in self.intel_db.get("numbers", {}).items():
            is_scam = num_data.get("risk_score", 0) > 0.5
            self.graph.add_node(
                num,
                label=num,
                type="phone",
                color="#E5484D" if is_scam else "#4CC38A",
                size=18,
                details=num_data
            )
            if num_data.get("syndicate_id"):
                self.graph.add_edge(num, num_data["syndicate_id"], relation="OPERATED_BY")

        # 3. Add UPI IDs
        for upi, upi_data in self.intel_db.get("upi_ids", {}).items():
            self.graph.add_node(
                upi,
                label=upi,
                type="upi",
                color="#F5A524",
                size=16,
                details=upi_data
            )
            if upi_data.get("syndicate_id"):
                self.graph.add_edge(upi, upi_data["syndicate_id"], relation="LAUNDERS_FOR")

        # 4. Add Mule Accounts
        for mule, mule_data in self.intel_db.get("mule_accounts", {}).items():
            self.graph.add_node(
                mule,
                label=mule,
                type="mule_account",
                color="#E5484D",
                size=20,
                details=mule_data
            )
            if mule_data.get("syndicate_id"):
                self.graph.add_edge(mule, mule_data["syndicate_id"], relation="MULE_SETTLEMENT")

        # Link upi to mule account
        if "refund.cbi@okaxis" in self.graph and "HDFC ····4471" in self.graph:
            self.graph.add_edge("refund.cbi@okaxis", "HDFC ····4471", relation="DEPOSITS_INTO")

        # 5. Add Protected Families / Targets
        families = [
            ("Amma (Bengaluru)", "victim", "#6C70F0", "Protected by KAVACH (Son Rahul)"),
            ("Sunita Devi (Lucknow)", "victim", "#6C70F0", "Protected by KAVACH"),
            ("R. Ramanathan (Chennai)", "victim", "#6C70F0", "Protected by KAVACH")
        ]
        for fam_id, fam_type, color, desc in families:
            self.graph.add_node(
                fam_id,
                label=fam_id,
                type=fam_type,
                color=color,
                size=14,
                details={"status": "PROTECTED", "notes": desc}
            )

        # Link scammer to target
        self.graph.add_edge("+91 98XXX XX210", "Amma (Bengaluru)", relation="ATTACK_INTERCEPTED")

    def check_number(self, phone_number: str) -> Dict[str, Any]:
        """Query reputation and risk score for a phone number"""
        args = {"phone_number": phone_number}
        eval_res = self.policy_gate.evaluate("IntelAgent", "intel.check_number", args)
        if not eval_res["allowed"]:
            return eval_res

        clean_num = phone_number.strip()
        record = self.intel_db.get("numbers", {}).get(clean_num)

        if record:
            return {
                "phone_number": clean_num,
                "found": True,
                "risk_score": record["risk_score"],
                "reported_count": record["reported_count"],
                "category": record["category"],
                "syndicate_id": record["syndicate_id"],
                "is_scam": record["risk_score"] >= 0.7,
                "operator": record.get("operator")
            }
        else:
            # Fallback heuristic for unknown number
            return {
                "phone_number": clean_num,
                "found": False,
                "risk_score": 0.50,
                "reported_count": 1,
                "category": "Unknown Caller",
                "is_scam": False,
                "operator": "Unknown Telecom Circle"
            }

    def check_url(self, url: str) -> Dict[str, Any]:
        """Check domain and link indicators"""
        args = {"url": url}
        eval_res = self.policy_gate.evaluate("IntelAgent", "intel.check_url", args)
        if not eval_res["allowed"]:
            return eval_res

        suspicious_patterns = ["bit.ly", "tinyurl", "eb-bill", "apk", "pay-now", "update-kyc"]
        is_risky = any(p in url.lower() for p in suspicious_patterns)

        return {
            "url": url,
            "risk_score": 0.94 if is_risky else 0.1,
            "phishing_detected": is_risky,
            "category": "Electricity Bill Phishing" if "eb-bill" in url else "Unknown URL",
            "action_recommendation": "DO_NOT_CLICK" if is_risky else "SAFE"
        }

    def add_entity(self, entity_id: str, label: str, entity_type: str, details: Dict[str, Any] = None) -> Dict[str, Any]:
        """Add new extracted node to fraud graph"""
        args = {"entity_id": entity_id, "entity_type": entity_type, "label": label}
        eval_res = self.policy_gate.evaluate("IntelExtractorAgent", "intel.add_entity", args)
        if not eval_res["allowed"]:
            return eval_res

        color_map = {
            "phone": "#E5484D",
            "upi": "#F5A524",
            "mule_account": "#E5484D",
            "syndicate": "#E5484D",
            "victim": "#6C70F0"
        }
        self.graph.add_node(
            entity_id,
            label=label,
            type=entity_type,
            color=color_map.get(entity_type, "#A1A1A6"),
            size=18,
            details=details or {}
        )
        return {"status": "SUCCESS", "entity_id": entity_id}

    def link_entities(self, source_id: str, target_id: str, relation: str) -> Dict[str, Any]:
        """Link two nodes in the fraud graph"""
        args = {"source_id": source_id, "target_id": target_id, "relation": relation}
        eval_res = self.policy_gate.evaluate("IntelExtractorAgent", "intel.link_entities", args)
        if not eval_res["allowed"]:
            return eval_res

        self.graph.add_edge(source_id, target_id, relation=relation)
        return {"status": "SUCCESS", "source": source_id, "target": target_id, "relation": relation}

    def get_fraud_graph(self) -> Dict[str, Any]:
        """Return full network graph data formatted for visual rendering"""
        args = {}
        eval_res = self.policy_gate.evaluate("DashboardAgent", "intel.get_fraud_graph", args)
        if not eval_res["allowed"]:
            return eval_res
        return self.graph_payload()

    def graph_payload(self) -> Dict[str, Any]:
        """Graph as JSON, without an audit entry (the dashboard's own reads are not agent actions)."""
        nodes = []
        for n, d in self.graph.nodes(data=True):
            nodes.append({
                "id": n,
                "label": d.get("label", n),
                "type": d.get("type", "unknown"),
                "color": d.get("color", "#A1A1A6"),
                "size": d.get("size", 16),
                "details": d.get("details", {})
            })

        links = []
        for u, v, d in self.graph.edges(data=True):
            links.append({
                "source": u,
                "target": v,
                "relation": d.get("relation", "CONNECTED_TO")
            })

        return {
            "nodes": nodes,
            "links": links,
            "stats": {
                "total_nodes": len(nodes),
                "total_links": len(links),
                "syndicates_tracked": len(self.intel_db.get("syndicates", {})),
                "mule_accounts_mapped": len(self.intel_db.get("mule_accounts", {}))
            }
        }
