"""한국어 대본 낱말 시각 맞추기(강제 정렬) — WhisperX 정렬 방식의 가벼운 판.

받아쓰기(faster-whisper)는 낱말을 빠뜨리거나(예: r11의 V8·제로백) 숫자를 다르게 적으면 시각이 비었다.
여기서는 대본 글자를 음성에 '억지로' 맞춘다(CTC 강제 정렬). 대본에 있는 낱말은 모두 시각을 받는다.

- 모델: kresnik/wav2vec2-large-xlsr-korean(Apache-2.0, 음절 1,205자, WhisperX가 한국어에 쓰는 모델)
- 방식: wav2vec2 글자 확률 → 비터비 경로(torchaudio 튜토리얼과 같은 단순 트렐리스) → 낱말별 첫·끝 글자 시각
- 숫자·영문은 읽는 소리로 바꿔 맞춘다(2024 → 이천이십사, V8 → 브이에잇, 4개 → 네개). 화면 글자는 대본 그대로다.
- 맞출 글자가 하나도 없는 낱말(기호뿐 등)은 앞뒤 낱말 사이로 채운다.
- whisperx 패키지·torchaudio 없이 transformers + numpy만 쓴다(설치 크기를 줄이려고).

사용:
  python3 align_ko.py 음성.wav "대본 글자"            → 낱말별 시작·끝 출력
  from align_ko import align_words; align_words(f32_16k, "대본") → [(시작, 끝, 낱말)]
"""
import os
import re
import sys

import numpy as np

MODEL = os.environ.get('ALIGN_MODEL', 'kresnik/wav2vec2-large-xlsr-korean')
FRAME = 0.02  # wav2vec2 한 칸 = 320샘플 / 16kHz
_M = None

DIGIT = '영일이삼사오육칠팔구'
NATIVE = {1: '한', 2: '두', 3: '세', 4: '네', 5: '다섯', 6: '여섯', 7: '일곱', 8: '여덟', 9: '아홉', 10: '열',
          20: '스물', 30: '서른', 40: '마흔', 50: '쉰', 60: '예순', 70: '일흔', 80: '여든', 90: '아흔'}
NATIVE_COUNTERS = ('개', '명', '살', '시간', '번째', '군데', '가지', '대')
LETTER = {'a': '에이', 'b': '비', 'c': '씨', 'd': '디', 'e': '이', 'f': '에프', 'g': '지', 'h': '에이치', 'i': '아이',
          'j': '제이', 'k': '케이', 'l': '엘', 'm': '엠', 'n': '엔', 'o': '오', 'p': '피', 'q': '큐', 'r': '알',
          's': '에스', 't': '티', 'u': '유', 'v': '브이', 'w': '더블유', 'x': '엑스', 'y': '와이', 'z': '지'}
UNIT = [('kg·m', '킬로그램미터'), ('km/h', '킬로미터'), ('km', '킬로미터'), ('kg', '킬로그램'), ('cc', '씨씨'),
        ('ps', '마력'), ('hp', '마력'), ('mm', '밀리'), ('l', '리터'), ('+', '플러스'), ('%', '퍼센트')]


def _sino(n):
    if n == 0:
        return '영'
    out = ''
    for unit, name in ((100000000, '억'), (10000, '만')):
        if n >= unit:
            out += ('' if n // unit == 1 and name == '만' else _sino(n // unit)) + name
            n %= unit
    for unit, name in ((1000, '천'), (100, '백'), (10, '십')):
        if n >= unit:
            q = n // unit
            out += ('' if q == 1 else DIGIT[q]) + name
            n %= unit
    if n:
        out += DIGIT[n]
    return out


def _native(n):
    if n in NATIVE:
        return NATIVE[n]
    if n < 100:
        return NATIVE[n // 10 * 10] + NATIVE[n % 10]
    return _sino(n)


def reading(tok):
    """낱말 하나를 읽는 소리 글자로(맞추기 전용, 화면에는 쓰지 않음)."""
    t = tok.lower()
    for a, b in UNIT:  # 숫자 뒤 단위만 바꾼다
        t = re.sub(r'(?<=\d)' + re.escape(a) + r'(?![a-z])', b, t)

    def num(m):
        s, rest = m.group(1), t[m.end():]
        if '.' in s:
            a, b = s.split('.')
            return _sino(int(a)) + '점' + ''.join(DIGIT[int(c)] for c in b)
        n = int(s.replace(',', ''))
        if n < 100 and rest.startswith(NATIVE_COUNTERS):
            return _native(n)
        return _sino(n)
    en = ['제로', '원', '투', '쓰리', '포', '파이브', '식스', '세븐', '에잇', '나인']
    t = re.sub(r'(?<=[a-z])(\d)(?![\d.])', lambda m: en[int(m.group(1))], t)  # V8 → 브이에잇
    t = re.sub(r'(\d[\d,]*(?:\.\d+)?)', num, t)
    t = re.sub(r'[a-z]', lambda m: LETTER[m.group(0)], t)
    return re.sub(r'[^가-힣]', '', t)


def _model():
    global _M
    if _M is None:
        import torch
        from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor
        proc = Wav2Vec2Processor.from_pretrained(MODEL)
        net = Wav2Vec2ForCTC.from_pretrained(MODEL).eval()
        torch.set_num_threads(max(1, (os.cpu_count() or 2) - 1))
        _M = (proc, net, torch)
    return _M


def _emissions(f32):
    proc, net, torch = _model()
    out = []
    win = 30 * 16000  # 30초씩 나눠 계산(메모리), 칸 수는 이어 붙인다
    for s in range(0, len(f32), win):
        x = proc(f32[s:s + win], sampling_rate=16000, return_tensors='pt').input_values
        with torch.inference_mode():
            out.append(torch.log_softmax(net(x).logits[0], -1).numpy())
    return np.concatenate(out), proc.tokenizer


def _viterbi(em, ids, blank):
    T, L = len(em), len(ids)
    if L == 0 or T < L:
        return None
    tr = np.full((T + 1, L + 1), -np.inf, np.float32)
    tr[0, 0] = 0
    tr[1:, 0] = np.cumsum(em[:, blank])
    tok = em[:, ids]  # T x L
    stay = em[:, blank][:, None]
    for t in range(T):
        tr[t + 1, 1:] = np.maximum(tr[t, 1:] + stay[t], tr[t, :-1] + tok[t])
    # 되짚기: 글자 j가 처음 나온 칸
    first = [0] * L
    j, t = L, T
    while j > 0 and t > 0:
        if tr[t - 1, j - 1] + tok[t - 1, j - 1] >= tr[t - 1, j] + stay[t - 1, 0]:
            first[j - 1] = t - 1
            j -= 1
        t -= 1
    if j > 0:
        return None
    return first


def align_words(f32, text, offset=0.0):
    """16kHz 모노 float32 + 대본 → [(시작, 끝, 대본 낱말)] (맞출 수 없는 낱말은 앞뒤로 채움)."""
    toks = text.split()
    em, tk = _emissions(np.asarray(f32, np.float32))
    vocab = tk.get_vocab()
    blank = tk.pad_token_id
    ids, owner = [], []
    for wi, w in enumerate(toks):
        for ch in reading(w):
            if ch in vocab:
                ids.append(vocab[ch])
                owner.append(wi)
    first = _viterbi(em, ids, blank)
    total = len(f32) / 16000
    if first is None:
        return None
    spans = {}
    for k, wi in enumerate(owner):
        st = first[k] * FRAME
        en = (first[k + 1] if k + 1 < len(first) and owner[k + 1] == wi else first[k] + 1) * FRAME
        a, b = spans.get(wi, (st, en))
        spans[wi] = (min(a, st), max(b, en))
    # 낱말 끝 = 다음 낱말 시작 직전(무음 칸이 길면 0.6초에서 자름)
    order = sorted(spans)
    for n, wi in enumerate(order):
        s, e = spans[wi]
        nxt = spans[order[n + 1]][0] if n + 1 < len(order) else total
        spans[wi] = (s, max(e, min(nxt, e + 0.6)))
    out, last = [], 0.0
    for wi, w in enumerate(toks):
        if wi in spans:
            s, e = spans[wi]
        else:
            nxt = next((spans[j][0] for j in range(wi + 1, len(toks)) if j in spans), min(total, last + 0.35))
            s, e = last, max(last + 0.05, nxt)
        s = max(s, last)
        e = max(e, s + 0.05)
        out.append((round(s + offset, 3), round(e + offset, 3), w))
        last = e
    return out


def _pcm16k(path):
    import subprocess
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'])
    return np.frombuffer(raw, np.float32)


if __name__ == '__main__':
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    text = open(sys.argv[2]).read() if os.path.exists(sys.argv[2]) else sys.argv[2]
    for s, e, w in align_words(_pcm16k(sys.argv[1]), text) or []:
        print(f'{s:7.2f} {e:7.2f} {w}')
