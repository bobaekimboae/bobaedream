"""성능·상태점검기록부(check.korea-usedcar.co.kr view_new.php) HTML → 체크된 값만 뽑기 (2026-11-22)

python3 inspect_parse.py <기록부.html>  → JSON 출력
결과에는 차량번호·차대번호를 넣지 않는다(카드에 쓰지 않음).
"""
import html, json, re, sys

DROP = ('자동차등록번호', '차대번호')


def text(x):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', x))).strip()


def parse(s):
    s = re.sub(r'<!--.*?-->', ' ', s, flags=re.S)
    s = re.sub(r'<script.*?</script>|<style.*?</style>', ' ', s, flags=re.S)
    toks = re.split(r'(<[^>]+>)', s)
    ctx, out, marks, after_box = '', [], [], False
    group, group_rows, pending_th = '', 0, None
    for i, t in enumerate(toks):
        if t.startswith('<'):
            tag = re.split(r'[\s>/]', t[1:].lstrip('/'), maxsplit=1)[0].lower(); tag = ('/' + tag) if t.startswith('</') else tag
            if tag == 'input':
                after_box = True
                if re.search(r'\bchecked\b', t):
                    j = i + 1
                    while j < len(toks) and (toks[j].startswith('<') and not toks[j].lower().startswith(('<input', '<td', '</td', '<th'))):
                        j += 1
                    nxt = text(toks[j]) if j < len(toks) and not toks[j].startswith('<') else ''
                    out.append((ctx, nxt))
            elif tag == 'img':
                after_box = True
                m = re.search(r'src=["\']([^"\']+)', t)
                nxt = text(toks[i + 1]) if i + 1 < len(toks) else ''
                if m and re.match(r'\d+\.', nxt):
                    marks.append((nxt, m.group(1).rsplit('/', 1)[-1]))
            elif tag in ('td', '/td', 'th', '/th', 'tr', '/tr'):
                after_box = False
                if tag == 'tr':
                    group_rows -= 1
                if tag == 'th':
                    m = re.search(r'rowspan=["\']?(\d+)', t)
                    pending_th = int(m.group(1)) if m else 0
            continue
        c = text(t)
        if not c:
            continue
        if after_box:
            after_box = False
            continue
        if pending_th is not None:
            if pending_th > 1:
                group, group_rows = c, pending_th
                pending_th = None
                ctx = c
                continue
            pending_th = None
            ctx = (group + ' · ' + c) if group_rows > 0 and group else c
        else:
            ctx = c
    plain = text(s)
    km = re.search(r'현재 주행거리 \[\s*([\d,]+)\s*Km', plain)
    first = re.search(r'최초등록일\s*([\d.]+)', plain)
    name = re.search(r'① 차명\s*(.*?)\s*②', plain)
    note = re.search(r'성능ㆍ상태점검자\s*(.*?)\s*가격ㆍ조사산정자', plain)
    return {
        'name': name.group(1) if name else '',
        'first_reg': first.group(1) if first else '',
        'km': km.group(1) if km else '',
        'checked': [(c, v) for c, v in out if not any(d in c for d in DROP)],
        'panel_marks': marks,
        'note': note.group(1) if note else '',
    }


if __name__ == '__main__':
    print(json.dumps(parse(open(sys.argv[1], encoding='utf-8', errors='replace').read()), ensure_ascii=False, indent=1))
