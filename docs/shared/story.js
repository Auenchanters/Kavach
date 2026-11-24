// KAVACH story engine: the scripted stand-in for the six MCP servers, the agents and the policy gate.
// Both apps (phone, admin) render from this state; tabs stay in sync over BroadcastChannel + localStorage.
// shortcut: a scripted replay, not the product (the hackathon forbids building that before 1 Dec).

export const AUTO = "AUTOMATIC", APPR = "NEEDS_GUARDIAN_APPROVAL", NEVER = "NEVER_ALLOWED";

const TIERS = {
  "telephony.answer_call": AUTO, "telephony.join_conference": AUTO, "telephony.speak_warning": AUTO,
  "telephony.transfer_to_decoy": AUTO, "telephony.end_call": AUTO,
  "intel.check_number": AUTO, "intel.check_url": AUTO, "intel.add_entity": AUTO, "intel.link_entities": AUTO,
  "knowledge.match_scam_pattern": AUTO, "knowledge.get_safe_advice": AUTO,
  "family.notify_guardian": AUTO, "family.send_voice_note": AUTO,
  "bank.parse_debit_sms": AUTO, "report.prepare_1930_brief": AUTO,
  "bank.request_hold": APPR, "bank.request_block": APPR, "report.draft_ncrp_complaint": APPR,
  "report.file_chakshu": APPR, "report.share_transcript": APPR,
};

export const SCAMMER = "+91 98XXX XX210";
export const LANGS = { kn: "Kannada", hi: "Hindi", en: "English" };
export const TRANSCRIPT = [
  { clip: "scam_1", text: "This is Inspector Alok Verma, CBI Cyber Crime, New Delhi. A non-bailable digital arrest warrant has been issued against your Aadhaar." },
  { clip: "scam_2", lang: "hi", text: "वीडियो कॉल पर बने रहिए। किसी को कुछ मत बताइए, वरना अभी गिरफ़्तारी होगी।" },
];
export const WARNING = {
  kn: "ಅಮ್ಮಾ, ಇದು ಸುಳ್ಳು ಕರೆ! ಭಾರತದ ಯಾವುದೇ ಪೊಲೀಸ್ ಅಥವಾ ಸಿಬಿಐ ವಿಡಿಯೋ ಕಾಲಿನಲ್ಲಿ ಯಾರನ್ನೂ ಬಂಧಿಸುವುದಿಲ್ಲ. ದಯವಿಟ್ಟು ಕೂಡಲೇ ಕರೆ ಕಟ್ ಮಾಡಿ.",
  hi: "अम्मा, यह एक फर्जी कॉल है! भारत में कोई भी पुलिस या सीबीआई अधिकारी वीडियो कॉल पर गिरफ़्तारी नहीं करता। कृपया तुरंत फोन काटें।",
  en: "Amma, this is a scam. Real police or CBI officers never arrest anyone over a video call. Please hang up now.",
};
export const SMS_NOTE = {
  kn: "ಅಮ್ಮಾ, ಇದು ನಕಲಿ ಸಂದೇಶ. ಆ ಲಿಂಕ್ ಮೇಲೆ ಒತ್ತಬೇಡಿ, ಯಾರಿಗೂ ಹಣ ಕಳುಹಿಸಬೇಡಿ.",
  hi: "अम्मा, यह एक फर्जी मैसेज है। किसी भी लिंक पर क्लिक न करें, किसी को पैसे न भेजें।",
  en: "Amma, this message is a scam. Do not tap the link, and do not send anyone money.",
};
export const RECOVER_NOTE = {
  kn: "ಅಮ್ಮಾ, ಭಯಪಡಬೇಡಿ. ರಾಹುಲ್‌ಗೆ ತಿಳಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಹಣವನ್ನು ಮರಳಿ ಪಡೆಯಲು ಕವಚ ಕೆಲಸ ಶುರು ಮಾಡಿದೆ.",
  hi: "अम्मा, घबराइए मत। राहुल को बता दिया गया है। आपका पैसा वापस लाने का काम कवच ने शुरू कर दिया है।",
  en: "Amma, don't worry. Rahul knows, and KAVACH has started getting your money back.",
};
export const SMS_TEXT = "Dear consumer, your electricity power will be cut tonight at 9:30 PM because previous month bill was not updated. Pay now at bit.ly/eb-bill";
// What the scammer says to Ramesh, and Ramesh's scripted replies (clip ids match docs/shared/clips).
export const DECOY_SCRIPT = [
  { scam: "Sir, this is RBI verification. Deposit ₹50,000 security money now to clear your name.", reply: "ramesh_1" },
  { scam: "Open Google Pay and send ₹50,000 to refund.cbi@okaxis. Do it now!", reply: "ramesh_2", clip: "scam_3" },
  { scam: "Account number is 50100492814471, HDFC Bank Salt Lake. Send it now!", reply: "ramesh_3" },
];
export const RAMESH = {
  ramesh_1: "Haan beta... security deposit? But my pension comes in Canara Bank. Where should I send it? Let me find my reading glasses.",
  ramesh_2: "Refund dot C B I at ok axis... beta, can you spell it slowly? My grandson set up this phone. What was the account number?",
  ramesh_3: "H D F C, Salt Lake... wait beta, the screen went black! Now it is asking for a six digit PIN. Should I put my birth year?",
};
// Precomputed SHA-256 of the demo incident record, so the dossier is identical on every run.
const DOSSIER_SHA = "7c1f0b2a9d4e8f3a6b5c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a";
const BASE_CLOCK = 11 * 3600 + 42 * 60; // story time starts at 11:42:00, as in the film

function seedGraph() {
  const n = (id, label, type, extra = {}) => ({ id, label, type, ...extra });
  return {
    nodes: [
      n("SYN-MEWAT-04", "Kolkata–Mewat digital arrest ring", "syndicate"),
      n("SYN-JAM-09", "Jamtara electricity-bill ring", "syndicate"),
      n(SCAMMER, SCAMMER, "phone", { risk: 0.96 }),
      n("+91 70XXX XX451", "+91 70XXX XX451", "phone", { risk: 0.91 }),
      n("+91 80234 99000", "+91 80234 99000", "phone", { risk: 0.88 }),
      n("+91 63XXX XX118", "+91 63XXX XX118", "phone", { risk: 0.84 }),
      n("ebill.pay@icici", "ebill.pay@icici", "upi"),
      n("kyc.update@ybl", "kyc.update@ybl", "upi"),
      n("SBI ····2290", "SBI ····2290", "mule"),
      n("Amma (Bengaluru)", "Amma · Bengaluru", "family"),
      n("Sunita Devi (Lucknow)", "Sunita · Lucknow", "family"),
      n("R. Ramanathan (Chennai)", "Ramanathan · Chennai", "family"),
    ],
    links: [
      [SCAMMER, "SYN-MEWAT-04"], ["+91 70XXX XX451", "SYN-MEWAT-04"], ["+91 63XXX XX118", "SYN-MEWAT-04"],
      ["+91 80234 99000", "SYN-JAM-09"], ["ebill.pay@icici", "SYN-JAM-09"], ["kyc.update@ybl", "SYN-MEWAT-04"],
      ["SBI ····2290", "SYN-JAM-09"], [SCAMMER, "Amma (Bengaluru)"], ["+91 70XXX XX451", "Sunita Devi (Lucknow)"],
      ["+91 80234 99000", "R. Ramanathan (Chennai)"],
    ].map(([source, target]) => ({ source, target })),
  };
}

export function freshState(now = Date.now()) {
  return {
    t0: now, rev: 0, lang: "kn",
    logs: [], approvals: {}, messages: [], graph: seedGraph(),
    call: { status: "idle" }, sms: null, decoy: { turns: [], upi: [], accounts: [] }, recovery: null,
    chakshuQueued: false, forbidden: null,
  };
}

// ---- pure helpers on a state object ----
function clock(s, now) {
  const t = BASE_CLOCK + Math.floor((now - s.t0) / 1000);
  return [t / 3600, (t / 60) % 60, t % 60].map((v) => String(Math.floor(v)).padStart(2, "0")).join(":");
}
let idSeq = 0;
const newId = (prefix) => `${prefix}-${(Date.now() % 1e6).toString(36).toUpperCase()}${(idSeq++).toString(36).toUpperCase()}`;

function log(s, now, agent, tool, tier, args, decision, reason) {
  s.logs.unshift({ id: `LOG-${String(s.logs.length + 1).padStart(4, "0")}`, time: clock(s, now), agent, tool, tier, args, decision, reason });
}

function gate(s, now, agent, tool, args, token) {
  const tier = TIERS[tool] || NEVER;
  if (tier === NEVER) {
    const reason = `'${tool}' is in the never-allowed tier. KAVACH never moves money, shares credentials or reads banking apps.`;
    log(s, now, agent, tool, tier, args, "BLOCKED", reason);
    return { allowed: false, decision: "BLOCKED", reason };
  }
  if (tier === APPR) {
    const p = token && s.approvals[token];
    if (p && p.status === "APPROVED" && p.tool === tool) {
      p.status = "EXECUTED";
      log(s, now, agent, tool, tier, args, "ALLOWED", `Rahul approved (${token}).`);
      return { allowed: true, decision: "ALLOWED" };
    }
    const id = newId("APPR");
    s.approvals[id] = { id, agent, tool, args, status: "PENDING", created: clock(s, now) };
    log(s, now, agent, tool, tier, args, "APPROVAL_PENDING", "Waits for Rahul's approval.");
    return { allowed: false, decision: "APPROVAL_PENDING", approval: id };
  }
  log(s, now, agent, tool, tier, args, "ALLOWED", "Ran automatically.");
  return { allowed: true, decision: "ALLOWED" };
}

function notify(s, now, level, title, points, actions) {
  gate(s, now, "GuardianAgent", "family.notify_guardian", { level, title });
  s.messages.unshift({ id: newId("MSG"), time: clock(s, now).slice(0, 5), level, title, points, actions });
}

// The gated tools' effects once Rahul approves. Declarative, so state stays plain JSON across tabs.
const EXEC = {
  "bank.request_hold": (s, a) => ({ hold_id: "HOLD-HDFC-0112", account: a.account, amount: a.amount, status: "Lien placed on the mule account" }),
  "report.draft_ncrp_complaint": () => ({ ack: "NCRP-2026-BLR-31207", portal: "cybercrime.gov.in", status: "Registered with Bengaluru cyber crime police" }),
  "report.file_chakshu": (s, a) => ({ ref: "CHK-DOT-55810", number: a.number, status: "Queued for SIM disconnection (2-hour carrier SLA)" }),
};

function fileChakshu(s, now, agent, evidence) {
  if (s.chakshuQueued) return null;
  s.chakshuQueued = true;
  return gate(s, now, agent, "report.file_chakshu", { number: SCAMMER, evidence }).approval;
}

function addEntity(s, now, id, type, linkTo) {
  gate(s, now, "IntelExtractor", "intel.add_entity", { id, type });
  if (!s.graph.nodes.some((n) => n.id === id)) s.graph.nodes.push({ id, label: id, type, fresh: true });
  gate(s, now, "IntelExtractor", "intel.link_entities", { source: id, target: linkTo });
  s.graph.links.push({ source: id, target: linkTo, fresh: true });
}

const ACTIONS = {
  "set-lang": (s, now, { lang }) => { if (LANGS[lang]) s.lang = lang; },
  "screen-call": (s, now) => {
    gate(s, now, "CallScreener", "intel.check_number", { number: SCAMMER });
    gate(s, now, "CallScreener", "telephony.answer_call", { number: SCAMMER });
    s.call = { status: "live", risk: 0.96, reports: 47, category: "Digital arrest · CBI impersonation", startedAt: now };
  },
  "tap-kavach": (s, now) => {
    if (s.call.status !== "live") ACTIONS["screen-call"](s, now);
    gate(s, now, "ShieldAgent", "telephony.join_conference", { participant: "KAVACH" });
    gate(s, now, "ScamDetector", "knowledge.match_scam_pattern", { matched: ["cbi", "warrant", "digital arrest", "aadhaar"] });
    gate(s, now, "ShieldAgent", "knowledge.get_safe_advice", { category: "digital_arrest", lang: s.lang });
    gate(s, now, "ShieldAgent", "telephony.speak_warning", { lang: s.lang });
    const appr = fileChakshu(s, now, "ReporterAgent", "Caller matched the digital-arrest playbook (4 red flags).");
    notify(s, now, "critical", "Amma got a digital-arrest scam call", [
      "The caller claimed to be a CBI officer and told her to stay on a video call.",
      `KAVACH joined the call and warned her in ${LANGS[s.lang]}.`,
      "No money moved.",
    ], appr ? [{ approve: appr, label: "Report the number" }] : []);
    Object.assign(s.call, { status: "joined", risk: 0.94, joinedAt: now });
  },
  "end-call": (s, now) => {
    if (s.call.status === "idle") return;
    gate(s, now, "ShieldAgent", "telephony.end_call", { reason: "confirmed fraud" });
    s.call = { ...s.call, status: "ended" };
  },
  "close-call": (s) => { s.call = { status: "idle" }; },
  "check-sms": (s, now) => {
    gate(s, now, "MessageChecker", "intel.check_url", { url: "bit.ly/eb-bill" });
    gate(s, now, "MessageChecker", "knowledge.match_scam_pattern", { matched: ["electricity", "tonight", "pay now"] });
    gate(s, now, "MessageChecker", "family.send_voice_note", { to: "Amma", lang: s.lang });
    s.sms = { verdict: "scam", why: "bit.ly/eb-bill is a known electricity-bill phishing link." };
  },
  "decoy-turn": (s, now) => {
    const i = s.decoy.turns.length;
    if (i >= DECOY_SCRIPT.length) return;
    if (i === 0) gate(s, now, "DecoyPersona", "telephony.transfer_to_decoy", { persona: "Ramesh, 67" });
    const step = DECOY_SCRIPT[i];
    s.decoy.turns.push({ scam: step.scam, reply: step.reply, at: clock(s, now) });
    if (step.scam.includes("refund.cbi@okaxis") && !s.decoy.upi.length) {
      s.decoy.upi.push("refund.cbi@okaxis");
      addEntity(s, now, "refund.cbi@okaxis", "upi", SCAMMER);
    }
    if (step.scam.includes("50100492814471") && !s.decoy.accounts.length) {
      s.decoy.accounts.push("HDFC ····4471");
      addEntity(s, now, "HDFC ····4471", "mule", "refund.cbi@okaxis");
      fileChakshu(s, now, "ReporterAgent", "Decoy captured refund.cbi@okaxis and HDFC ····4471.");
    }
  },
  "recover": (s, now) => {
    if (s.recovery) return;
    const inc = { id: "INC-20261125-1142", amount: 48000, from: "Canara Bank ····9102", to: "HDFC ····4471", ref: "UPI-619284019284", caller: SCAMMER, startedAt: now - 72000 };
    gate(s, now, "RecoverSwarm", "bank.parse_debit_sms", { sms: "₹48,000 debited from A/c ····9102 via UPI" });
    const hold = gate(s, now, "BankAgent", "bank.request_hold", { account: inc.to, amount: inc.amount, ref: inc.ref }).approval;
    gate(s, now, "HelplineAgent", "report.prepare_1930_brief", { incident: inc.id });
    const ncrp = gate(s, now, "ComplaintAgent", "report.draft_ncrp_complaint", { incident: inc.id }).approval;
    gate(s, now, "EvidenceAgent", "intel.add_entity", { dossier: "EVID-7C1F0B2A9D", sha256: DOSSIER_SHA.slice(0, 12) + "…" });
    notify(s, now, "critical", "₹48,000 left Amma's account. Recovery has started.", [
      "Four agents started in parallel inside the golden hour.",
      `A bank hold on ${inc.to} is ready for your approval.`,
      "The 1930 call script is ready.",
      "The police complaint is drafted with a sealed evidence pack.",
    ], [{ approve: hold, label: "Approve bank hold" }, { approve: ncrp, label: "Approve complaint" }, { call: "1930", label: "Call 1930" }]);
    s.recovery = { inc, hold, ncrp, brief: brief1930(inc), dossier: { id: "EVID-7C1F0B2A9D", sha256: DOSSIER_SHA } };
  },
  "decide": (s, now, { id, approve }) => {
    const p = s.approvals[id];
    if (!p) throw new Error(`Unknown approval ${id}`);
    if (p.status !== "PENDING") throw new Error(`Already ${p.status.toLowerCase()}`);
    p.status = approve ? "APPROVED" : "REJECTED";
    p.decidedAt = clock(s, now);
    log(s, now, "Rahul", approve ? "family.approve" : "family.reject", APPR, { approval: id }, approve ? "APPROVED" : "REJECTED",
      `Rahul ${approve ? "approved" : "rejected"} ${p.tool}.`);
    if (approve) {
      gate(s, now, p.agent, p.tool, p.args, id);
      p.result = EXEC[p.tool] ? EXEC[p.tool](s, p.args) : null;
    }
  },
  "forbidden": (s, now) => {
    s.forbidden = gate(s, now, "FaultyAgent", "bank.move_money", { amount: 50000, to: "MULE_ACCOUNT_XYZ" });
  },
};

function brief1930(inc) {
  return [
    "Incident: digital-arrest extortion, money lost",
    `Amount: ₹48,000 from ${inc.from}`,
    `Reference (RRN): ${inc.ref}`,
    "Sent to UPI: refund.cbi@okaxis",
    `Mule account: ${inc.to}`,
    `Caller: ${inc.caller}`,
    "Ask: freeze the receiving account through I4C now",
  ];
}

export const SCENES = {
  home: [],
  call: [["screen-call"]],
  "call-joined": [["screen-call"], ["tap-kavach"]],
  "call-ended": [["screen-call"], ["tap-kavach"], ["end-call"]],
  sms: [["check-sms"]],
  decoy: [["decoy-turn"], ["decoy-turn"], ["decoy-turn"]],
  recover: [["screen-call"], ["tap-kavach"], ["end-call"], ["close-call"], ["decoy-turn"], ["decoy-turn"], ["decoy-turn"], ["recover"]],
  approved: [["screen-call"], ["tap-kavach"], ["end-call"], ["close-call"], ["decoy-turn"], ["decoy-turn"], ["decoy-turn"], ["recover"], ["approve-all"]],
  forbidden: [["forbidden"]],
};

/** Pure reducer: returns a new state. Throws on an invalid decision. */
export function apply(state, type, payload = {}, now = Date.now()) {
  const s = structuredClone(state);
  if (type === "approve-all") {
    for (const p of Object.values(s.approvals)) if (p.status === "PENDING") ACTIONS.decide(s, now, { id: p.id, approve: true });
  } else if (ACTIONS[type]) ACTIONS[type](s, now, payload);
  else throw new Error(`Unknown action ${type}`);
  s.rev += 1;
  return s;
}

export function sceneState(name, now = Date.now()) {
  let s = freshState(now);
  for (const [type, payload] of SCENES[name] || []) s = apply(s, type, payload, now);
  return s;
}

const KEY = "kavach.story.v1";
const store = (() => { try { return globalThis.localStorage || null; } catch { return null; } })();

/** Live store shared by every open tab. */
export function createStory({ channel = "kavach", now = () => Date.now() } = {}) {
  let state = null;
  try { state = store && JSON.parse(store.getItem(KEY)); } catch { state = null; }
  if (!state || !state.logs) state = freshState(now());
  const subs = new Set();
  const bc = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(channel) : null;
  const emit = (meta) => subs.forEach((fn) => fn(state, meta));
  const commit = (next, meta) => {
    state = next;
    try { store && store.setItem(KEY, JSON.stringify(state)); } catch { /* private mode: tabs just won't share */ }
    if (bc) bc.postMessage({ state, meta });
    emit({ ...meta, local: true });
  };
  if (bc) bc.onmessage = (e) => { if (e.data.state.rev !== state.rev || e.data.state.t0 !== state.t0) { state = e.data.state; emit({ ...e.data.meta, remote: true }); } };
  return {
    get state() { return state; },
    dispatch(type, payload) { commit(apply(state, type, payload, now()), { type }); },
    reset() { commit(freshState(now()), { type: "reset" }); },
    goto(scene) { if (!SCENES[scene]) throw new Error(`Unknown scene ${scene}`); commit(sceneState(scene, now()), { type: "scene", scene }); },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
    clock: () => clock(state, now()),
    close() { if (bc) bc.close(); },
  };
}

export const pending = (s) => Object.values(s.approvals).filter((a) => a.status === "PENDING");
