# Blender 5 bpy: 나세르식 금속 3D 글자 애니메이션 (투명 RGBA, 1080x720)
# 사용: ~/.venv-bpy/bin/python bl_gold.py jobs.json outdir [samples]
import bpy, sys, json, math, os
args = sys.argv[1:]
JOBS = json.load(open(args[0])); OUT = args[1]; SAMP = int(args[2]) if len(args) > 2 else 16
FONT_KR = '/tmp/pt/package/dist/public/static/Pretendard-Black.otf'

def setup():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SAMP; sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = (int(os.environ.get('BL_RX', 1080)), int(os.environ.get('BL_RY', 720)))
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
    sc.view_settings.view_transform = 'Standard'
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam)
    cam.data.type = 'PERSP'; cam.data.sensor_fit = 'HORIZONTAL'; cam.data.sensor_width = 36; cam.data.lens = 60
    cam.location = (0, 0, 18); sc.camera = cam      # 가로 보이는 폭 = 18*36/60 = 10.8
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    w.node_tree.nodes['Background'].inputs[0].default_value = (0.03, 0.03, 0.035, 1)
    return sc

def emit(name, loc, rot, size, strength, color=(1, 1, 1)):
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object; o.name = name; o.scale = (size[0], size[1], 1)
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    e = nt.nodes.new('ShaderNodeEmission'); e.inputs[0].default_value = (*color, 1); e.inputs[1].default_value = strength
    out = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(e.outputs[0], out.inputs[0])
    o.data.materials.append(m); o.visible_camera = False
    return o

def metal(name, col, rough):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Metallic'].default_value = 1.0
    b.inputs['Roughness'].default_value = rough
    return m

MATS = {'gold': ((1.0, 0.72, 0.28), 0.18), 'chrome': ((0.93, 0.93, 0.95), 0.08), 'green': ((0.25, 0.95, 0.35), 0.2)}

for job in JOBS:
    sc = setup()
    emit('top', (0, 6, 14), (math.radians(-30), 0, 0), (30, 4), 3.0)
    emit('bot', (0, -8, 12), (math.radians(35), 0, 0), (30, 3), 1.6, (1.0, 0.85, 0.5))
    strip = emit('strip', (-20, 0, 16), (0, math.radians(15), math.radians(12)), (1.2, 40), 22)
    emit('rimL', (-10, 0, 4), (0, math.radians(-70), 0), (2, 30), 6)
    emit('rimR', (10, 0, 4), (0, math.radians(70), 0), (2, 30), 6)
    col, rough = (tuple(job['col']), job.get('rough', 0.12)) if 'col' in job else MATS[job.get('mat', 'gold')]
    face = metal('face', col, rough)
    if job.get('face') == 'white':
        b = face.node_tree.nodes['Principled BSDF']; b.inputs['Metallic'].default_value = 0.0; b.inputs['Roughness'].default_value = 0.22
        try: b.inputs['Coat Weight'].default_value = 1.0
        except Exception: pass
    side = metal('side', tuple(job.get('side', [c * 0.55 for c in col])), rough + 0.12)
    cu = bpy.data.curves.new('t', 'FONT'); cu.body = job.get('ref', job['frames'][-1]['text'])
    cu.font = bpy.data.fonts.load(job.get('font', FONT_KR)); cu.align_x = 'CENTER'; cu.align_y = 'CENTER'
    cu.size = 1.0; cu.extrude = job.get('depth', 0.18); cu.bevel_depth = job.get('bevel', 0.035); cu.bevel_resolution = 3
    o = bpy.data.objects.new('t', cu); sc.collection.objects.link(o)
    o.data.materials.append(face); o.data.materials.append(side)
    bpy.context.view_layer.update()
    if job.get('face') == 'white':     # 옆면에 색 재질 지정 (글자 → 메시)
        me = bpy.data.meshes.new_from_object(o.evaluated_get(bpy.context.evaluated_depsgraph_get()))
        mo = bpy.data.objects.new('tm', me); sc.collection.objects.link(mo); sc.collection.objects.unlink(o)
        me.materials.clear(); me.materials.append(face); me.materials.append(side)
        for pl in me.polygons: pl.material_index = 0 if pl.normal.z > 0.6 else 1
        o = mo; bpy.context.view_layer.update()
    base_w = job.get('width', 8.0)
    s0 = base_w / max(0.01, o.dimensions.x)
    os.makedirs(f"{OUT}/{job['name']}", exist_ok=True)
    for k, fr in enumerate(job['frames']):
        if fr['text'] != cu.body: cu.body = fr['text']
        s = s0 * fr.get('s', 1.0); o.scale = (s, s, s)
        o.rotation_euler = [math.radians(v) for v in fr.get('rot', (0, 0, 0))]
        o.location = (fr.get('x', 0), fr.get('y', 0), fr.get('z', 0))
        strip.location = (-20 + 40 * fr.get('sweep', 0), 0, 16)
        sc.render.filepath = f"{OUT}/{job['name']}/{k:03d}.png"
        bpy.ops.render.render(write_still=True)
    print('JOB', job['name'], len(job['frames']))
print('DONE')
