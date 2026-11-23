#!/usr/bin/env python3
# 씽크·끊김 검사(2026-11-24). check_be · edit_gate 와 함께 통과해야 전달한다.
# 사용: python3 scripts/shortform/sync_smooth_gate.py <완성 mp4> <차 폴더>
# 끊김: ① 원본 fps = 렌더가 읽은 fps ② 느린 컷 금지선 ③ 완성본에서 움직이는 중 한 장면만 멈칫한 횟수 ④ 0.5초 넘게 멈춘 구간(끝 로고 제외)
# 씽크: ⑤ 말 덩어리 수 = 대본 문장 수 ⑥ 문장 첫 낱말이 실제 소리 시작과 0.12초 안 ⑦ 낱말 시각이 겹치거나 뒤집히지 않음 ⑧ 낱말 시작이 소리 없는 곳에 있지 않음
# 길이: ⑨ 음성이 원본의 1.3배보다 길면 경고
import cv2,json,subprocess,sys,numpy as np
mp4,G=sys.argv[1],sys.argv[2].rstrip('/')+'/'; MIN_RATE=0.5; WARN_RATE=0.6; bad=[]; warn=[]
def ok(c,msg,soft=False):
    print(('  ✓ ' if c else ('  △ ' if soft else '  ✗ '))+msg); (None if c else (warn if soft else bad).append(msg))
P=json.load(open(mp4+'.plan.json')); car=json.load(open(G+'car.json')); plan=json.load(open(G+'plan_auto.json')); W=json.load(open(G+'words5.json'))
fps=eval(subprocess.run(['ffprobe','-v','error','-select_streams','v','-show_entries','stream=avg_frame_rate','-of','csv=p=0',G+'src.mp4'],capture_output=True,text=True).stdout.strip())
ok(abs(fps-P.get('src_fps',30))<0.01,f"원본 {fps:g}fps = 렌더가 읽은 {P.get('src_fps',30):g}fps")
ok(abs(fps-30)<0.01 or P.get('blend'),f"원본이 30fps가 아니면 장면 섞기 켬(지금 {'켬' if P.get('blend') else '끔'})")
rates=[(c['key'],(c['src'][1]-c['src'][0])/(p['t1']-p['t0'])) for c,p in zip(car['cuts'],plan['cuts'])]; lo=min(rates,key=lambda r:r[1])
ok(lo[1]>=MIN_RATE,f"가장 느린 컷 {lo[0]} {lo[1]:.2f}배속 (금지선 {MIN_RATE})"); ok(not [r for r in rates if r[1]<WARN_RATE],f"0.6배속 미만 컷 {[f'{k} {r:.2f}' for k,r in rates if r<WARN_RATE]}",soft=True)
c=cv2.VideoCapture(mp4); F=c.get(cv2.CAP_PROP_FPS); p=None; d=[]
while 1:
    o,f=c.read()
    if not o: break
    g=cv2.cvtColor(cv2.resize(f[300:1100],(270,200)),cv2.COLOR_BGR2GRAY).astype(np.float32)
    if p is not None: d.append(float(np.abs(g-p).mean()))
    p=g
d=np.array(d); jud=sum(1 for i in range(1,len(d)-1) if d[i]<0.25 and d[i-1]>0.8 and d[i+1]>0.8); endt=W[car['end_word']][1]; fr=[]; i=0
while i<len(d):
    if d[i]<0.25:
        j=i
        while j<len(d) and d[j]<0.25: j+=1
        if (j-i)/F>=0.5 and i/F<endt-0.3: fr.append((round(i/F,2),round((j-i)/F,2)))
        i=j
    else: i+=1
ok(jud<=3,f"움직이는 중 멈칫 {jud}회 (허용 3)"); ok(not fr,f"0.5초 넘게 멈춘 구간(시작, 길이) {fr}",soft=True)
a=np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',G+'voice5.wav','-ac','1','-ar','16000','-f','f32le','-'],capture_output=True).stdout,np.float32); h=160
e=np.array([np.sqrt((a[k:k+h]**2).mean()) for k in range(0,len(a)-h,h)]); e/=e.max(); on=e>0.03; seg=[]; i=0
while i<len(on):
    if on[i]:
        j=i
        while j<len(on) and on[j]: j+=1
        if seg and i/100-seg[-1][1]<0.15: seg[-1][1]=j/100
        else: seg.append([i/100,j/100])
        i=j
    else: i+=1
lines=[l.split() for l in open(G+'script.txt',encoding='utf-8').read().strip().split('\n')]
ok(len(seg)==len(lines),f"말 덩어리 {len(seg)}개 = 대본 {len(lines)}문장")
if len(seg)==len(lines):
    k=0; off=[]
    for s,l in zip(seg,lines):
        if abs(W[k][1]-s[0])>0.12: off.append((W[k][0],round(W[k][1]-s[0],2)))
        k+=len(l)
    ok(not off,f"문장 첫 낱말이 실제 소리 시작과 0.12초 안 (벗어남 {off})")
ok(all(W[i][1]<W[i][2] and (i==0 or W[i][1]>=W[i-1][1]) for i in range(len(W))) and not [1 for i in range(1,len(W)) if W[i][1]<W[i-1][2]-0.02],"낱말 시각이 겹치거나 뒤집히지 않음")
sil=[w[0] for w in W if e[int(w[1]*100):int(w[1]*100)+12].max()<0.03]; ok(not sil,f"낱말 시작이 소리 없는 곳에 있지 않음 {sil}")
vd=len(a)/16000; sd=float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',G+'src.mp4'],capture_output=True,text=True).stdout)
ok(vd<=sd*1.3,f"음성 {vd:.1f}초 ≤ 원본 {sd:.1f}초 × 1.3",soft=True)
print('통과' if not bad else '실패'+(f' {len(bad)}건' if bad else '')); sys.exit(1 if bad else 0)
