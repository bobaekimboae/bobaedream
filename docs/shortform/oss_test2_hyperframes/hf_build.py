"""hf_layers.json → HyperFrames 프로젝트(index.html). 바탕 영상 위에 칩·첫 화면 글자·말 자막·끝 로고를 HTML/SVG로 얹는다.

사용: python3 hf_build.py <g350 폴더> <프로젝트 폴더> [gsap.min.js 경로]
- 칠 판은 노션 원본 SVG를 그대로 mask로 씀(늘이기 없음, 같은 배율). 글자는 같은 Pretendard 파일.
- 등장(pop)은 렌더러와 같은 식: 0.2초 동안 크기 0.6→1(+살짝 튐), 불투명 0→1(0.1초).
- 자리·등장 시각은 렌더러가 프레임마다 남긴 값을 그대로 씀(부위를 따라 움직이는 칩 포함).
"""
import json, os, shutil, sys, html
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
G, P = sys.argv[1], sys.argv[2]
GSAP = sys.argv[3] if len(sys.argv) > 3 else None
D = json.load(open(os.path.join(G, 'hf_layers.json')))
os.makedirs(P + '/a', exist_ok=True)
for n in ('ExtraBold', 'Black'):
    shutil.copy(f'{REPO}/scripts/shortform/fonts/Pretendard-{n}.otf', f'{P}/a/{n}.otf')
shutil.copy(f'{REPO}/public/assets/shortform/bobae_logo_600.png', f'{P}/a/logo.png')
if GSAP: shutil.copy(GSAP, f'{P}/a/gsap.min.js')
base = os.path.join(G, D['base'])
if os.path.abspath(base) != os.path.abspath(f'{P}/a/base.mp4'):
    if os.path.lexists(f'{P}/a/base.mp4'): os.remove(f'{P}/a/base.mp4')
    os.link(base, f'{P}/a/base.mp4') if os.stat(base).st_dev == os.stat(P).st_dev else shutil.copy(base, f'{P}/a/base.mp4')
for k, g in D['geo'].items():
    if g['kind'] == 'chip': shutil.copy(f"{REPO}/public/assets/shortform/brush-fill/as24-theme/{g['svg']}.svg", f"{P}/a/{g['svg']}.svg")

YEL, INK = D['yellow'], D['ink']
esc = lambda s: html.escape(str(s), quote=True)


def shadow_filter(fid, blur):
    return f'<filter id="{fid}" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="{blur}"/></filter>'


def svg_geo(i, g):
    w, h = g['w'], g['h']
    if g['kind'] == 'chip':
        cx, cy, cw, ch = g['clip']
        body = (f'<defs><mask id="m{i}" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="{w}" height="{h}">'
                f'<image href="a/{g["svg"]}.svg" x="{g["svg_x"]}" y="{g["svg_y"]}" width="{g["svg_w"]:.2f}" height="{g["svg_h"]:.2f}" preserveAspectRatio="none"/></mask>'
                f'<clipPath id="c{i}"><rect x="{cx}" y="{cy}" width="{cw}" height="{ch}"/></clipPath></defs>'
                f'<rect width="{w}" height="{h}" fill="{YEL}" mask="url(#m{i})" clip-path="url(#c{i})"/>'
                f'<text x="{g["tx"]}" y="{g["ty"]}" font-family="PXB" font-size="{g["px"]}" fill="{INK}">{esc(g["text"])}</text>')
    else:   # 흰 글자 + 검정 그림자(테 4, 흐림 5, 오른쪽 3·아래 5)
        body = (f'<defs>{shadow_filter("s" + str(i), 5)}</defs>'
                f'<text x="{g["tx"] + 3}" y="{g["ty"] + 5}" font-family="PBK" font-size="{g["px"]}" fill="rgba(0,0,0,.9)" stroke="rgba(0,0,0,.9)" stroke-width="8" stroke-linejoin="round" filter="url(#s{i})">{esc(g["text"])}</text>'
                f'<text x="{g["tx"]}" y="{g["ty"]}" font-family="PBK" font-size="{g["px"]}" fill="#fff">{esc(g["text"])}</text>')
    return f'<svg class="el" id="g{i}" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{body}</svg>'


def svg_chunk(q, c):
    w, h = c['w'], c['h']; parts = [f'<defs>{shadow_filter("cs" + str(q), 6)}</defs>']
    for ln in c['lines']:
        txt = ' '.join(x['w'] for x in ln['words'])
        parts.append(f'<text x="{ln["mid_x"] + 3}" y="{ln["base"] + 5}" text-anchor="middle" font-family="PBK" font-size="{D["cap_px"]}" fill="rgba(0,0,0,.86)" stroke="rgba(0,0,0,.86)" stroke-width="8" stroke-linejoin="round" filter="url(#cs{q})">{esc(txt)}</text>')
    for ln in c['lines']:
        for x in ln['words']:
            parts.append(f'<text class="w" data-i="{x["i"]}" x="{x["x"]}" y="{ln["base"]}" font-family="PBK" font-size="{D["cap_px"]}" fill="#fff">{esc(x["w"])}</text>')
    return f'<svg class="cap" id="k{q}" width="{w}" height="{h}" viewBox="0 0 {w} {h}" style="left:{(D["W"] - w) // 2}px;top:{D["capy"] - h // 2}px">{"".join(parts)}</svg>'


keys = list(D['geo'])
els = [svg_geo(i, D['geo'][k]) for i, k in enumerate(keys)]
caps = [svg_chunk(q, c) for q, c in enumerate(D['chunks'])]
idx = {k: i for i, k in enumerate(keys)}
fr = {int(f): [[idx[f'{n}:{lab}'], x, y, round(t, 4)] for n, lab, x, y, t in items] for f, items in D['frames'].items()}
data = {'fps': D['fps'], 'total': D['total'], 'voice': D['voice'], 'endt': D['endt'],
        'sizes': [[D['geo'][k]['w'], D['geo'][k]['h']] for k in keys], 'fr': fr, 'subOn': D['sub_on'],
        'chunks': [{'a': c['a'], 'b': c['b'], 's': c['starts']} for c in D['chunks']], 'logo': D['logo'], 'W': D['W'], 'yel': YEL}
lg = D['logo']
doc = f'''<!doctype html><html lang="ko"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width={D["W"]}, height={D["H"]}"/>
<script src="a/gsap.min.js"></script>
<style>
@font-face{{font-family:PXB;src:url(a/ExtraBold.otf)}}@font-face{{font-family:PBK;src:url(a/Black.otf)}}
*{{margin:0;padding:0;box-sizing:border-box}}html,body{{width:{D["W"]}px;height:{D["H"]}px;overflow:hidden;background:#000}}
#root{{position:relative;width:100%;height:100%}}
#base{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}}
.el,.cap{{position:absolute;left:0;top:0;opacity:0;transform-origin:50% 50%;overflow:visible}}
#dark{{position:absolute;inset:0;background:#000;opacity:0}}
#logo{{position:absolute;left:{(D["W"] - lg["w"]) // 2}px;top:{lg["y"]}px;width:{lg["w"]}px;height:{lg["h"]}px;opacity:0;transform-origin:50% 50%}}
#caps{{position:absolute;inset:0}}
</style></head><body>
<div id="root" data-composition-id="main" data-start="0" data-duration="{D["total"]:.3f}" data-width="{D["W"]}" data-height="{D["H"]}" data-fps="{D["fps"]}">
<video id="base" class="clip" src="a/base.mp4" data-start="0" data-duration="{D["total"]:.3f}" muted playsinline></video>
<div id="els">{"".join(els)}</div>
<div id="dark"></div><img id="logo" src="a/logo.png" alt=""/>
<div id="caps">{"".join(caps)}</div>
</div>
<script>
const D={json.dumps(data, ensure_ascii=False, separators=(",", ":"))};
const E=[...document.querySelectorAll('#els .el')], K=[...document.querySelectorAll('#caps .cap')];
const KW=K.map(k=>[...k.querySelectorAll('.w')]);
const dark=document.getElementById('dark'), logo=document.getElementById('logo');
const ease=x=>{{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)}};
let lastF=-1, lastK=-1, lastA=-1;
function draw(t){{
  const f=Math.round(t*D.fps); if(f===lastF) return; lastF=f;
  const on=new Map();
  for(const [i,x,y,t0] of (D.fr[f]||[])){{
    const k=Math.min(1,(t-t0)/0.2), s=0.6+0.4*ease(k)+0.08*Math.sin(Math.min(1,k)*Math.PI), a=Math.min(1,k*2);
    on.set(i,[x,y,s,a]);
  }}
  E.forEach((el,i)=>{{const v=on.get(i); if(!v){{el.style.opacity=0;return}}
    el.style.opacity=v[3]; el.style.transform=`translate(${{v[0]}}px,${{v[1]}}px) scale(${{v[2]}})`;}});
  // 말 자막
  let q=-1, act=-1;
  if(D.subOn[f]){{ for(let j=0;j<D.chunks.length;j++){{const c=D.chunks[j]; if(c.a<=t&&t<c.b){{q=j;break}}}} }}
  if(q>=0){{ const s=D.chunks[q].s; act=0; for(let n=0;n<s.length;n++) if(s[n]<=t+0.02) act=n; }}
  if(q!==lastK){{ if(lastK>=0) K[lastK].style.opacity=0; if(q>=0) K[q].style.opacity=1; lastK=q; lastA=-1; }}
  if(q>=0&&act!==lastA){{ KW[q].forEach(w=>w.setAttribute('fill', +w.dataset.i===act?D.yel:'#fff')); lastA=act; }}
  // 끝 화면: 어둡게 0.3초 + 로고 0.7→1(0.6초)
  const te=t-D.endt;
  if(te>=0){{ dark.style.opacity=185/255*Math.min(1,te/0.3); logo.style.opacity=1; logo.style.transform=`scale(${{0.7+0.3*ease(te/0.6)}})`; }}
  else {{ dark.style.opacity=0; logo.style.opacity=0; }}
}}
const tl=gsap.timeline({{paused:true}});
const clock={{t:0}};
tl.to(clock,{{t:D.total,duration:D.total,ease:"none",onUpdate:()=>draw(clock.t)}},0);
window.__timelines=window.__timelines||{{}}; window.__timelines["main"]=tl; tl.seek(0); draw(0);
</script></body></html>'''
open(f'{P}/index.html', 'w').write(doc)
print(f'{P}/index.html', len(els), '모양', len(caps), '자막', len(fr), '프레임')
