"""Output settings for a motion preview. Run headless after build_scene.py:
blender -b --factory-startup --python build_scene.py --python render_preview.py -a
"""
import os

import bpy

r = bpy.context.scene.render
r.resolution_percentage = int(os.environ.get("KAVACH_PCT", "50"))
if os.environ.get("KAVACH_FRAMES"):  # e.g. "36,290": render only part of the shot
    bpy.context.scene.frame_start, bpy.context.scene.frame_end = map(int, os.environ["KAVACH_FRAMES"].split(","))
r.filepath = os.path.join(os.path.dirname(os.path.abspath(__file__)), "render", "kavach_call_preview_")
im = r.image_settings
if hasattr(im, "media_type"):  # Blender 5.x splits image / video
    im.media_type = "VIDEO"
im.file_format = "FFMPEG"
r.ffmpeg.format = "MPEG4"
r.ffmpeg.codec = "H264"
r.ffmpeg.constant_rate_factor = "PERC_LOSSLESS" if r.resolution_percentage == 100 else "HIGH"  # final: no visible compression
r.ffmpeg.ffmpeg_preset = "BEST"
