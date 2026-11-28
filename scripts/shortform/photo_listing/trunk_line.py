"""트렁크 입구 라인 따기 (나세르식, 2026-11-24 사용자 「트렁크는 나세르처럼 트렁크라인 선 따버려」).

사진은 고치지 않는다. 트렁크 입구(적재 공간 테두리)를 찾아 그 위에 선만 그린다.
찾는 법: OpenCV GrabCut(오픈소스, Apache-2.0) — 사진 가운데 아래(적재 바닥)를 「안쪽」으로 심고
가장자리를 「바깥」으로 두어 적재 공간 덩어리를 나눈 뒤, 바깥선 → 볼록 껍질 → 점 줄이기 → 부드럽게(Chaikin).
결과는 src2/pNN.trunkline.json(사진 좌표 0~1)으로 저장해 다음부터는 다시 계산하지 않는다.
확인: python3 trunk_line.py src2/p10.png out.jpg
"""
import cv2, numpy as np, json, os, sys


def _chaikin(pts, n=3):
    p = np.asarray(pts, float)
    for _ in range(n):
        q = []
        for i in range(len(p)):
            a, b = p[i], p[(i + 1) % len(p)]
            q += [a * .75 + b * .25, a * .25 + b * .75]
        p = np.array(q)
    return p


def trunk_contour(path):
    img = cv2.imread(path); h, w = img.shape[:2]
    s = 640 / w; sm = cv2.resize(img, (640, int(h * s))); H, W = sm.shape[:2]
    mask = np.full((H, W), cv2.GC_PR_BGD, np.uint8)
    mask[int(H * .25):int(H * .88), int(W * .12):int(W * .88)] = cv2.GC_PR_FGD
    mask[int(H * .40):int(H * .80), int(W * .22):int(W * .78)] = cv2.GC_FGD   # 적재 바닥 가운데 = 트렁크 안
    mask[:int(H * .04), :] = cv2.GC_BGD; mask[int(H * .97):, :] = cv2.GC_BGD
    mask[:, :int(W * .02)] = cv2.GC_BGD; mask[:, int(W * .98):] = cv2.GC_BGD
    bg = np.zeros((1, 65)); fg = np.zeros((1, 65))
    cv2.grabCut(sm, mask, None, bg, fg, 6, cv2.GC_INIT_WITH_MASK)
    m = np.where((mask == 1) | (mask == 3), 255, 0).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((9, 9), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
    _, lab, _, _ = cv2.connectedComponentsWithStats(m)
    m = np.where(lab == lab[int(H * .6), W // 2], 255, 0).astype(np.uint8)
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    hull = cv2.convexHull(max(cs, key=cv2.contourArea))
    ap = cv2.approxPolyDP(hull, 0.004 * cv2.arcLength(hull, True), True)[:, 0, :].astype(float)
    sm_pts = _chaikin(ap, 3)
    area = cv2.contourArea(hull) / (H * W)
    return [[x / W, y / H] for x, y in sm_pts], area


def load(photo_png):
    f = photo_png.replace('.png', '.trunkline.json')
    if os.path.exists(f):
        return json.load(open(f))
    pts, area = trunk_contour(photo_png)
    d = {'pts': pts, 'area': round(area, 3), 'ok': 0.2 <= area <= 0.85}
    json.dump(d, open(f, 'w'))
    return d


if __name__ == '__main__':
    d = load(sys.argv[1])
    if len(sys.argv) > 2:
        im = cv2.imread(sys.argv[1]); h, w = im.shape[:2]
        p = (np.array(d['pts']) * [w, h]).astype(np.int32)
        cv2.polylines(im, [p], True, (0, 242, 245), 6); cv2.imwrite(sys.argv[2], im)
    print(len(d['pts']), d['area'], d['ok'])
