import cv2,json,sys,os
G=os.environ.get('ROMA_DIR','/tmp/claude-0/-home-claude/9795e62c-2b83-5ed5-9b9a-75716025bfc2/scratchpad/g350/')
A={'c2':(10.0,13.0,11.0,.55,.38),'c6':(51.0,55.5,52.0,.68,.31),'c9':(79.5,83.5,80.5,.35,.47),'c10':(84.0,88.8,86.0,.45,.32),'c13':(125.5,128.5,126.5,.50,.55)}
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
