import bpy, math, sys, json, os
from mathutils import Vector
FONT=os.path.abspath('kr_black.otf')
CY=(0.0,0.62,1.0)  # theme cyan (linear-ish)
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s=bpy.context.scene; s.render.engine='CYCLES'; s.cycles.device='CPU'
    s.cycles.samples=10; s.cycles.max_bounces=4; s.cycles.use_adaptive_sampling=True; s.cycles.use_denoising=True; s.render.film_transparent=True
    s.view_settings.view_transform='Standard'; s.view_settings.look='None'
    try: s.cycles.denoiser='OPENIMAGEDENOISE'
    except: pass
    w=bpy.data.worlds.new('w'); s.world=w; w.use_nodes=True
    bg=w.node_tree.nodes['Background']; bg.inputs[0].default_value=(0.35,0.4,0.5,1); bg.inputs[1].default_value=0.35
    return s
def mat_grad(name,top,bot,emit=0.35,metal=0.3,rough=0.25):
    m=bpy.data.materials.new(name); m.use_nodes=True; nt=m.node_tree; N=nt.nodes; L=nt.links
    p=N['Principled BSDF']; tc=N.new('ShaderNodeTexCoord'); sep=N.new('ShaderNodeSeparateXYZ'); cr=N.new('ShaderNodeValToRGB')
    L.new(tc.outputs['Generated'],sep.inputs[0]); L.new(sep.outputs['Y'],cr.inputs[0])
    cr.color_ramp.elements[0].color=(*bot,1); cr.color_ramp.elements[1].color=(*top,1)
    L.new(cr.outputs[0],p.inputs['Base Color']); L.new(cr.outputs[0],p.inputs['Emission Color'])
    p.inputs['Emission Strength'].default_value=emit; p.inputs['Metallic'].default_value=metal; p.inputs['Roughness'].default_value=rough
    p.inputs['Coat Weight'].default_value=0.6
    return m
def mat_flat(name,col,emit=0.0,metal=0.0,rough=0.3,alpha=1.0):
    m=bpy.data.materials.new(name); m.use_nodes=True; p=m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value=(*col,1); p.inputs['Metallic'].default_value=metal; p.inputs['Roughness'].default_value=rough
    if emit: p.inputs['Emission Color'].default_value=(*col,1); p.inputs['Emission Strength'].default_value=emit
    if alpha<1: p.inputs['Alpha'].default_value=alpha
    return m
def text(body,size=1.0,extrude=0.08,offset=0.0,shear=0.18,mat=None,z=0.0,font=None):
    cu=bpy.data.curves.new('t','FONT'); cu.body=body; cu.font=font; cu.size=size; cu.extrude=extrude
    cu.shear=shear; cu.align_x='CENTER'; cu.align_y='CENTER'; cu.bevel_depth=offset if offset>0 else 0.008; cu.bevel_resolution=3
    cu.space_character=0.92
    ob=bpy.data.objects.new('t',cu); bpy.context.scene.collection.objects.link(ob); ob.location.z=z
    if mat: cu.materials.append(mat)
    return ob
def rbox(sx,sy,sz,bev,mat,loc=(0,0,0),seg=6):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc); o=bpy.context.object; o.scale=(sx,sy,sz)
    bpy.ops.object.transform_apply(scale=True); md=o.modifiers.new('b','BEVEL'); md.width=bev; md.segments=seg
    o.data.materials.append(mat); bpy.ops.object.shade_smooth(); return o
def poly(pts,depth,mat,loc=(0,0,0),bev=0.01):
    cu=bpy.data.curves.new('p','CURVE'); cu.dimensions='2D'; sp=cu.splines.new('POLY'); sp.points.add(len(pts)-1)
    for i,(x,y) in enumerate(pts): sp.points[i].co=(x,y,0,1)
    sp.use_cyclic_u=True; cu.extrude=depth; cu.bevel_depth=bev; cu.fill_mode='BOTH'
    o=bpy.data.objects.new('p',cu); bpy.context.scene.collection.objects.link(o); o.location=loc; cu.materials.append(mat); return o
def torus(R,r,mat,loc=(0,0,0),rot=(0,0,0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R,minor_radius=r,location=loc,rotation=rot,major_segments=64,minor_segments=16)
    o=bpy.context.object; o.data.materials.append(mat); bpy.ops.object.shade_smooth(); return o
def cyl(r,d,mat,loc=(0,0,0),rot=(0,0,0)):
    bpy.ops.mesh.primitive_cylinder_add(radius=r,depth=d,location=loc,rotation=rot,vertices=48)
    o=bpy.context.object; o.data.materials.append(mat); bpy.ops.object.shade_smooth()
    md=o.modifiers.new('b','BEVEL'); md.width=min(r,d)*0.2; md.segments=4; return o
def M():
    return dict(face=mat_grad('face',(0.55,0.92,1.0),(0.0,0.42,1.0),emit=0.4,metal=0.25,rough=0.22),
        white=mat_flat('white',(1,1,1),emit=0.3,rough=0.3),
        deep=mat_flat('deep',(0.01,0.06,0.16),rough=0.35,metal=0.3),
        tile=mat_grad('tile',(0.45,0.88,1.0),(0.0,0.40,0.95),emit=0.22,metal=0.35,rough=0.2),
        dark=mat_flat('dark',(0.02,0.025,0.035),rough=0.15,metal=0.2),
        red=mat_flat('red',(1.0,0.05,0.04),emit=4.0),
        cyanem=mat_flat('cyanem',(0.1,0.8,1.0),emit=3.0),
        glass=mat_flat('glass',(0.008,0.02,0.04),rough=0.12,alpha=0.93))
def icon(kind,mt,parent,y0):
    objs=[]
    tile=rbox(0.85,0.85,0.24,0.15,mt['tile'],(0,y0,-0.05)); objs.append(tile)
    w=mt['white']; z=0.10
    if kind=='bolt':
        s=0.0042; pts=[(60,0),(10,80),(45,80),(30,150),(90,55),(55,55),(75,0)]
        objs.append(poly([((x-50)*s,(75-y)*s+y0) for x,y in pts],0.05,w,(0,0,z)))
    elif kind=='box':
        objs.append(rbox(0.5,0.3,0.22,0.04,w,(0,y0-0.08,z+0.06)))
        lid=rbox(0.54,0.06,0.3,0.03,w,(0,y0+0.17,z+0.2)); lid.rotation_euler.x=math.radians(-55); objs.append(lid)
        objs.append(rbox(0.42,0.04,0.02,0.01,mt['dark'],(0,y0-0.02,z+0.18)))
    elif kind=='screen':
        objs.append(rbox(0.62,0.42,0.08,0.05,w,(0,y0,z))); objs.append(rbox(0.52,0.32,0.06,0.03,mt['dark'],(0,y0,z+0.04)))
        for i,c in enumerate([0.32,0.22,0.27]): objs.append(rbox(c,0.04,0.04,0.015,mt['cyanem'],(-0.22+c/2,y0+0.09-i*0.09,z+0.08)))
    elif kind=='wheel':
        objs.append(torus(0.3,0.055,w,(0,y0,z))); objs.append(cyl(0.1,0.08,w,(0,y0,z)))
        objs.append(rbox(0.56,0.07,0.06,0.02,w,(0,y0,z))); objs.append(rbox(0.07,0.28,0.06,0.02,w,(0,y0-0.15,z)))
    elif kind=='lamp':
        objs.append(torus(0.28,0.06,w,(0,y0,z))); objs.append(cyl(0.2,0.06,mt['red'],(0,y0,z)))
    elif kind=='grille':
        objs.append(rbox(0.66,0.46,0.06,0.08,w,(0,y0,z)))
        for i in range(7): objs.append(rbox(0.035,0.36,0.08,0.012,mt['dark'],(-0.24+i*0.08,y0,z+0.03)))
    for o in objs: o.parent=parent
def feature(label,ic,mt,root,size=1.0):
    f=bpy.data.fonts.load(FONT)
    grp=bpy.data.objects.new('g',None); bpy.context.scene.collection.objects.link(grp); grp.parent=root
    ts=(text(label,1,0.05,0.0,0.16,mt['face'],0.07,f), text(label,1,0.03,0.022,0.16,mt['white'],0.0,f),
              text(label,1,0.10,0.022,0.16,mt['deep'],-0.16,f))
    for o in ts: o.parent=grp
    bpy.context.view_layer.update(); d=ts[1].dimensions
    k=3.4*size/max(d.x,0.01); grp.scale=(k,k,k); th=d.y*k
    if ic: icon(ic,mt,root,th/2+0.55)
def ftext(body,h,layers,f,parent,loc,align='CENTER',maxw=None,zfix=False):
    """layers: list of (mat,extrude,outline,z). scaled so glyph height == h"""
    g=bpy.data.objects.new('g',None); bpy.context.scene.collection.objects.link(g); g.parent=parent; g.location=loc
    ts=[]
    for m,ex,ol,z in layers:
        t=text(body,1,ex,ol,0.14,m,z,f); t.data.align_x=align; t.parent=g; ts.append(t)
    bpy.context.view_layer.update(); d=ts[0].dimensions; k=h/max(d.y,0.01)
    if maxw and d.x*k>maxw: k=maxw/d.x
    g.scale=(k,k,k)
    if zfix:
        for t in ts: t.location.z/=k
    return g
def badge(lab,num,unit,mt,root):
    f=bpy.data.fonts.load(FONT)
    rbox(3.5,1.25,0.22,0.6,mt['white'],(0,0,-0.06)).parent=root
    rbox(3.36,1.11,0.26,0.54,mt['tile'],(0,0,0)).parent=root
    ftext(num,0.72,[(mt['white'],0.05,0,0.14),(mt['deep'],0.1,0.02,0.02)],f,root,(-0.25,0,0),maxw=2.0)
    ftext(unit,0.36,[(mt['white'],0.04,0,0.14)],f,root,(1.22,-0.12,0))
    ftext(lab,0.42,[(mt['face'],0.05,0,0.06),(mt['white'],0.03,0.02,0.0),(mt['deep'],0.08,0.02,-0.1)],f,root,(0,0.98,0))
def pills(items,mt,root):
    f=bpy.data.fonts.load(FONT)
    for i,s in enumerate(items):
        y=0.6-i*1.2; x=-0.35+i*0.7
        rbox(3.2,1.0,0.2,0.48,mt['white'],(x,y,-0.05)).parent=root
        rbox(3.06,0.86,0.24,0.42,mt['tile'],(x,y,0)).parent=root
        ftext(s,0.46,[(mt['white'],0.05,0,0.13),(mt['deep'],0.08,0.015,0.03)],f,root,(x,y,0),maxw=2.6)
def glass(title,rows,mt,root):
    f=bpy.data.fonts.load(FONT); h=0.95*len(rows)+0.8
    rbox(4.62,h+0.12,0.08,0.3,mt['cyanem'],(0,-0.45,-0.1)).parent=root
    rbox(4.5,h,0.14,0.26,mt['glass'],(0,-0.45,0)).parent=root
    rbox(4.0,0.55,0.18,0.27,mt['tile'],(0,h/2-0.2,0.06)).parent=root
    ftext(title,0.26,[(mt['dark'],0.03,0,0.16)],f,root,(0,h/2-0.2,0),maxw=3.6,zfix=True)
    for i,(n,u) in enumerate(rows):
        y=h/2-1.05-i*0.95
        ftext(n,0.5,[(mt['white'],0.05,0,0.1),(mt['deep'],0.08,0.015,0.02)],f,root,(0.75,y,0),align='RIGHT',maxw=2.3)
        rbox(1.15,0.5,0.1,0.2,mt['tile'],(1.45,y,0.06)).parent=root
        ftext(u,0.26,[(mt['dark'],0.03,0,0.12)],f,root,(1.45,y,0),zfix=True)
def easeback(t,c=1.7):
    t=min(max(t,0),1); return 1+(c+1)*(t-1)**3+c*(t-1)**2
def build(spec,out,res=(720,504),frames=60,still=None):
    s=reset(); mt=M()
    root=bpy.data.objects.new('root',None); s.collection.objects.link(root)
    k=spec['kind']
    if k=='feature': feature(spec['label'],spec.get('icon'),mt,root,spec.get('size',1.0))
    elif k=='badge': badge(spec['lab'],spec['num'],spec['unit'],mt,root)
    elif k=='pills': pills(spec['items'],mt,root)
    elif k=='glass': glass(spec['title'],spec['rows'],mt,root)
    bpy.context.view_layer.update()
    # bounds
    xs=[];ys=[]
    for o in s.objects:
        if o.type in('MESH','FONT','CURVE'):
            for v in o.bound_box:
                w=o.matrix_world@Vector(v); xs.append(w.x); ys.append(w.y)
    cx,cy=(min(xs)+max(xs))/2,(min(ys)+max(ys))/2; bw,bh=max(xs)-min(xs),max(ys)-min(ys)
    for o in s.objects:
        if o.parent==root: o.location.x-=cx; o.location.y-=cy
    cam=bpy.data.objects.new('cam',bpy.data.cameras.new('c')); s.collection.objects.link(cam); s.camera=cam
    cam.data.lens=85; asp=res[0]/res[1]
    fitw=max(bw,bh*asp)*1.18; dist=fitw/(36/85)
    cam.location=(0,0,dist); cam.data.sensor_fit='HORIZONTAL'
    s.render.resolution_x,s.render.resolution_y=res; s.render.resolution_percentage=100
    def area(name,loc,size,energy,col=(1,1,1)):
        l=bpy.data.lights.new(name,'AREA'); l.size=size; l.energy=energy; l.color=col
        o=bpy.data.objects.new(name,l); s.collection.objects.link(o); o.location=loc
        o.rotation_euler=(Vector((0,0,0))-Vector(loc)).to_track_quat('-Z','Y').to_euler(); return o
    sc=dist/10
    area('key',(-4*sc,5*sc,8*sc),6*sc,380*sc*sc); area('fill',(5*sc,-2*sc,6*sc),8*sc,110*sc*sc,(0.7,0.85,1))
    area('rim',(0,3*sc,-5*sc),6*sc,500*sc*sc,(0.4,0.8,1))
    sw=area('sweep',(-8*sc,0,3*sc),1.2*sc,0)
    sw.data.shape='RECTANGLE'; sw.data.size=2.2*sc; sw.data.size_y=14*sc
    s.frame_start=0; s.frame_end=frames-1
    for f in range(frames):
        rx0=math.radians(spec.get('rx',8))
        if f<15:
            e=easeback(f/14); ry=math.radians(80)*(1-e); scl=0.55+0.45*min(1,1-(1-f/10)**3) if f<10 else 1; rx=rx0
        else:
            if f<25: ph=-(f-15)/10*math.pi/2
            else: ph=-math.pi/2+(f-25)/19*math.pi
            ry=0.07*math.sin(ph); rx=rx0+0.035*math.sin(ph); scl=1
        root.rotation_euler=(-rx,ry,0); root.scale=(scl,scl,scl)
        root.keyframe_insert('rotation_euler',frame=f); root.keyframe_insert('scale',frame=f)
        if 15<=f<25: sw.location.x=(-8+16*(f-15)/9)*sc; sw.data.energy=900*sc*sc
        else: sw.data.energy=0
        sw.keyframe_insert('location',frame=f); sw.data.keyframe_insert('energy',frame=f)
    s.render.image_settings.file_format='PNG'; s.render.image_settings.color_mode='RGBA'
    if still is not None:
        s.frame_set(still); s.render.filepath=out; bpy.ops.render.render(write_still=True)
    else:
        s.render.filepath=out+'/f_'; bpy.ops.render.render(animation=True)
if __name__=='__main__':
    spec=json.loads(sys.argv[-3]); out=sys.argv[-2]; mode=sys.argv[-1]
    if mode=='still': build(spec,out,still=40)
    else: build(spec,out,frames=int(mode))
