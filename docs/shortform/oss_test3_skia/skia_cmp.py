import os, sys, time, numpy as np
# 「PIL」 열은 반드시 예전 방식이어야 한다: g350_v5_lib는 skia가 있으면 arrimg를 skia로 넘기므로
# 가져오기 전에 BBM_DRAW=pil을 켠다(2026-11-25 클로드 마스터 2 지적 — 안 켜면 두 열 모두 skia, 차이 0%).
os.environ['BBM_DRAW'] = 'pil'
REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
sys.path[:0] = [REPO + '/scripts/shortform/video_listing', REPO + '/scripts/shortform/lib']
from PIL import Image, ImageDraw
import g350_v5_lib as G, skia_draw as S
assert G.SKD is None, 'PIL 열이 skia로 그려지고 있음 — BBM_DRAW=pil이 먹지 않았다'
import skia
print('skia-python', skia.__version__, '· PIL 열 = 예전 방식(G.SKD 없음)')
YEL, INK = G.YEL, G.INK
def soft(im):  # 테두리 바깥 가장자리에서 중간 알파(1~254) 비율 = 부드러움
    a=np.array(im.getchannel('A')).astype(int); edge=(a>0)&(a<255); return edge.sum()
rows=[]; Ls=[80+12*i for i in range(15)]
for below in (True,False):
    for L in Ls:
        G._ac.clear(); S._ac.clear()
        t=time.perf_counter(); a,pa=G.arrimg(L,below); tp=time.perf_counter()-t
        t=time.perf_counter(); b,pb=S.arrimg(L,below,YEL,INK); ts=time.perf_counter()-t
        assert a.size==b.size and pa==pb
        ab=np.array(a.getchannel('A'))>127; bb=np.array(b.getchannel('A'))>127
        rows.append((L,below,soft(a),soft(b),round(tp*1e3,2),round(ts*1e3,2),round((ab^bb).mean()*100,2)))
print('30개 화살표: PIL 중간알파 합',sum(r[2] for r in rows),' skia',sum(r[3] for r in rows))
print('평균 시간 ms PIL',round(np.mean([r[4] for r in rows]),2),' skia',round(np.mean([r[5] for r in rows]),2))
print('모양 차이(픽셀 %) 최대',max(r[6] for r in rows))
# lens 원·선 30프레임
cvA=Image.new('RGBA',(1080,1920),(40,40,40,255)); cvB=cvA.copy()
t=time.perf_counter()
for i in range(30):
    d=ImageDraw.Draw(cvA); d.line((300,400,700,900),fill=(255,255,255,230),width=5); d.ellipse((540-160,600-160,540+160,600+160),outline=(255,255,255,255),width=7)
tp=(time.perf_counter()-t)/30
t=time.perf_counter()
for i in range(30):
    S.seg(cvB,(300,400),(700,900),(255,255,255,230),5); S.ring(cvB,(540-160,600-160,540+160,600+160))
ts=(time.perf_counter()-t)/30
print('돋보기 원+선 프레임당 ms PIL',round(tp*1e3,2),' skia',round(ts*1e3,2))
# 비교 그림: 화살표 끝·원 테두리 6배 확대
G._ac.clear(); S._ac.clear()
a,_=G.arrimg(200,True); b,_=S.arrimg(200,True,YEL,INK)
bg=lambda im: Image.alpha_composite(Image.new('RGBA',im.size,(70,90,110,255)),im)
crop=lambda im: bg(im).crop((0,0,92,70)).resize((552,420),Image.NEAREST)
r1=lambda cv: cv.crop((540-170,440-10,540-60,520)).resize((660,540),Image.NEAREST)
out=Image.new('RGB',(552*2+40,420+540+80),(255,255,255))
out.paste(crop(a),(0,40)); out.paste(crop(b),(592,40))
out.paste(r1(cvA).crop((0,0,552,540)),(0,500)); out.paste(r1(cvB).crop((0,0,552,540)),(592,500))
ImageDraw.Draw(out).text((10,8),'PIL (now)',fill=(0,0,0)); ImageDraw.Draw(out).text((602,8),'skia',fill=(0,0,0))
out.save(sys.argv[1])
