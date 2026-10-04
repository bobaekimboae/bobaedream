from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
NAME_PATTERN = re.compile(r"^[a-z0-9_]+_v\d{2}\.png$")


def absolute_path(value: str) -> Path:
    path = Path(value)
    return path if path.is_absolute() else ROOT / path


def visible_bbox(image: Image.Image, threshold: int):
    return image.getchannel("A").point(lambda value: 255 if value >= threshold else 0).getbbox()


def inspect(row: dict[str, str], seen_hashes: dict[str, str]) -> dict:
    path = absolute_path(row["output_file"])
    errors: list[str] = []
    result = {"type_code": row["type_code"], "file": row["output_file"], "status": "PASS", "errors": errors}

    if not path.exists():
        errors.append("file_missing")
        result["status"] = "FAIL"
        return result
    if not NAME_PATTERN.match(path.name):
        errors.append("invalid_filename")

    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if digest in seen_hashes:
        errors.append(f"duplicate_hash:{seen_hashes[digest]}")
    else:
        seen_hashes[digest] = row["type_code"]

    with Image.open(path) as opened:
        image = opened.convert("RGBA")
        expected_size = (int(row["canvas_width"]), int(row["canvas_height"]))
        if opened.mode != "RGBA":
            errors.append(f"mode:{opened.mode}")
        if image.size != expected_size:
            errors.append(f"size:{image.size[0]}x{image.size[1]}")
        for point in ((0, 0), (image.width - 1, 0), (0, image.height - 1), (image.width - 1, image.height - 1)):
            if image.getpixel(point)[3] != 0:
                errors.append(f"opaque_corner:{point[0]},{point[1]}")

        threshold = int(row["alpha_threshold"])
        bbox = visible_bbox(image, threshold)
        if bbox is None:
            errors.append("no_visible_pixels")
        else:
            left, top, right, bottom = bbox
            box_width = right - left
            box_height = bottom - top
            result["bbox"] = [left, top, right, bottom]
            if box_width > int(row["target_width"]):
                errors.append(f"width_over:{box_width}")
            if box_height > int(row["target_height"]):
                errors.append(f"height_over:{box_height}")
            center_x = (left + right) / 2
            if abs(center_x - int(row["anchor_x"])) > 2:
                errors.append(f"center_x:{center_x}")
            if abs(bottom - int(row["baseline_y"])) > 2:
                errors.append(f"baseline:{bottom}")

    for field in ("manual_orientation_qa", "manual_structure_qa", "manual_small_slot_qa"):
        if row.get(field, "").strip().upper() != "PASS":
            errors.append(f"{field}:not_pass")

    if errors:
        result["status"] = "FAIL"
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description="Check normalized quick-filter images against the production manifest.")
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--report")
    args = parser.parse_args()
    manifest = absolute_path(args.manifest)
    seen_hashes: dict[str, str] = {}
    results = []

    with manifest.open("r", encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            results.append(inspect(row, seen_hashes))

    passed = sum(result["status"] == "PASS" for result in results)
    payload = {"manifest": str(manifest), "total": len(results), "passed": passed, "failed": len(results) - passed, "results": results}
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    if args.report:
        report = absolute_path(args.report)
        report.parent.mkdir(parents=True, exist_ok=True)
        report.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    raise SystemExit(main())

