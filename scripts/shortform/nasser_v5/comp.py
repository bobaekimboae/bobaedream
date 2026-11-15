import cv2, numpy as np, json, subprocess, math, sys
from scipy.signal import savgol_filter
W,H,FPS=1080,1920,30
AN='../bl/anim'
words=json.load(open('words.json'))['words']
def ws(txt,after=0): return next(w['start'] for w in words if txt in w['text'] and w['start']>=after-1e-6)
def we(txt,after=0): return next(w['end'] for w in words if txt in w['text'] and w['start']>=after-1e-6)
tl=json.load(open('timeline.json')); segs=[(r['out_s'],r['out_e']) for r in tl]; cuts=[s for s,_ in segs]
import os
CH=json.load(open(os.environ.get('CHIPS','chips.json')))   # list of dict(key,anchor,after,out,pos,width,roi,plane)
SC=0.5; cap=cv2.VideoCapture('base.mp4'); grays=[]
while True:
    ok,f=cap.read()
    if not ok: break
    grays.append(cv2.resize(cv2.cvtColor(f,cv2.COLOR_BGR2GRAY),None,fx=SC,fy=SC,interpolation=cv2.INTER_AREA))
N=min(len(grays),int(os.environ.get('LIMIT','99999'))); grays=grays[:N]
def seg_end(n):
    t=n/FPS
    for a,b in segs:
        if a-1e-6<=t<b-1e-6: return int(round(b*FPS))-1
    return N-1
def track_h(n0,n1,roi):
    """robust planar homography track (forward-backward checked), returns list of 3x3 H (frame n0 -> n)"""
    (cx,cy),(rw,rh)=roi; w2,h2=int(W*SC),int(H*SC); rw,rh=int(rw*SC),int(rh*SC); x=int(cx*w2-rw/2); y=int(cy*h2-rh/2)
    mask=np.zeros((h2,w2),np.uint8); mask[max(0,y):y+rh,max(0,x):x+rw]=255
    Hs=[np.eye(3)]; acc=np.eye(3)
    p=cv2.goodFeaturesToTrack(grays[n0],600,0.005,6,mask=mask,blockSize=7)
    for n in range(n0+1,n1+1):
        if p is None or len(p)<20:
            m2=cv2.warpPerspective(mask,acc,(w2,h2)); p=cv2.goodFeaturesToTrack(grays[n-1],600,0.005,6,mask=m2,blockSize=7)
            if p is None: Hs.append(acc.copy()); continue
        q,st,_=cv2.calcOpticalFlowPyrLK(grays[n-1],grays[n],p,None,winSize=(21,21),maxLevel=4)
        r,st2,_=cv2.calcOpticalFlowPyrLK(grays[n],grays[n-1],q,None,winSize=(21,21),maxLevel=4)
        fb=np.linalg.norm((p-r).reshape(-1,2),axis=1)
        good=(st.reshape(-1)==1)&(st2.reshape(-1)==1)&(fb<0.6)
        a,b=p[good],q[good]; Hn=np.eye(3)
        if len(a)>=8:
            A,inl=cv2.estimateAffinePartial2D(a,b,method=cv2.RANSAC,ransacReprojThreshold=1.5)
            if A is not None:
                Hn=np.vstack([A,[0,0,1]])
                if inl is not None: a,b=a[inl.reshape(-1)==1],b[inl.reshape(-1)==1]
        acc=Hn@acc
        sc=math.hypot(acc[0,0],acc[1,0]); rot=math.atan2(acc[1,0],acc[0,0])
        sc2=min(max(sc,0.88),1.15); rot2=max(min(rot,0.08),-0.08)
        acc[:2,:2]=sc2*np.array([[math.cos(rot2),-math.sin(rot2)],[math.sin(rot2),math.cos(rot2)]])
        Hs.append(acc.copy()); p=b.reshape(-1,1,2)
    S=np.diag([SC,SC,1.0]); Si=np.linalg.inv(S)
    return [Si@Hm@S for Hm in Hs]
def smooth_corners(Hs,quad):
    """map chip quad through each H, smooth corner paths (zero-phase), return quads"""
    Q=np.array([cv2.perspectiveTransform(quad.reshape(-1,1,2).astype(np.float64),Hm).reshape(-1,2) for Hm in Hs])
    n=len(Q)
    if n>=9:
        wl=min(n-(1-n%2),15)
        Q=savgol_filter(Q,wl,2,axis=0,mode='interp')
    return Q
def cbox(im):
    a=im[...,3]>40; ys,xs=np.where(a); h,w=a.shape
    return (xs.min()/w,ys.min()/h,xs.max()/w,ys.max()/h)
def load_anim(k,wpx):
    an=AN if os.path.exists(f'{AN}/{k}/f_0044.png') else AN+'_lo'
    out=[]; ref=cv2.imread(f'{an}/{k}/f_0040.png',cv2.IMREAD_UNCHANGED); cb=cbox(ref)
    s=wpx/((cb[2]-cb[0])*ref.shape[1])
    lut=np.clip(np.arange(256)*1.06+4,0,255).astype(np.uint8)
    for i in range(45):
        im=cv2.imread(f'{an}/{k}/f_{i:04d}.png',cv2.IMREAD_UNCHANGED)
        im[...,:3]=cv2.LUT(im[...,:3],lut)
        out.append(cv2.resize(im,(int(im.shape[1]*s),int(im.shape[0]*s)),interpolation=cv2.INTER_AREA))
    return out
plan=[]
for c in CH:
    t0=c['t0'] if 't0' in c else ws(c['anchor'],c.get('after',0))-0.20
    t1=c['out'] if isinstance(c['out'],(int,float)) else we(c['out'],c.get('after',0))+0.18
    ci=CH.index(c)
    for c2 in CH[ci+1:]:
        t2=c2['t0'] if 't0' in c2 else ws(c2['anchor'],c2.get('after',0))-0.20
        if t2<t1 and abs(c2['pos'][1]-c['pos'][1])<0.15: t1=t2-0.02
    if 'maxdur' in c: t1=min(t1,t0+c['maxdur'])
    n0=max(0,int(round(t0*FPS))); n1=min(N-1,int(round(t1*FPS)))
    if n1<n0: continue
    anim=load_anim(c['key'],c['width']); h,w=anim[0].shape[:2]
    cx,cy=c['pos'][0]*W,c['pos'][1]*H
    pt=c.get('point',[c['pos'][0],c['pos'][1]]); 
    quad=np.float32([[cx-w/2,cy-h/2],[cx+w/2,cy-h/2],[cx+w/2,cy+h/2],[cx-w/2,cy+h/2],[pt[0]*W,pt[1]*H]])
    quads=np.zeros((n1-n0+1,5,2)); n=n0; cur=quad.copy()
    while n<=n1:
        se=max(n,min(n1,seg_end(n)))
        if c.get('roi'):
            Hs=track_h(n,se,c['roi']); Q=smooth_corners(Hs,cur)
            k=c.get('follow',0.85)   # damped follow
            Q=cur[None]+(Q-cur[None])*k
        else:
            Q=np.repeat(cur[None],se-n+1,0)
        quads[n-n0:se-n0+1]=Q; cur=Q[-1].astype(np.float32); n=se+1
    cbx=cbox(anim[40])
    for k in range(len(quads)):
        b=quads[k,:4]; X0,Y0=b.min(0); X1,Y1=b.max(0)
        x0,x1=X0+(X1-X0)*cbx[0],X0+(X1-X0)*cbx[2]; y0,y1=Y0+(Y1-Y0)*cbx[1],Y0+(Y1-Y0)*cbx[3]
        dx=max(0,50-x0)-max(0,x1-(W-50)); dy=max(0,110-y0)-max(0,y1-(H-170))
        quads[k,:,0]+=dx; quads[k,:,1]+=dy
    plan.append(dict(c=c,anim=anim,n0=n0,n1=n1,quads=quads,src=np.float32([[0,0],[w,0],[w,h],[0,h]]),lead='point' in c,cb=cbox(anim[40]),y=c['pos'][1]))
    print(c['key'],round(t0,2),round(t1,2),flush=True)
json.dump([dict(key=p['c']['key'],t0=p['n0']/FPS,t1=p['n1']/FPS) for p in plan],open('sched.json','w'))
def comp(fr,im,src,quad,alpha):
    M=cv2.getPerspectiveTransform(src,quad.astype(np.float32))
    x0,y0=np.floor(quad.min(0)).astype(int)-40; x1,y1=np.ceil(quad.max(0)).astype(int)+40
    x0,y0=max(0,x0),max(0,y0); x1,y1=min(W,x1),min(H,y1)
    if x1<=x0 or y1<=y0: return
    T=np.array([[1,0,-x0],[0,1,-y0],[0,0,1]])@M
    sp=cv2.warpPerspective(im,T,(x1-x0,y1-y0),flags=cv2.INTER_LINEAR,borderValue=(0,0,0,0)).astype(np.float32)
    a=sp[...,3:4]/255*alpha
    roi=fr[y0:y1,x0:x1]
    # scene-matched light: tint chip slightly by local scene average
    amb=roi.reshape(-1,3).mean(0)
    col=sp[...,:3]*0.92+amb*0.08
    sh=cv2.GaussianBlur(np.roll(np.roll(a[...,0],14,0),8,1),(0,0),12)[...,None]*0.55
    gl=cv2.GaussianBlur(a[...,0],(0,0),16)[...,None]
    roi[:]=roi*(1-sh)
    roi[:]=np.clip(roi+gl*np.array([80,165,240],np.float32)*0.5,0,255)
    # light wrap: blurred background bleeds onto chip edges
    bgb=cv2.GaussianBlur(roi,(0,0),6); a2=a[...,0]; edge=np.clip(a2-cv2.erode(a2,np.ones((7,7),np.uint8)),0,1)[...,None]
    roi[:]=roi*(1-a)+col*a
    roi[:]=roi*(1-edge*0.35)+bgb*edge*0.35
# ---- audio: voice -12 LUFS + synthesized whoosh at each chip entry
import wave
sr=44100
def rd(p):
    import subprocess as sp
    raw=sp.run(['ffmpeg','-v','error','-i',p,'-f','s16le','-ac','1','-ar',str(sr),'-'],capture_output=True).stdout
    return np.frombuffer(raw,np.int16).astype(np.float32)/32768
v=rd('voice.wav'); L=len(v); fx=np.zeros(L,np.float32); rng=np.random.default_rng(3)
for p in plan:
    tp=(p['n0']+7)/FPS; d=0.32; n=int(d*sr); st=int(tp*sr)-n
    if st<0: continue
    noise=rng.standard_normal(n).astype(np.float32)
    env=np.linspace(0,1,n)**2.2; env[-int(0.04*sr):]*=np.linspace(1,0,int(0.04*sr))
    # sweep: moving low-pass via cumulative smoothing
    out=np.zeros(n,np.float32); y=0
    for k in range(n):
        a=0.02+0.5*(k/n); y+=a*(noise[k]-y); out[k]=y
    w=out*env*0.35
    pop=np.sin(2*np.pi*np.linspace(0,0.06,int(0.06*sr))*(220))*np.exp(-np.linspace(0,8,int(0.06*sr)))*0.25
    fx[st:st+n]+=w[:max(0,min(n,L-st))]
    e=st+n; fx[e:e+len(pop)]+=pop[:max(0,min(len(pop),L-e))]
bpm=120; beat=60/bpm; t=np.arange(L)/sr; mus=np.zeros(L,np.float32)
def place(sig,at):
    a=int(at*sr); b=min(L,a+len(sig))
    if a<L: mus[a:b]+=sig[:b-a]
kt=np.arange(int(0.28*sr))/sr; kick=np.sin(2*np.pi*np.cumsum(45+90*np.exp(-kt*28))/sr)*np.exp(-kt*9)
hat=rng.standard_normal(int(0.05*sr)).astype(np.float32); hat=np.diff(hat,prepend=0)*np.exp(-np.arange(len(hat))/sr*70)*0.25
roots=[55.0,55.0,49.0,41.2]  # A A G E bass (by bar)
nb=int(L/sr/beat)+1
for k in range(nb):
    tb=k*beat; place(kick*0.9,tb); place(hat,tb+beat/2)
    f=roots[(k//4)%4]; bt=np.arange(int(beat*0.9*sr))/sr
    bass=(2*((bt*f)%1)-1)*np.exp(-bt*3)*0.18; place(bass.astype(np.float32),tb)
for k in range(0,nb,8):
    f=roots[(k//4)%4]*4; pt=np.arange(int(beat*8*sr))/sr
    pad=sum(np.sin(2*np.pi*f*r*pt) for r in (1,1.26,1.5))*0.03*np.minimum(1,pt/0.5)*np.minimum(1,(beat*8-pt)/0.5); place(pad.astype(np.float32),k*beat)
fade=np.minimum(1,np.minimum(t/0.5,(t[-1]-t)/1.2)); mus*=fade
env=np.convolve(np.abs(v),np.ones(int(0.15*sr))/int(0.15*sr),'same'); env=env/(env.max()+1e-9)
duck=1-0.45*np.clip(env*4,0,1)
vr=np.sqrt(np.mean(v[v!=0]**2)); mr=np.sqrt(np.mean(mus**2))+1e-9
mus=mus*(vr/mr)*10**(-14/20)*duck
mix=v+fx*0.6+mus
wf=wave.open('mix_raw.wav','wb'); wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr)
wf.writeframes((np.clip(mix,-1,1)*32767).astype(np.int16).tobytes()); wf.close()
subprocess.run(['ffmpeg','-v','error','-y','-i','mix_raw.wav','-af','acompressor=threshold=-18dB:ratio=3:attack=5:release=80,loudnorm=I=-12:TP=-1:LRA=4','-ar','48000','-ac','2','mix.wav'])
def leader(fr,q,prog,al,i,cb):
    tgt=q[4]; box=q[:4]
    X0,Y0=box.min(0); X1,Y1=box.max(0)
    x0,x1=X0+(X1-X0)*cb[0],X0+(X1-X0)*cb[2]; y0,y1=Y0+(Y1-Y0)*cb[1],Y0+(Y1-Y0)*cb[3]; m=12
    sx=np.clip(tgt[0],x0+m,x1-m); sy=y1-m if tgt[1]>y1 else (y0+m if tgt[1]<y0 else np.clip(tgt[1],y0,y1))
    ex=sx+(tgt[0]-sx)*prog; ey=sy+(tgt[1]-sy)*prog
    lay=np.zeros((H,W),np.float32)
    cv2.line(lay,(int(sx),int(sy)),(int(ex),int(ey)),1.0,5,cv2.LINE_AA)
    if prog>=1:
        r=14+4*math.sin(i*0.35); cv2.circle(lay,(int(tgt[0]),int(tgt[1])),int(r),1.0,4,cv2.LINE_AA)
        cv2.circle(lay,(int(tgt[0]),int(tgt[1])),7,1.0,-1,cv2.LINE_AA)
    g=cv2.GaussianBlur(lay,(0,0),9)[...,None]
    fr[:]=np.clip(fr+g*np.array([80,165,240],np.float32)*0.9*al,0,255)
    l=lay[...,None]*al; fr[:]=fr*(1-l)+255*l
def aidx(i):
    if i<25: return i
    p=(i-25)%38
    return 25+p if p<=19 else 63-p
ff=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','bgr24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-i','mix.wav',
 '-map','0:v','-map','1:a','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-shortest',sys.argv[1]],stdin=subprocess.PIPE)
EX=6
import intro, captions; CAPS=captions.build(words,FPS)
cap=cv2.VideoCapture('base.mp4')
for n in range(N):
    ok,f0=cap.read(); t=n/FPS; fr=f0.astype(np.float32)
    lc=max([c for c in cuts if c<=t+1e-6]+[0]); dt=t-lc
    if dt<0.2 and lc>0:
        z=1+0.07*(1-dt/0.2)**2; M=cv2.getRotationMatrix2D((W/2,H/2),0,z); fr=cv2.warpAffine(fr,M,(W,H),borderMode=cv2.BORDER_REFLECT)
    for p in plan:
        if not(p['n0']<=n<=p['n1']): continue
        i=n-p['n0']; rem=p['n1']-n; q=p['quads'][i].copy(); al=1.0
        im=p['anim'][aidx(i)]
        if 0<i<8:  # entry motion blur
            im=cv2.addWeighted(im,0.6,p['anim'][aidx(i-1)],0.4,0)
        if rem<EX:
            u=rem/EX; al=u; ctr=q[:4].mean(0); q[:4]=ctr+(q[:4]-ctr)*(0.8+0.2*u); q[:4,1]-=24*(1-u)
        if p['lead'] and i>=5: leader(fr,q,min(1,(i-5)/8),al,i,p['cb'])
        comp(fr,im,p['src'],q[:4],al)
    intro.draw(fr,n)
    low=any(p['n0']<=n<=p['n1'] and p.get('y',0)>0.7 for p in plan)
    captions.draw(fr,CAPS,n,1536)
    ff.stdin.write(np.clip(fr,0,255).astype(np.uint8).tobytes())
ff.stdin.close(); ff.wait(); print('done')
