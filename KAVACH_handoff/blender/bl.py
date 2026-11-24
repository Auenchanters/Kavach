"""Run a Python file inside the running Blender via the blender_mcp add-on socket.
Usage: python blender/bl.py path/to/script.py
"""
import json
import socket
import sys

code = open(sys.argv[1], encoding="utf-8").read()
s = socket.create_connection(("localhost", 9876), timeout=600)
s.sendall(json.dumps({"type": "execute_code", "params": {"code": code}}).encode())
buf = b""
while True:
    chunk = s.recv(1 << 16)
    if not chunk:
        break
    buf += chunk
    try:
        reply = json.loads(buf)
        break
    except ValueError:
        continue
if reply.get("status") != "success":
    print(reply.get("message", reply))
    sys.exit(1)
print(reply["result"].get("result", ""))
