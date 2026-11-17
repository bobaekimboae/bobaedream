"""렌더 후 매뉴얼 점검(⑥) — 말소리가 나는 동안 자막이 화면에 있는가

python3 check_render.py <차 폴더> <영상.mp4>
- 차 폴더의 voice.wav(속도 적용본)로 말소리 구간(−32dB 넘는 50ms 칸)을 찾고,
- 영상을 초당 8장으로 뽑아 자막 띠(화면 아래 1100~1920)에 노랑 낱말이 있는지 본다.
- 말하는데 노랑이 0.25초 넘게 없는 구간을 적는다(숨 쉬는 틈 0.2초 이하는 무시).
종료 코드 0 = 통과.
"""
import glob, os, subprocess, sys, tempfile, wave
import numpy as np
from PIL import Image


def speech_mask(wav, hop=0.05):
    w = wave.open(wav); sr = w.getframerate()
    a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float)
    if w.getnchannels() > 1:
        a = a.reshape(-1, w.getnchannels()).mean(1)
    n = int(sr * hop)
    rms = np.array([np.sqrt((a[i:i + n] ** 2).mean() + 1e-9) for i in range(0, len(a) - n, n)])
    db = 20 * np.log10(rms / 32768 + 1e-9)
    return db > -32, hop


def main(car, mp4, fps=8):
    sp, hop = speech_mask(os.path.join(car, 'voice.wav'))
    tmp = tempfile.mkdtemp()
    subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-vf', f'fps={fps},crop=1080:820:0:1100,scale=270:205', os.path.join(tmp, 'f%05d.png')], check=True)
    fs = sorted(glob.glob(os.path.join(tmp, 'f*.png')))
    has = []
    for f in fs:
        a = np.asarray(Image.open(f).convert('RGB')).astype(int)
        has.append(((a[..., 0] > 215) & (a[..., 1] > 200) & (a[..., 2] < 120)).sum() > 8)
    bad, run = [], []
    for k, h in enumerate(has):
        t = k / fps
        j = int(t / hop)
        speaking = j < len(sp) and sp[max(0, j - 1):j + 2].any()
        if speaking and not h:
            run.append(t)
        else:
            if len(run) / fps > 0.25:
                bad.append((round(run[0], 2), round(run[-1] + 1 / fps, 2)))
            run = []
    if len(run) / fps > 0.25:
        bad.append((round(run[0], 2), round(run[-1] + 1 / fps, 2)))
    for b in bad:
        print(f'✗ 말하는데 자막 없음: {b[0]}~{b[1]}초')
    print('통과' if not bad else f'고칠 곳 {len(bad)}개')
    return 0 if not bad else 1


if __name__ == '__main__':
    sys.exit(main(os.path.abspath(sys.argv[1]), sys.argv[2]))
