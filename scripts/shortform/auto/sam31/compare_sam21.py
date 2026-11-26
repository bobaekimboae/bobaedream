import json,subprocess,re,math,statistics as st,numpy as np
from PIL import Image
CL=[('c2','헤드라이트'),('c3','휠 센터캡'),('c4','테일램프'),('c6','바닥 웰컴 로고'),('c8b','시트'),('c9d','도어 핸들'),('c7d','도어 스커프')]
src={'c8b':'c8','c7d':'c7','c9d':'c9'}
def scene_len(c,N):
    out=subprocess.run(['ffmpeg','-i',f'{c}.mp4','-vf',"select='gt(scene,0.25)',showinfo",'-f','null','-'],capture_output=True,text=True).stderr
    cuts=[float(x) for x in re.findall(r'pts_time:([\d.]+)',out)]; return int(cuts[0]*30) if cuts else N
def s3mask(c,f):
    ix=[e for e in json.load(open(f'm_{c}.idx.json')) if e['f']==f and e['id']==0]
    if not ix: return None
    e=ix[0]; b=np.fromfile(f'm_{c}.bin',np.uint8,count=e['w']*e['h'],offset=e['off']).reshape(e['h'],e['w'])
    x1,y1,x2,y2=e['box']; M=np.zeros((960,540),bool)
    bw,bh=max(1,x2-x1),max(1,y2-y1)
    mm=np.array(Image.fromarray(b*255).resize((bw,bh)))>127
    M[y1:y1+bh,x1:x1+bw]=mm[:min(bh,960-y1),:min(bw,540-x1)]; return M
def jit(boxes):
    rel=[math.dist(((a[0]+a[2])/2,(a[1]+a[3])/2),((b[0]+b[2])/2,(b[1]+b[3])/2))/math.sqrt(max(1,(a[2]-a[0])*(a[3]-a[1]))) for a,b in zip(boxes,boxes[1:])]
    return round(st.median(rel)*100,1) if rel else None
rows=[]
import os
for c,lab in CL:
    if not os.path.exists(f's2_{c}.json'): continue
    r3=json.load(open(f'{c}.json')); N=r3['nframes']; S=scene_len(c,N)
    s2=np.load(f's2_{c}.npy'); w2=json.load(open(f's2_{c}.json'))['wall']
    ious=[];h2=h3=0;b2=[];b3=[]
    for f in range(S):
        m3=s3mask(c,f); m2=s2[f]>0
        if m3 is not None: h3+=1; ys,xs=np.nonzero(m3); b3.append((xs.min(),ys.min(),xs.max(),ys.max()))
        if m2.any(): h2+=1; ys,xs=np.nonzero(m2); b2.append((xs.min(),ys.min(),xs.max(),ys.max()))
        if m3 is not None and m2.any(): ious.append((m3&m2).sum()/(m3|m2).sum())
    rows.append(dict(c=c,lab=lab,S=S,h3=h3,h2=h2,iou=round(st.mean(ious)*100) if ious else None,iou_min=round(min(ious)*100) if ious else None,
                     j3=jit(b3),j2=jit(b2),t3=r3['wall'],t2=w2,n=N))
for x in rows: print(x)
json.dump(rows,open('compare.json','w'),ensure_ascii=False,indent=1)
