#!/usr/bin/env python3
"""Normalize one transparent generation image to the shared 16:10 slot."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


MASTER_SIZE = (1920, 1200)
DELIVERY_SIZE = (960, 600)
SUBJECT_WIDTH_RATIO = 0.89
BOTTOM_GAP_RATIO = 0.06
ALPHA_THRESHOLD = 6


def visible_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    mask = alpha.point(lambda value: 255 if value > ALPHA_THRESHOLD else 0)
    bbox = mask.getbbox()
    if bbox is None:
        raise ValueError("visible subject not found")
    return bbox


def normalize(source: Path, master_path: Path, delivery_path: Path) -> None:
    image = Image.open(source).convert("RGBA")
    crop = image.crop(visible_bbox(image))

    target_width = round(MASTER_SIZE[0] * SUBJECT_WIDTH_RATIO)
    scale = target_width / crop.width
    target_height = round(crop.height * scale)
    crop = crop.resize((target_width, target_height), Image.Resampling.LANCZOS)

    master = Image.new("RGBA", MASTER_SIZE, (0, 0, 0, 0))
    left = round((MASTER_SIZE[0] - target_width) / 2)
    bottom = round(MASTER_SIZE[1] * (1 - BOTTOM_GAP_RATIO))
    top = bottom - target_height
    if top < 0:
        raise ValueError(f"normalized subject exceeds canvas: {target_width}x{target_height}")
    master.alpha_composite(crop, (left, top))

    master_path.parent.mkdir(parents=True, exist_ok=True)
    delivery_path.parent.mkdir(parents=True, exist_ok=True)
    master.save(master_path, optimize=True)
    master.resize(DELIVERY_SIZE, Image.Resampling.LANCZOS).save(delivery_path, optimize=True)

    master_bbox = visible_bbox(master)
    delivery_bbox = visible_bbox(Image.open(delivery_path).convert("RGBA"))
    print(
        f"{delivery_path.name}: master={master.size} bbox={master_bbox} "
        f"delivery={DELIVERY_SIZE} bbox={delivery_bbox}"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("master", type=Path)
    parser.add_argument("delivery", type=Path)
    args = parser.parse_args()
    normalize(args.source, args.master, args.delivery)


if __name__ == "__main__":
    main()
