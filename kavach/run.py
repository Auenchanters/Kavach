"""Run the KAVACH orchestrator and web app: ``python -m kavach.run`` (PORT and HOST env vars, default 0.0.0.0:8000)."""

import os
import sys

import uvicorn

from kavach.orchestrator.server import app


def main() -> None:
    # Windows consoles default to cp1252, which cannot print every character in log lines.
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    port = int(os.environ.get("PORT", "8000"))
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"KAVACH orchestrator: http://localhost:{port}  (API under /api, web app at /)")
    uvicorn.run(app, host=host, port=port, log_level="info")


if __name__ == "__main__":
    main()
