#!/usr/bin/env python3
"""바이크 제조사·모델 원본 3개를 공통 정규화 JSON으로 만든다."""

from __future__ import annotations

import csv
import hashlib
import json
import uuid
from pathlib import Path
from typing import Any


EXPECTED = {
    "manufacturers": 86,
    "visibleManufacturers": 65,
    "hiddenManufacturers": 21,
    "modelGroups": 973,
    "actualModelGroups": 920,
    "implicitModelGroups": 53,
    "models": 2_910,
    "danawaPcodes": 135,
    "reviewRequiredModels": 278,
}
SOURCE_FILES = ("bike_catalog_1005.json", "bike_makers_v2_1005.csv", "bike_models_v2_1005.csv")
NAMESPACE = uuid.UUID("43b3228e-b813-54c3-9c77-5e32ffb1ff42")


def text(value: Any) -> str:
    return "" if value is None else str(value).strip()


def nullable_text(value: Any) -> str | None:
    return text(value) or None


def integer(value: Any) -> int | None:
    raw = text(value)
    return int(raw) if raw else None


def boolean(value: Any) -> bool:
    return value is True or text(value).upper() in {"Y", "YES", "TRUE", "1", "✅ 노출", "✅ 노출(맨 뒤)"}


def token(*parts: str) -> str:
    return hashlib.sha256("^@".join(parts).encode("utf-8")).hexdigest()[:20]


def stable_uuid(key: str) -> str:
    return str(uuid.uuid5(NAMESPACE, key))


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def exactly_one(mapping: dict[str, dict[str, str]], code: str, description: str) -> dict[str, str]:
    row = mapping.get(code)
    if row is None:
        raise ValueError(f"{description} 원본 행 누락: {code}")
    return row


def model_review(row: dict[str, str]) -> tuple[str, str | None]:
    if not row["status"].startswith("🟡"):
        return "CONFIRMED", None
    reasons = [row["status"]]
    if row["candidates"]:
        reasons.append(f"유사 후보: {row['candidates']}")
    if row["note"]:
        reasons.append(row["note"])
    return "REVIEW_REQUIRED", " / ".join(reasons)


def build(source_dir: Path) -> dict[str, Any]:
    for filename in SOURCE_FILES:
        if not (source_dir / filename).is_file():
            raise FileNotFoundError(source_dir / filename)

    raw_catalog = json.loads((source_dir / SOURCE_FILES[0]).read_text(encoding="utf-8"))
    maker_rows = read_csv(source_dir / SOURCE_FILES[1])
    model_rows = read_csv(source_dir / SOURCE_FILES[2])
    maker_by_code = {row["code"]: row for row in maker_rows}
    model_by_code = {row["code"]: row for row in model_rows}
    if len(maker_by_code) != len(maker_rows) or len(model_by_code) != len(model_rows):
        raise ValueError("원본 코드가 중복되었습니다.")

    excluded_makers = [row for row in maker_rows if "제외" in row["visible"]]
    if [row["name"] for row in excluded_makers] != ["다임러", "닷지"]:
        raise ValueError(f"제외 제조사 불일치: {[row['name'] for row in excluded_makers]}")

    manufacturers: list[dict[str, Any]] = []
    model_groups: list[dict[str, Any]] = []
    models: list[dict[str, Any]] = []
    maker_keys: dict[str, str] = {}
    group_keys: dict[str, str] = {}

    for raw_make in raw_catalog["makers"]:
        source_code = raw_make["code"]
        row = exactly_one(maker_by_code, source_code, "제조사")
        if row["name"] != raw_make["name"]:
            raise ValueError(f"제조사 이름 불일치: {source_code}")
        key = f"make_bike_{token(raw_make['name'], source_code)}"
        maker_keys[source_code] = key
        is_visible = bool(raw_make["visible"])
        manufacturers.append({
            "key": key,
            "uuid": stable_uuid(key),
            "sourceSystem": "BB_BIKE",
            "sourceCode": source_code,
            "sourceName": row["name"],
            "displayName": row["name"].strip(),
            "englishName": nullable_text(row["name_en"]),
            "countryName": nullable_text(row["country"]),
            "origin": nullable_text(row["origin"]),
            "isChinese": boolean(row["chinese"]),
            "isPopular": boolean(row["popular"]),
            "isVisible": is_visible,
            "usesGroups": bool(raw_make["uses_groups"]),
            "sortOrder": int(raw_make["sort"]),
            "listingCount": integer(row["listing_count_test"]),
            "reviewStatus": "CONFIRMED",
            "reviewReason": None,
            "aliases": [part.strip() for part in row["aliases"].split(",") if part.strip()],
            "sourceNote": nullable_text(row["note"]),
            "reitwagenId": nullable_text(row["reitwagen_id"]),
        })

        for raw_group in raw_make["groups"]:
            group_code = raw_group["code"]
            group_key = f"model_bike_group_{token(raw_make['name'], raw_group['name'])}"
            group_keys[group_code] = group_key
            model_groups.append({
                "key": group_key,
                "uuid": stable_uuid(group_key),
                "makeKey": key,
                "sourceSystem": "BB_BIKE",
                "sourceCode": group_code,
                "sourceName": raw_group["name"],
                "displayName": raw_group["name"].strip(),
                "isImplicit": bool(raw_group["implicit"]),
                "isVisible": is_visible,
                "sortOrder": int(raw_group["sort"]),
                "listingCount": None,
                "reviewStatus": "CONFIRMED",
                "reviewReason": None,
            })

            for raw_model in raw_group["models"]:
                model_code = raw_model["code"]
                model_row = exactly_one(model_by_code, model_code, "모델")
                expected_group_code = "" if raw_group["implicit"] else group_code
                if model_row["maker_code"] != source_code or model_row["group_code"] != expected_group_code:
                    raise ValueError(f"모델 부모 코드 불일치: {model_code}")
                if model_row["name"] != raw_model["name"]:
                    raise ValueError(f"모델 이름 불일치: {model_code}")
                pcodes = [part for part in model_row["danawa_pcodes"].split() if part]
                if pcodes != raw_model["sources"]["danawa_pcodes"]:
                    raise ValueError(f"다나와 pcode 불일치: {model_code}")
                review_status, review_reason = model_review(model_row)
                model_key = f"model_bike_{token(raw_make['name'], raw_group['name'], raw_model['name'])}"
                models.append({
                    "key": model_key,
                    "uuid": stable_uuid(model_key),
                    "makeKey": key,
                    "parentModelKey": group_key,
                    "sourceSystem": "BB_BIKE",
                    "sourceCode": model_code,
                    "sourceName": model_row["name"],
                    "displayName": model_row["name"].strip(),
                    "genre": nullable_text(raw_model["genre"]),
                    "displacementCc": raw_model["cc"],
                    "displacementBand": nullable_text(raw_model["cc_band"]),
                    "fuel": nullable_text(raw_model["fuel"]),
                    "yearMin": raw_model["year_min"],
                    "yearMax": raw_model["year_max"],
                    "imagePath": None,
                    "isVisible": is_visible,
                    "sortOrder": int(raw_model["sort"]),
                    "listingCount": None,
                    "reviewStatus": review_status,
                    "reviewReason": review_reason,
                    "sourceStatus": model_row["status"],
                    "similarCandidates": nullable_text(model_row["candidates"]),
                    "sourceNote": nullable_text(model_row["note"]),
                    "reitwagenId": nullable_text(model_row["reitwagen_id"]),
                    "naverUrl": nullable_text(model_row["naver_url"]),
                    "danawaPcodes": pcodes,
                })

    actual = {
        "manufacturers": len(manufacturers),
        "visibleManufacturers": sum(row["isVisible"] for row in manufacturers),
        "hiddenManufacturers": sum(not row["isVisible"] for row in manufacturers),
        "modelGroups": len(model_groups),
        "actualModelGroups": sum(not row["isImplicit"] for row in model_groups),
        "implicitModelGroups": sum(row["isImplicit"] for row in model_groups),
        "models": len(models),
        "danawaPcodes": sum(len(row["danawaPcodes"]) for row in models),
        "reviewRequiredModels": sum(row["reviewStatus"] == "REVIEW_REQUIRED" for row in models),
    }
    if actual != EXPECTED:
        raise ValueError(f"목표 건수 불일치: expected={EXPECTED}, actual={actual}")
    if len({pcode for row in models for pcode in row["danawaPcodes"]}) != EXPECTED["danawaPcodes"]:
        raise ValueError("다나와 pcode가 중복되었습니다.")

    return {
        "meta": {
            "schemaVersion": 1,
            "version": "bike-1005",
            "vehicleScope": "BIKE",
            "sourceSystem": "BB_BIKE",
            "snapshotDate": "2026-10-05",
            "listingCountSnapshotDate": "2026-05-27",
            "listingCountKind": "REITWAGEN_TEST_SNAPSHOT",
            "sources": [
                {"name": "라이트바겐", "snapshotDate": "2026-05-27"},
                {"name": "네이버 바이크", "period": "2012~2021"},
                {"name": "다나와", "snapshotDate": "2026-10-05"},
            ],
            "sourceFiles": [
                {"name": filename, "sha256": sha256_file(source_dir / filename)}
                for filename in SOURCE_FILES
            ],
            "filters": ["year", "genre", "displacementBand", "fuel"],
            "counts": EXPECTED,
            "exclusions": [
                {"sourceCode": row["code"], "sourceName": row["name"], "reason": row["note"]}
                for row in excluded_makers
            ],
            "imagePolicy": "다나와·네이버 이미지는 저장하거나 게시하지 않음",
        },
        "manufacturers": manufacturers,
        "modelGroups": model_groups,
        "models": models,
    }


def main() -> None:
    source_dir = Path(__file__).parent
    output = source_dir / "bike-catalog.normalized.json"
    normalized = build(source_dir)
    output.write_bytes((json.dumps(normalized, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))
    print(json.dumps({"output": str(output), "counts": normalized["meta"]["counts"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
