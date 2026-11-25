"""교체 시험 2번: G350 v8 렌더에서 「칩·자막·첫 화면·끝 화면」 4개 층만 빼고 바탕 영상을 만든 뒤,
빠진 층이 언제·어디에 나와야 하는지를 hf_layers.json으로 남긴다. 나머지(화살표·큰 숫자·T01~T08·소리)는 그대로 PIL/skia.

사용: G350_DIR=<g350 폴더>/ G350_OUT=hf_base.mp4 python3 hf_split.py
렌더러 원본(scripts/shortform/video_listing/g350_v8_render.py)은 고치지 않는다 — 글자를 바꿔 끼워 실행만 한다.
"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
RENDER = os.path.join(REPO, 'scripts/shortform/video_listing/g350_v8_render.py')
src = open(RENDER, encoding='utf-8').read()

SWAP = [  # (원본 글자, 바꿀 글자) — 하나라도 못 찾으면 멈춘다(렌더러가 바뀐 것)
    ("pop(cv,HB,", "REC('HB',"),
    ("pop(cv,HM,", "REC('HM',"),
    ("pop(cv,HS,", "REC('HS',"),
    ("pop(cv,Cimg,(cx,cy),t,tc)", "REC('chip',(cx,cy),t,tc,lab=clab)"),
    ("pop(cv,Simg,", "REC('sub',"),
    ("draw_sub(cv,nfr/FPS) if not HIDE_SUB[0] else None", "SUBREC.append(not HIDE_SUB[0])"),
    ("draw_sub(cv,nfr/FPS) if nfr/FPS<VOICE else None", "SUBREC.append(nfr/FPS<VOICE)"),
    ("t=nfr/FPS-ENDT; cv=Image.alpha_composite(base,Image.new('RGBA',(W,H),(0,0,0,int(185*min(1,t/0.3)))))", "t=nfr/FPS-ENDT; cv=base.copy()"),
    ("cv.alpha_composite(L2,((W-lw)//2,640-(L2.height-LG.height)//2))", "pass"),
]
for a, b in SWAP:
    assert src.count(a) == 1, f'렌더러에서 못 찾음(또는 여러 개): {a}'
    src = src.replace(a, b)

FR = {}; SUBREC = []


def REC(name, pos, t, t_in, dur=0.2, lab=None):
    """pop()을 대신해 그리지 않고 기록만: 프레임 → [(이름, 글자, x, y, 절대 등장 시각)]."""
    if t < t_in:
        return
    g = G_
    label = {'HB': '벤츠', 'HM': 'G350 블루텍', 'HS': '2013년식 · 디젤 · W463'}.get(name, lab)
    if name == 'sub':
        label = g['sub'][0]
    FR.setdefault(g['nfr'], []).append([name, label, int(pos[0]), int(pos[1]), round(g['t0'] + t_in, 4)])


G_ = {'__name__': '__main__', '__file__': RENDER, 'REC': REC, 'SUBREC': SUBREC}
sys.argv = [RENDER]
exec(compile(src, RENDER, 'exec'), G_)

# 배치 숫자
sys.path.insert(0, HERE)
import hf_layout as HL  # noqa: E402
g = G_; Wd = g['W']
geo = {}
for fr, items in FR.items():
    for name, label, x, y, _ in items:
        k = f'{name}:{label}'
        if k in geo: continue
        if name == 'HB': geo[k] = HL.chip_geom(label, g['R']['chip']['title_font_px'], title=True)
        elif name == 'chip': geo[k] = HL.chip_geom(label, 70)
        elif name == 'HM': geo[k] = HL.white_geom(label, g['_hs'])
        else: geo[k] = HL.white_geom(label, 58)
WS = g['WS']; CH = g['CH']
chunks = []
for q, ch in enumerate(CH):
    a = WS[ch[0]][1] - 0.05; b = (WS[CH[q + 1][0]][1] - 0.05) if q + 1 < len(CH) else g['TOTAL']
    words = [WS[j][0].strip(' ,.?!') for j in ch]
    sg = HL.sub_geom(words, g['R']['caption']['font_px'], Wd)
    chunks.append({'a': round(a, 4), 'b': round(b, 4), 'starts': [WS[j][1] for j in ch], **sg})
LG_W, LG_H = g['LG'].size
out = {'fps': g['FPS'], 'W': Wd, 'H': g['H'], 'total': g['TOTAL'], 'voice': g['VOICE'], 'endt': g['ENDT'],
       'capy': g['CAPY'], 'cap_px': g['R']['caption']['font_px'], 'yellow': '#%02X%02X%02X' % g['YEL'], 'ink': '#%02X%02X%02X' % g['INK'],
       'logo': {'w': LG_W, 'h': LG_H, 'y': 640}, 'geo': geo, 'frames': FR, 'sub_on': SUBREC, 'chunks': chunks,
       'base': g['OUT']}
json.dump(out, open(os.path.join(g['G'], 'hf_layers.json'), 'w'), ensure_ascii=False, default=lambda o: o.item() if hasattr(o, 'item') else list(o))
print('hf_layers.json', len(FR), '프레임 기록', len(geo), '모양', len(chunks), '자막 덩어리')
