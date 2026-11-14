import json,sys
R=sys.argv[1]; tot=dict(words=0,miss=0,short=0,gap=0)
for n in ['01','03','05','06','09','12','14','16','18','19']:
  m=json.load(open(f'{R}/out{n}/manifest.json'))
  subs=sorted([i for i in m['items'] if i['kind']=='sub'],key=lambda i:i['t0'])
  cl=m['clips']; bad=[]
  for k,(a,b,s0,s1,txt,tp) in enumerate(cl):
    nx=cl[k+1][2] if k+1<len(cl) else 99
    words=txt.replace('|',' ').replace('/',' ').split()
    inside=[s for s in subs if s['t0']>=s0-0.25 and s['t0']<nx-0.05]
    shown=[s['text'].replace('|',' ').split()[s['hi']] for s in inside]
    tot['words']+=len(words)
    j=0;miss=[]
    for w in words:
      if j<len(shown) and shown[j]==w: j+=1
      else: miss.append(w)
    tot['miss']+=len(miss)
    sh=[s for s in inside if s['t1']-s['t0']<0.12]; tot['short']+=len(sh)
    cov=sorted((s['t0'],s['t1']) for s in inside); t=s0
    for x0,x1 in cov:
      if x0-t>0.25: tot['gap']+=1; bad.append(('빈',round(t,2),round(x0,2)))
      t=max(t,x1)
    if s1-t>0.25: tot['gap']+=1; bad.append(('빈끝',round(t,2),round(s1,2),txt[:15]))
    if miss: bad.append(('빠짐',txt,miss))
    for s in sh: bad.append(('짧음',s['text'],s['hi'],round(s['t1']-s['t0'],2)))
  print(n, bad if bad else 'OK')
print(tot)
