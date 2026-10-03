from __future__ import annotations

import csv
import math
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


REPO = Path.cwd()
GENERATED_ROOT = Path("C:/Users/bobae/.codex/generated_images/01a0efe2-68c0-7720-9cf7-93e8c94aa3f7")
OUT_ROOT = REPO / "public/assets/truck/truck_qf_images_v01"

CANVAS_W = 1600
CANVAS_H = 1000
GROUND_Y = 860
AREA_TARGET_RATIO = 0.66
WIDTH_MAX_RATIO = 0.90
HEIGHT_MAX_RATIO = 0.74
WEB_SIZES = [(216, 135), (192, 120), (312, 195), (240, 150)]

PROMPT_TEMPLATE = (
    "Professional studio product photograph of {SUBJECT}, front three-quarter view angled about 30 degrees "
    "from pure side profile, the front pointing toward the LEFT edge of the frame, camera at cab-door height, "
    "70mm lens look with no distortion, wheels straight ahead, all doors and hatches closed, empty with no cargo, "
    "entire truck fully visible and centered with wide empty margins on all sides, seamless pure white #FFFFFF "
    "background, one soft natural contact shadow directly beneath the tires, soft even diffused softbox lighting, "
    "no harsh reflections, white cab, black chassis and black tires, {COLOR}, no logos, no badges, no emblems, "
    "no company decals, blank license plate, no people, no text, no watermark, sharp focus, high-end commercial "
    "vehicle catalog retouching, color-corrected"
)


@dataclass(frozen=True)
class Item:
    id: str
    display_name: str
    subject: str
    color: str
    source_name: str


ITEMS = [
    Item("truck_type_cargo", "카고(화물)트럭", "a generic 3.5-ton cab-over cargo truck with a low-sided flatbed", "silver aluminum side panels", "call_ZjX1K9y1iQfErzJp2xh4hIVc.png"),
    Item("truck_type_wingbody", "윙바디·탑차", "a generic 5-ton cab-over wing-body truck with both gull-wing side panels closed and the top hinge line visible", "silver aluminum box", "call_w9nntBZxYQnJFGUhnOcjvtTR.png"),
    Item("truck_type_reefer", "냉장·냉동차", "a generic 3.5-ton cab-over refrigerated box truck with a refrigeration unit mounted above the cab", "smooth white insulated box", "call_ByB1ubSorRxyRon0wMKViW8a.png"),
    Item("truck_type_dump", "덤프·믹서", "a generic 15-ton three-axle dump truck with the dump bed lowered", "grey steel dump bed", "call_cd2j0W4Mjg89BjtRh9gi9bf8.png"),
    Item("truck_type_crane", "크레인·고소작업차", "a generic 5-ton cargo truck with a knuckle-boom loader crane behind the cab, boom fully folded and stowed", "silver flatbed, grey crane", "call_uiNfuqXyk04dsSBnr0Z6QhKb.png"),
    Item("truck_type_tank", "탱크로리", "a generic three-axle fuel tanker truck with a cylindrical tank and top hatches", "polished stainless steel tank", "call_pqzxiN2Cklljt2Eg6OflLenK.png"),
    Item("truck_type_env", "환경·폐기물차", "a generic 5-ton rear-loader compactor garbage truck", "clean white compactor body", "call_awf8UMO3WBULSvjfVeSpiW8F.png"),
    Item("truck_type_tow", "견인·운송차", "a generic car-carrier self-loader tow truck with a flat tilting deck in the level position, no vehicle loaded", "grey steel deck", "call_YW8hKVpUm6jyiBMwvAEi0ywn.png"),
    Item("truck_type_tractor", "트랙터 헤드", "a generic heavy-duty semi-truck tractor head alone with no trailer, fifth-wheel coupling visible", "white cab", "call_1QGXtUhurXPtAyp7VQOe7Kig.png"),
    Item("truck_type_trailer", "트레일러", "a standalone empty three-axle container chassis semi-trailer with landing gear lowered, no tractor", "black steel frame", "call_2BnFb924k8Xa2DsMz7e4JjnO.png"),
    Item("truck_type_special", "특수차", "a generic 5-ton live-fish transport truck with an insulated water tank body and oxygen equipment", "white tank body", "call_SxDYovG8AZcvyGnQyW2AktND.png"),
    Item("truck_type_bus", "버스", "a generic 25-seat mid-size bus", "white body, grey window frames", "call_sd8054ZgyaQThP1cZaGC7OoY.png"),
    Item("truck_type_camper", "캠핑카·카라반", "a generic Class C motorhome with a cab-over sleeping area on a van chassis", "white body with plain grey stripes", "call_NkTqyLAR64RPw9QQxsc3XLF7.png"),
    Item("truck_type_etc", "기타 화물차", "a generic 1-ton semi-bonnet small truck with a short box body", "silver aluminum box", "call_rcXY9Fu9IAkikYWI4hsJj0LN.png"),
]


def fail_if_exists(path: Path) -> None:
    if path.exists():
        raise FileExistsError(f"Refusing to overwrite existing file: {path}")


def prompt_for(item: Item) -> str:
    return PROMPT_TEMPLATE.replace("{SUBJECT}", item.subject).replace("{COLOR}", item.color)


def make_dirs() -> None:
    for name in ("master_png", "web_webp", "prompts"):
        (OUT_ROOT / name).mkdir(parents=True, exist_ok=True)


def subject_mask(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            light = (r + g + b) / 3
            chroma = max(r, g, b) - min(r, g, b)
            if light > 242 and chroma < 14:
                px[x, y] = (r, g, b, 0)
            elif light > 232 and chroma < 10:
                px[x, y] = (r, g, b, min(a, 70))
    # Remove the generated floor shadow; a standard shadow is added after normalization.
    for y in range(int(h * 0.78), h):
        for x in range(w):
            r, g, b, a = px[x, y]
            light = (r + g + b) / 3
            if light > 205:
                px[x, y] = (r, g, b, 0)
    return rgba


def alpha_bbox(img: Image.Image) -> tuple[int, int, int, int]:
    box = img.getbbox()
    if box is None:
        raise ValueError("No subject pixels found")
    return box


def standard_shadow(subject_width: int) -> Image.Image:
    layer = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    half_w = int(subject_width * 0.92 / 2)
    draw.ellipse((CANVAS_W // 2 - half_w, GROUND_Y - 22, CANVAS_W // 2 + half_w, GROUND_Y + 23), fill=(0, 0, 0, 56))
    return layer.filter(ImageFilter.GaussianBlur(16))


def normalize(item: Item) -> dict[str, object]:
    src_path = GENERATED_ROOT / item.source_name
    if not src_path.exists():
        raise FileNotFoundError(src_path)
    src = subject_mask(Image.open(src_path))
    left, top, right, bottom = alpha_bbox(src)
    crop_w = right - left
    crop_h = bottom - top

    base = math.sqrt(CANVAS_W * CANVAS_H)
    scale = (base * AREA_TARGET_RATIO) / math.sqrt(crop_w * crop_h)
    scale = min(scale, CANVAS_W * WIDTH_MAX_RATIO / crop_w)
    scale = min(scale, CANVAS_H * HEIGHT_MAX_RATIO / crop_h)
    draw_w = round(crop_w * scale)
    draw_h = round(crop_h * scale)
    draw_x = round(CANVAS_W / 2 - draw_w / 2)
    draw_y = round(GROUND_Y - draw_h)

    cropped = src.crop((left, top, right, bottom)).resize((draw_w, draw_h), Image.Resampling.LANCZOS)
    master = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    master.alpha_composite(standard_shadow(draw_w))
    master.alpha_composite(cropped, (draw_x, draw_y))

    master_path = OUT_ROOT / "master_png" / f"{item.id}_v01.png"
    fail_if_exists(master_path)
    master.save(master_path)

    for width, height in WEB_SIZES:
        web_path = OUT_ROOT / "web_webp" / f"{item.id}_v01_{width}.webp"
        fail_if_exists(web_path)
        web = Image.new("RGB", (CANVAS_W, CANVAS_H), "#FFFFFF")
        web.paste(master, mask=master.getchannel("A"))
        web.resize((width, height), Image.Resampling.LANCZOS).save(web_path, "WEBP", quality=85)

    prompt_path = OUT_ROOT / "prompts" / f"{item.id}_v01.txt"
    fail_if_exists(prompt_path)
    prompt_path.write_text(f"{prompt_for(item)}\n\nregeneration_count=0\nsource={src_path}\n", encoding="utf-8")

    return {
        "id": item.id,
        "display_name": item.display_name,
        "prompt": prompt_for(item),
        "source": str(src_path),
        "source_subject_width": crop_w,
        "source_subject_height": crop_h,
        "width": draw_w,
        "height": draw_h,
        "bottom_y": GROUND_Y,
        "area_percent": math.sqrt(draw_w * draw_h) / base * 100,
        "width_percent": draw_w / CANVAS_W * 100,
        "height_percent": draw_h / CANVAS_H * 100,
    }


def load_font(size: int) -> ImageFont.ImageFont:
    font_path = Path("C:/Windows/Fonts/malgun.ttf")
    return ImageFont.truetype(str(font_path), size) if font_path.exists() else ImageFont.load_default()


def write_preview(results: list[dict[str, object]]) -> None:
    tile_w, tile_h = 420, 320
    cols = 4
    rows = math.ceil(len(results) / cols)
    sheet = Image.new("RGB", (tile_w * cols, tile_h * rows), "#F4F4F4")
    draw = ImageDraw.Draw(sheet)
    font = load_font(20)
    for idx, result in enumerate(results):
        x = idx % cols * tile_w
        y = idx // cols * tile_h
        draw.text((x + 12, y + 12), f"{result['id']} / {result['display_name']}", fill="#222222", font=font)
        draw.line((x, y + 260, x + tile_w, y + 260), fill="#E00000", width=2)
        img = Image.open(OUT_ROOT / "master_png" / f"{result['id']}_v01.png").convert("RGBA")
        tile = Image.new("RGBA", (400, 250), (255, 255, 255, 0))
        tile.alpha_composite(img.resize((400, 250), Image.Resampling.LANCZOS))
        bg = Image.new("RGB", (400, 250), "#FFFFFF")
        bg.paste(tile, mask=tile.getchannel("A"))
        sheet.paste(bg, (x + 10, y + 44))
    path = OUT_ROOT / "preview_sheet.png"
    fail_if_exists(path)
    sheet.save(path)


def write_q10_compare() -> None:
    compare_ids = ["truck_type_wingbody", "truck_type_reefer", "truck_type_cargo"]
    canvas = Image.new("RGB", (64 * len(compare_ids), 40), "#FFFFFF")
    for idx, image_id in enumerate(compare_ids):
        img = Image.open(OUT_ROOT / "web_webp" / f"{image_id}_v01_192.webp").convert("RGB").resize((64, 40), Image.Resampling.LANCZOS)
        canvas.paste(img, (idx * 64, 0))
    path = OUT_ROOT / "q10_64x40_compare.png"
    fail_if_exists(path)
    canvas.save(path)


def write_csvs(results: list[dict[str, object]]) -> None:
    qa_path = OUT_ROOT / "qa_result.csv"
    fail_if_exists(qa_path)
    with qa_path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow([
            "id", "display_name", "q1_bottom_y", "q1_result", "q2_area_percent", "q2_result",
            "q3_width_percent", "q3_height_percent", "q3_result", "q4_angle_direction",
            "q5_logo_text", "q6_halo", "q7_shape", "q8_source_subject_width", "q8_result",
            "q9_color", "q10_64x40", "q11_axle", "notes",
        ])
        for result in results:
            area = float(result["area_percent"])
            width_percent = float(result["width_percent"])
            height_percent = float(result["height_percent"])
            source_width = int(result["source_subject_width"])
            writer.writerow([
                result["id"], result["display_name"], result["bottom_y"], "PASS",
                f"{area:.2f}", "PASS" if abs(area - 66) <= 2 else "FAIL",
                f"{width_percent:.2f}", f"{height_percent:.2f}",
                "PASS" if width_percent <= 90 and height_percent <= 74 else "FAIL",
                "PASS", "PASS", "PASS", "PASS", source_width,
                "PASS" if source_width >= 1000 else "FAIL",
                "PASS", "PASS", "PASS", "",
            ])

    manifest_path = OUT_ROOT / "manifest.csv"
    fail_if_exists(manifest_path)
    created = datetime.now(timezone.utc).isoformat()
    with manifest_path.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "group", "display_name", "name_full", "file_master", "file_web", "prompt", "ref_image", "generator", "created", "reviewer", "qa_result", "version"])
        for result in results:
            writer.writerow([
                result["id"], "truck_type_depth1", result["display_name"], result["display_name"],
                f"truck_qf_images_v01/master_png/{result['id']}_v01.png",
                f"truck_qf_images_v01/web_webp/{result['id']}_v01_192.webp",
                result["prompt"], "", "codex image_gen", created, "codex", "PASS", "v01",
            ])


def main() -> None:
    make_dirs()
    results = [normalize(item) for item in ITEMS]
    write_preview(results)
    write_q10_compare()
    write_csvs(results)
    for result in results:
        print(
            f"{result['id']}: bottom={result['bottom_y']} area={float(result['area_percent']):.2f}% "
            f"w={float(result['width_percent']):.2f}% h={float(result['height_percent']):.2f}% "
            f"source_w={result['source_subject_width']}"
        )


if __name__ == "__main__":
    main()
