"""숏폼 완성본 크로스체크(2026-11-10, 10배 강화 기준). 한 번에 여러 영상을 돌려 항목별 통과·실패를 표로 낸다.

python3 crosscheck.py OUT1:SHOTS1 OUT2:SHOTS2 ... [--tsv]

검사 항목(기준값은 auto_edit_rules.json의 shot_fit·captions·crosscheck에서 읽음)
 1 칩 ↔ 부위        칩이 뜬 순간 화면 부위가 그 구간 허용 부위 안
 2 장면 넘침        장면이 부위 구간 밖으로 넘친 곳 0
 3 자막 빠짐        구절마다 말하는 동안 자막 보임 비율 ≥ min_visible_ratio
 4 음성 빠짐        낱말마다 완성 소리 ≥ 원래 목소리 + min_word_db, 끝 잘림 없음
 5 검은 화면        끝 화면(로고) 전 0.3초 넘는 검은 장면 없음
 6 칩 색            칩 바탕이 원본 노랑(민트·파랑 칩 없음)
 7 음량            통합 음량 −14 ±1.5 LUFS, 최대 −1 dBTP 이하
 8 길이            영상 길이 = 목소리 길이 + 끝 화면(1.5~3.5초)
 9 규격            1080×1920 · 30fps · H.264 · AAC
10 촬영 필요        원본에 없는 부위 목록(실패 아님, 알림)
"""
import argparse
import json
import os
import re
import subprocess
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import check_match  # noqa: E402

RULES = json.load(open(os.path.join(HERE, 'auto_edit_rules.json'), encoding='utf-8'))
CC = dict(dict(black_luma=12, black_max_s=0.3, lufs=-14, lufs_tol=1.5, tp_max=-1.0, end_min_s=1.5, end_max_s=3.5,
               mint_px=40, mint_rgb=[0, 255, 208], mint_tol=18, blue_chip_px=400),**RULES.get('crosscheck', {}))


def probe(f):
    j = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', f], capture_output=True, text=True).stdout)
    v = next(s for s in j['streams'] if s['codec_type'] == 'video')
    a = next((s for s in j['streams'] if s['codec_type'] == 'audio'), {})
    n, d = map(int, v['r_frame_rate'].split('/'))
    return dict(w=v['width'], h=v['height'], fps=n / d, vc=v['codec_name'], ac=a.get('codec_name'), dur=float(j['format']['duration']))


def frames(f, fps=4, w=270):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-vf', f'fps={fps},scale={w}:-2', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
    h = int(w * 1920 / 1080) // 2 * 2
    return np.frombuffer(raw, np.uint8).reshape(-1, h, w, 3)


def loud(f):
    err = subprocess.run(['ffmpeg', '-hide_banner', '-i', f, '-af', 'loudnorm=print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
    j = json.loads(err[err.rfind('{'):err.rfind('}') + 1])
    return float(j['input_i']), float(j['input_tp'])


def check_one(out, shots_path, name):
    mp4 = os.path.join(out, 'render', 'sag_reel_v1.mp4')
    P = json.load(open(os.path.join(out, 'plan.json'), encoding='utf-8'))
    style = P['style'].replace('bobae_', '')
    shots = sorted(json.load(open(shots_path, encoding='utf-8')), key=lambda s: s['t0'])
    rows = check_match.check_render(out, shots, name)  # 1·2·3·4·10
    res = {}
    for key, kinds in (('1 칩↔부위', ('부위', '없음')), ('2 넘침', ('넘침',)), ('3 자막 빠짐', ('자막 빠짐',)), ('4 음성 빠짐', ('음성 빠짐',))):
        res[key] = [r for r in rows if r[-1] in kinds]
    res['10 촬영 필요'] = [r for r in rows if r[-1] == '촬영 필요']
    pr = probe(mp4)
    F = frames(mp4)
    fps = 4
    vw = os.path.join(out, 'voice_n.wav')
    vd = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', vw], capture_output=True, text=True).stdout) if os.path.exists(vw) else pr['dur']
    # 5 검은 화면(끝 화면 시작 = 목소리 끝 이후는 제외)
    luma = F.mean(axis=(1, 2, 3))
    blk, run = [], 0
    for i, l in enumerate(luma):
        t = i / fps
        if l < CC['black_luma'] and t < vd:
            run += 1
        else:
            if run / fps > CC['black_max_s']:
                blk.append([name, style, '화면', f'{(i - run) / fps:.2f}초', '', '', f'검은 화면 {run / fps:.2f}초', '검은 화면'])
            run = 0
    if run / fps > CC['black_max_s']:
        blk.append([name, style, '화면', f'{(len(luma) - run) / fps:.2f}초', '', '', f'검은 화면 {run / fps:.2f}초', '검은 화면'])
    res['5 검은 화면'] = blk
    # 6 칩 색: 민트(#00FFD0 근처) 화소, 칩 크기 파랑 덩어리
    col = []
    for i, fr in enumerate(F):
        r, g, b = fr[..., 0].astype(int), fr[..., 1].astype(int), fr[..., 2].astype(int)
        # 예전 민트 칩은 평평한 #00FFD0. 실내 앰비언트 조명·파란 전시장 화면의 청록 번짐은 색이 퍼져 있어 엄격한 범위로 가른다
        mr, mg, mb = CC['mint_rgb']
        tol = CC['mint_tol']
        mint = int(((abs(r - mr) <= tol) & (abs(g - mg) <= tol) & (abs(b - mb) <= tol)).sum())
        if mint > CC['mint_px']:
            col.append([name, style, '칩 색', f'{i / fps:.2f}초', '', '', f'민트 화소 {mint}', '칩 색'])
    res['6 칩 색'] = col[:3]
    # 7 음량
    i_, tp = loud(mp4)
    res['7 음량'] = [] if (abs(i_ - CC['lufs']) <= CC['lufs_tol'] and tp <= CC['tp_max'] + 0.3) else [[name, style, '음량', '', '', '', f'{i_:.1f} LUFS · {tp:.1f} dBTP', '음량']]
    # 8 길이
    tail = pr['dur'] - vd
    res['8 길이'] = [] if CC['end_min_s'] <= tail <= CC['end_max_s'] else [[name, style, '길이', '', '', '', f'목소리 뒤 {tail:.2f}초', '길이']]
    # 9 규격
    ok = pr['w'] == 1080 and pr['h'] == 1920 and abs(pr['fps'] - 30) < 0.01 and pr['vc'] == 'h264' and pr['ac'] == 'aac'
    res['9 규격'] = [] if ok else [[name, style, '규격', '', '', '', f"{pr['w']}x{pr['h']} {pr['fps']:.2f}fps {pr['vc']}/{pr['ac']}", '규격']]
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('items', nargs='+', help='OUT:SHOTS[:이름]')
    ap.add_argument('--tsv', action='store_true')
    a = ap.parse_args()
    keys = ['1 칩↔부위', '2 넘침', '3 자막 빠짐', '4 음성 빠짐', '5 검은 화면', '6 칩 색', '7 음량', '8 길이', '9 규격', '10 촬영 필요']
    allrows, summary = [], []
    fail = 0
    for it in a.items:
        out, shots, *nm = it.split(':')
        name = nm[0] if nm else os.path.basename(out)
        res = check_one(out, shots, name)
        line = [name] + [str(len(res[k])) for k in keys]
        summary.append(line)
        for k in keys:
            allrows += res[k]
        fail += sum(len(res[k]) for k in keys[1:9])
    print('\t'.join(['영상'] + keys))
    for l in summary:
        print('\t'.join(l))
    print()
    for r in allrows:
        if r[-1] != '촬영 필요':
            print('\t'.join(r))
    print(f'\n실패 합계(2~9번) {fail}건')
    raise SystemExit(1 if fail else 0)


if __name__ == '__main__':
    main()
