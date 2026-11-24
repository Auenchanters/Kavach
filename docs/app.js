/* KAVACH web app: Amma's phone, Rahul's console, Recover Swarm, Strike Decoy + Fraud Graph, and Policy Gate.
   Talks to the FastAPI server when online; seamlessly falls back to in-browser mock (mock.js) on GitHub Pages. */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const desktop = () => matchMedia("(min-width: 1024px)").matches;
  const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  const TRANSCRIPT = [
    "This is Inspector Alok Verma, CBI Cyber Crime HQ, New Delhi.",
    "A non-bailable digital arrest warrant is issued against your Aadhaar. Stay on video call, do not tell anyone.",
  ];
  const SMS_PRESETS = {
    ebill: {
      sender: "VK-DISCOM-ALERT",
      text: "Dear consumer, your electricity power will be cut tonight at 9:30 PM because previous month bill was not updated. Immediately call 9876543210 or pay at bit.ly/eb-bill",
    },
    kyc: {
      sender: "HDFC-KYC-UPD",
      text: "Urgent: Your bank KYC expire in 24 hours and account suspend warning issued. Download QuickSupport or click link bit.ly/eb-bill to update PAN.",
    },
    safe: {
      sender: "Rahul (Son)",
      text: "Amma, reaching home for lunch at 1:15 PM today. Bought fresh mangoes from Jayanagar market!",
    },
  };
  const TOOL = {
    "bank.request_hold": ["Freeze the mule account", (a) => `Bank lien on ${a.account_id} for ${inr(a.amount)}`],
    "bank.request_block": ["Block Amma's UPI debits", (a) => a.card_or_account],
    "report.draft_ncrp_complaint": ["File the police complaint (NCRP)", (a) => `cybercrime.gov.in · ${a.incident_id}`],
    "report.file_chakshu": ["Report the number to Sanchar Saathi", (a) => `${a.phone_number} · ${a.category}`],
    "report.share_transcript": ["Share call transcript", () => "With law enforcement"],
  };
  const DONE = { "bank.request_hold": "Lien placed", "report.draft_ncrp_complaint": "Complaint filed", "report.file_chakshu": "Report filed" };

  let online = false;
  let S = null;
  let lang = localStorage.getItem("kavach.lang") || "kn";
  let seenLogs = 0;
  let lastDetection = null;
  let currentCaller = "+91 98XXX XX210";
  let tierFilter = "ALL";
  let auditQuery = "";
  let graphFilter = "all";
  let selectedNodeId = null;
  let expandedLogs = new Set();

  // ---------------- data ----------------
  async function api(method, path, body) {
    if (!online) return window.KavachMock.handle(method, path, body);
    const r = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
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
    if (!voice && code !== "en") return toast(`No ${code === "kn" ? "Kannada" : "Hindi"} voice on this device. Warning shown on screen.`);
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : "en-IN";
    u.rate = 0.92;
    speechSynthesis.speak(u);
  }

  // ---------------- call waveform visualizer ----------------
  let waveRaf = null;
  let waveMode = "idle"; // idle | alert | safe
  function startWave(mode = "idle") {
    waveMode = mode;
    const canvas = $("#callWave");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const bars = 36;
    let phase = 0;
    const drawFrame = () => {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const color = waveMode === "alert" ? "#F0603F" : waveMode === "safe" ? "#5CC594" : "#E8B04A";
      ctx.fillStyle = color;
      const bw = 4;
      const gap = (w - bars * bw) / (bars - 1);
      for (let i = 0; i < bars; i++) {
        const amp = waveMode === "alert"
          ? 0.35 + 0.6 * Math.abs(Math.sin(phase * 1.4 + i * 0.45))
          : 0.18 + 0.35 * Math.abs(Math.sin(phase + i * 0.35));
        const bh = Math.max(4, Math.round(h * amp));
        const x = i * (bw + gap);
        const y = (h - bh) / 2;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x, y, bw, bh, 2) : ctx.rect(x, y, bw, bh);
        ctx.fill();
      }
      phase += 0.11;
      if (!reducedMotion() && !$("#aCall").hidden) waveRaf = requestAnimationFrame(drawFrame);
    };
    cancelAnimationFrame(waveRaf);
    drawFrame();
  }
  function stopWave() {
    cancelAnimationFrame(waveRaf);
    waveRaf = null;
  }

  // ---------------- Amma's phone ----------------
  function setLang(l) {
    lang = l;
    localStorage.setItem("kavach.lang", l);
    $$(".seg button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.lang === l)));
    if (!$("#hud").hidden) {
      const advice = (lastDetection && lastDetection.safe_advice && lastDetection.safe_advice[l])
        || (window.KavachMock.ADVICE && window.KavachMock.ADVICE[l]);
      if (advice) $("#warningText").textContent = advice;
    }
    $("#warningText").lang = l;
  }

  let callClock = null;
  let callToken = 0;
  async function startCall(callerNumber = "+91 98XXX XX210") {
    go("amma");
    currentCaller = callerNumber;
    lastDetection = null;
    const token = ++callToken;
    const call = $("#aCall");
    call.classList.remove("is-trusted");
    $("#hud").hidden = true;
    $("#kwRow").hidden = true;
    $("#kvWrap").hidden = false;
    $("#confKavach").className = "conf-node";
    $("#confKavach").textContent = "KAVACH Standby";
    $("#transcript").textContent = "";
    $("#callMeta").textContent = "Checking number against kavach-intel…";
    $("#callTag").textContent = "Checking caller";
    $("#callTag").className = "tag dim";
    call.hidden = false;
    startWave("idle");

    let secs = 0;
    clearInterval(callClock);
    $("#callTimer").textContent = "00:00";
    callClock = setInterval(() => {
      secs++;
      $("#callTimer").textContent = `${String((secs / 60) | 0).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;
    }, 1000);

    const r = await act(() => api("POST", "/api/shield/screen-call", { caller_number: callerNumber }));
    if (!r || token !== callToken) return;
    $("#callNum").textContent = r.caller_number;

    if (r.action === "KAVACH_SCREENING") {
      $("#callTag").textContent = `High risk · ${Math.round(r.risk_score * 100)}%`;
      $("#callTag").className = "tag red";
      $("#callMeta").textContent = `${r.category} · Reported ${r.reported_count}× · ${r.syndicate_id || "Flagged"}`;
      startWave("alert");
      refresh();
      for (const line of TRANSCRIPT) {
        await wait(1000);
        if (token !== callToken || !$("#hud").hidden) return;
        $("#transcript").textContent += ($("#transcript").textContent ? " " : "") + "“" + line + "”";
      }
    } else {
      call.classList.add("is-trusted");
      $("#callTag").textContent = `Trusted · ${Math.round((r.risk_score || 0.05) * 100)}% risk`;
      $("#callTag").className = "tag green";
      $("#callMeta").textContent = `${r.category} · Put through normally`;
      $("#kvWrap").hidden = true;
      $("#hud").hidden = false;
      $("#btnToDecoy").hidden = true;
      $("#riskPct").textContent = "5%";
      $("#riskBar").style.width = "5%";
      $("#verdict").className = "verdict ok";
      $("#verdict").textContent = "Verified contact — safe to speak";
      $("#warningText").textContent = "This caller is in Amma's trusted whitelist. KAVACH stepped back automatically.";
      startWave("safe");
      refresh();
    }
  }

  async function tapKavach() {
    const r = await act(() => api("POST", "/api/shield/kavach-tap", {
      call_id: "CALL-X210",
      transcript: TRANSCRIPT.join(" "),
      language: lang,
      caller_number: currentCaller,
    }));
    if (!r) return;
    lastDetection = r.detection || null;
    $("#kvWrap").hidden = true;
    $("#hud").hidden = false;
    $("#btnToDecoy").hidden = false;
    $("#confKavach").className = "conf-node shield-on";
    $("#confKavach").textContent = "KAVACH Listening";
    const pct = Math.round((r.risk_score || 0) * 100);
    $("#riskPct").textContent = pct + "%";
    requestAnimationFrame(() => ($("#riskBar").style.width = pct + "%"));
    $("#verdict").className = "verdict";
    $("#verdict").textContent = r.detection && r.detection.detected
      ? `Scam detected · ${r.detection.name}`
      : "Suspicious call";
    const kws = (r.detection && r.detection.matched_keywords) || [];
    if (kws.length) {
      $("#kwRow").hidden = false;
      $("#kwRow").innerHTML = kws.slice(0, 5).map((k) => `<span class="kw-chip">${esc(k)}</span>`).join("");
    }
    $("#warningText").textContent = r.spoken_warning;
    $("#warningText").lang = lang;
    startWave("alert");
    speak(r.spoken_warning, lang);
    toast("KAVACH joined the conference and alerted Rahul");
    refresh();
  }

  async function hangUp() {
    callToken++;
    clearInterval(callClock);
    stopWave();
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    await act(() => api("POST", "/api/shield/end-call", { call_id: "CALL-X210" }));
    $("#hud").hidden = false;
    $("#kvWrap").hidden = true;
    $("#verdict").className = "verdict ok";
    $("#verdict").textContent = "Call ended safely · Number flagged";
    $("#riskBar").style.width = "0%";
    refresh();
    await wait(1300);
    $("#aCall").hidden = true;
  }

  function setSmsPreset(key) {
    const p = SMS_PRESETS[key];
    if (!p) return;
    $$(".preset-pill").forEach((b) => b.classList.toggle("active", b.dataset.sms === key));
    $("#smsSender").textContent = p.sender;
    $("#smsText").textContent = p.text;
    $("#smsVerdict").hidden = true;
  }

  async function checkSms() {
    const btn = $("#btnCheckSms");
    btn.disabled = true;
    const r = await act(() => api("POST", "/api/shield/check-sms", {
      sms_text: $("#smsText").textContent,
      sender: $("#smsSender").textContent,
      language: lang,
    }));
    btn.disabled = false;
    if (!r) return;
    const box = $("#smsVerdict");
    box.hidden = false;
    box.className = "sms-verdict" + (r.is_scam ? "" : " safe");
    if (r.is_scam) {
      const text = r.voice_note.voice_note.transcript;
      const why = r.url_analysis && r.url_analysis.phishing_detected
        ? `Flagged URL ${r.url_analysis.url} (${r.url_analysis.category}).`
        : (r.pattern_analysis.name || "Matches an official scam playbook.");
      box.innerHTML = `<span class="tag red">Scam · do not tap link</span><p lang="${esc(lang)}">${esc(text)}</p><span class="muted">${esc(why)}</span><button class="btn ghost small" data-say><svg><use href="#i-speaker"/></svg>Play voice note</button>`;
      box.querySelector("[data-say]").onclick = () => speak(text, lang);
      speak(text, lang);
    } else {
      box.innerHTML = `<span class="tag green">Verified safe</span><p>No phishing links or scam phrases found in this message.</p>`;
    }
    refresh();
  }

  // ---------------- steps ----------------
  function markStep(n) { const b = $(`.step[data-step="${n}"]`); if (b) b.classList.add("done"); }

  async function runDecoy(msg) {
    go("strike");
    await sendToDecoy(msg || "Open Google Pay and transfer 50,000 security deposit to refund.cbi@okaxis and HDFC Bank account 50100492814471.");
  }

  async function triggerRecovery(customData) {
    const payload = customData || {
      amount: 48000,
      scammer_number: "+91 98XXX XX210",
      destination_mule: "HDFC ····4471",
      transaction_id: "UPI-619284019284",
    };
    const r = await act(() => api("POST", "/api/recover/trigger", payload));
    if (!r) return;
    markStep(3);
    go(desktop() ? "recover" : "guardian");
    toast("Recover swarm launched. Rahul has 2 approvals waiting.");
    await refresh();
  }

  async function forbidden() {
    go("gate");
    const select = $("#violationToolSelect");
    const toolName = select ? select.value : "bank.move_money";
    const r = await act(() => api("POST", "/api/policy/test-violation", { tool_name: toolName }));
    if (!r) return;
    markStep(4);
    const b = $("#violationBanner");
    b.hidden = false;
    b.innerHTML = `<strong>Blocked at Policy Gate.</strong> An agent attempted <span class="mono">${esc(toolName)}</span>. ${esc(r.reason)}`;
    refresh();
  }

  async function resetAll() {
    await act(() => api("POST", "/api/reset"));
    callToken++;
    clearInterval(callClock);
    stopWave();
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    $("#aCall").hidden = true;
    $("#smsVerdict").hidden = true;
    $("#violationBanner").hidden = true;
    $("#nodeInspector").hidden = true;
    $("#chatLog").innerHTML = "";
    chatEmpty();
    $$(".step").forEach((s) => s.classList.remove("done"));
    graphPos = {};
    selectedNodeId = null;
    lastDetection = null;
    seenLogs = 0;
    expandedLogs.clear();
    await refresh();
    go("amma");
    toast("Demo state reset");
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
    $("#apprSummary").textContent = pending.length ? `${pending.length} pending` : "All clear";

    $("#approvalList").innerHTML = pending.length ? pending.map((a) => {
      const [title, sub] = TOOL[a.tool] || [a.tool, () => ""];
      return `<div class="appr"><div><h4>${esc(title)}</h4><p>${esc(sub(a.args || {}))}</p><p class="mono">${esc(a.agent)} · ${esc(a.created_at)}</p></div>
        <div class="acts"><button class="btn gold small" data-decide="APPROVE" data-id="${esc(a.approval_id)}">Approve</button><button class="btn ghost small" data-decide="REJECT" data-id="${esc(a.approval_id)}">Reject</button></div></div>`;
    }).join("") : `<div class="empty">Nothing waiting. KAVACH pauses and asks Rahul before filing reports or placing bank holds.</div>`;

    $("#alertFeed").innerHTML = S.telegram_messages.length ? S.telegram_messages.map((m) => `
      <article class="alert">
        <div class="alert-top"><span class="tag ${m.alert_level === "CRITICAL" ? "red" : "gold"}">${esc(m.alert_level)}</span><span class="mono muted">${esc(m.incident_id || "")}</span><time>${esc(m.time)}</time></div>
        <h4>${esc(m.title)}</h4>
        <ul>${m.bullet_points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        <div class="acts">${m.actions.map(alertAction).join("")}</div>
      </article>`).join("") : `<div class="empty">No alerts yet. Trigger “1 Scam call” or “3 Money lost” from the top bar.</div>`;

    const calls = S.audit_log.filter((l) => l.tool === "telephony.speak_warning" || l.tool === "telephony.answer_call").length;
    const frozen = S.approvals
      .filter((a) => a.tool === "bank.request_hold" && a.result && a.result.hold_details)
      .reduce((s, a) => s + a.result.hold_details.amount_frozen, 0);
    const wastedMin = S.strike_stats ? S.strike_stats.minutes_wasted : 0;

    $("#statCalls").textContent = calls;
    $("#statWasted").textContent = `${wastedMin} min`;
    $("#statProtected").textContent = inr(frozen);
    $("#statBlocked").textContent = S.audit_log.filter((l) => l.decision === "BLOCKED").length;

    const count = $("#pendingCount");
    count.hidden = !pending.length;
    count.textContent = pending.length;

    const recDot = $("#recoverDot");
    if (recDot) recDot.hidden = !S.recovery;

    const trusted = S.trusted_contacts || [
      { number: "+91 91234 56789", label: "Trusted Contact - Rahul (Son)" },
      { number: "+91 80234 99000", label: "Trusted Contact - Manipal Hospital Bengaluru" },
    ];
    $("#trustedList").innerHTML = trusted.map((t) => `
      <div class="wl-chip">
        <span class="pulse-mini"></span>
        <div><strong>${esc(t.label.replace("Trusted Contact - ", ""))}</strong><span>${esc(t.number)}</span></div>
      </div>`).join("");
  }

  function alertAction(a) {
    if (a.id === "call_1930") return `<a class="btn ghost small" href="tel:1930">${esc(a.label)}</a>`;
    if (a.id === "call_amma") return `<button class="btn ghost small" data-toast="Calling Amma (demo — no external call placed)">${esc(a.label)}</button>`;
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
    const txt = left > 0 ? `${String((left / 60) | 0).padStart(2, "0")}:${String((left % 60) | 0).padStart(2, "0")}` : "00:00";
    $("#goldenTime").textContent = txt + " left";
    $("#goldenSub").textContent = `${inr(inc.amount)} sent to ${inc.destination_mule}. Banks can still place a lien.`;
    $("#goldenBar").style.width = (left / 36) + "%";
    const rt = $("#recTimer");
    if (rt) rt.textContent = txt;
  }

  // ---------------- recover ----------------
  function kvGrid(entries) {
    return `<div class="kv-grid">${entries.map(([k, v]) => `<div class="kv-item"><span>${esc(k)}</span><strong class="mono">${esc(v)}</strong></div>`).join("")}</div>`;
  }

  function renderRecover() {
    const body = $("#recoverBody");
    const rec = S.recovery;
    if (!rec) {
      body.innerHTML = `
        <div class="recover-setup">
          <div class="card">
            <span class="eyebrow">Simulate Unauthorized Debit</span>
            <h3>Trigger 4-agent Golden Hour response</h3>
            <p class="muted">Customize incident parameters or launch with the canonical ₹48,000 Digital Arrest scenario.</p>
            <form class="sim-form" id="recoverForm">
              <div class="field"><label for="recAmt">Amount (₹)</label><input id="recAmt" type="number" min="1" max="100000000" value="48000"></div>
              <div class="field"><label for="recMule">Mule Account</label><input id="recMule" value="HDFC ····4471" maxlength="64"></div>
              <div class="field"><label for="recRrn">UPI Reference</label><input id="recRrn" value="UPI-619284019284" maxlength="64"></div>
              <div class="field"><label for="recCaller">Caller Number</label><input id="recCaller" value="+91 98XXX XX210" maxlength="32"></div>
              <button class="btn gold" type="submit">Start recovery</button>
            </form>
          </div>
          <div class="agents">
            <article class="card agent"><div class="agent-top"><div><span class="num">AGENT 01</span><h3>Bank Hold / Lien</h3></div><span class="tag gold">Guardian Gated</span></div><p>Issues inter-bank freeze request on the destination mule account via RBI Account Aggregator / I4C rails.</p></article>
            <article class="card agent"><div class="agent-top"><div><span class="num">AGENT 02</span><h3>1930 Helpline Brief</h3></div><span class="tag green">Automatic</span></div><p>Builds a panic-free word-for-word verbal script containing RRN, timestamps, and mule details for dialing 1930.</p></article>
            <article class="card agent"><div class="agent-top"><div><span class="num">AGENT 03</span><h3>NCRP Complaint Drafter</h3></div><span class="tag gold">Guardian Gated</span></div><p>Pre-fills the formal cybercrime.gov.in complaint mapped to Bengaluru Cyber Crime PS jurisdiction.</p></article>
            <article class="card agent"><div class="agent-top"><div><span class="num">AGENT 04</span><h3>Evidence Dossier</h3></div><span class="tag green">Automatic</span></div><p>Packages call metadata, debit SMS headers, and decoy captures into a SHA-256 Section 65B dossier.</p></article>
          </div>
        </div>`;
      $("#recoverForm").onsubmit = (e) => {
        e.preventDefault();
        triggerRecovery({
          amount: Number($("#recAmt").value) || 48000,
          destination_mule: $("#recMule").value.trim() || "HDFC ····4471",
          transaction_id: $("#recRrn").value.trim() || "UPI-619284019284",
          scammer_number: $("#recCaller").value.trim() || "+91 98XXX XX210",
        });
      };
      return;
    }

    const inc = rec.incident, ag = rec.agents;
    const gated = (agent, okText) => {
      const ap = agent.result.approval_id ? approvalById(agent.result.approval_id) : null;
      if (!ap) return { tag: `<span class="tag green">Done</span>`, out: agent.result, ap, status: "EXECUTED" };
      const tag = { PENDING: `<span class="tag gold">Needs Rahul</span>`, EXECUTED: `<span class="tag green">${okText}</span>`, REJECTED: `<span class="tag dim">Rejected</span>` }[ap.status] || `<span class="tag dim">${esc(ap.status)}</span>`;
      return { tag, out: ap.result || ap.args, ap, status: ap.status };
    };

    const bank = gated(ag.bank_agent, "Lien placed");
    const ncrp = gated(ag.ncrp_complaint_agent, "Filed");
    const brief = ag.helpline_1930_agent.result;
    const ev = ag.evidence_agent.result;
    const btns = (g) => g.ap && g.ap.status === "PENDING"
      ? `<div class="acts"><button class="btn gold small" data-decide="APPROVE" data-id="${esc(g.ap.approval_id)}">Approve</button><button class="btn ghost small" data-decide="REJECT" data-id="${esc(g.ap.approval_id)}">Reject</button></div>`
      : "";

    const bankPairs = bank.ap && bank.ap.result && bank.ap.result.hold_details
      ? [
          ["Hold ID", bank.ap.result.hold_details.hold_id],
          ["Mule Account", bank.ap.result.hold_details.mule_account],
          ["Amount Frozen", inr(bank.ap.result.hold_details.amount_frozen)],
          ["Status", bank.ap.result.hold_details.status],
        ]
      : [
          ["Mule Account", inc.destination_mule],
          ["Amount to Freeze", inr(inc.amount)],
          ["Reference (RRN)", inc.transaction_id],
          ["Gate Status", bank.status === "REJECTED" ? "Rejected by Rahul" : "Awaiting Guardian Approval"],
        ];

    const ncrpObj = ncrp.ap && ncrp.ap.result && ncrp.ap.result.complaint;
    const ncrpPairs = ncrpObj
      ? [
          ["Complaint ID", ncrpObj.complaint_id],
          ["Portal", ncrpObj.portal],
          ["Jurisdiction", ncrpObj.jurisdiction],
          ["Accused Alias", ncrpObj.accused_details.alias || "Fake CBI Officer"],
          ["Mule Account", ncrpObj.accused_details.mule_account],
          ["Status", ncrpObj.status],
        ]
      : [
          ["Portal", "cybercrime.gov.in"],
          ["Incident ID", inc.incident_id],
          ["Jurisdiction", "Bengaluru Cyber Crime PS"],
          ["Suspect Caller", inc.scammer_number],
          ["Mule Account", inc.destination_mule],
          ["Gate Status", ncrp.status === "REJECTED" ? "Rejected by Rahul" : "Queued for Approval"],
        ];

    body.innerHTML = `
      <div class="incident">
        <div><span>Lost</span><strong class="big">${inr(inc.amount)}</strong></div>
        <div><span>Source</span><strong class="mono">${esc(inc.source_account)}</strong></div>
        <div><span>Mule Account</span><strong class="mono">${esc(inc.destination_mule)}</strong></div>
        <div><span>Reference</span><strong class="mono">${esc(inc.transaction_id)}</strong></div>
        <div><span>Caller</span><strong class="mono">${esc(inc.scammer_number)}</strong></div>
        <div class="timer"><span>Golden hour left</span><strong id="recTimer">--:--</strong></div>
      </div>

      <div class="pipeline">
        <div class="pipe-step done"><span class="pipe-dot"></span><div><strong>01 Intake</strong><div class="muted">${esc(inc.started_at)}</div></div></div>
        <div class="pipe-step ${bank.status === "EXECUTED" ? "done" : "wait"}"><span class="pipe-dot"></span><div><strong>02 Contain</strong><div class="muted">${bank.status === "EXECUTED" ? "Lien Active" : "Awaiting Approval"}</div></div></div>
        <div class="pipe-step ${ncrp.status === "EXECUTED" ? "done" : "wait"}"><span class="pipe-dot"></span><div><strong>03 Document</strong><div class="muted">${ncrp.status === "EXECUTED" ? "1930 + NCRP Ready" : "1930 Ready · NCRP Queued"}</div></div></div>
        <div class="pipe-step done"><span class="pipe-dot"></span><div><strong>04 Seal</strong><div class="muted">Sec 65B SHA-256</div></div></div>
      </div>

      <div class="agents">
        <article class="card agent">
          <div class="agent-top"><div><span class="num">AGENT 01</span><h3>Bank Hold / Lien</h3></div>${bank.tag}</div>
          <p>Requests an immediate inter-bank freeze on the receiving mule account before funds are layered out.</p>
          ${kvGrid(bankPairs)}
          ${btns(bank)}
        </article>

        <article class="card agent">
          <div class="agent-top"><div><span class="num">AGENT 02</span><h3>1930 Helpline Briefing</h3></div><span class="tag green">Ready</span></div>
          <p>Word-for-word spoken script so Amma or Rahul reports every exact coordinate calmly in one call.</p>
          <pre class="out" id="briefText">${esc(brief.verbal_script)}</pre>
          ${brief.checklist ? `<ul class="checklist">${brief.checklist.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}
          <div class="acts"><button class="btn ghost small" data-copy="#briefText">Copy script</button><a class="btn gold small" href="tel:1930">Call 1930</a></div>
        </article>

        <article class="card agent">
          <div class="agent-top"><div><span class="num">AGENT 03</span><h3>Police Complaint (NCRP)</h3></div>${ncrp.tag}</div>
          <p>Pre-fills the formal cybercrime.gov.in complaint with suspect number, UPI ID, mule account, and timestamps.</p>
          ${kvGrid(ncrpPairs)}
          ${btns(ncrp)}
        </article>

        <article class="card agent">
          <div class="agent-top"><div><span class="num">AGENT 04</span><h3>Evidence Dossier</h3></div><span class="tag green">Sealed</span></div>
          <p>Tamper-evident SHA-256 bundle compliant with Section 65B of the Indian Evidence Act.</p>
          <div class="hash-box" id="hashText">${esc(ev.dossier_id)} · SHA-256\n${esc(ev.sha256_hash)}</div>
          <div class="artifact-list">${ev.artifacts_compiled.map((f) => `<span class="artifact-chip">${esc(f)}</span>`).join("")}</div>
          <div class="acts">
            <button class="btn ghost small" data-copy="#hashText">Copy hash</button>
            <button class="btn ghost small" id="btnVerifyHash">Verify Section 65B Seal</button>
          </div>
        </article>
      </div>`;
    const vh = $("#btnVerifyHash");
    if (vh) vh.onclick = () => toast(`Verified ${ev.dossier_id} · ${ev.legal_admissibility}`);
    tickGolden();
  }

  // ---------------- strike ----------------
  function chatEmpty() {
    $("#chatLog").innerHTML = `<div class="bubble sys">Play the scammer below. Ramesh Sharma answers and captures UPI IDs and mule accounts.</div>`;
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
    if (r.step === 1) bubble("sys", "", "Call routed to Ramesh Sharma · Strike Decoy active");
    await wait(450);
    bubble("decoy", "Ramesh (KAVACH Decoy)", r.decoy_response);
    if (r.captured_upi) bubble("sys", "", `Extracted UPI ${r.captured_upi} → added to Fraud Graph`);
    if (r.captured_account) bubble("sys", "", `Extracted Mule ····${r.captured_account.slice(-4)} → added to Fraud Graph`);
    if (r.chakshu_draft && r.chakshu_draft.approval_id) bubble("sys", "", "Sanchar Saathi Chakshu draft queued for Rahul");
    await refresh();
  }

  function renderStrike() {
    const e = S.extracted_entities || { upi_ids: [], mule_accounts: [] };
    $("#entitiesUpi").innerHTML = e.upi_ids.length
      ? e.upi_ids.map((u) => `<span class="chip">${esc(u)}</span>`).join("")
      : `<span class="muted">None captured yet</span>`;
    $("#entitiesMule").innerHTML = e.mule_accounts.length
      ? e.mule_accounts.map((m) => `<span class="chip red">${esc(m)}</span>`).join("")
      : `<span class="muted">None captured yet</span>`;

    const turns = S.strike_stats ? S.strike_stats.turns : 0;
    const wasted = S.strike_stats ? S.strike_stats.minutes_wasted : (e.upi_ids.length || e.mule_accounts.length ? 26 : 0);
    $("#wasted").textContent = wasted;
    $("#decoyTurnCount").textContent = `${turns} ${turns === 1 ? "turn" : "turns"}`;

    const sc = $("#strikeCount");
    const totalEnt = e.upi_ids.length + e.mule_accounts.length;
    if (sc) { sc.hidden = !totalEnt; sc.textContent = totalEnt; }

    if (document.body.dataset.view === "strike") drawGraph();
  }

  // Interactive force layout with drag + click inspection
  let graphPos = {};
  const NODE = {
    syndicate: { r: 16, fill: "#7A2E22", stroke: "#F0603F" },
    phone: { r: 9.5, fill: "#F0603F" },
    upi: { r: 8.5, fill: "#E8B04A" },
    mule_account: { r: 10.5, fill: "#F0603F" },
    victim: { r: 9.5, fill: "#86AEDD" },
  };

  function inspectNode(node) {
    const box = $("#nodeInspector");
    if (!node) { box.hidden = true; return; }
    selectedNodeId = node.id;
    const details = Object.entries(node.details || {}).filter(([, v]) => v != null && v !== "");
    const connected = (S.fraud_graph.links || []).filter((l) => l.source === node.id || l.target === node.id);
    box.hidden = false;
    box.innerHTML = `
      <div class="node-insp-head">
        <div>
          <span class="tag dim">${esc(node.type.replace("_", " "))}</span>
          <h4>${esc(node.label)}</h4>
        </div>
        <button class="btn ghost small" id="btnCloseInsp" aria-label="Close inspector"><svg><use href="#i-close"/></svg></button>
      </div>
      <div class="node-insp-rows">
        ${details.map(([k, v]) => `<div class="node-insp-row"><span>${esc(k.replace(/_/g, " "))}</span><strong>${esc(v)}</strong></div>`).join("")}
        <div class="node-insp-row"><span>Connections</span><strong>${connected.length} edges</strong></div>
      </div>`;
    $("#btnCloseInsp").onclick = () => { selectedNodeId = null; box.hidden = true; drawGraph(); };
  }

  function drawGraph() {
    if (!S) return;
    const svg = $("#graph");
    const W = svg.clientWidth || 900, H = svg.clientHeight || 520;
    const g = S.fraud_graph;
    $("#graphStats").textContent = `${g.nodes.length} entities · ${g.links.length} links · ${g.stats ? g.stats.syndicates_tracked : 2} syndicates`;

    const known = Object.keys(graphPos).length > 0;
    const nodes = g.nodes.map((n, i) => {
      const p = graphPos[n.id];
      const a = (i / Math.max(1, g.nodes.length)) * Math.PI * 2;
      const rad = n.type === "syndicate" ? 0.16 : n.type === "victim" ? 0.42 : 0.30;
      return {
        ...n,
        x: p ? p.x : W / 2 + Math.cos(a) * W * rad,
        y: p ? p.y : H / 2 + Math.sin(a) * H * rad,
        fresh: known && !p,
      };
    });
    const idx = Object.fromEntries(nodes.map((n, i) => [n.id, i]));
    const links = g.links.filter((l) => l.source in idx && l.target in idx);

    if (!known || nodes.some((n) => n.fresh)) {
      for (let it = 0; it < 260; it++) {
        const k = 1 - it / 260;
        for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          let dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy || 1;
          const f = (Math.min(W, H) * 0.78) / d2 * k;
          a.x += dx * f; a.y += dy * f; b.x -= dx * f; b.y -= dy * f;
        }
        for (const l of links) {
          const a = nodes[idx[l.source]], b = nodes[idx[l.target]];
          const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
          const f = ((d - Math.min(W, H) * 0.24) / d) * 0.06 * k;
          a.x += dx * f; a.y += dy * f; b.x -= dx * f; b.y -= dy * f;
        }
        for (const n of nodes) {
          n.x += (W / 2 - n.x) * 0.012 * k; n.y += (H / 2 - n.y) * 0.012 * k;
          n.x = Math.max(72, Math.min(W - 72, n.x)); n.y = Math.max(36, Math.min(H - 40, n.y));
        }
      }
      graphPos = Object.fromEntries(nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
    }

    const short = (s) => (s.length > 28 && W < 700 ? s.slice(0, 26) + "…" : s);
    const wide = W > 700;
    const isMatch = (n) => graphFilter === "all" || n.type === graphFilter;

    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.innerHTML =
      `<defs><marker id="arrow" viewBox="0 0 10 10" refX="17" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#465950"/></marker></defs>` +
      links.map((l) => {
        const a = nodes[idx[l.source]], b = nodes[idx[l.target]];
        const fresh = a.fresh || b.fresh;
        const dim = graphFilter !== "all" && !(isMatch(a) || isMatch(b));
        return `<line class="edge${fresh ? " new" : ""}${dim ? " dim" : ""}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" marker-end="url(#arrow)"/>` +
          (wide && !dim ? `<text class="elabel" x="${(a.x + b.x) / 2}" y="${(a.y + b.y) / 2 - 5}" text-anchor="middle">${esc(l.relation)}</text>` : "");
      }).join("") +
      nodes.map((n) => {
        const st = NODE[n.type] || { r: 8, fill: "#828C84" };
        const fill = n.type === "phone" && n.details && n.details.risk_score < 0.5 ? "#5CC594" : st.fill;
        const dim = !isMatch(n);
        const sel = selectedNodeId === n.id;
        return `<g class="node-g${n.fresh ? " fresh" : ""}${dim ? " dim" : ""}${sel ? " selected" : ""}" data-nid="${esc(n.id)}"><title>${esc(n.label)} (${esc(n.type)})</title>
          <circle cx="${n.x}" cy="${n.y}" r="${st.r}" fill="${fill}" ${st.stroke && !sel ? `style="stroke:${st.stroke}"` : ""}/>
          <text class="nlabel" x="${n.x}" y="${n.y + st.r + 14}" text-anchor="middle">${esc(short(n.label))}</text></g>`;
      }).join("");

    // Wire drag & click inspection cleanly
    svg.querySelectorAll(".node-g").forEach((el) => {
      el.onpointerdown = (ev) => {
        ev.stopPropagation();
        const nid = el.dataset.nid;
        const node = nodes.find((x) => x.id === nid);
        if (!node) return;
        const startX = ev.clientX, startY = ev.clientY;
        const origX = node.x, origY = node.y;
        let moved = false;
        const rect = svg.getBoundingClientRect();
        const scaleX = W / Math.max(1, rect.width), scaleY = H / Math.max(1, rect.height);
        const onMove = (mv) => {
          const dx = (mv.clientX - startX) * scaleX, dy = (mv.clientY - startY) * scaleY;
          if (Math.hypot(dx, dy) > 4) moved = true;
          graphPos[nid] = {
            x: Math.max(50, Math.min(W - 50, origX + dx)),
            y: Math.max(28, Math.min(H - 36, origY + dy)),
          };
          drawGraph();
        };
        const onUp = () => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          if (!moved) { inspectNode(node); drawGraph(); }
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
      };
    });
  }

  // ---------------- gate & MCP ----------------
  function renderMcpGrid(targetId) {
    const host = $(targetId);
    if (!host) return;
    const servers = S.mcp_servers || window.KavachMock.MCP_SERVERS || [];
    host.innerHTML = servers.map((srv) => `
      <div class="mcp-card">
        <div class="mcp-card-top"><strong>${esc(srv.name)}</strong><span class="tag green">Active</span></div>
        <p>${esc(srv.purpose)}</p>
        <div class="mcp-tools">${srv.tools.map((t) => `<span class="mcp-tool-pill">${esc(t)}</span>`).join("")}</div>
      </div>`).join("");
  }

  function renderGate() {
    renderMcpGrid("#mcpGrid");
    renderMcpGrid("#mcpModalGrid");

    const allLogs = S.audit_log || [];
    const fresh = seenLogs ? allLogs.length - seenLogs : 0;
    seenLogs = allLogs.length;

    const q = auditQuery.trim().toLowerCase();
    const logs = allLogs.filter((l) => {
      if (tierFilter !== "ALL" && l.tier !== tierFilter) return false;
      if (!q) return true;
      return `${l.agent} ${l.tool} ${l.decision} ${l.reason}`.toLowerCase().includes(q);
    });

    $("#logCount").textContent = `${logs.length} of ${allLogs.length} entries`;
    const tierTag = { AUTOMATIC: "green", NEEDS_GUARDIAN_APPROVAL: "gold", NEVER_ALLOWED: "red" };
    const tierName = { AUTOMATIC: "Automatic", NEEDS_GUARDIAN_APPROVAL: "Needs Rahul", NEVER_ALLOWED: "Never" };
    const decColor = { BLOCKED: "var(--red)", APPROVAL_PENDING: "var(--gold)", REJECTED: "var(--tx2)" };

    $("#auditBody").innerHTML = logs.map((l, i) => {
      const open = expandedLogs.has(l.id);
      return `<tr class="audit-row${i < fresh && tierFilter === "ALL" && !q ? " flash" : ""}" data-logid="${esc(l.id)}">
        <td>${esc(l.time)}</td>
        <td>${esc(l.agent)}</td>
        <td>${esc(l.tool)}</td>
        <td><span class="tag ${tierTag[l.tier] || "dim"}">${esc(tierName[l.tier] || l.tier)}</span></td>
        <td><strong style="color:${decColor[l.decision] || "var(--green)"}">${esc(l.decision.replace(/_/g, " "))}</strong></td>
        <td>
          <div>${esc(l.reason)}</div>
          ${open ? `<pre class="audit-args">${esc(JSON.stringify(l.args || {}, null, 2))}</pre>` : ""}
        </td>
      </tr>`;
    }).join("");
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
    const t = e.target.closest("button, a, tr.audit-row");
    if (!t) return;
    if (t.classList.contains("audit-row")) {
      const id = t.dataset.logid;
      if (expandedLogs.has(id)) expandedLogs.delete(id); else expandedLogs.add(id);
      renderGate();
      return;
    }
    if (t.dataset.nav) go(t.dataset.nav);
    else if (t.dataset.decide) decide(t.dataset.id, t.dataset.decide);
    else if (t.dataset.toast) toast(t.dataset.toast);
    else if (t.dataset.copy) {
      const text = $(t.dataset.copy).textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
        .then(() => toast("Copied to clipboard"), () => toast("Copy blocked by browser"));
    }
    else if (t.dataset.step === "1") startCall("+91 98XXX XX210").then(() => markStep(1));
    else if (t.dataset.step === "2") runDecoy();
    else if (t.dataset.step === "3") triggerRecovery();
    else if (t.dataset.step === "4") forbidden();
    else if (t.dataset.step === "reset") resetAll();
    else if (t.dataset.lang) setLang(t.dataset.lang);
    else if (t.dataset.sms) setSmsPreset(t.dataset.sms);
    else if (t.dataset.gfilter) {
      graphFilter = t.dataset.gfilter;
      $$("[data-gfilter]").forEach((b) => b.classList.toggle("active", b.dataset.gfilter === graphFilter));
      drawGraph();
    }
    else if (t.dataset.tfilter) {
      tierFilter = t.dataset.tfilter;
      $$("[data-tfilter]").forEach((b) => b.classList.toggle("active", b.dataset.tfilter === tierFilter));
      renderGate();
    }
    else if (t.classList.contains("chip-btn")) sendToDecoy(t.textContent);
    else if (t.classList.contains("mark")) { e.preventDefault(); go("amma"); }
  });

  $("#btnSimScam").onclick = () => startCall("+91 98XXX XX210").then(() => markStep(1));
  $("#btnSimTrusted").onclick = () => startCall("+91 91234 56789");
  $("#btnKavach").onclick = tapKavach;
  $("#btnHangup").onclick = hangUp;
  $("#btnSpeak").onclick = () => speak($("#warningText").textContent, lang);
  $("#btnToDecoy").onclick = () => {
    clearInterval(callClock);
    stopWave();
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    $("#aCall").hidden = true;
    runDecoy();
  };
  $("#btnMute").onclick = () => {
    const b = $("#btnMute");
    const next = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", String(next));
    b.textContent = next ? "Muted" : "Mute";
  };
  $("#btnSpeakerToggle").onclick = () => {
    const b = $("#btnSpeakerToggle");
    const next = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", String(next));
    b.textContent = next ? "Speaker" : "Earpiece";
  };
  $("#btnCheckSms").onclick = checkSms;
  $("#btnPanic").onclick = () => triggerRecovery();
  $("#btnViolation").onclick = forbidden;
  $("#btnResetGraph").onclick = () => { graphPos = {}; selectedNodeId = null; $("#nodeInspector").hidden = true; drawGraph(); };
  $("#auditSearch").oninput = (e) => { auditQuery = e.target.value; renderGate(); };
  $("#composer").onsubmit = (e) => { e.preventDefault(); const i = $("#scamInput"); sendToDecoy(i.value); i.value = ""; };

  const openMcp = () => { $("#mcpModal").hidden = false; };
  const closeMcp = () => { $("#mcpModal").hidden = true; };
  $("#btnMcpModal").onclick = openMcp;
  $("#btnMcpTop").onclick = openMcp;
  $("#btnCloseMcpModal").onclick = closeMcp;
  $("#mcpModal").onclick = (e) => { if (e.target === $("#mcpModal")) closeMcp(); };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMcp(); });

  addEventListener("hashchange", () => go(location.hash.slice(1), false));
  let resizeT;
  addEventListener("resize", () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { graphPos = {}; go(document.body.dataset.view, false); }, 150);
  });
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
    c.title = online
      ? "Connected to the KAVACH FastAPI server. Every action runs through the Python agents and policy gate."
      : "No server found. The agents run in your browser with the same rules as the Python backend.";
    await act(refresh);
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  boot();
})();
