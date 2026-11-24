"""사진·영상 프레임 글자 읽기 — 용도별 모델 고정(2026-11-25 시험 근거).

- 숫자(주행거리·연비·가격 숫자): RapidOCR 3.x 기본 PP-OCRv6. 실제 계기판 사진 숫자 21개 중 17개를 다시 읽음(v5 한국어는 13개).
  주행거리 원 그리기는 photo_listing/odometer.py가 같은 v6를 쓴다.
- 한국어 글자(성능지·스티커·화면 메뉴·간판): PP-OCRv5 한국어. PP-OCRv6에는 한국어 모델이 없어
  한국어 30줄 글자 오류율이 v6 87.7% / v5 한국어 17.6%였다.
모두 Apache-2.0. 사진은 읽기만 하고 고치지 않는다.

사용: python3 ocr_text.py ko 사진.png   /   python3 ocr_text.py num 사진.png
"""
import json
import sys

_ENG = {}


def _engine(kind):
    if kind not in _ENG:
        from rapidocr import RapidOCR, LangRec, ModelType, OCRVersion
        if kind == 'ko':
            _ENG[kind] = RapidOCR(params={'Rec.lang_type': LangRec.KOREAN, 'Rec.ocr_version': OCRVersion.PPOCRV5,
                                          'Rec.model_type': ModelType.MOBILE})
        else:
            _ENG[kind] = RapidOCR()  # 기본 PP-OCRv6(숫자·영문)
    return _ENG[kind]


def read(path, kind='ko', min_score=0.5):
    """글자 상자 목록 [{t, s, b:[x0,y0,x1,y1]}]. kind: 'ko' 한국어 글자 / 'num' 숫자."""
    r = _engine(kind)(path)
    out = []
    for b, t, s in zip(r.boxes if r.boxes is not None else [], r.txts or [], r.scores or []):
        if float(s) < min_score:
            continue
        out.append({'t': t, 's': round(float(s), 3),
                    'b': [float(min(p[0] for p in b)), float(min(p[1] for p in b)), float(max(p[0] for p in b)), float(max(p[1] for p in b))]})
    return out


def read_ko(path, min_score=0.5):
    return read(path, 'ko', min_score)


def read_digits(path, min_score=0.6):
    return read(path, 'num', min_score)


if __name__ == '__main__':
    kind, p = sys.argv[1], sys.argv[2]
    print(json.dumps(read(p, 'num' if kind == 'num' else 'ko'), ensure_ascii=False, indent=1))
