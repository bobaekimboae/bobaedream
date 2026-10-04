from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSET_ROOT = ROOT / "public" / "assets" / "heavy" / "pilot" / "angle-comparison-v01"
MASTER_ROOT = ASSET_ROOT / "master"
WEB_ROOT = ASSET_ROOT / "web"

TYPES = [
    ("bulldozer", "불도저"),
    ("excavator", "굴착기"),
    ("loader", "로더"),
    ("forklift", "지게차"),
    ("scraper", "스크레이퍼"),
]

CANVAS = (512, 320)
SAFE_WIDTH = 448
SAFE_HEIGHT = 224
BASELINE = 262


def alpha_bbox(image: Image.Image) -> tuple[int, int, int, int]:
    rgba = image.convert("RGBA")
    alpha = rgba.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value >= 12 else 0).getbbox()
    if bbox is None:
        raise ValueError("image has no visible pixels")
    return bbox


def normalize_pair(slug: str) -> None:
    sources = {}
    bboxes = {}
    for angle in ("side", "angle"):
        path = MASTER_ROOT / f"heavy_{slug}_{angle}_master_v01.png"
        image = Image.open(path).convert("RGBA")
        bbox = alpha_bbox(image)
        sources[angle] = image.crop(bbox)
        bboxes[angle] = bbox

    max_width = max(image.width for image in sources.values())
    max_height = max(image.height for image in sources.values())
    scale = min(SAFE_WIDTH / max_width, SAFE_HEIGHT / max_height)

    for angle, image in sources.items():
        resized = image.resize(
            (max(1, round(image.width * scale)), max(1, round(image.height * scale))),
            Image.Resampling.LANCZOS,
        )
        canvas = Image.new("RGBA", CANVAS, (255, 255, 255, 0))
        x = round((CANVAS[0] - resized.width) / 2)
        y = BASELINE - resized.height
        canvas.alpha_composite(resized, (x, y))
        canvas.save(WEB_ROOT / f"heavy_{slug}_{angle}_v01.png", optimize=True)


def make_contact_sheet() -> None:
    width = 1200
    row_height = 260
    header_height = 108
    sheet = Image.new("RGB", (width, header_height + row_height * len(TYPES)), "white")
    draw = ImageDraw.Draw(sheet)
    try:
        title_font = ImageFont.truetype("C:/Windows/Fonts/malgunbd.ttf", 34)
        label_font = ImageFont.truetype("C:/Windows/Fonts/malgunbd.ttf", 25)
        meta_font = ImageFont.truetype("C:/Windows/Fonts/malgun.ttf", 20)
    except OSError:
        title_font = label_font = meta_font = ImageFont.load_default()

    draw.text((32, 24), "건설기계 5종 — 정측면 A / 3·4 각도 B", fill="#171717", font=title_font)
    draw.text((488, 76), "A  좌향 90° 정측면", fill="#555555", font=meta_font, anchor="mm")
    draw.text((916, 76), "B  좌향 3/4 각도", fill="#555555", font=meta_font, anchor="mm")

    for index, (slug, label) in enumerate(TYPES):
        top = header_height + index * row_height
        if index:
            draw.line((32, top, width - 32, top), fill="#E8E8E8", width=1)
        draw.text((32, top + 106), label, fill="#222222", font=label_font)
        for column, angle in enumerate(("side", "angle")):
            image = Image.open(WEB_ROOT / f"heavy_{slug}_{angle}_v01.png").convert("RGBA")
            image.thumbnail((420, 220), Image.Resampling.LANCZOS)
            x = 260 + column * 428 + (420 - image.width) // 2
            y = top + 24 + (220 - image.height) // 2
            sheet.paste(image, (x, y), image)

    sheet.save(ASSET_ROOT / "heavy_angle_comparison_contact_v01.jpg", quality=92, optimize=True)


def main() -> None:
    WEB_ROOT.mkdir(parents=True, exist_ok=True)
    for slug, _label in TYPES:
        normalize_pair(slug)
    make_contact_sheet()


if __name__ == "__main__":
    main()
