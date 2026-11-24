#!/usr/bin/env bash
# Regenerates the README screenshots and the demo GIF from the live prototype.
# Needs: Chrome/Chromium (CHROME=...), Python 3 with Pillow, and the web app served on $BASE:
#   python -m http.server 8765 -d web     # in another terminal
#   bash tools/screenshots.sh
# Headless Chrome has no GPU, so Three.js falls back to WebGL 2 on SwiftShader; scenes are deep links (?scene=).
set -euo pipefail

CHROME="${CHROME:-google-chrome}"
PY="${PYTHON:-python3}"
BASE="${BASE:-http://localhost:8765}"
native() { if command -v cygpath >/dev/null; then cygpath -m "$1"; else echo "$1"; fi; }  # Chrome on Windows needs C:/ paths
mkdir -p docs/img
OUT="$(native "$(cd docs/img && pwd)")"
PROFILE="$(native "$(mktemp -d)")"
FRAMES="$(native "$(mktemp -d)")"
trap 'rm -rf "$PROFILE" "$FRAMES" web/_capture.html' EXIT

# Chrome will not open a window narrower than ~500px, so phone sizes are shot through a same-origin 390px frame.
cat > web/_capture.html <<'HTML'
<!DOCTYPE html><body style="margin:0;background:#000"><iframe id="f" style="border:0;width:390px;height:844px;display:block"></iframe>
<script>document.getElementById("f").src = decodeURIComponent(location.hash.slice(1));</script></body>
HTML

# Pin a theme on every URL: pages otherwise follow the machine's light/dark setting.
pin() { case "$1" in *theme=*) echo "$1";; *\?*) echo "${1/\?/?theme=light\&}";; *\#*) echo "${1/\#/?theme=light#}";; *) echo "$1?theme=light";; esac; }

shot() { # name WxH path [scale]
  "$CHROME" --headless=new --user-data-dir="$PROFILE" --use-angle=swiftshader --enable-unsafe-swiftshader \
    --hide-scrollbars --force-device-scale-factor="${4:-2}" --window-size="$2" --virtual-time-budget=15000 \
    --screenshot="$1" "$BASE$(pin "$3")" 2>/dev/null
}
phone() { # name path
  local enc; enc=$("$PY" -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1], safe=""))' "$(pin "$2")")
  shot "$OUT/$1.png" 800,844 "/_capture.html?theme=light#$enc"
  "$PY" -c 'import sys; from PIL import Image; im = Image.open(sys.argv[1]); im.crop((0, 0, 780, 1688)).save(sys.argv[1])' "$OUT/$1.png"
}

shot "$OUT/start.png"            1440,900 "/"
shot "$OUT/phone-home.png"       1440,900 "/phone/"
shot "$OUT/phone-call.png"       1440,900 "/phone/?scene=call-joined"
shot "$OUT/admin-overview.png"   1440,900 "/admin/?scene=recover#overview"
shot "$OUT/admin-recover.png"    1440,900 "/admin/?scene=recover#recover"
shot "$OUT/admin-graph.png"      1440,900 "/admin/?scene=decoy#graph"
shot "$OUT/admin-decoy.png"      1440,900 "/admin/?scene=decoy#decoy"
shot "$OUT/admin-audit.png"      1440,900 "/admin/?scene=forbidden#audit"
shot "$OUT/dark-start.png"       1440,900 "/?theme=dark"
shot "$OUT/dark-phone-call.png"  1440,900 "/phone/?scene=call-joined&theme=dark"
shot "$OUT/dark-admin.png"       1440,900 "/admin/?scene=recover&theme=dark#overview"
shot "$OUT/dark-graph.png"       1440,900 "/admin/?scene=decoy&theme=dark#graph"
phone phone-call-mobile    "/phone/?scene=call-joined"
phone phone-sms-mobile     "/phone/?scene=sms"
phone phone-recover-mobile "/phone/?scene=recover"
phone admin-mobile         "/admin/?scene=recover#overview"

# The story as a GIF: the call, KAVACH joins, Rahul is alerted, money lost, recovery, approved, the graph.
i=0
for path in "/phone/" "/phone/?scene=call" "/phone/?scene=call-joined" "/admin/?scene=call-joined#overview" \
            "/phone/?scene=recover" "/admin/?scene=recover#recover" "/admin/?scene=approved#recover" "/admin/?scene=decoy#graph"; do
  shot "$FRAMES/$(printf %02d $i).png" 1440,900 "$path" 1
  i=$((i + 1))
done
"$PY" - "$FRAMES" "$OUT/story.gif" <<'PY'
import glob, sys
from PIL import Image
frames = [Image.open(f).convert("RGB").resize((960, 600), Image.LANCZOS) for f in sorted(glob.glob(sys.argv[1] + "/*.png"))]
pal = [f.quantize(colors=192, method=Image.Quantize.MEDIANCUT) for f in frames]
pal[0].save(sys.argv[2], save_all=True, append_images=pal[1:], duration=[2200] * len(pal), loop=0, optimize=True)
PY
echo "Wrote $(ls "$OUT" | wc -l) files to $OUT"
