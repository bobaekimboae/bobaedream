"""원본 매물 영상 → 장면 목록 + 부위 이름표(shots.json) 자동 생성. auto_edit.py build 의 입력.

python3 -I shot_tagger.py src.mp4 --out shots.json [--sheet sheet.jpg]

1) 0.5초 창마다 가운데 장면 1장을 뽑고, 오픈소스 CLIP(openai/clip-vit-base-patch32, MIT)로 부위 문장과 비교해 점수를 매긴다.
2) 옆 창과 부위가 같으면 하나로 잇고, 장면 전환(화면 차이 큼)에서는 끊는다.
3) 점수가 낮은 장면(0.30 미만)은 part=other 로 두고 대본·칩 배치에 쓰지 않는다.
부위 이름은 auto_edit_rules.json parts 와 같다. 사람 표시(score·note)는 바꾸지 않는다.
"""
import argparse, json, os, subprocess, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
RULES = json.load(open(os.path.join(HERE, 'auto_edit_rules.json'), encoding='utf-8'))

# 부위 → 영어 설명 문장(여러 개 평균). 브랜드·차종 이름 없음
PROMPTS = {
    'exterior_front': ['a photo of the front of a car with the grille and headlights, whole front visible', 'a front three-quarter view of a car showing headlights and front bumper'],
    'exterior_3_4': ['a three-quarter view photo of a whole car in a showroom'],
    'exterior_side': ['a side view photo of a car body and doors'],
    'exterior_rear': ['a photo of the back of a car with taillights and license plate', 'a photo of the rear of a car with the tailgate open'],
    'wheel': ['a close-up photo of a car wheel rim and tire'],
    'headlight': ['a close-up photo of a car headlight'],
    'taillight': ['a close-up photo of a car taillight'],
    'grille': ['a close-up photo of a car front grille and emblem'],
    'trunk': ['a close-up photo of an empty car trunk cargo floor', 'a photo looking into an open car trunk cargo space from behind'],
    'engine_bay': ['a photo of a car engine bay under the open hood'],
    'interior_dash': ['a photo of a car dashboard interior seen from the back seat', 'a wide photo of a luxury car interior with steering wheel, dashboard screen and front seats', 'inside a car cabin looking forward through the windshield'],
    'steering_wheel': ['a close-up photo of a car steering wheel'],
    'screen': ['a close-up photo of a car infotainment touch screen showing a map or camera'],
    'console': ['a close-up photo of a car center console with buttons and cup holders', 'a photo of a rear seat center armrest with climate control buttons'],
    'gear': ['a close-up photo of a car gear shifter'],
    'seats_front': ['a photo of car front seats leather upholstery'],
    'seats_rear': ['a photo of car rear seats from the open rear door'],
    'interior_ceiling': ['a photo of a car interior roof headliner and sunroof', 'a photo looking up at a car panoramic glass sunroof from inside'],
    'door': ['a photo of the inside panel of an open car door', 'a close-up photo of a car door trim panel with handle and window switches'],
    'key': ['a photo of a car key fob'],
    'other': ['a blurry photo of a floor', 'a black screen'],
}
MIN_SCORE = 0.30
SHORT_S, SHORT_MIN_SCORE = 1.0, 0.7   # 1초 이하이면서 점수 0.7 미만 장면은 other(문 안쪽을 지붕으로 읽은 DBX 23.5초 사례)
WIN = 0.5


def frames(src, step):
    p = subprocess.run(['ffprobe', '-v', '0', '-show_entries', 'stream=width,height:format=duration', '-select_streams', 'v:0', '-of', 'json', src],
                       capture_output=True, text=True)
    j = json.loads(p.stdout); dur = float(j['format']['duration']); w, h = j['streams'][0]['width'], j['streams'][0]['height']
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', src, '-vf', f'fps={1/step},scale=224:224', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                         capture_output=True).stdout
    n = len(raw) // (224 * 224 * 3)
    arr = np.frombuffer(raw[:n * 224 * 224 * 3], np.uint8).reshape(n, 224, 224, 3)
    return dur, (w, h), arr


def tag(src):
    import torch
    from transformers import CLIPModel, CLIPProcessor
    m = CLIPModel.from_pretrained('openai/clip-vit-base-patch32').eval(); pr = CLIPProcessor.from_pretrained('openai/clip-vit-base-patch32')
    keys = list(PROMPTS); texts = [t for k in keys for t in PROMPTS[k]]; own = [k for k in keys for _ in PROMPTS[k]]
    dur, size, arr = frames(src, WIN)
    with torch.no_grad():
        ti = pr(text=texts, return_tensors='pt', padding=True); tf = m.get_text_features(**ti); tf = getattr(tf, 'pooler_output', tf); tf = tf / tf.norm(dim=-1, keepdim=True)
        feats = []
        for i in range(0, len(arr), 32):
            ii = pr(images=[Image.fromarray(a) for a in arr[i:i + 32]], return_tensors='pt'); f = m.get_image_features(**ii); f = getattr(f, 'pooler_output', f)
            feats.append(f / f.norm(dim=-1, keepdim=True))
        imf = torch.cat(feats)
        logits = (100 * imf @ tf.T).softmax(-1).numpy()
    prob = np.stack([logits[:, [j for j, o in enumerate(own) if o == k]].sum(1) for k in keys], 1)
    # 장면 전환: 옆 창과 화면 차이(작은 회색 그림 평균 차)
    small = arr[:, ::8, ::8].astype(np.float32).mean(-1)
    diff = np.r_[255, np.abs(np.diff(small, axis=0)).mean((1, 2))]
    sm = prob.copy()
    sm[1:-1] = (prob[:-2] + 2 * prob[1:-1] + prob[2:]) / 4   # 앞뒤 창과 섞어 흔들림 줄이기
    lab = []
    for i in range(len(arr)):
        k = int(sm[i].argmax())
        if keys[k] == 'exterior_3_4':   # 3/4는 창마다 앞·뒤 중 더 가까운 쪽(대본은 앞·뒤를 씀)
            k = keys.index('exterior_rear') if sm[i, keys.index('exterior_rear')] > sm[i, keys.index('exterior_front')] else keys.index('exterior_front')
            sm[i, k] = max(sm[i, k], sm[i, keys.index('exterior_3_4')])
        lab.append(keys[k] if sm[i, k] >= MIN_SCORE else 'other')
    # 같은 부위끼리 잇기 → 1초 미만 조각은 앞뒤 중 확률이 높은 쪽 부위로 흡수(장면 전환에서는 흡수하지 않음)
    def runs(L):
        R = []
        for i, l in enumerate(L):
            if R and R[-1][0] == l: R[-1][2] = i
            else: R.append([l, i, i])
        return R
    for _ in range(3):
        R = runs(lab); changed = False
        for j, (l, i0, i1) in enumerate(R):
            if (i1 - i0 + 1) * WIN >= 1.0: continue
            cand = [R[x][0] for x in (j - 1, j + 1) if 0 <= x < len(R)]
            if not cand: continue
            best = max(cand, key=lambda c: sm[i0:i1 + 1, keys.index(c)].mean() if c != 'other' else 0)
            if diff[i0] >= 60 and j > 0 and best == R[j - 1][0] and len(cand) > 1: best = cand[-1]
            for i in range(i0, i1 + 1): lab[i] = best
            changed = True
        if not changed: break
    # 3/4 장면은 대본이 앞·뒤를 쓰므로 그 구간에서 앞·뒤 중 더 가까운 쪽으로
    for l, i0, i1 in runs(lab):
        if l == 'exterior_3_4':
            f, r = prob[i0:i1 + 1, keys.index('exterior_front')].sum(), prob[i0:i1 + 1, keys.index('exterior_rear')].sum()
            for k in range(i0, i1 + 1): lab[k] = 'exterior_rear' if r > f else 'exterior_front'
    res = []
    for l, i0, i1 in runs(lab):
        sc = [float(prob[i].max()) for i in range(i0, i1 + 1)]
        res.append({'t0': round(i0 * WIN, 2), 't1': round(min(dur, (i1 + 1) * WIN), 2), 'part': l, '_s': sc})
    for s in res:
        s['score'] = round(float(np.mean(s.pop('_s'))), 2); s['by'] = 'clip'
        if s['t1'] - s['t0'] <= SHORT_S and s['score'] < SHORT_MIN_SCORE:   # 짧고 자신 없는 장면은 칩·옵션 장면으로 쓰지 않음
            s['part'], s['note'] = 'other', '짧고 점수 낮음'
    return res, dur, size


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('--out', required=True); ap.add_argument('--sheet')
    a = ap.parse_args()
    shots, dur, size = tag(a.src)
    json.dump(shots, open(a.out, 'w'), ensure_ascii=False, indent=1)
    for s in shots: print(f"{s['t0']:6.2f}~{s['t1']:6.2f} {s['part']:16} {s['score']}")
    if a.sheet:
        ims = []
        for s in shots:
            t = (s['t0'] + s['t1']) / 2
            r = subprocess.run(['ffmpeg', '-loglevel', 'error', '-ss', str(t), '-i', a.src, '-frames:v', '1', '-vf', 'scale=-2:240', '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True).stdout
            from io import BytesIO
            from PIL import ImageDraw
            im = Image.open(BytesIO(r)).convert('RGB'); d = ImageDraw.Draw(im)
            d.rectangle([0, 0, im.width, 22], fill=(0, 0, 0)); d.text((4, 4), f"{s['t0']:.1f} {s['part']} {s['score']}", fill=(255, 255, 0))
            ims.append(im)
        cols = 8; w, h = ims[0].size; sh = Image.new('RGB', (w * cols, h * ((len(ims) + cols - 1) // cols)))
        for i, im in enumerate(ims): sh.paste(im.resize((w, h)), ((i % cols) * w, (i // cols) * h))
        sh.save(a.sheet, quality=80)
