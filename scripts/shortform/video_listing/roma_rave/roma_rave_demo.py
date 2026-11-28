import os
import sys, cv2, numpy as np
from PIL import Image
sys.path.insert(0,'.'); import partfx as P
key=sys.argv[1]; T={'exh':(127.5,.55,(.50,.589)),'grille':(8.0,.5,(.2,.53)),'sill':(35.0,.45,(.32,.43)),'defl':(43.0,.5,(.22,.46)),'paddle':(69.6,.55,(.62,.66)),'pdisp':(81.0,.5,(.62,.63))}
tt,yf,(tx,ty)=T[key]; W,H=1080,1920
cap=cv2.VideoCapture(os.environ.get('ROMA_SRC', '../raw/roma.mp4')); SH=int(cap.get(4)); y0=int(min(SH-H,max(0,yf*SH-H/2)))
cap.set(cv2.CAP_PROP_POS_MSEC,(tt-0.1)*1000+0); fr=[]
for _ in range(60): ok,f=cap.read(); fr.append(f[y0:y0+H])
tip=(tx*W,ty*SH-y0); tl=[]; A=None
for i in range(3,60):
    k=i-3; cv=Image.fromarray(cv2.cvtColor(fr[i],cv2.COLOR_BGR2RGB)).convert('RGBA')
    cv,a=P.fx(cv,key,'./',k,W/2,H/2,1.0,tip)
    if a: A=a
    if A: cv=P.callout(cv,A[0],A[1],A[0]+(220 if A[0]<W/2 else -220),max(330,A[1]-230),k/30)
    if k in (2,6,10,16,26,40): tl.append(cv.convert('RGB').resize((360,640)))
S=Image.new('RGB',(360*len(tl),640)); [S.paste(t,(i*360,0)) for i,t in enumerate(tl)]; S.save(f'/tmp/demo_{key}.jpg')
