"""SAM 3.1(Meta Model API) vs 기존 방식 — 30컷 평가와 비교 영상 (2026-11-25, 클로드코드).

순서
  1) clips    : 평가 세트(sam31_evalset.json)대로 원본에서 540x960·30fps 조각을 자른다.
  2) baseline : 기존 방식(OWLv2 0.33초마다 다시 찾기 + 사이 프레임 VitTrack, CPU)을 돌리고 시간을 잰다.
  3) run      : SAM 3.1 API(키는 환경변수 MODEL_API_KEY)로 같은 조각을 보낸다. 같은 요청을 재시도로 반복하지 않는다.
  4) score    : 두 방식의 찾은 프레임 비율 · 끊김 · 상자 튐 · 시간 · 비용을 표로 만든다.
  5) render   : 고른 컷을 위(기존) / 아래(SAM 3.1)로 나란히 놓은 1080x1920 비교 영상을 만든다.

예)
  python3 sam31_eval.py clips    --src m235=/path/src.mp4
  python3 sam31_eval.py baseline --only e2_center_cap,h4_m_button
  python3 sam31_eval.py run      --budget 1.0          # 달러 상한, 넘으면 멈춤
  python3 sam31_eval.py score
  python3 sam31_eval.py render   --only e2_center_cap,h4_m_button --out sam31_compare.mp4

결과 폴더: --work (기본 ./sam31_work) 아래 clips/ · base/ · sam/ · score.json
SAM 결과 파일(sam/<컷>.json)만 다른 환경에서 깃으로 넘겨받아도 score · render가 된다.
"""
import argparse
import json
import math
import os
import subprocess
import sys
import time

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SET = os.path.join(HERE, 'sam31_evalset.json')
FONT = os.path.join(HERE, '..', 'fonts', 'Pretendard-Bold.otf')
FONT_X = os.path.join(HERE, '..', 'fonts', 'Pretendard-ExtraBold.otf')
VIT = os.path.join(HERE, '..', 'models', 'vittrack_2023sep.onnx')
W, H, FPS = 540, 960, 30
PRICE = 0.20 / 1000          # 달러/프레임
MIN_BILL = 50                # 요청당 최소 과금 프레임
JUMP = 0.25                  # 0.33초 안에 화면 대각선의 25% 넘게 튀면 「튐」

KO = {  # 비교 영상 칩에 쓸 한국어 부위 이름(영어 프롬프트 짝)
    'BMW logo': 'BMW 엠블럼', 'wheel center cap logo': '휠 센터캡', 'M235i badge': 'M235i 배지',
    'car wheel': '휠', 'brake caliper': '브레이크 캘리퍼', 'tire': '타이어', 'headlight': '헤드라이트',
    'xDrive badge': 'xDrive 배지', 'ambient light strip': '앰비언트 라이트', 'red M button on steering wheel': 'M 버튼',
    'buttons next to gear shifter': '기어 옆 버튼', 'engine cover': '엔진 커버', 'tail light': '테일라이트',
    'side mirror': '사이드미러', 'head-up display': '헤드업 디스플레이', 'engine': '엔진룸', 'door sill plate': '도어 실 플레이트',
    'logo projected on the ground': '웰컴 라이트', 'infotainment screen': '중앙 화면', 'illuminated cup holder ring': '컵홀더 조명',
    'seat headrest': '시트', 'steering wheel buttons': '스티어링 버튼', 'climate control buttons': '공조 버튼',
    'rear view camera image on screen': '후방 카메라', 'digital instrument cluster': '계기판',
}


def load_set():
    return json.load(open(SET))


def pick(cuts, only):
    if not only:
        return cuts
    want = set(only.split(','))
    return [c for c in cuts if c['id'] in want]


def paths(work):
    d = {k: os.path.join(work, k) for k in ('clips', 'base', 'sam')}
    for v in d.values():
        os.makedirs(v, exist_ok=True)
    return d


def read_frames(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)


# ---------- 1) 조각 자르기 ----------
def cmd_clips(a):
    S = load_set()
    srcs = dict(s.split('=', 1) for s in (a.src or []))
    for k in S['source']:
        srcs.setdefault(k, os.environ.get(f'SAM_EVAL_SRC_{k.upper()}', ''))
    P = paths(a.work)
    for c in pick(S['cuts'], a.only):
        src = srcs.get(c['src'])
        if not src or not os.path.exists(src):
            raise SystemExit(f"⛔ 원본 없음: {c['src']} (--src {c['src']}=경로)")
        out = os.path.join(P['clips'], c['id'] + '.mp4')
        if os.path.exists(out) and not a.force:
            continue
        # 세로 원본을 9:16으로 가운데 자르고 540x960으로 줄임(SAM에 보내는 크기 = 비교 영상 크기)
        vf = f'crop=iw:iw*16/9:0:(ih-iw*16/9)/2,scale={W}:{H},fps={FPS}'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(c['t0']), '-t', str(round(c['t1'] - c['t0'], 3)), '-i', src,
                        '-vf', vf, '-an', '-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast', '-pix_fmt', 'yuv420p',
                        '-movflags', '+faststart', out], check=True)
        print('조각', c['id'])


# ---------- 2) 기존 방식 ----------
class Owl:
    def __init__(self):
        import torch
        from transformers import Owlv2ForObjectDetection, Owlv2Processor
        self.torch = torch
        self.P = Owlv2Processor.from_pretrained('google/owlv2-base-patch16-ensemble')
        self.M = Owlv2ForObjectDetection.from_pretrained('google/owlv2-base-patch16-ensemble').eval()

    def find(self, bgr, prompt, thr=0.1):
        rgb = np.ascontiguousarray(bgr[:, :, ::-1])
        inp = self.P(text=[[prompt]], images=rgb, return_tensors='pt')
        with self.torch.no_grad():
            o = self.M(**inp)
        s = max(W, H)
        r = self.P.post_process_grounded_object_detection(o, threshold=thr, target_sizes=self.torch.tensor([[s, s]]))[0]
        out = []
        for sc, b in zip(r['scores'].tolist(), r['boxes'].tolist()):
            x1, y1, x2, y2 = [float(v) for v in b]
            x1, x2 = max(0, x1), min(W - 1, x2)
            y1, y2 = max(0, y1), min(H - 1, y2)
            if x2 - x1 > 4 and y2 - y1 > 4:
                out.append((sc, [x1, y1, x2, y2]))
        return sorted(out, reverse=True)


def center(b):
    return ((b[0] + b[2]) / 2, (b[1] + b[3]) / 2)


def jumped(b0, b1):
    (x0, y0), (x1, y1) = center(b0), center(b1)
    return math.hypot(x1 - x0, y1 - y0) > JUMP * math.hypot(W, H)


def vit_new(frame, box):
    import cv2
    p = cv2.TrackerVit_Params()
    p.net = VIT
    t = cv2.TrackerVit_create(p)
    x1, y1, x2, y2 = box
    t.init(frame, (int(x1), int(y1), int(x2 - x1), int(y2 - y1)))
    return t


def cmd_baseline(a):
    """bobae_auto 방식을 SigLIP 재확인 없이 흉내 낸다: 10프레임(0.33초)마다 OWLv2, 튀는 후보는 버림, 사이는 VitTrack."""
    S = load_set()
    P = paths(a.work)
    owl = Owl()
    for c in pick(S['cuts'], a.only):
        out = os.path.join(P['base'], c['id'] + '.json')
        if os.path.exists(out) and not a.force:
            continue
        fr = read_frames(os.path.join(P['clips'], c['id'] + '.mp4'))
        t0 = time.time()
        boxes, cur, trk, n_owl = {}, None, None, 0
        for i, f in enumerate(fr):
            if i % 10 == 0:
                n_owl += 1
                cand = owl.find(f, c['prompt'])
                good = [b for _, b in cand if cur is None or not jumped(cur, b)]
                if good:
                    cur = good[0]
                    trk = vit_new(f, cur)
                    boxes[i] = [round(v, 1) for v in cur]
                    continue
            if trk is not None:
                ok, r = trk.update(f)
                if ok and trk.getTrackingScore() >= 0.2:
                    x, y, w, h = r
                    cur = [x, y, x + w, y + h]
                    boxes[i] = [round(float(v), 1) for v in cur]
        sec = time.time() - t0
        json.dump({'method': 'owlv2+vittrack', 'prompt': c['prompt'], 'n_frames': len(fr), 'owl_calls': n_owl,
                   'seconds': round(sec, 2), 'boxes': boxes}, open(out, 'w'))
        print(f"기존 {c['id']}: {len(boxes)}/{len(fr)} 프레임 · {sec:.1f}초")


# ---------- 3) SAM 3.1 ----------
def cmd_run(a):
    sys.path.insert(0, HERE)
    import sam31_api
    S = load_set()
    P = paths(a.work)
    spent = 0.0
    for c in pick(S['cuts'], a.only):
        out = os.path.join(P['sam'], c['id'] + '.json')
        if os.path.exists(out) and not a.force:
            continue
        clip = os.path.join(P['clips'], c['id'] + '.mp4')
        n = int(round((c['t1'] - c['t0']) * FPS))
        cost = max(MIN_BILL, n) * PRICE
        tries = [c['prompt']] + ([c['alt']] if c.get('alt') and a.alt else [])
        res = None
        for k, pr in enumerate(tries):
            if spent + cost > a.budget:
                raise SystemExit(f'⛔ 예산 ${a.budget} 도달(지금 ${spent:.2f}) — 멈춤')
            r = sam31_api.segment(clip, pr, conf=True)
            spent += cost
            r.update({'n_frames': n, 'billed_frames': max(MIN_BILL, n), 'cost_usd': round(cost, 4), 'try': k})
            res = r
            if not r['empty']:
                break
        json.dump(res, open(out, 'w'), ensure_ascii=False)
        print(f"SAM {c['id']}: {len(res['frames'])}/{n} 프레임 · {res['seconds']}초 · ${spent:.2f} 누적")


def cmd_runbox(a):
    """글자로 못 잡은 컷을 상자+점 프롬프트(sam31_box_prompts.json)로 한 번씩만 다시 돌린다. 결과는 sam_box/ — 기존 sam/ 는 덮지 않음."""
    sys.path.insert(0, HERE)
    import sam31_api
    if not os.environ.get('MODEL_API_KEY'):
        raise SystemExit('⛔ MODEL_API_KEY 없음 — 키가 있는 세션에서 실행하세요(요금이 나가므로 재시도 금지)')
    B = json.load(open(os.path.join(HERE, 'sam31_box_prompts.json')))
    S = {c['id']: c for c in load_set()['cuts']}
    od = os.path.join(a.work, 'sam_box')
    os.makedirs(od, exist_ok=True)
    spent = 0.0
    for b in pick(B['cuts'], a.only):
        out = os.path.join(od, b['id'] + '.json')
        if os.path.exists(out) and not a.force:
            continue
        c = S[b['id']]
        n = int(round((c['t1'] - c['t0']) * FPS))
        cost = max(MIN_BILL, n) * PRICE
        if spent + cost > a.budget:
            raise SystemExit(f'⛔ 예산 ${a.budget} 도달(지금 ${spent:.2f}) — 멈춤')
        r = sam31_api.segment(os.path.join(a.work, 'clips', b['id'] + '.mp4'), b['prompt'], conf=True,
                              direction='both' if b['frame'] > 0 else None)
        spent += cost
        r.update({'n_frames': n, 'billed_frames': max(MIN_BILL, n), 'cost_usd': round(cost, 4), 'try': 0, 'box_prompt': b})
        json.dump(r, open(out, 'w'), ensure_ascii=False)
        print(f"SAM(상자) {b['id']}: {len(r['frames'])}/{n} 프레임 · {r['seconds']}초 · ${spent:.2f} 누적")


# ---------- 4) 채점 ----------
def track_of(js, method):
    """프레임 → 상자 하나. SAM은 가장 많이 나온 물체 번호 하나를 따라간다(신뢰도 0.4 미만 프레임은 숨김)."""
    n = js['n_frames']
    if method == 'base':
        return {int(k): v for k, v in js['boxes'].items()}, n
    cnt = {}
    for objs in js['frames'].values():
        for o in objs:
            cnt[o['id']] = cnt.get(o['id'], 0) + 1
    if not cnt:
        return {}, n
    oid = max(cnt, key=cnt.get)
    out = {}
    for fi, objs in js['frames'].items():
        for o in objs:
            if o['id'] == oid and o.get('c', 1.0) >= 0.4:
                out[int(fi)] = o['box']
    return out, n


def stats(tr, n):
    if n == 0:
        return {}
    have = sorted(tr)
    run = best = 0
    prev = None
    for i in range(n):
        if i in tr:
            run = run + 1 if prev == i - 1 else 1
            best = max(best, run)
            prev = i
    jumps = sum(1 for i in have if i - 10 in tr and jumped(tr[i - 10], tr[i]))
    gaps = sum(1 for i in range(1, n) if (i - 1 in tr) and (i not in tr))
    return {'found_pct': round(100 * len(tr) / n, 1), 'longest_run_pct': round(100 * best / n, 1), 'dropouts': gaps, 'jumps': jumps}


def cmd_score(a):
    S = load_set()
    P = paths(a.work)
    rows, tot = [], {'base_s': 0, 'sam_s': 0, 'cost': 0, 'frames': 0, 'n': 0}
    for c in S['cuts']:
        bp, sp = os.path.join(P['base'], c['id'] + '.json'), os.path.join(P['sam'], c['id'] + '.json')
        row = {'id': c['id'], 'group': c['group'], 'prompt': c['prompt']}
        if os.path.exists(bp):
            b = json.load(open(bp))
            row['base'] = stats(*track_of(b, 'base')) | {'seconds': b['seconds']}
            tot['base_s'] += b['seconds']
        if os.path.exists(sp):
            s = json.load(open(sp))
            row['sam'] = stats(*track_of(s, 'sam')) | {'seconds': s['seconds'], 'cost_usd': s['cost_usd'], 'empty': s['empty'], 'try': s.get('try', 0)}
            tot['sam_s'] += s['seconds']
            tot['cost'] += s['cost_usd']
            tot['frames'] += s['billed_frames']
        tot['n'] += 1
        rows.append(row)
    json.dump({'rows': rows, 'total': tot}, open(os.path.join(a.work, 'score.json'), 'w'), ensure_ascii=False, indent=1)
    print(f"{'컷':22s} {'기존 찾음%':>9s} {'끊김':>4s} {'튐':>3s} {'초':>6s} | {'SAM 찾음%':>9s} {'끊김':>4s} {'튐':>3s} {'초':>5s}")
    for r in rows:
        b, s = r.get('base', {}), r.get('sam', {})
        print(f"{r['id']:22s} {b.get('found_pct', '-'):>9} {b.get('dropouts', '-'):>4} {b.get('jumps', '-'):>3} {b.get('seconds', '-'):>6} | "
              f"{s.get('found_pct', '-'):>9} {s.get('dropouts', '-'):>4} {s.get('jumps', '-'):>3} {s.get('seconds', '-'):>5}")
    print('합계', json.dumps(tot, ensure_ascii=False))


# ---------- 5) 비교 영상 ----------
def cmd_render(a):
    import cv2
    from PIL import Image, ImageDraw, ImageFont
    S = load_set()
    P = paths(a.work)
    cuts = pick(S['cuts'], a.only)
    fb, fx = (lambda s: ImageFont.truetype(FONT, s)), (lambda s: ImageFont.truetype(FONT_X, s))
    YEL, BLK, WHT = (245, 242, 0), (17, 17, 17), (255, 255, 255)
    OW, OH = 1080, 1920
    PW, PH = 432, 768             # 패널(540x960을 0.8배)
    PX = [(OW - 2 * PW - 24) // 2, (OW - 2 * PW - 24) // 2 + PW + 24]
    PY = 420
    tmp = os.path.join(a.work, 'render_frames.raw')
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{OW}x{OH}', '-r', str(FPS), '-i', '-',
                            '-c:v', 'libx264', '-crf', '20', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', a.out],
                           stdin=subprocess.PIPE)
    tot = {'base_s': 0.0, 'sam_s': 0.0, 'base_found': 0, 'sam_found': 0, 'n': 0, 'cost': 0.0}
    jp = os.path.join(a.work, 'judge.json')   # 눈으로 확인한 '맞은 장면'(8장면 표본). 상자를 띄웠는지(찾은 프레임)는 틀린 상자도 세므로 보조 지표
    JD = json.load(open(jp)) if os.path.exists(jp) else {}
    tot.update({'base_ok': 0, 'sam_ok': 0, 'ok_of': 0})

    def chip(d, box, txt, sx, sy, ox, oy):
        x1, y1, x2, y2 = box
        X1, Y1, X2, Y2 = ox + x1 * sx, oy + y1 * sy, ox + x2 * sx, oy + y2 * sy
        d.rectangle([X1, Y1, X2, Y2], outline=YEL, width=4)
        f = fb(26)
        tw = d.textlength(txt, font=f)
        cx = min(max((X1 + X2) / 2 - tw / 2 - 12, ox + 6), ox + PW - tw - 30)
        cy = Y1 - 50 if Y1 - 50 > oy + 6 else Y2 + 10
        d.rounded_rectangle([cx, cy, cx + tw + 24, cy + 40], 8, fill=YEL)
        d.text((cx + 12, cy + 5), txt, font=f, fill=BLK)

    for c in cuts:
        fr = read_frames(os.path.join(P['clips'], c['id'] + '.mp4'))
        bj = json.load(open(os.path.join(P['base'], c['id'] + '.json')))
        sj = json.load(open(os.path.join(P['sam'], c['id'] + '.json'))) if os.path.exists(os.path.join(P['sam'], c['id'] + '.json')) else None
        bt, n = track_of(bj, 'base')
        st, _ = track_of(sj, 'sam') if sj else ({}, n)
        bs, ss = stats(bt, n), (stats(st, n) if sj else None)
        tot['n'] += n
        tot['base_found'] += len(bt)
        tot['sam_found'] += len(st)
        tot['base_s'] += bj['seconds']
        tot['sam_s'] += sj['seconds'] if sj else 0
        tot['cost'] += sj['cost_usd'] if sj else 0
        ko = KO.get(c['prompt'], c['prompt'])
        jd = JD.get(c['id'])
        if jd:
            tot['base_ok'] += jd['base']; tot['sam_ok'] += jd['sam']; tot['ok_of'] += jd['of']
        for i, f in enumerate(fr):
            cv = Image.new('RGB', (OW, OH), (20, 20, 22))
            d = ImageDraw.Draw(cv)
            d.text((60, 90), '부위 찾기 · 따라가기', font=fx(64), fill=WHT)
            d.text((60, 180), f'{ko}   ({c["id"]})', font=fb(40), fill=YEL)
            d.text((60, 250), f'프롬프트 「{c["prompt"]}」 · {n}프레임', font=fb(30), fill=(170, 170, 175))
            sm = Image.fromarray(f[:, :, ::-1]).resize((PW, PH))
            for k, (ttl, tr, stt, sec) in enumerate([('기존 OWLv2 + VitTrack', bt, bs, bj['seconds']),
                                                     ('SAM 3.1 (Meta API)', st, ss, sj['seconds'] if sj else None)]):
                ox = PX[k]
                cv.paste(sm, (ox, PY))
                d.text((ox, PY - 60), ttl, font=fb(32), fill=WHT)
                if k == 1 and sj is None:
                    d.rectangle([ox, PY, ox + PW, PY + PH], fill=(0, 0, 0))
                    d.text((ox + 40, PY + PH // 2 - 20), 'SAM 결과 대기', font=fb(34), fill=(150, 150, 150))
                    continue
                if i in tr:
                    chip(d, tr[i], ko, PW / W, PH / H, ox, PY)
                else:
                    d.rounded_rectangle([ox + 10, PY + 10, ox + 170, PY + 52], 8, fill=(200, 40, 40))
                    d.text((ox + 22, PY + 15), '놓침', font=fb(28), fill=WHT)
                yy = PY + PH + 30
                if jd:
                    ok = jd['base' if k == 0 else 'sam']
                    d.text((ox, yy), f'맞은 장면 {ok}/{jd["of"]}', font=fx(40), fill=YEL if ok >= jd['of'] - 1 else (255, 110, 110))
                else:
                    d.text((ox, yy), f'찾은 프레임 {stt["found_pct"]}%', font=fb(32), fill=WHT)
                d.text((ox, yy + 52), f'상자 띄움 {stt["found_pct"]}% · 튐 {stt["jumps"]}', font=fb(28), fill=(200, 200, 205))
                d.text((ox, yy + 92), f'처리 {sec:.1f}초' + (f' · ${sj["cost_usd"]:.3f}' if k == 1 else ' · CPU 2코어'), font=fb(30), fill=(200, 200, 205))
            enc.stdin.write(np.asarray(cv).tobytes())
    # 끝 요약 카드 3초
    cv = Image.new('RGB', (OW, OH), (20, 20, 22))
    d = ImageDraw.Draw(cv)
    d.text((60, 300), '요약', font=fx(80), fill=WHT)
    n = max(1, tot['n'])
    lines = ([('맞은 장면', f"{100 * tot['base_ok'] / tot['ok_of']:.0f}%", f"{100 * tot['sam_ok'] / tot['ok_of']:.0f}%")] if tot['ok_of'] else []) + [
             ('상자 띄움', f"{100 * tot['base_found'] / n:.0f}%", f"{100 * tot['sam_found'] / n:.0f}%" if tot['sam_s'] else '-'),
             ('부위 찾기 시간', f"{tot['base_s']:.0f}초", f"{tot['sam_s']:.0f}초" if tot['sam_s'] else '-'),
             ('비용', 'CPU', f"${tot['cost']:.2f}" if tot['sam_s'] else '-')]
    d.text((420, 470), '기존', font=fb(40), fill=(170, 170, 175))
    d.text((730, 470), 'SAM 3.1', font=fb(40), fill=YEL)
    for j, (k, v1, v2) in enumerate(lines):
        y = 570 + j * 120
        d.text((60, y), k, font=fb(44), fill=WHT)
        d.text((420, y), v1, font=fx(52), fill=WHT)
        d.text((730, y), v2, font=fx(52), fill=YEL)
    yb = 570 + len(lines) * 120 + 40
    d.text((60, yb), f"{len(cuts)}컷 · {tot['n']}프레임 · 540x960", font=fb(32), fill=(150, 150, 155))
    if JD:
        ab = sum(v['base'] for v in JD.values()); asm = sum(v['sam'] for v in JD.values()); ao = sum(v['of'] for v in JD.values())
        d.text((60, yb + 60), f"전체 {len(JD)}컷 맞은 장면  기존 {100 * ab / ao:.0f}% · SAM 3.1 {100 * asm / ao:.0f}%", font=fb(36), fill=WHT)
        d.text((60, yb + 115), '맞은 장면 = 컷마다 8장면을 눈으로 확인(보이면 그 부위에 상자, 안 보이면 상자 없음)', font=fb(26), fill=(150, 150, 155))
        d.text((60, yb + 155), '상자 띄움 = 틀린 곳에 띄운 상자도 셈(보조 지표)', font=fb(26), fill=(150, 150, 155))
    for _ in range(FPS * 3):
        enc.stdin.write(np.asarray(cv).tobytes())
    enc.stdin.close()
    enc.wait()
    json.dump(tot, open(a.out + '.summary.json', 'w'), ensure_ascii=False, indent=1)
    print('영상', a.out, json.dumps(tot, ensure_ascii=False))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('step', choices=['clips', 'baseline', 'run', 'runbox', 'score', 'render'])
    ap.add_argument('--work', default='sam31_work')
    ap.add_argument('--only')
    ap.add_argument('--src', action='append')
    ap.add_argument('--force', action='store_true')
    ap.add_argument('--budget', type=float, default=1.0, help='run 단계 달러 상한')
    ap.add_argument('--alt', action='store_true', help='빈 결과면 alt 프롬프트 한 번 더(비용 추가)')
    ap.add_argument('--out', default='sam31_compare.mp4')
    a = ap.parse_args()
    {'clips': cmd_clips, 'baseline': cmd_baseline, 'run': cmd_run, 'runbox': cmd_runbox, 'score': cmd_score, 'render': cmd_render}[a.step](a)


if __name__ == '__main__':
    main()
