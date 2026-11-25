"""부위 찾기 + 추적을 SAM 3.1(Meta Model API) 한 번 호출로 끝내는 모듈 (2026-11-25).

왜: 기존 방식(OWLv2로 한 장 찾기 → VitTrack/CSRT 추적)은 34초 영상에서 부위 찾기만 226초가 걸려 렌더보다 느렸고,
    움직이는 컷에서 자주 놓쳤다. SAM 3.1은 2~3초 컷 하나를 6~15초에 찾고 끝까지 따라간다(docs/shortform/sam31-test-v1.md).

쓰는 법(렌더러에서):
    import part_track as PT
    res = PT.track_parts(src_mp4, jobs, work_dir)      # jobs = [{'key','s0','s1','part', 'hint':(t, fx, fy)?}, ...]
    res['c3'] → {'pts': [(fx, fy) 또는 None, ...30fps], 'box': [...], 'how': 'text'|'click'|'none', 'seconds': 7.7}

규칙
- 컷은 동시에 보낸다(기본 4개). 걸리는 시간 ≈ 가장 느린 컷 하나.
- 글자 프롬프트로 먼저 찾고, 비면 hint 자리에 상자 1개(+점)를 그려 한 번 더 보낸다. 그래도 비면 'none' → 렌더러가 기존 방식으로 돌아간다.
- 같은 조각·같은 프롬프트는 캐시(work_dir/sam_cache)에서 다시 쓴다. 과금 요청을 재시도로 반복하지 않는다.
- 예산 상한(budget_usd)을 넘으면 남은 컷은 보내지 않고 'none'.
- 키는 환경변수 MODEL_API_KEY. 없으면 전부 'none'(조용히 기존 방식).
"""
import hashlib
import json
import os
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..'))
import sam31_api  # noqa: E402

W, H, FPS = 540, 960, 30
PRICE = 0.20 / 1000   # 달러/프레임(문서 기준)
MIN_BILL = 50

# part 키 → SAM 프롬프트(짧은 영어 명사구 하나). part_anchor.PROMPTS와 같은 키를 쓴다.
PROMPTS = {
    'backrest': 'seat backrest', 'headrest': 'headrest', 'cushion': 'seat cushion', 'seat': 'seat',
    'steering': 'steering wheel', 'screen': 'touchscreen display', 'wheel': 'car wheel', 'trunk': 'open trunk',
    'headlight': 'headlight', 'taillight': 'taillight', 'speaker': 'door speaker grille', 'console': 'center console',
    'roof': 'sunroof', 'gauge': 'instrument cluster', 'clock': 'analog clock', 'dial': 'drive mode dial',
    'stalk': 'steering column lever', 'climate': 'climate control panel', 'mirror': 'side mirror',
    'seat switch': 'seat adjustment switch', 'door step': 'door sill plate', 'tow hitch': 'tow hitch',
    'button panel': 'button panel', 'emblem': 'car emblem', 'center cap': 'wheel center cap logo',
    'door handle': 'door handle', 'caliper': 'brake caliper', 'plate': 'license plate',
}


def _cut(src, s0, s1, out):
    if not os.path.exists(out):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{s0:.3f}', '-i', src, '-t', f'{s1 - s0:.3f}', '-an',
                        '-vf', f'scale={W}:{H},fps={FPS}', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
                        '-movflags', '+faststart', out], check=True)
    return out


def _box_prompt(frame, fx, fy, bw=0.30, bh=0.17):
    """hint 자리에 상자 1개 + 가운데 점 1개. 형식은 공식 @meta-sam/parser buildObjectPrompt 출력과 같다."""
    x1, y1 = max(0, int((fx - bw / 2) * W)), max(0, int((fy - bh / 2) * H))
    x2, y2 = min(W - 1, int((fx + bw / 2) * W)), min(H - 1, int((fy + bh / 2) * H))
    px, py = int(fx * W), int(fy * H)
    return (f'<{frame}f>0<|box;x1={x1};y1={y1};x2={x2};y2={y2};w={W};h={H}|>'
            f'<|point;x={px};y={py};w={W};h={H}|>')


def _call(clip, prompt, cache):
    k = hashlib.sha256(open(clip, 'rb').read() + prompt.encode()).hexdigest()[:20]
    p = os.path.join(cache, k + '.json')
    if os.path.exists(p):
        r = json.load(open(p)); r['cached'] = True; return r
    r = sam31_api.segment(clip, prompt, conf=True, direction='both' if prompt.startswith('<') else None)
    json.dump(r, open(p, 'w'))
    return r


def _pts(r, n):
    """가장 많이 나온 물체 번호 하나를 따라간다. 신뢰도 0.4 미만은 버리고, 빈 프레임은 직전 자리(처음 비면 다음 자리)로 메운다."""
    cnt = {}
    for objs in r['frames'].values():
        for o in objs:
            cnt[o['id']] = cnt.get(o['id'], 0) + 1
    if not cnt:
        return None, None
    oid = max(cnt, key=cnt.get)
    pts, boxes = [None] * n, [None] * n
    for k, objs in r['frames'].items():
        i = int(k)
        if i >= n:
            continue
        for o in objs:
            if o['id'] == oid and o.get('c', 1) >= 0.4:
                x1, y1, x2, y2 = o['box']
                pts[i] = ((x1 + x2) / 2 / W, (y1 + y2) / 2 / H); boxes[i] = [x1 / W, y1 / H, x2 / W, y2 / H]
    seen = [p for p in pts if p]
    if not seen:
        return None, None
    last = seen[0]
    for i in range(n):           # 앞쪽 빈칸은 첫 자리, 이후 빈칸은 직전 자리
        if pts[i] is None:
            pts[i] = last
        else:
            last = pts[i]
    return pts, boxes


def track_parts(src, jobs, work_dir, max_workers=4, budget_usd=1.0, log=print):
    out = {j['key']: {'pts': None, 'box': None, 'how': 'none', 'seconds': 0.0} for j in jobs}
    if not os.environ.get('MODEL_API_KEY', '').strip():
        log('  [SAM 3.1] MODEL_API_KEY 없음 → 기존 부위 추적 사용')
        return out
    clips_d = os.path.join(work_dir, 'sam_clips'); cache = os.path.join(work_dir, 'sam_cache')
    os.makedirs(clips_d, exist_ok=True); os.makedirs(cache, exist_ok=True)
    plan, spent = [], 0.0
    for j in jobs:
        n = int(round((j['s1'] - j['s0']) * FPS)) + 1
        cost = max(MIN_BILL, n) * PRICE
        if spent + cost > budget_usd:
            log(f"  [SAM 3.1] 예산 ${budget_usd} 도달 → {j['key']}부터 기존 방식"); break
        spent += cost
        plan.append((j, n, _cut(src, j['s0'], j['s1'], os.path.join(clips_d, f"{j['key']}_{j['s0']:.2f}_{j['s1']:.2f}.mp4"))))

    def one(item):
        j, n, clip = item
        t0 = time.time()
        prompt = PROMPTS.get(j['part'], j['part'])
        try:
            r = _call(clip, prompt, cache); how = 'text'
            pts, boxes = _pts(r, n)
            if pts is None and j.get('hint'):
                t, fx, fy = j['hint']
                f = min(n - 1, max(0, int(round((t - j['s0']) * FPS))))
                r = _call(clip, _box_prompt(f, fx, fy), cache); how = 'click'
                pts, boxes = _pts(r, n)
        except SystemExit as e:      # API 오류는 이 컷만 기존 방식으로
            log(f"  [SAM 3.1] {j['key']} 오류: {e}"); pts = None
        return j['key'], {'pts': pts, 'box': boxes, 'how': how if pts else 'none', 'seconds': round(time.time() - t0, 2)}

    t0 = time.time()
    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        for k, v in ex.map(one, plan):
            out[k] = v
            log(f"  [SAM 3.1] {k} {v['how']} {v['seconds']}초")
    log(f"  [SAM 3.1] 컷 {len(plan)}개 동시 처리 {time.time() - t0:.1f}초 · 예상 비용 ${spent:.2f}")
    return out


if __name__ == '__main__':   # 시험: python3 part_track.py src.mp4 jobs.json work_dir
    src, jp, wd = sys.argv[1:4]
    res = track_parts(src, json.load(open(jp)), wd)
    json.dump(res, open(os.path.join(wd, 'sam_tracks.json'), 'w'))
    print({k: (v['how'], v['seconds']) for k, v in res.items()})
