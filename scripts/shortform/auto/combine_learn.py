"""1차(100편) + 2차(100편) 결과를 합쳐 200편 요약을 만들고, 두 조사가 서로 맞는지(재현성) 표로 보여 준다.
python3 combine_learn.py L1_OUT L2_OUT OUT_JSON"""
import json, sys
from learn_l1 import summarize

KEYS = ['cuts_per_min', 'shot_med_s', 'first_cut', 'cut_on_phrase', 'cut_minus_phrase_med', 'caption_cy', 'chips_per_min', 'chip_hold_med',
        'chip_minus_phrase_med', 'chip_after_cut_med', 'chip_on_new_shot', 'chips_with_sfx', 'tail_after_speech', 'wps']
a = json.load(open(sys.argv[1] + '/learned.json'))
b = json.load(open(sys.argv[2] + '/learned.json'))
sa, sb, sc = summarize(a), summarize(b), summarize(a + b)
json.dump(dict(l1=sa, l2=sb, all=sc), open(sys.argv[3], 'w'), ensure_ascii=False, indent=1)
for src in ('nl', 'be'):
    print(f'\n[{src}] 1차 n={sa[src]["n"]} · 2차 n={sb[src]["n"]} · 합계 n={sc[src]["n"]}')
    for k in KEYS:
        x, y, z = sa[src][k]['p50'], sb[src][k]['p50'], sc[src][k]
        print(f'  {k:22s} 1차 {x}  2차 {y}  → 200편 {z["p50"]} ({z["p25"]}~{z["p75"]})')
    for s, nm in ((sa, '1차'), (sb, '2차'), (sc, '200편')):
        print(f'  칩 높이 {nm}', s[src]['chip_cy']['band_share'], '기울기', s[src]['chip_ang']['p50'], '첫화면 효과음', s[src]['sfx_hook_rate'])
