import json,numpy as np,pickle
from feat import feat
M=pickle.load(open('models.pkl','rb'))
R=json.load(open('res200.json'))
out={}
for r in R:
    ts=np.arange(0.3,r['dur']-0.3,0.1)
    F=[feat(r['src'],r['id'],t) for t in ts]
    ok=[i for i,f in enumerate(F) if f is not None]
    p=M['sfx'].predict_proba([F[i] for i in ok])[:,1]
    pk=[]
    for j,i in enumerate(ok):
        if p[j]>=.5 and (j==0 or p[j]>=p[j-1]) and (j==len(ok)-1 or p[j]>=p[j+1]):
            t=ts[i]
            if not pk or t-pk[-1][0]>0.4: pk.append((round(float(t),1),round(float(p[j]),2)))
            elif p[j]>pk[-1][1]: pk[-1]=(round(float(t),1),round(float(p[j]),2))
    out[r['src']+'_'+r['id']]=pk
json.dump(out,open('scan.json','w'))
for s in ['nl','be']:
    rs=[r for r in R if r['src']==s]
    n=np.array([len(out[s+'_'+r['id']]) for r in rs]);pm=np.array([len(out[s+'_'+r['id']])/r['dur']*60 for r in rs])
    # how many scan hits are near a tracked overlay/cut
    near=[];
    for r in rs:
        mom=[m['t'] for m in r['moments'] if m['kind'] in('track','cut','start')]
        for t,_ in out[s+'_'+r['id']]:
            near.append(min([abs(t-x) for x in mom] or [9])<=0.35)
    print(s,'scan sfx/video med',np.median(n),np.percentile(n,[25,75]),'zero',(n==0).sum(),'per min',round(np.median(pm),1),'near overlay/cut',round(np.mean(near),2))
