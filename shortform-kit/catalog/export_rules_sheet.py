"""규칙 파일(json)을 구글 시트 「4x_규칙_*」 탭용 3열 표로 펼친다.

python3 shortform-kit/catalog/export_rules_sheet.py > 규칙.json
출력: {"탭 이름": [["규칙 경로", "값", "파일"], ...]} — 값의 단일 기준은 깃허브 json, 시트는 읽기용 사본.
"""
import json, os, subprocess, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
FILES = {
    '40_규칙_벨기에고정': 'scripts/shortform/be_locked_rules.json',
    '41_규칙_편집유형고정': 'scripts/shortform/edition_lock.json',
    '42_규칙_AS24칩': 'scripts/shortform/as24_edit_rules.json',
    '43_규칙_영상옵션기법T': 'scripts/shortform/video_listing/feature_edit_rules.json',
    '44_규칙_옵션비주얼': 'scripts/shortform/photo_listing/option_visual_rules.json',
    '45_규칙_부위당기기': 'scripts/shortform/photo_listing/part_zoom_rules.json',
    '46_규칙_카드컷루틴': 'scripts/shortform/photo_listing/card_routine_rules.json',
}


def flat(v, p, out):
    if isinstance(v, dict) and v:
        for k, x in v.items():
            flat(x, f'{p}.{k}' if p else str(k), out)
    elif isinstance(v, list) and v and any(isinstance(x, (dict, list)) for x in v):
        for i, x in enumerate(v):
            key = x.get('id') or x.get('code') or x.get('name') if isinstance(x, dict) else None
            flat(x, f'{p}[{key if key else i}]', out)
    else:
        s = json.dumps(v, ensure_ascii=False) if isinstance(v, (list, dict)) else ('' if v is None else str(v))
        out.append([p, s[:4000]])


def main():
    tabs = {}
    for tab, f in FILES.items():
        d = json.load(open(os.path.join(ROOT, f), encoding='utf-8'))
        rows = []
        flat(d, '', rows)
        h = subprocess.run(['git', 'log', '-1', '--format=%h %ad', '--date=short', '--', f], cwd=ROOT,
                           capture_output=True, text=True).stdout.strip()
        tabs[tab] = [['규칙 경로(파일 안)', '값', '파일 · 마지막 커밋']] + [[k, v, f'{f} · {h}'] for k, v in rows]
    json.dump(tabs, sys.stdout, ensure_ascii=False)


if __name__ == '__main__':
    main()
