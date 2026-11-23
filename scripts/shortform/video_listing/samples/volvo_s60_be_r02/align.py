# 대본 글자 ↔ 받아쓰기 시각. 자막 = 대본 글자. 받아쓰기가 숫자·영문을 다르게 적은 낱말은 앞뒤 맞은 낱말 사이를 읽는 글자 수 비율로 자동 배분(손 보정 없음)
import difflib,json,os,re,subprocess,numpy as np
SCRIPT=open('script.txt',encoding='utf-8').read().split()
norm=lambda t: re.sub(r'[^0-9A-Za-z가-힣]','',t)
tok=[(t.split('|')[0],(t.split('|')+[None])[1] or t.split('|')[0]) for t in SCRIPT]
subprocess.run(['ffmpeg','-v','error','-y','-i','voice_raw.mp3','-ac','1','-ar','48000','voice5.wav'],check=True)
a=np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i','voice_raw.mp3','-ac','1','-ar','16000','-f','f32le','-'],capture_output=True,check=True).stdout,np.float32).copy(); a.tofile('v5.raw')
if not os.path.exists('words_raw.json'):
    from faster_whisper import WhisperModel
    segs,_=WhisperModel('large-v3-turbo',device='cpu',compute_type='int8').transcribe(a,language='ko',word_timestamps=True,vad_filter=True)
    json.dump([[w.word.strip(),round(w.start,3),round(w.end,3)] for s in segs for w in s.words],open('words_raw.json','w'),ensure_ascii=False)
WR=json.load(open('words_raw.json')); sc,st=[],[]
for w,s,e in WR:
    t=norm(w)
    for k,ch in enumerate(t): sc.append(ch); st.append((s+(e-s)*k/len(t),s+(e-s)*(k+1)/len(t)))
bc,own=[],[]
for i,(_,say) in enumerate(tok):
    for ch in norm(say): bc.append(ch); own.append(i)
hit=[[] for _ in tok]
for tag,i1,i2,j1,j2 in difflib.SequenceMatcher(None,bc,sc,autojunk=False).get_opcodes():
    if tag=='equal':
        for k in range(i2-i1): hit[own[i1+k]].append(st[j1+k])
L=[len(norm(s)) for _,s in tok]; full=[len(h)>=0.8*l for h,l in zip(hit,L)]   # 읽는 글자의 80% 이상 맞은 낱말만 믿음
T=[[h[0][0],h[-1][1]] if f else None for h,f in zip(hit,full)]
i=0; n=len(tok); fixed=[]
while i<n:
    if T[i] is None:
        j=i
        while j<n and T[j] is None: j+=1
        t0=T[i-1][1] if i else 0.0; t1=T[j][0] if j<n else float(WR[-1][2]); _in=[e for w,s_,e in WR if t0-0.01<=s_<t1]; t1=min(t1,max(_in)) if _in else t1; tot=sum(L[i:j]); acc=0
        for k in range(i,j): T[k]=[t0+(t1-t0)*acc/tot,t0+(t1-t0)*(acc+L[k])/tot]; acc+=L[k]; fixed.append(tok[k][0])
        i=j
    else: i+=1
out=[[tok[i][0],round(float(T[i][0]),3),round(float(T[i][1]),3)] for i in range(n)]
json.dump(out,open('words5.json','w'),ensure_ascii=False); print('자동 배분 낱말',fixed); print([o for o in out if o[0] in fixed])
