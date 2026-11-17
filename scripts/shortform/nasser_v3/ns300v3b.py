# pass 2: face (any size, score>0.6) + outlined caption band, 2 fps
import os, glob, json
import numpy as np, cv2
cv2.setNumThreads(1)
from multiprocessing import Pool
B = r'C:\Users\Thinkbook\Documents\autostudio_analysis'
YN = os.path.join(B, 'models', 'face_detection_yunet_2023mar.onnx')
OUT = os.path.join(B, 'ns300v3b'); os.makedirs(OUT, exist_ok=True)

def capmask(f):
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)
    white = ((hsv[..., 2] > 215) & (hsv[..., 1] < 45)).astype(np.uint8)
    dn = cv2.dilate((hsv[..., 2] < 60).astype(np.uint8), np.ones((5, 5), np.uint8))
    return white & dn

def one(item):
    vid, p = item
    of = os.path.join(OUT, vid + '.json')
    if os.path.exists(of): return vid
    det = cv2.FaceDetectorYN.create(YN, '', (320, 320), 0.6)
    cap = cv2.VideoCapture(p); fps = cap.get(5) or 30; step = max(1, int(round(fps / 2))); i = 0; rows = []
    while True:
        ok = cap.grab()
        if not ok: break
        if i % step == 0:
            ok, f = cap.retrieve()
            if ok:
                h, w = f.shape[:2]; det.setInputSize((w, h)); _, r = det.detect(f)
                fa = [] if r is None else [[float(x[0] / w), float(x[1] / h), float(x[2] / w), float(x[3] / h), float(x[14])] for x in r]
                prof = capmask(f).sum(1) / w
                bands = [float(prof[int(h * k / 20):int(h * (k + 1) / 20)].mean()) for k in range(20)]
                rows.append([i / fps, fa, bands])
        i += 1
    json.dump({'vid': vid, 'fps': fps, 'rows': rows}, open(of, 'w'))
    return vid

if __name__ == '__main__':
    items = [(os.path.basename(f)[:-4], f) for d in ['ns_ar100', 'ns_ar200', 'ns_ar300'] for f in glob.glob(os.path.join(B, d, 'v', '*.mp4'))]
    with Pool(4) as p:
        for k, v in enumerate(p.imap_unordered(one, items)):
            if k % 30 == 0: print(k, v, flush=True)
    print('DONE', flush=True)
