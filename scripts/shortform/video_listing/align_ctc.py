# 씽크 v3: 대본(읽는 글자) ↔ 음성 강제 맞춤. 받아쓰기를 쓰지 않는다.
# 모델: kresnik/wav2vec2-large-xlsr-korean (Apache-2.0, 한글 음절 단위 CTC). 문장 구간은 소리 크기로 재고(말 덩어리 수 = 문장 수), 문장 안 낱말 경계는 CTC 강제 맞춤(비터비)으로 잡는다.
# 사용: python3 align_ctc.py <차 폴더>   (폴더: voice5.wav · script.txt) → words5.json, islands5.json
import json,re,subprocess,sys,numpy as np,torch
from transformers import Wav2Vec2ForCTC,Wav2Vec2Processor
G=sys.argv[1].rstrip('/')+'/'; MODEL='kresnik/wav2vec2-large-xlsr-korean'
a=np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',G+'voice5.wav','-ac','1','-ar','16000','-f','f32le','-'],capture_output=True,check=True).stdout,np.float32).copy()
lines=[l.split() for l in open(G+'script.txt',encoding='utf-8').read().strip().split('\n')]
def islands(a,thr=0.03,gap=0.15,h=160):
    e=np.array([np.sqrt((a[i:i+h]**2).mean()) for i in range(0,len(a)-h,h)]); on=e>e.max()*thr; seg=[]; i=0
    while i<len(on):
        if on[i]:
            j=i
            while j<len(on) and on[j]: j+=1
            if seg and i*h/16000-seg[-1][1]<gap: seg[-1][1]=j*h/16000
            else: seg.append([i*h/16000,j*h/16000])
            i=j
        else: i+=1
    return seg
isl=None
for gap in (0.15,0.12,0.18,0.22,0.1,0.26,0.3):          # 문장 수와 같아지는 쉼 길이를 찾음
    s=islands(a,gap=gap)
    if len(s)==len(lines): isl=s; break
if isl is None: sys.exit(f'실패: 말 덩어리 수가 문장 수({len(lines)})와 맞지 않음 — 대본 줄과 음성을 확인')
proc=Wav2Vec2Processor.from_pretrained(MODEL); model=Wav2Vec2ForCTC.from_pretrained(MODEL).eval(); V=proc.tokenizer.get_vocab(); BL=proc.tokenizer.pad_token_id; SP=V.get('|')
def align(lp,ids):                                    # CTC 강제 맞춤(비터비). lp[T,V] 로그확률, ids = 목표 글자
    T=len(lp); ext=[BL]
    for c in ids: ext+=[c,BL]
    S=len(ext); D=np.full((T,S),-1e9); B=np.zeros((T,S),np.int8); D[0,0]=lp[0,ext[0]]; D[0,1]=lp[0,ext[1]]
    for t in range(1,T):
        for s in range(S):
            c=[D[t-1,s],D[t-1,s-1] if s>0 else -1e9,D[t-1,s-2] if s>1 and ext[s]!=BL and ext[s]!=ext[s-2] else -1e9]; k=int(np.argmax(c)); D[t,s]=c[k]+lp[t,ext[s]]; B[t,s]=k
    s=S-1 if D[T-1,S-1]>=D[T-1,S-2] else S-2; path=[]
    for t in range(T-1,-1,-1): path.append(s); s-=B[t,s]
    path=path[::-1]; out=[]
    for j in range(len(ids)):
        fr=[t for t,s in enumerate(path) if s==2*j+1]; out.append((fr[0],fr[-1]+1) if fr else None)
    return out
norm=lambda t: re.sub(r'[^가-힣]','',(t.split('|')+[None])[1] or t.split('|')[0])
words=[]; miss=set()
for (t0,t1),toks in zip(isl,lines):
    p0=max(0,int((t0-0.10)*16000)); p1=min(len(a),int((t1+0.10)*16000))
    with torch.no_grad(): lp=torch.log_softmax(model(torch.tensor(a[p0:p1])[None]).logits[0],-1).numpy()
    st=(p1-p0)/16000/len(lp); ids=[]; own=[]
    for wi,t in enumerate(toks):
        for ch in norm(t):
            if ch in V: ids.append(V[ch]); own.append(wi)
            else: miss.add(ch)
        if SP is not None and wi<len(toks)-1: ids.append(SP); own.append(-1)
    al=align(lp,ids); b=[[None,None] for _ in toks]
    for (fr,wi) in zip(al,own):
        if wi<0 or fr is None: continue
        s_=p0/16000+fr[0]*st; e_=p0/16000+fr[1]*st
        b[wi][0]=s_ if b[wi][0] is None else b[wi][0]; b[wi][1]=e_
    for i in range(len(b)):                             # 못 잡은 낱말은 앞뒤 사이
        if b[i][0] is None: b[i]=[b[i-1][1] if i else t0,None]
    for i in range(len(b)-1,-1,-1):
        if b[i][1] is None: b[i][1]=b[i+1][0] if i+1<len(b) else t1
    b[0][0]=t0; b[-1][1]=t1
    for i in range(len(b)): b[i][0]=min(max(b[i][0],t0),t1); b[i][1]=min(max(b[i][1],b[i][0]+0.04),t1) if i<len(b)-1 else t1
    for i in range(1,len(b)): b[i][0]=max(b[i][0],b[i-1][0]+0.04)
    words+=[[t.split('|')[0],round(float(s_),3),round(float(e_),3)] for t,(s_,e_) in zip(toks,b)]
json.dump(words,open(G+'words5.json','w'),ensure_ascii=False); json.dump(isl,open(G+'islands5.json','w'))
print(len(words),'낱말',len(isl),'문장','모델 사전에 없는 글자',''.join(sorted(miss)) or '없음')
