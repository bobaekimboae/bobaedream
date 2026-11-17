import sys,runpy,os
k=sys.argv[1]; ts=[float(x) for x in sys.argv[2:]]
sys.argv=['c',k,'--plan']
try: g=runpy.run_path('common.py',run_name='notmain')
except SystemExit: pass
from PIL import Image
ims=[]
for T in ts:
    b=Image.fromarray(g['base_frame'](T)).convert('RGBA'); b.alpha_composite(g['overlay'](T)); ims.append(b.convert('RGB').resize((270,480)))
sh=Image.new('RGB',(270*len(ims),480))
for i,im in enumerate(ims): sh.paste(im,(270*i,0))
sh.save(f'{k}_still.jpg',quality=80)
print(k,'ok')
