import json,time,sys,glob,numpy as np,torch
from PIL import Image
from transformers import Sam2VideoModel, Sam2VideoProcessor
torch.set_num_threads(2)
t=time.time()
model=Sam2VideoModel.from_pretrained('facebook/sam2.1-hiera-small').eval()
proc=Sam2VideoProcessor.from_pretrained('facebook/sam2.1-hiera-small')
print('load',round(time.time()-t,1),flush=True)
def first_box(c):
    r=json.load(open(f'{c}.json')); k=min(r['frames'],key=int); return int(k),r['frames'][k][0]['box'],None
CL={'c2':first_box('c2'),'c3':first_box('c3'),'c4':first_box('c4'),'c6':first_box('c6'),'c8b':first_box('c8b'),
    'c7d':(0,[210,430,539,779],[[330,540],[420,630]]),'c9d':(30,[370,265,539,409],[[445,330]])}
src={'c8b':'c8','c7d':'c7','c9d':'c9'}
for c in sys.argv[1:]:
    fi,box,pts=CL[c]; d='fr_'+src.get(c,c)
    frames=[Image.open(f) .convert('RGB') for f in sorted(glob.glob(f'{d}/*.png'))]
    t0=time.time()
    sess=proc.init_video_session(video=frames,inference_device='cpu',dtype=torch.float32)
    kw=dict(inference_session=sess,frame_idx=fi,obj_ids=1,input_boxes=[[box]])
    if pts: kw.update(input_points=[[[p for p in pts]]],input_labels=[[[1]*len(pts)]])
    proc.add_inputs_to_inference_session(**kw)
    with torch.inference_mode(): model(inference_session=sess,frame_idx=fi)
    out={}
    with torch.inference_mode():
     for rev in ([False,True] if fi>0 else [False]):
         for o in model.propagate_in_video_iterator(sess,start_frame_idx=fi,reverse=rev):
             m=proc.post_process_masks([o.pred_masks],original_sizes=[[sess.video_height,sess.video_width]],binarize=True)[0][0,0].numpy()
             out[o.frame_idx]=m
    dt=time.time()-t0
    N=len(frames); arr=np.zeros((N,960,540),np.uint8)
    for k,m in out.items(): arr[k]=m.astype(np.uint8)
    np.save(f's2_{c}.npy',arr)
    json.dump({'wall':round(dt,2),'n':N},open(f's2_{c}.json','w'))
    print(c,'frames',N,'masks',int((arr.reshape(N,-1).sum(1)>0).sum()),'wall',round(dt,1),flush=True)
