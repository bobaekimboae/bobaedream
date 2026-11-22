import cv2,json,sys
G='/tmp/claude-0/-home-claude/9795e62c-2b83-5ed5-9b9a-75716025bfc2/scratchpad/g350/'
A={'c2':(100.4,104.0,100.4,.84,.40),'c3':(104.6,107.0,104.6,.57,.39),'c4':(10.4,12.8,10.4,.60,.38),
'c5':(5.2,7.0,5.2,.45,.45),'c6':(14.8,18.0,14.8,.76,.34),'c7':(21.4,23.7,22.4,.45,.47),'c8':(26.4,28.6,27.0,.5,.62),
'c9':(38.4,41.0,38.4,.45,.50),'c10':(50.5,52.8,50.5,.64,.34),'c11':(56.0,59.6,56.0,.41,.46),'c12':(59.8,62.6,59.8,.60,.52),
'c13':(64.8,67.0,64.8,.47,.27),'c14':(124.0,126.0,124.0,.21,.44)}
cap=cv2.VideoCapture(G+'src.mp4'); SW,SH=270,480; out={}
for k,(s0,s1,ti,fx,fy) in A.items():
    cap.set(cv2.CAP_PROP_POS_MSEC,s0*1000); fr=[]
    for i in range(int(round((s1-s0)*30))+1):
        ok,f=cap.read()
        if not ok: break
        fr.append(cv2.resize(f,(SW,SH)))
    ii=min(len(fr)-1,int(round((ti-s0)*30))); bw,bh=int(SW*.16),int(SH*.09)
    box=(int(fx*SW-bw/2),int(fy*SH-bh/2),bw,bh); res=[None]*len(fr); res[ii]=(fx,fy)
    for seq in (range(ii+1,len(fr)),range(ii-1,-1,-1)):
        tr=cv2.TrackerCSRT_create(); tr.init(fr[ii],box); last=(fx,fy)
        for j in seq:
            ok,b=tr.update(fr[j])
            if ok: last=((b[0]+b[2]/2)/SW,(b[1]+b[3]/2)/SH)
            res[j]=last
    out[k]={'s0':s0,'s1':s1,'pts':res}; print(k,len(fr),res[0],res[-1])
json.dump(out,open(G+'tracks.json','w'))
