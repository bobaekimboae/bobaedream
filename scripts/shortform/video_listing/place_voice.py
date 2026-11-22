"""원본 순서·원본 길이 영상 매물(ED-SIMPLE)용 — 목소리 문장을 그 장면 시각에 놓는다.

2026-11-22 사용자: 「매핑 안 되고 원본 길이로 우리 편집 기법대로」
- 장면을 다시 배치하지 않는다. 원본 영상은 처음부터 끝까지 그대로 흐르고, 문장 k는 그 문장이 설명하는 장면(job.cuts[k].src[0])에 놓인다.
- 목소리는 한 번만 생성(일레븐랩스 규칙). 생성한 파일을 문장 단위로 잘라 자리에 놓을 뿐, 다시 만들지 않는다.
- 자막 낱말은 받아쓰기가 아니라 대본 글자(job.cuts[].line)를 쓴다 → 받아쓰기 오타 고침 목록(G350 FIX)이 필요 없다.

job.cuts[].line 쓰는 법: 어절을 띄어 쓰고, 화면 글자와 읽는 글자가 다르면 「화면|읽기」(읽기 안 띄어쓰기는 _), 뜻 단위 자막 끊김은 「/」.
  예) "주행거리는 / 58,176km입니다.|오만_팔천백칠십육_킬로입니다."
사용: python3 place_voice.py <차 폴더>   (폴더에 job.json · voice_raw.mp3)
출력: voice.wav(48k 모노) · words.json [[화면 낱말, 시작, 끝]] · voice_place.json(문장별 자리·넘침)
"""
import difflib, json, os, re, subprocess, sys

import numpy as np

D = os.path.abspath(sys.argv[1])
JOB = json.load(open(os.path.join(D, 'job.json'), encoding='utf-8'))
SR = 48000
norm = lambda t: re.sub(r'[^0-9A-Za-z가-힣]', '', t)


def tokens(line):
    """→ [(화면, 읽기, 덩어리 시작 여부)]"""
    out, new = [], True
    for tk in line.split():
        if tk == '/':
            new = True; continue
        show, say = (tk.split('|', 1) + [None])[:2]
        out.append((show, (say or show).replace('_', ' '), new)); new = False
    return out


def pcm(path, sr):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


raw16 = pcm(os.path.join(D, 'voice_raw.mp3'), 16000)
wp = os.path.join(D, 'words_raw.json')
if not os.path.exists(wp):
    from faster_whisper import WhisperModel
    m = WhisperModel('large-v3-turbo', device='cpu', compute_type='int8')
    segs, _ = m.transcribe(raw16, language='ko', word_timestamps=True, vad_filter=True)
    json.dump([[w.word.strip(), round(w.start, 3), round(w.end, 3)] for s in segs for w in s.words], open(wp, 'w'), ensure_ascii=False)
WR = json.load(open(wp))
# 받아쓰기 글자마다 시각
sc, st = [], []
for w, s, e in WR:
    t = norm(w)
    for k, ch in enumerate(t):
        sc.append(ch); st.append(s + (e - s) * k / max(1, len(t)))
# 대본 읽기 글자 (문장, 어절)
cuts = JOB['cuts']
TK = [tokens(c['line']) for c in cuts]
bc, own = [], []
for ci, tk in enumerate(TK):
    for wi, (_, say, _) in enumerate(tk):
        for ch in norm(say):
            bc.append(ch); own.append((ci, wi))
sm = difflib.SequenceMatcher(None, ''.join(bc), ''.join(sc), autojunk=False)
mp = [None] * len(bc)
for a0, b0, n in sm.get_matching_blocks():
    for k in range(n):
        mp[a0 + k] = st[b0 + k]
ratio = sm.ratio()
known = [i for i, v in enumerate(mp) if v is not None]
for i in range(len(mp)):
    if mp[i] is None:
        lo = max([k for k in known if k < i], default=None); hi = min([k for k in known if k > i], default=None)
        mp[i] = mp[hi] if lo is None else (mp[lo] + 0.08 * (i - lo) if hi is None else mp[lo] + (mp[hi] - mp[lo]) * (i - lo) / (hi - lo))
if ratio < 0.8:
    sys.exit(f'목소리 ↔ 대본 일치 {ratio:.2f} < 0.8 — 대본을 바꿨으면 목소리를 다시 만들어야 함')
# 어절 시각(원래 목소리 기준)
wt = {}
for i, o in enumerate(own):
    wt.setdefault(o, [mp[i], mp[i]]); wt[o][1] = mp[i]
WEND = {(round(s, 3)): e for w, s, e in WR}
# 문장 소리 구간: 첫 글자 ~ 마지막 글자가 든 받아쓰기 낱말 끝
def word_end(t):
    best = [e for w, s, e in WR if s - 0.02 <= t <= e + 0.02]
    return max(best) if best else t + 0.12
sent = []
for ci, tk in enumerate(TK):
    a = wt[(ci, 0)][0]; b = word_end(wt[(ci, len(tk) - 1)][1])
    sent.append([a, b])
# 무음 경계로 다듬기: 앞뒤 문장 사이 가장 조용한 지점에서 자름(소리가 잘리지 않게)
voice = pcm(os.path.join(D, 'voice_raw.mp3'), SR)
def quiet(t0, t1):
    a, b = int(t0 * SR), int(max(t0 + 0.01, t1) * SR); seg = voice[a:b]
    if len(seg) < 480: return (t0 + t1) / 2
    hop = 240; e = [float((seg[k:k + 480] ** 2).mean()) for k in range(0, len(seg) - 480, hop)]
    return t0 + (int(np.argmin(e)) * hop + 240) / SR
cutp = [0.0] + [quiet(sent[i][1] - 0.05, sent[i + 1][0] + 0.02) for i in range(len(sent) - 1)] + [len(voice) / SR]
LEAD = JOB.get('voice_lead_s', 0.25)   # 장면이 바뀌고 이만큼 뒤에 말 시작(그림이 소리보다 먼저)
GAP = 0.15
out = np.zeros(int((cuts[-1]['src'][1] + 30) * SR), np.float32)
place, words, prev_end = [], [], 0.0
for ci, tk in enumerate(TK):
    a, b = cutp[ci], cutp[ci + 1]
    piece = voice[int(a * SR):int(b * SR)]
    speech0 = sent[ci][0] - a                          # 조각 안에서 말이 시작하는 곳
    want = cuts[ci]['src'][0] + (0 if ci == 0 else LEAD) - speech0
    at = max(want, prev_end + GAP - speech0 if ci else 0.0, 0.0)
    k = int(at * SR); out[k:k + len(piece)] += piece
    shift = at - a
    seg_end = cuts[ci]['src'][1]
    spoken_end = sent[ci][1] + shift
    place.append(dict(key=cuts[ci]['key'], want=round(cuts[ci]['src'][0] + (0 if ci == 0 else LEAD), 3), start=round(sent[ci][0] + shift, 3),
                      end=round(spoken_end, 3), scene_end=seg_end, late_s=round(max(0, sent[ci][0] + shift - want - speech0 + speech0), 3),
                      over_s=round(max(0, spoken_end - seg_end), 3)))
    prev_end = spoken_end
    for wi, (show, say, new) in enumerate(tk):
        s, e = wt[(ci, wi)]
        e = word_end(e) if wi == len(tk) - 1 else wt[(ci, wi + 1)][0] - 0.01 if (ci, wi + 1) in wt else e
        words.append([show, round(s + shift, 3), round(max(s + 0.05, e) + shift, 3), int(new), ci])
n = int((prev_end + 0.3) * SR)
out = out[:n]
pk = np.abs(out).max() or 1
if pk > 0.99: out = out / pk * 0.95
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'pcm_s16le', os.path.join(D, 'voice.wav')],
               input=out.tobytes(), check=True)
json.dump(words, open(os.path.join(D, 'words.json'), 'w'), ensure_ascii=False)
json.dump(dict(ratio=round(ratio, 3), voice_s=round(n / SR, 3), sentences=place), open(os.path.join(D, 'voice_place.json'), 'w'), ensure_ascii=False, indent=1)
print(f'목소리 ↔ 대본 일치 {ratio:.2f} · 길이 {n / SR:.2f}초')
for p in place:
    flag = ' ⚠ 장면 넘침 %.2f초' % p['over_s'] if p['over_s'] > 0.3 else ''
    print(f"  {p['key']:4} 말 {p['start']:6.2f}~{p['end']:6.2f}  장면 끝 {p['scene_end']:6.2f}{flag}")
