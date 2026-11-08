"""서울오토갤러리 딜러 인스타 릴스 자동 제작 v1 (로컬 파이프라인).

입력: 딜러가 찍은 매물 원본 영상 1개 + 매물 정보(사실만).
흐름: 대본(사실만) → TTS(어절 시각) → 원본에서 부위별 구간 고르기 → 1.6초 안팎 컷 편집(속도·푸시인)
     → 번호판 자동 가림(LPD-YuNet) → 구절 자막(읽는 단어 노랑) · 파랑 키워드 스티커 · 진행선 → 끝 카드
     → 코드로 만든 배경음악 + 목소리 자동 덕킹 → -14 LUFS → 1080×1920 30fps mp4.

실행: python3 scripts/shortform/sag_reel_v1.py <원본.mp4> <출력폴더>
TTS: GOOGLE_TTS=1 이고 GOOGLE_APPLICATION_CREDENTIALS(또는 GOOGLE_TTS_API_KEY)가 있으면 구글 Chirp3-HD 음성, 없으면 edge-tts 임시 음성.
"""
import asyncio, json, math, os, re, subprocess, sys, time
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter

sys.path.insert(0, os.path.dirname(__file__))
import plate_yunet

SRC = sys.argv[1]
OUT = sys.argv[2]
os.makedirs(OUT, exist_ok=True)
W, H, FPS = 1080, 1920, 30
FONTS = os.path.join(os.path.dirname(__file__), 'fonts')  # Pretendard 1.3.9 (OFL)
BLACK = os.path.join(FONTS, 'Pretendard-ExtraBold.otf')
BOLD = os.path.join(FONTS, 'Pretendard-Bold.otf')
SEMI = os.path.join(FONTS, 'Pretendard-SemiBold.otf')
MED = os.path.join(FONTS, 'Pretendard-Medium.otf')
YELLOW = (255, 214, 10)
# 음성: edge-tts 현수(멀티링구얼, 인준보다 억양이 자연스러움). 구글 Chirp 3: HD 키가 생기면 이 자리만 바꾼다
VOICE, VOICE_RATE = os.environ.get('SAG_VOICE', 'ko-KR-HyunsuMultilingualNeural'), os.environ.get('SAG_VOICE_RATE', '+8%')
# 릴스·쇼츠·틱톡 공통 세이프존(1080×1920): 위·아래 240, 오른쪽 216(버튼 줄), 좌우 끝 54 — 자막은 이 안의 가운데
SAFE_TOP, SAFE_BOTTOM, SAFE_L, SAFE_R = 240, 1920 - 240, 54, 1080 - 216
PLATE_COVER = os.environ.get('SAG_PLATE_COVER', '0') == '1'
SAFE_W, SAFE_CX = SAFE_R - SAFE_L, (SAFE_L + SAFE_R) / 2
BLUE = (48, 107, 217)
EMOJI_FONT = '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf'  # 구글 Noto Color Emoji(OFL)
# 화면 스타일(샘플마다 SAG_CONFIG 파일에서 바꿀 수 있음). 기본값 = 1번 샘플(파나메라)
STYLE = dict(stk_bg=BLUE, stk_fg=(255, 255, 255), hl='text',  # hl: text = 읽는 단어 노랑 글자 / chip = 파랑 바탕 흰 글자
             feat_size=68, big_size=116, pad=(0.95, 2.1), big_pad=(0.95, 2.1),  # pad: (양옆 여백, 상자 높이) × 글자 높이
             feat_y=1120, big_y=760)

# ── 매물 정보(사실만, 시트 그대로). 차량번호·연락처는 넣지 않는다 ──
CAR = dict(name='포르쉐 파나메라 4', gen='971', year='2021', reg='21년04월', km='38,276km', km_short='3.8만km',
           fuel='가솔린', cc='2,894cc', drive='AWD', price='9,200만원', color='블루', region='경기')

# ── 대본: 숫자 훅 → 차명 → 외관 → 실내 → 옵션 → 조건·DM (선우혁 6단계). 사진·정보에 없는 말은 쓰지 않는다 ──
# shots: (원본 시작 초, 재생 속도, 번호판 가림 필요)
BLOCKS = [
    dict(sec='외관', tts='오늘 리뷰할 차는 포르쉐 파나메라 포입니다. 가격은 9,200만 원.',
         caps=['오늘 리뷰할 차는', '포르쉐 파나메라 4입니다', '가격은 9,200만 원'], shots=[(2.0, 1.2, 1), (4.2, 1.3, 1), (0.6, 1.0, 1)], hook=True),
    dict(sec='외관', tts='2021년식, 코드네임 구칠일 2세대 모델이고, 2.9 트윈터보 가솔린에 사륜구동입니다.',
         caps=['2021년식 코드네임 971', '2세대 모델이고', '2.9 트윈터보 가솔린에 사륜구동입니다'], shots=[(5.0, 1.25, 1), (6.6, 1.25, 1)],
         stickers=[('코드네임 971', 0), ('2.9 트윈터보 · AWD', 2)]),
    dict(sec='외관', tts='디자인부터 보시죠. 컬러는 짙은 블루, 지붕이 뒤로 길게 떨어지는 패스트백 라인입니다.',
         caps=['디자인부터 보시죠', '컬러는 짙은 블루', '지붕이 뒤로 길게 떨어지는', '패스트백 라인입니다'],
         shots=[(3.2, 1.1, 1), (7.4, 1.2, 1), (5.7, 1.0, 1)], stickers=[('짙은 블루', 1), ('패스트백 라인', 3)]),
    dict(sec='휠', tts='휠은 블랙 멀티 스포크입니다.', caps=['휠은 블랙 멀티 스포크입니다'], shots=[(17.9, 0.9, 1), (18.9, 0.75, 1)], stickers=[('블랙 멀티 스포크 휠', 0)]),
    dict(sec='후면', tts='뒤에서는 좌우를 한 줄로 잇는 테일램프가 포인트입니다.', caps=['뒤에서는 좌우를 한 줄로 잇는', '테일램프가 포인트입니다'],
         shots=[(8.9, 1.0, 1), (9.7, 1.0, 1), (10.5, 0.85, 1)], stickers=[('일자형 테일램프', 1)]),
    dict(sec='실내', tts='실내로 들어가 보겠습니다. 시트는 베이지 가죽이고, 상태는 영상으로 직접 확인해 보시죠.',
         caps=['실내로 들어가 보겠습니다', '시트는 베이지 가죽이고', '상태는 영상으로 직접', '확인해 보시죠'],
         shots=[(20.4, 1.3, 0), (22.0, 1.3, 0), (24.0, 1.3, 0)], stickers=[('베이지 가죽 시트', 1)]),
    dict(sec='실내', tts='센터 콘솔은 물리 버튼 대신 터치 패널로 정리돼 있습니다.', caps=['센터 콘솔은 물리 버튼 대신', '터치 패널로 정리돼 있습니다'],
         shots=[(26.2, 1.25, 0), (28.0, 1.25, 0)], stickers=[('터치 패널', 1)]),
    dict(sec='실내', tts='천장에는 파노라마 선루프가 들어갑니다.', caps=['천장에는 파노라마 선루프가 들어갑니다'],
         shots=[(33.2, 1.2, 0), (34.6, 1.2, 0)], stickers=[('파노라마 선루프', 0)]),
    dict(sec='뒷좌석', tts='뒷좌석에도 독립 공조 패널이 따로 있습니다.', caps=['뒷좌석에도 독립 공조 패널이 따로 있습니다'],
         shots=[(41.0, 1.25, 0), (42.6, 1.25, 0)], stickers=[('뒷좌석 독립 공조', 0)]),
    dict(sec='운전석', tts='운전석은 디지털 계기판에 와이드 디스플레이 구성입니다.', caps=['운전석은 디지털 계기판에', '와이드 디스플레이 구성입니다'],
         shots=[(46.2, 1.2, 0), (47.8, 1.2, 0), (37.2, 1.2, 0)], stickers=[('디지털 계기판', 0), ('와이드 디스플레이', 1)]),
    dict(sec='트렁크', tts='트렁크는 기본 사백구십오 리터, 뒷좌석을 접으면 천삼백 리터까지 늘어납니다.', caps=['트렁크는 기본 495L', '뒷좌석을 접으면 1,300L까지 늘어납니다'], shots=[(52.2, 1.15, 1), (53.4, 1.2, 1), (52.8, 0.9, 1)], stickers=[('495L', 0), ('최대 1,300L', 1)]),
    dict(sec='판매 조건', tts='정리하면, 21년 4월 등록에 주행 3만 8천 킬로미터, 가격은 9,200만 원입니다. 자세한 내용은 보배드림 앱에서 확인하시면 됩니다.',
         caps=['정리하면 21년 4월 등록', '주행 3만 8천 km', '가격은 9,200만 원입니다', '자세한 내용은 보배드림 앱에서', '확인하시면 됩니다'],
         shots=[(54.4, 1.1, 1), (18.4, 1.1, 1), (23.2, 1.2, 0), (47.0, 1.1, 0), (6.2, 1.0, 1)], stickers=[('21년 4월 등록', 0), ('38,276km', 1), ('9,200만원', 2), ('보배드림 앱', 3)], end=True),
]
SHOW = {'포.': '4.', '구칠일': '971', '포,': '4,', '포': '4', '킬로미터,': 'km,', '킬로미터': 'km', '킬로미터입니다.': 'km입니다.'}
HOOK = None  # None이면 차명 스티커 + 가격 + 연식·주행·연료
# 샘플별 설정: SAG_CONFIG=파일.py 이면 CAR · BLOCKS · SHOW · STYLE · HOOK 을 덮어쓴다
if os.environ.get('SAG_CONFIG'):
    exec(open(os.environ['SAG_CONFIG'], encoding='utf-8').read(), globals())
KEY = re.compile(r'(\d|만|블루|베이지|파노라마|선루프|터치|디지털|사륜|공조|DM|보배드림|테일램프|옆태)')


# ── 1. TTS ──
async def edge(text, path):
    import certifi
    certifi.where = lambda: '/root/.ccr/ca-bundle.crt'
    import edge_tts
    c = edge_tts.Communicate(text, VOICE, rate=VOICE_RATE, boundary='WordBoundary')
    words = []
    with open(path, 'wb') as f:
        async for ch in c.stream():
            if ch['type'] == 'audio':
                f.write(ch['data'])
            elif ch['type'] == 'WordBoundary':
                words.append((ch['offset'] / 1e7, (ch['offset'] + ch['duration']) / 1e7, ch['text']))
    return words


def dur(p):
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]))


def align_external(path, words_json):
    """외부 음성(일레븐랩스 등) + 받아쓰기 어절 시각 → 대본 어절 시각. 글자 단위로 맞춰 대본과 받아쓰기 표기가 달라도 따라간다"""
    import difflib
    sw = json.load(open(words_json))  # [{text,start,end}]
    norm = lambda t: re.sub(r'[^0-9A-Za-z가-힣]', '', t)
    sc, st = [], []  # 받아쓰기 글자, 글자마다 시각
    for w in sw:
        t = norm(w['text'])
        for k, ch in enumerate(t):
            sc.append(ch); st.append(w['start'] + (w['end'] - w['start']) * k / max(1, len(t)))
    bc, owner = [], []  # 대본 글자, 글자마다 (블록, 어절)
    for bi, b in enumerate(BLOCKS):
        for wi, w in enumerate(b['tts'].split()):
            for ch in norm(w):
                bc.append(ch); owner.append((bi, wi))
    sm = difflib.SequenceMatcher(None, ''.join(bc), ''.join(sc), autojunk=False)
    mp = [None] * len(bc)
    for a0, b0, n in sm.get_matching_blocks():
        for k in range(n):
            mp[a0 + k] = st[b0 + k]
    known = [i for i, v in enumerate(mp) if v is not None]
    for i in range(len(mp)):  # 못 맞춘 글자는 앞뒤 사이를 이어 붙임
        if mp[i] is None:
            lo = max([k for k in known if k < i], default=None); hi = min([k for k in known if k > i], default=None)
            if lo is None: mp[i] = mp[hi]
            elif hi is None: mp[i] = mp[lo] + 0.08 * (i - lo)
            else: mp[i] = mp[lo] + (mp[hi] - mp[lo]) * (i - lo) / (hi - lo)
    first = {}
    for i, o in enumerate(owner):
        first.setdefault(o, i)
    d = dur(path)
    for bi, b in enumerate(BLOCKS):
        ws = b['tts'].split()
        starts = [mp[first[(bi, wi)]] for wi in range(len(ws))]
        nb = mp[first[(bi + 1, 0)]] if bi + 1 < len(BLOCKS) else d
        ends = starts[1:] + [min(nb - 0.05, starts[-1] + 0.6 + 0.07 * len(ws[-1]))]
        b['words'] = [(s_, e_, SHOW.get(w, w)) for s_, e_, w in zip(starts, ends, ws)]
        b['t0'], b['t1'] = starts[0], ends[-1]
    total = d + 2.8
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', path, '-af', f'aformat=sample_rates=48000:channel_layouts=stereo,apad=whole_dur={total}',
                    '-t', f'{total:.3f}', os.path.join(OUT, 'voice.wav')], check=True)
    return total


def build_voice():
    t, gap = 0.25, 0.12
    parts = []
    for i, b in enumerate(BLOCKS):
        p = os.path.join(OUT, f'v{i}.mp3')
        words = asyncio.run(edge(b['tts'], p))
        d = words[-1][1] + 0.12 if words else dur(p)
        b['t0'], b['t1'] = t, t + d
        b['words'] = [(t + s, t + e, SHOW.get(w, w)) for s, e, w in words]
        parts.append((p, t))
        t += d + gap
    total = t + 2.8  # 끝 카드
    ins, fl = [], []
    for k, (p, st) in enumerate(parts):
        ins += ['-i', p]
        fl.append(f'[{k}:a]adelay={int(st*1000)}|{int(st*1000)},aformat=sample_rates=48000:channel_layouts=stereo[a{k}]')
    fl.append(''.join(f'[a{k}]' for k in range(len(parts))) + f'amix=inputs={len(parts)}:normalize=0,apad=whole_dur={total}[v]')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *ins, '-filter_complex', ';'.join(fl), '-map', '[v]',
                    '-t', f'{total:.3f}', os.path.join(OUT, 'voice.wav')], check=True)
    return total


# ── 2. 배경음악(코드로 만든 박자 → 저작권 문제 없음) ──
SFX_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'public', 'assets', 'shortform', 'sfx')


def _load_sfx(name, sr=48000):
    import wave
    with wave.open(os.path.join(SFX_DIR, name + '.wav')) as w:
        return np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32767


def build_sfx_pack(total, sr=48000):
    """효과음 팩 v1(2026-11-08, 오토스카우트24 쇼츠 분석 반영 · 규격화·절제):
    - 키워드·숫자 스티커가 튀어나올 때마다 「톡」 1번(오토스카우트24 효과음의 64%, 때의 57%가 스티커 등장)
    - 가격 스티커는 「톡」 대신 맑은 「띵」(계산대 소리·충격음은 쓰지 않음)
    - 첫 화면 제목과 끝 명함이 나타날 때 「톡」
    - 부위가 바뀌는 첫 컷에만 「휙」, 0.5초 안에 스티커 소리가 있으면 생략(소리 겹침 금지)
    - 말 자막에는 넣지 않음. 크기는 모두 목소리보다 약간 작게(오토스카우트24 '보통' 87%)
    효과음 파일은 일레븐랩스 효과음 생성으로 만든 자체 소리(public/assets/shortform/sfx). 다른 앱 효과음 파일은 쓰지 않는다"""
    n = int(total * sr) + sr
    out = np.zeros(n)
    g = STYLE.get('sfx_gain', {})
    snd = {k: _load_sfx(k) * g.get(k, d) for k, d in (('pop', .55), ('whoosh', .32), ('ding', .6), ('click', .4))}
    hits = []

    def put(t, name):
        st = int(t * sr)
        x = snd[name]
        if 0 <= st < n:
            m = min(len(x), n - st)
            out[st:st + m] += x[:m]
            hits.append((t, name))

    put(0.05, 'pop')  # 첫 화면 제목
    for b in BLOCKS:
        for txt, pidx in b.get('stickers', []):
            t = PHRASES[b['ph0'] + pidx][0] + 0.1
            put(t, 'ding' if '만원' in txt else 'pop')
    pops = [t for t, _ in hits]
    prev = None
    for bi, b in enumerate(BLOCKS):
        if bi and b['sec'] != prev:
            c = PHRASES[b['ph0']][0] - 0.18
            if all(abs(c - t) > 0.5 for t in pops):
                put(c, 'whoosh')
        prev = b['sec']
    put(BLOCKS[-1]['t1'] + 0.35, 'pop')  # 끝 명함
    import wave
    sting = globals().get('STING') or os.environ.get('SAG_STING')  # 블록 sting=True: 코드로 만든 짧은 주제 효과음
    if sting and os.path.exists(sting):
        with wave.open(sting) as w:
            x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32767
            if w.getnchannels() == 2:
                x = x.reshape(-1, 2).mean(1)
        for b in BLOCKS:
            if b.get('sting'):
                st = max(0, int((b['t0'] - 0.15) * sr))
                m = min(len(x), n - st)
                out[st:st + m] += x[:m] * 0.6 / max(.01, STYLE.get('sfx_bus', .22) / .22)
    out = np.clip(out, -1, 1)
    st2 = (np.stack([out, out], 1) * 32767).astype(np.int16)
    with wave.open(os.path.join(OUT, 'sfx.wav'), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes(st2.tobytes())
    json.dump(hits, open(os.path.join(OUT, 'sfx_hits.json'), 'w'))


def build_sfx(total, sr=48000):
    if STYLE.get('sfx_pack'):
        return build_sfx_pack(total, sr)
    """부위(섹션)가 바뀌는 컷에만 짧은 휙 소리. 컷마다 넣으면 산만하다는 편집 가이드에 따라 섹션 전환에만"""
    n = int(total * sr) + sr
    out = np.zeros(n)
    rng = np.random.default_rng(7)
    prev = None
    for bi, b in enumerate(BLOCKS):
        if bi and b['sec'] != prev:
            c = b['t0'] - LEAD
            L = int(0.32 * sr)
            st = int((c - 0.22) * sr)
            if st < 0:
                continue
            noise = rng.standard_normal(L)
            # 저역을 걷어낸 잡음에 올라갔다 내려오는 모양 → 휙
            noise = np.convolve(noise, np.ones(6) / 6, 'same') - np.convolve(noise, np.ones(60) / 60, 'same')
            env = np.sin(np.linspace(0, np.pi, L)) ** 2
            out[st:st + L] += noise * env * 0.5
        prev = b['sec']
    out = out / (np.max(np.abs(out)) or 1) * 0.5
    if STYLE.get('sfx_pop'):
        # 오토스카우트24 쇼츠 200편 분석(2026-11-08): 효과음의 약 6할이 키워드·숫자 스티커가 튀어나올 때의 짧은 「톡」.
        # 말 자막에는 넣지 않고 스티커 등장에만. 코드로 만든 소리(음원 파일 없음)
        L = int(0.075 * sr)
        tt = np.arange(L) / sr
        f0 = 1250 * np.exp(-tt / 0.03) + 520  # 높은 음에서 빠르게 내려오는 톡
        pop = np.sin(2 * np.pi * np.cumsum(f0) / sr) * np.exp(-tt / 0.018)
        pop[:int(0.002 * sr)] *= np.linspace(0, 1, int(0.002 * sr))
        for b in BLOCKS:
            for txt, pidx in b.get('stickers', []):
                st = int((PHRASES[b['ph0'] + pidx][0] + 0.1) * sr)
                if 0 <= st < n - L:
                    out[st:st + L] += pop * STYLE.get('sfx_pop_vol', 0.32)
        out = np.clip(out, -1, 1)
    import wave
    # 블록에 sting=True 이면 STING 파일(코드로 만든 짧은 효과음, 원곡 사용 금지)을 그 블록 말 시작에 맞춰 얹는다
    sting = globals().get('STING') or os.environ.get('SAG_STING')
    if sting and os.path.exists(sting):
        with wave.open(sting) as w:
            s = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32767
            if w.getnchannels() == 2:
                s = s.reshape(-1, 2).mean(1)
        for b in BLOCKS:
            if b.get('sting'):
                st = max(0, int((b['t0'] - 0.15) * sr))
                m = min(len(s), n - st)
                out[st:st + m] += s[:m] * 0.6
        out = np.clip(out, -1, 1)
    st2 = (np.stack([out, out], 1) * 32767).astype(np.int16)
    with wave.open(os.path.join(OUT, 'sfx.wav'), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes(st2.tobytes())


def build_bgm(total, bpm=112, sr=48000):
    n = int(total * sr) + sr
    t = np.arange(n) / sr
    beat = 60 / bpm
    out = np.zeros(n)
    def env(x, a, d):
        return np.where(x < 0, 0, np.minimum(x / a, 1) * np.exp(-np.maximum(x - a, 0) / d))
    chords = [(57, 60, 64), (53, 57, 60), (48, 52, 55), (55, 59, 62)]  # Am F C G
    f = lambda m: 440 * 2 ** ((m - 69) / 12)
    nb = int(total / beat) + 2
    for b in range(nb):
        st = b * beat
        x = t - st
        m = (x >= 0) & (x < beat * 1.2)
        # 킥
        ph = 2 * np.pi * (45 * x[m] + 60 * (1 - np.exp(-x[m] * 40)) / 40)
        out[m] += 0.9 * np.sin(ph) * env(x[m], 0.002, 0.16)
        # 오프비트 하이햇
        xh = t - (st + beat / 2)
        mh = (xh >= 0) & (xh < 0.08)
        out[mh] += 0.12 * np.random.default_rng(b).standard_normal(mh.sum()) * env(xh[mh], 0.001, 0.02)
        # 베이스(8분)
        ch = chords[(b // 8) % 4]
        for half in (0, 1):
            xb = t - (st + half * beat / 2)
            mb = (xb >= 0) & (xb < beat / 2)
            out[mb] += 0.28 * np.tanh(2 * np.sin(2 * np.pi * f(ch[0] - 12) * xb[mb])) * env(xb[mb], 0.005, 0.18)
    # 패드(2마디마다 코드)
    bar = beat * 4
    for k in range(int(total / (bar * 2)) + 2):
        st = k * bar * 2
        x = t - st
        m = (x >= 0) & (x < bar * 2.1)
        ch = chords[k % 4]
        sig = sum(np.sin(2 * np.pi * f(nn) * x[m]) + 0.5 * np.sin(2 * np.pi * f(nn) * 1.003 * x[m]) for nn in ch)
        out[m] += 0.05 * sig * np.minimum(x[m] / 0.4, 1) * np.minimum((bar * 2.1 - x[m]) / 0.4, 1)
    out = out / np.max(np.abs(out)) * 0.6
    fade = np.minimum(1, (n / sr - t) / 1.5)
    out *= fade
    st = (np.stack([out, out], 1) * 32767).astype(np.int16)
    import wave
    with wave.open(os.path.join(OUT, 'bgm.wav'), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes(st.tobytes())


def build_bgm_spy(total, bpm=92, sr=48000):
    """잔잔한 스파이 영화풍 배경음악(코드로 새로 만듦, 007 원곡 멜로디·리듬 미사용).
    느린 워킹 베이스 + 브러시 스네어 + 하이햇 셔플 + 떨리는 비브라폰풍 단조 화음. 장르 분위기만 빌림"""
    n = int(total * sr) + sr
    t = np.arange(n) / sr
    beat = 60 / bpm
    out = np.zeros(n)
    rng = np.random.default_rng(11)
    f = lambda m: 440 * 2 ** ((m - 69) / 12)
    def env(x, a, d):
        return np.where(x < 0, 0, np.minimum(x / a, 1) * np.exp(-np.maximum(x - a, 0) / d))
    # 2마디씩: Em → Cmaj7 → Am7 → B7sus (단조 느와르 분위기)
    prog = [(40, (64, 67, 71, 75)), (36, (64, 67, 71, 76)), (45, (64, 67, 72, 76)), (47, (64, 66, 71, 76))]
    walk = [0, 7, 12, 7]  # 근음-5도-옥타브-5도 (단순 워킹)
    nb = int(total / beat) + 2
    for b in range(nb):
        st = b * beat
        root, ch = prog[(b // 8) % 4]
        # 베이스: 4분음표, 둥근 소리
        x = t - st
        m = (x >= 0) & (x < beat)
        fb = f(root + walk[b % 4] - 12 if walk[b % 4] == 12 else root + walk[b % 4])
        out[m] += 0.32 * np.tanh(1.6 * np.sin(2 * np.pi * fb * x[m])) * env(x[m], 0.006, 0.28)
        # 하이햇 셔플(셋잇단 느낌, 아주 작게)
        for off, amp in ((0, 0.05), (beat * 2 / 3, 0.035)):
            xh = t - (st + off)
            mh = (xh >= 0) & (xh < 0.06)
            hh = rng.standard_normal(mh.sum())
            out[mh] += amp * np.diff(hh, prepend=0) * env(xh[mh], 0.001, 0.015)
        # 브러시 스네어: 2·4박에 긴 쉬익
        if b % 2 == 1:
            xs = t - st
            ms = (xs >= 0) & (xs < 0.35)
            out[ms] += 0.07 * rng.standard_normal(ms.sum()) * env(xs[ms], 0.01, 0.12)
    # 비브라폰풍 화음: 2마디마다 한 번 울리고 천천히 떨림
    bar = beat * 4
    for k in range(int(total / (bar * 2)) + 2):
        st = k * bar * 2
        x = t - st
        m = (x >= 0) & (x < bar * 2)
        _, ch = prog[k % 4]
        trem = 0.75 + 0.25 * np.sin(2 * np.pi * 4.5 * x[m])
        sig = sum(np.sin(2 * np.pi * f(nn) * x[m]) + 0.25 * np.sin(2 * np.pi * f(nn) * 4 * x[m]) * np.exp(-x[m] * 6) for nn in ch)
        out[m] += 0.045 * sig * trem * env(x[m], 0.01, 2.2)
    # 아주 짧은 잔향
    d = int(0.11 * sr)
    out[d:] += 0.25 * out[:-d]
    out = out / np.max(np.abs(out)) * 0.5
    fade = np.minimum(1, (n / sr - t) / 1.5) * np.minimum(1, t / 0.8)
    out *= fade
    st2 = (np.stack([out, out], 1) * 32767).astype(np.int16)
    import wave
    with wave.open(os.path.join(OUT, 'bgm.wav'), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes(st2.tobytes())


# ── 3. 컷 편집표 ──
def plan_shots(total):
    """컷은 말 구절이 바뀌는 순간(자막이 바뀌는 순간)에 넣는다. 편집자가 말 단위로 자르는 방식.
    블록 첫 컷은 그 블록 말보다 LEAD 먼저 바뀐다(그림이 소리보다 살짝 앞서야 자연스러움)"""
    shots = []
    for bi, b in enumerate(BLOCKS):
        t0 = PHRASES[b['ph0']][0] if bi else 0.0  # 블록 첫 자막이 뜨는 순간 = 컷
        t1 = PHRASES[BLOCKS[bi + 1]['ph0']][0] if bi + 1 < len(BLOCKS) else total
        words = [w[0] - LEAD for w in b['words'] if t0 + 0.6 < w[0] - LEAD < t1 - 0.6]
        n = len(b['shots'])
        cand = [ph[0] for ph in PHRASES if t0 + 0.6 < ph[0] < t1 - 0.6]  # 이 블록 안 자막 시작점
        even = list(np.linspace(t0, t1, n + 1)[1:-1])
        inner = []
        for e in even:  # 고른 간격에 가장 가까운 자막 시작점(0.8초 안), 없으면 고른 간격
            c = min(cand, key=lambda x: abs(x - e), default=None)
            if c is None or abs(c - e) >= 0.8 or c in inner:  # 자막 시작점이 없으면 가장 가까운 어절 시작점
                c = min(words, key=lambda x: abs(x - e), default=e)
                c = c if abs(c - e) < 0.8 and c not in inner else e
            inner.append(c)
        edges = [t0] + sorted(inner) + [t1]
        for k, (src, sp, plate) in enumerate(b['shots']):
            shots.append(dict(a=edges[k], b=edges[k + 1], src=src, sp=sp, plate=plate, bi=bi, k=k))
    return shots


def src_frame(shot, T, nframes):
    s = shot['src'] + (T - shot['a']) * shot['sp']
    return int(min(nframes - 1, max(0, round(s * FPS))))


# ── 4. 번호판 위치표 ──
def plate_track(shots, total, nframes, cache):
    old = {int(k): v for k, v in json.load(open(cache)).items()} if os.path.exists(cache) else {}
    need = set()
    for sh in shots:
        if not sh['plate']:
            continue
        f0, f1 = src_frame(sh, sh['a'], nframes), src_frame(sh, sh['b'], nframes)
        need.update(range(f0 - 4, f1 + 5, 2))
    cap = cv2.VideoCapture(SRC)
    track = {k: v for k, v in old.items() if k in need}
    for fi in sorted(i for i in need if 0 <= i < nframes and i not in old):
        cap.set(cv2.CAP_PROP_POS_FRAMES, fi)
        ok, fr = cap.read()
        if ok:
            track[fi] = [[list(map(float, p)) for p in q] for q in plate_yunet.detect(fr, th=.45)]
    json.dump(track, open(cache, 'w'))
    return track


def _box(q):
    q = np.array(q, np.float32)
    srt = q[np.argsort(q[:, 1])]
    top = srt[:2][np.argsort(srt[:2, 0])]
    ang = math.degrees(math.atan2(top[1][1] - top[0][1], top[1][0] - top[0][0]))
    return [q[:, 0].min(), q[:, 1].min(), q[:, 0].max(), q[:, 1].max(), max(-8, min(8, ang))]


def plates_at(track, fi, win=8):
    """앞뒤 win 장면 안에서 찾은 번호판을 모두 모아, 겹치는 것끼리 합친 상자(놓친 장면·흔들림에도 가림 유지)"""
    boxes = []
    for k in range(fi - win, fi + win + 1):
        for q in track.get(k, []):
            b = _box(q)
            if (b[2] - b[0]) / max(1, b[3] - b[1]) >= 2.0:  # 세로로 서거나 찌그러진 오검출은 버림
                boxes.append(b)
    groups = []
    for b in boxes:
        cx, cy = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2
        for g in groups:
            if abs((g[0] + g[2]) / 2 - cx) < 260 and abs((g[1] + g[3]) / 2 - cy) < 140:
                g[0], g[1], g[2], g[3] = min(g[0], b[0]), min(g[1], b[1]), max(g[2], b[2]), max(g[3], b[3])
                g[4].append(b[4])
                break
        else:
            groups.append([b[0], b[1], b[2], b[3], [b[4]]])
    return [(g[0], g[1], g[2], g[3], float(np.median(g[4]))) for g in groups]


def plate_cover():
    w, h = 520, 120
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, w - 1, h - 1), 16, fill=(18, 20, 24, 255), outline=(90, 94, 100, 255), width=4)
    fnt = ImageFont.truetype(BLACK, 66)
    d.text((w / 2, h / 2 - 4), '보배드림', font=fnt, fill=(255, 255, 255, 255), anchor='mm')
    return np.array(im)


COVER = None


def cover_plates(img, boxes):
    global COVER
    if COVER is None:
        COVER = plate_cover()
    for x0, y0, x1, y1, ang in boxes:
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        w, h = (x1 - x0) * 1.26 + 16, (y1 - y0) * 1.5 + 14  # 모델 상자가 번호판보다 작게 잡히는 일이 있어 넉넉히
        h = max(h, w / 4.6)
        h0, w0 = COVER.shape[:2]
        M = cv2.getRotationMatrix2D((w0 / 2, h0 / 2), -ang, 1.0)
        M[:, 0] *= w / w0; M[:, 1] *= h / h0  # 크기 맞춤 후 회전
        M = cv2.getRotationMatrix2D((0, 0), -ang, 1.0)
        S = np.array([[w / w0, 0, 0], [0, h / h0, 0], [0, 0, 1]], np.float32)
        T0 = np.array([[1, 0, -w / 2], [0, 1, -h / 2], [0, 0, 1]], np.float32)
        R = np.vstack([M, [0, 0, 1]]).astype(np.float32)
        T1 = np.array([[1, 0, cx], [0, 1, cy], [0, 0, 1]], np.float32)
        A = (T1 @ R @ T0 @ S)[:2]
        warp = cv2.warpAffine(COVER, A, (img.shape[1], img.shape[0]), flags=cv2.INTER_LINEAR)
        a = warp[:, :, 3:4].astype(np.float32) / 255
        img[:] = (img * (1 - a) + warp[:, :, [2, 1, 0]] * a).astype(np.uint8)


# ── 5. 그래픽 ──
_cache = {}


def text_img(txt, size, font=BLACK, fill=(255, 255, 255), stroke=9, key=False):
    k = (txt, size, font, fill, stroke, key)
    if k in _cache:
        return _cache[k]
    fnt = ImageFont.truetype(font, size)
    bb = fnt.getbbox(txt, stroke_width=stroke)
    im = Image.new('RGBA', (bb[2] - bb[0] + 20, bb[3] - bb[1] + 20), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    col = YELLOW if key else fill
    d.text((10 - bb[0], 10 - bb[1]), txt, font=fnt, fill=col, stroke_width=stroke, stroke_fill=(0, 0, 0))
    _cache[k] = im
    return im


def pill(txt, size=34, bg=(0, 0, 0, 165), fg=(255, 255, 255), pad=(26, 14), dot=None):
    k = ('pill', txt, size, bg, dot)
    if k in _cache:
        return _cache[k]
    fnt = ImageFont.truetype(BOLD, size)
    bb = fnt.getbbox(txt)
    tw, th = bb[2] - bb[0], size
    extra = 26 if dot else 0
    w, h = tw + pad[0] * 2 + extra, th + pad[1] * 2
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, w - 1, h - 1), h // 2, fill=bg)
    if dot:
        d.ellipse((pad[0], h / 2 - 7, pad[0] + 14, h / 2 + 7), fill=dot)
    d.text((pad[0] + extra, h / 2), txt, font=fnt, fill=fg, anchor='lm')
    _cache[k] = im
    return im


def spec_card(a, b):
    k = ('card', a, b)
    if k in _cache:
        return _cache[k]
    f1, f2 = ImageFont.truetype(BLACK, 62), ImageFont.truetype(MED, 38)
    w = max(f1.getlength(a), f2.getlength(b or '')) + 70
    h = 122 if not b else 186
    im = Image.new('RGBA', (int(w), h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, w - 1, h - 1), 22, fill=(255, 255, 255, 240))
    d.rectangle((0, 22, 10, h - 22), fill=BLUE)
    d.text((36, 26), a, font=f1, fill=(20, 20, 24))
    if b:
        d.text((36, 114), b, font=f2, fill=(90, 92, 98))
    _cache[k] = im
    return im


ART_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'public', 'assets', 'shortform', 'sticker-art')


def sticker(txt, size=72, tilt=-2.0, big=False):
    """칠 스티커 + (MARKS 값이 .png 이면) 칠 오른쪽 끝에 걸친 그림 스티커.
    그림 스티커는 보배드림이 만든 자체 그림(public/assets/shortform/sticker-art/)만 쓴다. 다른 앱(캡컷 등) 스티커 파일은 쓰지 않음"""
    mark = globals().get('MARKS', {}).get(txt)
    if not (isinstance(mark, str) and mark.endswith('.png')):
        return _sticker_core(txt, size, tilt, big)
    k = ('art', txt, size, tilt, big)
    if k in _cache:
        return _cache[k]
    base = _sticker_core(txt, size, tilt, big, no_mark=True)
    art = Image.open(os.path.join(ART_DIR, mark)).convert('RGBA')
    ah = int(base.height * 1.12)  # 칠보다 조금 크게, 오른쪽 끝에 반쯤 걸치게(오토스카우트24 그림 스티커 배치)
    art = art.resize((int(art.width * ah / art.height), ah), Image.LANCZOS).rotate(-tilt * 2.5, resample=Image.BICUBIC, expand=True)
    ox = int(base.width - art.width * 0.42)
    oy = int(base.height * 0.5 - art.height * 0.62)
    W2, H2 = max(base.width, ox + art.width), base.height + max(0, -oy)
    out = Image.new('RGBA', (W2, H2), (0, 0, 0, 0))
    out.alpha_composite(base, (0, max(0, -oy)))
    out.alpha_composite(art, (ox, max(0, oy)))
    out.info['anchor_w'] = base.width  # 가운데 맞춤은 칠 기준
    out.info['anchor_dy'] = max(0, -oy)
    _cache[k] = out
    return out


def _sticker_core(txt, size=72, tilt=-2.0, big=False, no_mark=False):
    """키워드 스티커. 오토스카우트24 스티커를 확대해 본 칠 방식 그대로: 안은 단색으로 꽉 채우고(무늬·투명 없음),
    위·아래 가장자리는 잔물결, 양 끝은 붓이 끊긴 듯 들쭉날쭉, 한쪽 끝이 조금 더 높은 사다리꼴, 2~3도 기울임.
    글자는 굵기 Bold(ExtraBold보다 한 단계 가늘게), 상자 높이 = 글자 높이의 약 2.1배. 색만 보배드림 파랑 + 흰 글자"""
    k = ('sticker', txt, size, tilt, big, no_mark)
    if k in _cache:
        return _cache[k]
    import math
    import random
    rnd = random.Random(txt + str(size))
    # 오토스카우트24 2차 실측(2026-11-07 벨기에 「Carbon」): 기능 스티커 글자는 중간 굵기 → STYLE stk_weight='semi'
    fnt = ImageFont.truetype(SEMI if (STYLE.get('stk_weight') == 'semi' and not big) else BOLD, size)
    bb = fnt.getbbox(txt)
    tw, cap = bb[2] - bb[0], size * 0.74
    # 포인트 표시(MARKS, 설정 파일): '✓' = 글자 뒤 흰 체크(오토스카우트24 네덜란드식), 그 밖 = 색 이모지를 칠 오른쪽 끝에 걸치게
    mark = None if no_mark else globals().get('MARKS', {}).get(txt)
    chk = cap * 0.95 if mark == '✓' else 0
    badge = cap * 1.42 if (mark and mark != '✓') else 0  # 이모지는 칠 안, 글자 뒤 흰 원 위에(파란 이모지도 보이게)
    tw_all = tw + (chk + cap * 0.42 if chk else 0) + (badge + cap * 0.38 if badge else 0)
    pxr, hr = STYLE['big_pad'] if big else STYLE['pad']
    px = int(cap * pxr)
    w, h = int(tw_all + px * 2), int(cap * hr)
    mw = STYLE.get('stk_maxw') and (min(.86, STYLE['stk_maxw'] + .16) if big else STYLE['stk_maxw'])
    if mw and w > W * mw and size > 40:  # 긴 이름은 글자를 줄여 가장자리·오른쪽 버튼 줄을 비움(큰 숫자는 86%까지)
        return _sticker_core(txt, int(size * W * mw / w), tilt, big, no_mark)
    if not big and STYLE.get('stk_minw'):  # 오토스카우트24: 짧은 낱말도 칠은 화면 폭 절반가량(「Carbon」 55%)
        w = max(w, int(W * STYLE['stk_minw']))
    m = 30
    emo = None
    if mark and mark != '✓':
        try:
            ef = ImageFont.truetype(EMOJI_FONT, 109)
            eim = Image.new('RGBA', (160, 160), (0, 0, 0, 0))
            ImageDraw.Draw(eim).text((80, 80), mark, font=ef, embedded_color=True, anchor='mm')
            eim = eim.crop(eim.getbbox())
            eh = int(badge * 0.74)
            emo = eim.resize((int(eim.width * eh / eim.height), eh), Image.LANCZOS)
            if emo.width > badge * 0.8:
                emo = emo.resize((int(badge * 0.8), int(emo.height * badge * 0.8 / emo.width)), Image.LANCZOS)
        except Exception:
            emo = None
    if STYLE.get('stk_shape') == 'as24':  # 오토스카우트24 원본 칠(노션 아이콘 DB, 파일 그대로): 칸 비율에 맞는 원본을 골라 늘림
        from brushfill import original_mask
        mask = original_mask(w, h, margin=m)
        return _sticker_finish(txt, k, mask, m, w, h, fnt, tw, cap, size, chk, badge, emo, tilt)
    if STYLE.get('stk_shape') == 'as24gen':  # 공용 칠 라이브러리 v1(원본을 본떠 새로 그린 리본 칠 8종)
        from brushfill import brush_mask
        mask = brush_mask(w, h, text=txt, margin=m)
        return _sticker_finish(txt, k, mask, m, w, h, fnt, tw, cap, size, chk, badge, emo, tilt)
    S = 4  # 4배로 그려 줄여서 가장자리를 매끄럽게
    W2, H2 = (w + m * 2) * S, (h + m * 2) * S
    mask = Image.new('L', (W2, H2), 0)
    d = ImageDraw.Draw(mask)
    lift_l, lift_r = rnd.uniform(-.05, .05) * h, rnd.uniform(-.05, .05) * h  # 사다리꼴
    ph1, ph2 = rnd.uniform(0, 6.28), rnd.uniform(0, 6.28)
    pts = []
    n = 60
    for i in range(n + 1):  # 윗변: 왼→오, 잔물결 + 작은 떨림
        t = i / n
        x = m + t * w
        y = m + (lift_l * (1 - t) + lift_r * t) + math.sin(t * 5 + ph1) * h * .012 + math.sin(t * 23 + ph2) * h * .006 + rnd.uniform(-1, 1) * h * .003
        pts.append((x, y))
    for i in range(8):  # 오른쪽 끝: 붓이 끊긴 들쭉날쭉(몇 개만, 둥글게)
        t = (i + .5) / 8
        x = m + w + rnd.uniform(-.09, .06) * h
        y = m + t * h + (lift_r if t < .5 else 0)
        pts.append((x, y))
    for i in range(n + 1):  # 아랫변: 오→왼
        t = 1 - i / n
        x = m + t * w
        y = m + h + (lift_l * (1 - t) + lift_r * t) * .4 + math.sin(t * 6 + ph2) * h * .014 + math.sin(t * 19 + ph1) * h * .006 + rnd.uniform(-1, 1) * h * .003
        pts.append((x, y))
    for i in range(8):  # 왼쪽 끝
        t = 1 - (i + .5) / 8
        x = m + rnd.uniform(-.06, .09) * h
        y = m + t * h + (lift_l if t < .5 else 0)
        pts.append((x, y))
    d.polygon([(x * S, y * S) for x, y in pts], fill=255)
    from PIL import ImageFilter
    mask = mask.filter(ImageFilter.GaussianBlur(h * S * .035)).point(lambda v: 255 if v > 127 else 0)  # 이빨을 둥글게
    mask = mask.resize((w + m * 2, h + m * 2), Image.LANCZOS)
    return _sticker_finish(txt, k, mask, m, w, h, fnt, tw, cap, size, chk, badge, emo, tilt)


def _sticker_finish(txt, k, mask, m, w, h, fnt, tw, cap, size, chk, badge, emo, tilt):
    """칠 마스크 위에 글자·체크·이모지를 얹고 기울인다(칠 모양과 무관한 공통 부분)"""
    im = Image.new('RGBA', mask.size, tuple(STYLE['stk_bg']) + (0,))
    im.putalpha(mask)
    td = ImageDraw.Draw(im)
    fg = tuple(STYLE['stk_fg'])
    extra = (chk + cap * 0.42) if chk else ((badge + cap * 0.38) if badge else 0)
    tx = m + w / 2 - extra / 2
    td.text((tx, m + h / 2), txt, font=fnt, fill=fg, anchor='mm')
    if chk:  # 흰 체크: 글자 굵기와 같은 선, 둥근 끝
        cx0 = tx + tw / 2 + cap * 0.42
        cy = m + h / 2
        lw = max(3, int(size * 0.13))
        p1, p2, p3 = (cx0, cy + cap * .02), (cx0 + chk * .36, cy + cap * .34), (cx0 + chk, cy - cap * .40)
        td.line([p1, p2, p3], fill=fg, width=lw, joint='curve')
        for q in (p1, p3):
            td.ellipse((q[0] - lw / 2, q[1] - lw / 2, q[0] + lw / 2, q[1] + lw / 2), fill=fg)
    if badge:  # 흰 원 + 이모지, 칠 안쪽 글자 뒤
        bx = tx + tw / 2 + cap * 0.38
        by = m + h / 2 - badge / 2
        td.ellipse((bx, by, bx + badge, by + badge), fill=(255, 255, 255, 255))
        if emo is not None:
            im.alpha_composite(emo, (int(bx + (badge - emo.width) / 2), int(by + (badge - emo.height) / 2)))
    im = im.rotate(-tilt, resample=Image.BICUBIC, expand=True)
    _cache[k] = im
    return im


def paste(base, im, x, y, alpha=1.0, scale=1.0):
    if scale != 1.0:
        im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.LANCZOS)
    if alpha < 1:
        im = im.copy()
        im.putalpha(im.getchannel('A').point(lambda v: int(v * alpha)))
    base.alpha_composite(im, (int(x), int(y)))


def back(x):
    """살짝 넘쳤다 돌아오는 튀어나옴(스티커 등장)"""
    x = max(0.0, min(1.0, x))
    c = 1.9
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2


def ease(x):
    x = max(0.0, min(1.0, x))
    return 1 - (1 - x) ** 3


PHRASES = []
LEAD = 0.12  # 자막·컷이 말보다 먼저 들어가는 시간


def build_phrases():
    """블록마다 미리 정한 자막 구절(caps)에 어절 시각을 차례로 맞춘다. 어절 수가 다르면 비율로 나눈다"""
    PHRASES.clear()
    for b in BLOCKS:
        ws, caps = b['words'], b.get('caps') or [b['tts']]
        need = [len(c.split()) for c in caps]
        n = len(ws)
        if sum(need) != n:
            tot = sum(need)
            cuts = [round(n * sum(need[:k + 1]) / tot) for k in range(len(need))]
        else:
            cuts = [sum(need[:k + 1]) for k in range(len(need))]
        i0 = 0
        b['ph0'] = len(PHRASES)
        for c, i1 in zip(caps, cuts):
            i1 = max(i0 + 1, min(n, i1))
            nc = len(c.split())
            span = i1 - i0
            starts = [ws[i0 + min(span - 1, int(j * span / nc))][0] - LEAD for j in range(nc)]
            PHRASES.append([ws[i0][0], ws[i1 - 1][1], c, starts])
            i0 = i1
    # 싱크 규칙(검색 정리): 말보다 0.12초 먼저 뜨고(0.1~0.3초 권장), 다음 자막과 2프레임 띄우고,
    # 최소 5/6초 · 최대 7초, 말이 끝나도 0.35초는 남겨 읽을 시간을 준다
    for ph in PHRASES:
        ph[0] = max(0.0, ph[0] - LEAD)
    for i, ph in enumerate(PHRASES):
        nxt = PHRASES[i + 1][0] if i + 1 < len(PHRASES) else ph[1] + 1.0
        end = ph[1] + 0.35
        if nxt - end < 0.5:  # 쉼이 짧으면 다음 자막까지 이어서(깜빡임 방지)
            end = nxt
        end = min(end, nxt) - 2 / FPS
        end = max(end, ph[0] + 5 / 6)
        ph[1] = min(end, ph[0] + 7.0)


CAP_BRIGHT = 0.0  # 자막 자리(y 1050~1220) 화면 평균 밝기 0~1, 그리기 직전에 잼


def cap_keyword(text, blk):
    """v1.2 강조어 1개: 숫자가 든 낱말 → 이 블록 스티커와 겹치는 낱말 → 없음"""
    ws = text.strip(' ,.').split(' ')
    for i, w in enumerate(ws):
        if re.search(r'\d', w):
            return i
    keys = [re.sub(r'[^0-9A-Za-z가-힣]', '', k) for s, _ in blk.get('stickers', []) for k in s.split()]
    for i, w in enumerate(ws):
        n = re.sub(r'[^0-9A-Za-z가-힣]', '', w)
        if len(n) >= 2 and any(n[:max(2, len(n) - 1)] in k or k in n for k in keys if len(k) >= 2):
            return i
    return -1


def phrase_img_v12(text, kw=-1, boxed=False):
    """규격 v1.2(노션 5-1·5-2): Pretendard ExtraBold 60 · 흰 글자 + 검정 외곽선 · 최대 2줄 · 강조어 1개 #FFD56A ·
    자막 자리가 밝으면(평균 0.7 이상) 그 자막만 반투명 검정 상자"""
    k = ('v12', text, kw, boxed, tuple(STYLE.get('cap_kw_col', (255, 213, 106))))
    if k in _cache:
        return _cache[k]
    fnt = ImageFont.truetype(BLACK, 60)
    text = text.strip(' ,.')
    lines = [text]
    if fnt.getlength(text) > SAFE_W - 60 and ' ' in text:
        sp = [i for i, c in enumerate(text) if c == ' ']
        cut = min(sp, key=lambda i: abs(i - len(text) / 2))
        lines = [text[:cut], text[cut + 1:]]
    gap = fnt.getlength(' ')
    lh, pad_x, pad_y = 78, 26, 10
    tw = max(fnt.getlength(l) for l in lines)
    im = Image.new('RGBA', (int(tw + pad_x * 2), lh * len(lines) + pad_y * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if boxed:
        d.rounded_rectangle((0, 0, im.width - 1, im.height - 1), 14, fill=(0, 0, 0, 150))
    wi = 0
    for li, line in enumerate(lines):
        x = (im.width - fnt.getlength(line)) / 2
        y = pad_y + lh * li + lh / 2
        for w in line.split(' '):
            col = tuple(STYLE.get('cap_kw_col', (255, 213, 106))) if wi == kw else (255, 255, 255)
            d.text((x, y), w, font=fnt, fill=col, anchor='lm', stroke_width=0 if boxed else 6, stroke_fill=(0, 0, 0))
            wi += 1
            x += fnt.getlength(w) + gap
    _cache[k] = im
    return im


def phrase_img_as24(text):
    """오토스카우트24 말 자막(200편 분석): 원본 칠(노션 DB 파일 그대로) 위 흰 굵은 글자, 칠 폭 56~80%, 기울기 0도,
    화면 높이 65%, 톡 튀어나옴. 칠 색은 보배드림 블루 #306BD9(노랑 자리를 우리 색으로)"""
    text = text.strip(' ,.')
    keep = {k: STYLE.get(k) for k in ('pad', 'stk_minw', 'stk_maxw', 'stk_weight')}
    STYLE.update(pad=(1.15, 2.4), stk_minw=.56, stk_maxw=.80, stk_weight='bold')
    try:
        im = _sticker_core(text, 61, 0.0, False, True)
    finally:
        for k2, v in keep.items():
            if v is None:
                STYLE.pop(k2, None)
            else:
                STYLE[k2] = v
    return im


def phrase_img_nl(text, kw=-1):
    """오토스카우트24 네덜란드·벨기에 말 자막(200편 분석, 2026-11-08): 꽉 찬 검정 상자 + 흰 굵은 글자, 상자는 글자 폭에 맞춤,
    강조어 칩은 보배드림 파랑 #306BD9 + 흰 글자(AS24 노랑 자리를 우리 브랜드색으로, 2026-11-08 사용자), 톡 튀어나오며 등장. 화면 높이 65% 근처(NL 중앙값 65%, BE 70%)"""
    k = ('nl', text, kw)
    if k in _cache:
        return _cache[k]
    fnt = ImageFont.truetype(BLACK, 62)
    text = text.strip(' ,.')
    lines = [text]
    if fnt.getlength(text) > SAFE_W - 70 and ' ' in text:
        sp = [i for i, c in enumerate(text) if c == ' ']
        cut = min(sp, key=lambda i: abs(i - len(text) / 2))
        lines = [text[:cut], text[cut + 1:]]
    gap = fnt.getlength(' ')
    lh, pad_x, pad_y = 84, 30, 14
    tw = max(fnt.getlength(l) for l in lines)
    im = Image.new('RGBA', (int(tw + pad_x * 2), lh * len(lines) + pad_y * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, im.width - 1, im.height - 1), 10, fill=(0, 0, 0, 240))
    wi = 0
    for li, line in enumerate(lines):
        x = (im.width - fnt.getlength(line)) / 2
        y = pad_y + lh * li + lh / 2
        for w in line.split(' '):
            col = (255, 255, 255)
            if wi == kw:
                d.rounded_rectangle((x - 8, y - 36, x + fnt.getlength(w) + 8, y + 38), 8, fill=tuple(STYLE.get('cap_kw_bg', BLUE)) + (255,))
                col = tuple(STYLE.get('cap_kw_fg', (255, 255, 255)))
            d.text((x, y), w, font=fnt, fill=col, anchor='lm')
            wi += 1
            x += fnt.getlength(w) + gap
    _cache[k] = im
    return im


def phrase_img(text, act=-1):
    """자막 규칙(검색 정리): 프리텐다드 SemiBold 64px · 흰 글자 · 반투명 검정 바탕 · 1줄(세이프존 폭 810px을 넘으면 가운데 띄어쓰기에서 2줄)
    · 줄 높이 화면의 약 4.2% · 화면 아래 데드존(하단 약 450px)과 오른쪽 버튼 줄을 피한 고정 위치 · 문장부호 없음 · 숫자만 노랑"""
    k = ('phrase', text, act)
    if k in _cache:
        return _cache[k]
    fnt = ImageFont.truetype(SEMI, 64)
    text = text.strip(' ,.')
    lines = [text]
    if fnt.getlength(text) > SAFE_W - 70 and ' ' in text:
        sp = [i for i, c in enumerate(text) if c == ' ']
        cut = min(sp, key=lambda i: abs(i - len(text) / 2))
        lines = [text[:cut], text[cut + 1:]]
    gap = fnt.getlength(' ')
    lh, pad_x, pad_y = 80, 30, 12
    tw = max(fnt.getlength(l) for l in lines)
    wi = 0
    im = Image.new('RGBA', (int(tw + pad_x * 2), lh * len(lines) + pad_y * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, im.width - 1, im.height - 1), 14, fill=(0, 0, 0, 140))
    for li, line in enumerate(lines):
        x = (im.width - fnt.getlength(line)) / 2
        y = pad_y + lh * li + lh / 2
        for w in line.split(' '):
            col = (255, 255, 255)
            if wi == act and STYLE['hl'] == 'chip':
                d.rounded_rectangle((x - 9, y - 34, x + fnt.getlength(w) + 9, y + 36), 10, fill=BLUE + (255,))
            elif wi == act:
                col = YELLOW
            d.text((x, y), w, font=fnt, fill=col, anchor='lm')
            wi += 1
            x += fnt.getlength(w) + gap
    _cache[k] = im
    return im


def overlay(T, total, shots, shot, blk):
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    end_t = BLOCKS[-1]['t1'] + 0.35
    # 진행선
    d = ImageDraw.Draw(ov)
    d.rectangle((0, 0, int(W * T / total), 7), fill=BLUE + (255,))
    if T >= end_t:
        return ov, True
    # 첫 장면 훅(오토스카우트24식): 차명 스티커 + 그 아래 흰 가격
    if T < BLOCKS[1]['t0']:
        e = back(T / .4)
        hk = HOOK or dict(title=CAR['name'], line1=CAR['price'], line2=f"{CAR['year']} · {CAR['km_short']} · {CAR['fuel']}")
        t1 = sticker(hk['title'], hk.get('size', 96), -2.5, True)
        t2 = text_img(hk['line1'], 92, BLACK, stroke=7)
        t3 = text_img(hk['line2'], 46, BOLD, stroke=5)
        paste(ov, t1, (W - t1.width * e) / 2, 300 + t1.height * (1 - e) / 2, min(1, T / .15), e)
        e2 = ease((T - .25) / .3)
        paste(ov, t2, (W - t2.width) / 2, 300 + t1.height + 6 + 30 * (1 - e2), e2)
        paste(ov, t3, (W - t3.width) / 2, 300 + t1.height + t2.height + 10, e2)
    # 키워드 스티커(오토스카우트24식): 부위마다, 말하는 구절에 맞춰 톡 튀어나옴.
    # 숫자 사양은 화면 가운데 크게, 기능 이름은 좌·우·가운데를 번갈아 중간 크기로. 가격은 왼쪽에서 밀려 들어옴
    bi = BLOCKS.index(blk)
    for si, (txt, pidx) in enumerate(blk.get('stickers', [])):
        p0 = PHRASES[blk['ph0'] + pidx]
        st = p0[0] + 0.1
        nx = blk.get('stickers')[si + 1][1] if si + 1 < len(blk['stickers']) else None
        en = PHRASES[blk['ph0'] + nx][0] if nx is not None else blk['t1'] + 0.25
        en = min(en, st + 2.6)
        if not (st <= T < en):
            continue
        big = bool(re.search(r'\d', txt)) and (STYLE.get('feat_pos') != 'as24' or len(txt.replace(' ', '')) <= 9)  # 숫자 사양만 크게(「2열 열선·통풍·전동」 같은 기능 이름은 기능 스티커)
        tilt = (-3, 2.5, -2, 3, -2.5, 2)[(bi + si) % 6] * STYLE.get('tilt_k', 1.0)
        im = sticker(txt, STYLE['big_size'] if big else STYLE['feat_size'], tilt, big)
        k = T - st
        out = ease((en - T) / .12)
        if '만원' in txt:  # 가격: 왼쪽에서 밀려 들어옴
            e = ease(k / .3)
            x = (W - im.width) / 2 - (1 - e) * W * .7
            paste(ov, im, x, STYLE.get('price_y', STYLE['big_y']), out)  # 오토스카우트24: 가격은 화면 위쪽 30% 근처
            continue
        e = back(k / .28)
        aw, ady = im.info.get('anchor_w', im.width), im.info.get('anchor_dy', 0)  # 그림 스티커가 붙어도 칠 기준으로 맞춤
        if big:
            x, y = (W - aw) / 2, STYLE['big_y'] - ady
        else:
            if STYLE.get('feat_pos') == 'as24':
                # 오토스카우트24: 화면 가운데 근처(칠 중심 44~56%)에 두고 가장자리와 오른쪽 버튼 줄을 비움
                cx = W * (.44, .5, .56)[(bi + si) % 3]
                x = min(max(cx - aw / 2, 72), W - 200 - im.width) if im.width < W - 272 else (W - aw) / 2
            else:
                x = [SAFE_L, SAFE_R - im.width, STYLE.get('cap_cx', SAFE_CX) - im.width / 2][(bi + si) % 3]
            y = STYLE['feat_y'] - ady
        sc = max(.05, e)
        px_ = x + im.width * (1 - sc) / 2
        if STYLE.get('feat_pos') == 'as24':
            px_ = max(px_, 40)  # 튀어나올 때(살짝 커질 때)도 화면 왼쪽 밖으로 밀리지 않게
        paste(ov, im, px_, y + im.height * (1 - e) / 2, min(1, k / .1) * out, sc)
    # 구절 자막: 2~3어절씩 묶어 한 덩어리로 보여 준다(튀는 효과 없음, 위치 고정)
    cur = None
    for ph in PHRASES:
        if ph[0] <= T < ph[1]:
            cur = ph
    if cur:
        k = min(1.0, (T - cur[0]) / 0.12)
        if STYLE.get('cap_style') == 'as24':  # 오토스카우트24: 칠 자막 + 톡 튀어나옴(스티커와 같은 움직임)
            im = phrase_img_as24(cur[2])
            e = back((T - cur[0]) / 0.28)
            sc = max(.05, e)
            cy = STYLE.get('cap_cy', 1248)
            paste(ov, im, W / 2 - im.width * sc / 2, cy - im.height * sc / 2, min(1, (T - cur[0]) / .1), sc)
            return ov, False
        if STYLE.get('cap_style') == 'nl':  # 오토스카우트 NL·BE: 검정 상자 + 톡 튀어나옴, 높이 65%
            im = phrase_img_nl(cur[2], cap_keyword(cur[2], blk))
            e = back((T - cur[0]) / 0.16)
            sc = max(.05, 0.82 + 0.18 * e)
            cy = STYLE.get('cap_cy', 1248)
            paste(ov, im, W / 2 - im.width * sc / 2, cy - im.height * sc / 2, min(1, (T - cur[0]) / .06), sc)
            return ov, False
        if STYLE.get('cap_style') == 'plain':  # 오토스카우트 NL 말 자막: 바탕 없이 흰 굵은 글자+검정 외곽선, 강조어 1개만 색, 톡 등장
            im = phrase_img_v12(cur[2], cap_keyword(cur[2], blk), False)
            e = back((T - cur[0]) / 0.16)
            sc = max(.05, 0.82 + 0.18 * e)
            cy = STYLE.get('cap_cy', 1248)
            paste(ov, im, W / 2 - im.width * sc / 2, cy - im.height * sc / 2, min(1, (T - cur[0]) / .06), sc)
            return ov, False
        if STYLE.get('cap_style') == 'v12':  # 자막 상자 y 1050~1220 가운데
            im = phrase_img_v12(cur[2], cap_keyword(cur[2], blk), CAP_BRIGHT >= 0.7)
            paste(ov, im, W / 2 - im.width / 2, 1135 - im.height / 2, k)
            return ov, False
        act = max([j for j, st in enumerate(cur[3]) if st <= T] or [0])
        im = phrase_img(cur[2], act)
        paste(ov, im, STYLE.get('cap_cx', SAFE_CX) - im.width / 2, STYLE.get('cap_y', 1360), k)  # cap_cx=540 이면 화면 가운데 정렬
    return ov, False


def end_card():
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, W, H), fill=(8, 10, 14, 150))
    cy = 700
    t = text_img(CAR['name'], 78, stroke=0)
    paste(im, t, (W - t.width) / 2, cy)
    sub = text_img(f"{CAR['year']}년식 · {CAR['km_short']} · {CAR['fuel']} · {CAR['drive']}", 42, MED, stroke=0, fill=(220, 222, 226))
    paste(im, sub, (W - sub.width) / 2, cy + 120)
    pr = sticker(CAR['price'], 110, -2.5, True)
    paste(im, pr, (W - pr.width) / 2, cy + 190)
    b = pill('보배드림 앱에서 확인하세요', 44, bg=(255, 255, 255, 255), fg=(20, 20, 24), pad=(44, 22))
    paste(im, b, (W - b.width) / 2, cy + 410)
    s = text_img('보배드림 매물 · 실매물 영상', 34, MED, stroke=0, fill=(170, 174, 180))
    paste(im, s, (W - s.width) / 2, cy + 560)
    return im


# ── 6. 그리기 ──
def grade(img):
    f = img.astype(np.float32)
    f = (f - 128) * 1.07 + 131
    g = f.mean(2, keepdims=True)
    f = g + (f - g) * 1.10
    return np.clip(f, 0, 255).astype(np.uint8)


VIG = None


def vignette(img):
    global VIG
    if VIG is None:
        yy, xx = np.mgrid[0:H, 0:W]
        r = np.hypot((xx - W / 2) / (W / 2), (yy - H / 2) / (H / 2))
        VIG = (1 - 0.22 * np.clip(r - 0.55, 0, 1) ** 1.5)[..., None].astype(np.float32)
    return (img * VIG).astype(np.uint8)


def main():
    t_start = time.time()
    ext = os.environ.get('SAG_VOICE_FILE')
    total = align_external(ext, os.environ['SAG_VOICE_WORDS']) if ext else build_voice()
    (build_bgm_spy if STYLE.get('bgm') == 'spy' else build_bgm)(total)
    build_phrases()
    build_sfx(total)
    cap = cv2.VideoCapture(SRC)
    nframes = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    shots = plan_shots(total)
    # 번호판: 기본은 가리지 않음(딜러 매물은 번호판 공개가 원칙, 사용자 지시 2026-11-07). SAG_PLATE_COVER=1 이면 자동 가림
    track = plate_track(shots, total, nframes, os.path.join(OUT, 'plates.json')) if PLATE_COVER else {}
    # 필요한 원본 장면만 읽어 둔다
    N = int(round(total * FPS))
    need = {}
    for i in range(N):
        T = i / FPS
        sh = next(s for s in shots if s['a'] <= T < s['b'] or s is shots[-1])
        need[i] = (sh, src_frame(sh, T, nframes))
    want = set(f for _, f in need.values())
    frames = {}
    fi = 0
    while True:
        ok, fr = cap.read()
        if not ok:
            break
        if fi in want:
            frames[fi] = cv2.imencode('.jpg', fr, [cv2.IMWRITE_JPEG_QUALITY, 96])[1]
        fi += 1
    endc = end_card()
    enc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                            '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
                            os.path.join(OUT, 'video.mp4')], stdin=subprocess.PIPE)
    end_t = BLOCKS[-1]['t1'] + 0.35
    for i in range(N):
        T = i / FPS
        sh, sf = need[i]
        img = cv2.imdecode(frames[sf], cv2.IMREAD_COLOR)
        if PLATE_COVER and sh['plate']:
            cover_plates(img, plates_at(track, sf))
        # 컷마다 천천히 밀어 들어가기 + 컷 처음 3장면 살짝 튀는 줌(템포)
        p = (T - sh['a']) / max(.01, sh['b'] - sh['a'])
        z = 1.0 + 0.045 * p + (0.05 * (1 - min(1, (T - sh['a']) / 0.1)) if sh['k'] == 0 and sh['bi'] > 0 else 0)
        if z > 1.001:
            M = cv2.getRotationMatrix2D((W / 2, H / 2), 0, z)
            img = cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        img = vignette(grade(img))
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        blk = BLOCKS[sh['bi']]
        global CAP_BRIGHT
        CAP_BRIGHT = float(rgb[1050:1220, 140:940].mean()) / 255
        ov, is_end = overlay(T, total, shots, sh, blk)
        base = Image.fromarray(rgb).convert('RGBA')
        if is_end:
            k = ease((T - end_t) / 0.4)
            base = Image.blend(base, base.filter(ImageFilter.GaussianBlur(18)), k)
            e2 = endc.copy()
            e2.putalpha(e2.getchannel('A').point(lambda v: int(v * k)))
            base.alpha_composite(e2)
        base.alpha_composite(ov)
        enc.stdin.write(np.array(base.convert('RGB')).tobytes())
    enc.stdin.close()
    enc.wait()
    # 목소리 기준 배경음악 덕킹 + -14 LUFS
    final = os.path.join(OUT, 'sag_reel_v1.mp4')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(OUT, 'video.mp4'), '-i', os.path.join(OUT, 'voice.wav'),
                    '-i', os.path.join(OUT, 'bgm.wav'), '-i', os.path.join(OUT, 'sfx.wav'), '-filter_complex',
                    f"[2:a]volume={STYLE.get('bgm_vol', 0.42)}[m];" '[1:a]asplit=2[v1][v2];[m][v1]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=350[md];'
                    f"[3:a]volume={STYLE.get('sfx_bus', 0.22)}[fx];"
                    '[v2][md][fx]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=9[a]',
                    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest',
                    '-movflags', '+faststart', final], check=True)
    meta = dict(total=round(total, 2), shots=len(shots), sec_per_cut=round(total / len(shots), 2),
                plate_frames=sum(1 for v in track.values() if v), render_sec=round(time.time() - t_start, 1),
                blocks=[dict(t=round(b['t0'], 2), sec=b['sec'], text=b['tts']) for b in BLOCKS])
    json.dump(meta, open(os.path.join(OUT, 'meta.json'), 'w'), ensure_ascii=False, indent=1)
    print(meta)


if __name__ == '__main__':
    main()
