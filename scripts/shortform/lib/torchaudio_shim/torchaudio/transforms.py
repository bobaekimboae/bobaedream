import torch


class MelSpectrogram(torch.nn.Module):
    """torchaudio.transforms.MelSpectrogram과 같은 계산(window=hann periodic, center=True, pad_mode=reflect)."""

    def __init__(self, sample_rate=16000, n_fft=400, win_length=None, hop_length=None, f_min=0.0, f_max=None,
                 n_mels=128, power=2.0, normalized=False, norm=None, mel_scale='htk', **_):
        super().__init__()
        import librosa
        self.n_fft = n_fft
        self.win_length = win_length or n_fft
        self.hop_length = hop_length or self.win_length // 2
        self.power = power
        self.normalized = normalized
        self.register_buffer('window', torch.hann_window(self.win_length))
        fb = librosa.filters.mel(sr=sample_rate, n_fft=n_fft, n_mels=n_mels, fmin=f_min,
                                 fmax=f_max if f_max is not None else sample_rate / 2,
                                 htk=(mel_scale == 'htk'), norm=norm)
        self.register_buffer('fb', torch.tensor(fb, dtype=torch.float32))   # (n_mels, n_freqs)

    def forward(self, x):
        spec = torch.stft(x, self.n_fft, hop_length=self.hop_length, win_length=self.win_length,
                          window=self.window.to(x.device), center=True, pad_mode='reflect', return_complex=True)
        if self.normalized in (True, 'window', 'frame_length'):
            spec = spec / self.window.pow(2.).sum().sqrt()
        spec = spec.abs().pow(self.power)
        return torch.matmul(self.fb.to(spec.device), spec)   # (..., n_mels, frames)
