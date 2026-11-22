"""코드네임 읽기 규칙 (2026-11-18 사용자 확정).

「구와이영」처럼 숫자를 한자어로 읽으면 듣는 사람이 모른다.
대본은 「N세대 모델에 코드네임 ○○○입니다」 꼴로 쓰고, 코드네임은 영어로 한 글자씩 읽는다.
  9Y0  → 나인와이제로   ·  W213 → 더블유투원쓰리  ·  G20 → 지투제로  ·  992 → 나인나인투
화면 자막·칩은 원래 표기(3세대 · 9Y0)를 그대로 쓴다. 코드네임은 BMW · 벤츠 · 포르쉐만.
"""
import re

DIGIT = {'0': '제로', '1': '원', '2': '투', '3': '쓰리', '4': '포', '5': '파이브',
         '6': '식스', '7': '세븐', '8': '에잇', '9': '나인'}
LETTER = {'A': '에이', 'B': '비', 'C': '씨', 'D': '디', 'E': '이', 'F': '에프', 'G': '지', 'H': '에이치',
          'I': '아이', 'J': '제이', 'K': '케이', 'L': '엘', 'M': '엠', 'N': '엔', 'O': '오', 'P': '피',
          'Q': '큐', 'R': '알', 'S': '에스', 'T': '티', 'U': '유', 'V': '브이', 'W': '더블유', 'X': '엑스',
          'Y': '와이', 'Z': '지'}
CODENAME_MAKERS = ('BMW', '벤츠', '메르세데스', '포르쉐')


def codename_ko(code):
    """'9Y0' → '나인와이제로'. 영문·숫자 아닌 글자(공백·하이픈)는 건너뛴다."""
    out = []
    for ch in str(code).upper():
        if ch in DIGIT:
            out.append(DIGIT[ch])
        elif ch in LETTER:
            out.append(LETTER[ch])
    return ''.join(out)


def generation_line(gen, code, maker):
    """대본 문장: (읽는 말, 화면 글자). 코드네임 브랜드가 아니면 세대만."""
    if code and any(m in maker for m in CODENAME_MAKERS):
        return f'{gen}세대 모델에 코드네임 {codename_ko(code)}입니다', f'{gen}세대 · {code}'
    return f'{gen}세대 모델입니다', f'{gen}세대'


if __name__ == '__main__':
    for c in ['9Y0', 'W213', 'G20', '992', 'X5']:
        print(c, codename_ko(c))
    print(generation_line(3, '9Y0', '포르쉐'))
