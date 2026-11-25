"""T1 낱말 시각 정렬기 A/B — Qwen3-ForcedAligner + 쉼 맞춤(정본 후보) vs wav2vec2 CTC(align_ko, 벨기에 렌더러).

같은 음성·같은 대본에서 두 정렬기를 돌리고, 쉼 경계(말이 멈췄다 다시 시작하는 곳)에서 시각 차이를 잰다.
기준(정답):
  1순위 사람 정답 labels/<차>.json  [{"t": 초, "kind": "on"|"off"}]  (on = 쉼 뒤 말 시작, off = 쉼 앞 말 끝)
  2순위 자동 기준: 소리 크기 −40dBFS 아래 0.18초 이상 = 쉼 → 그 앞뒤 경계. (쉼 맞춤이 같은 기준으로 맞춰서 Qwen에 유리하다 → 결론은 사람 정답으로만 낸다)
사용:
  python3 t1_aligner_ab.py --work /tmp/osst --cars rs3,e450,x6m          # 입력: <work>/in/<차>/voice_a.mp3 + tts.txt
  python3 t1_aligner_ab.py --work /tmp/osst --labels-todo                # 사람이 고칠 경계 후보 CSV를 만든다
통과: 사람 정답 기준 경계 최대 오차 ≤ 0.15초인 쪽. 둘 다 통과하면 중앙값이 작은 쪽, 같으면 설치가 가벼운 쪽.
"""
import argparse, json, os, shutil, subprocess, sys, time
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SF = os.path.dirname(HERE)
SR = 16000


def load16k(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32)


def auto_bounds(x, thr_db=-40.0, min_gap=0.18, hop=0.01):
    h = int(SR * hop)
    n = len(x) // h
    db = 20 * np.log10(np.sqrt((x[:n * h].reshape(n, h) ** 2).mean(1)) + 1e-9)
    loud = db > thr_db
    segs, i = [], 0
    while i < n:
        if loud[i]:
            j = i
            while j < n and loud[j]:
                j += 1
            segs.append([i * hop, j * hop])
            i = j
        else:
            i += 1
    merged = []
    for s in segs:
        if merged and s[0] - merged[-1][1] < min_gap:
            merged[-1][1] = s[1]
        else:
            merged.append(s)
    out = []
    for k, (a, b) in enumerate(merged):
        if k > 0:
            out.append({'t': round(a, 3), 'kind': 'on'})
        if k < len(merged) - 1:
            out.append({'t': round(b, 3), 'kind': 'off'})
    return out


def run_qwen(d):
    t = time.time()
    w = os.path.join(d, 'qwen')
    os.makedirs(w, exist_ok=True)
    for f in ('voice_a.mp3', 'tts.txt'):
        shutil.copy(os.path.join(d, f), w)
    subprocess.run([sys.executable, os.path.join(SF, 'photo_listing', 'align_script.py'), w], check=True)
    return json.load(open(os.path.join(w, 'voice_a_words.json'))), round(time.time() - t, 1)


def run_ctc(d, x):
    t = time.time()
    sys.path.insert(0, SF)
    from align_ko import align_words
    txt = open(os.path.join(d, 'tts.txt')).read().strip()
    ws = [[float(a), float(b), w] for a, b, w in align_words(x, txt)]
    json.dump(ws, open(os.path.join(d, 'ctc_words.json'), 'w'), ensure_ascii=False)
    return ws, round(time.time() - t, 1)


def errors(words, bounds):
    """경계마다 가장 가까운 낱말 시작(on) / 끝(off)과의 차이(초)."""
    st = np.array([w[0] for w in words]); en = np.array([w[1] for w in words])
    out = []
    for b in bounds:
        arr = st if b['kind'] == 'on' else en
        out.append(float(np.min(np.abs(arr - b['t']))))
    e = np.array(out)
    return {'n': len(e), 'median': round(float(np.median(e)), 3), 'max': round(float(e.max()), 3),
            'within_100ms': round(float((e <= 0.1).mean() * 100), 1), 'within_150ms': round(float((e <= 0.15).mean() * 100), 1)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--work', default='/tmp/osst')
    ap.add_argument('--cars', default='rs3,e450,x6m')
    ap.add_argument('--labels-todo', action='store_true')
    ap.add_argument('--only', choices=['qwen', 'ctc'])
    a = ap.parse_args()
    lab_dir = os.path.join(a.work, 'labels')
    os.makedirs(lab_dir, exist_ok=True)
    rows = []
    for car in a.cars.split(','):
        d = os.path.join(a.work, 'in', car)
        x = load16k(os.path.join(d, 'voice_a.mp3'))
        auto = auto_bounds(x)
        if a.labels_todo:
            with open(os.path.join(lab_dir, f'{car}_todo.csv'), 'w') as f:
                f.write('t,kind,고친시각(초·비우면 그대로),메모\n')
                for b in auto:
                    f.write(f"{b['t']},{b['kind']},,\n")
            print(car, '경계 후보', len(auto), '→', os.path.join(lab_dir, f'{car}_todo.csv'))
            continue
        lp = os.path.join(lab_dir, f'{car}.json')
        human = json.load(open(lp)) if os.path.exists(lp) else None
        r = {'car': car, 'dur': round(len(x) / SR, 2), 'auto_bounds': len(auto), 'human': bool(human)}
        for name, fn in (('qwen', lambda: run_qwen(d)), ('ctc', lambda: run_ctc(d, x))):
            if a.only and a.only != name:
                continue
            ws, sec = fn()
            r[name] = {'sec': sec, 'words': len(ws), 'auto': errors(ws, auto)}
            if human:
                r[name]['human'] = errors(ws, human)
        rows.append(r)
        print(json.dumps(r, ensure_ascii=False))
    if rows:
        json.dump(rows, open(os.path.join(a.work, 't1_result.json'), 'w'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
