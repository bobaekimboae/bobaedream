#!/usr/bin/env python3
"""즉흥 편집 방지 관문 — 판(에디션)·렌더러·편집 기법을 edition_lock.json 하나와 대조한다. 2026-11-22.

  python3 edit_gate.py pre ED-SIMPLE scripts/shortform/video_listing/listing_video_render.py   # 렌더 전: 이 판에 이 렌더러를 써도 되나
  python3 edit_gate.py post 영상.mp4 [--plates]                                              # 렌더 후: 판·렌더러·필수 기법·금지 기법 (+ 칩이 번호판을 덮는지)
  python3 edit_gate.py golden 영상.mp4 [기준영상.mp4]                                          # 기준 영상과 같은 역할 장면 나란히 시트
하나라도 어긋나면 끝 코드 1. post 통과 + check_be.py 통과 전에는 영상을 전달하지 않는다.
"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
LOCK = json.load(open(os.path.join(HERE, 'edition_lock.json'), encoding='utf-8'))
FAIL = []
bad = lambda m: (FAIL.append(m), print('  ✗', m))
ok = lambda m: print('  ✓', m)
norm = lambda p: p.replace('\\', '/').split('scripts/shortform/')[-1]


def pre(ed, renderer):
    print(f'[렌더 전] 판 {ed} · 렌더러 {renderer}')
    if ed not in LOCK['editions']:
        bad(f'판 {ed} 없음 (있는 판: {", ".join(LOCK["editions"])})'); return
    want = norm(LOCK['editions'][ed]['renderer'])
    if norm(renderer) in {norm(k) for k in LOCK['compare_only'] if not k.startswith('_')}:
        bad(f'{norm(renderer)}는 비교용(출고 금지) — {LOCK["compare_only"].get("scripts/shortform/" + norm(renderer), "")}')
    (ok if norm(renderer) == want else bad)(f'판 {ed}의 렌더러는 {want} (요청 {norm(renderer)})')


def post(video):
    print(f'[렌더 후] {os.path.basename(video)}')
    p = video + '.plan.json'
    if not os.path.exists(p):
        bad('계획 파일(.plan.json) 없음 — 어떤 판·기법으로 만들었는지 알 수 없음(출고 금지)'); return
    P = json.load(open(p, encoding='utf-8'))
    ed = P.get('edition_code')
    if not ed or ed not in LOCK['editions']:
        bad(f'판 코드 없음/모름: {ed!r} — 렌더러가 판을 적지 않음(옛 렌더러로 만든 영상일 수 있음)'); return
    E = LOCK['editions'][ed]
    (ok if norm(P.get('renderer', '')) == norm(E['renderer']).split('/')[-1] or norm(E['renderer']).endswith(P.get('renderer', '?')) else bad)(
        f'렌더러 {P.get("renderer")} (판 {ed}는 {norm(E["renderer"])})')
    if E.get('order') == 'source':
        (ok if P.get('order') == 'source' else bad)(f'원본 순서·원본 길이 ({P.get("order")})')
    T = set(P.get('techniques') or [])
    if not T:
        bad('쓴 기법 기록 없음'); return
    miss = [t for t in E['required'] if t not in T]
    (ok if not miss else bad)(f'필수 기법 {len(E["required"])}개' + (f' — 빠짐: {miss}' if miss else ''))
    chips = P.get('chips') or []
    if any(c.get('kind') in ('point', 'callout') for c in chips):
        (ok if T & {'point_chip', 'callout_chip'} else bad)('칩이 있으면 칩 기법 기록')
    if any(c.get('kind') == 'callout' for c in chips):
        (ok if 'callout_arrow' in T else bad)('부위 칩이면 화살표')
    cy = (P.get('caption') or {}).get('center_y_px')
    if cy:
        hit = [c['label'] for c in chips if c.get('box') and c['box'][3] > cy - 60]
        (ok if not hit else bad)('칩이 말 자막 띠와 겹치지 않음' + (f' — 겹침: {hit}' if hit else ''))
    if P.get('sfx'):
        (ok if 'sfx_rules' in T else bad)('효과음이 있으면 규칙 효과음')
    if '--plates' in sys.argv:
        plate_check(video, chips)
    forb = [t for t in E.get('forbidden', []) if t in T]
    (ok if not forb else bad)('금지 기법 없음' + (f' — 들어감: {forb}' if forb else ''))
    ok(f'쓴 기법: {", ".join(sorted(T))}')


def plate_check(video, chips):
    """칩 상자가 번호판을 덮는가 — 칩이 뜬 순간 화면에서 번호판(OWLv2 「plate」)을 찾아 겹치면 실패.
    번호판은 가리지 않는다(사용자 확정). 칩이 덮어도 안 된다. 칩 상자(box)가 기록된 칩만 본다."""
    sys.path.insert(0, os.path.join(HERE, 'photo_listing'))
    import cv2, part_anchor as PA
    from PIL import Image
    cap = cv2.VideoCapture(video); hit = []
    for c in chips:
        if not c.get('box') or 't_box' not in c: continue
        cap.set(cv2.CAP_PROP_POS_MSEC, c['t_box'] * 1000); okf, f = cap.read()
        if not okf: continue
        # 칩이 그려진 화면이 아니라 같은 순간의 원본에 가깝게 보려면 칩을 피한 판정이 필요 → 칩 상자 밖의 번호판만 셈하지 않고, 상자와 겹치는 번호판을 찾는다
        for sc, (x0, y0, x1, y1) in PA.detect(Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGR2RGB)), ['plate'], thr=0.2).get('plate', []):
            bx = c['box']
            if min(x1, bx[2]) > max(x0, bx[0]) and min(y1, bx[3]) > max(y0, bx[1]):
                hit.append(f"{c['label']}({c['t_box']:.1f}초)")
    (ok if not hit else bad)('칩이 번호판을 덮지 않음' + (f' — 겹침: {hit}' if hit else ''))


def golden(video, ref=None):
    """같은 역할 순간(첫 화면 · 칩 2개 · 큰 숫자 · 끝 화면)을 새 영상과 기준 영상에서 뽑아 위아래로 붙인 시트."""
    P = json.load(open(video + '.plan.json', encoding='utf-8'))
    def moments(P):
        ch = P.get('chips') or []
        t = [next((c['t_box'] for c in ch if c['kind'] == 'title'), 0.6)]
        t += [c['t_box'] + 0.3 for c in ch if c['kind'] != 'title'][:3]
        t += [P['total'] - 0.5]
        return t
    out = video + '.golden.jpg'
    rows = []
    for v, PP in [(video, P)] + ([(ref, json.load(open(ref + '.plan.json')))] if ref and os.path.exists(ref + '.plan.json') else []):
        files = []
        for k, t in enumerate(moments(PP)):
            f = f'{v}.g{k}.jpg'; subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(max(0, t)), '-i', v, '-frames:v', '1', '-vf', 'scale=270:-1', f], check=True); files.append(f)
        r = f'{v}.grow.jpg'; subprocess.run(['ffmpeg', '-v', 'error', '-y', *sum([['-i', f] for f in files], []), '-filter_complex', ''.join(f'[{i}:v]' for i in range(len(files))) + f'hstack={len(files)}', r], check=True)
        rows.append(r)
    if len(rows) > 1: subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', rows[0], '-i', rows[1], '-filter_complex', 'vstack=2', out], check=True)
    else: os.replace(rows[0], out)
    print(f'  기준 비교 시트: {out}' + ('' if len(rows) > 1 else ' (기준 영상 없음 — 새 영상만)'))


if __name__ == '__main__':
    a = sys.argv[1:]
    if not a: print(__doc__); sys.exit(2)
    if a[0] == 'pre': pre(a[1], a[2])
    elif a[0] == 'post': post(a[1])
    elif a[0] == 'golden': golden(a[1], a[2] if len(a) > 2 else None)
    if a[0] != 'golden': print('통과' if not FAIL else f'실패 {len(FAIL)}건')
    sys.exit(1 if FAIL else 0)
