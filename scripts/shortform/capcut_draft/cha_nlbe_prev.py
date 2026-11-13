import json,subprocess,sys
from PIL import Image
n=sys.argv[1]; m=json.load(open(f'out{n}/manifest.json')); src=f'/mnt/user-data/uploads/autostudio_analysis/sk1113/src/{n}_shortform.mp4'
def srct(t):
    p=0
    for a,b in m['cuts']:
        if t<p+(b-a): return a+(t-p)
        p+=b-a
    return m['cuts'][-1][1]-0.05
T=[float(x) for x in sys.argv[2:]] if len(sys.argv)>2 else [c['t0']+0.5 for c in m['items'] if c['kind']=='chip']
tiles=[]
for t in T:
    subprocess.run(['ffmpeg','-v','error','-y','-ss',str(srct(t)),'-i',src,'-frames:v','1',f'_f{n}.png'],check=True)
    f=Image.open(f'_f{n}.png').convert('RGBA')
    for it in m['items']:
        if it['t0']<=t<it['t1'] and it['kind'] in ('chip','sub'): f.alpha_composite(Image.open(f'out{n}/'+it['file']).convert('RGBA'))
    tiles.append(f.resize((270,480)))
W=Image.new('RGB',(270*len(tiles),480)); [W.paste(x.convert('RGB'),(270*i,0)) for i,x in enumerate(tiles)]; W.save(f'prev{n}.jpg',quality=80)
