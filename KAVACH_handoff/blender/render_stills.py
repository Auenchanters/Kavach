"""Render test stills to blender/render/still_<frame>.png. Edit FRAMES to taste."""
import os

import bpy

FRAMES = (104, 146, 230, 286)
HALF = False  # full 1080p: judge text legibility at delivery size

scene = bpy.context.scene
out = os.path.join(os.path.dirname(bpy.data.filepath) or r"C:\Users\Utkarsh\Desktop\Project\Rit code hackathon\blender", "render")
os.makedirs(out, exist_ok=True)
scene.render.resolution_percentage = 50 if HALF else 100
for f in FRAMES:
    scene.frame_set(f)
    scene.render.filepath = os.path.join(out, f"still_{f:03d}.png")
    bpy.ops.render.render(write_still=True)
scene.render.resolution_percentage = 100
print(out)
