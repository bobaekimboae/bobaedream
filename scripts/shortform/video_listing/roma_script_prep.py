"""대사를 바꿨을 때(낱말 수가 달라져도) 로마 렌더 입력을 새로 만든다 — 2026-11-24 r17 「완벽하게 신차 정보 보고 대사 교체해서」.

roma_voice_prep.py는 낱말 수가 같을 때만 계획을 옮긴다. 이 도구는 낱말 글자(키워드)로 계획을 새로 세운다.
  1) 쉬는 구간 0.32초 이하 + TEMPO배(기본 1.0) → voice<이름>f.wav
  2) faster-whisper 받아쓰기(시각만) → 대본 글자와 글자 단위로 맞춰 words<이름>.json
  3) 계획 plan_<이름>.json — 컷 시작·끝(키워드 낱말 시작 −0.12초)과 기법(T04·T06·T07·T08·T03) 시각
  4) 기법 추가 plan_extra_<이름>.json(T05·T03·T08·T02, 낱말 번호)
  5) 자막 덩어리·구역 edit_<이름>.json — 덩어리는 사람이 뜻 단위로 정한 CHUNKS를 그대로 씀(기계 분할 금지)
사용: python3 roma_script_prep.py <원본.mp3> <대본낱말.json> <이름>
"""
import json, os, re, subprocess, sys
import difflib

src, script_json, name = sys.argv[1:4]
G = os.path.dirname(os.path.abspath(src)) + '/'
HERE = os.path.dirname(os.path.abspath(__file__))
wav, f32 = G + f'voice{name}f.wav', G + f'voice{name}.f32'
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', src, '-af',
                'silenceremove=start_periods=1:start_threshold=-35dB:stop_periods=-1:stop_duration=0.32:stop_silence=0.32:stop_threshold=-35dB,atempo=' + os.environ.get('TEMPO', '1.0'),
                '-ar', '44100', '-ac', '1', wav], check=True)
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', wav, '-ar', '16000', '-ac', '1', '-f', 'f32le', f32], check=True)
raw = G + f'words{name}_raw.json'
if not os.path.exists(raw) or os.environ.get('REDO'):
    subprocess.run([sys.executable, os.path.join(HERE, 'transcribe_words.py'), f32, raw], check=True, stdout=subprocess.DEVNULL)
S = json.load(open(script_json)); R = json.load(open(raw))

# 숫자·영문은 읽는 소리가 달라(245 ↔ 이백사십오) 글자로 안 맞으므로, 맞는 글자만 쓰고 나머지는 앞뒤 사이로 채운다
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
# 단조 증가가 깨진 낱말(다른 곳 글자에 붙은 것)은 버리고 채움
last = -1
for i in range(len(S)):
    if st[i] is not None and st[i] <= last: st[i] = None
    elif st[i] is not None: last = st[i]
miss = [i for i, v in enumerate(st) if v is None]
for i in miss:
    a = next((st[j] for j in range(i - 1, -1, -1) if st[j] is not None), 0.0)
    jb = next((j for j in range(i + 1, len(S)) if st[j] is not None), None)
    b = st[jb] if jb is not None else a + 0.6
    ja = next((j for j in range(i - 1, -1, -1) if st[j] is not None), -1)
    span = (jb if jb is not None else len(S)) - ja
    st[i] = a + (b - a) * (i - ja) / span
W = []
for i, w in enumerate(S):
    nxt = st[i + 1] if i + 1 < len(S) else 1e9
    ends = [r[2] for r in R if st[i] - 0.01 <= r[1] < nxt - 0.01]
    e = min(max(ends), nxt - 0.02) if ends else min(st[i] + 0.4, nxt - 0.02)
    W.append([w, round(st[i], 3), round(max(st[i] + 0.05, e), 3)])
json.dump(W, open(G + f'words{name}.json', 'w'), ensure_ascii=False)

key = lambda w: w.replace(' ', '')


def i_(k, after=0):
    return next(j for j, (w, s, e) in enumerate(W) if j >= after and key(w).startswith(k))


T = lambda j: W[j][1]
# 컷 첫 낱말(roma_render.py C 목록과 같은 키워드)
c8 = min(i_('계기판', i_('카본')), i_('디지털', i_('카본')))
FIRST = [('c1', 0), ('c2', i_('헤드램프')), ('c3', i_('휠은')), ('c4', i_('실내는')), ('c5', i_('운전석과')), ('c6', i_('스티어링')),
         ('c7', i_('카본')), ('c8', c8), ('c9', i_('조수석', c8)), ('c10', i_('가운데')), ('c10b', i_('아래에')), ('c11', i_('소프트탑은')),
         ('c11b', i_('뒷좌석', i_('소프트탑은'))), ('c12', i_('후면은')), ('c13', i_('머플러')), ('c14', i_('트렁크')), ('c15', i_('엔진은')), ('c16', i_('최대'))]
END = T(i_('서울오토갤러리')) - 0.12
starts = [0.0] + [T(j) - 0.12 for k, j in FIRST[1:]]
cuts = []
OPT = {'c2': (['headlight'], '헤드램프'), 'c6': (['drive_mode'], '드라이브 모드'), 'c10': (['climate'], '공조 다이얼'), 'c11b': (['wind_deflector'], '바람막이'),
       'c14': (['trunk'], '트렁크 용량'), 'c15': (['power'], '마력'), 'c16': (['engine'], '엔진 제원')}
for k, (ck, j) in enumerate(FIRST):
    o, chip = OPT.get(ck, ([], None))
    cuts.append({'key': ck, 't0': round(starts[k], 3), 't1': round(starts[k + 1] if k + 1 < len(FIRST) else END, 3), 'options': o, 'chip': chip, 'techniques': []})
C = {c['key']: c for c in cuts}
j = i_('마네티노'); C['c6']['techniques'].append({'id': 'T06', 'option': 'drive_mode', 'at': round(T(j) + 0.13, 3)})
j = i_('공조'); C['c10']['techniques'].append({'id': 'T08', 'option': 'climate', 'at': round(T(j) - 0.25, 3)})
j = i_('60km'); C['c11']['techniques'].append({'id': 'T04', 'word': j, 'value': '60km', 'at': round(T(j) - 0.17, 3)})
j = i_('170km'); C['c11b']['techniques'].append({'id': 'T04', 'word': j, 'value': '170km', 'at': round(T(j) - 0.17, 3)})
j = i_('620'); C['c15']['techniques'] += [{'id': 'T04', 'word': j, 'value': '620마력', 'at': round(T(j) - 0.17, 3)}, {'id': 'T07', 'word': j, 'value': 620, 'at': round(T(j) + 1.1, 3)}]
j = i_('320'); C['c16']['techniques'].append({'id': 'T04', 'word': j, 'value': '320km', 'at': round(T(j) - 0.17, 3)})
summ = {}
for c in cuts:
    for e in c['techniques']: summ[e['id']] = summ.get(e['id'], 0) + 1
json.dump({'cuts': cuts, 'summary': summ, '_what': f'r17 대사({len(S)}낱말) 키워드로 새로 세운 계획'}, open(G + f'plan_{name}.json', 'w'), ensure_ascii=False, indent=1)

extra = {'_what': 'r17: r14 기법 추가를 새 대사 낱말 번호로', 'add': [
    {'key': 'c2', 'id': 'T05', 'from_cut_start': True, 'fade_out_word': i_('휠은')},
    {'key': 'c5', 'id': 'T03', 'step_words': [i_('운전석과'), i_('나눈')]},
    {'key': 'c7', 'id': 'T03', 'step_words': [i_('카본'), i_('시프트로')]},
    {'key': 'c9', 'id': 'T08', 'word': i_('조수석', c8)},
    {'key': 'c12', 'id': 'T03', 'step_words': [i_('LED', i_('후면은')), i_('테일램프')]},
    {'key': 'c13', 'id': 'T05', 'from_cut_start': True, 'fade_out_word': i_('트렁크')},
    {'key': 'c16', 'id': 'T02', 'option': 'engine', 'rows': [['77.5kg·m', i_('77.5')], ['제로백 3.4초', i_('제로백')], ['200km 9.7초', i_('200km')]]}]}
json.dump(extra, open(G + f'plan_extra_{name}.json', 'w'), ensure_ascii=False, indent=1)

CH = json.load(open(G + f'chunks{name}.json'))   # 사람이 뜻 단위로 정한 자막 덩어리 [[처음, 끝], …]
assert CH[0][0] == 0 and CH[-1][1] == len(S) - 1 and all(CH[q][1] + 1 == CH[q + 1][0] for q in range(len(CH) - 1)), '자막 덩어리가 낱말을 빠짐없이 덮어야 함'
zones = {'c1': '외관', 'c2': '외관', 'c3': '외관', 'c4': '실내', 'c5': '실내', 'c6': '실내', 'c7': '실내', 'c8': '실내', 'c9': '실내', 'c10': '실내', 'c10b': '실내',
         'c11': '외관', 'c11b': '실내', 'c12': '외관', 'c13': '외관', 'c14': '트렁크', 'c15': '엔진', 'c16': '엔진'}
json.dump({'_what': f'로마 스파이더 렌더 입력 · r17 {len(S)}낱말(신차 공식 제원으로 대사 교체)', 'words': len(S), 'zones': zones, 'chunks': CH},
          open(G + f'edit_{name}.json', 'w'), ensure_ascii=False)
print(f'음성 {wav} · 낱말 {len(W)} · 글자로 못 맞춘 낱말 {len(miss)}개 {[S[i] for i in miss]} · 말 끝 {W[-1][2]}초 · 컷 {len(cuts)}')
