"""계기판 사진에서 실제 주행거리 숫자 찾기 (2026-11-18 사용자 규칙).

「주행거리 동그라미는 진짜 계기판 주행거리 숫자에 친다. 사진에 안 보이면 치지 않는다.」
- 컷에 쓰는 사진마다 글자 인식(RapidOCR 3.x · PP-OCRv6, Apache-2.0)으로 숫자를 읽는다.
- 한글 줄은 두 번째 엔진(korean_PP-OCRv5_mobile_rec)으로 읽는다 — read_lines() (2026-11-25).
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
    """RapidOCR 3.x(PP-OCRv6, Apache-2.0)로 글자 상자를 읽는다. 2026-11-22 rapidocr-onnxruntime 1.2.3(구판) → rapidocr 3.10.
    숫자는 이 엔진(v6) 그대로 쓴다 — 숫자 시험 v6 7/8 · 한국어 v5 6/8(2026-11-25)."""
    global _O
    try:
        _O
    except NameError:
        from rapidocr import RapidOCR
        _O = RapidOCR()
    r = _O(path)
    out = []
    for b, t, s in zip(r.boxes if r.boxes is not None else [], r.txts or [], r.scores or []):
        out.append({'t': t, 's': float(s), 'b': [float(min(p[0] for p in b)), float(min(p[1] for p in b)), float(max(p[0] for p in b)), float(max(p[1] for p in b))]})
    return out


HANGUL = re.compile(r'[가-힣]')


def _ocr_ko(path):
    """한글 줄 읽기(2026-11-25) — 두 번째 엔진 korean_PP-OCRv5_mobile_rec(Apache-2.0).
    v6 기본 엔진은 한국어 글자가 없어 한글을 지우거나 엉뚱한 글자로 읽는다(한글 오류율 88% → 이 엔진 18%).
    한글이 들어 있는 줄만 돌려준다. 숫자는 _ocr()(v6) 값을 쓴다."""
    global _OK
    try:
        _OK
    except NameError:
        from rapidocr import RapidOCR, LangRec, OCRVersion, ModelType
        _OK = RapidOCR(params={'Rec.lang_type': LangRec.KOREAN, 'Rec.ocr_version': OCRVersion.PPOCRV5,
                               'Rec.model_type': ModelType.MOBILE})
    r = _OK(path)
    out = []
    for b, t, s in zip(r.boxes if r.boxes is not None else [], r.txts or [], r.scores or []):
        if HANGUL.search(t or ''):
            out.append({'t': t, 's': float(s), 'b': [float(min(p[0] for p in b)), float(min(p[1] for p in b)), float(max(p[0] for p in b)), float(max(p[1] for p in b))]})
    return out


def read_lines(path):
    """사진 한 장의 글자 줄 — 숫자 줄은 v6, 한글 줄은 한국어 엔진. 위에서 아래 순서.
    [{'t': 글자, 's': 점수, 'b': 상자, 'eng': 'v6'|'ko'}] — 한글 줄과 겹치는(가로세로 절반 이상) v6 줄은 한글 줄로 대체하되,
    v6 줄의 숫자가 한글 줄 숫자와 다르면 v6 숫자 줄도 남긴다(숫자는 v6가 더 정확)."""
    num = _ocr(path); ko = _ocr_ko(path)

    def ov(a, b):
        ix = max(0, min(a[2], b[2]) - max(a[0], b[0])); iy = max(0, min(a[3], b[3]) - max(a[1], b[1]))
        return ix * iy / max(1e-6, min((a[2] - a[0]) * (a[3] - a[1]), (b[2] - b[0]) * (b[3] - b[1])))
    out = [dict(k, eng='ko') for k in ko]
    for n in num:
        hit = [k for k in ko if ov(n['b'], k['b']) > 0.5]
        if not hit or any(re.sub(r'\D', '', n['t']) not in re.sub(r'\D', '', k['t']) for k in hit):
            out.append(dict(n, eng='v6'))
    return sorted(out, key=lambda x: (round(x['b'][1] / 12), x['b'][0]))


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
