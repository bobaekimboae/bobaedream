from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


REPO = Path(__file__).resolve().parents[1]
ROOT = REPO / "public/assets/truck/pilot/v14"
MASTER_ROOT = ROOT / "masters"
CANVAS = (228, 120)
BASELINE_Y = 114


@dataclass(frozen=True)
class CargoClass:
    key: str
    label: str
    weight: str
    width_ratio: float
    axle_rule: str


CLASSES = (
    CargoClass("light", "경형", "1톤 미만", 0.72, "2축 소형"),
    CargoClass("small", "소형", "1톤급", 0.77, "2축"),
    CargoClass("semi_medium", "준중형", "2.5~3.5톤", 0.82, "2축"),
    CargoClass("medium", "중형", "4~5톤", 0.86, "2축"),
    CargoClass("quasi_large", "준대형", "7.5~8.5톤", 0.91, "3축"),
    CargoClass("large", "대형", "11~25톤", 0.95, "4축"),
)


def alpha_subject_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    solid = alpha.point(lambda value: 255 if value > 20 else 0)
    bbox = solid.getbbox()
    if not bbox:
        raise ValueError("subject alpha bbox not found")
    left, top, right, bottom = bbox
    pad = 8
    return (
        max(0, left - pad),
        max(0, top - pad),
        min(image.width, right + pad),
        min(image.height, bottom + pad),
    )


def normalize(item: CargoClass) -> dict[str, object]:
    master_path = MASTER_ROOT / f"truck_cargo_{item.key}_side_master_v14.png"
    image = Image.open(master_path).convert("RGBA")
    crop = image.crop(alpha_subject_bbox(image))
    target_width = round(CANVAS[0] * item.width_ratio)
    scale = min(target_width / crop.width, (CANVAS[1] * 0.76) / crop.height)
    draw_size = (round(crop.width * scale), round(crop.height * scale))
    resized = crop.resize(draw_size, Image.Resampling.LANCZOS)
    x = round((CANVAS[0] - draw_size[0]) / 2)
    y = BASELINE_Y - draw_size[1]

    output = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    output.alpha_composite(resized, (x, y))

    png_path = ROOT / f"truck_cargo_{item.key}_side_v14.png"
    webp_path = ROOT / f"truck_cargo_{item.key}_side_v14.webp"
    output.save(png_path, optimize=True)
    output.save(webp_path, "WEBP", lossless=True, method=6)

    alpha = output.getchannel("A")
    return {
        "key": item.key,
        "label": item.label,
        "weight": item.weight,
        "axle_rule": item.axle_rule,
        "png": png_path.relative_to(REPO).as_posix(),
        "webp": webp_path.relative_to(REPO).as_posix(),
        "width": draw_size[0],
        "height": draw_size[1],
        "baseline": BASELINE_Y,
        "alpha_min": alpha.getextrema()[0],
        "alpha_max": alpha.getextrema()[1],
    }


def font(size: int) -> ImageFont.ImageFont:
    path = Path("C:/Windows/Fonts/malgun.ttf")
    return ImageFont.truetype(str(path), size) if path.exists() else ImageFont.load_default()


def contact_sheet(results: list[dict[str, object]]) -> None:
    tile_w, tile_h = 244, 164
    sheet = Image.new("RGBA", (tile_w * 3, tile_h * 2), "white")
    draw = ImageDraw.Draw(sheet)
    label_font = font(16)
    meta_font = font(11)
    for index, result in enumerate(results):
        col, row = index % 3, index // 3
        x, y = col * tile_w, row * tile_h
        draw.text((x + 8, y + 7), str(result["label"]), fill="#222222", font=label_font)
        draw.text((x + 8, y + 29), f"{result['weight']} · {result['axle_rule']}", fill="#666666", font=meta_font)
        image = Image.open(REPO / str(result["png"])).convert("RGBA")
        sheet.alpha_composite(image, (x + 8, y + 42))
        draw.line((x + 8, y + 156, x + 236, y + 156), fill="#E8E8E8", width=1)
    sheet.convert("RGB").save(REPO / "docs/truck/qa/cargo_class_side_v14_contact.png", optimize=True)


def manifest(results: list[dict[str, object]]) -> None:
    path = REPO / "docs/truck/truck_cargo_class_manifest_v14.csv"
    with path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(results[0].keys()))
        writer.writeheader()
        writer.writerows(results)


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    (REPO / "docs/truck/qa").mkdir(parents=True, exist_ok=True)
    results = [normalize(item) for item in CLASSES]
    contact_sheet(results)
    manifest(results)
    for result in results:
        print(result)


if __name__ == "__main__":
    main()
