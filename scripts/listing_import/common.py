"""매물 링크 가져오기 공용 부품.

- 딜러 본인 매물 링크 1건씩만 가져온다(대량 수집 아님, 호출 사이 간격).
- 결과는 매물 원장 키(시트 20_매물원장_필드)로 맞춘다. 출처 = 「다른 사이트」, 확인 상태 = 미확인.
- 차량번호·차대번호·연락처는 내부 칸에만 둔다. GitHub에 결과 파일을 커밋하지 않는다(data/import-out/ 는 .gitignore).
"""
from __future__ import annotations

import hashlib
import html as _html
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MAP = json.loads((ROOT / 'nuxt-register/app/lib/vehicle-ledger-map.json').read_text(encoding='utf-8'))
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131 Safari/537.36 BobaedreamListingImport/1.0'
_last_call = [0.0]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec='seconds')


_COOKIES = None


def _opener():
    """세션 쿠키(JSESSIONID 등)만 브라우저처럼 기억한다. 카서울닷컴 상세 화면은 목록에서 받은 세션이 있어야 열린다."""
    global _COOKIES
    if _COOKIES is None:
        import http.cookiejar
        _COOKIES = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
    return _COOKIES


def fetch(url: str, encoding: str | None = None, referer: str | None = None, gap: float = 1.0, data: dict | None = None) -> str:
    """한 번에 한 요청, 요청 사이 최소 gap초."""
    wait = gap - (time.time() - _last_call[0])
    if wait > 0:
        time.sleep(wait)
    body = urllib.parse.urlencode(data).encode() if data is not None else None  # 사이트 화면의 공개 폼(POST)을 브라우저처럼 보낼 때만
    req = urllib.request.Request(url, data=body, headers={'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9', **({'Referer': referer} if referer else {})})
    for attempt in (1, 2):  # 지방 단지 서버는 접속이 가끔 끊겨서 한 번만 다시 시도
        try:
            with _opener().open(req, timeout=30) as r:
                raw = r.read()
                enc_hdr = r.headers.get_content_charset()
            break
        except urllib.error.URLError as e:
            if attempt == 2 or 'reset' not in str(e).lower() and 'timed out' not in str(e).lower():
                raise
            time.sleep(3)
    enc = encoding or enc_hdr
    if not enc:  # 머리글에 글자 방식이 없으면 HTML 안 meta charset 을 본다(euc-kr 사이트 대비)
        m = re.search(rb'charset=["\']?([\w-]+)', raw[:4000], re.I)
        enc = m.group(1).decode() if m else 'utf-8'
    if enc.lower() in ('euc-kr', 'ks_c_5601-1987', 'euckr'):
        enc = 'cp949'
    _last_call[0] = time.time()
    return raw.decode(enc, errors='ignore')


def text_lines(html: str) -> list[str]:
    t = re.sub(r'<script.*?</script>|<style.*?</style>', '', html, flags=re.S | re.I)
    t = _html.unescape(re.sub(r'<[^>]+>', '\n', t))
    return [l.strip() for l in t.split('\n') if l.strip()]


def label_value(lines: list[str], label: str) -> str | None:
    """「라벨 / 값」 줄 구조에서 라벨 다음 줄 값."""
    for i, l in enumerate(lines):
        if l == label and i + 1 < len(lines):
            v = lines[i + 1]
            if v in SPEC_LABELS:  # 값이 빈 칸이면 다음 라벨이 붙어 나옴(서울오토갤러리 '색상 / 제시번호')
                return None
            return v
    return None


SPEC_LABELS = {'차량번호', '연식', '주행거리', '변속기', '연료', '배기량', '색상', '제시번호', '압류', '저당', '성능번호', '제시구분',
               '최초등록일', '차종', '차량명', '제조사', '사고여부', '세금미납', '판매가격', '차량가격'}


def balanced_json(s: str, start: int) -> dict | None:
    """s[start] 가 '{' 인 곳부터 짝 맞는 JSON 객체를 잘라 파싱."""
    depth, i, in_str, esc = 0, start, False, False
    while i < len(s):
        c = s[i]
        if in_str:
            if esc:
                esc = False
            elif c == '\\':
                esc = True
            elif c == '"':
                in_str = False
        elif c == '"':
            in_str = True
        elif c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(s[start:i + 1])
                except json.JSONDecodeError:
                    return None
        i += 1
    return None


# ── 값 정리 ──
def to_int(v) -> int | None:
    if v is None:
        return None
    s = str(v).replace(',', '').strip()
    m = re.search(r'([\d.]+)\s*만', s)          # 5.2만km → 52000(약)
    if m:
        return round(float(m.group(1)) * 10000)
    m = re.search(r'-?\d+(?:\.\d+)?', s)
    return round(float(m.group(0))) if m else None


def year_month(v) -> tuple[int | None, str | None]:
    """'2019 / 08식', '2016년 01월', '202201', '20250901' → (2019, '2019-08')"""
    nums = re.findall(r'\d+', str(v or ''))
    if not nums:
        return None, None
    first = nums[0]
    if len(first) in (6, 8) and first[:2] in ('19', '20'):          # 202201 · 20250901
        mm = int(first[4:6])
        return int(first[:4]), (f'{first[:4]}-{mm:02d}' if 1 <= mm <= 12 else None)
    if len(first) == 2 and len(nums) > 1 and len(nums[1]) <= 2:     # 20년08월(20년형)
        y = 2000 + int(first) if int(first) < 70 else 1900 + int(first)
        mm = int(nums[1])
        return y, (f'{y}-{mm:02d}' if 1 <= mm <= 12 else None)
    if len(first) == 4 and first[:2] in ('19', '20'):                # 2019 / 08식 · 2016년 01월 · 2019
        y = int(first)
        if len(nums) > 1 and len(nums[1]) <= 2 and 1 <= int(nums[1]) <= 12:
            return y, f'{y}-{int(nums[1]):02d}'
        return y, None
    return None, None


TRUCK_WORDS = ('포터', '봉고', '트럭', '카고', '덤프', '윙바디', '탑차', '마이티', '메가트럭', '엑시언트', '프리마', '노부스', '파비스', '라이노', '버스', '쏠라티')


def category_of(*names) -> str:
    """차명으로 승용/트럭·특장 대략 구분(원장 A02). 확실치 않으면 승용."""
    s = ' '.join(str(n or '') for n in names)
    return '트럭·특장' if any(w in s for w in TRUCK_WORDS) else '승용'


def yes_no_unknown(*vals) -> str | None:
    """압류·저당 표기 → 있음/없음/미확인"""
    vs = [str(v).strip() for v in vals if v is not None and str(v).strip() != '']
    if not vs:
        return None
    if any(re.search(r'정보\s*없음|확인|미확인', v) for v in vs):
        return '미확인'
    if any(v in ('있음', 'Y', 'True', '1') or (v.isdigit() and int(v) > 0) for v in vs):
        return '있음'
    return '없음'


def fuel(v) -> str | None:
    s = re.sub(r'\s', '', str(v or ''))
    return MAP['fuel'].get(s, s) or None


def gear(v) -> str | None:
    s = re.sub(r'\s', '', str(v or ''))
    return MAP['gear'].get(s, s) or None


def price_krw(v) -> tuple[int | None, str]:
    """'780 만원'·3550(만원 단위)·'상담' → (원, 표시)"""
    s = str(v if v is not None else '').strip()
    if not s or re.search(r'상담|문의|보류', s):
        return None, '가격 상담'
    n = to_int(s)
    if n is None or n <= 0:
        return None, '가격 상담'
    return (n * 10000 if n < 100000 else n), '공개'


def strip_corp(s: str | None) -> str | None:
    if not s:
        return s
    return re.sub(r'\(주\)|㈜|주식회사', '', s).strip() or None


# ── 원장 칸 ──
INTERNAL = {'plate_no', 'vin', 'contact', 'dealer_reg_no'}


def build_ledger(site: str, url: str, fields: dict, photos: list[str]) -> dict:
    cells = {}
    for k, v in fields.items():
        if v in (None, '', []):
            continue
        cells[k] = {'value': v, 'source': '다른 사이트', 'site': site, 'verify': '미확인'}
    cells['listing_url'] = {'value': url, 'source': '다른 사이트', 'site': site, 'verify': '확인됨'}
    cells['source_url'] = cells['listing_url']
    if photos:
        cells['photos'] = {'value': len(photos), 'source': '다른 사이트', 'site': site, 'verify': '확인됨'}
        cells['photo_source'] = {'value': '다른 사이트', 'source': '다른 사이트', 'site': site, 'verify': '확인됨'}
    # 단정어는 원장에 넣지 않는다(무사고 등)
    for k, c in list(cells.items()):
        if any(w in str(c['value']) for w in MAP['never_write']):
            cells.pop(k)
    return {'site': site, 'checked_at': now_iso(), 'photo_urls': photos, 'cells': cells}


def listing_key(site: str, url: str) -> str:
    return f'{site}-' + hashlib.sha1(url.encode()).hexdigest()[:10]


def download_photos(urls: list[str], out_dir: Path, referer: str | None = None, limit: int = 40) -> list[dict]:
    """원본 그대로 저장(가공 없음). 같은 내용은 한 장만."""
    out_dir.mkdir(parents=True, exist_ok=True)
    seen, saved = set(), []
    for i, u in enumerate(urls[:limit], 1):
        try:
            req = urllib.request.Request(u, headers={'User-Agent': UA, **({'Referer': referer} if referer else {})})
            with urllib.request.urlopen(req, timeout=30) as r:
                b = r.read()
            time.sleep(0.3)
        except Exception as e:  # 실패한 사진만 건너뛴다
            saved.append({'order': i, 'url': u, 'error': type(e).__name__})
            continue
        h = hashlib.sha256(b).hexdigest()
        if h in seen or len(b) < 2000:
            continue
        seen.add(h)
        ext = '.png' if b[:4] == b'\x89PNG' else '.webp' if b[8:12] == b'WEBP' else '.jpg'
        name = f'p{len(seen):02d}{ext}'
        (out_dir / name).write_bytes(b)
        saved.append({'order': len(seen), 'file': name, 'bytes': len(b), 'sha256': h[:16]})
    return saved


MODEL_PREFIX = {'더', '올', '뉴', '디', '신형', '더뉴', '올뉴', '디올뉴', 'THE', 'ALL', 'NEW'}


def split_model(words: list[str]) -> tuple[str | None, str | None]:
    """['더', '뉴카니발(KA4)', '하이리무진'] → ('더 뉴카니발(KA4)', '하이리무진'). '더'·'올'·'뉴' 같은 앞말만 모델로 잘리지 않게 다음 낱말과 붙인다."""
    w = [x for x in words if x]
    i = 0
    while i < len(w) - 1 and w[i].upper() in MODEL_PREFIX:
        i += 1
    if not w:
        return None, None
    return ' '.join(w[:i + 1]), (' '.join(w[i + 1:]) or None)
