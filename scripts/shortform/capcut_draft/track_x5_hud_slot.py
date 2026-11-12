"""헤드업 디스플레이(콜아웃 6) 전용: 계기판 위 HUD 구멍(어두운 띠)의 세로 가운데를 매 프레임 찾아 점을 붙인다.
가로는 v5 흐름 값. 띠가 사라지는 마지막 프레임은 직전 속도로 이어 씀. track5.json의 6번을 바꿔 씀."""
import json,numpy as np,cv2
g={}; exec(open('track_x5_dots_v4.py').read().split('out, loo4')[0],g)
k=6;a,b=g['CALL'][k];i0,n=g['fi'](a),g['fi'](b)-g['fi'](a)+1
S=g['seg']('src.mp4',i0,n)
T=json.load(open('track5.json')); kf=T[str(k)]['kf']
ys=[];prev=None;off=None
for t,x,y in kf:
    i=int(round(t*25)); prof=cv2.cvtColor(S[i],cv2.COLOR_RGB2GRAY)[800:1400,int(x)-50:int(x)+50].mean(1)
    dark=prof<55; runs=[];s=None
    for j,d in enumerate(np.append(dark,False)):
        if d and s is None: s=j
        if not d and s is not None:
            if j-s>=15: runs.append((s+800,j-1+800))
            s=None
    ref=prev if prev is not None else y
    runs=[r for r in runs if abs((r[0]+r[1])/2-ref)<70]
    if runs:
        r=min(runs,key=lambda r:abs((r[0]+r[1])/2-ref)); c=(r[0]+r[1])/2
        if off is None: off=y-c
        ys.append(c+off); prev=c
    else: ys.append(None)
# 빈 곳: 직전 두 값의 속도로 이어 씀
for q in range(len(ys)):
    if ys[q] is None: ys[q]=ys[q-1]+(ys[q-1]-ys[q-2]) if q>=2 else kf[q][2]
sm=np.convolve(np.pad(ys,1,mode='edge'),[.25,.5,.25],'valid')
for q,(t,x,y) in enumerate(kf): kf[q]=[t,x,round(float(sm[q]),1)]
print('off',off,[round(v) for v in sm])
json.dump(T,open('track5.json','w'))
