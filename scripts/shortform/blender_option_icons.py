"""보배드림 숏폼용 3D 옵션 아이콘 세트 (Blender bpy, Cycles CPU).

나세르 영상의 '점토 질감 3D 팝업 아이콘'을 오픈소스로 직접 만든다.
- 몸체: 무광 흰 점토 #F4F5F6, 음영 #D9DDE1
- 기능부: 그래파이트 #24292F
- 포인트: 보배드림 파랑 #306BD9 (발광), 빛: 노랑 #F4F209
- 투명 배경 600x600 PNG, 3/4 각도, 정사영

실행: python3 scripts/shortform/blender_option_icons.py <출력폴더>
"""
import math
import sys

import bpy

OUT = sys.argv[1] if len(sys.argv) > 1 else "/tmp/icons"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
SIZE = 900
SAMPLES = 64


def hexc(h, a=1.0):
    h = h.lstrip("#")
    srgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in srgb]
    return (*lin, a)


def mat(name, color, rough=0.55, emit=0.0, coat=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = hexc(color)
    b.inputs["Roughness"].default_value = rough
    if coat:
        b.inputs["Coat Weight"].default_value = coat
        b.inputs["Coat Roughness"].default_value = 0.15
    if emit:
        b.inputs["Emission Color"].default_value = hexc(color)
        b.inputs["Emission Strength"].default_value = emit
    return m


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = SAMPLES
    sc.cycles.use_denoising = True
    sc.render.film_transparent = True
    sc.render.resolution_x = sc.render.resolution_y = SIZE
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "Medium High Contrast"
    w = bpy.data.worlds.new("w")
    sc.world = w
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs[0].default_value = (0.9, 0.92, 0.95, 1)
    w.node_tree.nodes["Background"].inputs[1].default_value = 0.35
    # 카메라: 3/4 위에서, 정사영
    bpy.ops.object.camera_add(location=(6.2, -7.4, 6.0))
    cam = bpy.context.object
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = 4.6
    look_at(cam, (0, 0, 0.25))
    sc.camera = cam
    # 빛: 큰 키 라이트 + 채움 + 뒤 테두리
    area((-3, -4, 6), 900, 5, (0, 0, 0))
    area((5, -1, 2), 220, 4, (0, 0, 0))
    area((0, 6, 4), 500, 3, (0, 0, 0))
    # 그림자 받는 바닥(투명 배경에 그림자만)
    bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, 0))
    fl = bpy.context.object
    fl.is_shadow_catcher = True


def look_at(obj, target):
    from mathutils import Vector
    d = Vector(target) - obj.location
    obj.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def area(loc, power, size, target):
    bpy.ops.object.light_add(type="AREA", location=loc)
    l = bpy.context.object
    l.data.energy = power
    l.data.size = size
    look_at(l, target)


def bevel(obj, width=0.12, seg=6):
    m = obj.modifiers.new("bev", "BEVEL")
    m.width = width
    m.segments = seg
    m.limit_method = "ANGLE"
    obj.modifiers.new("sm", "WEIGHTED_NORMAL")
    bpy.ops.object.shade_smooth()


def box(sx, sy, sz, loc, m, bev=0.12, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot)
    o = bpy.context.object
    o.scale = (sx / 2, sy / 2, sz / 2)
    bpy.ops.object.transform_apply(scale=True)
    bevel(o, bev)
    o.data.materials.append(m)
    return o


def cyl(r, depth, loc, m, rot=(0, 0, 0), bev=0.04, verts=64):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, rotation=rot, vertices=verts)
    o = bpy.context.object
    bevel(o, bev)
    o.data.materials.append(m)
    return o


def torus(R, r, loc, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, location=loc, rotation=rot,
                                     major_segments=96, minor_segments=24)
    o = bpy.context.object
    bpy.ops.object.shade_smooth()
    o.data.materials.append(m)
    return o


def arc(R, r, start, end, loc, m, rot=(0, 0, 0)):
    """원호 튜브: 커브에 두께를 줘서 만든다."""
    cu = bpy.data.curves.new("arc", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = r
    cu.bevel_resolution = 6
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    n = 64
    sp.points.add(n - 1)
    for i in range(n):
        a = math.radians(start + (end - start) * i / (n - 1))
        sp.points[i].co = (R * math.cos(a), R * math.sin(a), 0, 1)
    o = bpy.data.objects.new("arc", cu)
    bpy.context.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = rot
    o.data.materials.append(m)
    return o


def text(s, size, loc, m, rot=(0, 0, 0), ext=0.05):
    cu = bpy.data.curves.new("t", "FONT")
    cu.body = s
    cu.font = bpy.data.fonts.load(FONT)
    cu.size = size
    cu.extrude = ext
    cu.align_x = "CENTER"
    cu.align_y = "CENTER"
    o = bpy.data.objects.new("t", cu)
    bpy.context.collection.objects.link(o)
    o.location = loc
    o.rotation_euler = rot
    o.data.materials.append(m)
    return o


def frame():
    """아이콘 크기를 화면의 약 75%로 맞춘다(바닥 제외 물체 기준)."""
    from mathutils import Vector
    bpy.context.view_layer.update()
    cam = bpy.context.scene.camera
    dg = bpy.context.evaluated_depsgraph_get()
    inv = cam.matrix_world.inverted()
    xs, ys, pts = [], [], []
    for o in bpy.context.scene.objects:
        if o.type not in ("MESH", "CURVE", "FONT") or o.is_shadow_catcher:
            continue
        oe = o.evaluated_get(dg)
        for c in oe.bound_box:
            w = oe.matrix_world @ Vector(c)
            v = inv @ w
            xs.append(v.x); ys.append(v.y); pts.append(w)
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    shift = cam.matrix_world.to_3x3() @ Vector((cx, cy, 0))
    cam.location += shift
    cam.data.ortho_scale = max(max(xs) - min(xs), max(ys) - min(ys)) / 0.86


def render(name):
    bpy.context.scene.render.filepath = f"{OUT}/{name}.png"
    bpy.ops.render.render(write_still=True)
    trim(f"{OUT}/{name}.png")
    print("saved", name)


def trim(path, out=600, margin=0.08):
    """물체(불투명 부분) 기준으로 가운데 정렬해 정사각 600으로 자른다. 옅은 그림자는 남긴다."""
    import numpy as np
    from PIL import Image
    im = Image.open(path).convert("RGBA")
    a = np.array(im)[:, :, 3]
    ys, xs = np.where(a > 200)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    side = int(max(x1 - x0, y1 - y0) * (1 + 2 * margin))
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    box = (cx - side // 2, cy - side // 2, cx - side // 2 + side, cy - side // 2 + side)
    im.crop(box).resize((out, out), Image.LANCZOS).save(path)


def mats():
    return dict(
        clay=mat("clay", "#F4F5F6", 0.55, coat=0.35),
        shade=mat("shade", "#D9DDE1", 0.6),
        dark=mat("dark", "#24292F", 0.35, coat=0.5),
        blue=mat("blue", "#306BD9", 0.3, emit=2.5, coat=0.4),
        blue_s=mat("blue_s", "#306BD9", 0.35, coat=0.5),
        light=mat("light", "#F4F209", 0.2, emit=6.0),
        white_e=mat("white_e", "#EAF2FF", 0.2, emit=5.0),
        red=mat("red", "#E5484D", 0.3, emit=1.5, coat=0.4),
    )


UP = (math.radians(90), 0, 0)  # 앞(-Y)을 보도록 세우기


def icon_headlamp():
    reset(); M = mats()
    box(2.6, 0.9, 1.3, (0, 0, 0.65), M["clay"], 0.25)
    box(2.2, 0.2, 0.9, (0, -0.42, 0.68), M["dark"], 0.18)
    for i, x in enumerate((-0.7, 0, 0.7)):  # LED 세 칸
        box(0.55, 0.12, 0.2, (x, -0.55, 0.88), M["light"], 0.06)
    box(1.9, 0.12, 0.08, (0, -0.55, 0.5), M["blue"], 0.03)  # 주간주행등 띠
    render("icon_led_headlamp")


def icon_cluster():
    reset(); M = mats()
    box(2.8, 0.7, 1.6, (0, 0, 0.8), M["clay"], 0.28)
    box(2.4, 0.15, 1.25, (0, -0.33, 0.82), M["dark"], 0.15)
    for x in (-0.62, 0.62):
        arc(0.42, 0.05, -40, 220, (x, -0.43, 0.82), M["shade"], rot=UP)
        arc(0.42, 0.06, 100, 220, (x, -0.45, 0.82), M["blue"], rot=UP)
    box(0.05, 0.05, 0.4, (-0.62, -0.46, 0.94), M["red"], 0.02, rot=(0, math.radians(35), 0))
    render("icon_digital_cluster")


def icon_shift():
    reset(); M = mats()
    box(1.4, 2.4, 0.35, (0, 0, 0.18), M["clay"], 0.16)
    for i, ch in enumerate("PRND"):
        y = 0.8 - i * 0.53
        mm = M["blue_s"] if ch == "D" else M["dark"]
        cyl(0.24, 0.16, (0, y, 0.42), mm)
        text(ch, 0.5, (0, y, 0.52), M["clay"], ext=0.02)
    render("icon_button_shift")


def icon_svm():
    reset(); M = mats()
    # 위에서 본 차 + 둘레 360 화살표
    box(1.0, 1.9, 0.45, (0, 0, 0.25), M["clay"], 0.3)
    box(0.8, 0.9, 0.3, (0, 0.05, 0.55), M["dark"], 0.2)
    torus(1.45, 0.06, (0, 0, 0.12), M["blue"])
    bpy.ops.mesh.primitive_cone_add(radius1=0.18, depth=0.35, location=(1.45, 0, 0.12),
                                    rotation=(math.radians(-90), 0, 0))
    bpy.context.object.data.materials.append(M["blue"])
    for a in (45, 135, 225, 315):  # 카메라 네 개
        r = math.radians(a)
        cyl(0.13, 0.12, (0.9 * math.cos(r), 1.1 * math.sin(r), 0.4), M["dark"])
    render("icon_surround_view")


def icon_price():
    reset(); M = mats()
    o = box(1.6, 0.35, 2.0, (0, 0, 1.0), M["blue_s"], 0.22, rot=(0, math.radians(-12), 0))
    cyl(0.14, 0.5, (0.12, 0, 1.7), M["clay"], rot=UP)
    text("₩", 0.9, (-0.05, -0.2, 0.85), M["clay"], rot=(math.radians(90), math.radians(-12), 0), ext=0.06)
    render("icon_price_tag")


def icon_fuel():
    reset(); M = mats()
    box(1.3, 0.9, 2.0, (0, 0, 1.0), M["clay"], 0.22)
    box(0.9, 0.12, 0.55, (0, -0.45, 1.45), M["dark"], 0.1)
    box(0.6, 0.06, 0.12, (0, -0.53, 1.5), M["blue"], 0.03)
    arc(0.45, 0.07, -90, 90, (0.65, 0, 1.0), M["dark"], rot=UP)
    box(0.22, 0.3, 0.45, (1.1, 0, 1.45), M["blue_s"], 0.06)
    render("icon_fuel")


if __name__ == "__main__":
    # 메모리를 아끼려고 아이콘 하나씩 따로 그린다: 두 번째 인자로 이름(headlamp 등) 지정 가능
    names = sys.argv[2:] or ["headlamp", "cluster", "shift", "svm", "price", "fuel"]
    for n in names:
        globals()[f"icon_{n}"]()
