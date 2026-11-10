"""영상 단위 패턴 유형 분류기 (AS24 NL·BE 400개 조사용)

입력: titles.json(시트 제목), ev/<vid>/events.json(검출), all.json(하위 유형), probe.json(사람·말 분량, 선택)
출력: patterns.json — 영상마다 pattern, 근거, 구조 특징

패턴 유형은 「영상이 무엇을 하는가」로 나눈다. 같은 영상에 여러 요소가 있으면
아래 RULES 순서(위가 우선)로 하나만 고른다.
"""
import json, re, sys, os
from collections import Counter, defaultdict

# (코드, 이름, 제목 정규식(원문·한국어 제목 모두 대상))
RULES = [
    ('P13', '거리·선수 인터뷰', r'wij vroegen|fc de rebellen|rebellen|dit of dat|voetbal|olivier deschacht|straat op|motor show|ceo'),
    ('P12', 'ASMR·소리', r'asmr|geluid|🔊|lean back and relax'),
    ('P15', '판매 완료', r'verkocht|판매되었습니다'),
    ('P04', '퀴즈: 마력 맞히기', r'(raad|weet|kun|kan).{0,30}(pk|vermogen)|hoeveel pk|aantal pk|마력.*맞'),
    ('P05', '퀴즈: 가격·연식 맞히기', r'prijs te weten|bouwjaar|denk jij de prijs|hoeveel kost|hoeveel vakjes'),
    ('P03', '퀴즈: 차종·브랜드 맞히기', r'raad|raden|weet jij (welk|het|van welke)|herken|kun jij raden|kan jij raden|ken jij dit|weet jij het|guess|te makkelijk|te gemakkelijk|welk (merk|model)'),
    ('P06', '예산·조건 맞춤 추천', r'budget|op ?zoek naar een (auto|bmw|leuke)|je zoekt|zoek je een|lager dan|onder de €|tussen de|voor een prijs|op zoek naar je eerste auto|zonder meteen|met €\d|€\s?\d.{0,12}\?'),
    ('P08', '비교·선택 질문', r'\bvs\b|of de |of toch|welke (kies|zou|bmw|auto|past|van deze)|voor welke|zou jij kiezen|ga jij voor|this or that|kies jij|neem jij|of een gti|premium of|oude versie|hot or not'),
    ('P11', 'N가지 리스트', r'^\s*(\d|drie|twee|vijf)\s|\b\d\s(redenen|dingen|punten|leuke|auto|audi|mercedes)|deze 5'),
    ('P16', '서비스·플랫폼 홍보', r'autoscout24\.(nl|be)|waardebepaling|verkopen|oplichting|aanbod|perfecte match|volg ons|op zoek naar je volgende|wil je graag jouw auto'),
    ('P17', '뉴스·제도', r'keuring|crisis|stopt|per kilometer|regels|nummer 1 merk|car-pass|tesla.{0,20}(ruimte|zon)|\d{1,2} (juli|september|januari)'),
    ('P09', '숨은 기능·팁·핵', r'hack|tip|optie|verborgen|vakjes|snufjes|details|instellen|schroevendraaier|sleutel|ruimte cre|wist je deze|digital light|lichtshow|p r n d'),
    ('P10', '상식·브랜드 이야기', r'\d+ ?km (met|op)|제임스 본드|때문에 .{0,10}익숙|staat voor|waar staat|wist je|wist jij|geheim|weetjes|betekent|familie|naam is|lijkt op|officieel|individual|vroeger|merk uit|premiummerk|chinese innovatie|ooit|wat maakt'),
    ('P14', '시청자 참여 질문', r'zou jij hem kopen|hoe vaak spot|omschijf|wat (was|vind|is volgens)|laat (weten|het weten)|omschrijf|jouw gekste|eerste auto|duurste boete|welke optie mag'),
    ('P07', '가격 공개 매물', r'kost|€\s?\d|\d[\d.]*\s?euro|vertel ik (op het einde|je zo)|te koop|prijs'),
    ('P18', '왜 인기·가치 설명', r'waarom|populair|best verkochte|meest verkochte|eerste auto|gezinsauto|perfecte|interessante daily|voordeligste|betaalbare|zuinig'),
    ('P02', '차 앞 소개(진행자)', r'achter mij|naast mij|in 30 seconden|voorzien van|upgrade|is met bijna|past zich aan|camera.s|kiest voor|^de .{2,40} (is|bij)|cartour|ik neem jullie|ik vertel|dit is (de|een|het|geen|niet)|ik laat je|uitgevoerd met|heeft (pas|een|zoveel)|deze .{0,40}(is|heeft|ziet)'),
]
NAMES = {c: n for c, n, _ in RULES}
NAMES['P01'] = '차명 쇼케이스(분위기)'
NAMES['P00'] = '분류 안 됨'


def title_pattern(t):
    s = (t.get('orig') or '') + ' || ' + (t.get('ko') or '')
    low = s.lower()
    for code, _, rx in RULES:
        m = re.search(rx, low)
        if m:
            return code, m.group(0)
    # 차명(+이모지)만 있으면 쇼케이스
    words = re.sub(r'[^\w€.\-\s]', ' ', re.sub(r'#\S+', ' ', t.get('orig') or '')).split()
    if t.get('maker') and len(words) <= 9:
        return 'P01', 'car-name-only'
    if 1 <= len(words) <= 6:
        return 'P01', 'short-title'
    return 'P00', ''


def main(skill_dir):
    T = json.load(open(os.path.join(skill_dir, 'titles.json')))
    A = json.load(open(os.path.join(skill_dir, 'all.json')))
    P = {}
    pj = os.path.join(skill_dir, 'probe.json')
    if os.path.exists(pj):
        P = json.load(open(pj))
    by = defaultdict(list)
    for r in A:
        by[r['vid']].append(r)
    out = {}
    for d in sorted(os.listdir(os.path.join(skill_dir, 'ev'))):
        ej = os.path.join(skill_dir, 'ev', d, 'events.json')
        if not os.path.exists(ej):
            continue
        e = json.load(open(ej))
        t = T.get(d, {})
        code, why = title_pattern(t) if t else ('P00', 'no-title')
        rs = by.get(d, [])
        dur = e['dur']
        c = Counter(r['sub'] for r in rs)
        first = [r['sub'] for r in rs if r['t'] < 3.0]
        last = [r['sub'] for r in rs if r['t'] > dur - 4.0]
        pr = P.get(d, {})
        out[d] = dict(
            tag=d[:2], pattern=code, pattern_name=NAMES[code], why=why, title=t.get('orig', ''),
            dur=round(dur, 1), cuts_per_s=round(len(e.get('cuts', [])) / max(dur, 1), 2),
            sfx_per_s=round(len(e.get('sfx', [])) / max(dur, 1), 2),
            overlays=len(rs), overlays_per_10s=round(len(rs) / max(dur, 1) * 10, 2), subs=dict(c),
            first3s=first, last4s=last, end_logo=('logo' in last),
            person=pr.get('person'), face_frac=pr.get('face_frac'), words_per_s=pr.get('words_per_s'), lang=pr.get('lang'),
        )
    json.dump(out, open(os.path.join(skill_dir, 'patterns.json'), 'w'), ensure_ascii=False, indent=1)
    cnt = Counter((v['tag'], v['pattern']) for v in out.values())
    for code in sorted(set(k[1] for k in cnt)):
        print(code, NAMES[code], 'NL', cnt[('NL', code)], 'BE', cnt[('BE', code)])
    return out


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '.')
