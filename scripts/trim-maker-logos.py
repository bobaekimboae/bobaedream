"""Create zero-margin maker logos and their v4 display metrics.

The source directory is intentionally read-only. Outputs keep each source file
name and use the visible alpha bounds. Display dimensions preserve aspect ratio,
target a geometric mean of 26 px, and cap at 38 x 26 px.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/assets/maker-model/logos/encar-1005"
OUTPUT = ROOT / "public/assets/maker-model/logos/encar-1005-trim"
METRICS = OUTPUT / "logo-display-v4.json"
ALPHA_THRESHOLD = 16
TARGET_GEOMETRIC_MEAN = 26.0
MAX_WIDTH = 38.0
MAX_HEIGHT = 26.0


def visible_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A")
    visible = alpha.point(lambda value: 255 if value > ALPHA_THRESHOLD else 0)
    return visible.getbbox() or alpha.getbbox() or (0, 0, image.width, image.height)


def display_size(width: int, height: int) -> tuple[float, float]:
    ratio = width / height
    target_width = math.sqrt((TARGET_GEOMETRIC_MEAN**2) * ratio)
    target_height = math.sqrt((TARGET_GEOMETRIC_MEAN**2) / ratio)
    scale = min(1.0, MAX_WIDTH / target_width, MAX_HEIGHT / target_height)
    return round(target_width * scale, 1), round(target_height * scale, 1)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    metrics: dict[str, dict[str, float | int]] = {}

    for source_path in sorted(SOURCE.glob("*.png")):
        with Image.open(source_path) as source_image:
            rgba = source_image.convert("RGBA")
            cropped = rgba.crop(visible_bbox(rgba))
            cropped.save(OUTPUT / source_path.name, optimize=True)

        display_width, display_height = display_size(cropped.width, cropped.height)
        metrics[source_path.name] = {
            "sourceWidth": cropped.width,
            "sourceHeight": cropped.height,
            "displayWidth": display_width,
            "displayHeight": display_height,
        }

    METRICS.write_text(
        json.dumps(metrics, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"trimmed {len(metrics)} logos -> {OUTPUT}")


if __name__ == "__main__":
    main()
