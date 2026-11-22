#!/usr/bin/env python3
"""영상판 대본·칩 사실 검사 — job.json의 화면 글자가 매물 정보(facts.json)에 있는 것만 쓰는가. 2026-11-22.

  python3 job_fact_check.py job.json facts.json

facts.json: 매물 원장 값(make·model·gen·color·reg·year·km·cc·fuel·trans·price_manwon·region…)
            + seen: [원본 영상에 보이는 것(사람이 1번 확인)] + features: [{chip, part, …}]
검사:
  ① 화면 숫자(자막·칩·큰 숫자·제목)는 facts 안의 숫자여야 한다
  ② 칩·큰 숫자 라벨·재질 글자는 facts 글자와 겹쳐야 한다(근거 없는 칩 금지)
  ③ 금지 낱말(무사고·풀옵션 등 — facts에 근거가 없으면)
  ④ 코드네임(G30·W213·992…)은 BMW·벤츠·포르쉐만
  ⑤ 부위 칩(part가 있는 칩)은 칩 글자가 그 부위를 가리켜야 한다(「블루 캘리퍼」에 wheel 금지 → part를 빼면 위쪽 고정 칩)
하나라도 어긋나면 끝 코드 1. edit_gate.py post 전에 돌린다.
"""
import json, re, sys

LABELS = {'주행거리', '가격', '판매가', '연식', '등록', '배기량', '연료', '변속기'}  # 큰 숫자 이름표(값이 아님)
BANNED = ['무사고', '완전무사고', '풀옵션', '신차급', '최상급', '1인신조', '완벽']
CODENAME_MAKERS = ('BMW', '벤츠', '메르세데스', '포르쉐')
# 부위 칩 화살표가 가리키는 부위(part_anchor PROMPTS 키) ↔ 칩 글자에 있어야 할 낱말. 2026-11-22 cha13 「블루 캘리퍼」→wheel 오지시로 추가.
PART_WORDS = {
    'wheel': ('휠', '타이어', '인치', '림'),
    'steering': ('핸들', '스티어링', '운전대'),
    'screen': ('화면', '내비', '카메라', '디스플레이', '모니터', '스크린', '카플레이', '안드로이드'),
    'seat': ('시트', '좌석'), 'seat_back': ('시트', '좌석', '등받이'), 'headrest': ('헤드레스트', '시트'),
    'cluster': ('계기판', '클러스터'), 'plate': (),
}
def chip_matches_part(chip, part):
    words = PART_WORDS.get(part)
    return words is None or any(w in str(chip) for w in words)
norm = lambda s: re.sub(r'[\s·,()\-_/]', '', str(s))


def facts_strings(F):
    out = []
    def walk(v):
        if isinstance(v, dict): [walk(x) for x in v.values()]
        elif isinstance(v, list): [walk(x) for x in v]
        elif v is not None: out.append(str(v))
    walk(F)
    return out


def numbers(s):
    return [n.replace(',', '') for n in re.findall(r'\d[\d,]*(?:\.\d+)?', str(s))]


def show_text(line):
    """'BMW|비엠더블유 5시리즈,|오시리즈,' → 화면 글자만."""
    return ' '.join(tk.split('|')[0] for tk in line.replace('/', ' ').split())


def check(job, F):
    fail = []
    FS = facts_strings(F)
    nums = set()
    for s in FS:
        nums.update(numbers(s))
    nums |= {n.lstrip('0') for n in nums if n.lstrip('0')}
    for k in ('km', 'cc', 'price_manwon', 'year'):
        if F.get(k) is not None: nums.add(str(F[k]))
    texts = []
    t = job.get('title', {})
    texts += [('제목', t.get('brand', '')), ('제목', t.get('model', '')), ('제목', t.get('sub', ''))]
    chips = []
    for c in job['cuts']:
        texts.append((c['key'], show_text(c.get('line', ''))))
        if c.get('chip'): chips.append((c['key'], c['chip'])); texts.append((c['key'], c['chip']))
        for b in c.get('bigs') or []:
            texts.append((c['key'], b['text'])); chips.append((c['key'], b.get('label', '')))
        if c.get('material'): chips.append((c['key'], c['material']['text']))
    # ① 숫자
    for key, s in texts:
        for n in numbers(s):
            ok_ = n in nums or n.lstrip('0') in nums or any(n in m for m in nums if len(n) >= 2)
            if len(n) == 1 and re.search(rf'{n}\s*시리즈|{n}\s*세대|{n}\s*인승', s): ok_ = True
            if not ok_: fail.append(f'{key}: 화면 숫자 {n} 근거 없음 — 「{s}」')
    # ② 칩 근거
    FN = [norm(s) for s in FS if len(norm(s)) >= 2]
    for key, ch in chips:
        if not ch or ch in LABELS: continue
        c = norm(ch)
        if not any(f in c or c in f for f in FN):
            fail.append(f'{key}: 칩 「{ch}」 근거 없음 (facts·seen에 없음)')
    # ③ 금지 낱말
    allf = norm(' '.join(FS))
    for key, s in texts:
        for w in BANNED:
            if w in norm(s) and w not in allf: fail.append(f'{key}: 금지 낱말 「{w}」')
    # ④ 코드네임
    make = F.get('make', '')
    if not any(m in make for m in CODENAME_MAKERS):
        for key, s in texts:
            for code in re.findall(r'\b[A-Z]\d{2,3}\b|\b9\d{2}\b', s):
                fail.append(f'{key}: 코드네임 {code}는 BMW·벤츠·포르쉐만')
    # ⑤ 부위 칩 글자 ↔ 부위
    for c in job['cuts']:
        if c.get('part') and c.get('chip') and not chip_matches_part(c['chip'], c['part']):
            fail.append(f"{c['key']}: 칩 「{c['chip']}」은 찾는 부위 {c['part']}와 다름 — 화살표가 다른 곳을 가리킴(part를 빼서 위쪽 고정 칩으로)")
    return fail


if __name__ == '__main__':
    if len(sys.argv) < 3: print(__doc__); sys.exit(2)
    job = json.load(open(sys.argv[1], encoding='utf-8')); F = json.load(open(sys.argv[2], encoding='utf-8'))
    bad = check(job, F)
    for b in bad: print('  ✗', b)
    print('사실 검사 통과' if not bad else f'사실 검사 실패 {len(bad)}건')
    sys.exit(1 if bad else 0)
