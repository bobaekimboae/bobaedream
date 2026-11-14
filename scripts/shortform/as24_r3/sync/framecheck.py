"""완성 영상 프레임마다 자막 줄의 노랑 강조 위치를 재서, 그 시각 manifest 의 강조 어절(자막 PNG의 노랑 위치)과 맞는지 본다.
잡는 것: 강조가 없는 프레임(깜빡임), 두 군데 노랑, 다른 어절 강조(한 칸 어긋남)."""
import json, sys, subprocess, numpy as np
from PIL import Image
VID, MAN = sys.argv[1], sys.argv[2]; m = json.load(open(MAN)); D = MAN.rsplit("/", 1)[0]
subs = [i for i in m["items"] if i["kind"] == "sub"]
def yel(a):  # 노랑(#EEEF05 계열) 마스크
    return (a[..., 0] > 190) & (a[..., 1] > 190) & (a[..., 2] < 90)
cache = {}
def expect(s):
    if s["file"] not in cache:
        a = np.asarray(Image.open(f"{D}/{s['file']}").convert("RGBA")).astype(int)
        ym = yel(a) & (a[..., 3] > 200); ys, xs = np.nonzero(ym)
        cache[s["file"]] = (xs.mean(), ys.mean(), ys.min(), ys.max()) if len(xs) else None
    return cache[s["file"]]
W, H = 540, 960
p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", VID, "-vf", f"scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
fi, res = 0, dict(frames=0, ok=0, none=0, wrong=0, double=0, nosub_extra=0); bad = []
while True:
    buf = p.stdout.read(W * H * 3)
    if len(buf) < W * H * 3: break
    t = (fi + 0.5) / 30; fi += 1
    on = [s for s in subs if s["t0"] <= t < s["t1"]]
    if not on: continue
    s = on[-1]; e = expect(s)
    if not e: continue
    res["frames"] += 1
    a = np.frombuffer(buf, np.uint8).reshape(H, W, 3).astype(int)
    y0, y1 = int(e[2] / 2) - 3, int(e[3] / 2) + 3
    band = yel(a[y0:y1]); cols = np.nonzero(band.sum(0) >= 2)[0]
    if len(cols) < 3: res["none"] += 1; bad.append((round(t, 2), "강조없음", s["text"], s["hi"])); continue
    runs = np.split(cols, np.nonzero(np.diff(cols) > 12)[0] + 1)
    cx = np.mean([r.mean() for r in runs if len(r) == max(len(q) for q in runs)])
    if abs(cx - e[0] / 2) > 20: res["wrong"] += 1; bad.append((round(t, 2), "다른어절", s["text"], s["hi"], round(cx), round(e[0] / 2)))
    elif sum(len(r) > 6 for r in runs) > 1: res["double"] += 1; bad.append((round(t, 2), "두군데", s["text"], s["hi"]))
    else: res["ok"] += 1
print(res); print(bad[:40])
# 재발 방지: 한 프레임이라도 강조가 없거나·다른 어절·두 군데면 실패(업로드 금지)
sys.exit(1 if res["none"] or res["wrong"] or res["double"] else 0)
