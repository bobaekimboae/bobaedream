"""새 내레이션을 로마 렌더 입력으로 맞춘다 — 2026-11-24 r16 「니다와 에요 적절하게 섞으라니까」 「음성 더 젊은」.

대본 낱말 수가 이전과 같으면(낱말 번호를 쓰는 계획·자막 덩어리 파일을 그대로 씀) 다음을 한 번에 한다.
  1) 쉬는 구간 0.32초 이하로 줄이고 TEMPO배(기본 1.1, 원래 빠른 목소리는 1.0) 빠르게 → <이름>f.wav
  2) faster-whisper(large-v3-turbo) 받아쓰기 → 시각만 씀
  3) 대본 글자 ↔ 받아쓰기 글자를 글자 단위로 맞춰 낱말별 시작·끝 → words<이름>.json (글자는 대본 글자)
  4) 옛 계획(plan)의 절대 시각(at·t0·t1)을 옛 낱말 → 새 낱말 기준으로 옮김 → plan_<이름>.json
사용: python3 roma_voice_prep.py <원본.mp3> <대본낱말.json(옛 words + 바꾼 글자)> <옛 words.json> <옛 plan.json> <이름>
"""
import copy, difflib, json, os, re, subprocess, sys

src, script_json, old_words, old_plan, name = sys.argv[1:6]
G = os.path.dirname(os.path.abspath(src)) + '/'
wav, f32 = G + f'voice{name}f.wav', G + f'voice{name}.f32'
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', src, '-af',
                'silenceremove=start_periods=1:start_threshold=-35dB:stop_periods=-1:stop_duration=0.32:stop_silence=0.32:stop_threshold=-35dB,atempo=' + os.environ.get('TEMPO', '1.1'),
                '-ar', '44100', '-ac', '1', wav], check=True)
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', wav, '-ar', '16000', '-ac', '1', '-f', 'f32le', f32], check=True)
raw = G + f'words{name}_raw.json'
subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'transcribe_words.py'), f32, raw], check=True, stdout=subprocess.DEVNULL)
S = json.load(open(script_json)); A = json.load(open(old_words)); R = json.load(open(raw))
assert len(S) == len(A), f'대본 낱말 수 {len(S)} ≠ 옛 낱말 수 {len(A)} — 계획·자막 덩어리 파일을 다시 만들어야 함'
n = lambda t: re.sub(r'[^0-9A-Za-z가-힣]', '', t).lower()
rc, rt = [], []
for w, s, e in R:
    t = n(w)
    for k, ch in enumerate(t): rc.append(ch); rt.append(s + (e - s) * k / max(1, len(t)))
sc, si = [], []
for i, w in enumerate(S):
    for ch in n(w): sc.append(ch); si.append(i)
m = {}
for a, b, z in difflib.SequenceMatcher(None, sc, rc, autojunk=False).get_matching_blocks():
    for k in range(z): m[a + k] = b + k
st = [None] * len(S)
for ci, wi in enumerate(si):
    if ci in m and st[wi] is None: st[wi] = rt[m[ci]]
miss = [i for i, v in enumerate(st) if v is None]
for i in miss:   # 받아쓰기가 다르게 들은 낱말(제로백 → 0 등)은 앞뒤 사이
    a = next((st[j] for j in range(i - 1, -1, -1) if st[j] is not None), 0.0)
    b = next((st[j] for j in range(i + 1, len(S)) if st[j] is not None), a + 0.6)
    st[i] = a + (b - a) / 2
W = []
for i, w in enumerate(S):
    nxt = st[i + 1] if i + 1 < len(S) else 1e9
    ends = [r[2] for r in R if st[i] - 0.01 <= r[1] < nxt - 0.01]
    e = min(max(ends), nxt - 0.02) if ends else min(st[i] + 0.4, nxt - 0.02)
    W.append([w, round(st[i], 3), round(max(st[i] + 0.05, e), 3)])
json.dump(W, open(G + f'words{name}.json', 'w'), ensure_ascii=False)


def f(t):
    i = max([j for j, w in enumerate(A) if w[1] <= t + 1e-6] or [0]); return round(W[i][1] + (t - A[i][1]), 3)


def walk(o):
    if isinstance(o, dict):
        for k, v in o.items():
            if k in ('at', 't0', 't1') and isinstance(v, (int, float)): o[k] = f(v)
            else: walk(v)
    elif isinstance(o, list):
        for x in o: walk(x)


P = copy.deepcopy(json.load(open(old_plan))); walk(P['cuts']); P['_what'] = f'{os.path.basename(old_plan)} 시각을 새 음성(words{name})으로 옮김'
json.dump(P, open(G + f'plan_{name}.json', 'w'), ensure_ascii=False, indent=1)
print(f'음성 {wav} · 낱말 {len(W)} · 다르게 들은 낱말 {[S[i] for i in miss]} · 끝 {W[-1][2]}초')
