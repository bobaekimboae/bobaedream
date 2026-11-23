# 씽크 v2(2026-11-24): 문장 구간을 받아쓰기가 아니라 실제 소리(소리 크기)로 잰다. 음성의 말 덩어리 수 = 대본 문장 수여야 한다.
# 문장 안 낱말은 받아쓰기 시각을 쓰되 문장 구간 밖으로 못 나가게 자른다(받아쓰기는 문장 첫 낱말 앞 쉼을 낱말에 붙여 최대 0.7초 이르게 적는다).
# 입력: voice_orig.mp3 · words_full.json(align1.py) · script_full.txt · islands.json · spec.py의 DROP / 출력: voice5.wav · v5.raw · words5.json
import json,subprocess,numpy as np,re
exec(open('spec.py',encoding='utf-8').read().split('L=[')[0])
isl=json.load(open('islands.json')); W=json.load(open('words_full.json')); lines=open('script_full.txt',encoding='utf-8').read().strip().split('\n')
assert len(isl)==len(lines),(len(isl),len(lines))
a=np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i','voice_orig.mp3','-ac','1','-ar','48000','-f','f32le','-'],capture_output=True,check=True).stdout,np.float32).copy()
out=[];parts=[];k=0;shift=0.0;prev=0.0
for i,l in enumerate(lines):
    n=len(l.split()); ws=W[k:k+n]; k+=n
    t0=isl[i][0]; t1=isl[i][1]; nxt=isl[i+1][0] if i+1<len(isl) else len(a)/48000
    if i in DROP: shift+=nxt-t0; continue          # 문장과 뒤 쉼을 함께 잘라 냄
    seg=a[int(prev*48000):int(nxt*48000)] if not parts or True else None
    b=[[w,max(t0,min(t1,s)),max(t0,min(t1,e))] for w,s,e in ws]; b[0][1]=t0; b[-1][2]=t1
    for j in range(1,len(b)): b[j][1]=max(b[j][1],b[j-1][2]) if b[j][1]<b[j-1][2] else b[j][1]
    if any(e-s<0.08 for _,s,e in b):               # 구간이 뭉개진 문장은 읽는 글자 수 비율로 다시 나눔
        L_=[len(re.sub(r'[^0-9A-Za-z가-힣]','',(t.split('|')+[None])[1] or t)) for t in l.split()]; acc=0
        for j in range(len(b)): b[j][1]=t0+(t1-t0)*acc/sum(L_); acc+=L_[j]; b[j][2]=t0+(t1-t0)*acc/sum(L_)
        print('비율 배분 문장',l)
    out+=[[w,round(s-shift,3),round(e-shift,3)] for w,s,e in b]
keep=np.ones(len(a),bool)
for i in DROP:
    nxt=isl[i+1][0] if i+1<len(isl) else len(a)/48000; keep[int(isl[i][0]*48000):int(nxt*48000)]=False
v=a[keep]; v.astype(np.float32).tofile('v48.raw')
subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar','48000','-ac','1','-i','v48.raw','voice5.wav'],check=True)
subprocess.run(['ffmpeg','-v','error','-y','-i','voice5.wav','-ac','1','-ar','16000','-f','f32le','v5.raw'],check=True)
json.dump(out,open('words5.json','w'),ensure_ascii=False); print(len(out),'낱말',round(len(v)/48000,2),'초')
