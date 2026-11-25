# T4 보조: OpenCV·onnxruntime 판별 VitTrack 상자·계기판 OCR 결과를 JSON으로 (같은 입력 비교용)
# T4: 같은 입력에서 VitTrack 상자와 계기판 OCR 결과를 뽑아 JSON으로 (판별 비교용)
import json, sys, cv2, onnxruntime
sys.path.insert(0, '/home/claude/rr/scripts/shortform/photo_listing')
out = dict(cv2=cv2.__version__, ort=onnxruntime.__version__)
VIT = '/home/claude/rr/scripts/shortform/models/vittrack_2023sep.onnx'
res = {}
for clip, box in [('w2_wheel_pan', (100, 300, 340, 340)), ('e5_steering_logo', (180, 250, 180, 180))]:
    cap = cv2.VideoCapture(f'/tmp/wt_sam/docs/shortform/sam31_eval/clips/{clip}.mp4')
    ok, fr = cap.read(); p = cv2.TrackerVit_Params(); p.net = VIT; t = cv2.TrackerVit_create(p); t.init(fr, box)
    bx = []
    while True:
        ok, fr = cap.read()
        if not ok: break
        ok2, b = t.update(fr); bx.append([int(v) for v in b] + [round(float(t.getTrackingScore()), 4)])
    res[clip] = bx
out['vit'] = res
import odometer
out['odo'] = odometer._ocr('/tmp/osst/t2src/fordgt/src2/p05.png')
json.dump(out, open(sys.argv[1], 'w'))
print(out['cv2'], out['ort'], {k: len(v) for k, v in res.items()}, str(out['odo'])[:200])
