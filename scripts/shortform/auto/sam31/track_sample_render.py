import json, subprocess, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy import ndimage
SRC='../m235/job/src.mp4'; FPS=30; W,H=1080,1920; SC=2.0
FD='/tmp/claude-0/-home-claude/9795e62c-2b83-5ed5-9b9a-75716025bfc2/scratchpad/font/package/dist/public/static/'
FB=ImageFont.truetype(FD+'Pretendard-Bold.otf',46); FS=ImageFont.truetype(FD+'Pretendard-Medium.otf',28)
YEL=np.array([245,242,0],np.float32)
CUTS=[('c2','헤드라이트','headlight'),('c3','휠 센터캡','wheel center cap logo'),('c4','테일램프','taillight'),
      ('c6','웰컴 라이트 로고','logo projected on the ground'),('c7d','도어 스커프','상자 1개 클릭'),
      ('c8b','시트','seat'),('c9d','도어 핸들','상자 1개 클릭')]
T0,T1=4.03,22.76
segs=[]
for c,lab,prm in CUTS:
    r=json.load(open(f'{c}.json')); ix=json.load(open(f'm_{c}.idx.json')); b=np.fromfile(f'm_{c}.bin',np.uint8)
    byf={}
    for e in ix: byf.setdefault(e['f'],[]).append(e)
    conf={int(k):v for k,v in r['frames'].items()}
    segs.append(dict(c=c,lab=lab,prm=prm,s0=r['s0'],s1=r['s1'],byf=byf,b=b,conf=conf,wall=r['wall'],n=r['nframes'],ema=None))
def seg_at(t):
    for s in segs:
        if s['s0']<=t<s['s1']: return s
dec=subprocess.Popen(['ffmpeg','-v','error','-ss',f'{T0}','-i',SRC,'-t',f'{T1-T0}','-f','rawvideo','-pix_fmt','rgb24','-'],stdout=subprocess.PIPE)
enc=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-',
     '-ss',f'{T0}','-t',f'{T1-T0}','-i',SRC,'-map','0:v','-map','1:a?','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p',
     '-c:a','aac','-b:a','160k','-shortest','-movflags','+faststart','bobae_sam31_track_sample.mp4'],stdin=subprocess.PIPE)
g=0
while True:
    raw=dec.stdout.read(W*H*3)
    if len(raw)<W*H*3: break
    a=np.frombuffer(raw,np.uint8).reshape(H,W,3).astype(np.float32)
    t=T0+g/FPS; s=seg_at(t); txt=None
    if s:
        lf=int(round((t-s['s0'])*FPS)); age=t-s['s0']
        for e in s['byf'].get(lf,[]):
            if s['c']=='c8b' and e['id']!=0: continue
            m=s['b'][e['off']:e['off']+e['w']*e['h']].reshape(e['h'],e['w'])
            x1,y1,x2,y2=[int(v*SC) for v in e['box']]; bw,bh=max(1,x2-x1),max(1,y2-y1)
            mm=np.array(Image.fromarray(m*255).resize((bw,bh),Image.BILINEAR))>127
            x2c,y2c=min(W,x1+bw),min(H,y1+bh); mm=mm[:y2c-y1,:x2c-x1]
            edge=mm ^ ndimage.binary_erosion(mm,iterations=4)
            reg=a[y1:y2c,x1:x2c]
            fill=0.28 if age<0.6 else 0.12
            reg[mm]=reg[mm]*(1-fill)+YEL*fill
            reg[edge]=YEL
            cx,cy=(x1+x2c)/2,y1
            s['ema']=(cx,cy) if s['ema'] is None else (s['ema'][0]*0.6+cx*0.4,s['ema'][1]*0.6+cy*0.4)
            txt=(s['lab'],s['ema'],s['conf'].get(lf,[{}])[0].get('c'))
    im=Image.fromarray(a.clip(0,255).astype(np.uint8)); d=ImageDraw.Draw(im)
    if txt:
        lab,(cx,cy),cf=txt
        tw=d.textlength(lab,font=FB); bx=int(min(max(cx-tw/2-24,24),W-tw-72)); by=int(max(cy-110,180))
        d.rounded_rectangle([bx,by,bx+tw+48,by+76],radius=14,fill=(245,242,0)); d.text((bx+24,by+10),lab,font=FB,fill=(20,20,20))
    if s:
        info=f"SAM 3.1 · 프롬프트: {s['prm']} · 프레임 {lf+1}/{s['n']}" + (f" · 신뢰도 {txt[2]:.2f}" if txt and txt[2] else ' · 일치 없음')
        d.rounded_rectangle([24,60,24+d.textlength(info,font=FS)+32,60+50],radius=10,fill=(0,0,0,170))
        d.text((40,68),info,font=FS,fill=(255,255,255))
    enc.stdin.write(im.tobytes()); g+=1
enc.stdin.close(); enc.wait(); print('frames',g)
