import { createStory, TRANSCRIPT, WARNING, SMS_NOTE, RECOVER_NOTE, SMS_TEXT, SCENES } from "../shared/story.js";
import "../shared/theme.js";
import * as voice from "../shared/voice.js";
import { tryMountShield } from "../shared/three/lazy.js";

const $ = (s) => document.querySelector(s);
const story = createStory();
const GREET = { kn: "ನಮಸ್ಕಾರ ಅಮ್ಮಾ", hi: "नमस्ते अम्मा", en: "Hello, Amma" };
let shield = { setState() {}, backend: "none" };
let recDismissed = null;   // recovery id the user closed on this tab
let saidFor = null;        // call start we already showed the caller's lines for

function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  $("#toasts").append(t);
  setTimeout(() => t.remove(), 3800);
}
const mmss = (sec) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

// ---------- render from state ----------
function render(s) {
  const lang = s.lang;
  document.querySelectorAll(".seg button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.lang === lang)));
  $("#greet").textContent = GREET[lang];
  $("#greet").lang = lang;

  // message
  $("#smsVerdict").hidden = !s.sms;
  $("#btnSms").hidden = !!s.sms;
  if (s.sms) { $("#smsNote").textContent = SMS_NOTE[lang]; $("#smsNote").lang = lang; }

  // call
  const c = s.call, call = $("#call");
  call.hidden = c.status === "idle";
  call.classList.toggle("joined", c.status === "joined");
  $("#warn").hidden = c.status !== "joined";
  $("#ended").hidden = c.status !== "ended";
  $("#btnHang").hidden = c.status === "ended";
  $("#kvHint").textContent = c.status === "ended" ? "" : "Tap if this call feels wrong";
  if (c.status !== "idle") {
    $("#callTag").textContent = `High risk · reported ${c.reports} times`;
    $("#callMeta").textContent = c.category;
    $("#risk").textContent = `Scam risk ${Math.round(c.risk * 100)}%`;
    $("#warnText").textContent = WARNING[lang];
    $("#warnText").lang = lang;
    if (saidFor !== c.startedAt) { saidFor = c.startedAt; $("#said").replaceChildren(); }
    if (c.status !== "live" && !$("#said").children.length) TRANSCRIPT.forEach(addSaid);
  }
  shield.setState(c.status === "joined" ? "joined" : c.status === "ended" ? "ended" : "idle");

  // recovery
  const r = s.recovery;
  $("#rec").hidden = !r || recDismissed === r.inc.id;
  if (r) {
    $("#recText").textContent = RECOVER_NOTE[lang];
    $("#recText").lang = lang;
    const stateOf = { hold: s.approvals[r.hold]?.status, ncrp: s.approvals[r.ncrp]?.status };
    document.querySelectorAll(".agents li").forEach((li) => {
      const a = li.dataset.a, st = stateOf[a];
      li.classList.add("on");
      const done = !st || st === "EXECUTED";
      li.dataset.state = done ? "done" : "wait";
      li.querySelector("em").textContent = !st ? "done" : st === "EXECUTED" ? "approved · done" : st === "REJECTED" ? "rejected by Rahul" : "waits for Rahul";
    });
  }
  tick();
}

function addSaid(line) {
  const p = document.createElement("p");
  p.innerHTML = "<b>Caller</b>";
  p.append(document.createTextNode(`“${line.text}”`));
  if (line.lang) p.lang = line.lang;
  $("#said").append(p);
}

function tick() {
  const s = story.state, now = Date.now();
  $("#clock").textContent = story.clock().slice(0, 5);
  if (s.call.status !== "idle" && s.call.startedAt) $("#callTimer").textContent = mmss((now - s.call.startedAt) / 1000);
  if (s.recovery) $("#ghTime").textContent = mmss(Math.max(0, 3600 - (now - s.recovery.inc.startedAt) / 1000));
}
setInterval(tick, 1000);

// ---------- actions on this phone ----------
async function startCall() {
  voice.stop();
  story.dispatch("close-call");
  story.dispatch("screen-call");
  const started = story.state.call.startedAt;
  for (const line of TRANSCRIPT) {
    if (story.state.call.status !== "live" || story.state.call.startedAt !== started) return;
    addSaid(line);
    await voice.play(line.clip);
    if (voice.isMuted()) await new Promise((r) => setTimeout(r, 1600));
  }
}

async function tapKavach() {
  if (story.state.call.status === "idle") story.dispatch("screen-call");
  story.dispatch("tap-kavach");
  toast("KAVACH joined the call and told Rahul");
  await voice.playAll(["announce_en", `warn_${story.state.lang}`]);
}

function hangUp() {
  voice.stop();
  story.dispatch("end-call");
}

async function checkSms() {
  story.dispatch("check-sms");
  await voice.play(`sms_${story.state.lang}`);
}

async function cheated() {
  recDismissed = null;
  story.dispatch("recover");
  toast("Recovery started. Rahul has approvals waiting.");
  await voice.play(`recover_${story.state.lang}`);
}

// ---------- wiring ----------
$("#smsText").textContent = SMS_TEXT;
document.querySelectorAll(".seg button").forEach((b) => (b.onclick = () => story.dispatch("set-lang", { lang: b.dataset.lang })));
$("#btnSms").onclick = checkSms;
$("#btnSmsPlay").onclick = () => voice.play(`sms_${story.state.lang}`);
$("#btnCheated").onclick = cheated;
$("#btnKavach").onclick = tapKavach;
$("#btnHang").onclick = hangUp;
$("#btnDone").onclick = () => story.dispatch("close-call");
$("#btnRecBack").onclick = () => { recDismissed = story.state.recovery?.inc.id; render(story.state); };
$("#btnReset").onclick = () => { voice.stop(); recDismissed = null; story.reset(); toast("Story reset on every open tab"); };
document.querySelectorAll("[data-do]").forEach((b) => (b.onclick = () => {
  b.classList.add("done");
  ({ call: startCall, sms: checkSms, cheated })[b.dataset.do]();
}));
const syncSound = () => {
  const m = voice.isMuted();
  $("#btnSound span").textContent = m ? "Sound off" : "Sound on";
  $("#btnSound use").setAttribute("href", m ? "#i-mute" : "#i-speaker");
};
$("#btnSound").onclick = () => { voice.setMuted(!voice.isMuted()); syncSound(); };
syncSound();

story.subscribe((s, meta) => {
  if (meta.remote && meta.type === "reset") { voice.stop(); recDismissed = null; }
  render(s);
});

const scene = new URLSearchParams(location.search).get("scene");
if (scene && SCENES[scene]) story.goto(scene);
render(story.state);

tryMountShield($("#shield3d"), { level: voice.level }).then((m) => {
  shield = m;
  $("#backend").textContent = m.backend === "webgpu" ? "WebGPU" : m.backend === "webgl2" ? "WebGL 2 (no WebGPU here)" : "off";
  render(story.state);
});
