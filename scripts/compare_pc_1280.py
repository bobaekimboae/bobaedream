"""JOB-3 [변경 6] 실개발 PC 1280 ↔ PR 시안 수치 대조.

사용:
  python scripts/compare_pc_1280.py http://127.0.0.1:5173/?qf=guazi&pc=1

결과는 reports/job3-change6/compare_pc_1280.json 에도 저장한다.
"""

import asyncio
import json
import pathlib
import subprocess
import sys

try:
    from playwright.async_api import async_playwright
except ModuleNotFoundError:
    # 저장소는 @playwright/test(Node)를 고정 의존성으로 갖는다. Python 패키지를
    # 추가 설치하지 않고도 같은 검사를 실행하도록 Node 구현으로 넘긴다.
    raise SystemExit(subprocess.run(["node", "scripts/compare_pc_1280.mjs", *sys.argv[1:]], check=False).returncode)

DEV_LIST = "https://dev.bbmuseum.co.kr/car/list"
OURS_LIST = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:5173/?qf=guazi&pc=1"
PROPS = ("x", "y", "w", "h", "fs", "lh", "fw", "color", "bg", "br", "pad", "gap")

# 콘텐츠 문자열·목록 개수는 비교에서 제외하고, 구조와 시각 속성만 대조한다.
LIST_PAIRS = [
    ("헤더", ".app-shell__header", ".bbm-header", ("h", "bg")),
    ("목록 본문", ".car-list-renewal", ".is-usedcar-parity", ("x", "w")),
    ("상단 개요", ".car-list-overview", ".bbm-hybrid-top", ("x", "y", "w", "h")),
    ("경로", ".car-list-catalog-breadcrumb", ".bbm-hybrid-top > .bbm-ct-crumbs", ("x", "y", "h", "fs", "lh", "fw")),
    ("검색 조건", ".car-list-content-filter", ".bbm-content-head.is-chotot", ("x", "y", "w", "h", "bg", "br")),
    ("매물 수", ".car-list-quick-filter-summary", ".bbm-ct-title-row", ("x", "y", "h")),
    ("필터 칩 줄", ".car-list-mobile-filter__tabs", ".bbm-ct-chip-row", ("x", "y", "h")),
    ("필터 칩", ".car-list-mobile-filter__button--filter", ".bbm-filter-button", ("h", "fs", "lh", "br")),
    ("차종 줄", ".car-list-category-menu", ".bbm-category-menu", ("x", "y", "w", "h")),
    ("차종 라벨", ".car-list-category-menu__label", ".bbm-category-menu__label", ("fs", "lh", "fw", "color")),
    ("좌측 필터", ".car-list-filter", ".bbm-filter", ("x", "y", "w")),
    ("필터 요약", ".car-list-filter-summary", ".bbm-filter-summary", ("x", "y", "w", "h", "bg")),
    ("필터 제목", ".car-list-filter-summary__title", ".bbm-filter-title strong", ("fs", "fw", "color")),
    ("초기화", ".car-list-filter-summary__reset", ".bbm-filter-reset", ("fs", "lh", "fw", "color")),
    ("제조사 항목", ".car-list-filter-menu__item", ".bbm-filter-item.is-maker-grade", ("x", "y", "w")),
    ("제조사 머리", ".car-list-filter-menu__header", ".bbm-filter-item.is-maker-grade > .bbm-filter-toggle", ("y", "w", "h", "fs", "lh", "fw")),
    ("제조사 카탈로그", ".car-list-filter-catalog", ".bbm-filter-item.is-maker-grade .bbm-catalog", ("x", "y", "w", "h")),
    ("제조사 구역명", ".car-list-filter-catalog__section-title", ".bbm-catalog h3", ("fs", "lh", "fw", "color")),
    ("제조사 행", ".car-list-filter-catalog__row", ".bbm-catalog-row", ("h",)),
    ("목록 본체", ".car-list-main", ".bbm-content", ("x", "y", "w")),
    ("목록 툴바", ".car-list-content-toolbar", ".bbm-toolbar", ("x", "y", "w", "h", "bg")),
    ("판매자 탭", ".car-list-content-toolbar__seller-tab", ".bbm-seller-tabs button", ("h", "fs", "lh", "fw", "color")),
    ("영상 매물", ".car-list-content-toolbar__video-filter", ".bbm-video-filter", ("h", "fs", "lh", "fw", "color")),
    ("보기 방식", ".car-list-content-toolbar__view", ".bbm-view", ("h", "fs", "lh", "fw", "color")),
    ("매물 카드", ".car-list-result-card", ".bbm-result-card", ("x", "y", "w", "h", "bg")),
    ("카드 안쪽", ".car-list-result-card__main", ".bbm-card-main", ("x", "y", "w", "h")),
    ("카드 사진", ".car-list-result-card__image", ".bbm-card-photo", ("x", "y", "w", "h", "br")),
    ("카드 제목", ".car-list-result-card__title", ".bbm-card-title", ("fs", "lh", "fw", "color")),
    ("카드 사양", ".car-list-result-card__spec", ".bbm-card-spec", ("fs", "lh", "fw", "color")),
    ("카드 가격", ".car-list-result-card__price", ".bbm-card-price", ("fs", "fw", "color")),
]

DETAIL_PAIRS = [
    ("상세 본문", ".car-detail-page", ".pc-detail-container", ("y", "w")),
    ("상세 열", ".car-detail-content-layout__columns", ".pc-detail-columns", ("y", "w", "gap")),
    ("상세 왼쪽", ".car-detail-content-layout__main", ".pc-detail-left", ("y", "w")),
    ("갤러리", ".car-detail-gallery", ".pc-gallery", ("y", "w", "h")),
    ("대표 사진", ".car-detail-gallery__main", ".pc-hero", ("y", "w", "h", "br")),
    ("대표 이미지", ".car-detail-gallery__image", ".pc-hero-photo", ("w", "h")),
    ("사진 상단 버튼", ".car-detail-gallery__top-action", ".pc-hero-tools button", ("w", "h", "br", "bg")),
    ("썸네일 줄", ".car-detail-gallery__thumbs", ".pc-thumbnail-region", ("y", "w", "h")),
    ("썸네일", ".car-detail-gallery__thumb", ".pc-thumbnail-track button", ("w", "h", "br")),
    ("요약 카드", ".car-detail-section", ".pc-overview", ("y", "w", "h", "bg", "br", "pad")),
    ("요약 제목", ".car-detail-overview__title", ".pc-overview-copy h1", ("y", "fs", "lh", "fw")),
    ("요약 설명", ".car-detail-overview__lead", ".pc-overview-copy > p", ("fs", "lh", "fw", "color")),
    ("요약 사양", ".car-detail-overview__spec", ".pc-overview-specs", ("fs", "lh", "fw")),
    ("요약 통계", ".car-detail-overview__stats", ".pc-overview-stats", ("fs", "lh", "color")),
    ("오른쪽 패널", ".car-detail-content-layout__aside", ".pc-sidebar", ("y", "w")),
    ("가격 카드", ".car-detail-content-layout__aside > :first-child", ".pc-summary", ("w", "bg", "br", "pad")),
    ("가격", ".car-detail-price-summary__price", ".pc-price-row strong", ("fs", "fw")),
    ("보험이력 행", ".car-detail-price-summary__link", ".pc-summary-links button", ("h", "fs")),
    ("비용 버튼", ".car-detail-price-summary__action", ".pc-calculators button", ("h", "br")),
    ("판매자 카드", ".car-detail-seller-card", ".pc-seller", ("w", "bg", "br")),
    ("판매자 이름", ".car-detail-seller-card__name", ".pc-seller h2", ("fs", "lh", "fw")),
    ("상담 버튼", ".car-detail-seller-card__contact", ".pc-seller-contact button", ("h", "br", "fs", "fw")),
]

JS = """(sel) => {
  const e = document.querySelector(sel);
  if (!e) return null;
  const r = e.getBoundingClientRect(); const c = getComputedStyle(e);
  return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),
    fs:c.fontSize,lh:c.lineHeight,fw:c.fontWeight,color:c.color,bg:c.backgroundColor,
    br:c.borderRadius,pad:c.padding,gap:c.gap};
}"""


async def grab(browser, url, pairs, detail=False):
    page = await browser.new_page(viewport={"width": 1280, "height": 1000}, device_scale_factor=1)
    await page.goto(url, wait_until="networkidle", timeout=60000)
    if detail:
        await page.locator(".car-list-result-card" if "bbmuseum" in url else ".bbm-result-card").first.click()
        await page.wait_for_timeout(800)
    else:
        await page.wait_for_timeout(500)
    selectors = [pair[1] if "bbmuseum" in url else pair[2] for pair in pairs]
    values = [await page.evaluate(JS, selector) for selector in selectors]
    await page.close()
    return values


def equal(prop, left, right):
    if prop in ("x", "y", "w", "h"):
        return abs(left - right) <= 1
    if prop == "gap" and {left, right} <= {"normal", "0px"}:
        return True
    return left == right


def rows_for(pairs, dev, ours, screen):
    rows = []
    for pair, left, right in zip(pairs, dev, ours):
        name, dev_sel, our_sel, props = pair
        diffs = []
        if left is None or right is None:
            diffs.append("선택자 없음")
        else:
            for prop in props:
                if not equal(prop, left[prop], right[prop]):
                    diffs.append(f"{prop} {left[prop]}→{right[prop]}")
        rows.append({"screen": screen, "name": name, "devSelector": dev_sel, "oursSelector": our_sel,
                     "status": "일치" if not diffs else "다름", "differences": diffs})
    return rows


async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch()
        dev_list, our_list = await asyncio.gather(
            grab(browser, DEV_LIST, LIST_PAIRS), grab(browser, OURS_LIST, LIST_PAIRS))
        dev_detail, our_detail = await asyncio.gather(
            grab(browser, DEV_LIST, DETAIL_PAIRS, True), grab(browser, OURS_LIST, DETAIL_PAIRS, True))
        await browser.close()

    rows = rows_for(LIST_PAIRS, dev_list, our_list, "목록") + rows_for(DETAIL_PAIRS, dev_detail, our_detail, "상세")
    out_dir = pathlib.Path("reports/job3-change6")
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "compare_pc_1280.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    for row in rows:
        suffix = "" if row["status"] == "일치" else " · " + "; ".join(row["differences"])
        print(f'[{row["screen"]}] {row["name"]}: {row["status"]}{suffix}')
    different = sum(row["status"] == "다름" for row in rows)
    print(f"PC 1280 대조: 전체 {len(rows)}건 · 일치 {len(rows)-different}건 · 다름 {different}건")
    raise SystemExit(1 if different else 0)


asyncio.run(main())
