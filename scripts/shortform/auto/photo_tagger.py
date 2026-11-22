"""사진 매물 → 사진마다 부위 이름표(photo_tags.json) 자동 생성. photo_auto.py 의 입력.

python3 -I photo_tagger.py 사진폴더 --out photo_tags.json [--sheet sheet.jpg]

사진은 한 장에 부위 하나라 영상(shot_tagger.py)보다 판단이 쉽다. 같은 오픈소스 CLIP(openai/clip-vit-base-patch32, MIT)으로
부위 문장과 비교해 사진마다 1·2·3순위 부위와 점수를 남긴다. 사진은 고치지 않는다(읽기만).
거의 같은 사진(작은 회색 그림 평균 차 < 6)은 dup 으로 표시해 한 영상에 두 번 쓰지 않게 한다.
"""
import argparse, glob, json, os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from shot_tagger import PROMPTS as BASE

PROMPTS = dict(BASE)
PROMPTS.update({
    # 사진 매물에 자주 나오는 장면을 더 나눈다(영상용 문장은 그대로 두고 덧붙임)
    'exterior_3_4': ['a three-quarter view photo of a whole car in a showroom', 'a photo of a whole sports car from the front corner'],
    'exterior_side': ['a side view photo of a car body and doors', 'a photo of the full side profile of a sports car'],
    'screen': ['a close-up photo of a car infotainment touch screen showing a map or camera', 'a photo of a car digital instrument cluster with speedometer and odometer'],
    'roof': ['a photo of a convertible car with the roof open', 'a photo of a car roof from above'],
    'other': ['a blurry photo of a floor', 'a black screen', 'a photo of a document or paper'],
})


# 2단계 세부 분류(외관 방향 · 화면 종류). 대본은 앞·뒤·옆과 후방카메라 화면을 구분해 써야 한다
EXTERIOR = {'exterior_front', 'exterior_rear', 'exterior_side', 'exterior_3_4'}
WHOLE = {'whole': ['a photo of a whole car standing on the floor'], 'part': ['a close-up photo of one part of a car']}
FRONT_REAR = {'front': ['a photo of the front of a car, headlights and front grille visible'],
              'rear': ['a photo of the back of a car, taillights and exhaust pipes visible']}
# 2026-11-22 실측(차란차 슈퍼카 5대 외관 20장): CLIP은 「정면이냐 45°냐」를 못 가린다(20장 모두 45°로 판단).
# 정면·후면 사진은 좌우가 거의 대칭이라 좌우 뒤집은 그림과의 차가 작다 → 대칭도로 가리면 20/20.
# 앞/뒤는 CLIP 단독 16/20 → 같은 묶음(정면 쌍·45° 쌍) 안에서 앞 확률이 높은 쪽을 앞으로 정하면 20/20.
STRAIGHT_RATIO = 0.8


def symmetry_diff(im):
    g = np.asarray(im.convert('L').resize((160, 90)), np.float32)[30:85]   # 차가 놓인 아래쪽(위 간판 글자 제외)
    return float(np.abs(g - g[:, ::-1]).mean())


SCREEN = {'screen', 'steering_wheel', 'interior_dash', 'console'}
SCREEN_KIND = {
    'cluster': ['a close-up photo of a car digital instrument cluster with speedometer and tachometer'],
    'camera': ['a car screen showing the rear view camera image of a parking garage with guide lines'],
    'map': ['a car screen showing a navigation map'],
    'none': ['a photo of a car interior without any screen in focus'],
}


def _cls(m, pr, ims, table):
    import torch
    keys = list(table); texts = [t for k in keys for t in table[k]]; own = [k for k in keys for _ in table[k]]
    with torch.no_grad():
        ti = pr(text=texts, return_tensors='pt', padding=True); tf = m.get_text_features(**ti); tf = getattr(tf, 'pooler_output', tf); tf = tf / tf.norm(dim=-1, keepdim=True)
        ii = pr(images=ims, return_tensors='pt'); f = m.get_image_features(**ii); f = getattr(f, 'pooler_output', f); f = f / f.norm(dim=-1, keepdim=True)
        lg = (100 * f @ tf.T).softmax(-1).numpy()
    p = np.stack([lg[:, [j for j, o in enumerate(own) if o == k]].sum(1) for k in keys], 1)
    return [(keys[int(r.argmax())], round(float(r.max()), 2), {k: round(float(v), 3) for k, v in zip(keys, r)}) for r in p]


def tag(folder):
    import torch
    from transformers import CLIPModel, CLIPProcessor
    m = CLIPModel.from_pretrained('openai/clip-vit-base-patch32').eval(); pr = CLIPProcessor.from_pretrained('openai/clip-vit-base-patch32')
    keys = list(PROMPTS); texts = [t for k in keys for t in PROMPTS[k]]; own = [k for k in keys for _ in PROMPTS[k]]
    files = sorted(glob.glob(os.path.join(folder, 'p*.jpg')))
    ims = [Image.open(f).convert('RGB') for f in files]
    with torch.no_grad():
        ti = pr(text=texts, return_tensors='pt', padding=True); tf = m.get_text_features(**ti); tf = getattr(tf, 'pooler_output', tf); tf = tf / tf.norm(dim=-1, keepdim=True)
        ii = pr(images=ims, return_tensors='pt'); f = m.get_image_features(**ii); f = getattr(f, 'pooler_output', f); f = f / f.norm(dim=-1, keepdim=True)
        lg = (100 * f @ tf.T).softmax(-1).numpy()
    prob = np.stack([lg[:, [j for j, o in enumerate(own) if o == k]].sum(1) for k in keys], 1)
    small = [np.asarray(im.convert('L').resize((32, 18)), np.float32) for im in ims]
    top = [keys[int(np.argmax(prob[i]))] for i in range(len(files))]
    ext = [i for i in range(len(files)) if top[i] in EXTERIOR]
    scr = [i for i in range(len(files)) if top[i] in SCREEN]
    view = {}
    if ext:
        whole = _cls(m, pr, [ims[i] for i in ext], WHOLE)
        ext = [i for i, w in zip(ext, whole) if w[0] == 'whole']
    if ext:
        fr = {i: r[2]['front'] for i, r in zip(ext, _cls(m, pr, [ims[i] for i in ext], FRONT_REAR))}
        sym = {i: symmetry_diff(ims[i]) for i in ext}
        hi = sorted(sym.values(), reverse=True)[:2]
        cut = STRAIGHT_RATIO * (sum(hi) / len(hi))
        straight = [i for i in ext if sym[i] < cut and len(ext) >= 3]
        diag = [i for i in ext if i not in straight]
        for grp, (fname, rname) in ((straight, ('front', 'rear')), (diag, ('front_3_4', 'rear_3_4'))):
            if len(grp) >= 2:  # 짝 비교: 앞 확률이 가장 높은 것이 앞, 가장 낮은 것이 뒤, 나머지는 0.5 기준
                f0, r0 = max(grp, key=lambda i: fr[i]), min(grp, key=lambda i: fr[i])
                for i in grp:
                    v = fname if i == f0 else rname if i == r0 else (fname if fr[i] >= 0.5 else rname)
                    view[i] = (v, round(fr[i], 2), {v: 1.0, 'sym': round(sym[i], 1)})
            for i in grp if len(grp) == 1 else []:
                v = fname if fr[i] >= 0.5 else rname
                view[i] = (v, round(fr[i], 2), {v: 1.0, 'sym': round(sym[i], 1)})
    skind = dict(zip(scr, _cls(m, pr, [ims[i] for i in scr], SCREEN_KIND))) if scr else {}
    out = []
    for i, fn in enumerate(files):
        order = np.argsort(-prob[i])[:3]
        dup = next((out[j]['n'] for j in range(i) if np.abs(small[i] - small[j]).mean() < 6), None)
        part, sc = keys[order[0]], round(float(prob[i, order[0]]), 2)
        extra = {}
        if i in view:  # 외관 방향을 부위 이름으로 옮긴다(앞 3/4는 exterior_3_4 그대로, 뒤 3/4는 exterior_rear 쪽 3/4)
            v, vs, vp = view[i]; extra['view'] = [v, vs]; extra['view_probs'] = vp
            part = {'front': 'exterior_front', 'front_3_4': 'exterior_front_3_4', 'rear_3_4': 'exterior_rear_3_4', 'rear': 'exterior_rear'}[v]
        if i in skind:
            k, ks, kp = skind[i]; extra['screen'] = [k, ks]; extra['screen_probs'] = kp
            if k in ('cluster', 'camera', 'map') and ks >= 0.5 and part in ('screen', 'steering_wheel', 'interior_dash'):
                part = 'screen_' + k
        if np.asarray(ims[i].convert('L'), np.float32).std() < 18:  # 거의 한 가지 색(천장 조명만 찍힌 사진 등)은 쓰지 않음
            part, extra['note'] = 'other', '정보 없는 사진'
        out.append({'n': i + 1, 'file': os.path.basename(fn), 'size': ims[i].size,
                    'part': part, 'score': sc, **extra,
                    'top3': [[keys[k], round(float(prob[i, k]), 2)] for k in order],
                    'probs': {k: round(float(prob[i, j]), 3) for j, k in enumerate(keys)},
                    'dup_of': dup, 'by': 'clip'})
    return out, ims


def sheet(tags, ims, path):
    from PIL import ImageDraw
    w, h = 320, 180; cols = 5
    sh = Image.new('RGB', (w * cols, h * ((len(ims) + cols - 1) // cols)), (0, 0, 0))
    for i, (t, im) in enumerate(zip(tags, ims)):
        im = im.copy(); im.thumbnail((w, h)); c = Image.new('RGB', (w, h)); c.paste(im, ((w - im.width) // 2, (h - im.height) // 2))
        d = ImageDraw.Draw(c); d.rectangle([0, 0, w, 20], fill=(0, 0, 0))
        d.text((4, 4), f"p{t['n']:02d} {t['part']} {t['score']}" + (f" dup{t['dup_of']}" if t['dup_of'] else ''), fill=(255, 255, 0))
        sh.paste(c, ((i % cols) * w, (i // cols) * h))
    sh.save(path, quality=80)


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('folder'); ap.add_argument('--out', required=True); ap.add_argument('--sheet')
    a = ap.parse_args()
    tags, ims = tag(a.folder)
    json.dump(tags, open(a.out, 'w'), ensure_ascii=False, indent=1)
    for t in tags:
        print(f"p{t['n']:02d} {t['part']:16} {t['score']:.2f}  " + ' '.join(f'{k}:{v}' for k, v in t['top3'][1:]) + (f"  dup{t['dup_of']}" if t['dup_of'] else ''))
    if a.sheet:
        sheet(tags, ims, a.sheet)
