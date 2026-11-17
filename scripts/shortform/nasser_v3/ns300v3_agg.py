import os, glob, json
import numpy as np
B = r'C:\Users\Thinkbook\Documents\autostudio_analysis'
R = [json.load(open(f, encoding='utf-8')) for f in glob.glob(os.path.join(B, 'ns300v3', '*.json'))]
err = [r for r in R if 'err' in r]; R = [r for r in R if 'err' not in r]
def q(a, ps=(25, 50, 75)):
    a = [x for x in a if x is not None]
    return 'n=%d ' % len(a) + ' / '.join('%.2f' % np.percentile(a, p) for p in ps) if a else 'n=0'
def pct(a): a = [x for x in a if x is not None]; return '%.0f%% (n=%d)' % (100 * np.mean(a), len(a)) if a else '-'
O = []; P = O.append
P('videos %d errors %d' % (len(R), len(err)))
P('dur p25/50/75 ' + q([r['dur'] for r in R]))
P('cuts confirmed per video ' + q([len(r['cuts_confirmed']) for r in R]))
P('cuts mine per video ' + q([len(r['cuts_mine']) for r in R]) + ' | old ' + q([len(r['cuts_old']) for r in R]))
P('detector agreement mine->old ' + q([r['agree_mine_in_old'] for r in R]) + ' old->mine ' + q([r['agree_old_in_mine'] for r in R]))
sh = [s for r in R for s in r['shots']]
P('shot length all ' + q(sh, (10, 25, 50, 75, 90)))
P('shot median per video ' + q([np.median(r['shots']) for r in R if r['shots']]))
P('cuts per minute ' + q([len(r['cuts_confirmed']) / r['dur'] * 60 for r in R if r['dur'] > 5]))
P('first shot ' + q([r['shots'][0] for r in R if r['shots']]) + ' | last shot ' + q([r['shots'][-1] for r in R if r['shots']]))
P('shots <1s share %.1f%% · 1-2s %.1f%% · 2-4s %.1f%% · 4-6s %.1f%% · >6s %.1f%%' % tuple(100 * np.mean([(a <= s < b) for s in sh]) for a, b in [(0, 1), (1, 2), (2, 4), (4, 6), (6, 999)]))
f3 = [sum(1 for c in r['cuts_confirmed'] if c < 3) for r in R]
P('cuts in first 3s ' + q(f3) + ' · zero %.0f%%' % (100 * np.mean([x == 0 for x in f3])))
P('face share ' + q([r['face_share'] for r in R]) + ' · face in first 1s ' + pct([r['face_first1s'] for r in R]))
P('face share >=50%% videos ' + pct([r['face_share'] >= 0.5 for r in R if r['face_share'] is not None]))
for k in ['top', 'mid', 'low', 'yellow']: P('textband %s ' % k + q([r['textband'][k] for r in R]))
A = [r['audio'] for r in R if r.get('audio')]
P('LUFS ' + q([a.get('lufs') for a in A], (10, 25, 50, 75, 90)) + ' | TP ' + q([a.get('tp') for a in A]) + ' | LRA ' + q([a.get('lra') for a in A]))
P('first sound ' + q([a.get('first_sound') for a in A], (50, 75, 90)))
P('transients per video ' + q([a.get('transients') for a in A]) + ' | cut-synced transient ' + q([a.get('cut_hit') for a in A]))
S = [r for r in R if r['srt']]
P('srt matched %d' % len(S))
P('srt first line start ' + q([r['srt_first'] for r in S], (50, 75, 90)))
P('srt last end - video dur ' + q([r['srt_last_end'] - r['dur'] for r in S], (10, 50, 90)) + ' · srt longer than video by >3s: %.0f%%' % (100 * np.mean([r['srt_last_end'] - r['dur'] > 3 for r in S])))
P('srt lines per video ' + q([len(r['srt']) for r in S]) + ' | line dur ' + q([e - s for r in S for s, e, n in r['srt']]))
gaps = [b[0] - a[1] for r in S for a, b in zip(r['srt'], r['srt'][1:])]
P('srt gap ' + q(gaps, (50, 75, 90)) + ' · gap<=0.3 %.0f%%' % (100 * np.mean([g <= 0.3 for g in gaps])))
cps = [n / max(e - s, 0.3) for r in S for s, e, n in r['srt']]
P('ko chars/sec (incl spaces, per line) ' + q(cps))
# cut vs srt line boundary alignment (only videos where srt fits the video)
ok = [r for r in S if abs(r['srt_last_end'] - r['dur']) < 3]
al = []
for r in ok:
    bnd = [s for s, e, n in r['srt']][1:]
    for c in r['cuts_confirmed']: al.append(min(abs(c - b) for b in bnd) <= 0.3 if bnd else False)
P('cuts landing within 0.3s of a line start (srt fits video, n=%d videos) %.0f%%' % (len(ok), 100 * np.mean(al) if al else 0))
lc = [len(r['cuts_confirmed']) + 1 for r in ok]; ll = [len(r['srt']) for r in ok]
P('shots per srt line ' + q([a / b for a, b in zip(lc, ll) if b]))
AR = [r['ar'] for r in R if r.get('ar')]
P('arabic words/sec ' + q([a['wps'] for a in AR]) + ' first word ' + q([a['first_word'] for a in AR], (50, 75, 90)))
OC = json.load(open(os.path.join(B, 'ns_opt_caps.json'), encoding='utf-8'))
d = [c[2][2] - c[2][0] for c in OC]; vids = {}
for c in OC: vids.setdefault(c[1], []).append(c[2])
P('opt caps %d in %d videos · per video ' % (len(OC), len(vids)) + q([len(v) for v in vids.values()]) + ' · duration ' + q(d, (10, 50, 90)))
durm = {r['vid']: r['dur'] for r in R}
pos = [c[0] / durm[v] for v, cs in vids.items() if v in durm for c in cs]
P('opt cap position in video ' + q(pos, (10, 25, 50, 75, 90)))
open(os.path.join(B, 'ns300v3_summary.txt'), 'w', encoding='utf-8').write('\n'.join(O))
print('\n'.join(O))
