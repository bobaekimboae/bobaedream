#!/usr/bin/env python3
"""Cross-check generation-image manifests against the Encar catalog snapshot.

The catalog decides taxonomy (maker > model group > generation). Official
catalogues decide visual details. This check prevents a visually plausible
image from being attached to the wrong Encar generation key.
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

from PIL import Image


REPO = Path(__file__).resolve().parents[1]
CATALOG = REPO / "public/data/encar-car-depth-1005/catalog.json"
ASSET_ROOT = REPO / "public/assets/maker-model/generations"
MAP_ROOT = REPO / "public/data/encar-car-depth-1005/generation-images"


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def catalog_index() -> tuple[dict[str, dict], dict[str, set[str]]]:
    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    generations: dict[str, dict] = {}
    maker_generations: dict[str, set[str]] = {}

    for maker in data.get("manufacturers", []):
        visible_keys: set[str] = set()
        for group in maker.get("modelGroups", []):
            for generation in group.get("generations", []):
                key = generation.get("key")
                if not key:
                    continue
                generations[key] = {
                    "maker": maker.get("displayName", ""),
                    "makerVisible": maker.get("isVisible", True),
                    "group": group.get("displayName", ""),
                    "groupVisible": group.get("isVisible", True),
                    "displayName": generation.get("displayName", ""),
                    "releaseYm": generation.get("releaseYm") or "",
                    "endYm": generation.get("endYm") or "현재",
                    "isVisible": generation.get("isVisible", True),
                }
                if (
                    maker.get("isVisible", True)
                    and group.get("isVisible", True)
                    and generation.get("isVisible", True)
                ):
                    visible_keys.add(key)
        maker_generations[maker.get("displayName", "")] = visible_keys

    return generations, maker_generations


def check_brand(slug: str, require_complete: bool) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    manifest_path = ASSET_ROOT / slug / "manifest.csv"
    mapping_path = MAP_ROOT / f"{slug}.json"

    if not manifest_path.exists():
        return [f"[{slug}] manifest 없음: {manifest_path}"], warnings
    if not mapping_path.exists():
        return [f"[{slug}] 연결표 없음: {mapping_path}"], warnings

    generations, maker_generations = catalog_index()
    mapping = json.loads(mapping_path.read_text(encoding="utf-8"))
    with manifest_path.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))

    keys: list[str] = []
    makers: set[str] = set()
    files: set[str] = set()
    for line_no, row in enumerate(rows, start=2):
        key = (row.get("보배드림_세대_코드") or "").strip()
        encar_key = (row.get("엔카_코드") or "").strip()
        filename = (row.get("파일명") or "").strip()
        prefix = f"[{slug}:{line_no}]"
        keys.append(key)

        if not key:
            fail(errors, f"{prefix} 세대 코드 없음")
            continue
        if key != encar_key:
            fail(errors, f"{prefix} 보배드림 코드와 엔카 코드 불일치: {key} / {encar_key}")
        if key not in generations:
            fail(errors, f"{prefix} catalog.json에 없는 세대 키: {key}")
            continue

        item = generations[key]
        makers.add(item["maker"])
        expected = {
            "DB_displayName": item["displayName"],
            "모델명": item["group"],
            "출시_시작": item["releaseYm"],
            "출시_종료": item["endYm"],
        }
        for column, value in expected.items():
            actual = (row.get(column) or "").strip()
            if actual != value:
                fail(errors, f"{prefix} {column} 불일치: '{actual}' != 엔카 '{value}'")

        if not (item["makerVisible"] and item["groupVisible"] and item["isVisible"]):
            fail(errors, f"{prefix} 엔카에서 숨김 처리된 경로에 이미지가 연결됨")

        expected_map = f"{slug}/{filename}"
        actual_map = mapping.get(key)
        if actual_map != expected_map:
            fail(errors, f"{prefix} 연결표 불일치: '{actual_map}' != '{expected_map}'")

        if filename in files:
            fail(errors, f"{prefix} 파일명 중복: {filename}")
        files.add(filename)
        image_path = ASSET_ROOT / expected_map
        if not image_path.exists():
            fail(errors, f"{prefix} 이미지 파일 없음: {image_path}")
        else:
            with Image.open(image_path) as image:
                if image.size != (960, 600):
                    fail(errors, f"{prefix} 납품 크기 불일치: {image.size} != (960, 600)")
                if image.mode != "RGBA":
                    fail(errors, f"{prefix} 투명 PNG 모드 불일치: {image.mode} != RGBA")

        variant = (row.get("전후기형") or "").strip()
        note = (row.get("비고") or "").strip()
        if variant and variant != "기본형" and not note:
            warnings.append(f"{prefix} 후기형/파생형 대표 이미지 근거가 비고에 없음")

    if len(keys) != len(set(keys)):
        fail(errors, f"[{slug}] manifest 세대 키 중복")
    extra_map = set(mapping) - set(keys)
    missing_map = set(keys) - set(mapping)
    if extra_map:
        fail(errors, f"[{slug}] manifest에 없는 연결표 키: {sorted(extra_map)}")
    if missing_map:
        fail(errors, f"[{slug}] 연결표에 없는 manifest 키: {sorted(missing_map)}")

    if require_complete:
        if len(makers) != 1:
            fail(errors, f"[{slug}] 완료 검수는 제조사 하나여야 함: {sorted(makers)}")
        elif makers:
            maker = next(iter(makers))
            expected_keys = maker_generations.get(maker, set())
            actual_keys = set(keys)
            if actual_keys != expected_keys:
                missing = sorted(expected_keys - actual_keys)
                extra = sorted(actual_keys - expected_keys)
                fail(errors, f"[{slug}] 엔카 노출 세대 전수 범위 불일치: 누락={missing}, 초과={extra}")

    return errors, warnings


def main() -> int:
    parser = argparse.ArgumentParser(description="엔카 모델·세대와 이미지 연결을 교차 검수합니다.")
    parser.add_argument("--brand", action="append", help="검수할 폴더 slug. 생략하면 manifest가 있는 전체 폴더")
    parser.add_argument("--require-complete", action="store_true", help="해당 제조사의 노출 세대 전체가 들어왔는지도 검사")
    args = parser.parse_args()

    brands = args.brand or sorted(path.parent.name for path in ASSET_ROOT.glob("*/manifest.csv"))
    all_errors: list[str] = []
    all_warnings: list[str] = []
    for brand in brands:
        errors, warnings = check_brand(brand, args.require_complete)
        all_errors.extend(errors)
        all_warnings.extend(warnings)

    for warning in all_warnings:
        print(f"경고: {warning}")
    for error in all_errors:
        print(f"오류: {error}")

    if all_errors:
        print(f"실패: {len(brands)}개 제조사, 오류 {len(all_errors)}개, 경고 {len(all_warnings)}개")
        return 1
    print(f"통과: {len(brands)}개 제조사, 오류 0개, 경고 {len(all_warnings)}개")
    return 0


if __name__ == "__main__":
    sys.exit(main())
