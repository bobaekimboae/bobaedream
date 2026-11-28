import json, subprocess, sys, time, os
sys.path.insert(0,'/home/claude/bobaedream/scripts/shortform/auto')
import sam31_api as S
SRC='../m235/job/src.mp4'
T=json.load(open('../m235/job/tracks.json'))
JOBS=[('c2','headlight'),('c3','wheel center cap logo'),('c4','taillight'),
      ('c6','logo projected on the ground'),('c7','door sill plate'),('c8','car seat'),('c9','door handle')]
res={}
for c,p in JOBS:
    s0,s1=T[c]['s0'],T[c]['s1']
    out=f'{c}.mp4'
    if not os.path.exists(out):
        subprocess.run(['ffmpeg','-v','error','-y','-ss',f'{s0:.3f}','-i',SRC,'-t',f'{s1-s0:.3f}','-an','-vf','scale=540:960',
                        '-c:v','libx264','-crf','20','-movflags','+faststart',out],check=True)
    nf=int(subprocess.run(['ffprobe','-v','error','-count_frames','-select_streams','v','-show_entries','stream=nb_read_frames','-of','csv=p=0',out],capture_output=True,text=True).stdout)
    t0=time.time(); r=S.segment(out,p,conf=True); dt=time.time()-t0
    r['nframes']=nf; r['wall']=round(dt,2); r['s0']=s0; r['s1']=s1
    json.dump(r,open(f'{c}.json','w'))
    print(c,p,'frames',nf,'hit',len(r['frames']),'ids',sorted({o['id'] for v in r['frames'].values() for o in v}),'wall',round(dt,2),flush=True)
