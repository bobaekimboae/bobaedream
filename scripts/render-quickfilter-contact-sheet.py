from __future__ import annotations

import argparse
import csv
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]


def absolute_path(value: str) -> Path:
    path = Path(value)
    return path if path.is_absolute() else ROOT / path


def font(size: int, bold: bool = False):
    candidates = [
        "C:/Windows/Fonts/Pretendard-Bold.otf" if bold else "C:/Windows/Fonts/Pretendard-Regular.otf",
        "C:/Windows/Fonts/malgunbd.ttf" if bold else "C:/Windows/Fonts/malgun.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            pass
    return ImageFont.load_default()


def main() -> int:
    parser = argparse.ArgumentParser(description="Render a 2x small-slot QA contact sheet from a quick-filter manifest.")
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--columns", type=int, default=4)
    args = parser.parse_args()

    manifest = absolute_path(args.manifest)
    output = absolute_path(args.output)
    with manifest.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))

    columns = max(1, args.columns)
    card_width, card_height = 190, 150
    margin, header = 24, 72
    row_count = math.ceil(len(rows) / columns)
    sheet = Image.new("RGB", (margin * 2 + card_width * columns, header + margin + card_height * row_count), "#F4F4F4")
    draw = ImageDraw.Draw(sheet)
    draw.text((margin, 18), "퀵필터 64×40 슬롯 2배 검수", fill="#222222", font=font(26, True))
    draw.text((margin, 50), manifest.name, fill="#777777", font=font(14))

    for index, row in enumerate(rows):
        col, line = index % columns, index // columns
        left = margin + col * card_width
        top = header + margin + line * card_height
        draw.rounded_rectangle((left, top, left + card_width - 12, top + card_height - 12), radius=12, fill="white")
        with Image.open(absolute_path(row["output_file"])) as opened:
            image = opened.convert("RGBA")
            image.thumbnail((128, 80), Image.Resampling.LANCZOS)
            x = left + (card_width - 12 - image.width) // 2
            y = top + 16 + (80 - image.height)
            sheet.paste(image, (x, y), image)
        draw.text((left + (card_width - 12) / 2, top + 106), row["name_ko"], fill="#222222", font=font(16, True), anchor="mm")
        draw.text((left + (card_width - 12) / 2, top + 128), row["type_code"], fill="#8A8A8A", font=font(12), anchor="mm")

    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, format="PNG", optimize=True)
    print(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

