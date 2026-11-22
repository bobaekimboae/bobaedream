"""plan.json → 하이퍼프레임 전체 장면(사진 켄번스 · 컷 넘김 · 칩 · 컷 자막 한 줄 · 푸터 · 끝 로고). 비교 시험용."""
import json, sys, html
plan = json.load(open(sys.argv[1])); out = sys.argv[2]; foot = sys.argv[3]
T = plan['total']; cuts = plan['cuts']
interior = {11, 7}; cards = {40, 41, 42, 43}
el, tl = [], []
for i, c in enumerate(cuts):
    a, b = c['start'], (cuts[i + 1]['start'] if i + 1 < len(cuts) else c['end'])
    d = b - a + 0.25
    n = c['photo']; src = f"img/p{n:02d}.jpg"
    if n in cards:
        inner = f'<img class="bg" src="{src}"/><img class="card" src="{src}"/>'
    elif n in interior:
        inner = f'<img class="full" src="{src}"/>'
    else:
        inner = f'<img class="bg" src="{src}"/><img class="fit" src="{src}"/>'
    el.append(f'<div id="s{i}" class="clip scene" data-start="{a:.3f}" data-duration="{d:.3f}" data-track-index="{i % 2}">{inner}'
              f'<div class="cap">{html.escape(c["line"])}</div></div>')
    k1, k2 = (1.0, 1.1) if i % 2 == 0 else (1.1, 1.0)
    tl.append(f'tl.fromTo("#s{i} .fit, #s{i} .full",{{scale:{k1}}},{{scale:{k2},duration:{d:.3f},ease:"sine.inOut"}},{a:.3f});')
    t = c['trans']
    if t in ('whip_l',):
        tl.append(f'tl.fromTo("#s{i}",{{xPercent:100}},{{xPercent:0,duration:.25,ease:"power3.out"}},{a:.3f});')
    elif t in ('flash', 'zoom'):
        tl.append(f'tl.fromTo("#s{i}",{{opacity:0,scale:1.15}},{{opacity:1,scale:1,duration:.3,ease:"power2.out"}},{a:.3f});')
    else:
        tl.append(f'tl.fromTo("#s{i}",{{opacity:0}},{{opacity:1,duration:.25}},{a:.3f});')
for i, (t, a, b) in enumerate(plan['chips']):
    el.append(f'<div id="c{i}" class="clip chip" data-start="{a:.3f}" data-duration="{b-a:.3f}" data-track-index="{2 + i % 2}"><span>{html.escape(t)}</span></div>')
    tl.append(f'tl.fromTo("#c{i}",{{opacity:0,scale:.86}},{{opacity:1,scale:1,duration:.16,ease:"back.out(2)"}},{a:.3f});')
end0 = cuts[-1]['end']
el.append(f'<div id="end" class="clip end" data-start="{end0:.3f}" data-duration="{T-end0:.3f}" data-track-index="4"><img src="img/logo.png"/></div>')
tl.append(f'tl.fromTo("#end img",{{scale:.8,opacity:0}},{{scale:1,opacity:1,duration:.45,ease:"power2.out"}},{end0:.3f});')
el.append(f'<div id="foot" class="clip foot" data-start="0" data-duration="{end0:.3f}" data-track-index="5">{html.escape(foot)}</div>')
doc = f'''<!doctype html><html lang="ko" data-resolution="portrait"><head><meta charset="UTF-8"/><meta name="viewport" content="width=1080, height=1920"/>
<script src="gsap.min.js"></script><style>*{{margin:0;padding:0;box-sizing:border-box}}html,body{{width:1080px;height:1920px;overflow:hidden;background:#000}}
#root{{position:relative;width:100%;height:100%;font-family:"Noto Sans KR",sans-serif}}
.scene{{position:absolute;inset:0;overflow:hidden;background:#111}}
.scene .bg{{position:absolute;inset:-40px;width:calc(100% + 80px);height:calc(100% + 80px);object-fit:cover;filter:blur(36px) brightness(.55)}}
.scene .fit{{position:absolute;left:0;top:560px;width:1080px;height:auto}}
.scene .full{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}}
.scene .card{{position:absolute;left:60px;top:260px;width:960px;height:auto;border-radius:24px}}
.cap{{position:absolute;left:60px;right:60px;top:1330px;text-align:center;color:#fff;font-size:56px;font-weight:800;text-shadow:0 3px 10px rgba(0,0,0,.8)}}
.chip{{position:absolute;left:50%;top:400px;transform:translateX(-50%);height:140px;display:flex;align-items:center;justify-content:center;padding:0 46px;opacity:0}}
.chip::before{{content:"";position:absolute;inset:0;background:#F5F200;-webkit-mask:url(fill.svg) center/100% 100% no-repeat;mask:url(fill.svg) center/100% 100% no-repeat}}
.chip span{{position:relative;color:#141414;font-size:70px;font-weight:800;white-space:nowrap}}
.foot{{position:absolute;left:0;right:0;bottom:0;height:120px;background:rgba(0,0,0,.59);color:#fff;font-size:40px;font-weight:700;display:flex;align-items:center;justify-content:center}}
.end{{position:absolute;inset:0;background:#080a0e;display:flex;align-items:center;justify-content:center}}.end img{{width:600px}}</style></head>
<body><div id="root" data-composition-id="main" data-start="0" data-duration="{T:.3f}" data-width="1080" data-height="1920">
{chr(10).join(el)}
</div><script>const tl=gsap.timeline({{paused:true}});
{chr(10).join(tl)}
window.__timelines["main"]=tl;tl.seek(0);</script></body></html>'''
open(out, 'w').write(doc)
print(len(cuts), 'cuts', len(plan['chips']), 'chips', T)
