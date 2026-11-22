#!/usr/bin/env python3
"""브이로그 자동 편집 한 번에 돌리기 (원본 → 받아쓰기 → 편집표 → 컷 → 렌더 → 검사).

쓰는 법
  python3 pipeline.py 원본 --work 작업폴더 [--versions 60,90,120] [--title ...] [--chips chips.json] [--edl edl.json]
  원본 = 구글 드라이브 zip 파일 ID·주소, 또는 영상(mp4)이 든 폴더.
  --edl 을 주면 그 편집표를 쓰고, 없으면 받아쓰기로 편집표를 자동으로 만든다(auto_edl.py).
  이미 만든 단계(clips.json · stt.json · seg/ 조각)는 건너뛴다(--force 로 다시).
결과: 작업폴더/<out_prefix>_<길이>s.mp4, 같은 이름 .plan.json(검사용), report.json(단계별 시간·검사 결과).
규칙 숫자는 ../be_locked_rules.json 하나, 완성 영상은 ../check_be.py 를 통과해야 전달한다.
"""
import argparse, glob, json, os, re, subprocess, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
SF = os.path.dirname(HERE)
sys.path.insert(0, HERE)


def drive_url(src):
    m = re.search(r'[-\w]{25,}', src)
    return f'https://drive.usercontent.google.com/download?id={m.group(0)}&export=download&confirm=t'


def clip_key(name, i):
    m = re.search(r'_(\d{4})_', os.path.basename(name))
    return m.group(1) if m else f'{i:04d}'


class Source:
    """원본 묶음: 로컬 폴더 또는 드라이브 zip. 한 클립씩 꺼내 쓰고 바로 지운다(디스크 절약)."""

    def __init__(self, src, work):
        self.work = work
        self.local = os.path.isdir(src)
        if self.local:
            fs = sorted(f for f in glob.glob(os.path.join(src, '**', '*'), recursive=True) if f.lower().endswith(('.mp4', '.mov')))
            self.names = fs
        else:
            from remotezip import RemoteZip
            self.zip = RemoteZip(drive_url(src))
            self.names = sorted(n for n in self.zip.namelist() if n.lower().endswith(('.mp4', '.mov')))

    def path(self, name):
        if self.local:
            return name, False
        out = os.path.join(self.work, 'dl')
        self.zip.extract(name, out)
        return os.path.join(out, name), True


def probe(p):
    r = subprocess.run(['ffprobe', '-v', '0', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration',
                        '-of', 'json', p], capture_output=True, text=True)
    j = json.loads(r.stdout or '{}')
    st = (j.get('streams') or [{}])[0]
    return dict(dur=round(float(j.get('format', {}).get('duration', 0)), 2), w=st.get('width'), h=st.get('height'))


def stage_ingest(src, work, force):
    cj = os.path.join(work, 'clips.json')
    if os.path.exists(cj) and not force:
        return json.load(open(cj)), 'skip(있음)'
    os.makedirs(os.path.join(work, 'aud'), exist_ok=True)
    clips = {}
    for i, n in enumerate(src.names):
        k = clip_key(n, i)
        p, tmp = src.path(n)
        clips[k] = dict(name=n, **probe(p))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', p, '-vn', '-ac', '1', '-ar', '16000', os.path.join(work, 'aud', k + '.wav')], check=True)
        if tmp: os.remove(p)
        print('  원본', k, clips[k]['dur'], '초', flush=True)
    json.dump(clips, open(cj, 'w'), ensure_ascii=False, indent=1)
    return clips, f'{len(clips)}개'


def stage_stt(work, force):
    sj = os.path.join(work, 'stt.json')
    out = json.load(open(sj)) if os.path.exists(sj) and not force else {}
    todo = [f for f in sorted(glob.glob(os.path.join(work, 'aud', '*.wav'))) if os.path.basename(f)[:-4] not in out]
    if not todo:
        return out, 'skip(있음)'
    import numpy as np
    from faster_whisper import WhisperModel
    m = WhisperModel('large-v3-turbo', device='cpu', compute_type='int8')
    for f in todo:
        k = os.path.basename(f)[:-4]
        a = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-f', 'f32le', '-'], capture_output=True).stdout, dtype=np.float32)
        if len(a) < 16000 * 1.5:
            out[k] = []; continue
        segs, _ = m.transcribe(a, language='ko', word_timestamps=True, vad_filter=True, beam_size=5)
        out[k] = [dict(s=round(s.start, 2), e=round(s.end, 2), t=s.text.strip(),
                       w=[(w.word, round(w.start, 2), round(w.end, 2)) for w in s.words]) for s in segs]
        print('  받아쓰기', k, ' / '.join(x['t'] for x in out[k])[:120], flush=True)
        json.dump(out, open(sj, 'w'), ensure_ascii=False)
    return out, f'{len(todo)}개'


def stage_cut(src, work, edl, clips, force):
    os.makedirs(os.path.join(work, 'seg'), exist_ok=True)
    need = sorted({k for ks in edl['versions'].values() for k in ks})
    flip = set(edl['meta'].get('flip_clips', []))
    by_clip = {}
    for k in need:
        if force or not os.path.exists(os.path.join(work, 'seg', k + '.mp4')):
            by_clip.setdefault(edl['items'][k]['clip'], []).append(k)
    names = {k: v['name'] for k, v in clips.items()}
    n = 0
    for c, ks in sorted(by_clip.items()):
        p, tmp = src.path(names[c])
        vf = 'scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,fps=30,format=yuv420p' + (',hflip,vflip' if c in flip else '')
        for k in ks:
            it = edl['items'][k]
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(it['s']), '-i', p, '-t', str(round(it['e'] - it['s'], 3)), '-vf', vf,
                            '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
                            os.path.join(work, 'seg', k + '.mp4')], check=True)
            n += 1
        if tmp: os.remove(p)
    return f'{n}조각' if n else 'skip(있음)'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('source', nargs='?', default='')
    ap.add_argument('--work', required=True)
    ap.add_argument('--versions', default='60,90,120')
    ap.add_argument('--edl', default='')
    ap.add_argument('--chips', default='', help='{"클립번호": "장소 이름"} json (선택)')
    ap.add_argument('--title', default='브이로그')
    ap.add_argument('--title-chip', default='브이로그')
    ap.add_argument('--subtitle', default='')
    ap.add_argument('--out-prefix', default='bobae_vlog_auto')
    ap.add_argument('--force', action='store_true')
    a = ap.parse_args()
    work = os.path.abspath(a.work); os.makedirs(work, exist_ok=True)
    vers = a.versions.split(',')
    rep = dict(started=time.strftime('%Y-%m-%d %H:%M:%S'), stages=[], videos={})

    def timed(name, fn):
        t0 = time.time(); r = fn(); dt = round(time.time() - t0, 1)
        note = r[1] if isinstance(r, tuple) else r
        rep['stages'].append(dict(stage=name, sec=dt, note=note)); print(f'[{name}] {dt}초 · {note}', flush=True)
        return r[0] if isinstance(r, tuple) else r

    src = Source(a.source, work) if a.source else None
    clips = timed('1 원본', lambda: stage_ingest(src, work, a.force)) if src else json.load(open(os.path.join(work, 'clips.json')))
    stt = timed('2 받아쓰기', lambda: stage_stt(work, a.force))

    def make_edl():
        ej = os.path.join(work, 'edl.json')
        if a.edl:
            e = json.load(open(a.edl)); json.dump(e, open(ej, 'w'), ensure_ascii=False, indent=1); return e, '지정 편집표'
        if os.path.exists(ej) and not a.force:
            return json.load(open(ej)), 'skip(있음)'
        from auto_edl import build
        chips = json.load(open(a.chips)) if a.chips else {}
        e = build(stt, clips, chips=chips, title=a.title, title_chip=a.title_chip, subtitle=a.subtitle,
                  out_prefix=a.out_prefix, versions=[int(v) for v in vers])
        json.dump(e, open(ej, 'w'), ensure_ascii=False, indent=1)
        return e, '자동 편집표 ' + ', '.join(f'{v}초 {len(e["versions"][v])}장면' for v in e['versions'])
    edl = timed('3 편집표', make_edl)
    if src:
        timed('4 컷', lambda: stage_cut(src, work, edl, clips, a.force))
    fails = 0
    for v in vers:
        def rend(v=v):
            r = subprocess.run([sys.executable, os.path.join(HERE, 'render.py'), work, v], capture_output=True, text=True)
            if r.returncode: print(r.stderr[-1500:]); raise SystemExit(f'{v}초판 렌더 실패')
            return 'ok'
        timed(f'5 렌더 {v}초', rend)
        out = os.path.join(work, f'{edl["meta"].get("out_prefix", "bobae_vlog")}_{v}s.mp4')
        def chk(out=out):
            r = subprocess.run([sys.executable, os.path.join(SF, 'check_be.py'), out], capture_output=True, text=True)
            ok = r.returncode == 0
            rep['videos'][os.path.basename(out)] = dict(pass_=ok, log=r.stdout.strip().split('\n'))
            return '통과' if ok else '실패 — ' + ' / '.join(l.strip() for l in r.stdout.split('\n') if '✗' in l)
        if timed(f'6 검사 {v}초', chk) != '통과': fails += 1
    rep['total_sec'] = round(sum(s['sec'] for s in rep['stages']), 1)
    json.dump(rep, open(os.path.join(work, 'report.json'), 'w'), ensure_ascii=False, indent=1)
    print(f'합계 {rep["total_sec"]}초 · 검사 실패 {fails}편')
    sys.exit(1 if fails else 0)


if __name__ == '__main__':
    main()
