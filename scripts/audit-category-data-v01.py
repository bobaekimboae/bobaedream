from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path


DEFAULT_DANJI = Path(r"C:\Users\bobae\Downloads\Claude outputs\BB_Danji_Sangsa_Dealer_DB_v2_1004.xlsx")
DEFAULT_GRADES = Path(r"C:\Users\bobae\Downloads\Claude outputs\codex_encar_1004\catalog_fill_grades_1004.csv")


def load_generated(path: Path) -> list[dict[str, object]]:
    text = path.read_text(encoding="utf-8")
    match = re.search(r"export const auditedUsedCarSeeds = (\[.*\]) as const", text, re.S)
    if not match:
        raise RuntimeError("auditedUsedCarSeeds payload not found")
    return json.loads(match.group(1))


def load_complexes(path: Path) -> set[tuple[str, str]]:
    import openpyxl

    workbook = openpyxl.load_workbook(path, read_only=True, data_only=True)
    sheet = workbook["단지"]
    headers = [cell.value for cell in sheet[1]]
    result: set[tuple[str, str]] = set()
    for values in sheet.iter_rows(min_row=2, values_only=True):
        row = dict(zip(headers, values))
        province = str(row.get("시도") or "").strip()
        name = str(row.get("단지명") or "").strip()
        if province and name:
            result.add((province, name))
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--danji", type=Path, default=DEFAULT_DANJI)
    parser.add_argument("--grades", type=Path, default=DEFAULT_GRADES)
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[1]
    rows = load_generated(repo / "src/prototype/data/audited-used-cars.ts")
    complexes = load_complexes(args.danji)
    with args.grades.open(encoding="utf-8-sig", newline="") as handle:
        grade_names = {row["등급(엔카 원문)"].strip() or row["연료·구동"].strip() for row in csv.DictReader(handle)}

    failures: list[str] = []
    if len(rows) != 64:
        failures.append(f"승용 샘플 수: {len(rows)} (기대 64)")
    for key in ("id", "title", "image"):
        if len({row[key] for row in rows}) != len(rows):
            failures.append(f"중복 {key}")

    supercar_makers = {"포르쉐", "페라리", "람보르기니", "벤틀리", "롤스로이스"}
    for row in rows:
        released = int(str(row["release"])[:4])
        discontinued = int(str(row["discontinued"])[:4]) if row["discontinued"] else 2026
        year = int(row["year"])
        if not released <= year <= min(discontinued, 2026):
            failures.append(f"연식 범위: {row['id']} {year} not {released}~{discontinued}")
        annual = int(row["mileage"]) / max(1, 2026 - year)
        if not 8_000 <= annual <= 20_000:
            failures.append(f"연간 주행거리: {row['id']} {annual:.0f}km")
        if row["trim"] not in grade_names:
            failures.append(f"등급 근거 없음: {row['id']} {row['trim']}")
        if row["maker"] in supercar_makers and int(row["price10k"]) < 10_000:
            failures.append(f"슈퍼카 가격: {row['id']} {row['price10k']}만원")
        if row["sellerType"] == "개인" and "인증중고차" in row["badges"]:
            failures.append(f"개인 인증 배지: {row['id']}")
        if row["sellerType"] == "딜러" and " · " in str(row["place"]):
            region, complex_name = str(row["place"]).split(" · ", 1)
            province = region.split()[0]
            if (province, complex_name) not in complexes:
                failures.append(f"단지 DB 불일치: {row['id']} {row['place']}")
        if re.search(r"\(가상\)|가상 매물 전시장|UI 검증용 가상 매물|가상시 테스트구|해당 없음", " ".join(map(str, row.values()))):
            failures.append(f"금지 문구: {row['id']}")

    result = {
        "checked": len(rows),
        "unique_ids": len({row["id"] for row in rows}),
        "unique_images": len({row["image"] for row in rows}),
        "failures": failures,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    raise SystemExit(1 if failures else 0)


if __name__ == "__main__":
    main()
