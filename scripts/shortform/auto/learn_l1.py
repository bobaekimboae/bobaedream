"""1차 학습(자동 편집용) — 원본 네덜란드·벨기에 100편에서 자동 편집에 바로 쓰는 수치만 다시 잰다.

원칙: 원본과 우리 결과물을 「같은 자로」 잰다. 컷은 ffmpeg 장면 점수(scale 180, 0.3)로 원본·우리 렌더 모두 같은 함수(cuts_ff).
입력(분석 전용, 원본 영상·음악·글자는 다시 쓰지 않음)
  영상  /mnt/user-data/uploads/autostudio_analysis/dl50/{nl,be}/*.mp4
  말    scratchpad/cap100/tr2/<src>_<id>.json   (faster-whisper 낱말 시각)
  칩·효과음 rs/res200.json(노랑 칩 트랙 + 칩 종류 확률), rs/scan.json(효과음 검출 p)
출력  learned_l1.json(영상별) + learned_l1_summary.json(나라별 p25·p50·p75)

python3 learn_l1.py SCRATCH OUT_DIR [--no-video]
"""
import json, os, re, subprocess, sys, statistics as st
from concurrent.futures import ProcessPoolExecutor

DL = '/mnt/user-data/uploads/autostudio_analysis/dl50'


def cuts_ff(mp4, th=0.3):
    """원본·렌더 공통 컷 검출. calibrate.py도 이 함수를 쓴다"""
    out = subprocess.run(['ffmpeg', '-hide_banner', '-i', mp4, '-vf', f"scale=180:-2,select='gt(scene,{th})',showinfo", '-an', '-f', 'null', '-'],
                         capture_output=True, text=True).stderr
    c = [float(x) for x in re.findall(r'pts_time:([0-9.]+)', out)]
    res = []
    for t in c:  # 0.4초 안에 겹친 검출(플래시·흔들림)은 하나로
        if not res or t - res[-1] > 0.4:
            res.append(t)
    return res


def q(xs, p):
    xs = sorted(xs)
    if not xs:
        return None
    k = (len(xs) - 1) * p
    i = int(k)
    return round(xs[i] + (xs[min(i + 1, len(xs) - 1)] - xs[i]) * (k - i), 3)


def phrases(words, gap=0.25):
    """말 구절 시작점: 앞 낱말과 gap초 넘게 떨어진 낱말"""
    out = []
    for i, w in enumerate(words):
        if i == 0 or w[0] - words[i - 1][1] > gap:
            out.append(w[0])
    return out


def near(t, pts):
    return min((abs(t - p) for p in pts), default=99)


def one(args):
    key, S, use_video = args
    src, vid = key.split('_', 1)
    tr = json.load(open(f'{S}/cap100/tr2/{key}.json'))
    words = [w for w in tr['words'] if w[1] > w[0] and w[2].strip()]
    res = {x['id']: x for x in json.load(open(f'{S}/rs/res200.json')) if x['src'] == src}[vid]
    scan = json.load(open(f'{S}/rs/scan.json')).get(key, [])
    dur = res['dur']
    r = dict(key=key, src=src, dur=dur)
    # 말
    sp = sum(w[1] - w[0] for w in words)
    r['speech'] = len(words) >= 20 and sp / dur > 0.35  # 말하는 영상인가(말 없는 장면 모음 제외)
    r['wps'] = round(len(words) / max(1, sp), 2)
    r['first_word'] = round(words[0][0], 2) if words else None
    r['tail_after_speech'] = round(dur - words[-1][1], 2) if words else None
    ph = phrases(words)
    pl = [b - a for a, b in zip(ph, ph[1:])]
    r['phrase_med_s'] = q(pl, .5)
    # 컷
    cuts = cuts_ff(f'{DL}/{src}/{vid}.mp4') if use_video else res['cuts']
    cuts = [c for c in cuts if 0.3 < c < dur - 0.3]
    edges = [0.0] + cuts + [dur]
    shots = [b - a for a, b in zip(edges, edges[1:])]
    r['cuts_per_min'] = round(len(cuts) / dur * 60, 1)
    r['shot_med_s'] = q(shots, .5)
    r['shot_p25'] = q(shots, .25)
    r['first_cut'] = cuts[0] if cuts else None
    ws = [w[0] for w in words]
    if cuts and words:
        r['cut_on_word'] = round(sum(near(c, ws) <= 0.25 for c in cuts) / len(cuts), 2)   # 컷이 낱말 시작 ±0.25초
        r['cut_on_phrase'] = round(sum(near(c, ph) <= 0.3 for c in cuts) / len(cuts), 2)  # 컷이 구절 시작 ±0.3초
        lead = [c - min(ph, key=lambda p: abs(p - c)) for c in cuts if near(c, ph) <= 0.6]
        r['cut_minus_phrase_med'] = q(lead, .5)  # 음수 = 그림이 말보다 먼저 바뀜
    # 노랑 트랙 해석(2026-11-09 재학습): NL 노랑 = 말 자막의 말하는 낱말(칩은 검정·파랑 상자라 노랑 트랙에 안 잡힘),
    # BE 노랑 = 기울어진 붓띠 칩(ang > -80) + 말하는 낱말(기울기 없음). 칩 종류 분류기(67%)는 NL 노랑을 chip으로 잘못 부른다
    trk = [m for m in res['moments'] if m['kind'] == 'track']
    kar = [m for m in trk if m['ang'] <= -80 and max(m['kp'], key=m['kp'].get) not in ('logo',)]
    r['caption_cy'] = q([m['cy'] for m in kar], .5)  # 말 자막 높이 %(말하는 낱말 노랑)
    chips = [m for m in trk if src == 'be' and m['ang'] > -80 and max(m['kp'], key=m['kp'].get) not in ('logo', 'false')]
    if src == 'be':
        r['chips_per_min'] = round(len(chips) / dur * 60, 1)
    r['chip_hold_med'] = q([m['tdur'] for m in chips], .5)
    r['chip_cy'] = [round(m['cy'], 1) for m in chips]
    r['chip_ang'] = [m['ang'] for m in chips]
    if chips and words:
        off = [m['t'] - min(ws, key=lambda w: abs(w - m['t'])) for m in chips]
        r['chip_minus_word_med'] = q(off, .5)       # 칩 시작 − 가장 가까운 낱말 시작
        r['chip_minus_phrase_med'] = q([m['t'] - min(ph, key=lambda p: abs(p - m['t'])) for m in chips], .5)
        r['chip_after_cut_med'] = q([m['t'] - max([0.0] + [c for c in cuts if c <= m['t'] + 0.05]) for m in chips], .5)
        r['chip_on_new_shot'] = round(sum((m['t'] - max([0.0] + [c for c in cuts if c <= m['t'] + 0.05])) <= 0.5 for m in chips) / len(chips), 2)
    # 효과음
    hits = [t for t, p in scan if p >= 0.5]
    r['sfx'] = len(hits)
    r['sfx_hook'] = any(t < 0.6 for t in hits)
    if hits:
        r['sfx_on_chip'] = round(sum(near(t, [m['t'] for m in chips]) <= 0.2 for t in hits) / len(hits), 2)
        r['sfx_on_cut'] = round(sum(near(t, cuts) <= 0.15 for t in hits) / len(hits), 2)
        r['sfx_gap_min'] = round(min((b - a for a, b in zip(hits, hits[1:])), default=dur), 2)
    if chips:
        r['chips_with_sfx'] = round(sum(near(m['t'], hits) <= 0.2 for m in chips) / len(chips), 2)
    return r


def summarize(rows):
    out = {}
    for src in ('nl', 'be'):
        R = [r for r in rows if r['src'] == src and r['speech']]
        s = dict(n=len(R), n_all=sum(r['src'] == src for r in rows))
        for k in ['dur', 'wps', 'first_word', 'tail_after_speech', 'phrase_med_s', 'cuts_per_min', 'shot_med_s', 'shot_p25', 'first_cut',
                  'cut_on_word', 'cut_on_phrase', 'cut_minus_phrase_med', 'chips_per_min', 'chip_hold_med', 'chip_minus_word_med', 'chip_minus_phrase_med', 'caption_cy',
                  'chip_after_cut_med', 'chip_on_new_shot', 'sfx', 'sfx_on_chip', 'sfx_on_cut', 'sfx_gap_min', 'chips_with_sfx']:
            v = [r[k] for r in R if r.get(k) is not None]
            s[k] = dict(p25=q(v, .25), p50=q(v, .5), p75=q(v, .75), n=len(v))
        s['sfx_hook_rate'] = round(sum(r['sfx_hook'] for r in R) / max(1, len(R)), 2)
        cy = [y for r in R for y in r['chip_cy']]
        s['chip_cy'] = dict(p25=q(cy, .25), p50=q(cy, .5), p75=q(cy, .75), n=len(cy),
                            band_share={b: round(sum(lo <= y < hi for y in cy) / max(1, len(cy)), 2) for b, (lo, hi) in
                                        dict(top=(0, 33), mid=(33, 60), low=(60, 100)).items()})
        ang = [a for r in R for a in r['chip_ang']]
        s['chip_ang'] = dict(p50=q(ang, .5), ccw_share=round(sum(a < -0.5 for a in ang) / max(1, len(ang)), 2), n=len(ang))
        out[src] = s
    return out


if __name__ == '__main__':
    S, OUT = sys.argv[1], sys.argv[2]
    use_video = '--no-video' not in sys.argv
    keys = sorted(os.path.basename(p)[:-5] for p in os.listdir(f'{S}/cap100/tr2') if p.endswith('.json'))
    keys = [k[:-5] if k.endswith('.json') else k for k in keys]
    keys = sorted(os.path.splitext(k)[0] for k in os.listdir(f'{S}/cap100/tr2') if k.endswith('.json'))
    with ProcessPoolExecutor(2) as ex:
        rows = list(ex.map(one, [(k, S, use_video) for k in keys]))
    os.makedirs(OUT, exist_ok=True)
    json.dump(rows, open(f'{OUT}/learned_l1.json', 'w'), ensure_ascii=False, indent=1)
    sm = summarize(rows)
    json.dump(sm, open(f'{OUT}/learned_l1_summary.json', 'w'), ensure_ascii=False, indent=1)
    for src in sm:
        print(src, json.dumps({k: (v['p50'] if isinstance(v, dict) and 'p50' in v else v) for k, v in sm[src].items()}, ensure_ascii=False))
