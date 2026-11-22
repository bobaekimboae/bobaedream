"""카드 컷 루틴 (card_routine_rules.json, 2026-11-22)

python3 card_routine.py <차 폴더>            # cards.json → 카드 구간 대본(문장) 출력
python3 card_routine.py <차 폴더> --cuts N   # 카드 구간 첫 어절 번호 N부터 받아쓰기(voice_a_words.json)를 읽어 CUTS 뼈대 출력

규칙: 카드가 처음 뜨는 컷은 「성능점검기록부 요약합니다.」 → 문제없는 줄 한 문장씩(없습니다!) → 확인 필요(warn) 줄은 맨 뒤 「다만 …표시가 있습니다.」.
값은 cards.json(점검기록부 사실)에서만 가져온다.
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
RULES = json.load(open(os.path.join(HERE, 'card_routine_rules.json'), encoding='utf-8'))


def _label(s):
    return s.replace(' · ', ', ').replace('·', ', ')


def script(card, kind='report'):
    """카드 → [(단계, 문장, 이미지 번호)]"""
    r = RULES['cards'][kind]
    first = card['first']
    rows = card['rows']
    out = [('intro', r['intro'].format(name=r['name']), first)]
    oks = [(i, x) for i, x in enumerate(rows) if not (len(x) > 2 and x[2] == 'warn')]
    warns = [(i, x) for i, x in enumerate(rows) if len(x) > 2 and x[2] == 'warn']
    for k, (i, x) in enumerate(oks):
        lab = _label(x[0])
        t = r['row_sentence']['ok' if k == 0 else 'ok_more']
        if k > 0 and lab.endswith('이력'):
            lab = lab[:-2].strip()
        out.append(('ok', t.format(label=lab), first + 1 + i))
    if warns:
        items = r['row_sentence']['warn_join'].join(f"{_label(x[0])} {x[1]}" for _, x in warns)
        out.append(('warn', r['row_sentence']['warn_first'].format(items=items), first + 1 + warns[-1][0]))
    return out


def check(C, words):
    """check_cfg가 부름: 카드 구간 첫 컷이 「…요약합니다」로 시작하는지, warn 문장이 「다만」인지. 돌려줌: (오류, 경고)"""
    err, warn = [], []
    secs = getattr(C, 'SECTIONS', [])
    for ids, title, _ in secs:
        kind = next((k for k, v in RULES['cards'].items() if v['section_title'] == title), None)
        if not kind:
            continue
        r = RULES['cards'][kind]
        cuts = [c for c in C.CUTS if c[0] in ids]
        if not cuts:
            continue
        first = ' '.join(x[0] for x in cuts[0][3] if x != '|')
        if not any(k in first for k in r['intro_keywords']) or r['name'][:4] not in first.replace(' ', ''):
            err.append(f"카드 루틴: 「{title}」 첫 컷은 「{r['intro'].format(name=r['name'])}」로 시작 (지금: 「{first}」)")
        if cuts[0][5] in (None, 'reveal'):
            warn.append(f"카드 루틴: 「{title}」 첫 컷 넘김은 {RULES['steps'][0]['transition']} 권장")
        for c in cuts[1:]:
            if c[5] != 'reveal':
                err.append(f"카드 루틴: 「{title}」 줄 공개 컷 p{c[0]} 넘김은 reveal")
        body = ' '.join(x[0] for c in cuts for x in c[3] if x != '|')
        for nv in RULES['never']:
            if nv in body:
                err.append(f"카드 루틴: 금지 표현 「{nv}」")
    return err, warn


if __name__ == '__main__':
    car = os.path.abspath(sys.argv[1])
    cards = json.load(open(os.path.join(car, 'cards.json'), encoding='utf-8'))
    sc = script(cards['report'])
    for st, t, p in sc:
        print(f'{st:6s} p{p}  {t}')
    print('대본:', ' '.join(t for _, t, _ in sc))
