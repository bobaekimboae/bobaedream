"""한국어 강제 정렬(wav2vec2 kresnik/wav2vec2-large-xlsr-korean, CTC 비터비) — 대본 글자를 실제 목소리에 맞춰 낱말 시각을 뽑는다.
사용: python3 ko_forced_align.py <16kHz mono f32 파일> <낱말 json([[글자,..],..], 발음 그대로 한글)> <출력 json>
2026-11-25 M235i: faster-whisper 낱말 시각이 문장 첫머리에서 평균 0.2~0.3초(최대 0.45초) 일찍 잡혀 컷·칩이 말보다 먼저 나오던 문제를 이것으로 교정."""
import json,sys,numpy as np,torch,glob,os
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
d=glob.glob(os.path.expanduser('~/.cache/huggingface/hub/models--kresnik--wav2vec2-large-xlsr-korean/snapshots/*'))[0]
proc=Wav2Vec2Processor.from_pretrained(d); model=Wav2Vec2ForCTC.from_pretrained(d).eval()
vocab=json.load(open(d+'/vocab.json')); blank=vocab.get('[PAD]',vocab.get('<pad>'))
wav=np.fromfile(sys.argv[1],np.float32); sr=16000
words=[w[0] for w in json.load(open(sys.argv[2]))]
toks=[];own=[]
for wi,w in enumerate(words):
  for ch in w:
    if ch in vocab: toks.append(vocab[ch]); own.append(wi)
miss=sorted({ch for w in words for ch in w if ch not in vocab and ch not in '.,!? '}); print('사전에 없는 글자',miss,file=sys.stderr)
with torch.no_grad():
  lp=[]
  step=sr*20
  for s in range(0,len(wav),step):
    x=proc(wav[s:s+step],sampling_rate=sr,return_tensors='pt').input_values
    lp.append(torch.log_softmax(model(x).logits[0],-1).numpy())
  LP=np.concatenate(lp)
T=LP.shape[0]; fps=T/(len(wav)/sr)
# CTC viterbi
L=len(toks); S=2*L+1; ext=[blank if i%2==0 else toks[i//2] for i in range(S)]
NEG=-1e9; dp=np.full((T,S),NEG); bp=np.zeros((T,S),np.int32)
dp[0,0]=LP[0,ext[0]]; dp[0,1]=LP[0,ext[1]]
for t in range(1,T):
  prev=dp[t-1]
  for s in range(S):
    c=[(prev[s],s)]
    if s>0: c.append((prev[s-1],s-1))
    if s>1 and ext[s]!=blank and ext[s]!=ext[s-2]: c.append((prev[s-2],s-2))
    v,b=max(c); dp[t,s]=v+LP[t,ext[s]]; bp[t,s]=b
s=S-1 if dp[T-1,S-1]>dp[T-1,S-2] else S-2; path=[0]*T
for t in range(T-1,-1,-1): path[t]=s; s=bp[t,s]
first={};last={}
for t,s in enumerate(path):
  if s%2==1: k=s//2; first.setdefault(k,t); last[k]=t
out=[]
for wi,w in enumerate(words):
  ks=[k for k,o in enumerate(own) if o==wi]
  if ks: out.append([w,round(first[ks[0]]/fps,3),round((last[ks[-1]]+1)/fps,3)])
  else: out.append([w,None,None])
json.dump(out,open(sys.argv[3],'w'),ensure_ascii=False); print('ok',T,round(fps,1),file=sys.stderr)
