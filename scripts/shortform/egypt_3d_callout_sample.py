"""실차 영상 위에 이집트 숏폼식 3D 부위 말풍선을 합성하는 재현 가능한 샘플 렌더러."""

from __future__ import annotations

import hashlib
import json
import math
import os
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "public" / "3d-options" / "media" / "demo.mp4"
OUT_DIR = ROOT / "nuxt-shortform" / "public" / "samples"
OUTPUT = OUT_DIR / "egypt-3d-callout-v1.mp4"
META = OUT_DIR / "egypt-3d-callout-v1.json"
W, H, FPS, DURATION = 1080, 1920, 30, 15.0


def font_path(bold: bool = False) -> str:
    windows = Path("C:/Windows/Fonts") / ("malgunbd.ttf" if bold else "malgun.ttf")
    linux = Path("/usr/share/fonts/opentype/noto") / ("NotoSansCJK-Bold.ttc" if bold else "NotoSansCJK-Regular.ttc")
    for candidate in (windows, linux):
        if candidate.exists():
            return str(candidate)
    raise FileNotFoundError("Korean font not found")


FONT_BADGE = ImageFont.truetype(font_path(True), 25)
FONT_TITLE = ImageFont.truetype(font_path(True), 53)
FONT_BODY = ImageFont.truetype(font_path(False), 29)
FONT_TOP = ImageFont.truetype(font_path(True), 24)
FONT_PRIVACY = ImageFont.truetype(font_path(True), 25)


SCENES = [
    dict(start=0.4, end=3.0, anchor=(535, 842), panel=(565, 500), side="right", title="전면 디자인", body="키드니 그릴과 헤드램프\n실차 화면으로 확인"),
    dict(start=3.2, end=5.8, anchor=(285, 1120), panel=(500, 670), side="right", title="휠 · 측면", body="휠 디자인과 측면 비율을\n가까운 화면으로 확인"),
    dict(start=6.0, end=8.8, anchor=(540, 930), panel=(590, 500), side="right", title="적재 공간", body="테일게이트 개방 장면으로\n공간 구성을 직접 확인"),
    dict(start=9.0, end=11.8, anchor=(790, 565), panel=(95, 540), side="left", title="운전석", body="계기판과 센터 디스플레이\n배치를 실차로 확인"),
    dict(start=12.0, end=14.7, anchor=(250, 745), panel=(500, 580), side="right", title="도어 트림", body="소재와 조작부 배치를\n근접 화면으로 확인"),
]


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def ease_out(value: float) -> float:
    p = clamp(value)
    return 1 - (1 - p) ** 3


def centered_text(draw: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], text: str, font: ImageFont.FreeTypeFont, fill):
    x1, y1, x2, y2 = xy
    box = draw.textbbox((0, 0), text, font=font)
    x = x1 + (x2 - x1 - (box[2] - box[0])) / 2
    y = y1 + (y2 - y1 - (box[3] - box[1])) / 2 - box[1]
    draw.text((x, y), text, font=font, fill=fill)


def privacy_mask(frame: Image.Image, t: float) -> None:
    draw = ImageDraw.Draw(frame, "RGBA")
    rect = None
    if 0.0 <= t < 3.0:
        rect = (392, 915, 690, 1035)
    elif 5.7 <= t < 9.0:
        rect = (292, 490, 774, 625)
    if not rect:
        return
    draw.rounded_rectangle(rect, radius=16, fill=(14, 17, 23, 225), outline=(255, 255, 255, 60), width=2)
    centered_text(draw, rect, "번호판 비공개", FONT_PRIVACY, (255, 255, 255, 225))


def draw_chrome(frame: Image.Image, t: float) -> None:
    layer = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer, "RGBA")
    draw.rounded_rectangle((40, 54, 546, 110), radius=28, fill=(12, 18, 29, 170), outline=(126, 173, 255, 80), width=2)
    draw.ellipse((61, 70, 83, 92), fill=(61, 124, 255, 255))
    draw.text((100, 68), "BOBAEDREAM · 3D FEATURE GUIDE", font=FONT_TOP, fill=(255, 255, 255, 232))
    for index in range(len(SCENES)):
        x = 420 + index * 31
        active = SCENES[index]["start"] <= t <= SCENES[index]["end"]
        draw.ellipse((x, 1734, x + 15, 1749), fill=(61, 124, 255, 255) if active else (255, 255, 255, 86))
    draw.text((40, 1810), "실차 화면 기반 · 보이는 부위만 설명", font=FONT_TOP, fill=(255, 255, 255, 205))
    frame.alpha_composite(layer)


def draw_callout(frame: Image.Image, scene: dict, t: float) -> None:
    local = t - scene["start"]
    span = scene["end"] - scene["start"]
    alpha = clamp(local / 0.22) * clamp((span - local) / 0.18)
    if alpha <= 0:
        return
    appear = ease_out(local / 0.35)
    pulse = 0.5 + 0.5 * math.sin(local * math.tau * 1.35)
    direction = 1 if scene["side"] == "right" else -1
    shift = int((1 - appear) * 72 * direction)
    px, py = scene["panel"]
    px += shift
    ax, ay = scene["anchor"]
    panel_w, panel_h, slant = 420, 224, 24

    shadow = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow, "RGBA")
    polygon = [(px + slant, py), (px + panel_w, py - 12), (px + panel_w - 10, py + panel_h - 5), (px, py + panel_h)]
    shadow_poly = [(x + 13, y + 20) for x, y in polygon]
    sd.polygon(shadow_poly, fill=(0, 0, 0, int(150 * alpha)))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    frame.alpha_composite(shadow)

    layer = Image.new("RGBA", frame.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer, "RGBA")
    edge_x = px + 10 if scene["side"] == "right" else px + panel_w - 14
    edge_y = py + panel_h * 0.62
    draw.line((ax, ay, edge_x, edge_y), fill=(226, 238, 255, int(235 * alpha)), width=4)
    draw.line((ax, ay + 7, edge_x, edge_y + 7), fill=(46, 107, 217, int(90 * alpha)), width=8)
    ring = int(23 + 7 * pulse)
    draw.ellipse((ax - ring, ay - ring, ax + ring, ay + ring), outline=(70, 140, 255, int(145 * alpha)), width=8)
    draw.ellipse((ax - 17, ay - 17, ax + 17, ay + 17), fill=(18, 35, 59, int(220 * alpha)), outline=(255, 255, 255, int(245 * alpha)), width=3)
    draw.ellipse((ax - 6, ay - 6, ax + 6, ay + 6), fill=(255, 255, 255, int(255 * alpha)))

    for step in range(16):
        ratio = step / 15
        y1 = py + int(panel_h * ratio)
        y2 = py + int(panel_h * (step + 1) / 15) + 1
        color = (23 + int(7 * ratio), 39 + int(7 * ratio), 65 + int(10 * ratio), int(238 * alpha))
        inset_left = int(slant * (1 - ratio))
        inset_right = int(10 * ratio)
        draw.polygon([(px + inset_left, y1), (px + panel_w - inset_right, y1 - 1), (px + panel_w - inset_right, y2), (px + inset_left, y2)], fill=color)
    draw.line(polygon + [polygon[0]], fill=(137, 183, 255, int(185 * alpha)), width=3, joint="curve")
    draw.rounded_rectangle((px + 37, py + 29, px + 238, py + 66), radius=18, fill=(48, 107, 217, int(235 * alpha)))
    draw.text((px + 56, py + 36), "VISUAL PART", font=FONT_BADGE, fill=(255, 255, 255, int(255 * alpha)))
    draw.text((px + 38, py + 89), scene["title"], font=FONT_TITLE, fill=(255, 255, 255, int(255 * alpha)), stroke_width=1, stroke_fill=(0, 0, 0, int(100 * alpha)))
    draw.multiline_text((px + 40, py + 153), scene["body"], font=FONT_BODY, fill=(207, 219, 237, int(245 * alpha)), spacing=8)
    frame.alpha_composite(layer)


def render() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    decode = subprocess.Popen(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(SOURCE), "-t", str(DURATION),
            "-vf", f"scale={W}:{H}:flags=lanczos,fps={FPS}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-",
        ],
        stdout=subprocess.PIPE,
    )
    encode = subprocess.Popen(
        [
            "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
            "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
            "-i", str(SOURCE), "-map", "0:v:0", "-map", "1:a:0?", "-t", str(DURATION),
            "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-profile:v", "high", "-level", "4.1",
            "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
            "-af", "loudnorm=I=-15:TP=-1:LRA=11", "-movflags", "+faststart", str(OUTPUT),
        ],
        stdin=subprocess.PIPE,
    )
    frame_size = W * H * 3
    frames = 0
    while frames < int(DURATION * FPS):
        raw = decode.stdout.read(frame_size) if decode.stdout else b""
        if len(raw) != frame_size:
            break
        frame = Image.frombytes("RGB", (W, H), raw).convert("RGBA")
        t = frames / FPS
        privacy_mask(frame, t)
        draw_chrome(frame, t)
        for scene in SCENES:
            if scene["start"] <= t <= scene["end"]:
                draw_callout(frame, scene, t)
                break
        if not encode.stdin:
            raise RuntimeError("FFmpeg encoder stdin unavailable")
        encode.stdin.write(frame.convert("RGB").tobytes())
        frames += 1
    if encode.stdin:
        encode.stdin.close()
    decode.wait()
    return_code = encode.wait()
    if return_code != 0:
        raise RuntimeError(f"FFmpeg encode failed: {return_code}")
    digest = hashlib.sha256(OUTPUT.read_bytes()).hexdigest().upper()
    META.write_text(
        json.dumps(
            {
                "id": "egypt-3d-callout-v1",
                "source": str(SOURCE.relative_to(ROOT)).replace("\\", "/"),
                "output": str(OUTPUT.relative_to(ROOT)).replace("\\", "/"),
                "duration_seconds": DURATION,
                "resolution": f"{W}x{H}",
                "fps": FPS,
                "callout_count": len(SCENES),
                "fact_policy": "visible_part_only; no inferred option claims",
                "privacy": "plate areas masked in exterior scenes",
                "sha256": digest,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"rendered {OUTPUT} · {frames} frames · sha256 {digest}")


if __name__ == "__main__":
    render()
