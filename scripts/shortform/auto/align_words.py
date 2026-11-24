"""대본 낱말 시작·끝 시각 정렬 — Qwen3-ForcedAligner-0.6B (Apache-2.0), 2026-11-25.

받아쓰기(ElevenLabs Scribe 등)는 그대로 두고, 낱말 시각만 「대본 글자 그대로」 음성에 맞춘다.
근거(2026-11-24 rs3 1건): 소리 시작 기준 중앙값 0.02초 / 상위10% 0.088초 (faster-whisper 0.10 / 0.27초).

출력: 대본을 띄어쓰기로 나눈 낱말마다 [{text, start, end}] (SAG_VOICE_WORDS와 같은 모양).
      --pairs 를 주면 [[start, end, text]] (photo_listing tr.py의 voice_a_words.json과 같은 모양).
보정 1(쉼 맞춤, 기본 켬): 정렬기는 문장 끝 낱말을 짧게 자르고(예 「원이었습니다」 0.16초인데 실제 소리는 0.7초),
       쉼을 다음 낱말 시작에 붙이는 버릇이 있다(2026-11-25 매물 3건 확인). 그래서 소리 크기로 찾은 말 구간에 맞춰
       ① 쉼 안에서 시작하는 낱말은 다음 말소리 시작으로 옮기고 ② 말 구간의 마지막 낱말 끝은 그 구간 소리 끝으로 늘리고
       ③ 대본에서 문장부호로 끝나는 낱말은 끝을 그 말 구간 소리 끝에, 다음 낱말 시작을 다음 말소리 시작에 맞춘다.
보정 2: 길이 0초(또는 0.03초 미만) 낱말은 다음 낱말 시작까지 늘리고, 그래도 짧으면 앞 낱말 끝을 당겨 나눈다.

필요: qwen-asr (transformers 4.57 고정이라 시스템과 분리된 가상환경 권장)
  python3 -m venv --system-site-packages /tmp/qaenv && /tmp/qaenv/bin/pip install qwen-asr
사용:
  /tmp/qaenv/bin/python align_words.py voice.mp3 tts.txt out.json [--pairs] [--raw: 쉼 맞춤 끄기]
"""
import json
import re
import subprocess
import sys

import numpy as np

MIN_DUR = 0.03


def load_audio(path, sr=16000):
    a = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 's16le', '-ac', '1', '-ar', str(sr), '-'],
                       capture_output=True, check=True).stdout
    return np.frombuffer(a, np.int16).astype(np.float32) / 32768


def norm(t):
    return re.sub(r'[^0-9A-Za-z가-힣]', '', t)


def speech_segments(y, sr=16000, hop=160, rel_db=-40, gap=0.15, min_len=0.06):
    """소리 크기로 말 구간 [(시작, 끝)] — 짧은 쉼(gap 미만)은 이어 붙인다."""
    fr = len(y) // hop
    rms = np.sqrt(np.mean(y[:fr * hop].reshape(fr, hop) ** 2, 1) + 1e-12)
    sp = 20 * np.log10(rms / rms.max()) > rel_db
    segs, i = [], 0
    while i < fr:
        if sp[i]:
            j = i
            while j < fr and sp[j]:
                j += 1
            if segs and (i - segs[-1][1]) * hop / sr < gap:
                segs[-1][1] = j
            else:
                segs.append([i, j])
            i = j
        else:
            i += 1
    return [(a * hop / sr, b * hop / sr) for a, b in segs if (b - a) * hop / sr >= min_len]


def snap(out, segs, max_move=0.8):
    """보정 1: 낱말 시각을 말 구간에 맞춘다(옮기는 거리는 max_move초까지)."""
    def seg_of(t):
        for k, (a, b) in enumerate(segs):
            if a - 0.02 <= t <= b + 0.02:
                return k
        return None
    for w in out:  # ① 쉼 안 시작 → 다음 말소리 시작
        if seg_of(w['start']) is None:
            nxt = [a for a, b in segs if a > w['start']]
            if nxt and nxt[0] - w['start'] <= max_move:
                w['end'] = max(w['end'], nxt[0] + 0.03)
                w['start'] = nxt[0]
    for i, w in enumerate(out[:-1]):  # ③ 문장부호(. , ? !)로 끝나는 낱말 = 쉼 앞 낱말: 끝은 그 말 구간 소리 끝, 다음 낱말은 다음 말소리부터
        if not re.search(r'[.,?!…]$', w['text']):
            continue
        k = seg_of(w['start'])
        if k is None or k + 1 >= len(segs):
            continue
        off, on = segs[k][1], segs[k + 1][0]
        nx = out[i + 1]
        if off - w['end'] <= 1.2 and nx['start'] < on <= nx['start'] + 1.2:  # 문장부호가 근거라 1.2초까지 허용
            w['end'] = off
            nx['start'] = on
            nx['end'] = max(nx['end'], on + 0.03)
    for i, w in enumerate(out):  # ② 말 구간 마지막 낱말 끝 → 구간 소리 끝
        k = seg_of(w['start'])
        if k is None:
            continue
        last = i + 1 >= len(out) or seg_of(out[i + 1]['start']) != k
        if last and abs(segs[k][1] - w['end']) <= max_move:
            w['end'] = segs[k][1]
        if i + 1 < len(out):
            w['end'] = min(w['end'], out[i + 1]['start'])
    return out


def align(audio_path, script, model=None, refine=True):
    import torch
    from qwen_asr.inference.qwen3_forced_aligner import Qwen3ForcedAligner
    y = load_audio(audio_path)
    al = model or Qwen3ForcedAligner.from_pretrained('Qwen/Qwen3-ForcedAligner-0.6B', dtype=torch.float32, device_map='cpu')
    r = al.align(audio=(y, 16000), text=script, language='Korean')
    items = r[0].items if hasattr(r[0], 'items') else r[0]
    # 정렬기 낱말(자체 토큰 단위) → 글자별 시각
    chars = []
    for it in items:
        t = norm(it.text)
        s, e = float(it.start_time), float(it.end_time)
        for k, ch in enumerate(t):
            chars.append((ch, s + (e - s) * k / max(1, len(t)), s + (e - s) * (k + 1) / max(1, len(t))))
    # 대본 낱말에 글자 순서대로 붙임(정렬기는 대본 글자를 그대로 쓰므로 순서가 같다; 다르면 difflib로 맞춤)
    words = script.split()
    wc = ''.join(norm(w) for w in words)
    cc = ''.join(c[0] for c in chars)
    if wc == cc:
        mp = list(range(len(cc)))
    else:
        import difflib
        mp = [None] * len(wc)
        for a0, b0, n in difflib.SequenceMatcher(None, wc, cc, autojunk=False).get_matching_blocks():
            for k in range(n):
                mp[a0 + k] = b0 + k
    out, pos = [], 0
    for w in words:
        n = len(norm(w))
        idx = [mp[i] for i in range(pos, pos + n) if mp[i] is not None]
        pos += n
        if not idx:
            out.append({'text': w, 'start': None, 'end': None})
            continue
        out.append({'text': w, 'start': chars[idx[0]][1], 'end': chars[idx[-1]][2]})
    out = fix(out)
    if refine:
        out = fix(snap(out, speech_segments(y)))
    return out


def fix(out):
    """빈 시각 채우기 + 0초 낱말 보정. 시각은 앞에서 뒤로 줄지 않게 한다."""
    known = [i for i, w in enumerate(out) if w['start'] is not None]
    for i, w in enumerate(out):
        if w['start'] is None:
            lo = max([k for k in known if k < i], default=None)
            hi = min([k for k in known if k > i], default=None)
            a = out[lo]['end'] if lo is not None else (out[hi]['start'] if hi is not None else 0.0)
            b = out[hi]['start'] if hi is not None else a + 0.3
            w['start'], w['end'] = a, b
    for i, w in enumerate(out):
        if w['end'] - w['start'] < MIN_DUR:
            nxt = out[i + 1]['start'] if i + 1 < len(out) else w['start'] + 0.12
            if nxt - w['start'] >= MIN_DUR:
                w['end'] = nxt
            elif i > 0:  # 앞 낱말과 시간을 나눔
                prev = out[i - 1]
                mid = (prev['start'] + w['end'] + max(MIN_DUR, 0.06)) / 2
                mid = max(prev['start'] + MIN_DUR, min(mid, w['start']))
                prev['end'] = mid
                w['start'], w['end'] = mid, max(w['end'], mid + MIN_DUR)
    for w in out:
        w['start'], w['end'] = round(w['start'], 3), round(w['end'], 3)
    return out


if __name__ == '__main__':
    a = [x for x in sys.argv[1:] if not x.startswith('--')]
    audio, txt, dst = a[0], a[1], a[2]
    script = open(txt).read().strip()
    res = align(audio, script, refine='--raw' not in sys.argv)
    zero = sum(1 for w in res if w['end'] - w['start'] < MIN_DUR)
    data = [[w['start'], w['end'], w['text']] for w in res] if '--pairs' in sys.argv else res
    json.dump(data, open(dst, 'w'), ensure_ascii=False)
    print(f'낱말 {len(res)}개 · 0초 낱말 {zero}개 → {dst}')
