"""Transparent PNG of the steel + indigo enamel shield for the pitch's HTML scenes.
Headless: blender -b --factory-startup --python build_shield_still.py   -> ../pitch/assets/shield.png (1200 x 1200)
"""
import math
import os

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
exec(compile(open(os.path.join(HERE, "build_scene.py"), encoding="utf-8").read(), "build_scene.py", "exec"))

for h in [h for h in bpy.app.handlers.frame_change_pre if h.__name__ == "kavach_counters"]:
    bpy.app.handlers.frame_change_pre.remove(h)
for m in list(scene.timeline_markers):
    if m.name.startswith("K_"):
        scene.timeline_markers.remove(m)
sh = bpy.data.objects["Lockup_Shield"]
for ob in list(COL.all_objects):  # keep the shield, its lights and the end camera
    if ob.name not in {"Lockup", "Lockup_Shield", "Lock_Key", "Lock_Rim", "Camera_End"}:
        bpy.data.objects.remove(ob)
for ob in COL.all_objects:
    if ob.animation_data:
        ob.animation_data_clear()
sh.scale = (1.4, 1.4, 1.4)
sh.rotation_euler = (math.radians(-8), math.radians(-24), 0)  # a turn shows both halves and the crease
cam_end = bpy.data.objects["Camera_End"]
cam_end.location = (120, -17, 2.7)  # shield ~80% of the frame height
cam_end.rotation_euler = (math.radians(90), 0, 0)
cam_end.data.lens = 85
scene.camera = cam_end
scene.frame_set(1)
r = scene.render
r.film_transparent = True
r.resolution_x = r.resolution_y = 1200
r.resolution_percentage = 100
r.image_settings.file_format = "PNG"
r.image_settings.color_mode = "RGBA"
r.filepath = os.path.join(HERE, "..", "pitch", "assets", "shield.png")
bpy.ops.render.render(write_still=True)
print("wrote", r.filepath)
