#!/usr/bin/env python3
"""매물 정보 → 영상판 대본(job.json) 자동 생성 — ED-SIMPLE(원본 순서·원본 길이) 1.0. 2026-11-22.

  python3 make_job.py facts.json scenes.json -o job.json [--out 영상.mp4]

입력
  facts.json  : 원장 값 + seen(원본 영상에 보이는 것) — job_fact_check.py와 같은 파일
  scenes.json : 원본 장면 목록 [{"src": [시작, 끝], "zone": "ext|int|trunk", "part": "wheel|steering|screen…"(선택),
                                "see": ["seen 키"…](선택, 이 장면에 보이는 것 — 컷 분류 결과)}]
                장면은 원본 순서 그대로, 빈틈 없이 이어져야 한다(컷 자동 분류가 생기면 그 결과를 그대로 넣는다)
규칙
  - 첫 장면 = 차 이름, 끝 장면 = 앱 안내(고정 문구), 끝에서 둘째 = 가격
  - 문장은 그 장면의 구역(zone)·부위(part)와 맞는 것만. 부위가 같은 seen 항목을 먼저 고른다
  - 장면 길이 안에 읽히는 글자 수만(필요 시간 = 글자 ÷ 6.5자/초(숫자 문장 ×1.12) + 0.25초 ≤ 장면 길이 + 0.15초). 넘치는 문장은 다른 장면으로
  - 맞는 문장이 없는 장면은 앞 장면에 붙인다(원본 순서·길이는 그대로, 장면 경계만 합침)
  - 화면 글자 = 원장 표기, 읽기 글자 = ko_read 변환. 사실 검사(job_fact_check)를 끝에 자동 실행
출력은 초안이다. 사람이 문장을 다듬어도 사실 검사·관문(edit_gate)은 다시 통과해야 한다.
"""
import argparse, json, os, re, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ko_read import brand_ko, km_ko, manwon_ko, model_ko, num_ko

CPS = 6.5          # 초당 읽는 글자(공백 제외) — 차란차 13번 Taehyung 실측 5.5~7자(숫자 문장이 느림)
LEAD = 0.25        # 장면 앞 여유(place_voice 앞 0.25초)
NUM_SLOW = 1.12    # 숫자를 읽는 문장은 12% 느리게 잡음(실측: 1,998cc 문장 5.7자/초)
TOL = 0.15         # 장면 끝을 이만큼 넘는 것까지 허용(실측 넘침 0.09초는 자연스러움)
CTA = '보배드림 앱에서 / 자세한 정보를 보시거나, / 구글·애플 스토어에서 다운받으세요!'
CODENAME_MAKERS = ('BMW', '벤츠', '메르세데스', '포르쉐')


def say_len(line):
    """읽는 글자 수(공백·기호 제외). 「화면|읽기」면 읽기 쪽."""
    s = ' '.join(tk.split('|')[-1] for tk in line.replace('/', ' ').split())
    return len(re.sub(r'[\s,.!?·_/]', '', s))


def tok(show):
    """영문·숫자가 섞인 어절이면 「화면|읽기」."""
    if re.search(r'[A-Za-z0-9]', show):
        m = re.match(r'^([A-Za-z0-9]+)(.*)$', show)
        if m and re.fullmatch(r'[A-Za-z]+', m.group(1)) and m.group(1).upper() == m.group(1) and len(m.group(1)) > 1:
            return f'{show}|{brand_ko(m.group(1))}{m.group(2)}' if m.group(1).upper() in ('BMW', 'GMC', 'KGM', 'BYD') else f'{show}|{model_ko(m.group(1))}{m.group(2)}'
        if m: return f'{show}|{model_ko(m.group(1))}{m.group(2)}'
    return show


def pool(F):
    P = []
    name = ' '.join(tok(w) for w in F['make'].split())
    if F.get('series'): name += ' ' + ' '.join(tok(w) for w in F['series'].split()) + ','
    name += ' / ' + ' '.join(tok(w) for w in F['model'].split()) + '입니다.'
    name = re.sub(r'(\S+)\|(\S+)입니다\.$', r'\1입니다.|\2입니다.', name) if name.endswith('입니다.') and '|' in name.split()[-1] else name
    P.append(dict(id='name', zone='first', line=name))
    if F.get('reg') or F.get('color'):
        m = re.match(r'(\d{2})년(\d{2})월', F.get('reg', ''))
        reg = f'{m.group(1)}년 {int(m.group(2))}월에 등록됐습니다.' if m else ''
        col = f"외장은 {F['color']}이고, / " if F.get('color') else ''
        d = dict(id='color_reg', zone='ext', line=(col + reg).strip(' /') or f"외장은 {F['color']}입니다.")
        if m: d.update(chip=f"{F['reg']} 등록", chip_word=f'{m.group(1)}년')
        P.append(d)
    if F.get('cc'):
        P.append(dict(id='cc', zone='ext', line=f"{F['cc']:,}cc|{num_ko(F['cc'])}_씨씨 {F.get('fuel', '')}입니다.".replace(' 입니다', '입니다'),
                      bigs=[dict(text=f"{F['cc']:,}cc", label=F.get('fuel') or '배기량', word=f"{F['cc']:,}cc")]))
    for s in F.get('seen', []):
        d = dict(id=s['key'], zone=s.get('zone', 'any'), line=s['say'])
        if F.get('km') is not None and ('계기판' in s.get('chip', '') or s['key'] == 'cluster'):
            # 계기판 장면에서 주행거리를 같이 말한다(계기판에 숫자가 보이는 장면) — 장면이 짧으면 따로 놓음
            d['line'] = f"{s['chip']}, / 주행거리는 {F['km']:,}km입니다.|{km_ko(F['km'])}입니다." if s.get('chip') else d['line']
            d['bigs'] = [dict(text=f"{F['km']:,}km", label='주행거리', word=f"{F['km']:,}km입니다.")]
            d['also'] = 'km'
        if s.get('part'): d['part'] = s['part']
        if s.get('chip'):
            d['chip'] = s['chip']
            w = s['chip'].split()[0]
            d['chip_word'] = next((t.split('|')[0] for t in s['say'].replace('/', ' ').split() if t.split('|')[0].startswith(w)), w)
        if s.get('material'):
            w = s['material'].split()[0]
            d['material'] = dict(text=s['material'], word=next((t for t in s['say'].split() if t.startswith(w)), w))
        P.append(d)
    if F.get('trans'):
        P.append(dict(id='trans', zone='int', line=f"변속기는 {F['trans']}입니다.", chip=f"{F['trans']} 변속기", chip_word='변속기는'))
    if F.get('km') is not None:
        P.append(dict(id='km', zone='int', line=f"주행거리는 / {F['km']:,}km입니다.|{km_ko(F['km'])}입니다.",
                      bigs=[dict(text=f"{F['km']:,}km", label='주행거리', word=f"{F['km']:,}km입니다.")]))
    if F.get('price_manwon'):
        p = F['price_manwon']
        P.append(dict(id='price', zone='price', line=f'가격은 {p:,}만|{manwon_ko(p)} 원입니다.', bigs=[dict(text=f'{p:,}만원', label='가격', word=f'{p:,}만')]))
    return P


def build(F, scenes, out_name):
    assert all(abs(a['src'][1] - b['src'][0]) < 1e-6 for a, b in zip(scenes, scenes[1:])), '장면이 원본 순서로 빈틈없이 이어져야 함'
    P = pool(F); used = set(); cuts = []
    n = len(scenes)
    def need(s):
        return say_len(s['line']) / CPS * (NUM_SLOW if re.search(r'\d', s['line']) else 1) + LEAD
    def fits(s, sc):
        return need(s) <= sc['src'][1] - sc['src'][0] + TOL
    parts_ahead = lambda i: {x.get('part') for x in scenes[i:] if x.get('part')}
    price = next((s for s in P if s['id'] == 'price'), None)
    # 가격 장면 = 뒤에서부터 부위가 없는(차 전체·실내 일반) 장면 중 가격 문장이 들어가는 첫 장면
    price_i = next((i for i in range(n - 2, 0, -1) if price and not scenes[i].get('part') and fits(price, scenes[i])), n - 2)
    for i, sc in enumerate(scenes):
        key = f'c{i + 1}'
        if i == 0: pick = P[0]
        elif i == n - 1: pick = dict(id='cta', line=CTA)
        else:
            cand = [s for s in P if s['id'] not in used and s['zone'] not in ('first',)]
            if i == price_i and price and 'price' not in used:
                cand = [price]
            else:
                cand = [s for s in cand if s['zone'] != 'price']
            # 부위가 있는 문장은 그 부위가 보이는 장면에만(뒤에 그 부위 장면이 남아 있으면 기다림)
            cand = [s for s in cand if not s.get('part') or s.get('part') == sc.get('part') or s['part'] not in parts_ahead(i)]
            # 뒤 장면에 「보임」으로 잡힌 것은 그 장면까지 아껴 둠
            later = {k for x in scenes[i + 1:] for k in x.get('see', [])}
            cand = [s for s in cand if s['id'] in sc.get('see', []) or s['id'] not in later]
            zone_ok = [s for s in cand if s['zone'] in (sc.get('zone'), 'any', 'price')]
            part_ok = [s for s in zone_ok if sc.get('part') and s.get('part') == sc.get('part')]
            see_ok = [s for s in cand if s['id'] in sc.get('see', [])]   # 컷 분류(사람·CLIP)가 「이 장면에 보임」이라 한 것 먼저
            pick = next((s for s in see_ok + part_ok + zone_ok if fits(s, sc)), None)
            if pick is None and sc.get('zone') == 'int':   # 실내 장면은 주행거리·변속기처럼 구역 상관없는 사실도 받음
                pick = next((s for s in cand if s['id'] in ('km', 'trans') and fits(s, sc)), None)
        if pick is None:
            cuts[-1]['src'][1] = sc['src'][1]; cuts[-1]['_merged'] = cuts[-1].get('_merged', 0) + 1
            continue
        used.add(pick['id'])
        if pick.get('also'): used.add(pick['also'])
        c = dict(key=key, src=list(sc['src']), zone=sc.get('zone', 'ext'), line=pick['line'])
        for k in ('chip', 'chip_word', 'bigs', 'material'):
            if k in pick: c[k] = pick[k]
        if pick.get('part') and sc.get('part') == pick['part']: c['part'] = pick['part']
        if not fits(pick, sc) and i < n - 1: c['_over'] = round(need(pick) - (sc['src'][1] - sc['src'][0]), 2)
        cuts.append(c)
    gen = F.get('gen') if any(m in F['make'] for m in CODENAME_MAKERS) else None
    sub = ' · '.join(x for x in [F.get('reg'), F.get('fuel'), gen] if x)
    job = dict(edition='ED-SIMPLE', order='source', src='src.mp4', out=out_name, facts_source=F.get('_source', ''),
               title=dict(brand=F['make'], model=F['model'], sub=sub), end_word='자세한', cuts=cuts)
    unused = [s['id'] for s in P if s['id'] not in used and s['zone'] != 'first']
    return job, unused


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('facts'); ap.add_argument('scenes'); ap.add_argument('-o', required=True); ap.add_argument('--out', default='out.mp4')
    a = ap.parse_args()
    F = json.load(open(a.facts, encoding='utf-8')); S = json.load(open(a.scenes, encoding='utf-8'))
    job, unused = build(F, S, a.out)
    json.dump(job, open(a.o, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    for c in job['cuts']:
        print(f"  {c['key']:4} {c['src'][0]:5.1f}-{c['src'][1]:5.1f} {c['zone']:5} {say_len(c['line']):2}자" + (f" ⚠넘침 {c['_over']}초" if '_over' in c else '') + (f" (장면 {c['_merged']}개 합침)" if '_merged' in c else '') + f"  {c['line']}")
    if unused: print('  못 넣은 사실:', ', '.join(unused), '— 장면이 모자람(정상일 수 있음)')
    r = subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'job_fact_check.py'), a.o, a.facts])
    sys.exit(r.returncode)
