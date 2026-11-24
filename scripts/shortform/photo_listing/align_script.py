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
    json.dump(W, open(os.path.join(car, 'voice_a_words.json'), 'w'), ensure_ascii=False)
    print('==', car, len(W), '어절 · 도구 Qwen3-ForcedAligner-0.6B')
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
