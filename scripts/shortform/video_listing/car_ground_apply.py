"""car_ground.py 결과(ground.json)를 차 입력 파일과 추적 파일에 반영한다.
- 컷 길이는 그대로 두고(음성에 묶임), 부위가 가장 또렷이 보이는 구간으로 원본 구간(src)을 옮긴다.
- 추적 점 = 매 표본의 검출 상자 가운데를 이어 붙인 것(추적기 없음). 못 찾은 컷은 화살표를 끈다(칩만).
사용: python3 car_ground_apply.py ground.json car_in.json car_out.json tracks_out.json [--thr 0.45]"""
import json,sys,statistics
g=json.load(open(sys.argv[1])); car=json.load(open(sys.argv[2],encoding='utf-8')); THR=float(sys.argv[sys.argv.index('--thr')+1]) if '--thr' in sys.argv else 0.45
tracks={}; rep=[]
def ok(r): return r[1]>=THR and (r[4]-r[2])*(r[5]-r[3])<=0.85
for c in car['cuts']:
    k=c['key']; c.pop('track',None)
    if k not in g or not c.get('chip'): continue
    rows=g[k]['rows']; a,b=g[k]['range']; s0,s1=c['src']; dur=s1-s0
    def stat(w0):
        rr=[r for r in rows if w0-1e-6<=r[0]<=w0+dur+1e-6]; good=[r for r in rr if ok(r)]
        return (len(good)/max(1,len(rr)), sum(r[1] for r in good)/max(1,len(rr)), rr)
    cur=stat(s0) if a-0.05<=s0 and s1<=b+0.05 else (0,0,[])
    cands=[]; w=a
    while w+dur<=b+1e-6: cands.append((stat(w),w)); w+=0.1
    best=max(cands,key=lambda x:(round(x[0][0],2),x[0][1])) if cands else (cur,s0)
    use,w0=(cur,s0) if cur[0]>=0.8 and cur[1]>=best[0][1]-0.08 else best
    cov,ms,rr=use
    if cov<0.6:
        c['arrow']=False; rep.append((k,c['chip'],'화살표 끔(부위를 또렷이 못 찾음)',round(cov,2),round(ms,2))); continue
    c['src']=[round(w0,2),round(w0+dur,2)]
    good=[r for r in rr if ok(r)]; pts=[(r[0],(r[2]+r[4])/2,(r[3]+r[5])/2) for r in good]
    mx=statistics.median(p[1] for p in pts); my=statistics.median(p[2] for p in pts)
    keep=[p for p in pts if abs(p[1]-mx)<0.3 and abs(p[2]-my)<0.3] or pts   # 한두 장 튀는 검출 버림
    n=int(round(dur*30))+1; out=[]
    for i in range(n):
        t=w0+i/30
        if t<=keep[0][0]: out.append([keep[0][1],keep[0][2]]); continue
        if t>=keep[-1][0]: out.append([keep[-1][1],keep[-1][2]]); continue
        for p,q in zip(keep,keep[1:]):
            if p[0]<=t<=q[0]:
                u=(t-p[0])/max(1e-6,q[0]-p[0]); out.append([p[1]+(q[1]-p[1])*u,p[2]+(q[2]-p[2])*u]); break
    tracks[k]={'s0':c['src'][0],'s1':c['src'][1],'pts':out}; c['track']=[round(keep[0][0],2),round(keep[0][1],3),round(keep[0][2],3)]
    rep.append((k,c['chip'],c['src'],'표본 %d/%d'%(len(keep),len(rr)),round(ms,2)))
json.dump(car,open(sys.argv[3],'w',encoding='utf-8'),ensure_ascii=False,indent=1); json.dump(tracks,open(sys.argv[4],'w'))
for r in rep: print(*r)
