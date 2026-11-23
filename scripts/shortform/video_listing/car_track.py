"""부위 추적(다른 차 공용) — g350_track.py와 같은 방식(270×480, 앞뒤 추적), 시작 점은 차 입력 파일(CAR)의 cuts[].track = [시각, x, y].
추적기는 VitTrack(models/vittrack_2023sep.onnx), 없으면 CSRT.   사용: G350_DIR=/작업폴더/ CAR=samples/<차>_car.json python3 car_track.py"""
import cv2,json,os
G=os.environ['G350_DIR']; CAR=json.load(open(os.environ['CAR'],encoding='utf-8'))
_VIT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','models','vittrack_2023sep.onnx')
def _tracker():
    if hasattr(cv2,'TrackerVit_create') and os.path.exists(_VIT):
        p=cv2.TrackerVit_Params(); p.net=_VIT; return cv2.TrackerVit_create(p)
    return cv2.TrackerCSRT_create()
cap=cv2.VideoCapture(G+'src.mp4'); SW,SH=270,480; out={}
for c in CAR['cuts']:
    if not c.get('track'): continue
    (s0,s1),(ti,fx,fy)=c['src'],c['track']
    cap.set(cv2.CAP_PROP_POS_MSEC,s0*1000); fr=[]
    for i in range(int(round((s1-s0)*30))+1):
        ok,f=cap.read()
        if not ok: break
        fr.append(cv2.resize(f,(SW,SH)))
    ii=min(len(fr)-1,max(0,int(round((ti-s0)*30)))); bw,bh=int(SW*.16),int(SH*.09)
    box=(int(fx*SW-bw/2),int(fy*SH-bh/2),bw,bh); res=[None]*len(fr); res[ii]=(fx,fy)
    for seq in (range(ii+1,len(fr)),range(ii-1,-1,-1)):
        tr=_tracker(); tr.init(fr[ii],box); last=(fx,fy)
        for j in seq:
            ok,b=tr.update(fr[j])
            if ok and (not hasattr(tr,'getTrackingScore') or tr.getTrackingScore()>=0.2): last=((b[0]+b[2]/2)/SW,(b[1]+b[3]/2)/SH)
            res[j]=last
    out[c['key']]={'s0':s0,'s1':s1,'pts':res}; print(c['key'],len(fr),[round(v,2) for v in res[0]],[round(v,2) for v in res[-1]])
json.dump(out,open(G+'tracks.json','w'))
