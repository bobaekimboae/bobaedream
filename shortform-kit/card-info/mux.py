#!/usr/bin/env python3
"""카드 숏폼 효과음 합성: 장면 시작마다 휙(whoosh), 카드가 뜬 뒤 0.5초에 틱.
사용법: python3 mux.py <silent.mp4> <out.mp4> <장면길이초,...>  예) 3.0,3.6,3.6,...,3.0"""
import subprocess, sys, os
src, out, durs = sys.argv[1], sys.argv[2], [float(x) for x in sys.argv[3].split(',')]
here = os.path.dirname(os.path.abspath(__file__))
w, t = f"{here}/sfx/whoosh.wav", f"{here}/sfx/tick.wav"
starts, acc = [], 0.0
for d in durs:
    starts.append(acc); acc += d
inputs, filt, labels = ['-i', src], [], []
k = 1
for s in starts:
    for f, off in ((w, 0.0), (t, 0.5)):
        inputs += ['-i', f]
        ms = int((s + off) * 1000)
        filt.append(f"[{k}:a]adelay={ms}|{ms}[a{k}]"); labels.append(f"[a{k}]"); k += 1
filt.append(f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0,apad,atrim=0:{acc}[aout]")
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *inputs, '-filter_complex', ';'.join(filt),
                '-map', '0:v', '-map', '[aout]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', out], check=True)
print('ok', out)
