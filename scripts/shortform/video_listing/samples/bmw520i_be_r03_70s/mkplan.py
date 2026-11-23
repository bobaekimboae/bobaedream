# 컷 계획: 컷 시작 = 문장 첫 낱말 0.1초 전. 칩이 1.5초 못 뜨면 컷 시작부터. km 숫자만 카운트업(T04)
import json
c=json.load(open('car.json')); w=json.load(open('words5.json')); cuts=c['cuts']; pc=[]; n=0
t0s=[0.0]+[round(w[x['word']][1]-0.1,2) for x in cuts[1:]]+[round(w[c['end_word']][1]-0.1,2)]
for i,x in enumerate(cuts):
    t0,t1=t0s[i],t0s[i+1]; tech=[]
    for b in x.get('bigs',[]):
        if 'km' in b[0]: tech.append({'id':'T04','word':b[2],'value':b[0],'at':round(w[b[2]][1]-0.22,2)}); n+=1
    if x.get('chip') and t1-(w[x['chip_word']][1]-0.06)<1.5: x['chip_word']=x['word']
    pc.append({'key':x['key'],'t0':t0,'t1':t1,'options':[],'chip':None,'techniques':tech})
    print(x['key'],t0,t1,x['src'],round((x['src'][1]-x['src'][0])/(t1-t0),2))
json.dump({'cuts':pc,'summary':{'T04':n}},open('plan_auto.json','w'),ensure_ascii=False,indent=1); json.dump(c,open('car.json','w'),ensure_ascii=False,indent=1)
