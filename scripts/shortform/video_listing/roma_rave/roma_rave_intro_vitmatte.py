# 인트로 차 윤곽 고품질: SAM 2.1 마스크 → 트라이맵(확실한 차/배경/경계 띠) → ViTMatte(Apache-2.0)로 경계 투명도 계산 → pseg/intro_alpha.npz
import os, cv2, numpy as np, torch, time
from transformers import VitMatteImageProcessor, VitMatteForImageMatting
torch.set_num_threads(2); W, H = 1080, 1920; t0 = 0.0; yf = .5
sm = np.load('pseg/intro_sam.npz')['m']; N = len(sm)
cap = cv2.VideoCapture(os.environ.get('ROMA_SRC', '../raw/roma.mp4')); SH = int(cap.get(4)); y0 = int(min(SH - H, max(0, yf * SH - H / 2)))
cap.set(cv2.CAP_PROP_POS_MSEC, t0 * 1000)
P = VitMatteImageProcessor.from_pretrained('hustvl/vitmatte-small-composition-1k'); M = VitMatteForImageMatting.from_pretrained('hustvl/vitmatte-small-composition-1k').eval()
A = []; T = time.time(); S = 0.6   # 계산 해상도(가로 648)
for i in range(N):
    ok, f = cap.read(); f = cv2.cvtColor(f[y0:y0 + H], cv2.COLOR_BGR2RGB)
    m = cv2.resize(sm[i].astype(np.uint8), (W, H), interpolation=cv2.INTER_LINEAR)
    m = (cv2.GaussianBlur(m.astype(np.float32), (0, 0), 3) > 0.5).astype(np.uint8)
    fg = cv2.erode(m, np.ones((19, 19), np.uint8)); bg = 1 - cv2.dilate(m, np.ones((25, 25), np.uint8))
    tri = np.full((H, W), 128, np.uint8); tri[fg > 0] = 255; tri[bg > 0] = 0
    ys, xs = np.nonzero(tri > 0); x0, x1 = max(0, xs.min() - 16), min(W, xs.max() + 16); y0c, y1c = max(0, ys.min() - 16), min(H, ys.max() + 16)
    fc = cv2.resize(f[y0c:y1c, x0:x1], None, fx=S, fy=S, interpolation=cv2.INTER_AREA); tc = cv2.resize(tri[y0c:y1c, x0:x1], (fc.shape[1], fc.shape[0]), interpolation=cv2.INTER_NEAREST)
    inp = P(images=fc, trimaps=tc, return_tensors='pt')
    with torch.no_grad(): al = M(**inp).alphas[0, 0].numpy()[:fc.shape[0], :fc.shape[1]]
    al = cv2.resize(al, (x1 - x0, y1c - y0c), interpolation=cv2.INTER_CUBIC)
    a = np.zeros((H, W), np.float32); a[y0c:y1c, x0:x1] = al; a[tri == 255] = 1; a[tri == 0] = 0
    A.append((np.clip(a, 0, 1) * 255).astype(np.uint8))
    if i % 10 == 0: print('vitmatte', i, round(time.time() - T), flush=True)
np.savez_compressed('pseg/intro_alpha.npz', a=np.stack(A)); print('완료', round(time.time() - T), flush=True)
