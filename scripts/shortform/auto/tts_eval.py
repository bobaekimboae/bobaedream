"""한국어 TTS 비교 채점 — 받아쓰기 일치율 + DNSMOS.

python3 tts_eval.py 대본.txt dnsmos_sig_bak_ovr.onnx 결과.json 음성1.wav [음성2.wav ...]
- 받아쓰기: faster-whisper large-v3-turbo(MIT), 한국어 고정. 공백·문장부호를 빼고 글자 단위로 비교(CER).
  일치율 = 1 − CER. 숫자는 대본도 한글로 읽은 글자라 받아쓰기가 숫자로 쓰면 틀림으로 셈(세 음성 같은 조건).
- 낱말 확인: '선루프' '부메스터'가 받아쓰기에 그대로 나왔는지.
- DNSMOS: 마이크로소프트 DNS-Challenge P.835 모델(sig_bak_ovr.onnx). 16kHz, 9.01초 창 평균, 다항 보정은 공개 코드 값.
"""
import json
import re
import sys

import numpy as np
import librosa
import onnxruntime as ort
from faster_whisper import WhisperModel

WORDS = ['선루프', '부메스터']


def norm(s):
    return re.sub(r'[\s\.,!?·_\-]', '', s)


def cer(ref, hyp):
    r, h = norm(ref), norm(hyp)
    d = list(range(len(h) + 1))
    for i in range(1, len(r) + 1):
        p, d[0] = d[0], i
        for j in range(1, len(h) + 1):
            p, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, p + (r[i - 1] != h[j - 1]))
    return d[len(h)] / max(1, len(r))


def dnsmos(path, onnx):
    y, _ = librosa.load(path, sr=16000)
    L = int(9.01 * 16000)
    while len(y) < L:
        y = np.concatenate([y, y])
    s = ort.InferenceSession(onnx)
    out = []
    for st in range(0, len(y) - L + 1, 16000):
        seg = y[st:st + L].astype(np.float32)[None]
        sig, bak, ovr = s.run(None, {'input_1': seg})[0][0]
        # dnsmos_local.py 의 비개인화 보정식
        sig = np.poly1d([-0.08397278, 1.22083953, 0.0052439])(sig)
        bak = np.poly1d([-0.13166888, 1.60915514, -0.39604546])(bak)
        ovr = np.poly1d([-0.06766283, 1.11546468, 0.04602535])(ovr)
        out.append((sig, bak, ovr))
    a = np.mean(out, axis=0)
    return {'SIG': round(float(a[0]), 2), 'BAK': round(float(a[1]), 2), 'OVRL': round(float(a[2]), 2)}


def main():
    script, onnx, dst, *wavs = sys.argv[1:]
    ref = open(script).read()
    wm = WhisperModel('mobiuslabsgmbh/faster-whisper-large-v3-turbo', device='cpu', compute_type='int8')
    res = {}
    for w in wavs:
        segs, _ = wm.transcribe(w, language='ko', beam_size=5)
        hyp = ' '.join(s.text.strip() for s in segs)
        c = cer(ref, hyp)
        res[w] = {'match_pct': round((1 - c) * 100, 1), 'cer': round(c, 3),
                  'words': {k: (k in norm(hyp)) for k in WORDS},
                  'dnsmos': dnsmos(w, onnx), 'transcript': hyp,
                  'sec': round(librosa.get_duration(path=w), 1)}
        print(w, res[w]['match_pct'], res[w]['words'], res[w]['dnsmos'], flush=True)
    json.dump(res, open(dst, 'w'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
