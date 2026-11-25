# T6 교차 확인: 우리 자막·칩 모양 한국어 30줄을 실제 매물 영상 프레임 위에 그려 PP-OCRv5 한국어로 읽고 글자 오류율(CER)을 잰다.
import json, random, subprocess, sys, os, difflib, numpy as np
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, '/home/claude/bobaedream/scripts/shortform/auto')
import ocr_text
F = '/home/claude/bobaedream/scripts/shortform/fonts/'
LINES = ["이천십삼년식 벤츠 지바겐", "제논 헤드램프", "엘이디 주간등까지 들어가 있고요", "휠은 십팔인치 알로이예요", "브라운 가죽 시트",
 "전동 선루프", "최대 삼천오백 킬로그램", "트렁크는 기본 사백팔십 리터", "메모리 시트 3개", "통풍 시트와 열선 핸들",
 "1인 신조 무사고", "주행거리 2만 3천 km", "조이모터스 이지유 딜러", "보배드림 앱에서 확인하세요", "가격 상담 가능",
 "어댑티브 크루즈 컨트롤", "헤드업 디스플레이", "360도 서라운드 뷰", "차선 유지 보조", "파노라마 선루프",
 "캘리그라피 트림", "노블레스 스페셜", "정식 출고 차량", "리스 승계 가능", "제조사 보증 남음",
 "디퍼렌셜 락 3개", "견인고리 있어요", "공조 다이얼", "토크 55kg·m", "제로백 3.4초"]
STY = ['white', 'chip']
random.seed(7)
import glob
def cover(p):
    im = Image.open(p).convert('RGB'); s = max(1080 / im.width, 1920 / im.height)
    im = im.resize((int(im.width * s) + 1, int(im.height * s) + 1)); x = (im.width - 1080) // 2; y = (im.height - 1920) // 2
    return np.array(im.crop((x, y, x + 1080, y + 1920)))
S2 = os.environ.get('CAR_SRC2', '/home/claude/work/osst/t2src/fordgt/src2')   # 글자 없는 원본 매물 사진 폴더
FR = [cover(p) for p in sorted(glob.glob(S2 + '/p0?.png')) + sorted(glob.glob(S2 + '/p1[0-2].png'))]  # 글자 없는 원본 매물 사진
def cer(gt, hyp):
    g, h = gt.replace(' ', ''), hyp.replace(' ', '')
    sm = difflib.SequenceMatcher(None, g, h); ed = 0
    for op, a0, a1, b0, b1 in sm.get_opcodes():
        if op != 'equal': ed += max(a1 - a0, b1 - b0)
    return ed / max(1, len(g))
rows = []; tot_e = tot_n = 0
for i, t in enumerate(LINES):
    sty = STY[i % 2]; im = Image.fromarray(FR[i % len(FR)]).convert('RGB'); d = ImageDraw.Draw(im)
    f = ImageFont.truetype(F + ('Pretendard-ExtraBold.otf'), 62 if sty == 'white' else 56)
    w = d.textlength(t, font=f); x = (1080 - w) / 2; y = 1250 if sty == 'white' else 420
    if sty == 'chip':
        d.rectangle([x - 26, y - 14, x + w + 26, y + 80], fill=(245, 242, 0)); d.text((x, y), t, font=f, fill=(20, 20, 20))
    else:
        d.text((x, y), t, font=f, fill=(255, 255, 255), stroke_width=5, stroke_fill=(0, 0, 0))
    p = f'l{i:02d}.png'; im.save(p)   # 전체 프레임(실제 사용과 같게)
    ty0, ty1 = y - 20, y + (80 if sty == 'chip' else 75) + 20; tx0, tx1 = x - 40, x + w + 40   # 그린 글자 자리(잘라낸 그림 좌표)
    hits = [r for r in ocr_text.read_ko(p, 0.3) if ty0 <= (r['b'][1] + r['b'][3]) / 2 <= ty1 and tx0 <= (r['b'][0] + r['b'][2]) / 2 <= tx1]
    got = ' '.join(r['t'] for r in sorted(hits, key=lambda r: r['b'][0]))
    c = cer(t, got); n = len(t.replace(' ', '')); tot_e += c * n; tot_n += n
    rows.append({'gt': t, 'ocr': got, 'style': sty, 'cer': round(c, 3)})
res = {'lines': len(rows), 'cer_total': round(tot_e / tot_n, 3), 'cer_white': round(np.mean([r['cer'] for r in rows if r['style'] == 'white']), 3),
       'cer_chip': round(np.mean([r['cer'] for r in rows if r['style'] == 'chip']), 3), 'exact_lines': sum(r['cer'] == 0 for r in rows), 'rows': rows}
json.dump(res, open('t6_result.json', 'w'), ensure_ascii=False, indent=1)
print({k: v for k, v in res.items() if k != 'rows'})
for r in rows:
    if r['cer'] > 0: print(r['cer'], r['gt'], '→', r['ocr'])
