"""손 닿는 순간 부위 윤곽선(나세르식) — 2026-11-24 M235i r02.
1) OWLv2(Apache-2.0)로 부위 상자  2) MediaPipe Hands(Apache-2.0)로 집게손가락 끝이 상자에 처음 들어오는 순간 = 닿는 시점
3) SAM 2.1 tiny(Apache-2.0, transformers Sam2Video)로 부위 윤곽을 따서 컷 끝까지 따라감 → outline.json
렌더러가 닿는 시점부터 0.3초에 걸쳐 윤곽선을 한 바퀴 그린다(원본 화면은 고치지 않음, 선만 위에 그림).
사용: python3 touch_outline.py <작업 폴더> c2:a_car_headlight c9:an_ambient_light_strip_on_a_car_door_panel
"""
import json, os, sys, numpy as np, cv2, torch
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'photo_listing'))
import part_anchor as PA
G = os.path.abspath(sys.argv[1]) + '/'
TR = json.load(open(G + 'tracks.json'))
SW, SH = 540, 960   # 계산용 축소(윤곽 좌표는 0~1로 저장)

def frames(s0, s1):
    cap = cv2.VideoCapture(G + 'src.mp4'); cap.set(cv2.CAP_PROP_POS_MSEC, s0 * 1000); fr = []
    for _ in range(int(round((s1 - s0) * 30)) + 1):
        ok, f = cap.read()
        if not ok: break
        fr.append(cv2.cvtColor(cv2.resize(f, (SW, SH)), cv2.COLOR_BGR2RGB))
    return fr

HAND_MODEL = os.environ.get('HAND_MODEL', os.path.join(os.path.dirname(G.rstrip('/')), '..', 'hand_landmarker.task'))
# 모델: https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task (Apache-2.0, 7.8MB, 저장소에 넣지 않음)
def fingertips(fr):
    import mediapipe as mp
    from mediapipe.tasks.python import vision, BaseOptions
    opt = vision.HandLandmarkerOptions(base_options=BaseOptions(model_asset_path=HAND_MODEL), running_mode=vision.RunningMode.VIDEO,
                                       num_hands=2, min_hand_detection_confidence=0.4)
    out = []
    with vision.HandLandmarker.create_from_options(opt) as h:
        for i, f in enumerate(fr):
            r = h.detect_for_video(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(f)), int(i * 1000 / 30))
            out.append([(lm[8].x, lm[8].y) for lm in (r.hand_landmarks or [])])
    return out

def sam_track(fr, box, start):
    from transformers import Sam2VideoModel, Sam2VideoProcessor
    mid = 'facebook/sam2.1-hiera-tiny'
    model = Sam2VideoModel.from_pretrained(mid).eval(); proc = Sam2VideoProcessor.from_pretrained(mid)
    sess = proc.init_video_session(video=[Image.fromarray(f) for f in fr], inference_device='cpu', dtype=torch.float32)
    proc.add_inputs_to_inference_session(inference_session=sess, frame_idx=start, obj_ids=1, input_boxes=[[box]])
    masks = {}
    with torch.inference_mode():
        for rev in (False, True):
            for o in model.propagate_in_video_iterator(sess, start_frame_idx=start, reverse=rev):
                m = proc.post_process_masks([o.pred_masks], original_sizes=[[SH, SW]], binarize=True)[0]
                masks[o.frame_idx] = m[0, 0].numpy().astype(np.uint8)
    return masks

def poly(m):
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not cs: return None
    c = max(cs, key=cv2.contourArea)
    if cv2.contourArea(c) < SW * SH * 0.002: return None
    c = cv2.approxPolyDP(c, 1.5, True)[:, 0, :]
    return [[round(x / SW, 4), round(y / SH, 4)] for x, y in c]

OUT = json.load(open(G + 'outline.json')) if os.path.exists(G + 'outline.json') else {}
for arg in sys.argv[2:]:
    key, q = arg.split(':', 1); q = q.replace('_', ' '); s0, s1 = TR[key]['s0'], TR[key]['s1']
    fr = frames(s0, s1); tips = fingertips(fr)
    PA.PROMPTS['_q'] = q; best = None
    for i in range(0, len(fr), 6):   # 0.2초마다 상자 찾기, 점수 가장 높은 장면
        d = PA.detect(Image.fromarray(fr[i]), ['_q'], thr=0.08)['_q']
        d = [x for x in d if (x[1][2] - x[1][0]) * (x[1][3] - x[1][1]) < 0.5 * SW * SH]
        if d:
            s, b = max(d, key=lambda x: x[0])
            if best is None or s > best[0]: best = (s, b, i)
    if not best: print(key, '부위 못 찾음'); continue
    s, b, bi = best; bx = [float(v) for v in b]
    pad = 0.12 * max(bx[2] - bx[0], bx[3] - bx[1]); inb = lambda p: bx[0] - pad <= p[0] * SW <= bx[2] + pad and bx[1] - pad <= p[1] * SH <= bx[3] + pad
    touch = next((i for i, t in enumerate(tips) if any(inb(p) for p in t)), None)
    start = max(0, touch - 3) if touch is not None else bi   # 손이 가리기 직전 장면에서 윤곽을 땀
    if touch is not None and start != bi:   # 그 장면의 상자를 다시 찾음(손 들어오기 직전)
        d = PA.detect(Image.fromarray(fr[start]), ['_q'], thr=0.06)['_q']
        if d: bx = [float(v) for v in max(d, key=lambda x: x[0])[1]]
    masks = sam_track(fr, bx, start)
    polys = [poly(masks[i]) if i in masks else None for i in range(len(fr))]
    OUT[key] = {'s0': s0, 's1': s1, 'touch_s': round(s0 + (touch if touch is not None else bi) / 30, 3), 'by_hand': touch is not None, 'box_score': round(float(s), 3), 'polys': polys}
    print(f"{key}: 상자 점수 {s:.2f} · 손 닿음 {'%.2f초' % (s0 + touch / 30) if touch is not None else '못 찾음(상자 최고 장면 사용)'} · 윤곽 {sum(p is not None for p in polys)}/{len(polys)}", flush=True)
    sheet = []
    for i in range(0, len(fr), max(1, len(fr) // 6)):
        f = fr[i].copy()
        if polys[i]: cv2.polylines(f, [np.array([[x * SW, y * SH] for x, y in polys[i]], np.int32)], True, (255, 242, 0), 4)
        for p in tips[i]: cv2.circle(f, (int(p[0] * SW), int(p[1] * SH)), 10, (255, 0, 0), -1)
        sheet.append(cv2.resize(f, (270, 480)))
    cv2.imwrite(G + f'outline_{key}.jpg', cv2.cvtColor(np.hstack(sheet[:7]), cv2.COLOR_RGB2BGR))
json.dump(OUT, open(G + 'outline.json', 'w'))
