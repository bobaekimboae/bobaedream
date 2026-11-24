# SAM 2.1 tiny: 손이 닿은 부위·트렁크 마스크를 실제 편집에 쓰는 프레임(속도 적용) 그대로 추적 → pseg/<key>.npz
import sys, time, numpy as np, torch, cv2
sys.path.insert(0, '/home/claude/shorts/m235'); from shots import read_shot, TOUCH
from transformers import Sam2VideoModel, Sam2VideoProcessor
# key: (시작 프레임, 부위 점들(1080x1920), 손 점 or None, 부위 밖 점들)
T = {'led': (3, [(360, 840), (840, 630)], (360, 1500), [(540, 1350)]),
     'xd': (30, [(450, 948), (630, 1032), (540, 990)], (150, 1680), [(540, 600), (300, 1300)]),
     'trunk': (24, [(540, 1200), (240, 1380), (840, 1380), (540, 1450)], None, [(540, 1740), (150, 1640), (930, 1640), (60, 1250), (1020, 1250), (540, 520), (300, 560), (540, 880)]),
     'wl': (33, [(480, 1020), (660, 1200), (360, 1260)], None, [(540, 600), (900, 1500), (300, 1600), (900, 900)]),
     'amb': (3, [(120, 1170), (600, 1050), (900, 972)], (180, 1560), [(600, 600), (700, 1500)]),
     'mb': (18, [(558, 1188)], (360, 1620), [(540, 480), (558, 1500)]),
     'gear': (30, [(390, 900), (570, 1080), (600, 1230)], (120, 1380), [(800, 700), (700, 1600)]),
     'eng': (6, [(240, 900), (480, 1260), (780, 1020)], (360, 1680), [(540, 240)])}
torch.set_num_threads(2)
M = Sam2VideoModel.from_pretrained('facebook/sam2.1-hiera-tiny').eval(); P = Sam2VideoProcessor.from_pretrained('facebook/sam2.1-hiera-tiny')
for k in (sys.argv[1:] or list(T)):
    s0, pp, hp, neg = T[k]; src, sp = TOUCH[k]; t_ = time.time()
    fr = [cv2.resize(f, (540, 960)) for f in read_shot(src, sp, s0 + 42)[s0:]]
    st = P.init_video_session(video=fr, inference_device='cpu', dtype=torch.float32); h = 0.5
    pts = [[x * h, y * h] for x, y in pp] + [[x * h, y * h] for x, y in neg]; lab = [1] * len(pp) + [0] * len(neg)
    if hp:
        pts.append([hp[0] * h, hp[1] * h]); lab.append(0)
        P.add_inputs_to_inference_session(inference_session=st, frame_idx=0, obj_ids=[1, 2], input_points=[[pts, [[hp[0] * h, hp[1] * h]]]], input_labels=[[lab, [1]]])
    else:
        P.add_inputs_to_inference_session(inference_session=st, frame_idx=0, obj_ids=[1], input_points=[[pts]], input_labels=[[lab]])
    out = {}
    with torch.no_grad():
        for o in M.propagate_in_video_iterator(st, start_frame_idx=0):
            m = P.post_process_masks([o.pred_masks], original_sizes=[[960, 540]], binarize=True)[0]
            out[o.frame_idx] = m[:, 0].numpy().astype(np.uint8)
    idx = sorted(out); part = np.stack([out[i][0] for i in idx]); hand = np.stack([out[i][1] for i in idx]) if hp else np.zeros_like(part)
    np.savez_compressed(f'pseg/{k}.npz', part=part, hand=hand, idx=np.array(idx), start=s0)
    tl = []
    for j in (0, 12, 24, 36, len(idx) - 1):
        im = cv2.cvtColor(fr[idx[j]], cv2.COLOR_RGB2BGR).copy(); ov = im.copy()
        ov[part[j] > 0] = (0, 230, 255); ov[hand[j] > 0] = (255, 0, 255); im = cv2.addWeighted(im, .55, ov, .45, 0)
        cv2.putText(im, f'{k} {j}', (10, 40), 0, 1.2, (0, 255, 0), 3); tl.append(cv2.resize(im, (216, 384)))
    cv2.imwrite(f'pseg/{k}_chk.jpg', np.hstack(tl)); print(k, len(idx), round(time.time() - t_, 1), 's', flush=True)
