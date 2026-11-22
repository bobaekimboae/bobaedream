#!/usr/bin/env python3
"""벨기에판(bobae_be) 규칙 검사기 — 기준은 be_locked_rules.json 하나.

쓰는 법
  python3 check_be.py --code                 # 렌더 코드 값이 규칙 파일과 같은지(sag_reel_v1.py EDIT_PRESETS)
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
    S, CH, C = RULES['sfx'], RULES['chip'], RULES['caption']
    lim = S['with_music_per_video'] if P.get('music') else S['without_music_per_video']
    (ok if len(P['sfx']) <= lim else bad)(f'효과음 {len(P["sfx"])}번 (규칙 최대 {lim}번)')
    gaps = [b - a for a, b in zip(P['sfx'], P['sfx'][1:])]
    (ok if all(g >= S['min_gap_s'] for g in gaps) else bad)(f'효과음 간격 최소 {min(gaps) if gaps else "-"}초 (규칙 {S["min_gap_s"]}초 이상)')
    pxs = {c['px'] for c in P['chips']}; ys = {c['y'] for c in P['chips']}
    (ok if pxs == {CH['font_px']} else bad)(f'칩 글자 크기 {sorted(pxs)} (규칙 {CH["font_px"]} 하나)')
    (ok if ys == {CH['y_top_px']} else bad)(f'칩 자리 {sorted(ys)} (규칙 위 {CH["y_top_px"]}px 하나)')
    for c in P['chips']:
        cut_in = [t for t in P['cuts'] if c['t0'] + 0.02 < t < c['t1'] - 0.02]
        if cut_in: bad(f'칩이 컷을 넘어감: {c["label"]} {c["t0"]:.2f}~{c["t1"]:.2f}')
        if c['t1'] - c['t0'] > CH['hold_s'] + 0.05: bad(f'칩 유지 {c["t1"] - c["t0"]:.2f}초 > 규칙 {CH["hold_s"]}초')
    # 화면 실측: 칩마다 노랑 칠의 윗선·높이·색, 자막 띠에 칠 없음
    tops, hs, cols = [], [], []
    cy = C['center_y_px']
    for c in P['chips']:
        t = (c['t0'] + c['t1']) / 2
        img = frame(path, t)
        if img is None: bad(f'{t:.2f}초 화면을 못 읽음'); continue
        band = yellow_mask(img[:cy - 120])
        rows = np.where(band.sum(1) > 40)[0]
        if len(rows) == 0: bad(f'{t:.2f}초 칩 노랑이 안 보임'); continue
        tops.append(rows.min()); hs.append(rows.max() - rows.min())
        cols.append(img[:cy - 120][band].mean(0))
        cap = yellow_mask(img[cy - 60:cy + 120])
        if cap.sum() > 6000: bad(f'{t:.2f}초 자막 띠에 노랑 칠(면적 {int(cap.sum())}px) — 자막 칠 금지')
    if tops:
        (ok if max(tops) - min(tops) <= 24 else bad)(f'칩 윗선 {min(tops)}~{max(tops)}px (흔들림 24px 이내)')
        (ok if max(hs) <= min(hs) * 1.35 + 6 else bad)(f'칩 높이 {min(hs)}~{max(hs)}px (모두 같은 크기)')
        mc = np.array(cols).mean(0)
        (ok if np.abs(mc - np.array(YEL)).sum() < 45 else bad)(f'칩 노랑 실측 {tuple(int(x) for x in mc)} (규칙 {RULES["color"]["yellow"]})')


if __name__ == '__main__':
    args = sys.argv[1:]
    if not args or '--code' in args: check_code()
    for a in args:
        if a.endswith('.mp4'): check_video(a)
    print('통과' if not FAIL else f'실패 {len(FAIL)}건')
    sys.exit(1 if FAIL else 0)
