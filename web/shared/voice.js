// Plays the pre-made voice clips (docs/shared/clips) and exposes a live level for the 3D shield's pulse.
// Text is always on screen too, so a blocked or missing clip never hides a warning.
let ctx = null, analyser = null, current = null;
let muted = (() => { try { return localStorage.getItem("kavach.muted") === "1"; } catch { return false; } })();
const buf = new Uint8Array(256);

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return true;
}

export function isMuted() { return muted; }
export function setMuted(v) {
  muted = !!v;
  try { localStorage.setItem("kavach.muted", muted ? "1" : "0"); } catch { /* ignore */ }
  if (muted) stop();
}

export function stop() {
  if (current) { current.pause(); current = null; }
}

/** Play one clip; resolves when it ends, fails or is stopped. */
export function play(id) {
  if (muted || !ensure()) return Promise.resolve(false);
  stop();
  const a = new Audio();
  a.crossOrigin = "anonymous"; // hosts like Hugging Face redirect clips to a CDN; without CORS the analyser would mute them
  a.src = new URL(`./clips/${id}.mp3`, import.meta.url);
  current = a;
  try { ctx.createMediaElementSource(a).connect(analyser); } catch { /* still plays, just no pulse */ }
  return new Promise((resolve) => {
    const done = (ok) => () => { if (current === a) current = null; resolve(ok); };
    a.onended = done(true);
    a.onerror = done(false);
    a.onpause = done(false);
    a.play().catch(done(false));
  });
}

/** Play clips one after another; stops early if a newer sequence starts. */
let seq = 0;
export async function playAll(ids) {
  const mine = ++seq;
  for (const id of ids) {
    if (mine !== seq) return;
    await play(id);
  }
}

/** 0..1 loudness of whatever is playing now. */
export function level() {
  if (!analyser || !current) return 0;
  analyser.getByteTimeDomainData(buf);
  let sum = 0;
  for (let i = 0; i < buf.length; i++) { const x = (buf[i] - 128) / 128; sum += x * x; }
  return Math.min(1, Math.sqrt(sum / buf.length) * 3.2);
}
