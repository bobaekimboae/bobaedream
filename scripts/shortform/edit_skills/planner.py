"""편집 계획 짜기: 대본(장면 목록) + 쓰는 방식(1·2·3) + 패턴 → 스킬 타임라인

입력 script.json
{
  "mode": 1, "pattern": "P02", "duration": 32.0,
  "car": {"name": "레인지로버 SV", "price": "가격 상담", "year": "2019", "km": "5.2만km", "fuel": "가솔린"},
  "beats": [
    {"start": 0.0, "dur": 3.0, "scene": "intro", "say": "...", "facts": {"text": "레인지로버 SV"}},
    {"start": 3.0, "dur": 4.0, "scene": "option", "facts": {"text": "마사지 시트"}, "anchor": [0.62, 0.58]},
    {"start": 7.0, "dur": 3.0, "scene": "sound", "audio": "exhaust"},
    ...
  ]
}
- 사실(이름·가격·옵션)은 beats[].facts 와 car 에서만 가져온다. 비어 있으면 그 스킬은 건너뛴다(지어내지 않음).
- 옵션 이름은 매물 옵션 표에 있는 이름만 넣는다(호출하는 쪽 책임).
출력: {"duration":..,"mode":..,"timeline":[{id,start,dur,params,zone,cy,cx,motion,sfx,mode}]}
"""
import json, sys
from .library import LIB
from .registry import SPEC

# 장면 → 스킬별 파라미터 만들기(사실이 없으면 None)
def _params(sid, beat, car):
    f = dict(beat.get('facts') or {})
    name = car.get('name', '')
    get = lambda k: f.get(k) or car.get(k)
    if sid in ('S001', 'S041'):
        t = f.get('text') or name
        return t and (dict(text=t) if sid == 'S001' else dict(name=t, prefix=f.get('prefix', '신형')))
    if sid in ('S002', 'S036', 'S045', 'S008'):
        t = f.get('option') or f.get('text')
        return t and dict(text=t, mark='✓' if sid == 'S008' else None)
    if sid == 'S004':
        t = f.get('number') or f.get('price') or (beat['scene'] == 'price' and car.get('price'))
        return t and dict(text=t)
    if sid == 'S007':
        t = f.get('number') or (beat['scene'] == 'spec' and car.get('km'))
        return t and dict(text=t)
    if sid == 'S042':
        return dict(sym='₩') if (f.get('price') or car.get('price')) and beat['scene'] == 'price' else None
    if sid == 'S011':
        return (f.get('old') and f.get('new')) and dict(old=f['old'], new=f['new'])
    if sid == 'S043':
        return f.get('rank') and dict(n=f['rank'])
    if sid in ('S012', 'S032'):
        if not beat.get('audio'):
            return None  # 실제로 소리가 들릴 때만
        return dict(n=3) if sid == 'S012' else (name and dict(text=name))
    if sid == 'S018':
        return f.get('photo') is not None and f.get('text') and dict(photo=f['photo'], text=f['text'])
    if sid in ('S019', 'S022'):
        return f.get('screen') is not None and dict(screen=f['screen'])
    if sid == 'S020':
        return beat.get('anchor') and dict(size=260)
    if sid == 'S035':
        return beat.get('anchor') and dict(dir='left' if beat['anchor'][0] < .5 else 'right')
    if sid == 'S025':
        # 첫 화면 문구는 대본에 적힌 것만. 퀴즈 장면에서만 기본 문구를 쓴다(지어낸 질문 금지)
        if f.get('line1'):
            return dict(line1=f['line1'], line2=f.get('line2', ''))
        return dict(line1='이 차 이름은?', line2='댓글로 맞혀 보세요') if beat['scene'] == 'quiz_hook' else None
    if sid == 'S026':
        rows = [(k, car[c]) for k, c in (('주행거리', 'km'), ('연식', 'year'), ('연료', 'fuel')) if car.get(c)]
        return rows and dict(rows=rows)
    if sid == 'S027':
        return (f.get('a') and f.get('b')) and dict(a=f['a'], b=f['b'], chosen=f.get('chosen'))
    if sid in ('S028', 'S029', 'S030', 'S031', 'S034', 'S044'):
        return {}
    if sid == 'S033':
        return f.get('person') and dict(name=f['person'], role=f.get('role', ''))
    if sid == 'S040':
        return f.get('country') and dict(code=f['country'])
    if sid == 'S014':
        return f.get('stat') and dict(text=f['stat'], up=f.get('up', True))
    if sid == 'S015':
        return f.get('length') and dict(text=f['length'])
    if sid == 'S024':
        return f.get('modes') and dict(texts=f['modes'])
    if sid == 'S013':
        return f.get('text') and f.get('emoji') and dict(text=f['text'], emoji=f['emoji'])
    if sid == 'S009':
        return f.get('wow') and dict(text=f['wow'])
    if sid == 'S005':
        return (f.get('count_to') is not None) and dict(start=f.get('count_from', 0), end=f['count_to'], unit=f.get('unit', ''))
    if sid == 'S017':
        return f.get('type') and dict(text=f['type'])
    if sid == 'S016':
        return f.get('arc') and dict(text=f['arc'])
    if sid == 'S006':
        return f.get('center') and dict(text=f['center'])
    if sid == 'S021':
        return f.get('photo') is not None and dict(photo=f['photo'], title=name, price=car.get('price', ''), meta=' · '.join(x for x in (car.get('year'), car.get('km'), car.get('fuel')) if x))
    if sid == 'S023':
        return f.get('photos') and dict(photos=f['photos'])
    if sid == 'S003':
        return f.get('lines') and dict(lines=f['lines'])
    if sid == 'S046':
        t = f.get('place') or car.get('company')
        return t and dict(text=t)
    if sid == 'S047':
        return f.get('photos') and len(f['photos']) >= 2 and dict(photos=f['photos'])
    if sid == 'S048':
        return f.get('explain') and dict(text=f['explain'], icon=f.get('icon', '🤝'))
    if sid == 'S049':
        return f.get('logo') and dict(logo=f['logo'])
    if sid == 'S050':
        return dict(text=f.get('slogan', '내 차 찾기는 보배드림')) if beat['scene'] == 'ending' else None
    if sid == 'S052':
        return f.get('series') and dict(title=f['series'], sub=f.get('episode', ''))
    if sid == 'S053':
        return f.get('quote') and dict(text=f['quote'], speaker=f.get('person', ''))  # 실제로 한 말만
    if sid == 'S010':
        return dict() if beat['scene'] == 'sold_hook' else None
    if sid in ('S038', 'S039', 'S037', 'S051'):
        return None  # 말 자막·X·덮개는 대본에서 직접 지정할 때만(beats[].skills)
    return None


STACK = ('S035', 'S020', 'S031', 'S034', 'S040', 'S012')


def _place(sid, beat, prm):
    s = SPEC[sid]
    lib = LIB['by_id'].get(sid, {})
    cy = lib.get('cy_med') or s['cy']
    cx = .5
    if s['zone'] == 'anchor' and beat.get('anchor'):
        ax, ay = beat['anchor']
        cy = ay
        if sid == 'S035':     # 손가락은 부위 옆에서 부위를 가리킴
            cx = ax + (.16 if ax < .5 else -.16)
        elif sid == 'S020':
            cx = ax
        else:                 # 칩은 부위 아래·옆(원본: 부위 옆 아래 55~75%)
            cx = min(.72, max(.3, ax))
            cy = min(.78, ay + .08)
    return cx, cy


def _key(prm):
    return str(prm.get('text') or prm.get('name') or prm.get('line1') or '') if isinstance(prm, dict) else ''


def plan(script):
    mode = int(script['mode'])
    car = script.get('car', {})
    dur = float(script['duration'])
    flows = LIB['recipes']
    gap_med = LIB['timing']['gap_between_overlays']
    min_gap = 1.0 / LIB['collision']['max_new_overlays_per_sec']
    tl = []
    last_new = -9.0
    shown = set()
    for b in script['beats']:
        ids = list(b.get('skills') or flows.get(b['scene'], []))
        if b['scene'] in ('option', 'point', 'hint') and mode == 3:
            ids = flows.get('point_m3', []) + [i for i in ids if i not in flows.get('point_m3', [])]  # ③ 손가락이 먼저
        # 이 장면에서 실제로 쓸 스킬(사실이 있고, 방식에 맞고, 같은 글자 반복 아님)
        cands = []
        for sid in ids:
            if sid not in SPEC or mode not in LIB['by_id'][sid]['mode_nums']:
                continue
            prm = (b.get('params') or {}).get(sid) or _params(sid, b, car)
            if prm is None or prm is False or prm == '':
                continue
            k = _key(prm)
            if k and (k in shown or any(_key(c[1]) == k for c in cands)):
                continue  # 같은 글자를 다른 모양으로 또 띄우지 않음(원본도 한 번만)
            cands.append((sid, prm))
        n_new = sum(1 for sid, _ in cands if sid not in STACK) or 1
        b_end = b['start'] + b['dur']
        t0 = max(b['start'] + LIB['timing']['first_overlay_delay'], last_new + min_gap)
        step = max(min_gap, min(gap_med, (b_end - t0) / n_new))
        t = t0
        for sid, prm in cands:
            s = SPEC[sid]
            stack = sid in STACK
            st_ = t if not stack else (tl[-1]['start'] if tl and tl[-1]['start'] >= b['start'] else t)
            d = min(LIB['by_id'][sid].get('dur_med') or s['dur'], b_end - st_)
            d = max(d, min(s['dur'], b_end - st_)) if s['motion'] in ('count', 'type') or sid in ('S041', 'S025', 'S050', 'S029', 'S046') else d
            if d < .5:
                continue
            cx, cy = _place(sid, b, prm)
            tl.append(dict(id=sid, start=round(st_, 2), dur=round(d, 2), params=prm, zone=s['zone'], cx=cx, cy=round(cy, 3),
                           motion=s['motion'], sfx=s['sfx'], mode=mode, stack=stack, scene=b['scene']))
            shown.add(_key(prm))
            if not stack:
                last_new = st_
                t = st_ + step
    # 끝 로고
    if not any(e['id'] == 'S030' for e in tl):
        tl.append(dict(id='S030', start=round(dur - 2.2, 2), dur=2.2, params={}, zone='center', cx=.5, cy=SPEC['S030']['cy'], motion='pop', sfx='ding', mode=mode, stack=False))
    # 효과음 솎기: 원본처럼 요소 4개 중 1개꼴. 꼭 붙일 것(끝 로고·퀴즈 첫 화면·가격 숫자)을 먼저 세고,
    # 남는 몫만큼만 나머지에 고르게 붙인다(첫 요소 우선).
    ev = [e for e in sorted(tl, key=lambda x: x['start']) if e['zone'] != 'caption' and e['sfx'] != 'none' and not e.get('stack')]
    for e in tl:
        if e.get('stack'):
            e['sfx'] = 'none'
    must = [e for e in ev if e['id'] in ('S030', 'S025') or (e['id'] == 'S004' and e.get('scene') == 'price')]
    n_all = sum(1 for e in tl if e['zone'] != 'caption' and not e.get('stack'))
    budget = max(len(must), int(n_all * LIB['sfx']['max_ratio']))
    rest = [e for e in ev if e not in must]
    room = budget - len(must)
    keep = set()
    if room > 0 and rest:
        step = max(1, len(rest) // room)
        keep = {id(e) for e in rest[::step][:room]}
    for e in rest:
        if id(e) not in keep:
            e['sfx'] = 'none'
    return dict(duration=dur, mode=mode, pattern=script.get('pattern'), timeline=sorted(tl, key=lambda x: x['start']))


if __name__ == '__main__':
    s = json.load(open(sys.argv[1], encoding='utf-8'))
    out = plan(s)
    for e in out['timeline']:
        e['params'] = {k: (v if isinstance(v, (str, int, float, list, dict, type(None))) else '<image>') for k, v in e['params'].items()}
    json.dump(out, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False, indent=1) if len(sys.argv) > 2 else print(json.dumps(out, ensure_ascii=False, indent=1))
