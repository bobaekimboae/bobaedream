"""계기판 사진에서 실제 주행거리 숫자 찾기 (2026-11-18 사용자 규칙).

「주행거리 동그라미는 진짜 계기판 주행거리 숫자에 친다. 사진에 안 보이면 치지 않는다.」
- 컷에 쓰는 사진마다 글자 인식(RapidOCR, Apache-2.0)으로 숫자를 읽는다.
- 매물 주행거리와 같은 숫자(쉼표·km 무시)를 찾는다. 「3만 2천」처럼 매물 값이 어림이면 ±2% 안.
- 찾으면 {'photo': n, 'box': [u0, v0, u1, v1]}(사진 비율 좌표), 못 찾으면 None → 원을 그리지 않음.
- 결과는 src2/pNN.odo.json 에 저장(다음 렌더는 다시 읽지 않음).
"""
import json, os, re


def km_value(txt):
    """'32,770km' → 32770 · '8.5만km' → 85000 · '3만 2천' 없음 → None"""
    t = str(txt).replace(',', '').replace(' ', '')
    m = re.match(r'^([\d.]+)만km$', t)
    if m:
        return int(float(m.group(1)) * 10000), True     # 어림 값
    m = re.match(r'^(\d+)km$', t)
    if m:
        return int(m.group(1)), False
    return None, False


def _ocr(path):
    from rapidocr_onnxruntime import RapidOCR
    global _O
    try:
        _O
    except NameError:
        _O = RapidOCR()
    r, _ = _O(path)
    out = []
    for b, t, s in (r or []):
        out.append({'t': t, 's': float(s), 'b': [min(p[0] for p in b), min(p[1] for p in b), max(p[0] for p in b), max(p[1] for p in b)]})
    return out


def find(src2, photos, km, approx=False, min_score=0.6):
    from PIL import Image
    if not km:
        return None
    best = None
    for n in photos:
        p = os.path.join(src2, f'p{n:02d}.png')
        if not os.path.exists(p):
            continue
        cache = os.path.join(src2, f'p{n:02d}.odo.json')
        if os.path.exists(cache):
            toks = json.load(open(cache))
        else:
            toks = _ocr(p)
            json.dump(toks, open(cache, 'w'), ensure_ascii=False)
        w, h = Image.open(p).size
        for tk in toks:
            d = re.sub(r'\D', '', tk['t'])
            if len(d) < 3 or tk['s'] < min_score:
                continue
            v = int(d)
            ok = abs(v - km) <= km * 0.02 if approx else (v == km or abs(v - km) <= 50)
            if ok and (best is None or tk['s'] > best['s']):
                b = tk['b']
                best = {'photo': n, 'box': [b[0] / w, b[1] / h, b[2] / w, b[3] / h], 's': tk['s'], 'text': tk['t']}
    return best
