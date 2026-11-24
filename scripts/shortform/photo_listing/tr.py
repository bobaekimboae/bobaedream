"""음성 낱말 시각 → <차폴더>/voice_a_words.json ([[시작, 끝, 낱말]]).

기본: faster-whisper large-v3-turbo 받아쓰기 시각(지금까지 방식).
BBM_ALIGN=qwen: 대본(<차폴더>/tts.txt) 글자 그대로 Qwen3-ForcedAligner로 시각을 맞춘다(auto/align_words.py, 쉼 맞춤 포함).
  2026-11-25 매물 3건(rs3·e450·x6m) 쉼 경계 기준 평균 오차 0.004~0.065초(받아쓰기 0.18~0.33초), 0초 낱말 0개.
  qwen-asr가 든 파이썬을 BBM_ALIGN_PY로 지정(기본 /tmp/qaenv/bin/python). 낱말 번호는 대본 띄어쓰기 순서가 된다.
"""
import json, os, subprocess, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ALIGN = os.path.join(HERE, '..', 'auto', 'align_words.py')

if os.environ.get('BBM_ALIGN') == 'qwen':
    py = os.environ.get('BBM_ALIGN_PY', '/tmp/qaenv/bin/python')
    for k in sys.argv[1:]:
        subprocess.run([py, '-I', ALIGN, f'{k}/voice_a.mp3', f'{k}/tts.txt', f'{k}/voice_a_words.json', '--pairs'], check=True)
        W = json.load(open(f'{k}/voice_a_words.json'))
        print('==', k, len(W)); print(' '.join(f'{i}:{w[2]}' for i, w in enumerate(W)))
    sys.exit(0)

from faster_whisper import WhisperModel
m = WhisperModel('mobiuslabsgmbh/faster-whisper-large-v3-turbo', device='cpu', compute_type='int8')
for k in sys.argv[1:]:
    a = subprocess.run(['ffmpeg', '-v', 'error', '-i', f'{k}/voice_a.mp3', '-f', 's16le', '-ac', '1', '-ar', '16000', '-'], capture_output=True).stdout
    x = np.frombuffer(a, np.int16).astype(np.float32) / 32768
    segs, _ = m.transcribe(x, language='ko', word_timestamps=True)
    W = [[round(w.start, 3), round(w.end, 3), w.word.strip()] for s in segs for w in s.words]
    json.dump(W, open(f'{k}/voice_a_words.json', 'w'), ensure_ascii=False)
    print('==', k, len(W), round(len(x) / 16000, 1)); print(' '.join(f'{i}:{w[2]}' for i, w in enumerate(W)))
