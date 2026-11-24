#!/usr/bin/env python3
"""
KAVACH Prototype Runner.
Starts the FastAPI Orchestrator, mounts the 6 FastMCP servers, and serves the dual-screen web interface.
"""

import sys
import os
from pathlib import Path

# Ensure workspace root is in python path
current_dir = Path(__file__).resolve().parent.parent
if str(current_dir) not in sys.path:
    sys.path.insert(0, str(current_dir))

import uvicorn
from kavach.orchestrator.server import app

def main():
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    print("=" * 60)
    print("🛡️  KAVACH Multi-Agent Scam Defense System")
    print("   Track 1: Make MCP Matter · wHACKiest 2026")
    print("   Tagline: 'No Amma left alone with a scammer.'")
    print("=" * 60)
    print("✓ Policy Gate Initialized (3 Action Tiers enforced)")
    print("✓ 6 FastMCP Servers Online: telephony, intel, bank, report, family, knowledge")
    print("✓ Multi-Agent Swarm Ready: Shield, Strike Decoy, Recover Swarm (4 agents)")
    print(f"🚀 Prototype Web App Running at: http://localhost:{port}")
    print("=" * 60)
    uvicorn.run(app, host=host, port=port, log_level="info")

if __name__ == "__main__":
    main()
