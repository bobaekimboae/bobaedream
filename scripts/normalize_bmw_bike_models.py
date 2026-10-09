from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


REPO = Path(__file__).resolve().parents[1]
GENERATED = Path(r"C:\Users\bobae\.codex\generated_images\01a0f512-065a-7300-9ce1-d86601ce6384")
OUTPUT = REPO / "public/assets/bike/models/bmw"
REPORT = REPO / "reports/bmw-bike-models-1009"

MODELS = [
    ("BKM003-0001", "S 1000 RR", "BMW-8451-s1000rr-autoscout-side-v01.png", "exec-14988595-e7fd-40c6-a995-b3406ae068f6.png"),
    ("BKM003-0002", "G 310 R", "BMW-8371-g310r-autoscout-side-v01.png", "exec-b58073b3-e84d-419b-a971-6d12dd3441ac.png"),
    ("BKM003-0003", "S 1000 R", "BMW-8450-s1000r-autoscout-side-v01.png", "exec-9698cc97-c28a-4e79-9b13-9e0635615a95.png"),
    ("BKM003-0004", "G 310 GS", "BMW-8370-g310gs-autoscout-side-v01.png", "exec-8463e489-db82-4f93-9aea-a6086a0aca2d.png"),
    ("BKM003-0005", "R nine T", "BMW-13033-rninet-autoscout-side-v01.png", "exec-4ecf8070-3fbd-4845-82ef-3eb7971780a7.png"),
    ("BKM003-0006", "C 400 GT", "BMW-8347-c400gt-autoscout-side-v01.png", "exec-a89f8013-55c4-4f86-aeac-3dea21c58933.png"),
    ("BKM003-0007", "F 900 XR", "BMW-8369-f900xr-autoscout-side-v01.png", "exec-8b748e37-b625-42bf-a9ae-59d2082a9cb4.png"),
    ("BKM003-0008", "F 900 R", "BMW-10886-f900r-autoscout-side-v01.png", "exec-a977f673-b8f4-43e3-9147-152622ba4a3b.png"),
    ("BKM003-0009", "R 18", "BMW-8433-r18-autoscout-side-v01.png", "exec-d21eed65-11a3-4713-8c9f-d4d8696c3b09.png"),
    ("BKM003-0010", "S 1000 XR", "BMW-8452-s1000xr-autoscout-side-v01.png", "exec-095d3048-5c88-4e34-8f10-5a0f5941f090.png"),
]


def alpha_bbox(image: Image.Image, threshold: int = 8) -> tuple[int, int, int, int]:
    alpha = image.getchannel("A").point(lambda value: 255 if value > threshold else 0)
    bbox = alpha.getbbox()
    if bbox is None:
        raise ValueError("empty alpha image")
    return bbox


def normalize(source: Path, destination: Path) -> dict[str, float | int | str]:
    image = Image.open(source).convert("RGBA")
    bbox = alpha_bbox(image)
    cropped = image.crop(bbox)

    canvas_width, canvas_height = 960, 600
    target_width, max_height = 864, 528
    scale = min(target_width / cropped.width, max_height / cropped.height)
    resized = cropped.resize(
        (round(cropped.width * scale), round(cropped.height * scale)),
        Image.Resampling.LANCZOS,
    )

    canvas = Image.new("RGBA", (canvas_width, canvas_height), (0, 0, 0, 0))
    x = round((canvas_width - resized.width) / 2)
    y = 564 - resized.height
    canvas.alpha_composite(resized, (x, y))
    destination.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(destination, optimize=True)

    placed_bbox = alpha_bbox(canvas)
    return {
        "source": source.name,
        "file": destination.name,
        "widthPercent": round((placed_bbox[2] - placed_bbox[0]) / canvas_width * 100, 2),
        "bottomGapPercent": round((canvas_height - placed_bbox[3]) / canvas_height * 100, 2),
        "centerOffsetPercent": round((((placed_bbox[0] + placed_bbox[2]) / 2) - canvas_width / 2) / canvas_width * 100, 2),
        "canvasWidth": canvas_width,
        "canvasHeight": canvas_height,
    }


def make_contact_sheet(entries: list[dict[str, object]]) -> None:
    sheet = Image.new("RGB", (1000, 1360), "white")
    draw = ImageDraw.Draw(sheet)
    try:
        title_font = ImageFont.truetype("arial.ttf", 26)
        label_font = ImageFont.truetype("arial.ttf", 19)
    except OSError:
        title_font = ImageFont.load_default()
        label_font = ImageFont.load_default()
    draw.text((36, 24), "BMW Motorrad model images · 10", fill="#111111", font=title_font)
    for index, entry in enumerate(entries):
        column = index % 2
        row = index // 2
        x = 24 + column * 488
        y = 74 + row * 252
        draw.rounded_rectangle((x, y, x + 464, y + 232), radius=12, fill="#F7F8FA", outline="#E5E7EB")
        image = Image.open(OUTPUT / str(entry["file"])).convert("RGBA")
        image.thumbnail((432, 174), Image.Resampling.LANCZOS)
        sheet.paste(image, (x + (464 - image.width) // 2, y + 16), image)
        draw.text((x + 18, y + 194), f"{index + 1}. {entry['name']}", fill="#222222", font=label_font)
        draw.text((x + 18, y + 216), f"{entry['widthPercent']}% · bottom {entry['bottomGapPercent']}%", fill="#7A828C", font=label_font)
    REPORT.mkdir(parents=True, exist_ok=True)
    sheet.save(REPORT / "bmw-bike-models-10-contact-sheet.png", quality=94)


def main() -> None:
    entries: list[dict[str, object]] = []
    for code, name, filename, source_name in MODELS:
        metrics = normalize(GENERATED / source_name, OUTPUT / filename)
        entries.append({"code": code, "name": name, **metrics})
    manifest = {
        "version": "v01",
        "style": "AutoScout24 neutral catalog tone; strict left-facing side profile",
        "canvas": "960x600 transparent PNG",
        "models": entries,
    }
    (OUTPUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    make_contact_sheet(entries)
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
