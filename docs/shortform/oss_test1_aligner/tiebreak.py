"""1번 시험 — C·D가 0.10초 넘게 갈리는 낱말의 소리 판정 (2026-11-25, 시안 마스터)
낱말 시작 근처(두 후보 사이 ±0.15초)에서 소리 성분 변화(스펙트럼 플럭스)가 가장 크게 솟는 순간을 '소리 시작'으로 보고,
C·D 중 어느 쪽이 더 가까운지 센다. 사람 청취를 대신하는 기계 판정이다(정답은 아님).
"""
import csv, json, os, subprocess, numpy as np
H=os.path.dirname(os.path.abspath(__file__))
rows={r['id']:r for r in json.load(open(f'{H}/sentences20.json'))}
def load(p):
    return np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',p,'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True).stdout,np.float32)
cache={}; out=[]; hop=160; win=512
for r in csv.DictReader(open(f'{H}/results/listen_cd.csv',encoding='utf-8-sig')):
    cid=r['sentence_id']
    if cid not in cache:
        a=load(f"{H}/{rows[cid]['clip_file']}"); fr=[a[i:i+win]*np.hanning(win) for i in range(0,len(a)-win,hop)]
        S=np.log1p(np.abs(np.fft.rfft(np.array(fr),axis=1)))
        flux=np.r_[0,np.maximum(S[1:]-S[:-1],0).sum(1)]
        cache[cid]=flux
    flux=cache[cid]; c,d=float(r['C_start']),float(r['D_start'])
    lo,hi=min(c,d)-0.15,max(c,d)+0.15
    i0,i1=max(0,int(lo/0.01)),min(len(flux)-1,int(hi/0.01))
    k=i0+int(np.argmax(flux[i0:i1+1])); t=round(k*0.01+win/2/16000,3)
    dc,dd=abs(c-t),abs(d-t)
    win_=('D' if dd<dc-0.02 else 'C' if dc<dd-0.02 else '비김')
    out.append([cid,r['word_no'],r['word'],c,d,t,round(dc,3),round(dd,3),win_])
with open(f'{H}/results/tiebreak.csv','w',newline='',encoding='utf-8-sig') as f:
    w=csv.writer(f); w.writerow(['sentence_id','word_no','word','C_start','D_start','onset_flux','C_err','D_err','closer']); w.writerows(out)
from collections import Counter
cnt=Counter(x[-1] for x in out)
print(dict(cnt)); print('C 오차 중앙값',np.median([x[6] for x in out]),'D 오차 중앙값',np.median([x[7] for x in out]))
for x in out: print(x)
