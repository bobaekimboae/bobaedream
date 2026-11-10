"""타임라인 자동 점검: 렌더 전에 규칙 위반을 찾는다.
python3 -m edit_skills.check timeline.json
"""
import json, sys
from .library import LIB
from .registry import SPEC


def check(tl, duration):
    C = LIB['collision']
    K = LIB['korean']
    errs, warns = [], []
    ev = sorted(tl, key=lambda e: e['start'])
    # 1) 같은 자리 겹침(한 자리에 하나)
    for i, a in enumerate(ev):
        for b in ev[i + 1:]:
            if b['start'] >= a['start'] + a['dur']:
                break
            if a['zone'] == b['zone'] and a['zone'] not in ('anchor',) and not a.get('stack') and not b.get('stack'):
                errs.append(f"겹침 {a['id']}@{a['start']:.1f} ↔ {b['id']}@{b['start']:.1f} (자리 {a['zone']})")
    # 2) 새 요소 1초에 하나까지(말 자막 제외)
    news = [e['start'] for e in ev if e['zone'] != 'caption' and not e.get('stack')]
    for i in range(1, len(news)):
        if news[i] - news[i - 1] < 1.0 / C['max_new_overlays_per_sec'] - 1e-6:
            warns.append(f'새 요소 간격 {news[i] - news[i - 1]:.2f}초 @{news[i]:.1f}')
    # 3) 쇼츠 안전 영역(세로 중심)
    for e in ev:
        if e['zone'] in ('full', 'caption'):
            continue
        if not (C['shorts_safe']['top_px_ratio'] <= e['cy'] <= C['shorts_safe']['bottom_ratio']):
            errs.append(f"안전 영역 밖 {e['id']} cy={e['cy']:.2f}")
    # 4) 글자 길이
    for e in ev:
        t = e['params'].get('text', '')
        if e['id'] in ('S001', 'S008', 'S013', 'S002', 'S045') and len(t) > K['label_max_chars']:
            warns.append(f"이름표 글자 {len(t)}자 > {K['label_max_chars']} ({e['id']} '{t}')")
        if e['id'] in ('S004', 'S009', 'S006') and len(t) > K['bigword_max_chars'] + 3:
            warns.append(f"큰 글자 {len(t)}자 ({e['id']} '{t}')")
    # 5) 효과음 비율(원본: 요소 4개 중 1개꼴)
    with_sfx = sum(1 for e in ev if e.get('sfx') not in (None, 'none') and e['zone'] != 'caption' and not e.get('stack'))
    n = sum(1 for e in ev if e['zone'] != 'caption' and not e.get('stack'))
    if n and with_sfx / n > LIB['sfx']['max_ratio']:
        warns.append(f'효과음이 많음 {with_sfx}/{n}')
    # 6) 끝 로고
    if not any(e['id'] == 'S030' and e['start'] >= duration - 4 for e in ev):
        warns.append('끝 로고(S030) 없음')
    # 7) 모드 규칙
    mode = ev[0].get('mode') if ev else None
    for e in ev:
        if mode and mode not in LIB['by_id'][e['id']]['mode_nums']:
            errs.append(f"모드 {mode}에서 쓰지 않는 스킬 {e['id']}")
    return dict(ok=not errs, errors=errs, warnings=warns, overlays=n, with_sfx=with_sfx)


if __name__ == '__main__':
    d = json.load(open(sys.argv[1], encoding='utf-8'))
    print(json.dumps(check(d['timeline'], d['duration']), ensure_ascii=False, indent=1))
