"""딜러 육성(딜러가 직접 말한 원본 소리) 잡음 제거 — DeepFilterNet3 공식 실행 파일 deep-filter 0.5.6. 2026-11-25

쓰는 곳: 딜러가 직접 말한 원본 소리를 영상에 섞기 **직전**에만.
쓰지 않는 곳: ElevenLabs 음성(이미 깨끗함 — 걸면 음색이 깎인다), 받아쓰기(faster-whisper·Qwen 정렬) 전처리.
시험(2026-11-25, RS3 원본): 말 없는 구간 잡음 약 40dB 감소, 음성 보존 +6~10dB.
너무 깨끗해 어색하면 atten_db=18(-a 18: 잡음을 18dB까지만 줄임). 음량 기준은 be_locked_rules.json(섞은 뒤 loudnorm).

python3 dealer_voice.py 입력(영상·음성 아무거나) [출력.wav] [--atten 18]
"""
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))


def _ensure():
    if not shutil.which('deep-filter'):
        subprocess.run(['bash', os.path.join(HERE, 'install_deep_filter.sh')], check=True)


def denoise(src, out=None, atten_db=None):
    """src(영상 또는 음성) → 잡음 뺀 48kHz 모노 wav 경로. 같은 입력·설정이면 다시 돌리지 않는다."""
    _ensure()
    src = os.path.abspath(src)
    if out is None:
        stem = os.path.splitext(src)[0]
        out = f'{stem}.dfn{"" if atten_db is None else f"_a{int(atten_db)}"}.wav'
    if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(src):
        return out
    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, 'in.wav')   # deep-filter는 48kHz wav만 받는다
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-vn', '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', wav], check=True)
        cmd = ['deep-filter', '-D', '-o', td]
        if atten_db is not None:
            cmd += ['-a', str(atten_db)]
        subprocess.run(cmd + [wav], check=True, capture_output=True)
        res = os.path.join(td, 'in.wav') if not os.path.exists(os.path.join(td, 'in_DeepFilterNet3.wav')) else os.path.join(td, 'in_DeepFilterNet3.wav')
        cand = [f for f in os.listdir(td) if f != 'in.wav' and f.endswith('.wav')]
        if cand:
            res = os.path.join(td, cand[0])
        shutil.move(res, out)
    return out


if __name__ == '__main__':
    a = [x for x in sys.argv[1:] if not x.startswith('--')]
    at = float(sys.argv[sys.argv.index('--atten') + 1]) if '--atten' in sys.argv else None
    if at is not None:
        a = [x for x in a if x != str(sys.argv[sys.argv.index('--atten') + 1])]
    print(denoise(a[0], a[1] if len(a) > 1 else None, at))
