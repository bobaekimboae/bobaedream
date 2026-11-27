"""블랙박스 릴스 소리 섞기: 원본(0.40) + 목소리 + 선택 배경음(목소리 아래로 자동 줄임) + 선택 효과음.
원본 소리는 자르거나 분리하지 않는다. 배경음·효과음 파일은 CC0·CC BY·자체 제작만(README 표기 규칙).
"""
import json, os, re, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); REPO = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
SFX_DIR = os.path.join(REPO, 'public/assets/shortform/sfx/opensource')
# 효과음 종류 → 기본 CC0 파일 (manifest.json 출처·라이선스 기록)
SFX_DEFAULT = {'whoosh': 'whoosh_os1.wav', 'impact': 'impact_os1.wav', 'ding': 'ding_os1.wav', 'riser': 'riser_os1.wav', 'swipe': 'swipe_os2.wav'}


def mix(base_index, tot, dly, bgm, sfx, voice_words, layout):
    """ffmpeg 추가 입력, 필터 문자열, 출력 라벨을 돌려준다. base_index = 다음 입력 번호."""
    ain = []; fc = []; idx = base_index; ms = int(dly * 1000)
    fc.append(f"[0:a]atrim=0:{tot},asetpts=PTS-STARTPTS,volume={layout['original_volume']}[oa]")
    fc.append(f"[1:a]adelay={ms}|{ms},aecho=0.8:0.6:22:0.10,asplit=2[va][vk]")
    parts = ['[oa]', '[va]']
    if bgm:
        ain += ['-stream_loop', '-1', '-i', bgm]; b = layout['bgm']
        fc.append(f"[{idx}:a]atrim=0:{tot},asetpts=PTS-STARTPTS,volume={b['volume']},afade=t=in:d=0.8,afade=t=out:st={tot - 1.2}:d=1.2[bb]")
        fc.append("[bb][vk]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=400[bd]")
        parts.append('[bd]'); idx += 1
    else:
        fc.append('[vk]anullsink')
    s = layout['sfx']; last = -9; used = 0
    for hit in sorted(sfx, key=lambda h: h['t']):
        if used >= s['max'] or hit['t'] - last < s['min_gap_s']:
            continue
        f = hit.get('file') or os.path.join(SFX_DIR, SFX_DEFAULT[hit['kind']])
        ain += ['-i', f]; t = int(hit['t'] * 1000)
        fc.append(f"[{idx}:a]volume={s['volume_db_vs_voice']}dB,adelay={t}|{t}[s{used}]"); parts.append(f'[s{used}]')
        idx += 1; used += 1; last = hit['t']
    fc.append(''.join(parts) + f"amix=inputs={len(parts)}:duration=first:normalize=0[aout]")
    return ain, ';'.join(fc), '[aout]'


def _measure(path, af='loudnorm=print_format=json'):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', af, '-f', 'null', '-'], capture_output=True, text=True).stderr
    return json.loads(r[r.rfind('{'):r.rfind('}') + 1])


def normalize(mp4, layout):
    """2단 loudnorm으로 -14 LUFS ±1, TP ≤ -1.5 (영상은 그대로 복사)."""
    tgt, tp = layout['lufs'], layout['true_peak'] - 0.5
    m = _measure(mp4, f'loudnorm=I={tgt}:TP={tp}:LRA=11:print_format=json'); tmp = mp4 + '.tmp.mp4'
    af = (f"loudnorm=I={tgt}:TP={tp}:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
          f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', mp4, '-c:v', 'copy', '-af', af, '-c:a', 'aac', '-ar', str(layout['rate']), '-b:a', '160k', tmp], check=True)
    os.replace(tmp, mp4); r = _measure(mp4); i2, tp2 = float(r['input_i']), float(r['input_tp'])
    ok = abs(i2 - tgt) <= layout['lufs_tol'] and tp2 <= layout['true_peak']
    print(f"소리 {float(m['input_i']):.1f} → {i2:.1f} LUFS / TP {tp2:.1f} {'통과' if ok else '실패'}")
    if not ok: raise SystemExit('소리 기준 실패')
