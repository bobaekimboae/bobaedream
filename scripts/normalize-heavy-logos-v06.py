from __future__ import annotations

import csv
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
LOGO_DIR = ROOT / "public" / "assets" / "heavy" / "logos"
REPORT_DIR = ROOT / "reports" / "heavy-logo-v06"
CANVAS_SIZE = (120, 120)

SOURCES = (
    ("hyundai", "현대건설기계", "CompaniesLogo", "heavy_hd_hyundai_logo_companieslogo_raw_v06.png", "heavy_hd_hyundai_logo_v06.png"),
    ("develon", "디벨론", "DEVELON 공식", "heavy_develon_logo_official_raw_v06.png", "heavy_develon_logo_v06.png"),
    ("volvo", "볼보CE", "CompaniesLogo", "heavy_volvo_ce_logo_companieslogo_raw_v06.png", "heavy_volvo_ce_logo_v06.png"),
    ("caterpillar", "캐터필러", "CompaniesLogo", "heavy_caterpillar_logo_companieslogo_raw_v06.png", "heavy_caterpillar_logo_v06.png"),
    ("komatsu", "코마츠", "CompaniesLogo", "heavy_komatsu_logo_companieslogo_raw_v06.png", "heavy_komatsu_logo_v06.png"),
    ("hitachi", "히타치", "CompaniesLogo", "heavy_hitachi_cm_logo_companieslogo_raw_v06.png", "heavy_hitachi_cm_logo_v06.png"),
    ("kobelco", "코벨코", "KOBELCO 공식", "heavy_kobelco_logo_official_raster_raw_v06.png", "heavy_kobelco_logo_v06.png"),
    ("bobcat", "밥캣", "Bobcat 공식", "heavy_bobcat_logo_official_raster_raw_v06.png", "heavy_bobcat_logo_v06.png"),
    ("kubota", "구보타", "CompaniesLogo", "heavy_kubota_logo_companieslogo_raw_v06.png", "heavy_kubota_logo_v06.png"),
    ("jcb", "JCB", "JCB 공식", "heavy_jcb_logo_official_raster_raw_v06.png", "heavy_jcb_logo_v06.png"),
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


def prepare(source_name: str) -> tuple[Image.Image, str]:
    source = Image.open(LOGO_DIR / source_name)
    has_transparency = "A" in source.getbands() and source.getchannel("A").getextrema()[0] < 255
    if not has_transparency and source.mode == "P" and "transparency" in source.info:
        has_transparency = True
    source = source.convert("RGBA")
    if not has_transparency:
        source = remove_white_background(source)
    bbox = source.getchannel("A").getbbox()
    if bbox is None:
        raise RuntimeError(f"Logo became empty: {source_name}")
    return source.crop(bbox), "alpha" if has_transparency else "white-removed"


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


def display_size(source: Image.Image, box: int) -> tuple[int, int]:
    ratio = source.width / source.height
    if ratio >= 1.6:
        width = box
        height = round(width / ratio)
    elif ratio > 1.25:
        width = round(box * 0.91)
        height = round(width / ratio)
    elif ratio >= 1:
        width = round(box * 0.825)
        height = round(width / ratio)
    else:
        height = round(box * 0.825)
        width = round(height * ratio)
    return max(1, width), max(1, height)


def normalize() -> None:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    rows = []
    for order, (code, name, source_label, source_name, output_name) in enumerate(SOURCES, start=1):
        source, background = prepare(source_name)
        source_width, source_height = source.size
        size = chotot_target_size(source)
        resized = source.resize(size, Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
        position = ((CANVAS_SIZE[0] - size[0]) // 2, (CANVAS_SIZE[1] - size[1]) // 2)
        canvas.alpha_composite(resized, position)
        canvas.save(LOGO_DIR / output_name, optimize=True)
        mobile = display_size(source, 36)
        pc = display_size(source, 40)
        rows.append(
            {
                "order": order,
                "code": code,
                "name": name,
                "source": source_label,
                "source_file": source_name,
                "output_file": output_name,
                "source_tight_px": f"{source_width}x{source_height}",
                "ratio": f"{source_width / source_height:.2f}",
                "canvas": "120x120",
                "painted_px": f"{size[0]}x{size[1]}",
                "pc_visible_px": f"{pc[0]}x{pc[1]}",
                "mobile_visible_px": f"{mobile[0]}x{mobile[1]}",
                "background": background,
                "status": "applied",
            }
        )
        print(f"{output_name}: {source_width}x{source_height} -> {size[0]}x{size[1]}")

    with (REPORT_DIR / "heavy_logo_manifest_v06.csv").open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    make_comparison(rows)


def ui_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    path = Path("C:/Windows/Fonts/malgunbd.ttf" if bold else "C:/Windows/Fonts/malgun.ttf")
    return ImageFont.truetype(str(path), size) if path.exists() else ImageFont.load_default()


def slot_preview(image: Image.Image, box: int = 36, scale: int = 4) -> Image.Image:
    preview = Image.new("RGBA", (box * scale, box * scale), (255, 255, 255, 255))
    resized = image.convert("RGBA").resize((box * scale, box * scale), Image.Resampling.LANCZOS)
    preview.alpha_composite(resized)
    ImageDraw.Draw(preview).rectangle((0, 0, preview.width - 1, preview.height - 1), outline="#DADADA", width=2)
    return preview.convert("RGB")


def make_comparison(rows: list[dict[str, object]]) -> None:
    columns = 5
    cell_width = 232
    cell_height = 222
    title_height = 96
    sheet = Image.new("RGB", (columns * cell_width, title_height + 4 * cell_height), "#F5F6F8")
    draw = ImageDraw.Draw(sheet)
    draw.text((24, 18), "건설기계 로고 v05 → v06 슬롯 비교", font=ui_font(28, True), fill="#111111")
    draw.text((24, 58), "동일 모바일 36×36 슬롯 · v06은 CompaniesLogo 기본 + 공식 예외", font=ui_font(16), fill="#595959")
    for index, row in enumerate(rows):
        group = index // columns
        column = index % columns
        x = column * cell_width
        base_y = title_height + group * cell_height * 2
        for version_index, version in enumerate(("v05", "v06")):
            y = base_y + version_index * cell_height
            draw.rectangle((x, y, x + cell_width - 1, y + cell_height - 1), fill="white", outline="#DADADA")
            draw.text((x + 16, y + 14), f"{row['name']} · {version}", font=ui_font(16, True), fill="#222222")
            file_name = str(row["output_file"]) if version == "v06" else str(row["output_file"]).replace("_v06.png", "_v05.png")
            logo = Image.open(LOGO_DIR / file_name)
            preview = slot_preview(logo)
            sheet.paste(preview, (x + (cell_width - preview.width) // 2, y + 48))
            if version == "v06":
                draw.text((x + 16, y + 198), str(row["source"]), font=ui_font(13), fill="#595959")
    sheet.save(REPORT_DIR / "heavy_logo_compare_v05_v06.png", optimize=True)


if __name__ == "__main__":
    normalize()
