from __future__ import annotations

import argparse
import csv
import json
import math
import shutil
from collections import deque
from pathlib import Path

from PIL import Image


FILES = {
    "BKM001": "BKM001_Honda.jpg",
    "BKM002": "BKM002_Yamaha.jpg",
    "BKM003": "BKM003_BMW_Motorrad.jpg",
    "BKM004": "BKM004_Suzuki.jpg",
    "BKM005": "BKM005_Harley_Davidson.jpg",
    "BKM006": "BKM006_Kawasaki.jpg",
    "BKM007": "BKM007_SYM.jpg",
    "BKM008": "BKM008_Vespa.jpg",
    "BKM010": "BKM010_Ducati.jpg",
}


def transparent_connected_white(source: Path) -> Image.Image:
    """Remove only the near-white region connected to the canvas edge.

    Motofan sources are JPEGs on white. Connectivity keeps white artwork inside
    badges (for example Ducati and SYM) while removing the outer background.
    """
    image = Image.open(source).convert("RGBA")
    width, height = image.size
    pixels = image.load()
    visited = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def eligible(x: int, y: int) -> bool:
        red, green, blue, _ = pixels[x, y]
        return min(red, green, blue) >= 238 and max(red, green, blue) - min(red, green, blue) <= 16

    def enqueue(x: int, y: int) -> None:
        offset = y * width + x
        if not visited[offset] and eligible(x, y):
            visited[offset] = 1
            queue.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()
        red, green, blue, _ = pixels[x, y]
        distance = max(255 - red, 255 - green, 255 - blue)
        alpha = 0 if distance <= 8 else min(255, round((distance - 8) * 255 / 20))
        pixels[x, y] = (red, green, blue, alpha)
        if x:
            enqueue(x - 1, y)
        if x + 1 < width:
            enqueue(x + 1, y)
        if y:
            enqueue(x, y - 1)
        if y + 1 < height:
            enqueue(x, y + 1)

    alpha = image.getchannel("A")
    box = alpha.getbbox()
    return image.crop(box) if box else image


def display_size(width: int, height: int) -> tuple[float, float]:
    ratio = width / height
    display_width = 26 * math.sqrt(ratio)
    display_height = 26 / math.sqrt(ratio)
    if display_width > 38:
        display_width = 38
        display_height = display_width / ratio
    if display_height > 26:
        display_height = 26
        display_width = display_height * ratio
    return round(display_width, 1), round(display_height, 1)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    originals = args.output / "_original"
    originals.mkdir(exist_ok=True)
    metrics: dict[str, dict[str, float | int]] = {}
    rows: list[dict[str, str | int | float]] = []

    for code, source_name in FILES.items():
        source = args.source / source_name
        if not source.exists():
            raise FileNotFoundError(source)
        output_name = source.with_suffix(".png").name
        shutil.copy2(source, originals / source_name)
        prepared = transparent_connected_white(source)
        prepared.save(args.output / output_name, optimize=True)
        display_width, display_height = display_size(*prepared.size)
        metrics[output_name] = {
            "sourceWidth": prepared.width,
            "sourceHeight": prepared.height,
            "displayWidth": display_width,
            "displayHeight": display_height,
        }
        rows.append({
            "code": code,
            "file": output_name,
            "original": source_name,
            "trimWidth": prepared.width,
            "trimHeight": prepared.height,
            "ratio": round(prepared.width / prepared.height, 4),
            "displayWidth": display_width,
            "displayHeight": display_height,
            "source": "모토팬",
        })

    (args.output / "logo-display-motofan.json").write_text(
        json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    with (args.output / "manifest.csv").open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.DictWriter(file, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)


if __name__ == "__main__":
    main()
