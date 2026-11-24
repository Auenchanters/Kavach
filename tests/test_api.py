import pytest
from fastapi.testclient import TestClient

from kavach.orchestrator.server import app


@pytest.fixture()
def client():
    c = TestClient(app)
    c.post("/api/reset")
    return c


def pending(client):
    return {p["tool"]: p["approval_id"] for p in client.get("/api/pending-approvals").json()}


def test_web_app_served(client):
    r = client.get("/")
    assert r.status_code == 200 and "KAVACH" in r.text


def test_screen_known_scammer_is_intercepted(client):
    r = client.post("/api/shield/screen-call", json={"caller_number": "+91 98XXX XX210"}).json()
    assert r["action"] == "KAVACH_SCREENING"


def test_kavach_tap_queues_real_chakshu_approval(client):
    r = client.post("/api/shield/kavach-tap", json={"language": "hi"}).json()
    assert r["detection"]["detected"] and r["status"] == "INTERVENED"
    appr_id = pending(client)["report.file_chakshu"]
    msg = client.get("/api/telegram-messages").json()[0]
    assert msg["actions"][0]["id"] == appr_id
    assert any("Hindi" in b for b in msg["bullet_points"])


def test_approval_executes_the_gated_action_once(client):
    client.post("/api/recover/trigger", json={"amount": 12500, "destination_mule": "SBI ····9001"})
    appr = pending(client)["bank.request_hold"]

    r = client.post(f"/api/approvals/{appr}/action", json={"action": "APPROVE"})
    assert r.status_code == 200
    result = r.json()["approval"]["result"]
    assert result["status"] == "SUCCESS"
    assert result["hold_details"]["mule_account"] == "SBI ····9001"
    assert result["hold_details"]["amount_frozen"] == 12500

    # second approve is refused; token was consumed
    assert client.post(f"/api/approvals/{appr}/action", json={"action": "APPROVE"}).status_code == 409


def test_token_only_works_for_its_own_tool():
    from kavach.orchestrator.policy_gate import PolicyGate
    gate = PolicyGate()
    res = gate.evaluate("a", "bank.request_hold", {})
    gate.pending_approvals[res["approval_id"]]["status"] = "APPROVED"
    other = gate.evaluate("a", "report.file_chakshu", {}, approval_token=res["approval_id"])
    assert other["decision"] == "APPROVAL_PENDING"


def test_rejected_action_cannot_be_approved_later(client):
    client.post("/api/recover/trigger", json={})
    appr = pending(client)["report.draft_ncrp_complaint"]
    assert client.post(f"/api/approvals/{appr}/action", json={"action": "REJECT"}).status_code == 200
    assert client.post(f"/api/approvals/{appr}/action", json={"action": "APPROVE"}).status_code == 409


def test_unknown_approval_and_bad_action(client):
    assert client.post("/api/approvals/NOPE/action", json={"action": "APPROVE"}).status_code == 404
    assert client.post("/api/approvals/NOPE/action", json={"action": "approve-ish"}).status_code == 422


def test_1930_brief_uses_incident_data(client):
    r = client.post("/api/recover/trigger", json={"amount": 7000, "transaction_id": "UPI-1", "destination_mule": "AXIS ····1"}).json()
    brief = r["agents"]["helpline_1930_agent"]
    assert brief["status"] == "EXECUTED"
    script = brief["result"]["verbal_script"]
    assert "UPI-1" in script and "AXIS ····1" in script and "7,000" in script


def test_decoy_files_one_chakshu_per_engagement(client):
    for _ in range(3):
        client.post("/api/strike/turn", json={"message": "Send to refund.cbi@okaxis now"})
    assert sum(p["tool"] == "report.file_chakshu" for p in client.get("/api/pending-approvals").json()) == 1


def test_decoy_does_not_capture_email_as_upi(client):
    r = client.post("/api/strike/turn", json={"message": "mail me at boss@gmail.com"}).json()
    assert r["captured_upi"] is None


def test_never_allowed_is_blocked(client):
    assert client.post("/api/policy/test-violation").json()["decision"] == "BLOCKED"


def test_safe_sms_sends_no_voice_note(client):
    r = client.post("/api/shield/check-sms", json={"sms_text": "Lunch at 1?", "language": "en"}).json()
    assert r["verdict"] == "SAFE" and r["voice_note"] is None


def test_input_size_is_bounded(client):
    assert client.post("/api/strike/turn", json={"message": "x" * 5000}).status_code == 422


def test_dashboard_reads_do_not_fill_the_audit_log(client):
    n = len(client.get("/api/state").json()["audit_log"])
    state = client.get("/api/state").json()
    assert len(state["audit_log"]) == n
    assert len(state["mcp_servers"]) == 6
    assert "strike_stats" in state


def test_policy_violation_supports_other_forbidden_tools(client):
    r = client.post("/api/policy/test-violation", json={"tool_name": "auth.share_otp"})
    assert r.status_code == 200
    assert r.json()["decision"] == "BLOCKED"
    assert r.json()["tier"] == "NEVER_ALLOWED"
