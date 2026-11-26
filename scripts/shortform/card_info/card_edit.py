#!/usr/bin/env python3
"""숏폼 카드 정보 2차(card-info-v2) — 차량 편집 안에 카드 끼우기.

카드는 필수가 아니다. 매물 데이터가 있는 카드만 후보가 되고(빈 카드·정형 문구 카드 금지),
편집 길이에 맞게 1개~여러 개를 골라 card_spec.card_order 순서로 바깥 사진 투어 뒤에 끼운다.

  python3 scripts/shortform/card_info/card_edit.py samples/g400d/cards.json --max 1 --name edit_1card
  python3 scripts/shortform/card_info/card_edit.py samples/g400d/cards.json --length 45s --name edit_multi
  python3 scripts/shortform/card_info/card_edit.py samples/g400d/cards.json --plan            # 고르기 결과만 출력

출력: <out>/<name>.mp4 · <name>.plan.json(고른 카드·뺀 카드와 이유·구간 시각) · report.json에 합침
"""
import argparse, json, os, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import card_render as R  # noqa: E402

SPEC = R.SPEC


def check(card):
    """card_spec.selection.requires를 코드로 옮긴 최소 검사. (통과, 이유)"""
    if card is None:
        return False, '데이터 없음'
    if card.get('template_only'):
        return False, card.get('_omit_reason', '정형 문구뿐')
    k, items = card['key'], card.get('items') or []
    need = {'car_info': 3, 'inspection': 1, 'insurance': 1, 'timeline': 3, 'options': 4, 'extra_options': 1, 'features': 3}
    if k == 'seller':
        return (len(card.get('lines') or []) >= 1, '판매자 사실 문장 없음')
    if k in need and len(items) < need[k]:
        return False, f'항목 {len(items)}개 < {need[k]}개'
    if k == 'timeline' and any(not i.get('date') for i in items):
        return False, '날짜 없는 사건 포함'
    return True, ''


def select(D, max_cards=None, keys=None):
    order = SPEC['card_order']['order']
    by = {c['key']: c for c in D['cards']}
    cand, dropped = [], []
    for k in order:
        ok, why = check(by.get(k))
        (cand if ok else dropped).append(k if ok else (k, why))
    if keys:
        pick = [k for k in order if k in keys and k in cand]
    else:
        pri = SPEC['selection']['priority']['order']
        n = max_cards or len(cand)
        chosen = [k for k in pri if k in cand][:n]
        pick = [k for k in order if k in chosen]
    over = [k for k in cand if k not in pick]
    return pick, dropped, over, by


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('data')
    ap.add_argument('--out', default=None)
    ap.add_argument('--name', default='edit')
    ap.add_argument('--max', type=int, default=None, help='끼울 카드 최대 개수')
    ap.add_argument('--length', default=None, help='30s/45s/60s → selection.max_cards_by_length')
    ap.add_argument('--cards', default='', help='직접 고르기(쉼표). 순서는 card_order로 다시 맞춘다')
    ap.add_argument('--plan', action='store_true', help='고르기 결과만 출력')
    a = ap.parse_args()
    dp = a.data if os.path.isabs(a.data) else (a.data if os.path.exists(a.data) else os.path.join(HERE, a.data))
    D = json.load(open(dp)); base = os.path.dirname(os.path.abspath(dp))
    mx = a.max or (SPEC['selection']['max_cards_by_length'].get(a.length) if a.length else None)
    pick, dropped, over, by = select(D, mx, [k for k in a.cards.split(',') if k])
    names = SPEC['card_order']['names']
    print('[고른 카드]', ' → '.join(f'{names[k]}' for k in pick) or '없음')
    for k, why in dropped:
        print(f'[뺀 카드] {names.get(k, k)}: {why}')
    if over:
        print('[한도 초과로 안 씀]', ', '.join(names[k] for k in over))
    E, P = SPEC['edit'], D.get('edit_photos', {})
    ph = D.get('edit_photo_cards', {})
    seq = [('hook', None)]
    seq += [(f'ph_{p}', p) for p in E['exterior'] if p in P and p != 'front34']
    seq += [(k, None) for k in pick]
    seq += [(f'ph_{p}', p) for p in E['interior'] if p in P]
    seq += [('end', None)]
    plan = {'spec': SPEC['version'], 'data': os.path.relpath(dp, R.ROOT), 'cards': pick,
            'dropped': [{'key': k, 'why': w} for k, w in dropped], 'over_limit': over, 'max': mx, 'segments': []}
    if a.plan:
        print(json.dumps(plan, ensure_ascii=False, indent=1)); return
    out = a.out or os.path.join(base, 'out'); os.makedirs(out, exist_ok=True)
    build = tempfile.mkdtemp(prefix='cardedit_')
    R.ICONS = R.icons()
    from playwright.sync_api import sync_playwright
    segs, off, vids = [], 0.0, []
    with sync_playwright() as p:
        b = p.chromium.launch()
        page = b.new_page(viewport={'width': SPEC['canvas']['w'], 'height': SPEC['canvas']['h']}, device_scale_factor=1)
        for key, pk in seq:
            if key == 'hook':
                c = {**D['hook'], 'type': 'hero', 'key': 'hook', 'bg': D['hook']['photo']}
                if D.get('edit_hook_caption'): c['caption'] = D['edit_hook_caption']
            elif key == 'end':
                c = {'type': 'end', 'key': 'end', 'bg': D['hook']['photo']}
            elif pk:
                meta = ph.get(pk, {})
                c = {'type': 'photo', 'key': key, 'photo': P[pk], 'bg': P[pk], 'dur': E['photo_dur_s'],
                     'title': meta.get('title'), 'captions': meta.get('captions', [])}
            else:
                c = by[key]
            vf = os.path.join(build, f'{key}.mp4')
            tl = R.render_segment(page, c, base, build, vf, with_audio=False)
            if off > 0 and c['type'] != 'end' and E.get('whoosh_on_cut'):
                tl['events'] = [{'t': 0.0, 'sfx': 'whoosh', 'vol': R.RULES['sfx']['volume']['whoosh']}] + [e for e in tl['events'] if e['t'] >= 0.3]
            segs.append((off, tl)); vids.append(vf)
            plan['segments'].append({'key': key, 'start': round(off, 2), 'dur': round(tl['frames'] / R.FPS, 2),
                                     'panel_bottom_px': tl.get('panelBottom')})
            off += tl['frames'] / R.FPS
            print(f'[편집] {key:<14} {tl["frames"] / R.FPS:.2f}s  누적 {off:.2f}s')
        b.close()
    lst = os.path.join(build, 'list.txt'); open(lst, 'w').write(''.join(f"file '{v}'\n" for v in vids))
    vcat = os.path.join(build, 'cat.mp4')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', vcat], check=True)
    mf = os.path.join(out, f'{a.name}.mp4')
    R.mix_audio(segs, off, vcat, mf)
    plan['result'] = R.measure(mf)
    plan['panel_ok'] = all((s['panel_bottom_px'] or 0) <= SPEC['panel']['max_bottom'] for s in plan['segments'])
    json.dump(plan, open(os.path.join(out, f'{a.name}.plan.json'), 'w'), ensure_ascii=False, indent=1)
    print('[완료]', mf, plan['result'], 'panel_ok', plan['panel_ok'])


if __name__ == '__main__':
    main()
