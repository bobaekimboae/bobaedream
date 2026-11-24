#!/usr/bin/env python3
"""벨기에판(bobae_be) 규칙 검사기 — 기준은 be_locked_rules.json 하나.

쓰는 법
  python3 check_be.py --code                 # 렌더 코드 값이 규칙 파일과 같은지(sag_reel_v1.py EDIT_PRESETS · 영상판 video_listing/g350_*)
  python3 check_be.py VIDEO.mp4              # 완성 영상 검사(같은 이름 .plan.json 이 있으면 함께)
하나라도 어긋나면 끝 코드 1. 통과 전에는 영상을 전달하지 않는다.
"""
import ast, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
RULES = json.load(open(os.path.join(HERE, 'be_locked_rules.json')))
hx = lambda h: tuple(int(h[k:k + 2], 16) for k in (1, 3, 5))
YEL = hx(RULES['color']['yellow'])
FAIL = []


def bad(msg):
    FAIL.append(msg); print('  ✗', msg)


def ok(msg):
    print('  ✓', msg)


def check_code():
    print('[코드 값 ↔ 규칙 파일]')
    src = open(os.path.join(HERE, 'sag_reel_v1.py'), encoding='utf-8').read()
    tree = ast.parse(src)
    preset = None
    for node in tree.body:
        if isinstance(node, ast.Assign) and any(getattr(t, 'id', '') == 'EDIT_PRESETS' for t in node.targets):
            for k, v in zip(node.value.keys, node.value.values):
                if getattr(k, 'value', '') == 'bobae_be':
                    preset = {kw.arg: ast.literal_eval(kw.value) for kw in v.keywords}
    if not preset:
        bad('sag_reel_v1.py 에서 bobae_be 를 찾지 못함'); return
    C, CH = RULES['caption'], RULES['chip']
    pairs = [('cap_kw_col', tuple(preset.get('cap_kw_col', ())), YEL, '말 자막 강조 노랑'),
             ('stk_bg', tuple(preset.get('stk_bg', ())), YEL, '칩 칠 노랑'),
             ('cap_cy', preset.get('cap_cy'), C['center_y_px'], '자막 가운데 높이'),
             ('chip_delay', preset.get('chip_delay'), CH['delay_after_phrase_s'], '칩 등장(구절 시작 뒤)'),
             ('tilt_fixed', preset.get('tilt_fixed'), -CH['tilt_ccw_deg'], '칩 기울기'),
             ('cap_cut_gap', preset.get('cap_cut_gap'), C['cut_gap_s'], '컷 뒤 자막 비움'),
             ('numchip_hides_cap', preset.get('numchip_hides_cap'), C['hide_while_number_chip'], '숫자 칩 동안 자막 숨김')]
    for key, got, want, name in pairs:
        (ok if got == want else bad)(f'{name}: {key}={got} (규칙 {want})')
    check_code_video()


def check_code_video():
    """영상판 렌더러가 숫자를 직접 쓰지 않고 규칙 파일을 읽는지(2026-11-22 추가)."""
    print('[영상판 렌더러 ↔ 규칙 파일]')
    vl = os.path.join(HERE, 'video_listing')
    lib = open(os.path.join(vl, 'g350_v5_lib.py'), encoding='utf-8').read()
    ren = open(os.path.join(vl, 'g350_v8_render.py'), encoding='utf-8').read()
    must = [(lib, "R['chip']['tilt_ccw_deg']", '칩 기울기를 규칙에서 읽음'), (lib, "R['chip']['fill_fit']", '칩 칠 맞춤을 규칙에서 읽음'),
            (lib, "R['chip']['y_top_px_feature_video']", '위쪽 칩 줄을 규칙에서 읽음'),
            (ren, "R['caption']['center_y_px']", '자막 높이를 규칙에서 읽음'), (ren, "R['caption']['font_px']", '자막 크기를 규칙에서 읽음'),
            (ren, "R['sfx']", '효과음 규칙을 읽음'), (ren, "R['audio']", '음량을 규칙에서 읽음'), (ren, "metaphor_sfx", '비유 효과음 규칙을 읽음'),
            (ren, "g350_edit.json", '뜻 단위 자막 덩어리 입력 파일'),
            (lib, "R['chip']['title_plate']", '첫 컷 브랜드 칩 판·여백을 규칙에서 읽음'), (ren, "title=True", '첫 컷 브랜드 칩만 칠 기울임')]
    pho = open(os.path.join(HERE, 'photo_listing', 'common.py'), encoding='utf-8').read()
    one = open(os.path.join(vl, 'listing_video_render.py'), encoding='utf-8').read()
    must += [(pho, "_BE['chip']['tilt_jitter_deg']", '사진판 칩 흔들림을 규칙에서 읽음'),
             (one, "R['caption']['center_y_px']", '단일 영상 렌더러: 자막 높이 규칙'), (one, "R['sfx']", '단일 영상 렌더러: 효과음 규칙'),
             (one, "R['audio']", '단일 영상 렌더러: 음량 규칙'), (one, 'edition_lock.json', '단일 영상 렌더러: 판 잠금 파일')]
    for pat, name in [(r'\(-0\.8,\s*0\.6,\s*0\.0\)', '사진판 칩 흔들림 숫자 직접 씀'), (r"'(HOOK|DEALER_CHIP)_TILT',\s*-\d", '사진판 칩 기울기 숫자 직접 씀')]:
        hit = re.search(pat, pho)
        (bad if hit else ok)(f'{name} 없음' if not hit else f'{name}: {hit.group(0)}')
    for src, pat, name in must:
        (ok if pat in src else bad)(f'{name} ({pat})')
    banned = [(r'CAPY\s*=\s*int\(H', '자막 높이를 화면 비율로 직접 씀'), (r'loudnorm=I=-?\d', '음량 숫자를 직접 씀'),
              (r'len\(cur\)\s*>=\s*\d', '자막을 어절 수로 기계 분할'), (r'rotate\(\s*-?\d', '칩 기울기 숫자를 직접 씀')]
    for pat, name in banned:
        hit = re.search(pat, lib + ren)
        (bad if hit else ok)(f'{name} 없음' if not hit else f'{name}: {hit.group(0)}')


def loudness(path):
    r = subprocess.run(['ffmpeg', '-v', 'info', '-i', path, '-af', 'ebur128=framelog=quiet', '-f', 'null', '-'],
                       capture_output=True, text=True)
    m = re.findall(r'I:\s+(-?\d+\.\d) LUFS', r.stderr)
    return float(m[-1]) if m else None


def frame(path, t):
    import numpy as np
    r = subprocess.run(['ffmpeg', '-v', '0', '-ss', f'{t:.3f}', '-i', path, '-frames:v', '1', '-f', 'rawvideo',
                        '-pix_fmt', 'rgb24', '-'], capture_output=True)
    return np.frombuffer(r.stdout, np.uint8).reshape(1920, 1080, 3) if len(r.stdout) == 1920 * 1080 * 3 else None


def yellow_mask(img, tol=40):
    import numpy as np
    d = np.abs(img.astype(int) - np.array(YEL)).sum(2)
    return d < tol


def check_video(path):
    import numpy as np
    print(f'[영상] {os.path.basename(path)}')
    A = RULES['audio']
    L = loudness(path)
    (ok if L is not None and abs(L - A['loudness_lufs']) <= A['loudness_tol'] else bad)(f'음량 {L} LUFS (규칙 {A["loudness_lufs"]}±{A["loudness_tol"]})')
    plan_p = path + '.plan.json'
    if not os.path.exists(plan_p):
        bad('계획 파일(.plan.json) 없음 — 칩·효과음 검사를 못 함'); return
    P = json.load(open(plan_p))
    if 'caption_gaps' in P:   # 2026-11-25 렌더 후 점검(check_render)이 경고만 하던 「말하는데 자막 없음」을 여기서 실패로 셈
        cg = P['caption_gaps']
        (ok if not cg else bad)('말하는 동안 자막 빈 곳 없음' if not cg else f'말하는데 자막 없음 {len(cg)}곳: ' + ', '.join(f'{a}~{b}초' for a, b in cg))
    S, CH, C = RULES['sfx'], RULES['chip'], RULES['caption']
    fv = P.get('edition') == 'feature_video'
    SF = [x if isinstance(x, dict) else {'t': x, 'sound': '?'} for x in P['sfx']]
    T = sorted(x['t'] for x in SF); total = P.get('total') or (T[-1] if T else 30)
    lim = int(S['max_per_30s'] * total / 30)
    ph = P.get('edition_code') == 'ED-PHOTO'   # 사진판: 효과음 많게(사용자 확정 예외) → 개수 상한은 보지 않음
    if ph: ok(f'효과음 {len(T)}번 (사진판 예외 — 개수 상한 안 봄)')
    else: (ok if len(T) <= lim else bad)(f'효과음 {len(T)}번 (규칙 30초당 {S["max_per_30s"]}번 → 최대 {lim}번)')
    gaps = [b - a for a, b in zip(T, T[1:])]
    (ok if all(g >= S['min_gap_s'] - 1e-6 for g in gaps) else bad)(f'효과음 간격 최소 {min(gaps) if gaps else "-":.2f}초 (규칙 {S["min_gap_s"]}초 이상)' if gaps else '효과음 간격 -')
    same = [(a['sound'], b['t'] - a['t']) for i, a in enumerate(sorted(SF, key=lambda x: x['t'])) for b in sorted(SF, key=lambda x: x['t'])[i + 1:] if a['sound'] == b['sound'] != '?']
    (ok if all(d >= S['same_sound_min_gap_s'] - 1e-6 for _, d in same) else bad)(f'같은 소리 간격 최소 {min(d for _, d in same):.2f}초 (규칙 {S["same_sound_min_gap_s"]}초 이상)' if same else '같은 소리 반복 없음')
    kinds = sorted({x['sound'] for x in SF}); ok(f'효과음 종류 {kinds}')
    tail = [t for t in T if t > total - RULES['end']['tail_s']]
    (bad if tail and not S['end_logo'] else ok)(f'끝 로고 구간 효과음 {len(tail)}번 (규칙: 넣지 않음)')
    want_px = lambda c: CH['title_font_px'] if c.get('kind') == 'title' else CH['font_px']
    badpx = [c['label'] for c in P['chips'] if 'px' in c and c['px'] != want_px(c)]
    (ok if not badpx else bad)(f'칩 글자 크기 규칙대로(칩 {CH["font_px"]} · 제목 {CH["title_font_px"]})' if not badpx else f'칩 글자 크기 어긋남: {badpx}')
    fixed = [c for c in P['chips'] if c.get('kind', 'point') in ('point', 'title')]
    ywant = CH['y_top_px_feature_video'] if fv else CH['y_top_px']; ys = {c['y'] for c in fixed if 'y' in c}
    (ok if ys <= {ywant} else bad)(f'위쪽 칩 자리 {sorted(ys)} (규칙 위 {ywant}px 하나, 부위 이름표는 부위를 따라감)')
    for c in P['chips']:
        cut_in = [t for t in P['cuts'] if c['t0'] + 0.02 < t < c['t1'] - 0.02]
        if cut_in: bad(f'칩이 컷을 넘어감: {c["label"]} {c["t0"]:.2f}~{c["t1"]:.2f}')
        if not fv and c['t1'] - c['t0'] > CH['hold_s'] + 0.05: bad(f'칩 유지 {c["t1"] - c["t0"]:.2f}초 > 규칙 {CH["hold_s"]}초')
    # 화면 실측: 칩마다 노랑 칠의 윗선·높이·색, 자막 띠에 칠 없음
    tops, hs, cols = [], [], []; CAPPAINT = []
    cy = C['center_y_px']
    for c in P['chips']:
        t = c['t_box'] if 't_box' in c else (c['t0'] + c['t1']) / 2   # 렌더러가 상자를 기록한 순간(부위 이름표는 부위를 따라 움직이므로)
        img = frame(path, t)
        if img is None: bad(f'{t:.2f}초 화면을 못 읽음'); continue
        if c.get('box'):   # 칩 상자 안만 잼(화살표·큰 숫자의 노랑은 빼고)
            x0, y0, x1, y1 = c['box']; reg = img[max(0, y0):y1, max(0, x0):x1]; band = yellow_mask(reg)
            rows = np.where(band.sum(1) > 10)[0]
            if len(rows) == 0: bad(f'{t:.2f}초 칩 노랑이 안 보임 ({c["label"]})'); continue
            if c.get('kind', 'point') in ('point',): tops.append(y0 + rows.min())
            if c.get('kind') != 'title': hs.append(rows.max() - rows.min())
            else:   # 첫 컷 브랜드 칩: 칠 윗선·아랫선 직선 맞춤 기울기(벨기에 원본과 같은 재는 법, 규칙 title_plate_edge_deg_check)
                cols_ = np.where(band.sum(0) > 3)[0]; X_, tp_, bt_ = [], [], []
                if len(cols_) > 20:
                    a_, b_ = cols_.min(), cols_.max(); w_ = b_ - a_
                    for x_ in range(int(a_ + 0.2 * w_), int(b_ - 0.2 * w_)):
                        r_ = np.where(band[:, x_])[0]
                        if len(r_) >= 5: X_.append(x_); tp_.append(r_.min()); bt_.append(r_.max())
                if len(X_) > 10:
                    ang = float(np.degrees(-np.arctan((np.polyfit(X_, tp_, 1)[0] + np.polyfit(X_, bt_, 1)[0]) / 2)))
                    want, tol = CH['title_plate_edge_deg_check']
                    (ok if abs(ang - want) <= tol else bad)(f'첫 컷 브랜드 칩 칠 기울기 실측 {ang:.1f}° (벨기에 원본 {want}° ±{tol}°, 판 {CH["title_plate"]["shape"]})')
                else: bad('첫 컷 브랜드 칩 칠을 못 잼')
            cols.append(reg[band].mean(0))
        else:
            band = yellow_mask(img[:cy - 120])
            rows = np.where(band.sum(1) > 40)[0]
            if len(rows) == 0: bad(f'{t:.2f}초 칩 노랑이 안 보임'); continue
            tops.append(rows.min()); hs.append(rows.max() - rows.min())
            cols.append(img[:cy - 120][band].mean(0))
        cap = yellow_mask(img[cy - 60:cy + 120])
        if cap.sum() > 6000:   # 말하는 낱말 노랑 글자는 획이라 성김, 칠은 꽉 참 → 노랑 덩어리의 채움 비율로 가림
            ys_, xs_ = np.where(cap); dens = cap.sum() / ((ys_.max() - ys_.min() + 1) * (xs_.max() - xs_.min() + 1))
            if dens > 0.55: CAPPAINT.append(t); bad(f'{t:.2f}초 자막 띠에 노랑 칠(면적 {int(cap.sum())}px · 채움 {dens:.2f}) — 자막 칠 금지')
    if not CAPPAINT: ok('자막 띠에 노랑 칠 없음(칩마다 실측)')
    if tops: (ok if max(tops) - min(tops) <= 24 else bad)(f'위쪽 칩 윗선 {min(tops)}~{max(tops)}px (흔들림 24px 이내)')
    if hs: (ok if max(hs) <= min(hs) * 1.35 + 6 else bad)(f'칩 칠 높이 {min(hs)}~{max(hs)}px (모두 같은 크기)')
    if cols:
        mc = np.array(cols).mean(0)
        (ok if np.abs(mc - np.array(YEL)).sum() < 45 else bad)(f'칩 노랑 실측 {tuple(int(x) for x in mc)} (규칙 {RULES["color"]["yellow"]})')
    if fv: check_chip_mapping(path, P); check_label_anchor(P)


# ── 옵션 칩 매핑·위치 검사 (2026-11-24 r13 재발 방지, 매뉴얼 v4 §10) ──
PART_WORDS = ('헤드램프', '테일램프', '램프', '패들', '시프트', '계기판', '디스플레이', '화면', '셀렉터', '기어', '머플러',
              '다이얼', '마네티노', '콕핏', '휠', '시트', '핸들', '스티어링', '트렁크', '루프', '소프트탑', '엔진', '브레이크', '캘리퍼')
_norm = lambda s: re.sub(r'[^0-9A-Za-z가-힣.]', '', s)


def _words_for(path, P):
    for a in sys.argv[1:]:
        if a.startswith('--words='): return json.load(open(a.split('=', 1)[1]))
    cand = [P.get('words')] + [os.path.join(os.path.dirname(path), n) for n in
            ((os.path.splitext(P.get('voice') or 'voice')[0] + '_words.json'), 'words.json')]
    for c in cand:
        if c and os.path.exists(c): return json.load(open(c))
    return None


def check_chip_mapping(path, P):
    """칩 글자 = 말한 낱말 · 칩은 그 낱말 시작 근처에 뜸 · 부위 낱말은 화살표 이름표 · 포인트 칩은 가운데."""
    CH = RULES['chip']; W = (P.get('frame') or [1080, 1920])[0]
    lead = CH.get('appear_before_word_s', 0.06); tol = 0.3
    words = _words_for(path, P)
    W_ = [(_norm(w[0] if isinstance(w, (list, tuple)) else w['word']), float(w[1] if isinstance(w, (list, tuple)) else w['start'])) for w in words] if words else None
    n_spoken = n_part = 0
    if W_ is None: bad('낱말 시각 파일 없음 — 칩 글자·시각을 말과 대조 못 함(plan.json에 words 경로를 남기거나 --words=)')
    for c in P['chips']:
        k = c.get('kind', 'point'); lab = c['label']
        if k in ('title', 'end', 'dealer', 'logo'): continue
        toks = [_norm(t) for t in lab.split() if _norm(t)]
        if W_ is not None and toks:
            near = [(w, t) for w, t in W_ if abs(t - c['t0']) < 4]
            hit = lambda tk: [t for w, t in near if w.startswith(tk[:max(2, min(len(tk), 3))]) or tk.startswith(w[:3] if len(w) >= 3 else '~')]
            first = hit(toks[0]); n_ok = sum(1 for tk in toks if hit(tk))
            if not first or n_ok < (len(toks) + 1) // 2:
                bad(f'칩 글자가 말한 낱말이 아님: 「{lab}」 {c["t0"]:.2f}초 (규칙 text_is_spoken_word)'); n_spoken += 1
            else:
                # 칩 글자의 낱말 중 가장 먼저 말한 낱말 기준(「헤드램프는 풀 LED」처럼 어순이 칩과 다를 수 있음)
                ws = min(min(hit(tk), key=lambda t: abs(t - c['t0'])) for tk in toks if hit(tk)); d = c['t0'] - ws
                (ok if -lead - tol <= d <= tol else bad)(f'칩 등장 시각 「{lab}」 {d:+.2f}초 (낱말 {ws:.2f}초 기준, 규칙 {-lead:.2f}초 ±{tol}초)')
        is_part = any(pw in lab for pw in PART_WORDS)
        if is_part and k == 'point' and not c.get('no_track_reason'):
            n_part += 1; bad(f'부위 낱말 칩이 화살표 없이 위쪽에 고정됨: 「{lab}」 (부위를 찾아 callout으로, 화면 가득·못 찾음이면 no_track_reason 기록)')
        if k == 'point' and c.get('box'):
            x0, _, x1, _ = c['box']; off = (x0 + x1) / 2 - W / 2
            (ok if abs(off) <= 40 else bad)(f'포인트 칩 가운데 정렬 「{lab}」 중심 {off:+.0f}px (규칙 align center, ±40px)')
    if W_ is not None and not n_spoken: ok('칩 글자가 모두 말한 낱말')
    if not n_part: ok('부위 낱말 칩은 화살표 이름표이거나 위쪽 이유(no_track_reason) 기록')


def check_label_anchor(P):
    """매뉴얼 v4.2 §11: 부위의 숫자·재질·색 글자는 그 부위 옆(또는 위)에 붙는다. 화면 위 띠에 고정 금지."""
    H = (P.get('frame') or [1080, 1920])[1]
    for L in P.get('labels', []):
        lab, k, pt, b = L['label'], L['kind'], L.get('pt'), L['box']
        if pt is None:
            (ok if L.get('no_anchor_reason') else bad)(f'부위 글자 「{lab}」 기준 부위를 못 찾음' + (f' — 이유 {L["no_anchor_reason"]}' if L.get('no_anchor_reason') else ' (추적 필요, 화면 고정 금지)'))
            continue
        dx = max(b[0] - pt[0], 0, pt[0] - b[2]); dy = max(b[1] - pt[1], 0, pt[1] - b[3]); d = (dx * dx + dy * dy) ** .5
        lim = 0.20 * H
        (ok if d <= lim else bad)(f'부위 글자 「{lab}」 ↔ 부위 점 거리 {d:.0f}px (§11 규칙 {lim:.0f}px 이내)')
        if k in ('num_part', 'color'):
            cover = b[0] <= pt[0] <= b[2] and b[1] <= pt[1] <= b[3]
            (bad if cover else ok)(f'부위 글자 「{lab}」가 부위 점을 ' + ('덮음(옆에 붙여야 함)' if cover else '덮지 않음'))


if __name__ == '__main__':
    args = sys.argv[1:]
    if not args or '--code' in args: check_code()
    for a in args:
        if a.endswith('.mp4'): check_video(a)
    print('통과' if not FAIL else f'실패 {len(FAIL)}건')
    sys.exit(1 if FAIL else 0)
