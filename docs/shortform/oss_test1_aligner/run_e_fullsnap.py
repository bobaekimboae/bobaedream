"""1번 시험 — 후보 E: 운영 방식(Qwen3 전체 음성 + 쉼 맞춤, main PR #1233 align_script.py) (2026-11-25, 시안 마스터)
  /opt/qwen-align/bin/python run_e_fullsnap.py <main의 align_script.py 경로>
원본 음성 3개 전체를 맞춘 뒤 regroup·snap → 문장마다 대본 어절을 순서대로 찾아 클립 기준 시각으로 바꿔 results/E.json 저장.
"""
import importlib.util, json, os, sys, time
H = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('al', sys.argv[1]); al = importlib.util.module_from_spec(spec); spec.loader.exec_module(al)
scripts = json.load(open(f'{H}/scripts.json'))
rows = json.load(open(f'{H}/sentences20.json'))
full = {}
for src, text in scripts.items():
    script = ' '.join(text.split())
    path = f'{H}/audio/{src}.mp3'
    t0 = time.time()
    items = al.align(path, script)
    W = al.snap(al.regroup(items, script), al.speech_segments(al.load16k(path)))
    full[src] = W
    print(src, len(W), round(time.time() - t0, 1), flush=True)
out, ptr = {}, {s: 0 for s in full}
for r in rows:
    W, i = full[r['source']], ptr[r['source']]
    n = len(r['words'])
    # 문장 첫 어절을 순서대로 찾기
    target = [al._norm(w) for w in r['words']]
    while i < len(W) and al._norm(W[i][2]) != target[0]:
        i += 1
    seg = W[i:i + n]; ptr[r['source']] = i + n
    cs = r['clip_start_in_source']
    out[r['id']] = {'seconds': 0, 'tokens': [[w, round(s - cs, 3), round(e - cs, 3)] for s, e, w in seg]}
json.dump(out, open(f'{H}/results/E.json', 'w'), ensure_ascii=False, indent=0)
