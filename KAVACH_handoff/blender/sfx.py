"""Sound design for the KAVACH shot: CC0 samples (blender/audio, see SOURCES.md) placed on the same frame
clock as build_scene.py, plus synthesized whooshes and disconnect beeps.
Usage: python -I blender/sfx.py [video.mp4]  -> render/kavach_sfx.wav (+ <video>_sound.mp4 if a video is given)
"""
import ast
import os
import subprocess
import sys
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
AUDIO = os.path.join(HERE, "audio")
SR = 48000

# ---- one clock: read FPS / END / F_* straight from build_scene.py -----------
CLOCK = {}
for node in ast.parse(open(os.path.join(HERE, "build_scene.py"), encoding="utf-8").read()).body:
    if not isinstance(node, ast.Assign):
        continue
    names = [t.id for t in node.targets if isinstance(t, ast.Name)]
    for t in node.targets:
        if isinstance(t, ast.Tuple):
            names = [e.id if isinstance(e, ast.Name) else "" for e in t.elts]
    if names and all(n in ("FPS", "END") or n.startswith("F_") for n in names):
        try:
            val = ast.literal_eval(node.value)
        except ValueError:
            continue
        CLOCK.update(zip(names, val) if len(names) > 1 else [(names[0], val)])
FPS, END = CLOCK["FPS"], CLOCK["END"]
mix = np.zeros((int(SR * END / FPS) + SR, 2))
rng = np.random.default_rng(7)


def load(name, start=0.0, dur=None):
    """Decode a sample to 48 kHz stereo float with ffmpeg."""
    path = os.path.join(AUDIO, name if "." in name else name + ".ogg")
    cmd = ["ffmpeg", "-v", "error", "-ss", str(start)] + (["-t", str(dur)] if dur else []) + \
          ["-i", path, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype="<f4").reshape(-1, 2).astype(np.float64)


def place(sig, frame, gain=1.0, pan=0.0):
    """SND-01: the sound starts on its frame. sig is mono (n,) or stereo (n, 2)."""
    i = int(SR * frame / FPS)
    if sig.ndim == 1:
        sig = np.stack([sig, sig], axis=1)
    sig = sig[: len(mix) - i] * gain
    mix[i:i + len(sig), 0] += sig[:, 0] * (1 - max(pan, 0))
    mix[i:i + len(sig), 1] += sig[:, 1] * (1 + min(pan, 0))


def s(name, frame, gain=1.0, pan=0.0):
    place(load(name), frame, gain, pan)


def whoosh(sec, rise=True):
    """Filtered-noise air move; the cutoff sweeps up (rise) or down."""
    n = int(SR * sec)
    x = rng.standard_normal(n)
    cut = np.interp(np.arange(n), [0, n - 1], (300, 4000) if rise else (4000, 300))
    a = np.exp(-2 * np.pi * cut / SR)
    y, out = 0.0, np.empty(n)
    for i in range(n):
        y = (1 - a[i]) * x[i] + a[i] * y
        out[i] = y
    out /= np.abs(out).max() + 1e-9
    return out * np.sin(np.linspace(0, np.pi, n)) ** 2


def beep(freq, sec):
    t = np.arange(int(SR * sec)) / SR
    return np.sin(2 * np.pi * freq * t) * np.clip(t / 0.005, 0, 1) * np.clip((sec - t) / 0.005, 0, 1)


C = CLOCK
F_TAP, F_ACTIVE, F_V, F_VE = C["F_TAP"], C["F_ACTIVE"], C["F_VERDICT"], C["F_VERDICT_END"]
F_ALERT, F_HANG, F_END_CALL, F_L = C["F_ALERT"], C["F_HANG_TAP"], C["F_CALL_END"], C["F_LOCKUP"]

# ---- events (one sound per event, on its frame) -------------------------------
s("minimize_006", 0, 0.5)                                   # phone arrives
place(whoosh(1.3), 0, 0.22, pan=-0.3)
line = "Is this call"                                        # typing, one key per visible character
t0, t1 = C["F_TYPE"]
keys = ("click_002", "click_003", "click_005")
for i in range(1, len(line) + 1):
    if line[i - 1] != " ":
        s(keys[i % 3], t0 + -(-i * (t1 - t0) // len(line)), 0.55, pan=0.35)
s("pluck_002", t1, 0.6, pan=0.35)                           # "real?" lands
s("minimize_007", C["F_CAPTION_OUT"], 0.3, pan=0.35)        # caption leaves
s("select_001", F_TAP, 0.6, pan=0.2)                        # finger tap on the shield
s("impactMetal_004", F_TAP, 0.22, pan=0.2)                  # ...on steel
s("maximize_009", F_TAP + 6, 0.35)                          # shield glides onto the screen
s("forceField_002", F_TAP + 10, 0.32)                       # KAVACH switches on
s("confirmation_002", F_TAP + 12, 0.5)
s("minimize_002", C["F_SCREEN"][0], 0.22)                   # cut to the screen
lis = load("computerNoise_001", dur=(F_V - F_ACTIVE) / FPS)  # listening texture
tt = np.arange(len(lis)) / SR
lis *= (np.clip(tt / 0.4, 0, 1) * np.clip((tt[-1] - tt) / 0.3, 0, 1))[:, None]
place(lis, F_ACTIVE, 0.13)
for f, name in zip(C["F_CHIPS"], ("question_003", "question_001", "question_003")):
    s(name, f, 0.45)                                        # each flagged phrase
s("minimize_002", C["F_SCREEN"][1], 0.2)                    # cut back
s("error_005", F_V, 0.6)                                    # scam verdict
s("lowFrequency_explosion_001", F_V, 0.55)
s("error_003", F_V + 3, 0.28)
s("maximize_005", F_V + 2, 0.4, pan=0.3)                    # card leaves the glass
place(whoosh(0.9), F_V + 2, 0.2, pan=0.3)
n_ticks = (F_VE - F_V) // 2
for k, f in enumerate(range(F_V + 2, F_VE, 2)):             # the % counts up
    s("tick_001", f, 0.16 * (1 - k / n_ticks), pan=0.3)
s("impactMetal_001", C["F_MACRO"][0], 0.6)                  # cut to the macro
s("minimize_004", C["F_MACRO"][1], 0.35)                    # cut back
s("confirmation_004", F_ALERT, 0.55)                        # Rahul alerted
for f in range(F_ALERT + 16, F_HANG - 8, 16):               # hang-up nudges
    s("drop_002", f, 0.2)
s("click_001", F_HANG, 0.6)                                 # hang up
s("switch_002", F_HANG + 1, 0.45)
s("minimize_005", F_HANG + 2, 0.35, pan=0.4)                # card exits
for k in range(3):                                          # call disconnected
    place(beep(425, 0.11), F_END_CALL + k * 4, 0.16)
s("select_003", F_END_CALL + 8, 0.35)                       # "Number blocked"
s("select_004", F_END_CALL + 14, 0.35)                      # "Report waiting..."
s("minimize_006", F_L - 6, 0.4)                             # to the end card
place(whoosh(0.6), F_L - 8, 0.2)
s("confirmation_002", F_L, 0.55)                            # sonic logo: same tone as activation
s("glass_004", F_L + 2, 0.35)
s("pluck_001", F_L + 8, 0.3)                                # "KAVACH"

# ---- music bed: CC0 downtempo loop, ducked under the verdict -------------------
film = END / FPS
music = load("space_ranger_single_run.wav", start=2.6, dur=film)
t = np.arange(len(music)) / SR
gain = 0.22 * np.clip(t / 0.6, 0, 1) * np.clip((film - t) / 1.2, 0, 1)
duck = np.ones_like(t)
duck[(t >= F_V / FPS - 0.1) & (t < (F_V + 30) / FPS)] = 0.45   # make room for the verdict
duck = np.convolve(duck, np.ones(2400) / 2400, mode="same")     # 50 ms smoothing
place(music * (gain * duck)[:, None], 0, 1.0)

# ---- master -------------------------------------------------------------------
out = mix[: int(SR * film)]
out *= 10 ** (-1 / 20) / np.abs(out).max()  # peak -1 dBFS before loudness normalisation
assert np.isfinite(out).all() and np.abs(out).max() <= 1.0

wav = os.path.join(HERE, "render", "kavach_sfx.wav")
with wave.open(wav, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((out * 32767).astype("<i2").tobytes())
print(wav, f"{len(out) / SR:.2f}s")

if len(sys.argv) > 1:
    video = sys.argv[1]
    dst = os.path.splitext(video)[0] + "_sound.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, "-i", wav, "-map", "0:v", "-map", "1:a",
                    "-c:v", "copy", "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000",  # YouTube level
                    "-c:a", "aac", "-b:a", "320k", "-shortest", dst], check=True)
    print(dst)
