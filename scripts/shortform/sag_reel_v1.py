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
HEAVY = os.path.join(FONTS, 'Pretendard-Black.otf')  # 2026-11-10 원본 NL 자막·칩은 아주 굵은 글자
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

# 편집 판(2026-11-09 사용자: 네덜란드판·벨기에판을 골라 쓴다). STYLE['edit_style'] 또는 SAG_EDIT 로 고른다.
# 수치 근거: docs/shortform/as24-caption-rules-v2.md · as24-sfx-rules-v1.md · as24-4country-compare-v1.md, 칩 규칙은 as24_edit_rules.json의 bobae_nl·bobae_be
EDIT_PRESETS = {
    'bobae_nl': dict(chip_theme=True, cap_style='plain', cap_kw_col=(244, 242, 9), stk_bg=(0, 0, 0), stk_fg=(244, 242, 9),  # 2026-11-10 원본 100% 재현: 칩 = 검정 상자 + 노랑 #F4F209(원본 6편 실측)
                     cap_cy=1152, chip_delay=0.4,  # 60%, 칩은 구절 시작 +0.4초(200편)  # 흰 글자+검정 외곽선, 말하는 어절만 노랑, 톡, 62%(100편 재조사)
                     stk_shape='flat', tilt_k=0.0, big_numbers=True, big_hides_cap=False, cap_cut_gap=0.0,  # 2026-11-10 원본 눈 대조: NL은 말하는 동안 자막이 비는 순간이 없다(큰 숫자는 자막 위에 함께)
                     bgm='file', bgm_vol=0.12, sfx_music=False, sfx_pack=True, sfx_type='ding', sfx_hook=True, sfx_mode='orig', sfx_profile='nl', sfx_pitch=1.19, shot_target_s=2.5, cap_chunk_chars=11, feat_size=85, big_size=100, pad=(0.45, 1.6), big_pad=(0.45, 1.6), stk_minw=0, stk_weight='heavy', big_y=430, price_y=430, end_style='logo', end_tail_s=2.0, hook_minimal=True, no_progress=True, cap_heavy=True, cap_size=64, cap_track=-0.04, cap_stroke=8,
                     cut_early_s=1.0, shot_min_s=1.9, cut_on_phrase_every=3),  # 칩은 장면 시작 약 1.2초 뒤(2차 조사)
    'bobae_be': dict(chip_theme=True, cap_style='be3', cap_kw_col=(247, 236, 56), stk_bg=(247, 236, 56), stk_fg=(0, 0, 0),  # 원본 100% 재현: 노랑 붓띠 #F7EC38 + 검정 글자(원본 6편 실측)
                     cap_cy=1283, chip_delay=0.05,  # 66.8% · 칩은 구절 시작 직후(200편)  # 그림자 흰 글자, 말하는 어절만 노랑, 바로 등장, 64%(100편 재조사)
                     stk_shape='as24', tilt_k=1.0, tilt_fixed=-5.7, big_numbers=False, big_hides_cap=False, numchip_hides_cap=True, cap_cut_gap=0.3,
                     bgm='file', bgm_vol=0.34, sfx_pack=True, sfx_type='ding', sfx_mode='orig', sfx_profile='be', sfx_pitch=0.96, shot_target_s=0, no_progress=True, hook_be=True, cap_chunk_chars=13, cap_chunk_words=4, end_style='logo', end_tail_s=2.0,
                     cut_early_s=0.6, shot_min_s=1.5, cut_on_phrase_every=3),  # 칩은 장면 시작 약 0.8초 뒤(2차 조사)
}
_ed = os.environ.get('SAG_EDIT') or STYLE.get('edit_style')
if _ed:
    if _ed not in EDIT_PRESETS:
        raise SystemExit(f'편집 판 이름이 틀림: {_ed} (bobae_nl · bobae_be)')
    STYLE.update(EDIT_PRESETS[_ed])
    STYLE['edit_style'] = _ed
# 칩 세 번째 값(자동 편집기 auto_edit.py): {'band': top|mid|low, 'list': True, 'option': 이름}. 기존 코드는 (글자, 구절번호)만 읽으므로 따로 둔다
for _b in BLOCKS:
    _st = _b.get('stickers', [])
    _b['_smeta'] = [dict(x[2]) if len(x) > 2 else {} for x in _st]
    _b['stickers'] = [(x[0], x[1]) for x in _st]
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
    total = max(d, BLOCKS[-1]['t1'] + 0.35) + STYLE.get('end_tail_s', 2.8 - 0.35) if STYLE.get('end_tail_s') else d + 2.8
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
    """[예전 규칙 — 2026-11-09 전수조사로 대체, sfx_rules='pack_v1'일 때만 씀] 효과음 팩 v1(2026-11-08, 오토스카우트24 쇼츠 분석 반영 · 규격화·절제):
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


def sfx_as24_hits(music):
    """확정 효과음 규칙(docs/shortform/as24-sfx-rules-v1.md, 수치는 as24_edit_rules.json의 sfx):
    스티커·숫자가 뜨기 0.02초 전 「띵」, 스티커의 약 40%만(가격→주행→연식→마력→그 밖 순),
    0.6초 간격, 영상당 최대 6번, 배경 음악이 있으면 20%·최대 3번. 끝 명함·컷·첫 화면에는 넣지 않는다."""
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import as24_edit_planner as AP
    SX, R = AP.RULES['sfx'], AP.RULES['rules']
    def prio(txt):
        t = txt.replace(' ', '')
        if '만원' in t or '억' in t:
            return 0
        if re.search(r'km|킬로', t):
            return 1
        if re.search(r'년|등록|^\d{4}$', t):
            return 2
        if re.search(r'마력|PS|hp', t, re.I):
            return 3
        return 5 if re.search(r'\d', t) else 9
    cands = []
    for b in BLOCKS:
        for txt, pidx in b.get('stickers', []):
            if '보배드림' in txt:
                continue  # 안내 문구는 정보 칩이 아니다
            cands.append(dict(t=PHRASES[b['ph0'] + pidx][0] + STYLE.get('chip_delay', 0.1), type=STYLE.get('sfx_type', 'ding'), prio=prio(txt), txt=txt))
    if STYLE.get('sfx_mode') == 'orig':
        keep = sfx_pick_orig(cands, SX, music)
    else:
        keep = AP.pick_sfx(cands, SX, R, music)
        if STYLE.get('sfx_hook'):  # 네덜란드판: 첫 화면 제목에도 딩(NL 첫 화면 효과음 약 46%, 2026-11-09 재조사)
            th = 0.05
            if all(abs(k['t'] - th) >= SX.get('min_gap_s', 0.6) for k in keep):
                keep.append(dict(t=th + SX.get('lead_s', 0.02), type=STYLE.get('sfx_type', 'ding'), prio=-1, txt='hook'))
    globals()['SFX_CANDS'] = [(round(c['t'], 2), c['txt'], c['prio']) for c in cands]
    lead = SX.get('lead_s', 0.02)
    return [(round(max(0.0, k['t'] - lead), 3), k['type']) for k in sorted(keep, key=lambda k: k['t'])]


def sfx_pick_orig(cands, SX, music):
    """원본 NL/BE 효과음 배치(2026-11-09 RF 재조사, as24_edit_rules.json sfx.measured.recheck_2026_11_09):
    NL — 첫 화면 제목 1 + 숫자 칩 약 45% + 글자 칩 약 43%, 영상당 중앙값 5(최대 6), 최소 간격 1.0초, 영상 전체에 고르게(간격 중앙값 4.25초).
    BE — 음악이 깔리면 1번(없으면 3번), 숫자 띠 우선. 컷·끝 로고는 원본에서도 드물어(11~12%) 넣지 않는다."""
    M = SX.get('measured', {}).get('recheck_2026_11_09', {})
    gap = SX.get('min_gap_s', 1.0)
    typ = STYLE.get('sfx_type', 'ding')
    num = [c for c in cands if c['prio'] <= 5]
    lab = [c for c in cands if c['prio'] > 5]
    def spread(pool, n, keep):
        """이미 고른 소리와 가장 먼 칩부터(같으면 중요한 정보 먼저) n개 — 한쪽에 몰리지 않게"""
        out = []
        pool = list(pool)
        while pool and len(out) < n:
            ok = [c for c in pool if all(abs(c['t'] - k['t']) >= gap for k in keep + out)]
            if not ok:
                break
            ref = keep + out
            c = max(ok, key=lambda c: ((min(abs(c['t'] - k['t']) for k in ref) if ref else 1e9), -c['prio']))
            out.append(c); pool.remove(c)
        return out
    if STYLE.get('sfx_profile', 'nl') == 'be':
        be = M.get('be_100', {})
        n = int(be.get('sfx_with_music_med', 1) if music else be.get('sfx_without_music_med', 3))
        keep = spread(sorted(num, key=lambda c: c['prio'])[:max(1, n)], n, [])
        if len(keep) < n:
            keep += spread(lab, n - len(keep), keep)
    else:
        nl = M.get('nl_100', {})
        cap = min(int(SX.get('max_per_video', 6)), int(round(nl.get('sfx_per_video_med', 5))))  # 원본 영상당 중앙값 5
        keep = []
        if STYLE.get('sfx_hook'):
            keep.append(dict(t=0.05, type=typ, prio=-1, txt='hook'))
        n_num = max(1, round(len(num) * nl.get('number_corrected', 0.45))) if num else 0
        n_lab = round(len(lab) * nl.get('chip_corrected', 0.43))
        core = [c for c in num if c['prio'] <= 3]  # 가격·주행·연식·마력 먼저(원본 큰 숫자 띠), 엔진·구동 글자는 그다음
        got = spread(core, min(n_num, cap - len(keep)), keep)
        keep += got
        keep += spread([c for c in num if c not in core], min(n_num - len(got), cap - len(keep)), keep)
        keep += spread(lab, min(n_lab, cap - len(keep)), keep)
    return sorted(keep, key=lambda k: k['t'])



def build_sfx_as24(total, sr=48000):
    n = int(total * sr) + sr
    out = np.zeros(n)
    g = STYLE.get('sfx_gain', {})
    music = STYLE.get('sfx_music', STYLE.get('bgm') != 'none' and STYLE.get('bgm_vol', 0.42) > 0.05)  # 음악이 있으면 효과음을 줄임(BE형). sfx_music=False면 NL형 40%
    hits = sfx_as24_hits(music)
    # 크기: 목소리(말하는 구간 평균)보다 −6dB, 그 순간 말과 겹치면 −10dB. 최종 믹스의 효과음 버스(sfx_bus)까지 계산해 맞춘다
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import as24_edit_planner as AP
    SX = AP.RULES['sfx']
    vp = os.path.join(OUT, 'voice.wav')
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', vp, '-ac', '1', '-ar', str(sr), '-f', 's16le', '-'], capture_output=True).stdout
    voice = np.frombuffer(raw, np.int16).astype(float) / 32768
    rms = lambda x: float(np.sqrt(np.mean(x ** 2))) if len(x) else 0.0
    act = voice[np.abs(voice) > 0.02]
    v_db = 20 * np.log10(rms(act) + 1e-9) if len(act) else -22.0
    bus_db = 20 * np.log10(STYLE.get('sfx_bus', 0.22))
    levels = []
    for t, name in hits:
        x = _load_sfx(name)
        pf = STYLE.get('sfx_pitch', 1.0)  # 원본 딩 높이에 맞춤(NL 약 2.35kHz, BE 약 1.9kHz; 자체 ding.wav는 약 1.98kHz)
        if pf != 1.0:
            x = np.interp(np.arange(0, len(x) - 1, pf), np.arange(len(x)), x)
        w = voice[int(t * sr):int((t + 0.4) * sr)]
        over = len(w) and 20 * np.log10(rms(w) + 1e-9) > v_db - 10  # 그 순간 말이 나오고 있다
        target = v_db + (SX.get('gain_db_over_speech', -10) if over else SX.get('gain_db_vs_speech', -6))
        x = x * 10 ** ((target - bus_db - 20 * np.log10(rms(x[:int(0.4 * sr)]) + 1e-9)) / 20) * g.get(name, 1.0)
        levels.append(round(target - v_db, 1))
        st = int(t * sr)
        if 0 <= st < n:
            m = min(len(x), n - st)
            out[st:st + m] += x[:m]
    out = np.clip(out, -1, 1)
    import wave
    st2 = (np.stack([out, out], 1) * 32767).astype(np.int16)
    with wave.open(os.path.join(OUT, 'sfx.wav'), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes(st2.tobytes())
    json.dump(dict(rules='as24_v1.2_orig' if STYLE.get('sfx_mode') == 'orig' else 'as24_v1.1', music=music, pitch=STYLE.get('sfx_pitch', 1.0), hits=hits, db_vs_voice=levels, cands=globals().get('SFX_CANDS')), open(os.path.join(OUT, 'sfx_hits.json'), 'w'), ensure_ascii=False)


def build_sfx(total, sr=48000):
    if STYLE.get('sfx_pack') and STYLE.get('sfx_rules', 'as24') == 'as24':
        return build_sfx_as24(total, sr)
    if STYLE.get('sfx_pack'):
        return build_sfx_pack(total, sr)  # 예전 팩 v1(스티커마다 톡·컷 휙·끝 톡): sfx_rules='pack_v1' 일 때만
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


def build_bgm_file(total, sr=48000):
    """보배드림 자체 제작 배경음(일레븐랩스 음악, public/assets/shortform/bgm/) — 영상 길이로 자르고 앞 0.3초·끝 1.5초 페이드"""
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'public', 'assets', 'shortform', 'bgm')
    src = os.path.join(root, STYLE.get('bgm_file', 'bobae_showroom_v1.mp3'))
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-stream_loop', '-1', '-i', src, '-t', f'{total:.2f}', '-ac', '2', '-ar', str(sr),
                    '-af', f'afade=t=in:d=0.3,afade=t=out:st={max(0, total - 1.5):.2f}:d=1.5', os.path.join(OUT, 'bgm.wav')], check=True)


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
    ncut = [0]
    ev = STYLE.get('cut_on_phrase_every', 0)  # 원본 컷의 약 1/3은 구절 시작(칩과 같은 순간) — n번째 컷마다 당기지 않는다

    def pull():
        ncut[0] += 1
        return not (ev and ncut[0] % ev == 0)
    for bi, b in enumerate(BLOCKS):
        t0 = PHRASES[b['ph0']][0] if bi else 0.0  # 블록 첫 자막이 뜨는 순간 = 컷
        # 첫 컷(첫 화면 → 다음 블록)은 당기지 않는다: 원본 첫 컷은 NL 3.3 · BE 2.4초로 늦다
        if bi > 1 and STYLE.get('cut_early_s') and shots and pull():
            # 원본: 칩은 장면이 바뀌고 약 1초 뒤에 뜬다(칩 ≠ 컷, 컷의 60%는 구절 중간). 블록 컷을 앞 블록 끝 낱말 시작으로 당긴다
            cand_w = [w[0] - LEAD for w in BLOCKS[bi - 1]['words'] if t0 - STYLE['cut_early_s'] - 0.3 <= w[0] - LEAD <= t0 - 0.4]
            last_a = shots[-1]['a']
            if cand_w and min(cand_w) - last_a >= STYLE.get('shot_min_s', 1.6):
                t0 = min(cand_w)
                shots[-1]['b'] = t0
        t1 = PHRASES[BLOCKS[bi + 1]['ph0']][0] if bi + 1 < len(BLOCKS) else total
        words = [w[0] - LEAD for w in b['words'] if t0 + 0.6 < w[0] - LEAD < t1 - 0.6]
        bshots = b['shots']
        tgt_edges = None
        tgt = STYLE.get('shot_target_s', 0)
        if tgt and len(bshots) > 1:  # 네덜란드판: 장면 약 2.5초(NL 중간값). 블록 길이에 맞게 장면 수를 줄이고 고르게 남긴다
            nk = min(len(bshots), max(1, round((t1 - t0) / tgt)))
            # 옵션 칩(자동 편집기): 옵션 하나 = 구절 하나 = 장면 하나. 블록이 짧아도 옵션 장면은 줄이지 않는다
            opt = sorted({pi for (_, pi), m in zip(b.get('stickers', []), b.get('_smeta', [])) if m.get('option') and pi < len(bshots)})
            nk = min(len(bshots), max(nk, len(opt) + (0 not in opt)))
            # 칩이 뜨는 구절의 장면을 먼저 남긴다(칩 글자와 화면 부위가 어긋나지 않게: 장면 k = 구절 k)
            rest = sorted({0} | {pi for _, pi in b.get('stickers', []) if pi < len(bshots)})
            pref = opt + [j for j in rest if j not in opt]
            keep = pref[:nk] + [j for j in range(len(bshots)) if j not in pref][:max(0, nk - len(pref))]
            keep = sorted(keep)
            kept_ph = [PHRASES[b['ph0'] + j][0] for j in keep[1:] if b['ph0'] + j < len(PHRASES)]
            bshots = [bshots[j] for j in keep]
            if len(kept_ph) == len(bshots) - 1:
                tgt_edges = kept_ph  # 남긴 장면은 그 구절이 시작될 때 바뀐다
        n = len(bshots)
        cand = [ph[0] for ph in PHRASES if t0 + 0.6 < ph[0] < t1 - 0.6]  # 이 블록 안 자막 시작점
        even = list(np.linspace(t0, t1, n + 1)[1:-1])
        inner = []
        for e in even:  # 고른 간격에 가장 가까운 자막 시작점(0.8초 안), 없으면 고른 간격
            c = min(cand, key=lambda x: abs(x - e), default=None)
            if c is None or abs(c - e) >= 0.8 or c in inner:  # 자막 시작점이 없으면 가장 가까운 어절 시작점
                c = min(words, key=lambda x: abs(x - e), default=e)
                c = c if abs(c - e) < 0.8 and c not in inner else e
            inner.append(c)
        if tgt_edges is not None and len(bshots) > 1:
            inner = list(tgt_edges)
        edges = [t0] + sorted(inner) + [t1]
        if STYLE.get('cut_early_s'):  # 블록 안 컷도 칩(구절 시작)보다 조금 먼저: 앞 구절 끝 낱말 시작으로
            ws_ = [w[0] - LEAD for w in b['words']]
            for k in range(1, len(edges) - 1):
                if not pull():
                    continue
                c_ = [w for w in ws_ if edges[k] - STYLE['cut_early_s'] - 0.3 <= w <= edges[k] - 0.35 and w - edges[k - 1] >= STYLE.get('shot_min_s', 1.6) * 0.8]
                if c_:
                    edges[k] = min(c_)
        for k, (src, sp, plate) in enumerate(bshots):
            shots.append(dict(a=edges[k], b=edges[k + 1], src=src, sp=sp, plate=plate, bi=bi, k=k))
    return shots


def clamp_to_segments(shots, src_dur):
    """2026-11-10 칩·말 ↔ 화면 어긋남 원인 수정: 컷 편집표가 장면을 줄이거나(shot_target_s) 컷을 당기거나(cut_early)
    마지막 장면을 영상 끝까지 늘리면, 원본이 그 부위 구간을 넘어 다음 부위(바퀴·트렁크)나 원본 끝 검은 화면이 비친다.
    장면마다 그 부위 구간(설정 SEGS, 없으면 원본 전체) 안에서 끝나도록 천천히(최저 0.4배) 틀고, 그래도 모자라면 시작을 당긴다"""
    SF = dict(dict(clamp_to_part=True, min_speed=0.4, pull_start_when_short=True, edge_margin_s=0.04), **globals().get('SHOT_FIT', {}))
    segs = globals().get('SEGS') or [dict(t0=0.0, t1=src_dur, part='all')]
    for sh in shots:
        seg = next((g for g in segs if g['t0'] - 0.05 <= sh['src'] < g['t1']), None) or dict(t0=0.0, t1=src_dur, part='all')
        sh['part'] = seg['part']
        if not SF['clamp_to_part']:
            continue
        end = min(seg['t1'], src_dur) - SF['edge_margin_s']
        dur = max(0.01, sh['b'] - sh['a'])
        if SF.get('swap_same_part', True) and seg['part'] != 'all' and (end - seg['t0']) < dur * SF['min_speed']:
            # 그 부위 구간이 최저 속도로 틀어도 짧으면, 같은 부위의 더 긴 구간으로 옮긴다(08 원본: 뒷모습 1.4초 구간 → 3.8초 구간)
            alt = [g for g in segs if g['part'] == seg['part'] and (min(g['t1'], src_dur) - SF['edge_margin_s'] - g['t0']) >= dur * SF['min_speed']]
            if alt:
                g = min(alt, key=lambda g: abs(g['t0'] - sh['src']))
                seg, sh['src'] = g, round(g['t0'], 3)
                end = min(g['t1'], src_dur) - SF['edge_margin_s']
        if sh['src'] + dur * sh['sp'] > end:
            sp = max(SF['min_speed'], (end - sh['src']) / dur)
            sh['sp'] = round(min(sh['sp'], sp), 3)
            if sh['src'] + dur * sh['sp'] > end and SF['pull_start_when_short']:
                sh['src'] = round(max(seg['t0'], end - dur * sh['sp']), 3)
            if sh['src'] + dur * sh['sp'] > end and SF.get('hold_at_end', True):
                sh['hold'] = round(end, 3)  # 같은 부위의 긴 구간도 없으면 구간 끝 장면에서 멈춘다(다음 부위가 비치지 않게, 08 원본 앞모습 1.3초)
    return shots


def dump_match(shots):
    """칩마다 실제로 그 순간 화면에 비친 부위를 적는다(OUT/match.json, check_match.py가 읽음)"""
    rows = []
    for bi, b in enumerate(BLOCKS):
        for st in b.get('stickers', []):
            txt, pi = st[0], st[1]
            if b['ph0'] + pi >= len(PHRASES):
                continue
            t = PHRASES[b['ph0'] + pi][0]
            sh = next((x for x in shots if x['a'] <= t < x['b']), shots[-1])
            rows.append(dict(sec=b.get('sec', ''), chip=txt, t=round(t, 2), part=sh.get('part'), src=round(sh['src'] + (t - sh['a']) * sh['sp'], 2)))
    json.dump(dict(chips=rows, shots=[{k: sh.get(k) for k in ('a', 'b', 'src', 'sp', 'bi', 'k', 'part', 'hold')} for sh in shots]),
              open(os.path.join(OUT, 'match.json'), 'w'), ensure_ascii=False, indent=1)


SRC_FPS = 30.0  # main()에서 원본 파일의 실제 초당 장면 수로 바꾼다(2026-11-10: 차란차 원본 25fps를 30으로 계산해 장면이 엉뚱한 시각에서 나옴)


def src_frame(shot, T, nframes):
    s = shot['src'] + (T - shot['a']) * shot['sp']
    if shot.get('hold') is not None:
        s = min(s, shot['hold'])
    return int(min(nframes - 1, max(0, round(s * SRC_FPS))))


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
    col = tuple(STYLE.get('cap_kw_col', YELLOW)) if key else fill
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


_OPT_CHIPS = None


def chip_kind(txt):
    """칩 종류: 숫자가 있으면 포인트, 매물 옵션표(auto_edit_rules.json option_catalog) 이름이면 옵션, 그 밖은 기능"""
    global _OPT_CHIPS
    if re.search(r'\d', txt):
        return 'point'
    if _OPT_CHIPS is None:
        try:
            r = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'auto', 'auto_edit_rules.json'), encoding='utf-8'))
            _OPT_CHIPS = {o.get(k, '') for o in r['option_catalog'] for k in ('chip', 'name', 'say')}
        except Exception:
            _OPT_CHIPS = set()
    return 'option' if txt in _OPT_CHIPS else 'feature'



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
    fnt = ImageFont.truetype(SEMI if (STYLE.get('stk_weight') == 'semi' and not big) else HEAVY if STYLE.get('stk_weight') == 'heavy' else BOLD, size)
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
    if STYLE.get('chip_theme') and not (big and not re.search(r'\d', txt)):  # 2026-11-10: 옵션·기능·포인트 칩 = 노션 테마 바탕색 원본 칠·원본 색
        from brushfill import THEME_KINDS, theme_pick, theme_mask
        kind = chip_kind(txt)
        tk = THEME_KINDS[kind]
        h = max(h, int(cap * 1.75))  # 칠이 글자 위아래를 다 덮게(원본: 칠 높이 ≈ 글자 높이 1.7~1.9배)
        if kind == 'feature':
            h = int(h * 1.35)  # 두 줄 붓은 글자가 두 획을 덮도록 조금 높게
        mask = theme_mask(w, h, theme_pick(kind, w, h), margin=m)
        keep = STYLE.get('stk_bg'), STYLE.get('stk_fg')
        STYLE['stk_bg'], STYLE['stk_fg'] = STYLE.get('cap_kw_col') or tk['color'], (0, 0, 0)  # 2026-11-10 사용자: 칩 색은 모두 원본 영상 노랑(칠 모양만 노션 원본)
        try:
            return _sticker_finish(txt, k, mask, m, w, h, fnt, tw, cap, size, chk, badge, emo, tilt)
        finally:
            STYLE['stk_bg'], STYLE['stk_fg'] = keep
    if STYLE.get('stk_shape') == 'as24':  # 오토스카우트24 원본 칠(노션 아이콘 DB, 파일 그대로): 칸 비율에 맞는 원본을 골라 늘림
        from brushfill import original_mask
        mask = original_mask(w, h, margin=m)
        return _sticker_finish(txt, k, mask, m, w, h, fnt, tw, cap, size, chk, badge, emo, tilt)
    if STYLE.get('stk_shape') == 'flat':  # 오토스카우트24 독일: 모서리 거의 없는 납작한 단색 상자, 2~3도 기울임
        mask = Image.new('L', (w + m * 2, h + m * 2), 0)
        ImageDraw.Draw(mask).rounded_rectangle((m, m, m + w, m + h), 4, fill=255)
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


def phrase_img_nlcap(text, kw=-1):
    """네덜란드판 말 자막(2026-11-10 원본 1YivF6HjLTw 확대 대조): 아주 굵은 글자(Black) · 글자 사이 좁게 · 두꺼운 검정 외곽선 + 옅은 아래 그림자 · 말하는 어절만 노랑"""
    col_k = tuple(STYLE.get('cap_kw_col', (238, 239, 5)))
    k = ('nlcap', text, kw, col_k)
    if k in _cache:
        return _cache[k]
    from PIL import ImageFilter
    sz = STYLE.get('cap_size', 64)
    fnt = ImageFont.truetype(HEAVY, sz)
    tr = STYLE.get('cap_track', -0.04) * sz  # 글자 사이(음수 = 좁게)
    stw = STYLE.get('cap_stroke', 8)
    text = text.strip(' ,.')
    ws = text.split(' ')
    def wlen(w):
        return sum(fnt.getlength(c) for c in w) + tr * (len(w) - 1)
    gap = fnt.getlength(' ') * 0.8
    tw = sum(wlen(w) for w in ws) + gap * (len(ws) - 1)
    lh = int(sz * 1.3)
    im = Image.new('RGBA', (int(tw + 2 * stw + 40), lh + 2 * stw + 30), (0, 0, 0, 0))
    sh = Image.new('RGBA', im.size, (0, 0, 0, 0))
    d, sd = ImageDraw.Draw(im), ImageDraw.Draw(sh)
    y = im.height / 2
    for pass_ in (0, 1):
        x = (im.width - tw) / 2
        for wi, w in enumerate(ws):
            col = col_k if wi == kw else (255, 255, 255)
            for c in w:
                if pass_ == 0:
                    sd.text((x + 2, y + 5), c, font=fnt, fill=(0, 0, 0, 170), anchor='lm', stroke_width=stw, stroke_fill=(0, 0, 0, 170))
                else:
                    d.text((x, y), c, font=fnt, fill=(0, 0, 0), anchor='lm', stroke_width=stw, stroke_fill=(0, 0, 0))
                x += fnt.getlength(c) + tr
            x += gap - tr
        if pass_ == 0:
            im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(5)))
    x = (im.width - tw) / 2
    for wi, w in enumerate(ws):
        col = col_k if wi == kw else (255, 255, 255)
        for c in w:
            d.text((x, y), c, font=fnt, fill=col, anchor='lm')
            x += fnt.getlength(c) + tr
        x += gap - tr
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


def phrase_img_be(text, kw=-1):
    """오토스카우트24 벨기에 말 자막(100편 분석): 흰 굵은 글자 + 얇은 검정 외곽선, 바로 등장(69%),
    강조어 1개만 노랑 형광펜 칠(#FFE600) 위 검정 글자"""
    k = ('be', text, kw)
    if k in _cache:
        return _cache[k]
    fnt = ImageFont.truetype(BLACK, 58)
    text = text.strip(' ,.')
    lines = [text]
    if fnt.getlength(text) > SAFE_W - 60 and ' ' in text:
        sp = [i for i, c in enumerate(text) if c == ' ']
        cut = min(sp, key=lambda i: abs(i - len(text) / 2))
        lines = [text[:cut], text[cut + 1:]]
    gap = fnt.getlength(' ')
    lh, pad_x, pad_y = 80, 30, 12
    tw = max(fnt.getlength(l) for l in lines)
    im = Image.new('RGBA', (int(tw + pad_x * 2), lh * len(lines) + pad_y * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    wi = 0
    for li, line in enumerate(lines):
        x = (im.width - fnt.getlength(line)) / 2
        y = pad_y + lh * li + lh / 2
        for w in line.split(' '):
            if wi == kw:
                lw = fnt.getlength(w)
                d.polygon([(x - 10, y - 30), (x + lw + 12, y - 34), (x + lw + 8, y + 34), (x - 12, y + 32)], fill=(255, 230, 0, 255))
                d.text((x, y), w, font=fnt, fill=(17, 17, 17), anchor='lm')
            else:
                d.text((x, y), w, font=fnt, fill=(255, 255, 255), anchor='lm', stroke_width=4, stroke_fill=(0, 0, 0))
            wi += 1
            x += fnt.getlength(w) + gap
    _cache[k] = im
    return im


def phrase_img_de(text):
    """오토스카우트24 독일 말 자막(원본 쇼츠 직접 실측 2026-11-08 + 120편 분석): 바탕 없음 · 굵은 흰 글자 + 얇은 검정 외곽선 + 옅은 그림자,
    강조색 없음(97%가 말 자막, 외곽선 78%), 바로 등장(95%), 문장 그대로 한 줄, 화면 높이 58%"""
    k = ('de', text)
    if k in _cache:
        return _cache[k]
    from PIL import ImageFilter
    fnt = ImageFont.truetype(BOLD, 60)
    text = text.strip(' ,.')
    lines = [text]
    if fnt.getlength(text) > SAFE_W - 60 and ' ' in text:
        sp = [i for i, c in enumerate(text) if c == ' ']
        cut = min(sp, key=lambda i: abs(i - len(text) / 2))
        lines = [text[:cut], text[cut + 1:]]
    lh = 78
    tw = max(fnt.getlength(l) for l in lines)
    im = Image.new('RGBA', (int(tw + 80), lh * len(lines) + 40), (0, 0, 0, 0))
    sh = Image.new('RGBA', im.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    for i, l in enumerate(lines):
        sd.text((im.width / 2 + 2, 20 + lh * i + lh / 2 + 3), l, font=fnt, fill=(0, 0, 0, 150), anchor='mm', stroke_width=4, stroke_fill=(0, 0, 0, 150))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(5)))
    d = ImageDraw.Draw(im)
    for i, l in enumerate(lines):
        d.text((im.width / 2, 20 + lh * i + lh / 2), l, font=fnt, fill=(255, 255, 255), anchor='mm', stroke_width=4, stroke_fill=(0, 0, 0))
    _cache[k] = im
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


def cap_keyword_any(text, blk):
    """강조어를 꼭 하나 고른다(네덜란드식: 영상당 칩 11.7개 = 거의 모든 구절): 숫자 → 스티커 겹침 → 가장 긴 낱말"""
    i = cap_keyword(text, blk)
    if i >= 0:
        return i
    ws = text.strip(' ,.').split(' ')
    return max(range(len(ws)), key=lambda j: len(re.sub(r'[^0-9A-Za-z가-힣]', '', ws[j])))


def _outline_text(d, xy, t, fnt, fill, stroke):
    d.text(xy, t, font=fnt, fill=fill, anchor='lm', stroke_width=stroke, stroke_fill=(0, 0, 0))


def phrase_img_nl2(text, kw=-1):
    """네덜란드식 v2(2026-11-09 실측 40편): 바탕 없음 · 흰 굵은 글자 + 검정 외곽선 · 높이 63% ·
    강조어 칩은 말 자막 줄 안(실측 칩 y 59~62%)에 거의 모든 구절마다 1개 · 칩 색은 보배드림 파랑(2026-11-08 사용자 결정)"""
    k = ('nl2', text, kw)
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
    lh, pad_x, pad_y = 88, 30, 16
    tw = max(fnt.getlength(l) for l in lines) + 30
    im = Image.new('RGBA', (int(tw + pad_x * 2), lh * len(lines) + pad_y * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    wi = 0
    for li, line in enumerate(lines):
        x = (im.width - fnt.getlength(line)) / 2
        y = pad_y + lh * li + lh / 2
        for w in line.split(' '):
            if wi == kw:
                d.rounded_rectangle((x - 10, y - 38, x + fnt.getlength(w) + 10, y + 40), 8, fill=BLUE + (255,))
                d.text((x, y), w, font=fnt, fill=(255, 255, 255), anchor='lm')
            else:
                _outline_text(d, (x, y), w, fnt, (255, 255, 255), 5)
            wi += 1
            x += fnt.getlength(w) + gap
    _cache[k] = im
    return im


def phrase_img_be2(text):
    """벨기에식 v2(2026-11-09 실측 40편 + 제미나이 80편): 바탕 없음 · 흰 굵은 글자 + 옅은 그림자(말 자막 배경 1위 '그림자') · 외곽선 없음 · 높이 68% · 바로 등장"""
    k = ('be2', text)
    if k in _cache:
        return _cache[k]
    from PIL import ImageFilter
    fnt = ImageFont.truetype(BLACK, 60)
    text = text.strip(' ,.')
    lines = [text]
    if fnt.getlength(text) > SAFE_W - 60 and ' ' in text:
        sp = [i for i, c in enumerate(text) if c == ' ']
        cut = min(sp, key=lambda i: abs(i - len(text) / 2))
        lines = [text[:cut], text[cut + 1:]]
    lh = 80
    tw = max(fnt.getlength(l) for l in lines)
    im = Image.new('RGBA', (int(tw + 80), lh * len(lines) + 40), (0, 0, 0, 0))
    sh = Image.new('RGBA', im.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    for i, l in enumerate(lines):
        sd.text((im.width / 2 + 2, 20 + lh * i + lh / 2 + 4), l, font=fnt, fill=(0, 0, 0, 200), anchor='mm', stroke_width=3, stroke_fill=(0, 0, 0, 200))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6)))
    d = ImageDraw.Draw(im)
    for i, l in enumerate(lines):
        d.text((im.width / 2, 20 + lh * i + lh / 2), l, font=fnt, fill=(255, 255, 255), anchor='mm')
    _cache[k] = im
    return im


def phrase_img_be3(text, act=-1):
    """벨기에판(2026-11-09): 그림자 흰 글자(외곽선 없음) · 말하는 어절만 노랑 #EEEF05 · 높이 67% 고정 · 바로 등장(벨기에 34/39편 방식)"""
    col_k = tuple(STYLE.get('cap_kw_col', (238, 239, 5)))
    csz = STYLE.get('cap_size_be', 60)  # 2026-11-12 오토스카우트 벨기에 자막 글자 높이(3~3.5%)에 맞출 때 72
    k = ('be3', text, act, col_k, csz)
    if k in _cache:
        return _cache[k]
    from PIL import ImageFilter
    fnt = ImageFont.truetype(BLACK, csz)
    text = text.strip(' ,.')
    lines = [text]
    if '|' in text:  # 대본에서 줄 나눌 자리를 직접 정한 경우(뜻이 끊기지 않게)
        lines = [l.strip() for l in text.split('|')]
    elif fnt.getlength(text) > SAFE_W - 60 and ' ' in text:
        sp = [i for i, c in enumerate(text) if c == ' ']
        cut = min(sp, key=lambda i: abs(i - len(text) / 2))
        lines = [text[:cut], text[cut + 1:]]
    lh, gap = int(round(80 * csz / 60)), fnt.getlength(' ')
    tw = max(fnt.getlength(l) for l in lines)
    im = Image.new('RGBA', (int(tw + 80), lh * len(lines) + 40), (0, 0, 0, 0))
    sh = Image.new('RGBA', im.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    for i, l in enumerate(lines):
        sd.text((im.width / 2 + 3, 20 + lh * i + lh / 2 + 5), l, font=fnt, fill=(0, 0, 0, 220), anchor='mm', stroke_width=4, stroke_fill=(0, 0, 0, 220))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6)))
    d = ImageDraw.Draw(im)
    wi = 0
    for i, l in enumerate(lines):
        x = (im.width - fnt.getlength(l)) / 2
        y = 20 + lh * i + lh / 2
        for w in l.split(' '):
            d.text((x, y), w, font=fnt, fill=col_k if wi == act else (255, 255, 255), anchor='lm')
            wi += 1
            x += fnt.getlength(w) + gap
    _cache[k] = im
    return im


def kw_chip_be2(word):
    """벨기에식 키워드 칩(제미나이 80편: 키워드 스티커 214개, y 64% = 말 자막 바로 위, 톡 튀어나옴, 말과 동시):
    칩 색은 보배드림 파랑 + 흰 글자(원본 노랑 #FFE600 + 검정 글자 자리)"""
    k = ('be2chip', word)
    if k in _cache:
        return _cache[k]
    fnt = ImageFont.truetype(BLACK, 54)
    w = word.strip(' ,.')
    tw = fnt.getlength(w)
    im = Image.new('RGBA', (int(tw + 52), 84), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, im.width - 1, im.height - 1), 10, fill=BLUE + (255,))
    d.text((im.width / 2, 42), w, font=fnt, fill=(255, 255, 255), anchor='mm')
    im = im.rotate(-2.0, resample=Image.BICUBIC, expand=True)
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
                col = tuple(STYLE.get('cap_kw_col', YELLOW))
            d.text((x, y), w, font=fnt, fill=col, anchor='lm')
            wi += 1
            x += fnt.getlength(w) + gap
    _cache[k] = im
    return im


CAPLOG = []


def _norm_txt(x):
    return re.sub(r'[^0-9A-Za-z가-힣]', '', x.replace('✓', ''))


def chip_related(phrase, chip):
    """칩이 지금 말 자막과 같은 내용인지(같은 숫자 또는 같은 낱말). 같은 내용일 때만 자막을 칩으로 대신할 수 있다(2026-11-10 자막 빠짐 방지)"""
    p, c = _norm_txt(phrase), _norm_txt(chip)
    pd, cd = ''.join(re.findall(r'\d', phrase)), ''.join(re.findall(r'\d', chip))
    if cd and cd in pd:
        return True
    if len(c) >= 2 and c in p:
        return True
    return any(len(_norm_txt(w)) >= 2 and _norm_txt(w) in p for w in chip.split())


def cap_chunk(cur, act):
    """2026-11-10 원본 NL·BE 눈 대조: 말 자막은 한 줄 1~3낱말(BE 2~5), 말 따라 덩어리째 바뀐다. 긴 구절을 두 줄로 한꺼번에 띄우지 않는다.
    돌려주는 것: (보일 글자, 덩어리가 뜬 시각, 덩어리 안 말하는 낱말 번호)"""
    txt, t_in = cur[2], cur[0]
    N = STYLE.get('cap_chunk_chars')
    if not N:
        return txt, t_in, act
    ws_ = txt.split()
    mx = STYLE.get('cap_chunk_words', 3)
    groups, g = [], []
    for j, w in enumerate(ws_):
        if g and (sum(len(ws_[x]) for x in g) + len(w) > N or len(g) >= mx):
            groups.append(g); g = []
        g.append(j)
    if g:
        groups.append(g)
    gi = next((k for k, g in enumerate(groups) if act in g or act < g[0]), len(groups) - 1)
    g = groups[gi]
    t_in = cur[0] if gi == 0 else (cur[3][g[0]] if g[0] < len(cur[3]) else cur[0])
    return ' '.join(ws_[j] for j in g), t_in, act - g[0]


def overlay(T, total, shots, shot, blk):
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    end_t = BLOCKS[-1]['t1'] + 0.35
    # 진행선
    d = ImageDraw.Draw(ov)
    if not STYLE.get('no_progress'):  # 2026-11-10 원본 NL·BE에는 진행선이 없다
        d.rectangle((0, 0, int(W * T / total), 7), fill=BLUE + (255,))
    if T >= end_t:
        return ov, True
    # 첫 장면 훅(오토스카우트24식): 차명 스티커 + 그 아래 흰 가격
    if T < BLOCKS[1]['t0']:
        e = back(T / .4)
        hk = HOOK or dict(title=CAR['name'], line1=CAR['price'], line2=f"{CAR['year']} · {CAR['km_short']} · {CAR['fuel']}")
        t1 = sticker(hk['title'], STYLE['big_size'] if STYLE.get('hook_minimal') else hk.get('size', 96), 0.0 if STYLE.get('hook_minimal') else -2.5, True)
        t2 = text_img(hk['line1'], 92, BLACK, stroke=7)
        t3 = text_img(hk['line2'], 46, BOLD, stroke=5)
        for _k, (_tx, _sz, _f, _st) in enumerate(((hk['line1'], 92, BLACK, 7), (hk['line2'], 46, BOLD, 5))):  # 화면 폭을 넘으면 줄여서 맞춘다(GLE 첫 화면 글자가 잘림)
            _im = t2 if _k == 0 else t3
            if _im.width > W - 96:
                _im = text_img(_tx, max(28, int(_sz * (W - 96) / _im.width)), _f, stroke=_st)
                if _k == 0:
                    t2 = _im
                else:
                    t3 = _im
        if STYLE.get('hook_be'):  # 2026-11-10 원본 BE 눈 대조: 브랜드 한 낱말만 기울어진 띠, 모델은 같은 줄 흰 글자, 그 아래 한 줄 작은 설명(위 약 24%)
            _tw = hk['title'].split(' ', 1)
            _b = sticker(_tw[0], 84, STYLE.get('tilt_fixed', -5.7), True)
            _m = text_img(_tw[1], 84, HEAVY, stroke=4) if len(_tw) > 1 else None
            _sub = text_img(hk['line1'], 48, BLACK, stroke=4)
            if _sub.width > W - 96:
                _sub = text_img(hk['line1'], max(28, int(48 * (W - 96) / _sub.width)), BLACK, stroke=4)
            _wid = _b.width + (_m.width - 10 if _m else 0)
            _x0, _cy = (W - _wid) / 2, H * .24
            paste(ov, _b, _x0 + _b.width * (1 - e) / 2, _cy - _b.height / 2 + _b.height * (1 - e) / 2, min(1, T / .15), e)
            if _m:
                paste(ov, _m, _x0 + _b.width - 10, _cy - _m.height / 2, min(1, T / .15))
            paste(ov, _sub, (W - _sub.width) / 2, _cy + _b.height / 2 + 4 + 20 * (1 - ease((T - .25) / .3)), ease((T - .25) / .3))
            t1 = t2 = t3 = None
        elif STYLE.get('hook_minimal'):  # 원본 NL: 첫 화면은 차명 한 줄만(위쪽 약 17%), 사양·가격 줄 없음
            if T < 2.2:  # 원본: 차명은 약 2초
                paste(ov, t1, (W - t1.width * e) / 2, H * .17 - t1.height / 2 + t1.height * (1 - e) / 2, min(1, T / .15, (2.2 - T) / .12), e)
            t2 = t3 = None
        else:
            paste(ov, t1, (W - t1.width * e) / 2, 300 + t1.height * (1 - e) / 2, min(1, T / .15), e)
        e2 = ease((T - .25) / .3)
        if t2 is not None:
            paste(ov, t2, (W - t2.width) / 2, 300 + t1.height + 6 + 30 * (1 - e2), e2)
            paste(ov, t3, (W - t3.width) / 2, 300 + t1.height + t2.height + 10, e2)
    # 키워드 스티커(오토스카우트24식): 부위마다, 말하는 구절에 맞춰 톡 튀어나옴.
    # 숫자 사양은 화면 가운데 크게, 기능 이름은 좌·우·가운데를 번갈아 중간 크기로. 가격은 왼쪽에서 밀려 들어옴
    bi = BLOCKS.index(blk)
    big_on = False
    cap_slot = False  # 칩이 말 자막 자리를 쓰는 중(그동안 자막은 숨김 — 원본 NL)
    hide_txts = []  # 자막을 숨기게 한 칩 글자(규칙 captions.hide_mode='related'면 말과 같은 내용일 때만 숨김)
    CR = globals().get('CAP_RULES') or {}
    cur_ph = next((ph for ph in PHRASES if ph[0] <= T < ph[1]), None)
    smeta = blk.get('_smeta') or [{}] * len(blk.get('stickers', []))
    chk = STYLE.get('checklist') or {}
    lst = [i for i, m in enumerate(smeta) if m.get('list')]
    use_chk = chk.get('on') and len(lst) >= chk.get('min_items', 2)
    if use_chk:  # 네덜란드판 ✓ 목록: 말할 때마다 한 줄씩 늘고, 장면(블록) 끝에 한꺼번에 사라짐
        rows = []
        for i in lst:
            st_i = PHRASES[blk['ph0'] + blk['stickers'][i][1]][0] + STYLE.get('chip_delay', 0.1)
            if st_i <= T:
                rows.append((i, st_i))
        rows = rows[-chk.get('max_lines', 3):]  # 2026-11-10: 최근 n줄만(지금 말하는 옵션이 늘 보이게). 예전엔 앞 n개에서 멈춰 뒤 옵션이 안 떴다
        if chk.get('band') == 'cap_hold':
            hold = STYLE.get('option_hold', 1.33)
            rows = [(i, st_i) for i, st_i in rows if T < st_i + hold]
        en_all = blk['t1'] + 0.25
        if rows and T < en_all:
            out = ease((en_all - T) / .15)
            ims = [sticker(blk['stickers'][i][0], STYLE['feat_size'], 0.0, False) for i, _ in rows]
            gap = 18
            tot = sum(im.height for im in ims) + gap * (len(ims) - 1)
            if chk.get('band') == 'cap_hold':  # 2026-11-10 원본 NL 실측: 칩은 자막 자리에서 자막 대신 약 1.3초(말하는 그 낱말), 겹치면 위로 최대 2개, 그 뒤 자막 복귀
                pass
            if chk.get('band') == 'above_cap':  # 2026-11-10: 말 자막 바로 위에서 위로 쌓고 자막은 그대로 둔다(옵션 블록 10초 동안 자막이 사라지던 문제)
                y0 = STYLE.get('cap_cy', 1129) - chk.get('cap_gap', 120) - tot
            elif chk.get('band') in ('cap', 'cap_hold'):  # 말 자막 자리(아래 줄 = 자막 높이)에서 위로 쌓고, 그동안 자막을 숨긴다(NL 원본 66%)
                _hm = CR.get('hide_mode', 'related')  # always=원본처럼 자막 대신 칩 / related=같은 말일 때만 / never=자막은 늘 보이고 칩은 자막 위로(2026-11-10 사용자 「포인트칩 있는 대사가 자막에 안 나온다」)
                rel = _hm == 'always' or (_hm == 'related' and (cur_ph is None or any(chip_related(cur_ph[2], blk['stickers'][i][0]) for i, _ in rows)))
                if rel:
                    y0 = STYLE.get('cap_cy', 1129) + ims[-1].height / 2 - tot
                    big_on = True
                    cap_slot = True
                    hide_txts += [blk['stickers'][i][0] for i, _ in rows]
                else:  # 칩이 말과 다른 내용이면 자막을 지우지 않고 칩을 자막 위로 올린다(말이 화면에서 빠지지 않게)
                    y0 = STYLE.get('cap_cy', 1129) - chk.get('cap_gap', 120) - tot
            else:
                y0 = STYLE.get('band_y', {}).get(chk.get('band', 'mid'), STYLE['feat_y']) - tot / 2
            for (i, st_i), im in zip(rows, ims):
                e = back((T - st_i) / .28)
                sc = max(.05, e)
                x = (W - im.width) / 2 if chk.get('band') in ('cap', 'above_cap', 'cap_hold') else 96  # 자막 자리면 가운데, 아니면 왼쪽 정렬
                paste(ov, im, x + im.width * (1 - sc) / 2, y0 + im.height * (1 - e) / 2, min(1, (T - st_i) / .1) * out, sc)
                y0 += im.height + gap
    for si, (txt, pidx) in enumerate(blk.get('stickers', [])):
        if use_chk and si in lst:
            continue
        p0 = PHRASES[blk['ph0'] + pidx]
        st = p0[0] + STYLE.get('chip_delay', 0.1)
        nx = blk.get('stickers')[si + 1][1] if si + 1 < len(blk['stickers']) else None
        en = PHRASES[blk['ph0'] + nx][0] if nx is not None else blk['t1'] + 0.25
        en = min(en, st + STYLE.get('chip_hold_max', 2.6))  # 자동 편집기: 원본 칩 유지(NL 1.33 · BE 1.5초)보다 오래 자막을 가리지 않게
        if smeta[si].get('option') and STYLE.get('option_hold'):
            en = max(en, min(st + STYLE['option_hold'], blk['t1'] + 0.25))  # 옵션 칩은 최소 hold 초
        if not (st <= T < en):
            continue
        band = smeta[si].get('band')
        if band == 'low' and (globals().get('CAP_RULES') or {}).get('hide_mode', 'related') == 'always':
            big_on = True  # 아래쪽 칩(1420)은 자막(NL 1190·BE 1229)과 겹치지 않으므로 related 모드에서는 숨기지 않는다(2026-11-10 자막 빠짐 방지)
            hide_txts.append(txt)
        big = bool(re.search(r'\d', txt)) and (STYLE.get('feat_pos') != 'as24' or len(txt.replace(' ', '')) <= 9)
        big = big and STYLE.get('big_numbers', True)  # 벨기에판: 숫자도 칩 안에(크게 튀어나오지 않음)
        if big:  # 큰 숫자·숫자 칩은 자막 자리와 겹치지 않으므로 related 모드에서는 자막을 숨기지 않는다(자막 빠짐 방지)
            big_on = True
        elif STYLE.get('numchip_hides_cap') and re.search(r'\d', txt):
            big_on = True  # 벨기에판: 숫자 칩(가격·km·연식)이 떠 있는 동안 말 자막을 숨김(BE 9/50)  # 숫자 사양만 크게(「2열 열선·통풍·전동」 같은 기능 이름은 기능 스티커)
        tilt = (-3, 2.5, -2, 3, -2.5, 2)[(bi + si) % 6] * STYLE.get('tilt_k', 1.0)
        if STYLE.get('tilt_fixed') is not None:
            tilt = STYLE['tilt_fixed'] + (-0.8, 0.6, 0.0)[(bi + si) % 3] * (STYLE['tilt_fixed'] != 0)  # 벨기에판: 늘 반시계(1~4도)
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
            if band and STYLE.get('band_y'):
                y = STYLE['band_y'][band] - im.height / 2 - ady  # 부위별 자리(자동 편집기): 그 부위를 가리지 않는 높이
                _CR = globals().get('CAP_RULES') or {}
                if _CR.get('hide_mode') == 'never':  # 자막을 숨기지 않으니 칩이 자막 줄과 겹치면 자막 위로 올린다(2026-11-10 BE 아래 칩 1290 ↔ 자막 1283 겹침)
                    cc, ch = STYLE.get('cap_cy', 1190), _CR.get('cap_clear_px', 70)
                    if y + im.height > cc - ch and y < cc + ch:
                        y = cc - ch - im.height - ady
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
    _speech = cur is not None
    _chip_cover = False
    if cur and (cap_slot or (big_on and (STYLE.get('big_hides_cap') or STYLE.get('numchip_hides_cap')))):
        # 네덜란드판: 큰 숫자가 떠 있는 동안 말 자막을 숨긴다(NL 39/50). 2026-11-10: 칩이 말과 같은 내용일 때만(규칙 captions.hide_mode)
        # related: 칩이 자막 자리를 차지하고(자막 자리·아래 띠) 말과 같은 내용일 때만 숨김. 겹치지 않는 큰 숫자 칩은 숨기지 않음
        if CR.get('hide_mode', 'related') == 'always' or (CR.get('hide_mode', 'related') == 'related' and any(chip_related(cur[2], t_) for t_ in hide_txts)):
            _chip_cover = any(chip_related(cur[2], t_) for t_ in hide_txts)  # 같은 말이 칩으로 보임 = 말이 화면에서 빠진 게 아님
            cur = None
    _chip_ph = {b['ph0'] + st_[1] for b in BLOCKS for st_ in b.get('stickers', [])}  # 포인트칩이 걸린 구절
    if cur and STYLE.get('cap_cut_gap') and (cur[1] - cur[0]) >= CR.get('cut_gap_min_phrase_s', 1.2) \
            and not (CR.get('cut_gap_skip_chip', True) and PHRASES.index(cur) in _chip_ph):  # 칩 대사는 컷 뒤에도 바로 자막(2026-11-10 BE 칩 순간 0.3초 빈 자막)
        g = STYLE['cap_cut_gap']  # 짧은 구절에는 컷 뒤 비우기를 하지 않는다(짧은 말이 통째로 안 보이던 문제)
        if any(sh['a'] > 0.5 and sh['a'] <= T < sh['a'] + g for sh in shots):
            cur = None  # 벨기에판: 컷이 바뀐 뒤 0.3초는 자막을 비운다
    CAPLOG.append((round(T, 3), _speech, cur is not None, PHRASES.index(cur_ph) if cur_ph else -1, _chip_cover))  # 검수: 말하는데 자막이 빈 프레임 수(meta.cap_gap_s)
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
            paste(ov, im, W / 2 - im.width * sc / 2, cy - im.height * sc / 2, min(1, (T - t_in) / .06), sc)
            return ov, False
        if STYLE.get('cap_style') == 'nl2':  # 네덜란드식 v2: 외곽선 흰 글자, 강조어 칩(파랑) 줄 안, 톡 등장, 높이 63%
            im = phrase_img_nl2(cur[2], cap_keyword_any(cur[2], blk))
            e = back((T - cur[0]) / 0.16)
            sc = max(.05, 0.82 + 0.18 * e)
            cy = STYLE.get('cap_cy', 1210)
            paste(ov, im, W / 2 - im.width * sc / 2, cy - im.height * sc / 2, min(1, (T - cur[0]) / .06), sc)
            return ov, False
        if STYLE.get('cap_style') == 'be2':  # 벨기에식 v2: 그림자 흰 글자 바로 등장(높이 68%) + 강조어 있으면 바로 위(64%)에 파랑 칩 톡
            im = phrase_img_be2(cur[2])
            cy = STYLE.get('cap_cy', 1305)
            paste(ov, im, W / 2 - im.width / 2, cy - im.height / 2, min(1, (T - cur[0]) / .04))
            kw = cap_keyword(cur[2], blk)
            if kw >= 0:
                ws = cur[2].strip(' ,.').split(' ')
                kt = cur[3][kw] if kw < len(cur[3]) else cur[0]
                if T >= kt:
                    wd = ws[kw]
                    m = re.match(r'^([0-9][0-9.,]*(?:km|cc|마력|만원|년|월)?)', wd)  # 조사(밖에·에 등) 떼고 숫자+단위만
                    ch = kw_chip_be2(m.group(1) if m else re.sub(r'(에|가|이|는|은|을|를|도|만|밖에)$', '', wd))
                    e = back((T - kt) / 0.2)
                    sc = max(.05, e)
                    top = cy - im.height / 2 - ch.height + 6
                    paste(ov, ch, W / 2 - ch.width * sc / 2, top + ch.height * (1 - sc) / 2, min(1, (T - kt) / .06), sc)
            return ov, False
        if STYLE.get('cap_style') == 'be3':  # 벨기에판: 그림자 흰 글자, 말하는 어절만 노랑, 바로 등장, 67%
            act = max([j for j, st in enumerate(cur[3]) if st <= T] or [0])
            txt, t_in, act = cap_chunk(cur, act)
            im = phrase_img_be3(txt, act)
            cy = STYLE.get('cap_cy', 1286)
            paste(ov, im, W / 2 - im.width / 2, cy - im.height / 2, min(1, (T - t_in) / .04))
            return ov, False
        if STYLE.get('cap_style') == 'be':  # 벨기에: 바로 등장, 강조어만 노랑 형광펜
            im = phrase_img_be(cur[2], cap_keyword(cur[2], blk))
            cy = STYLE.get('cap_cy', 1300)
            paste(ov, im, W / 2 - im.width / 2, cy - im.height / 2, min(1, (T - cur[0]) / .04))
            return ov, False
        if STYLE.get('cap_style') == 'de':  # 독일: 외곽선 흰 글자, 강조 없음, 바로 등장
            im = phrase_img_de(cur[2])
            cy = STYLE.get('cap_cy', 1114)
            paste(ov, im, W / 2 - im.width / 2, cy - im.height / 2, min(1, (T - cur[0]) / .04))
            return ov, False
        if STYLE.get('cap_style') == 'plain':  # 오토스카우트 NL 말 자막: 바탕 없이 흰 굵은 글자+검정 외곽선, 지금 말하는 낱말만 파랑(말 따라 이동), 톡 등장
            act = max([j for j, st in enumerate(cur[3]) if st <= T] or [0])
            txt, t_in, act = cap_chunk(cur, act)
            im = phrase_img_nlcap(txt, act) if STYLE.get('cap_heavy') else phrase_img_v12(txt, act, False)
            e = back((T - t_in) / 0.16)
            sc = max(.05, 0.82 + 0.18 * e)
            cy = STYLE.get('cap_cy', 1248)
            paste(ov, im, W / 2 - im.width * sc / 2, cy - im.height * sc / 2, min(1, (T - t_in) / .06), sc)
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
    if STYLE.get('end_style') == 'logo':  # 2026-11-10 원본 NL 눈 대조: 끝 화면은 로고만 약 2초(가격 명함 없음)
        im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(im).rectangle((0, 0, W, H), fill=(8, 10, 14, 120))
        lp = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'public', 'assets', 'shortform', 'bobae_logo_600.png')
        lg = Image.open(lp).convert('RGBA')
        a = np.array(lg)
        word = np.zeros(a.shape[:2], bool); word[:, int(a.shape[1] * 30 / 122) + 4:] = True  # 왼쪽 원(엠블럼)은 그대로, 오른쪽 글자는 흰색
        a[word & (a[..., 3] > 0), :3] = 255
        lg = Image.fromarray(a)
        lg = lg.resize((int(W * .62), int(W * .62 * lg.height / lg.width)), Image.LANCZOS)
        im.alpha_composite(lg, (int((W - lg.width) / 2), int(H * .45 - lg.height / 2)))
        return im
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
    {'spy': build_bgm_spy, 'file': build_bgm_file}.get(STYLE.get('bgm'), build_bgm)(total)
    build_phrases()
    build_sfx(total)
    cap = cv2.VideoCapture(SRC)
    nframes = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    global SRC_FPS
    SRC_FPS = float(cap.get(cv2.CAP_PROP_FPS) or 0) or float(FPS)  # 원본 시각(초) → 원본 장면 번호는 원본의 실제 fps로(출력 FPS와 다를 수 있음)
    shots = clamp_to_segments(plan_shots(total), nframes / SRC_FPS)
    dump_match(shots)
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
    # 구절마다 말하는 동안 자막이 보인 비율(check_match.py가 읽음, 규칙 captions.min_visible_ratio)
    try:
        M = json.load(open(os.path.join(OUT, 'match.json'), encoding='utf-8'))
        caps = []
        for pi, ph in enumerate(PHRASES):
            fr = [c for c in CAPLOG if c[3] == pi and c[1]]
            # visible = 자막이 보였거나 같은 말의 칩이 자막 자리에 떠 있던 비율(원본 NL: 칩이 그 낱말을 대신 보여 줌). caption_only = 자막만
            caps.append(dict(i=pi, text=ph[2], t0=round(ph[0], 2), t1=round(ph[1], 2),
                             visible=round(sum(1 for c in fr if c[2] or c[4]) / max(1, len(fr)), 2),
                             caption_only=round(sum(1 for c in fr if c[2]) / max(1, len(fr)), 2)))
        M['captions'] = caps
        for ch in M.get('chips', []):  # 칩이 뜬 순간(말 시작 ~ +chip_check_s) 자막이 실제로 보였나(2026-11-10 「포인트칩 있는 대사가 자막에 안 나온다」 전수조사)
            w = [c for c in CAPLOG if ch['t'] <= c[0] < ch['t'] + (globals().get('CAP_RULES') or {}).get('chip_check_s', 1.3) and c[1]]
            ch['cap_shown'] = round(sum(1 for c in w if c[2]) / max(1, len(w)), 2)
        json.dump(M, open(os.path.join(OUT, 'match.json'), 'w'), ensure_ascii=False, indent=1)
    except Exception as e_:
        print('match.json 자막 기록 실패', e_)
    meta = dict(total=round(total, 2), shots=len(shots), sec_per_cut=round(total / len(shots), 2),
                plate_frames=sum(1 for v in track.values() if v), cap_gap_s=round(sum(1 for _, sp, sh, _p, cv in CAPLOG if sp and not sh and not cv) / max(1, FPS if 'FPS' in globals() else 30), 2), render_sec=round(time.time() - t_start, 1),
                blocks=[dict(t=round(b['t0'], 2), sec=b['sec'], text=b['tts']) for b in BLOCKS])
    json.dump(meta, open(os.path.join(OUT, 'meta.json'), 'w'), ensure_ascii=False, indent=1)
    print(meta)


if __name__ == '__main__':
    main()
