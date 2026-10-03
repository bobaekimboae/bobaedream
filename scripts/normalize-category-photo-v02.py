from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


CANVAS = (640, 400)
BASELINE = 340
TARGETS = {
    "mustang": (598, 252, "vehicle_type_old_car_v02.png"),
    "porter": (597, 279, "vehicle_type_cargo_truck_v03.png"),
}


def normalize(source: Path, target_size: tuple[int, int], destination: Path) -> None:
    image = Image.open(source).convert("RGBA")
    alpha = image.getchannel("A")
    alpha = alpha.point(lambda value: 0 if value <= 32 else value)
    image.putalpha(alpha)
    bbox = alpha.getbbox()
    if not bbox:
        raise ValueError(f"no visible pixels: {source}")
    cutout = image.crop(bbox)
    target_width, target_height = target_size
    scale = min(target_width / cutout.width, target_height / cutout.height)
    resized = cutout.resize(
        (max(1, round(cutout.width * scale)), max(1, round(cutout.height * scale))),
        Image.Resampling.LANCZOS,
    )
    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    x = (CANVAS[0] - resized.width) // 2
    y = BASELINE - resized.height
    canvas.alpha_composite(resized, (x, y))
    canvas.save(destination, optimize=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mustang", type=Path, required=True)
    parser.add_argument("--porter", type=Path, required=True)
    parser.add_argument("--out-dir", type=Path, default=Path("public/assets/category-photo"))
    args = parser.parse_args()
    args.out_dir.mkdir(parents=True, exist_ok=True)
    for key, source in (("mustang", args.mustang), ("porter", args.porter)):
        width, height, filename = TARGETS[key]
        normalize(source, (width, height), args.out_dir / filename)
        print(args.out_dir / filename)


if __name__ == "__main__":
    main()
