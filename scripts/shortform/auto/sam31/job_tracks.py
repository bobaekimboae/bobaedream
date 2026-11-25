"""작업 폴더의 부위 추적 파일(tracks.json)을 부위 찾기 엔진으로 다시 만든다 (2026-11-25, 시안 마스터).

렌더 스크립트는 고치지 않는다. 같은 형식({컷: {s0, s1, pts, by, part}})의 tracks.json을 새로 써서 렌더러가 그대로 읽게 한다.
컷 구간(s0·s1)과 부위(part)는 기존 tracks.json(또는 --spec 파일)에서 읽는다. 사람 클릭(hint)은 --spec에만 적는다(기본 0회).

예) BBM_PART_ENGINE=sam python3 job_tracks.py <작업폴더> --out tracks_sam.json
    → <작업폴더>/tracks_sam.json + part_engine.json(보낸 프레임·금액·엔진·예비로 넘긴 컷)
"""
import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import part_engine as PE  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('job_dir')
    ap.add_argument('--spec', help='컷 표 JSON(기본: 작업폴더/tracks.json의 s0·s1·part)')
    ap.add_argument('--src', default='src.mp4')
    ap.add_argument('--out', default='tracks_sam.json')
    ap.add_argument('--cap', type=float, default=None, help='영상 1편 금액 상한(달러, 기본 0.30)')
    a = ap.parse_args()
    D = os.path.join(a.job_dir, '')
    spec = json.load(open(a.spec or D + 'tracks.json'))
    jobs = [{'key': k, 's0': v['s0'], 's1': v['s1'], 'part': v['part'], **({'hint': v['hint']} if v.get('hint') else {})}
            for k, v in spec.items()]
    # 예비: 기존 tracks.json에 OWLv2 결과(pts)가 있으면 그것을 그대로 쓴다
    owl = lambda j: ({**spec[j['key']], 'by': spec[j['key']].get('by', 'owlv2')} if spec[j['key']].get('pts') else None)
    res, cost = PE.find_parts(D + a.src, jobs, D + '_sam31', owl=owl, cap_usd=a.cap)
    out = {}
    for k, r in res.items():
        if r.get('pts'):
            out[k] = {'s0': r['s0'], 's1': r['s1'], 'pts': r['pts'], 'by': r['by'], 'part': r['part']}
    json.dump(out, open(D + a.out, 'w'))
    cost['clicks'] = sum(1 for j in jobs if j.get('hint'))
    json.dump(cost, open(D + 'part_engine.json', 'w'), ensure_ascii=False, indent=1)
    print(json.dumps({k: (v['by'], sum(p is not None for p in v['pts']), len(v['pts'])) for k, v in out.items()}, ensure_ascii=False))
    print(f"보낸 프레임 {cost['frames_sent']} · ${cost['usd']:.3f} · 사람 클릭 {cost['clicks']}회 · 예비 {cost['fallback']}")


if __name__ == '__main__':
    main()
