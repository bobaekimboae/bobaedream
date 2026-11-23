import os
# SAM 2.1 tiny: 손이 닿은 부위 마스크 + 손 마스크를 닿는 프레임부터 1.5초 추적 → pseg/<key>.npz
import cv2, numpy as np, torch, sys, time
from transformers import Sam2VideoModel, Sam2VideoProcessor
W,H=1080,1920
# key: (원본 닿는 시각, 세로 위치 yf, 부위 점들[(x,y)] (1080x1920 화면 기준), 손 점)
T={'grille':(8.0,.5,[(600,900),(800,700)],(194,1458)),
   'grille2':(8.0,.5,[(600,900),(850,1000),(400,1250)],(194,1458),[(540,260),(250,180),(900,300),(600,1820)]),
   'wheel':(16.6,.55,[(130,972),(130,1426)],(130,1750),[(560,700)]),
   'top':(169.3,.5,[(596,972),(434,486)],(175,1523),[(596,1685)]),
   'eng':(204.2,.4,[(541,745),(736,1231)],(282,1620),[(560,150)]),
   'exh':(127.5,.55,[(477,1020),(671,778)],(541,1393)),
   'sill':(35.0,.45,[(820,1296)],(107,1069)),
   'defl':(43.0,.5,[(486,648)],(259,1296)),
   'paddle':(69.6,.55,[(735,648)],(703,1458)),
   'pdisp':(81.0,.5,[(366,907)],(690,1458))}
keys=sys.argv[1:] or list(T)
torch.set_num_threads(2)
M=Sam2VideoModel.from_pretrained('facebook/sam2.1-hiera-tiny').eval(); P=Sam2VideoProcessor.from_pretrained('facebook/sam2.1-hiera-tiny')
cap=cv2.VideoCapture(os.environ.get('ROMA_SRC', '../raw/roma.mp4')); SH=int(cap.get(4))
for k in keys:
    tt,yf,pp,hp=T[k][:4]; neg=T[k][4] if len(T[k])>4 else []; y0=int(min(SH-H,max(0,yf*SH-H/2))); t_=time.time()
    cap.set(cv2.CAP_PROP_POS_MSEC,(tt-0.1)*1000); fr=[]
    for _ in range(45):
        ok,f=cap.read(); fr.append(cv2.cvtColor(cv2.resize(f[y0:y0+H],(540,960)),cv2.COLOR_BGR2RGB))
    st=P.init_video_session(video=fr,inference_device='cpu',dtype=torch.float32)
    s=0.5
    P.add_inputs_to_inference_session(inference_session=st,frame_idx=3,obj_ids=[1,2],
        input_points=[[[[x*s,y*s] for x,y in pp]+[[hp[0]*s,hp[1]*s]]+[[x*s,y*s] for x,y in neg], [[hp[0]*s,hp[1]*s]]]],
        input_labels=[[[1]*len(pp)+[0]+[0]*len(neg),[1]]])
    out={}
    with torch.no_grad():
        for o in M.propagate_in_video_iterator(st,start_frame_idx=3):
            m=P.post_process_masks([o.pred_masks],original_sizes=[[960,540]],binarize=True)[0]
            out[o.frame_idx]=m[:,0].numpy().astype(np.uint8)
    idx=sorted(out); part=np.stack([out[i][0] for i in idx]); hand=np.stack([out[i][1] for i in idx])
    np.savez_compressed(f'pseg/{k.rstrip("2")}.npz',part=part,hand=hand,idx=np.array(idx))
    tl=[]
    for j in (0,10,20,30,len(idx)-1):
        im=cv2.cvtColor(fr[idx[j]],cv2.COLOR_RGB2BGR).copy(); ov=im.copy()
        ov[part[j]>0]=(0,230,255); ov[hand[j]>0]=(255,0,255); im=cv2.addWeighted(im,.55,ov,.45,0)
        cv2.putText(im,f'{k} {j}',(10,40),0,1.2,(0,255,0),3); tl.append(cv2.resize(im,(270,480)))
    cv2.imwrite(f'pseg/{k}_chk.jpg',np.hstack(tl)); print(k,len(idx),round(time.time()-t_,1),'s',flush=True)
