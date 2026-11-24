"""M235i r01 부위 추적: roma_owl_track.run(OWLv2, 0.2초 간격)을 M235i 컷 표로 돌린다. 원본 = 목소리 시간축으로 줄인 src.mp4."""
import json, os, sys, cv2
os.environ['ROMA_DIR'] = os.path.join(os.environ.get('M235_DIR', '/dev/shm/m235/job/'), '')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import roma_owl_track as R
G = os.environ['ROMA_DIR']
R.PA.PROMPTS.update({
    'm_head': 'a car headlight', 'm_caliper': 'a blue brake caliper behind a wheel rim', 'm_pipe': 'car exhaust tailpipes',
    'm_logo': 'a logo light projected on the ground', 'm_sill': 'a car door sill plate with a logo', 'm_seat': 'a red leather car seat',
    'm_amb': 'an ambient light strip on a car door panel', 'm_btn': 'buttons on a steering wheel', 'm_hud': 'a head-up display projected on a car windshield'})
W = json.load(open(G + 'words_clean.json'))
first = {'c2': '앞에는', 'c3': '휠', 'c4': '뒤에는', 'c5': '4륜구동', 'c6': '문을', 'c7': '도어', 'c8': '실내는', 'c9': '도어엔', 'c10': '뒷좌석까지',
         'c11': '핸들엔', 'c12': '주행거리는', 'c13': '헤드업', 'c14': '후방'}
order = list(first)
st = {k: W[next(j for j, x in enumerate(W) if x[0].replace(' ', '').startswith(v))][1] - 0.12 for k, v in first.items()}
end = {k: st[order[i + 1]] for i, k in enumerate(order[:-1])}
JOBS = {'c2': ('m_head', .12), 'c3': ('m_caliper', .10), 'c4': ('m_pipe', .12), 'c6': ('m_logo', .10), 'c7': ('m_sill', .10),
        'c8': ('m_seat', .12), 'c9': ('m_amb', .10), 'c11': ('m_btn', .12), 'c13': ('m_hud', .10)}
T = json.load(open(G + 'tracks.json')) if os.path.exists(G + 'tracks.json') else {}
cap = cv2.VideoCapture(G + 'src.mp4'); sheet = []
for k in (sys.argv[1:] or JOBS):
    p, thr = JOBS[k]; T[k] = R.run(cap, k, round(st[k], 3), round(end[k], 3), p, thr, sheet)
json.dump(T, open(G + 'tracks.json', 'w'))
import numpy as np
rows = [np.hstack(sheet[i:i + 8] + [np.zeros_like(sheet[0])] * (8 - len(sheet[i:i + 8]))) for i in range(0, len(sheet), 8)]
cv2.imwrite(G + 'owl_sheet.jpg', np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 70])
