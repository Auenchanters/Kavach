"""Generate the narration with ElevenLabs as ONE continuous take, and lay out the clock from its word timestamps.

Needs pitch/.env with ELEVENLABS_API_KEY=... and optionally ELEVENLABS_VOICE_ID=... (or pass --voice <id>).
Usage: python -I pitch/vo/gen_vo.py [--voice <id>]   -> assets/audio/vo_take.mp3, vo/take_words.json, vo/timing.json
       python -I pitch/vo/gen_vo.py --test <id> <name>  -> vo/tests/test_<name>.mp3 (short pronunciation check)
       python -I pitch/vo/gen_vo.py --relayout          -> rebuild vo/timing.json from the saved take, no API call
One take means no cold starts between lines: pauses are the speaker's own (sentences, and a paragraph per scene).
Indian words are sent in Devanagari so they are pronounced as Hindi; screen text and timing keys keep the Latin word.
"""
import base64
import json
import os
import sys
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
API = "https://api.elevenlabs.io/v1"
MODEL = "eleven_multilingual_v2"
OPEN, TAIL = 4.0, 3.0  # seconds before the first word and after the last; see SPEC.md TIME
SETTINGS = {"stability": 0.5, "similarity_boost": 0.75, "style": 0.2, "speed": 1.05}
# spoken form for words a text model reads wrong; each maps ONE token to ONE token so word timing stays aligned
SAY = {"KAVACH": "कवच", "KAVACH,": "कवच,", "KAVACH.": "कवच.", "Sanchar": "संचार", "Saathi": "साथी", "Chakshu": "चक्षु",
       "WHACKiest": "Whackiest", "1930": "1-9-3-0", "FastMCP": "Fast-MCP"}
TEST_TEXT = ("Every second in India, someone falls victim to cyber fraud. That is why we built कवच. "
             "It reports scammers to संचार साथी चक्षु and the 1-9-3-0 helpline, because over one lakh senior citizens "
             "lost four thousand crore rupees, and no Amma should be left alone with a scammer.")


def env():
    vals = {}
    with open(os.path.join(ROOT, ".env"), encoding="utf-8") as f:
        for line in f:
            if "=" in line and not line.lstrip().startswith("#"):
                k, v = line.strip().split("=", 1)
                vals[k.strip()] = v.strip().strip('"').strip("'")
    if not vals.get("ELEVENLABS_API_KEY"):
        sys.exit("ELEVENLABS_API_KEY missing in pitch/.env")
    return vals


def call(path, key, body, raw=False):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode(),
                                 headers={"xi-api-key": key, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            data = r.read()
            return data if raw else json.loads(data)
    except urllib.error.HTTPError as e:  # show ElevenLabs' reason, never the key
        sys.exit(f"ElevenLabs {e.code} on {path.split('?')[0]}: {e.read().decode(errors='replace')[:400]}")


def spoken(text):
    return " ".join(SAY.get(w, w) for w in text.split())


def layout(segs, alignment, take_len):
    """Character alignment of the whole take -> per-segment word timings on the film clock."""
    chars, starts, ends = (alignment["characters"], alignment["character_start_times_seconds"],
                           alignment["character_end_times_seconds"])
    # word spans in the spoken text, in order
    spans, cur, s0, e0 = [], "", None, None
    for ch, s, e in zip(chars, starts, ends):
        if ch.isspace():
            if cur:
                spans.append((cur, s0, e0))
            cur, s0 = "", None
            continue
        cur += ch
        s0 = s if s0 is None else s0
        e0 = e
    if cur:
        spans.append((cur, s0, e0))
    timing, k = [], 0
    for seg in segs:
        shown = seg["text"].split()
        said = spoken(seg["text"]).split()
        assert len(shown) == len(said), seg["id"]
        mine = spans[k:k + len(said)]
        assert [w for w, _, _ in mine] == said, (seg["id"], [w for w, _, _ in mine][:4], said[:4])
        k += len(said)
        st, en = mine[0][1], mine[-1][2]
        timing.append({"id": seg["id"], "scene": seg["scene"], "start": round(OPEN + st, 3),
                       "duration": round(en - st + 0.15, 3),
                       "words": [{"word": w, "at": round(OPEN + s, 3)} for w, (_, s, _) in zip(shown, mine)]})
    return {"take": "vo_take.mp3", "take_start": OPEN, "segments": timing, "total": round(OPEN + take_len + TAIL, 3)}


def main():
    cfg = env()
    key = cfg["ELEVENLABS_API_KEY"]
    args = sys.argv[1:]
    if args[:1] == ["--test"]:
        os.makedirs(os.path.join(HERE, "tests"), exist_ok=True)
        mp3 = call(f"/text-to-speech/{args[1]}?output_format=mp3_44100_128", key,
                   {"text": TEST_TEXT, "model_id": MODEL, "voice_settings": SETTINGS}, raw=True)
        open(os.path.join(HERE, "tests", f"test_{args[2]}.mp3"), "wb").write(mp3)
        print("wrote test", args[2])
        return
    segs = json.load(open(os.path.join(HERE, "segments.json"), encoding="utf-8"))
    words_path = os.path.join(HERE, "take_words.json")
    mp3_path = os.path.join(ROOT, "assets", "audio", "vo_take.mp3")
    if "--relayout" not in args:
        voice = args[args.index("--voice") + 1] if "--voice" in args else (cfg.get("ELEVENLABS_VOICE_ID") or "JBFqnCBsd6RMkjVDRZzb")
        scenes, paras = [], []
        for seg in segs:  # one paragraph per scene: the speaker breathes between scenes, not between lines
            if not scenes or scenes[-1] != seg["scene"]:
                scenes.append(seg["scene"])
                paras.append([])
            paras[-1].append(spoken(seg["text"]))
        text = "\n\n".join(" ".join(p) for p in paras)
        r = call(f"/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128", key,
                 {"text": text, "model_id": MODEL, "voice_settings": SETTINGS})
        open(mp3_path, "wb").write(base64.b64decode(r["audio_base64"]))
        json.dump(r["alignment"], open(words_path, "w", encoding="utf-8"))
        print(f"take: {len(text)} chars, voice {voice}")
    alignment = json.load(open(words_path, encoding="utf-8"))
    take_len = alignment["character_end_times_seconds"][-1] + 0.3
    t = layout(segs, alignment, take_len)
    json.dump(t, open(os.path.join(HERE, "timing.json"), "w", encoding="utf-8"), indent=1)
    print(f"total {t['total']:.1f}s")


if __name__ == "__main__":
    main()
