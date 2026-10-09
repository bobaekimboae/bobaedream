from __future__ import annotations

import argparse
import csv
import json
import math
import shutil
from pathlib import Path

from PIL import Image


FILES = {
    "BKM001": ("BKM001_Honda.png", "https://files.cdn.reitwagen.co.kr/honda_c3a31dcce1/honda_c3a31dcce1.png"),
    "BKM002": ("BKM002_Yamaha.png", "https://files.cdn.reitwagen.co.kr/yamaha_f758c3809d/yamaha_f758c3809d.png"),
    "BKM003": ("BKM003_BMW_Motorrad.png", "https://files.cdn.reitwagen.co.kr/bmw_4c21c75e9c/bmw_4c21c75e9c.png"),
    "BKM004": ("BKM004_Suzuki.png", "https://files.cdn.reitwagen.co.kr/suzuki_3c366ecf1e/suzuki_3c366ecf1e.png"),
    "BKM005": ("BKM005_Harley_Davidson.png", "https://files.cdn.reitwagen.co.kr/harleydavison_c8d74bed84/harleydavison_c8d74bed84.png"),
    "BKM006": ("BKM006_Kawasaki.png", "https://files.cdn.reitwagen.co.kr/kawasaki_4fdca68757/kawasaki_4fdca68757.png"),
    "BKM007": ("BKM007_SYM.png", "https://files.cdn.reitwagen.co.kr/sym_b933698e94/sym_b933698e94.png"),
    "BKM008": ("BKM008_Vespa.png", "https://files.cdn.reitwagen.co.kr/vespa_4f3051d019/vespa_4f3051d019.png"),
    "BKM009": ("BKM009_Royal_Enfield.png", "https://files.cdn.reitwagen.co.kr/royalenfield_a449e5e210/royalenfield_a449e5e210.png"),
    "BKM010": ("BKM010_Ducati.png", "https://files.cdn.reitwagen.co.kr/_5b8d2f655f/_5b8d2f655f.png"),
}


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

    for code, (filename, source_url) in FILES.items():
        source = args.source / filename
        if not source.exists():
            raise FileNotFoundError(source)
        shutil.copy2(source, originals / filename)
        image = Image.open(source).convert("RGBA")
        alpha_box = image.getchannel("A").getbbox()
        prepared = image.crop(alpha_box) if alpha_box else image
        prepared.save(args.output / filename, optimize=True)
        display_width, display_height = display_size(*prepared.size)
        metrics[filename] = {
            "sourceWidth": prepared.width,
            "sourceHeight": prepared.height,
            "displayWidth": display_width,
            "displayHeight": display_height,
        }
        rows.append({
            "code": code,
            "file": filename,
            "originalWidth": image.width,
            "originalHeight": image.height,
            "trimWidth": prepared.width,
            "trimHeight": prepared.height,
            "ratio": round(prepared.width / prepared.height, 4),
            "displayWidth": display_width,
            "displayHeight": display_height,
            "source": "라이트바겐 공식",
            "sourceUrl": source_url,
        })

    (args.output / "logo-display-lightwagen.json").write_text(
        json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    with (args.output / "manifest.csv").open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.DictWriter(file, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)


if __name__ == "__main__":
    main()
