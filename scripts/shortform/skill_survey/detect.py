"""편집 기교 순간 검출: 영상에서 '그래픽이 새로 뜨는 순간'을 찾아 캡처한다.
python3 detect.py VIDEO OUTDIR
- 프레임(10fps, 폭 180)마다 그래픽 후보 마스크: 노랑 칠/글자, 흰 글자+어두운 테두리, 검정 상자, 채도 높은 평면색(아이콘·이모지)
- 컷(장면 바뀜)과 따로, 마스크 덩어리가 새로 생기면 순간으로 기록 → 0.35초 뒤 프레임을 폭 540으로 저장 + 그 덩어리 상자
"""
import json, subprocess, sys, os
import numpy as np
from scipy import ndimage
f, out = sys.argv[1:3]; os.makedirs(out, exist_ok=True)
W = 180; FPS = 10
pr = json.loads(subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',f],capture_output=True,text=True).stdout)['streams'][0]
H = int(round(W*pr['height']/pr['width']/2))*2
raw = subprocess.run(['ffmpeg','-v','error','-i',f,'-vf',f'fps={FPS},scale={W}:{H}','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout
V = np.frombuffer(raw,np.uint8).reshape(-1,H,W,3).astype(np.int16)
def masks(fr):
    r,g,b = fr[...,0],fr[...,1],fr[...,2]
    mx = fr.max(2); mn = fr.min(2); sat = mx-mn
    yel = (r>190)&(g>175)&(b<120)&(np.abs(r-g)<70)
    white = (r>220)&(g>220)&(b>220)
    dark = mx<55
    wtxt = white & ndimage.binary_dilation(dark,iterations=1)
    flat = (sat>110)&~yel
    # 검정·짙은 평면 상자(이름표): 어둡고 평평한 덩어리 중 직사각형이고 안에 밝은 글자가 있는 것
    blk = mx<45
    box = np.zeros_like(blk)
    lab,n = ndimage.label(ndimage.binary_closing(blk,iterations=1))
    if n:
        for sl,k in zip(ndimage.find_objects(lab),range(1,n+1)):
            hh=sl[0].stop-sl[0].start; ww=sl[1].stop-sl[1].start
            if 4<=hh<=40 and ww>=14 and ww>=hh*1.6 and ww<W*0.98:
                reg=lab[sl]==k; fill=reg.sum()/(hh*ww)
                inner=(fr[sl].max(2)>200)
                if fill>0.55 and inner.mean()>0.04: box[sl]|=reg|inner
    return dict(yellow=yel, wtext=wtxt, flat=flat, box=box)
kinds = ['yellow','wtext','flat','box']
M = {k:[] for k in kinds}; prev=None; cuts=[]
for i,fr in enumerate(V):
    m = masks(fr)
    for k in kinds: M[k].append(m[k])
    if prev is not None:
        d = np.abs(fr-prev).mean()
        if d>38: cuts.append(i)
    prev = fr
cutset = set(cuts)
events=[]
for k in kinds:
    A = np.array([x.mean() for x in M[k]])
    thr = {'yellow':0.006,'wtext':0.004,'flat':0.01,'box':0.004}[k]
    on = A>thr
    i=0
    while i<len(on):
        if on[i] and (i==0 or not on[i-1]):
            j=i
            while j+1<len(on) and on[j+1]: j+=1
            if j-i+1>=4 and not any(c in cutset for c in range(i-1,i+2)) or (j-i+1>=4 and k=='yellow'):
                mid=min(j, i+3)
                ys,xs=np.where(M[k][mid])
                box=[int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max())] if len(xs) else None
                events.append(dict(kind=k,t=round(i/FPS,2),dur=round((j-i+1)/FPS,2),area=round(float(A[i:j+1].max()),4),box=box,cy=round(float(np.mean(ys))/H,3) if len(ys) else None,atcut=any(c in cutset for c in range(i-1,i+2))))
            i=j+1
        else: i+=1
events.sort(key=lambda e:e['t'])
# 저장: 순간마다 프레임
for n,e in enumerate(events):
    t=e['t']+0.35
    p=os.path.join(out,f"{n:03d}_{e['kind']}_{e['t']:.1f}.jpg"); e['img']=os.path.basename(p)
    subprocess.run(['ffmpeg','-v','error','-y','-ss',f'{t:.2f}','-i',f,'-frames:v','1','-q:v','4',p])
dur=len(V)/FPS
# 효과음 후보: 2kHz 이상 소리 세기가 갑자기 튀는 순간
au = subprocess.run(['ffmpeg','-v','error','-i',f,'-af','highpass=f=2000','-ac','1','-ar','8000','-f','s16le','-'],capture_output=True).stdout
sfx=[]
if au:
    a=np.frombuffer(au,np.int16).astype(np.float32); hop=400
    e=np.sqrt(np.convolve(a*a,np.ones(hop)/hop,'same')[::hop]+1)
    le=np.log(e); fl=np.maximum(0,np.diff(le,prepend=le[0]))
    th=np.median(fl)+4*np.std(fl)
    last=-9
    for k in np.where(fl>th)[0]:
        t=k*hop/8000
        if t-last>0.5: sfx.append(round(t,2)); last=t
json.dump(dict(video=os.path.basename(f),dur=dur,cuts=[c/FPS for c in cuts],sfx=sfx,events=events),open(os.path.join(out,'events.json'),'w'),indent=1)
print(os.path.basename(f), round(dur,1), len(cuts), len(events), {k:sum(e['kind']==k for e in events) for k in kinds})
