/* In-browser stand-in for the KAVACH FastAPI backend, used when no server answers (GitHub Pages).
   shortcut: a hand port of kavach/ with the same routes, rules and response shapes;
   when you change the Python API, change this file too. */
(function () {
  "use strict";
  const AUTO = "AUTOMATIC", APPR = "NEEDS_GUARDIAN_APPROVAL", NEVER = "NEVER_ALLOWED";
  const TIERS = {
    "telephony.answer_call": AUTO, "telephony.join_conference": AUTO, "telephony.speak_warning": AUTO,
    "telephony.transfer_to_decoy": AUTO, "telephony.end_call": AUTO,
    "intel.check_number": AUTO, "intel.check_url": AUTO, "intel.add_entity": AUTO, "intel.link_entities": AUTO,
    "intel.get_fraud_graph": AUTO, "knowledge.match_scam_pattern": AUTO, "knowledge.get_safe_advice": AUTO,
    "family.notify_guardian": AUTO, "family.send_voice_note": AUTO, "family.request_approval": AUTO,
    "bank.parse_debit_sms": AUTO, "bank.list_transactions": AUTO, "report.prepare_1930_brief": AUTO,
    "bank.request_hold": APPR, "bank.request_block": APPR, "report.draft_ncrp_complaint": APPR,
    "report.file_chakshu": APPR, "report.share_transcript": APPR,
  };
  const PLAYBOOKS = {
    digital_arrest: ["Digital Arrest / CBI Impersonation", 0.95, ["digital arrest", "cbi", "crime branch", "money laundering", "supreme court", "warrant", "aadhaar", "canara bank", "narcotics", "skype call", "stay on video", "security deposit", "rbi verification account"]],
    kyc_expiry: ["Bank / SIM KYC Expiration Scam", 0.88, ["kyc expire", "sim block", "account suspend", "pan card update", "click link", "download quicksupport", "anydesk", "24 hours", "otp"]],
    parcel_drugs: ["Customs / International Parcel Scam", 0.92, ["fedex", "dhl", "customs mumbai", "parcel seized", "mdma", "taiwan passport", "customs penalty", "transfer clearance"]],
    electricity_cutoff: ["Urgent Electricity Bill Disconnection", 0.85, ["power cut", "electricity bill", "tonight 9:30", "discom", "unpaid bill", "pay immediately", "call electricity officer"]],
    investment_fraud: ["High-Yield VIP Stock/Crypto Syndicate", 0.9, ["vip group", "guaranteed returns", "institutional allotment", "pre-ipo", "forex", "trading app", "transfer to trading account"]],
  };
  const ADVICE = {
    kn: "ಅಮ್ಮಾ, ಇದು ಸುಳ್ಳು ಕರೆ! ಭಾರತದ ಯಾವುದೇ ಪೊಲೀಸ್ ಅಥವಾ ಸಿಬಿಐ ವಿಡಿಯೋ ಕಾಲಿನಲ್ಲಿ ಯಾರನ್ನೂ ಬಂಧಿಸುವುದಿಲ್ಲ. ದಯವಿಟ್ಟು ಕೂಡಲೇ ಕರೆ ಕಟ್ ಮಾಡಿ.",
    hi: "अम्मा, यह एक फर्जी कॉल है! भारत में कोई भी पुलिस या सीबीआई अधिकारी वीडियो कॉल पर गिरफ़्तारी नहीं करता। कृपया तुरंत फोन काटें।",
    en: "Amma, this is a scam! Real police or CBI officers never arrest anyone over video call or ask for money verification. Please hang up immediately.",
  };
  const SMS_WARN = {
    kn: "ಅಮ್ಮಾ, ಇದು ನಕಲಿ ಸಂದೇಶ. ಆ ಲಿಂಕ್ ಮೇಲೆ ಒತ್ತಬೇಡಿ, ಯಾರಿಗೂ ಹಣ ಕಳುಹಿಸಬೇಡಿ!",
    hi: "अम्मा, यह एक फर्जी मैसेज है। किसी भी लिंक पर क्लिक न करें, किसी को पैसे न भेजें!",
    en: "Amma, this message is a scam. Do not tap the link and do not send anyone money.",
  };
  const LANG = { kn: "Kannada", hi: "Hindi", en: "English" };
  const NUMBERS = {
    "+91 98XXX XX210": { reported_count: 47, risk_score: 0.96, category: "Digital Arrest / CBI Impersonation", syndicate_id: "SYN-MEWAT-04" },
    "+91 70XXX XX451": { reported_count: 19, risk_score: 0.91, category: "Mule Call Relay / Tech Support", syndicate_id: "SYN-MEWAT-04" },
    "+91 91234 56789": { reported_count: 0, risk_score: 0.05, category: "Trusted Contact - Rahul (Son)", syndicate_id: null },
  };
  const SCAMMER = "+91 98XXX XX210";

  const clock = () => new Date().toTimeString().slice(0, 8);
  const hex = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, "0")).join("").slice(0, n).toUpperCase();
  const inr = (n) => Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
  let S;

  function seedGraph() {
    const nodes = [
      ["SYN-MEWAT-04", "Kolkata-Mewat 'Digital Arrest' Syndicate", "syndicate"],
      ["SYN-JAM-09", "Jamtara Discom Bill Fraud Ring", "syndicate"],
      ["+91 98XXX XX210", "+91 98XXX XX210", "phone", { risk_score: 0.96 }],
      ["+91 70XXX XX451", "+91 70XXX XX451", "phone", { risk_score: 0.91 }],
      ["+91 91234 56789", "+91 91234 56789", "phone", { risk_score: 0.05 }],
      ["+91 80234 99000", "+91 80234 99000", "phone", { risk_score: 0.88 }],
      ["refund.cbi@okaxis", "refund.cbi@okaxis", "upi"],
      ["ebill.pay@icici", "ebill.pay@icici", "upi"],
      ["HDFC ····4471", "HDFC ····4471", "mule_account"],
      ["Amma (Bengaluru)", "Amma (Bengaluru)", "victim"],
      ["Sunita Devi (Lucknow)", "Sunita Devi (Lucknow)", "victim"],
      ["R. Ramanathan (Chennai)", "R. Ramanathan (Chennai)", "victim"],
    ].map(([id, label, type, details]) => ({ id, label, type, details: details || {} }));
    const links = [
      ["+91 98XXX XX210", "SYN-MEWAT-04", "OPERATED_BY"], ["+91 70XXX XX451", "SYN-MEWAT-04", "OPERATED_BY"],
      ["+91 80234 99000", "SYN-JAM-09", "OPERATED_BY"], ["refund.cbi@okaxis", "SYN-MEWAT-04", "LAUNDERS_FOR"],
      ["ebill.pay@icici", "SYN-JAM-09", "LAUNDERS_FOR"], ["HDFC ····4471", "SYN-MEWAT-04", "MULE_SETTLEMENT"],
      ["refund.cbi@okaxis", "HDFC ····4471", "DEPOSITS_INTO"], ["+91 98XXX XX210", "Amma (Bengaluru)", "ATTACK_INTERCEPTED"],
    ].map(([source, target, relation]) => ({ source, target, relation }));
    return { nodes, links };
  }

  function reset() {
    S = { logs: [], approvals: {}, executors: {}, messages: [], notes: [], graph: seedGraph(), recovery: null,
      entities: { upi_ids: [], mule_accounts: [], phone_numbers: [] }, chakshu: false, step: 0 };
    log("SYSTEM", "policy_gate.init", AUTO, { version: "1.0-hackathon", action_tiers_enforced: 3 }, "ALLOWED",
      "Policy gate initialized successfully with strict tier enforcement");
  }

  function log(agent, tool, tier, args, decision, reason) {
    S.logs.unshift({ id: `LOG-${String(S.logs.length + 1).padStart(4, "0")}`, time: clock(), agent, tool, tier, args, decision, reason });
  }

  function gate(agent, tool, args, token, onApprove) {
    const tier = TIERS[tool] || NEVER;
    if (tier === NEVER) {
      const reason = `Security Policy Violation: '${tool}' belongs to NEVER_ALLOWED tier. KAVACH never executes fund transfers, credentials sharing, or banking app inspection.`;
      log(agent, tool, tier, args, "BLOCKED", reason);
      return { allowed: false, tier, decision: "BLOCKED", reason };
    }
    if (tier === APPR) {
      const p = token && S.approvals[token];
      if (p && p.status === "APPROVED" && p.tool === tool) {
        p.status = "EXECUTED";
        const reason = `Guardian approved action with token ${token}.`;
        log(agent, tool, tier, args, "ALLOWED", reason);
        return { allowed: true, tier, decision: "ALLOWED", reason };
      }
      const id = "APPR-" + hex(6);
      S.approvals[id] = { approval_id: id, agent, tool, args, status: "PENDING", created_at: clock() };
      if (onApprove) S.executors[id] = onApprove;
      const reason = `Action '${tool}' requires explicit Guardian approval before execution.`;
      log(agent, tool, tier, args, "APPROVAL_PENDING", reason);
      return { allowed: false, tier, decision: "APPROVAL_PENDING", approval_id: id, reason };
    }
    const reason = `Action '${tool}' executed automatically within safe boundaries.`;
    log(agent, tool, tier, args, "ALLOWED", reason);
    return { allowed: true, tier, decision: "ALLOWED", reason };
  }

  function notify(title, bullet_points, actions) {
    gate("GuardianAgent", "family.notify_guardian", { guardian_id: "Rahul (Son)", alert_level: "CRITICAL", title });
    const time = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    S.messages.unshift({ id: `TG-MSG-${String(S.messages.length + 1).padStart(3, "0")}`, time, alert_level: "CRITICAL", title, bullet_points, actions });
  }

  function matchPattern(text) {
    gate("ScamDetectorAgent", "knowledge.match_scam_pattern", { text_preview: text.slice(0, 60) });
    const lower = text.toLowerCase();
    let best = null;
    for (const [category, [name, weight, kws]] of Object.entries(PLAYBOOKS)) {
      const hits = kws.filter((k) => lower.includes(k));
      const score = hits.length ? Math.min(0.97, hits.length * 0.25 + weight * 0.5) : 0;
      if (score > (best ? best.risk_score : 0)) best = { category, name, risk_score: Math.round(score * 100) / 100, matched_keywords: hits };
    }
    return best && best.risk_score >= 0.65 ? { detected: true, ...best } : { detected: false, category: "BENIGN_OR_INCONCLUSIVE", risk_score: 0.2, matched_keywords: [] };
  }

  // ---- gated tools; each re-runs itself with the approval token once Rahul approves ----
  function fileChakshu(phone_number, category, evidence, tok) {
    const r = gate("ReporterAgent", "report.file_chakshu", { phone_number, category }, tok, (t) => fileChakshu(phone_number, category, evidence, t));
    if (!r.allowed) return r;
    return { status: "SUCCESS", chakshu_report: { chakshu_report_id: "CHK-DOT-" + hex(6), target_number: phone_number, complaint_category: category, evidence_summary: evidence, status: "QUEUED_FOR_CARRIER_DISCONNECTION", dot_portal: "sancharsaathi.gov.in/sfc" } };
  }
  function requestHold(account_id, transaction_id, amount, tok) {
    const r = gate("RecoverSwarm-BankAgent", "bank.request_hold", { account_id, transaction_id, amount }, tok, (t) => requestHold(account_id, transaction_id, amount, t));
    if (!r.allowed) return r;
    return { status: "SUCCESS", decision: "ALLOWED", hold_details: { hold_id: "HOLD-" + hex(4), mule_account: account_id, transaction_id, amount_frozen: amount, status: "MULE_ACCOUNT_LIEN_PLACED" } };
  }
  function draftNcrp(inc, tok) {
    const r = gate("RecoverSwarm-NCRPAgent", "report.draft_ncrp_complaint", { incident_id: inc.incident_id }, tok, (t) => draftNcrp(inc, t));
    if (!r.allowed) return r;
    return { status: "SUCCESS", complaint: { complaint_id: "NCRP-2026-BLR-" + hex(6), portal: "cybercrime.gov.in", complainant: "Smt. Amma (via Guardian Rahul)", jurisdiction: "Cyber Crime Police Station, Bengaluru City", incident_type: "Online Impersonation & Digital Arrest Extortion", accused_details: { phone: inc.scammer_number, upi_id: "refund.cbi@okaxis", mule_account: inc.destination_mule, transaction_id: inc.transaction_id }, loss_amount: inc.amount, status: "DRAFT_READY_FOR_SUBMISSION" } };
  }

  async function sha256(text) {
    if (!crypto.subtle) return hex(32) + hex(32); // file:// has no subtle crypto
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
  }

  function addEntity(id, type, details) {
    gate("IntelExtractorAgent", "intel.add_entity", { entity_id: id, entity_type: type, label: id });
    if (!S.graph.nodes.some((n) => n.id === id)) S.graph.nodes.push({ id, label: id, type, details: details || {} });
  }
  function link(source, target, relation) {
    gate("IntelExtractorAgent", "intel.link_entities", { source_id: source, target_id: target, relation });
    S.graph.links.push({ source, target, relation });
  }

  const routes = {
    "GET /api/status": () => ({ status: "ONLINE", mode: "browser" }),
    "GET /api/state": () => {
      return {
        audit_log: S.logs.slice(0, 200), approvals: Object.values(S.approvals), telegram_messages: S.messages,
        voice_notes: S.notes, recovery: S.recovery, extracted_entities: S.entities,
        fraud_graph: { ...S.graph, stats: { total_nodes: S.graph.nodes.length, total_links: S.graph.links.length, syndicates_tracked: 2, mule_accounts_mapped: 1 } },
      };
    },
    "POST /api/reset": () => (reset(), { status: "SUCCESS" }),
    "POST /api/shield/screen-call": ({ caller_number = SCAMMER }) => {
      gate("IntelAgent", "intel.check_number", { phone_number: caller_number });
      const rep = NUMBERS[caller_number] || { reported_count: 1, risk_score: 0.5, category: "Unknown Caller", syndicate_id: null };
      if (rep.risk_score >= 0.7) {
        gate("CallScreenerAgent", "telephony.answer_call", { call_id: "CALL-X210", caller_number });
        return { action: "KAVACH_SCREENING", caller_number, ...rep, verdict: "HIGH_RISK_SCAM_CALLER", screening_status: "INTERCEPTED_BEFORE_RINGING" };
      }
      return { action: "RING_NORMALLY", caller_number, ...rep, verdict: "BENIGN_OR_TRUSTED" };
    },
    "POST /api/shield/kavach-tap": ({ call_id = "CALL-X210", transcript = "", language = "kn" }) => {
      gate("ShieldAgent", "telephony.join_conference", { call_id, participant: "KAVACH_SHIELD" });
      const detection = matchPattern(transcript);
      const category = detection.detected ? detection.category : "digital_arrest";
      gate("ScamDetectorAgent", "knowledge.get_safe_advice", { category, language });
      const warning = category === "digital_arrest" ? ADVICE[language] : ADVICE.en;
      gate("ShieldAgent", "telephony.speak_warning", { call_id, language, message_preview: warning.slice(0, 40) });
      const ch = fileChakshu(SCAMMER, detection.name || "Suspected scam call", `Matched keywords: ${detection.matched_keywords.join(", ") || "none"}`);
      notify(`Amma received a '${detection.name || "Digital Arrest"}' scam call`, [
        `Matched playbook: ${detection.name || "unknown"} (risk ${Math.round(detection.risk_score * 100)}%).`,
        `KAVACH joined the call and spoke a calm warning to Amma in ${LANG[language]}.`,
        "No money was moved.",
        `Sanchar Saathi report on ${SCAMMER} is waiting for your approval.`,
      ], [...(ch.approval_id ? [{ id: ch.approval_id, label: "Approve report", type: "primary" }] : []), { id: "call_amma", label: "Call Amma", type: "link" }]);
      return { status: "INTERVENED", detection, spoken_warning: warning, language, risk_score: detection.risk_score, suggested_action: "HANG_UP" };
    },
    "POST /api/shield/end-call": ({ call_id = "CALL-X210" }) => {
      gate("ShieldAgent", "telephony.end_call", { call_id, reason: "CONFIRMED_FRAUD_DETECTED" });
      return { status: "SUCCESS", call_id, call_terminated: true };
    },
    "POST /api/shield/check-sms": ({ sms_text = "", sender = "VK-DISCOM-ALERT", language = "kn" }) => {
      const m = sms_text.match(/(https?:\/\/\S+|bit\.ly\/\S+|tinyurl\.com\/\S+)/);
      let url_analysis = null;
      if (m) {
        gate("IntelAgent", "intel.check_url", { url: m[1] });
        const risky = ["bit.ly", "tinyurl", "eb-bill", "apk", "pay-now", "update-kyc"].some((p) => m[1].toLowerCase().includes(p));
        url_analysis = { url: m[1], risk_score: risky ? 0.94 : 0.1, phishing_detected: risky, category: m[1].includes("eb-bill") ? "Electricity Bill Phishing" : "Unknown URL" };
      }
      const pattern = matchPattern(sms_text);
      const is_scam = Boolean((url_analysis && url_analysis.phishing_detected) || pattern.detected);
      let voice_note = null;
      if (is_scam) {
        gate("ShieldAgent", "family.send_voice_note", { recipient: "Amma", language });
        voice_note = { status: "SUCCESS", voice_note: { recipient: "Amma", language, transcript: SMS_WARN[language] } };
        S.notes.unshift(voice_note.voice_note);
      }
      return { is_scam, sender, url_analysis, pattern_analysis: pattern, voice_note, verdict: is_scam ? "PHISHING_MALICIOUS" : "SAFE" };
    },
    "POST /api/strike/turn": ({ message = "" }) => {
      S.step += 1;
      if (S.step === 1) gate("StrikeAgent", "telephony.transfer_to_decoy", { call_id: "CALL-X210", decoy_persona: "retired_teacher_67" });
      const upi = (message.match(/([a-zA-Z0-9_\-.]+@[a-zA-Z]+)(?![a-zA-Z]|\.\w)/) || [])[1] || null;
      const acc = (message.match(/(?:account\s*(?:number)?|a\/c)[\s:]*([0-9]{9,16})/i) || [])[1] || null;
      if (upi && !S.entities.upi_ids.includes(upi)) {
        S.entities.upi_ids.push(upi);
        addEntity(upi, "upi", { captured_by: "StrikeDecoy" });
        link(SCAMMER, upi, "REVEALED_UPI");
      }
      if (acc) {
        const masked = `HDFC ····${acc.slice(-4)}`;
        if (!S.entities.mule_accounts.includes(masked)) {
          S.entities.mule_accounts.push(masked);
          addEntity(masked, "mule_account", { account_number: acc });
          if (upi) link(upi, masked, "SETTLES_INTO");
        }
      }
      const lower = message.toLowerCase();
      let reply = "Haan beta... security deposit? But my pension comes in Canara Bank. Where should I send it? Let me find my reading glasses...";
      if (lower.includes("google pay") || lower.includes("upi") || upi) reply = "Re-fund dot see-bee-eye at ok axis... beta, can you spell it slowly? My grandson set up this phone. What was the bank account number?";
      else if (acc || lower.includes("hdfc")) reply = "HDFC Bank Salt Lake... wait beta, my phone screen went black! Ah, it is asking for a 6-digit UPI PIN. Should I put my birth year or retirement year 2018?";
      let chakshu_draft = null;
      if (!S.chakshu && (upi || acc)) {
        S.chakshu = true;
        chakshu_draft = fileChakshu(SCAMMER, "Digital Arrest Impersonation", `Strike Decoy extracted UPI ID '${upi || "n/a"}' and mule account '${acc || "n/a"}'.`);
      }
      return { step: S.step, scammer_input: message, decoy_response: reply, captured_upi: upi, captured_account: acc, total_minutes_wasted: 26, all_extracted_entities: S.entities, chakshu_draft, status: "ENGAGING_SCAMMER" };
    },
    "POST /api/recover/trigger": async ({ amount = 48000, scammer_number = SCAMMER, destination_mule = "HDFC ····4471", transaction_id = "UPI-619284019284" }) => {
      const d = new Date();
      const inc = { incident_id: `INC-${d.toISOString().slice(0, 19).replace(/[-:]/g, "").replace("T", "-")}`, amount, source_account: "Canara Bank ····9102", destination_mule, transaction_id, scammer_number, started_at: clock(), started_at_epoch: d.getTime() / 1000 };
      const bank = requestHold(destination_mule, transaction_id, amount);
      gate("RecoverSwarm-1930Agent", "report.prepare_1930_brief", { incident_id: inc.incident_id });
      const brief = { status: "SUCCESS", brief_id: "1930-BRIEF-" + hex(6), hotline_number: "1930", verbal_script: [
        "[1930 HELPLINE CALL BRIEFING SCRIPT]",
        "1. Incident Category: Financial Cyber Fraud / Digital Arrest Extortion.",
        `2. Loss Amount: ₹${inr(amount)} INR.`,
        `3. Debited From: ${inc.source_account} at ${inc.started_at}.`,
        `4. Transaction Reference (RRN): ${transaction_id}.`,
        "5. Suspect Destination UPI: refund.cbi@okaxis.",
        `6. Destination Mule Account: ${destination_mule}.`,
        `7. Caller Phone Number: ${scammer_number}.`,
        "8. Requested Action: Immediate inter-bank freeze request via Indian Cybercrime Coordination Centre (I4C) API to the receiving bank's nodal officer.",
      ].join("\n") };
      const ncrp = draftNcrp(inc);
      const sha = await sha256(JSON.stringify(inc));
      const evidence = { dossier_id: `EVID-${sha.slice(0, 10).toUpperCase()}`, sha256_hash: sha, timestamp: d.toISOString(), artifacts_compiled: ["telephony_call_recording_metadata.json", "strike_decoy_extracted_upi.json", "bank_sms_debit_notification.txt", "caller_reputation_audit_trail.json"], legal_admissibility: "Indian Evidence Act Section 65B Compliant", status: "SEALED" };
      notify(`EMERGENCY: ₹${inr(amount)} Golden Hour Recovery Swarm Activated`, [
        `Amma reported an unauthorized transaction of ₹${inr(amount)}.`, "Recover Swarm deployed 4 agents in parallel.",
        `Bank lien hold drafted for mule account ${destination_mule}.`, "1930 Helpline verbal briefing ready for one-tap calling.",
        "Formal NCRP complaint drafted with cryptographic evidence dossier.",
      ], [{ id: bank.approval_id, label: "Approve bank lien", type: "primary" }, { id: ncrp.approval_id, label: "Approve NCRP filing", type: "primary" }, { id: "call_1930", label: "Dial 1930", type: "link" }]);
      const st = (r) => (r.decision === "APPROVAL_PENDING" ? "APPROVAL_PENDING" : "EXECUTED");
      S.recovery = { status: "RECOVER_SWARM_ACTIVE", incident: inc, agents: {
        bank_agent: { role: "Emergency Mule Account Lien Request", status: st(bank), result: bank },
        helpline_1930_agent: { role: "Verbal 1930 Briefing Generator", status: "EXECUTED", result: brief },
        ncrp_complaint_agent: { role: "cybercrime.gov.in Formal Drafter", status: st(ncrp), result: ncrp },
        evidence_agent: { role: "Cryptographic Time-stamped Dossier Packager", status: "COMPLETED", result: evidence },
      } };
      return S.recovery;
    },
    "POST /api/policy/test-violation": () => gate("MaliciousOrFaultyAgent", "bank.move_money", { amount: 50000, destination: "MULE_ACCOUNT_XYZ" }),
  };

  function decide(id, { action = "APPROVE", guardian_id = "Rahul (Son)" }) {
    const p = S.approvals[id];
    if (!p) throw new Error(`Unknown approval ${id}`);
    if (p.status !== "PENDING") throw new Error(`Approval ${id} was already ${p.status.toLowerCase()}`);
    const ok = action === "APPROVE";
    p.status = ok ? "APPROVED" : "REJECTED";
    p[ok ? "approved_by" : "rejected_by"] = guardian_id;
    log("GuardianAgent", ok ? "family.guardian_approval" : "family.guardian_rejection", APPR, { approval_id: id, guardian: guardian_id },
      ok ? "APPROVED" : "REJECTED", `Guardian ${guardian_id} ${ok ? "confirmed execution of" : "rejected execution of"} ${p.tool}`);
    const run = S.executors[id];
    delete S.executors[id];
    if (ok && run) p.result = run(id);
    return { status: "SUCCESS", approval: p };
  }

  reset();
  window.KavachMock = {
    ADVICE, SMS_WARN,
    async handle(method, path, body) {
      const m = path.match(/^\/api\/approvals\/([^/]+)\/action$/);
      if (method === "POST" && m) return decide(decodeURIComponent(m[1]), body || {});
      const fn = routes[`${method} ${path}`];
      if (!fn) throw new Error(`No route ${method} ${path}`);
      return JSON.parse(JSON.stringify(await fn(body || {}))); // copy, like a network round trip
    },
  };
})();
