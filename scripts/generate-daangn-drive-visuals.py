#!/usr/bin/env python3
"""Build the temporary Daangn image map from the Google Drive workbook export.

The workbook is the Drive source of truth named
`모델이미지_승용_한국_당근(daangn)`.  This script uses only the Python
standard library so the generated map can be refreshed without adding a
project dependency.
"""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
import zipfile
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET


NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL_NS = {"r": "http://schemas.openxmlformats.org/package/2006/relationships"}
DOC_REL = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
URL_RE = re.compile(r'https?://[^"\s,)]+(?:\?[^"\s,)]+)?')
BROKEN_SOURCE_URLS = {
    "https://d1mhdqgfvh54v0.cloudfront.net/car/brands/43-chevrolet.png",
}


def norm(value: Any) -> str:
    text = unicodedata.normalize("NFKC", str(value or "")).lower()
    replacements = {
        "메르세데스벤츠": "벤츠",
        "메르세데스-벤츠": "벤츠",
        "쉐보레gm대우": "쉐보레대우",
        "르노코리아삼성": "르노삼성",
        "토요타": "도요타",
        "미쓰비시": "미쯔비시",
        "마쓰다": "마쯔다",
        "애스턴 마틴": "애스턴마틴",
        "롤스 로이스": "롤스로이스",
        "랜드 로버": "랜드로버",
        "클래스": "",
        "더뉴": "뉴",
        "올뉴": "뉴",
        "디올뉴": "뉴",
    }
    for source, target in replacements.items():
        text = text.replace(source, target)
    return re.sub(r"[\s·._/()\[\]{}-]+", "", text)


def maker_candidates(name: str) -> list[str]:
    aliases = {
        "쉐보레(GM대우)": ["쉐보레(대우)", "쉐보레"],
        "르노코리아(삼성)": ["르노(삼성)", "르노삼성"],
        "도요타": ["토요타"],
        "BYD": ["BYD(비야디)"],
        "동풍소콘": ["DFSK(동풍자동차)"],
        "신위안": ["신위안(제이스 모빌리티)"],
        "시트로엥/DS": ["시트로엥", "DS"],
        "마이바흐": ["벤츠", "마이바흐"],
        "험머": ["허머"],
        "기타 제조사": [],
        "기타 수입차": [],
    }
    return [name, *aliases.get(name, [])]


def excel_date(value: Any) -> str | None:
    if value in (None, "", "현재 판매"):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        match = re.search(r"(19|20)\d{2}(?:[./-](\d{1,2}))?", str(value))
        return f"{match.group(0)[:4]}.{int(match.group(2) or 1):02d}" if match else None
    date = datetime(1899, 12, 30) + timedelta(days=number)
    return f"{date.year:04d}.{date.month:02d}"


def cell_col(ref: str) -> int:
    letters = re.match(r"[A-Z]+", ref).group(0)
    value = 0
    for char in letters:
        value = value * 26 + ord(char) - 64
    return value - 1


def read_workbook(path: Path) -> dict[str, list[list[Any]]]:
    with zipfile.ZipFile(path) as archive:
        shared: list[str] = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            for item in root.findall("m:si", NS):
                shared.append("".join(node.text or "" for node in item.iterfind(".//m:t", NS)))

        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        rel_targets = {item.attrib["Id"]: item.attrib["Target"] for item in rels.findall("r:Relationship", REL_NS)}
        sheets: dict[str, list[list[Any]]] = {}
        for sheet in workbook.findall("m:sheets/m:sheet", NS):
            title = sheet.attrib["name"]
            target = rel_targets[sheet.attrib[DOC_REL]].lstrip("/")
            xml_path = target if target.startswith("xl/") else f"xl/{target}"
            root = ET.fromstring(archive.read(xml_path))
            rows: list[list[Any]] = []
            for row in root.findall("m:sheetData/m:row", NS):
                values: list[Any] = []
                for cell in row.findall("m:c", NS):
                    index = cell_col(cell.attrib["r"])
                    while len(values) <= index:
                        values.append(None)
                    formula = cell.findtext("m:f", default="", namespaces=NS)
                    raw = cell.findtext("m:v", default="", namespaces=NS)
                    kind = cell.attrib.get("t")
                    if formula:
                        match = URL_RE.search(formula)
                        value: Any = match.group(0) if match else f"={formula}"
                    elif kind == "s" and raw:
                        value = shared[int(raw)]
                    elif kind == "inlineStr":
                        value = "".join(node.text or "" for node in cell.iterfind(".//m:t", NS))
                    else:
                        value = raw
                    values[index] = value
                rows.append(values)
            sheets[title] = rows
        return sheets


def rows_as_dict(rows: list[list[Any]]) -> list[dict[str, Any]]:
    headers = [str(value or "").strip() for value in rows[0]]
    result = []
    for row in rows[1:]:
        item = {headers[index]: value for index, value in enumerate(row) if index < len(headers) and headers[index]}
        if any(value not in (None, "") for value in item.values()):
            result.append(item)
    return result


def best_model(rows: list[dict[str, Any]], name: str, subrows: list[dict[str, Any]] | None = None) -> tuple[dict[str, Any] | None, str | None]:
    key = norm(name)
    exact = [row for row in rows if norm(row.get("모델")) == key]
    if exact:
        return exact[0], "exact"
    contains = [row for row in rows if min(len(key), len(norm(row.get("모델")))) >= 2 and (key in norm(row.get("모델")) or norm(row.get("모델")) in key)]
    if len(contains) == 1:
        return contains[0], "normalized"

    # 당근은 BMW처럼 여러 보배드림 모델을 하나의 시리즈(X/M/i시리즈)로
    # 묶기도 한다. 이때 세부모델 이름에서 실제 모델을 찾아 그 이미지를
    # 모델 카드 대표 이미지로 사용한다.
    if len(key) >= 2 and subrows:
        submatches = [row for row in subrows if norm(row.get("세부모델")) == key]
        if not submatches:
            submatches = [row for row in subrows if norm(row.get("세부모델")).startswith(key)]
        if not submatches:
            submatches = [row for row in subrows if key in norm(row.get("세부모델"))]
        if submatches:
            first = submatches[0]
            return {"모델": first.get("모델"), "이미지 URL": first.get("이미지 URL")}, "submodel"
    return None, None


def year_distance(catalog_year: str | None, drive_year: str | None) -> int:
    if not catalog_year or not drive_year:
        return 999
    try:
        return abs(int(catalog_year[:4]) - int(drive_year[:4]))
    except ValueError:
        return 999


def best_generation(rows: list[dict[str, Any]], generation: dict[str, Any]) -> tuple[dict[str, Any] | None, str | None]:
    name_key = norm(generation["name"])
    exact = [row for row in rows if norm(row.get("세부모델")) == name_key]
    if exact:
        return min(exact, key=lambda row: year_distance(generation.get("releaseYm"), excel_date(row.get("출시")))), "exact"

    code = norm(generation.get("generationCode"))
    if code:
        coded = [row for row in rows if norm(row.get("세대 코드")) == code]
        if coded:
            return min(coded, key=lambda row: year_distance(generation.get("releaseYm"), excel_date(row.get("출시")))), "code"

    contains = [row for row in rows if min(len(name_key), len(norm(row.get("세부모델")))) >= 3 and (name_key in norm(row.get("세부모델")) or norm(row.get("세부모델")) in name_key)]
    if contains:
        candidate = min(contains, key=lambda row: year_distance(generation.get("releaseYm"), excel_date(row.get("출시"))))
        if year_distance(generation.get("releaseYm"), excel_date(candidate.get("출시"))) <= 4:
            return candidate, "normalized"

    generation_number = re.search(r"(\d+)세대", generation["name"])
    if generation_number:
        numbered = [row for row in rows if str(row.get("세대") or "").startswith(f"{generation_number.group(1)}세대")]
        if numbered:
            return min(numbered, key=lambda row: year_distance(generation.get("releaseYm"), excel_date(row.get("출시")))), "generation-number"

    dated = sorted(rows, key=lambda row: year_distance(generation.get("releaseYm"), excel_date(row.get("출시"))))
    if dated and year_distance(generation.get("releaseYm"), excel_date(dated[0].get("출시"))) <= 1:
        return dated[0], "year"
    return None, None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("xlsx", type=Path)
    parser.add_argument("--catalog", type=Path, default=Path("public/data/vehicle-catalog/cars-index-v1.json"))
    parser.add_argument("--output", type=Path, default=Path("src/prototype/vehicle-catalog/daangn-drive-visuals.generated.ts"))
    parser.add_argument("--report", type=Path, default=Path("reports/daangn-drive-image-coverage.json"))
    args = parser.parse_args()

    sheets = read_workbook(args.xlsx)
    makers = rows_as_dict(sheets["제조사"])
    models = rows_as_dict(sheets["모델"])
    submodels = rows_as_dict(sheets["세부모델"])
    catalog = json.loads(args.catalog.read_text(encoding="utf-8"))

    makers_by_key: dict[str, list[dict[str, Any]]] = defaultdict(list)
    models_by_maker: dict[str, list[dict[str, Any]]] = defaultdict(list)
    submodels_by_pair: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for row in makers:
        makers_by_key[norm(row.get("제조사"))].append(row)
    for row in models:
        models_by_maker[norm(row.get("제조사"))].append(row)
    for row in submodels:
        submodels_by_pair[(norm(row.get("제조사")), norm(row.get("모델")))].append(row)

    maker_logos: dict[str, str] = {}
    model_images: dict[str, dict[str, str]] = defaultdict(dict)
    generation_images: dict[str, str] = {}
    generation_match_kind: dict[str, str] = {}
    model_match_kind: dict[str, dict[str, str]] = defaultdict(dict)
    maker_source_keys: dict[str, list[str]] = {}

    for make in catalog["manufacturers"]:
        source_rows: list[dict[str, Any]] = []
        source_keys: list[str] = []
        for candidate in maker_candidates(make["name"]):
            key = norm(candidate)
            if key not in source_keys:
                source_keys.append(key)
                source_rows.extend(makers_by_key.get(key, []))
        maker_source_keys[make["name"]] = source_keys
        logo = next((str(row.get("로고 URL")) for row in source_rows if str(row.get("로고 URL") or "").startswith("http") and str(row.get("로고 URL")) not in BROKEN_SOURCE_URLS), None)
        if logo:
            maker_logos[make["name"]] = logo

    group_lookup: dict[str, dict[str, Any]] = {}
    for group in catalog["modelGroups"]:
        group_lookup[group["id"]] = group
        candidate_rows: list[dict[str, Any]] = []
        for make_key in maker_source_keys.get(group["makeName"], []):
            candidate_rows.extend(models_by_maker.get(make_key, []))
        candidate_subrows: list[dict[str, Any]] = []
        for make_key in maker_source_keys.get(group["makeName"], []):
            for (sub_make_key, _), rows in submodels_by_pair.items():
                if sub_make_key == make_key:
                    candidate_subrows.extend(rows)
        match, kind = best_model(candidate_rows, group["name"], candidate_subrows)
        image = str((match or {}).get("이미지 URL") or "")
        if image.startswith("http"):
            model_images[group["makeName"]][group["name"]] = image
            model_match_kind[group["makeName"]][group["name"]] = kind or "unknown"

    for generation in catalog.get("generations", []):
        group = group_lookup[generation["groupId"]]
        drive_models: list[dict[str, Any]] = []
        for make_key in maker_source_keys.get(generation["makeName"], []):
            drive_models.extend(models_by_maker.get(make_key, []))
        drive_submodels: list[dict[str, Any]] = []
        for make_key in maker_source_keys.get(generation["makeName"], []):
            for (sub_make_key, _), rows in submodels_by_pair.items():
                if sub_make_key == make_key:
                    drive_submodels.extend(rows)
        model_match, _ = best_model(drive_models, group["name"], drive_submodels)
        candidate_rows: list[dict[str, Any]] = []
        if model_match:
            drive_model_key = norm(model_match.get("모델"))
            for make_key in maker_source_keys.get(generation["makeName"], []):
                candidate_rows.extend(submodels_by_pair.get((make_key, drive_model_key), []))
        match, kind = best_generation(candidate_rows, generation)
        image = str((match or {}).get("이미지 URL") or "")
        if image.startswith("http"):
            generation_images[generation["id"]] = image
            generation_match_kind[generation["id"]] = kind or "unknown"

    model_total = len(catalog["modelGroups"])
    generation_total = len(catalog.get("generations", []))
    report = {
        "source": {
            "driveSpreadsheet": "모델이미지_승용_한국_당근(daangn)",
            "manufacturers": len(makers),
            "models": len(models),
            "submodels": len(submodels),
        },
        "catalog": {
            "manufacturers": len(catalog["manufacturers"]),
            "models": model_total,
            "generations": generation_total,
        },
        "matched": {
            "manufacturerLogos": len(maker_logos),
            "modelImages": sum(len(items) for items in model_images.values()),
            "generationDistinctImages": len(generation_images),
            "generationFallbackToModel": sum(1 for generation in catalog.get("generations", []) if generation["id"] not in generation_images and generation["groupName"] in model_images.get(generation["makeName"], {})),
        },
        "productionNeeded": {
            "manufacturerLogos": len(catalog["manufacturers"]) - len(maker_logos),
            "modelImages": model_total - sum(len(items) for items in model_images.values()),
            "generationDistinctImages": generation_total - len(generation_images),
        },
        "matchKinds": {
            "models": dict(sorted((kind, sum(1 for items in model_match_kind.values() for value in items.values() if value == kind)) for kind in set(value for items in model_match_kind.values() for value in items.values()))),
            "generations": dict(sorted((kind, sum(1 for value in generation_match_kind.values() if value == kind)) for kind in set(generation_match_kind.values()))),
        },
        "unmatched": {
            "manufacturers": [make["name"] for make in catalog["manufacturers"] if make["name"] not in maker_logos],
            "models": [{"maker": group["makeName"], "model": group["name"]} for group in catalog["modelGroups"] if group["name"] not in model_images.get(group["makeName"], {})],
            "generations": [{"id": generation["id"], "maker": generation["makeName"], "model": generation["groupName"], "generation": generation["name"]} for generation in catalog.get("generations", []) if generation["id"] not in generation_images],
        },
    }

    source = (
        "// Google Drive의 `모델이미지_승용_한국_당근(daangn)` 원본으로 생성합니다.\n"
        "// 보배드림 전용 이미지 제작 전 임시 테스트 용도입니다.\n"
        f"export const daangnMakerLogos: Record<string, string> = {json.dumps(maker_logos, ensure_ascii=False, indent=2)};\n"
        f"export const daangnModelImages: Record<string, Record<string, string>> = {json.dumps(dict(model_images), ensure_ascii=False, indent=2)};\n"
        f"export const daangnGenerationImages: Record<string, string> = {json.dumps(generation_images, ensure_ascii=False, indent=2)};\n"
        f"export const daangnDriveImageStats = {json.dumps({'source': report['source'], 'catalog': report['catalog'], 'matched': report['matched'], 'productionNeeded': report['productionNeeded']}, ensure_ascii=False, indent=2)} as const;\n"
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(source, encoding="utf-8", newline="\n")
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(json.dumps({"source": report["source"], "catalog": report["catalog"], "matched": report["matched"], "productionNeeded": report["productionNeeded"]}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
