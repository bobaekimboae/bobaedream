"""깃허브 페이지용 매뉴얼 화면 만들기 → public/shortform-kit/index.html
python3 shortform-kit/catalog/export_html.py
원본은 techniques.json·규칙 JSON·CHANGELOG·ROADMAP. 이 파일은 그걸 그대로 보여 주는 사본(직접 고치지 않음).
배포 단계가 HTML의 '/assets/' 글자를 바꾸므로 소리 주소는 스크립트에서 이어 붙인다.
"""
import html, json, os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build, export_sheet

ROOT = build.ROOT
OUT = os.path.join(ROOT, 'public/shortform-kit/index.html')
e = lambda s: html.escape(str(s or ''))


def table(rows, cls=''):
    h = ''.join(f'<th>{e(c)}</th>' for c in rows[0])
    b = ''.join('<tr>' + ''.join(f'<td>{e(c)}</td>' for c in r) + '</tr>' for r in rows[1:])
    return f'<div class="tw"><table class="{cls}"><thead><tr>{h}</tr></thead><tbody>{b}</tbody></table></div>'


def main():
    C = json.load(open(build.SRC, encoding='utf-8'))
    T = export_sheet.tabs()
    try:
        sha = subprocess.check_output(['git', '-C', ROOT, 'rev-parse', '--short=9', 'HEAD'], text=True).strip()
    except Exception:
        sha = ''
    sfx = sorted(f[:-4] for f in os.listdir(os.path.join(ROOT, 'public/assets/shortform/sfx')) if f.endswith('.wav'))
    bgm = sorted(f for f in os.listdir(os.path.join(ROOT, 'public/assets/shortform/bgm')) if f.endswith('.mp3'))
    todo = T['해야 할 일']
    td = ''.join(f'<li class="{ {"끝": "done", "하는 중": "doing"}.get(r[1], "")}"><span class="st">{e(r[1])}</span> {e(r[2])}</li>' for r in todo[1:])
    chips = ''.join(f'<button class="snd" data-k="sfx" data-n="{e(n)}">{e(n)}</button>' for n in sfx)
    chips += ''.join(f'<button class="snd" data-k="bgm" data-n="{e(n)}">{e(n)}</button>' for n in bgm)
    secs = [('유형', '편집 유형', table(T['편집 유형'])),
            ('할일', '해야 할 일', f'<ul class="todo">{td}</ul>'),
            ('규칙', '확정 규칙', table(T['확정 규칙'])),
            ('사전', f"편집 기법 사전 ({len(T['편집 기법 사전']) - 1}개)", '<input id="q" placeholder="코드·이름·사례 검색">' + table(T['편집 기법 사전'], 'dict')),
            ('옵션', '옵션 표시', table(T['옵션 표시'])),
            ('소리', '소리 듣기 · 출처', f'<p class="note">눌러서 들어 보기. 외부·생성 소리는 영상에 섞어서만 씁니다(파일 단독 배포 금지).</p><div class="snds">{chips}</div>' + table(T['소리 출처'])),
            ('기록', '변경 기록', table(T['변경 기록']))]
    nav = ''.join(f'<a href="#{k}">{e(k)}</a>' for k, _, _ in secs)
    body = ''.join(f'<section id="{k}"><h2>{e(t)}</h2>{c}</section>' for k, t, c in secs)
    page = f'''<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>숏폼 편집 매뉴얼</title><style>
:root{{--bg:#fff;--fg:#1a1a1a;--mute:#6b6b6b;--line:#e6e6e6;--soft:#f6f6f4;--acc:#306BD9}}
@media (prefers-color-scheme:dark){{:root:not([data-theme=light]){{--bg:#141414;--fg:#ececec;--mute:#9a9a9a;--line:#2c2c2c;--soft:#1d1d1d;--acc:#6f9cf0}}}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--fg);font:15px/1.6 -apple-system,"Pretendard","Apple SD Gothic Neo","Noto Sans KR",sans-serif}}
header{{padding:28px 16px 12px;max-width:1200px;margin:auto}}h1{{font-size:26px;margin:0 0 4px}}.meta{{color:var(--mute);font-size:13px}}
nav{{position:sticky;top:0;background:var(--bg);border-bottom:1px solid var(--line);z-index:2}}nav div{{max-width:1200px;margin:auto;padding:8px 16px;display:flex;gap:6px;overflow-x:auto}}
nav a{{white-space:nowrap;padding:6px 12px;border-radius:16px;background:var(--soft);color:var(--fg);text-decoration:none;font-size:14px}}
main{{max-width:1200px;margin:auto;padding:0 16px 60px}}section{{padding-top:28px}}h2{{font-size:19px;margin:0 0 12px}}
.tw{{overflow-x:auto;border:1px solid var(--line);border-radius:8px}}table{{border-collapse:collapse;width:100%;font-size:13px}}
th,td{{padding:7px 9px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}}th{{background:var(--soft);position:sticky;top:0;white-space:nowrap}}
table.dict td:nth-child(10){{min-width:260px}}.todo{{list-style:none;padding:0;margin:0}}.todo li{{padding:7px 0;border-bottom:1px solid var(--line)}}
.st{{display:inline-block;min-width:56px;font-size:12px;color:var(--mute)}}.todo li.done{{color:var(--mute)}}.todo li.done .st{{color:#2e8b57}}.todo li.doing .st{{color:var(--acc);font-weight:600}}
#q{{width:100%;max-width:360px;padding:9px 12px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--fg);margin-bottom:10px;font-size:14px}}
.snds{{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}}.snd{{border:1px solid var(--line);background:var(--bg);color:var(--fg);border-radius:16px;padding:6px 12px;font-size:13px;cursor:pointer}}
.snd.on{{background:var(--acc);color:#fff;border-color:var(--acc)}}.note{{color:var(--mute);font-size:13px;margin:0 0 8px}}
:focus-visible{{outline:2px solid var(--acc);outline-offset:2px}}a{{color:var(--acc)}}
</style></head><body>
<header><h1>숏폼 자동 편집 매뉴얼</h1><div class="meta">버전 v{e(C["version"])} · 갱신 {e(C["updated"])} · 커밋 {e(sha)} · 원본: <a href="https://github.com/bobaekimboae/bobaedream/tree/main/shortform-kit">깃허브 shortform-kit</a> · <a href="https://github.com/bobaekimboae/bobaedream/commits/main/shortform-kit">버전 기록</a></div></header>
<nav><div>{nav}</div></nav><main>{body}</main>
<script>
const A='ass'+'ets';let cur=null,btn=null;
document.querySelectorAll('.snd').forEach(b=>b.onclick=()=>{{if(cur){{cur.pause();btn&&btn.classList.remove('on')}}
if(btn===b){{btn=null;return}}const k=b.dataset.k,n=b.dataset.n;cur=new Audio('../'+A+'/shortform/'+k+'/'+n+(k==='sfx'?'.wav':''));btn=b;b.classList.add('on');cur.play();cur.onended=()=>b.classList.remove('on')}});
const q=document.getElementById('q');q&&q.addEventListener('input',()=>{{const v=q.value.trim().toLowerCase();document.querySelectorAll('table.dict tbody tr').forEach(r=>r.style.display=!v||r.textContent.toLowerCase().includes(v)?'':'none')}});
</script></body></html>'''
    open(OUT, 'w', encoding='utf-8').write(page)
    print(OUT, len(page))


if __name__ == '__main__':
    main()
