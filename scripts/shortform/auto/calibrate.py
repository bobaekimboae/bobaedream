"""자동 편집 결과를 원본(네덜란드·벨기에 각 100편) 측정값과 비교한다 — 재교정 고리.

python3 calibrate.py OUT_DIR [OUT_DIR ...]
  OUT_DIR = auto_edit.py build 결과 폴더(plan.json, config.py, render/sag_reel_v1.mp4, render/sfx_hits.json)
결과: 항목별 값 · 목표 범위 · 판정(OK / 낮음 / 높음). calib.json 으로도 남긴다.
목표 범위는 auto_edit_rules.json 의 calibration. 원본을 더 분석해 범위를 고치면 여기 결과가 따라 바뀐다.
"""
import json, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__))
RULES = json.load(open(os.path.join(HERE, 'auto_edit_rules.json'), encoding='utf-8'))


from learn_l1 import cuts_ff as cuts  # 원본 100편을 잰 자와 같은 자(scale 180 · 장면 점수 0.3 · 0.4초 안 겹침은 하나로)


CAT_PARTS = {o['name']: o['parts'] for o in RULES['option_catalog']}


def dur(mp4):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4],
                                capture_output=True, text=True).stdout)


def measure(d):
    plan = json.load(open(os.path.join(d, 'plan.json'), encoding='utf-8'))
    style = plan['style']
    mp4 = os.path.join(d, 'render', 'sag_reel_v1.mp4')
    T = dur(mp4)
    c = [t for t in cuts(mp4) if 0.3 < t < T - 2.6]  # 끝 화면 전환은 컷에서 뺀다
    edges = [0.0] + c + [T - 2.4]
    lens = sorted(b - a for a, b in zip(edges, edges[1:]) if b > a)
    med = lens[len(lens) // 2] if lens else 0
    chips = [s for b in plan['blocks'] for s in b['stickers']]
    opt = [s for s in chips if len(s) > 2 and s[2].get('option')]
    sfx = json.load(open(os.path.join(d, 'render', 'sfx_hits.json')))
    mins = T / 60
    cfg = open(os.path.join(d, 'config.py'), encoding='utf-8').read()
    cap_y = {'bobae_nl': 1152, 'bobae_be': 1283}[style] / 1920 * 100  # 렌더러 프리셋 cap_cy
    m = dict(duration_s=round(T, 1), cuts_per_min=round(len(c) / mins, 1), shot_med_s=round(med, 2),
             chips_per_min=round(len(chips) / mins, 1), option_chips=len(opt), sfx_per_video=len(sfx['hits']),
             caption_y_pct=round(cap_y, 1), music=bool(sfx.get('music')), first_cut_s=round(c[0], 2) if c else None)
    # 옵션 칩 = 그 부위 장면 위인지(옵션 칩 노출 규칙의 핵심)
    hit = 0
    for b in plan['blocks']:
        for s in b['stickers']:
            if len(s) > 2 and s[2].get('option'):
                parts = b.get('shot_parts', [])
                ok = CAT_PARTS.get(s[2].get('option'), [s[2].get('part')])  # 옵션 사전의 보이는 부위 중 하나면 맞음
                if s[1] < len(parts) and parts[s[1]] in ok:
                    hit += 1
    m['option_on_part'] = f'{hit}/{len(opt)}'
    # 칩이 새 장면 시작 0.5초 안에 뜨는 비율(원본 NL 0.33 · BE 0.40~0.50). 우리는 컷과 칩을 같은 구절 시작에 걸어 높게 나온다
    tm = plan.get('times', {})
    dl = RULES['option_exposure'].get('chip_delay', {}).get(style, 0.1)  # 칩이 실제로 뜨는 시각(렌더러 chip_delay)
    cst = [tm[f"{bi}:{s[1]}"][0] + dl for bi, b in enumerate(plan['blocks']) for s in b['stickers'] if f"{bi}:{s[1]}" in tm]
    if cst:
        m['chip_on_new_shot'] = round(sum(any(0 <= t - x <= 0.5 for x in [0.0] + c) for t in cst) / len(cst), 2)
    return style, m


def judge(style, m):
    tg = RULES['calibration'][style]
    rows = []
    for k, v in m.items():
        t = tg.get(k)
        if isinstance(t, list) and isinstance(v, (int, float)):
            j = 'OK' if t[0] <= v <= t[1] else ('낮음' if v < t[0] else '높음')
        elif isinstance(t, bool):
            j = 'OK' if v == t else '다름'
        else:
            j = '-'
        rows.append((k, v, t, j))
    return rows


if __name__ == '__main__':
    allr = {}
    for d in sys.argv[1:]:
        style, m = measure(d)
        rows = judge(style, m)
        allr[d] = dict(style=style, rows=rows)
        print(f'\n[{style}] {d}')
        for k, v, t, j in rows:
            print(f'  {k:16s} {str(v):>8s}  목표 {str(t):14s} {j}')
        json.dump(dict(style=style, metrics=m, rows=rows), open(os.path.join(d, 'calib.json'), 'w'), ensure_ascii=False, indent=1)
