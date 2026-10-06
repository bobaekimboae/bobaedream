from __future__ import annotations

import argparse
import csv
import json
import math
import shutil
from pathlib import Path

from PIL import Image


AUTOHOME_FILES = {
    "BKM001": "Logo_Bike_Japan_Honda.png",
    "BKM003": "Logo_Bike_Germany_BMW.png",
    "BKM004": "Logo_Bike_Japan_Suzuki.png",
    "BKM005": "Logo_Bike_USA_Harley_Davidson.png",
    "BKM008": "Logo_Bike_Italy_Vespa.png",
    "BKM010": "Logo_Bike_Italy_Ducati.png",
    "BKM016": "Logo_Bike_Austria_KTM.png",
    "BKM019": "Logo_Bike_Italy_MV_Agusta.png",
    "BKM030": "Logo_Bike_Italy_Lambretta.png",
    "BKM035": "Logo_Bike_Italy_Moto_Guzzi.png",
    "BKM055": "Logo_Bike_Italy_Aprilia.png",
    "BKM059": "Logo_Bike_Russia_Ural.png",
    "BKM063": "Logo_Bike_Italy_Italjet.png",
    "BKM064": "Logo_Bike_USA_Indian.png",
    "BKM071": "Logo_Bike_Canada_BRP_CanAm.png",
    "BKM078": "Logo_Bike_UK_Triumph.png",
    "BKM079": "Logo_Bike_USA_Polaris.png",
    "BKM080": "Logo_Bike_France_Peugeot.png",
    "BKM082": "Logo_Bike_Italy_Piaggio.png",
    "BKM085": "Logo_Bike_Sweden_Husqvarna.png",
}


def safe_name(maker: dict) -> str:
    english = maker.get("name_en") or "Others"
    slug = "_".join("".join(character if character.isalnum() else " " for character in english).split())
    return f"{maker['code']}_{slug}.png"


def rgba_with_white_removed(source: Path) -> Image.Image:
    image = Image.open(source).convert("RGBA")
    pixels = []
    for red, green, blue, alpha in image.getdata():
        if red >= 247 and green >= 247 and blue >= 247:
            pixels.append((red, green, blue, 0))
        else:
            pixels.append((red, green, blue, alpha))
    image.putdata(pixels)
    return image


def trim(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    box = alpha.getbbox()
    return image.crop(box) if box else image


def display_size(width: int, height: int) -> tuple[float, float]:
    scale = 26 / math.sqrt(width * height)
    display_width = width * scale
    display_height = height * scale
    if display_width > 38:
        scale *= 38 / display_width
        display_width = 38
        display_height = height * scale
    if display_height > 26:
        scale *= 26 / display_height
        display_height = 26
        display_width = width * scale
    return round(display_width, 1), round(display_height, 1)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", type=Path, required=True)
    parser.add_argument("--fallback", type=Path, required=True)
    parser.add_argument("--autohome", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    catalog = json.loads(args.catalog.read_text(encoding="utf-8"))
    makers = [maker for maker in catalog["makers"] if maker.get("visible")]
    args.output.mkdir(parents=True, exist_ok=True)
    originals = args.output / "_original"
    originals.mkdir(exist_ok=True)
    metrics: dict[str, dict[str, float | int]] = {}
    manifest: list[dict[str, str | int]] = []

    for maker in makers:
        code = maker["code"]
        filename = safe_name(maker)
        fallback = next(args.fallback.glob(f"{code}_*.png"), None)
        autohome_name = AUTOHOME_FILES.get(code)
        autohome = args.autohome / autohome_name if autohome_name else None
        source = autohome if autohome and autohome.exists() else fallback
        source_label = "오토홈" if source == autohome else "기존 공식"
        if source is None:
            manifest.append({
                "코드": code, "제조사": maker["name"], "파일명": "", "출처": "없음",
                "원본크기": "", "옛 로고 여부": "미확인", "저해상도 여부": "",
                "비고": "회색 원 + 이니셜 대체",
            })
            continue

        original_image = Image.open(source)
        original_size = f"{original_image.width}x{original_image.height}"
        shutil.copy2(source, originals / filename)
        prepared = rgba_with_white_removed(source) if source_label == "오토홈" else Image.open(source).convert("RGBA")
        prepared = trim(prepared)
        prepared.save(args.output / filename, optimize=True)
        width, height = prepared.size
        display_width, display_height = display_size(width, height)
        metrics[filename] = {
            "sourceWidth": width,
            "sourceHeight": height,
            "displayWidth": display_width,
            "displayHeight": display_height,
        }
        manifest.append({
            "코드": code, "제조사": maker["name"], "파일명": filename, "출처": source_label,
            "원본크기": original_size, "옛 로고 여부": "아니오",
            "저해상도 여부": "예" if source_label == "오토홈" and max(original_image.size) <= 120 else "아니오",
            "비고": "오토홈 3배율 교체 후보" if source_label == "오토홈" and max(original_image.size) <= 120 else "",
        })

    (args.output / "logo-display-bike.json").write_text(json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8")
    with (args.output / "manifest.csv").open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.DictWriter(file, fieldnames=["코드", "제조사", "파일명", "출처", "원본크기", "옛 로고 여부", "저해상도 여부", "비고"])
        writer.writeheader()
        writer.writerows(manifest)


if __name__ == "__main__":
    main()
