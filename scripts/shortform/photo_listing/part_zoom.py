"""부위 당기기(키프레임 자동) — part_zoom_rules.json, 매뉴얼 14장 (2026-11-18, v1.0)

cfg에 AUTO_ZOOM = True 만 적으면, 규칙에 맞는 컷의 켄번스를 키프레임 목록으로 바꾼다:
컷 시작은 넓게 → 그 부위 낱말 소리에 맞춰 부위로 당김 → 컷 끝까지 아주 천천히 더 다가감.
어떤 컷을 당기고(on_when) 어떤 컷을 두는지(off_when)는 JSON에만 있다. 한 대만 손으로 맞추지 않는다.
"""
import json
import os
import sys

RULES = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'part_zoom_rules.json')))


def _anchors(n, keys):
    f = f'src2/p{n:02d}.anchors.json'
    data = json.load(open(f)) if os.path.exists(f) else {}
    need = [k for k in keys if k not in data and f'_miss_{k}' not in data]
    if need:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        import part_anchor
        got = part_anchor.anchors(f'src2/p{n:02d}.png', tuple(need))
        data.update(got)
        for k in need:
            if k not in got:
                data[f'_miss_{k}'] = True   # 못 찾은 것도 기록(다음 렌더에서 모델을 다시 돌리지 않음)
        json.dump(data, open(f, 'w'), ensure_ascii=False)
    return {k: data[k] for k in keys if k in data}


def _zoom_for(box, fade, img_wh, W, H, big):
    S, T = RULES['size'], RULES
    w, h = img_wh
    bw, bh = max(1e-3, box[2] - box[0]), max(1e-3, box[3] - box[1])
    if fade:
        fw = min(W, H * .78 * w / h)
        base_vw, base_vh, zmax = 1.0, 1.0, S['max_zoom_fade']
        zpix = S['max_pixel_scale'] * w / fw
    else:
        base_vw, base_vh, zmax = W * h / (H * w), 1.0, S['max_zoom_full']
        zpix = S['max_pixel_scale'] * h / H
    z = min(S['fill_target'] * base_vw / bw, 0.8 * base_vh / bh)
    z = min(z, zmax, zpix, S['big_part_max_z'] if big else 9)
    return z


def build(C, cuts, starts, ends, onset, words, W, H, fade):
    """돌려줌: ({컷 번호: 키프레임 목록[(u, x, z, y)]}, 보고 줄들)"""
    from PIL import Image
    P, Tm, S = RULES['parts'], RULES['timing'], RULES['size']
    fit = set(getattr(C, 'FIT', []))
    ptrs = getattr(C, 'POINTERS', [])
    out, rep = {}, []
    for ci, c in enumerate(cuts):
        n, label, a, kb = c[0], c[1], c[2], c[6]
        b = cuts[ci + 1][2] - 1 if ci + 1 < len(cuts) else len(words) - 1
        s0, e0 = starts[ci], ends[ci]
        dur = e0 - s0
        why = None
        if ci == 0 and getattr(C, 'HOOK_ZOOM', None):
            why = '첫 컷(엠블럼 줌)'
        elif n in fit:
            why = 'FIT 사진'
        elif isinstance(kb, list):
            why = '손 키프레임'
        elif dur < Tm['min_cut_s']:
            why = f'짧은 컷 {dur:.1f}초'
        if not os.path.exists(f'src2/p{n:02d}.png'):
            why = why or '사진 없음'
        img_wh = Image.open(f'src2/p{n:02d}.png').size if not why else None
        if img_wh and img_wh == (W, H):
            why = '9:16 카드'
        if why:
            rep.append(f'컷 {ci + 1} 사진 {n}({label}): 그대로 — {why}')
            continue
        # 부위 고르기(규칙 detect): 라벨 부위 + 이 컷에서 말한 작은 부위(실내) / 외관은 exterior_ok만, 말한 순서대로
        D = RULES['detect']
        ext = any(wd in label for wd in D['exterior_label_words'])
        said = {}
        lab = set()
        for k, v in P.items():
            wi = next((i for i in range(a, b + 1) if any(sw in words[i][2] for sw in v['say'])), None)
            in_label = any(wd in label for wd in v['label_words'])
            if (ext and not v.get('exterior_ok')) or (not ext and v.get('exterior_only')):
                continue
            if in_label or (wi is not None and (v['small'] or ext)):
                said[k] = wi
                if in_label:
                    lab.add(k)
        if lab:   # 2026-11-22: 라벨에 부위가 있으면 라벨 부위만(선루프 컷이 「바람」 낱말로 공조에 당겨지던 오류)
            said = {k: w for k, w in said.items() if k in lab}
        if any(wd in label for wd in RULES['seat_cut']['label_words']) and not any(x in label for x in RULES['seat_cut']['except']):
            said = {'backrest': said.get('backrest')}   # 시트 컷: 시트 아이콘 줄이 보이도록 등받이만(핸들로 당기지 않음)
        elif any(P[k]['small'] for k in said):
            said = {k: w for k, w in said.items() if P[k]['small']}
        keys = sorted(said, key=lambda k: (said[k] is None, said[k] if said[k] is not None else 0))
        anc = _anchors(n, keys) if keys else {}
        ok = lambda k: k in anc and (anc[k].get('score') or 1) >= D['min_score'] and \
            (anc[k]['box'][2] - anc[k]['box'][0]) * (anc[k]['box'][3] - anc[k]['box'][1]) <= D['max_area']
        found = [k for k in keys if ok(k)][:D['max_parts_per_cut']]
        weak = [k for k in keys if k in anc and not ok(k)]
        if weak and not found:
            rep.append(f'컷 {ci + 1} 사진 {n}({label}): {"·".join(weak)} 찾았지만 자신 없음/이미 근접 → 약한 밀기')
        if not found:
            # 약한 밀기: 이미 6% 넘게 움직이면 그대로, 아니면 가운데로 push_z
            if not weak and not isinstance(kb, list) and (abs(kb[3] - kb[2]) >= .06 or abs(kb[1] - kb[0]) >= .06):
                rep.append(f'컷 {ci + 1} 사진 {n}({label}): 기존 켄번스 유지(부위 없음/못 찾음)')
                continue
            bx = anc[weak[0]]['box'] if weak else [.5, .5, .5, .5]
            px, py = .5 + ((bx[0] + bx[2]) / 2 - .5) * .5, .5 + ((bx[1] + bx[3]) / 2 - .5) * .5
            out[ci] = [(0, .5, 1.0, .5), (1, px, S['push_z'], py)]
            rep.append(f'컷 {ci + 1} 사진 {n}({label}): 약한 밀기 1.0→{S["push_z"]}')
            continue
        keys_t, t_prev = [], 0.0
        x0, y0 = .5, .5
        last = None
        for j, k in enumerate(found):
            box = list(anc[k]['box'])
            for p in ptrs:   # 손가락 표적이 이 컷·이 부위 근처면 화면 안에 남게 상자를 넓힘
                if 'u' in p and a <= p['w'] <= b:
                    box = [min(box[0], p['u'] - .05), min(box[1], p['v'] - .05), max(box[2], p['u'] + .05), max(box[3], p['v'] + .05)]
            big = not P[k]['small']
            z = _zoom_for(box, fade, img_wh, W, H, big)
            cx, cy = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
            if z < 1.05:   # 이미 화면을 채운 부위: 약한 밀기로
                z = S['push_z']
            if big:
                z = max(min(z, S['big_part_max_z']), S['push_z'])
            wi = said.get(k)
            arr = Tm['arrive_s'] / dur
            if wi is not None:
                ud = (onset(wi) - Tm['lead_s'] - s0) / dur
            else:
                ud = (Tm['arrive_u'] if j == 0 else (t_prev + 1) / 2) - arr
            ud = min(max(ud, t_prev + 0.02, 0.05 if j == 0 else 0), 0.97 - arr)
            ua = ud + arr
            if j == 0:
                x0, y0 = .5 + (cx - .5) * Tm['start_bias'], .5 + (cy - .5) * Tm['start_bias']
                keys_t.append((0.0, x0, 1.0, y0))
                keys_t.append((ud, x0, 1.0 + (z - 1) * 0.04, y0))
            else:
                keys_t.append((ud,) + last)
            keys_t.append((ua, cx, z, cy))
            last = (cx, z, cy)
            t_prev = ua
            rep.append(f'컷 {ci + 1} 사진 {n}({label}): {k} 당기기 z {z:.2f} · 도착 {s0 + ua * dur:.2f}초' + (f' 「{words[wi][2]}」' if wi is not None else ' (낱말 없음)'))
        keys_t.append((1.0, last[0], last[1] * (1 + Tm['hold_drift']), last[2]))
        out[ci] = keys_t
    return out, rep
