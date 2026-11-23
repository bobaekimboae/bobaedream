"""블록별 내레이션 음성 + 낱말 시각.

edge-tts(마이크로소프트 비공식 접속, 서비스 약관 위험)를 쓰지 않으려고 만든 공용 부품이다(2026-11-24).

음성 만드는 방법(VOICE_ENGINE):
- file(기본): 미리 만든 블록별 음성 파일을 쓴다. 일레븐랩스로 블록마다 한 번씩만 만들고(다시 만들지 않음)
  VOICE_DIR 폴더에 b00.mp3, b01.mp3 … 처럼 블록 번호 순서로 넣는다. wav도 된다.
- melo: MeloTTS-Korean(MIT, 상용 가능)으로 기기 안에서 만든다. `pip install melotts` 후
  `python -m unidic download` 가 필요하다. 속도는 MELO_SPEED(기본 1.1), 화자는 MELO_SPEAKER(기본 KR).

낱말 시각은 두 방법 모두 faster-whisper(MIT)로 받아쓴 뒤, 글자 단위로 대본 낱말에 맞춘다.
받아쓴 글자가 아니라 대본 글자를 화면에 쓰므로 받아쓰기 오타는 자막에 나오지 않는다.
"""
import difflib
import os
import re
import shutil
import subprocess

ENGINE = os.environ.get('VOICE_ENGINE', 'file')
VOICE_DIR = os.environ.get('VOICE_DIR', '')
_WHISPER = None
_MELO = None


def _norm(t):
    return re.sub(r'[^0-9A-Za-z가-힣]', '', t)


def _whisper():
    global _WHISPER
    if _WHISPER is None:
        from faster_whisper import WhisperModel
        _WHISPER = WhisperModel(os.environ.get('WHISPER_MODEL', 'mobiuslabsgmbh/faster-whisper-large-v3-turbo'),
                                device='cpu', compute_type='int8')
    return _WHISPER


def _pcm16k(path):
    """faster-whisper는 파일 경로보다 numpy 배열이 안정적이라 16kHz 모노 float32로 읽는다."""
    import numpy as np
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'])
    return np.frombuffer(raw, np.float32)


def words_of(audio_path, text):
    """음성 파일 + 대본 → [(시작, 끝, 대본 낱말)]. 받아쓰기에서 빠진 낱말은 앞뒤 시각으로 채운다."""
    segs, _ = _whisper().transcribe(_pcm16k(audio_path), language='ko', word_timestamps=True, vad_filter=False)
    sc, st = [], []
    for s in segs:
        for w in (s.words or []):
            t = _norm(w.word)
            for k, ch in enumerate(t):
                sc.append(ch)
                st.append((w.start + (w.end - w.start) * k / max(1, len(t)),
                           w.start + (w.end - w.start) * (k + 1) / max(1, len(t))))
    toks = text.split()
    bc, owner = [], []
    for wi, w in enumerate(toks):
        for ch in _norm(w):
            bc.append(ch)
            owner.append(wi)
    hit = {}
    sm = difflib.SequenceMatcher(None, ''.join(bc), ''.join(sc), autojunk=False)
    for a, b, n in sm.get_matching_blocks():
        for k in range(n):
            hit.setdefault(owner[a + k], []).append(st[b + k])
    out, last = [], 0.0
    for wi, w in enumerate(toks):
        if wi in hit:
            s, e = hit[wi][0][0], hit[wi][-1][1]
        else:  # 받아쓰기에 없는 낱말(숫자 읽기 차이 등): 다음 맞은 낱말 전까지 나눠 준다
            nxt = next((hit[j][0][0] for j in range(wi + 1, len(toks)) if j in hit), last + 0.35)
            s, e = last, max(last + 0.05, nxt)
        s = max(s, last)
        out.append((s, max(e, s + 0.05), w))
        last = out[-1][1]
    return out


def _file_voice(idx, path):
    if not VOICE_DIR:
        raise SystemExit('⛔ VOICE_DIR가 비어 있습니다. 일레븐랩스로 블록마다 한 번 만든 음성을 b00.mp3, b01.mp3 … 로 넣은 폴더를 지정하세요. '
                         '(edge-tts는 비공식 접속이라 더 이상 쓰지 않습니다)')
    for ext in ('mp3', 'wav', 'm4a'):
        src = os.path.join(VOICE_DIR, f'b{idx:02d}.{ext}')
        if os.path.exists(src):
            if os.path.splitext(path)[1].lower() == f'.{ext}':
                shutil.copyfile(src, path)
            else:
                subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', src, path], check=True)
            return
    raise SystemExit(f'⛔ {VOICE_DIR}/b{idx:02d}.mp3(또는 wav)가 없습니다. 블록 {idx}의 음성을 먼저 만들어 넣으세요.')


def _melo_voice(text, path):
    global _MELO
    try:
        from melo.api import TTS
    except ImportError:
        raise SystemExit('⛔ MeloTTS가 없습니다. `pip install melotts` 와 `python -m unidic download` 후 다시 실행하세요.')
    if _MELO is None:
        _MELO = TTS(language='KR', device='cpu')
    spk = _MELO.hps.data.spk2id[os.environ.get('MELO_SPEAKER', 'KR')]
    wav = os.path.splitext(path)[0] + '.melo.wav'
    _MELO.tts_to_file(text, spk, wav, speed=float(os.environ.get('MELO_SPEED', '1.1')), quiet=True)
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', wav, path], check=True)
    os.remove(wav)


def synth_words(text, path, idx):
    """블록 idx의 음성을 path에 놓고 [(시작, 끝, 대본 낱말)]을 돌려준다."""
    if ENGINE == 'melo':
        _melo_voice(text, path)
    elif ENGINE == 'file':
        _file_voice(idx, path)
    else:
        raise SystemExit(f'⛔ VOICE_ENGINE={ENGINE}는 없습니다. file 또는 melo를 쓰세요.')
    return words_of(path, text)
