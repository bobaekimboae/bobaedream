"""1번 시험 — 도구별 낱말 시각 뽑기 (2026-11-25, 시안 마스터)

같은 20개 클립(clips/*.mp3)과 대본(sentences20.json)에 도구를 하나씩 돌려 results/<도구>.json 으로 저장한다.
  results/<도구>.json = {클립 id: {"seconds": 처리 시간, "tokens": [[글자, 시작, 끝], ...]}}

  B  faster-whisper large-v3-turbo 낱말 시각(받아쓰기, 대본 안 씀)   python3 run_tools.py B
  C  align_ko.py (wav2vec2 한국어 CTC 강제 정렬, 대본 씀)             python3 run_tools.py C
  D  Qwen3-ForcedAligner-0.6B (대본 씀)                               /opt/qwen-align/bin/python run_tools.py D

시각은 모두 클립 기준 초. 음성·대본 파일은 고치지 않는다.
"""
import json
import os
import subprocess
import sys
import time

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))


def load16k(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def main(tool):
    rows = json.load(open(os.path.join(HERE, 'sentences20.json')))
    out = {}
    if tool == 'B':
        from faster_whisper import WhisperModel
        m = WhisperModel('mobiuslabsgmbh/faster-whisper-large-v3-turbo', device='cpu', compute_type='int8')
        run = lambda a, text: [[w.word.strip(), round(w.start, 3), round(w.end, 3)]
                               for s in m.transcribe(a, language='ko', word_timestamps=True)[0] for w in s.words]
    elif tool == 'C':
        sys.path.insert(0, os.path.join(REPO, 'scripts', 'shortform'))
        from align_ko import align_words
        run = lambda a, text: [[w, round(s, 3), round(e, 3)] for s, e, w in align_words(a, text)]
    elif tool == 'D':
        import torch
        from qwen_asr import Qwen3ForcedAligner
        torch.set_num_threads(os.cpu_count() or 2)
        m = Qwen3ForcedAligner.from_pretrained('Qwen/Qwen3-ForcedAligner-0.6B', dtype=torch.float32)
        run = lambda a, text: [[it.text, it.start_time, it.end_time]
                               for it in m.align(audio=(a, 16000), text=text, language='Korean')[0].items]
    else:
        raise SystemExit('도구는 B · C · D')
    for r in rows:
        a = load16k(os.path.join(HERE, r['clip_file']))
        t0 = time.time()
        toks = run(a, r['text'])
        out[r['id']] = {'seconds': round(time.time() - t0, 3), 'tokens': toks}
        print(r['id'], len(toks), out[r['id']]['seconds'], flush=True)
    os.makedirs(os.path.join(HERE, 'results'), exist_ok=True)
    json.dump(out, open(os.path.join(HERE, 'results', f'{tool}.json'), 'w'), ensure_ascii=False, indent=0)


if __name__ == '__main__':
    main(sys.argv[1])
