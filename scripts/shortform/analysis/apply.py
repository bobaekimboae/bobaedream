import json,os,numpy as np,collections,pickle
from feat import feat
from sklearn.ensemble import RandomForestClassifier
rows=json.load(open('labels.json'))
X=[];y=[];T=[];Mu=[];Xm=[]
for r in rows:
    f=feat(r['src'],r['vid'],r['t'])
    if f is None: continue
    if r['lab']['sfx']!='unsure':
        X.append(f);y.append(r['lab']['sfx']=='yes');T.append((r['lab'].get('type') or '') if r['lab']['sfx']=='yes' else '')
    if r['lab'].get('music') in('yes','no'):
        Xm.append(f);Mu.append(r['lab']['music']=='yes')
X=np.array(X);y=np.array(y)
sfx=RandomForestClassifier(500,min_samples_leaf=3,class_weight='balanced',random_state=0).fit(X,y)
mus=RandomForestClassifier(300,min_samples_leaf=3,class_weight='balanced',random_state=0).fit(np.array(Xm),np.array(Mu))
print('types',collections.Counter(T))
from sklearn.model_selection import GroupKFold,cross_val_predict
g=[r['vid'] for r in rows if feat(r['src'],r['vid'],r['t']) is not None and r['lab'].get('music') in('yes','no')]
pm=cross_val_predict(RandomForestClassifier(300,min_samples_leaf=3,class_weight='balanced',random_state=0),np.array(Xm),np.array(Mu),groups=g,cv=GroupKFold(5))
print('music cv acc',round((pm==np.array(Mu)).mean(),3),'n',len(Mu),'yes',sum(Mu))
# track kind
D=json.load(open('trk_train.json'));Xk=np.array(D['X']);yk=np.array(D['y']);src=np.array([1 if v.startswith('nl') else 0 for v in D['g']])
kind=RandomForestClassifier(600,min_samples_leaf=2,random_state=0,class_weight='balanced').fit(np.c_[Xk,src],yk)
pickle.dump(dict(sfx=sfx,mus=mus,kind=kind),open('models.pkl','wb'))
