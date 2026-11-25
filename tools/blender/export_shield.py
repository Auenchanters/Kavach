"""Export the steel + indigo enamel shield from the film's scene as a GLB for the web prototype.
blender -b blender/kavach_call.blend --python Kavach/tools/blender/export_shield.py -- <out.glb>
"""

import sys

import bpy

out = sys.argv[sys.argv.index("--") + 1]
sh = bpy.data.objects["Kavach_Shield"]
bpy.ops.object.select_all(action="DESELECT")
sh.select_set(True)
bpy.context.view_layer.objects.active = sh
sh.location = (0, 0, 0)  # the web scene centres it; the film's placement is irrelevant there
bpy.ops.export_scene.gltf(
    filepath=out,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_yup=True,
    export_materials="EXPORT",
    export_animations=False,
)
print("exported", out)
