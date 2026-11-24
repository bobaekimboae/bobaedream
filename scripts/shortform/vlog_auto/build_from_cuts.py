# 날것 편집표(vlog_raw edl) → 벨기에판 브이로그 작업 폴더(vlog_auto render.py 입력) 만들기
#  1) 컷마다 장면 조각(seg/k.mp4, 1080x1920 30fps)을 자름
#  2) 컷 소리만 다시 받아쓰기(large-v3-turbo, beam 5, 이름·장소 힌트) → 자막 글자와 낱말 시각이 같은 출처라 씽크가 정확
#  3) 자막 덩어리는 말 사이 쉼(0.35초 이상)·뜻 단위로 나눔(어절 수 기계 분할 금지), 추임새는 뺌
#  실행: python3 build_from_cuts.py raw_edl.json 작업폴더 [meta.json]
import os, sys, json, subprocess
RAW, OUT = sys.argv[1], sys.argv[2]
META = json.load(open(sys.argv[3])) if len(sys.argv) > 3 else {}
e = json.load(open(RAW)); os.makedirs(OUT + '/seg', exist_ok=True)
FIX = e.get('fix', {}); FILL = set(e.get('filler', ['응', '아하', '에휴', '하하', '아', '오', '음', '어', '네네네네']))
PROMPT = META.pop('stt_prompt', '')
from faster_whisper import WhisperModel
m = WhisperModel('large-v3-turbo', device='cpu', compute_type='int8', cpu_threads=2)

def chunks(words):
    out, cur = [], []
    for w in words:
        t = w[0].strip()
        if not t or t.strip(' .,?!~') in FILL: continue
        if cur and (w[1] - cur[-1][2] > 0.35 or len(' '.join(x[0] for x in cur)) + len(t) > 15 or cur[-1][0].endswith(('.', '?', '!'))):
            out.append(cur); cur = []
        cur.append([t, w[1], w[2]])
    if cur: out.append(cur)
    return out

items, order, stt = {}, [], {}
for i, c in enumerate(e['cuts']):
    k = f'i{i:02d}'; a, b = c['a'], c['b']; seg = f'{OUT}/seg/{k}.mp4'
    vf = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,setsar=1' + (',drawbox=c=black:t=fill' if c.get('black') else '')
    g = c.get('gain', 1.0)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', f"{a - c.get('off', 0):.3f}", '-t', f'{b - a:.3f}', '-i', c['file'], '-vf', vf, '-af', f'volume={g}',
                    '-t', f'{b - a:.3f}', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', '30',
                    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', seg], check=True)
    capt = ''; stt[k] = []
    if not c.get('nocap'):
        import numpy as np
        pcm = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', seg, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
        wav = np.frombuffer(pcm, np.float32).copy()
        segs, _ = m.transcribe(wav, language='ko', beam_size=5, word_timestamps=True, vad_filter=False, condition_on_previous_text=False,
                               initial_prompt=PROMPT or None, no_speech_threshold=0.5)
        words = [(w.word, a + w.start, a + w.end) for s in segs if s.no_speech_prob < 0.7 and s.avg_logprob > -1.0 for w in s.words]
        drop = [x for x in c.get('drop_words', [])]   # 편집자가 빼라고 한 받아쓰기 덩어리(헛들림)
        ch = [x for x in chunks(words) if ' '.join(w[0] for w in x) not in drop]
        stt[k] = [dict(s=x[0][1], e=x[-1][2], t=' '.join(w[0] for w in x), w=x) for x in ch]
        capt = '|'.join(' '.join(w[0] for w in x) for x in ch)
        for s0, s1 in FIX.items(): capt = capt.replace(s0, s1)
        for x in stt[k]:
            for w in x['w']:
                for s0, s1 in FIX.items():
                    if s0 in w[0]: w[0] = w[0].replace(s0, s1)
    fx = c.get('fx') or ('zoom' if c.get('zoom') else '')
    items[k] = dict(clip=k, s=a, e=b, cap=capt, chip=c.get('chip'), fx=fx)
    order.append(k)
    print(k, c['clip'], a, b, fx, c.get('chip') or '', '|', capt, flush=True)
json.dump(stt, open(OUT + '/stt.json', 'w'), ensure_ascii=False)
json.dump(dict(meta=META, items=items, versions={'300': order}), open(OUT + '/edl.json', 'w'), ensure_ascii=False, indent=1)
