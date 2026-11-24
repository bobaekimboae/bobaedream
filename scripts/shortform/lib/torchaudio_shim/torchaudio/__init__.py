"""torchaudio 대체 모듈(2026-11-25) — Beat This!가 쓰는 load()와 transforms.MelSpectrogram 두 가지만.

torch 2.15용 torchaudio 정식판이 아직 없어 Beat This!(MIT) 전처리만 같은 계산으로 대신한다.
- MelSpectrogram: torch.stft(hann, center=True, reflect) + librosa 멜 필터(slaney, norm=None) — torchaudio 기본값과 같은 식
- load: ffmpeg로 float32 PCM 디코드(mp3·wav 모두), 반환 (T, C) 텐서·샘플레이트 (channels_first=False 기준)
정식 torchaudio가 깔리면 이 폴더를 sys.path에 넣지 않으면 된다(common.py는 진짜 torchaudio가 있으면 그것을 씀).
"""
import subprocess
import numpy as np
import torch
from . import transforms  # noqa: F401

__shim__ = True


def load(path, channels_first=True, **_):
    sr = int(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=sample_rate',
                             '-of', 'csv=p=0', str(path)], capture_output=True, text=True, check=True).stdout.split()[0])
    ch = int(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=channels',
                             '-of', 'csv=p=0', str(path)], capture_output=True, text=True, check=True).stdout.split()[0])
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 'f32le', '-acodec', 'pcm_f32le', '-'],
                         capture_output=True, check=True).stdout
    x = torch.from_numpy(np.frombuffer(raw, dtype=np.float32).copy().reshape(-1, ch))
    return (x.T.contiguous() if channels_first else x), sr
