/* KAVACH web app: Amma's phone, Rahul's console, Recover, Strike and the Policy Gate.
   Talks to the FastAPI server when one answers; otherwise to the in-browser mock (mock.js). */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const desktop = () => matchMedia("(min-width: 1024px)").matches;

  const TRANSCRIPT = [
    "This is Inspector Alok Verma, CBI Cyber Crime HQ, New Delhi.",
    "A non-bailable digital arrest warrant is issued against your Aadhaar. Stay on video call, do not tell anyone.",
  ];
  const TOOL = {
    "bank.request_hold": ["Freeze the mule account", (a) => `Bank lien on ${a.account_id} for ${inr(a.amount)}`],
    "bank.request_block": ["Block Amma's UPI debits", (a) => a.card_or_account],
    "report.draft_ncrp_complaint": ["File the police complaint (NCRP)", (a) => `cybercrime.gov.in · ${a.incident_id}`],
    "report.file_chakshu": ["Report the number to Sanchar Saathi", (a) => `${a.phone_number} · ${a.category}`],
    "report.share_transcript": ["Share call transcript", () => "With law enforcement"],
  };
  const DONE = { "bank.request_hold": "Lien placed", "report.draft_ncrp_complaint": "Complaint filed", "report.file_chakshu": "Report filed" };

  let online = false;
  let S = null; // last /api/state
  let lang = localStorage.getItem("kavach.lang") || "kn";
  let seenLogs = 0;

  // ---------------- data ----------------
  async function api(method, path, body) {
    if (!online) return window.KavachMock.handle(method, path, body);
    const r = await fetch(path, { method, headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(typeof data.detail === "string" ? data.detail : `Server error ${r.status}`);
    return data;
  }
  async function refresh() {
    S = await api("GET", "/api/state");
    render();
  }
  async function act(fn) {
    try { return await fn(); } catch (e) { toast(e.message || "Something went wrong"); }
  }

  // ---------------- navigation ----------------
  const VIEWS = ["amma", "guardian", "recover", "strike", "gate"];
  function go(view, push = true) {
    if (!VIEWS.includes(view)) view = "amma";
    document.body.dataset.view = view;
    const current = desktop() && view === "guardian" ? "amma" : view;
    $$(".nav-btn").forEach((b) => (b.dataset.nav === current ? b.setAttribute("aria-current", "page") : b.removeAttribute("aria-current")));
    if (push && location.hash !== "#" + view) history.replaceState(null, "", "#" + view);
    if (!desktop()) window.scrollTo({ top: 0 });
    if (view === "strike") drawGraph();
  }

  // ---------------- toasts & speech ----------------
  function toast(msg) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    $("#toasts").append(t);
    setTimeout(() => t.remove(), 3600);
  }
  function speak(text, code) {
    if (!("speechSynthesis" in window)) return toast("This browser can't speak. The warning is shown on screen.");
    const voice = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith(code));
    if (!voice && code !== "en") return toast(`No ${code === "kn" ? "Kannada" : "Hindi"} voice on this device. The warning is shown on screen.`);
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : "en-IN";
    u.rate = 0.92;
    speechSynthesis.speak(u);
  }

  // ---------------- Amma's phone ----------------
  function setLang(l) {
    lang = l;
    localStorage.setItem("kavach.lang", l);
    $$(".seg button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.lang === l)));
    if (!$("#hud").hidden) $("#warningText").textContent = window.KavachMock.ADVICE[l];
    $("#warningText").lang = l;
  }

  let callClock = null;
  let callToken = 0;
  async function startCall() {
    go("amma");
    const token = ++callToken;
    const call = $("#aCall");
    $("#hud").hidden = true;
    $("#kvWrap").hidden = false;
    $("#transcript").textContent = "";
    $("#callMeta").textContent = "Checking the number…";
    $("#callTag").textContent = "Unknown caller";
    $("#callTag").className = "tag dim";
    call.hidden = false;
    let secs = 0;
    clearInterval(callClock);
    $("#callTimer").textContent = "00:00";
    callClock = setInterval(() => { secs++; $("#callTimer").textContent = `${String(secs / 60 | 0).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`; }, 1000);

    const r = await act(() => api("POST", "/api/shield/screen-call", { caller_number: "+91 98XXX XX210" }));
    if (!r || token !== callToken) return;
    $("#callNum").textContent = r.caller_number;
    if (r.action === "KAVACH_SCREENING") {
      $("#callTag").textContent = `High risk · ${Math.round(r.risk_score * 100)}%`;
      $("#callTag").className = "tag red";
      $("#callMeta").textContent = `${r.category}. Reported ${r.reported_count} times.`;
    } else {
      $("#callTag").textContent = "Looks safe";
      $("#callTag").className = "tag green";
      $("#callMeta").textContent = r.category;
    }
    refresh();
    for (const line of TRANSCRIPT) {
      await wait(1100);
      if (token !== callToken || !$("#hud").hidden) return;
      $("#transcript").textContent += ($("#transcript").textContent ? " " : "") + "“" + line + "”";
    }
  }

  async function tapKavach() {
    const r = await act(() => api("POST", "/api/shield/kavach-tap", { call_id: "CALL-X210", transcript: TRANSCRIPT.join(" "), language: lang }));
    if (!r) return;
    $("#kvWrap").hidden = true;
    $("#hud").hidden = false;
    const pct = Math.round((r.risk_score || 0) * 100);
    $("#riskPct").textContent = pct + "%";
    requestAnimationFrame(() => ($("#riskBar").style.width = pct + "%"));
    $("#verdict").className = "verdict";
    $("#verdict").textContent = r.detection && r.detection.detected ? `Scam detected · ${r.detection.name}` : "Suspicious call";
    $("#warningText").textContent = r.spoken_warning;
    $("#warningText").lang = lang;
    speak(r.spoken_warning, lang);
    toast("KAVACH joined the call and alerted Rahul");
    refresh();
  }

  async function hangUp() {
    callToken++;
    clearInterval(callClock);
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    await act(() => api("POST", "/api/shield/end-call", { call_id: "CALL-X210" }));
    $("#hud").hidden = false;
    $("#kvWrap").hidden = true;
    $("#verdict").className = "verdict ok";
    $("#verdict").textContent = "Call ended. Amma is safe.";
    $("#riskBar").style.width = "0%";
    refresh();
    await wait(1400);
    $("#aCall").hidden = true;
  }

  async function checkSms() {
    const btn = $("#btnCheckSms");
    btn.disabled = true;
    const r = await act(() => api("POST", "/api/shield/check-sms", { sms_text: $("#smsText").textContent, sender: "VK-DISCOM-ALERT", language: lang }));
    btn.disabled = false;
    if (!r) return;
    const box = $("#smsVerdict");
    box.hidden = false;
    box.className = "sms-verdict" + (r.is_scam ? "" : " safe");
    if (r.is_scam) {
      const text = r.voice_note.voice_note.transcript;
      const why = r.url_analysis && r.url_analysis.phishing_detected ? `The link ${r.url_analysis.url} is a known phishing pattern.` : (r.pattern_analysis.name || "Matches a scam playbook.");
      box.innerHTML = `<span class="tag red">Scam · don't tap the link</span><p lang="${esc(lang)}">${esc(text)}</p><span class="muted">${esc(why)}</span><button class="btn ghost small" data-say><svg><use href="#i-speaker"/></svg>Play voice note</button>`;
      box.querySelector("[data-say]").onclick = () => speak(text, lang);
      speak(text, lang);
    } else {
      box.innerHTML = `<span class="tag green">Looks safe</span><p>No scam signs found in this message.</p>`;
    }
    refresh();
  }

  // ---------------- steps ----------------
  function markStep(n) { const b = $(`.step[data-step="${n}"]`); if (b) b.classList.add("done"); }

  async function runDecoy(msg) {
    go("strike");
    await sendToDecoy(msg || "Open Google Pay and transfer 50,000 security deposit to refund.cbi@okaxis and HDFC Bank account 50100492814471.");
  }

  async function triggerRecovery() {
    const r = await act(() => api("POST", "/api/recover/trigger", { amount: 48000, scammer_number: "+91 98XXX XX210", destination_mule: "HDFC ····4471", transaction_id: "UPI-619284019284" }));
    if (!r) return;
    markStep(3);
    go(desktop() ? "recover" : "guardian");
    toast("Recover swarm started. Rahul has 2 approvals waiting.");
    await refresh();
  }

  async function forbidden() {
    go("gate");
    const r = await act(() => api("POST", "/api/policy/test-violation"));
    if (!r) return;
    markStep(4);
    const b = $("#violationBanner");
    b.hidden = false;
    b.innerHTML = `<strong>Blocked.</strong> An agent asked to run <span class="mono">bank.move_money</span> (₹50,000 to a mule account). ${esc(r.reason)}`;
    refresh();
  }

  async function resetAll() {
    await act(() => api("POST", "/api/reset"));
    callToken++;
    clearInterval(callClock);
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    $("#aCall").hidden = true;
    $("#smsVerdict").hidden = true;
    $("#violationBanner").hidden = true;
    $("#chatLog").innerHTML = "";
    chatEmpty();
    $$(".step").forEach((s) => s.classList.remove("done"));
    graphPos = {};
    seenLogs = 0;
    await refresh();
    go("amma");
    toast("Demo reset");
  }

  // ---------------- guardian ----------------
  async function decide(id, action) {
    const r = await act(() => api("POST", `/api/approvals/${encodeURIComponent(id)}/action`, { action, guardian_id: "Rahul (Son)" }));
    if (!r) return;
    const tool = r.approval.tool;
    toast(action === "APPROVE" ? `Approved · ${DONE[tool] || "done"}` : "Rejected. Nothing was sent.");
    refresh();
  }

  function approvalById(id) { return S.approvals.find((a) => a.approval_id === id); }

  function renderGuardian() {
    const pending = S.approvals.filter((a) => a.status === "PENDING");
    $("#approvalList").innerHTML = pending.length ? pending.map((a) => {
      const [title, sub] = TOOL[a.tool] || [a.tool, () => ""];
      return `<div class="appr"><div><h4>${esc(title)}</h4><p>${esc(sub(a.args || {}))}</p><p class="mono">${esc(a.agent)} · ${esc(a.created_at)}</p></div>
        <div class="acts"><button class="btn gold small" data-decide="APPROVE" data-id="${esc(a.approval_id)}">Approve</button><button class="btn ghost small" data-decide="REJECT" data-id="${esc(a.approval_id)}">Reject</button></div></div>`;
    }).join("") : `<div class="empty">Nothing waiting. KAVACH will ask you before it files a report or freezes an account.</div>`;

    $("#alertFeed").innerHTML = S.telegram_messages.length ? S.telegram_messages.map((m) => `
      <article class="alert">
        <div class="alert-top"><span class="tag ${m.alert_level === "CRITICAL" ? "red" : "gold"}">${esc(m.alert_level)}</span><time>${esc(m.time)}</time></div>
        <h4>${esc(m.title)}</h4>
        <ul>${m.bullet_points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        <div class="acts">${m.actions.map(alertAction).join("")}</div>
      </article>`).join("") : `<div class="empty">No alerts yet. Start a scenario with the buttons at the top.</div>`;

    const calls = S.audit_log.filter((l) => l.tool === "telephony.speak_warning").length;
    const frozen = S.approvals.filter((a) => a.tool === "bank.request_hold" && a.result && a.result.hold_details).reduce((s, a) => s + a.result.hold_details.amount_frozen, 0);
    $("#statCalls").textContent = calls;
    $("#statProtected").textContent = inr(frozen);
    $("#statBlocked").textContent = S.audit_log.filter((l) => l.decision === "BLOCKED").length;

    const count = $("#pendingCount");
    count.hidden = !pending.length;
    count.textContent = pending.length;
  }

  function alertAction(a) {
    if (a.id === "call_1930") return `<a class="btn ghost small" href="tel:1930">${esc(a.label)}</a>`;
    if (a.id === "call_amma") return `<button class="btn ghost small" data-toast="Calling Amma (demo, no call is placed)">${esc(a.label)}</button>`;
    const ap = approvalById(a.id);
    if (!ap) return "";
    if (ap.status === "PENDING") return `<button class="btn gold small" data-decide="APPROVE" data-id="${esc(a.id)}">${esc(a.label)}</button>`;
    const label = ap.status === "REJECTED" ? "Rejected" : (DONE[ap.tool] || "Approved");
    return `<span class="done-note">✓ ${esc(label)}</span>`;
  }

  // ---------------- golden hour timer ----------------
  function tickGolden() {
    const inc = S && S.recovery && S.recovery.incident;
    $("#goldenCard").hidden = !inc;
    if (!inc) return;
    const left = Math.max(0, 3600 - (Date.now() / 1000 - inc.started_at_epoch));
    const txt = left > 0 ? `${String(left / 60 | 0).padStart(2, "0")}:${String(left % 60 | 0).padStart(2, "0")}` : "00:00";
    $("#goldenTime").textContent = txt + " left";
    $("#goldenSub").textContent = `${inr(inc.amount)} sent to ${inc.destination_mule}. Banks can still freeze it.`;
    $("#goldenBar").style.width = (left / 36) + "%";
    const rt = $("#recTimer");
    if (rt) rt.textContent = txt;
  }

  // ---------------- recover ----------------
  function renderRecover() {
    const body = $("#recoverBody");
    const rec = S.recovery;
    if (!rec) {
      body.innerHTML = `<div class="card start"><h3>No incident yet</h3><p>Try it: Amma taps “I’ve been cheated” after ₹48,000 leaves her Canara Bank account for a mule account at HDFC.</p><button class="btn gold" data-run="3">Start golden-hour recovery</button></div>`;
      return;
    }
    const inc = rec.incident, ag = rec.agents;
    const gated = (agent, okText) => {
      const ap = agent.result.approval_id ? approvalById(agent.result.approval_id) : null;
      if (!ap) return { tag: `<span class="tag green">Done</span>`, out: agent.result, ap };
      const tag = { PENDING: `<span class="tag gold">Needs Rahul</span>`, EXECUTED: `<span class="tag green">${okText}</span>`, REJECTED: `<span class="tag dim">Rejected</span>` }[ap.status] || `<span class="tag dim">${esc(ap.status)}</span>`;
      return { tag, out: ap.result || ap.args, ap };
    };
    const lines = (o) => Object.entries(o || {}).filter(([, v]) => v != null && typeof v !== "object").map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`).join("\n");
    const bank = gated(ag.bank_agent, "Lien placed");
    const ncrp = gated(ag.ncrp_complaint_agent, "Filed");
    const ev = ag.evidence_agent.result;
    const btns = (g) => g.ap && g.ap.status === "PENDING" ? `<div class="acts"><button class="btn gold small" data-decide="APPROVE" data-id="${esc(g.ap.approval_id)}">Approve</button><button class="btn ghost small" data-decide="REJECT" data-id="${esc(g.ap.approval_id)}">Reject</button></div>` : "";

    body.innerHTML = `
      <div class="incident">
        <div><span>Lost</span><strong class="big">${inr(inc.amount)}</strong></div>
        <div><span>To</span><strong class="mono">${esc(inc.destination_mule)}</strong></div>
        <div><span>Reference</span><strong class="mono">${esc(inc.transaction_id)}</strong></div>
        <div><span>Caller</span><strong class="mono">${esc(inc.scammer_number)}</strong></div>
        <div class="timer"><span>Golden hour left</span><strong id="recTimer">--:--</strong></div>
      </div>
      <div class="agents">
        <article class="card agent"><div class="agent-top"><div><span class="num">AGENT 1</span><h3>Bank hold</h3></div>${bank.tag}</div>
          <p>Asks the receiving bank to put a lien on the mule account before the money is moved on.</p>
          <pre class="out">${esc(bank.ap && bank.ap.result ? lines(bank.ap.result.hold_details) : lines(bank.out))}</pre>${btns(bank)}</article>
        <article class="card agent"><div class="agent-top"><div><span class="num">AGENT 2</span><h3>1930 briefing</h3></div><span class="tag green">Ready</span></div>
          <p>A word-for-word script so whoever calls 1930 gives every detail, calmly, in one go.</p>
          <pre class="out" id="briefText">${esc(ag.helpline_1930_agent.result.verbal_script)}</pre>
          <div class="acts"><button class="btn ghost small" data-copy="#briefText">Copy script</button><a class="btn gold small" href="tel:1930">Call 1930</a></div></article>
        <article class="card agent"><div class="agent-top"><div><span class="num">AGENT 3</span><h3>Police complaint</h3></div>${ncrp.tag}</div>
          <p>Pre-fills the cybercrime.gov.in complaint with the suspect’s number, UPI ID and mule account.</p>
          <pre class="out">${esc(ncrp.ap && ncrp.ap.result ? lines(ncrp.ap.result.complaint) + "\n" + lines(ncrp.ap.result.complaint.accused_details) : lines(ncrp.out))}</pre>${btns(ncrp)}</article>
        <article class="card agent"><div class="agent-top"><div><span class="num">AGENT 4</span><h3>Evidence dossier</h3></div><span class="tag green">Sealed</span></div>
          <p>Bundles call metadata, the debit SMS and decoy captures, sealed with a SHA-256 hash.</p>
          <pre class="out" id="hashText">${esc(`${ev.dossier_id}\nsha256: ${ev.sha256_hash}\n\n${ev.artifacts_compiled.join("\n")}`)}</pre>
          <div class="acts"><button class="btn ghost small" data-copy="#hashText">Copy hash</button></div></article>
      </div>`;
    tickGolden();
  }

  // ---------------- strike ----------------
  function chatEmpty() {
    $("#chatLog").innerHTML = `<div class="bubble sys">Play the scammer. Ramesh answers, and anything they reveal is captured.</div>`;
  }
  function bubble(kind, who, text) {
    const b = document.createElement("div");
    b.className = "bubble " + kind;
    b.innerHTML = (who ? `<small>${esc(who)}</small>` : "") + esc(text);
    $("#chatLog").append(b);
    $("#chatLog").scrollTop = $("#chatLog").scrollHeight;
  }
  let sending = false;
  async function sendToDecoy(msg) {
    msg = msg.trim();
    if (!msg || sending) return;
    sending = true;
    bubble("scam", "Scammer", msg);
    const r = await act(() => api("POST", "/api/strike/turn", { message: msg }));
    sending = false;
    if (!r) return;
    markStep(2);
    if (r.step === 1) bubble("sys", "", "Call transferred to Ramesh · decoy active");
    await wait(500);
    bubble("decoy", "Ramesh (KAVACH decoy)", r.decoy_response);
    if (r.captured_upi) bubble("sys", "", `Captured UPI ${r.captured_upi} → fraud graph`);
    if (r.captured_account) bubble("sys", "", `Captured account ····${r.captured_account.slice(-4)} → fraud graph`);
    if (r.chakshu_draft && r.chakshu_draft.approval_id) bubble("sys", "", "Sanchar Saathi report drafted · waiting for Rahul");
    await refresh();
  }
  function renderStrike() {
    const e = S.extracted_entities;
    const chips = [...e.upi_ids.map((u) => `<span class="chip">${esc(u)}</span>`), ...e.mule_accounts.map((m) => `<span class="chip red">${esc(m)}</span>`)];
    $("#entities").innerHTML = chips.length ? chips.join("") : `<span class="muted">Nothing yet</span>`;
    $("#wasted").textContent = e.upi_ids.length || e.mule_accounts.length ? "26" : "0";
    if (document.body.dataset.view === "strike") drawGraph();
  }

  // Small force layout; positions persist so new nodes appear next to a stable graph.
  let graphPos = {};
  const NODE = {
    syndicate: { r: 15, fill: "#7A2E22", stroke: "#F0603F" },
    phone: { r: 9, fill: "#F0603F" },
    upi: { r: 8, fill: "#E8B04A" },
    mule_account: { r: 10, fill: "#F0603F" },
    victim: { r: 9, fill: "#86AEDD" },
  };
  function drawGraph() {
    if (!S) return;
    const svg = $("#graph");
    const W = svg.clientWidth || 900, H = svg.clientHeight || 520;
    const g = S.fraud_graph;
    $("#graphStats").textContent = `${g.nodes.length} entities · ${g.links.length} links · ${g.stats ? g.stats.syndicates_tracked : 2} syndicates`;
    const known = Object.keys(graphPos).length > 0;
    const nodes = g.nodes.map((n, i) => {
      const p = graphPos[n.id];
      const a = (i / g.nodes.length) * Math.PI * 2;
      const rad = n.type === "syndicate" ? 0.15 : n.type === "victim" ? 0.42 : 0.3;
      return { ...n, x: p ? p.x : W / 2 + Math.cos(a) * W * rad, y: p ? p.y : H / 2 + Math.sin(a) * H * rad, fresh: known && !p };
    });
    const idx = Object.fromEntries(nodes.map((n, i) => [n.id, i]));
    const links = g.links.filter((l) => l.source in idx && l.target in idx);
    for (let it = 0; it < 260; it++) {
      const k = 1 - it / 260;
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy || 1;
        const f = (Math.min(W, H) * 0.7) / d2 * k;
        a.x += dx * f; a.y += dy * f; b.x -= dx * f; b.y -= dy * f;
      }
      for (const l of links) {
        const a = nodes[idx[l.source]], b = nodes[idx[l.target]];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
        const f = ((d - Math.min(W, H) * 0.22) / d) * 0.06 * k;
        a.x += dx * f; a.y += dy * f; b.x -= dx * f; b.y -= dy * f;
      }
      for (const n of nodes) {
        n.x += (W / 2 - n.x) * 0.012 * k; n.y += (H / 2 - n.y) * 0.012 * k;
        n.x = Math.max(60, Math.min(W - 60, n.x)); n.y = Math.max(28, Math.min(H - 34, n.y));
      }
    }
    graphPos = Object.fromEntries(nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
    const short = (s) => (s.length > 30 && W < 700 ? s.slice(0, 28) + "…" : s);
    const wide = W > 700;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.innerHTML =
      links.map((l) => {
        const a = nodes[idx[l.source]], b = nodes[idx[l.target]];
        const fresh = a.fresh || b.fresh;
        return `<line class="edge${fresh ? " new" : ""}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>` +
          (wide ? `<text class="elabel" x="${(a.x + b.x) / 2}" y="${(a.y + b.y) / 2 - 4}" text-anchor="middle">${esc(l.relation)}</text>` : "");
      }).join("") +
      nodes.map((n) => {
        const st = NODE[n.type] || { r: 8, fill: "#828C84" };
        const fill = n.type === "phone" && n.details && n.details.risk_score < 0.5 ? "#5CC594" : st.fill;
        return `<g class="${n.fresh ? "fresh" : ""}"><title>${esc(n.label)} (${esc(n.type)})</title>
          <circle cx="${n.x}" cy="${n.y}" r="${st.r}" fill="${fill}" ${st.stroke ? `style="stroke:${st.stroke}"` : ""}/>
          <text class="nlabel" x="${n.x}" y="${n.y + st.r + 14}" text-anchor="middle">${esc(short(n.label))}</text></g>`;
      }).join("");
  }

  // ---------------- gate ----------------
  function renderGate() {
    const logs = S.audit_log;
    const fresh = seenLogs ? logs.length - seenLogs : 0;
    seenLogs = logs.length;
    $("#logCount").textContent = `${logs.length} entries`;
    const tierTag = { AUTOMATIC: "green", NEEDS_GUARDIAN_APPROVAL: "gold", NEVER_ALLOWED: "red" };
    const tierName = { AUTOMATIC: "Automatic", NEEDS_GUARDIAN_APPROVAL: "Needs Rahul", NEVER_ALLOWED: "Never" };
    const decColor = { BLOCKED: "var(--red)", APPROVAL_PENDING: "var(--gold)", REJECTED: "var(--tx2)" };
    $("#auditBody").innerHTML = logs.map((l, i) => `<tr class="${i < fresh ? "flash" : ""}">
      <td>${esc(l.time)}</td><td>${esc(l.agent)}</td><td>${esc(l.tool)}</td>
      <td><span class="tag ${tierTag[l.tier] || "dim"}">${esc(tierName[l.tier] || l.tier)}</span></td>
      <td><strong style="color:${decColor[l.decision] || "var(--green)"}">${esc(l.decision.replace(/_/g, " "))}</strong></td>
      <td>${esc(l.reason)}</td></tr>`).join("");
  }

  function render() {
    if (!S) return;
    renderGuardian();
    renderRecover();
    renderStrike();
    renderGate();
    tickGolden();
  }

  // ---------------- wiring ----------------
  document.addEventListener("click", (e) => {
    const t = e.target.closest("button, a");
    if (!t) return;
    if (t.dataset.nav) go(t.dataset.nav);
    else if (t.dataset.decide) decide(t.dataset.id, t.dataset.decide);
    else if (t.dataset.toast) toast(t.dataset.toast);
    else if (t.dataset.copy) {
      const text = $(t.dataset.copy).textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast("Copied"), () => toast("Copy blocked by the browser"));
    } else if (t.dataset.run === "3" || t.dataset.step === "3") triggerRecovery();
    else if (t.dataset.step === "1") startCall().then(() => markStep(1));
    else if (t.dataset.step === "2") runDecoy();
    else if (t.dataset.step === "4") forbidden();
    else if (t.dataset.step === "reset") resetAll();
    else if (t.dataset.lang) setLang(t.dataset.lang);
    else if (t.classList.contains("chip-btn")) sendToDecoy(t.textContent);
    else if (t.classList.contains("mark")) { e.preventDefault(); go("amma"); }
  });
  $("#btnKavach").onclick = tapKavach;
  $("#btnHangup").onclick = hangUp;
  $("#btnSpeak").onclick = () => speak($("#warningText").textContent, lang);
  $("#btnCheckSms").onclick = checkSms;
  $("#btnPanic").onclick = triggerRecovery;
  $("#btnViolation").onclick = forbidden;
  $("#composer").onsubmit = (e) => { e.preventDefault(); const i = $("#scamInput"); sendToDecoy(i.value); i.value = ""; };
  addEventListener("hashchange", () => go(location.hash.slice(1), false));
  let resizeT;
  addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(() => { go(document.body.dataset.view, false); }, 150); });
  setInterval(tickGolden, 1000);

  async function boot() {
    setLang(lang);
    chatEmpty();
    go(location.hash.slice(1) || "amma", false);
    try {
      const r = await fetch("/api/status", { cache: "no-store" });
      online = r.ok && (r.headers.get("content-type") || "").includes("json");
    } catch (_) { online = false; }
    const c = $("#conn");
    c.className = "conn " + (online ? "is-live" : "is-offline");
    c.querySelector("span").textContent = online ? "Live server" : "Browser demo";
    c.title = online ? "Connected to the KAVACH FastAPI server. Every action runs through the Python agents and policy gate."
      : "No server found. The agents run in your browser with the same rules as the Python backend.";
    await act(refresh);
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  boot();
})();
