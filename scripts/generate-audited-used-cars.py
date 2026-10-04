from __future__ import annotations

import argparse
import csv
import json
import re
from collections import defaultdict
from pathlib import Path


DEFAULT_GENERATIONS = Path(r"C:\Users\bobae\Downloads\Claude outputs\codex_encar_1004\catalog_fill_generations_1004.csv")
DEFAULT_GRADES = Path(r"C:\Users\bobae\Downloads\Claude outputs\codex_encar_1004\catalog_fill_grades_1004.csv")
DEFAULT_DANJI = Path(r"C:\Users\bobae\Downloads\Claude outputs\BB_Danji_Sangsa_Dealer_DB_v2_1004.xlsx")


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def year_month(value: str) -> tuple[int, int] | None:
    match = re.match(r"\s*(\d{4})(?:\.(\d{1,2}))?", value or "")
    if not match:
        return None
    return int(match.group(1)), int(match.group(2) or 1)


def number(value: str) -> int | None:
    digits = re.sub(r"[^0-9]", "", value or "")
    return int(digits) if digits else None


def fuel_of(*parts: str) -> str:
    text = " ".join(parts).lower()
    if "수소" in text:
        return "수소전기"
    if "플러그인" in text or "phev" in text:
        return "플러그인 하이브리드"
    if "하이브리드" in text or "+전기" in text or re.search(r"(?:^|\s)\d+(?:\.\d+)?h(?:\s|$)", text):
        return "하이브리드"
    if "전기" in text or re.search(r"\bev\b|electric", text):
        return "전기"
    if "lpg" in text:
        return "LPG"
    if "디젤" in text or "tdi" in text or "crdi" in text or re.search(r"\d+d(?:\s|$)", text):
        return "디젤"
    return "가솔린"


def body_of(group: str) -> str:
    if re.search(r"suv|x\d|gl[abceks]|카이엔|마칸|우루스|컬리넌|벤테이가|모하비|쏘렌토|싼타페|투싼|코나|셀토스|스포티지|니로", group, re.I):
        return "SUV"
    if re.search(r"카니발|스타리아|v클래스|그랜드스타렉스", group, re.I):
        return "RV"
    if re.search(r"718|911|박스터|카이맨|296|458|488|f8|sf90|우라칸|아벤타도르|amg gt", group, re.I):
        return "스포츠카"
    if re.search(r"i30|벨로스터|a클래스|1시리즈", group, re.I):
        return "해치백"
    return "세단"


def normalize(value: str) -> str:
    return re.sub(r"[^0-9a-z가-힣]", "", (value or "").lower())


def load_complexes(path: Path) -> list[dict[str, str]]:
    import openpyxl

    workbook = openpyxl.load_workbook(path, read_only=True, data_only=True)
    sheet = workbook["단지"]
    headers = [cell.value for cell in sheet[1]]
    allowed = {"서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"}
    complexes: list[dict[str, str]] = []
    per_region: defaultdict[str, int] = defaultdict(int)
    for values in sheet.iter_rows(min_row=2, values_only=True):
        row = dict(zip(headers, values))
        province = str(row.get("시도") or "").strip()
        district = str(row.get("시군구") or "").strip()
        name = str(row.get("단지명") or "").strip()
        if province not in allowed or not district or not name or per_region[province] >= 4:
            continue
        district = district.replace("수원", "수원시") if district == "수원" else district
        complexes.append({"province": province, "district": district, "name": name})
        per_region[province] += 1
    return complexes


def build_rows(repo: Path, generations_path: Path, grades_path: Path, danji_path: Path) -> list[dict[str, object]]:
    generations = read_csv(generations_path)
    grades = read_csv(grades_path)
    grades_by_key: defaultdict[tuple[str, str, str], list[dict[str, str]]] = defaultdict(list)
    for row in grades:
        grades_by_key[(row["제조사"], row["모델그룹"], row["세부모델"])].append(row)

    catalog = json.loads((repo / "src/prototype/data/model-catalog-kr.json").read_text(encoding="utf-8"))
    images: dict[tuple[str, str], str] = {}
    for maker in catalog["makers"]:
        maker_name = maker["maker"]
        maker_id = maker["makerId"]
        for group in maker["groups"]:
            for model in group["models"]:
                local = repo / f"public/assets/models/kr/{maker_id}/{model['value']}.png"
                if local.exists():
                    images[(maker_name, normalize(group["label"]))] = f"models/kr/{maker_id}/{model['value']}.png"
                    break

    maker_alias = {"메르세데스-벤츠": "벤츠"}
    preferred = ["현대", "기아", "BMW", "벤츠", "포르쉐", "페라리", "람보르기니", "벤틀리", "롤스로이스"]
    candidates: list[tuple[dict[str, str], str, str]] = []
    used_groups: set[tuple[str, str]] = set()
    for maker in preferred:
        for row in generations:
            if maker_alias.get(row["제조사"], row["제조사"]) != maker:
                continue
            group_key = normalize(row["모델그룹"])
            image = images.get((maker, group_key))
            release = year_month(row["출시 연월"])
            if not image or not release or (maker, group_key) in used_groups:
                continue
            grade_options = grades_by_key.get((row["제조사"], row["모델그룹"], row["세부모델(엔카 원문)"]), [])
            if not grade_options:
                continue
            used_groups.add((maker, group_key))
            candidates.append((row, image, maker))

    priority = ["그랜저", "아반떼", "쏘나타", "아이오닉 5", "싼타페", "투싼", "카니발", "쏘렌토", "K5", "K8", "3시리즈", "5시리즈", "X3", "C클래스", "E클래스", "S클래스", "718", "911", "296", "488", "우라칸", "우루스", "컨티넨탈 GT", "팬텀", "컬리넌"]
    by_maker: defaultdict[str, list[tuple[dict[str, str], str, str]]] = defaultdict(list)
    for item in candidates:
        by_maker[item[2]].append(item)
    for maker_items in by_maker.values():
        maker_items.sort(key=lambda item: item[0]["모델그룹"])
    selected: list[tuple[dict[str, str], str, str]] = []
    selected_keys: set[tuple[str, str]] = set()
    for wanted in priority:
        wanted_key = normalize(wanted)
        match = next((item for item in candidates if normalize(item[0]["모델그룹"]) == wanted_key), None)
        if match:
            selected.append(match)
            selected_keys.add((match[2], normalize(match[0]["모델그룹"])))
    cursor = 0
    while len(selected) < 64:
        added = False
        for maker in preferred:
            maker_items = by_maker[maker]
            while cursor < len(maker_items):
                item = maker_items[cursor]
                key = (item[2], normalize(item[0]["모델그룹"]))
                if key not in selected_keys:
                    selected.append(item)
                    selected_keys.add(key)
                    added = True
                    break
                cursor += 1
            if len(selected) >= 64:
                break
        cursor += 1
        if not added:
            break
    if len(selected) < 64:
        raise RuntimeError(f"only {len(selected)} audited model groups could be generated")

    complexes = load_complexes(danji_path)
    dealer_names = ["김도윤 딜러", "이서준 딜러", "박하린 딜러", "최지호 딜러", "정민서 딜러", "윤재현 딜러", "한서아 딜러", "오민준 딜러"]
    supercar_mins = {"포르쉐": 10_000, "페라리": 20_000, "람보르기니": 18_000, "벤틀리": 12_000, "롤스로이스": 18_000}
    rows: list[dict[str, object]] = []
    for index, (generation, image, maker) in enumerate(selected):
        key = (generation["제조사"], generation["모델그룹"], generation["세부모델(엔카 원문)"])
        grade_options = grades_by_key[key]
        grade = grade_options[index % len(grade_options)]
        start = year_month(generation["출시 연월"])[0]
        end_value = year_month(generation["단종 연월"])
        end = min((end_value or (2026, 12))[0], 2026)
        year = max(start, end - (index % max(1, min(4, end - start + 1))))
        age = max(1, 2026 - year)
        mileage = 8_000 if year == 2026 else age * (10_000 + (index % 6) * 1_800)
        low = number(grade["시세 최저(만원)"]) or number(generation["시세 최저(만원)"]) or 1_000
        high = number(grade["시세 최고(만원)"]) or number(generation["시세 최고(만원)"]) or low + 1_000
        price = round((low + high) / 2 / 10) * 10
        price = max(price, supercar_mins.get(maker, 0))
        complex_row = complexes[index % len(complexes)]
        personal = index % 5 == 4
        place = f"{complex_row['province']} {complex_row['district']}" if personal else f"{complex_row['province']} {complex_row['district']} · {complex_row['name']}"
        grade_name = grade["등급(엔카 원문)"].strip() or grade["연료·구동"].strip()
        fuel = fuel_of(grade["연료·구동"], grade_name, generation["세부모델(엔카 원문)"])
        rows.append({
            "id": 11_001 + index,
            "maker": maker,
            "modelGroup": generation["모델그룹"],
            "title": f"{maker} {generation['모델그룹']} {generation['세대코드(이름에서 추출)'] or generation['세부모델(엔카 원문)']}",
            "trim": grade_name,
            "year": year,
            "mileage": mileage,
            "fuel": fuel,
            "transmission": "오토",
            "price10k": price,
            "place": place,
            "sellerType": "개인" if personal else "딜러",
            "dealer": "개인판매자" if personal else dealer_names[index % len(dealer_names)],
            "image": image,
            "postedMinutes": index + 1,
            "badges": [] if personal else (["인증중고차"] if index % 3 == 0 else ["1인소유"]),
            "origin": "국산" if maker in {"현대", "기아"} else "수입",
            "body": body_of(generation["모델그룹"]),
            "sourceGeneration": generation["세부모델(엔카 원문)"],
            "release": generation["출시 연월"],
            "discontinued": generation["단종 연월"],
        })
    return rows


def render(rows: list[dict[str, object]]) -> str:
    payload = json.dumps(rows, ensure_ascii=False, indent=2)
    return """// Generated by scripts/generate-audited-used-cars.py from the 2026-10-04 Encar generation/grade references.\n""" + \
        """// Do not hand-edit the listing facts; rerun the generator when the source catalog changes.\n""" + \
        """export type AuditedUsedCarSeed = {\n  id: number; maker: string; modelGroup: string; title: string; trim: string; year: number; mileage: number; fuel: string; transmission: string; price10k: number; place: string; sellerType: \"개인\" | \"딜러\"; dealer: string; image: string; postedMinutes: number; badges: string[]; origin: string; body: string; sourceGeneration: string; release: string; discontinued: string;\n};\n\n""" + \
        f"export const auditedUsedCarSeeds = {payload} as const satisfies readonly AuditedUsedCarSeed[];\n"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--generations", type=Path, default=DEFAULT_GENERATIONS)
    parser.add_argument("--grades", type=Path, default=DEFAULT_GRADES)
    parser.add_argument("--danji", type=Path, default=DEFAULT_DANJI)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[1]
    output = args.output or repo / "src/prototype/data/audited-used-cars.ts"
    output.write_text(render(build_rows(repo, args.generations, args.grades, args.danji)), encoding="utf-8")


if __name__ == "__main__":
    main()
