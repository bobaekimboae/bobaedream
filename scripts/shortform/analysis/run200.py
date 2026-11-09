import json,os,numpy as np,pickle,random,collections
from feat import feat,load
M=pickle.load(open('models.pkl','rb'))
S200=json.load(open('set200.json'))
KC=list(M['kind'].classes_)
out=[]
random.seed(7)
for src in ['nl','be']:
    for vid in S200[src]:
        tr=json.load(open(f'ov600/{src}_{vid}.json')); sx=json.load(open(f'sfx600/{src}_{vid}.json'))
        dur=tr['dur']; rec=dict(src=src,id=vid,dur=dur,cuts=sx['cuts'],moments=[])
        d=load(src,vid)
        rec['beat_med']=float(np.median(d['beat'])) if d else None
        def add(kind,t,extra=None):
            f=feat(src,vid,t)
            if f is None: return
            p=float(M['sfx'].predict_proba([f])[0,1]); pm=float(M['mus'].predict_proba([f])[0,1])
            m=dict(kind=kind,t=round(t,2),p=round(p,3),pmus=round(pm,3),tonal_f=int(10**f[1]),dt=round(f[2],2),line_rel=round(f[3],1))
            if extra: m.update(extra)
            rec['moments'].append(m)
        for k in tr['tracks']:
            fv=[k['t0']/max(dur,1),k['dur'],k['cx'],k['cy'],k['w'],k['h'],k['yd'],k['dk'],k['wd'],abs(k['ang']) if k['ang'] is not None else 0,k['red'],k['grow0'] or 1,k['sfx_hf'] or 0,k['sfx_lf'] or 0,dur-k['t1'],1 if src=='nl' else 0]
            pk=M['kind'].predict_proba([fv])[0]
            add('track',k['t0'],dict(kp={c:round(float(v),3) for c,v in zip(KC,pk)},cx=k['cx'],cy=k['cy'],w=k['w'],h=k['h'],tdur=k['dur'],ang=k['ang']))
        for c in sx['cuts']:
            if 0.5<c<dur-0.5: add('cut',c)
        add('start',0.05)
        occupied=[m['t'] for m in rec['moments']]
        n=0;tries=0
        while n<15 and tries<300:
            tries+=1;t=random.uniform(1,dur-1)
            if all(abs(t-o)>0.8 for o in occupied): add('random',t);n+=1
        out.append(rec)
json.dump(out,open('res200.json','w'))
print(len(out))
