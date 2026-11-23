"""출고 체크리스트 장치 — 매뉴얼대로 만들었는지 한 번에 확인한다. 2026-11-24.

사용자: 「매뉴얼 대로 제작하는지 체크리스트 장치 필요하지 않나」.
검사가 여러 파일(check_be · edit_gate · v13 비교)로 흩어져 있어 하나를 빼먹고 전달하는 일이 생겼다.
이 장치는 셋을 차례로 돌리고, 매뉴얼 항목마다 「자동 통과 / 자동 실패 / 사람 확인」을 표로 남긴다.

사용:
  python3 scripts/shortform/release_checklist.py 영상.mp4 [--golden 기준.mp4] [--accept '문구=이유' ...]
출력:
  영상.mp4.checklist.md  (항목표)  ·  영상.mp4.v13.png (기준 영상과 같은 비율 시각 나란히)
  자동 실패가 하나라도 있으면 종료 코드 1 → 전달·배포 금지.
--accept: 사람이 화면을 직접 보고 오탐으로 판단한 실패만. 이유가 체크리스트에 그대로 남는다.
"""
import argparse, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
GOLD = os.path.join(REPO, 'public', 'shortform-samples', 'g350-v13', 'g350-v13.mp4')

# 매뉴얼 항목 → 어느 검사 줄이 그 항목을 보는지(문구 일부). 사람 확인은 검사 줄이 없는 항목.
ITEMS = [
    ('음량 −14 LUFS ±1', 'check_be', '음량'),
    ('효과음 개수·간격·같은 소리 간격', 'check_be', '효과음'),
    ('끝 화면 구간 효과음 없음', 'check_be', '끝 로고 구간'),
    ('칩 글자 크기 70 · 제목 74', 'check_be', '칩 글자 크기'),
    ('위쪽 칩 자리 300px 하나 · 윗선 흔들림 24px', 'check_be', '위쪽 칩'),
    ('칩 칠 높이 같음 · 노랑 #F5F200', 'check_be', '칩 칠 높이|칩 노랑'),
    ('첫 화면 브랜드 칩 판 기울기', 'check_be', '브랜드 칩'),
    ('자막에 칠 없음', 'check_be', '자막 띠에 노랑'),
    ('§10-1 칩 글자 = 말한 낱말', 'check_be', '말한 낱말'),
    ('§10-2 칩은 낱말 0.06초 전', 'check_be', '칩 등장 시각'),
    ('§10-3·4 부위 낱말 칩은 화살표(아니면 이유 기록)', 'check_be', '화살표 없이|화살표 이름표'),
    ('§10-5 위쪽 칩 가로 가운데', 'check_be', '가운데 정렬'),
    ('§11 부위 숫자·재질·색 글자는 그 부위에 붙음', 'check_be', '부위 글자'),
    ('판·렌더러·필수 기법(edition_lock)', 'edit_gate', '렌더러|필수 기법|금지 기법'),
    ('칩·자막 안전영역 · 아래 20% 비움', 'edit_gate', '안전영역'),
    ('음성↔자막 시간축 ±40ms', 'edit_gate', '시간축'),
    ('칩이 번호판을 덮지 않음', 'edit_gate', '번호판'),
    ('첫 화면이 차 전체(정면·3/4)', None, 'v13 비교 시트 첫 칸'),
    ('말하는 부위 = 화면 부위', None, 'v13 비교 시트 + 칩 화면'),
    ('길이 v13 ±10%', 'self', 'length'),
    ('사실: 매물 정보·화면에 있는 것만(「무사고」·지어낸 수치 없음)', None, '대본·칩 글자'),
]


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    return [l.strip() for l in (r.stdout + r.stderr).splitlines() if l.strip().startswith(('✓', '✗'))]


def dur(p):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p], capture_output=True, text=True)
    try: return float(r.stdout.strip())
    except ValueError: return None


def sheet(video, gold, out, n=9):
    from PIL import Image, ImageDraw
    dv, dg = dur(video), dur(gold); tiles = []
    for name, p, d in (('우리', video, dv), ('v13', gold, dg)):
        row = []
        for i in range(n):
            t = d * (i + 0.5) / n; f = out + f'.{name}{i}.png'
            subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', f'{t:.2f}', '-i', p, '-frames:v', '1', '-vf', 'scale=180:320', f])
            row.append((Image.open(f).convert('RGB'), f'{name} {t:.1f}s')); os.remove(f)
        tiles.append(row)
    from PIL import ImageFont
    fp = subprocess.run(['fc-list', ':lang=ko', 'file'], capture_output=True, text=True).stdout.split(':')[0].strip()
    fnt = ImageFont.truetype(fp, 14) if fp else None   # 한글 이름표(기본 글꼴은 한글이 네모로 깨짐)
    S = Image.new('RGB', (180 * n, 2 * 340), 'white'); d = ImageDraw.Draw(S)
    for r, row in enumerate(tiles):
        for i, (im, lab) in enumerate(row): S.paste(im, (i * 180, r * 340 + 20)); d.text((i * 180 + 4, r * 340 + 2), lab, fill='black', font=fnt)
    S.save(out)


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('video'); ap.add_argument('--golden', default=GOLD)
    ap.add_argument('--accept', action='append', default=[], help="'실패 문구 일부=사람이 확인한 이유'")
    a = ap.parse_args(); v = os.path.abspath(a.video)
    acc = dict(x.split('=', 1) for x in a.accept)
    lines = {'check_be': run([sys.executable, os.path.join(HERE, 'check_be.py'), v]),
             'edit_gate': run([sys.executable, os.path.join(HERE, 'edit_gate.py'), 'post', v, '--plates'])}
    if not os.path.exists(a.golden):   # 일부만 받아 둔 작업 폴더면 저장소 기록에서 꺼냄
        tmp = v + '.golden.mp4'
        with open(tmp, 'wb') as f: subprocess.run(['git', '-C', REPO, 'show', 'HEAD:' + os.path.relpath(a.golden, REPO)], stdout=f)
        if os.path.getsize(tmp) > 0: a.golden = tmp
    dv, dg = dur(v), dur(a.golden) if os.path.exists(a.golden) else None
    if dg: sheet(v, a.golden, v + '.v13.png')
    rows, fails = [], 0
    for name, src, key in ITEMS:
        if src is None:
            rows.append((name, '사람 확인', key)); continue
        if src == 'self':
            okl = dg and abs(dv - dg) <= 0.10 * dg
            st = '✓' if okl else '✗'; note = f'{dv:.1f}초 (v13 {dg:.1f}초)' if dg else '기준 영상 없음'
            fails += st == '✗'; rows.append((name, st, note)); continue
        pats = key.split('|'); hit = [l for l in lines[src] if any(p in l for p in pats)]
        if not hit: rows.append((name, '검사 줄 없음', f'{src}가 이 항목을 출력하지 않음 → 사람 확인')); continue
        bads = [l for l in hit if l.startswith('✗')]
        acc_b = [l for l in bads if any(k in l for k in acc)]
        real = [l for l in bads if l not in acc_b]
        if real: fails += 1; rows.append((name, '✗', ' / '.join(l[2:] for l in real)[:300]))
        elif acc_b: rows.append((name, '✓(사람 판단)', ' / '.join(f'{l[2:]} → {next(acc[k] for k in acc if k in l)}' for l in acc_b)[:300]))
        else: rows.append((name, '✓', f'{len(hit)}줄 통과'))
    # 항목표에 안 걸린 실패도 놓치지 않음
    mapped = {l for src in lines for l in lines[src] if any(p in l for _, s, k in ITEMS if s == src for p in k.split('|'))}
    extra = [l for src in lines for l in lines[src] if l.startswith('✗') and l not in mapped and not any(k in l for k in acc)]
    for l in extra: fails += 1; rows.append(('(항목표 밖)', '✗', l[2:][:300]))
    md = [f'# 출고 체크리스트 — {os.path.basename(v)}', '', f'자동 실패 {fails}건 · 기준 영상 {os.path.basename(a.golden)}', '',
          '| 항목 | 결과 | 근거 |', '|---|---|---|'] + [f'| {n} | {s} | {t} |' for n, s, t in rows]
    if dg: md += ['', f'v13 나란히: `{os.path.basename(v)}.v13.png` (위 우리 · 아래 v13, 같은 비율 시각 9장) — 「사람 확인」 항목은 이 시트로 본다']
    open(v + '.checklist.md', 'w').write('\n'.join(md) + '\n')
    print('\n'.join(md))
    sys.exit(1 if fails else 0)


if __name__ == '__main__':
    main()
