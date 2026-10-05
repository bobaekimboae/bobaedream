#!/usr/bin/env python3
"""바이크 제조사·모델·표시순서·로고 원본을 공통 정규화 JSON으로 만든다."""

from __future__ import annotations

import csv
import hashlib
import json
import uuid
from collections import Counter
from pathlib import Path
from typing import Any


EXPECTED = {
    "manufacturers": 86,
    "visibleManufacturers": 65,
    "hiddenManufacturers": 21,
    "searchVisibleManufacturers": 62,
    "modelGroups": 973,
    "actualModelGroups": 920,
    "implicitModelGroups": 53,
    "models": 2_910,
    "danawaPcodes": 135,
    "reviewRequiredModels": 278,
}
EXPECTED_DISPLACEMENT_BANDS = {
    "751cc 이상": 1_117,
    "401~750cc": 403,
    "251~400cc": 229,
    "126~250cc": 237,
    "51~125cc": 645,
    "50cc 이하": 141,
    "전기": 92,
    "없음": 46,
}
SOURCE_FILES = (
    "bike_catalog_1005.json",
    "bike_makers_v2_1005.csv",
    "bike_models_v2_1005.csv",
    "bike_maker_order_rw_names_1005.csv",
    "bike_logo_manifest_1005.csv",
)
NAMESPACE = uuid.UUID("43b3228e-b813-54c3-9c77-5e32ffb1ff42")


def text(value: Any) -> str:
    return "" if value is None else str(value).strip()


def nullable_text(value: Any) -> str | None:
    return text(value) or None


def integer(value: Any) -> int | None:
    raw = text(value)
    return int(raw) if raw else None


def number(value: Any) -> int | float | None:
    raw = text(value)
    if not raw:
        return None
    return float(raw) if "." in raw else int(raw)


def boolean(value: Any) -> bool:
    return value is True or text(value).upper() in {"Y", "YES", "TRUE", "1", "✅ 노출", "✅ 노출(맨 뒤)"}


def chinese_flags(value: Any) -> tuple[bool, bool]:
    raw = text(value)
    if not raw:
        return False, False
    if raw == "중국":
        return True, False
    if raw.startswith("중국 생산("):
        return False, True
    raise ValueError(f"중국 브랜드 구분 값 오류: {raw}")


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


def unique_texts(values: list[str]) -> list[str]:
    result: list[str] = []
    for value in values:
        normalized = text(value)
        if normalized and normalized not in result:
            result.append(normalized)
    return result


def korean_sort_name(rows: list[dict[str, str]], display_name: str) -> str:
    for row in rows:
        prefix = "한글 읽기 정렬:"
        note = text(row["비고"])
        if note.startswith(prefix):
            return note.removeprefix(prefix).strip()
    return display_name


def build(source_dir: Path) -> dict[str, Any]:
    for filename in SOURCE_FILES:
        if not (source_dir / filename).is_file():
            raise FileNotFoundError(source_dir / filename)

    raw_catalog = json.loads((source_dir / SOURCE_FILES[0]).read_text(encoding="utf-8"))
    maker_rows = read_csv(source_dir / SOURCE_FILES[1])
    model_rows = read_csv(source_dir / SOURCE_FILES[2])
    order_rows = read_csv(source_dir / SOURCE_FILES[3])
    logo_rows = read_csv(source_dir / SOURCE_FILES[4])
    maker_by_code = {row["code"]: row for row in maker_rows}
    model_by_code = {row["code"]: row for row in model_rows}
    logo_by_code = {row["코드"]: row for row in logo_rows}
    if len(maker_by_code) != len(maker_rows) or len(model_by_code) != len(model_rows):
        raise ValueError("원본 코드가 중복되었습니다.")
    if len(logo_rows) != 65 or len(logo_by_code) != len(logo_rows):
        raise ValueError(f"로고 매니페스트 구조 불일치: rows={len(logo_rows)}, unique={len(logo_by_code)}")

    excluded_makers = [row for row in maker_rows if "제외" in row["visible"]]
    if [row["name"] for row in excluded_makers] != ["다임러", "닷지"]:
        raise ValueError(f"제외 제조사 불일치: {[row['name'] for row in excluded_makers]}")

    order_rows_by_code: dict[str, list[dict[str, str]]] = {}
    for row in order_rows:
        order_rows_by_code.setdefault(row["v2 코드"], []).append(row)
    duplicate_order_codes = {code for code, rows in order_rows_by_code.items() if len(rows) > 1}
    if len(order_rows) != 66 or len(order_rows_by_code) != 65 or duplicate_order_codes != {"BKM029"}:
        raise ValueError(
            "라이트바겐 표시명 원본 구조 불일치: "
            f"rows={len(order_rows)}, unique={len(order_rows_by_code)}, duplicates={sorted(duplicate_order_codes)}"
        )

    manufacturers: list[dict[str, Any]] = []
    model_groups: list[dict[str, Any]] = []
    models: list[dict[str, Any]] = []
    maker_keys: dict[str, str] = {}
    group_keys: dict[str, str] = {}
    sort_names: dict[str, str] = {}

    for raw_make in raw_catalog["makers"]:
        source_code = raw_make["code"]
        row = exactly_one(maker_by_code, source_code, "제조사")
        if row["name"] != raw_make["name"]:
            raise ValueError(f"제조사 이름 불일치: {source_code}")
        key = f"make_bike_{token(raw_make['name'], source_code)}"
        maker_keys[source_code] = key
        is_visible = bool(raw_make["visible"])
        display_rows = order_rows_by_code.get(source_code, [])
        if is_visible and not display_rows:
            raise ValueError(f"노출 제조사의 라이트바겐 표시명 누락: {source_code}")
        if not is_visible and display_rows:
            raise ValueError(f"숨김 제조사가 표시명 목록에 포함됨: {source_code}")

        if source_code == "BKM029":
            display_name = row["name"].strip()
        elif display_rows:
            display_name = display_rows[0]["화면 이름(라이트바겐 표기)"].strip()
        else:
            display_name = row["name"].strip()
        listing_count = (
            sum(integer(display_row["매물(5/27)"]) or 0 for display_row in display_rows)
            if display_rows
            else integer(row["listing_count_test"])
        )
        origin = nullable_text(row["origin"])
        if display_rows:
            display_origins = {
                "국산" if display_row["구역"].startswith("국산") else "수입"
                for display_row in display_rows
            }
            if len(display_origins) != 1:
                raise ValueError(f"제조사 원산지 구역 불일치: {source_code}")
            origin = display_origins.pop()
        if origin not in {"국산", "수입", "기타"}:
            raise ValueError(f"제조사 원산지 값 오류: {source_code}={origin}")
        alias_candidates = [part.strip() for part in row["aliases"].split(",") if part.strip()]
        if source_code == "BKM015":
            alias_candidates.extend(part.strip() for part in display_rows[0]["비고"].split(",") if part.strip())
        alias_candidates.extend(
            display_row["화면 이름(라이트바겐 표기)"]
            for display_row in display_rows
            if display_row["화면 이름(라이트바겐 표기)"] not in {display_name, row["name"]}
        )
        if display_name != row["name"]:
            alias_candidates.append(row["name"])
        aliases = [alias for alias in unique_texts(alias_candidates) if alias != display_name]
        sort_names[source_code] = korean_sort_name(display_rows, display_name)
        is_chinese, made_in_china = chinese_flags(row["chinese"])
        manufacturers.append({
            "key": key,
            "uuid": stable_uuid(key),
            "sourceSystem": "BB_BIKE",
            "sourceCode": source_code,
            "sourceName": row["name"],
            "displayName": display_name,
            "englishName": nullable_text(row["name_en"]),
            "countryName": nullable_text(row["country"]),
            "origin": origin,
            "isChinese": is_chinese,
            "madeInChina": made_in_china,
            "isPopular": False,
            "isVisible": is_visible,
            "isSearchVisible": is_visible and listing_count is not None and listing_count > 0,
            "usesGroups": bool(raw_make["uses_groups"]),
            "sortOrder": 0,
            "listingCount": listing_count,
            "reviewStatus": "CONFIRMED",
            "reviewReason": None,
            "aliases": aliases,
            "logoFile": logo_by_code.get(source_code, {}).get("파일명") or None,
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
                    "displacementCc": number(model_row["cc"]),
                    "displacementBand": nullable_text(model_row["cc_band"]),
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

    other = next(row for row in manufacturers if row["sourceCode"] == "BKM086")
    visible_codes = {row["sourceCode"] for row in manufacturers if row["isVisible"]}
    if set(logo_by_code) != visible_codes:
        raise ValueError(
            "로고 매니페스트 제조사 불일치: "
            f"missing={sorted(visible_codes - set(logo_by_code))}, extra={sorted(set(logo_by_code) - visible_codes)}"
        )
    visible_without_other = [row for row in manufacturers if row["isVisible"] and row is not other]
    popular = sorted(
        visible_without_other,
        key=lambda row: (-(row["listingCount"] or 0), sort_names[row["sourceCode"]]),
    )[:12]
    popular_codes = {row["sourceCode"] for row in popular}
    remainder = sorted(
        [row for row in visible_without_other if row["sourceCode"] not in popular_codes],
        key=lambda row: sort_names[row["sourceCode"]],
    )
    hidden = sorted(
        [row for row in manufacturers if not row["isVisible"]],
        key=lambda row: row["displayName"],
    )
    ordered_manufacturers = popular + remainder + hidden + [other]
    for sort_order, manufacturer in enumerate(ordered_manufacturers, start=1):
        manufacturer["sortOrder"] = sort_order
        manufacturer["isPopular"] = manufacturer["sourceCode"] in popular_codes
    manufacturers = ordered_manufacturers

    actual = {
        "manufacturers": len(manufacturers),
        "visibleManufacturers": sum(row["isVisible"] for row in manufacturers),
        "hiddenManufacturers": sum(not row["isVisible"] for row in manufacturers),
        "searchVisibleManufacturers": sum(row["isSearchVisible"] for row in manufacturers),
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
    displacement_band_counts = Counter(row["displacementBand"] or "없음" for row in models)
    if dict(displacement_band_counts) != EXPECTED_DISPLACEMENT_BANDS:
        raise ValueError(
            "배기량 구간 건수 불일치: "
            f"expected={EXPECTED_DISPLACEMENT_BANDS}, actual={dict(displacement_band_counts)}"
        )

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
            "logoBasePath": "/assets/maker-model/logos/bike/",
            "manufacturerOrderPolicy": "listingCount 상위 12개 매물순, 나머지 가나다, 기타 맨 뒤",
            "manufacturerVisibilityPolicy": {
                "registration": "isVisible",
                "search": "isSearchVisible (listingCount > 0)",
            },
            "confirmedDecisions": [
                {
                    "code": "BKM029",
                    "topic": "대림/디앤에이모터스 분리",
                    "decision": "디앤에이모터스(대림) 단일 제조사, aliases에 대림·디앤에이모터스",
                },
                {
                    "topic": "SQLite 차량 기준표 구조",
                    "decision": "manufacturers/models 공통 테이블 + scope_key(CAR/BIKE), 바이크 전용 필드는 bike_model_specs",
                },
            ],
            "counts": EXPECTED,
            "displacementBandCounts": EXPECTED_DISPLACEMENT_BANDS,
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
