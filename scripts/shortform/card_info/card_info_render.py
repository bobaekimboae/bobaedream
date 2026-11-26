#!/usr/bin/env python3
"""숏폼 「카드 정보」 독립 컷 렌더러.
쓰는 법: python3 card_info_render.py 입력.json 출력.mp4
화면 값은 card_info_rules.json, 자막 값은 be_locked_rules.json 기준. 음성(TTS)은 쓰지 않는다."""
import json, sys, subprocess, wave, os
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
R = json.load(open(HERE / "card_info_rules.json"))
FONT = ROOT / "scripts/shortform/fonts"
SFX = ROOT / "public/assets/shortform/sfx"
BGM = ROOT / "public/assets/shortform/bgm"
LOGO = ROOT / "public/assets/shortform/bobae_logo_600.png"
W, H, FPS = R["canvas"]["w"], R["canvas"]["h"], R["canvas"]["fps"]
C, T = R["color"], R["time"]
BANNED = ["무사고", "A등급", "완전무사고", "신차급"]

def f(weight, px):
    return ImageFont.truetype(str(FONT / f"Pretendard-{weight}.otf"), px)

_ic = {}
def icon(path, px, color):
    """노션 AS24 원본 SVG를 고치지 않고 그려서 색만 입힌다."""
    k = (path, px, color)
    if k not in _ic:
        png = subprocess.run(["rsvg-convert", "-w", str(px * 2), "-h", str(px * 2), "-a", str(ROOT / path)], capture_output=True).stdout
        import io
        a = Image.open(io.BytesIO(png)).convert("RGBA").resize((px, px), Image.LANCZOS) if png else Image.new("RGBA", (px, px))
        box = Image.new("RGBA", (px, px), color); box.putalpha(a.getchannel("A")); _ic[k] = box
    return _ic[k]

def ease(x):
    x = max(0.0, min(1.0, x)); return 1 - (1 - x) ** 3

def background():
    top = np.array(Image.new("RGB", (1, 1), C["bg_top"]).getpixel((0, 0)), float)
    bot = np.array(Image.new("RGB", (1, 1), C["bg_bottom"]).getpixel((0, 0)), float)
    g = np.linspace(0, 1, H)[:, None, None]
    arr = (top * (1 - g) + bot * g).repeat(W, axis=1).astype("uint8")
    return Image.fromarray(arr, "RGB")

def validate(data):
    txt = json.dumps(data["cards"], ensure_ascii=False)
    bad = [b for b in BANNED if b in txt]
    if bad: sys.exit(f"원장에 없는 판정 낱말: {bad}")
    import re
    if re.search(r"\d{2,3}[가-힣]\d{4}", txt): sys.exit("차량번호로 보이는 글자가 있습니다")
    if re.search(r"01[016789][- ]?\d{3,4}[- ]?\d{4}", txt): sys.exit("전화번호로 보이는 글자가 있습니다")

def sentences(words_path):
    """받아쓰기 낱말 시각 → 문장별 (시작, 끝) 초."""
    ws = json.load(open(ROOT / words_path)); out = []; cur = None
    for w in ws:
        if cur is None: cur = [max(0.0, w["s"] - 0.03), w["e"]]
        cur[1] = w["e"]
        if w["w"].endswith((".", "?", "!")): out.append(cur); cur = None
    if cur: out.append(cur)
    for i, x in enumerate(out):
        x[1] = min(x[1] + 0.15, out[i + 1][0]) if i + 1 < len(out) else x[1] + 0.15
    return out

def vsegs(card):
    return card.get("v") if card["layout"] == "chips" else [it.get("v") for it in card["items"]]

def steps_of(card):
    if card["layout"] == "chips":
        n = R["chip"]["per_step"]; ch = card["chips"]
        return [(ch[i:i + n], card["captions"][i // n] if i // n < len(card["captions"]) else "") for i in range(0, len(ch), n)]
    return [(it, it.get("caption", "")) for it in card["items"]]

def card_height(card):
    k = R["card"]; h = k["pad_y"] * 2 + R["title"]["font_px"] + R["title"]["gap_below"]
    if card["layout"] == "big": h += R["big"]["value_px"] + 34
    if card["layout"] == "chips":
        rows = -(-len(card["chips"]) // R["chip"]["per_step"]); h += rows * (R["chip"]["h"] + R["chip"]["gap"])
    elif card["layout"] == "timeline": h += len(card["items"]) * R["timeline"]["h"]
    else: h += len(card["items"]) * R["row"]["h"]
    return h + 20 + R["source"]["font_px"] + 8

def tone(t):
    return {"ok": C["ok"], "warn": C["warn"], "muted": C["muted"]}.get(t, C["ink"])

def draw_card(card, idx, total, revealed, part):
    """revealed: 다 보인 단계 수, part: 지금 뜨는 단계의 진행(0~1). RGBA 반환."""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    k = R["card"]; ch = card_height(card); x0, y0 = k["x"], k["y"]
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([x0, y0 + 18, x0 + k["w"], y0 + ch + 18], k["radius"], fill=(0, 0, 0, k["shadow_alpha"]))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(28)))
    d.rounded_rectangle([x0, y0, x0 + k["w"], y0 + ch], k["radius"], fill=C["card"])
    # 꼬리표
    tg = R["tag"]; tf = f("Bold", tg["font_px"]); tw = d.textlength(card["type"], font=tf) + tg["pad_x"] * 2
    d.rounded_rectangle([x0, tg["y"], x0 + tw, tg["y"] + tg["h"]], tg["radius"], fill=C["tag_bg"])
    d.text((x0 + tw / 2, tg["y"] + tg["h"] / 2), card["type"], font=tf, fill=C["tag_ink"], anchor="mm")
    cf = f("Medium", 32); d.text((x0 + k["w"], tg["y"] + tg["h"] / 2), f"{idx + 1} / {total}", font=cf, fill="#9CA3AF", anchor="rm")
    # 진행 점
    pg = R["progress"]; px = x0
    for i in range(total):
        wdt = pg["dot"] * (3 if i == idx else 1)
        d.rounded_rectangle([px, pg["y"], px + wdt, pg["y"] + pg["dot"]], pg["dot"] // 2, fill="#FFFFFF" if i == idx else "#4B5563")
        px += wdt + pg["gap"]
    # 제목
    ix = x0 + k["pad_x"]; iw = k["w"] - k["pad_x"] * 2; y = y0 + k["pad_y"]
    d.text((ix, y), card["title"], font=f("ExtraBold", R["title"]["font_px"]), fill=C["ink"])
    y += R["title"]["font_px"] + R["title"]["gap_below"]
    if card["layout"] == "big":
        b = R["big"]; vf = f("Black", b["value_px"]); uf = f("Bold", b["unit_px"])
        d.text((ix, y + b["value_px"]), card["big"]["value"], font=vf, fill=C["ink"], anchor="ls")
        vw = d.textlength(card["big"]["value"], font=vf)
        d.text((ix + vw + 12, y + b["value_px"]), card["big"]["unit"], font=uf, fill=C["ink"], anchor="ls")
        y += b["value_px"] + 34
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ld = ImageDraw.Draw(layer)
    if card["layout"] == "chips":
        cp = R["chip"]; cfnt = f("SemiBold", cp["font_px"]); n = cp["per_step"]
        for r in range(0, len(card["chips"]), n):
            step = r // n
            if step > revealed: break
            a = 1.0 if step < revealed else ease(part)
            if a <= 0: break
            off = int((1 - a) * 24); cx = ix; tmp = Image.new("RGBA", (W, H), (0, 0, 0, 0)); td = ImageDraw.Draw(tmp)
            for name in card["chips"][r:r + n]:
                cw = td.textlength(name, font=cfnt) + cp["pad_x"] * 2
                td.rounded_rectangle([cx, y + off, cx + cw, y + off + cp["h"]], cp["radius"], fill=C["chip_bg"])
                td.ellipse([cx + 18, y + off + cp["h"] / 2 - 7, cx + 32, y + off + cp["h"] / 2 + 7], fill=C["ok"])
                td.text((cx + 42 + (cw - 42 - 16) / 2, y + off + cp["h"] / 2), name, font=cfnt, fill=C["ink"], anchor="mm")
                cx += cw + cp["gap"]
            tmp.putalpha(tmp.getchannel("A").point(lambda v: int(v * a))); layer.alpha_composite(tmp)
            y += cp["h"] + cp["gap"]
        y = y0 + ch - k["pad_y"] - R["source"]["font_px"] - 8 - 20
    elif card["layout"] == "timeline":
        tlr = R["timeline"]; df = f("SemiBold", tlr["date_px"]); tf2 = f("Bold", tlr["text_px"]); sf = f("Medium", tlr["sub_px"]); n = len(card["items"])
        cx = ix + 14
        d.line([cx, y + tlr["h"] / 2, cx, y + (n - 1) * tlr["h"] + tlr["h"] / 2], fill=C["line"], width=4)
        for i, it in enumerate(card["items"]):
            ry = y + i * tlr["h"]; cy = ry + tlr["h"] / 2
            d.ellipse([cx - 9, cy - 9, cx + 9, cy + 9], fill=C["line"])
            if i > revealed: continue
            a = 1.0 if i < revealed else ease(part)
            if a <= 0: continue
            off = int((1 - a) * 20); tmp = Image.new("RGBA", (W, H), (0, 0, 0, 0)); td = ImageDraw.Draw(tmp)
            td.ellipse([cx - 13, cy - 13, cx + 13, cy + 13], fill=tone(it.get("tone")) if it.get("tone") else C["ink"])
            td.text((ix + 52, ry + 14 + off), it["label"], font=df, fill=C["label"])
            td.text((ix + 52, ry + 14 + tlr["date_px"] + 8 + off), it["value"], font=tf2, fill=C["ink"])
            if it.get("sub"): td.text((ix + iw, ry + 14 + tlr["date_px"] + 8 + (tlr["text_px"] - tlr["sub_px"]) + off), it["sub"], font=sf, fill=tone(it.get("tone")) if it.get("tone") else C["label"], anchor="ra")
            tmp.putalpha(tmp.getchannel("A").point(lambda q: int(q * a))); layer.alpha_composite(tmp)
        y += n * tlr["h"]
    else:
        rw = R["row"]; lf = f("Medium", rw["label_px"]); vf = f("Bold", rw["value_px"])
        for i, it in enumerate(card["items"]):
            ry = y + i * rw["h"]
            d.line([ix, ry, ix + iw, ry], fill=C["line"], width=2)
            if i > revealed: continue
            a = 1.0 if i < revealed else ease(part)
            if a <= 0: continue
            off = int((1 - a) * 20); tmp = Image.new("RGBA", (W, H), (0, 0, 0, 0)); td = ImageDraw.Draw(tmp)
            lx = ix
            if it.get("icon"):
                ic = R["icon"]; tmp.alpha_composite(icon(it["icon"], ic["px"], ic["color"]), (ix, int(ry + rw["h"] / 2 + off - ic["px"] / 2))); lx = ix + ic["px"] + ic["gap"]
            td.text((lx, ry + rw["h"] / 2 + off), it["label"], font=lf, fill=C["label"], anchor="lm")
            v = it["value"]; vfx = vf
            while td.textlength(v, font=vfx) > iw - (lx - ix) - td.textlength(it["label"], font=lf) - 30 and vfx.size > 30:
                vfx = f("Bold", vfx.size - 2)
            td.text((ix + iw, ry + rw["h"] / 2 + off), v, font=vfx, fill=tone(it.get("tone")), anchor="rm")
            tmp.putalpha(tmp.getchannel("A").point(lambda q: int(q * a))); layer.alpha_composite(tmp)
        y += len(card["items"]) * rw["h"]
    im.alpha_composite(layer)
    d = ImageDraw.Draw(im)
    d.text((ix, y0 + ch - k["pad_y"] + 4), "출처 · " + card.get("source", ""), font=f("Medium", R["source"]["font_px"]), fill="#9CA3AF", anchor="ls")
    return im

def caption(base, text, a):
    if not text or a <= 0: return
    cp = R["caption"]; ft = f("ExtraBold", cp["font_px"])
    lines = [text] if len(text) <= cp["max_chars_line"] else None
    if lines is None:
        ws = text.split(" "); mid = len(text) / 2; acc = 0; cut = 1
        for i, w in enumerate(ws):
            acc += len(w) + 1
            if acc >= mid: cut = i + 1; break
        lines = [" ".join(ws[:cut]), " ".join(ws[cut:])]
    lh = int(cp["font_px"] * 1.25); y = cp["center_y"] - lh * (len(lines) - 1) / 2
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(sh)
    tx = Image.new("RGBA", (W, H), (0, 0, 0, 0)); td = ImageDraw.Draw(tx)
    for i, l in enumerate(lines):
        sd.text((W / 2, y + i * lh), l, font=ft, fill=(0, 0, 0, 190), anchor="mm")
        td.text((W / 2, y + i * lh), l, font=ft, fill=(255, 255, 255, 255), anchor="mm")
    sh = sh.filter(ImageFilter.GaussianBlur(cp["shadow_px"] / 5))
    for layer in (sh, tx):
        layer.putalpha(layer.getchannel("A").point(lambda v: int(v * a))); base.alpha_composite(layer)

def pcm(path, sr=48000):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "2", "-ar", str(sr), "-"], capture_output=True).stdout
    return np.frombuffer(raw, "float32").reshape(-1, 2).copy()

def main(inp, out, only=None, logo=True):
    data = json.load(open(inp)); validate(data); cards = data["cards"]
    if only: cards = [c for c in cards if c["type"] in only]
    if not cards: sys.exit("그릴 카드가 없습니다")
    total = len(cards); placed = []
    # 시간표: starts[ci] = 그 카드 각 줄이 뜨는 시각(초)
    V = R.get("voice", {}); vo = data.get("voice"); events = []; starts = []
    if vo and vo.get("files"):
        sents = {k: sentences(v["words"]) for k, v in vo["files"].items()}; t = 0.0
        for c in cards:
            t += T["card_in_s"] + 0.15; row = []
            for v in vsegs(c):
                row.append(t)
                if v:
                    a0, a1 = sents[v[0]][v[1]]; placed.append((t, v[0], a0, a1)); t += (a1 - a0) / V["tempo"] + V["gap_s"]
                else: t += T["step_s"]
            starts.append(row); t += V["card_gap_s"]
        body = t + V["tail_s"]
    elif vo and vo.get("words"):
        ws = json.load(open(ROOT / vo["words"])); sent = []; new = True
        for w in ws:
            if new: sent.append(w["s"]); new = False
            if w["w"].endswith((".", "?", "!")): new = True
        nst = sum(len(steps_of(c)) for c in cards)
        if len(sent) != nst: sys.exit(f"음성 문장 {len(sent)}개 != 카드 줄 {nst}개")
        sent = [x / V["tempo"] + V["lead_s"] for x in sent]; i = 0
        for c in cards:
            n = len(steps_of(c)); starts.append(sent[i:i + n]); i += n
        body = ws[-1]["e"] / V["tempo"] + V["lead_s"] + V["tail_s"]
    else:
        t = 0.0
        for c in cards:
            t += T["card_in_s"]; n = len(steps_of(c)); starts.append([t + k * T["step_s"] for k in range(n)]); t += n * T["step_s"] + T["hold_s"]
        body = t
    for ci, c in enumerate(cards):
        s0 = 0.0 if ci == 0 else starts[ci][0] - T["card_in_s"] - 0.12
        c["_span"] = [s0, body]
        if ci: cards[ci - 1]["_span"][1] = s0
        events.append((s0, "card")); events += [(x, "item") for x in starts[ci]]
    dur = body + (T["end_logo_s"] if logo else 0); nfr = int(round(dur * FPS))
    bg = background().convert("RGBA"); logo = Image.open(LOGO).convert("RGBA")
    tmpv = str(out) + ".video.mp4"
    ff = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                           "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", tmpv], stdin=subprocess.PIPE)
    cache = {}
    for n in range(nfr):
        now = n / FPS; fr = bg.copy()
        if now < body:
            ci = next(i for i, c in enumerate(cards) if c["_span"][0] <= now < c["_span"][1])
            c = cards[ci]; s0 = c["_span"][0]; st = steps_of(c)
            revealed = 0; part = 0.0; cap = ""; capa = 0.0
            done = [k for k, x in enumerate(starts[ci]) if x <= now]
            if done:
                revealed = done[-1]; part = (now - starts[ci][revealed]) / T["item_in_s"]; cap = st[revealed][1]; capa = min(1.0, part)
            key = (ci, revealed, round(min(part, 1.0), 2))
            if key not in cache:
                if len(cache) > 6: cache.clear()
                cache[key] = draw_card(c, ci, total, revealed, part)
            layer = cache[key]
            a = ease((now - s0) / T["card_in_s"]); out_a = min(1.0, (c["_span"][1] - now) / 0.18)
            a = min(a, out_a) if ci < total - 1 or True else a
            dy = int((1 - ease((now - s0) / T["card_in_s"])) * 60)
            if a < 1 or dy:
                l2 = Image.new("RGBA", (W, H), (0, 0, 0, 0)); l2.paste(layer, (0, dy))
                l2.putalpha(l2.getchannel("A").point(lambda v: int(v * max(0, a)))); layer = l2
            fr.alpha_composite(layer); caption(fr, cap, capa * min(1.0, out_a))
        else:
            p = ease((now - body) / 1.2); s = int(360 + 240 * p); lg = logo.resize((s, int(s * logo.height / logo.width)), Image.LANCZOS)
            lg.putalpha(lg.getchannel("A").point(lambda v: int(v * min(1.0, (now - body) / 0.4))))
            fr.alpha_composite(lg, ((W - lg.width) // 2, (H - lg.height) // 2 - 80))
        ff.stdin.write(fr.convert("RGB").tobytes())
    ff.stdin.close(); ff.wait()
    # 소리
    sr = 48000; mix = np.zeros((int(dur * sr) + sr, 2), "float32"); sx = R["sfx"]
    has_v = bool(vo and (vo.get("file") or vo.get("files"))); k = V.get("sfx_scale", 1) if has_v else 1
    bgm = pcm(BGM / sx["bgm"]); reps = -(-len(mix) // len(bgm)); mix += np.tile(bgm, (reps, 1))[:len(mix)] * (V["bgm_gain"] if has_v else sx["bgm_gain"])
    sc, si = pcm(SFX / sx["card"]) * sx["card_gain"] * k, pcm(SFX / sx["item"]) * sx["item_gain"] * k
    for t0, key, a0, a1 in placed:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{a0:.3f}", "-t", f"{a1 - a0:.3f}", "-i", str(ROOT / vo["files"][key]["file"]), "-af", f"atempo={V['tempo']},afade=t=in:d=0.02", "-f", "f32le", "-ac", "2", "-ar", str(sr), "-"], capture_output=True).stdout
        vv = np.frombuffer(raw, "float32").reshape(-1, 2).copy() * V["gain"]; fo2 = min(len(vv), int(0.04 * sr)); vv[-fo2:] *= np.linspace(1, 0, fo2)[:, None]
        i0 = int(t0 * sr); vv = vv[:len(mix) - i0]; mix[i0:i0 + len(vv)] += vv
    if has_v and vo.get("file"):
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(ROOT / vo["file"]), "-af", f"atempo={V['tempo']}", "-f", "f32le", "-ac", "2", "-ar", str(sr), "-"], capture_output=True).stdout
        vv = np.frombuffer(raw, "float32").reshape(-1, 2) * V["gain"]; i0 = int(V["lead_s"] * sr); vv = vv[:len(mix) - i0]; mix[i0:i0 + len(vv)] += vv
    for tt, kind in events:
        s = sc if kind == "card" else si; i0 = int(tt * sr); seg = s[:len(mix) - i0]; mix[i0:i0 + len(seg)] += seg
    mix = mix[:int(dur * sr)]; fo = int(0.8 * sr); mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
    wavp = str(out) + ".wav"
    with wave.open(wavp, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr); w.writeframes((np.clip(mix, -1, 1) * 32767).astype("<i2").tobytes())
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmpv, "-i", wavp, "-af", f"loudnorm=I={sx['lufs']}:TP={sx['tp']}:LRA=11",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", str(out)], check=True)
    os.remove(tmpv); os.remove(wavp)
    plan = {"duration_s": round(dur, 2), "cards": [{"type": c["type"], "start": round(c["_span"][0], 2), "end": round(c["_span"][1], 2), "steps": len(steps_of(c))} for c in cards],
            "skipped": data.get("skipped", [])}
    json.dump(plan, open(str(out).replace(".mp4", "_plan.json"), "w"), ensure_ascii=False, indent=2); print(json.dumps(plan, ensure_ascii=False))

if __name__ == "__main__":
    # 쓰는 법: card_info_render.py 입력.json 출력.mp4 [--cards 유형1,유형2] [--each 폴더]
    a = sys.argv[1:]; only = None
    if "--cards" in a: only = a[a.index("--cards") + 1].split(",")
    if "--each" in a:
        outdir = Path(a[a.index("--each") + 1]); outdir.mkdir(parents=True, exist_ok=True); d0 = json.load(open(a[0]))
        for c in d0["cards"]:
            if only and c["type"] not in only: continue
            main(a[0], outdir / f"card_{c['id']}.mp4", [c["type"]], logo=False)
    else: main(a[0], a[1], only)
