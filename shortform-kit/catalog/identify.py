"""만든 영상에 어떤 편집 기법을 썼는지 표준 코드로 적는다.

python3 shortform-kit/catalog/identify.py 차폴더 [--fade]

차폴더의 cfg.py(설정) + plan.json(렌더 계획)을 읽어 techniques.json 의 코드 목록을 만들고
차폴더/used_techniques.json 에 저장한다. 영상 파일 옆에 두면 「이 영상은 무엇을 썼나」에 바로 답할 수 있다.
지금은 사진판(ED-PHOTO)만 읽는다. 렌더러가 직접 기록하도록 바꾸는 것은 다음 단계(CHANGELOG 참고).
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))


def load_cfg(path):
    ns = {}
    src = open(path, encoding='utf-8').read()
    exec(compile(src, path, 'exec'), {}, ns)   # 우리 저장소가 만든 cfg.py 만 읽는다
    return ns


def identify(folder, fade=False):
    cat = json.load(open(os.path.join(HERE, 'techniques.json'), encoding='utf-8'))
    known = {i['code'] for i in cat['items']}
    C = load_cfg(os.path.join(folder, 'cfg.py'))
    P = json.load(open(os.path.join(folder, 'plan.json'), encoding='utf-8'))
    used = {}

    def add(code, why):
        used.setdefault(code, []).append(why)

    add('MOVE-KENBURNS', '사진판 기본 움직임')
    add('CAP-KARAOKE', '말 자막')
    if C.get('HOOK'):
        add('SG-INTRO-EMBLEM', 'HOOK 설정')
        add('CAP-HOOK-TITLE', 'HOOK 설정')
    if C.get('FIT'):
        add('MOVE-FIT-BLURFILL', f"FIT 사진 {len(C['FIT'])}장")
    if C.get('AUTO_ZOOM'):
        add('MOVE-PARTZOOM', 'AUTO_ZOOM')
    if C.get('PUNCH'):
        add('MOVE-PUNCH', 'PUNCH')
    if C.get('MARKS'):
        add('CHIP-ICON3D', 'MARKS(칩 옆 아이콘)')
    for flag, code in (('POINTERS', 'MARK-POINTER'), ('DIM_LINES', 'MARK-DIM-LINE'), ('TAGS', 'CHIP-TAG'),
                       ('SECTIONS', 'SG-SECTION'), ('OFFICIAL_PHOTOS', 'SG-CATALOG'), ('ODOMETER_KM', 'SG-ODOMETER')):
        if C.get(flag):
            add(code, flag)
    if C.get('DEALER_CHIP') or C.get('DEALER_FOOTER') or C.get('DEALER_LOGO'):
        add('CHIP-DEALER', '딜러 칩·띠·로고')
    if C.get('END_CARD', True):
        add('SG-END-DEALER', '끝 화면')
    tmap = {}
    for i in cat['items']:
        for p in i.get('plan', []):
            tmap[p] = i['code']
    for c in P['cuts']:
        t = c.get('trans')
        if not t:
            continue
        add('TR-FADE' if fade else tmap.get(t, 'TR-?' + t), f"컷 {c['cut']}")
    for txt, st, en in P.get('chips', []):
        num = bool(re.search(r'\d', txt))
        add('CHIP-NUMBER' if num else 'CHIP-POINT', f'{txt} {st:.2f}초')
        add('SFX-DING', f'{txt} 등장')
    if not fade and any(c.get('trans', '').startswith('whip') for c in P['cuts']):
        add('SFX-WHOOSH', '휙 넘김')
    opts = C.get('LISTING_OPTIONS') or {}
    if C.get('AUTO_VISUALS'):
        for k in opts:
            add('FM-' + k.upper().replace('_', '-'), 'LISTING_OPTIONS')
    if os.path.exists(os.path.join(folder, 'voice_a.mp3')):
        add('VO-TTS', 'voice_a.mp3')
    add('BGM-SHOWROOM', '배경음악')
    add('AUD-LOUDNORM', '음량 맞춤')
    unknown = [c for c in used if c not in known and not c.startswith('FM-')]
    out = {'edition': 'ED-PHOTO', 'variant': 'fade' if fade else 'default', 'catalog_version': cat['version'],
           'used': [{'code': k, 'count': len(v), 'where': v} for k, v in used.items()], 'unknown': unknown}
    return out


if __name__ == '__main__':
    folder = sys.argv[1]
    r = identify(folder, '--fade' in sys.argv)
    json.dump(r, open(os.path.join(folder, 'used_techniques.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f"{r['edition']} ({r['variant']}) · 사전 v{r['catalog_version']}")
    for u in r['used']:
        print(f"  {u['code']:20} ×{u['count']}")
    if r['unknown']:
        print('사전에 없는 코드:', r['unknown'])
