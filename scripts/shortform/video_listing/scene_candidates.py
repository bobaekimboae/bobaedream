"""원본 매물 영상 → 장면 후보 목록(손 가림 · 흔들림 표시).

사람이 원본을 처음부터 보며 구간을 고르던 일을 줄이려고 만들었다(2026-11-24, 오픈소스 전수조사 1순위).
- 장면 나누기: PySceneDetect(BSD-3) ContentDetector
- 손 가림: MediaPipe Hand Landmarker(Apache-2.0, models/hand_landmarker.task)
- 흔들림: OpenCV 라플라시안 분산(윤곽 많은 칸만)
- 차 없음(바닥·벽·흐린 이동): SigLIP 2 제로샷(auto/vlm.py, 2026-11-24 추가)

사용:
  python3 scene_candidates.py 원본.mp4 [출력폴더] [--threshold 27] [--min-len 0.6]
결과:
  출력폴더/scenes.json   장면마다 시작·끝·길이·손 가림 비율·손이 보인 시각(hand_times)·선명도·쓸만함(ok)
  출력폴더/scenes.jpg    장면마다 가운데 한 장, 손 가림은 빨간·흐림은 노란·차 없음은 회색 테두리

판단 기준(값은 아래 상수):
- 손이 화면의 HAND_MAX 넘게 가리는 장면이 장면 길이의 절반 이상이면 hand=True
- 윤곽 많은 칸의 선명도가 SHARP_MIN 미만이면 blur=True(무늬 없는 면은 flat=True로 따로, 흐림 아님)
- SigLIP 2가 바닥·벽·흐린 사진으로 보면 nocar=True(회색 테두리). --no-vlm이면 생략
- 손·흐림·차 없음이 모두 아니고 길이가 min-len 이상이면 ok=True
원본 영상은 고치지 않는다(읽기만 함).
"""
import argparse
import json
import os

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = os.path.join(HERE, '..', 'models', 'hand_landmarker.task')
FONT = os.path.join(HERE, '..', 'fonts', 'Pretendard-Bold.otf')
HAND_MAX = 0.06     # 손 상자 넓이가 화면의 6%를 넘으면 '가림'
SHARP_MIN = 80.0    # 윤곽 많은 칸의 라플라시안 분산(긴 변 720 기준)이 이보다 낮으면 '흐림'
EDGE_MIN = 12.0     # 칸 평균 윤곽 세기가 이보다 크면 '무늬 있는 칸'
FLAT_TILES = 6      # 무늬 있는 칸이 64칸 중 이보다 적으면 '무늬 없음'(흐림 판정 안 함)
SAMPLES = 5         # 장면마다 볼 장면 수
NOCAR_MIN = 0.5     # SigLIP 2에서 '바닥·벽·흐린 사진·검은 화면' 문장 확률 합이 이보다 크면 '차 없음'
NOCAR_TEXTS = ['a blurry photo of a concrete parking garage floor', 'a photo of a gray floor', 'a motion blurred photo',
               'a black screen', 'a plain gray wall with nothing on it']


def nocar_scores(imgs):
    """장면 가운데 그림마다 '차가 안 보임' 확률(0~1). SigLIP 2(Apache-2.0, auto/vlm.py) 제로샷.

    차 부위 문장은 shot_tagger.PROMPTS(부위 20종)를 그대로 쓰고, 바닥·벽·흐린 사진 문장과 겨룬다.
    로마 원본 39장면에서 바닥 걷는 장면(3·20·35)·무늬 없는 내장 판(16~18·28)·흐린 이동(22·23·31·33)을 잡고,
    또렷한 시트(21)는 통과시켰다. 모델을 못 불러오면 None.
    """
    try:
        import sys
        sys.path.insert(0, os.path.join(HERE, '..', 'auto'))
        from shot_tagger import PROMPTS
        from vlm import ZeroShot
    except Exception as e:
        print(f'[차 없음 판정 생략] {e}')
        return None
    pos = [t for k, v in PROMPTS.items() if k != 'other' for t in v]
    zs = ZeroShot()
    p = zs.probs(zs.image(imgs), zs.text(pos + NOCAR_TEXTS))
    return [float(r[len(pos):].sum()) for r in p]


def detect_scenes(path, threshold, min_len):
    from scenedetect import ContentDetector, detect
    lst = detect(path, ContentDetector(threshold=threshold, min_scene_len=1))
    cap = cv2.VideoCapture(path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    n = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    cap.release()
    if not lst:
        return [(0.0, n / fps)]
    out = [(a.get_seconds(), b.get_seconds()) for a, b in lst]
    merged = []  # 너무 짧은 장면은 앞 장면에 붙인다
    for s, e in out:
        if merged and e - s < min_len:
            merged[-1] = (merged[-1][0], e)
        else:
            merged.append((s, e))
    return merged


def hand_tool():
    from mediapipe.tasks.python import BaseOptions
    from mediapipe.tasks.python.vision import HandLandmarker, HandLandmarkerOptions, RunningMode
    return HandLandmarker.create_from_options(HandLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=MODEL), running_mode=RunningMode.IMAGE, num_hands=2,
        min_hand_detection_confidence=0.4))


def hand_cover(tool, bgr):
    import mediapipe as mp
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    res = tool.detect(mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb))
    area, boxes = 0.0, []
    for lm in res.hand_landmarks:
        xs = [p.x for p in lm]
        ys = [p.y for p in lm]
        x0, x1, y0, y1 = max(0, min(xs)), min(1, max(xs)), max(0, min(ys)), min(1, max(ys))
        # 손가락 끝까지 조금 넓힌다(관절 점은 손 윤곽보다 안쪽)
        pad = 0.15 * max(x1 - x0, y1 - y0)
        x0, x1, y0, y1 = max(0, x0 - pad), min(1, x1 + pad), max(0, y0 - pad), min(1, y1 + pad)
        area += (x1 - x0) * (y1 - y0)
        boxes.append((x0, y0, x1, y1))
    return min(1.0, area), boxes


def sharpness(bgr):
    """(선명도, 무늬 없음 여부). 화면을 8×8 칸으로 나눠 윤곽이 많은 칸(위 25%)만 선명도를 잰다.

    예전에는 화면 전체 라플라시안 분산을 썼더니 문짝·소프트탑처럼 무늬 없는 면을 흐림으로 잡았다
    (로마 39장면 중 17장면 '흐림'). 무늬가 있는 칸만 보면 면이 넓어도 경계선이 선명하면 통과한다.
    윤곽 있는 칸이 거의 없으면(FLAT_TILES) 흐림이 아니라 '무늬 없음'으로 따로 표시한다.
    """
    h, w = bgr.shape[:2]
    k = 720 / max(h, w)
    g = cv2.cvtColor(cv2.resize(bgr, (int(w * k), int(h * k))), cv2.COLOR_BGR2GRAY)
    lap = cv2.Laplacian(g, cv2.CV_64F)
    gx = cv2.Sobel(g, cv2.CV_32F, 1, 0)
    gy = cv2.Sobel(g, cv2.CV_32F, 0, 1)
    mag = cv2.magnitude(gx, gy)
    H, W = g.shape
    tiles = []
    for y in range(8):
        for x in range(8):
            ys, ye, xs, xe = y * H // 8, (y + 1) * H // 8, x * W // 8, (x + 1) * W // 8
            tiles.append((float(mag[ys:ye, xs:xe].mean()), float(lap[ys:ye, xs:xe].var())))
    tiles.sort(reverse=True)
    textured = [t for t in tiles if t[0] >= EDGE_MIN]
    flat = len(textured) < FLAT_TILES
    top = tiles[:16]  # 윤곽이 많은 칸 위 25%
    return float(np.median([t[1] for t in top])), flat


def frame_at(cap, t):
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
    ok, f = cap.read()
    return f if ok else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('video')
    ap.add_argument('out', nargs='?', default=None)
    ap.add_argument('--threshold', type=float, default=27.0)
    ap.add_argument('--min-len', type=float, default=0.6)
    ap.add_argument('--no-vlm', action='store_true', help='SigLIP 2 차 없음 판정을 끈다(빠름)')
    a = ap.parse_args()
    out = a.out or os.path.splitext(a.video)[0] + '_scenes'
    os.makedirs(out, exist_ok=True)

    scenes = detect_scenes(a.video, a.threshold, a.min_len)
    tool = hand_tool()
    cap = cv2.VideoCapture(a.video)
    rows, thumbs = [], []
    for i, (s, e) in enumerate(scenes):
        ts = [s + (e - s) * (k + 0.5) / SAMPLES for k in range(SAMPLES)]
        covers, sharps, flats, mid, hand_ts = [], [], [], None, []
        for k, t in enumerate(ts):
            f = frame_at(cap, t)
            if f is None:
                continue
            c, _ = hand_cover(tool, f)
            covers.append(c)
            if c > HAND_MAX:
                hand_ts.append(round(t, 2))
            sv, fl = sharpness(f)
            sharps.append(sv)
            flats.append(fl)
            if k == SAMPLES // 2:
                mid = f
        hand_ratio = float(np.mean([c > HAND_MAX for c in covers])) if covers else 0.0
        sharp = float(np.median(sharps)) if sharps else 0.0
        flat = bool(flats) and float(np.mean(flats)) >= 0.5
        row = dict(i=i, start=round(s, 2), end=round(e, 2), dur=round(e - s, 2),
                   hand_ratio=round(hand_ratio, 2), hand_max=round(max(covers or [0]), 3), sharp=round(sharp, 1),
                   hand_times=hand_ts, hand=hand_ratio >= 0.5, flat=flat, blur=(not flat) and sharp < SHARP_MIN)
        row['ok'] = (not row['hand']) and (not row['blur']) and row['dur'] >= a.min_len
        rows.append(row)
        if mid is not None:
            thumbs.append((row, mid))
    cap.release()
    tool.close()
    ns = None if a.no_vlm else nocar_scores([Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGR2RGB)) for _, f in thumbs])
    if ns:
        for (row, _), n in zip(thumbs, ns):
            row['nocar_score'] = round(n, 2)
            row['nocar'] = n > NOCAR_MIN
            row['ok'] = row['ok'] and not row['nocar']
    json.dump(dict(video=os.path.abspath(a.video), threshold=a.threshold, scenes=rows),
              open(os.path.join(out, 'scenes.json'), 'w'), ensure_ascii=False, indent=1)

    # 한눈에 보는 시트(장면당 가로 180)
    W = 180
    font = ImageFont.truetype(FONT, 18)
    tiles = []
    for row, f in thumbs:
        h, w = f.shape[:2]
        im = Image.fromarray(cv2.cvtColor(cv2.resize(f, (W, int(h * W / w))), cv2.COLOR_BGR2RGB))
        d = ImageDraw.Draw(im)
        col = (230, 40, 40) if row['hand'] else (245, 200, 0) if row['blur'] else (150, 150, 150) if row.get('nocar') else None
        if col:
            d.rectangle([0, 0, im.width - 1, im.height - 1], outline=col, width=6)
        tag = f"{row['i']} {row['start']:.1f}-{row['end']:.1f}" + (' 손' if row['hand'] else '') + (' 흐림' if row['blur'] else '') + (' 무늬없음' if row['flat'] else '') + (' 차없음' if row.get('nocar') else '')
        d.rectangle([0, 0, im.width, 26], fill=(0, 0, 0))
        d.text((6, 3), tag, fill=(255, 255, 255), font=font)
        tiles.append(im)
    if tiles:
        cols = 8
        th = max(t.height for t in tiles)
        sheet = Image.new('RGB', (cols * W, ((len(tiles) + cols - 1) // cols) * th), (20, 20, 20))
        for k, t in enumerate(tiles):
            sheet.paste(t, ((k % cols) * W, (k // cols) * th))
        sheet.save(os.path.join(out, 'scenes.jpg'), quality=82)
    ok = sum(r['ok'] for r in rows)
    print(f'장면 {len(rows)}개 · 쓸만함 {ok} · 손 가림 {sum(r["hand"] for r in rows)} · 흐림 {sum(r["blur"] for r in rows)} · 무늬없음 {sum(r["flat"] for r in rows)} · 차없음 {sum(bool(r.get("nocar")) for r in rows)} → {out}')


if __name__ == '__main__':
    main()
