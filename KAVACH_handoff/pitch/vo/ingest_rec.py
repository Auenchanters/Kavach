"""Turn a teammate's voice-over recording into the film's narration take and word clock.

  tools/chatterbox-venv/Scripts/python.exe pitch/vo/ingest_rec.py
Input: pitch/vo/recording/ holding either ONE file (whole script) or one file per scene, named so they sort in
script order (01_hook ... 12_close). Any format ffmpeg reads.
Output: assets/audio/vo_take.wav (cleaned, -16 LUFS) + vo/timing.json + vo/recording_transcript.txt.
"""
import glob
import json
import os
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SR = 48000
PAUSE_SCENE = 0.6
# rumble cut, light broadband denoise, then trim silence at both ends
CLEAN = ("highpass=f=80,afftdn=nf=-25,"
         "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse,"
         "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.15,areverse")


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-af", CLEAN, "-ac", "1", "-ar", str(SR),
                          "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def main():
    files = sorted(f for f in glob.glob(os.path.join(HERE, "recording", "*"))
                   if f.lower().rsplit(".", 1)[-1] in {"wav", "mp3", "m4a", "ogg", "opus", "mpeg", "aac", "flac", "webm", "mp4"})
    scenes = list(dict.fromkeys(s["scene"] for s in json.load(open(os.path.join(HERE, "segments.json"), encoding="utf-8"))))
    if len(files) not in (1, len(scenes)):
        sys.exit(f"found {len(files)} recordings in vo/recording/; need 1 (whole script) or {len(scenes)} (one per scene)")
    parts = []
    for i, f in enumerate(files):
        if parts:
            parts.append(np.zeros(int(SR * PAUSE_SCENE), dtype=np.float32))
        parts.append(load(f))
        print(f"  {scenes[i] if len(files) > 1 else 'all':8s} {len(parts[-1]) / SR:6.1f}s  {os.path.basename(f)}")
    take = np.concatenate(parts)
    raw = os.path.join(HERE, "recording_joined.f32")
    take.tofile(raw)
    wav = os.path.join(ROOT, "assets", "audio", "vo_take.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", raw,
                    "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", str(SR), "-c:a", "pcm_s16le", wav], check=True)
    os.remove(raw)
    print(f"take {len(take) / SR:.1f}s -> {wav}")
    from align import align
    text = align(wav, len(take) / SR)
    open(os.path.join(HERE, "recording_transcript.txt"), "w", encoding="utf-8").write(text.strip() + "\n")


if __name__ == "__main__":
    main()
