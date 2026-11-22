"""대본 읽기 글자 만들기 — 화면 글자는 그대로, 일레븐랩스가 읽을 글자만 한글로. 2026-11-22.

  num_ko(58176)        → 오만팔천백칠십육
  km_ko(58176)         → 오만_팔천백칠십육_킬로      (place_voice 토큰 안 띄어쓰기는 _)
  manwon_ko(2990)      → 이천구백구십만
  model_ko('520i')     → 오이공아이   (모델 번호는 한 자리씩, 0은 공)
  brand_ko('BMW')      → 비엠더블유
"""
import re

D = '영일이삼사오육칠팔구'
SMALL = ['', '십', '백', '천']
BIG = ['', '만', '억', '조']
LET = {'A': '에이', 'B': '비', 'C': '씨', 'D': '디', 'E': '이', 'F': '에프', 'G': '지', 'H': '에이치', 'I': '아이', 'J': '제이',
       'K': '케이', 'L': '엘', 'M': '엠', 'N': '엔', 'O': '오', 'P': '피', 'Q': '큐', 'R': '알', 'S': '에스', 'T': '티', 'U': '유',
       'V': '브이', 'W': '더블유', 'X': '엑스', 'Y': '와이', 'Z': '지'}
BRAND = {'BMW': '비엠더블유', 'GMC': '지엠씨', 'KGM': '케이지엠', 'MINI': '미니', 'BYD': '비와이디'}


def _four(n):
    out = ''
    for i, ch in enumerate(f'{n:04d}'):
        d = int(ch); p = 3 - i
        if d == 0: continue
        out += ('' if d == 1 and p > 0 else D[d]) + SMALL[p]
    return out


def num_ko(n, sep=''):
    n = int(n)
    if n == 0: return '영'
    parts, k = [], 0
    while n:
        n, r = divmod(n, 10000)
        if r: parts.append((('' if r == 1 and k == 1 else _four(r)) or '') + BIG[k])
        k += 1
    return sep.join(reversed(parts))


def km_ko(km):
    return num_ko(km, '_') + '_킬로'


def manwon_ko(m):
    return num_ko(m) + '만'


def model_ko(s):
    out = ''
    for ch in str(s).upper():
        if ch.isdigit(): out += '공' if ch == '0' else D[int(ch)]
        elif ch in LET: out += LET[ch]
    return out


def brand_ko(b):
    return BRAND.get(b.upper(), b) if re.fullmatch(r'[A-Za-z]+', b) else b


if __name__ == '__main__':
    assert num_ko(58176) == '오만팔천백칠십육', num_ko(58176)
    assert km_ko(58176) == '오만_팔천백칠십육_킬로'
    assert manwon_ko(2990) == '이천구백구십만'
    assert num_ko(1998) == '천구백구십팔'
    assert num_ko(10000) == '만' and num_ko(15000) == '만오천'
    assert model_ko('520i') == '오이공아이'
    print('ok')
