// 보배드림 매물 숏폼 네덜란드판을 HyperFrames(HTML → 영상) 구성으로 만드는 생성기 (2026-11-24 비교 시안)
// 입력은 파이썬 렌더러(g350_v8_render.py)와 같은 car.json · edit.json · words.json. 색·자막 높이는 be_locked_rules.json / car.nl 값을 그대로 읽는다.
// 쓰는 법: node build_nl.mjs <car.json> <edit.json> <words.json> <src.mp4> <mix.wav> <out_dir>
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process'; import { fileURLToPath } from 'node:url'
const [carP, editP, wordsP, srcP, mixP, out] = process.argv.slice(2)
const here = path.dirname(fileURLToPath(import.meta.url)); const repo = path.resolve(here, '../../..')
const car = JSON.parse(fs.readFileSync(carP, 'utf8')), edit = JSON.parse(fs.readFileSync(editP, 'utf8')), WS = JSON.parse(fs.readFileSync(wordsP, 'utf8'))
const R = JSON.parse(fs.readFileSync(path.join(repo, 'scripts/shortform/be_locked_rules.json'), 'utf8'))
const YEL = '#F5F200', nl = car.nl || {}, W = 1080, H = 1920, FPS = 30
const VOICE = WS[WS.length - 1][2], TOTAL = +(VOICE + 1.7).toFixed(3)
const ew = WS.findIndex(w => w[0].startsWith(car.end_word || '자세한')); const ENDT = ew >= 0 ? WS[ew][1] - 0.12 : VOICE + 0.15
const C = car.cuts, starts = C.map((c, i) => i ? WS[c.start_word][1] - 0.12 : 0)
const SEG = C.map((c, i) => ({ c, t0: starts[i], t1: i + 1 < C.length ? starts[i + 1] : ENDT }))
fs.mkdirSync(path.join(out, 'assets'), { recursive: true })
// 1) 바탕 영상: 컷마다 원본 구간을 말 길이에 맞춰 늘이거나 줄여 이어 붙임(그래픽 없음). 마지막 컷은 로고가 뜨는 끝까지 이어짐.
const parts = []
SEG.forEach((s, i) => {
  const dur = (i + 1 < SEG.length ? s.t1 : TOTAL) - s.t0, [a, b] = s.c.src, rate = Math.min(2, (b - a) / dur), f = path.join(out, `assets/_c${i}.mp4`)
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-ss', String(a), '-t', String(dur * rate + 0.2), '-i', srcP, '-an', '-vf', `setpts=PTS/${rate.toFixed(5)},fps=${FPS},scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`, '-t', dur.toFixed(4), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '14', '-pix_fmt', 'yuv420p', f])
  parts.push(`file '${path.basename(f)}'`)
})
fs.writeFileSync(path.join(out, 'assets/_list.txt'), parts.join('\n'))
execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(out, 'assets/_list.txt'), '-c', 'copy', path.join(out, 'assets/base.mp4')])
SEG.forEach((_, i) => fs.rmSync(path.join(out, `assets/_c${i}.mp4`))); fs.rmSync(path.join(out, 'assets/_list.txt'))
fs.copyFileSync(mixP, path.join(out, 'assets/mix.wav'))
for (const f of ['Pretendard-Black.otf', 'Pretendard-ExtraBold.otf', 'Pretendard-Bold.otf']) fs.copyFileSync(path.join(repo, 'scripts/shortform/fonts', f), path.join(out, 'assets', f))
fs.copyFileSync(path.join(repo, 'public/assets/shortform/bobae_logo_600.png'), path.join(out, 'assets/logo.png'))
// 2) 화면 요소
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'), n3 = x => +x.toFixed(3)
const els = [], tw = []   // tw = GSAP 줄
const pop = (id, t, d = 0.14) => tw.push(`tl.fromTo("#${id}",{scale:0.6,opacity:0},{scale:1,opacity:1,duration:${d},ease:"back.out(2.2)"},${n3(t)});`)
// 첫 화면: 검정 상자 + 노랑 차명, 아래 한 줄
const t1 = SEG[0].t1
els.push(`<div id="title" class="clip top" style="top:${Math.round(H * (nl.title_y ?? 0.2))}px" data-start="0.08" data-duration="${n3(t1 - 0.08)}"><div class="box" style="font-size:${nl.title_px ?? 92}px;padding:26px 44px;border-radius:24px">${esc(car.title.brand + ' ' + car.title.model)}</div><div id="tsub" class="out sub">${esc(car.title.sub)}</div></div>`)
pop('title', 0.08); tw.push(`tl.fromTo("#tsub",{opacity:0,y:14},{opacity:1,y:0,duration:0.2},0.4);`)
// 컷별: 어둡게 · 칩 · 큰 숫자
const hide = []   // 큰 숫자가 떠 있어 말 자막을 숨기는 구간
SEG.forEach((s, i) => {
  const c = s.c, k = c.key
  if (c.dim) els.push(`<div class="clip dim" style="opacity:${(c.dim / 255).toFixed(3)}" data-start="${n3(s.t0)}" data-duration="${n3(s.t1 - s.t0)}"></div>`)
  if (c.chip) { const tc = Math.max(s.t0, WS[c.chip_word][1] - 0.06); els.push(`<div id="chip_${k}" class="clip top" style="top:${nl.chip_y ?? 300}px" data-start="${n3(tc)}" data-duration="${n3(s.t1 - tc)}"><div class="box" style="font-size:${nl.chip_px ?? 64}px">${esc(c.chip)}</div></div>`); pop(`chip_${k}`, tc) }
  ;(c.bigs || []).forEach(([txt, label, wi], j) => {
    const tb = Math.max(s.t0, WS[wi][1] - 0.22), m = txt.match(/^([\d.,+~]+)\s*(.*)$/)
    els.push(`<div id="big_${k}_${j}" class="clip top" style="top:${Math.round(H * (nl.big_y ?? 0.27))}px" data-start="${n3(tb)}" data-duration="${n3(s.t1 - tb)}"><div class="big">${m && m[2] ? `${esc(m[1])}<span class="unit">${esc(m[2])}</span>` : esc(txt)}</div>${label ? `<div class="out lab">${esc(label)}</div>` : ''}</div>`)
    pop(`big_${k}_${j}`, tb, 0.18); hide.push([tb, s.t1])
  })
})
// 말 자막: 덩어리마다 한 요소, 말하는 낱말만 노랑
edit.chunks.forEach(([a, b], ci) => {
  let t0 = WS[a][1] - 0.04, tE = (ci + 1 < edit.chunks.length ? WS[edit.chunks[ci + 1][0]][1] - 0.04 : VOICE + 0.25)
  const cut = SEG.findLast(s => s.t0 <= WS[a][1] + 0.01); if (cut && ci && Math.abs(cut.t0 - t0) < 0.3) t0 = Math.max(t0, cut.t0)   // 컷이 바뀐 직후에는 새 컷에서 시작
  for (const [h0, h1] of hide) { if (t0 >= h0 - 0.01 && t0 < h1) t0 = h1; if (tE > h0 && t0 < h0) tE = h0 }
  if (tE - t0 < 0.12) return
  const spans = []; for (let i = a; i <= b; i++) spans.push(`<span id="w${i}">${esc(WS[i][0].replace(/[,.]+$/, ''))}</span>`)   // 자막에는 쉼표·마침표를 쓰지 않음(파이썬 렌더러와 같게)
  els.push(`<div id="cap${ci}" class="clip cap" style="top:${nl.cap_y ?? 1190}px" data-start="${n3(t0)}" data-duration="${n3(tE - t0)}"><div class="out capt">${spans.join(' ')}</div></div>`)
  pop(`cap${ci}`, t0, 0.12)
  for (let i = a; i <= b; i++) { const s = Math.max(t0, WS[i][1] - 0.02), e = (i < b ? WS[i + 1][1] - 0.02 : tE); if (s < tE) { tw.push(`tl.set("#w${i}",{color:"${YEL}"},${n3(s)});`); if (i < b && e < tE) tw.push(`tl.set("#w${i}",{color:"#fff"},${n3(e)});`) } }
})
// 끝: 어두워지며 로고가 커짐
els.push(`<div id="enddim" class="clip dim" style="opacity:0" data-start="${n3(ENDT)}" data-duration="${n3(TOTAL - ENDT)}"></div><img id="logo" class="clip" src="assets/logo.png" style="position:absolute;left:${(W - 520) / 2}px;top:560px;width:520px" data-start="${n3(ENDT)}" data-duration="${n3(TOTAL - ENDT)}">`)
tw.push(`tl.fromTo("#enddim",{opacity:0},{opacity:0.55,duration:0.4},${n3(ENDT)});`, `tl.fromTo("#logo",{scale:0.5,opacity:0},{scale:1,opacity:1,duration:0.55,ease:"back.out(1.6)"},${n3(ENDT + 0.05)});`)
const html = `<!doctype html>
<html lang="ko" data-resolution="portrait"><head><meta charset="UTF-8"><meta name="viewport" content="width=${W}, height=${H}">
<script src="assets/gsap.min.js"></script>
<style>
@font-face{font-family:"PretendardBBM";src:url("assets/Pretendard-Black.otf");font-weight:900}
@font-face{font-family:"PretendardBBM";src:url("assets/Pretendard-ExtraBold.otf");font-weight:800}
@font-face{font-family:"PretendardBBM";src:url("assets/Pretendard-Bold.otf");font-weight:700}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:#000;font-family:"PretendardBBM",sans-serif}
#root{position:relative;width:${W}px;height:${H}px;overflow:hidden}
#base{position:absolute;inset:0;width:${W}px;height:${H}px;object-fit:cover}
.dim{position:absolute;inset:0;background:#000}
.top{position:absolute;left:0;width:${W}px;display:flex;flex-direction:column;align-items:center;transform-origin:50% 50%}
.box{display:inline-block;background:#000;color:${YEL};font-weight:900;line-height:1.15;padding:18px 34px;border-radius:18px;white-space:nowrap;letter-spacing:-0.01em}
.out{color:#fff;font-weight:900;-webkit-text-stroke:14px #000;paint-order:stroke fill;letter-spacing:-0.01em}
.sub{font-size:52px;font-weight:800;-webkit-text-stroke:10px #000;margin-top:18px}
.lab{font-size:58px;-webkit-text-stroke:11px #000;margin-top:6px}
.big{font-size:190px;font-weight:900;color:${YEL};-webkit-text-stroke:20px #000;paint-order:stroke fill;line-height:1.05;letter-spacing:-0.02em;white-space:nowrap}
.big .unit{font-size:118px;margin-left:8px}
.cap{position:absolute;left:100px;width:${W - 200}px;display:flex;justify-content:center;transform:translateY(-50%)}
.capt{font-size:${R.caption?.font_px ?? 60}px;line-height:1.18;text-align:center;word-break:keep-all}
</style></head>
<body><div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="${W}" data-height="${H}" data-fps="${FPS}">
<video id="base" class="clip" src="assets/base.mp4" muted playsinline data-start="0" data-duration="${TOTAL}" data-track-index="0"></video>
<audio id="mix" src="assets/mix.wav" data-start="0" data-duration="${TOTAL}" data-volume="1" data-track-index="1"></audio>
${els.join('\n')}
</div>
<script>
const tl = gsap.timeline({ paused: true });
${tw.join('\n')}
tl.to({}, { duration: ${TOTAL} }, 0);
window.__timelines = window.__timelines || {}; window.__timelines["main"] = tl; tl.seek(0);
</script></body></html>`
fs.writeFileSync(path.join(out, 'index.html'), html)
console.log(JSON.stringify({ total: TOTAL, endt: n3(ENDT), cuts: SEG.map(s => n3(s.t0)), elements: els.length, tweens: tw.length }))
