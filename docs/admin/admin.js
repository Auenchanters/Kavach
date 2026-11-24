import { createStory, pending, SCENES, DECOY_SCRIPT, RAMESH, LANGS, AUTO, APPR } from "../shared/story.js";
import "../shared/theme.js";
import * as voice from "../shared/voice.js";
import { tryMountGraph } from "../shared/three/graph.js";

const $ = (s) => document.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");
const mmss = (sec) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
const story = createStory();
const TITLES = { overview: "Overview", approvals: "Approvals", recover: "Recover", graph: "Fraud graph", decoy: "Decoy", audit: "Audit log" };
const TOOL = {
  "bank.request_hold": ["Freeze the mule account", (a) => `Bank lien on ${a.account} for ${inr(a.amount)} · ${a.ref}`],
  "report.draft_ncrp_complaint": ["File the police complaint", (a) => `cybercrime.gov.in · ${a.incident}`],
  "report.file_chakshu": ["Report the number to Sanchar Saathi", (a) => `${a.number} · ${a.evidence}`],
};
const TIER = { [AUTO]: ["tag-green", "Automatic"], [APPR]: ["tag-amber", "Needs Rahul"], NEVER_ALLOWED: ["tag-red", "Never"] };
const DECISION = { ALLOWED: "Ran", APPROVAL_PENDING: "Waiting", BLOCKED: "Blocked", APPROVED: "Approved", REJECTED: "Rejected" };
let graph = null, seenLogs = null;

function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  $("#toasts").append(t);
  setTimeout(() => t.remove(), 3800);
}

// ---------- navigation ----------
function go() {
  const v = TITLES[location.hash.slice(1)] ? location.hash.slice(1) : "overview";
  document.querySelectorAll(".view").forEach((s) => s.classList.toggle("on", s.id === `v-${v}`));
  document.querySelectorAll(".rail a[data-view]").forEach((a) => (a.dataset.view === v ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
  $("#title").textContent = TITLES[v];
  if (v === "graph" && !graph) {
    graph = { update() {} };
    tryMountGraph($("#graph3d"), story.state.graph).then((g) => { graph = g; setBackend(g.backend); });
  }
}

function setBackend(b) { $("#backend").textContent = b === "webgpu" ? "WebGPU" : b === "webgl2" ? "WebGL 2" : "off"; }

// ---------- pieces ----------
function approvalRow(p) {
  const [title, sub] = TOOL[p.tool] || [p.tool, () => ""];
  const acts = p.status === "PENDING"
    ? `<div class="acts"><button class="btn btn-kavach" data-decide="1" data-id="${esc(p.id)}">Approve</button><button class="btn btn-quiet" data-decide="0" data-id="${esc(p.id)}">Reject</button></div>`
    : `<span class="tag ${p.status === "REJECTED" ? "tag-dim" : "tag-green"}">${p.status === "REJECTED" ? "Rejected" : "Approved · done"}</span>`;
  const res = p.result ? `<p class="result">${esc(p.result.status)} · ${esc(p.result.hold_id || p.result.ack || p.result.ref)}</p>` : "";
  return `<div class="card appr${p.status === "PENDING" ? "" : " done"}"><div><h3>${esc(title)}</h3><p>${esc(sub(p.args))}</p><p class="mono">${esc(p.tool)} · ${esc(p.agent)} · ${esc(p.created)}</p></div>${acts}${res}</div>`;
}

function alertCard(m, s) {
  const acts = m.actions.map((a) => {
    if (a.call) return `<a class="btn btn-quiet" href="tel:${esc(a.call)}">${esc(a.label)}</a>`;
    const p = s.approvals[a.approve];
    if (!p) return "";
    if (p.status === "PENDING") return `<button class="btn btn-kavach" data-decide="1" data-id="${esc(p.id)}">${esc(a.label)}</button>`;
    return `<span class="ok-note"><svg class="i"><use href="#i-check"/></svg>${p.status === "REJECTED" ? "Rejected" : "Done"}</span>`;
  }).join("");
  return `<article class="card alert"><div class="a-top"><span class="tag ${m.level === "critical" ? "tag-red" : "tag-amber"}">${m.level === "critical" ? "Scam" : "Notice"}</span><time class="num">${esc(m.time)}</time></div>
    <h3>${esc(m.title)}</h3><ul>${m.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul><div class="acts">${acts}</div></article>`;
}

function statusLine(s) {
  const n = pending(s).length;
  const wait = n ? ` ${n} ${n === 1 ? "action needs" : "actions need"} you.` : "";
  if (s.recovery) return `₹48,000 recovery is running.${wait}`;
  if (s.call.status === "joined") return `KAVACH is on a scam call with Amma right now.${wait}`;
  if (s.call.status === "live") return `Amma has an incoming call from a high-risk number.${wait}`;
  return `Amma is safe.${wait || " Nothing needs you."}`;
}

// ---------- render ----------
function render(s, meta = {}) {
  $("#status").textContent = statusLine(s);
  const n = pending(s).length;
  $("#cnt").hidden = !n;
  $("#cnt").textContent = n;

  const pend = pending(s);
  $("#needs").innerHTML = pend.length ? pend.map(approvalRow).join("") : `<div class="empty">Nothing waits for you. KAVACH asks before it files a report or freezes an account.</div>`;
  $("#alerts").innerHTML = s.messages.length ? s.messages.map((m) => alertCard(m, s)).join("") : `<div class="empty">No alerts yet. Open Amma’s phone and start the scam call, or jump the story from the menu.</div>`;
  $("#apprAll").innerHTML = Object.values(s.approvals).reverse().map(approvalRow).join("") || `<div class="empty">No approvals yet.</div>`;

  renderTrace(s, meta);
  renderRecover(s);
  renderRings(s);
  renderDecoy(s);
  renderAudit(s);
  if (graph && graph.update) graph.update(s.graph);
  const f = s.forbidden;
  $("#forbidden").hidden = !f;
  if (f) $("#forbidden").innerHTML = `<b>Blocked.</b> An agent tried <span class="mono">bank.move_money</span> (₹50,000 to a mule account). ${esc(f.reason)}`;
  tick();
}

function renderTrace(s, meta) {
  const logs = s.logs.slice(0, 40);
  const fresh = seenLogs === null || meta.type === "reset" || meta.type === "scene" ? 0 : Math.max(0, s.logs.length - seenLogs);
  seenLogs = s.logs.length;
  $("#trace").innerHTML = logs.map((l, i) => {
    const [cls] = TIER[l.tier] || ["tag-dim"];
    const anim = i < fresh ? ` class="in" style="animation-delay:${(fresh - 1 - i) * 260}ms"` : "";
    return `<li${anim}><span class="t-time">${esc(l.time)}</span><span class="t-agent">${esc(l.agent)}</span><span class="tag ${l.decision === "BLOCKED" ? "tag-red" : cls}">${esc(DECISION[l.decision] || l.decision)}</span><span class="t-tool">${esc(l.tool)}</span></li>`;
  }).join("");
  const hot = new Set(s.logs.slice(0, Math.max(fresh, 3)).map((l) => l.tool.split(".")[0]));
  document.querySelectorAll(".servers li").forEach((li) => li.classList.toggle("hot", hot.has(li.textContent)));
}

function renderRecover(s) {
  const r = s.recovery;
  const golden = $("#golden");
  golden.hidden = !r || location.hash === "#recover";
  if (!r) {
    $("#recBody").innerHTML = `<div class="card start"><h2>No money has been lost</h2><p>If Amma taps “I’ve been cheated”, four agents start at once: a bank hold, the 1930 call script, a police complaint and a sealed evidence pack. Anything official waits for you.</p><button class="btn btn-kavach" data-scene="recover">Show a recovery</button></div>`;
    return;
  }
  const i = r.inc, hold = s.approvals[r.hold], ncrp = s.approvals[r.ncrp];
  $("#gLine").textContent = `${inr(i.amount)} went to ${i.to}. Inside the first hour the bank can still freeze it.`;
  const tag = (p) => !p ? `<span class="tag tag-green">Done</span>` : p.status === "PENDING" ? `<span class="tag tag-amber">Needs you</span>` : p.status === "REJECTED" ? `<span class="tag tag-dim">Rejected</span>` : `<span class="tag tag-green">Approved · done</span>`;
  const acts = (p) => p && p.status === "PENDING" ? `<div class="acts"><button class="btn btn-kavach" data-decide="1" data-id="${esc(p.id)}">Approve</button><button class="btn btn-quiet" data-decide="0" data-id="${esc(p.id)}">Reject</button></div>` : "";
  const holdOut = hold?.result ? [hold.result.status, `Hold ID: ${hold.result.hold_id}`, `Account: ${hold.result.account}`, `Amount: ${inr(hold.result.amount)}`] : [`Account: ${i.to}`, `Amount: ${inr(i.amount)}`, `Reference: ${i.ref}`, "Status: drafted, waiting for you"];
  const ncrpOut = ncrp?.result ? [ncrp.result.status, `Acknowledgement: ${ncrp.result.ack}`, `Portal: ${ncrp.result.portal}`] : ["Portal: cybercrime.gov.in", "Complainant: Amma, via guardian Rahul", `Accused: ${i.caller} · refund.cbi@okaxis · ${i.to}`, "Jurisdiction: Bengaluru city cyber crime police", "Status: drafted, waiting for you"];
  $("#recBody").innerHTML = `
    <div class="card incident">
      <div><span>Lost</span><strong class="amt">${inr(i.amount)}</strong></div>
      <div><span>From</span><strong>${esc(i.from)}</strong></div>
      <div><span>To</span><strong class="num">${esc(i.to)}</strong></div>
      <div><span>Reference</span><strong class="num">${esc(i.ref)}</strong></div>
      <div><span>Golden hour left</span><strong class="num" id="rTime">--:--</strong></div>
    </div>
    <div class="agents">
      <article class="card agent"><div class="ag-top"><div><h3>Bank hold</h3><span class="srv">kavach-bank · request_hold</span></div>${tag(hold)}</div>
        <p>Asks the receiving bank to put a lien on the mule account before the money moves on.</p><pre class="out">${esc(holdOut.join("\n"))}</pre>${acts(hold)}</article>
      <article class="card agent"><div class="ag-top"><div><h3>1930 call script</h3><span class="srv">kavach-report · prepare_1930_brief</span></div>${tag(null)}</div>
        <p>Every detail the helpline asks for, in order, so the call takes one go.</p><pre class="out" id="brief">${esc(r.brief.join("\n"))}</pre>
        <div class="acts"><button class="btn btn-quiet" data-copy="#brief"><svg class="i"><use href="#i-copy"/></svg>Copy</button><a class="btn btn-kavach" href="tel:1930">Call 1930</a></div></article>
      <article class="card agent"><div class="ag-top"><div><h3>Police complaint</h3><span class="srv">kavach-report · draft_ncrp_complaint</span></div>${tag(ncrp)}</div>
        <p>The cybercrime.gov.in complaint, filled in with what the decoy and the bank SMS gave us.</p><pre class="out">${esc(ncrpOut.join("\n"))}</pre>${acts(ncrp)}</article>
      <article class="card agent"><div class="ag-top"><div><h3>Evidence pack</h3><span class="srv">kavach-intel · seal_dossier</span></div>${tag(null)}</div>
        <p>Call record, debit SMS and decoy captures, time-stamped and sealed with a SHA-256 hash.</p><pre class="out">${esc(`${r.dossier.id}\nsha256 ${r.dossier.sha256}\n\ncall_metadata.json\ndebit_sms.txt\ndecoy_captures.json\naudit_extract.json`)}</pre></article>
    </div>`;
}

function renderRings(s) {
  const g = s.graph;
  const rings = g.nodes.filter((n) => n.type === "syndicate");
  $("#rings").innerHTML = rings.map((ring) => {
    const members = g.links.filter((l) => l.target === ring.id).map((l) => g.nodes.find((n) => n.id === l.source)).filter(Boolean);
    const fresh = g.nodes.filter((n) => n.fresh && members.some((m) => g.links.some((l) => l.source === n.id && (l.target === m.id))));
    const all = [...members, ...fresh];
    return `<div class="card ring-row"><h3>${esc(ring.label)}</h3><p>${all.length} linked numbers, UPI IDs and accounts</p><ul>${all.map((m) => `<li class="${m.fresh ? "fresh" : ""}">${esc(m.label)}</li>`).join("")}</ul></div>`;
  }).join("") + `<p class="intro" style="margin:4px 2px 0">Drag to turn the graph. Indigo nodes were captured by KAVACH’s decoy and now protect every family on the network.</p>`;
}

function renderDecoy(s) {
  const turns = s.decoy.turns;
  const rows = [];
  if (turns.length) rows.push(`<li class="sys">Call moved to the decoy · Ramesh, 67</li>`);
  turns.forEach((t, i) => {
    const sc = DECOY_SCRIPT[i];
    rows.push(`<li class="bub scam"><small><span>Scammer</span>${sc.clip ? `<button class="play" data-clip="${sc.clip}"><svg class="i"><use href="#i-play"/></svg>play</button>` : ""}</small>${esc(t.scam)}</li>`);
    rows.push(`<li class="bub ram"><small><span>Ramesh (KAVACH decoy)</span><button class="play" data-clip="${t.reply}"><svg class="i"><use href="#i-play"/></svg>play</button></small>${esc(RAMESH[t.reply])}</li>`);
  });
  $("#convo").innerHTML = rows.join("") || `<li class="empty">The decoy hasn’t taken a call yet. Press “Next scammer line”.</li>`;
  $("#btnTurn").disabled = turns.length >= DECOY_SCRIPT.length;
  $("#btnTurn").textContent = turns.length >= DECOY_SCRIPT.length ? "Scammer hung up" : "Next scammer line";
  const cap = [...s.decoy.upi.map((u) => ["UPI ID", u]), ...s.decoy.accounts.map((a) => ["Mule account", a])];
  $("#captured").innerHTML = (cap.length ? cap.map(([k, v]) => `<div class="card"><span>${k}</span><strong>${esc(v)}</strong></div>`).join("") : `<div class="empty">Nothing captured yet.</div>`) +
    `<div class="card"><span>Scammer time wasted</span><strong>${turns.length ? "26 min" : "0 min"}</strong></div>`;
}

function renderAudit(s) {
  $("#auditBody").innerHTML = s.logs.map((l) => {
    const [cls, name] = TIER[l.tier] || ["tag-dim", l.tier];
    const dc = ["BLOCKED", "APPROVAL_PENDING", "REJECTED"].includes(l.decision) ? `dec-${l.decision}` : "dec-ok";
    return `<tr><td>${esc(l.time)}</td><td>${esc(l.agent)}</td><td>${esc(l.tool)}</td><td><span class="tag ${cls}">${name}</span></td><td class="${dc}">${esc(DECISION[l.decision] || l.decision)}</td><td>${esc(l.reason)}</td></tr>`;
  }).join("");
}

function tick() {
  $("#clock").textContent = story.clock();
  const r = story.state.recovery;
  if (!r) return;
  const left = Math.max(0, 3600 - (Date.now() - r.inc.startedAt) / 1000);
  $("#gTime").textContent = mmss(left);
  $("#gBar").style.width = `${(left / 3600) * 100}%`;
  const rt = $("#rTime");
  if (rt) rt.textContent = mmss(left);
}
setInterval(tick, 1000);

// ---------- wiring ----------
document.addEventListener("click", async (e) => {
  const t = e.target.closest("button, a");
  if (!t) return;
  if (t.dataset.decide) {
    const approve = t.dataset.decide === "1";
    try {
      story.dispatch("decide", { id: t.dataset.id, approve });
      const p = story.state.approvals[t.dataset.id];
      toast(approve ? `${(TOOL[p.tool] || [p.tool])[0]}: done` : "Rejected. Nothing was sent.");
    } catch (err) { toast(err.message); }
  } else if (t.dataset.scene) story.goto(t.dataset.scene);
  else if (t.dataset.clip) voice.play(t.dataset.clip);
  else if (t.dataset.copy) {
    try { await navigator.clipboard.writeText($(t.dataset.copy).textContent); toast("Copied"); } catch { toast("The browser blocked copying"); }
  }
});
$("#btnTurn").onclick = async () => {
  const i = story.state.decoy.turns.length;
  story.dispatch("decoy-turn");
  const step = DECOY_SCRIPT[i];
  if (step) await voice.playAll([...(step.clip ? [step.clip] : []), step.reply]);
};
$("#btnReset").onclick = () => { story.reset(); toast("Story reset on every open tab"); };
$("#scene").onchange = (e) => {
  const v = e.target.value;
  if (!v) return;
  story.goto(v);
  e.target.value = "";
  location.hash = v === "forbidden" ? "#audit" : v === "decoy" ? "#decoy" : v === "recover" || v === "approved" ? "#recover" : "#overview";
};
addEventListener("hashchange", () => { go(); render(story.state); });
story.subscribe((s, meta) => render(s, meta));

const scene = new URLSearchParams(location.search).get("scene");
if (scene && SCENES[scene]) story.goto(scene);
go();
render(story.state);
if (!graph) setBackend(null), ($("#backend").textContent = "loads with the graph");
