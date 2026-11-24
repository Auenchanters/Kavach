"""Print a check report's errors and warnings, grouped by rule (count + first 3 examples)."""
import collections
import json
import sys

d = json.load(open(sys.argv[1], encoding="utf-8"))
groups = collections.defaultdict(list)


def walk(o):
    if isinstance(o, dict):
        if o.get("severity") in ("error", "warning"):
            groups[(o["severity"], o.get("rule") or o.get("code") or "?")].append(o)
        for v in o.values():
            walk(v)
    elif isinstance(o, list):
        for v in o:
            walk(v)


walk(d)
print("ok:", d.get("ok"))
for (sev, rule), items in sorted(groups.items()):
    print(f"\n{sev.upper()} {rule} x{len(items)}")
    for it in items[:3]:
        where = it.get("file") or it.get("selector") or it.get("composition") or ""
        print("   -", (it.get("message") or "")[:220].replace("\n", " "), "|", where, it.get("time", ""))
