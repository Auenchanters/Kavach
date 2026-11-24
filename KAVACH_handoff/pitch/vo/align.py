"""Word timings for a narration take: Whisper word timestamps aligned to the script words -> vo/timing.json."""
import difflib
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
OPEN, TAIL = 4.0, 3.0  # must match build.py's clock


def align(wav_path, take_len, say=lambda text: text, device="cuda"):
    """say(text) -> the words as spoken/heard, ONE token per script token (so indices line up)."""
    import whisper
    segs = json.load(open(os.path.join(HERE, "segments.json"), encoding="utf-8"))
    asr = whisper.load_model("small.en", device=device)
    res = asr.transcribe(wav_path, word_timestamps=True, language="en")
    heard = [(w["word"], w["start"]) for s in res["segments"] for w in s.get("words", [])]
    norm = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())
    script = [w for seg in segs for w in say(seg["text"]).split()]
    # Whisper splits "voice-first" into two words: match a hyphenated script word on its first part
    sm = difflib.SequenceMatcher(a=[norm(w.split("-")[0]) for w in script], b=[norm(w) for w, _ in heard], autojunk=False)
    at = [None] * len(script)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            at[blk.a + k] = heard[blk.b + k][1]
    known = [k for k, v in enumerate(at) if v is not None]
    assert len(known) > len(at) * 0.6, f"only {len(known)}/{len(at)} words aligned; check the take"
    for k in range(len(at)):  # words Whisper heard differently: interpolate between their aligned neighbours
        if at[k] is None:
            lo = max([j for j in known if j < k], default=known[0])
            hi = min([j for j in known if j > k], default=known[-1])
            at[k] = at[lo] if hi == lo else at[lo] + (at[hi] - at[lo]) * (k - lo) / (hi - lo)
    timing, k = [], 0
    for seg in segs:
        shown = seg["text"].split()
        times = at[k:k + len(shown)]
        k += len(shown)
        end = at[k] - 0.1 if k < len(at) else take_len
        timing.append({"id": seg["id"], "scene": seg["scene"], "start": round(OPEN + times[0], 3),
                       "duration": round(max(end - times[0], 0.5), 3),
                       "words": [{"word": w, "at": round(OPEN + t, 3)} for w, t in zip(shown, times)]})
    json.dump({"take": "vo_take.wav", "take_start": OPEN, "segments": timing, "total": round(OPEN + take_len + TAIL, 3)},
              open(os.path.join(HERE, "timing.json"), "w", encoding="utf-8"), indent=1)
    missed = [script[i] for i in range(len(script)) if i not in set(known)]
    print(f"aligned {len(known)}/{len(at)} words; total {OPEN + take_len + TAIL:.1f}s")
    print("not heard as written:", " ".join(missed))
    return res["text"]
