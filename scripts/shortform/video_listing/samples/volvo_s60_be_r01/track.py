# 부위 찾기(OWLv2) → 추적(VitTrack, 없으면 CSRT)
import cv2,json,torch,numpy as np
from PIL import Image
from transformers import Owlv2Processor,Owlv2ForObjectDetection
P=Owlv2Processor.from_pretrained('google/owlv2-base-patch16-ensemble'); M=Owlv2ForObjectDetection.from_pretrained('google/owlv2-base-patch16-ensemble').eval()
car=json.load(open('car.json')); cap=cv2.VideoCapture('src.mp4'); SW,SH=270,480; out={}
for c in car['cuts']:
    if not c.get('arrow'): continue
    s0,s1=c['src']; cap.set(cv2.CAP_PROP_POS_MSEC,s0*1000); fr=[]
    for i in range(int(round((s1-s0)*30))+1):
        ok,f=cap.read()
        if not ok: break
        fr.append(f)
    ii=len(fr)//3; img=Image.fromarray(cv2.cvtColor(fr[ii],cv2.COLOR_BGR2RGB))
    with torch.no_grad(): o=M(**P(text=[[c['find']]],images=img,return_tensors='pt'))
    r=P.post_process_grounded_object_detection(o,threshold=0.05,target_sizes=torch.tensor([[max(img.size)]*2]))[0]
    if len(r['scores'])==0: print(c['key'],'못 찾음'); continue
    k=int(r['scores'].argmax()); x0,y0,x1,y1=[float(v) for v in r['boxes'][k]]; W_,H_=img.size
    fx,fy=(x0+x1)/2/W_,(y0+y1)/2/H_; bwf,bhf=(x1-x0)/W_,(y1-y0)/H_
    print(c['key'],c['find'],round(float(r['scores'][k]),2),round(fx,2),round(fy,2),round(bwf,2),round(bhf,2))
    sm=[cv2.resize(f,(SW,SH)) for f in fr]; bw,bh=int(SW*min(bwf,.3)),int(SH*min(bhf,.2)); box=(int(fx*SW-bw/2),int(fy*SH-bh/2),bw,bh)
    res=[None]*len(sm); res[ii]=(fx,fy)
    for seq in (range(ii+1,len(sm)),range(ii-1,-1,-1)):
        tr=cv2.TrackerCSRT_create(); tr.init(sm[ii],box); last=(fx,fy)
        for j in seq:
            ok,b=tr.update(sm[j])
            if ok: last=((b[0]+b[2]/2)/SW,(b[1]+b[3]/2)/SH)
            res[j]=last
    out[c['key']]={'s0':s0,'s1':s1,'pts':res,'box_frac':bwf*bhf}
    d=fr[ii].copy(); cv2.rectangle(d,(int(x0),int(y0)),(int(x1),int(y1)),(0,255,255),6); cv2.imwrite(f"det_{c['key']}.jpg",cv2.resize(d,(270,480)))
json.dump(out,open('tracks.json','w'))
