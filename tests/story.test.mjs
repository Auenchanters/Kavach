// node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { apply, freshState, sceneState, createStory, pending, SCENES } from "../docs/shared/story.js";

test("approving runs the gated action once", () => {
  let s = sceneState("recover");
  const hold = s.recovery.hold;
  s = apply(s, "decide", { id: hold, approve: true });
  assert.equal(s.approvals[hold].status, "EXECUTED");
  assert.equal(s.approvals[hold].result.account, "HDFC ····4471");
  assert.throws(() => apply(s, "decide", { id: hold, approve: true }), /Already executed/);
});

test("a rejected action cannot be approved later", () => {
  let s = sceneState("recover");
  s = apply(s, "decide", { id: s.recovery.ncrp, approve: false });
  assert.throws(() => apply(s, "decide", { id: s.recovery.ncrp, approve: true }), /Already rejected/);
});

test("recover scene has an incident, a sealed dossier and the right approvals waiting", () => {
  const s = sceneState("recover");
  assert.equal(s.recovery.inc.amount, 48000);
  assert.equal(s.recovery.dossier.sha256.length, 64);
  const tools = pending(s).map((p) => p.tool).sort();
  assert.deepEqual(tools, ["bank.request_hold", "report.draft_ncrp_complaint", "report.file_chakshu"]);
});

test("the decoy files one Chakshu report per engagement and captures both entities", () => {
  const s = sceneState("decoy");
  assert.equal(Object.values(s.approvals).filter((a) => a.tool === "report.file_chakshu").length, 1);
  assert.deepEqual(s.decoy.upi, ["refund.cbi@okaxis"]);
  assert.deepEqual(s.decoy.accounts, ["HDFC ····4471"]);
  assert.ok(s.graph.nodes.some((n) => n.id === "HDFC ····4471" && n.fresh));
});

test("never-allowed tools are blocked", () => {
  assert.equal(sceneState("forbidden").forbidden.decision, "BLOCKED");
});

test("every scene builds without throwing", () => {
  for (const name of Object.keys(SCENES)) assert.ok(sceneState(name).rev >= 0, name);
});

test("state survives a JSON round trip (it is shared between tabs)", () => {
  const s = sceneState("approved");
  assert.deepEqual(JSON.parse(JSON.stringify(s)), s);
});

test("a change in one tab reaches the other", async () => {
  const a = createStory({ channel: "t1" });
  const b = createStory({ channel: "t1" });
  const got = new Promise((resolve) => b.subscribe((state, meta) => meta.remote && resolve(state)));
  a.dispatch("check-sms");
  const state = await got;
  assert.equal(state.sms.verdict, "scam");
  a.close(); b.close();
});

test("tap-kavach on an idle phone screens the call first", () => {
  const s = apply(freshState(), "tap-kavach");
  assert.equal(s.call.status, "joined");
  assert.ok(s.logs.some((l) => l.tool === "telephony.answer_call"));
});
