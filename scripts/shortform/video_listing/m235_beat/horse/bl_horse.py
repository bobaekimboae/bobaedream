# 블렌더 3D 금속 말(달리기) — three.js 예제 Horse.glb(MIT, 형태 키 달리기 동작) · 투명 RGBA
# 사용: ~/.venv-bpy/bin/python bl_horse.py outdir nframes samples [only_frame]
import bpy, sys, math, os
OUT, NF, SAMP = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]); ONLY = int(sys.argv[4]) if len(sys.argv) > 4 else None
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SAMP; sc.cycles.use_denoising = True
sc.render.resolution_x = sc.render.resolution_y = 720
sc.render.film_transparent = True; sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
sc.view_settings.view_transform = 'Standard'
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.04, 0.04, 0.05, 1)
bpy.ops.import_scene.gltf(filepath=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Horse.glb'))
h = [o for o in sc.objects if o.type == 'MESH'][0]
s = 1 / 100.0; h.scale = (s, s, s); h.location = (0, 0, -0.9); h.rotation_euler = (0, 0, math.radians(float(os.environ.get('HORSE_ROT', 0))))
m = bpy.data.materials.new('gold'); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
b.inputs['Base Color'].default_value = (1.0, 0.74, 0.22, 1); b.inputs['Metallic'].default_value = 1.0; b.inputs['Roughness'].default_value = 0.22
h.data.materials.clear(); h.data.materials.append(m)
for p in h.data.polygons: p.use_smooth = False
def emit(name, loc, rot, size, strength, color=(1, 1, 1)):
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot); o = bpy.context.object; o.scale = (size[0], size[1], 1)
    mm = bpy.data.materials.new(name); mm.use_nodes = True; nt = mm.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    e = nt.nodes.new('ShaderNodeEmission'); e.inputs[0].default_value = (*color, 1); e.inputs[1].default_value = strength
    out = nt.nodes.new('ShaderNodeOutputMaterial'); nt.links.new(e.outputs[0], out.inputs[0]); o.data.materials.append(mm); o.visible_camera = False
emit('key', (8, -4, 6), (0, math.radians(55), math.radians(-30)), (6, 6), 6)
emit('top', (0, 0, 9), (0, 0, 0), (12, 12), 3)
emit('rim', (-8, 5, 3), (0, math.radians(-70), math.radians(30)), (3, 10), 10, (1, 0.9, 0.7))
emit('fill', (6, 6, 1), (0, math.radians(80), math.radians(40)), (5, 5), 2.5)
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
cam.data.lens = 50; cam.location = (5.0, -1.25, 0.55); cam.rotation_euler = (math.radians(86), 0, math.radians(76))
os.makedirs(OUT, exist_ok=True)
act = bpy.data.actions[0]; f0, f1 = act.frame_range
for k in range(NF):
    if ONLY is not None and k != ONLY: continue
    sc.frame_set(int(f0 + (f1 - f0) * k / NF), subframe=((f1 - f0) * k / NF) % 1)
    sc.render.filepath = f'{OUT}/{k:03d}.png'; bpy.ops.render.render(write_still=True)
print('DONE')
