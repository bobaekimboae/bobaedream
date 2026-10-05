from __future__ import annotations

import csv
import re
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
CURRENT_SOURCE = ROOT / "public" / "assets" / "maker-model" / "logos" / "encar-1005"
TARGET = ROOT / "public" / "assets" / "maker-model" / "logos" / "encar-1005-normalized"
REPORT = ROOT / "reports" / "mm-logo-normalization-yiche-v01.csv"
YICHE_SOURCE = Path(
    r"C:\Users\bobae\Downloads\로고_유형별_0926\01_종합·승용\로고_승용_중국_이처"
)
CANVAS = 120  # 40 CSS px at 3x


EXPLICIT_YICHE_FILES = {
    "003_ChevroletGMDaewoo.png": "미국_쉐보레_雪佛兰.png",
    "005_Renault_KoreaSamsung.png": "한국_르노삼성_雷诺三星.png",
    "004_KG_Mobility_Ssangyong.png": "한국_KGM(쌍용)_KGM.png",
    "051_Daihatsu.png": "일본_다이하쓰_大发.png",
    "031_Toyota.png": "일본_토요타_丰田.png",
    "029_Mazda.png": "일본_마쓰다_马自达.png",
    "030_Mitsubishi.png": "일본_미쓰비시_三菱.png",
    "059_Mitsuoka.png": "일본_미쓰오카_光冈.png",
    "013_Mercedes_Benz.png": "독일_메르세데스-벤츠_奔驰.png",
    "038_Chevrolet.png": "미국_쉐보레_雪佛兰.png",
    "022_Citroen_DS.png": "프랑스_시트로엥_雪铁龙.png",
    "043_Cadillac.png": "미국_캐디락_凯迪拉克.png",
    "048_Hummer.png": "미국_허머_悍马.png",
    "022b_DS.png": "프랑스_DS.png",
}


def normalize_name(value: str) -> str:
    return re.sub(r"[^0-9A-Za-z가-힣]", "", value).lower()


def yiche_name(path: Path) -> str:
    parts = path.stem.split("_")
    return normalize_name(parts[1] if len(parts) >= 3 else path.stem)


def painted_bbox(image: Image.Image):
    alpha = image.getchannel("A")
    return alpha.point(lambda value: 255 if value >= 8 else 0).getbbox()


def target_css_size(width: int, height: int) -> tuple[int, int, str]:
    ratio = width / max(height, 1)
    if 0.8 <= ratio <= 1.25:
        scale = 30 / max(width, height)
        kind = "round-square"
    elif ratio > 2.5:
        scale = min(36 / width, 12 / height)
        kind = "wordmark-wide"
    elif ratio > 1.25:
        scale = min(36 / width, 18 / height)
        kind = "symbol-wide"
    else:
        scale = min(26 / width, 30 / height)
        kind = "crest-tall"
    return max(1, round(width * scale)), max(1, round(height * scale)), kind


def read_manifest() -> list[dict[str, str]]:
    with (CURRENT_SOURCE / "manifest.csv").open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def resolve_yiche(row: dict[str, str], index: dict[str, Path]) -> Path | None:
    output_name = row.get("파일명") or ""
    explicit = EXPLICIT_YICHE_FILES.get(output_name)
    if explicit:
        candidate = YICHE_SOURCE / explicit
        if not candidate.exists():
            raise FileNotFoundError(candidate)
        return candidate

    names = [
        row.get("제조사(엔카 원문)") or "",
        re.sub(r"\([^)]*\)", "", row.get("제조사(엔카 원문)") or ""),
        row.get("영문명") or "",
    ]
    for name in names:
        key = normalize_name(name)
        if key and key in index:
            return index[key]
    return None


def main() -> None:
    if not YICHE_SOURCE.exists():
        raise FileNotFoundError(f"이처 원본 폴더 없음: {YICHE_SOURCE}")

    TARGET.mkdir(parents=True, exist_ok=True)
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    index = {yiche_name(path): path for path in YICHE_SOURCE.glob("*.png")}
    report_rows: list[dict[str, str | int]] = []

    for row in read_manifest():
        output_name = row.get("파일명") or ""
        if not output_name:
            continue
        selected = resolve_yiche(row, index)
        source_path = selected or (CURRENT_SOURCE / output_name)
        source_label = "이처" if selected else "기존 보강"
        if not source_path.exists():
            raise FileNotFoundError(source_path)

        image = Image.open(source_path).convert("RGBA")
        bbox = painted_bbox(image)
        if not bbox:
            raise ValueError(f"빈 로고: {source_path}")
        painted = image.crop(bbox)
        target_w, target_h, kind = target_css_size(painted.width, painted.height)
        resized = painted.resize((target_w * 3, target_h * 3), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
        x = (CANVAS - resized.width) // 2
        y = (CANVAS - resized.height) // 2
        canvas.alpha_composite(resized, (x, y))
        canvas.save(TARGET / output_name, optimize=True)

        report_rows.append(
            {
                "제조사": row.get("제조사(엔카 원문)") or output_name,
                "파일명": output_name,
                "선택_출처": source_label,
                "원본_파일": source_path.name,
                "분류": kind,
                "가시_w_css_px": target_w,
                "가시_h_css_px": target_h,
                "슬롯_css_px": "40x40",
                "캔버스_px": "120x120",
            }
        )

    # The shared fallback icon uses the same square optical envelope.
    fallback = CURRENT_SOURCE / "etc_maker_icon.png"
    if fallback.exists():
        image = Image.open(fallback).convert("RGBA")
        bbox = painted_bbox(image)
        if not bbox:
            raise ValueError(f"빈 대체 아이콘: {fallback}")
        painted = image.crop(bbox)
        resized = painted.resize((90, 90), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
        canvas.alpha_composite(resized, (15, 15))
        canvas.save(TARGET / fallback.name, optimize=True)

    with REPORT.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=report_rows[0].keys())
        writer.writeheader()
        writer.writerows(report_rows)

    yiche_count = sum(row["선택_출처"] == "이처" for row in report_rows)
    print(f"normalized={len(report_rows)} yiche={yiche_count} fallback={len(report_rows) - yiche_count}")
    print(f"target={TARGET}")
    print(f"report={REPORT}")


if __name__ == "__main__":
    main()
