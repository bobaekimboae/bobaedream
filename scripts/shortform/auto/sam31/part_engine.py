"""부위 찾기 엔진 — SAM 3.1(기본) · OWLv2+VitTrack(예비) (2026-11-25, 시안 마스터).

왜: claude/sam31-eval 30컷 평가에서 맞은 장면이 기존 OWLv2+VitTrack 58% → SAM 3.1 글자 84% → 글자+첫 장면 상자 97%,
    부위 찾기 시간은 약 5배 줄었다. 기존 방식의 문제는 상자를 못 띄우는 게 아니라 엉뚱한 물체(번호판·에어백·반대쪽 헤드라이트)에 띄우는 것.

엔진 고르기: 환경변수 BBM_PART_ENGINE=sam|owl (기본 sam). 키(MODEL_API_KEY)가 없거나 SAM 호출이 실패한 부위만 예비(owl 콜백)로 넘긴다.

쓰는 법
    import part_engine as PE
    res, cost = PE.find_parts(src_mp4, jobs, work_dir, owl=내_예비_함수)
    jobs = [{'key': 'c3', 's0': 6.3, 's1': 8.4, 'part': 'm_caliper'(키·한국어·영어 아무거나),
             'hint': {'t': 7.0, 'box': [x1, y1, x2, y2]}  # 선택. 0~1 비율 좌표, 원본 시각 t
            }, ...]
    res['c3'] = {'s0','s1','pts': [(fx, fy) 또는 None] × 30fps, 'box': [...], 'by': 'sam31-text'|'sam31-text+box'|'sam31-box'|'owlv2'|'none',
                 'part', 'prompt', 'frames_sent', 'usd', 'seconds'}
    cost = {'engine','frames_sent','usd','cap_usd','stopped_at_cap','requests','fallback': [...키]}

규칙(지시서 v1)
- 1순위 글자 프롬프트(part_prompts.json 공용 표). 2순위 상자 프롬프트는 글자 결과가 비었거나 hint 상자와 다른 물체를 잡은 부위만.
  상자는 @meta-sam/parser buildObjectPrompt와 같은 글자(상자 1개 + 가운데 점 1개). 상자가 첫 프레임이 아니면 propagation_direction=both.
- 합치기: 글자 결과가 기본, 글자가 놓친 프레임만 상자 결과로 채운다. 글자가 hint와 다른 물체를 잡았으면 그 글자 결과는 버린다.
- 안 보이는 프레임·신뢰도 0.4 미만 프레임은 None(화면에서 칩·화살표·3D 숫자 숨김). 물체 번호는 가장 많이 나온 하나만.
- 마스크는 쓰지 않는다(상자 가운데만).
- 부위 컷 구간만 잘라 보낸다. 2초 미만 조각은 같은 프롬프트끼리 이어 붙여 한 번에 보낸다(최소 청구 50프레임).
- 영상 1편 상한 cap_usd(기본 $0.30). 넘을 요청은 보내지 않고 예비로 넘긴다. 같은 요청을 자동으로 재시도하지 않는다(같은 조각·같은 프롬프트는 캐시).
- 키는 환경변수로만 읽는다. 키 값을 파일·로그에 쓰지 않는다.
"""
import hashlib
import json
import math
import os
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..'))

W, H, FPS = 540, 960, 30
PRICE = 0.20 / 1000          # 달러/프레임
MIN_BILL = 50                # 요청당 최소 청구 프레임
SHORT_S = 2.0                # 이보다 짧은 조각은 같은 프롬프트끼리 묶음
CONF = 0.4
CAP_USD = float(os.environ.get('BBM_SAM_CAP_USD', '0.30'))
TABLE = json.load(open(os.path.join(HERE, '..', 'part_prompts.json'), encoding='utf-8'))


def engine():
    e = os.environ.get('BBM_PART_ENGINE', 'sam').strip().lower()
    return e if e in ('sam', 'owl') else 'sam'


def _entry(part):
    p = (part or '').strip().lower()
    for e in TABLE['parts']:
        if p == e['en'].lower() or p == e['ko'].lower() or p in [k.lower() for k in e['keys']]:
            return e
    return None


def prompt_for(part):
    e = _entry(part)
    return e['en'] if e else part


def chip_label(part, label):
    """이름이 애매한 부위는 칩을 빼거나(None) 바꾼다."""
    e = _entry(part)
    if not e or e.get('chip', True):
        return label
    return e.get('chip_ko')


def build_object_prompt(frame, box_px, point_px=None):
    """@meta-sam/parser 0.1.0 buildObjectPrompt({size:540x960, objects:[{id:0, prompts:[{frame, box, points:[가운데]}]}]})와 같은 글자.
    box_px = [left, top, right, bottom](540x960, right·bottom은 끝 칸 다음 — parser처럼 1을 뺀다)."""
    jr = lambda v: int(math.floor(v + 0.5))   # JS Math.round과 같게(파이썬 round는 .5를 짝수로)
    l, t, r, b = [jr(v) for v in box_px]
    px, py = point_px or (jr((l + r) / 2), jr((t + b) / 2))
    return (f'<{frame}f>0<|box;x1={l};y1={t};x2={r - 1};y2={b - 1};w={W};h={H}|>'
            f'<|point;x={px};y={py};w={W};h={H}|>')


def _cut(src, s0, s1, out):
    if not os.path.exists(out):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{s0:.3f}', '-i', src, '-t', f'{s1 - s0 + 1 / FPS:.3f}', '-an',
                        '-vf', f'scale={W}:{H},fps={FPS}', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
                        '-pix_fmt', 'yuv420p', out], check=True)
    return out


def _concat(parts, out):
    if not os.path.exists(out):
        lst = out + '.txt'
        open(lst, 'w').write(''.join(f"file '{os.path.abspath(p)}'\n" for p in parts))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', out], check=True)
    return out


def _nframes(p):
    o = subprocess.check_output(['ffprobe', '-v', 'error', '-count_frames', '-select_streams', 'v', '-show_entries',
                                 'stream=nb_read_frames', '-of', 'csv=p=0', p]).strip()
    return int(o)


def _call(clip, prompt, cache, direction=None):
    import sam31_api
    k = hashlib.sha256(open(clip, 'rb').read() + prompt.encode() + str(direction).encode()).hexdigest()[:20]
    p = os.path.join(cache, k + '.json')
    if os.path.exists(p):
        r = json.load(open(p)); r['cached'] = True; return r
    r = sam31_api.segment(clip, prompt, conf=True, direction=direction)
    json.dump(r, open(p, 'w'))
    return r


def _boxes(r, lo, hi):
    """프레임 lo..hi-1 안에서 가장 많이 나온 물체 번호 하나의 상자(0~1). 신뢰도 0.4 미만은 None."""
    cnt = {}
    for k, objs in r.get('frames', {}).items():
        if lo <= int(k) < hi:
            for o in objs:
                if o.get('c', 1) >= CONF:
                    cnt[o['id']] = cnt.get(o['id'], 0) + 1
    out = [None] * (hi - lo)
    if not cnt:
        return out
    oid = max(cnt, key=cnt.get)
    for k, objs in r['frames'].items():
        i = int(k)
        if lo <= i < hi:
            for o in objs:
                if o['id'] == oid and o.get('c', 1) >= CONF:
                    x1, y1, x2, y2 = o['box']
                    out[i - lo] = [x1 / W, y1 / H, x2 / W, y2 / H]
    return out


def _iou(a, b):
    ix = max(0, min(a[2], b[2]) - max(a[0], b[0])); iy = max(0, min(a[3], b[3]) - max(a[1], b[1]))
    u = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - ix * iy
    return ix * iy / u if u > 0 else 0


def _wrong_object(boxes, hint_i, hint_box):
    """글자 결과가 hint 상자와 다른 물체를 잡았나: hint 프레임(없으면 가장 가까운 잡힌 프레임)의 상자가 hint와 안 겹치고 가운데도 밖."""
    seen = [i for i, b in enumerate(boxes) if b]
    if not seen:
        return False
    j = min(seen, key=lambda i: abs(i - hint_i)); b = boxes[j]
    cx, cy = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2
    inside = hint_box[0] <= cx <= hint_box[2] and hint_box[1] <= cy <= hint_box[3]
    return _iou(b, hint_box) < 0.1 and not inside


def fill_nearest(pts):
    """None 칸을 가장 가까운 정상 점으로 채운 복사본(렌더러 평활용). 화면에서 숨길지는 None 여부로 따로 판단."""
    ok = [i for i, p in enumerate(pts) if p is not None]
    if not ok:
        return None
    return [pts[i] if pts[i] is not None else pts[min(ok, key=lambda j: abs(j - i))] for i in range(len(pts))]


def find_parts(src, jobs, work_dir, owl=None, cap_usd=None, max_workers=4, log=print):
    cap_usd = CAP_USD if cap_usd is None else cap_usd
    eng = engine()
    out, fallback = {}, []
    cost = {'engine': eng, 'frames_sent': 0, 'usd': 0.0, 'cap_usd': cap_usd, 'stopped_at_cap': False, 'requests': 0,
            'fallback': fallback, 'by': {}}
    key_ok = bool(os.environ.get('MODEL_API_KEY', '').strip())
    if eng == 'owl' or not key_ok:
        log(f"  [부위 찾기] {'BBM_PART_ENGINE=owl' if eng == 'owl' else 'MODEL_API_KEY 없음'} → OWLv2 예비")
        for j in jobs:
            out[j['key']] = _owl(owl, j, log); fallback.append(j['key'])
        cost['by'] = {k: v['by'] for k, v in out.items()}
        return out, cost

    clips_d = os.path.join(work_dir, 'sam_clips'); cache = os.path.join(work_dir, 'sam_cache')
    os.makedirs(clips_d, exist_ok=True); os.makedirs(cache, exist_ok=True)
    t_all = time.time()
    J = []
    for j in jobs:
        j = dict(j); j['prompt'] = prompt_for(j['part']); j['n'] = int(round((j['s1'] - j['s0']) * FPS)) + 1
        j['clip'] = _cut(src, j['s0'], j['s1'], os.path.join(clips_d, f"{j['key']}_{j['s0']:.2f}_{j['s1']:.2f}.mp4"))
        j['nf'] = _nframes(j['clip'])
        J.append(j)

    # 글자 요청 묶음: 2초 미만 조각은 같은 프롬프트끼리 이어 붙인다
    groups, short = [], {}
    for j in J:
        if j['s1'] - j['s0'] < SHORT_S:
            short.setdefault(j['prompt'], []).append(j)
        else:
            groups.append([j])
    groups += list(short.values())

    plan, spent = [], 0.0
    for g in groups:
        frames = sum(x['nf'] for x in g)
        c = max(MIN_BILL, frames) * PRICE
        if spent + c > cap_usd + 1e-9:
            cost['stopped_at_cap'] = True
            log(f"  [SAM 3.1] 상한 ${cap_usd:.2f} → {','.join(x['key'] for x in g)} 예비로")
            continue
        spent += c
        if len(g) == 1:
            media = g[0]['clip']
        else:
            media = _concat([x['clip'] for x in g], os.path.join(clips_d, 'grp_' + '_'.join(x['key'] for x in g) + '.mp4'))
        plan.append((g, media, frames))

    def text_req(item):
        g, media, frames = item
        t0 = time.time()
        try:
            r = _call(media, g[0]['prompt'], cache)
            return g, r, frames, None, time.time() - t0
        except SystemExit as e:
            return g, None, frames, str(e), time.time() - t0

    text_res = {}
    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        for g, r, frames, err, sec in ex.map(text_req, plan):
            cost['requests'] += 1
            if not (r or {}).get('cached'):
                cost['frames_sent'] += max(MIN_BILL, frames); cost['usd'] += max(MIN_BILL, frames) * PRICE
            off = 0
            for x in g:
                text_res[x['key']] = {'boxes': _boxes(r, off, off + x['nf']) if r else None, 'err': err,
                                      'sec': round(sec, 2), 'frames': max(MIN_BILL, frames) if len(g) == 1 else x['nf']}
                off += x['nf']

    # 상자 요청: 글자가 비었거나 hint와 다른 물체를 잡은 부위만(hint가 있어야 함)
    box_jobs = []
    for x in J:
        tr = text_res.get(x['key'])
        if not tr or tr['boxes'] is None or not x.get('hint'):
            continue
        hb = x['hint']['box']; hi = min(x['nf'] - 1, max(0, int(round((x['hint']['t'] - x['s0']) * FPS))))
        empty = not any(tr['boxes'])
        wrong = (not empty) and _wrong_object(tr['boxes'], hi, hb)
        if empty or wrong:
            c = max(MIN_BILL, x['nf']) * PRICE
            if spent + c > cap_usd + 1e-9:
                cost['stopped_at_cap'] = True; log(f"  [SAM 3.1] 상한 → {x['key']} 상자 요청 생략"); continue
            spent += c
            box_jobs.append((x, hi, hb, wrong))

    def box_req(item):
        x, hi, hb, wrong = item
        p = build_object_prompt(hi, [hb[0] * W, hb[1] * H, hb[2] * W, hb[3] * H])
        try:
            r = _call(x['clip'], p, cache, direction='both' if hi > 0 else None)
            return x, r, wrong, None
        except SystemExit as e:
            return x, None, wrong, str(e)

    box_res = {}
    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        for x, r, wrong, err in ex.map(box_req, box_jobs):
            cost['requests'] += 1
            if r and not r.get('cached'):
                cost['frames_sent'] += max(MIN_BILL, x['nf']); cost['usd'] += max(MIN_BILL, x['nf']) * PRICE
            box_res[x['key']] = (_boxes(r, 0, x['nf']) if r else None, wrong, err)

    for x in J:
        tr = text_res.get(x['key'])
        if not tr or tr['boxes'] is None:
            if tr and tr['err']:
                log(f"  [SAM 3.1] {x['key']} 오류 → 예비: {tr['err'][:120]}")
            out[x['key']] = _owl(owl, x, log); fallback.append(x['key']); continue
        tb = list(tr['boxes']); by = 'sam31-text'
        if x['key'] in box_res and box_res[x['key']][0] is not None:
            bb, wrong, _ = box_res[x['key']]
            if wrong:
                tb, by = bb, 'sam31-box'          # 글자가 다른 물체를 잡음 → 그 글자 결과는 버림
            else:
                tb = [a if a else b for a, b in zip(tb, bb)]; by = 'sam31-text+box'
        if not any(tb):
            out[x['key']] = _owl(owl, x, log); fallback.append(x['key']); continue
        boxes = (tb + [None] * x['n'])[:x['n']]
        pts = [((b[0] + b[2]) / 2, (b[1] + b[3]) / 2) if b else None for b in boxes]
        pts = [(round(p[0], 4), round(p[1], 4)) if p else None for p in pts]
        out[x['key']] = {'s0': x['s0'], 's1': x['s1'], 'pts': pts, 'box': boxes, 'by': by, 'part': x['part'],
                         'prompt': x['prompt'], 'frames_sent': tr['frames'], 'seconds': tr['sec']}
        log(f"  [SAM 3.1] {x['key']} {x['prompt']} {by} 보임 {sum(p is not None for p in pts)}/{len(pts)}")
    cost['usd'] = round(cost['usd'], 4)
    cost['seconds'] = round(time.time() - t_all, 1)
    cost['by'] = {k: v['by'] for k, v in out.items()}
    log(f"  [SAM 3.1] 요청 {cost['requests']}개 · {cost['frames_sent']}프레임 · ${cost['usd']:.3f} · {cost['seconds']}초"
        + (f" · 예비 {','.join(fallback)}" if fallback else ''))
    return out, cost


def _owl(owl, j, log):
    if owl is None:
        return {'s0': j['s0'], 's1': j['s1'], 'pts': None, 'box': None, 'by': 'none', 'part': j['part']}
    try:
        r = owl(j)
    except Exception as e:  # 예비도 실패하면 부위 칩 없이(위쪽 고정 칩)
        log(f"  [OWLv2 예비] {j['key']} 실패: {e}")
        r = None
    if not r:
        return {'s0': j['s0'], 's1': j['s1'], 'pts': None, 'box': None, 'by': 'none', 'part': j['part']}
    r = dict(r); r.setdefault('by', 'owlv2'); return r
