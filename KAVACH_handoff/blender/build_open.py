"""Opening shot for the pitch: the same phone, an incoming unknown call, vibrating. 5 s @ 24 fps.
Headless: blender -b --factory-startup --python build_open.py -a   -> ../pitch/assets/video/open_ring_0001-0120.mp4
Reuses build_scene.py for the phone, materials and lights, then strips the KAVACH story off it.
"""
import math
import os

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
exec(compile(open(os.path.join(HERE, "build_scene.py"), encoding="utf-8").read(), "build_scene.py", "exec"))

END_OPEN = 120
scene.frame_start, scene.frame_end = 1, END_OPEN
for h in [h for h in bpy.app.handlers.frame_change_pre if h.__name__ == "kavach_counters"]:
    bpy.app.handlers.frame_change_pre.remove(h)
for m in [m for m in scene.timeline_markers if m.name.startswith("K_")]:
    scene.timeline_markers.remove(m)
scene.camera = cam

# keep only the call screen; KAVACH has not been introduced yet
keep = {"PhoneRig", "Phone_Body", "Screen", "Island", "Lbl_Unknown", "Lbl_Number", "Lbl_Timer", "Avatar", "Avatar_Q",
        "Btn_Hang", "Ico_Hang", "Camera", "Key", "Rim", "Top", "Backdrop"}
for ob in list(COL.all_objects):
    if ob.name not in keep:
        bpy.data.objects.remove(ob)
for ob in COL.all_objects:
    if ob.animation_data:
        ob.animation_data_clear()

bpy.data.objects["Lbl_Timer"].data.body = "incoming call"
bpy.data.objects["Lbl_Timer"].data.font = bpy.data.fonts.load(FONTS + SANS, check_existing=True)
decline = bpy.data.objects["Btn_Hang"]
decline.location = (-2.0, -5.0, Z + 0.004)
accept = rrect("Btn_Accept", 1.6, 1.6, 0.8, m_green, rig, (2.0, -5.0, Z + 0.004))
text("Ico_Accept", "", 0.7, m_white, accept, (0, 0, 0.002), ICON)
text("Lbl_Decline", "decline", 0.34, m_muted, rig, (-2.0, -6.2, Z))
text("Lbl_Accept", "accept", 0.34, m_muted, rig, (2.0, -6.2, Z))

# phone centred, a slow push in; it buzzes in three bursts (the ring)
rig.location = (0, 0, 0)
key(rig, "rotation_euler", 1, (math.radians(90), 0, math.radians(14)))
for b0 in (6, 42, 78):
    for k, f in enumerate(range(b0, b0 + 20, 2)):
        z = math.radians(14 + (0.9 if k % 2 else -0.9))
        key(rig, "rotation_euler", f, (math.radians(90), 0, z), "LINEAR")
    key(rig, "rotation_euler", b0 + 20, (math.radians(90), 0, math.radians(14)), "LINEAR")
key(cam, "location", 1, (0.0, -52, 0.6), "BEZIER")
key(cam, "location", END_OPEN, (0.0, -44, 0.4), "BEZIER")
prefs.keyframe_new_interpolation_type = _old_interp

r = scene.render
r.resolution_percentage = 100
r.filepath = os.path.join(HERE, "..", "pitch", "assets", "video", "open_ring_")
im = r.image_settings
if hasattr(im, "media_type"):
    im.media_type = "VIDEO"
im.file_format = "FFMPEG"
r.ffmpeg.format, r.ffmpeg.codec = "MPEG4", "H264"
r.ffmpeg.constant_rate_factor, r.ffmpeg.ffmpeg_preset = "PERC_LOSSLESS", "BEST"
