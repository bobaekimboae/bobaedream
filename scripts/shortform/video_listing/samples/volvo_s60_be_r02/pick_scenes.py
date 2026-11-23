# 장면 고르기 자동: SigLIP 2로 원본을 0.5초마다 읽어, 문장마다 그 부위가 가장 잘 보이는 구간을 고른다(겹치지 않게)
import sys,json,cv2,numpy as np
from PIL import Image
sys.path.insert(0,'/home/claude/bb_sf/scripts/shortform/auto')
from vlm import ZeroShot
spec=json.load(open('cuts_spec.json')); cap=cv2.VideoCapture('src.mp4'); dur=cap.get(cv2.CAP_PROP_FRAME_COUNT)/30; ST=0.5
ts=np.arange(0.25,dur-0.2,ST); ims=[]
for t in ts:
    cap.set(cv2.CAP_PROP_POS_MSEC,t*1000); ok,f=cap.read(); ims.append(Image.fromarray(cv2.cvtColor(f,cv2.COLOR_BGR2RGB)))
zs=ZeroShot(); labels=sorted({c['look'] for c in spec}); P=zs.probs(zs.image(ims),zs.text(labels))   # 시각 × 부위
used=np.zeros(len(ts),bool); out={}
for c in sorted(spec,key=lambda c:-P[:,labels.index(c['look'])].max()):   # 확실한 부위부터 자리 잡음
    p=P[:,labels.index(c['look'])].copy(); p[used]=-1; n=max(2,int(round(c['need']/ST))); best=None
    for i in range(0,len(ts)-n+1):
        if used[i:i+n].any(): continue
        s=p[i:i+n].mean()
        if best is None or s>best[0]: best=(s,i)
    s,i=best; used[i:i+n]=True; out[c['key']]={'src':[round(float(ts[i]-ST/2),2),round(float(ts[i+n-1]+ST/2),2)],'score':round(float(s),2)}
for c in spec: print(c['key'],c['look'],out[c['key']])
json.dump(out,open('scenes_auto.json','w'),indent=1)
