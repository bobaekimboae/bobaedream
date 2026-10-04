from __future__ import annotations

import argparse
import csv
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]


def absolute_path(value: str) -> Path:
    path = Path(value)
    return path if path.is_absolute() else ROOT / path


def alpha_bbox(image: Image.Image, threshold: int) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value >= threshold else 0).getbbox()
    if bbox is None:
        raise ValueError("no visible pixels above alpha threshold")
    return bbox


def normalize(row: dict[str, str]) -> str:
    source = absolute_path(row["source_file"])
    output = absolute_path(row["output_file"])
    width = int(row["canvas_width"])
    height = int(row["canvas_height"])
    target_width = int(row["target_width"])
    target_height = int(row["target_height"])
    anchor_x = int(row["anchor_x"])
    baseline_y = int(row["baseline_y"])
    threshold = int(row["alpha_threshold"])

    if not source.exists():
        raise FileNotFoundError(source)

    with Image.open(source) as opened:
        image = opened.convert("RGBA")
        crop = image.crop(alpha_bbox(image, threshold))

    scale = min(target_width / crop.width, target_height / crop.height)
    resized = crop.resize(
        (max(1, round(crop.width * scale)), max(1, round(crop.height * scale))),
        Image.Resampling.LANCZOS,
    )
    canvas = Image.new("RGBA", (width, height), (255, 255, 255, 0))
    x = round(anchor_x - resized.width / 2)
    y = baseline_y - resized.height

    if x < 0 or y < 0 or x + resized.width > width or y + resized.height > height:
        raise ValueError(f"normalized asset exceeds canvas: {row['type_code']}")

    canvas.alpha_composite(resized, (x, y))
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output, format="PNG", optimize=True)
    return f"PASS {row['type_code']}: {resized.width}x{resized.height} at ({x},{y})"


def main() -> int:
    parser = argparse.ArgumentParser(description="Normalize approved quick-filter masters deterministically.")
    parser.add_argument("--manifest", required=True, help="CSV manifest path, relative to repository root or absolute")
    args = parser.parse_args()
    manifest = absolute_path(args.manifest)

    failures = 0
    with manifest.open("r", encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            try:
                print(normalize(row))
            except Exception as error:  # report every row before exiting
                failures += 1
                print(f"FAIL {row.get('type_code', 'unknown')}: {error}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())

