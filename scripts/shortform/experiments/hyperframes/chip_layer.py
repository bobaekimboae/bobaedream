"""plan.json의 칩 시각 → HyperFrames 투명 칩 층(index.html)"""
import json, sys, html
plan = json.load(open(sys.argv[1])); out = sys.argv[2]
total = plan['total']
clips, tl = [], []
for i, (t, a, b) in enumerate(plan['chips']):
    clips.append(f'<div id="c{i}" class="clip chip" data-start="{a:.3f}" data-duration="{b-a:.3f}" data-track-index="{i%3}"><span>{html.escape(t)}</span></div>')
    tl.append(f'tl.fromTo("#c{i}",{{opacity:0,scale:.86}},{{opacity:1,scale:1,duration:.16,ease:"back.out(2)"}},{a:.3f});')
    tl.append(f'tl.to("#c{i}",{{opacity:0,duration:.12}},{b-0.12:.3f});')
doc = f'''<!doctype html><html lang="ko" data-resolution="portrait"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=1080, height=1920"/>
<script src="gsap.min.js"></script>
<style>*{{margin:0;padding:0;box-sizing:border-box}}html,body{{width:1080px;height:1920px;overflow:hidden;background:transparent}}
#root{{position:relative;width:100%;height:100%;font-family:"Pretendard","Noto Sans KR",sans-serif}}
.chip{{position:absolute;left:50%;top:400px;transform:translateX(-50%);height:140px;display:flex;align-items:center;justify-content:center;padding:0 46px;opacity:0}}
.chip::before{{content:"";position:absolute;inset:0;background:#F5F200;-webkit-mask:url(fill.svg) center/100% 100% no-repeat;mask:url(fill.svg) center/100% 100% no-repeat}}
.chip span{{position:relative;color:#141414;font-size:70px;font-weight:800;white-space:nowrap;transform:translateY(-4px)}}</style></head>
<body><div id="root" data-composition-id="main" data-start="0" data-duration="{total:.3f}" data-width="1080" data-height="1920">
{chr(10).join(clips)}
</div><script>const tl=gsap.timeline({{paused:true}});
{chr(10).join(tl)}
window.__timelines["main"]=tl;tl.seek(0);</script></body></html>'''
open(out, 'w').write(doc)
print(len(plan['chips']), 'chips', total)
