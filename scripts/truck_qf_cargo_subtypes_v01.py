from __future__ import annotations

import csv
import math
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


REPO = Path.cwd()
GENERATED_ROOT = Path("C:/Users/bobae/.codex/generated_images/01a0efe2-68c0-7720-9cf7-93e8c94aa3f7")
OUT_ROOT = REPO / "public/assets/truck/truck_qf_cargo_subtypes_v01"

CANVAS_W = 1600
CANVAS_H = 1000
GROUND_Y = 860
AREA_TARGET_RATIO = 0.66
WIDTH_MAX_RATIO = 0.90
HEIGHT_MAX_RATIO = 0.74
WEB_SIZES = [(216, 135), (192, 120), (312, 195), (240, 150)]


@dataclass(frozen=True)
class Item:
    id: str
    display_name: str
    prompt: str
    source_name: str


ITEMS = [
    Item(
        "truck_subtype_cargo_light",
        "경형",
        "Generic kei/light mini cab-over cargo truck, white cab, short open flat cargo bed, pure white studio background, 30-degree front-left view, no logos, no text, no cargo.",
        "call_oEHS1ulYTMaQtRDS1c824CaU.png",
    ),
    Item(
        "truck_subtype_cargo_small",
        "소형",
        "Generic compact Korean 1-ton class cab-over cargo truck, white cab, open flat cargo bed, pure white studio background, 30-degree front-left view, no logos, no text, no cargo.",
        "call_yfCMoLwDmyilebQ9piyqDIuB.png",
    ),
    Item(
        "truck_subtype_cargo_semi_medium",
        "준중형",
        "Generic Korean semi-medium 2.5 to 3.5 ton cab-over cargo truck, white cab, longer open flat cargo bed, pure white studio background, 30-degree front-left view, no logos, no text, no cargo.",
        "call_fiOk62Q2sRepf4kmyD2XIihn.png",
    ),
    Item(
        "truck_subtype_cargo_medium",
        "중형",
        "Generic Korean medium 4 to 5 ton cab-over cargo truck, white cab, long open flat cargo bed, pure white studio background, 30-degree front-left view, no logos, no text, no cargo.",
        "call_KHNrdQUOTdlBCG9TLcEdDd2w.png",
    ),
    Item(
        "truck_subtype_cargo_quasi_large",
        "준대형",
        "Generic Korean quasi-large 7.5 to 8.5 ton cab-over cargo truck, white cab, long heavy-duty open flat cargo bed, pure white studio background, 30-degree front-left view, no logos, no text, no cargo.",
        "call_TaqISy0QjdZIjYYaufjSNiSg.png",
    ),
    Item(
        "truck_subtype_cargo_large",
        "대형",
        "Generic Korean large 11 to 25 ton heavy cab-over cargo truck, white cab, multi-axle open flat cargo bed, pure white studio background, 30-degree front-left view, no logos, no text, no cargo.",
        "call_GfY37A2uDAaPnheTjKbbwvAM.png",
    ),
]


def fail_if_exists(path: Path) -> None:
    if path.exists():
        raise FileExistsError(f"Refusing to overwrite existing file: {path}")


def make_dirs() -> None:
    for name in ("master_png", "web_webp", "prompts"):
        (OUT_ROOT / name).mkdir(parents=True, exist_ok=True)


def subject_mask(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            light = (r + g + b) / 3
            chroma = max(r, g, b) - min(r, g, b)
            if light > 242 and chroma < 14:
                px[x, y] = (r, g, b, 0)
            elif light > 232 and chroma < 10:
                px[x, y] = (r, g, b, min(a, 70))
    for y in range(int(h * 0.78), h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if (r + g + b) / 3 > 205:
                px[x, y] = (r, g, b, 0)
    return rgba


def alpha_bbox(img: Image.Image) -> tuple[int, int, int, int]:
    box = img.getbbox()
    if box is None:
        raise ValueError("No subject pixels found")
    return box


def standard_shadow(subject_width: int) -> Image.Image:
    layer = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    half_w = int(subject_width * 0.92 / 2)
    draw.ellipse(
        (CANVAS_W // 2 - half_w, GROUND_Y - 22, CANVAS_W // 2 + half_w, GROUND_Y + 23),
        fill=(0, 0, 0, 56),
    )
    return layer.filter(ImageFilter.GaussianBlur(16))


def normalize(item: Item) -> dict[str, object]:
    src_path = GENERATED_ROOT / item.source_name
    if not src_path.exists():
        raise FileNotFoundError(src_path)

    src = subject_mask(Image.open(src_path))
    left, top, right, bottom = alpha_bbox(src)
    crop_w = right - left
    crop_h = bottom - top

    base = math.sqrt(CANVAS_W * CANVAS_H)
    scale = (base * AREA_TARGET_RATIO) / math.sqrt(crop_w * crop_h)
    scale = min(scale, CANVAS_W * WIDTH_MAX_RATIO / crop_w)
    scale = min(scale, CANVAS_H * HEIGHT_MAX_RATIO / crop_h)

    draw_w = round(crop_w * scale)
    draw_h = round(crop_h * scale)
    draw_x = round(CANVAS_W / 2 - draw_w / 2)
    draw_y = round(GROUND_Y - draw_h)

    cropped = src.crop((left, top, right, bottom)).resize((draw_w, draw_h), Image.Resampling.LANCZOS)
    master = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    master.alpha_composite(standard_shadow(draw_w))
    master.alpha_composite(cropped, (draw_x, draw_y))

    master_path = OUT_ROOT / "master_png" / f"{item.id}_v01.png"
    fail_if_exists(master_path)
    master.save(master_path)

    for width, height in WEB_SIZES:
        web_path = OUT_ROOT / "web_webp" / f"{item.id}_v01_{width}.webp"
        fail_if_exists(web_path)
        web = Image.new("RGB", (CANVAS_W, CANVAS_H), "#FFFFFF")
        web.paste(master, mask=master.getchannel("A"))
        web.resize((width, height), Image.Resampling.LANCZOS).save(web_path, "WEBP", quality=85)

    prompt_path = OUT_ROOT / "prompts" / f"{item.id}_v01.txt"
    fail_if_exists(prompt_path)
    prompt_path.write_text(f"{item.prompt}\n\nsource={src_path}\n", encoding="utf-8")

    return {
        "id": item.id,
        "display_name": item.display_name,
        "prompt": item.prompt,
        "source": str(src_path),
        "source_subject_width": crop_w,
        "source_subject_height": crop_h,
        "width": draw_w,
        "height": draw_h,
        "bottom_y": GROUND_Y,
        "area_percent": math.sqrt(draw_w * draw_h) / base * 100,
        "width_percent": draw_w / CANVAS_W * 100,
        "height_percent": draw_h / CANVAS_H * 100,
    }


def load_font(size: int) -> ImageFont.ImageFont:
    font_path = Path("C:/Windows/Fonts/malgun.ttf")
    return ImageFont.truetype(str(font_path), size) if font_path.exists() else ImageFont.load_default()


def write_preview(results: list[dict[str, object]]) -> None:
    tile_w, tile_h = 420, 320
    sheet = Image.new("RGB", (tile_w * len(results), tile_h), "#F4F4F4")
    draw = ImageDraw.Draw(sheet)
    font = load_font(20)
    for idx, result in enumerate(results):
        x = idx * tile_w
        draw.text((x + 12, 12), f"{result['display_name']}", fill="#222222", font=font)
        draw.line((x, 260, x + tile_w, 260), fill="#E00000", width=2)
        img = Image.open(OUT_ROOT / "master_png" / f"{result['id']}_v01.png").convert("RGBA")
        tile = Image.new("RGBA", (400, 250), (255, 255, 255, 0))
        tile.alpha_composite(img.resize((400, 250), Image.Resampling.LANCZOS))
        bg = Image.new("RGB", (400, 250), "#FFFFFF")
        bg.paste(tile, mask=tile.getchannel("A"))
        sheet.paste(bg, (x + 10, 44))
    path = OUT_ROOT / "preview_sheet.png"
    fail_if_exists(path)
    sheet.save(path)


def write_64x40_compare(results: list[dict[str, object]]) -> None:
    canvas = Image.new("RGB", (64 * len(results), 40), "#FFFFFF")
    for idx, result in enumerate(results):
        img = Image.open(OUT_ROOT / "web_webp" / f"{result['id']}_v01_192.webp").convert("RGB")
        canvas.paste(img.resize((64, 40), Image.Resampling.LANCZOS), (idx * 64, 0))
    path = OUT_ROOT / "cargo_subtypes_64x40_compare.png"
    fail_if_exists(path)
    canvas.save(path)


def write_csvs(results: list[dict[str, object]]) -> None:
    qa_path = OUT_ROOT / "qa_result.csv"
    fail_if_exists(qa_path)
    with qa_path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow([
            "id", "display_name", "q1_bottom_y", "q1_result", "q2_area_percent", "q2_result",
            "q3_width_percent", "q3_height_percent", "q3_result", "q8_source_subject_width",
            "q8_result", "notes",
        ])
        for result in results:
            area = float(result["area_percent"])
            width_percent = float(result["width_percent"])
            height_percent = float(result["height_percent"])
            source_width = int(result["source_subject_width"])
            writer.writerow([
                result["id"],
                result["display_name"],
                result["bottom_y"],
                "PASS",
                f"{area:.2f}",
                "PASS" if abs(area - 66) <= 2 else "FAIL",
                f"{width_percent:.2f}",
                f"{height_percent:.2f}",
                "PASS" if width_percent <= 90 and height_percent <= 74 else "FAIL",
                source_width,
                "PASS" if source_width >= 1000 else "FAIL",
                "",
            ])

    manifest_path = OUT_ROOT / "manifest.csv"
    fail_if_exists(manifest_path)
    created = datetime.now(timezone.utc).isoformat()
    with manifest_path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "group", "display_name", "file_master", "file_web", "prompt", "source", "generator", "created", "version"])
        for result in results:
            writer.writerow([
                result["id"],
                "truck_cargo_subtype",
                result["display_name"],
                f"truck_qf_cargo_subtypes_v01/master_png/{result['id']}_v01.png",
                f"truck_qf_cargo_subtypes_v01/web_webp/{result['id']}_v01_192.webp",
                result["prompt"],
                result["source"],
                "codex image_gen",
                created,
                "v01",
            ])


def main() -> None:
    make_dirs()
    results = [normalize(item) for item in ITEMS]
    write_preview(results)
    write_64x40_compare(results)
    write_csvs(results)
    for result in results:
        print(
            f"{result['id']}: area={float(result['area_percent']):.2f}% "
            f"w={float(result['width_percent']):.2f}% h={float(result['height_percent']):.2f}% "
            f"source_w={result['source_subject_width']}"
        )


if __name__ == "__main__":
    main()
