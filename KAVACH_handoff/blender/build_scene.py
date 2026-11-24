"""KAVACH call-screen shot. Rebuilds the 'KAVACH' collection from scratch (idempotent).
Run: python blender/bl.py blender/build_scene.py   (Blender must be open with the MCP add-on)
Units: 1 Blender unit = 10 mm on the phone. Phone-local +Z faces the camera.
"""
import math
import os
import random

import bmesh
import bpy

# ---- one clock (frames @ 24 fps) -------------------------------------------
FPS, END = 24, 360
F_TYPE = (6, 30)       # caption "Is this call" types, "real?" box pops at the end
F_CAPTION_OUT = 56
F_MACRO = (156, 204)   # cut to macro close-up of the verdict, then back
F_LOCKUP = 292         # cut to end card
F_IN_END = 36          # phone settles
F_TAP = 48             # finger taps the shield
F_ACTIVE = 66          # panel open, listening
F_CHIPS = (80, 96, 112)
F_VERDICT = 126        # card leaves the glass
F_VERDICT_END = 148
F_ALERT = 222          # Rahul alerted, hang-up pulse
F_SCREEN = (70, 124)   # cut to a close-up of the screen while KAVACH listens
F_HANG_TAP = 258       # user taps hang up
F_CALL_END = 266       # "Call ended" screen

# ---- palette (linear RGB) ---------------------------------------------------
def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)

# Direction (unslop by @heydamir, CC BY 4.0): calm, protective, plain-spoken. Graphite UI on a light graphite studio.
# Colour lives in two moments only: the steel + indigo enamel shield, and the red verdict.
UI_BG, UI_CARD, UI_RAISED, UI_LINE = srgb("#121214"), srgb("#19191B"), srgb("#232325"), srgb("#2C2C2F")
WHITE, GREY, MUTED = srgb("#EDEDED"), srgb("#A1A1A6"), srgb("#85858B")      # text roles on the phone
INK, SUBINK, MUTEDINK = srgb("#171717"), srgb("#525252"), srgb("#737373")   # text roles on the studio
INDIGO = srgb("#2A2FD0")          # brand accent: enamel and the caption highlight
INDIGO_ON_DARK = srgb("#6C70F0")  # the same accent, lifted to read on graphite
RED = srgb("#E5484D")             # semantic: scam verdict and hang-up only
GREEN = srgb("#4CC38A")           # semantic: guardian alerted
BG_WORLD, BG_EDGE, BG_CENTRE = "#DCDCDE", "#C9C9CC", "#F4F4F5"


FONTS = "C:/Windows/Fonts/"
SANS, SEMI, MONO = "segoeui.ttf", "seguisb.ttf", "consola.ttf"  # weights 400 and 600 only
ICON = "SegoeIcons.ttf"  # Segoe Fluent Icons (private-use glyphs)
I_MUTE, I_PAD, I_SPK, I_ADD, I_VID, I_CONTACT, I_HANG = "\uE74F", "\uE75F", "\uE767", "\uE710", "\uE714", "\uE77B", "\uE778"

scene = bpy.context.scene
prefs = bpy.context.preferences.edit
_old_interp = prefs.keyframe_new_interpolation_type

# ---- reset -----------------------------------------------------------------
for name in ("Cube", "Light", "Camera"):  # factory-startup objects only
    ob = bpy.data.objects.get(name)
    if ob and not ob.get("kavach"):
        bpy.data.objects.remove(ob)
if (old := bpy.data.collections.get("KAVACH")):
    for ob in list(old.all_objects):
        bpy.data.objects.remove(ob)
    bpy.data.collections.remove(old)
for coll in (bpy.data.materials, bpy.data.meshes, bpy.data.curves, bpy.data.lights, bpy.data.cameras):
    for d in list(coll):
        if d.name.startswith("K_") and d.users == 0:
            coll.remove(d)
COL = bpy.data.collections.new("KAVACH")
scene.collection.children.link(COL)
random.seed(7)

# ---- helpers ---------------------------------------------------------------
def link(ob, parent=None, loc=(0, 0, 0)):
    COL.objects.link(ob)
    ob.parent, ob.location = parent, loc
    ob["kavach"] = True
    return ob


def mat_emit(name, rgb, strength=1.0):
    m = bpy.data.materials.new("K_" + name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    e = nt.nodes.new("ShaderNodeEmission")
    e.inputs["Color"].default_value = (*rgb, 1)
    e.inputs["Strength"].default_value = strength
    nt.links.new(e.outputs[0], nt.nodes.new("ShaderNodeOutputMaterial").inputs[0])
    return m


def mat_fade(name, rgb, strength=1.0, alpha=1.0):
    """Emission that can fade: returns (material, mix node). Keyframe mix.inputs[0]."""
    m = bpy.data.materials.new("K_" + name)
    m.use_nodes = True
    m.surface_render_method = "BLENDED"
    nt = m.node_tree
    nt.nodes.clear()
    e = nt.nodes.new("ShaderNodeEmission")
    e.inputs["Color"].default_value = (*rgb, 1)
    e.inputs["Strength"].default_value = strength
    t = nt.nodes.new("ShaderNodeBsdfTransparent")
    mix = nt.nodes.new("ShaderNodeMixShader")
    mix.inputs[0].default_value = alpha
    nt.links.new(t.outputs[0], mix.inputs[1])
    nt.links.new(e.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], nt.nodes.new("ShaderNodeOutputMaterial").inputs[0])
    return m, mix


def mat_pbr(name, rgb, metal=0.0, rough=0.4, coat=0.0):
    m = bpy.data.materials.new("K_" + name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Metallic"].default_value = metal
    b.inputs["Roughness"].default_value = rough
    b.inputs["Coat Weight"].default_value = coat
    return m


def rr_pts(w, h, r, seg=10):
    r = min(r, w / 2, h / 2)
    cx, cy, pts = w / 2 - r, h / 2 - r, []
    for sx, sy, a0 in ((1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)):
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            p = (sx * cx + r * math.cos(a), sy * cy + r * math.sin(a))
            if not pts or math.dist(p, pts[-1]) > 1e-6:
                pts.append(p)
    if math.dist(pts[0], pts[-1]) < 1e-6:
        pts.pop()
    return pts


def mesh(name, verts, faces, mat, parent=None, loc=(0, 0, 0)):
    me = bpy.data.meshes.new("K_" + name)
    me.from_pydata(verts, [], faces)
    me.update()
    me.materials.append(mat)
    return link(bpy.data.objects.new(name, me), parent, loc)


def rrect(name, w, h, r, mat, parent=None, loc=(0, 0, 0), thick=0.0):
    pts = rr_pts(w, h, r)
    ob = mesh(name, [(x, y, 0) for x, y in pts], [list(range(len(pts)))], mat, parent, loc)
    if thick:
        s = ob.modifiers.new("thick", "SOLIDIFY")
        s.thickness, s.offset = thick, -1
    return ob


def ring(name, r_out, r_in, mat, parent=None, loc=(0, 0, 0), seg=64):
    v, f = [], []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        v += [(r_out * math.cos(a), r_out * math.sin(a), 0), (r_in * math.cos(a), r_in * math.sin(a), 0)]
        j = (i + 1) % seg
        f.append([2 * i, 2 * j, 2 * j + 1, 2 * i + 1])
    return mesh(name, v, f, mat, parent, loc)


def text(name, body, size, mat, parent=None, loc=(0, 0, 0), font=SANS, align="CENTER", width=0.0):
    cu = bpy.data.curves.new("K_" + name, "FONT")
    cu.body = body
    cu.font = bpy.data.fonts.load(FONTS + font, check_existing=True)
    cu.size = size
    cu.align_x, cu.align_y = align, "CENTER"
    if width:
        cu.text_boxes[0].width = width
        cu.text_boxes[0].x = -width / 2
    cu.materials.append(mat)
    return link(bpy.data.objects.new(name, cu), parent, loc)


def key(target, path, frame, value, interp="BEZIER", index=-1):
    """Set and keyframe one property. interp: BEZIER (ease in/out), BACK (overshoot), LINEAR, CONSTANT."""
    prefs.keyframe_new_interpolation_type = interp
    if path == "fac":  # mix-shader fade
        target.inputs[0].default_value = value
        target.inputs[0].keyframe_insert("default_value", frame=frame)
        return
    setattr(target, path, value)
    target.keyframe_insert(path, frame=frame, index=index)


def s3(v):
    return (v, v, v)


def pop(ob, f_on, f_off=None, full=1.0, dur=10):
    """Scale 0 -> full with overshoot at f_on; back to 0 at f_off."""
    key(ob, "scale", f_on - 1, s3(0.0001), "BEZIER")
    key(ob, "scale", f_on, s3(0.0001), "BEZIER")
    key(ob, "scale", f_on + dur, s3(full), "BEZIER")
    if f_off:
        key(ob, "scale", f_off, s3(full), "BEZIER")
        key(ob, "scale", f_off + 8, s3(0.0001), "CONSTANT")


# ---- materials ---------------------------------------------------------------
m_white, m_grey, m_muted = mat_emit("text1", WHITE), mat_emit("text2", GREY), mat_emit("text3", MUTED)
m_red, m_green = mat_emit("red", RED), mat_emit("green", GREEN)
m_black = mat_emit("black", (0.0, 0.0, 0.0))
m_frame = mat_pbr("titanium", srgb("#2B2B2E"), metal=1.0, rough=0.26)
m_wall, m_card = mat_emit("ui_bg", UI_BG), mat_emit("ui_card", UI_CARD)  # self-lit UI surfaces
m_raised, m_line = mat_emit("ui_raised", UI_RAISED), mat_emit("ui_line", UI_LINE)
m_accent = mat_emit("accent_dark", INDIGO_ON_DARK)


m_steel = mat_pbr("steel", srgb("#A9AAAE"), metal=1.0, rough=0.3)
m_steel.node_tree.nodes["Principled BSDF"].inputs["Anisotropic"].default_value = 0.6  # brushed
m_enamel = mat_pbr("enamel", srgb("#1C1F9E"), rough=0.3, coat=1.0)  # darker than INDIGO: studio light lifts it
m_enamel.node_tree.nodes["Principled BSDF"].inputs["Coat Roughness"].default_value = 0.06


def shield(name, parent=None, loc=(0, 0, 0), scale=1.0):
    """Logo shield as a real object: steel + indigo enamel halves, raised crease, 2.2 units tall at scale 1."""
    half = [(0.0, 1.0), (-0.45, 0.88), (-0.86, 0.76), (-0.9, 0.7)]
    half += [(-0.9, 0.7 - 0.65 * t / 4) for t in range(1, 5)]
    for i in range(1, 13):  # quadratic curve to the tip
        t = i / 12
        p0, p1, p2 = (-0.9, 0.05), (-0.9, -0.75), (0.0, -1.2)
        half.append(((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
                     (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]))
    ridge_h, verts, faces = 0.28, [], []
    for side in (1, -1):
        base = len(verts)
        for x, y in half:  # each half is one plane, like the logo's two facets
            verts.append((side * x, y, ridge_h * (1 - abs(x) / 0.9)))
            verts.append((0.0, y, ridge_h))
        for i in range(len(half) - 1):
            a, b = base + 2 * i, base + 2 * (i + 1)
            faces.append([a, b, b + 1, a + 1] if side == 1 else [a, a + 1, b + 1, b])
    ob = mesh(name, verts, faces, m_steel, parent, loc)
    ob.data.materials.append(m_enamel)
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    for f in bm.faces:  # armour: steel half, indigo enamel half, split on the crease
        f.material_index = 1 if f.calc_center_median().x > 0 else 0
    bm.to_mesh(ob.data)
    bm.free()
    s = ob.modifiers.new("thick", "SOLIDIFY")
    s.thickness, s.offset = 0.22, -1
    ob.scale = s3(scale)
    return ob


# ---- world, backdrop, lights, camera ---------------------------------------
world = scene.world or bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
world.node_tree.nodes["Background"].inputs[0].default_value = (*srgb(BG_WORLD), 1)
world.node_tree.nodes["Background"].inputs[1].default_value = 1.0

m_bg = bpy.data.materials.new("K_backdrop")
m_bg.use_nodes = True
nt = m_bg.node_tree
nt.nodes.clear()
tc, mp, gr, ramp = (nt.nodes.new(t) for t in ("ShaderNodeTexCoord", "ShaderNodeMapping", "ShaderNodeTexGradient", "ShaderNodeValToRGB"))
mp.inputs["Scale"].default_value = (0.035, 0.05, 1)
gr.gradient_type = "SPHERICAL"
ramp.color_ramp.elements[0].color = (*srgb(BG_EDGE), 1)
ramp.color_ramp.elements[1].color = (*srgb(BG_CENTRE), 1)
em = nt.nodes.new("ShaderNodeEmission")
nt.links.new(tc.outputs["Object"], mp.inputs[0])
nt.links.new(mp.outputs[0], gr.inputs[0])
nt.links.new(gr.outputs["Color"], ramp.inputs[0])
nt.links.new(ramp.outputs[0], em.inputs[0])
nt.links.new(em.outputs[0], nt.nodes.new("ShaderNodeOutputMaterial").inputs[0])
bg = rrect("Backdrop", 160, 100, 0.1, m_bg, loc=(4, 30, 0))
bg.rotation_euler = (math.radians(90), 0, 0)


def area(name, loc, energy, size, rgb=(1, 1, 1), target=None):
    ld = bpy.data.lights.new("K_" + name, "AREA")
    ld.energy, ld.size, ld.color = energy, size, rgb
    ob = link(bpy.data.objects.new(name, ld), loc=loc)
    tr = ob.constraints.new("TRACK_TO")
    tr.target = target or rig
    return ob


rig = link(bpy.data.objects.new("PhoneRig", None))
rig.empty_display_size = 4
area("Key", (-26, -30, 22), 90000, 26)
area("Rim", (24, 14, 8), 60000, 14)
area("Top", (4, -6, 30), 30000, 18)

cam_d = bpy.data.cameras.new("K_cam")
cam_d.lens = 70
cam = link(bpy.data.objects.new("Camera", cam_d))
scene.camera = cam
cam.rotation_euler = (math.radians(90), 0, 0)
key(cam, "location", 1, (0.6, -62, 0.4))
key(cam, "location", END, (0.6, -55, 0.2))  # CAM-02: one slow push-in

# ---- phone -------------------------------------------------------------------
body = rrect("Phone_Body", 7.15, 14.7, 1.05, m_frame, rig, (0, 0, 0.4), thick=0.8)
bev = body.modifiers.new("bevel", "BEVEL")
bev.width, bev.segments, bev.limit_method, bev.harden_normals = 0.22, 6, "ANGLE", True
for p in body.data.polygons:
    p.use_smooth = True
screen = rrect("Screen", 6.82, 14.37, 0.92, m_wall, rig, (0, 0, 0.402))
rrect("Island", 1.9, 0.56, 0.28, m_black, rig, (0, 6.6, 0.41))
Z = 0.412  # UI layer height on the glass

# call screen
text("Lbl_Unknown", "Unknown caller", 0.44, m_grey, rig, (0, 5.3, Z))
text("Lbl_Number", "+91 98XXX XX210", 0.74, m_white, rig, (0, 4.5, Z), SEMI)
timer = text("Lbl_Timer", "00:47", 0.44, m_grey, rig, (0, 3.72, Z), MONO)
rrect("Avatar", 2.2, 2.2, 1.1, m_raised, rig, (0, 1.75, Z))
text("Avatar_Q", "?", 1.0, m_grey, rig, (0, 1.72, Z + 0.002))
labels = (("mute", I_MUTE), ("keypad", I_PAD), ("speaker", I_SPK), ("add call", I_ADD), ("video", I_VID), ("contacts", I_CONTACT))
for i, (lbl, glyph) in enumerate(labels):
    x, y = (-2.15, 0, 2.15)[i % 3], (-1.1, -3.3)[i // 3]
    rrect(f"Btn_{lbl}", 1.46, 1.46, 0.73, m_raised, rig, (x, y, Z))
    text(f"Ico_{lbl}", glyph, 0.62, m_white, rig, (x, y, Z + 0.002), ICON)
    text(f"Lbl_{lbl}", lbl, 0.34, m_muted, rig, (x, y - 1.12, Z))
hang = rrect("Btn_Hang", 1.6, 1.6, 0.8, m_red, rig, (0, -5.6, Z + 0.004))
text("Ico_Hang", I_HANG, 0.7, m_white, hang, (0, 0, 0.002), ICON)


# ---- the KAVACH shield on the side -----------------------------------------
SH_SIDE = (4.55, 1.2, 0.55)
SH_PANEL = (0, 3.55, 0.47)
sh = shield("Kavach_Shield", rig, SH_SIDE, 0.78)
ripple_m, ripple = mat_fade("ripple", INK, 1.0, 0.0)
ripple_ob = ring("Tap_Ripple", 1.0, 0.86, ripple_m, rig, (SH_SIDE[0], SH_SIDE[1], 0.7))
dot_m, dot = mat_fade("tapdot", INK, 1.0, 0.0)
dot_ob = rrect("Tap_Dot", 1.1, 1.1, 0.55, dot_m, rig, (SH_SIDE[0], SH_SIDE[1], 0.75))

# tap -> press -> glide onto the screen (one ease, no overshoot)
key(sh, "scale", F_TAP - 2, s3(0.78))
key(sh, "scale", F_TAP + 1, s3(0.74))  # press: a small scale down
key(sh, "scale", F_TAP + 6, s3(0.78))
key(sh, "location", F_TAP + 6, SH_SIDE)
key(sh, "location", F_ACTIVE, SH_PANEL)
key(sh, "scale", F_ACTIVE, s3(0.5))
key(sh, "scale", F_VERDICT, s3(0.5))
key(sh, "scale", F_VERDICT + 8, s3(0.0001))
# finger tap: dot presses, ripple spreads
key(dot, "fac", F_TAP - 6, 0.0)
key(dot, "fac", F_TAP - 2, 0.18)
key(dot, "fac", F_TAP + 6, 0.0)
key(ripple, "fac", F_TAP - 1, 0.0)  # values before the first key hold the first key
key(ripple, "fac", F_TAP, 0.35)
key(ripple, "fac", F_TAP + 14, 0.0)
key(ripple_ob, "scale", F_TAP, s3(0.4))
key(ripple_ob, "scale", F_TAP + 14, s3(2.6))

# ---- listening panel --------------------------------------------------------
panel = rrect("Listen_Panel", 6.5, 7.4, 0.48, m_card, rig, (0, 0.2, 0.44))  # opaque on purpose
text("Listen_Title", "KAVACH is listening", 0.42, m_grey, panel, (0, 2.3, 0.01))
for i in range(15):
    b = rrect(f"Wave_{i:02d}", 0.12, 1.1, 0.06, m_white, panel, (-2.38 + i * 0.34, 1.35, 0.01))
    key(b, "scale", 1, (1, 0.15, 1))
    for f in range(F_ACTIVE, F_VERDICT, 4):
        key(b, "scale", f, (1, random.uniform(0.15, 1.0) * (1 - abs(i - 7) / 10), 1))
quotes = ("\u201cThis is the CBI calling\u201d", "\u201cYou are under digital arrest\u201d", "\u201cDon\u2019t disconnect the call\u201d")
for i, (q, f) in enumerate(zip(quotes, F_CHIPS)):
    y = 0.15 - i * 1.1
    chip = rrect(f"Chip_{i}", 6.1, 0.94, 0.22, m_raised, panel, (0, y, 0.01))
    rrect(f"Chip_{i}_dot", 0.18, 0.18, 0.09, m_accent, chip, (-2.7, 0, 0.005))
    text(f"Chip_{i}_txt", q, 0.36, m_white, chip, (-2.4, 0, 0.005), align="LEFT")
    pop(chip, f)
    key(chip, "location", f, (0, y - 0.35, 0.01))  # fade-and-rise stand-in: rise into place
    key(chip, "location", f + 10, (0, y, 0.01))
pop(panel, F_TAP + 10, F_VERDICT + 2, dur=12)

# ---- verdict card: leaves the glass (UI-01) ---------------------------------
card = rrect("Verdict_Card", 6.6, 5.6, 0.45, m_card, rig, (0, 0.6, 0.45), thick=0.14)
rrect("Verdict_Line", 6.64, 5.64, 0.47, m_line, card, (0, 0, -0.005))  # hairline edge
shield("Verdict_Shield", card, (-2.75, 2.15, 0.02), 0.22)
text("Verdict_Brand", "KAVACH", 0.36, m_white, card, (-2.35, 2.12, 0.02), SEMI, "LEFT")
pct = text("Verdict_Pct", "0% match", 0.34, m_muted, card, (2.85, 2.12, 0.02), MONO, "RIGHT")
text("Verdict_Head", "Scam call", 1.1, m_red, card, (0, 1.05, 0.02), SEMI)
text("Verdict_Type", "Digital arrest  \u00b7  Fake CBI officer", 0.36, m_grey, card, (0, 0.2, 0.02))
rrect("Meter_Track", 5.6, 0.12, 0.06, m_raised, card, (0, -0.4, 0.02))  # risk meter fills with the %
meter = link(bpy.data.objects.new("Meter_Pivot", None), card, (-2.8, -0.4, 0.025))
rrect("Meter_Fill", 5.6, 0.12, 0.06, m_red, meter, (2.8, 0, 0))
key(meter, "scale", F_VERDICT, (0.0001, 1, 1))
key(meter, "scale", F_VERDICT_END, (0.94, 1, 1))
text("Verdict_Why", "Real police never arrest anyone over a call", 0.36, m_grey, card, (0, -1.15, 0.02), width=5.8)
text("Verdict_Do", "Hang up now", 0.52, m_white, card, (0, -2.15, 0.02), SEMI)
pop(card, F_VERDICT, full=0.7, dur=8)
key(card, "location", F_VERDICT + 6, (0, 0.6, 0.45))
key(card, "location", F_VERDICT_END, (4.9, 0.9, 6.0))
key(card, "scale", F_VERDICT_END, s3(1.1))
key(card, "rotation_euler", F_VERDICT + 6, (0, 0, 0))
key(card, "rotation_euler", F_VERDICT_END, (math.radians(4), math.radians(-14), math.radians(-2)))
key(card, "location", F_HANG_TAP, (4.9, 1.1, 6.1))  # slow float while held
key(card, "scale", F_HANG_TAP, s3(1.1))
key(card, "location", F_HANG_TAP + 12, (13.0, 1.6, 7.0))  # card leaves once the call is cut
key(card, "scale", F_HANG_TAP + 12, s3(0.0001))

# ---- alert toast + hang-up pulse -------------------------------------------
toast = rrect("Toast", 5.9, 1.0, 0.5, m_card, rig, (0, 6.3, 0.5))  # grows out of the island
rrect("Toast_dot", 0.18, 0.18, 0.09, m_green, toast, (-2.5, 0, 0.01))
text("Toast_txt", "Rahul alerted on Telegram", 0.32, m_white, toast, (0.15, 0, 0.01))
pop(toast, F_ALERT, dur=10)
for f in range(F_ALERT, F_HANG_TAP - 8, 16):
    key(hang, "scale", f, s3(1.0))
    key(hang, "scale", f + 8, s3(1.07))
key(hang, "scale", F_HANG_TAP - 1, s3(1.0))
key(hang, "scale", F_HANG_TAP + 2, s3(0.9))  # press
key(hang, "scale", F_HANG_TAP + 7, s3(1.0))
hr_m, hr = mat_fade("hang_tap", WHITE, 1.0, 0.0)
hr_ob = ring("Hang_Tap", 0.95, 0.84, hr_m, rig, (0, -5.6, 0.47))
key(hr, "fac", F_HANG_TAP - 1, 0.0)
key(hr, "fac", F_HANG_TAP, 0.5)
key(hr, "fac", F_HANG_TAP + 12, 0.0)
key(hr_ob, "scale", F_HANG_TAP, s3(1.0))
key(hr_ob, "scale", F_HANG_TAP + 12, s3(1.8))

ended = rrect("Ended", 6.82, 14.37, 0.92, m_wall, rig, (0, 0, 0.48))  # covers the call screen
shield("Ended_Shield", ended, (0, 3.3, 0.06), 0.55)
text("Ended_Title", "Call ended", 0.72, m_white, ended, (0, 1.6, 0.01), SEMI)
text("Ended_Number", "+91 98XXX XX210", 0.44, m_grey, ended, (0, 0.85, 0.01), MONO)
for i, line in enumerate(("Number blocked", "Report waiting for Rahul\u2019s approval")):
    row = rrect(f"Ended_Row_{i}", 6.1, 0.94, 0.22, m_raised, ended, (0, -0.55 - i * 1.1, 0.01))
    rrect(f"Ended_Dot_{i}", 0.18, 0.18, 0.09, m_green if i == 0 else m_accent, row, (-2.7, 0, 0.005))
    text(f"Ended_Row_{i}_txt", line, 0.36, m_white, row, (-2.4, 0, 0.005), align="LEFT")
    pop(row, F_CALL_END + 8 + i * 6, dur=8)
key(ended, "scale", F_CALL_END - 1, s3(0.0001))
key(ended, "scale", F_CALL_END, s3(0.96))
key(ended, "scale", F_CALL_END + 8, s3(1.0))

# ---- 1. typed caption (Whence-style): "Is this call [real?]" ---------------
m_ink, m_subink, m_mutedink = mat_emit("ink", INK), mat_emit("subink", SUBINK), mat_emit("mutedink", MUTEDINK)
cap = link(bpy.data.objects.new("Caption", None), loc=(3.6, -6, 2.2))
cap.rotation_euler = (math.radians(90), 0, 0)
text("Caption_Line", "", 1.7, m_ink, cap, (0, 1.1, 0), SANS, "LEFT")  # body typed by the handler
qbox = rrect("Caption_Box", 5.3, 2.4, 0.32, mat_emit("indigo", INDIGO), cap, (2.55, -1.05, 0))
text("Caption_Real", "real?", 1.7, mat_emit("white_pure", srgb("#FFFFFF")), qbox, (0, 0.08, 0.01), SEMI)
pop(qbox, F_TYPE[1], dur=8)
key(cap, "scale", F_CAPTION_OUT, s3(1.0))
key(cap, "scale", F_CAPTION_OUT + 6, s3(0.0001))

if os.environ.get("KAVACH_NO_CAPTION"):  # the pitch film narrates instead of captioning
    for ob in [cap] + list(cap.children_recursive):
        bpy.data.objects.remove(ob)

# ---- 2. macro close-up of the verdict (Heft-style punch-in, shallow focus) ---
focus = link(bpy.data.objects.new("Macro_Focus", None), card, (-0.3, 0.62, 0.02))
mac_d = bpy.data.cameras.new("K_cam_macro")
mac_d.lens = 85
mac_d.dof.use_dof = True
mac_d.dof.focus_object = focus
mac_d.dof.aperture_fstop = 0.25  # scene units are large; low f-stop gives the macro falloff
mac = link(bpy.data.objects.new("Camera_Macro", mac_d), card)
tr = mac.constraints.new("TRACK_TO")
tr.target, tr.track_axis, tr.up_axis = focus, "TRACK_NEGATIVE_Z", "UP_Y"
key(mac, "location", F_MACRO[0], (6.0, -1.2, 10.0), "LINEAR")
key(mac, "location", F_MACRO[1], (5.6, -1.0, 9.8), "LINEAR")  # slow drift across the word

# ---- screen close-up while KAVACH listens -----------------------------------
scr_focus = link(bpy.data.objects.new("Screen_Focus", None), rig, (0, 0.5, 0.45))
scr_d = bpy.data.cameras.new("K_cam_screen")
scr_d.lens = 50
scr_d.dof.use_dof = True
scr_d.dof.focus_object = scr_focus
scr_d.dof.aperture_fstop = 1.2
cam_scr = link(bpy.data.objects.new("Camera_Screen", scr_d), rig)
tr = cam_scr.constraints.new("TRACK_TO")
tr.target, tr.track_axis, tr.up_axis = scr_focus, "TRACK_NEGATIVE_Z", "UP_Y"
key(cam_scr, "location", F_SCREEN[0], (2.2, -1.4, 23.0), "LINEAR")
key(cam_scr, "location", F_SCREEN[1], (1.2, -0.8, 21.0), "LINEAR")

# ---- 3. end card ------------------------------------------------------------
lock = link(bpy.data.objects.new("Lockup", None), loc=(120, 0, 0))
lock.rotation_euler = (math.radians(90), 0, 0)
end_d = bpy.data.cameras.new("K_cam_end")
end_d.lens = 70
cam_end = link(bpy.data.objects.new("Camera_End", end_d), loc=(120, -44, 0.6))
cam_end.rotation_euler = (math.radians(90), 0, 0)
key(cam_end, "location", F_LOCKUP, (120, -44, 0.6))
key(cam_end, "location", END, (120, -40, 0.5))
lk_sh = shield("Lockup_Shield", lock, (0, 2.7, 0), 1.4)
area("Lock_Key", (104, -26, 14), 6000, 6, target=lk_sh)  # the end card gets its own key light
area("Lock_Rim", (134, 8, 6), 4000, 4, target=lk_sh)
lk_name = text("Lockup_Name", "KAVACH", 2.4, m_ink, lock, (0, -0.55, 0), SEMI)
lk_tag = text("Lockup_Tag", "No Amma left alone with a scammer", 0.85, m_subink, lock, (0, -2.1, 0))
lk_cr = text("Lockup_Credit", "wHACKiest 2026  ·  Track 1: Make MCP Matter", 0.55, m_mutedink, lock, (0, -3.25, 0), SEMI)
pop(lk_sh, F_LOCKUP, full=1.4, dur=10)
pop(lk_name, F_LOCKUP + 8)
pop(lk_tag, F_LOCKUP + 16)
pop(lk_cr, F_LOCKUP + 22)

# camera cuts: wide -> macro -> wide -> end card
for m in [m for m in scene.timeline_markers if m.name.startswith("K_")]:
    scene.timeline_markers.remove(m)
for name, f, c in (("K_wide", 1, None), ("K_screen", F_SCREEN[0], cam_scr), ("K_wide1", F_SCREEN[1], None),
                   ("K_macro", F_MACRO[0], mac), ("K_wide2", F_MACRO[1], None), ("K_end", F_LOCKUP, cam_end)):
    scene.timeline_markers.new(name, frame=f).camera = c or cam

# ---- phone motion: the object acts, the camera stays calm (MOT-02) ----------
key(rig, "location", 1, (-3.4, -1.0, -11.0))
key(rig, "rotation_euler", 1, (math.radians(70), math.radians(-6), math.radians(34)))
key(rig, "location", F_IN_END, (-3.4, 0, 0))
key(rig, "rotation_euler", F_IN_END, (math.radians(91), math.radians(-2), math.radians(18)))
key(rig, "rotation_euler", F_VERDICT, (math.radians(90), 0, math.radians(14)))
key(rig, "rotation_euler", END, (math.radians(90), 0, math.radians(20)))
key(rig, "location", F_HANG_TAP, (-3.55, 0, 0.25))
key(rig, "location", F_CALL_END + 14, (0.4, 0, 0.6))  # phone takes the centre once the card is gone

# ---- live counters (timer ticks, verdict % counts up) ----------------------
def kavach_counters(scn, _dg=None):
    f = scn.frame_current
    t = bpy.data.objects.get("Lbl_Timer")
    p = bpy.data.objects.get("Verdict_Pct")
    if t:
        s = 47 + min(f, F_CALL_END) // FPS
        t.data.body = f"{s // 60:02d}:{s % 60:02d}"
    if p:
        k = max(0.0, min(1.0, (f - F_VERDICT) / (F_VERDICT_END - F_VERDICT)))
        p.data.body = f"{round(94 * (1 - (1 - k) ** 3))}% match"
    c = bpy.data.objects.get("Caption_Line")
    if c:
        line = "Is this call"
        n = max(0, min(len(line), (f - F_TYPE[0]) * len(line) // (F_TYPE[1] - F_TYPE[0])))
        cursor = "|" if (f // 6) % 2 == 0 and f < F_CAPTION_OUT else ""
        c.data.body = line[:n] + cursor

for h in [h for h in bpy.app.handlers.frame_change_pre if h.__name__ == "kavach_counters"]:
    bpy.app.handlers.frame_change_pre.remove(h)
bpy.app.handlers.frame_change_pre.append(kavach_counters)

# ---- render settings --------------------------------------------------------
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x, scene.render.resolution_y = 1920, 1080
scene.render.fps, scene.frame_start, scene.frame_end = FPS, 1, END
scene.eevee.taa_render_samples = 64
scene.render.filter_size = 1.2  # crisper UI type
try:
    scene.eevee.use_raytracing = True
except AttributeError:
    pass
scene.view_settings.view_transform = "Standard"
scene.view_settings.look = "None"

scene.render.use_compositing = False  # unslop: nothing glows

prefs.keyframe_new_interpolation_type = _old_interp
scene.frame_set(150)
print(f"built {len(COL.all_objects)} objects")
