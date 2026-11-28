# 나세르식 히어로 모델명 3D (Blender 5 bpy, 투명 RGBA)
# 크롬 앞면 + 브랜드색 옆면 + 테두리 빛 + 솟아오르기 + 빛 쓸기
# 사용: ~/.venv-bpy/bin/python bl_hero_text.py TEXT OUTDIR [frames] [samples] [side_r,g,b]
import bpy, sys, math, os
a = sys.argv[1:]
TEXT = a[0]; OUT = a[1]; NF = int(a[2]) if len(a) > 2 else 24; SAMP = int(a[3]) if len(a) > 3 else 16
SIDE = tuple(float(v) for v in a[4].split(',')) if len(a) > 4 else (0.62, 0.02, 0.03)   # 페라리 레드
FONT = '/usr/share/fonts/opentype/inter/InterDisplay-BlackItalic.otf'
RX, RY = int(os.environ.get('BL_RX', 1620)), int(os.environ.get('BL_RY', 720))

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SAMP; sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y = RX, RY
sc.render.film_transparent = True
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
sc.view_settings.view_transform = 'Standard'

# 반사용 환경: 위 어두운 남색 · 수평선 밝은 띠 · 아래 어두움 (크롬이 비출 거리)
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; nt = w.node_tree
for n in list(nt.nodes): nt.nodes.remove(n)
tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); cr = nt.nodes.new('ShaderNodeValToRGB')
bg = nt.nodes.new('ShaderNodeBackground'); out = nt.nodes.new('ShaderNodeOutputWorld')
nt.links.new(tc.outputs['Generated'], sep.inputs[0]); nt.links.new(sep.outputs['Z'], cr.inputs[0])
nt.links.new(cr.outputs[0], bg.inputs[0]); nt.links.new(bg.outputs[0], out.inputs[0])
el = cr.color_ramp.elements
el[0].position = 0.0; el[0].color = (0.01, 0.01, 0.012, 1); el[1].position = 1.0; el[1].color = (0.02, 0.03, 0.08, 1)
for p, c in ((0.46, (0.08, 0.08, 0.09, 1)), (0.5, (1.6, 1.6, 1.7, 1)), (0.53, (0.25, 0.25, 0.28, 1)), (0.62, (0.05, 0.06, 0.1, 1))):
    e = el.new(p); e.color = c
bg.inputs[1].default_value = 1.0

cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.lens = 50; cam.location = (0, -16, -1.2); cam.rotation_euler = (math.radians(94), 0, 0)   # 살짝 올려다봄(웅장하게)


def plane_light(name, loc, rot, size, strength, color):
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object; o.name = name; o.scale = (size[0], size[1], 1)
    m = bpy.data.materials.new(name); m.use_nodes = True; t = m.node_tree
    for n in list(t.nodes): t.nodes.remove(n)
    e = t.nodes.new('ShaderNodeEmission'); e.inputs[0].default_value = (*color, 1); e.inputs[1].default_value = strength
    o_ = t.nodes.new('ShaderNodeOutputMaterial'); t.links.new(e.outputs[0], o_.inputs[0])
    o.data.materials.append(m); o.visible_camera = False; return o


plane_light('key', (0, -6, 9), (math.radians(35), 0, 0), (24, 3), 4.0, (1, 1, 1))
plane_light('rimR', (9, 4, 0), (0, math.radians(80), 0), (2, 12), 14.0, (1.0, 0.08, 0.05))   # 오른쪽 뒤 빨간 테두리 빛
plane_light('rimL', (-9, 4, 0), (0, math.radians(-80), 0), (2, 12), 8.0, (1.0, 0.35, 0.25))
plane_light('front', (0, -34, 4.5), (math.radians(80), 0, 0), (40, 7), 2.6, (1, 1, 1))   # 앞 위쪽 넓은 빛(크롬 윗면 은빛)
plane_light('frontlo', (0, -34, -6), (math.radians(100), 0, 0), (40, 3), 0.7, (0.8, 0.85, 1))
strip = plane_light('strip', (-30, -5, 0), (math.radians(90), math.radians(20), 0), (1.0, 30), 40.0, (1, 1, 1))   # 지나가는 빛 띠

def mat(name, col, metal, rough, coat=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Metallic'].default_value = metal; b.inputs['Roughness'].default_value = rough
    try: b.inputs['Coat Weight'].default_value = coat
    except Exception: pass
    return m

face = mat('face', (0.95, 0.95, 0.97), 1.0, 0.12)
side = mat('side', SIDE, 0.35, 0.3, 1.0)

cu = bpy.data.curves.new('t', 'FONT'); cu.body = TEXT; cu.font = bpy.data.fonts.load(FONT)
cu.align_x = 'CENTER'; cu.align_y = 'CENTER'; cu.size = 1.0; cu.extrude = 0.32; cu.bevel_depth = 0.045; cu.bevel_resolution = 4
cu.space_character = 0.92; cu.space_word = 2.4
o = bpy.data.objects.new('t', cu); sc.collection.objects.link(o)
bpy.context.view_layer.update()
me = bpy.data.meshes.new_from_object(o.evaluated_get(bpy.context.evaluated_depsgraph_get()))
mo = bpy.data.objects.new('tm', me); sc.collection.objects.link(mo); sc.collection.objects.unlink(o)
me.materials.append(face); me.materials.append(side)
for pl in me.polygons: pl.material_index = 0 if pl.normal.z > 0.55 else 1
bpy.context.view_layer.update()
s = 10.2 / mo.dimensions.x; mo.scale = (s, s, s)
os.makedirs(OUT, exist_ok=True)


def backout(u):
    u = min(1.0, max(0.0, u)); c1 = 1.7; return 1 + (c1 + 1) * (u - 1) ** 3 + c1 * (u - 1) ** 2


for k in range(NF):
    u = k / max(1, NF - 1)
    g = backout(u / 0.75)
    mo.rotation_euler = (math.radians(90 - 70 * (1 - g)), 0, math.radians(-6 * (1 - g)))   # 누운 채 → 일어섬
    mo.location = (0, 0, -4.0 * (1 - g))
    q = min(1.0, max(0.0, (u - 0.45) / 0.55)); strip.location = (-26 + 52 * q, -5, 0)
    sc.render.filepath = f'{OUT}/{k:03d}.png'; bpy.ops.render.render(write_still=True)
    print('frame', k, flush=True)
print('DONE')
