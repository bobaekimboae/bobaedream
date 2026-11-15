import json,subprocess
G=(4.27,5.10);H=(5.12,5.93);M=(9.08,9.58);N=(9.62,10.28);O=(10.32,10.93);P=(10.97,11.65)
D=(1.83,2.63);I=(5.97,6.81);J=(6.85,7.51);Q=(11.69,12.55);B=(0.67,1.38);K=(7.55,8.35);A=(0.02,0.63)
C=(1.42,1.80);F=(3.67,4.25);E=(2.67,3.63)
w=json.load(open('words.json'))['words']; st=lambda i: round(w[i]['start']-0.05,3)
END=round(w[-1]['end']+0.4,3)
segs=[(0.0,st(11),[G,M,N],'intro'),(st(11),st(18),[O,P],'engine'),(st(18),st(24),[D,I],'power'),
 (st(24),st(33),[H,A],'zero'),(st(33),st(39),[J,Q],'wheel'),(st(39),st(44),[B,K],'seat'),
 (st(44),st(48),[F,C],'ev'),(st(48),st(55),[G],'ev2'),(st(55),st(61),[E],'screen'),(st(61),END,[N,M],'outro')]
parts=[];idx=0;tl=[]
for a0,a1,clips,key in segs:
    src=sum(e-s for s,e in clips); f=(a1-a0)/src; t=a0
    for s,e in clips:
        d=(e-s)*f
        parts.append(f"[0:v]trim={s}:{e},setpts=(PTS-STARTPTS)*{f:.4f},fps=30,scale=1080:1920,setsar=1[v{idx}]")
        tl.append(dict(key=key,src_s=s,src_e=e,out_s=round(t,3),out_e=round(t+d,3)));t+=d;idx+=1
fc=";".join(parts)+";"+"".join(f"[v{i}]" for i in range(idx))+f"concat=n={idx}:v=1:a=0[out]"
json.dump(tl,open('timeline.json','w'),indent=1)
subprocess.run(['ffmpeg','-v','error','-y','-i','../bgt/src.mp4','-filter_complex',fc,'-map','[out]','-c:v','libx264','-preset','veryfast','-crf','16','-pix_fmt','yuv420p','base.mp4'],check=True)
for a0,a1,c,k in segs: print(k,a0,a1,round((a1-a0)/sum(e-s for s,e in c),2))
