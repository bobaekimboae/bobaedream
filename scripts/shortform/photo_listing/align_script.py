"""대본이 있는 내레이션(ElevenLabs)의 낱말 시각 — Qwen3-ForcedAligner-0.6B(Apache-2.0). 2026-11-25

python3 align_script.py <차 폴더> [대본.txt]     # 기본 대본: 차 폴더의 tts.txt → script.txt
  입력: <차 폴더>/voice_a.mp3 + 대본 글자
  출력: <차 폴더>/voice_a_words.json  [[시작초, 끝초, 어절], ...]  (tr.py와 같은 형식 — 렌더러 수정 없이 씀)

- faster-whisper(tr.py)는 다시 받아써서 글자가 틀린다(「시트」→「시프트」, 숫자 바뀜). 이 도구는 대본 글자를 그대로 두고 시각만 붙인다.
  시험(RS3 38.9초): 쉼 뒤 소리 시작 17곳 기준 차이 중앙값 100ms → 20ms, 100ms 안 47% → 88%, 대본 214자 100%.
- 대본이 없는 딜러 육성은 지금처럼 tr.py(faster-whisper).
- qwen-asr 0.0.6이 transformers 4.57.6을 고정으로 요구해 별도 가상환경(/opt/qwen-align, --system-site-packages)에서 돈다.
  이 파일을 작업공간 기본 파이썬으로 실행하면 가상환경 파이썬으로 자기 자신을 다시 실행한다. 설치: bash ../lib/install_qwen_align.sh
- 모델은 낱말을 soynlp로 쪼개 시각을 주므로(「정보 입니다」), 여기서 대본 어절(띄어쓰기) 단위로 다시 묶는다.
- 길이 5분 이하.
- 쉼 맞춤(2026-11-25 클로드코드, 기본 켬 · ALIGN_SNAP=0이면 끔): 모델은 문장 끝 어절을 짧게 자르고(「원이었습니다.」 0.16초인데
  실제 소리 0.7초) 쉼을 다음 어절 시작에 붙인다. 소리 크기로 찾은 말 구간에 맞춰 ① 쉼 안에서 시작하는 어절은 다음 말소리 시작으로
  ② 문장부호로 끝나는 어절은 끝을 그 말 구간 소리 끝, 다음 어절 시작을 다음 말소리 시작으로 ③ 말 구간 마지막 어절 끝을 구간 소리 끝으로.
  0.03초 미만 어절은 다음 어절 시작까지 늘린다. 매물 3건(rs3·e450·x6m) 쉼 경계 오차: 최대 0.28~0.68초 → 0.05~0.12초(-40dB 기준).
"""
import json
import os
import re
import subprocess
import sys

VENV = os.environ.get('QWEN_ALIGN_VENV', '/opt/qwen-align')
MODEL = os.environ.get('QWEN_ALIGN_MODEL', 'Qwen/Qwen3-ForcedAligner-0.6B')
HERE = os.path.dirname(os.path.abspath(__file__))


def _norm(t):
    return re.sub(r'[^0-9A-Za-z가-힣]', '', t)


def regroup(items, script):
    """aligner 토큰 [(글자, 시작, 끝)] → 대본 어절 [[시작, 끝, 어절]]. 글자 순서로 짝지어 어절 첫 글자 시작 ~ 끝 글자 끝."""
    chars = []   # 토큰 글자마다 (시작, 끝)
    for t, s, e in items:
        n = _norm(t)
        for k in range(len(n)):
            chars.append((n[k], s + (e - s) * k / len(n), s + (e - s) * (k + 1) / len(n)))
    out, ci = [], 0
    for w in script.split():
        n = _norm(w)
        if not n:   # 기호만 있는 어절은 앞 어절에 붙임
            if out:
                out[-1][2] += w
            continue
        seg = []
        for ch in n:
            while ci < len(chars) and chars[ci][0] != ch:
                ci += 1
            if ci < len(chars):
                seg.append(chars[ci]); ci += 1
        if seg:
            out.append([round(seg[0][1], 3), round(seg[-1][2], 3), w])
        elif out:   # 못 찾은 어절: 앞 어절 끝에 이어 붙임(시각 0.08초)
            out.append([out[-1][1], round(out[-1][1] + 0.08, 3), w])
        else:
            out.append([0.0, 0.08, w])
    return out


def speech_segments(x, sr=16000, hop=160, rel_db=-40, gap=0.15, min_len=0.06):
    """소리 크기로 말 구간 [(시작, 끝)] — gap초 미만 쉼은 이어 붙인다."""
    import numpy as np
    fr = len(x) // hop
    rms = np.sqrt(np.mean(x[:fr * hop].reshape(fr, hop) ** 2, 1) + 1e-12)
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


def snap(W, segs, move=0.8, move_punct=1.2):
    """[[시작, 끝, 어절]]을 말 구간에 맞춘다(위 「쉼 맞춤」)."""
    def seg_of(t):
        for k, (a, b) in enumerate(segs):
            if a - 0.02 <= t <= b + 0.02:
                return k
        return None
    for w in W:  # ① 쉼 안 시작
        if seg_of(w[0]) is None:
            nxt = [a for a, b in segs if a > w[0]]
            if nxt and nxt[0] - w[0] <= move:
                w[1] = max(w[1], nxt[0] + 0.03); w[0] = nxt[0]
    for i in range(len(W) - 1):  # ② 문장부호 어절
        w, nx = W[i], W[i + 1]
        k = seg_of(w[0])
        if not re.search(r'[.,?!…]$', w[2]) or k is None or k + 1 >= len(segs):
            continue
        off, on = segs[k][1], segs[k + 1][0]
        if off - w[1] <= move_punct and nx[0] < on <= nx[0] + move_punct:
            w[1] = off; nx[0] = on; nx[1] = max(nx[1], on + 0.03)
    for i, w in enumerate(W):  # ③ 말 구간 마지막 어절
        k = seg_of(w[0])
        if k is not None and (i + 1 == len(W) or seg_of(W[i + 1][0]) != k) and abs(segs[k][1] - w[1]) <= move:
            w[1] = segs[k][1]
        if i + 1 < len(W):
            w[1] = min(w[1], W[i + 1][0])
    for i, w in enumerate(W):  # 0초 어절
        if w[1] - w[0] < 0.03:
            w[1] = W[i + 1][0] if i + 1 < len(W) and W[i + 1][0] - w[0] >= 0.03 else w[0] + 0.06
    for w in W:
        w[0], w[1] = round(w[0], 3), round(w[1], 3)
    return W


def load16k(audio):
    import numpy as np
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', audio, '-f', 's16le', '-ac', '1', '-ar', '16000', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768


def align(audio, script):
    import numpy as np
    import torch
    from qwen_asr import Qwen3ForcedAligner
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', audio, '-f', 's16le', '-ac', '1', '-ar', '16000', '-'],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    if len(x) > 16000 * 300:
        raise SystemExit('5분이 넘는 음성은 나눠서 맞춰 주세요(Qwen3-ForcedAligner 한도).')
    m = Qwen3ForcedAligner.from_pretrained(MODEL, dtype=torch.float32, device_map='cpu')
    r = m.align(audio=(x, 16000), text=script, language='Korean')[0]
    return [(it.text, it.start_time, it.end_time) for it in r.items]


def main(car, script_path=None):
    car = os.path.abspath(car)
    if not script_path:
        script_path = next((os.path.join(car, f) for f in ('tts.txt', 'script.txt') if os.path.exists(os.path.join(car, f))), None)
    if not script_path:
        raise SystemExit('대본(tts.txt/script.txt)이 없습니다 — 대본 없는 딜러 육성은 tr.py(faster-whisper)를 쓰세요.')
    script = ' '.join(open(script_path, encoding='utf-8').read().split())
    script = re.sub(r'\[[^\]]*\]', ' ', script)   # ElevenLabs 태그([calm] 등)는 읽지 않으므로 뺌
    script = ' '.join(script.split())
    items = align(os.path.join(car, 'voice_a.mp3'), script)
    W = regroup(items, script)
    if os.environ.get('ALIGN_SNAP', '1') != '0':
        W = snap(W, speech_segments(load16k(os.path.join(car, 'voice_a.mp3'))))
    json.dump(W, open(os.path.join(car, 'voice_a_words.json'), 'w'), ensure_ascii=False)
    print('==', car, len(W), '어절 · 도구 Qwen3-ForcedAligner-0.6B', '+ 쉼 맞춤' if os.environ.get('ALIGN_SNAP', '1') != '0' else '')
    print(' '.join(f'{i}:{w[2]}' for i, w in enumerate(W)))


if __name__ == '__main__':
    try:
        import qwen_asr  # noqa: F401
    except ImportError:
        py = os.path.join(VENV, 'bin', 'python')
        if not os.path.exists(py):
            raise SystemExit(f'가상환경 {VENV}가 없습니다 — bash {os.path.join(HERE, "..", "lib", "install_qwen_align.sh")}')
        os.execv(py, [py, os.path.abspath(__file__), *sys.argv[1:]])
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
