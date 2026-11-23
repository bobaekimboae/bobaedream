# 대본 글자 ↔ 받아쓰기 시각 맞추기(자막 = 대본 글자, 받아쓰기는 시각만)
import difflib,json,re,subprocess,sys,numpy as np
SCRIPT=open('script.txt',encoding='utf-8').read().split()
norm=lambda t: re.sub(r'[^0-9A-Za-z가-힣]','',t)
tok=[(t.split('|')[0].replace('_',' '),(t.split('|')+[None])[1] or t.split('|')[0]) for t in SCRIPT]
subprocess.run(['ffmpeg','-v','error','-y','-i','voice_raw.mp3','-ac','1','-ar','48000','voice5.wav'],check=True)
raw=subprocess.run(['ffmpeg','-v','error','-i','voice_raw.mp3','-ac','1','-ar','16000','-f','f32le','-'],capture_output=True,check=True).stdout
a=np.frombuffer(raw,np.float32).copy(); a.tofile('v5.raw')
from faster_whisper import WhisperModel
m=WhisperModel('large-v3-turbo',device='cpu',compute_type='int8')
segs,_=m.transcribe(a,language='ko',word_timestamps=True,vad_filter=True)
WR=[[w.word.strip(),round(w.start,3),round(w.end,3)] for s in segs for w in s.words]
json.dump(WR,open('words_raw.json','w'),ensure_ascii=False)
sc,st=[],[]
for w,s,e in WR:
    t=norm(w)
    for k,ch in enumerate(t): sc.append(ch); st.append((s+(e-s)*k/max(1,len(t)),s+(e-s)*(k+1)/max(1,len(t))))
bc,own=[],[]
for i,(_,say) in enumerate(tok):
    for ch in norm(say.replace('_','')): bc.append(ch); own.append(i)
T=[[None,None] for _ in tok]
for tag,i1,i2,j1,j2 in difflib.SequenceMatcher(None,bc,sc,autojunk=False).get_opcodes():
    if tag=='equal':
        for k in range(i2-i1):
            o=own[i1+k]; s,e=st[j1+k]
            if T[o][0] is None: T[o][0]=s
            T[o][1]=e
# 빈 곳은 이웃으로 채움
for i in range(len(T)):
    if T[i][0] is None: T[i][0]=T[i-1][1] if i else 0.0
    if T[i][1] is None: T[i][1]=T[i][0]+0.25
out=[[tok[i][0],round(T[i][0],3),round(T[i][1],3)] for i in range(len(tok))]
json.dump(out,open('words5.json','w'),ensure_ascii=False)
for i,o in enumerate(out): print(i,o)
print('raw',' '.join(w[0] for w in WR))
