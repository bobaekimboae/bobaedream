"""검출된 순간을 하위 유형으로 나누고 잘라 저장 → all.json
하위 유형(노랑): tape(노랑 띠 칩) / boxlabel(검정 상자+노랑 글자) / bigtext(바탕 없는 큰 노랑 글자·숫자) / capword(말 자막 강조 낱말) / logo(끝·중간 로고)
flat: icon(작은 채색 덩어리: 이모지·국기·X) / insert(화면 큰 면적: 앱 화면·카드) """
import json, glob, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage
R=[]
for ej in sorted(glob.glob('ev/*/events.json')):
    d=json.load(open(ej)); vid=d['video'][:-4]; tag=vid[:2]
    for e in d['events']:
        p=os.path.join(os.path.dirname(ej),e['img'])
        if not os.path.exists(p) or not e['box']: continue
        im=np.asarray(Image.open(p).convert('RGB')).astype(int); H,W=im.shape[:2]; s=W/180
        x0,y0,x1,y1=[int(v*s) for v in e['box']]
        r,g,b=im[...,0],im[...,1],im[...,2]
        yel=(r>190)&(g>175)&(b<120)&(np.abs(r-g)<70)
        sub='other'
        rel=(e['t']>d['dur']-3.5)
        if e['kind'] in('yellow','box'):
            grp=ndimage.binary_dilation(yel,structure=np.ones((5,25)))
            lab,n=ndimage.label(grp)
            if n:
                sz=ndimage.sum(yel,lab,range(1,n+1)); k=int(np.argmax(sz))+1
                ys,xs=np.where((lab==k)&yel); X0,Y0,X1,Y1=xs.min(),ys.min(),xs.max(),ys.max()
                reg=im[Y0:Y1+1,X0:X1+1]; rr,gg,bb_=reg[...,0],reg[...,1],reg[...,2]
                yr=((rr>190)&(gg>175)&(bb_<120)).mean(); dr=(reg.max(2)<60).mean()
                wh=((rr>215)&(gg>215)&(bb_>215)).mean()
                bw,bh=X1-X0+1,Y1-Y0+1; cy=(Y0+Y1)/2/H
                below=im[min(H-1,Y1):min(H,Y1+bh),X0:X1+1]
                wbelow=((below.min(2)>215).mean() if below.size else 0)
                p_=max(3,int(bh*0.45)); big=im[max(0,Y0-p_):min(H,Y1+p_+1),max(0,X0-p_):min(W,X1+p_+1)].copy()
                inner=np.zeros(big.shape[:2],bool); inner[Y0-max(0,Y0-p_):Y0-max(0,Y0-p_)+bh, X0-max(0,X0-p_):X0-max(0,X0-p_)+bw]=True
                ring=big[~inner]; ringdark=(ring.max(1)<70).mean() if len(ring) else 0
                if yr>0.5 and wbelow>0.12 and bw>W*0.2: sub='logo'
                elif ringdark>0.45: sub='boxlabel'
                elif yr>0.5 and dr>0.04: sub='tape'
                elif dr>0.28: sub='boxlabel'
                elif bh>H*0.03: sub='bigtext'
                elif abs(cy-0.62)<0.09: sub='capword'
                else: sub='smalltext'
                x0,y0,x1,y1=int(X0),int(Y0),int(X1),int(Y1)
        elif e['kind']=='flat':
            area=(x1-x0)*(y1-y0)/(W*H)
            sub='insert' if area>0.25 else 'icon'
        m=int(12*s); crop=Image.open(p).crop((max(0,x0-m),max(0,y0-m),min(W,x1+m),min(H,y1+m)))
        os.makedirs('crop',exist_ok=True); cp=f"crop/{vid}_{e['t']:.1f}_{sub}.jpg"; crop.convert('RGB').save(cp,quality=85)
        sfx=min([abs(t-e['t']) for t in d.get('sfx',[])] or [9])
        R.append(dict(vid=vid,tag=tag,t=e['t'],dur=e['dur'],kind=e['kind'],sub=sub,cy=round((y0+y1)/2/H,3),h=round((y1-y0)/H,3),w=round((x1-x0)/W,3),sfx_near=round(sfx,2),end=rel,img=p,crop=cp))
json.dump(R,open('all.json','w'),ensure_ascii=False,indent=0)
from collections import Counter
print(len(R)); print(Counter((r['tag'],r['sub']) for r in R))
