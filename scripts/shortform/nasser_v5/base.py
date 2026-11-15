import cv2,numpy as np,subprocess,json
E=[(0,3.5,19.6,.58,.68),(3.5,5.1,23.4,.58,.6),(5.1,7.9,62.5,.5,.5),(7.9,10.7,72.5,.5,.5),(10.7,15.05,33.0,.36,.42),
(15.05,18.65,142.3,.3,.7),(18.65,22.2,125.6,.65,.85),(22.2,24.1,138.0,.55,.55),(24.1,26.12,228.6,.42,.70),
(26.12,28.05,87.0,.55,.55),(28.05,30.2,240.0,.50,.60),(30.2,34.75,247.5,.35,.6),(34.75,36.75,262.0,.45,.45),
(36.75,38.3,233.0,.55,.75),(38.3,40.9,175.0,.58,.58),(40.9,43.32,191.5,.55,.55),(43.32,46.92,210.2,.3,.55),
(46.92,50.1,49.6,.58,.6),(50.1,53.38,26.0,.6,.6)]
W,H,FPS=1080,1920,30; CW,CH,Y0=562,1000,55
cap=cv2.VideoCapture('src.mp4')
ff=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','bgr24','-s',f'{W}x{H}','-r','30','-i','-','-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p','base.mp4'],stdin=subprocess.PIPE)
N=int(round(E[-1][1]*FPS))
for a,b,s,c0,c1 in E:
    n0,n1=int(round(a*FPS)),int(round(b*FPS))
    cap.set(cv2.CAP_PROP_POS_MSEC,s*1000)
    for k in range(n1-n0):
        ok,f=cap.read()
        u=k/max(1,n1-n0-1); u=u*u*(3-2*u); cx=c0+(c1-c0)*u
        x0=int(np.clip(cx*1920-CW/2,0,1920-CW))
        cr=f[Y0:Y0+CH,x0:x0+CW]
        o=cv2.resize(cr,(W,H),interpolation=cv2.INTER_CUBIC)
        bl=cv2.GaussianBlur(o,(0,0),2.0); o=cv2.addWeighted(o,1.5,bl,-0.5,0)
        ff.stdin.write(o.tobytes())
ff.stdin.close();ff.wait()
json.dump([{'out_s':a,'out_e':b,'src':s} for a,b,s,_,_ in E],open('timeline.json','w'))
print('ok',N)
