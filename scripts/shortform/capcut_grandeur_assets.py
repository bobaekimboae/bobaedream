import subprocess, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
S='/home/claude/bobaedream/public/assets/shortform'
V='/mnt/user-data/uploads/autostudio_analysis/capcut_nasser/src_09_grandeur.mp4'
FB='/tmp/claude-0/-home-claude/9795e62c-2b83-5ed5-9b9a-75716025bfc2/scratchpad/font/package/dist/public/static/Pretendard-ExtraBold.otf'
FS='/tmp/claude-0/-home-claude/9795e62c-2b83-5ed5-9b9a-75716025bfc2/scratchpad/font/package/dist/public/static/Pretendard-SemiBold.otf'
# (video_start, audio_in, audio_out, caption text)
SEG=[(0.30,0.00,3.70),(4.10,8.95,11.55),(6.75,4.22,8.40),(10.95,11.88,13.95),(13.05,14.15,15.75),
     (17.50,18.60,20.10),(21.00,27.38,29.30),(29.30,16.20,18.30),(34.20,23.35,24.70),(37.00,24.84,27.10),
     (42.80,29.68,32.10),(45.95,32.52,35.20),(50.55,35.60,38.48)]
DINGS=[0.70,4.50,34.60,43.20,46.35]
DUR=53.486
inp=['-i','take1.mp3','-i',f'{S}/sfx/ding.wav','-i',f'{S}/bgm/bobae_showroom_v1.mp3']
fl=[];labs=[]
for i,(v,a,b) in enumerate(SEG):
    fl.append(f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,afade=t=in:d=0.03,afade=t=out:st={b-a-0.06:.2f}:d=0.06,adelay={int(v*1000)}:all=1[n{i}]");labs.append(f'[n{i}]')
for j,t in enumerate(DINGS):
    fl.append(f"[1:a]volume=0.45,adelay={int(t*1000)}:all=1[d{j}]");labs.append(f'[d{j}]')
fl.append(f"[2:a]atrim=0:{DUR},volume=0.07,afade=t=in:d=0.8,afade=t=out:st={DUR-1.2}:d=1.2[bg]");labs.append('[bg]')
fl.append(''.join(labs)+f"amix=inputs={len(labs)}:normalize=0:duration=longest,atrim=0:{DUR},alimiter=limit=0.95[out]")
subprocess.run(['ffmpeg','-y','-loglevel','error',*inp,'-filter_complex',';'.join(fl),'-map','[out]','-ar','48000','-ac','2','bobae_grandeur_narration_v1.wav'],check=True)

W,H=1080,1920
def font(p,s): return ImageFont.truetype(p,s)
brush=Image.open(f'{S}/brush-fill/v1/fill-01-4_0x1.png').convert('RGBA').split()[3]
def number_chip(name,lines,cy):
    can=Image.new('RGBA',(W,H),(0,0,0,0))
    y=cy
    for txt,sz in lines:
        f=font(FB,sz);bb=f.getbbox(txt);tw,th=bb[2]-bb[0],bb[3]-bb[1]
        bw=int(tw/0.82);bh=int(th/0.35*0.55)
        m=brush.resize((bw,bh));fill=Image.new('RGBA',(bw,bh),'#F4F209');fill.putalpha(m)
        fill=fill.rotate(-1.5,expand=True,resample=Image.BICUBIC)
        x=(W-fill.width)//2;can.alpha_composite(fill,(x,y-fill.height//2))
        d=ImageDraw.Draw(can);d.text((W//2,y),txt,font=f,fill='#111111',anchor='mm')
        y+=int(bh*0.95)
    can.save(name)
def rounded(im,r):
    m=Image.new('L',im.size,0);ImageDraw.Draw(m).rounded_rectangle([0,0,im.width-1,im.height-1],r,fill=255);im=im.convert('RGBA');im.putalpha(m);return im
def image_chip(name,icon,label,sub,cy):
    can=Image.new('RGBA',(W,H),(0,0,0,0))
    fL=font(FB,74);fS=font(FS,44)
    lw=max(fL.getlength(label),fS.getlength(sub))
    iw=280;pad=30;cw=int(iw+pad*3+lw+20);ch=iw+pad*2
    x0=(W-cw)//2;y0=cy-ch//2
    sh=Image.new('RGBA',(W,H),(0,0,0,0));ImageDraw.Draw(sh).rounded_rectangle([x0+6,y0+14,x0+cw+6,y0+ch+14],48,fill=(0,0,0,110))
    can.alpha_composite(sh.filter(ImageFilter.GaussianBlur(18)))
    ImageDraw.Draw(can).rounded_rectangle([x0,y0,x0+cw,y0+ch],48,fill='white')
    ic=icon.copy();ic.thumbnail((iw,iw),Image.LANCZOS)
    if ic.mode!='RGBA' or icon.info.get('crop'): pass
    can.alpha_composite(ic,(x0+pad+(iw-ic.width)//2,y0+pad+(iw-ic.height)//2))
    tx=x0+pad*2+iw+10;d=ImageDraw.Draw(can)
    # yellow underline highlight behind label
    lwid=int(fL.getlength(label));d.rounded_rectangle([tx-6,cy-12,tx+lwid+6,cy+22],10,fill='#F4F209')
    d.text((tx,cy-6),label,font=fL,fill='#111111',anchor='ls')
    d.text((tx,cy+30),sub,font=fS,fill='#555555',anchor='lt')
    # tilt slightly for sticker feel
    can=can.rotate(2,center=(W//2,cy),resample=Image.BICUBIC)
    can.save(name)
def crop_at(t,box,out):
    subprocess.run(['ffmpeg','-y','-loglevel','error','-ss',str(t),'-i',V,'-frames:v','1',out],check=True)
    im=Image.open(out).crop(box).resize((268,268),Image.LANCZOS)
    im=rounded(im,36)
    b=Image.new('RGBA',(280,280),(0,0,0,0));ImageDraw.Draw(b).rounded_rectangle([0,0,279,279],42,fill='#F4F209')
    b.alpha_composite(im,(6,6));return b
number_chip('chip01_price.png',[('2,330만원',150)],760)
number_chip('chip02_reg.png',[('22년 6월 등록',96),('6.8만km',96)],720)
number_chip('chip07_fuel.png',[('가솔린 2.5 · 경기',96)],760)
hl=crop_at(8.5,(480,700,860,1080),'fr_hl.png')
image_chip('chip03_led.png',hl,'LED 헤드램프','파라메트릭 쥬얼 그릴',700)
cl=crop_at(35.0,(400,640,1020,1260),'fr_cl.png')
image_chip('chip04_cluster.png',cl,'디지털 계기판','풀 LCD 클러스터',700)
sf=crop_at(38.0,(20,250,500,730),'fr_sf.png')
image_chip('chip05_shift.png',sf,'버튼식 변속기','터치식 공조',700)
cam=Image.open('camera.png').convert('RGBA');cam=cam.crop(cam.getbbox())
image_chip('chip06_svm.png',cam,'서라운드 뷰','360° 주차 화면',560)
print('ok')
