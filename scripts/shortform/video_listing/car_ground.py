"""부위 자동 찾기 v2 — LLMDet(Grounding DINO 계열, Apache-2.0)로 컷마다 원본 구간을 촘촘히 훑는다.
car_map.py(OWLv2 한 장 + VitTrack 추적)를 대신한다: 추적기를 쓰지 않고 매 표본 화면에서 다시 찾는다.
사용: G350_DIR=/작업폴더/ HF_HUB_OFFLINE=1 python3 car_ground.py <ground_spec.json> --out ground.json [--step 0.3]
spec: {"scenes":[{"range":[a,b],"parts":{"g9":"navigation map","g10":"touchpad"}}, ...]}  같은 구간의 부위는 한 번에 찾는다."""
import json,os,sys,subprocess,argparse,io
import torch
from PIL import Image
from transformers import AutoProcessor,AutoModelForZeroShotObjectDetection
ap=argparse.ArgumentParser(); ap.add_argument('spec'); ap.add_argument('--out',required=True); ap.add_argument('--step',type=float,default=0.3)
ap.add_argument('--model',default='iSEE-Laboratory/llmdet_base'); a=ap.parse_args()
G=os.environ['G350_DIR']; torch.set_num_threads(os.cpu_count() or 2)
proc=AutoProcessor.from_pretrained(a.model); model=AutoModelForZeroShotObjectDetection.from_pretrained(a.model).eval()
spec=json.load(open(a.spec,encoding='utf-8')); out={}
def frame(t):
    b=subprocess.run(['ffmpeg','-loglevel','error','-ss',f'{t:.3f}','-i',G+'src.mp4','-frames:v','1','-vf','scale=540:-1','-f','image2pipe','-c:v','mjpeg','-q:v','3','-'],capture_output=True,check=True).stdout
    return Image.open(io.BytesIO(b)).convert('RGB')
for sc in spec['scenes']:
    s0,s1=sc['range']; parts=sc['parts']; text=' . '.join(parts.values())+' .'
    n=int((s1-s0)/a.step)+1
    for i in range(n):
        t=min(s1,s0+i*a.step); im=frame(t); W,H=im.size
        inp=proc(images=im,text=text,return_tensors='pt')
        with torch.no_grad(): o=model(**inp)
        r=proc.post_process_grounded_object_detection(o,inp.input_ids,threshold=0.2,text_threshold=0.2,target_sizes=[(H,W)])[0]
        labs=r.get('text_labels') or r.get('labels')
        for k,p in parts.items():
            best=None
            for s,bx,lb in zip(r['scores'],r['boxes'],labs):
                if str(lb).strip() and (str(lb).strip() in p or p in str(lb)) and (best is None or float(s)>best[0]): best=(float(s),[float(v) for v in bx])
            row=[round(t,3)]+([round(best[0],3),round(best[1][0]/W,4),round(best[1][1]/H,4),round(best[1][2]/W,4),round(best[1][3]/H,4)] if best else [0,0,0,0,0])
            out.setdefault(k,{'prompt':p,'range':[s0,s1],'rows':[]})['rows'].append(row)
        print(round(t,2),{k:out[k]['rows'][-1][1] for k in parts},flush=True)
        json.dump(out,open(a.out,'w'))
