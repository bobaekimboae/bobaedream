"""보배드림 숏폼 「카드 정보」 v2 — 내레이션에 맞춰 카드 행이 나타나는 한 편 렌더러 (시안: Python + Pillow + FFmpeg).

v1(render_cards.py)과 다른 점
- 카드 한 장씩이 아니라 내레이션 한 편에 카드 여러 장을 이어 붙인다. 카드 바뀜·행 등장 시각은 받아쓰기 낱말 시각(sync.json)에서 온다.
- 아이콘은 오토스카우트24 노션 원본 SVG만 쓴다(Fluent 3D 안 씀). 24px 슬롯 규칙과 같은 방식으로
  보이는 잉크 면적 √(폭×높이) 을 맞추고 가운데 정렬, 색은 잉크(#141414) 한 색으로 칠한다(모양은 원본 그대로).
- 제목 칩은 v1과 같은 AS24 노션 원본 붓칠(as24-theme, fill_fit).
- 자막은 뜻 단위 덩어리를 통째로 보여 주고, 지금 말하는 낱말만 노랑. 자막에는 칠 없음.

쓰는 법
  python3 render_cards_v2.py samples/g400d_cards_v2.json --sync <sync.json> --voice <voice.mp3> --photos <사진폴더> --out <mp4>

규칙: 사실은 입력 JSON 값만. 사진은 자르기·확대·흐림만(번호판 가리지 않음). 수치는 cards_spec_v2.json 한 파일에서만 읽는다.
"""
from __future__ import annotations

import argparse
import io
import json
import os
import subprocess
import sys

import cairosvg
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import render_cards as v1  # noqa: E402

RULES = v1.RULES
YEL, INK = v1.YEL, v1.INK
W, H, FPS = v1.W, v1.H, v1.FPS
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
SPEC = json.load(open(os.path.join(HERE, "cards_spec_v2.json"), encoding="utf-8"))
font, hexrgb, ease_out, fit_cover, rounded = v1.font, v1.hexrgb, v1.ease_out, v1.fit_cover, v1.rounded


def as24_icon(rel: str, slot: int, area: float) -> Image.Image:
    """AS24 원본 SVG → slot×slot 칸. 보이는 잉크 √(폭×높이)=area, 가운데, 잉크색 한 색."""
    big = Image.open(io.BytesIO(cairosvg.svg2png(url=os.path.join(REPO, rel), output_width=512))).convert("RGBA")
    a = big.getchannel("A")
    bb = a.getbbox()
    a = a.crop(bb)
    w, h = a.size
    s = area / (w * h) ** 0.5
    nw, nh = max(1, round(w * s)), max(1, round(h * s))
    if max(nw, nh) > slot:  # 슬롯 밖으로 나가면 슬롯에 맞춤
        k = slot / max(nw, nh)
        nw, nh = round(nw * k), round(nh * k)
    a = a.resize((nw, nh), Image.LANCZOS)
    out = Image.new("RGBA", (slot, slot), (0, 0, 0, 0))
    ink = Image.new("RGBA", (nw, nh), hexrgb(INK))
    ink.putalpha(a)
    out.alpha_composite(ink, ((slot - nw) // 2, (slot - nh) // 2))
    return out


def yellow_chip(text: str, px: int) -> Image.Image:
    return v1.yellow_chip(text, px)


class Piece:
    def __init__(self, im, xy, t, sfx=False):
        self.im, self.xy, self.t, self.sfx = im, xy, t, sfx


def build_card(card: dict, car: dict, row_times: list[float]):
    S = SPEC["card"]
    cw, pad = S["w"], S["pad"]
    inner = cw - pad * 2
    head = Image.new("RGBA", (cw, 2400), (0, 0, 0, 0))
    d = ImageDraw.Draw(head)
    y = pad
    # 머리글: AS24 아이콘(원 바탕 없이) + 종류 이름 + 차명
    ic = as24_icon(card["icon"], S["icon_slot"], S["icon_area"])
    head.alpha_composite(ic, (pad, y))
    tx = pad + S["icon_slot"] + S["icon_gap"]
    d.text((tx, y + S["icon_slot"] // 2), card["label"], font=font("Bold", S["label_px"]), fill=hexrgb(INK), anchor="lm")
    d.text((cw - pad, y + S["icon_slot"] // 2), car["short"], font=font("Medium", S["sub_px"]), fill=hexrgb(S["muted"]), anchor="rm")
    y += S["icon_slot"] + S["head_gap"]
    chip = yellow_chip(card["title"], S["title_px"])
    head.alpha_composite(chip, (pad - 8, y))
    y += chip.height + S["chip_gap"]
    d.line((pad, y, cw - pad, y), fill=hexrgb(S["divider"]), width=2)
    pieces: list[Piece] = []
    rh = S["row_h"]
    fl, fv = font("Medium", S["row_label_px"]), font("Bold", S["row_value_px"])
    for k, r in enumerate(card["rows"]):
        im = Image.new("RGBA", (inner, rh), (0, 0, 0, 0))
        dd = ImageDraw.Draw(im)
        cy = rh // 2
        x = 0
        if r.get("icon"):
            im.alpha_composite(as24_icon(r["icon"], S["row_icon_slot"], S["row_icon_area"]), (0, cy - S["row_icon_slot"] // 2))
            x = S["row_icon_slot"] + 20
        dd.text((x, cy), r["label"], font=fl, fill=hexrgb(S["row_label_color"]), anchor="lm")
        vx = inner
        if r.get("state") == "ok":
            ck = as24_icon(SPEC["check_icon"], S["check_slot"], S["check_area"])
            im.alpha_composite(ck, (inner - S["check_slot"], cy - S["check_slot"] // 2))
            vx = inner - S["check_slot"] - 12
        dd.text((vx, cy), r["value"], font=fv, fill=hexrgb(INK if r.get("state") != "dim" else S["muted"]), anchor="rm")
        dd.line((0, rh - 1, inner, rh - 1), fill=hexrgb(S["divider"]), width=2)
        pieces.append(Piece(im, (pad, y), row_times[k], k < 3))
        y += rh
    if card.get("note"):
        im = Image.new("RGBA", (inner, S["note_h"]), (0, 0, 0, 0))
        ImageDraw.Draw(im).text((0, S["note_h"] // 2 + 4), card["note"], font=font("Medium", S["note_px"]), fill=hexrgb(S["muted"]), anchor="lm")
        pieces.append(Piece(im, (pad, y), row_times[-1] + 0.25))
        y += S["note_h"]
    if card.get("price_manwon"):
        im = Image.new("RGBA", (inner, 200), (0, 0, 0, 0))
        dd = ImageDraw.Draw(im)
        big = f"{card['price_manwon']:,}"
        fb = font("Black", S["price_px"])
        dd.text((0, 100), big, font=fb, fill=hexrgb(INK), anchor="lm")
        dd.text((v1.text_w(fb, big) + 18, 118), "만원", font=font("Bold", S["price_unit_px"]), fill=hexrgb(INK), anchor="lm")
        pieces.append(Piece(im, (pad, y + 8), card["price_t"], True))
        y += 216
    ch = y + pad
    base = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    ImageDraw.Draw(base).rounded_rectangle((0, 0, cw - 1, ch - 1), S["radius"], fill=hexrgb(S["bg"]))
    base.alpha_composite(head.crop((0, 0, cw, ch)))
    return base, pieces


def caption_img(words: list[str], hl: int | None) -> Image.Image:
    C = SPEC["caption"]
    f = font("ExtraBold", C["px"])
    lines, cur, maxw = [], [], C["max_w"]
    for k, w in enumerate(words):
        test = " ".join([words[i] for i in cur] + [w])
        if cur and v1.text_w(f, test) > maxw:
            lines.append(cur)
            cur = []
        cur.append(k)
    lines.append(cur)
    lh = C["px"] + C["line_gap"]
    im = Image.new("RGBA", (W, lh * len(lines) + 60), (0, 0, 0, 0))
    sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d, ds = ImageDraw.Draw(im), ImageDraw.Draw(sh)
    sp = v1.text_w(f, " ") + 4
    for li, idxs in enumerate(lines):
        tw = sum(v1.text_w(f, words[i]) for i in idxs) + sp * (len(idxs) - 1)
        x = (W - tw) // 2
        yy = 30 + li * lh
        for i in idxs:
            ds.text((x + 3, yy + 4), words[i], font=f, fill=(0, 0, 0, 210))
            d.text((x, yy), words[i], font=f, fill=hexrgb(YEL) if i == hl else (255, 255, 255, 255))
            x += v1.text_w(f, words[i]) + sp
    sh = sh.filter(ImageFilter.GaussianBlur(C["shadow_blur"]))
    sh.alpha_composite(im)
    return sh


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("data")
    ap.add_argument("--sync", required=True)
    ap.add_argument("--voice", required=True)
    ap.add_argument("--photos", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--assets", default=os.path.join(REPO, "public", "assets", "shortform"))
    ap.add_argument("--remix", action="store_true", help="이미 만든 화면(.v.mp4)에 소리만 다시 섞기")
    a = ap.parse_args()
    data = json.load(open(a.data if os.path.isabs(a.data) else os.path.join(HERE, a.data), encoding="utf-8"))
    sync = json.load(open(a.sync, encoding="utf-8"))
    car = data["car"]
    T = SPEC["timing"]
    cards = []
    for c in data["cards"]:
        s = sync["cards"][c["id"]]
        c = dict(c)
        if "price_t" in s:
            c["price_t"] = s["price_t"]
        base, pieces = build_card(c, car, s["rows"])
        bg_src = Image.open(os.path.join(a.photos, c["bg"])).convert("RGB")
        big = fit_cover(bg_src, int(W * 1.08), int(H * 1.08)).filter(ImageFilter.GaussianBlur(SPEC["bg"]["blur"]))
        big = Image.blend(big, Image.new("RGB", big.size, (0, 0, 0)), SPEC["bg"]["darken"])
        band = rounded(fit_cover(bg_src, W - 2 * SPEC["bg"]["band_x"], SPEC["bg"]["band_h"], c.get("band_box")), 28)
        cards.append(dict(c=c, start=s["start"], end=s["end"], base=base, pieces=pieces, big=big, band=band))
    dur = sync["duration"] + T["tail"]
    title = v1.top_title(car)
    cw = SPEC["card"]["w"]
    cx = (W - cw) // 2
    shadow_cache = {}
    chunks = sync["chunks"]
    cap_cache = {}
    tmpv = a.out + ".v.mp4"
    skip = a.remix and os.path.exists(tmpv)
    ff = None if skip else subprocess.Popen(["ffmpeg", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
                           "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", tmpv], stdin=subprocess.PIPE)
    sfx = []
    for k, cd in enumerate(cards):
        if k:
            sfx.append((cd["start"] - 0.05, "whoosh"))
        sfx += [(p.t, "tick") for p in cd["pieces"] if p.sfx]
    for fi in range(0 if skip else int(dur * FPS)):
        t = fi / FPS
        k = max(i for i, cd in enumerate(cards) if t >= cd["start"] or i == 0)
        cd = cards[k]
        seg_end = cards[k + 1]["start"] if k + 1 < len(cards) else dur
        lt = t - cd["start"]
        z = 1.0 + 0.05 * max(0.0, min(1.0, lt / max(1.0, seg_end - cd["start"])))
        bw, bh = int(W * z), int(H * z)
        bgf = cd["big"].resize((bw, bh), Image.BILINEAR)
        fr = bgf.crop(((bw - W) // 2, (bh - H) // 2, (bw - W) // 2 + W, (bh - H) // 2 + H)).convert("RGBA")
        fr.alpha_composite(cd["band"], (SPEC["bg"]["band_x"], SPEC["bg"]["band_y"]))
        fr.alpha_composite(title, (0, SPEC["bg"]["band_y"] + SPEC["bg"]["band_h"] + SPEC["bg"]["title_gap"]))
        ein = ease_out(lt / T["card_in"]) if k else 1.0 if lt > 0 else 0.0
        if k == 0:
            ein = ease_out(t / T["card_in"])
        eout = 1.0 - max(0.0, min(1.0, (t - (seg_end - T["card_out"])) / T["card_out"])) if k + 1 < len(cards) else 1.0
        al = ein * eout
        card = cd["base"].copy()
        for p in cd["pieces"]:
            e = ease_out((t - p.t) / T["row_in"])
            if e <= 0:
                continue
            im = p.im
            if e < 1:
                im = im.copy()
                im.putalpha(im.getchannel("A").point(lambda v, e=e: int(v * e)))
            card.alpha_composite(im, (p.xy[0], p.xy[1] + int((1 - e) * 18)))
        ch = card.height
        if ch not in shadow_cache:
            s = Image.new("RGBA", (cw + 120, ch + 120), (0, 0, 0, 0))
            ImageDraw.Draw(s).rounded_rectangle((60, 70, cw + 60, ch + 70), SPEC["card"]["radius"], fill=(0, 0, 0, 120))
            shadow_cache[ch] = s.filter(ImageFilter.GaussianBlur(26))
        sh = shadow_cache[ch]
        if al < 1:
            card.putalpha(card.getchannel("A").point(lambda v, al=al: int(v * al)))
            sh = sh.copy()
            sh.putalpha(sh.getchannel("A").point(lambda v, al=al: int(v * al)))
        cy = SPEC["card"]["y"] + int((1 - ein) * 70)
        fr.alpha_composite(sh, (cx - 60, cy - 60))
        fr.alpha_composite(card, (cx, cy))
        # 자막: 뜻 단위 덩어리, 말하는 낱말만 노랑
        for ci, chk in enumerate(chunks):
            if chk["s"] <= t < chk["e"]:
                hl = None
                for wi, (_, ws, we) in enumerate(chk["words"]):
                    if ws <= t:
                        hl = wi
                key = (ci, hl)
                if key not in cap_cache:
                    cap_cache = {key: caption_img([w[0] for w in chk["words"]], hl)}
                cap = cap_cache[key]
                fr.alpha_composite(cap, (0, SPEC["caption"]["y"] - cap.height // 2))
                break
        ff.stdin.write(fr.convert("RGB").tobytes())
    if ff:
        ff.stdin.close()
        ff.wait()
    # 소리: 목소리 + 배경음(낮게) + 휙·톡 → −14 LUFS / TP −1.5
    A = SPEC["audio"]
    sd = os.path.join(a.assets, "sfx")
    inputs = ["-i", tmpv, "-i", a.voice, "-i", os.path.join(a.assets, "bgm", A["bgm"])]
    filt = [f"[1:a]adelay={int(A['voice_delay']*1000)}:all=1,highpass=f=70,aformat=channel_layouts=stereo[v]",
            f"[2:a]atrim=0:{dur},afade=t=in:d=0.4,afade=t=out:st={dur-0.8}:d=0.8,volume={A['bgm_gain']},aformat=channel_layouts=stereo[b]"]
    labels = ["[v]", "[b]"]
    n = 3
    for i, (st, kind) in enumerate(sfx):
        inputs += ["-i", os.path.join(sd, A["sfx"][kind])]
        ms = max(0, int((st + A["voice_delay"]) * 1000))
        filt.append(f"[{n}:a]volume={A['gain'][kind]},adelay={ms}:all=1,aformat=channel_layouts=stereo[s{i}]")
        labels.append(f"[s{i}]")
        n += 1
    filt.append(f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0,apad,atrim=0:{dur},"
                f"loudnorm=I={RULES['audio']['loudness_lufs']}:TP=-2:LRA=11,alimiter=limit=0.82:level=false[a]")
    r = subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *inputs, "-filter_complex", ";".join(filt), "-map", "0:v", "-map", "[a]",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", a.out])
    if r.returncode:
        sys.exit("ffmpeg 소리 섞기 실패")
    os.remove(tmpv)
    print("done", a.out, f"{dur:.2f}s")


if __name__ == "__main__":
    main()
