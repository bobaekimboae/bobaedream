"""시안 사이트 영상을 영상 전용 저장소 3개로 나누는 도구(2026-11-10).

깃허브 페이지는 사이트 1GB 이하를 권장하고, 넘으면 배포(파일 올리기)가 10분 제한에 걸려 실패한다.
public 안 영상 775MB(91개)를 성격별 3개 저장소로 옮기고, 본 사이트는 그 주소를 불러온다.
원본 파일은 본 저장소에 남긴다(검사용 media-contracts가 public/videos를 읽음). 배포할 때만 moved.txt 목록을 빼고 올린다.

python3 scripts/media-split/media_split.py plan                # 묶음별 크기, 주소를 못 찾은 참조
python3 scripts/media-split/media_split.py export OUTDIR        # OUTDIR/bobaedream-media-N/ 에 복사(높은 비트레이트는 압축)
python3 scripts/media-split/media_split.py rewrite              # 본 사이트 참조를 영상 저장소 주소로 바꿈
python3 scripts/media-split/media_split.py moved                # 배포에서 뺄 목록 → scripts/media-split/moved.txt
"""
import json
import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PUB = os.path.join(ROOT, 'public')
CFG = json.load(open(os.path.join(os.path.dirname(__file__), 'groups.json'), encoding='utf-8'))
EXT = ('.mp4', '.webm', '.mov')
TEXT_EXT = ('.html', '.js', '.mjs', '.css', '.json', '.ts', '.tsx', '.vue')
SCAN = ['public', 'src']
SKIP = ('node_modules', '.output', '.nuxt', '/dist/')
REF = re.compile(r'''([A-Za-z0-9_./%@-]*\.(?:mp4|webm|mov))(\?[^"'\s)<>]*)?''')


def videos():
    out = []
    for d, _, fs in os.walk(PUB):
        for f in fs:
            if f.lower().endswith(EXT):
                out.append(os.path.relpath(os.path.join(d, f), PUB).replace(os.sep, '/'))
    return sorted(out)


def group_of(rel):
    for g in CFG['groups']:
        if any(rel.startswith(p) for p in g['prefixes']):
            return g
    return CFG['groups'][-1]


def media_path(rel):
    """영상 저장소 안 경로. 맨 앞 assets/는 뺀다: 배포 단계가 /assets/ 글자를 /bobaedream/assets/로 바꾸므로 주소에 /assets/가 있으면 깨진다"""
    return rel[len('assets/'):] if rel.startswith('assets/') else rel


def url_of(rel):
    return CFG['base_url'].format(repo=group_of(rel)['repo']) + media_path(rel)


def resolve(ref, file_path, moved):
    """참조 글자를 public 기준 경로로 풀기. 파일 위치 기준 → 사이트 기준 → assets 기준 순서로, 옮길 영상 목록에 있는 것"""
    r = ref.split('?')[0].lstrip('./') if ref.startswith('./') else ref.split('?')[0]
    cands = []
    if not ref.startswith(('http://', 'https://')):
        if file_path.startswith(PUB):
            cands.append(os.path.relpath(os.path.normpath(os.path.join(os.path.dirname(file_path), r)), PUB).replace(os.sep, '/'))
        cands += [r.lstrip('/'), 'assets/' + r.lstrip('/')]
        cands += [c.split('/bobaedream/', 1)[1] for c in [r] if '/bobaedream/' in c]
    for c in cands:
        if c in moved:
            return c
    return None


def text_files():
    for base in SCAN:
        for d, _, fs in os.walk(os.path.join(ROOT, base)):
            if any(s in d.replace(os.sep, '/') + '/' for s in SKIP):
                continue
            for f in fs:
                if f.endswith(TEXT_EXT):
                    yield os.path.join(d, f)


def scan(apply=False):
    moved = set(videos())
    hits, miss = 0, []
    for fp in text_files():
        try:
            s = open(fp, encoding='utf-8').read()
        except Exception:
            continue
        if not re.search(r'\.(mp4|webm|mov)', s):
            continue
        out, last, changed = [], 0, False
        for m in REF.finditer(s):
            ref, q = m.group(1), m.group(2) or ''
            if ref.startswith('//') or 'github.io' in s[max(0, m.start() - 60):m.start()]:
                continue
            rel = resolve(ref, fp, moved)
            if rel:
                out.append(s[last:m.start()]); out.append(url_of(rel) + q); last = m.end(); changed = True; hits += 1
            elif '/' in ref or os.path.basename(ref) in {os.path.basename(v) for v in moved}:
                miss.append((os.path.relpath(fp, ROOT), ref))
        if changed and apply:
            out.append(s[last:])
            open(fp, 'w', encoding='utf-8').write(''.join(out))
    return hits, miss


def bitrate(p):
    o = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=bit_rate', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout.strip()
    try:
        return float(o)
    except ValueError:
        return 0.0


def export(outdir):
    C = CFG['compress']
    for rel in videos():
        g = group_of(rel)
        dst = os.path.join(outdir, g['repo'], media_path(rel))
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        src = os.path.join(PUB, rel)
        if rel.endswith('.mp4') and bitrate(src) > C['above_bps']:
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-c:v', 'libx264', '-preset', C['preset'], '-crf', str(C['crf']),
                            '-maxrate', C['maxrate'], '-bufsize', C['bufsize'], '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', dst], check=True)
            if os.path.getsize(dst) >= os.path.getsize(src):
                shutil.copy2(src, dst)
        else:
            shutil.copy2(src, dst)
    for g in CFG['groups']:
        d = os.path.join(outdir, g['repo'])
        os.makedirs(d, exist_ok=True)
        open(os.path.join(d, '.nojekyll'), 'w').close()
        n = sum(1 for _ in os.walk(d))
        open(os.path.join(d, 'README.md'), 'w', encoding='utf-8').write(f"# {g['repo']}\n\n{g['title']} — 보배드림 시안(bobaekimboae.github.io/bobaedream)이 불러오는 영상 저장소. 원본은 본 저장소 public/ 같은 경로.\n")


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'plan'
    if cmd == 'plan':
        size = {}
        for rel in videos():
            k = group_of(rel)['repo']
            size[k] = size.get(k, 0) + os.path.getsize(os.path.join(PUB, rel))
        for k, v in size.items():
            print(f'{k}\t{v / 1048576:.0f}MB')
        hits, miss = scan(False)
        print(f'바꿀 참조 {hits}곳 · 못 푼 참조 {len(miss)}곳')
        for f, r in miss[:40]:
            print('  못 품', f, r)
    elif cmd == 'export':
        export(sys.argv[2])
    elif cmd == 'rewrite':
        hits, miss = scan(True)
        print(f'바꾼 참조 {hits}곳 · 못 푼 참조 {len(miss)}곳')
    elif cmd == 'moved':
        # 주소를 코드 안에서 조합해 못 바꾼 영상(못 푼 참조와 파일 이름이 같은 것)은 본 사이트에도 남긴다
        _, miss = scan(False)
        keepb = {os.path.basename(r.split('?')[0]) for _, r in miss}
        mv = [v for v in videos() if os.path.basename(v) not in keepb]
        p = os.path.join(os.path.dirname(__file__), 'moved.txt')
        open(p, 'w').write('\n'.join(mv) + '\n')
        print(p, f'배포에서 뺌 {len(mv)}개 · 본 사이트에도 남김 {len(videos()) - len(mv)}개')


if __name__ == '__main__':
    main()
