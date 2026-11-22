import json,sys,collections
L=json.load(open(sys.argv[1])); W,H=1080,1920
F=collections.defaultdict(lambda:{'pop':[],'sub':[],'arr':[]})
for r in L: F[r[1]][r[0]].append(r)
def ov(a,b):
    x=max(0,min(a[2],b[2])-max(a[0],b[0])); y=max(0,min(a[3],b[3])-max(a[1],b[1])); return x*y
def area(a): return max(1,(a[2]-a[0])*(a[3]-a[1]))
issues=collections.defaultdict(list)
for n,f in sorted(F.items()):
    t=n/30; P=[p[3:7] for p in f['pop']]; key=(f['pop']+f['sub']+f['arr'])[0][2]
    for i in range(len(P)):
        for j in range(i+1,len(P)):
            o=ov(P[i],P[j])
            if o>0.03*min(area(P[i]),area(P[j])): issues[('겹침:그래픽끼리',key)].append((round(t,2),P[i],P[j],round(o/min(area(P[i]),area(P[j])),2)))
        for s in f['sub']:
            o=ov(P[i],s[3:7])
            if o>0: issues[('겹침:그래픽-자막',key)].append((round(t,2),P[i],s[3:7]))
        b=P[i]
        if b[0]<24 or b[2]>W-24 or b[1]<100 or b[3]>H-260: issues[('안전영역 밖',key)].append((round(t,2),b))
    for a in f['arr']:
        _,_,_,tx,ty,bl,Lr,Lc,bob,cx,cy,cb=a
        chip=[cx+cb[0],cy+cb[1],cx+cb[2],cy+cb[3]]
        tail=ty+24+Lr if bl else ty-24-Lr
        gap=(chip[1]-tail) if bl else (tail-chip[3])
        if not -4<=gap<=26: issues[('화살표-칩 틈(기준 6±)',key)].append((round(t,2),round(gap)))
        if not chip[0]+20<=tx<=chip[2]-20: issues[('화살표가 칩 밖 x',key)].append((round(t,2),tx,chip))
        for p in P:
            if p!=chip and p[0]<=tx<=p[2] and p[1]<=ty<=p[3]: issues[('부위를 가림',key)].append((round(t,2),p,(tx,ty)))
        if Lr<70: issues[('화살표 너무 짧음',key)].append((round(t,2),Lr))
for (k,key),v in sorted(issues.items(),key=lambda x:x[0][1] or ''):
    print(f'{key:5} {k:22} {len(v):4}프레임  예: {v[0]}  ~ {v[-1][0]}')
