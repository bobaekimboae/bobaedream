from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
LOGO_DIR = ROOT / "public" / "assets" / "heavy" / "logos"
CANVAS_SIZE = (120, 120)

SOURCES = (
    ("heavy_hd_hyundai_logo_tiejia_raw_v04.png", "heavy_hd_hyundai_logo_v05.png", "remove_white"),
    ("heavy_develon_logo_tiejia_raw_v04.jpg", "heavy_develon_logo_v05.png", "remove_white"),
    ("heavy_volvo_ce_logo_tiejia_raw_v04.png", "heavy_volvo_ce_logo_v05.png", "remove_white"),
    ("heavy_caterpillar_logo_tiejia_raw_v04.png", "heavy_caterpillar_logo_v05.png", "remove_white"),
    ("heavy_komatsu_logo_tiejia_raw_v04.png", "heavy_komatsu_logo_v05.png", "remove_white"),
    ("heavy_hitachi_cm_logo_tiejia_raw_v04.jpg", "heavy_hitachi_cm_logo_v05.png", "hitachi_wordmark"),
    ("heavy_kobelco_logo_tiejia_raw_v04.png", "heavy_kobelco_logo_v05.png", "remove_white"),
    ("heavy_bobcat_logo_tiejia_raw_v04.gif", "heavy_bobcat_logo_v05.png", "remove_white"),
    ("heavy_kubota_logo_tiejia_raw_v04.png", "heavy_kubota_logo_v05.png", "remove_white"),
    ("heavy_jcb_logo_tiejia_raw_v04.jpg", "heavy_jcb_logo_v05.png", "jcb_badge"),
)


def remove_white_background(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    output = []
    for red, green, blue, alpha in image.get_flattened_data():
        distance = max(255 - red, 255 - green, 255 - blue)
        coverage = max(0.0, min(1.0, (distance - 4) / 36))
        output.append((red, green, blue, round(alpha * coverage)))
    image.putdata(output)
    return image


def prepare(source_name: str, mode: str) -> Image.Image:
    source = Image.open(LOGO_DIR / source_name).convert("RGBA")
    if mode == "hitachi_wordmark":
        source = source.crop((0, 0, round(source.width * 0.43), round(source.height * 0.62)))
        source = remove_white_background(source)
    elif mode == "jcb_badge":
        source = source.crop((round(source.width * 0.05), round(source.height * 0.12), round(source.width * 0.95), round(source.height * 0.88)))
    else:
        source = remove_white_background(source)

    bbox = source.getchannel("A").getbbox()
    if bbox is None:
        raise RuntimeError(f"Logo became empty: {source_name}")
    return source.crop(bbox)


def chotot_target_size(source: Image.Image) -> tuple[int, int]:
    ratio = source.width / source.height
    if ratio >= 1.6:
        width = CANVAS_SIZE[0]
        height = round(width / ratio)
    elif ratio > 1.25:
        width = round(CANVAS_SIZE[0] * 0.91)
        height = round(width / ratio)
    elif ratio >= 1:
        width = round(CANVAS_SIZE[0] * 0.825)
        height = round(width / ratio)
    else:
        height = round(CANVAS_SIZE[1] * 0.825)
        width = round(height * ratio)
    return max(1, width), max(1, height)


def normalize(source_name: str, output_name: str, mode: str) -> None:
    source = prepare(source_name, mode)
    size = chotot_target_size(source)
    source = source.resize(size, Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    position = ((CANVAS_SIZE[0] - size[0]) // 2, (CANVAS_SIZE[1] - size[1]) // 2)
    canvas.alpha_composite(source, position)
    canvas.save(LOGO_DIR / output_name, optimize=True)
    print(f"{output_name}: {source.width}x{source.height}")


if __name__ == "__main__":
    for source_name, output_name, mode in SOURCES:
        normalize(source_name, output_name, mode)
