"""블록별 내레이션 음성 + 낱말 시각.

비공식 음성 접속을 쓰지 않으려고 만든 공용 부품이다(2026-11-24). 음성 엔진은 실험 중이라 코드에 고정하지 않는다(2026-11-25 최종 지시 v2).

음성: 설정값으로만 받는다. VOICE_DIR 폴더에 미리 만든 블록별 음성(b00.mp3, b01.mp3 …, wav도 됨)을 넣는다.
어떤 목소리·모델로 만들지는 설정 쪽에서 정한다(일레븐랩스는 블록마다 한 번만 생성). 설정이 없으면 렌더를 멈추고 알린다.
MeloTTS는 2026-11-25 「쓰지 않는 것」에 들어가 뺐다.

낱말 시각은 faster-whisper(MIT)로 받아쓴 뒤, 글자 단위로 대본 낱말에 맞춘다.
받아쓴 글자가 아니라 대본 글자를 화면에 쓰므로 받아쓰기 오타는 자막에 나오지 않는다.
받아쓰기에서 빠진 낱말(r11의 제로백처럼)은 align_ko.py(WhisperX식 강제 정렬, wav2vec2 한국어)로 채운다.
VOICE_ALIGN=off면 예전처럼 앞뒤 낱말 사이로 나눠 채운다.
"""
import difflib
import os
import re
import shutil
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

VOICE_DIR = os.environ.get('VOICE_DIR', '')
_WHISPER = None


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
    missing = [wi for wi in range(len(toks)) if wi not in hit]
    aligned = None
    if missing and os.environ.get('VOICE_ALIGN', 'auto') != 'off':
        # 받아쓰기에서 빠진 낱말은 강제 정렬(align_ko, WhisperX 방식) 시각으로 채운다.
        # 정렬은 글자 확률 꼭대기를 잡아 실제 소리보다 약 0.09초 늦어서 그만큼 당긴다(로마 110낱말 실측 중앙값).
        try:
            import align_ko
            shift = float(os.environ.get('ALIGN_SHIFT', '0.09'))
            res = align_ko.align_words(_pcm16k(audio_path), text)
            if res:
                aligned = {wi: (max(0.0, res[wi][0] - shift), res[wi][1]) for wi in missing}
        except Exception as e:  # 정렬 모델이 없으면 예전 방식(앞뒤 나눠 채우기)
            print(f'[낱말 시각] 강제 정렬을 못 해서 앞뒤로 채움: {e}')
    words_of.last_missing = [toks[wi] for wi in missing]
    out, last = [], 0.0
    for wi, w in enumerate(toks):
        if aligned and wi in aligned:
            s, e = aligned[wi]
            nxt = next((hit[j][0][0] for j in range(wi + 1, len(toks)) if j in hit), e)
            e = min(e, nxt) if nxt > s else e
        elif wi in hit:
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
        raise SystemExit('⛔ VOICE_DIR가 비어 있습니다. 일레븐랩스로 블록마다 한 번 만든 음성을 b00.mp3, b01.mp3 … 로 넣은 폴더를 지정하세요. ')
    for ext in ('mp3', 'wav', 'm4a'):
        src = os.path.join(VOICE_DIR, f'b{idx:02d}.{ext}')
        if os.path.exists(src):
            if os.path.splitext(path)[1].lower() == f'.{ext}':
                shutil.copyfile(src, path)
            else:
                subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', src, path], check=True)
            return
    raise SystemExit(f'⛔ {VOICE_DIR}/b{idx:02d}.mp3(또는 wav)가 없습니다. 블록 {idx}의 음성을 먼저 만들어 넣으세요.')



def synth_words(text, path, idx):
    """블록 idx의 음성을 path에 놓고 [(시작, 끝, 대본 낱말)]을 돌려준다."""
    _file_voice(idx, path)
    return words_of(path, text)
