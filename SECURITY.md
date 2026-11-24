# Security policy

KAVACH is a hackathon prototype. It handles no real calls, money or personal data: every phone number,
UPI ID and account in this repository is a masked demo value.

## What the code enforces today

- **Policy gate on every tool call** ([`kavach/orchestrator/policy_gate.py`](kavach/orchestrator/policy_gate.py)):
  unknown tools default to the *never allowed* tier; moving money, sharing OTPs, reading banking apps and
  impersonating police are blocked and logged.
- **Guardian approvals are single-use and bound to one tool**: an approval for a bank hold cannot authorise
  a police complaint, and an approved or rejected request cannot be replayed (tests in [`tests/test_api.py`](tests/test_api.py)).
- **Bounded input at the API boundary**: every request field has a length or range limit and enumerated values
  are validated ([`kavach/orchestrator/server.py`](kavach/orchestrator/server.py)); oversized input returns 422.
- **No secrets in the repository**: the web prototype is static and calls no paid API.
- **No HTML injection in the web app**: user-visible text is written with `textContent` or escaped before insertion.

## Known limits (prototype)

- The FastAPI demo server has no authentication; anyone who can reach it can approve actions. Do not expose it publicly
  with real data. The hackathon build adds guardian authentication.
- State is in memory and shared by all visitors of one server process.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting on this repository (Security → Report a vulnerability)
rather than a public issue. We aim to reply within 7 days.
