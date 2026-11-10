"""probe400 폴더(_s.jpg 10칸 줄그림 + _w.json 단어 시각) → probe.json
- person: 10칸 중 얼굴이 잡힌 칸 비율 ≥ 0.2 이면(진행자가 멀리 서 있는 영상 포함) 사람 등장
- face_frac: 얼굴 잡힌 칸 비율
- words_per_s: 말 속도, lang: 말 언어
python3 probe_stats.py PROBE_DIR SKILL_DIR YUNET_ONNX
"""
import glob, json, os, sys
import cv2

def main(pdir, sdir, model):
    # 얼굴 찾기: OpenCV Zoo YuNet(face_detection_yunet_2023mar.onnx, Apache-2.0)
    out = {}
    for s in sorted(glob.glob(os.path.join(pdir, '*_s.jpg'))):
        vid = os.path.basename(s)[:-6]
        im = cv2.imread(s)
        if im is None:
            continue
        n = 10
        w = im.shape[1] // n
        hit = 0
        for i in range(n):
            tile = cv2.resize(im[:, i * w:(i + 1) * w], None, fx=2, fy=2)
            det = cv2.FaceDetectorYN.create(model, '', (tile.shape[1], tile.shape[0]), 0.7)
            _, faces = det.detect(tile)
            # 화면 높이의 4% 넘는 얼굴만(멀리 지나가는 사람 제외)
            if faces is not None and any(f[3] > tile.shape[0] * .04 for f in faces):
                hit += 1
        r = dict(face_frac=round(hit / n, 2), person=hit / n >= .2)
        wj = s.replace('_s.jpg', '_w.json')
        if os.path.exists(wj):
            d = json.load(open(wj, encoding='utf-8'))
            dur = d.get('dur') or 1
            r.update(lang=d.get('lang'), words_per_s=round(len(d.get('words', [])) / dur, 2), n_words=len(d.get('words', [])))
        out[vid] = r
    json.dump(out, open(os.path.join(sdir, 'probe.json'), 'w'), ensure_ascii=False, indent=0)
    pr = sum(v['person'] for v in out.values())
    print(len(out), 'videos, person', pr)

if __name__ == '__main__':
    main(*sys.argv[1:4])
