#!/usr/bin/env python3
"""Build normalized vehicle logos and generation WebP assets.

The public catalog only references generated local assets. Source URLs and audit
notes are written under reports/, which is not published by Vite/GitHub Pages.
"""

from __future__ import annotations

import csv
import io
import json
import os
import re
import unicodedata
import urllib.request
import zipfile
from pathlib import Path

from PIL import Image


DEFAULT_SOURCE = Path(r"C:\Users\bobae\Downloads\Claude outputs\codex_encar_1004")
SOURCE_ROOT = Path(os.environ.get("VEHICLE_CATALOG_SOURCE", DEFAULT_SOURCE))
GENERATION_IMAGE_ROOT = Path(
    os.environ.get("VEHICLE_GENERATION_IMAGES", SOURCE_ROOT.parent / "gen_images")
)
REPO_ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ROOT = REPO_ROOT / "public" / "assets" / "vehicle-catalog"
REPORT_ROOT = REPO_ROOT / "reports" / "vehicle-catalog"
ZIP_PATH = SOURCE_ROOT / "bbcat_admin_src_1004.zip"
MANUFACTURERS_PATH = SOURCE_ROOT / "catalog_fill_manufacturers_1004.csv"
IMAGE_JOBS_PATH = SOURCE_ROOT / "car_generation_image_jobs_1004.csv"

KGM_OFFICIAL_IMAGE = (
    "https://www.kg-mobility.com/images/cm/img-cm-about-logoslogan.png"
)
KGM_OFFICIAL_PAGE = "https://www.kg-mobility.com/"
RENAULT_OFFICIAL_PAGE = "https://cdn.renault.co.kr/ko/main/main.jsp"
AUTOHOME_SOURCE = "https://www.autohome.com.cn/"

PLACEHOLDER_MAKES = {"기타 제조사", "사이언", "기타 수입차"}
USER_MANAGED_MAKES = {"KG모빌리티(쌍용)"}


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).lower().replace("&", " and ")
    slug = re.sub(r"[^a-z0-9]+", "-", normalized).strip("-")
    if not slug:
        raise ValueError(f"영문 로고 파일명을 만들 수 없습니다: {value}")
    return slug


def open_image(data: bytes) -> Image.Image:
    image = Image.open(io.BytesIO(data))
    image.load()
    return image.convert("RGBA")


def visible_bbox(image: Image.Image) -> tuple[int, int, int, int] | None:
    alpha = image.getchannel("A")
    return alpha.point(lambda value: 255 if value > 8 else 0).getbbox()


def normalize_logo(image: Image.Image, canvas: int = 256, content: int = 192) -> Image.Image:
    bbox = visible_bbox(image)
    if not bbox:
        raise ValueError("투명하지 않은 로고 픽셀이 없습니다")
    cropped = image.crop(bbox)
    scale = min(content / cropped.width, content / cropped.height)
    size = (
        max(1, round(cropped.width * scale)),
        max(1, round(cropped.height * scale)),
    )
    resized = cropped.resize(size, Image.Resampling.LANCZOS)
    output = Image.new("RGBA", (canvas, canvas), (255, 255, 255, 0))
    output.alpha_composite(resized, ((canvas - size[0]) // 2, (canvas - size[1]) // 2))
    return output


def fetch_image(url: str) -> Image.Image:
    request = urllib.request.Request(url, headers={"User-Agent": "bobaedream-catalog-builder/1.0"})
    with urllib.request.urlopen(request, timeout=20) as response:
        return open_image(response.read())


def build_logos() -> dict[str, object]:
    manufacturers = read_csv(MANUFACTURERS_PATH)
    english_by_name = {
        row["제조사(엔카 원문)"]: row["영문명"] or row["제조사(엔카 원문)"]
        for row in manufacturers
    }

    with zipfile.ZipFile(ZIP_PATH) as archive:
        manifest_name = next(
            name for name in archive.namelist() if name.endswith("logos_autohome.json")
        )
        autohome_rows = json.loads(archive.read(manifest_name))
        by_name = {row[0]: row for row in autohome_rows}

        logo_dir = PUBLIC_ROOT / "logos"
        logo_dir.mkdir(parents=True, exist_ok=True)
        REPORT_ROOT.mkdir(parents=True, exist_ok=True)

        audit_rows: list[dict[str, str]] = []
        generated = 0
        official_overrides = 0
        fallback_overrides: list[str] = []

        for row in manufacturers:
            name = row["제조사(엔카 원문)"]
            filename = f"logo_{slugify(english_by_name[name])}.png"
            source = ""
            memo = ""
            output_path = logo_dir / filename

            if name in PLACEHOLDER_MAKES or name in USER_MANAGED_MAKES:
                filename = ""
                if name in USER_MANAGED_MAKES:
                    source = "사용자 직접 등록 예정"
                    memo = "자동 처리 스킵 — 등록 전까지 UI에서 회색 자리표시 사용"
                else:
                    source = "내장 자리표시"
                    memo = "로고 원본 없음 — UI에서 회색 자리표시 사용"
            else:
                manifest_row = by_name.get(name)
                if not manifest_row or not manifest_row[1]:
                    raise RuntimeError(f"오토홈 로고 매핑 없음: {name}")

                if name == "KG모빌리티(쌍용)":
                    try:
                        image = fetch_image(KGM_OFFICIAL_IMAGE)
                        official_overrides += 1
                        memo = "옛 쌍용 로고를 KGM 공식 CI 현행 워드마크로 교체"
                    except Exception as error:  # deterministic offline fallback
                        image = Image.open(REPO_ROOT / "public" / "assets" / "brand" / "kr" / "kgm.png").convert("RGBA")
                        fallback_overrides.append(name)
                        memo = f"공식 원본 다운로드 실패로 저장소 현행 워드마크 사용: {type(error).__name__}"
                    source = KGM_OFFICIAL_PAGE
                elif name == "르노코리아(삼성)":
                    image = Image.open(
                        REPO_ROOT / "public" / "assets" / "brand" / "kr" / "renault.png"
                    ).convert("RGBA")
                    official_overrides += 1
                    source = RENAULT_OFFICIAL_PAGE
                    memo = "르노코리아 공식 사이트의 현행 로장주 사용 확인 후 현행형으로 교체"
                else:
                    code = str(manifest_row[1]).zfill(3)
                    archive_path = f"bbcat_admin/data/seed/logos/logo_mk_{code}.png"
                    image = open_image(archive.read(archive_path))
                    source = AUTOHOME_SOURCE
                    memo = manifest_row[6] or "오토홈 제공 원본 정규화"

                normalize_logo(image).save(output_path, format="PNG", optimize=True)
                generated += 1

            audit_rows.append(
                {
                    "제조사": name,
                    "파일명": filename,
                    "출처": source,
                    "메모": memo,
                }
            )

    if generated != 59:
        raise RuntimeError(f"로고 생성 수 불일치: 예상 59, 실제 {generated}")

    map_path = REPORT_ROOT / "logo_map.csv"
    with map_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["제조사", "파일명", "출처", "메모"])
        writer.writeheader()
        writer.writerows(audit_rows)

    return {
        "sourceManufacturers": len(manufacturers),
        "generatedPng": generated,
        "placeholders": len(PLACEHOLDER_MAKES),
        "userManaged": sorted(USER_MANAGED_MAKES),
        "officialOverrides": official_overrides,
        "fallbackOverrides": fallback_overrides,
        "mapPath": str(map_path.relative_to(REPO_ROOT)).replace("\\", "/"),
    }


def fit_generation_image(image: Image.Image) -> Image.Image:
    image = image.convert("RGB")
    canvas = Image.new("RGB", (600, 400), (245, 246, 248))
    scale = min(600 / image.width, 400 / image.height)
    size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    resized = image.resize(size, Image.Resampling.LANCZOS)
    canvas.paste(resized, ((600 - size[0]) // 2, (400 - size[1]) // 2))
    return canvas


def build_generation_images() -> dict[str, object]:
    jobs = read_csv(IMAGE_JOBS_PATH)
    expected_png = {row["파일명(PNG 1200x800)"]: row for row in jobs}
    generation_dir = PUBLIC_ROOT / "generations"
    generation_dir.mkdir(parents=True, exist_ok=True)
    REPORT_ROOT.mkdir(parents=True, exist_ok=True)

    files = [path for path in GENERATION_IMAGE_ROOT.iterdir() if path.is_file()] if GENERATION_IMAGE_ROOT.exists() else []
    unmatched = sorted(path.name for path in files if path.name not in expected_png)
    converted = 0
    matched_sources: list[str] = []

    for source in files:
        job = expected_png.get(source.name)
        if not job:
            continue
        output_name = job["웹용(WebP 600x400)"]
        if not output_name:
            raise RuntimeError(f"웹용 파일명 없음: {source.name}")
        image = Image.open(source)
        fit_generation_image(image).save(
            generation_dir / output_name,
            format="WEBP",
            quality=84,
            method=6,
        )
        converted += 1
        matched_sources.append(source.name)

    unmatched_path = REPORT_ROOT / "unmatched-generation-images.csv"
    with unmatched_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["작업표에 없는 파일명"])
        writer.writerows([[name] for name in unmatched])

    return {
        "jobs": len(jobs),
        "sourceFiles": len(files),
        "convertedWebp": converted,
        "matchedSourceFiles": matched_sources,
        "unmatchedSourceFiles": unmatched,
        "unmatchedPath": str(unmatched_path.relative_to(REPO_ROOT)).replace("\\", "/"),
    }


def verify_outputs(summary: dict[str, object]) -> None:
    logo_dir = PUBLIC_ROOT / "logos"
    logo_files = list(logo_dir.glob("logo_*.png"))
    if len(logo_files) != 59:
        raise RuntimeError(f"최종 PNG 로고 수 불일치: {len(logo_files)}")
    for path in logo_files:
        with Image.open(path) as image:
            if image.size != (256, 256) or image.mode != "RGBA":
                raise RuntimeError(f"로고 규격 불일치: {path.name} {image.size} {image.mode}")

    for path in (PUBLIC_ROOT / "generations").glob("*.webp"):
        with Image.open(path) as image:
            if image.size != (600, 400):
                raise RuntimeError(f"세대 이미지 규격 불일치: {path.name} {image.size}")

    summary_path = REPORT_ROOT / "image-build-summary.json"
    summary_path.write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def main() -> None:
    summary = {
        "logos": build_logos(),
        "generationImages": build_generation_images(),
    }
    verify_outputs(summary)
    print(json.dumps({"status": "PASS", **summary}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
