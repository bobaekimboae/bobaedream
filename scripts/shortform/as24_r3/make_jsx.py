"""3회차 manifest(컷·자막·칩·소리)를 애프터이펙트 스크립트(.jsx)로 바꾼다. 애프터이펙트가 컴포지션을 만들고 H.264로 렌더한다."""
import json, math, sys
R3 = "/tmp/claude-0/-home-claude/9795e62c-2b83-5ed5-9b9a-75716025bfc2/scratchpad/sk1113/r3/"
WIN = "C:/Users/Thinkbook/Documents/autostudio_analysis/r3/r3pack/"
OUT = "C:/Users/Thinkbook/Documents/autostudio_analysis/ae_out/"
jobs = [("03", "AS24BE3_01_Sealion7_AE"), ("01", "AS24NL3_01_BMW630GT_AE")]
def db(v): return 20 * math.log10(max(v, 1e-4))
js = ['''var LOG = new File("%sae_log.txt"); LOG.encoding="UTF-8"; LOG.open("w");
function log(s){ LOG.writeln((new Date()).toTimeString().substr(0,8) + " " + s); }
app.beginSuppressDialogs(); app.newProject();
var cache = {};
function imp(p){ if (cache[p]) return cache[p]; var it = app.project.importFile(new ImportOptions(new File(p))); cache[p] = it; return it; }
function H264(om){ var t = om.templates; for (var i=0;i<t.length;i++){ if (t[i].indexOf("H.264")>=0 && t[i].indexOf("40")>=0) return t[i]; } for (var i=0;i<t.length;i++){ if (t[i].indexOf("H.264")>=0) return t[i]; } return null; }
function setLevel(L, d){ var p = L.property("ADBE Audio Group").property("ADBE Audio Levels"); p.setValue([d, d]); }
''' % OUT]
for n, name in jobs:
    m = json.load(open(R3 + f"out{n}/manifest.json"))
    A = WIN + f"a{n}/"; END = m["end"]; be = m.get("edit") == "be"
    js.append(f'log("start {name}");')
    js.append(f'var c = app.project.items.addComp("{name}", 1080, 1920, 1, {END:.3f}, 30);')
    js.append(f'var src = imp("{WIN}src/{n}_shortform.mp4");')
    pos = 0.0; cuts = m["cuts"]
    for k, (a, b) in enumerate(cuts):
        d = b - a; last = k == len(cuts) - 1
        out = END if last else pos + d
        js.append(f'var L = c.layers.add(src); L.audioEnabled = false; L.startTime = {pos - a:.4f}; L.inPoint = {pos:.4f}; L.outPoint = {out:.4f}; L.moveToEnd();')
        pos += d
    # 자막·칩 PNG (전체 화면 크기 PNG). 칩: 0.2초 페이드 + 톡 커지기(NL) / 살짝 커지기(BE)
    items = sorted([i for i in m["items"] if i["t1"] - i["t0"] >= 0.05], key=lambda i: (0 if i["kind"] == "chip" else 1, i["t0"]))
    for it in items:
        a, b = it["t0"], it["t1"]
        js.append(f'var L = c.layers.add(imp("{A}{it["file"]}")); L.startTime = 0; L.inPoint = {a:.4f}; L.outPoint = {b:.4f};')
        if it["kind"] == "chip":
            cy = it.get("cy", 960); fd = 0.2
            js.append(f'L.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([540,{cy}]); L.property("ADBE Transform Group").property("ADBE Position").setValue([540,{cy}]);')
            js.append(f'var op = L.property("ADBE Transform Group").property("ADBE Opacity"); op.setValueAtTime({a:.4f},0); op.setValueAtTime({a+fd:.4f},100); op.setValueAtTime({max(a+fd, b-fd):.4f},100); op.setValueAtTime({b:.4f},0);')
            s0, s1 = (85, 106) if not be else (96, 101)
            js.append(f'var sc = L.property("ADBE Transform Group").property("ADBE Scale"); sc.setValueAtTime({a:.4f},[{s0},{s0}]); sc.setValueAtTime({a+0.12:.4f},[{s1},{s1}]); sc.setValueAtTime({a+0.22:.4f},[100,100]);')
            js.append('for (var q=1;q<=sc.numKeys;q++){ sc.setInterpolationTypeAtKey(q, KeyframeInterpolationType.BEZIER); }')
        js.append('L.moveToBeginning();')
    # 소리
    js.append(f'var V = c.layers.add(imp("{A}{m["voice"]}")); V.startTime = 0;')
    if m.get("bgm"):
        bv = m.get("bgm_vol", 0.3) * 0.5
        js.append(f'var B = c.layers.add(imp("{A}{m["bgm"]}")); B.startTime = 0; B.outPoint = {END:.3f}; setLevel(B, {db(bv):.2f});')
        js.append(f'var bl = B.property("ADBE Audio Group").property("ADBE Audio Levels"); bl.setValueAtTime({END-1.2:.3f},[{db(bv):.2f},{db(bv):.2f}]); bl.setValueAtTime({END:.3f},[-48,-48]);')
    for q in m.get("sfx", []):
        js.append(f'var X = c.layers.add(imp("{A}{q["file"]}")); X.startTime = {q["t"]:.3f}; setLevel(X, {db(q.get("vol", 0.5)):.2f});')
    js.append(f'var rq = app.project.renderQueue.items.add(c); var om = rq.outputModule(1); var tp = H264(om); if (tp) om.applyTemplate(tp); om.file = new File("{OUT}{name}.mp4"); log("queued {name} template=" + tp);')
js.append(f'app.project.save(new File("{OUT}AS24_r3_AE_samples.aep")); log("render start"); app.project.renderQueue.render(); log("render done"); app.project.save(); app.endSuppressDialogs(false); LOG.close();')
open("ae_r3.jsx", "w", encoding="utf-8").write("\n".join(js))
print(len("\n".join(js).splitlines()), "lines")
