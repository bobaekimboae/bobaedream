"""문장 하나만 다시 녹음해 끼우기 (매뉴얼 13-10 ⛔ 절차 자동화, 2026-11-18).

사용: python3 revoice_splice.py <차폴더> <새문장.mp3> <첫어절번호> <끝어절번호>
  - <차폴더>/voice_a.mp3 · voice_a_words.json 의 [첫..끝] 어절 구간을 새 문장으로 바꾼다.
  - 앞뒤 문장 사이 가장 조용한 지점에서 자르고, 새 문장은 앞뒤 무음을 걷어 0.12초 여백을 둔다.
  - 새 문장 음량을 원본 말소리(RMS)에 맞춘다.
  - 새 문장만 받아쓰기해 낱말 목록에 넣고 뒤 낱말 시각을 민다.
  - 원본은 voice_a_before_<첫>.mp3 / voice_a_words_before_<첫>.json 으로 남긴다.
  - 출력: 늘어난 낱말 수 d (cfg 낱말 번호 > 끝어절 은 d만큼 민다).
"""
import sys, json, shutil, subprocess, numpy as np

SR = 44100

def load(p):
    a = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'],
                       capture_output=True).stdout
    return np.frombuffer(a, np.int16).astype(np.float32) / 32768

def save(x, p):
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-',
                    '-c:a', 'libmp3lame', '-b:a', '192k', p], input=pcm, check=True)

def quietest(x, t0, t1, win=0.02):
    a, b = int(t0 * SR), int(t1 * SR)
    if b - a < int(win * SR) * 2:
        return (t0 + t1) / 2
    n = int(win * SR); best, bt = 9, (t0 + t1) / 2
    for s in range(a, b - n, n // 2):
        r = float(np.sqrt(np.mean(x[s:s + n] ** 2)))
        if r < best: best, bt = r, (s + n / 2) / SR
    return bt

def trim(x, db=-45):
    th = 10 ** (db / 20); n = int(0.01 * SR)
    e = np.array([np.sqrt(np.mean(x[i:i + n] ** 2)) for i in range(0, len(x) - n, n)])
    idx = np.where(e > th)[0]
    return x[idx[0] * n: (idx[-1] + 1) * n + n] if len(idx) else x

def speech_rms(x):
    n = int(0.03 * SR)
    e = np.array([np.sqrt(np.mean(x[i:i + n] ** 2)) for i in range(0, len(x) - n, n)])
    return float(np.median(e[e > 0.02])) if (e > 0.02).any() else float(e.max())

def transcribe(x):
    from faster_whisper import WhisperModel
    m = WhisperModel('mobiuslabsgmbh/faster-whisper-large-v3-turbo', device='cpu', compute_type='int8')
    y = x[::1] if SR == 16000 else np.interp(np.arange(0, len(x), SR / 16000), np.arange(len(x)), x).astype(np.float32)
    segs, _ = m.transcribe(y, language='ko', word_timestamps=True)
    return [[round(w.start, 3), round(w.end, 3), w.word.strip()] for s in segs for w in s.words]

def main(car, new_mp3, a, b):
    a, b = int(a), int(b)
    W = json.load(open(f'{car}/voice_a_words.json'))
    shutil.copy(f'{car}/voice_a.mp3', f'{car}/voice_a_before_{a}.mp3')
    shutil.copy(f'{car}/voice_a_words.json', f'{car}/voice_a_words_before_{a}.json')
    x = load(f'{car}/voice_a.mp3')
    c1 = quietest(x, W[a - 1][1], W[a][0]) if a > 0 else 0.0
    c2 = quietest(x, W[b][1], W[b + 1][0]) if b + 1 < len(W) else len(x) / SR
    n = trim(load(new_mp3))
    n *= speech_rms(x[int(c1 * SR) - 5 * SR if c1 > 5 else 0: int(c2 * SR) + 5 * SR]) / max(1e-6, speech_rms(n))
    pad = np.zeros(int(0.12 * SR), np.float32)
    seg = np.concatenate([pad, n, pad])
    out = np.concatenate([x[:int(c1 * SR)], seg, x[int(c2 * SR):]])
    save(out, f'{car}/voice_a.mp3')
    nw = transcribe(seg)
    shift = len(seg) / SR - (c2 - c1)
    NW = W[:a] + [[round(s + c1, 3), round(e + c1, 3), t] for s, e, t in nw] + \
         [[round(s + shift, 3), round(e + shift, 3), t] for s, e, t in W[b + 1:]]
    json.dump(NW, open(f'{car}/voice_a_words.json', 'w'), ensure_ascii=False)
    d = len(nw) - (b - a + 1)
    print(json.dumps({'cut': [round(c1, 3), round(c2, 3)], 'time_shift': round(shift, 3),
                      'index_shift': d, 'new_words': [f'{a + i}:{w[2]}' for i, w in enumerate(nw)]},
                     ensure_ascii=False))

if __name__ == '__main__':
    main(*sys.argv[1:5])
