import json,sys,difflib,re
W=json.load(open(sys.argv[1]))['words'];S=open('script.txt').read().split()
cl=lambda s:re.sub(r'[^\w]','',s)
REP=[('GTS','지티에스'),('V8','브이에이트'),('680','육백팔십'),('930','구백삼십'),('306','삼백육'),('22','이십이'),('.5','점오'),('4','사'),('3','삼')]
def hn(t):
  for a,b in REP: t=t.replace(a,b)
  return t
for w in W: w['text']=hn(w['text'])
hc=[];ht=[]
for w in W:
  t=cl(w['text']);n=max(len(t),1)
  for k,ch in enumerate(t):
    hc.append(ch);ht.append((w['start']+(w['end']-w['start'])*k/n,w['start']+(w['end']-w['start'])*(k+1)/n))
rc=[];ri=[]
for i,s in enumerate(S):
  for ch in cl(s): rc.append(ch);ri.append(i)
m=difflib.SequenceMatcher(None,rc,hc,autojunk=False)
mp={}
for a,b,n in m.get_matching_blocks():
  for k in range(n): mp[a+k]=b+k
out=[]
for i,s in enumerate(S):
  idx=[mp[j] for j in range(len(rc)) if ri[j]==i and j in mp]
  out.append(dict(text=s,type='word',start=round(ht[idx[0]][0],3) if idx else None,end=round(ht[idx[-1]][1],3) if idx else None,cov=round(len(idx)/len(cl(s)),2)))
# fill gaps by interpolation
for i,o in enumerate(out):
  if o['start'] is None:
    p=next((out[j]['end'] for j in range(i-1,-1,-1) if out[j]['end'] is not None),0)
    q=next((out[j]['start'] for j in range(i+1,len(out)) if out[j]['start'] is not None),p+0.4)
    o['start'],o['end']=round(p+0.02,3),round(q-0.02,3)
words=[dict(text='[excited]',type='word',start=0.0,end=0.1)]+out
json.dump(dict(words=words),open('words.json','w'),ensure_ascii=False,indent=0)
print('low cov',[(o['text'],o['cov']) for o in out if o['cov']<0.8])
for i,o in enumerate(words): print(i,o['text'],o['start'],o['end'])
