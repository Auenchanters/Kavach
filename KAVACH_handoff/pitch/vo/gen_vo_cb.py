"""Narration with Chatterbox (Resemble AI, MIT), cloned from a consenting teammate's reference recording.

Run with the project venv:
  tools/chatterbox-venv/Scripts/python.exe pitch/vo/gen_vo_cb.py --test   -> vo/tests/test_chatterbox.wav
  tools/chatterbox-venv/Scripts/python.exe pitch/vo/gen_vo_cb.py          -> assets/audio/vo_take.wav + vo/timing.json
Reference voice: pitch/vo/ref_voice.wav (or .mp3/.m4a), 10-30 s of one person reading in a quiet room.
The take is built scene by scene: chunks are trimmed of silence and joined with short, even pauses, so the
voice flows; Whisper then gives word timestamps, aligned to the script so build.py can time every scene.
"""
import glob
import json
import os
import re
import subprocess
import sys

import numpy as np
import torch
import torchaudio

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OPEN, TAIL = 4.0, 3.0           # must match build.py's clock
PAUSE_LINE, PAUSE_SCENE = 0.22, 0.55
MAX_CHARS = 320                  # Chatterbox stays stable on chunks of a few sentences
# spoken forms for the English model; each maps ONE token to ONE token
SAY = {"KAVACH": "Kuh-vutch", "KAVACH,": "Kuh-vutch,", "KAVACH.": "Kuh-vutch.", "Sanchar": "Sunchaar",
       "Saathi": "Saathee", "Chakshu": "Chukshoo", "WHACKiest": "Whackiest", "1930": "one-nine-three-zero",
       "FastMCP": "Fast-MCP", "DPDP": "D-P-D-P", "UPI": "U-P-I"}
TEST_TEXT = ("Every second in India, someone falls victim to cyber fraud. That is why we built Kuh-vutch. "
             "It reports scammers to Sunchaar Saathee Chukshoo and the one-nine-three-zero helpline, because over "
             "one lakh senior citizens lost four thousand crore rupees, and no Amma should be left alone with a scammer.")


def spoken(text):
    return " ".join(SAY.get(w, w) for w in text.split())


def ref_wav():
    found = sorted(glob.glob(os.path.join(HERE, "ref_voice.*")))
    if not found:
        sys.exit("Put the reference recording at pitch/vo/ref_voice.wav (or .mp3 / .m4a)")
    src = found[0]
    if src.endswith(".wav"):
        return src
    dst = os.path.join(HERE, "ref_voice_conv.wav")  # Chatterbox reads wav; convert anything else once
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-ac", "1", "-ar", "24000", dst], check=True)
    return dst


def trim(wav, sr, thresh=0.01, pad=0.04):
    """Drop leading/trailing silence so pauses between chunks are ours, not the model's."""
    a = np.abs(wav)
    idx = np.where(a > thresh * a.max())[0]
    if len(idx) == 0:
        return wav
    s, e = max(idx[0] - int(pad * sr), 0), min(idx[-1] + int(pad * sr), len(wav))
    return wav[s:e]


def chunks(sentences):
    out, cur = [], ""
    for s in sentences:
        if cur and len(cur) + len(s) + 1 > MAX_CHARS:
            out.append(cur)
            cur = s
        else:
            cur = (cur + " " + s).strip()
    if cur:
        out.append(cur)
    return out


def main():
    from chatterbox.tts import ChatterboxTTS
    torch.manual_seed(7)
    model = ChatterboxTTS.from_pretrained(device="cuda" if torch.cuda.is_available() else "cpu")
    ref = ref_wav()
    gen = lambda text: model.generate(text, audio_prompt_path=ref, exaggeration=0.5, cfg_weight=0.45).squeeze(0).cpu().numpy()
    sr = model.sr
    if "--test" in sys.argv:
        os.makedirs(os.path.join(HERE, "tests"), exist_ok=True)
        out = os.path.join(HERE, "tests", "test_chatterbox.wav")
        torchaudio.save(out, torch.from_numpy(trim(gen(TEST_TEXT), sr)).unsqueeze(0), sr)
        print("wrote", out)
        return
    segs = json.load(open(os.path.join(HERE, "segments.json"), encoding="utf-8"))
    scenes = []
    for seg in segs:
        if not scenes or scenes[-1][0] != seg["scene"]:
            scenes.append((seg["scene"], []))
        scenes[-1][1].append(spoken(seg["text"]))
    parts = []
    for i, (name, lines) in enumerate(scenes):
        sentences = [s for line in lines for s in re.split(r"(?<=[.!?:])\s+", line) if s]
        for j, text in enumerate(chunks(sentences)):
            if parts:
                parts.append(np.zeros(int(sr * (PAUSE_SCENE if j == 0 else PAUSE_LINE))))
            parts.append(trim(gen(text), sr))
            print(f"  {name}: {text[:60]}")
    take = np.concatenate(parts).astype(np.float32)
    take *= 0.89 / max(np.abs(take).max(), 1e-6)  # peak about -1 dBFS
    wav_path = os.path.join(ROOT, "assets", "audio", "vo_take.wav")
    torchaudio.save(wav_path, torch.from_numpy(take).unsqueeze(0), sr)
    print(f"take {len(take) / sr:.1f}s -> {wav_path}")

    # word timestamps: Whisper on the take, aligned to the script words
    del model
    torch.cuda.empty_cache()
    from align import align
    align(wav_path, len(take) / sr, say=spoken)


if __name__ == "__main__":
    main()
