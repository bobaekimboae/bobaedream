#!/usr/bin/env python3
"""숏폼 카드 정보 기법 렌더러 v1 (card-info-v1).

같은 데이터 → 같은 영상. 어떤 에이전트도 아래 명령 하나로 동일하게 만든다.

  python3 scripts/shortform/card_info/card_render.py samples/g400d/cards.json --out out/card_g400d
  python3 scripts/shortform/card_info/card_render.py samples/g400d/cards.json --only inspection,insurance
  python3 scripts/shortform/card_info/card_render.py samples/g400d/cards.json --montage

입력: cards.json (카드 데이터, 사진은 같은 폴더 기준 상대 경로)
규칙: card_spec.json + ../be_locked_rules.json + ../photo_listing/option_visual_rules.json(layout.card_sfx)
출력: 카드별 mp4(card_<key>.mp4) · --montage면 montage.mp4 · report.json(길이·효과음·음량·카드 높이 검사)

필요: Playwright(chromium) · ffmpeg · rsvg-convert(칩 렌더용, g350_v5_lib)
"""
import argparse, json, os, re, subprocess, sys, tempfile, time

HERE = os.path.dirname(os.path.abspath(__file__))
SF = os.path.dirname(HERE)                      # scripts/shortform
ROOT = os.path.dirname(os.path.dirname(SF))     # 저장소 루트
sys.path.insert(0, os.path.join(SF, 'video_listing'))

SPEC = json.load(open(os.path.join(HERE, 'card_spec.json')))
RULES = json.load(open(os.path.join(SF, 'be_locked_rules.json')))
CARD_SFX = json.load(open(os.path.join(SF, 'photo_listing', 'option_visual_rules.json')))['layout']['card_sfx']
SFX_DIR = os.path.join(ROOT, 'public', 'assets', 'shortform', 'sfx')
FPS = SPEC['canvas']['fps']


def furl(p):
    return 'file://' + os.path.abspath(p)


def chip_png(text, title, outdir):
    """G350 v13과 같은 노랑 붓칠 칩(노션 원본 판 fill_fit). title=True면 첫 컷 브랜드 판(430_239)."""
    import g350_v5_lib as L
    im = L.chip(text, title=title)
    fn = os.path.join(outdir, f"chip_{'T' if title else 'N'}_{abs(hash(text)) % 10**8}.png")
    im.save(fn)
    return {'src': furl(fn), 'w': im.width, 'h': im.height}


def icons():
    d = os.path.join(HERE, 'icons')
    return {f[:-4]: open(os.path.join(d, f)).read() for f in os.listdir(d) if f.endswith('.svg')}


def render_segment(page, card, base, build, out_mp4, with_audio=True):
    """카드 하나 → 무음 영상(+선택: 효과음·배경음). 반환: TL(길이·효과음 시각)."""
    data = {
        'spec': SPEC, 'rules': {'color': RULES['color']}, 'card': card, 'base': furl(base) + '/',
        'icons': ICONS, 'card_sfx': CARD_SFX,
        'logo': furl(os.path.join(ROOT, SPEC['end']['logo'])),
        'chip': None,
    }
    if card['type'] == 'hero':
        data['chip'] = chip_png(card['brand'], True, build)
    elif card['type'] != 'end':
        data['chip'] = chip_png(card['title'], False, build)
    html = open(os.path.join(HERE, 'card_template.html')).read()
    html = html.replace('__FONTS__', furl(os.path.join(SF, 'fonts'))).replace('__DATA__', json.dumps(data, ensure_ascii=False))
    hp = os.path.join(build, f"seg_{card.get('key', card['type'])}.html")
    open(hp, 'w').write(html)
    page.goto(furl(hp))
    page.evaluate('document.fonts.ready')
    page.wait_for_function('() => [...document.images].every(i => i.complete)', timeout=30000)
    page.wait_for_timeout(150)
    tl = page.evaluate('window.TL')
    n = int(round(tl['duration'] * FPS))
    vid = out_mp4 if not with_audio else out_mp4[:-4] + '.v.mp4'
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(FPS), '-c:v', 'mjpeg', '-i', '-',
                           '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', str(FPS), vid], stdin=subprocess.PIPE)
    for i in range(n):
        page.evaluate(f'window.seek({i / FPS:.5f})')
        ff.stdin.write(page.screenshot(type='jpeg', quality=94))
    ff.stdin.close(); ff.wait()
    tl['frames'] = n
    if with_audio:
        mix_audio([(0.0, tl)], tl['duration'], vid, out_mp4)
        os.remove(vid)
    return tl


def mix_audio(segments, total, video, out_mp4):
    """효과음(시각·크기) + 배경음 → 2단계 loudnorm(-14 LUFS, TP -1.5) → 영상과 합침."""
    ins, filt, labels = [], [], []
    bgm = os.path.join(ROOT, SPEC['audio']['bgm'])
    ins += ['-stream_loop', '-1', '-i', bgm]
    filt.append(f"[0:a]atrim=0:{total:.3f},asetpts=PTS-STARTPTS,volume={SPEC['audio']['bgm_vol']},afade=t=in:d=0.3,afade=t=out:st={max(0, total - 0.8):.3f}:d=0.8,aformat=channel_layouts=stereo:sample_rates=48000[bg]")
    labels.append('[bg]')
    k = 1
    for off, tl in segments:
        for e in tl['events']:
            f = os.path.join(SFX_DIR, e['sfx'] + '.wav')
            if not os.path.exists(f):
                continue
            ins += ['-i', f]
            d = max(0, int(round((off + e['t']) * 1000)))
            filt.append(f"[{k}:a]atrim=0:1.4,afade=t=out:st=1.25:d=0.15,volume={e['vol']},aformat=channel_layouts=stereo:sample_rates=48000,adelay={d}:all=1[s{k}]")
            labels.append(f'[s{k}]'); k += 1
    filt.append(''.join(labels) + f"amix=inputs={len(labels)}:normalize=0:duration=first[mix]")
    tmp = out_mp4[:-4] + '.mix.wav'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *ins, '-filter_complex', ';'.join(filt), '-map', '[mix]', '-t', f'{total:.3f}', tmp], check=True)
    L, TP = SPEC['audio']['lufs'], SPEC['audio']['true_peak']
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', f'loudnorm=I={L}:TP={TP}:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    m = json.loads(re.findall(r'\{[^{}]*\}', r.stderr)[-1])
    af = (f"loudnorm=I={L}:TP={TP}:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true"
          f",alimiter=limit={10 ** ((TP - 1.4) / 20):.4f}:attack=1:release=60:level=false")   # 진짜 피크 여유 1.4dB(AAC 인코딩 튐 포함)(샘플 리미터라 TP가 조금 더 나옴)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', video, '-i', tmp, '-af', af, '-ar', '48000', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
                    '-shortest', out_mp4], check=True)
    got = measure(out_mp4)['lufs']
    if got is None or abs(got - L) > SPEC['audio'].get('tol', 1.0):   # 짧은 컷에서 선형 맞춤이 봉우리 한도에 막히면 동적 모드로 다시
        af2 = f"loudnorm=I={L}:TP={TP}:LRA=11,alimiter=limit={10 ** ((TP - 1.4) / 20):.4f}:attack=1:release=60:level=false"
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', video, '-i', tmp, '-af', af2, '-ar', '48000', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
                        '-shortest', out_mp4], check=True)
    os.remove(tmp)


def measure(mp4):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', mp4, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True)
    I = re.findall(r'I:\s+(-?[\d.]+) LUFS', r.stderr)
    P = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r.stderr)
    d = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4], capture_output=True, text=True).stdout.strip()
    return {'lufs': float(I[-1]) if I else None, 'true_peak': float(P[-1]) if P else None, 'duration': float(d or 0)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('data')
    ap.add_argument('--out', default=None)
    ap.add_argument('--only', default='')
    ap.add_argument('--montage', action='store_true')
    ap.add_argument('--no-cards', action='store_true', help='몽타주만 만들 때 카드별 영상 생략')
    a = ap.parse_args()
    dp = a.data if os.path.isabs(a.data) else (a.data if os.path.exists(a.data) else os.path.join(HERE, a.data))
    D = json.load(open(dp)); base = os.path.dirname(os.path.abspath(dp))
    out = a.out or os.path.join(base, 'out'); os.makedirs(out, exist_ok=True)
    build = tempfile.mkdtemp(prefix='cardinfo_')
    global ICONS; ICONS = icons()
    from playwright.sync_api import sync_playwright
    report = {'spec': SPEC['version'], 'data': os.path.relpath(dp, ROOT), 'cards': {}, 'montage': None}
    only = [s for s in a.only.split(',') if s]
    with sync_playwright() as p:
        b = p.chromium.launch()
        page = b.new_page(viewport={'width': SPEC['canvas']['w'], 'height': SPEC['canvas']['h']}, device_scale_factor=1)
        if not a.no_cards:
            for c in D['cards']:
                if only and c['key'] not in only:
                    continue
                t0 = time.time(); fn = os.path.join(out, f"card_{c['key']}.mp4")
                tl = render_segment(page, c, base, build, fn)
                m = measure(fn)
                pb = tl.get('panelBottom')
                report['cards'][c['key']] = {**m, 'sfx': [f"{e['t']:.2f}s {e['sfx']}" for e in tl['events']], 'panel_bottom_px': pb,
                                             'panel_ok': (pb is None or pb <= SPEC['panel']['max_bottom']), 'render_s': round(time.time() - t0, 1)}
                print(f"[카드] {c['key']:<14} {m['duration']:.2f}s  {m['lufs']} LUFS  TP {m['true_peak']}  카드 아래끝 {pb}")
        if a.montage and D.get('montage'):
            segs, off, vids = [], 0.0, []
            bykey = {c['key']: c for c in D['cards']}
            for k in D['montage']:
                if k == 'hook':
                    c = {**D['hook'], 'type': 'hero', 'key': 'hook', 'bg': D['hook']['photo']}
                elif k == 'end':
                    c = {'type': 'end', 'key': 'end', 'bg': D['hook']['photo']}
                else:
                    c = bykey[k]
                vf = os.path.join(build, f"m_{k}.mp4")
                tl = render_segment(page, c, base, build, vf, with_audio=False)
                if off > 0 and c['type'] != 'end':      # 구역이 바뀌는 컷에 휙(part_change)
                    tl['events'] = [{'t': 0.0, 'sfx': 'whoosh', 'vol': RULES['sfx']['volume']['whoosh']}] + [e for e in tl['events'] if e['t'] >= 0.3]
                segs.append((off, tl)); vids.append(vf); off += tl['frames'] / FPS
                print(f"[몽타주] {k:<14} {tl['frames'] / FPS:.2f}s  누적 {off:.2f}s")
            lst = os.path.join(build, 'list.txt'); open(lst, 'w').write(''.join(f"file '{v}'\n" for v in vids))
            vcat = os.path.join(build, 'montage.v.mp4')
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', vcat], check=True)
            mf = os.path.join(out, 'montage.mp4')
            mix_audio(segs, off, vcat, mf)
            report['montage'] = {**measure(mf), 'segments': [[k, round(o, 2)] for k, (o, _) in zip(D['montage'], segs)]}
            print(f"[몽타주] 완료 {report['montage']}")
        b.close()
    json.dump(report, open(os.path.join(out, 'report.json'), 'w'), ensure_ascii=False, indent=1)
    print('보고서', os.path.join(out, 'report.json'))


if __name__ == '__main__':
    main()
