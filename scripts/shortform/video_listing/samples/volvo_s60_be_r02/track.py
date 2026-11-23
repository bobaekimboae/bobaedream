# 부위 찾기(OWLv2) → 추적(VitTrack — OpenCV 5, opencv_zoo 2023sep. 없으면 CSRT)
import cv2,json,os,torch
from PIL import Image
from transformers import Owlv2Processor,Owlv2ForObjectDetection
VIT='/home/claude/bb_sf/scripts/shortform/models/vittrack_2023sep.onnx'
def mk():
    if hasattr(cv2,'TrackerVit_create') and os.path.exists(VIT):
        p=cv2.TrackerVit_Params(); p.net=VIT; return cv2.TrackerVit_create(p),'VitTrack'
    return cv2.TrackerCSRT_create(),'CSRT'
P=Owlv2Processor.from_pretrained('google/owlv2-base-patch16-ensemble'); M=Owlv2ForObjectDetection.from_pretrained('google/owlv2-base-patch16-ensemble').eval()
car=json.load(open('car.json')); cap=cv2.VideoCapture('src.mp4'); out={}
for c in car['cuts']:
    if not c.get('find'): continue
    s0,s1=c['src']; cap.set(cv2.CAP_PROP_POS_MSEC,s0*1000); fr=[]
    for i in range(int(round((s1-s0)*30))+1):
        ok,f=cap.read()
        if not ok: break
        fr.append(cv2.resize(f,(540,960)))
    ii=len(fr)//2; img=Image.fromarray(cv2.cvtColor(fr[ii],cv2.COLOR_BGR2RGB))
    with torch.no_grad(): o=M(**P(text=[[c['find']]],images=img,return_tensors='pt'))
    r=P.post_process_grounded_object_detection(o,threshold=0.05,target_sizes=torch.tensor([[960,960]]))[0]
    if len(r['scores'])==0: print(c['key'],'못 찾음'); continue
    k=int(r['scores'].argmax()); x0,y0,x1,y1=[float(v) for v in r['boxes'][k]]
    fx,fy=(x0+x1)/2/540,(y0+y1)/2/960; box=(int(x0),int(y0),int(x1-x0),int(y1-y0)); res=[None]*len(fr); res[ii]=(fx,fy)
    for seq in (range(ii+1,len(fr)),range(ii-1,-1,-1)):
        tr,name=mk(); tr.init(fr[ii],box); last=(fx,fy)
        for j in seq:
            ok,b=tr.update(fr[j])
            if ok: last=((b[0]+b[2]/2)/540,(b[1]+b[3]/2)/960)
            res[j]=last
    out[c['key']]={'s0':s0,'s1':s1,'pts':res,'box_frac':(x1-x0)*(y1-y0)/540/960,'score':round(float(r['scores'][k]),2),'tracker':name}
    print(c['key'],c['find'],out[c['key']]['score'],name,[round(v,2) for v in res[0]],[round(v,2) for v in res[-1]])
json.dump(out,open('tracks.json','w'))
