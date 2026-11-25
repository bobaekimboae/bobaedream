# T4: VitTrack(OpenCV 판별) 상자를 SAM 3.1 상자와 비교. 첫 장면 SAM 상자로 시작, 뒤 장면 IoU 평균.
import json, glob, os, sys, cv2
import numpy as np
VIT = '/home/claude/rr/scripts/shortform/models/vittrack_2023sep.onnx'
E = '/tmp/wt_sam/docs/shortform/sam31_eval'
def iou(a, b):
    x0, y0 = max(a[0], b[0]), max(a[1], b[1]); x1, y1 = min(a[2], b[2]), min(a[3], b[3])
    i = max(0, x1 - x0) * max(0, y1 - y0); u = (a[2]-a[0])*(a[3]-a[1]) + (b[2]-b[0])*(b[3]-b[1]) - i
    return i / u if u > 0 else 0
res = {}
for p in sorted(glob.glob(f'{E}/sam/*.json')):
    n = os.path.basename(p)[:-5]; r = json.load(open(p))
    gt = {}
    for f, objs in r.get('frames', {}).items():
        if objs: gt[int(f)] = max(objs, key=lambda o: (o['box'][2]-o['box'][0])*(o['box'][3]-o['box'][1]))['box']
    if not gt: continue
    f0 = min(gt); cap = cv2.VideoCapture(f'{E}/clips/{n}.mp4'); f = 0; t = None; ious = []
    while True:
        ok, fr = cap.read()
        if not ok: break
        if f == f0:
            x0, y0, x1, y1 = gt[f0]; pr = cv2.TrackerVit_Params(); pr.net = VIT; t = cv2.TrackerVit_create(pr)
            t.init(fr, (int(x0), int(y0), int(x1-x0), int(y1-y0)))
        elif t is not None:
            ok2, b = t.update(fr)
            if f in gt: ious.append(iou((b[0], b[1], b[0]+b[2], b[1]+b[3]), gt[f]))
        f += 1
    if ious: res[n] = round(float(np.mean(ious)), 4)
json.dump(dict(cv2=cv2.__version__, iou=res, mean=round(float(np.mean(list(res.values()))), 4)), open(sys.argv[1], 'w'), indent=1)
print(cv2.__version__, 'cuts', len(res), 'mean IoU', round(float(np.mean(list(res.values()))), 4))
