"""Assemble the pitch film: src/<scene>.html templates -> compositions/<scene>.html + index.html.

Time tokens in templates (all scene-local seconds):
  {{s1b}}         start of voice segment s1b      {{s1b.end}}  its end
  {{s1b:32.4}}    when the voice says the first word starting with "32.4" in s1b
  {{dur}}         the scene's length              {{CSS}}      shared stylesheet
Sound markers: <i data-sfx="file.ogg" data-at="{{...}}" data-vol="0.4"></i> become root <audio> clips.
Clock: vo/timing.json from vo/gen_vo.py; without it, an estimate at 2.55 words/s (same gaps).
Usage: python -I pitch/build.py
"""
import json
import os
import re
import subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
SCENES = ["open", "hook", "fail", "meet", "shield", "strike", "recover", "intel", "arch", "safety", "scope",
          "roadmap", "close"]
LEAD = 0.45  # a scene starts this long before its first line
OPEN, GAP_LINE, GAP_SCENE, TAIL = 4.0, 0.3, 0.7, 3.0  # must match vo/gen_vo.py
MUSIC, MUSIC_DB = "lifewave2k.mp3", -13  # track ~-17.7 LUFS -> ~-31 LUFS bed, ~-36 under the -16 LUFS voice
SFX_GAIN = 0.5  # effects sit under the voice, not on top of it

CSS = """
@font-face { font-family: KSans; src: local('Segoe UI'); font-weight: 400; }
@font-face { font-family: KSans; src: local('Segoe UI Semibold'); font-weight: 600; }
@font-face { font-family: KMono; src: local('Consolas'); font-weight: 400; }
#root { position: absolute; inset: 0; overflow: hidden; font-family: KSans, sans-serif; color: #171717;
        background: radial-gradient(ellipse 70% 75% at 50% 45%, #F4F4F5 0%, #E4E4E6 60%, #C9C9CC 100%); }
#root * { box-sizing: border-box; }
#root .abs { position: absolute; }
#root .card { background: #19191B; border: 1px solid #2C2C2F; border-radius: 24px; color: #EDEDED;
              box-shadow: 0 24px 48px rgba(0,0,0,0.14); }
#root .row { background: #232325; border-radius: 14px; color: #EDEDED; }
#root .mono { font-family: KMono, monospace; font-variant-numeric: tabular-nums; }
#root .semi { font-weight: 600; }
#root .t2 { color: #525252; } #root .t3 { color: #737373; }
#root .c2 { color: #A1A1A6; } #root .c3 { color: #85858B; }
#root .red { color: #E5484D; } #root .green { color: #4CC38A; } #root .amber { color: #F5A524; }
#root .indigo { color: #2A2FD0; } #root .indigo-d { color: #6C70F0; }
#root .dot { display: inline-block; width: 16px; height: 16px; border-radius: 8px; flex: none; }
#root .head { left: 120px; top: 84px; font-size: 40px; }
#root i[data-sfx] { display: none; }
"""


def norm(w):
    return re.sub(r"[^0-9a-z.]", "", w.lower().replace(",", "")).rstrip(".")


def clock():
    segs = json.load(open(os.path.join(HERE, "vo", "segments.json"), encoding="utf-8"))
    path = os.path.join(HERE, "vo", "timing.json")
    if os.path.exists(path):
        t = json.load(open(path, encoding="utf-8"))
        return t["segments"], t["total"], t
    out, t, prev = [], OPEN, None
    for s in segs:
        words = s["text"].split()
        dur = len(words) / 2.55 + 0.25
        if prev is not None:
            t += GAP_SCENE if s["scene"] != prev else GAP_LINE
        out.append({"id": s["id"], "scene": s["scene"], "start": round(t, 3), "duration": round(dur, 3),
                    "words": [{"word": w, "at": round(t + i * (dur - 0.25) / len(words), 3)} for i, w in enumerate(words)]})
        t += dur
        prev = s["scene"]
    return out, round(t + TAIL, 3), False


def probe(name):
    """Length of a file in assets/audio, in seconds."""
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                          os.path.join(HERE, "assets", "audio", name)], capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def music_bed(total, real):
    """Lifewave 2k (CC0), extended by crossfading it into itself, sitting ~18 dB under the voice and ducked
    a further few dB while the voice speaks. Baked to one wav so the mix doesn't depend on the renderer."""
    out = "music_bed.wav"
    take = real["take"] if real and real is not True and real.get("take") else None
    src = os.path.join(HERE, "assets", "audio", MUSIC)
    graph = (f"[0]atrim=0:168[a];[0]atrim=14:187,asetpts=PTS-STARTPTS[b];[a][b]acrossfade=d=6[m];"
             f"[m]atrim=0:{total:.3f},afade=t=in:d=2,afade=t=out:st={total - 3:.3f}:d=3,volume={MUSIC_DB}dB")
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", src]
    if take:  # duck under the voice (placed at its film offset)
        cmd += ["-i", os.path.join(HERE, "assets", "audio", take)]
        ms = int(real["take_start"] * 1000)
        graph += (f"[mm];[1]aformat=channel_layouts=stereo,aresample=44100,adelay={ms}|{ms},apad[v];"
                  f"[mm][v]sidechaincompress=threshold=0.06:ratio=2:attack=150:release=1000:makeup=1")
    cmd += ["-filter_complex", graph, "-t", f"{total:.3f}", "-ar", "44100", "-ac", "2",
            os.path.join(HERE, "assets", "audio", out)]
    subprocess.run(cmd, check=True)
    return out


def main():
    segs, total, real = clock()
    by_id = {s["id"]: s for s in segs}
    starts = {}
    for sc in SCENES[1:]:
        first = [s for s in segs if s["scene"] == sc]
        assert first, f"no voice segment for scene {sc}"
        starts[sc] = round(first[0]["start"] - LEAD, 3)
    starts["open"] = 0.0
    bounds = {sc: (starts[sc], starts[SCENES[i + 1]] if i + 1 < len(SCENES) else total) for i, sc in enumerate(SCENES)}
    os.makedirs(os.path.join(HERE, "compositions"), exist_ok=True)
    sfx, hosts = [], []
    for z, sc in enumerate(SCENES):
        a, b = bounds[sc]

        def word_at(sid, word, sc=sc):
            hits = [w["at"] for w in by_id[sid]["words"] if norm(w["word"]).startswith(norm(word))]
            assert hits, f"{sc}: word '{word}' not in {sid}"
            return hits[0]

        helpers = {"S": lambda i, a=a: by_id[i]["start"] - a,                       # segment start, local
                   "E": lambda i, a=a: by_id[i]["start"] + by_id[i]["duration"] - a,  # segment end, local
                   "L": lambda i: by_id[i]["duration"],                               # segment length
                   "W": lambda i, w, a=a: word_at(i, w) - a,                          # word time, local
                   "DUR": b - a}

        def tok(m, a=a, b=b, sc=sc, helpers=helpers):
            body = m.group(1)
            if body == "CSS":
                return CSS
            if body.startswith("INDIA_"):  # map data inlined (scenes may not fetch files)
                india = json.load(open(os.path.join(HERE, "assets", "india.json"), encoding="utf-8"))
                return {"INDIA_D": india["d"], "INDIA_W": str(india["w"]), "INDIA_H": str(india["h"]),
                        "INDIA_CITIES": json.dumps(india["cities"])}[body]
            if body == "dur":
                return f"{b - a:.2f}"
            if body.startswith("="):  # {{= S('s3b') - 0.3 }}: arithmetic on the clock
                return f"{eval(body[1:], {'__builtins__': {}}, helpers):.3f}"
            sid, _, word = body.partition(":")
            sid, _, end = sid.partition(".")
            seg = by_id[sid]
            if end == "end":
                t = seg["start"] + seg["duration"]
            elif word:
                t = word_at(sid, word)
            else:
                t = seg["start"]
            return f"{t - a:.2f}"

        html = re.sub(r"\{\{([^}]+)\}\}", tok, open(os.path.join(HERE, "src", f"{sc}.html"), encoding="utf-8").read())
        for m in re.finditer(r'<i data-sfx="([^"]+)" data-at="([-0-9.]+)" data-vol="([0-9.]+)"></i>', html):
            sfx.append((m.group(1), round(a + float(m.group(2)), 3), m.group(3)))
        open(os.path.join(HERE, "compositions", f"{sc}.html"), "w", encoding="utf-8").write(html)
        hosts.append(f'      <div id="{sc}" data-composition-id="{sc}" data-composition-src="compositions/{sc}.html" '
                     f'data-start="{a:.3f}" data-duration="{b - a:.3f}" data-track-index="1" data-track-kind="graphics" '
                     f'data-width="1920" data-height="1080" style="z-index:{z + 1}"></div>')
    audio = []
    if real and real is not True and real.get("take"):  # one continuous take (vo/gen_vo.py)
        audio.append(f'      <audio id="vo" src="assets/audio/{real["take"]}" data-start="{real["take_start"]:.3f}" '
                     f'data-duration="{probe(real["take"]):.3f}" data-track-index="2" data-volume="1"></audio>')
    elif real:
        for s in segs:
            audio.append(f'      <audio id="vo-{s["id"]}" src="assets/audio/vo_{s["id"]}.mp3" data-start="{s["start"]:.3f}" '
                         f'data-duration="{probe("vo_" + s["id"] + ".mp3"):.3f}" data-track-index="2" data-volume="1"></audio>')
    bed = music_bed(total, real)
    audio.append(f'      <audio id="music" src="assets/audio/{bed}" data-start="0" data-duration="{total:.3f}" '
                 f'data-track-index="3" data-volume="1"></audio>')
    lens, lane_free = {}, [0.0, 0.0, 0.0, 0.0]
    for i, (f, at, vol) in enumerate(sorted(sfx, key=lambda x: x[1])):
        if f not in lens:  # each effect lasts its own length, not to the end of the film
            lens[f] = probe(f)
        at = max(at, 0)
        lane = next((k for k, free in enumerate(lane_free) if free <= at), 0)  # overlapping hits on separate lanes
        lane_free[lane] = at + lens[f]
        audio.append(f'      <audio id="sfx-{i:02d}" src="assets/audio/{f}" data-start="{at:.3f}" '
                     f'data-duration="{lens[f]:.3f}" data-track-index="{4 + lane}" data-volume="{float(vol) * SFX_GAIN:.3f}"></audio>')
    index = f"""<!doctype html>
<html lang="en" data-resolution="landscape">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <style>
      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ margin: 0; width: 1920px; height: 1080px; overflow: hidden; background: #E4E4E6; }}
    </style>
  </head>
  <body>
    <!-- generated by build.py from src/ and vo/timing.json; edit src/, then rebuild -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="{total:.3f}" data-width="1920" data-height="1080">
{chr(10).join(hosts)}
{chr(10).join(audio)}
    </div>
    <script>
      window.__timelines = window.__timelines || {{}};
      window.__timelines["main"] = gsap.timeline({{ paused: true }});
    </script>
  </body>
</html>
"""
    open(os.path.join(HERE, "index.html"), "w", encoding="utf-8").write(index)
    print(f"{'voice' if real else 'ESTIMATED'} clock, {total:.1f}s, {len(sfx)} sfx")
    for sc in SCENES:
        print(f"  {sc:8s} {bounds[sc][0]:7.2f} -> {bounds[sc][1]:7.2f}")


if __name__ == "__main__":
    main()
