import subprocess, numpy as np
SRC='/home/claude/shorts/m235/src.mp4'; CY0=(2336-1920)//2
def read_shot(src, sp, n, cy=CY0):
    vf = f'setpts=(PTS-STARTPTS)/{sp}'
    if sp < 0.95: vf += ',minterpolate=fps=30:mi_mode=blend'
    vf += f',fps=30,crop=1080:1920:0:{cy}'
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(src), '-i', SRC, '-vf', vf, '-frames:v', str(n), '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, 1920, 1080, 3)
    if len(fr) < n: fr = np.concatenate([fr, np.repeat(fr[-1:], n - len(fr), 0)])
    return fr
TOUCH = {'led': (10.2, 0.8), 'xd': (36.1, 0.7), 'trunk': (50.6, 0.8), 'wl': (62.2, 0.8), 'amb': (80.8, 0.55), 'mb': (92.4, 0.8), 'gear': (139.2, 0.7), 'eng': (146.4, 0.7)}
