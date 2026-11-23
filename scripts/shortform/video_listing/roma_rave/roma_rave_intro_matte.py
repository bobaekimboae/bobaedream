import os
# 인트로 차 윤곽: SAM 2.1(로마만 고르기) × BiRefNet-lite(rembg ONNX, MIT, 가장자리 선명) → pseg/intro_sam.npz, intro_bir.npz
import cv2, numpy as np, torch, time, sys
torch.set_num_threads(2); W, H = 1080, 1920; N = 64; t0 = 0.0; yf = .5   # 정면 샷(원본 0~2초)
cap = cv2.VideoCapture(os.environ.get('ROMA_SRC', '../raw/roma.mp4')); SH = int(cap.get(4)); y0 = int(min(SH - H, max(0, yf * SH - H / 2)))
cap.set(cv2.CAP_PROP_POS_MSEC, t0 * 1000); fr = []
for _ in range(N):
    ok, f = cap.read()
    if not ok: break
    fr.append(cv2.cvtColor(f[y0:y0 + H], cv2.COLOR_BGR2RGB))
print('frames', len(fr), flush=True); T = time.time()
if 'sam' in sys.argv:
    from transformers import Sam2VideoModel, Sam2VideoProcessor
    M = Sam2VideoModel.from_pretrained('facebook/sam2.1-hiera-tiny').eval(); P = Sam2VideoProcessor.from_pretrained('facebook/sam2.1-hiera-tiny')
    small = [cv2.resize(f, (540, 960)) for f in fr]; st = P.init_video_session(video=small, inference_device='cpu', dtype=torch.float32)
    pos = [(450, 990), (540, 870), (750, 1082), (660, 722)]; neg = [(60, 812), (540, 1589)]
    P.add_inputs_to_inference_session(inference_session=st, frame_idx=0, obj_ids=[1], input_points=[[[[x / 2, y / 2] for x, y in pos + neg]]], input_labels=[[[1] * len(pos) + [0] * len(neg)]])
    out = {}
    with torch.no_grad():
        for o in M.propagate_in_video_iterator(st, start_frame_idx=0):
            out[o.frame_idx] = P.post_process_masks([o.pred_masks], original_sizes=[[960, 540]], binarize=True)[0][0, 0].numpy().astype(np.uint8)
    np.savez_compressed('pseg/intro_sam.npz', m=np.stack([out[i] for i in sorted(out)])); print('sam', round(time.time() - T), flush=True)
if 'bir' in sys.argv:
    from rembg import new_session, remove
    from PIL import Image
    S = new_session(sys.argv[-1] if sys.argv[-1].startswith(('isnet','birefnet','u2net')) else 'isnet-general-use'); A = []
    for i, f in enumerate(fr):
        m = remove(Image.fromarray(f).resize((720, 1280)), session=S, only_mask=True).resize((720, 1280), Image.BILINEAR)
        A.append(np.array(m))
        if i % 20 == 0: print('bir', i, round(time.time() - T), flush=True)
    np.savez_compressed('pseg/intro_bir.npz', a=np.stack(A)); print('bir done', round(time.time() - T), flush=True)
