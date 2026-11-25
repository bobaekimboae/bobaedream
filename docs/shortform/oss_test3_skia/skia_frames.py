import os, sys, time, subprocess, importlib, numpy as np
from PIL import Image, ImageDraw
REPO='/home/claude/bbm-align'; OUT=sys.argv[1]
sys.path.insert(0, REPO+'/scripts/shortform/video_listing')
raw=subprocess.run(['ffmpeg','-v','error','-ss','8','-i',REPO+'/public/shortform-samples/g350-v13/g350-v13.mp4','-vf','fps=0.5,scale=1080:1920','-frames:v','30','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout
F=np.frombuffer(raw,np.uint8).reshape(-1,1920,1080,3); print('프레임',len(F))
def run(engine):
    os.environ['BBM_DRAW']=engine
    import g350_v5_lib as G; importlib.reload(G); G._ac.clear()
    out=[]; t0=time.perf_counter()
    for i,f in enumerate(F):
        cv=Image.fromarray(f).convert('RGBA'); L=120+i*8
        A,off=G.arrimg(L,True); cv.alpha_composite(A,(540-A.width//2,900))
        if G.SKD: G.SKD.ring(cv,(700,300,1000,600)); G.SKD.seg(cv,(700,450),(540,900),(255,255,255,230),5)
        else:
            d=ImageDraw.Draw(cv); d.line((700,450,540,900),fill=(255,255,255,230),width=5); d.ellipse((700,300,1000,600),outline=(255,255,255,255),width=7)
        out.append(cv)
    return out,(time.perf_counter()-t0)/len(F)*1e3, G.SKD is not None
P,tp,_=run('pil'); K,tk,ok=run('skia')
print('엔진 확인 skia',ok,' 프레임당 ms PIL',round(tp,2),' skia',round(tk,2))
# 확대 비교 3장(화살표 끝, 원 테두리)
sheet=Image.new('RGB',(1080,1300),(255,255,255)); d=ImageDraw.Draw(sheet)
for r,i in enumerate((0,14,29)):
    for c,(im,name) in enumerate(((P[i],'PIL'),(K[i],'skia'))):
        a=im.crop((540-46,890,540+46,960)).resize((276,210),Image.NEAREST).convert('RGB')
        b=im.crop((690,330,790,430)).resize((240,240),Image.NEAREST).convert('RGB')
        x=c*540; sheet.paste(a,(x+10,40+r*420)); sheet.paste(b,(x+296,40+r*420))
        d.text((x+10,20+r*420),f'{name} frame {i}',fill=(0,0,0))
sheet.save(OUT)
