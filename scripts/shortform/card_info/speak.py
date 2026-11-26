"""자막 문장 → 읽는 글(TTS용). 숫자·영문·단위를 소리 나는 대로 바꾼다. 자막은 원래 표기 그대로 둔다."""
import re

D = '영일이삼사오육칠팔구'
U = ['', '십', '백', '천']


def _under_10000(n):
    s = ''
    for i, ch in enumerate(reversed(str(n))):
        d = int(ch)
        if d == 0:
            continue
        s = ((D[d] if (d != 1 or i == 0) else '') + U[i]) + s
    return s


def num(n):
    n = int(n)
    if n == 0:
        return '영'
    out = []
    for unit, size in (('억', 10 ** 8), ('만', 10 ** 4), ('', 1)):
        q, n = divmod(n, size)
        if q:
            w = _under_10000(q)
            if unit == '만' and q == 1:
                w = ''  # 만 (일만 X)
            out.append(w + unit)
    return ' '.join(out)


EN = {'LED': '엘이디', 'AMG': '에이엠지', 'G400d': '지 사백 디', 'G-클래스': '지 클래스', 'W463b': '', '·': ',', 'L ': '리터 '}
NATIVE_COUNT = {'1회': '한 번', '2회': '두 번', '3회': '세 번', '0회': '영 회', '1건': '한 건', '0건': '영 건', '2건': '두 건', '3개': '세 개'}


def speak(s):
    t = s
    for k, v in NATIVE_COUNT.items():
        t = t.replace(k, v)
    t = re.sub(r'(\d+)년 0?(\d+)월', lambda m: f"{num(m.group(1))}년 {num(m.group(2))}월", t)
    t = re.sub(r'(\d+)\.(\d+)L', lambda m: f"{num(m.group(1))} 점 {num(m.group(2))} 리터", t)
    t = re.sub(r'([\d,]+)\s?km', lambda m: num(m.group(1).replace(',', '')) + ' 킬로미터', t)
    t = re.sub(r'(\d+)억 ([\d,]+)만원', lambda m: f"{num(m.group(1))}억 {num(m.group(2).replace(',', ''))}만 원", t)
    t = re.sub(r'([\d,]+)만원', lambda m: num(m.group(1).replace(',', '')) + '만 원', t)
    t = re.sub(r'(\d+)%', lambda m: num(m.group(1)) + ' 퍼센트', t)
    t = re.sub(r'(\d+)도', lambda m: num(m.group(1)) + '도', t)
    t = re.sub(r'(\d+)마력', lambda m: num(m.group(1)) + ' 마력', t)
    t = re.sub(r'(\d+)기통', lambda m: ['', '일', '이', '삼', '사', '오', '육', '칠', '팔'][int(m.group(1))] + '기통', t)
    t = re.sub(r'(\d+)인', lambda m: num(m.group(1)) + '인', t)
    for k, v in EN.items():
        t = t.replace(k, v)
    t = t.replace('+ ', '추가 ').replace('−', '').replace(' ,', ',')
    t = re.sub(r'\d[\d,]*', lambda m: num(m.group(0).replace(',', '')), t)
    return re.sub(r'\s+', ' ', t).strip()


if __name__ == '__main__':
    for x in ['최초등록 2021년 05월.', '주행거리 33,475km.', '판매가 1억 3,490만원.', '상대 차 피해 1건 · 52만원.',
              '2,470만원, 15% 낮습니다.', '직렬 6기통 2.9L 디젤.', '330마력.', '360도 카메라.', '부메스터 서라운드 사운드, + 420만원.', '소유자 변경 1회.', '1인 신조 · 정식 출고.']:
        print(x, '→', speak(x))
