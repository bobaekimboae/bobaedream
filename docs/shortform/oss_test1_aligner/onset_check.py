"""1번 시험 보조 — 사람 정답 없이 잴 수 있는 기준 두 가지 (2026-11-25, 시안 마스터)
1) 문장 첫 낱말: 클립 앞 쉼 뒤 소리가 처음 커지는 순간(10ms 창, 앞 쉼 소리 크기 + 18dB 넘는 첫 지점)을 기준으로 도구 시작과 비교
2) C·D끼리 0.10초 넘게 갈리는 낱말만 사람이 들을 목록(results/listen_cd.csv)
"""
import csv, json, os, subprocess, numpy as np
H=os.path.dirname(os.path.abspath(__file__))
rows=json.load(open(f'{H}/sentences20.json')); cmp_=json.load(open(f'{H}/results/compare.json'))['per_word']
def onset(path):
    a=np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',path,'-ac','1','-ar','16000','-f','f32le','-'],capture_output=True).stdout,np.float32)
    w=160; e=np.array([np.sqrt(np.mean(a[i:i+w]**2)+1e-12) for i in range(0,len(a)-w,w)]); db=20*np.log10(e)
    floor=np.percentile(db[:max(5,int(0.08/0.01))],50)
    i=int(np.argmax(db>floor+18)); return round(i*0.01,3)
res={'first_word':[], 'tools':{}}
for r in rows:
    o=onset(f"{H}/{r['clip_file']}"); v=cmp_[f"{r['id']}#1"]
    res['first_word'].append({'id':r['id'],'onset':o,**{t:(v[t][0] if v.get(t) else None) for t in 'BCD'}})
for t in 'BCD':
    d=[abs(x[t]-x['onset']) for x in res['first_word'] if x[t] is not None]
    sg=[x[t]-x['onset'] for x in res['first_word'] if x[t] is not None]
    res['tools'][t]={'median_abs':round(float(np.median(d)),3),'max_abs':round(max(d),3),'mean_signed':round(float(np.mean(sg)),3),'in_0.10':round(sum(x<=0.10 for x in d)/len(d),3)}
json.dump(res,open(f'{H}/results/onset_check.json','w'),ensure_ascii=False,indent=1)
print(json.dumps(res['tools'],ensure_ascii=False)); [print(x) for x in res['first_word']]
L=[]
for k,v in cmp_.items():
    if v.get('C') and v.get('D') and abs(v['C'][0]-v['D'][0])>0.10:
        cid,n=k.split('#'); w=next(r['words'][int(n)-1] for r in rows if r['id']==cid)
        L.append([cid,n,w,v['C'][0],v['D'][0],round(v['D'][0]-v['C'][0],3),'',''])
with open(f'{H}/results/listen_cd.csv','w',newline='',encoding='utf-8-sig') as f:
    c=csv.writer(f); c.writerow(['sentence_id','word_no','word','C_start','D_start','D_minus_C','human_start_s','which_closer(C/D/둘다/둘다아님)']); c.writerows(L)
print('C-D 0.10초 넘게 갈리는 낱말',len(L))
