# 영상 → 매물 사진(부위별 한 장) 시험. 오픈소스만: OpenCV(장면 뽑기·선명도) + OpenAI CLIP ViT-B/32(MIT, 부위 판별)
# 사용: python3 video2photos.py <영상> <결과 폴더>
import cv2,sys,json,numpy as np,torch
from PIL import Image
from transformers import CLIPModel,CLIPProcessor
src,out=sys.argv[1],sys.argv[2].rstrip('/')+'/'
PARTS=[('front','정면','a photo of the front of a car, grille and both headlights, seen straight on'),
 ('front45','앞측면 45도','a photo of a car from the front three-quarter angle showing the front and one side'),
 ('side','측면','a close photo of the side of a car, doors and fender'),
 ('rear','후면','a photo of the rear of a car, tail lights and trunk lid closed, seen straight on'),
 ('wheel','휠','a close-up photo of a car wheel and tire'),
 ('trunk','트렁크','a photo of an open car trunk, empty cargo space'),
 ('cluster','계기판','a close-up photo of a car instrument cluster, speedometer behind the steering wheel'),
 ('steering','운전대','a photo of a car steering wheel from the driver seat'),
 ('dash','실내 전경','a photo of a car interior dashboard and center console seen from the back seat'),
 ('frontseat','앞좌석','a photo of the front seats of a car seen through the open door'),
 ('rearseat','뒷좌석','a photo of the rear seats of a car'),
 ('gear','기어','a close-up photo of a car gear shifter and center console buttons'),
 ('navi','내비게이션','a close-up photo of a car infotainment screen showing a navigation map'),
 ('rearcam','후방카메라','a car infotainment screen showing the rear view parking camera'),
 ('other','그 밖','a blurry photo of a floor, ceiling, wall or door panel')]
m=CLIPModel.from_pretrained('openai/clip-vit-base-patch32').eval(); p=CLIPProcessor.from_pretrained('openai/clip-vit-base-patch32')
c=cv2.VideoCapture(src); fps=c.get(cv2.CAP_PROP_FPS); F=[]; i=0; step=max(1,round(fps/6))
while 1:
    ok,f=c.read()
    if not ok: break
    if i%step==0:
        g=cv2.cvtColor(cv2.resize(f,(540,960)),cv2.COLOR_BGR2GRAY); F.append((i/fps,f,float(cv2.Laplacian(g,cv2.CV_64F).var())))
    i+=1
def _e(o,proj): return o if torch.is_tensor(o) else (o.pooler_output if o.pooler_output.shape[-1]==m.config.projection_dim else proj(o.pooler_output))
with torch.no_grad():
    t=_e(m.get_text_features(**p(text=[x[2] for x in PARTS],return_tensors='pt',padding=True)),m.text_projection); t=t/t.norm(dim=-1,keepdim=True); P=[]
    for k in range(0,len(F),32):
        v=_e(m.get_image_features(**p(images=[Image.fromarray(cv2.cvtColor(f,cv2.COLOR_BGR2RGB)) for _,f,_ in F[k:k+32]],return_tensors='pt')),m.visual_projection); v=v/v.norm(dim=-1,keepdim=True); P.append((100*v@t.T).softmax(-1))
P=torch.cat(P).numpy(); sh=np.array([s for _,_,s in F]); res=[]
# 선명도는 앞뒤 1초 안에서의 순위로 본다(실내·외관은 절대값이 달라서)
rel=np.array([ (sh[max(0,i-6):i+7]<=sh[i]).mean() for i in range(len(F))])
for j,(key,ko,_) in enumerate(PARTS[:-1]):
    sc=P[:,j]*(0.5+0.5*rel); b=int(sc.argmax()); okk=P[b,j]>=0.35 and P[b].argmax()==j
    res.append({'key':key,'name':ko,'found':bool(okk),'t':round(F[b][0],2),'prob':round(float(P[b,j]),2),'sharp':round(F[b][2],1)})
    if okk: cv2.imwrite(f'{out}{len([r for r in res if r["found"]]):02d}_{key}.jpg',F[b][1],[cv2.IMWRITE_JPEG_QUALITY,95])
json.dump(res,open(out+'result.json','w'),ensure_ascii=False,indent=1)
for r in res: print(('O ' if r['found'] else 'X '),r['name'],r['t'],r['prob'],r['sharp'])
print('후보 장면',len(F),'뽑힌 부위',sum(r['found'] for r in res),'/',len(res))
