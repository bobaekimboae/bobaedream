# Quick Filter Spec

## Shared Rules

- Preserve the depth order: `차량유형 → 제조사 → 모델 → 세대 → 트림`.
- The main-home search submits its trimmed value as `q`; a main-home brand card submits `maker`. The listing restores both from the URL so entry intent survives navigation and reload.
- A keyword filters result cards only. It does not remove the selected maker/model/generation rail or recalculate its available hierarchy. When a keyword produces zero results, the primary recovery action clears only `q` and preserves the selected vehicle depth.
- `제조사`, `모델`, and `세대` use the shared `DepthCard` pattern.
- `트림` uses text-only `TrimChip` controls and keeps only the leading `전체` chip.
- No `전체` card appears in the `제조사`, `모델`, or `세대` card rails.
- If a selected model has no generation data, skip to trim when trim data exists. If neither generation nor trim data exists, stay on the current model rail with the model selected.
- In the vehicle picker sheet, show `세대 정보 없음` only after selecting a model with no generation data.

## Depth Card

- Card size: 80×72.
- Rail height: 96 with 12px top and bottom padding. The 1px bottom divider is drawn just outside the rail (`box-shadow`) so it does not reduce the bottom padding.
- Rail label: 13px, vertically centered against the rail.
- Card background: `#F7F8FC`.
- Card radius: 8px.
- Card gap: 8px.
- Selected state: Bobaedream blue tint and border.
- Model and generation image slot: 56×28.
- Vehicle target inside slot: visible width 53–56 and height 24–27.
- Card vertical layout: top 7, image 28, gap 6, name 15, gap 1, second line 13.
- Manufacturer logo slot remains 48×28.
- Manufacturer logos use 28px symbol marks or 44px wordmarks, centered and bottom-aligned.

## Body Type And EV

- Model and generation card second line is one body-type word only: `세단`, `SUV`, `해치백`, `쿠페`, `컨버터블`, `왜건`, `MPV`, `밴`, or `픽업`.
- BEV cards also show only the body-type word. Do not use `전기 ○○` on the second line.
- BEV model and generation cards show one spark SVG icon only.
- Spark icon: 16×16, `#177245`, no circle or box background, `aria-label="전기차"`, top 4 and left 4.
- `bodyType` and `isEV` data stay available for card text, icon display, and future filtering.
- Do not show the removed model body-type tab row.

## Trim Chips

- Trim chips are immediate-toggle ChoTot-style text pills.
- Height: 32.
- Background: white.
- Border: `#DDE1E7`.
- Text: 14px, weight 400.
- Selected state uses Bobaedream blue.
- Zero-inventory choices are disabled.
- No checkbox, apply button, or vehicle-header replacement appears in the trim rail.

## Summary Chips And Top Rail

- PC Encar-style navigation hierarchy (2026-10-18, final): keep the GNB as borderless 16px text tabs, but mark the current section only with 700-weight black text—no underline and no blue navigation accent. On used-car and truck pages, attach a dedicated 48px white LNB directly below the GNB: 32px rectangular chips, 6px radius, 8px gap, neutral `#F4F5F6` default and `#222`/white current state, followed by one continuous `#E5E7EB` divider. Remove the breadcrumb and the duplicate category chip from the filter card on those pages; applied search-condition chips remain black. Blue is reserved for the logo, search action and primary listing CTA. Other categories keep the ChoTot-style breadcrumb until they receive a full LNB. `&lnb=a/b/c` remain comparison-only. Mobile is unchanged.
- PC applied-filter chips (2026-10-18): keep the established black selected state (`#222` background, white text) in the ChoTot-style filter rail. Navigation blue is reserved for GNB/LNB selection and must not replace the black filter-chip state.
- PC truck LNB (2026-10-18): truck and used-car child categories share the same 32px rectangular-chip LNB. Current state is black, not blue.
- PC header wordmark balance (2026-10-18): the default listing header uses Korean `보배드림` in brand blue `#306BD9` beside the existing 30px blue circular emblem. Search and `판매하기` use the same blue, while GNB/icon copy remains black, producing one blue brand/primary-action axis against neutral navigation. The shorter Korean lockup is the production default; `&pclogo=en` keeps the former English wordmark as a comparison-only preview.
- Guazi 필터 버튼 아이콘은 노션 `0_0_필터 FilterHeader`의 원본 SVG를 `public/assets/bbm/chip-filter-header.svg`에 적용한다. 24×24 viewBox 안의 세 조절선이며 위·아래 핸들은 x=8, 가운데 핸들은 x=16이다. PC와 모바일이 같은 파일을 20×20px로 표시한다. 파일명을 별도로 두어 이전 브라우저 캐시와 구분한다. 이전 깔때기·단순 조절선·비교용 아이콘은 기본안으로 사용하지 않는다.
- Top chip order (2026-10-18 classified-site audit, 지역·매매단지 추가): `[필터] [중고차/카테고리] [세부 차종·선택 단계] [제조사] [가격] [연식] [주행거리] [연료] [판매자] [지역] [매매단지]`. 사용자가 대상을 먼저 좁히고 예산·차량 상태·판매 주체를 정한 뒤 거래 위치를 좁히도록 배치한다. 지역과 매매단지는 각각 기존 전체 필터 패널을 재사용한다.
- Guazi: before a manufacturer, PC uses `[필터] [전체차량] [제조사] [가격] [연식] [주행거리] [연료] [판매자] [지역] [매매단지]`; after a manufacturer, category-specific steps and the selected maker/model/generation/trim chips stay between category and the price slot. Price, year, mileage, fuel, seller, region/district, and complex applied chips remain in their semantic slots instead of jumping into the general applied-chip group. Mobile keeps its existing compact omissions (no empty mileage, seller, region, or complex chip) while applied values can still appear. The summary chip keeps its 220px max width, clear, and depth-return behavior.
- Guazi (QF-091): the category landing shows the original circular vehicle-type row instead of the depth-0 type cards. Choosing a type swaps the same slot to the quick-filter rail from the manufacturer step; clearing the category chip brings the type row back. Rail, DepthCard, and trim chip specs are unchanged.
- Show `연식` until generation selection; hide it after generation selection.
- Always show `색상`.
- Vehicle summary chip combines manufacturer, model, and generation.
- Summary chip max width is 220px with ellipsis, while the clear `X` remains visible.
- Clear `X` unwinds the deepest selected level first.
- Tapping the chip label opens the vehicle picker sheet.
- Tapping selected model, generation, or trim chips returns to that depth without changing the selection.

## Vehicle Picker Sheet

- Vehicle picker sheet opens from the merged summary chip.
- Model and generation options wrap to multiple lines.
- Manufacturer options wrap when the list grows beyond one row.
- Sheet height is capped at 80% viewport height with internal vertical scrolling.
- Reset and apply actions stay sticky at the bottom.

### 제조사·모델 선택 시안 선택 요약·로고 규칙 (2026-10-06)

- 모델·세부모델·연료·구동 화면은 브레드크럼·테두리 박스·하단 중복 칩 대신 헤더 바로 아래에 선택된 제조사·모델·세대를 각각 한 줄로 표시한다.
- 각 선택 행은 이름 15/22px·400, 좌측 16px, 오른쪽 40×40px X를 사용한다. 세대 행은 이름 아래 연식 13/18px 회색 보조문구를 표시한다.
- 선택 행의 이름을 누르면 해당 단계로 돌아가고, X를 누르면 그 단계와 하위 선택을 해제한다. 동일한 제조사·모델·세대는 다른 위치에 중복 표시하지 않는다.
- 모델을 선택한 뒤 세대 화면에서는 `모델명 전체` 행을 다시 표시하지 않는다. 세대 목록은 `세대 · 최신순` 제목 아래 바로 시작한다.
- 등급 화면의 헤더 제목은 `연료·구동` 같은 단계명이 아니라 사용자가 선택한 세대명(예: `그랜저 IG`)을 표시한다.
- 엔카 공식 국산차 검색 화면(2026-10-06 재실측)을 따른다. 연료·배기량을 체크하면 바로 아래 등급을 인라인으로 펼치고, 체크를 해제하면 그 하위 선택을 지우며 목록도 닫는다. 등급도 같은 방식으로 체크 시 세부등급을 열고 해제 시 하위 선택과 목록을 닫는다. 복수의 연료·배기량 또는 등급을 체크하면 각 하위 묶음을 동시에 열어 두며, 한 묶음만 여는 아코디언으로 만들지 않는다. 세부등급은 사용자가 직접 선택한다.
- 등급 트리에는 `연료·배기량`, `등급`, `세부등급` 같은 중간 제목과 연결선을 표시하지 않는다. 모든 행은 흰색 바탕을 유지하고 체크박스의 들여쓰기만으로 위계를 표현한다.
- 체크박스 왼쪽 기준은 화면 x=16px(1뎁스), 52px(2뎁스), 88px(3뎁스)이며 뎁스당 36px씩 내려 쓴다. 체크박스와 이름 간격은 12px, 매물 수는 화면 오른쪽 16px 축에 고정한다.
- 등급 행 구분선은 체크박스가 아니라 각 행 이름이 시작되는 지점부터 오른쪽 끝까지 표시한다. 연결선·화살표·뎁스별 회색 바탕은 사용하지 않는다.
- 제조사 목록 로고 슬롯은 v4 기준 38×26px, 이름과 간격은 12px, 행 높이는 48px으로 고정한다. 로고 중심 x=35px, 제조사명 시작점 x=66px을 모든 행에서 유지한다.
- 로고 원본은 투명 여백을 제거한 별도 파일을 사용한다. 가시 영역은 `√(폭×높이)=26px`을 기본으로 하되 최대 38×26px 안에서 원본 비율을 유지한다.
- 선택 행에는 제조사 로고를 반복하지 않는다.

## Dialog And Full-filter State

- Opening the mobile full-filter snapshots the applied detailed-filter values. Row clears, nested sheets, reset, and the availability switch edit that draft; only the bottom `N대 보기` action commits it.
- Close, dim click, Escape, and browser Back discard the mobile full-filter draft and return focus to the control that opened it.
- Shared filter modals, sheets, and the mobile full-filter move focus to their close button on open, keep Tab focus inside the active dialog, lock background scrolling, and restore focus on close.

## Images And Logos

- 바이크 카테고리(2026-10-10)는 제조사보다 먼저 유형 13종(`네이키드 · 스쿠터 · 스포츠 · 멀티퍼포즈 · 크루저 · 클래식 · 언더본 · 투어러 · 오프로드 · 전기 · 삼륜 · ATV · 기타`)을 이미지 퀵필터로 노출한다. 하나를 고르면 같은 자리에서 제조사 레일로 진행하고, 상단 적용 칩의 X로 유형을 해제하면 유형 레일로 돌아온다.
- 바이크 유형 레일은 초톳 슬롯을 그대로 사용한다: 모바일 셀 76×102px·이미지 68×40px·첫 시작 16px·간격 8px, PC 셀 84×102px·이미지 76×40px·첫 시작 20px·간격 8px. 라벨은 12/18px·500·`#595959`, 가운데 정렬, 최대 2줄이다.
- 유형 대표 이미지는 `public/assets/bike/types/autoscout-v01/`의 960×600 투명 PNG를 사용한다. 차량 전체와 두 바퀴가 보여야 하며 앞머리는 왼쪽, 바닥선·수평 중심·접지 그림자를 통일한다. 차체는 AutoScout24식 밝은 무채색을 기본으로 하고 유형 식별에 필요한 기능색만 소면적으로 허용한다.

- Vehicle images and manufacturer marks follow `docs/quick-filter-image-slot-rules_v03.md` and `docs/image/quickfilter_image_production_manual_v01.md`. The older asset and layout documents describe the currently deployed implementation; where their image-direction or production claims conflict, v03 is the authority.
- 차량군별 색상·재질·조명 제작값은 `docs/image/autoscout24_chotot_vehicle_image_manual_v01.md`와 기계 판독용 `docs/image/vehicle_category_color_manifest_v01.csv`를 따른다. 카테고리 식별은 `실루엣 → 주요 구조 → 제한된 식별색` 순서이며, 색만 바꾼 동일 형상은 승인하지 않는다.
- 공통 재질색은 차체 백색 `#F4F5F6`, 차체 음영 `#D9DDE1`, 구조 그래파이트 `#24292F`, 타이어 `#101214`, 유리 `#71818A`, 금속 `#B7BDC2`를 뼈대로 한다. 카테고리별 면적 비율은 매니페스트 값의 ±5% 안에 두며, 이미지마다 포인트색을 임의로 추가하지 않는다.
- 접지 그림자는 중립 `#12181C`, 마스터 접지선 아래 2px, 불투명도 8~16%(상한 20%)로 이미지에 직접 포함한다. 카테고리별 폭·높이·블러는 색상 매니페스트 값을 따르며 CSS `box-shadow`나 `drop-shadow()`로 다시 만들지 않는다.
- 분류형 퀵필터는 초톳 슬롯의 좌향 90도 정측면을 사용한다. 메인 홍보형 카테고리 이미지는 필요할 때만 3/4 구도를 허용하되 같은 카테고리 팔레트·재질·광원은 유지한다. 모든 승인본은 sRGB·투명 RGBA여야 한다.
- Classification quick-filter images use an exact 90-degree left-facing side profile on a transparent 8:5 master canvas. Three-quarter views are reserved for promotional/main-category surfaces and must not be mixed into classification rails.
- Model and generation assets should be 192×96 when available.
- Passenger vehicles use `bodyFit: "width"`.
- Trucks, special vehicles, buses, campers, vans, and motorcycles use `bodyFit: "height"` without changing the active slot size.
- Prefer `public/assets/brand/dongchedi/` brand marks for matched manufacturer rails and picker sheets.
- Keep explicit fallback assets only for brands missing from the workbook, such as `리막` and `루시드`.
- Guazi (QF-097): for 벤츠·BMW·현대·기아·포르쉐·페라리·람보르기니·벤틀리·롤스로이스, models and sub-models come from the bbmuseum catalog snapshot `src/prototype/data/model-catalog-kr.json` (re-fetch `node scripts/model-catalog-kr.mjs`, then `node scripts/model-images-kr.mjs`); the screen never calls the API. Only models/sub-models with listings (count > 0) appear. Model order: numbers → Latin → 가나다, `기타` last, 벤츠 `A클래스` sorted as `A-클래스`. Names are cut at the bracket. Model card image = most-listed sub-model with an image. Sub-model cards newest first; big text = chassis code (+` HEV` for hybrids) → N세대 → year, or the sub-model name when every code in the model is the same (포르쉐 718); small text = facelift words·years (`디 올 뉴·22~현재`). Images `public/assets/models/kr/{maker_id}/{value}.png` (bobaedream image_url → 당근 code/generation/single match → none = dashed 56×28 slot); width 56, height-fit when the slot would overflow, bottom-aligned. Left filter model/grade, model chip modal/sheet and the vehicle picker sheet use the same data. Check: `npm run check:models`.
- Guazi (QF-097 보완, PR #88): model order = numeric current models → Latin → 가나다 → numeric old models (no sub-model with `~현재`, e.g. 벤츠 190·280) → `기타`. One count basis = on-screen sample listings (all filters except model/sub-model/trim): quick-filter model/sub-model cards appear only with ≥1 listing; the left filter, model chip modal/sheet and vehicle picker list every catalog model/sub-model including 0 (0 is greyed/disabled). Each listing links to one catalog model (longest model name at the start of the title after the maker, or modelGroup). Top chips are per step: `[벤츠 ×][E클래스 ×][W213 ×]`; each `×` clears that step and below; empty `제조사`/`모델` chips hide once chosen; breadcrumb/title still join the step names. The sub-model rail label is `세부모델`. Missing bobaedream images (no extension) are listed in `reports/qf-097/missing-images.csv`.
- Guazi (QF-096): maker rail, PC left filter maker list and maker chip modal/sheet use `public/assets/brand/kr/{slug}.png` (manifest.json, CREDITS.md; regenerate with `node scripts/brand-logos-kr.mjs`). Names follow the left filter labels (`bbCatalog`); aliases live in `bbm-brand-logos.tsx`. Logo size by ratio r (trimmed width÷height), design v1 (restored in QF-096 보완 3; the earlier 72-wide balance, 56×26 frame, 36×36 canvas and 64-wide wordmark rules are cancelled): rail box 48×28 at card top 8, centered; r ≤ 1.25 → width = min(44, 28·r), height = min(28, width÷r); r > 1.25 → width = min(44, 28·√r), height = width÷r; every logo stays inside the box. List box 24×24 (left filter, drawer, chip modal, mobile maker sheet, vehicle picker), logo contained and centered, name gap 8, row 39.6. Debug: with `&debug=1`, the `로고 칸 안내선` checkbox next to the build badge outlines the 48×28 / 56×28 / 24×24 boxes (outline only, remembered in localStorage) and puts an 8px red dot on any box whose logo/image overflows. Rail order = left filter (domestic → 1×44 #E4E7EC divider → popular imports → remaining imports by name), zero-count and 기타 makers hidden. Rail title is governed by Quick Filter Alignment. Check: `npm run check:logos`.
- Guazi (QF-100, preview only; 2026-10-08 로고 균형 보정): `&qfcard=plain` switches the maker/model/sub-model rails to a ChoTot-style plain look (`.marketplace.is-qf-plain`, `src/prototype/listing/qf-plain.css`); without it the default Guazi cards are unchanged. ChoTot brand-row measurements from four 1080×2340 captures at 384 CSS px: PC cell 84×102, pitch 92; mobile cell 76×102, pitch 84; both use a 40×40 logo box at top 6 and name 14/21 400 #595959 14 below. No background/border/selected state; pressed opacity 0.6 for 0.1s. 승용 제조사 로고는 슬롯을 바꾸지 않고 v4 광학 면적 규칙 `√(폭×높이)=26px`, 최대 38×26px, 원본 비율 유지, 중앙 정렬을 적용한다. Rail gap below the chip row PC 16 · mobile 10; mobile first cell 4px left of the first chip. Model/sub-model rails use a separate photo slot: PC cell 84×102, mobile cell 72×102 with 8px gap; mobile image canvas 64×40 at top 6, `contain`, `center bottom`; name 14/21 600 #222 14 below; sub text 12/16 #8C8C8C. Measurements and rulebook: Google Sheet `보배드림 브랜드 로고·실사 슬롯 규칙 v01`.
- Guazi (QF-100 final): the plain ChoTot-style rails are the Guazi default (no parameter or `&qfcard=plain`); `&qfcard=card` shows the previous Guazi cards for comparison. Gap from the chip row to the maker/model/sub-model rail is PC 18 · mobile 14 (ChoTot's filter-chip row → region-chip row); if a region-chip row is added later, that row → maker rail is PC 16 · mobile 10. Model card second line is the body type in both looks (no listing count); sub-model second line stays the years.
- Guazi (QF-105): the trim rail is a ChoTot pill row in every Guazi look (`.marketplace.is-qf-guazi`, `src/prototype/listing/qf-trim.css`): white, 1px #DDDDDD, height 32, fully rounded, 16 side padding, 14px 400 #222, 8 gap, horizontal scroll, pressed opacity 0.6; no leading `전체` chip and no selected style. Start with all trims; pressing a pill applies that one trim at once, adds a black step chip after the sub-model chip (`[벤츠][C클래스][W206][C200 ×]`), closes the rail, and appends the trim to the title and breadcrumb; its × clears only the trim and reopens the rail. A sub-model with one trim shows no trim rail. Trim rail box = pill 32 (PC: chip row → pill 18, pill → top-card end 16; mobile: 2 above, 6 below). Rail labels (`모델` `세부모델` `트림`) are 14px 400 #595959 without colon, text left = first chip left (PC 140 at 1440, mobile 16), 12 to the first cell/pill, vertically centered on the cells. The left filter grade list keeps multi-select.
- Guazi (QF-103): rail vertical spacing follows ChoTot (plain and card; `src/prototype/listing/qf-rail-vertical.css`). PC: the maker/model/sub-model rail box equals the cell height (maker 102, model/sub-model their cell height; card 72), no overflow, chip row → cell 18, cell bottom → top-card end 16; the 110 quick slot shrinks to the rail and disappears when no rail is shown (trim chosen), so chip row → top-card end is 16. Mobile: rail box = 2 above + cells + 6 below (chip row → cell 12). Horizontal scrollbars are hidden. Check: `npm run check:rail-vertical` (`-- --mode=card` for the card look).

## Stable Top (QF-106)

- Guazi PC·mobile top structure follows `docs/stable-top-manual.md` (v1.1 in QF-106; v1.3 document, v1.2 layout applied in QF-106b) (layer tables, gaps, cell sizes, state table). `npm run check:stability` values must match that document; it replaces `check:rail-vertical` (QF-103 rules kept: rail box = cell height, no overflow, hidden scrollbars).
- Title is fixed by the entry category: `중고차` / `국산 중고차` / `수입 중고차` (no counts, dates, or chosen conditions). `<title>` is unchanged.
- PC: layer 0 crumbs sit outside the card on the gray page (header → 16, 18 tall, same left edge as the card, crumbs → card 12). Card: 16 → ① title row 32 → 18 → ② chip row 32 → 18 → ③ quick slot (always) → card end 16 (image row) / 24 (pill row). The enumerated region pill row is not rendered on PC; region selection remains in the full filter. Only two card heights (plain 234 / pill 172; card look 204 / pill 172).
- Guazi PC and mobile category rails do not render a bottom divider inside the search/filter card, matching ChoTot. The gray page gap outside the card remains unchanged.
- Guazi PC category landing shows the current sample listing count below each vehicle-category name in muted 11/16 text. `테마별 중고차` stays on one line; its displayed count is the combined Supercar, Luxury, Old-car, and JDM sample count. Mobile keeps the previous two-line labels without these counts.
- Mobile: ① search 40 (top 10) → 8 → ② `[위치 아이콘] 전국 ▾` 32 (no `지역:` text; icon = ChoTot `svgexport-20` `public/assets/bbm/header-location-chotot-v01.svg`, 16×16 #C0C0C0; icon → `전국` visible gap 8.53 = ChoTot (box gap 4 + 1.5); `전국` → ▾ visible 8.89 vs ChoTot 8.54, button gap 3) (no region pill row; chosen region shows as `[서울 ×]` chip) → 10 → ③ chips 32 gap 4 → 14 → ④ slot (2 + cell + 6; first cell/label x = first chip − 4) → ⑤ 8px gray band, crumbs, title, related keyword pills 28.
- First-screen category photos (QF-106b/QF-117b): the category type row keeps one transparent 640×400 source canvas and a shared bottom baseline. PC uses cells 84×102 at pitch 92, photo box 76×40 at top 6 (`contain`, `center bottom`), and name 14/21 400 #595959 width 76 with 14px image gap. Mobile uses the ④ image-row size (86 = 2 + 78 + 6; cells 64×78 pitch 72, photo box 64×40, name 12/18 500 #595959 width 56, first cell x = first chip − 4). Category photos are presented facing left with a non-destructive horizontal display transform; the v01 source pixels remain unchanged. Visual tone follows the AutoScout24 body-type assets: white/silver low-saturation body, neutral catalog light, transparent background, no heavy cast shadow; Bobaedream keeps the 3/4 vehicle angle. Different vehicle proportions are not stretched to a common body width or height.
- Pixel comparison (QF-106b): `diff:bbm` and `diff:bbm:flow` compare against the saved QF-106b baseline in `reports/baseline/` (3% limit). `--origin` compares with dev.bbmuseum directly; `--save-baseline` re-saves the baseline and archives the origin side in `reports/baseline-archive/`.
- ④ never closes: maker → model → sub-model → trim pills (skipped when none) → year pills (`2026`…`2019`·`이전`, re-click clears, row stays). Labels `모델:` `세부모델:` `트림:` `연식:`. Guazi region/trim/year pills: 32 tall, 1px `#DADADA`, 14/20 500, selected `#222` (overrides the Trim Chips border/weight above for guazi). Manufacturer cells are PC 84×102 / mobile 76×102. Model/sub-model cells are PC 84×102 / mobile 72×102 with one-line name and sub text. `필터 초기화` returns to state 1 keeping the entry category.
- Debug (`&debug=1`): `로고·이미지 칸` (red, replaces `로고 칸 안내선`), `층 상자` (blue dashed + layer numbers), `간격 숫자` (green = manual, red = differs); violations get an 8px red dot + short reason. Overlay only, remembered in localStorage.

## Model Images (QF-109)

- Guazi plain model/sub-model rails (ChoTot real-photo slot remeasurement, 2026-10-03): image area PC 76×40 · mobile 64×40, both at card top 6 and bottom-aligned; mobile card 72×102 with 8px gap (pitch 80). Images use `object-fit: contain` and `object-position: center bottom` so sedan, SUV, truck, and motorcycle preserve their own proportions while sharing one bottom baseline. Name top 60, 14/21 600 #222; sub text 12/16 #8C8C8C; one line each. Empty = same area 1px dashed #DADADA radius 6 (`src/prototype/listing/qf-model-images.css`).
- Images come from Daangn subseries first (generation match table `src/prototype/data/model-image-match.json`, `reports/qf-109/match.csv`; never guessed), then bobaedream `model_{n}.png`, else empty. Every image goes through the code-alignment part `scripts/image-normalize.mjs` (228×120, car width 224, baseline y 111, height ≤ 100, no upscaling, code-drawn shadow 220×12). Model card image = newest sub-model with a Daangn image. Rules: `docs/model-image-spec.md`. Check: `npm run check:model-images`.
- Breadcrumb has no `전체차량` step: `보배드림 / 중고차 / 벤츠 …` (`중고차` clears the maker); other categories keep their name after `중고차`.

## Maker Rail Top 10 (QF-108)

- Guazi maker rail (plain and card) = 왼쪽 `제조사` 제목 + monthly top 10 from `src/prototype/data/brand-top10.json` (domestic 6 → 1×44 divider → imported 4: 현대 · 제네시스 · 기아 · 쉐보레 · 르노코리아 · KGM │ BMW · 벤츠 · 아우디 · 포르쉐) + an 11th `전체 브랜드` cell (same cell size, circle PC 40 · mobile 36 #F4F4F4 with a grid icon, name 600 #222). It opens the same maker list as the `제조사 ▾` chip (PC modal · mobile bottom sheet: 국산차 → 수입차 인기 → 수입차 이름순, logo 24 + name + count, 0 greyed); choosing closes it and shows that maker's model rail (makers without model data stay on the maker rail).
- Maker name text box width is fixed (PC 76 · mobile 68), centered, max 2 lines.
- Plain 승용 로고는 공유 40×40 슬롯 안에서 `√(폭×높이)=26px`, 최대 38×26px로 맞춘다. 모바일과 PC는 같은 광학 규칙을 쓰고 모든 로고는 가로·세로 중앙 정렬한다. ChoTot comparison: `node scripts/brand-rail-compare.mjs` (scale 4, painted bounds).

### 초톳 제조사 로고 슬롯 재실측 (2026-10-07, 승용 레일 로고 크기 적용)

- 근거: 사용자 제공 초톳 앱 캡처 1080×2340, 384 CSS 환산(÷2.8125). `Hãng xe` 레일의 Toyota · Hyundai · Kia (Ford는 화면 끝에서 잘려 제외).
- 반복 피치 84.3px. 로고는 모두 같은 세로 중심(칩 줄 아래 끝 + 32.2px)에 가운데 정렬하고, 아래쪽 맞춤이 아니다.
- 보이는 로고 크기(투명 여백 제외): Toyota 36.6×25.2(비율 r 1.45 → 폭 91%) · Hyundai 40.2×21.3(r 1.88 → 폭 100%) · Kia 24.5×6.0(r 4.06 → 폭 약 61%).
- 2026-10-08 최종 적용은 개별 예외를 두지 않고 v4 광학 면적 규칙으로 통일했다. 원형 BMW·벤츠는 26×26, 기아 약 38×9.1, 제네시스 약 38×7.7, 현대 약 36.2×18.7이다.
- 로고 세로 중심 → 이름 글자 윗선 31.5px, 칩 줄 아래 끝 → 이름 글자 윗선 63.7px.
- 적용(2026-10-08): 과쯔 승용 제조사 레일(plain, 모바일·PC)은 Drive `원본_오토홈_0925`에서 받아 투명 여백을 잘라낸 `public/assets/brand/rail-v01/`(manifest.json) 로고를 `railBrandLogo`로 그린다. 40×40 상자 가운데, 크기는 `chototRailLogoSize`의 v4 광학 면적 규칙을 쓰며 브랜드별 강제 폭 예외는 없다. 르노코리아·KGM은 헤이딜러 로고 폴더(Drive `1eZlq0MkFywDT_2mHo5fXoylfAGEX8kcr`)의 현행 로고(평면 다이아몬드 · 남색 KGM 글자, 구형 르노삼성·쌍용 로고 미사용). 바이크·트럭 등 다른 유형 레일은 기존 로고 그대로.
- 세로 위치(칩 줄 → 로고 중심 42, 로고 중심 → 이름 윗선 37.9)는 QF-100 초톳 4장 실측(상자 위 6 · 이름까지 14)과 이번 캡처(32.2 · 31.5)가 달라 확정 전까지 기존 값을 유지한다.

### 초톳 로고·아이콘 아래 1단·2단 라벨 규칙 (2026-10-12)

- 근거: 사용자 제공 초톳 앱 `Thú cưng` 캡처(`1000017904.jpg`, 첨부본 591×1280)를 S25 Ultra 논리 폭 412dp로 환산했다(배율 1.434px/dp). `Chó` 1단 라벨과 `Thú cưng khác`·`Phụ kiện, Thức ăn, …` 2단 라벨을 같은 레일에서 대조했다.
- 세로 기준점은 로고·아이콘의 **보이는 잉크 끝이 아니라 슬롯 상자 아래끝**이다. 카테고리 원형 아이콘 슬롯은 44×44px, 제조사 로고는 기존 40×40px 슬롯을 유지하며 각 슬롯 안에서 광학적으로 가운데 정렬한다.
- 슬롯 아래끝 → 1단 텍스트 line box 윗선은 **8px**로 고정한다. 원본의 실제 글자 잉크까지 보이는 공백은 약 12px(첨부본 17px ÷ 1.434 = 11.9px)이며, 폰트의 위쪽 leading을 포함한 CSS 간격은 8px이다.
- 1단 텍스트는 **14px / line-height 20px / 400 / `#595959` / 가운데 정렬**이다. 한 줄 이름도 두 줄 이름과 같은 1단 기준선에서 시작하며, 두 줄 칸의 가운데로 따로 내리지 않는다.
- 2단 텍스트는 1단과 같은 14/20 규격을 쓰고 별도 `margin-top`은 **0px**이다. 1단 윗선 → 2단 윗선은 **20px**(원본 글자 잉크 윗선 427→455~456px, 환산 19.5~20.2px)이다.
- 라벨 블록 높이는 1단 **20px**, 2단 **40px**이며 최대 2줄이다. `word-break: keep-all`과 2줄 말줄임을 쓰고, 한 줄·두 줄 항목이 섞여도 로고/아이콘 슬롯과 1단 기준선은 전 항목이 같아야 한다.
- 이 규칙은 제조사 로고·카테고리 아이콘·바디타입 아이콘처럼 **세로형 퀵필터 레일**에 공통 적용하며, 모델 실사 이미지 레일의 별도 사진 슬롯 규칙은 유지한다. QF-100의 `이름 14 아래`는 이 실측 규칙의 `슬롯→line box 8px`로 대체한다.

## PC Left Filter Order (QF-110)

- Guazi PC left filter (and the 1024–1279 drawer) order comes from one config array `bbmFilterOrder` in `src/prototype/filters/bbm-filter-options.ts`: `제조사 · 모델` (open by default) → `연식` → `주행거리` → `가격` → `바디타입` → `차급` (closed) → `지역` → `매매단지` → … (rest unchanged). The filter header stays on top. ChoTot/Dongchedi PC keep the original order (`order` prop not passed). The mobile filter sheet is unchanged for now and can switch to the same array later. Check: `npm run check:sidebar`.

### PC 제조사·모델 좌측 탐색 (2026-10-18)

- Guazi 승용 PC 좌측 첫 항목은 `제조사 · 모델 · 등급`이며 처음부터 펼친다. ChoTot/Dongchedi, 트럭, 바이크, 부품 필터는 기존 동작을 유지한다.
- 탐색 순서는 차란차 PC와 같은 `제조사 → 모델(전체) → 세부모델(세대명·연식) → 등급`이다. 선택한 제조사·모델·세부모델은 같은 영역 위의 한 줄 경로로 쌓이고 각 단계의 X는 그 단계와 하위 선택을 지운다. 등급 단계는 실제 차량 카탈로그의 `연료·구동 → 등급 → 세부등급` 3단 체크 트리이며 회색 연결선으로 깊이를 표시한다. 상위 체크는 모든 하위를 선택·해제하고, 일부 하위만 선택되면 상위 원형 체크를 부분 선택으로 표시한다.
- 국산차 화면은 국산 제조사 전체, 수입차 화면은 수입 제조사 전체를 표시한다. 전체 중고차 화면은 국산·수입 구분을 모두 표시한다.
- 현재 승용 매물은 UI 테스트 데이터이므로 좌측 제조사·모델·세부모델·등급의 노출·선택 가능 여부를 매물 수와 연결하지 않는다. 0대 항목도 숨기거나 비활성화하지 않는다. 재고 집계 전 임시 숫자는 제조사=카탈로그 모델 수, 모델·세부모델·등급=카탈로그 최하위 항목 수이며 실제 매물 대수로 오해하지 않도록 재고 연동 시 교체한다.
- 좌측 탐색은 상단 퀵필터와 동일한 maker/model/generation/grade 상태를 사용하고 선택 즉시 목록과 URL 상태에 반영한다.

## Daangn Filter Hierarchy

- Guazi PC·mobile full filters use the Daangn used-car information hierarchy: status, brand, vehicle type, fuel, price, year, mileage, transmission, and sale method are the default visible filters.
- Existing filters outside that set are preserved below one `필터 더보기` control. Category and truck `형식/적재용량` also stay in the expanded area instead of competing with the default filters.
- Mobile uses a dimmed backdrop and a rounded bottom sheet with fixed header and action footer. Bobaedream blue remains the action color.
- The PC fixed sidebar uses the same default/expanded split and provides `숨기기`; the collapsed 48px control restores the sidebar. The 1024–1279 drawer is not collapsible.

## Region Drill (QF-111)

- Data `src/prototype/data/regions-kr.json`: 17 sido + 228 si·gun·gu (no districts for 세종); metro cities sorted 가나다, provinces 시 first then 군. District values are stored as bbm check `district` = `"서울 강남구"` (sido included); listings match the first two words of `place`.
- PC region row (always 32 tall, card height unchanged): `지역:` + 17 sido + `내 주변` → sido chosen: chip `[서울 ×]` and the same row becomes `서울:` + `서울 전체` (selected, 700) + district pills → district chosen: chip `[강남구 ×]`, row stays, one district at a time, same district or `서울 전체` clears it. `[서울 ×]` also clears its district and returns to the sido row; 세종 keeps the sido row.
- Mobile `지역: 전국 ▾` opens a two-step bottom sheet (no chip row added): sido 3-column pills (40 tall) + `내 주변` → `← 서울` step with `서울 전체` + districts → choosing closes it, chips `[서울 ×][강남구 ×]`, bar `지역: 서울 강남구`; 세종 applies at once. `필터 N` counts sido and district separately; `필터 초기화` returns to the start. Check: `node scripts/region-flow-check.mjs`, `npm run check:stability` (region steps).

## Price Filter

- Guazi 가격 필터는 모바일 바텀시트와 PC 중앙 모달에서 동일한 `PriceFinalPanel`을 사용한다.
- PC 좌측 필터의 `가격` 행도 아코디언을 펼치지 않고 같은 중앙 모달을 연다. 제조사·모델 탐색만 전용 탐색 구조를 유지한다.
- 본문 순서는 `일반 / 리스·렌트` 탭 → 최저·최고 가격 직접 입력(만원) → 가격 구간 칩이다.
- 입력값과 구간 칩은 임시 값이다. 닫기, 배경 클릭, Esc는 버리고 `N대 보기`만 적용한다.
- 초기화는 가격 범위와 가격 종류만 지우며 다른 필터값을 유지한다. 최저가가 최고가보다 높으면 오류를 표시하고 적용 버튼을 비활성화한다.

## Quick Filter Alignment (QF-113)

- Guazi 퀵필터의 모든 카테고리와 뎁스는 현재 초톳처럼 별도 좌측 제목 칸을 두지 않는다. 유형·세부유형·제조사·모델·세부모델·트림·연식·차종 요약 및 하위 알약 줄은 이미지·로고·알약 슬롯부터 시작한다. 첫 슬롯 시작선은 PC 20px, 모바일 16px로 통일하며 화면 문맥은 선택 칩과 각 레일의 접근성 `aria-label`로 유지한다.
- 모바일 앱의 `숏폼중고차`(이전 `영상 매물`·`숏폼매물`)는 초톳 앱처럼 별도 스위치 없이 문구 자체를 누르는 텍스트 필터로 사용한다. 선택 상태의 크기·동작·색은 아래 「모바일 목록 제어행」(2026-10-08 초톳 녹화 재실측, 선택 색 D안 `#F7F7F7` 바탕 · `#222` 1px 테두리)을 따른다. PC는 문구 오른쪽의 38×22px 스위치(손잡이 16px·내부 여백 3px·이동 16px)를 유지한다.
- The `필터` chip keeps its text and appends the count (`필터` → `필터 2`, #222 when any condition) with a fixed 92px width, so the next chip never shifts (PC 240 at 1440 · mobile 114).
- Mobile Guazi follows the ChoTot chip rhythm at 384px: the rail keeps 16px screen-side margins, 4px between ordinary chips, and 32px chip height. Normal, selected, and fixed filter chips use symmetric 12px inline padding and a 2px icon/text, text/arrow, or text/clear gap. The fixed filter chip remains 92px wide, including its existing 6px separation from the scrolling chip rail.
- The landing first chip is `중고차` (not `전체차량`) in guazi only; other modes keep `전체차량`.
- Title after choosing a type from the type row = the type name (`트럭 · 특장` · `바이크` · `캠핑카` · `올드카` · `건설기계` · `부품 · 용품`); 중고차 stays `중고차`.
- `npm run check:stability` checks ① same first-cell x on every image rail, ② same x for the chip after `필터`, ③ same image-rail top and bottom lines (처음 → 벤츠 → C클래스 → W206 → C200).

## Bike · Truck Maker Rails (QF-114)

- For `바이크` and `트럭 · 특장` the guazi maker rail uses its own top 10 (`src/prototype/data/brand-top10-bike.json` · `brand-top10-truck.json`, month noted): bike 대림(DL) · KR모터스 │ 혼다 · 야마하 · 스즈키 · 가와사키 · BMW · 할리데이비슨 · 두카티 · 베스파; truck 현대 · 기아 · 타타대우 · KG모빌리티 │ 볼보 · 스카니아 · 만(MAN) · 벤츠 · 이베코 · 다프(DAF). No passenger brands. Same cell size, logo box, 3-step logo sizes, name width, left `제조사` title, divider and 11th `전체 브랜드` as the passenger rail.
- Brands with 0 sample listings stay in the rail and are dimmed (opacity 0.4); the 2026-09 guazi sample has no bike/truck listings, so all are dimmed. Brands without a logo file show a first-letter circle (#F4F4F4, 600).
- `전체 브랜드` and the `제조사 ▾` chip open that type's full list only (국산 → 수입 이름순 → 기타), 0-count rows greyed but selectable.
- Logos: 타타대우 · 만(MAN) from Daangn company images (`scripts/brand-logos-kr.mjs`); 대림 · KR모터스 · 야마하 · 가와사키 · 할리데이비슨 · 두카티 · 베스파 · 다프 have no source yet. Check: `node scripts/type-maker-check.mjs`.

### 바이크 장르 이미지 파일럿 v02

- 모바일 전체 필터의 `장르` 바텀시트와 PC `장르` 모달은 같은 이미지 행을 사용한다. 행 높이는 모바일 64px·PC 60px이고, 이미지 표면은 56×40px(`#F7F7F7`, `1px #ECECEC`, 반경 6px), `contain`·`center bottom`이다.
- v02 연결 범위는 `네이키드 · 스쿠터 · 스포츠 · 멀티퍼포즈` 4개다. 생성 이미지의 어드벤처 유형은 현재 필터의 `멀티퍼포즈` 값에 연결한다.
- 이미지는 90도 완전 정측면, 앞바퀴 왼쪽·뒷바퀴 오른쪽, 투명 배경, 중립 스튜디오 조명, 약한 접지 그림자, 로고·문구·번호판 없음으로 통일한다.
- AutoTrader Canada `Browse by type`의 Street·Touring·Cruiser·SuperSport 이미지를 품질 비교 기준으로 삼는다. 흰색·은색 저채도 차체, 검은 기계부, 작은 슬롯에서 선명한 외곽과 부품 분리, 유형 간 동일한 광원·색조가 최소 통과 조건이다. 원본 파일은 복제하지 않고 시각 규칙만 대조한다.
- 슬롯 배포 파일은 180×120 투명 PNG를 사용한다. 표시 시 원본 비율을 유지하며 56×40px 표면에서 늘리거나 찌그러뜨리지 않는다.
- v02에서 이미지가 아직 없는 장르는 같은 크기의 점선 빈 슬롯을 유지한다. 확인하지 않은 유형 이미지를 다른 장르에 임의 재사용하지 않는다.

## Mileage Filter Final (QF-117)

- Guazi only (`mileage-final`, `src/prototype/filters/bbm-mileage.tsx` · `.css`; BbmSheet/ActionBar untouched). Value model unchanged: `ranges.mileage = { min, max, preset }` (comma strings), no max = `""` (null, "제한 없음").
- The slider uses seven equally spaced visual anchors: 0 · 1만 · 3만 · 6만 · 10만 · 15만 · 15만+. The last two are separate: 15만 is a finite value and 15만+ is the no-maximum endpoint. Value interpolation is piecewise between anchors. All use the same inset-11 coordinate system, and the first/last tick centers match the handle centers. Handles 22 (hit 44), no crossing, arrow keys ±1,000, bubbles show `0km` / `제한 없음` while dragging/focused.
- Chips (6): 1만km 이하 (0–10,000) · 1~3만km · 3~6만km · 6~10만km · 10~15만km · 15만km 이상 (150,000–no max). One at a time, re-tap clears, shown selected only when min/max match exactly.
- Mobile bottom sheet: header 64 (title 20/28 750 −0.35px, close 36 visible / 44 hit, right 24), body 16 sides / 22 bottom, inputs `minmax(0,1fr) 12px minmax(0,1fr)` gap 10 (393: 164.5 · 12 · 164.5), 48 tall, 2px #E4E4E4, radius 12; chips 3 columns (393: 115×48); footer 80 with 초기화 92×52 + `N대 보기` (live draft count). Draft is separate from applied: close, backdrop and Esc discard it; min > max disables apply.
- PC left sidebar (300): inputs stacked full width, same slider/ticks, chips 2 columns; no mobile header/footer. The PC chip opens the QF-118 modal instead.
- Summary text (chips row, filter list): chip name, direct range `3.5~8만km`, no max `N만km 이상`, no min `N만km 이하`. Check: `node scripts/mileage-check.mjs`.

## PC Left Sidebar Stability (QF-119)

- Guazi PC left filter (1280+, `.marketplace.is-bbm.is-hybrid`, `src/prototype/listing/qf-sidebar-stable.css`): top-anchored sticky `top: 16`, fixed height = viewport − 32; the header (`필터 · 초기화 · 검색조건 유지`, row reserved at 26) stays on top and only the item list scrolls (`overflow-y: auto`, `overscroll-behavior: contain`, thin scrollbar shown on hover). The old bottom-anchored negative `top` (`bbm-sticky-sidebar.ts`) is removed. The maker/model catalog chains its scroll into the sidebar list. The 1024–1279 drawer is unchanged.
- Guazi PC page disables scroll anchoring (`overflow-anchor: none`): applying a filter keeps `scrollTop`; only when the list becomes shorter than the current position does the browser clamp to the end.
- Mileage (QF-117 part) in the PC sidebar commits to the list once: handle on pointerup / keyboard keyup, inputs after 0.4s idle, Enter or blur, chips on press. Dragging never re-renders the list. The mobile sheet keeps its draft behavior.
- Mileage height never changes while operating (sheet and sidebar): the min > max error overlays the gap under the inputs and handle focus uses `preventScroll`. Tick `0` is left-aligned from the first handle center, `15만+` right-aligned to the last handle center, others centered; all inside the slider.
- Check: `node scripts/sidebar-stable-check.mjs` (PC 1024 · 1280 · 1440 step table + mobile 393 sheet), `npm run check:sidebar`.

## Pretendard Variable (QF-120)

- Guazi only: `src/prototype/fonts/pretendard.ts` attaches `public/assets/fonts/pretendard/pretendard-guazi.css` (Pretendard Variable 45–920, Korean dynamic subset from pretendard@1.3.9, `OFL.txt`) and `<html class="qf-font-pretendard">` when `?qf=guazi` (module load + layout effect, removed when switching modes). `font-display: swap`; the 14 first-screen subsets (5, 78–79, 81–91) are preloaded.
- Font order follows Daangn Cars: `-apple-system, BlinkMacSystemFont, "Pretendard Variable", "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`, applied to every text element in guazi with `!important` (debug badge/overlays excluded), because the shared `src/prototype/base.css` still imports the CDN static `Pretendard` for ChoTot/Dongchedi (unchanged).

- PC Korean typography (2026-10-18, Daangn Cars live measurement): keep letter spacing at the font default; use 400 for listing titles/body, 500 for navigation/filter choices, 600 for price emphasis, and 700 for selected navigation/section titles. The PC listing uses title 16/24 400 and price 18/27 600 so the Daangn rhythm fits the existing denser Bobaedream card.
- Intermediate weights (650, 750) now render as themselves. Checks: `node scripts/font-impact-check.mjs` (line wraps/clipping before vs after), `node scripts/font-load-measure.mjs` (first-screen load).

## PC Mileage Chip Modal (QF-118)

- Guazi PC (1024+) top chip row: `필터 · 중고차 · 제조사 · 가격 · 연식 · 주행거리 · 연료 · 판매자 · 지역 · 매매단지` (2026-10-18 classified-site priority). The `주행거리 ▾` chip uses the same chip spec; with a value it is replaced in place by the black applied chip (`1만km 이하` · `3~6만km` · `3.5~8만km` · `15만km 이상` + ×, mileage only) and counts in `필터 N`. Mobile keeps no empty mileage chip.
- The chip opens `MileageFinalSheet variant="modal"` (same QF-117 part and QF-119 rules): centered, width `min(480px, 100vw − 48px)`, radius 16, max height `100vh − 96px` (only the body scrolls), 50% dim, page scroll locked with scrollbar-width compensation, 0.15s fade + 8px rise (none with reduced motion). Content = mobile sheet (header 64, inputs `1fr 12px 1fr` gap 10, chips 3 columns, footer 80); at 480 the grid gives inputs 208 and chips 144.
- Draft starts from the applied value; `N대 보기` applies mileage only (list, chips, left sidebar); close, backdrop and Esc discard; 초기화 clears only the mileage draft. The list stays frozen while open.
- Accessibility: `role="dialog"`, `aria-modal`, `aria-labelledby`, focus on close (preventScroll) when opened, Tab trapped, focus returns to the mileage chip (or its applied chip). Check: `node scripts/mileage-modal-check.mjs`.
- Slider drag keeps the active handle in a synchronous ref so the first fast pointer move is not dropped. Handles keep a constant visual size while dragging; no grab/release scale animation is used because it reads as positional bounce, especially on the right handle.
- Pointer dragging follows the rail in 100km increments so a 393px rail does not visibly jump 3–4px per update. Keyboard arrows retain the 1,000km step for efficient accessible operation.
- The mileage reset action follows the Airbnb-style state cue: `#B7B7B7` and disabled when the draft range is empty, `#222` and enabled as soon as any mileage value is selected; resetting returns it to gray immediately.
- The drag value bubble changes to edge-aligned positioning only at the exact 0 and 100,000 endpoints. Intermediate values keep the same centered anchor so crossing the former edge threshold does not look like the handle jumped.

## Seller Type Sheet

- The `판매자` quick-filter chip follows `연료` and precedes the location hierarchy `지역 → 매매단지`, because seller type and transaction location are late-stage conditions rather than first vehicle-discovery conditions. When applied, its dark applied chip stays in that semantic slot. Mobile keeps seller type inside the full filter and its separate `개인 · 딜러` listing-control tabs.
- Guazi `판매자 유형` uses a 24px top-radius bottom sheet, `max-height: calc(100dvh - 36px)`, and `rgba(15,18,24,.48)` backdrop. Mobile is full width; PC preview is centered at the bottom with `max-width: 480px`. Header and footer stay fixed while only the body scrolls.
- Header is 64 high with centered `판매자 유형` at 20/28 700 and a 1px `#E8E8E8` divider. Close control has a 44×44 hit area at top 10/right 16, a 24×24 visible X at 1.8px, and closes through the shared `BbmSheet` handler. Its history marker cleanup is Strict Mode-safe, so the sheet does not close immediately after opening in development.
- Body starts 16 below the header and has 20 side padding. Rows are 56 high without a description and 68 with one. Layout is checkbox 20×20 → 12 gap → icon slot 32×32 (visible SVG max 24×24) → 12 gap → copy → right count. Title is 16/22 600, description 13/18 400, count 13/18 500. Dividers start at the title column and use `#E8E8E8`; the last row has none.
- Checkbox uses a 2px `#D9D9D9` border when empty and `#222` fill/border with a white 14px, 3px-round-stroke check when selected. No yellow or blue selection background is used.
- Footer is `80px + safe area` with 20 side padding, 10 gap, a 92×52 `초기화` action, and a remaining-width 52-high `N대 보기` action with radius 12 and `#222` background. The count is recalculated from the draft filters and actual deduplicated listing results.
- The sheet keeps draft selection until `N대 보기` is pressed. Row presses update only draft checks and the footer count; close, backdrop, Escape, and browser back discard changes. `초기화` clears only the draft, and applying it returns to the full seller result set.

## Mobile Listing Cards

### 모바일 목록 제어행

- 2026-10-08 초톳 앱 캡처(1080×2340)와 화면 녹화(20초)를 384 CSS(÷2.8125)로 재실측해 맞췄다. 순서는 `정렬 ▾ │ 숏폼중고차 · 개인 · 딜러 … 보기 방식`이다(정렬 뒤 세로 구분선 1px × 17, `#F0F0F0`, 화살표 잉크 끝 → 구분선 약 12, 구분선 → 첫 탭 글자 약 13).
- 제어행 높이 34px(글자 중심 → 아래 1px 구분선 17, 초톳 16.7), 좌우 16px. 아래 구분선 → 첫 카드 사진 12.5(초톳 13.0).
- 정렬: 14px · 500 · `#222`(초톳 「Mới nhất trước」 잉크 폭 89.6 = Pretendard 14/500 88.7), 화살표 13px(잉크 8.5×4.6, 초톳 8.2×4.6), 글자 → 화살표 잉크 8.2(초톳 8.1).
- 탭(비선택): 12px · 700 · `#8C8C8C`(초톳 「Có video」 잉크 폭 47.3 = Pretendard 12px 47.5~48.5), 높이 28, 좌우 4, 탭 사이 8 → 글자 사이 16(초톳 16.7).
- 탭(선택, 초톳 녹화와 같은 동작): 누르면 그 자리에서 알약으로 바뀌고 좌우 여백이 4 → 8로 커져 글자가 4 오른쪽으로 밀리며 뒤에 ×가 붙는다. 높이 28(초톳 27.7), 글자 앞 8, 글자 → × 7.5(초톳 7.9), × 잉크 4.6(초톳 5.0, 아이콘 8px), × → 알약 끝 11.4(초톳 11.4), 알약 → 다음 탭 글자 13(초톳 12.5). 다시 누르면 해제된다.
- 선택은 `숏폼중고차`와 판매자 탭을 동시에 할 수 있고, `개인`·`딜러`는 하나만 선택된다(초톳 `Cá nhân`·`Bán chuyên`과 같음). 탭 묶음만 가로 스크롤하고 정렬·보기 방식은 고정한다.
- 선택 색(2026-10-08 사용자 선택 D안): 초톳의 연노랑 바탕 + 금색 글자 대신 에어비앤비 선택 알약처럼 `#F7F7F7` 바탕 · `#222` 1px 테두리(실제 `border`, 여백 1씩 줄여 크기 유지) · `#222` 글자 · `#222` ×.
- 보기 방식 아이콘: 19px(잉크 17.4, 초톳 17.1), `#222`(`view-grid-chotot-v02.svg`, 원본 v01은 `#000`), 잉크 오른쪽 끝 x 356.3(초톳 356.3).
- PC는 기존대로 `숏폼중고차` 문구 + 38×22px 스위치를 쓴다(초톳·동처띠 구 PC `is-pc`는 동결이라 `숏폼매물` 유지).

- These rules apply to the Guazi Bobaedream mobile listing (`.bbm-m-list`) at the 384px CSS-width reference. List and feed typography are intentionally different; do not merge their font-size rules.
- 카드 축약(2026-10-08 「축약할 수 있는 것」): 제목에 이미 있는 톤수·용량·차축은 트럭 둘째 줄에서 빼고(`350마력 · 6x2`), 트레일러 `12.2m(40FT)` → `40FT`, 제목의 등급 낱말 중 차명과 겹치는 것(A-클래스, C220d)과 `N세대 W206`의 `N세대`를 빼며, 긴 제조사명은 제목에서만 `MAN`·`DAF`·`미쓰비시`·`현대`(현대머티리얼핸들링)로 줄인다(`cardTitleText`, 필터 목록은 정식 이름). 연료 `가솔린 하이브리드` → `하이브리드`, 지게차 스펙의 변속기(오토) 생략, 부품 제목의 `…용품` 분류 생략, 캠핑카 제목에서 모델명과 겹치는 형태 낱말 생략.
- 모든 카테고리(중고차 포함, 2026-10-08 「중고차도 차명 끊지 말고 연결」)는 차명을 붙여 한 제목(`벤츠 C클래스 C 200 6세대 W206 Avantgarde`, `현대 포터2 1톤 카고`)으로 보여주고, 길면 두 줄까지 줄바꿈 후 말줄임한다(`.bbm-card-model.is-joined`). 아래의 「두 의미 줄」 규칙은 폐지.
- A vehicle title is always two semantic rows, not one title that happens to wrap: row 1 is manufacturer + model (`.bbm-card-model`), and row 2 is detailed model/trim (`.bbm-card-trim`). Each row stays on one line and ellipsizes independently. Do not add an arbitrary margin between the detailed-model row and the specification row.
- List view: title 15/19 600, specification 13px, location 14px #8C8C8C (whole line), seller 14px #222 (ChoTot remeasure: location and seller are the same size; Pretendard Hangul ≈0.87em so 14px matches ChoTot ink height ≈12.4), price 16px 700 #222, and price unit 400 #222 (no red; Hyundai-certified style, the unit only drops weight). Feed view: title 16/24, specification 14px, location 14px, price 17px 700, and price unit 14px.
- 바이크 매물 v08(2026-10-08 「바이크 카테고리도 럭셔리카처럼 실제 매물 같은 정보로」): 바이크 목록은 사용자 지시 매물 `bike-001`(할리 포티에잇48, 맨 위) + 구글 시트 「가상 매물 시나리오 › 바이크」 50행(`src/prototype/bike/scenario-v08.ts`, 사진 `public/assets/bike/listings/v08/`)이다. v07의 나머지 가상 29대는 목록에서 뺐다. 제조사·모델·연식·주행·지역·가격·배기량·서류·판매자 기재 상태·튜닝·정비 요약은 시트 값 그대로, 장르·면허·변속기는 모델 기준으로 정한 값, 판매자 이름은 가상(개인 = 가상 인물 이름, 업체 = `가상 이름 딜러`). 라이트바겐 인증중고 매물만 「인증중고차」 배지(샘플 배지 없음), 업데이트순은 시트 게시일 최신순(`updateRank`, 게시 0일 = N시간 전 · 그 외 N일 전). 원본 상세 URL·매물 ID는 저장하지 않는다. 목록 썸네일은 럭셔리카 규칙 사본(43장, 근접 사진 5장 · 차 영역 오인 2장 제외). 바이크 v11(2026-10-10 「바이크도 500개 보강」): 시트 「가상 매물 시나리오 › 바이크 신규」 500행(`src/prototype/bike/scenario-v11.ts`, 사진 `public/assets/bike/listings/v11/` 640px + 목록 썸네일 `thumb/` 360×360 차 폭 90%·바닥선 85%)을 v08 뒤에 더해 바이크 목록은 551대다(업데이트순은 시트 게시일 최신순). 제조사·모델·연식·주행·가격·배기량·서류·게시일·인증중고 여부는 시트 값, 장르·면허·변속기는 모델 기준으로 정한 값(스쿠터 자동(CVT), 125cc 이하 원동기 이상), 연료는 전부 가솔린. 지역은 시트의 시도에 구·군을 돌려 붙인 값(`용산점` → 서울 용산구), 가격 빈 7대는 같은 제조사(없으면 전체) 중간값, 게시일 빈 26대는 1~3일 전. 판매자는 시트에 없어 정한 값(인증중고 26대 = 인증 판매업체, 나머지 3대 중 1대 = 전문 판매업체, 나머지 개인)이고 이름은 가상(개인은 `개인판매자`, 딜러는 실제 매매단지). 사진 속 글자(번호판·전화번호·광고)는 글자 인식으로 359곳을 흐림 처리했고, 계기판·부품·서류 등 매물 사진이 아닌 19장은 같은 모델(없으면 같은 제조사) 다른 매물 사진으로 대체했다(`image_action`).
- 바이크 카드(2026-10-07): 제목은 `제조사 모델` 한 줄(2행 없음), 스펙 줄은 `장르 · 연식 · 주행 · 배기량`(예: `네이키드 · 2023 · 2만km · 2,300cc`, 2026-10-08 「2002 숫자만 표기하자」 · 「일단 바이크만」으로 바이크만 연식 숫자만, 다른 카테고리는 `N년식` 유지).
- 건설기계 카드: 제목은 `제조사 모델` 한 줄(2행 없음, 제조사 미확인 매물은 원래 매물명), 스펙 줄은 `등록연월 · 사용시간 · 연료`(`1,800시간`, 2026-10-08 「h → 시간」; 자재운반장비도 `480시간`).
- 부품/용품 카드(2026-10-07): 제목 `제조사 모델 분류`(분류 낱말이 모델명에 있으면 생략), 스펙 줄 `규격 · 수량 · 적용 차종 · 상태`(예: `245/45R18 · 4개 · 그랜저 GN7 · 중고 80%`), 가격은 부품 가격대(`partsCardDetailsV01`, 3~420만원). 연식·연료·변속기·「해당 없음」은 넣지 않는다.
- 부품/용품 필터(2026-10-07): 상단 칩은 연식·주행거리·연료 대신 `분류 · 상태 · 적용 차종 · 가격`. 좌측 필터·모바일 전체 필터 순서는 `partsFilterOrder`(브랜드 → 분류 → 상태 → 적용 차종 → 가격 → 지역). 가격 구간은 `partsPricePresets`(`~5만원 · 5~20만원 · 20~50만원 · 50~100만원 · 100~300만원 · 300만원~`)이고 리스·렌트 탭은 숨긴다. 상태는 `새 상품 · 미사용 · 중고`(중고 NN%는 중고로), 적용 차종의 `범용 5x112` 등은 `범용`으로 묶는다.
- 캠핑카 카드(2026-10-08 개편): 구분은 `모터홈 · 카라반 · 트레일러`(`캐러밴` 표기 폐지, 카테고리 칩도 `전체 · 모터홈 · 카라반 · 트레일러`). 제목은 `제조사 모델 + 세부 형태`(클래스 C · 캠퍼밴 · 팝업 캠퍼, 구분 낱말은 제목에서 뺌). 스펙 줄은 바이크 장르처럼 구분을 맨 앞에: 모터홈 `모터홈 · 20년06월 · 8만km · 전기`, 카라반·트레일러 `카라반 · 18년형`. 모터홈만 그 아래 둘째 줄 `승차 6명 · 취침 3명`(2026-10-08 「인」 → 「명」)(승차 정원 `campingSeatsV01`, 가상 값). 카라반·트레일러는 한 줄에 들어가므로 `카라반 · 18년형 · 취침 4명` 한 줄(2026-10-08, `견인형`은 뺌). 해외 표기(영국 `4 berth`·미국 `Sleeps 4`·독일 `4 Schlafplätze`·일본 `就寝4名`)처럼 침대 수가 아니라 인원 기준. 모든 카테고리 매물 제목에 `UI 검증용 가상 매물`을 넣지 않는다.
- 트레일러 카드(2026-10-07, 2026-10-10 「트레일러는 연식 뒤에 3축」 → 「적재도 추가해라, 축 앞에」 갱신): 엔진이 없어 `등록연월 · 적재 · 축수 · 길이`(예: `22년09월 · 적재 27톤 · 3축 · 14m`, `trailerSpecsV01`)를 목록형·피드형 모두 한 줄로 쓴다(목록형도 둘째 줄로 나누지 않음). 2행은 세부형식만. 적재 정보가 없는 명성정공 로베드(`truck-032`)는 `15년09월 · 3축`.
- 목록 카드의 판매자·지역에는 「(가상)」 「가상 매물 전시장」 같은 표기를 쓰지 않는다(2026-10-07). 바이크·트럭·건설기계·캠핑카·자재운반장비·부품 매물의 딜러는 `가상 인물 이름 + 딜러`(승용과 같은 형식, `virtualSellerName`), 개인은 `개인판매자` 대신 가상 인물 이름만(김성일 · 홍성주 등 `privatePersonNames`, 승용 포함), 지역은 시도·시군구만. 상세 화면·시나리오 원본의 가상 표기는 그대로다.
- 실매물처럼 지시값을 보여줄 매물은 `Car.cardSpec`(예: `24년11월 · 4천km · 가솔린`)을 쓰되, 주행거리는 정확값을 넣어도 목록에서는 축약(`56,067km` → `6만km`, 2026-10-08 「주행거리는 축약해라」)한다.
- 트럭·특장 카드(엔카 화물·특장 등급명 규칙): 1행 `제조사 모델`, 2행 `톤수 + 세부형식`(예: `8.5톤 윙바디`, `1톤 카고`), 스펙 줄 `등록연월 · 주행 · 연료`(2026-10-08 유형 접두어는 붙였다가 「트럭은 연식 앞에 유형 제거」로 뺌), 별도 줄 `마력 · 적재용량 · 차축 구성`(예: `460마력 · 적재 11톤 · 6x2`, 적재는 톤으로 축약(`적재 1톤` · `적재 2.5톤`, 2026-10-08), 두 줄 사이는 추가 여백 없이 붙임, 2026-10-08 사용자 지시, Truck1 목록 표기 참고). 마력·차축은 모델·톤수별 대표 제원으로 정한 가상 값(`truckPowerSpecsV01`). **2026-10-18 PC 목록 순서**: PC 트럭 목록만 제목 바로 아래에 `마력 · 적재 · 차축`을 먼저 두고, 그 아래에 `등록연월 · 주행 · 연료`를 둔다. 모바일 목록·피드와 엔진 없는 트레일러의 기존 순서는 유지한다. 2026-10-10 「트럭들도 적재 기존처럼 추가해」: 적재는 제목에 톤수가 있어도 빼지 않고 항상 `마력 · 적재 · 차축` 순서로 넣는다(제목과 겹치는 차축 표기만 생략). `truck-031`도 `350마력 · 적재 11톤 · 6x2`. 적재는 톤 단위면 `적재 N톤`, 버스 인승·탱크 ㎘·믹서 ㎥는 그대로, 트랙터처럼 적재가 차축과 같으면 생략. 엔진 없는 트레일러는 기존 `적재량 · 길이 · 축` 한 줄. **2026-10-10 「적재는 빼는게 어떨까, 목록형에서」**: 모바일 목록형 트럭 카드는 2행에 톤수가 이미 있어 스펙 줄에서 `적재 N톤`을 뺀다(`350마력 · 6x2`, 마력이 없으면 첫 줄만). 피드형·PC·트레일러는 적재를 그대로 둔다. 주행 9,500km 이상은 만 단위(`1만km`).
- 트럭 세부 선택 줄(2026-10-18): 첫 항목의 `형식 변경` 버튼은 제거하고 칩 앞에 비활성 텍스트 라벨 `유형:`만 둔다. 카고 적재중량 줄도 같은 문법으로 `적재중량:`을 쓴다. 유형 전환은 상단 트럭 하위 메뉴에서 담당하며 세부 유형 선택 기능은 그대로 유지한다.
- The first specification follows the compact Charancha registration-month notation instead of Encar-style slash notation: month known = `24년08월` (two-digit month, no space, no `식`), month unknown = `24년식`. **(2026-10-10 갱신 「년월 동시 표기된 거 말고는 연식은 숫자 2025 방식으로 통일」)** 월을 모르는 연식·`N년형`은 `24년식` 대신 숫자 4자리 `2024`로 쓴다(`2017년식` → `2017`, `18년형` → `2018`). 년월 동시 표기(`24년08월`, `17년10월(18년형)`)는 그대로 둔다. 적용: 목록·피드 카드 사양 줄(`bbmCardSpec`)과 PC·상세 사양(`displaySpecs`), 바이크는 원래 숫자 표기. Keep the source value unchanged and normalize only the listing display. Do not use `24/08식` or `24년 8월`.
- The unselected listing-card favorite icon uses the ChoTot reference SVG at 24px with `#8C8C8C`; the selected state keeps the same silhouette and changes only its fill color.
- In mobile list and feed views, place the favorite action at the right edge of the first vehicle-title row, following the Karrot card pattern. Reserve space only on the model row so the trim row keeps its full width. Gallery keeps the favorite over the photo, and text view keeps its compact top-right placement.
- Seller profile photos in mobile list and feed views are 16×16px circles (JOB-8, ChoTot app remeasure: avatar 16, avatar→name visible gap ≈6.6, location center → seller center 24, seller center → card divider 28; PC keeps 20×20) with `object-fit: cover` and centered cropping. The ChoTot source pack is retained in full, but vehicle-only photos, brand/dealer logos, and advertising creatives must never be assigned as seller profiles. Use distinct approved portraits per visible listing and fall back to the existing default profile icon when no approved photo is assigned.
- QA can open feed view directly with `?qf=guazi&view=feed`; the default `?qf=guazi` remains list view.
- 피드 보기(2026-10-10 「피드형이니 전체가 피드형」, 테스트 서버 dev.bbmuseum `car-list-feed-card` 390 실측): 모든 매물이 같은 큰 카드다(첫 매물만 크게 하던 초톳 규칙 폐지). 카드 위아래 12 + 아래 1px #EBEBEB, 사진 가로 꽉 참 358:207.3 · 반경 12 · 시간 11/600, 사진 → 제목 10, 제목 16/22.4 600 #1A1A1A, 사양 15/24 #9E9E9E, 가격 18/25.2 700(만원 16 400), 배지 20(11 · 500), 지역 14/18 #9E9E9E, 판매자 줄 34(프로필 20 · 이름 12/16.8 #3A3A3A) 오른쪽에 전화 · 채팅 · 찜 20(간격 24, 전화 아이콘은 dev 원본 `card-phone.svg`). 수치는 `src/prototype/listing/qf-m-view-modes.css`.
- 피드 카드 글자·판매자 줄(2026-10-10 「이미지 안 디자인은 건드리지 말고 초톳 기준으로 동일하게, 가격은 목록형 검정」): 사진 칸은 위 값 그대로 두고, 그 아래는 초톳 피드 캡처(1080×2340 → 384) 실측을 따른다. 제목 17/24 700 #222(두 줄), 사양 15 #8C8C8C 항목 사이 가운데 점 「 · 」(2026-10-10 「메타정보 가운데 점」, 초톳의 14px 간격 대신), 목록과 달리 트럭 마력·적재·차축과 모터홈 승차·취침도 둘째 줄로 내리지 않고 한 줄에 이어 쓰며 넘치면 말줄임(2026-10-10 「피드에서는 목록과 틀리게 메타정보 한줄로」), 가격 17 700 #222(만원 400, 빨강 사용 안 함), 지역 15 #8C8C8C, 판매자 프로필 24 · 이름 14/16 400 #222 · 아래 「N대 판매완료 N대 판매중」 13 #8C8C8C(딜러만, 판매완료는 가상 값), 오른쪽 전화 · 채팅 · 찜 20(간격 20, #222), 구분선 #E8E8E8. 같은 배율로 찍어 글자 윗선이 초톳과 1px 안팎. 2026-10-10 재실측(「매물간 구분선 위아래 간격 · 지역과 판매자 프사 간격」): 지역 글자 중심 → 프사 중심 24.4, 프사 아래 → 구분선 16, 구분선 1px → 다음 사진 12. 두 줄 판매자 크로스체크(같은 날): 프사 24×24 · x16, 프사 오른쪽 → 이름 글자 9.2(간격 9), 「N대 판매완료 N대 판매중」 줄은 이름보다 3 들여 씀, 이름·판매 줄 세로 중심은 초톳과 0.2px 안. 피드 카드 프사는 일러스트 대신 승인된 초톳 인물 사진 26장(허용 목록)을 매물 번호로 돌려 쓴다(2026-10-10 「프사 실제 프사로」, `sellerRealPhoto`). 목록·갤러리 등 다른 보기는 기존 프사 그대로. 같은 날 「피드와 목록 색상·간격을 목록으로」: 피드 사양 줄 색은 목록과 같은 #595959(차란차 캡처 메타 #505C6C, 초톳 피드 #8C8C8C와 비교 후 목록 기준으로 통일), 지역 글자 중심 → 판매자 중심은 목록과 같은 24, 프사 아래 → 구분선 16 유지. 지역·판매 대수 색 #8C8C8C는 그대로. 피드 줄 간격 재측정(2026-10-10 「가격이 메타정보에 붙어 답답, 지역·판매자도 답답, 초톳은 자연스럽다」, 초톳 피드 캡처와 우리 폰 캡처 1080×2340 → 384): 글자 기준선 간격 제목→메타 우리 23.5 / 초톳 21.7, 메타→가격 21.0 / 19.9, 가격→지역 28.1 / 27.0. 글자 잉크 사이 간격은 메타→가격 6.4 / 5.3, 가격→지역 12.8 / 15.0(우리가 2.2 좁음), 지역→판매자 이름 3.2 / 약 4.3. 숫자 높이로 본 글자 크기(메타 10.7 / 10.3), 왼쪽 시작 16.7 / 16.7, 오른쪽 아이콘 끝 · 아이콘 중심→구분선 28.3 / 28.3, 지역→아이콘 중심 24.2 / 24.5는 이미 같다. 색은 우리 메타 #595959 · 가격 #222, 초톳 메타 #8C8C8C · 가격 #F0325E. 한글은 글자 높이가 꽉 차서 같은 간격이어도 더 붙어 보여 메타→가격 +2, 가격→지역 +2, 지역→판매자 +2(프사 아래 → 구분선 16 유지)로 늘렸다. 메타 색은 목록과 같게(#595959) 두었다. 위치 아이콘(2026-10-10 크로스체크): 초톳 캡처 2장에서 그려진 크기 10.7×13.5, 왼쪽 18.5~29.2, 글자 시작 36.6~37.0 → 상자 15.6px(그려진 크기 11.0×13.2), 왼쪽 0, 글자와 간격 5, 아이콘 윗선 = 글자 윗선.
- 피드 사양 줄 아이콘(2026-10-10 「중고차 피드에 메타정보 아이콘, 노션 아이콘 짝 맞춤」, 같은 날 「간격 줄여보고 · 아이콘 추가」로 확장): 노션 「N_독일_오토스카우트 24」 원본을 `public/assets/bbm/meta-icons/`에 두고(`<symbol>` 래퍼만 벗기고 패스는 수정 없음) 항목 앞에 16×16으로 배치한다. 짝: 연식(`24년04월` · `2020`) = `year-calendar`(02_승용_매물리스트 01_연식), 주행거리(`8만km`) = `mileage-odometer`(02_주행거리), 연료는 종류별 아이콘(2026-10-10 「보정된 폭스바겐 연료 아이콘으로 연료 유형별 배치」, 노션 「보정된 폭스바겐 독일 연료」 원본): `가솔린` = `fuel-gasoline`(01 가솔린) · `디젤` = `fuel-diesel`(02 디젤) · `전기` = `fuel-electric`(03 전기) · `하이브리드` · `가솔린+전기` · `플러그인` = `fuel-hybrid`(04 하이브리드 가솔린/전기) · `LPG` = `fuel-lpg`(06 LPG) · `CNG` = `fuel-cng`(08 CNG, 노션 파일이 LPG와 같은 그림) · `수소` 등 그 밖 = `fuel-other`(09 기타 연료), 마력(`350마력`) = `power`(11_마력 Power), 축 수(`3축`) = `axle`(icons-sprite symbol-20), 배기량(`1,202cc`) = `engine-displacement`(엔진 symbol-81), 취침(`취침 4명`) = `sleeping-berth`(symbol-23), 사용시간(`880시간`) = `usage-hours`(symbol-204), 승차인원(`승차 5명`) = `seats`(13_좌석 Seat). 색은 사양 글자색을 따르고(`mask`), 아이콘과 글자 간격 3, 항목 사이 10(처음 4 · 14에서 줄임). 아이콘이 하나라도 있는 줄은 아이콘이 항목 구분을 맡아 가운데 점을 쓰지 않는다. 한 줄에 안 들어가는 모터홈 줄만 `승차`·`취침`이 둘째 줄로 내려간다(그 줄만 높이 44). 장르·적재·길이 등 짝이 없는 항목은 글자만, 변속기는 사양 줄에 항목이 없어 제외. **2026-10-10 「아이콘 빼자, 복잡하다」로 기본은 아이콘 없는 가운데 점 「 · 」 사양 줄**(한 줄, 넘치면 마지막 항목 말줄임)이고, 아이콘 버전은 주소 끝 `&specicon=on`으로만 비교용으로 볼 수 있다.
- 피드 사진 넘기기(2026-10-10 「레딧처럼 사진 이동하게」, 모바일 피드 전용): 사진 칸(358:207.3, 반경 12) 안에서 사진이 가로 스와이프로 한 장씩 넘어간다(`scroll-snap`, 한 번에 한 장 `scroll-snap-stop: always`). 아래 가운데에 점만 둔다(2026-10-10 「블록켓처럼 인디게이터 작게, 이미지가 묻힌다」로 알약 배경을 없앰, 블록켓 캡처 실측 점 3.9 · 피치 약 8 · 사진 아래에서 약 8.2 위): 점 6px · 간격 5(피치 11) · 사진 아래 12px 위, 현재 점은 흰색, 나머지는 흰색 60%, 현재에서 3칸 떨어진 점은 5px, 4칸 이상은 4px, 밝은 사진에서도 보이게 옅은 그림자(`0 0 3px rgba(0,0,0,.5)`). 2026-10-10 「인디게이터 에어비앤비 수준으로 키우고」: 블록켓(4px)은 작아서 에어비앤비 캡처 실측(점 6.0 · 피치 11.0 · 가장자리 5/4 · 사진 아래 약 12 위 · 알약 배경 없음)으로 바꿨다. 점은 최대 7개이고 현재 점 둘레로 창이 옮겨 간다. 시간 글자(`3분전`)는 왼쪽 아래 그대로. 사진을 한 장 보는 카드(사진 1장)는 점을 그리지 않는다. 사진 오른쪽 위 8px 안쪽에 개수 알약(레딧처럼 넘길 때만 보이고 1.5초 뒤 0.2초 동안 사라진다, 2026-10-10 「레딧은 숫자가 자동으로 없어진다」) 「2/5」(현재/전체, 높이 24 · 좌우 8 · 12/16 600 흰색 · 배경 `rgba(0,0,0,.6)`)을 함께 표시하며 스와이프에 따라 바뀐다(2026-10-10 「레딧처럼 상단 우측에 사진개수」).
- 사진 위 등록시간 배경(2026-10-12 「초톳 등록시간 배경, 우리 시간 안 보일 때 많다」, 초톳 캡처 1080×2340 실측): 초톳은 썸네일 아래에 투명 → 검정 약 50% 세로 그라데이션을 깔고 흰 글자(굵게)를 올린다(글자 가운데 사진 아래 약 15px, 왼쪽 약 10px). 우리는 모바일에서 그라데이션을 없애 밝은 사진에서 시간이 묻혔으므로, 모바일 목록·갤러리·피드의 사진 아래에 `linear-gradient(rgba(0,0,0,0), rgba(0,0,0,.5))`를 깔고(목록 높이 36 · 갤러리 40 · 피드 44) 시간 글자를 12px 600 흰색으로 올린다(왼쪽 10, 아래 6~10). 초톳의 사진 개수(아이콘)는 우리 목록에 없어 넣지 않았다.
- 피드형 마력 표기(2026-10-12 「피드형에서는 연료 뒤에 마력 모두 표기해」): 모바일 피드형 카드 메타정보는 승용·지시값 매물(서울오토갤러리·도이치오토월드·럭셔리카·슈퍼카·올드카·JDM 포함)도 연료 뒤에 `N마력`을 붙인다(`연식 · 주행 · 연료 · 마력`, 올드카는 맨 끝에 세대). 트럭은 원래 있던 마력을 그대로 쓰고, 바이크(배기량)·건설기계(사용시간)·캠핑카·부품은 마력 개념이 달라 붙이지 않는다. 마력 값은 PC 카드와 같은 매물 id 기준 샘플 값(`bbmSampleHorsepower`)이며 실제 제원이 아니다. 목록형은 그대로(마력 없음).
- 피드 사진 점 최대 5개(2026-10-12 「5개로 줄여서 적용하고 배포」): 레딧 캡처(점 4개, 끝 점 작게)와 에어비앤비·디자인 가이드(5개 이하 권장, Volvo Cars)를 근거로 점을 최대 7개에서 5개로 줄였다(웹으로는 두 앱의 규칙을 확인하지 못했고 캡처·기억 기준). 현재 점이 가운데에 오고(처음·끝에서는 창이 한쪽에 붙음), 뒤에 사진이 더 있는 쪽 끝 점만 3px, 그 안쪽 점은 4px, 나머지는 5px다. 알약 스타일은 그대로다.
- 피드 사진 점 레딧 스타일(2026-10-12 「레딧 스타일 먼저 적용해보고 배포」, 레딧 캡처 923px÷2.4 환산 · 앞의 에어비앤비식 알약 없는 점을 대체): 점 뒤에 높이 16 · 좌우 7 · `rgba(0,0,0,.45)` 완전 둥근 알약을 깔고, 현재 점은 흰색 5px, 나머지는 흰색 55% 5px, 현재에서 3칸 떨어진 점 4px, 4칸 이상 3px, 간격 4, 사진 아래 10px 위, 그림자 없음. 이유: 알약이 없으면 밝은 사진(올드카 T3 범퍼·바닥)에서 흐린 점이 묻혔다. 시간 글자와 우상단 개수 알약은 그대로다.
- 피드 사진 마우스 끌기(2026-10-12 「피드형에서 레딧처럼 사진 좌우 제스처 안 되고 사진 개수도 안 나온다」): 터치 스와이프와 개수 알약은 배포본에서 정상이었다(헤드리스 터치 측정: 왼쪽으로 밀면 scrollLeft 0 → 352, 개수 `2/4` 표시). 마우스(데스크톱 브라우저)로는 끌어도 넘어가지 않아 개수도 나타나지 않았으므로, 마우스 끌기를 추가했다. 4px 이상 끌면 사진 줄이 따라오고, 놓을 때 폭의 15% 이상 끌었으면 다음·이전 사진으로, 아니면 제자리로 붙는다. 끌고 난 뒤의 클릭은 상세로 열지 않는다. 터치·펜은 그대로 브라우저 스크롤을 쓴다. 개수 알약은 넘길 때만 보이고 1.5초 뒤 사라지는 기존 규칙을 유지한다.
- 사진 데이터(임시): 매물마다 사진이 1장뿐이라 같은 제조사 매물 사진 → 같은 목록 다른 매물 사진 순으로 3~6장(`3 + 매물번호 % 4`)을 임시 슬라이드로 붙인다(`feedPhotosFor`). 실제 다중 사진이 들어오면 이 부분만 바꾼다. `&feedphotos=single`이면 1장 그대로. 스크롤 성능(2026-10-10 「아래 스크롤시 버벅거리고 꼬인다」): 첫 사진만 먼저 그리고 나머지 사진은 카드가 화면 근처(위아래 120px)에 오면 붙인다(처음 이미지 75장 → 23장). 가로 영역은 `overflow-y: hidden` · `contain: layout paint`, 한 장씩 강제 멈춤(`scroll-snap-stop: always`)은 뺐고, 현재 장 번호는 프레임당 한 번만 갱신한다. 비교용 `&feedphotos=single`. 2026-10-10 「모바일에서 매물을 아래로 내릴 때 스크롤이 매끄럽지 못하다」(트럭 552대 추가 뒤): 모바일 카드는 화면 밖이면 그리기·배치를 건너뛰고(`content-visibility: auto`, 크기 기억 `contain-intrinsic-size: auto` 목록 164 · 피드 373), 목록 사진은 처음 4장만 바로 불러오고 나머지는 지연 로딩(`loading="lazy"`) · 비동기 해독(`decoding="async"`)으로 불러온다. 헤드리스 4배 느리게 측정(`.ct` 스크롤 도구)에서 목록 프레임 95번째 33ms → 17ms, 피드 33ms → 17ms.
- List-view top-to-top rhythm: final title row → specification 24px, specification → price 20px, price → badge 17px, badge → location 36px, and location → seller 24px. Cards without a badge collapse the badge slot and use price → location 28px. Do not restore a fixed 195px minimum card height; the card follows its actual content.
- 과쯔 승용 샘플 매물 사진(2026-10-07): 실매물 사진 출처가 확정되기 전까지 같은 제조사·모델의 `public/assets/models/kr/{makerId}/{value}.png`(당근·보배드림 모델 이미지, CREDITS 있음)를 `imageFit: "contain"`으로 표시한다. 이 이미지가 없는 차종(제네시스 G80·아우디 A6·랜드로버·렉서스 ES300h·페라리 296·롤스로이스 팬텀)은 다른 차 사진 대신 빈 사진 칸을 쓴다. 엔카 캡처(`maker-model/generations`)는 쓰지 않는다.
- 목록 썸네일은 2026-10-07 크기 조정(그림 썸네일 연회색 바탕·여백 자른 사본, 실사 사진 contain)을 모두 원복했다(「강제로 조정하니 이상하다」). 그림 썸네일은 흰 바탕 6px 여백 contain, 실사 사진은 cover.
- 실사 목록 썸네일 정규화(2026-10-08 「썸네일들도 럭셔리카처럼」): `listing-photos/v01` · `bike/listings` · `heavy/listings` 실사 62장은 럭셔리카와 같은 규칙(분할 모델로 찾은 차 영역 기준 차 폭 = 칸의 90% · 바닥선 = 위에서 85%, 키 큰 차는 높이 75% 이하)으로 만든 600×600 사본(`…/thumb/이름.webp`, 표 `src/prototype/data/list-thumbs-v01.json`)을 목록 썸네일로 쓴다(`normalizedListThumb`). 여백 채우기는 배경이 고른 스튜디오 사진(도이치오토월드 3001~3004 · 포터2 · 할리)에만 하고, 야외 사진은 여백을 만들지 않고 사진 안에서 정사각으로만 잘라 차를 가운데·아래 85%에 둔다. 근접 촬영·광고 이미지·묶음 사진(바이크 001_v01 · 008 · 009_v01 · 019_v01 · 027, 건설기계 001 · 003 · 005 · 007 · 008 · 015 · 018 · 024 · 030)은 원본 그대로. 피드 대표 사진과 그림(contain)은 원본.
- `판매중` is not shown in the mobile seller row. Removing a filter chip or badge must also remove its reserved space; price, location, and seller content move together according to the no-badge rhythm.
- 모바일 칩 줄 고정(2026-10-10 「하단 내리면 필터 스티치 어설프다 고정위치」): 칩 줄(`.filter-shell.is-bbm`)은 스크롤 상자 맨 위에서 10px 아래(`position: sticky; top: 10px`)에 붙고, 붙어 있는 동안(`.is-stuck`, 칩 줄 맨 위가 상자 위에서 10px 이내이고 scrollTop > 0) 위 10 · 아래 8 흰 여백과 아래 1px `#EBEBEB` 구분선을 `box-shadow`로만 그린다(레이아웃·높이 32는 그대로라 붙는 순간 튀지 않는다). 예전에는 칩이 화면 맨 위에 딱 붙고 아래 카드 글자가 칩에 닿아 어설펐다.
- 모바일 칩 줄 끊김 보정(2026-10-12 「필터칩 좌측 이동시키면 부자연스럽게 뚝뚝 끊긴다」): 칩 줄이 1px만 밀려도 `필터` 칩이 줄어들어(글자 숨김) 칩 줄 왼쪽 끝이 약 41px 왼쪽으로 옮겨 칩들이 한 번에 튀었다(헤드리스 측정 scrollLeft 0 → 1에서 `제조사` 칩 x 184.6 → 143.7). 줄어든 폭만큼 칩 줄 왼쪽 안쪽 여백을 더하고 다시 펴지면 뺀다(`index.tsx` `railLeftWide`). 측정: scrollLeft 0 → 80 → 0 구간에서 칩 x가 스크롤 1px당 정확히 1px씩 움직이고 0 ↔ 1에서도 튐이 없다(184.6 → 183.6).
- 모바일 퀵필터 줄과 `업데이트순` 줄 사이에는 구분선을 두지 않는다(2026-10-10 「업데이트순 위 구분선도 없애라, 초톳은 없다」): 깊이 줄(`.depth-rail`)의 아래 1px `box-shadow`(#F3F3F3)를 모바일 과쯔에서 뺐다(`stable-top.css`). 정렬 줄 아래 1px `#F4F4F4` 선은 그대로다. 유형 줄 · 제조사 · 모델 · 세부모델 · 바이크 · 트럭 · 캠핑카 · 건설기계 8개 상태에서 위쪽 선이 없는 것을 확인했다.
- 위치 줄(2026-10-08): 중고차(승용)는 개인·딜러 모두 `시도 구군 · 단지`(예: `경기 수원시 · 도이치오토월드`, 「중고차 매물은 지역에 단지 붙이고」), 그 밖의 모든 카테고리(바이크·건설기계·캠핑카 등)는 `시도 구군`까지만(트럭 딜러만 실제 단지를 붙임, 트럭 v09 참고)(`placeSidoGugun`, 3단계 `경기 수원시 권선구`는 `경기 수원시`로).
- The location line uses `지역 · 단지명` for every non-private seller and region only for `개인`. A generic `매매단지` suffix is not accepted: use a real complex name from the KB차차차 regional complex master (`지역별_매매단지`) and keep the displayed region consistent with the complex's actual location.
- Keep the canonical complex name in source data. Only the listing label is compacted: `자동차매매단지` and `매매단지` become `단지` (`강남자동차매매단지` → `강남단지`, `판교매매단지` → `판교단지`). Proper names such as `도이치오토월드`, `서울오토갤러리`, `성수모터시티`, and `제주오토파크` remain unchanged. Detail views may show the full canonical name.
- 매매단지 기준(2026-10-08 「매매단지 학습」): KB차차차 지역별 매매단지 마스터 2026-08-26(Google Sheet `1UniCT7RKA0p7qau23Tl9ALLFsS0zRQnTD4fli9BCEPU`, 탭 `지역별_매매단지`, 613행 = 17개 시도 · 이름 있는 단지 343 · 구군별 「개별단지」 253 · 시도별 「개인/직거래」 17). 이름 있는 단지만 `src/prototype/data/kb-danji-master-20260826.json`(시도·구군·단지명·매물수)으로 저장하고, 카드 위치의 단지(`dealerComplexByRegion`)는 이 목록에 있는 실제 단지만 쓴다: 같은 구군에서 매물 1대 이상인 단지 우선, 구군에 단지가 없으면 같은 시도의 단지. 매물이 가장 많은 곳은 경기 수원시 권선구(도이치오토월드 22,064 · SKV1모터스 14,968), 시도 합계 1위는 경기(75,982). 위치가 `서울 강남구 도곡동`처럼 3단계여도 시도 구군으로 찾는다.
- Complex source checked on 2026-10-02: `https://docs.google.com/spreadsheets/d/1c9uhwF-a1qspoK8PgylBxKiruodytuvy/edit` (`KB차차차_지역별_매매단지_마스터_20260826.xlsx`). Treat it as read-only reference data.

## Existing Mode Notes

## 차량 기준표 정적 검색·이미지

- 승용 제조사·모델그룹·세대는 `public/data/vehicle-catalog/cars-index-v1.json`을 첫 화면에서 불러오고, 연료·구동·등급·세부등급 검색 색인은 검색창을 처음 누를 때만 `cars-search-v1.json`에서 불러온다.
- 바텀시트 하위 단계는 `cars/{makeId}.json` 제조사별 파일을 선택 시점에만 불러온다. 바이크도 `bikes-index-v1.json`, `bikes-search-v1.json`, `bikes/{makeId}.json`으로 같은 규칙을 쓴다.
- 공개 JSON은 표시용 경로·이름·세대코드·연월·판매상태·정렬 순위만 허용한다. 엔카 코드·엔카 이미지 경로·매물 수·가격·라이트바겐 ID·외부 URL은 금지한다.
- 지리와 바이크 `숨김 제안` 제조사는 공개 색인에서 제외한다.
- 검색은 띄어쓰기·하이픈·대소문자를 무시하고 영문 시리즈 표기, 초성, 브랜드 별칭, 세대코드를 지원한다. 결과 순서는 완전 일치 → 앞부분 일치 → 포함, 동일 이름은 최신 세대 우선이다.
- 검색 결과는 로고·세대 이미지 또는 회색 실루엣·전체 경로·연식을 표시한다. 선택하면 제조사/모델그룹/세대/최종 등급 칩을 세팅하고 같은 위치로 차량 바텀시트를 연다.
- 승용 제조사 로고는 `public/assets/maker-model/logos/encar-1005-trim/`의 투명 여백 제거본과 `logo-display-v4.json`의 광학 크기를 공용으로 사용한다. 목록 24×24 슬롯에서는 v4 크기를 24/38 비율로 축소해 균형을 유지한다. 르노코리아와 르노는 현행 `078_Renault.png`, KGM은 `004_KG_Mobility_Ssangyong.png`, 기타 제조사·기타 수입차는 `etc_maker_icon.png`를 사용한다. 기존 `public/assets/vehicle-catalog/logos/` 원본은 삭제하지 않는다.
- 세대 이미지는 작업표 파일명과 일치하는 `gen_images` 파일만 WebP 600×400으로 변환한다. 모델그룹은 최신 세대 이미지를 대표로 쓰고, 이미지가 없으면 회색 실루엣을 쓴다.

- Keep ChoTot and Dongchedi modes visually unchanged when working on Guazi-specific changes unless the user explicitly requests a shared change.
- The default top quick-filter row keeps the fixed gray `필터` chip, black pinned `전체` category chip with clear icon, and scrollable conditions beginning `제조사`, `연식`, `가격`.
- The category sheet keeps `중고차` expanded by default with `전체 중고차`, `국산차`, `수입차`, and `전기차` chips; its right arrow toggles only that child row.
- Guazi mobile listing header follows the ChoTot reference: back button → flexible search field → saved-listings heart. The standalone chat icon is removed, and its former column plus gap are absorbed by the search field. The search field's internal search and save-search actions stay unchanged.
- Guazi mobile bottom navigation uses Bobaedream black `#222` for the active home icon and for both the 44px circular `매물등록` button and its label pill. Inactive navigation icons and labels remain gray so the center action stays primary without introducing a second brand accent.
- The Guazi mobile bottom navigation reserves a 6px breathing space below its 74px content area and adds `var(--device-safe-area-bottom, 0px)` beneath the fixed bar. Its scroll footer reserves the equivalent `var(--mobile-safe-area-height)` so the `매물등록` label and footer content never clip or hide behind the device bottom edge.
- Luxury UI-test list links may use `titlepos=top` to place the listing headline in one full-width line above the thumbnail and vehicle information. The older `titlepos=photo-top` thumbnail-column route remains available for comparison. The visible comparison controls remain limited to the approved after-model default and blue treatments.

### 바디타입 바텀시트

- 바디타입은 차의 용도가 아니라 외형 기준임을 제목 아래 설명한다.
- 항목은 좌측부터 `20px 체크박스 → 32px 아이콘 슬롯 → 라벨` 순서의 단일 열 목록으로 표시한다.
- 순서는 세단, 해치백, 왜건, 쿠페, 컨버터블, SUV, RV, 밴(승합), 픽업트럭, 리무진, 화물트럭, 버스, 캠핑카다.
- 화물트럭·버스·캠핑카에는 별도 페이지를 뜻하는 새 창 아이콘을 오른쪽에 표시한다.
- 선택은 시트 안의 임시 상태로 유지하고 `N대 보기`를 눌러야 외부 필터에 적용한다. 닫기·배경·Escape·뒤로가기는 임시 변경을 버린다.


## 건설기계 4단계 연동

- 건설기계는 빅레몬 기준으로 `형식 → 세부형식 → 제조사 → 모델` 순서의 단일 선택 계층을 사용한다.
- 건설기계·트럭·바이크는 유형이 1뎁스다. 건설기계 진입 직후 제조사부터 시작하지 않고 `유형` 실사 레일부터 노출한다.
- 건설기계 유형 1뎁스 v02 시안은 굴삭기·휠로더·불도저·지게차·모터그레이더·진동롤러·크롤러크레인·광산용 덤프트럭 8종이다. 상위 유형을 바꾸면 세부 유형·제조사·모델·세부모델을 모두 초기화한다.
- 유형 이미지는 초톳 실사 슬롯 규칙을 따른다. PC 셀 84×102·이미지 76×40, 모바일 셀 76×102·이미지 64×40, 셀 간격 8px, `object-fit: contain`, `object-position: center bottom`, 라벨 14/20 최대 2줄이다. 카드 배경·테두리·대수 표시는 쓰지 않는다.
- 건설기계 퀵필터 레일에는 좌측 뎁스 타이틀과 예약 슬롯을 두지 않는다. 모바일은 화면 왼쪽 16px, PC는 20px에서 첫 이미지 카드가 바로 시작한다.
- 유형 원본은 8:5 투명 1024×640 캔버스, 노란색 장비 본체·차콜 기계 부품, 좌측 전면 3/4, 동일 하단 기준선으로 정규화한다. 긴 붐·차체는 잘라내거나 억지 확대하지 않는다.
- 형식은 빅레몬 건설기계 15개 카테고리를 그대로 사용한다.
- 세부형식은 유형별 전용 값(굴삭기·임업은 사이즈, 휠로더·롤러는 용도)을 사용하고, 전용 값이 없는 유형은 `전체` 한 항목을 사용한다.
- 상위 단계를 바꾸거나 해제하면 모든 하위 단계가 즉시 초기화된다.
- 선택 상태는 `heavy_form`, `heavy_detail`, `heavy_maker`, `heavy_model` URL 파라미터로 복원한다.
- 검증용 목록과 선택지의 대수는 Google Drive `heavy_mock_inventory_v01` 30대를 한 기준으로 센다.
- 모델 이미지가 없는 v01은 문자형 대체 슬롯을 사용하며, 자료팀 슬롯 매니페스트 수신 후 이미지로 교체한다.
- 건설기계 제조사 빠른 선택 v08은 CompaniesLogo를 기본 원본으로 사용하고, 해당 사이트에 올바른 브랜드 표식이 없거나 주식 종목용 심벌만 있는 디벨론·코벨코·밥캣·JCB는 공식 제조사 원본으로 보완한다. 노출 순서는 `HD건설기계 · 디벨론 · 볼보CE · 캐터필러 · 코마츠 · 히타치 · 코벨코 · 밥캣 · 구보타 · JCB` 10개다.
- 로고 적용본은 `public/assets/heavy/logos/*_v06.png`의 투명 120×120 캔버스를 사용한다. 원본과 v01~v05는 덮어쓰지 않는다.
- 초톳 제조사 줄 규칙을 적용한다. 셀은 PC 84×102·로고 상자 40×40, 모바일 64×74·로고 상자 36×36이며 배경·테두리·대수 표시는 없다.
- 모바일 `제조사` 라벨은 초톳처럼 로고 레일 왼쪽 같은 행에 두고, 14px/20px·400·`#666`·좌측 16px을 사용한다.
- 로고는 자른 윤곽 비율에 따라 1.25 이하 82.5%, 1.25 초과 1.6 미만 91%, 1.6 이상 가로 100%로 정렬한다. 명칭은 말줄임표 없이 최대 두 줄로 표시한다.
- 현재 v04 가상 매물에서 확인되는 대수는 현대건설기계 7 · 디벨론 2 · 볼보CE 5 · 코벨코 2 · 구보타 2이며, 나머지 제조사는 데이터 미연결 상태를 숨기지 않고 0대로 표시한다.

# 트럭·특장 엔카 형식 뎁스

- 적용 카테고리: `트럭 · 특장`
- 선택 순서: 차량 유형 → 형식(2뎁스) → 세부 형식(3뎁스) → 적재용량·축장/규격(4뎁스, 자료가 있는 형식) → 제조사 → 모델
- 형식은 13개, 세부 형식은 총 89개이며 `src/prototype/data/truck-format-catalog.ts`를 단일 기준으로 사용한다.
- 4뎁스는 Google Sheet의 형식별 탭 13개를 직접 대조한 `src/prototype/data/truck-depth4-catalog.ts`를 사용한다. 11개 형식·85개 세부 형식에 1,944개 값이 연결되어 있다.
- 버스·트렉터 등 원본 탭에 4뎁스 값이 없는 조합은 세부 형식 선택 후 제조사로 바로 이동한다.
- 상위 뎁스를 바꾸거나 해제하면 적재용량·규격과 제조사·모델 등 모든 하위 선택을 함께 해제한다.
- URL에는 `truckFormat`, `truckSubtype`, `truckSpec`을 사용하며 유효하지 않은 값은 적용하지 않는다.
- 원문 표기 `트렉터`, `로우베드/릴리리`는 엔카 매핑 자료와의 대조를 위해 그대로 보존하며 표기 교정 여부는 미확인이다.
- 트럭·특장에서는 `형식 → 세부 형식 → 적재용량·규격 → 제조사 → 모델`을 이어서 노출한다.
- 트럭·특장 이미지·로고 퀵필터도 다른 카테고리와 동일하게 좌측 제목 슬롯을 사용하지 않는다. 형식·세부 형식·제조사·모델·세부모델은 PC 20px, 모바일 16px에서 바로 시작한다. 2026-10-11 QF-122부터 첫 `유형` 레일은 바이크 첫 뎁스와 같은 초톳 리듬을 사용한다: 모바일 셀 76×102px, PC 셀 84×102px, 공통 이미지 높이 40px, 간격 8px, 명칭 14/21·600·최대 2줄. 트럭·특장 이미지는 긴 전장을 `contain`으로 축소하되 바퀴 접지선과 광학 중심을 통일한다. 세부 형식은 기존 텍스트 칩 레일을 유지한다.
- 목록은 승용 샘플을 재사용하지 않고 `truck/scenario-v01.ts`의 가상 트럭 30대만 사용한다.
- 트럭 매물 v09(2026-10-10 「트럭특장도 바이크처럼 매물리스트」): 목록은 사용자 지시 매물 `truck-031`·`truck-032` + 구글 시트 「가상 매물 시나리오 › 트럭」 50행(`src/prototype/truck/scenario-v09.ts`, 사진 `public/assets/truck/listings/v09/`, 출처 아이트럭·마이트럭·직트럭)이다. v01의 나머지 가상 30대는 목록에서 뺐다(형식·세부형식·제조사·모델 선택지와 대수는 이 52대 기준). 제조사·모델·등록연월·주행·가격·지역·마력·적재·변속기·형식은 시트 값 그대로(시트의 `대우`는 `타타대우`, `만트럭`은 `만(MAN)`, 모델 없는 매물은 제목에 제조사만), 카드 스펙 줄은 시트의 실제 등록연월을 쓴 `cardSpec`(`24년07월 · 20만km · 디젤 · 570마력 · 적재 25.5톤 · 10x4`), 세부형식은 형식 목록 값으로 옮기고(냉장윙바디→냉장·냉동차 `냉장윙`, 탑차→`내장탑 - 일반` 등) 제목 둘째 줄은 `톤수 + 시트의 특장 종류`(`4.4톤 광폭윙바디`)다. 시트에 없던 값은 보정했다: 변속기(연식 2018 이상 오토·미만 수동), 지역이 빈 5대(경기·인천·충남·부산·대구 돌려쓰기), 게시일이 빈 19대(1~3일 전), 연료는 모두 디젤. 판매자 이름·프로필은 가상 값(실제 판매자명·전화번호·원본 URL·매물 ID 미저장), 44번 자동사다리차 사진의 전화번호만 흐림 처리. 업데이트순은 truck-031·032 다음 시트 게시일 최신순이다. 목록 썸네일 정규화(2026-10-10 「사진 보정」): 시트 사진 50장은 럭셔리카와 같은 규칙(분할 모델 u2netp로 찾은 차 영역 기준 차 폭 = 칸의 90% · 바닥선 = 위에서 85%, 키 큰 차는 높이 75% 이하)으로 만든 600×600 사본(`public/assets/truck/listings/v09/thumb/`, `Car.listThumb`)을 목록 썸네일로 쓰고, 칸이 남는 위·아래·옆은 사진을 흐리게 키운 배경으로 채운다. 피드 대표 사진은 원본. 위치 줄(2026-10-10 「실제 매매단지 추가」, 먼저 넣은 가상 단지는 교체): 트럭 딜러 매물은 `시도 구군 · 단지`(예: `경기 평택시 · 뉴월드단지`)로 쓴다. 단지는 KB차차차 지역별 매매단지 마스터(`kb-danji-master-20260826.json`)의 실제 단지만 쓰고(`truckPlaceV09`), 시트 지역에 구군이 있으면 같은 구군의 매물 많은 단지, 없으면 같은 시도의 매물 많은 상위 3곳을 돌려 쓴다. 마스터에 단지가 없는 세종은 지역만 쓴다. 개인 직거래는 단지 없이 `시도 구군`까지 쓰고(2026-10-10 「개인판매자 지역 시도 구군까지」), 시트에 구군이 없으면 `regions-kr.json`의 그 시도 구·군을 돌려 쓴다(세종은 구·군이 없어 시도만). 개인 판매자는 모든 카테고리에서 이름 없이 `개인판매자`로 표시한다(2026-10-10 「개인은 이름 빼고 개인판매자로」, 2026-10-07 가상 이름 규칙 대체). 건설기계·캠핑카·자재운반장비·부품 딜러도 같은 방식으로 실제 단지를 붙인다(`truckPlaceV09` 재사용). 바이크는 딜러·매매단지가 없어(2026-10-10 「바이크는 딜러와 매매단지가 없다, 바이크샵 이름 가상으로」) 업체 매물은 가상 바이크샵 이름(`bikeShopNames` 40곳, 매물 id로 정해 같은 샵이 여러 매물을 올림, 예: `라이드온 바이크샵`)으로, 개인은 `개인판매자`로 표시하고 위치는 `시도 구군`까지만 쓴다. 지역 필터는 `place`에 구군이 더해져도 시도·구군 일치로 동작한다.
- 트럭 매물 v10(2026-10-10 「트럭 유형별 파악하게 500대 추가」): 시트 「가상 매물 시나리오 › 트럭 신규 추가」 500행(`src/prototype/truck/scenario-v10.ts`, 사진 `public/assets/truck/listings/v10/` 640px + 목록 썸네일 `thumb/` 360×360)을 v09 52대 뒤에 더해 트럭 목록은 552대다(업데이트순: 지시 매물 2 → v09 50 → v10 500). 제조사·모델·등록연월·주행·가격·적재·마력·구동은 시트 값, 제조사·모델이 빈 행은 매물명에서 찾고(`메가` → 현대 메가트럭 등) 못 찾으면 `기타`(제목은 매물명 앞 22자). 시트 유형은 우리 형식 목록 값으로 옮겼다: 카고 → 톤수별 차급, 윙바디·상승 윙바디 → 윙바디, 탑차·내장탑차 → `내장탑 - 일반`, 냉동·냉장 윙바디 → `냉동윙`/`냉장윙`, 냉동·냉장 탑차 → `냉동탑 - 일반`/`냉장탑`, 암롤·압롤 → 암롤, 청소차 → 노면청소차, 렉카·언더리프트 → 레커·구난차, 덤프 → 덤프, 탱크로리 → 유류 탱크로리, 홈로리 → 벌크 탱크로리, 버스 → 인승별 소형·중형·대형버스, 기타 특장 → 기타 특수차, 추레라(마력·원데후·투데후) → 트랙터 헤드, 나머지 트레일러 → 트레일러(엔진 없는 카드 `등록연월 · 적재 · 축수 · 길이`). 시트에 없는 값은 보정: 연료 전부 디젤, 변속기(2018 이상 오토·미만 수동), 지역 빈 348행(시도 돌려쓰기), 주행 빈 107행(연식으로 추정), 게시일(1~34일 전). 직거래 106대는 개인(`개인판매자`), 나머지는 딜러. 판매자 이름·연락처·원본 URL·매물 ID는 저장하지 않는다.
- 형식·세부 형식·적재용량·규격·제조사·모델 선택은 같은 가상 매물 필드를 기준으로 목록과 제조사 대수를 함께 갱신한다.
- 사용자 지시 건설기계 매물 `heavy-001`(「380」 자리를 교체) 볼보 EW60E 휠굴삭기(2017년식 · 880시간 · A+ · 경북 · 5,650만원, 사진 사용자 제공). 카드 스펙 줄 `2017년식 · 880시간 · 디젤` 고정, 판매자는 가상 이름(실제 판매자 이름·연락처 미사용).
- 사용자 지시 캠핑카 매물 `camping-001`(현대 쏠라티 캠퍼 자리를 교체) 하비 프리미엄 495UL(18년형 · 유럽식 견인형 카라반 · 4인용, 사진 사용자 제공). 카드 스펙 줄은 `virtualCardSpecV01`로 `카라반 · 18년형 · 취침 4명` 고정, 가격·지역·판매자는 자리 값 유지.
- 사용자 지시 승용 매물 3004 페라리 GTC4 루쏘 T 3.9 V8(17년10월(18년형) · 31,135km · 가솔린 · 경기 · 18,990만원, 사진 사용자 제공). 모델 값은 카탈로그와 같은 `GTC4 루쏘`.
- 사용자 지시 바이크 매물 `bike-001`(혼다 레블 500 자리를 교체) 할리데이비슨 포티에잇48(2020년식 · 12,980km · 1,202cc · 크루저 · 부산 사상구 · 개인 · 1,480만원, 사진 사용자 제공). 모델 값은 필터 목록과 같은 `포티에잇`.
- 사용자 지시 트럭 매물 `truck-032` 명성정공 로베드 3축 에어샥 트레일러(15년09월 · 개인 직거래, 사진 사용자 제공). 전체 목록에서 자재운반장비 둘째 매물(30D-9 디젤 지게차) 자리에 둔다. 카드 `15년09월 · 3축 · 에어샥`, 가격(1,730만원)·지역(경기 수원시)은 정보가 없어 자리 값. 차량번호는 넣지 않는다.
- 사용자 지시 트럭 매물 `truck-031` 볼보 FE 윙바디 11톤 오토(24년04월 · 56,067km · 디젤 · 12,500만원, 사진 사용자 제공). 등급명·카드 스펙 줄은 `truckListingOverridesV01`로 지시값 고정.
- v01 매물 이미지는 자료팀 이미지 수신 전까지 트럭·버스·캠핑카·덤프 기존 아이콘을 임시 썸네일로 사용한다.
- PC 좌측 필터에서는 엔카 매핑의 `좌측 필터 패널 최상단` 위치에 `형식/적재용량` 계층형 항목을 둔다.
- PC 좌측 항목은 `형식 → 세부형식 → 적재용량·축장/규격` 단일 선택 트리로 동작하며, 상단 퀵필터와 같은 상태·URL·결과 목록을 사용한다.
- 4뎁스가 없는 형식은 세부형식 선택 직후 제조사 단계로 이동한다.
- 2026-10-02 엔카 화물·특장 실화면 재대조 순서는 `형식/적재용량 → 제조사/모델/등급 → 가변축 → 연식 → 주행거리 → 가격 → 진단 → 지역 → 성능공개 → 판매자구분 → 용도 → 색상 → 연료 → 변속기 → 옵션 → 적재규격 → 차량번호/판매자 이름`이다.
- 경쟁사 고유 명칭인 `엔카 진단`은 우리 화면에서 `트럭 진단`으로 바꾸고 기능은 `진단 완료` 체크로 유지한다. 나머지 항목명과 입력값은 원본 표기를 따른다.
- PC 좌측과 1024–1279 필터 서랍에서는 `형식/적재용량` 다음에 `트럭 전용 필터` 그룹 제목을 두며, 그 아래 모든 트럭 전용 입력을 같은 순서로 표시한다.
- 모바일 전체 필터에도 `형식/적재용량` 드릴다운과 `트럭 전용 필터` 그룹을 같은 순서로 표시한다. 형식·세부형식·4뎁스는 PC와 같은 상태·URL·결과를 공유한다.
- 체크형 항목은 시트/모달의 임시 값으로 고르고 `확인 N대` 또는 `N대 보기`를 눌러 확정한다. 버튼의 대수는 가상 트럭 30대에서 임시 선택을 반영해 즉시 다시 센다.
- 트럭 가상 매물 30대에는 가변축, 진단, 성능공개, 판매자구분, 용도, 색상, 연료, 변속기, 옵션, 적재규격, 차량번호 값을 일관되게 부여한다. 이 값은 UI 검증용 가상 정보이며 실제 매물 정보가 아니다.
- 차량번호/판매자 이름 검색은 가상 차량번호·차량명·판매자명을 함께 부분 일치로 검색한다.
- 모든 과쯔 PC 상단 카드에서는 지역 칩 줄을 노출하지 않는다. 지역 선택은 PC 전체 필터에서 제공하며 모바일 지역 UI는 유지한다.
- 트럭·특장 PC 상단의 기본 필터 칩과 형식·세부 형식·적재 규격·브랜드 빠른 선택 줄은 유지한다. PC에서 제거하는 것은 지역 칩 줄뿐이며 좌측 `트럭 전용 필터 > 지역`과 모바일 지역 UI도 유지한다.
- 2026-10-04 초톳 모바일 웹 직접 실측(Pixel 7 폭 412): 제조사 슬롯 64×56, 이미지 36×36, 이미지–명칭 간격 2px, 명칭 폭 56px(슬롯 좌우 4px), 명칭 12/500/18 `#595959`, 가운데 정렬이다. 트럭 형식·세부형식·유형도 이 텍스트 슬롯 규칙을 적용한다. 보배 실사 슬롯은 모바일 80px 폭에서 명칭 폭 72px, PC 132px 폭에서 명칭 폭 124px로 좌우 4px 여백을 유지하며, 이미지 아래 2px에서 12/500/18 `#595959` 명칭을 최대 두 줄로 줄바꿈한다. 말줄임표는 표시하지 않는다.
- 2026-10-04 트럭 매물 목록의 제조사 뎁스는 `형식 → 차급 → 톤수·규격` 선택이 끝난 뒤 같은 퀵필터 자리에 노출한다. 이 화면은 초톳 앱·카테고리 레일형 규격을 사용해 모바일 셀 76×102·PC 셀 84×102, 공통 로고 상자 40×40, 셀 간격 8px, 첫 시작 모바일 16px·PC 20px로 고정한다. 초톳 모바일웹 64×56 압축형은 다른 표면의 변형으로 구분한다.

### 초톳 필터 칩·목록 보기 원본 규칙 v47

- 모바일 필터 칩은 높이 32px, `#F4F4F4`, 모서리 9999px, 14/500/20, 내부 상하 4px·좌우 12px, 내부 간격 2px, 칩 사이 4px을 사용한다.
- 고정 필터 칩도 숫자 고정 폭을 두지 않고 문구에 따른 자연 폭을 쓴다. 한국어 `필터`와 베트남어 `Lọc`의 글자 폭 차이는 정상이다.
- 펼침 아이콘은 `public/assets/bbm/filter-toggle-chotot-v01.svg`의 노션 원본 패스를 수정하지 않고 20×20px 슬롯에 표시한다. CSS clip-path나 별도 재그리기는 금지한다.
- 모바일 보기 전환은 32×32px 터치영역을 유지하되 배경·테두리·원형 외곽선을 표시하지 않는다. 갤러리 화면의 목록형 복귀 아이콘은 `view-list-chotot-v02.svg` 원본을 20×20px로 표시한다.
- 모바일 목록형 썸네일은 120×120px, 반경 8px, 정보와 12px 간격이다. 제목 16/600/20 `#222`, 메타·위치 14/400/20 `#595959`, 가격 숫자 16/700/24 `#222` · 「만원」 16/400 `#222`(현대 인증중고차 방식, 빨강 사용 안 함), 판매자 12/400/18, 아바타 16px(JOB-8 초톳 재실측), 구분선 1px `#EBEBEB`(JOB-8 dev 동일), 좌우 여백 16px을 모든 카테고리의 공통 목록 컴포넌트에 적용한다.

### 트럭 유형 모달·바텀시트 v39 / 첫 뎁스 이미지 레일 QF-122

- 실제 목록 상단 칩과 PC 좌측 필터의 명칭은 `트럭 유형`으로 통일한다.
- 상위 유형은 카고(화물)트럭, 윙바디·탑차, 냉장·냉동차, 덤프·믹서, 크레인·고소작업차, 탱크로리, 환경·폐기물차, 견인·운송차, 트랙터 헤드, 트레일러, 특수차, 버스, 캠핑카·카라반, 기타 화물차 14개다.
- PC는 중앙 모달, 모바일은 바텀시트로 열며 동일한 트리·상태·대수를 사용한다.
- 행은 `체크박스 → 유형 이미지 → 명칭 → 대수 → 하위 화살표` 순서다. 하위 화살표는 자식이 있는 항목에만 표시한다.
- 헤더 64px, 모바일 제목 20/28px, 본문 좌우 20px, 체크박스 20px, 열 간격 12px, 하단 액션 80px·버튼 52px을 기준으로 한다.
- 트럭 유형 이미지 인지성 시안은 모바일 행 64px·PC 행 60px, 공통 이미지 표면 56×40px(`#F7F7F7`, `1px #ECECEC`, 반경 6px), `contain`·`center bottom`을 사용한다. 카고·윙바디·탱크로리·카고크레인은 앞머리가 왼쪽인 측면형 v02 샘플을 우선 연결하며 나머지 유형은 기존 이미지를 유지한다.
- 유형 이미지는 AutoScout24의 카탈로그형 정측면·균일 조명·고정 여백을 기본으로 하고, 한국·일본 상용차의 실제 차체 비례를 유지한다. 트럭은 흰색 캡을 공통 뼈대로 두고 용도를 결정하는 적재함·장비부에만 포인트 색을 준다: 윙바디 딥레드, 냉장·냉동 글래시어 블루, 도로용 덤프 스틸 블루그레이, 탱크로리 알루미늄 실버+블루 밴드, 견인 장비 오렌지. 산업용 노랑은 건설기계에만 사용한다. 로고·문자·번호판은 넣지 않으며, 90도 좌향 정측면·투명 배경·공통 기준선을 지킨다.
- QF-122 유형 자산은 `public/assets/truck/types/autoscout-v01/`에 둔다. 14종 모두 한국·일본식 캡오버 비례, 90도 좌향 정측면, 흰 캡·중립 장비부, 5500K 중성광, 투명 배경, `#12181C` 약 13% 접지 그림자를 공통으로 사용한다. 윙바디는 보이는 쪽 윙을 약 38° 열고, 냉동냉장은 전면 냉동기와 밀폐 박스, 덤프는 한국형 도로용 덤프, 견인·운송은 낮은 적재대와 후면 램프로 구분한다.
- 건설기계는 무채색 전체 도색을 사용하지 않는다. 작업 장비와 상부 구조는 산업용 노랑, 하부·트랙·타이어·조인트는 차콜, 유리와 금속은 자연 재질색으로 표현해 작은 슬롯에서도 유형을 식별할 수 있게 한다.
- 선택은 임시 상태이며 `N대 보기`에서 확정한다. 닫기·배경·Escape·뒤로가기는 임시 값을 버린다.
- 중간 그룹을 선택하면 모든 하위 말단 값을 포함한다. 0대 항목은 정의를 유지하되 비활성 처리한다.
- URL은 기존 `truckFormat`, `truckSubtype`, `truckSpec`을 유지한다. 유형 변경 시 하위 적재 규격·제조사·모델을 초기화한다.
- 목록 대수·행 대수·확정 버튼 대수는 `truck/scenario-v01.ts`의 같은 가상 매물 30대를 기준으로 센다.

## 과쯔 가변폭 모델 카드칩 비교 시안

- 비교 URL은 `qfcard=guazi-card`를 사용하며 기존 기본형(`plain`)과 기존 카드형(`card`)을 변경하지 않는다.
- 적용 범위는 제조사 선택 다음의 `모델` 뎁스다. 제조사·세부모델·트림은 기존 구조를 유지한다.
- 모바일 기준 레일 높이는 92px, 좌우 16px, 카드 사이 8px이다.
- 카드는 높이 68px, 최소 폭 74px, 최대 폭 112px, 반경 6px, 배경 `#F6F7FB`를 사용한다. 모델명 길이에 따라 카드 폭이 늘고 긴 이름은 말줄임한다.
- 모델 이미지 슬롯은 60×26px, 모델명은 14/18·500, 보조 바디타입은 12/16·400 `#8B95A1`을 사용한다.
- 첫 카드는 `전체`, 마지막 카드는 `전체 모델 ›`로 둔다. `전체`는 제조사는 유지하고 모델 이하 선택만 해제하며, `전체 모델`은 기존 제조사·모델 선택 화면을 연다.
- 선택 상태는 과쯔의 녹색을 복제하지 않고 보배드림의 파란색 토큰을 사용한다.

## 카테고리 진입 동작

- 과쯔 「전체차량」(category `전체`) 목록은 승용 샘플·트럭·바이크·캠핑카·건설기계·자재운반장비·부품 매물을 한 목록에 섞어 업데이트순으로 보여준다. 유형마다 자기 순서를 지키며 목록 전체에 고르게 퍼지게 섞고(`allVehicleMixedCars`, `updateRank`), 「중고차」 등 개별 카테고리는 기존처럼 그 유형 매물만 보여준다. 전체 목록에서는 부품 첫 매물(한국타이어 벤투스) 자리에 볼보 FE 윙바디(`truck-031`)를 둔다(2026-10-08 사용자 지시, 개별 목록은 그대로).

- 카테고리 시트(2026-10-10 「중고차 좌측에 전체 차량 추가, 전체차량은 모든 차량 카테고리 포함, 전체중고차는 중고차에 한하게」): 맨 앞(중고차 왼쪽)에 `전체차량` 원형 칩을 둔다. 아이콘은 노션 오토스카우트 「여러 차종·바디타입」 원본 SVG(`public/assets/category/icons/v01/category_all_vehicles_v01.svg`, 수정 없음)이고, 값 `전체`는 승용·트럭·바이크·캠핑카·건설기계·자재운반장비·부품을 모두 섞은 목록이다. `중고차` 아래 첫 알약은 예전 `전체차량`(값 `전체`) 대신 `전체중고차`(값 `중고차`)이며 중고차 목록만 보여준다. `전체차량`을 고르면 그 아래 알약에 모든 카테고리(`전체차량 · 중고차 · 트럭/특장차 · 바이크 · 캠핑카 · 건설기계 · 자재운반장비 · 부품/용품`)를 보여주고(2026-10-10 「밑에 중고차 등 카테고리 보이게」, 알약이 `전체차량` 하나뿐이면 비어 보였다), 어느 그룹을 펼쳐도 `전체 카테고리` 알약(모든 카테고리)을 항상 보여주고, 순서는 `전체 카테고리` → 펼친 그룹의 하위 알약이다(2026-10-10 「중고차도 밑에 보이게, 바텀으로 하단 카테고리들 보이게」 후 「전체가 위로 가야지」, 전체차량 그룹은 위 알약이 같은 목록이라 하나만). 시트를 열 때 현재 카테고리와 값이 같은 그룹을 먼저 펼친다(`categoryGroupForSelection`). 첫 화면 유형 줄(`BbmCategoryMenu`)에는 이미 전체차량 상태라 `전체차량` 칩을 넣지 않는다.
- 초톳 크로스체크(2026-10-10 「초톳 카테고리 논리와 직접 눌러보고, 뭔가 꼬였어」, `xe.chotot.com` 모바일 직접 조작): 초톳 카테고리 시트는 `Xem tất cả danh mục`(전체 카테고리 보기) 알약 하나 + 그룹 `Xe cộ`(차량)의 알약 `Ô tô · Xe máy · Phụ tùng xe · Xe tải, xe ben · Xe đạp · Phương tiện khác · Tất cả xe cộ`(마지막이 「전체 차량」)이며 한 번에 하나만 선택 표시된다. 「전체 차량」을 고르면 칩은 `Xe cộ`(필터 칩만, 브랜드 줄 없음), 하위를 고르면 칩이 `Ô tô`·`Xe máy`이고, 빵부스러기는 `Chợ Tốt Xe / Xe cộ` · `Chợ Tốt Xe / Ô tô`처럼 사이트 다음 한 칸이다. 이에 맞춰 우리도 전체차량(값 `전체`)은 중고차가 아니므로 제목 `전체차량`(이전 `중고차`) · 검색창 안내 `전체차량`(이전 `중고차`) · 빵부스러기 `보배드림 / 전체차량`이다. 중고차는 `중고차`, 중고차 하위(국산차 · 수입차 · 럭셔리카 …)는 `중고차 / 하위`, 트럭 · 바이크 등 다른 유형은 중고차 아래가 아니라 `보배드림 / 바이크`처럼 한 칸이다(이전에는 `보배드림 / 중고차 / 바이크`). 카테고리 시트의 `전체 카테고리` 알약은 지금 선택의 **그룹**(중고차 하위를 고르면 `중고차`)만 선택 표시하고, 아래 그룹 알약에서 정확한 하위(`국산차`)를 표시해 같은 값이 두 곳에서 겹쳐 선택돼 보이지 않게 한다.
- 전체차량의 카테고리 레일에서 `중고차`를 누르면 하위 텍스트 메뉴를 거치지 않고 바로 승용 브랜드 로고 레일을 표시한다.
- `트럭/특장차`는 기존처럼 형식 이미지 레일로 바로 진입한다.
- `바이크`, `건설기계`, `자재운반장비`, `부품/용품`처럼 하위 항목이 `전체` 하나뿐인 카테고리는 중복 알약칩을 표시하지 않고 해당 카테고리의 다음 퀵필터 또는 목록으로 바로 진입한다.
- 실제 하위 선택이 있는 `캠핑카`만 `전체 · 모터홈 · 카라반 · 트레일러` 알약칩을 유지한다.

## 럭셔리카 카테고리 v01 (2026-10-08)

- 구조: 차량 › 중고차 › 럭셔리카(`?category=럭셔리카`, 카테고리 시트 중고차 하위 칩). 과쯔에서는 승용 샘플 대신 전용 가상 매물 29대(`src/prototype/data/luxury-category-v01.ts`)만 보여준다. 다른 카테고리·전체차량 목록은 바꾸지 않는다.
- 원천: 구글 시트 「가상 매물 시나리오 › 럭셔리카」(차량번호 · 등록연월 · 주행 · 연료 · 지역 · 차명, 중복 1행과 사진 없는 3대 제외)와 드라이브 매물 사진(파일명 = 차량번호). 사진은 차량번호 대신 `public/assets/cars/luxury-category-v01/lux-NN.webp`로 저장하고, 데이터의 `vehicleNumber`로만 대조한다(화면에 차량번호 미표시).
- 카드 메타: 제조사+모델(+세대·트림) / `등록연월 · 주행(축약) · 연료`(`cardSpec`, 시트 값 그대로 `26년01월(25년형)` · `가솔린+전기`) / `시도 구군 · 매매단지` / 판매자명 + 프로필.
- 매매단지는 KB차차차 마스터에 있는 실제 단지 16곳(서울 3 · 경기 2 · 인천 · 대전 · 부산 2 · 대구 · 광주 · 울산 · 경남 · 충북 · 제주)에 가상 딜러 16명을 두고 1~2대씩 배정한다(사용자 지시 「서울오토갤러리 등 전국으로 여러 개」). 데이터에 정한 단지를 그대로 쓰며 `dealerComplexByRegion`으로 바꾸지 않는다.
- 서울오토갤러리 카테고리 첫 화면은 기존 럭셔리 브랜드 로고 레일 아래에 `수입차 전문 딜러` 레일(제목은 2026-10-10 「수입차 전문 딜러로 타이틀 변경」, 이전 `딜러별 매물`)을 추가한다. 공개된 실제 딜러명·매물 수와 공개 업무용 프로필 사진을 대조한 컬러 일러스트를 사용한다(흑백 금지). 얼굴형·헤어라인·안경·수염·표정 등 식별 특징을 딜러별로 보존하고, 같은 얼굴 템플릿을 반복하지 않는다. 모바일 슬롯은 76×102px, PC 슬롯은 84×102px, 초상 48×48px, 이름 14/18 500, 매물 수 12/16 400이며 각 카드는 해당 딜러의 서울오토갤러리 매물 페이지로 연결한다. 브랜드를 선택해 모델 단계로 들어가면 딜러 레일은 숨긴다.
- 가격 · 딜러 이름 · 프로필(일러스트형, `public/assets/cars/sellers/luxury-v01/`) · 등록시각은 가상 값이다. 시트에 등록연월 등이 없던 178다6624는 같은 차종의 그럴듯한 값으로 채우고 `filled: true`로 표시한다.
- 사진이 없는 매물(121가3330 · 351거1113 · 181마3337)은 목록에서 뺀다(2026-10-08 사용자 지시). 사진이 오면 행을 다시 넣는다.
- 딜러 배치(2026-10-08 「진짜 매물정보처럼 체계적으로」): 딜러마다 전문 차종을 둔다(서울오토갤러리 페라리 · 강남 롤스로이스/벤틀리 · 오토플렉스 맥라렌 · 도이치오토월드 G-클래스 · SKV1 우루스 · 오토허브 포르쉐/아우디 · 엠파크 마이바흐 · 디오토몰·제주 테슬라 · 대구 벤츠 S/벤틀리 · 광주 마세라티/애스턴마틴 · 울산 미국 대형 SUV/픽업 · 경남 BMW M · 청주 페라리 GTC4). 시트 지역이 부산인 3대는 부산 단지.
- 목록 썸네일 정규화(2026-10-08): 정사각형 목록 썸네일은 원본을 가운데 자르지 않고 사본(`public/assets/cars/luxury-category-v01/thumb/lux-NN.webp`, 600×600)을 쓴다(`Car.listThumb`). 사본은 분할 모델(u2netp)로 찾은 차 영역 기준으로 **차 폭 = 칸의 90%, 차 바닥선 = 위에서 85%**에 맞춰 자르고, 원본 밖으로 나가는 위·아래 여백은 원본 맨 위·아래 줄 색을 가로로 넓게 평균 내 채운다(어두운 천장 띠는 제외). 원본 사진은 바꾸지 않으며, 피드 보기의 큰 대표 사진은 원본을 쓴다.
- 인증딜러(2026-10-08): 16명 중 5명(서울오토갤러리 이은호 · 강남 한서준 · 도이치오토월드 오재혁 · SKV1 이도현 · 엠파크 박시우)은 판매자 줄을 `이름 인증딜러` + 초톳 「인증 딜러 물결 배지」 원본 SVG(`public/assets/bbm/verified-dealer-wavy-chotot-v01.svg`, #306BD9, 노션 초톳 아이콘 DB)로 표시한다. 배지는 이름 바로 뒤 16×16, 간격 2px(`.bbm-card-verified`). 나머지는 `이름 딜러`.
- 브랜드 로고 퀵필터 3종 시안(2026-10-08): 럭셔리카 제조사 줄은 확정 16개 순서 `페라리 · 람보르기니 · 롤스로이스 · 벤틀리 · 포르쉐 · 벤츠 · 맥라렌 · 애스턴마틴 · BMW · 마세라티 · 아우디 · 캐딜락 · 테슬라 · GMC · 부가티 · 코닉세그`(`src/prototype/listing/luxury-logo-rail.ts`). 로고 소스만 `?luxlogo=autohome`(1번 오토홈, 기본) · `daangn`(2번 당근) · `dongchedi`(3번 동처띠)로 바꾸고 나머지는 같다. 로고는 드라이브 원본(`qf_{소스}_{번호}_{브랜드}_44x28@3x.png`, 132×84 투명)을 `public/assets/brand/luxury-qf-v01/{소스}/`에 그대로 복사해 44×28 슬롯에 `contain` · 가운데로 그린다(개별 크기 보정 없음). 칸·간격·이름·가로 스크롤은 초톳 제조사 줄(모바일 76×102 · PC 84×102) 그대로이고, 슬롯은 40×40 상자와 같은 세로 중심(위 12 · 이름까지 20)이라 칸 높이·이름 위치는 바뀌지 않는다. 0대 브랜드(부가티 · 코닉세그)는 QF-114처럼 흐리게(0.4) 두고 누를 수 있다. 「전체 브랜드」 칸은 두지 않는다. 브랜드를 누르면 기존 제조사 필터(`maker`)와 같은 동작(모델 자료가 있으면 모델 줄, 없으면 이 줄에 선택 표시). `&qfcard=card`와 다른 카테고리는 기존 레일 그대로.
- 페라리 모델 퀵필터 v01(2026-10-08): 페라리 로고 선택 다음 단계는 엔카 카탈로그의 모델 그룹 18개 이름·정렬을 그대로 쓴다. 모델 카드 구조는 초톳 실사 슬롯 규칙(모바일 이미지 64×40 · 카드 72×102 · 간격 8, PC 이미지 76×40 · 카드 84×102 · 간격 8, `contain` · `center bottom`)과 동일하며, 이미지 아래에는 모델명만 표시한다. 승용 모델 3/4 카탈로그 컷은 512×320 파생 캔버스에서 피사체 최대 폭 480px(슬롯의 약 94% = 모바일 약 60px)로 맞춰, 기존 바이크 유형 이미지와 같은 체감 크기를 사용한다. 자산은 `public/assets/quickfilter/car/ferrari-models/angle/`의 왼쪽 3/4 카탈로그 컷이고, 원본 마스터와 제작 기록은 `docs/image/ferrari_model_quickfilter_manifest_v01.csv`로 관리한다. 분류용 정측면 비교 세트는 같은 규격의 `side/` 폴더로 분리한다.
- 페라리 오토스카우트 실버톤 시안 2(2026-10-08): `ferrariStyle=silver`일 때만 `public/assets/quickfilter/car/ferrari-models/angle-silver/`의 단일 라이트 메탈릭 실버 세트를 사용하며, 기본 모빌레 대표색 세트는 바꾸지 않는다. 18대 모두 512×320 투명 캔버스 · 피사체 폭 480px · 중심 x=256 · 바닥선 y=262로 정규화한다. 오토스카우트24 페라리 모바일 모델 카드(390px 화면 실측)는 바깥 카드 x=16/폭=358/높이=208, 이미지 356×150(`cover`), 카드 간격 16, 테두리 #D6D6D6 1px, 반경 8, 라벨 16/24·600이었다. 이 큰 카드 규격을 퀵필터로 복사하지 않고, 중립 실버 톤·안정된 바닥선·접지 그림자만 가져오며 슬롯 크기와 텍스트는 위 초톳 규칙을 유지한다.
- 기본 로고 확정(2026-10-08): `luxlogo` 없이 열면 `autohome2`(오토홈 + 07 맥라렌만 검은 스피드마크 엠블럼)이다. 드라이브 `luxury_qf_autohome2_1008` 16장을 `public/assets/brand/luxury-qf-v01/autohome2/`에 원본 파일명(`qf_autohome_…`) 그대로 복사했고, 07을 뺀 15장은 `autohome/`과 바이트까지 같다(07은 당근 07과 같은 파일). GMC·부가티·테슬라 빨강, 아우디 네 고리, 코닉세그 톤은 오토홈 원본 그대로 두고 보정하지 않는다. `luxlogo=autohome` · `daangn` · `dongchedi` 비교 링크는 그대로 유지한다.
- 테마 헤더 시안(2026-10-08, 미리보기 전용): 과쯔 모바일 럭셔리카에서 `&luxhead=a`(보배 피그마 「슈퍼카 리스트」형: 왼쪽 원형 프로필 64 + 「럭셔리카」 22/800 + 구독 알약 + `N대 판매 중 · 딜러 N명 · N명 구독 중` + 소개 + 「딜러 매물 등록하기」 띠) · `&luxhead=b`(좐좐 브랜드형: 가운데 `BOBAEDREAM LUXURY` · 「럭셔리카」 30/800 · 소개 · 통계 · 구독 알약, 아래 차량 3대 라인업). 기존 검색 헤더(뒤로·검색·저장·하트)를 그대로 위에 올려 흰색으로만 바꾸고, 지역 줄은 숨긴다. 헤더 아래 흰 시트(위 모서리 16, 위로 16 겹침)에 브랜드 로고 줄을 두고 그 아래 필터 칩·목록이 이어진다. 배경은 우리 럭셔리 매물 사진에서 차만 오려(번호판 흐림) 어두운 스튜디오 그라데이션에 합성한 `public/assets/cars/luxury-category-v01/hero/`(hero-a 1152×768 · hero-b 1152×900 · avatar 192). 구독자 수는 가상 값(1,284), 구독은 화면 안 상태만 바뀐다. `luxhead`가 없으면 기존 화면 그대로다.

## 서울오토갤러리 카테고리 (2026-10-10)

- 구조: 차량 › 중고차 › 서울오토갤러리(`?category=서울오토갤러리`, 카테고리 시트 중고차 하위 칩, 럭셔리카 다음). 「서울오토갤러리 매매단지에 등록된 매물을 보여주는 카테고리」이며, 앞으로 실제 매물을 노출하기 전 최적 테스트용이다.
- 데이터(2026-10-10 「매물당 사진 5장씩 추가하고 실제 상사명 · 실제 딜러명을 추가」): 구글 시트 「서울오토갤러리」 탭(736행) 중 사진 5장이 Drive에 있는 23대(중복 행 제외, `src/prototype/data/seoul-autogallery-v01.ts`). 나머지 713대는 원본 사진이 404라 사진이 오면 추가한다. 이 카테고리만 시트의 **실제 상사명 · 딜러명**을 그대로 쓴다(다른 카테고리의 「가상 이름만」 규칙의 예외). 전화번호 · 차량번호 · 원본 URL · 매물번호는 저장하지 않는다.
- 카드: 1행 `제조사 모델 세대 등급`, 스펙 줄 `연식(숫자 4자리) · 주행(축약) · 연료`, 가격은 시트의 공개가 또는 추정가(`priceKind`), 위치 `서울 서초구 · 서울오토갤러리`, 판매자 줄 `딜러명 상사명`(2026-10-10 「딜러명 다음 상사」, 예: `박상용 디앤디플러스`, 목록 표시에서만 「(주)」 · 「주식회사」를 뺀다(2026-10-10 「매물리스트에서는 주는 빼자」, 데이터 원본 상사명은 그대로), 판매자 프로필은 기본 아이콘 — 피드에서도 초톳 인물 사진을 쓰지 않는다). 판매중 대수(2026-10-10 「판매중 판매완료 정확하게」)는 시트 「서울오토갤러리」 전체(매물번호 중복 제외 447대)에서 같은 상사·딜러의 실제 대수다. 시트에 판매완료 값이 없어 이 카테고리 피드에서는 가상 판매완료를 표시하지 않고 `N대 판매중`만 보여준다.
- 사진: 매물당 5장(`public/assets/cars/seoul-autogallery-v01/sag-NN-1..5.webp`, 640px, 글자 인식으로 번호판 · 전화번호 · 광고 글자 흐림 처리). 목록 썸네일은 첫 장을 럭셔리카 규칙(차 폭 90% · 바닥선 85%, `thumb/`)으로 맞춘 사본이다. 피드 보기는 임시 슬라이드 대신 이 5장(`Car.photoList`)을 넘겨 본다.

## 도이치오토월드 카테고리 (2026-10-10)

- 구조: 차량 › 중고차 › 도이치오토월드(`?category=도이치오토월드`, 서울오토갤러리 다음). 도이치오토월드 매매단지(경기 수원)에 등록된 매물만 보여준다. 표시 규칙은 서울오토갤러리와 같다(실제 상사명 · 딜러명, 판매완료 미표시).
- 1차본 데이터(2026-10-10 「도이치오토월드 1차본 4,673대」): 구글 시트 「도이치오토월드」 탭 4,673대(차란차 수집, `src/prototype/data/deutsch-autoworld-all-v01.json`, 행 = 번호·제조사·모델·세대·등급·연식·주행·연료·가격(만원)·상사명·딜러명·매매단지코드·판매중 대수·사진묶음·등록일시). 매매단지가 도이치오토월드인 4,298대는 이 카테고리, 부산 사직오토랜드 373대 · 감만동 1대 · 수원 오토컬렉션 I 1대는 「사직은 중고차에 넣어라」 지시로 별도 카테고리 없이 중고차(와 전체차량) 목록에 들어간다(업데이트순은 지시 매물 3001~3004 바로 뒤, 위치는 `부산 연제구 · 사직오토랜드` 등). 전화번호 · 차량번호 · 원본 URL · 매물번호는 저장하지 않는다.
- 카드: 판매자 줄 `딜러명 상사명`(목록에서 「(주)」 · 「주식회사」 제외), 위치 `경기 수원시 · 도이치오토월드`, 가격은 시트의 차란차 공개 판매가격, 판매중 대수는 시트 전체에서 같은 상사·딜러의 실제 대수, 등록 시각은 시트 등록일시(2026-10-10 15시 기준 `N일 전`), 업데이트순은 등록일 최신순. 바디타입은 시트에 없어 모델명으로 대략 정했다(`deutschBodyType`, 정확한 값이 오면 교체). 제조사 레일은 수입차 상위 4(BMW · 벤츠 · 아우디 · 포르쉐) + 전체 브랜드.
- 사진(저장소 용량 때문에 줄인 압축본, Pages 한도 1GB 대비): 4,630대는 목록 썸네일 1장(`t/NNNN.webp` 200×200, 차 폭 90% · 바닥선 85%)과 피드 대표 1장(`p/NNNN.webp` 폭 360, 번호판 · 전화번호 글자 흐림)만 저장했다(합계 약 40MB). 사진 5장은 Drive 업로드가 끝난 43대(`dau-NN-1..5.webp`, `sajik` 4대는 `saj-NN`)만 피드에서 넘겨 본다. 나머지 매물의 5장은 시트 「사진1~5 Drive」 링크가 채워진 매물부터 Drive 공개 링크로 연결한다(2026-10-10 「구글 드라이브는 불가능한가」 → 「내부용이야」): `python3 scripts/deutsch-drive-links.py <시트 xlsx>`가 5장이 모두 올라간 매물을 `deutsch-autoworld-drive-v01.json`(행 순서 n → Drive 파일 ID 5개)으로 만들고, 앱은 첫 장은 저장소의 흐림 처리 대표 사진, 2~5장은 `lh3.googleusercontent.com/d/<ID>=w720`으로 불러온다. Drive 원본은 번호판 · 전화번호 흐림 처리 전이라 **내부 테스트 전용**이고, 동시에 많이 부르면 가끔 막혀 실패한 사진은 최대 2번 다시 부른다(`retryExternalPhoto`). `asset()`은 `http(s)://` 주소를 그대로 통과시킨다. 업로드가 진행되면 시트를 다시 받아 스크립트를 다시 돌려 JSON만 바꾼다(2026-10-10 기준 69대 중 저장소 43대 외 26대). 촬영 스튜디오 벽의 업체 로고는 원본 그대로 남아 있다.

## 유형별 가상 매물과 브랜드

- 전용 데이터가 없던 `캠핑카`, `자재운반장비`, `부품/용품`은 승용 샘플을 재사용하지 않는다.
- 세 유형은 `category-virtual-scenario-v01.ts`의 전용 가상 매물을 각각 30개씩 사용한다. 판매자명·주소·가격·연식은 UI 검증용 가상 정보이며 실제 매물로 해석하지 않는다.
- 각 유형의 브랜드 빠른 선택은 전용 브랜드 10개와 `전체 브랜드` 한 칸으로 구성한다. 실제 인기 순위가 아니라 가상 매물 v01의 검증용 구성임을 브랜드 매니페스트에 명시한다.
- 캠핑카: 현대 · 기아 · 르노코리아 · 제일모빌 · 코치맨 · 벤츠 · 포드 · 피아트 · 아드리아 · 하이머.
- 자재운반장비: 현대머티리얼핸들링 · 두산밥캣 · 토요타L&F · 미쓰비시로지스넥스트 · 코마츠 · 클라크 · 헬리 · 항차 · 융하인리히 · 린데.
- 부품/용품: 한국타이어 · 금호타이어 · 넥센타이어 · 현대모비스 · 미쉐린 · 브리지스톤 · BBS · OZ레이싱 · 브렘보 · 보쉬.
- 브랜드 하나를 선택하면 해당 브랜드의 검증용 매물 3개로 좁혀진다. 목록은 첫 페이지 20개·둘째 페이지 10개다.
- 전용 실사 이미지가 아직 없는 항목은 유형별 기존 승인 이미지 슬롯을 임시로 재사용한다. 매물 제목(상세 모델 줄)에는 `UI 검증용 가상 매물` 문구를 넣지 않는다(2026-10-07 사용자 지시).

## 제조사·모델 모달 헤더

- 제조사·모델 모달의 공통 외곽은 QF-117 주행거리 바텀시트를 기준으로 한다. 헤더 높이 64px, 하단 구분선 1px `#E8E8E8`, 제목 20/28px·700·`-0.35px`, 닫기 버튼 44×44px 터치 영역과 24×24px X를 사용한다.
- 루트 제조사 화면은 제목을 왼쪽 24px에 두고 닫기 터치 영역의 오른쪽 끝을 20px에 둔다. 제목을 가운데 정렬하지 않는다.
- 모델·세부모델·등급 하위 화면은 왼쪽 이전 버튼 44×44px 터치 영역과 오른쪽 닫기 버튼 44×44px을 사용한다. 헤더 좌우 여백은 16px이며 이전 아이콘 다음 제목의 보이는 간격은 8px, 제목 시작점은 x=56px이다. 두 아이콘은 24×24px이며 헤더 세로 중앙선이 같아야 한다.
- 선택 경로 행의 32px 원형 X는 목록 행의 오른쪽 화살표 중심축과 맞춘다. 384px 화면에서 두 컨트롤 중심은 모두 오른쪽에서 28px이며, 매물 수는 그 왼쪽 열에서 오른쪽 정렬한다.
- 이전·닫기 버튼은 초톳 원본 계열 아이콘을 유지한다. 기본 배경과 테두리는 없고 모서리는 10px이며 hover 배경과 키보드 focus outline만 제공한다.
- 하단 액션은 QF-117과 동일하게 `80px + safe area`, 좌우 20px, 위 12px, 아래 `16px + safe area`, 버튼 간격 10px을 사용한다. 초기화는 92×52px·투명 배경·12px 모서리, `N대 보기`는 남은 폭×52px·`#222`·12px 모서리다. 선택값이 없을 때 초기화는 `#B7B7B7`과 disabled 상태다.
- 체크형 행은 체크박스 20×20px, 텍스트 간격 12px을 사용한다. 구분선은 체크박스가 아니라 텍스트 시작점부터 오른쪽 끝까지 긋고 마지막 행에는 표시하지 않는다. 로고가 있는 제조사 행은 v4 규칙대로 개별 구분선을 두지 않고 섹션 사이 회색 띠만 유지한다.

### 제조사·모델 타이포그래피 위계 (2026-10-06)

- 초톳과 핀노의 제조사 선택 화면을 기준으로 굵기는 `400`과 `700` 두 단계만 사용한다. 일반 제조사·모델 행을 굵게 표시하지 않는다.
- 화면 제목은 20/28px·700·`#222`, 구간 제목은 14/18px·700·`#4F5660`이다.
- 제조사·모델 이름은 16/22px·400·`#222`, 매물 수는 14/18px·400·`#767D87`이다.
- 검색어와 선택 경로는 본문 계층으로 유지하고, 선택된 칩·탭과 하단 주요 액션만 700을 사용한다.
- 글꼴 우선순위는 `Pretendard Variable` → `Pretendard` → 시스템 산세리프이며, 바이크와 중고차가 같은 토큰을 공유한다.
- 바이크 모델 행은 84×56px 슬롯과 72px 행 높이를 유지하되, 생성 실사 이미지의 가시 영역은 68×44px로 가운데 정렬한다. 이미지 크기만 줄여 이름 시작점 x=116px과 목록 정렬축은 바꾸지 않는다.
- 바이크 모델 행 구분선은 텍스트 시작점이 아니라 이미지 슬롯 아래까지 포함해 목록의 왼쪽 16px부터 오른쪽 끝까지 긋는다. 마지막 행에는 구분선을 표시하지 않는다.
- 세대 목록에서 세대명 아래에 세대·코드와 판매 기간을 함께 표시할 때는 84px 행 안에서 차량 이미지와 텍스트 묶음을 모두 상단 11px에 고정한다. 보조 문구의 유무나 줄 수가 달라도 차량 이미지의 세로 시작점은 바뀌지 않아야 한다.
- 바이크 모델 이미지는 AutoScout24 Motorrad의 실제 카테고리 원본과 같은 무채색 재질 팔레트를 쓴다. 차체는 백색 `#F5F5F5`·`#F7F8F8`, 밝은 회색 `#E1E1E3`·`#D8DADA`, 알루미늄 `#BEC0C2`·`#ACACAC`, 중간 금속 `#707275`·`#4D5052`, 그래파이트 `#3B3E41`·`#1F2225`, 기계부·타이어는 `#0F1214`·`#010203`을 기준으로 한다.
- 장르를 구분하기 위한 장식색은 사용하지 않는다. 빨간색은 후미등, 주황색은 방향지시등·리플렉터, 금색은 포크·브레이크 등 실제 기능 부품에만 허용하며 합계 가시 면적은 3% 이하로 제한한다.
- 바이크 이미지는 960×600 투명 PNG, 좌향 90도 정측면, 짧은 타이어 접지 그림자만 허용한다. 언더본은 스텝스루 프레임·레그실드·17인치 스포크 휠·수평 시트가 실제 양산형 구조로 식별되어야 한다.
- AutoScout24 원본 자산은 모바일 120×73px(2배율 240×146px), 화면 표시 84×51px를 사용한다. 원본 8종의 평균 가시 폭은 약 82%, 평균 가시 높이는 약 75%, 하단 투명 여백은 15~16%, 수평 중심 오차는 ±1% 수준이다. 보배드림 시안은 사용자가 확정한 68×44px 표시 크기를 유지하되 색상·재질·방향·그림자 규칙만 동일하게 적용한다.
- 고유 모델그룹 이미지가 아직 없는 행은 빈 실루엣 대신 동일 규격의 장르별 실사 대표 이미지를 표시한다. 고유 이미지가 추가되면 `BIKE_GROUP_IMAGES`가 장르 대표 이미지보다 우선하며, 장르 대표 이미지는 디자인 판단과 점진적 자산 교체를 위한 임시 폴백이다.
- 초톳 가로형 이미지 알약칩 비교 시안(2026-10-09)은 `qfmodelpill=chotot`에서 BMW 바이크 모델에만 노출한다. 모바일 기준 레일 좌우 16px, 칩 간격 12px, 칩 높이 42px·완전 알약형, 이미지 슬롯 48×30px, 이미지와 텍스트 간격 8px, 본문 14/20px를 쓴다. 기본은 흰색 바탕·1px `#D1D1D1`, 선택은 흰색 바탕·1.5px `#222`와 700 굵기이며 기본 모델 레일은 변경하지 않는다.
- 같은 비교 시안의 브랜드 로고 가로형은 `qfbrandpill=chotot`에서 바이크 제조사 레일에만 적용한다. 모델 가로형과 같은 42px 칩·16px 좌우 여백·12px 간격·48×30px 미디어 슬롯을 공유하고, 로고는 기존 바이크 로고 광학 크기 규칙을 그대로 쓴다. `qfbrandpill=vertical`과 `qfmodelpill=vertical`은 기존 세로 슬롯 비교 주소로 사용한다.
- 브랜드 로고 세로형과 이미지 없는 모델 알약칩 조합 비교 시안(2026-10-09)은 `qfbrandpill=vertical&qfmodelpill=text`를 사용한다. 브랜드는 기존 세로 로고 슬롯을 유지하고, BMW 선택 뒤 모델은 이미지 슬롯 없이 32px 높이·좌우 16px 패딩·14/20px·500의 초톳식 텍스트 알약칩으로 표시한다. 기존 세로 모델 이미지(`qfmodelpill=vertical`)와 가로 이미지 알약칩(`qfmodelpill=chotot`)은 변경하지 않는다.
- 바이크 매물에 판매자가 입력한 광고 설명이 있으면 목록 카드의 두 번째 줄에는 제원 대신 광고 설명을 한 줄 말줄임으로 표시한다. 첫 줄은 실제 매물 제목을 사용하며, 연식·주행거리·배기량 등 원본 제원 데이터는 상세 화면과 필터 데이터에서 유지한다.
- BMW 모델 이미지 세로 비교형의 모델명은 14/21px·400으로 표시한다. 기존 600 굵기는 작은 이미지보다 글자가 먼저 보이므로 사용하지 않으며, 가로 알약칩의 미선택 400·선택 700 규칙은 유지한다.

### 외부 카탈로그 세대 보강 규칙 (2026-10-07)

- 엔카 DB에서 여러 완전 변경 세대가 한 행으로 합쳐진 경우 AutoScout24·mobile.de·ADAC의 세대 코드와 생산 기간을 교차 확인해 별도 보강 데이터로 표시한다.
- 수입차 세대 검증 출처는 독일차 `mobile.de → ADAC → AutoScout24`, 일본차 `Goo-net → mobile.de·ADAC·AutoScout24에서 확인 가능한 자료` 순으로 사용한다. 한 출처의 표기만 보고 세대 차수를 확정하지 않는다.
- 모든 자동차 모델·세대 이미지의 차체 색상은 국산·수입 구분 없이 `mobile.de`를 최우선 기준으로 통일한다. 동일 세대의 카탈로그 대표 이미지가 있으면 그 노출색을 사용하고, 없으면 동일 세대 매물에서 반복 확인되는 제조사 색상과 실제 톤을 사용한다. `mobile.de`에 동일 세대가 전혀 없을 때만 제조사 공식 카탈로그·다나와·카이즈유의 공식 출시색을 선택하되, 명도·채도·하이라이트는 `mobile.de` 카탈로그 톤으로 보정한다. 색상 근거가 확인되지 않은 임의 색은 금지한다.
- 세 출처 중 최소 두 곳이 같은 코드와 기간을 확인하는 완전 변경 세대만 추가한다. 페이스리프트는 별도 세대로 늘리지 않는다.
- 원본 엔카 세대·매물 수·등급 데이터는 수정하거나 임의 분배하지 않는다. 보강 세대는 `매물 연동 전`으로 표시하고 선택할 수 없게 하며, 실제 매물 DB 키가 확보된 뒤에만 필터 행으로 전환한다.
- 세대 화면은 보강 데이터가 있을 때 `세대 정보 · 유럽 카탈로그`와 `엔카 매물 세대`를 분리해 중복처럼 보이지 않게 한다.
- 모델 목록의 `세대 N개`는 보강 세대가 있는 모델에 한해 완전 변경 세대 수를 우선 표시한다.
- 표시용 세대 차수는 원본 `catalog.json`에 쓰지 않고 제조사별 별도 매핑 파일에 엔카 세대 key를 기준으로 기록한다. 단일 완전 변경 세대는 `1세대 (W168)`처럼 실제 숫자와 코드네임을 표시한다.
- 엔카 한 행이 여러 완전 변경 세대를 합친 경우 단일 숫자를 만들지 않고 `1~2세대 (W202·W203)`처럼 검증된 범위를 표시한다. 근거가 불명확한 항목은 차수를 숨기고 검수 대상으로 남긴다.

- 카테고리 시트 시안(2026-10-10 「시안 만들어봐」, 미리보기 전용, 기본 화면은 그대로): `&catsheet=a` = 초톳식 평면(아이콘 줄 없음, 「차량」 알약 한 줄 `중고차 · 트럭/특장차 · 바이크 · 캠핑카 · 건설기계 · 자재운반장비 · 부품/용품 · 전체차량`(전체차량 맨 끝, 초톳 Tất cả xe cộ), 선택 표시 하나, 고른 그룹에 하위가 있으면 그 아래 하위 알약만). `&catsheet=b` = 우리 구조 정리(아이콘 줄 유지 + 펼친 그룹 알약만, 중복 「전체 카테고리」 섹션 제거). 결정되면 기본으로 승격한다.
- 모바일 칩 안 아이콘 균형(2026-10-10 「초톳처럼 수정」, 초톳 캡처 1080×2340 ÷2.8125 잉크 실측, `qf-align.css`): 칩 높이 32 · 칩 사이 4(직전 8은 4로 되돌림)는 그대로. `필터` 칩은 검정 `#222` 바탕 + 흰 아이콘(아이콘 모양은 노션 FilterHeader 유지, 초톳은 깔때기형 14.9×10), 아이콘 잉크 왼쪽 14.5 · 글자와 간격 약 12(초톳 11.4). 일반 칩 바탕 `#F1F1F1`(이전 `#F4F4F4`). 꺽쇠 잉크 9.6×5.0(초톳 9.2×5.3, 상자 14.5) · 글자와 13.5~14.6 · 오른쪽 끝 11.4. X 잉크 7.1~7.5(초톳 7.5×7.5, 상자 18.4) · 글자와 14.9 · 오른쪽 끝 13.9.

- 필터 아이콘 시안(2026-10-10 「이 아이콘으로 시안」, 미리보기 전용, 기본은 그대로): 노션 「필터 (24px)」(`svgexport-20_24_chotot.svg`, viewBox 16, `#222222`)를 `public/assets/bbm/chip-filter-chotot-24*.svg`에 그대로 두고 `&filtericon=chotot24`(원본 크기, 20px 상자 안 잉크 약 15) · `chotot24s`(작게, 약 13.3) · `chotot24l`(크게, 약 17)로 비교한다. 칩 색·간격은 「모바일 칩 안 아이콘 균형」을 따른다. 결정되면 기본(`chip-filter-header`)과 바꾼다.

- 필터 아이콘 확정(2026-10-10 「나도 2번」): Guazi 기본 필터 아이콘은 노션 「필터 (24px)」 작은 버전 `public/assets/bbm/chip-filter-chotot-24-s.svg`(20px 상자 안 잉크 약 13.3)다. 맨 위 「Guazi 필터 버튼 아이콘은 …FilterHeader」 규칙을 이 파일이 대체한다. 이전 세 조절선은 `&filtericon=header`로만 비교용으로 볼 수 있다.

- 필터 아이콘 얇게(2026-10-10 「그럼 얇게하자」, 당근·초톳 캡처 1080×2340 ÷2.8125 실측): 당근 필터 아이콘은 선·고리 두께 1.4, 크기 13.2, 손잡이 지름 5.7(속 빈 고리), 초톳은 두께 1.6/크기 14.9로 두께÷크기가 0.106~0.107이다(시안 2는 2.2/13.3 = 0.165). 기본 아이콘을 같은 두 줄 조절선 모양의 얇은 선 `public/assets/bbm/chip-filter-slim-24.svg`(20px 상자, 선 1.4 `#222`, 손잡이 속 빈 고리 지름 약 5.7, 잉크 13.2)로 바꿨다. 굵은 시안 2는 `&filtericon=bold`, 세 조절선은 `&filtericon=header`.

- 필터 아이콘 원복(2026-10-10 「디자인을 훼손했어」): 위 「필터 아이콘 얇게」 규칙을 취소한다. 디자인팀이 만든 노션 아이콘은 모양·선 두께·고리 비율을 다시 그리거나 얇게 고치지 않고 원본 그대로 쓴다(크기만 viewBox로 조정). 기본 필터 아이콘은 `public/assets/bbm/chip-filter-chotot-24-s.svg`(노션 「필터 (24px)」 원본 패스, 잉크 13.3)이고 `chip-filter-slim-24.svg`는 삭제했다. 당근·초톳과 두께가 달라 보여도 원본을 우선한다.

- 필터 아이콘 교체(2026-10-10, 노션 「필터_16/16 (1)」 `필터_16_16_24.svg`, 독일 리싱마크트, 디자인팀 원본): 이 파일을 한 글자도 고치지 않고 `public/assets/bbm/chip-filter-leasing-24.svg`로 두고 모바일 Guazi 필터 칩의 기본 아이콘으로 쓴다. 파일이 viewBox 24 기준이라 24px 상자(`margin:-2px`로 칩 폭 유지)에 그려야 설계 크기(속 빈 고리 + 선 약 1.3)가 된다. 이전 시안은 `&filtericon=chotot24s`(굵은 노션 24px) · `header`(세 조절선). 원본 패스는 다시 그리거나 굵기를 바꾸지 않는다.

- 모바일 유형 줄 구분선 제거·PC 필터 아이콘 상자(2026-10-10 「전체차량에 또 업데이트 순 위로 구분선」 「오토갤러리도 필터 교체」): 모바일 Guazi 전체차량의 유형 줄(`.bbm-category-menu.is-hierarchical`) 아래 1px 선(`::after`)을 없앴다(`stable-top.css`, 초톳은 없음. QF 「업데이트순 위 구분선 없음」 규칙의 전체차량 판). PC 필터 버튼(서울오토갤러리 등 모든 PC 카테고리)도 노션 「필터_16/16 (1)」을 24px 상자(`margin:-2px`)로 그린다(`qf-align.css`).

- 필터 아이콘 크기(2026-10-10 「아까 2번 크기가 아닌」): 노션 「필터_16/16 (1)」을 24px 상자에 그리면 잉크 폭이 19.9로 시안 2(13.5)보다 컸다. 상자를 16.3px(`margin:1.85px`로 칩 폭 유지)로 줄여 잉크 폭을 시안 2와 같은 13.5로 맞췄다(모바일 `.filter-fixed`, PC `.bbm-filter-button`). 이 파일은 14×12 비율이라 높이는 시안 2(13.2)보다 낮다(원본 비율 유지).

- 필터 아이콘 시안 2 복귀(2026-10-10 「우리 2번으로 적용했잖니」): 기본 필터 아이콘은 합의한 시안 2(`chip-filter-chotot-24-s.svg`, 노션 「필터 (24px)」 원본 작은 버전, 20px 상자 잉크 13.3)다. 직전의 「필터_16/16 (1)」 교체 · 크기 보정 규칙은 기본에서 뺀다(`&filtericon=leasing`으로만 비교, 그 CSS 상자 보정은 이 파라미터에만 적용). 사용자가 합의한 안은 다른 링크가 와도 확인 없이 바꾸지 않는다.

- 카테고리 시트 초톳 방식 확정(2026-10-11 「카테고리 정리, 초톳 방식이 맞다」, 초톳 앱 캡처 Tất cả danh mục의 Xe cộ 그룹 기준): 시트 기본은 아이콘 줄 없이 「차량」 제목 아래 알약 한 줄이며 순서는 `전체차량 → 중고차 → 트럭/특장차 → 바이크 → 캠핑카 → 건설기계 → 자재운반장비 → 부품/용품`(전체차량이 맨 앞, 초톳 Tất cả xe cộ 첫 알약), 선택 표시는 하나뿐이다. 하위가 있는 그룹(중고차)을 고르면 그 아래 하위 알약만 한 줄 더 나온다(국산차 · 수입차 · 서울오토갤러리 등 진입 유지). 이전 화면은 `?catsheet=old`, 아이콘 줄 시안은 `?catsheet=b`로만 본다. 앞의 「전체차량 맨 끝」 시안 a 기록은 이 규칙이 대체한다.

- 카테고리 시트 행 방식(2026-10-11 「전체차량 · 중고차 ㅡ 하위 알약 · 트럭특장 우측 터치하면 하위 알약」, 초톳 Tất cả danh mục의 그룹 행 구조): 시트는 한 줄에 카테고리 하나(아이콘 28 + 이름 16/22, 행 높이 56, 아래 1px `#ebebeb`)이고 순서는 `전체차량 → 중고차 → 트럭/특장차 → 바이크 → 캠핑카 → 건설기계 → 자재운반장비 → 부품/용품`이다. 이름을 누르면 그 카테고리를 고르고(선택 행은 700), 하위가 있는 줄(중고차 · 트럭/특장차 · 캠핑카)은 오른쪽 화살표(44×44 터치)를 누르면 그 아래에 하위 알약이 펼쳐진다(왼쪽 40px 들여쓰기, 여러 줄 동시 펼침 가능, 처음에는 현재 선택한 그룹만 펼침). 전체차량·바이크·건설기계·자재운반장비·부품/용품은 화살표가 없다. 직전의 한 줄 알약 방식은 `?catsheet=flat`, 더 이전은 `old`, 아이콘 줄 시안은 `b`로만 본다. 앞의 「카테고리 시트 초톳 방식 확정」 알약 한 줄 규칙은 이 규칙이 대체한다.

- 카테고리 시트 행 간격·바탕색 칩(2026-10-11 「전체차량 구분선 위 간격 체크, 바탕색 칩 넣자」, 초톳 앱 캡처 923px÷2.404 환산 실측): 초톳은 헤더 아래 구분선 → 첫 행 글자 중심 35.7, 행 글자 중심 → 아래 구분선 23.8, 구분선 → 다음 행 글자 중심 25.3(행 약 49), 알약 줄 아래 → 구분선 12.5, 제목 중심 → 알약 윗선 22.8, 알약 32·간격 8/6이다. 우리는 행 56·첫 행까지 48.5였던 것을 행 48+구분선 1(=49), 헤더 구분선 → 첫 행 위 11(글자 중심 약 35), 알약 줄 아래 12로 맞췄다(384px 실측 헤더 아래 296 → 첫 행 307, 행 피치 49). 하위 알약이 없는 줄(전체차량·바이크·건설기계·자재운반장비·부품/용품)은 선택하면 이름이 `#222` 바탕 흰 글자 32px 알약 칩(14/20·500)으로 바뀐다(초톳 선택 알약). 알약 줄 왼쪽 들여쓰기는 없앴다(초톳은 알약이 아이콘 왼쪽선에서 시작).

- 카테고리 시트 이름 터치(2026-10-11 「중고차 터치하면 하위 카테고리가 열려」): 하위가 있는 줄(중고차 · 트럭/특장차 · 캠핑카)은 이름을 눌러도 오른쪽 화살표처럼 하위 알약이 펼쳐지고 접힌다(이름 터치로는 선택하지 않고 알약에서 고른다). 하위가 없는 줄은 이름을 누르면 바로 고른다. 앞의 「이름을 누르면 그 카테고리를 고른다」 규칙은 이 규칙이 대체한다.

- 카테고리 시트 초톳 웹 직접 확인(2026-10-11, `xe.chotot.com/mua-ban-xe-co` → `Xe cộ` 칩 → `Tất cả danh mục`, Pixel 7 에뮬레이션): ① 행 이름을 누르면 그 줄이 펼쳐지고 접힌다(이름 터치 = 화살표 터치) ② 여러 줄이 동시에 펼쳐진다(`Xe cộ`와 `Đồ điện tử` 동시 확인) ③ 닫힌 줄은 오른쪽 `>`, 열린 줄은 아래 `v` ④ 하위 알약은 아이콘 왼쪽선에서 시작해 들여쓰기가 없다 ⑤ 웹의 `Tất cả xe cộ`는 알약 줄의 마지막이고 사용자 앱 캡처는 첫 번째다(우리는 앱 캡처 기준으로 `전체중고차`를 첫 알약에 둔다). 우리도 닫힌 줄·하위 없는 줄은 `>`, 열린 줄은 `v`로 맞췄다(이전 `v`/`^`는 취소).

- 카테고리 칩 정리(2026-10-11 「초톳처럼 리스트에서는 카테고리 칩 빼자, 선택된 카테고리 누르면 카테고리 나오게」, 초톳 웹 `Xe cộ ×` 칩과 같음): 과쯔 모바일 칩 줄(트럭·특장 제외)에서 별도 `카테고리 ▾` 칩을 없앴다. 줄은 `[필터] [선택된 카테고리 ×] [제조사] [연식] [가격] [연료]`이고, 선택된 카테고리 칩(`전체차량` · `바이크` 등)의 이름을 누르면 카테고리 시트가 열리며(현재 선택이 표시됨) ×는 기존대로 해제한다. 전체 필터 창 안의 `카테고리` 행은 그대로다. 트럭·특장은 이전 동작(칩 이름 → 형식 퀵필터)을 유지한다.

- 테마 중고차 독립(2026-10-11 「테마별 중고차를 독립시켜서 슈퍼카 · JDM · 튜닝·커스텀카 · 셀럽카 등 배치」, 「매매단지는 중고차 아래 일단 두자」): 카테고리 시트와 첫 화면 카테고리 줄에 `테마 중고차` 그룹을 `중고차` 다음에 둔다. 알약은 `슈퍼카 · 럭셔리카 · 올드카 · JDM · 튜닝·커스텀카 · 셀럽카`이고, 슈퍼카·럭셔리카·올드카는 기존 `중고차` 아래에서 옮겼다(값은 그대로). `중고차`는 `전체중고차 · 국산차 · 수입차 · 전기차 · 리스/렌트차량 · 서울오토갤러리 · 도이치오토월드 · 브랜드 인증중고차 · 매매단지별 검색 · 팔린매물 · 장애인차`로 매매단지를 일단 그대로 둔다. 그룹 아이콘은 노션 「N_독일_오토스카우트 24」 icons-sprite symbol-42(하트 자동차) 원본을 한 글자도 고치지 않고 `public/assets/category/icons/v01/category_theme_used_car_v01.svg`로 둔다. JDM · 튜닝·커스텀카 · 셀럽카는 아직 매물이 없어 선택하면 「조건에 맞는 차량이 없어요」가 나온다(값은 과쯔 전용 `guaziThemeCategories`, ChoTot·동처띠 카테고리 목록은 그대로). 테마는 새 매물 창고가 아니라 중고차 매물에 붙이는 이름표로 다룰 예정이며, 셀럽카의 표시 기준(누구의 차인지 확인 방법)은 정해지는 대로 적는다.

- 그룹 이름 변경(2026-10-11 「테마별 중고차로」): 위 「테마 중고차 독립」의 그룹 이름 `테마 중고차`를 `테마별 중고차`로 바꿨다(카테고리 시트 줄 · 첫 화면 카테고리 줄 · 그룹 값). 알약·순서·아이콘은 그대로다.

- 카테고리 시트 선택 개수·셀럽카(2026-10-11 「매물 있는 건 선택되면 하단 선택에 개수 표기」 · 「셀럽 중고차 → 셀럽카로」): 하단 확정 버튼은 임시로 고른 카테고리의 매물이 1대 이상이면 `선택 · N대`(예: `선택 · 551대`), 매물이 없으면(JDM · 튜닝·커스텀카 · 셀럽카) `선택`만 쓴다. 대수는 다른 필터와 무관한 그 카테고리 전체 목록 기준이다(전체차량 = 전체 섞음 목록, 중고차 = 승용 샘플, 서울오토갤러리 · 도이치오토월드 · 럭셔리카 = 각 전용 목록, 트럭·특장 형식 = 그 형식, 캠핑카 구분 = 그 구분). 테마별 중고차의 `셀럽 중고차` 알약 이름은 `셀럽카`로 바꿨다(값도 `셀럽카`).

- 카테고리 시트 초기화 버튼(2026-10-11 「버튼도 에어비앤비처럼 초기화는 비활성」): 주행거리 시트와 같은 에어비앤비 방식이다. 고른 것이 없으면(전체차량 · 하위 선택 없음) `초기화`는 `#B7B7B7` 회색 비활성(눌러도 반응 없음), 카테고리를 고르면 `#222` 활성이 되고, 누르면 전체차량으로 돌아가 다시 회색이 된다. `선택 · N대` 버튼은 항상 활성이다.

- 테마별 중고차 칩 줄 교체(2026-10-11 「하위 메뉴 칩이 나와야지」 → 「A: 동그란 줄 자리에 하위 칩 줄로 교체」): 첫 화면 동그란 카테고리 줄에서 `테마별 중고차`를 누르면 카테고리가 `테마별 중고차`(과쯔 전용 값)로 바뀌고, 동그란 줄 대신 같은 자리에 `슈퍼카 · 럭셔리카 · 올드카 · JDM · 튜닝·커스텀카 · 셀럽카` 한 줄 알약(높이 32 · 1px `#DADADA` · 14/20 500 · 간격 8 · 좌우 16(PC 20) · 가로 스크롤, 줄 높이 56)이 나온다. 위쪽 칩은 `테마별 중고차 ×`가 되고 `×`를 누르면 동그란 줄로 돌아온다. 알약을 누르면 그 카테고리(예: `슈퍼카`)로 바뀌어 제조사 줄이 나온다. 목록은 중고차 전체 샘플이고 대수는 `선택 · N대`에도 같은 기준으로 나온다. 이전의 「동그란 줄 아래에 하위 알약 줄을 붙인다」 동작은 테마별 중고차에서는 쓰지 않는다(캠핑카 등 다른 그룹은 그대로).

- 그룹 칩 줄 교체를 모든 그룹에 통일(2026-10-11 「중고차 등 모두 같은 방식 되야지」): 하위가 있는 그룹(`중고차` · `테마별 중고차` · `캠핑카`)은 모두 첫 화면 동그란 카테고리 줄에서 누르면 같은 자리에 하위 칩 줄로 교체된다. 위쪽 칩은 그 그룹 이름(`중고차 ×` 등)이 되고 `×`는 동그란 줄로 돌아온다. 칩을 누르면 그 카테고리(중고차 → `전체중고차` 칩은 승용 브랜드 줄, `국산차` 등은 해당 카테고리)로 들어간다. 이전의 「중고차를 누르면 바로 브랜드 줄」 동작과 `테마별 중고차`를 별도 카테고리 값으로 두던 방식은 이 규칙으로 대체한다(상태는 `groupRail`, 카테고리가 바뀌면 해제). 트럭·특장은 하위가 13개 형식 이미지라 기존 형식 이미지 줄을 그대로 쓰고, 바이크·건설기계·자재운반장비·부품은 하위가 없어 바로 진입한다.

- 슈퍼카 카테고리 헤더(2026-10-11): 제조사 미선택 상태에서 서울오토갤러리 헤더와 같은 모바일 슬롯(`width: calc(100% - 32px)`, 비율 179:49, 높이 88~98px, 여백 위 12·좌우 16·아래 10, 모서리 8px, 그림자 0 1 2/12%)을 쓴다. 문구는 `보배드림 슈퍼카 / 국내 유일 슈퍼카 쇼핑몰`, Pretendard 18/23·700과 12/17·400을 쓴다. Ferrari F80 정지 이미지, Enzo Ferrari 흑백 이미지, Lamborghini 공식 6초 무음 영상을 한 묶음으로 사용하며 첫 항목은 새 진입 때 무작위, 이후 6초마다 순환한다. 배너 터치는 다음 항목으로 이동하고, 현재 위치 점 3개는 배너 하단 정중앙에 표시한다. `prefers-reduced-motion`에서는 자동 순환과 영상 자동 재생을 멈춘다.
- 슈퍼카 브랜드 레일(2026-10-11): 슈퍼카 카테고리에서는 일반 승용 상위 제조사(현대·기아 등)를 노출하지 않고, 럭셔리카와 같은 오토홈 기반 16개 로고 레일(`페라리 · 람보르기니 · 롤스로이스 · 벤틀리 · 포르쉐 · 벤츠 · 맥라렌 · 애스턴마틴 · BMW · 마세라티 · 아우디 · 캐딜락 · 테슬라 · GMC · 부가티 · 코닉세그`)을 사용한다.

- 올드카 카테고리 v01(2026-10-11 「테마별 중고차에 올드카 추가」): `테마별 중고차 → 올드카`(`?category=올드카`)는 승용 샘플 대신 구글 시트 「올드카」 탭의 전용 목록 40대(`src/prototype/data/old-car-category-v01.ts`)만 보여준다(42행 중 오류 1행 · 중복 1행 제외). 사진은 시트 링크에서 받은 8대만 `public/assets/cars/old-car-category-v01/`에 원본 그대로 넣었고(2026-10-11 「사진 건드리지 마」로 번호판 흐림·배경 처리·썸네일 사본을 모두 원복) 나머지 32대는 빈 사진 칸으로 목록 끝에 둔다. 시트에 가격이 없던 29대는 같은 차종 값으로 채우고 `oldCar.priceFilled`로 표시한다. 판매자는 가상 값(3대 중 1대 개인 `개인판매자`, 나머지 딜러 `가상 이름 딜러` + 실제 매매단지), 전화번호·차량번호·원본 URL·실제 판매자명은 저장하지 않는다. 카드 스펙 줄 `연식(숫자) · 주행 · 연료 · 변속기`(2026-10-11 「올드카는 변속기 노출」, 예: `1989 · 20만km · 가솔린 · 오토`; 올드카는 수동이 섞여 있어 변속기를 보여준다). 제목의 `쉐보레(대우)`·`KG모빌리티(쌍용)`는 시트 표기 그대로다. 전체차량·중고차 목록에는 섞지 않는다. 제조사 줄은 승용 기본 상위 10을 그대로 쓴다.

- 올드카 보강: 보배드림 매물 v01(2026-10-12 「올드카 보강」): 구글 시트 「올드카_보배드림」 탭 100행 중 수집 상태 `ok` 55대(판매완료 35 · 기간만료 9 · 계약 1 제외, `src/prototype/data/old-car-bobae-v01.ts`)를 올드카 목록 맨 위에 더한다(기존 시트 40대는 그 아래 그대로, 올드카 목록 95대). 사진은 보배드림 공개 사진 640×480을 `public/assets/cars/old-car-bobae-v01/`에 원본 그대로 저장한다(번호판 흐림·배경 처리 없음). 단위가 ml인 7대는 마일을 km로 환산해 천 단위로 반올림했고, 가격이 `상담`·`보류`인 매물은 `가격 상담`으로 표시한다. 업데이트순은 시트 목록 등록일 최신순이다. 카드 스펙 줄은 시트에 변속기가 없어 `연식 · 주행 · 연료`만 쓴다(필터의 변속기 값은 정보 없음이라 오토로 둔다). 판매자(딜러 2/3 · 개인 1/3) · 딜러 이름은 가상 값이고 판매자명·연락처·차량번호·원본 URL·매물번호는 저장하지 않는다. 바디타입(세단·SUV·쿠페·컨버터블·왜건)은 시트에 없어 모델명으로 대략 정했다. **올드카 연식 기준(2026-10-12 「올드카에 2000년대 모델 들어가있다」)**: 1999년식 이하만 보여준다. 보배드림 55대 중 2000년식 이상 17대를 목록에서 뺐고(데이터 파일에는 남김) 올드카 목록은 38대 + 기존 시트 40대 = 78대다.
- 올드카 세대 표기(2026-10-12 「올드카 피드형 보기방식에선 1세대(코드네임) 표기하자」): 피드형 보기에서만 메타정보(연식 · 주행 · 연료) 맨 끝에 `N세대 (코드)`를 붙인다(예: `1990 · 12.9만km · 가솔린 · 3세대 (T3)`). 목록형·PC 카드는 그대로다. 값은 `src/prototype/data/old-car-generation-v01.ts`(키 = `Car.oldCar.number`)에 두고, 세대 구분 기준 카탈로그는 독일차 ADAC 오토카탈로그 · 오토스카우트24 카탈로그, 일본차 구넷 카탈로그다. 2026-10-12 「ADAC 크로스체크」로 ADAC 오토카탈로그 모델 페이지(Baureihe·연식)와 대조해 재규어 XJ(Series III 3세대 · XJ40 4세대 · X300 5세대) · E-Type(Series II 2세대) · 닛산 300ZX(Z32 2세대) · 벤츠 560SEC(S-클래스 126 2세대) · 포르쉐 911 카레라 1994(993 4세대)를 고쳤고, 벤츠 W124·W126·W140·G-클래스·SL R107·E-클래스 W210, BMW 3·5·6시리즈, 포르쉐 993, 폭스바겐 비틀, 레인지로버 I은 일치함을 확인했다. ADAC에 없는 폭스바겐 T3·콜벳 C1/C3·클래식 미니·국산차·일본차(구넷)는 대조하지 못했다. ADAC는 포르쉐 911 930과 SL 198/121을 별도 Baureihe로 나눠 세는데 한국 통용 세대 차수(930 2세대, SL R107 3세대)를 그대로 뒀다. 2026-10-12 데이터 선정리: 보배드림 모델 기준표대로 쏘나타 II/2(1994·95년식 3건)를 2세대(Y2)로 고치고(1994년식 「쏘나타 III 2.0 GLS」는 이름이 III라 3세대(Y3) 유지, 이름·연식 확인 필요) 재규어 `Serie` 표기를 `Series`로 통일했다. 2026-10-12 「니가 올드카 수정하고」로 기준표대로 프라이드 WA · E클래스 W210 7세대(기준표 값, 같은 방식으로 센 W124 등과 번호 체계가 다르니 확인 필요) · 아벨라 WB · 마르샤 H · 다이너스티 LX · 갤로퍼 M 코드를 표기하고, 코란도 제목의 제조사를 `쌍용`(당시 브랜드명, 칩은 현재 KGM)으로 칼리스타와 통일했으며, 연대 칩에 `50년대`를 추가했다(1953 벤츠 바론). 911 993은 `4세대 (993)` 그대로, 랜드크루저 `80 시리즈 (J80)` 형식과 1992년 그랜저 2건(L → LX 경계)은 시트 이름이 「뉴그랜저」가 아닌 「그랜저」라 1세대 (L)로 채웠다(2026-10-12 총괄 결정, 확인 필요). 1994년식 쏘나타 III(Y3, 1993~98 판매)는 연식과 맞아 3세대 (Y3) 유지. 세대 경계 연식(911 카레라 1994)이나 모델을 특정할 수 없는 매물(GMC 벤츄라, BMW 기타, 미쓰오카 라세드, 모건 플러스 8, 벤츠 바론 레플리카)은 표기를 비운다. 한국차 코드는 현대 내부 코드(그랜저 L·LX, 쏘나타 Y3, 아반떼 J2)다.

- 올드카 연대 퀵필터(2026-10-12 「트럭 적재 용량처럼 60년대·70년대·80년대·90년대 알약칩을 로고 위에」): 올드카 첫 화면은 제조사 로고 레일 바로 위에 `연대 · 60년대 · 70년대 · 80년대 · 90년대` 한 줄을 둔다. 줄 높이 56px, 알약 높이 32px, 간격 8px이며 트럭 적재중량 줄과 같은 투명 바탕·회색 테두리를 쓴다. 한 연대만 선택하며 다시 누르면 해제한다. 선택은 URL `decade=1960|1970|1980|1990`으로 유지하고 실제 매물 연식에 적용한다. 데이터가 없는 연대는 빈 결과 화면을 보여 주되 가상 매물을 만들지 않는다.

- 올드카 썸네일 밸런스(2026-10-12 「올드카 썸네일 밸런스」): 슈퍼카와 같은 방식이다. 사진 파일은 건드리지 않고(배경 제거·블러·번호판 처리 없음) 목록 썸네일 칸에서 차 폭 약 90% · 바닥선 위에서 85%가 되도록 확대·이동한다(`Car.listCrop`, 값은 `src/prototype/data/old-car-list-crop-v01.ts`, 최대 2.6배). 대상은 사진이 있는 63대(보배드림 55 + 기존 시트 8)이고 피드의 큰 사진은 원본이다. 차 영역은 분할 모델로 측정만 했다. `ob-036`(BMW Z3)은 차 영역이 작게 잡혀 확대가 크니 확인이 필요하다.

- 사진 없는 매물 그림(2026-10-11 「이미지 없음 교체」, 노션 「사진이 없습니다_140_100」, 앞의 「이미지 없음_24_24」 아이콘을 대체): 목록 카드 사진 칸(`.bbm-card-photo.is-empty`, 바탕 `#EBEBEB`) 가운데에 노션 원본 SVG(`public/assets/bbm/no-photo-140x100-v01.svg`, 140×100, 한 글자도 고치지 않음)를 칸의 56%(최대 84×60)로 가운데에 표시한다(2026-10-11 「밸런스 맞춰」 → 「커」 → 「줄이자 커 보인다」: 100%·80%는 커 보여 56%로 정했다. 120px 칸에서 약 67×48). 사진 없는 모든 매물에 적용된다.
- 사진 없는 매물 그림(2026-10-11 「이미지 없음 교체」, 노션 「사진이 없습니다_140_100」, 앞의 「이미지 없음_24_24」 아이콘을 대체): 목록 카드 사진 칸(`.bbm-card-photo.is-empty`, 바탕 `#EBEBEB`) 가운데에 노션 원본 SVG(`public/assets/bbm/no-photo-140x100-v01.svg`, 140×100, 한 글자도 고치지 않음)를 칸의 40%(최대 48×34, 120px 칸에서 약 48×34)로 가운데에 표시한다(2026-10-11 「더 줄여라, UX 가이드 사이즈 예시 찾아봐」: SAP Fiori의 「dot」 일러스트가 표 행·작은 카드용 45px이고 중간 카드보다 작은 요소에는 일러스트를 크게 쓰지 말라는 가이드를 근거로 56% → 40%)(2026-10-11 「밸런스 맞춰」 → 「커」 → 「줄이자 커 보인다」: 100%·80%는 커 보여 56%로 정했다. 120px 칸에서 약 67×48). 사진 없는 모든 매물에 적용된다.

- 슈퍼카 시트 매물 v01(2026-10-11 「슈퍼카 카테고리 차량 추가」): 구글 시트 「슈퍼카」 탭 100대(페라리 62 · 람보르기니 32 · 맥라렌 5 · 마세라티 1, 보배드림 사이버매장 공개 매물, 수집일 2026-10-12, `src/prototype/data/supercar-sheet-v01.ts`)를 슈퍼카 카테고리 맨 위에 더한다(기존 럭셔리 목록의 슈퍼카는 그 아래 그대로). 제조사·모델·연식·주행·연료·지역·바디타입은 시트 값, 가격은 시트의 공개 가격 11대만 쓰고 나머지 89대는 시트대로 `가격 상담`이다. 업데이트순은 시트 게시일 최신순(`N일전`, `8.04` 같은 날짜는 수집일 기준 일수로 환산, `9.1`은 9.10으로 봄). 사진은 시트 주소의 보배드림 공개 사진 640×480을 `public/assets/cars/supercar-sheet-v01/`에 원본 그대로 저장한다(2026-10-11 「한국 법상 중고차 딜러 차량은 번호판 공개가 원칙이고 이건 테스트 페이지니까 사진 건드리지 마」: 번호판 흐림·배경 처리·재배치 모두 하지 않는다). 목록 썸네일은 배경 제거·재배치 없이 원본 사진을 그대로 쓴다(2026-10-11 「배경 지우지 마, 차 뭉그러진다, 테스트용」, 처음 만든 `thumb/` 사본은 삭제). 판매자(딜러 이름 · 실제 매매단지) · 등록시각은 가상 값이고 판매자명·연락처·차량번호·원본 URL·매물번호는 저장하지 않는다. 카드 스펙 줄 `24년10월 · 1만km · 가솔린`(월 표기가 있으면 년월, 없으면 숫자 연식).

- 검색창 좌우 크로스체크(2026-10-11 「원본과 검색창 좌우 크기 크로스체크」, 초톳 앱 캡처 1080×2340 ÷2.8125, 검색창 세로 중심 행 기준): 초톳은 뒤로가기 잉크 17.8~29.9 · 검색창 48.0~331.7(폭 283.7, 높이 40.2) · 돋보기 잉크 58.0~73.6 · 입력 글자 시작 84.3 · 구분선 290.5~291.6 · 저장 아이콘 잉크 305.1~318.2 · 하트 잉크 347.4~368.4다. 우리 모바일 헤더(`.top-bar.is-bbm`)는 이전에 검색창 54~326(폭 272)이었고 하트가 1.9 왼쪽, 저장 아이콘이 오른쪽 안쪽 여백 17(초톳 8)이었다. 뒤로가기와 검색창 사이 간격 18 → 12, 하트를 오른쪽으로 1.9px 이동, 검색창 안쪽 칸을 `20px 1fr auto 0.8px 24px`로 두고 구분선(4번째 칸)과 저장 버튼(5번째 칸)을 칸에 고정해 저장 아이콘이 오른쪽 안쪽 여백 8에 오게 했다. 고친 값: 검색창 48.0~332.0, 돋보기 58.2~73.8, 글자 시작 84.5, 구분선 291.0~292.0, 저장 305.8~318.2, 하트 347.4~368.4(초톳과 0.7px 이내). 검색어를 입력해 지우기 버튼이 생겨도 같은 칸 배치를 쓴다.
- 슈퍼카 시트 사진 밸런스(2026-10-11 「사진 밸런스만 맞춰라」): 사진 파일은 건드리지 않고 목록 썸네일 칸에서 보이는 위치와 크기만 맞춘다. 사진마다 차 영역(분할 모델로 측정만 하고 파일에는 쓰지 않음)을 재어 차 폭이 칸의 약 90%, 바닥선이 위에서 약 85%에 오도록 사진을 확대·이동하고(`Car.listCrop` = 사진 폭%·높이%·왼쪽%·위%, `supercar-sheet-v01.ts`의 `crop`), 사진이 칸을 비우지 않도록 확대 배율은 1배 이상·최대 2.6배로 제한한다. 배경 제거·블러·번호판 흐림은 하지 않는다. 피드 사진은 원본 그대로다.

- JDM 카테고리 v01(2026-10-11 「테마별 중고차에 JDM 추가」): `테마별 중고차 → JDM`(`?category=JDM`)은 승용 샘플 대신 구글 시트 「JDM」 탭 21대 중 아래 기준에 맞는 9대(토요타 3 · 닛산 1 · 스즈키 4 · 혼다 1, 코리아카마켓·전국연합 공개 매물, 수집일 2026-10-11, `src/prototype/data/jdm-category-v01.ts`)만 보여준다. **JDM 기준(2026-10-11 「위키백과에서 JDM 기준 봐라」)**: 영문 위키백과 「Japanese domestic market」은 JDM을 「Japan's home market for vehicles」(일본 내수 시장)로 정의하고, 수출형과 사양이 다를 수 있으며, 「일본에서 만들었지만 다른 나라에서 파는 차」를 JDM이라 부르는 것은 잘못된 쓰임이라고 적는다(한국어판에는 문서가 없다). 이에 따라 세계 공통·한국 정식 판매 모델(GR 수프라 · GR86 · 86 2대 · 350Z 2대 · 큐브 3세대 6대, 12대)은 뺐고, 일본 내수 전용 모델(에스티마 · bB 2세대 · MR-S(일본 내수 명칭) · 큐브 2세대 · 경차 허슬러 3 · 알토라팡 · N BOX 터보)만 남겼다. 위키백과도 내수용 경차(수입 인기 모델로 Suzuki Carry · Daihatsu Move · Subaru R2)를 JDM 수입 예로 든다. 시트에는 차대번호·사양 정보가 없어 모델 기준으로만 가렸고 개별 차량이 일본 사양인지는 확인하지 못했다. 같은 시트의 「JDM_일본브랜드_초안」 탭(차란차 50대)은 초안이라 쓰지 않았다. 사진은 시트 주소에서 받은 18대를 `public/assets/cars/jdm-category-v01/`에 원본 그대로 저장했고(2026-10-11 「사진 건드리지 마」 규칙, 번호판 흐림·배경 처리·썸네일 사본 없음) 주소가 죽었거나 막힌 3대(닛산 큐브 2 · 350Z 1)는 빈 사진 칸으로 목록 끝에 둔다. 가격이 「가격문의」·「상담」인 7대는 `가격 상담`, 시트 지역이 시도뿐이라 구·군은 대표 구·군(경기 수원시 · 인천 남동구 · 서울 성동구 · 울산 남구)으로 채우고 실제 매매단지를 붙였다. 판매자(딜러 이름) · 등록시각은 가상 값이고 판매자명·연락처·차량번호·원본 URL·매물번호는 저장하지 않는다. 카드 스펙 줄 `연식(숫자) · 주행 · 연료`(2026-10-12 「변속기는 올드카 카테고리만 노출」: 변속기는 올드카 카테고리 카드에만 보이고 JDM은 뺀다. 필터의 변속기 값은 그대로). 제조사 줄은 일본 브랜드만(`brand-top10-jdm.json`: 토요타 · 닛산 · 혼다 · 스즈키 + 전체 브랜드, 로고는 승용 레일 로고 재사용). 전체차량·중고차 목록에는 섞지 않는다.

- 딜러 화면 커버(2026-10-12 「강홍구 헤더 배경 오토갤러리로 · 1번」): 서울오토갤러리 딜러 화면의 커버(384×125, 초톳 실측 크기 그대로)에 카테고리 헤더와 같은 구성을 올린다. 건물 야경 사진 + 왼쪽 어두운 그라데이션(shade) + SAG 마크(34×46, 왼쪽 16) + `서울오토갤러리` 18/23 700 · `수입차 전문 매매단지` 12/17 400. 오른쪽 아래 `최근 활동` 알약은 그대로. 모든 서울오토갤러리 딜러에 적용(`dp-cover-*`).

- 피드 메타정보 가운데 점 간격(2026-10-12 「가운데 점, 메타정보 간격 밸런스 맞춰라」): 글자 「 · 」(공백 포함)은 점 글리프가 왼쪽에 치우치고 항목 안 `gap: 3px`까지 더해져 점 앞 7 · 뒤 10처럼 좌우가 달랐다. 점을 CSS 원(`.bbm-card-spec-dot`, 3×3 `currentColor`, 글자 세로 가운데)으로 바꾸고 양쪽 7px로 맞췄다(아이콘 없는 줄은 항목 gap 0). 측정(384, 올드카 피드): 모든 점 앞 7.00 · 뒤 7.00.

- 피드 메타정보 점 크기·간격 엔카 기준(2026-10-12 「가운데 점 엔카 기준 잡아」, 엔카 앱 목록 캡처 1080×2340 픽셀 실측): 엔카 `26/06식 · 1,632km · 가솔린 · 서울`에서 점 지름 5px = 숫자 높이(28px)의 0.18배, 점 중심은 숫자 세로 중심보다 1.5px(0.05배) 아래, 글자 잉크와 점 사이 왼쪽 13~16 · 오른쪽 10~11px(글자 높이 0.37배 · 0.27배, 점 앞 글자 오른쪽 여백이 더 커 보이는 건 숫자 `1`의 왼쪽 여백 때문). 우리 점은 지름 2px(15px 글자의 0.13배), 양쪽 박스 여백 4px로 줄여 4배 확대 측정에서 점 앞 4.75 · 뒤 4.75px(엔카 환산 5.5 · 4.1), 점 중심은 숫자 중심보다 0.4px 아래(엔카와 같은 비율)다. 이전 3px · 양쪽 7px은 취소.

- 페라리 시트 매물 v02(2026-10-12 「페라리 추가해라」): 구글 시트 「페라리 모델별 매물 수집_차란차_코리아카_전국연합_2026-10-12」(중복 제거 9대: 차란차 4 · 전국연합 carku 5 · 코리아카마켓은 접속 오류 0, `src/prototype/data/ferrari-sheet-v02.ts`) 중 8대를 슈퍼카 카테고리 맨 위(슈퍼카 시트 매물 v01보다 위)에 더한다. GTC4 루쏘 T 3.9 V8(18,990만원)은 사용자 지시 매물 3004와 같아 뺐다. 모델 로고 레일 그룹은 기존과 같은 `488 · 푸로산게 · 로마 · 296 · 812 · 포르토피노`다. 제조사·모델·연식·최초등록(카드 `19년01월`)·주행·연료·가격·바디타입·단지는 시트 값이고 가격이 비어 있던 4대는 시트대로 `가격 상담`이다. 위치는 시트의 실제 단지(`경기 수원시 · 도이치오토월드` 3대, `서울 서초구 · 서울오토갤러리` 5대). 연락처·차량번호·VIN·개인 딜러명·원본 URL·매물 ID는 저장하지 않고, 판매자 이름은 가상 값(`가상 이름 딜러`), 등록시각은 1~3일 전 가상 값이다. 사진은 시트에 없어 빈 사진 칸(노션 「사진이 없습니다」 그림)이다.

- 페라리 시트 매물 v02 사진 없는 매물 제외(2026-10-12 「사진 없는건 빼」): 위 8대는 사진이 시트에 없어 슈퍼카 목록에서 뺐다(데이터 파일 `ferrari-sheet-v02.ts`에는 남기고 `photo` 값이 있는 행만 노출). 사진이 오면 행에 `photo`를 넣으면 다시 나온다. 앞의 「빈 사진 칸」 표기는 이 규칙으로 대체한다.

- 페라리 시세 가격 기재(2026-10-12 「엔카 페라리 매핑해서 가격 상담 가격 기재해라」): 슈퍼카 시트 매물 v01 중 `가격 상담`이던 페라리 54대에 엔카 시세를 넣었다(람보르기니 등 다른 제조사의 `가격 상담`은 그대로). 방법: 엔카 공개 검색(페라리 220건, 중복 제거 208건)을 모델 단위로 매핑(296 GTS · 296 GTB · SF90 스파이더 · SF90 스트라달레 · 488 스파이더 · 360 · 로마(스파이더는 스파이더끼리) · 푸로산게 · F8 스파이더 · F8 트리뷰토 · 812 GTS · 812 슈퍼패스트 · 포르토피노 · 12 칠린드리)하고, 매물마다 일반 매매 비교 매물 중 `연식 차이 ×2 + 주행 차이 ÷5,000km`가 가장 가까운 5대의 가격 중앙값을 100만원 단위로 반올림했다. 일반 매매가 3대 미만이면 리스 매물의 차량 가격까지 포함했다(SF90 스트라달레 · 812 GTS · 12 칠린드리 · 로마 스파이더 일부). 비교 매물이 2대뿐인 360(약 9,200만원)·12 칠린드리(7,500만원)는 신뢰가 낮다. 이 값은 실제 판매가가 아닌 시세 추정이며 엔카 매물 ID · 주소 · 판매자는 저장하지 않았다. 사이트 시트 값(보배드림 공개가)이 있는 페라리 8대는 그대로다.

- 페라리 시트 매물 v02 썸네일 연결(2026-10-12 「KB차차차 판매자명 조회해서 페라리 매핑, 썸네일만」 → 「1번으로 진행해라」): KB차차차는 이 작업 환경 접속이 막혀(모든 주소가 `ERROR` 한 줄, 우회 안 함) 못 썼다. 대신 시트에 원본 주소가 있는 같은 매물의 사이트에서 대표 사진 1장만 받았다. 차란차 3대(488 스파이더 3.9 · 푸로산게 6.5 V12 · 로마 3.9)는 같은 매물 페이지의 `og:image`(1280×720 WebP 원본, 번호판 · 배경 문구 그대로, 가공 없음)를 `public/assets/cars/ferrari-sheet-v02/fr-001~003.webp`로 저장해 `photo`에 연결하고 이 3대만 슈퍼카 목록 맨 위에 나온다(가격은 시트 값 21,900 · 67,000 · 19,900만원). 전국연합(carku) 5대(296 GTB · 812 · 포르토피노 · 296 GTS · 로마 스파이더)는 사이트 접속이 거부되어 사진이 없고 계속 제외한다. 사진은 내부 테스트용이며 판매자(`가상 이름 딜러`)와 등록시각은 가상 값이다.

- 중고차 상세 초톳 동일화 1·2차(2026-10-13 「매물 상세정보 수정, 초톳 UI·UX 동일」): 목록에서 연 매물의 사진·제목·메타·가격·지역·등록시각을 상세에 그대로 쓴다(`getActiveDetailCar`, 값은 `public/assets/detail-title-override.css`의 `data-override-*` 통로로 넣음). 첫 메타줄은 목록 카드와 같은 `bbmCardSpec(car, false)`(마력 없음)이다(예: `2023 · 2.2만km · 가솔린`, 최대 4칸). 제목은 `제조사 모델 세대` 아래줄에 등급. 사진이 2장 이상이면 큰 사진 아래에 썸네일 줄(`.detail-thumbs`, 칸 64×48 · 간격 4 · 좌우 12 · 선택은 `#222` 2px 테두리, 누르면 해당 사진으로 이동)을 둔다. 썸네일 크기는 지시 문서의 이베이 모터스 캡처가 글자 인식본만 읽혀 실제 픽셀 크기를 확인하지 못해 임시값이다(확인 필요).

- 상세 썸네일 선택 표시(2026-10-13 「동처띠처럼 선택 썸네일 명확하게, 우린 에어비앤비 검정」): 동처띠 상세 사진 하단 줄(노란 2px 테두리·선택 칸 가운데 이동·나머지 흐림)을 참고하되 색은 에어비앤비 검정 `#222`를 쓴다. 칸 92×62 · 간격 8 · 선택은 `#222` 2px 테두리 + 안쪽 흰 틈 2px · 비선택 투명도 .7 · 선택 칸이 줄 가운데로 오게 줄만 가로 이동. 앞의 64×48 임시값은 이 값으로 대체한다.

- 상세 썸네일 크기 조정(2026-10-13 「폰 사진까지 고려」): 폰 사진이 4:3이라 3:2 칸(92×62)은 위아래가 약 11% 잘려 칸을 4:3 80×60 · 간격 6으로 바꿨다(384 폭에서 약 4.5칸이 보여 옆으로 넘길 수 있음을 알린다). 선택 표시(`#222` 2px · 비선택 .7 · 가운데 이동)는 그대로. 이베이 모터스 실제 크기는 캡처가 글자 인식본뿐이라 반영하지 못했다.

- 페라리 상세정보 실제 값 연결 v01(2026-10-13 「상세정보 페라리 모두 실제 정보 적용」): 구글 시트 「페라리 매물 상세정보 입력용_2026-10-13」(차란차 공개 매물)에서 끝까지 읽힌 값만 `src/prototype/data/ferrari-detail-v01.ts`에 옮겨 사진이 있는 차란차 3대(488 스파이더 · 푸로산게 · 로마)에 연결했다(`Car.ferrariDetail`). 이 매물의 상세는 차량 정보(연식 · 정확한 주행거리 · 연료 · 변속기 · 배기량 · 색상, 더보기 = 차종 · 바디타입 · 판매구분), 옵션(시트의 주요옵션 중 잘리지 않은 항목 + `옵션 N개 중 주요`), 보험 이력(내 차·상대 차 피해, 전손·침수·도난, 소유자·번호판 변경 횟수, 로마는 보험이력 값이 없어 「정보 없음」), 성능점검 유무, 판매자(상사 · 소속 조합), 판매 정보(차량가 · 판매구분)만 보여준다. 벤틀리 시안의 가상 값(제조사 보증, 상세 설명, 예상 총비용, 다른 매물·동급 매물, 제시번호, 이력조회 링크)은 이 매물에서 숨긴다. 시트의 옵션·사진 URL이 도구에서 잘려 읽혀 옵션 일부와 사진 2~5장은 못 넣었다(사진은 대표 1장). 차량번호·VIN·연락처는 저장하지 않는다. 전국연합(carku) 5대·코리아카마켓 1대·GTC4 루쏘 T는 사진이 없거나 값이 잘려 아직 연결하지 못했다.

- 상세 상단 = 목록 카드 정보(2026-10-13 「초톳처럼 리스트와 동일하게 · 판매자 제외 · 하트만 동일」): 실제 매물에서 연 상세는 사진·썸네일 아래 첫 블록을 목록 카드(`BbmResultCard` mobile)와 같은 컴포넌트·같은 CSS로 그린다(조상 클래스 `marketplace is-bbm-m is-qf-guazi` + `.bbm-m-list`). 순서는 `제조사 모델 세대 등급`(한 제목) → 메타정보(`bbmCardSpec`) → 가격(숫자 700 · 만원 400, 검정) → 지역(위치 아이콘 + `시도 구군 · 단지`)이고, 목록의 사진과 판매자 줄은 숨기며 하트(찜)는 목록과 같은 아이콘·색·찜 상태를 지역 줄 오른쪽 끝에 둔다. 앞의 `data-override-*` 연결(분홍 가격 · 2줄 제목 · 등록시각 줄)은 실제 매물에서는 쓰지 않는다(벤틀리 시안 폴백은 그대로). 판매자 카드 · 차량 정보 등 아래 블록은 바꾸지 않았다.

- 상세 지역 줄 초톳화(2026-10-13 「초톳처럼 지역 아이콘과 텍스트 색상 크기 변경」, 초톳 상세 캡처 923px÷2.4 환산): 상세 상단 지역 줄만 목록과 다르게 쓴다. 아이콘은 목록과 같은 초톳 위치 아이콘 원본을 20px · 진한색(검정 87%)으로 키우고, 글자는 1줄 `시도 구군` 16/24 400 `#222`, 2줄 단지명 16/24 `#8C8C8C`(초톳의 `Phường 1, Quận 4` / `Phường Vĩnh Hội…` 두 줄 구조), 아이콘과 글자 간격 10, 가격 줄 아래 10. 초톳 상세 아이콘은 속 빈 외곽선형이고 우리 원본은 속 채운 핀이라 모양은 다르다(노션 원본 아이콘이 오면 교체). 목록 카드의 지역 줄은 그대로다.

- 상세 상단 글자 크기 크로스체크(2026-10-13 「지역 한 줄로 · 제조사 모델 등 텍스트 크기 크로스체크」, 초톳 상세 캡처 1080×2340 ÷2.8125 잉크 실측): 제목 대문자 M 13.5 · 줄 간격 29.5, 메타 숫자 10.3, 가격 숫자 14.9, 지역 글자 10.7 · 줄 간격 20.3. 숫자·대문자 높이 ÷ 0.72를 글자 크기로 환산해(제목 19 · 메타 14 · 가격 20 · 지역 15, 소수는 반올림) 상세 상단만 목록과 다르게 쓴다: 제목 19/29.5 500 `#222`, 메타 14/20 `#595959`(제목 아래 4), 가격 20/28 700 `#222`(만원 400, 초톳의 분홍은 쓰지 않음, 위 8), 지역 15/20 한 줄 `시도 구군 · 단지`(단지는 `#8C8C8C`, 넘치면 줄바꿈)·아이콘 18. 앞의 「지역 줄 초톳화」 2줄·16/24 값은 이 값으로 대체한다. 목록 카드는 그대로다.

- 상세 지역 아이콘 교체(2026-10-13 「아이콘 변경도」): 노션 「베트남 초톳 아이콘 전체」의 `chotot-profile-location`(속 빈 외곽선 핀, `currentColor`)을 한 글자도 고치지 않고 `public/assets/bbm/chotot-profile-location-v01.svg`로 두고 상세 상단 지역 줄에만 쓴다(목록 카드는 기존 아이콘). 초톳 캡처 실측 핀 잉크 15.6×19.9 · 왼쪽 16 · 글자 시작 40.2에 맞춰 24px 상자(잉크 16×20), 상자 왼쪽 12(카드 안쪽 여백 16 − 4), 글자와 간격 4, 글자 첫 줄 중심과 맞춤. 앞의 「속 채운 핀 · 아이콘 18px」은 이 값으로 대체한다.

- 상세 판매자 정보 영역(2026-10-13 「지역 밑에 판매자 정보 영역 추가하자」, 초톳 상세 판매자 카드 참고): 실제 매물 상세는 상단 블록의 지역 줄 바로 아래에 판매자 카드(테두리 1px `#EBEBEB` · 반경 12 · 좌우 16, 프사 48 원형 · 이름 16/22 600 · 딜러만 `N대 판매중` 14/20)를 둔다. 이름·프사는 목록 카드와 같은 값(`sellerLabel`·`sellerAvatar`)이고, 개인은 `개인판매자`만 표시한다. 페라리 실제 상세는 상사 · 소속 조합을 13/18 회색 줄로 더한다. 아래 회색 영역의 옛 판매자 카드(종사원번호 · 매매유형)는 실제 매물에서 숨긴다(시안 폴백은 그대로). 초톳의 평점 · 응답률 · 판매완료 대수는 우리에게 실제 값이 없어 넣지 않았다.

- 상세 사진 가운데 인디게이터 제거(2026-10-13 「가운데 인디게이터 빼자」): 상세 큰 사진 아래 가운데 점(`.detail-photo-pagination`)을 뺐다. 오른쪽 아래 `1 / 5` 개수 알약과 썸네일 줄이 위치를 알려준다. 목록 피드 사진의 점(레딧 스타일)은 그대로다.

- 상세 판매자 영역 수정(2026-10-13 「판매중 판매완료 추가하고 · 판매자 박스 제거해 외곽 테두리」, 초톳 상세 판매자 줄 캡처): 앞의 판매자 카드에서 외곽 테두리 · 반경 · 안쪽 여백 박스를 없애고 프사 48 + 이름 + 한 줄만 둔다(좌우 16). 딜러는 `N대 판매완료 · N대 판매중`(숫자 600, 14/20 `#595959`)을 보여준다. 판매중은 매물의 재고 값이고 판매완료는 실제 값이 없어 매물 번호로 정한 가상 값(12~199)이다. 서울오토갤러리·도이치오토월드 카테고리 피드의 「판매완료 미표시」 규칙은 사용자 지시로 상세에서만 예외로 한다(목록·피드는 그대로). 개인은 이름만 표시한다.

- 상세 하트·단지 색·딜러 이름(2026-10-13 「하트 위치 차명 줄에 · 매매단지 색상도 동일하게 · 이은호 딜러」): 상세 상단의 찜 하트를 지역 줄 오른쪽 끝에서 차명(제목) 첫 줄 오른쪽 끝으로 옮겼다(카드 오른쪽 10 · 위 12, 제목은 오른쪽 40을 비워 겹치지 않음). 지역 줄의 매매단지(`· 서울오토갤러리`)는 앞의 `시도 구군`과 같은 `#222`로 맞췄다(이전 회색). 판매자 이름은 `이은호 딜러`처럼 `이름 딜러` 형식으로 쓰고, 목록의 `이름 상사`는 이름만 따서 `박상용 딜러`로 바꾸며 상사(`디앤디플러스`)는 아래 13/18 회색 줄로 옮긴다. 이미 `…딜러`로 끝나는 이름은 그대로 둔다.

- 상세 상사 정보 숨김(2026-10-13 「상사정보 일단 빼」): 상세 판매자 영역에서 상사 줄(`디앤디플러스`, 페라리 `상사 · 소속 조합`)을 뺐다. 이름은 `이름 딜러`, 아래 줄은 `N대 판매완료 · N대 판매중`만 남긴다. 데이터(`ferrariDetail.shop/union`)는 그대로 둔다. 앞의 상사 회색 줄 규칙은 이 규칙이 대체한다.

- 상세 하트 위치 크로스체크(2026-10-13 「우측 하트 위치 크로스체크」, 384 기준 상자 측정): 목록 카드 하트는 아이콘 24 · 상자 32(오른쪽 끝 368 = 화면 오른쪽 여백 16)다. 상세 하트는 이전에 오른쪽 끝 358(10 안쪽)이고 아이콘 중심이 제목 첫 줄 중심보다 1.5 아래였다. 상자 오른쪽 끝을 368로, 위를 10.5로 고쳐 아이콘 340~364 · 중심 y가 제목 첫 줄 중심(411.5)과 같아졌다. 제목 오른쪽 여유는 36(한 줄 제목이 하트와 겹치지 않는 최소). 초톳 상세는 `Lưu` 알약 버튼(오른쪽 끝 화면에서 8)이라 모양이 다르지만, 사용자 지시(하트만 목록과 동일)에 따라 목록 하트 기준으로 맞춘다.

- 상세 판매자 프사 실사화(2026-10-13 「프사 실사 느낌 변경하고」): 상세 판매자 영역의 프사(48 원형)는 기본 아이콘·일러스트 대신 승인된 초톳 인물 사진 26장(`chototHumanSellerProfiles`)을 매물 번호로 돌려 쓴다(`sellerDetailPhoto`). 서울오토갤러리·도이치오토월드 같은 실제 딜러 카테고리도 상세에서는 같은 방식이다(목록·피드의 기본 아이콘 규칙은 그대로). 이 사진은 자리용이며 실제 딜러 본인 사진이 아니다.

- 상세 상사명·등록일 추가(2026-10-13 「지역 밑에 상사명 2줄 · 그 밑에 등록일 · 아이콘 사용」): 상세 상단은 지역 줄 아래에 상사명 줄(지역 글자 시작선 44, 15/20 `#8C8C8C`, 상사가 있는 딜러만 — 페라리 실제 상세는 시트 상사, 서울오토갤러리 등은 판매자 이름 뒤 상사)을 두고, 그 아래 등록일 줄(시계 아이콘 24 + `등록 N일 전` 15/20 `#222`, 위아래 12)을 둔다. 시계 아이콘은 노션 「베트남 초톳 › 시계」(`chotot-common-clock_(시계).svg`)를 한 글자도 고치지 않고 `public/assets/bbm/chotot-common-clock-v01.svg`로 쓴다. 판매자 영역은 그 아래다. 앞의 「상사 정보 숨김」은 이 지시로 상사명만 지역 아래로 다시 보이게 했다(판매자 영역 안에는 여전히 없음).

- 상세 상사명 위치 수정(2026-10-13 「매매단지 다음에 상사명 나오게」): 앞의 별도 상사명 줄을 없애고 상사명을 지역 줄의 매매단지 바로 뒤에 같은 줄로 잇는다(`서울 서초구 · 서울오토갤러리 · 디앤디플러스`, 모두 `#222` 15/20, 넘치면 줄바꿈). 등록일 줄(시계 아이콘)은 그 아래 그대로다.

- 상세 연식 표기 통일(2026-10-13 「우리 중고차 연식 표기법 맞춰라」): 상세 `차량 정보` 카드의 연식은 목록 카드 첫 사양과 같은 우리 표기를 쓴다(월을 알면 `19년01월`, 모르면 숫자 4자리 `2023`·`1990`, `2021년 1월`·`2019년` 같은 표기 금지). 실제 상세 값이 없는 매물도 연식·주행거리(정확값 `22,000km`)·연료는 옛 시안 값(`2021년 1월` · `4만km`) 대신 매물 값으로 바꾼다. 나머지 행(변속기·배기량·색상 등)은 아직 시안 값이다.

- 연식 표기 차란차 방식 보정(2026-10-13 「차란차 방식으로 우리 연식 표기하기로 했잖아」): 차란차 매물은 최초등록 연월과 연형이 다르면 `23년08월(22년형)`으로 쓴다(월 두 자리·붙여 쓰기·`식` 없음은 그대로). 앞의 상세 연식 통일(`19년01월` 등)은 유지하되, 페라리 시트 매물(`ferrari-sheet-v02`)은 연형이 다른 로마 3.9(`23년08월(22년형)`)·812 슈퍼패스트(`18년10월(19년형)`)·포르토피노 등에 연형을 붙여 목록·피드·상세가 같은 값을 쓴다. 연형이 같으면 `19년01월`이고, 월을 모르면 숫자 4자리(`2023`)다.

- 법인 표기 생략(2026-10-13 「주식회사 (주)는 생략하자, 인수인계 문서에도 기재」): 화면에 쓰는 상사명·딜러명에서 `주식회사`와 `(주)`를 뺀다(상세 지역 줄의 `주식회사 에이엠씨인터내셔널` → `에이엠씨인터내셔널`). 목록·피드의 판매자 줄은 이미 같은 규칙이었고, 상세도 `stripCorp`로 맞췄다. 데이터 원본은 그대로 둔다. `docs/HANDOFF.md` 10장에도 적었다.

- 상세 지역 줄 자동 줄바꿈(2026-10-13 「길이가 길어지면 상사명은 자동으로 아랫줄」): 지역 줄의 보조 항목(매매단지 · 상사명)을 항목 단위(`.bbm-card-location-part`, 줄바꿈 금지)로 나눠 한 줄에 다 들어가면 `경기 수원시 · 도이치오토월드 · 에이엠씨인터내셔널`로 잇고, 길어서 넘치면 넘친 항목(상사명)이 통째로 아랫줄로 내려간다. 아랫줄 맨 앞에는 가운데 점을 쓰지 않는다(`useLocationWrap`가 줄 맨 앞 항목에 `is-line-start`를 붙임, 크기 변경도 감지). 목록 카드의 지역 줄은 같은 글자 `A · B`로 그대로다(두 번째 항목부터 앞에 ` · `를 CSS로 붙임). 폭 384에서는 한 줄, 340에서는 상사명이 아랫줄로 내려가는 것을 확인했다.

- 상세 지역 줄 링크(2026-10-13 「에어비앤비처럼 단지 상사 밑줄 링크」, 에어비앤비 모바일 숙소 상세 직접 확인): 에어비앤비는 링크를 파랑 대신 본문색 + 밑줄(두께 1px · 글자와 간격 2px)로 쓰고, 이동할 곳이 없는 글자(상단 위치 줄 등)에는 밑줄을 쓰지 않는다. 우리 상세 지역 줄도 이동할 곳이 있는 항목에만 같은 밑줄을 긋는다. 매매단지는 그 카테고리 목록(서울오토갤러리 · 도이치오토월드)으로, 상사명은 딜러 페이지(`?profile=dealer&shop=…&emp=…`, 화면이 있는 서울오토갤러리 딜러 5명만)로 이동한다. `시도 구군`과 링크가 없는 단지·상사는 밑줄 없는 일반 글자다. 이동은 같은 탭 전체 이동이라 상세 화면 상태는 유지되지 않는다(딜러 화면의 뒤로 가기는 브라우저 기록을 쓴다). 키보드는 Tab으로 이동해 Enter로 연다.

- 상세 차량 정보 카앤비드 구성(2026-10-13 「카앤비드처럼 구성, 한국 문화에 맞게」): 실제 매물 상세의 `차량 정보`는 카앤비드 「Doug's Take / Highlights → 사실표(Make·Model·Mileage·VIN·Title Status·Location·Seller Type…)」 구성을 따라 2열 사실표(`.detail-facts`, 라벨 13 #8C8C8C · 값 15 600)로 바꾸고 그 위에 `차량 소개`(`.detail-highlights`) 문장을 둔다. 한국 중고차 문화에 맞춰 VIN·Title Status 대신 `연식 · 정확한 주행거리 · 변속기 · 배기량 · 바디타입 · 차종 · 외장색 · 지역 · 판매자 유형(매매업체(딜러)/개인) · 판매구분 · 성능점검 · 보험이력`을 쓰고, 값이 없거나 `전체` · `정보 없음` · `기타`면 그 행을 뺀다. 차량 소개 문장은 실제 값에서만 만든다(연식·제목·색상, 주행·연료, 보험이력 횟수 또는 「등록된 보험이력 정보가 없어…」, 옵션 요약, 지역·판매자 유형). 실제 값이 없는 가상 카드(옵션·보험이력·성능점검·보증·상세 설명)는 페라리 외 매물에서는 숨기고 `차량 소개 · 차량 정보 · 판매 정보`만 보여준다.

- 상세 차량 정보 1열·2열(2026-10-13 「카앤비드처럼 1열 2열 구조」): 사실표를 라벨(1열, 96px, 14/20 #8C8C8C) | 값(2열, 15/22 600) 한 줄씩 쌓는 구조로 바꿨다. 줄 위아래 12, 줄 사이 1px #EBEBEB. 앞의 2열 격자(라벨 위·값 아래)는 대체.

- 상세 차량 정보 초톳 간격·타이포(2026-10-14 「초톳 간격과 텍스트 타이포그래피로」, 초톳 매물 상세 `Đặc điểm` 카드 캡처 1080×2340 ÷2.8125 실측): 카드 가장자리 8 · 안쪽 좌우 16, 제목 18/24 700 `#222`(카드 위 → 제목 글자 중심 약 22), 제목 → 첫 줄 위 약 41, 줄 높이 40 + 아래 1px `#E8E8E8`(피치 40.9), 값 열은 안쪽 폭의 50%(x=192)에서 시작, 라벨·값 모두 14/20 400 `#222`(숫자 높이 9.6~10 ÷ 0.72), 라벨 뒤 `:`. 초톳의 줄 앞 16px 아이콘(x 26, 라벨 시작 53)은 이번 지시(간격·타이포)에 없어 넣지 않았다. 앞의 96px | 값 열 · 15/22 600 값은 이 값으로 대체. 초톳 링크(nhatot.com)는 접속 확인 화면에 막혀 사용자 캡처로 실측.

- 상세 차량 정보 초톳 크로스체크 보정(2026-10-14 「크로스체크해」, 초톳 `Thông tin chi tiết` 캡처 1080×2340 ÷2.8125 실측): 아이콘 없는 초톳 사실표는 줄 피치 39.1(위아래 9 + 글자 줄 20 + 아래 1px `#E8E8E8`, 두 줄 값은 59.4 = 9+40+9+1), 라벨 뒤 `:` 없음, 값 열 x=192.5(안쪽 폭 50%), 라벨 시작 24.5~25.2, 카드 위 → 제목 글자 윗선 17.7, 카드 위 → 첫 줄 위 47.6, 글자 `#222` 14. 앞의 줄 높이 41 · 라벨 뒤 `:`(아이콘 있는 `Đặc điểm` 캡처 기준)는 우리가 아이콘을 쓰지 않으므로 아이콘 없는 쪽 값으로 대체한다. 우리 측정(384): 카드 8 · 제목/라벨 24 · 값 192 · 피치 39 · 첫 줄 위 47.

- 상세 차량 정보 카앤비드 Quick Facts 타이포·간격(2026-10-14 「카앤비드」, 카앤비드 모바일 캡처 1080×2340 ÷2.8125 실측): 줄 피치 42.67(위아래 약 10.8 + 글자 줄 20 + 아래 1px `#E3E3E3`), 라벨 16 600 · 값 16 400 · 모두 `#262626`(대문자 높이 11 ÷ 0.72), 값 열 x=160(라벨 열 138), 링크 값은 본문색 + 밑줄(두께 1px · 간격 2px, 카앤비드 Make · Model · Location). 우리는 `제조사` 값만 같은 제조사 목록(`?qf=guazi&maker=…`)으로 링크한다(모델 · 지역은 이동할 목록이 아직 없어 일반 글자). 카앤비드의 둥근 테두리 박스 · 판매자 아바타 + `Contact` 알약은 넣지 않았다(회색 영역 카드 구조 유지, 판매자는 위 판매자 영역). 앞의 초톳 값(줄 39 · 14/20 · 값 열 50%)은 이 값으로 대체한다 — 초톳 값으로 되돌리려면 PR #539 상태로 복원.

- 상세 차량 정보 초톳 값 확정(2026-10-14 「너 판단, 초톳과 카앤비드」): 위쪽 제목·메타·가격·지역이 초톳 실측이고 한글은 굵은 16px 라벨이 무거워 보이므로, 사실표 간격·타이포는 초톳 값(줄 39 · 14/20 400 `#222` · 값 열 50% · 구분선 `#E8E8E8`)으로 되돌린다. 카앤비드에서는 이동할 곳이 있는 값만 밑줄 링크로 쓰는 방식(제조사 → 같은 제조사 목록)만 가져간다. 바로 앞의 카앤비드 값(줄 42.67 · 16px 라벨 600)은 대체.

- 상세 차량 정보 라벨 색(2026-10-14 「최적안 적용」, 엔카 · 차란차 · 헤이딜러 · 카앤비드 · 당근 비교): 라벨은 `#595959`(헤이딜러 · 당근처럼 라벨을 옅게 해 위계를 만들되 우리 중립 토큰 사용), 값은 `#222` 유지. 크기 14/20 · 보통 굵기 · 줄 39 · 값 열 50%는 초톳 값 그대로.

- 상세 차량 정보 크기 비교 시안(2026-10-14 「차란차 크기 · 초톳 크기 2개 시안」, 미리보기 전용): 기본(초톳 크기) = 14/20 · 줄 39, 주소 끝 `&facts=charancha`(차란차 크기) = 16/22 · 줄 38(차란차 기본 정보 글자 높이 14.2 ÷ 0.87 ≈ 16). 색 · 값 열 50% · 정렬은 두 시안 같다(차란차의 값 오른쪽 정렬은 크기가 아니라 이번 시안에서 제외). 결정되면 하나를 기본으로 하고 파라미터를 뺀다. D 보완(같은 날 「너도 수정 작업 들어가라」): 하위 메뉴가 하나뿐인 메뉴(바이크 등)는 칩 줄과 흰 띠를 그리지 않고 헤더 아래 1px 선을 되살린다(`:has()` 조건).

- 상세 차량 정보 크기 확정(2026-10-14 「차란차 크기가 맞다, 초톳은 너무 안 보인다」): 사실표 기본을 차란차 크기 16/22 · 줄 38(위아래 7.5 + 22 + 1px)로 한다. 라벨 `#595959` · 값 `#222` · 값 열 50% · 왼쪽 정렬 · 구분선 `#E8E8E8`은 그대로. `&facts=charancha` 비교 파라미터는 뺐다. 앞의 14/20 · 줄 39(초톳 크기)는 대체. 위쪽 제목·메타·가격·지역(초톳 실측)과 섹션 제목 18/24은 그대로.

- 상세 설명글류 차란차 크기(2026-10-14 「초톳 방식 유지, 설명글 같은 것만 차란차 따라하자, 14 너무 작아 보여」, 차란차 매물 페이지 실제 스타일 읽음: 본문 16/24 400 `#191F28`, 메타 14/20 `#505C6C`, 제목 20/30 600, 가격 24/36 700, 섹션 제목 18/26 700, 사실표 16/24 · 값 500 · 줄 24+간격 14): 초톳 방식인 상단 제목 · 메타 · 가격 · 지역 줄 · 사실표 구조는 그대로 두고, 설명글류만 16/24로 키운다 — `차량 소개` 문장(15/23 → 16/24 `#191F28`), `판매 정보` 줄(14 → 16/24, 줄 38), 판매자 `N대 판매완료 · N대 판매중` 줄(14/20 → 16/24). 폭 340에서도 판매자 줄은 한 줄(높이 24).

- 상세 차량 정보 항목·더보기(2026-10-14 「차량번호 · 제조사 · 모델 · 연식 · 출시가격(옵션미포함) · 연료 · 배기량 · 변속기 · 차종 · 인승 · 바디타입 · 외관 색상 · 시트 색상 · 판매방식 · 압류/저당 · 제시번호 모두 포함 후 에어비앤비처럼 정보 더보기, 일단 추가 또는 명칭 수정」): 사실표 순서는 `차량번호 · 제조사 · 모델 · 연식 · 주행거리 · 출시가격(옵션미포함) · 연료 · 배기량 · 변속기 · 차종 · 인승 · 바디타입 · 외관 색상 · 시트 색상 · 판매방식 · 압류/저당 · 제시번호`이고 그 뒤에 지역 · 판매자 유형 · 성능점검 · 보험이력 조회(값 있을 때만)가 붙는다. 값이 없는 항목도 줄은 두고 `정보 없음`(압류/저당은 `정보 없음 / 정보 없음`). 차량번호 · 제시번호는 저장하지 않는 값이라 항상 `정보 없음`, 출시가격 · 인승 · 시트 색상 · 차종(페라리 외)도 아직 데이터가 없다. 명칭 수정: 외장색 → 외관 색상, 판매구분 → 판매방식. 주행거리는 사용자 목록에 없었지만 핵심 정보라 연식 다음에 유지했다(확인 필요). 처음에는 6줄(차량번호 ~ 출시가격)만 보이고 `정보 더보기 ⌄` 링크(본문색 600 16/24 · 밑줄 1px · 간격 2px, 에어비앤비 Show more)로 모두 펼치며 펼치면 `정보 접기`로 바뀐다.

- 상세 차량 정보 추정 값 채우기(2026-10-14 「너 정보 다 추가해봐」): 실제 값이 없는 항목 중 규칙으로 정할 수 있는 것만 채웠다(UI 검증용 가상·추정 값, 실제 제원 아님). 차종 = 모델 이름 규칙(대형 S클래스·7시리즈·그랜저 등 / 중형 E클래스·5시리즈·쏘나타 등 / 준중형 C클래스·3시리즈·M3·아반떼 등, 못 찾으면 `정보 없음`, 페라리는 시트 값), 인승 = 바디타입 규칙(세단·SUV·해치백·왜건 5 · 쿠페·컨버터블 4(페라리·람보르기니·맥라렌 쿠페·컨버터블 2) · MPV 7 · 밴 9), 시트 색상 = 매물 번호로 정한 가상 값(블랙·베이지·브라운·그레이·레드·화이트), 제시번호 = 매물 번호로 만든 11자리 가상 번호(`2026` + 7자리). 차량번호 · 출시가격 · 압류/저당은 근거 데이터가 없고 지어내면 실제 정보로 오인되므로 `정보 없음`을 유지한다(차량번호는 저장 금지 규칙).

- 상세 차량 정보 아이콘 조합 시안(2026-10-14 「오토트레이더 Overview처럼 아이콘 조합 시안, 아이콘은 노션 DB」): 기본(1열·2열 줄 목록)은 그대로 두고 주소 끝 `&facts=icons`로만 본다. 오토트레이더 모바일 Overview 격자(2열, 칸마다 아이콘 24 + 굵은 라벨 위 · 값 아래, 아이콘과 글자 12)를 따르되 글자는 16/24(라벨 700 · 값 400 `#222`). 처음 8칸(차량번호 ~ 연료 · 배기량)만 보이고 `정보 더보기`로 전체 19칸. 아이콘은 노션 「영국_오토트레이더 초톳 변경」 DB 원본 SVG를 한 글자도 고치지 않고 `public/assets/bbm/detail-icons/`에 둔다: 연식 `year` · 주행거리 `mileage` · 연료 `fuel` · 바디타입/차종 `body` · 배기량 `engine` · 변속기 `gearbox` · 서류(차량번호 · 압류/저당 · 제시번호 · 성능점검 · 보험이력 대용) `document` · 위치 `location`(기본정보_중고차), 인승 `seats`(12. 좌석 수) · 외관/시트 색상 `color`(10. 색상) · 제조사 `maker` · 모델 `model`(3. 제조사 및 모델) · 출시가격 `price` · 판매방식/판매자 유형 `seller-type`(필터 수정본). DB에 전용 아이콘이 없는 항목은 가까운 것으로 대신했다(차량번호 · 제시번호 · 압류/저당 → 서류, 차종 → 바디타입, 시트 색상 → 색상). 원본 색(`#242D3D` · `#444444`)과 크기(16 · 18 · 24)가 섞여 있어 24 상자에 contain으로 그리고 색은 맞추지 않았다. 결정되면 하나를 기본으로 하고 파라미터를 뺀다. D 보완(같은 날 「너도 수정 작업 들어가라」): 하위 메뉴가 하나뿐인 메뉴(바이크 등)는 칩 줄과 흰 띠를 그리지 않고 헤더 아래 1px 선을 되살린다(`:has()` 조건).

- 상세 차량 정보 아이콘 시안 간격 정리(2026-10-14 「간격 맞춰봐, 옵션 미포함 제거」): 라벨 `출시가격(옵션미포함)` → `출시가격`(두 줄로 내려가 줄 간격이 어긋났음). 오토트레이더 Overview 캡처(칸 세로 피치 61.6 · 라벨→값 22)에 맞춰 라벨·값 줄 높이 22 · 사이 0 · 칸 사이 18 · 아이콘 위 −1로 정리해 384에서 모든 줄 피치 62(칸 높이 44)다. `압류/저당` 값은 `정보 없음 / 정보 없음`이 두 줄로 꺾여 한 칸만 66이 되어 `정보 없음` 한 번으로 줄였다(라벨이 둘을 이미 말함). 앞의 `출시가격(옵션미포함)` · `정보 없음 / 정보 없음` 표기는 대체.

- 상세 차량 정보 항목 확장(2026-10-14 「차량번호 비노출, 오토트레이더 노출되는 거 모두 노출」): `차량번호` 줄을 뺐다(노출 안 함). 오토트레이더 상세 기본정보(Overview)의 노출 항목 중 빠져 있던 `도어 수` · `배출가스 등급` · `이전 소유자` · `키 수`를 더했다. 순서: 제조사 · 모델 · 연식 · 주행거리 · 출시가격 · 연료 · 배기량 · 변속기 · 차종 · 도어 수 · 인승 · 바디타입 · 외관 색상 · 시트 색상 · 배출가스 등급 · 이전 소유자 · 키 수 · 판매방식 · 압류/저당 · 제시번호 · 지역 · 판매자 유형(+ 성능점검 · 보험이력 조회는 값 있을 때). 값: 도어 수 = 바디타입 규칙(세단 4 · 쿠페·컨버터블 2 · 밴 3 · 그 밖 5, 추정), 이전 소유자 = 페라리 보험이력의 소유자 수(`2명`, 그 밖은 `정보 없음`), 배출가스 등급 · 키 수 = 근거 데이터가 없어 `정보 없음`. 아이콘은 노션 DB 원본 `도어 수`(doors) · `이전 소유자`(owners) · `키 수`(keys) · `20. CO2 배출`(emission)을 `public/assets/bbm/detail-icons/`에 추가했다. 오토트레이더의 `서류` · `부가세`는 한국 중고차 상세 기본정보에 맞지 않아 넣지 않았다.

- 상세 모델 아이콘 교체(2026-10-14 「모델 아이콘 교체」, 노션 「트림 (모델 등급)_독일 헤이카_16/16」 원본): `모델` 줄 아이콘을 기존 「3. 제조사 및 모델」 대신 이 원본(`public/assets/bbm/detail-icons/model-trim.svg`, 16×16 viewBox, 위 1개 · 아래 2개 상자가 이어진 계층형)으로 바꿨다. 한 글자도 고치지 않았고 24 상자 안에 contain으로 그린다. 앞의 `model.svg`는 삭제했다. 아이콘 시안(`&facts=icons`)에만 쓰인다.

- 아이콘 시안 차란차 그대로(2026-10-14 「아이콘 시안 차란차 그대로 적용해봐」, 차란차 매물 상세 「기본 정보」의 실제 스타일을 읽은 값): 주소 끝 `&facts=icons-charancha`로만 본다(기존 `&facts=icons` 오토스카우트식 격자는 그대로). 1열 줄 목록, 줄 24 + 간격 14(피치 38), 구분선 없음, 라벨 16/24 400 `#707B89` 왼쪽 · 값 16/24 500 `#191F28` 오른쪽 끝 정렬(값 최대 폭 60%). 차란차 원본에는 줄 앞 아이콘이 없어 노션 아이콘(24, 라벨 앞 8)을 맨 앞에 더한 것이 유일한 차이다. 처음 8줄 + `정보 더보기`는 같다. 384에서 모든 줄 높이 24 · 피치 38 확인.

- 상세 차량 정보 아이콘 헤이카 세트로 교체(2026-10-14 「아이콘 모두교체」, 노션 「영국_헤이카 (1) › 차량 아이콘 › 중고차 기본정보」 원본 SVG를 한 글자도 고치지 않음): `public/assets/bbm/detail-icons/`의 연식 `year` · 주행거리 `mileage` · 배기량 `engine` · 변속기 `gearbox` · 연료 `fuel` · 좌석(인승) `seats` · 도어 `doors` · 소유자 수 `owners` · 바디타입/차종 `body`를 헤이카 원본으로 바꾸고, `마력`(`power`)을 더했다. 사용자가 준 `제조사` 링크가 `바디타입` 페이지와 같은 주소여서 제조사 아이콘은 기존 `maker.svg`를 유지한다(확인 필요). `마력` 줄은 배기량 다음에 넣었고 값은 카드 피드와 같은 매물 번호 기준 샘플 값(`bbmSampleHorsepower`, 실제 제원 아님)이다. 아이콘 시안(`&facts=icons` · `&facts=icons-charancha`)에서만 보인다.

- 상세 아이콘 시안 밸런스(2026-10-14 「아이콘과 텍스트 밸런스 맞춰봐」, mobile.de · FINN 상세 기본정보 캡처 참고: FINN은 아이콘 세로 중심이 라벨+값 두 줄 묶음의 가운데와 같고, mobile.de는 아이콘 22 · 줄 피치 22): `&facts=icons` 격자는 아이콘을 두 줄 글자 묶음의 세로 가운데에 맞추고(이전엔 맨 위 정렬이라 아이콘이 라벨 쪽으로 쏠렸다) 글자와 간격 12, 라벨 14/20 · 값 16/22 600(이전 17/24)으로 줄여 묶음 높이 42, 칸 사이 20(피치 62 유지)으로 했다. 384에서 모든 칸 아이콘 중심 = 글자 묶음 중심. `&facts=icons-charancha`는 이미 아이콘·글자 한 줄 가운데 정렬이라 그대로다.

- 상세 아이콘 제조사 교체 + 슬롯 규칙(2026-10-14 「제조사 교체 아이콘들 슬롯 규칙 잡고 밸런스 맞춰라」, 노션 「에어비앤비 렌터카 › 자동차」 `ctds_car-outline` 원본): `제조사` 줄 아이콘을 이 자동차 외곽선 원본(`public/assets/bbm/detail-icons/maker.svg`, 한 글자도 고치지 않음, 24×24)으로 바꿨다. 아이콘 시안(`&facts=icons` · `icons-charancha`)의 모든 아이콘은 24×24 슬롯 안에서 보이는 면적 `√(폭×높이)=18px`, 보이는 부분의 중심이 슬롯 정중앙(12,12)이 되도록 아이콘별로 크기(최대 1.15배)·위치만 CSS로 보정한다(`img[data-icon]`, 24px 기준 렌더 잉크 측정값, 원본 SVG는 그대로). 보정 전 면적은 16.0(판매자) ~ 24.0(모델 계층 아이콘)으로 크기가 제각각이었고 일부(제조사 · 좌석 · 연료 등)는 중심이 0.5~0.6 어긋나 있었다. 색은 원본 그대로여서 서류 · 지역 아이콘은 남색, 색상 · 배출가스는 옅은 회색, 나머지는 거의 검정이다(통일 여부는 확인 필요).

- 상세 아이콘 연료·연식·가격 교체(2026-10-14, 노션 「에어비앤비 렌터카 › 연료」 `ctds_fuel-outline` · 「› 달력」 `ctds_calendar-outline` · 「N_독일_오토스카우트 24 › 90_가격 평가」 `TagPrice`): `fuel.svg` · `year.svg` · `price.svg`를 이 원본으로 바꿨다(한 글자도 고치지 않음, 24×24). 슬롯 규칙(보이는 면적 `√(폭×높이)=18`, 중심 정중앙)에 따라 세 아이콘의 크기·위치 보정값을 다시 쟀다(연료 0.857배 · 연식 0.828배 · 가격 0.947배). 사용자 메시지의 라벨은 링크 뒤에 붙은 것으로 읽었다(첫 링크 = 연료, 둘째 = 연식, 셋째 = 가격).

- 아이콘 시안 차란차식 1열 좌측 정렬(2026-10-14 「차란차식 1열도 우측 말고 기존 좌측 정렬」): `&facts=icons-charancha`의 값은 오른쪽 끝 정렬을 버리고 기본 사실표처럼 안쪽 폭 50% 지점에서 시작하는 왼쪽 정렬로 바꿨다(라벨 칸 = 50% − 32px, 값 `margin 0` · 왼쪽 정렬). 글자 크기·색(라벨 16/24 `#707B89` · 값 16/24 500 `#191F28`), 줄 높이 24, 피치 38, 아이콘 24은 그대로. 384에서 라벨 x 56 · 값 x 200 · 모든 줄 높이 24. 앞의 「값 오른쪽 끝 정렬(최대 폭 60%)」은 대체.

- 상세 아이콘 오토스카우트 세트 교체(2026-10-14 「아이콘 모두 교체」, 구글 시트 「국내 중고차사이트 링크 › 시트2」의 노션 링크 11개, 원본 SVG 한 글자도 고치지 않음): 제조사 `CarSearch`(자동차+돋보기) · 모델 `CarCheck`(자동차+체크) · 연식 `CarCalendar`(달력+자동차) · 주행거리 `1.주행거리_18_18`(도로 중앙선) · 연료 `GasPump` · 배기량 `엔진`(symbol-81) · 변속기 `Transmission` · 인승 `Seat` · 외관 색상 `ColourPalette` · 시트 색상 `CarViewInteriorView360`(새 파일 `interior.svg`) · 마력 `Speedometer`를 `public/assets/bbm/detail-icons/`에 두었다(가격 `TagPrice`는 이미 적용). 시트의 라벨과 링크 제목이 어긋난 곳(연식 ↔ `04 Body type`, 모델 ↔ `05 Vehicle condition`)은 라벨이 아니라 실제 아이콘 모양(달력 · 자동차 검사)을 기준으로 연식 · 모델에 넣었다. 시트에 링크가 없는 도어 수 · 소유자 · 바디타입/차종 · 키 수 · 배출가스 · 서류 · 지역 · 판매방식은 앞의 세트 아이콘을 그대로 둔다(스타일이 섞임). 슬롯 규칙(24×24, 보이는 면적 18, 중심 정중앙)을 새 아이콘으로 다시 쟀고(`<img>` contain과 같은 비율 유지로 측정, 25×24 viewBox 아이콘 포함) 모든 아이콘의 보정값을 갱신했다.

- 상세 아이콘 연식 교체(2026-10-14, 노션 「독일_오토24 › UI 아이콘 › 캘린더_24/24」 `3. 연식_24_24` 원본, 한 글자도 고치지 않음): `year.svg`를 앞의 `CarCalendar` 대신 이 24×24 달력 원본으로 바꿨다. 링크에 라벨이 없었으나 파일명이 `3. 연식`이라 연식 줄로 읽었다. 슬롯 보정값(면적 18 · 정중앙)은 다시 쟀다.

- 연식 아이콘 통일(2026-10-14 「통일해」): 피드 카드 사양 줄의 연식 아이콘(`public/assets/bbm/meta-icons/year-calendar.svg`, `&specicon=on`)을 상세와 같은 노션 「캘린더_24/24」 원본(`3. 연식_24_24`)으로 바꿨다. 연식 아이콘은 이제 상세(`detail-icons/year.svg`)와 피드(`meta-icons/year-calendar.svg`)가 같은 파일이다. 피드 아이콘은 글자색을 따르는 16×16 마스크 그대로이고 색·크기 규칙은 바꾸지 않았다. 옛 벤틀리 시안 폴백 카드(`imgPropertyStatus1`)는 매물 상세가 아니라 디자인 시안 이미지라 두었다.

- 상세 썸네일 카이디 크기(2026-10-14 「태국 카이디 사이즈로 변경」, 카이디 매물 상세 모바일 캡처 923px ÷2.4036 → 384 실측): 칸 52×52(캡처 125px), 칸 사이 12(피치 64), 줄 좌우 18(선택 테두리 2 포함 화면 가장자리에서 16), 모서리 6. 선택 칸은 칸 바깥에 2px 테두리(바깥 56×56, 모서리 8, 흰 틈 없음)이고 비선택 칸은 흐리게 하지 않는다. 카이디는 파랑 테두리이나 우리는 에어비앤비 검정 `#222`를 쓴다. 줄은 선택 칸이 이미 보이면 움직이지 않고, 가려질 때만 가장자리 18 여백까지 옮긴다(이전 가운데 맞춤 대체). 앞의 80×60 · 간격 6 · 비선택 .7은 대체.

- 상세 썸네일 줄 이동 보정(2026-10-14 「수정해」, 카이디 동영상 `카이디 동영상.mp4` 1초 간격 프레임 확인): 사진을 넘길 때 선택 칸의 앞뒤 이웃 칸이 항상 줄 안(가장자리 18 안쪽)에 보이도록 줄을 옮긴다. 앞으로 넘길 때 다음 썸네일이 1칸 이상 보이고, 처음·끝 사진은 끝 여백에서 멈춘다. 앞의 「가려질 때만 옮김」 규칙을 대체한다. 이동 속도·곡선은 프레임 간격이 1초라 재지 못해 기존 `smooth` 스크롤을 그대로 쓴다. 폭 260에서 선택 칸 1→4번째 이동 시 다음 칸 오른쪽 끝이 항상 242 이하임을 확인.

- 상세 썸네일 선택 테두리 파랑(2026-10-14 「선택 썸네일 테두리를 파랑으로」, 카이디 캡처 1080×2340 픽셀 실측): 선택 칸 외곽 2px(캡처 5px ÷2.8125 ≈ 1.8)를 카이디 파랑 `#4F68E8`(캡처 테두리 픽셀 RGB 79·104·232)로 바꿨다. 흰 틈은 없다. 앞의 에어비앤비 검정 `#222`는 대체. 보배드림 파랑 토큰(`--blue` `#1b4c8c`)은 쓰지 않았다(카이디 값 그대로, 보배드림 토큰으로 바꾸려면 요청 필요).

- 상세 썸네일 선택 칸 위치 크로스체크(2026-10-14 「선택 칸 위치 크로스체크해」, 카이디 동영상 4fps 프레임에서 선택 파랑 테두리 `#4F68E8` 위치를 픽셀로 측정, 384 환산): 처음 칸 테두리 왼쪽 16.4 · 다음 칸마다 +64(80.4 · 144.4 · 209.1). 앞으로 넘겨 줄이 멈춘 자리는 선택 테두리 왼쪽 248.2(다음 칸 오른쪽 끝 368 = 화면 끝에서 16)로, 우리 값(다음 칸 오른쪽 끝 화면 끝에서 18)과 같다. 뒤로 넘겨 멈춘 자리는 66.8(앞 칸이 화면 왼쪽 끝에서 약 5 안쪽, 우리는 이전에 18이라 선택 칸이 13 더 오른쪽이었다)로 측정되어 왼쪽 여백만 5로 줄였다(`edgeLeft` 5 · `edgeRight` 18). 첫 사진 선택 시 줄은 맨 앞(0)으로 돌아간다. 폭 260 측정: 뒤로 넘길 때 선택 테두리 왼쪽 67, 처음은 16. 이동 곡선은 4fps라 미측정.

- 상세 썸네일 뒤로 넘길 때 왼쪽 여백 재보정(2026-10-14 「수정해」, 카이디 화면 녹화 `Screen_Recording_20261013_194007.mp4` 61초·사진 수십 장, 4fps로 선택 테두리 왼쪽 측정): 앞으로 넘겨 멈춘 자리 248.2(우리 248과 같음), 뒤로 넘겨 멈춘 자리 61.2(약 2.5초 유지)로, 먼저 쟀던 66.8(짧은 영상)과 6px 차이가 난다. 두 값의 가운데에 맞춰 뒤로 넘길 때 앞 칸 왼쪽 여백을 5 → 3으로 줄였다(`edgeLeft` 3 · `edgeRight` 18). 폭 260 측정: 뒤로 넘길 때 선택 테두리 왼쪽 65, 처음 16. 카이디가 선택 칸이 화면 오른쪽 끝에 걸린 채 1초 남짓 머문 뒤 줄이 따라가는 지연은 따라 하지 않았다.

- 상세 썸네일 선택 테두리 탭 버그·전 매물 썸네일(2026-10-14 「배포 링크 확인했어, 왜 지정된 값 썸네일 표시를 안 하냐」): ① 원인 1 — 선택 테두리를 `box-shadow`로 그렸는데 공통 규칙 `.device-screen :focus { box-shadow: none !important }`가 손가락으로 누른 버튼(포커스를 받음)의 그림자를 지워, 실제로 누른 썸네일에는 파랑 테두리가 안 보였다(자동 테스트의 `dispatchEvent`는 포커스가 없어 놓쳤고, 실제 탭으로 확인). 테두리를 `::after` 2px 파랑 `#4F68E8`(칸 바깥 −2px, 반경 8, 바깥 56×56)로 바꿔 포커스 규칙에 영향받지 않는다. ② 원인 2 — 사진이 1장뿐인 매물은 썸네일 줄이 없었다. 목록에서 상세를 열 때 피드와 같은 임시 슬라이드(`feedPhotosFor`, 3~6장, 같은 제조사 매물 사진 → 같은 목록 다른 매물 순)를 `photoList`로 붙여 승용·트럭·건설기계·캠핑카 상세에도 썸네일 줄이 나온다(실제 다중 사진이 있는 서울오토갤러리 등은 그 사진 그대로, `&feedphotos=single`이면 붙이지 않음). ③ 바이크 상세(`BikeVehicleDetail`, 별도 간단 화면)에도 같은 썸네일 줄을 넣어 누르면 큰 사진이 바뀐다(큰 사진은 스와이프 없이 한 장 교체). 실제 탭으로 측정: 서울오토갤러리·바이크 모두 선택 칸 `::after` 파랑 2px 표시.

- 상세 사진·썸네일 동기화 정석화(2026-10-14 「깃허브·UX 가이드 보고 정석대로, 이동시 부자연스럽다」; 참고: Swiper·Embla 썸네일 동기화 방식, WAI-ARIA 캐러셀 키보드 관례): ① 문제 — 썸네일을 눌러 먼 사진(1→5)으로 가면 큰 사진이 지나가는 사진 번호마다 선택·썸네일 줄이 따라가며 줄이 84→15→84로 왔다 갔다 했고(폭 260 측정), 매번 브라우저 smooth를 새로 불러 덜컹거렸다. ② 눌린 칸을 즉시 선택하고 큰 사진이 도착할 때까지(최대 1.2초) 지나가는 번호는 무시한다(`jumpLockRef`). ③ 썸네일 줄은 `requestAnimationFrame` 하나가 목표를 계속 바꿔 가며 남은 거리의 22%씩 따라가는 감속 이동으로 옮긴다(방향 전환 0회, 목표 위치 규칙은 카이디 실측 `edgeLeft` 3 · `edgeRight` 18 그대로). ④ `prefers-reduced-motion`이면 애니메이션 없이 바로 이동. ⑤ 썸네일 줄에서 ← → Home End 키로 선택을 옮기고 포커스를 따라 보낸다. 폭 260 측정: 0→4 선택 0→4 한 번에 · 줄 방향 전환 0, 4→0 · 0→2 같음, 큰 사진을 직접 넘긴 6회 모두 선택 일치, 키보드 5회 일치. 카이디 사이트는 이 작업 환경에서 열 수 없어(봇 검증 화면, Chrome 확장 연결 없음) 앞서 받은 녹화·캡처 실측을 그대로 썼다.

- 상세 썸네일 크기 세 시안 비교(2026-10-14 「카이디 · 이베이 · 동처띠 썸네일 크기 세 시안 비교하게 각각 링크」, 이베이 모터스 캡처 1080×2340 ÷2.8125 실측): 주소 끝 `&thumbs=kaidee`(기본, 칸 52×52 · 간격 12 · 좌우 18 · 선택 파랑 2px 바깥 · 줄 높이 72) · `&thumbs=ebay`(칸 64×64 정사각 · 간격 8 · 첫 칸 왼쪽 8 · 선택은 칸 안쪽 어두운 2px `#222` · 비선택은 그대로 · 줄 높이 84 · 앞 여백 4 · 뒤 여백 8로 줄이 멈춤 · 큰 사진 → 썸네일 줄 윗선 약 8.5) · `&thumbs=dongchedi`(칸 92×62 · 간격 8 · 좌우 12 · 선택 `#222` 2px + 안쪽 흰 틈 2px · 비선택 70% · 선택 칸이 줄 가운데 · 줄 높이 82). 이베이 값은 캡처에서 쟀고(칸 180px = 64, 피치 203px = 72.2, 칸 높이 180px = 64), 동처띠 값은 실측 캡처가 없어 앞서 구현했던 값(위 「상세 썸네일 선택 표시」·「크기 조정」)을 그대로 쓴 것이라 실측이 아니다. 기본(`kaidee`)은 그대로이며 하나를 고르면 기본으로 승격하고 파라미터를 뺀다. 이동 방식(눌린 칸 즉시 선택 · 감속 이동 · 키보드)은 세 시안이 같다.

- 상세 썸네일 이베이 방식 확정(2026-10-14 「이베이 가자, 다시 실측해라」, 이베이 모터스 캡처 1080×2340 ÷2.8125 픽셀 재실측): 칸 64×64(180px), 간격 8(피치 72 = 202.5px), 첫 칸 왼쪽 8(23px), 큰 사진 아래 → 썸네일 줄 윗선 8.18, 비선택 칸 모서리 약 2(4px 반경 곡선), 선택은 칸과 같은 크기(180px) 안쪽에 어두운 2px 테두리(`#232529`, 5px ÷2.8125 ≈ 1.8, 안쪽 흰 틈 없음)이고 바깥 모서리 반경 약 4(곡선 7·5·3·2px), 비선택 흐림 없음, 오른쪽 끝 다음 칸이 16만큼 잘려 보인다. 큰 사진은 좌우 8 여백 + 둥근 모서리(우리 상세 사진은 전폭이라 이번에 바꾸지 않음). 이 값을 기본으로 하고 `&thumbs=` 비교 파라미터와 카이디·동처띠 시안 CSS는 뺐다. 줄 이동 규칙은 그대로이고 멈추는 여백만 앞 8 · 뒤 8(이베이 첫 칸 왼쪽 8)로 바꿨다. 폭 384 측정: 칸 64×64 · 첫 칸 8 · 간격 8 · 사진 아래 8 · 줄 높이 84 · 선택 링 2px `#232529` 반경 4. 폭 260 이동: 선택 칸 앞 칸 왼쪽 8, 다음 칸 오른쪽 8에서 멈춤. 앞의 카이디 52×52 · 파랑, 세 시안 비교 규칙은 대체.

- 상세 썸네일 뺀 시안(2026-10-14 「썸네일 뺀 시안도 줘라」, 미리보기 전용): 주소 끝 `&thumbs=off`이면 상세 큰 사진 아래 썸네일 줄(승용·바이크 상세)을 그리지 않는다. 사진 넘기기(스와이프)와 `1 / 5` 개수 알약은 그대로. 기본(이베이 방식 썸네일 있음)은 바뀌지 않으며 결정되면 하나를 기본으로 하고 파라미터를 뺀다. D 보완(같은 날 「너도 수정 작업 들어가라」): 하위 메뉴가 하나뿐인 메뉴(바이크 등)는 칩 줄과 흰 띠를 그리지 않고 헤더 아래 1px 선을 되살린다(`:has()` 조건).

- 상세 썸네일 줄 기본 제외(2026-10-14 「일단 빠진 안으로」): 상세 큰 사진 아래 썸네일 줄(승용·바이크)을 기본에서 뺀다. 사진 넘기기(스와이프)와 `1 / 5` 개수 알약은 그대로. 이베이 방식 썸네일 줄은 주소 끝 `&thumbs=on`으로만 비교용으로 본다(코드·CSS는 남김). 앞의 `&thumbs=off` 시안 규칙은 이 규칙이 대체한다.

- 상세 차량 정보 값 우측 정렬(2026-10-14 「차량정보 우측 정렬해봐」): 기본 사실표의 값(2열)을 오른쪽 끝에 맞추고 라벨은 왼쪽에 둔다(라벨 칸 자동 폭 · 값 칸 나머지 · 사이 최소 16). 글자 크기·색(16/22, 라벨 `#595959` · 값 `#222`)과 줄 높이 38, 구분선 `#E8E8E8`은 그대로. 값이 길면 오른쪽 정렬로 줄바꿈. 아이콘 시안(`&facts=icons` · `icons-charancha`)은 바꾸지 않았다. 앞의 「값 열 50% 왼쪽 정렬」은 이 규칙이 대체한다.

- 상세 차량 정보 정렬 두 시안(2026-10-14 「2개 시안 주소 줘봐」, 미리보기 전용): 기본은 값 우측 정렬(라벨 왼쪽 · 값 오른쪽 끝), 주소 끝 `&facts=left`이면 이전 좌측 정렬(값 열이 안쪽 폭 50% 지점에서 시작). 글자·줄 높이는 같다. 결정되면 하나를 기본으로 하고 파라미터를 뺀다. D 보완(같은 날 「너도 수정 작업 들어가라」): 하위 메뉴가 하나뿐인 메뉴(바이크 등)는 칩 줄과 흰 띠를 그리지 않고 헤더 아래 1px 선을 되살린다(`:has()` 조건).

- 상세 차량 정보 좌측 정렬 시안 수정(2026-10-14 「이전방식도 우측정렬이야 · 시안 다시줘봐」): 앞의 `&facts=left`는 값이 안쪽 폭 50% 지점(x=192)에서 시작해 오른쪽 절반에 모여 우측 정렬처럼 보였다. 라벨 칸을 112px 고정으로 바꿔 값이 라벨 바로 옆(x=136)에서 시작하는 진짜 좌측 정렬로 고쳤다. 기본(우측 정렬)은 그대로.

- 서울오토갤러리 1번 BMW M3 사진 교체(2026-10-14 「m3 사진 교체, 배경 지운 사진에 사진마저 잘려서 판단을 못하겠다」 → 「3장이 아닌 전체 사진, 그래야 사진 제스처도 테스트」): 이 매물만 차란차 매물 페이지의 갤러리 원본 전체 20장(900×506 WebP, 갤러리 순서, 배경 제거 · 자르기 · 번호판 흐림 없음)으로 바꿨다(`public/assets/cars/seoul-autogallery-v01/m3-original/m3-1~20.webp`, 사진 수 5 → 20). 목록 썸네일 사본(`thumb/sag-01.webp`)은 쓰지 않고 원본 전체를 정사각 칸 가운데에 비율대로(위아래 빈 칸) 보인다(`listCrop` 100%·56.25%). 피드·상세 사진도 같은 원본이라 스와이프·점·개수 알약을 20장으로 시험할 수 있다. 나머지 22대는 그대로. 사진 속 상사 로고(DEUTSCH AUTOWORLD · 차란차)는 원본 그대로 남아 있다.

- M3 사진 붙음·잘림 수정(2026-10-14 「사진이 하나로 붙었쟎아, 그리고 위아래 짤리고, 수정해」): ① 같은 흰 벽 배경 사진 20장을 이어 넘기면 한 장처럼 붙어 보여 피드는 흰 3px, 상세는 검은 3px 구분선을 사진 사이에 둔다(사진 한 장 폭은 그대로 border-box). ② 목록 썸네일은 원본 전체를 비율대로 두되(`listCrop` 100%) 남는 위·아래 칸을 빈 회색 대신 같은 사진을 흐리게 키워 채워 사진이 위아래로 잘린 듯 보이지 않게 한다(`.bbm-card-photo-fill`, 트럭 v09와 같은 방식, 원본 사진은 그대로).

- 상세 사진 칸 높이를 사진 비율에 맞춤(2026-10-14 「짤리잖아」, 폰 캡처): 상세 큰 사진 칸이 305px 고정이라 16:9 원본(M3)은 위아래에 검은 띠가 생겨 사진이 잘린 것처럼 보였다. 칸 높이를 고정하지 않고 사진 폭(최대 430)에 맞춘 원본 비율 높이로 한다(16:9는 약 216px, 4:3은 288px). 사진은 자르거나 늘리지 않는다(`object-fit: contain`). 사진마다 비율이 다르면 가장 큰 높이에 맞고 남는 곳만 검은 띠가 된다.

- 상세 영상 버튼·PC 상세 사진 오류 수정(2026-10-14 「영상도 없는데 영상 버튼 나온다, 전반적으로 오류 수정」): ① 모바일 상세 사진 가운데 재생 버튼(▶)은 그 매물에 영상이 있을 때만(`filter.video`) 보인다(이전에는 항상 첫 사진에 나왔다). ② PC 상세 사진 영역(`DesktopGallery`)은 항상 벤틀리 시안 24장 · `벤틀리 차량 사진` · `/24`와 재생 표시를 보였다. 실매물 상세는 그 매물의 사진 · 사진 수(`1/20`) · 영상이 있을 때만 재생 표시를 쓰고, 목록에서 연 매물이 없을 때의 시안 폴백만 기존 벤틀리 시안을 쓴다. 로컬 확인: 모바일·PC 모두 재생 표시 0개, 콘솔 오류는 파비콘 404뿐.

- 상세 사진 칸 크기·넘기기 속도를 초톳 원본에 맞춤(2026-10-14 「초톳 사진 크기 원본 확인해라 · 직접 초톳 가서 사진 제스처 속도 확인」, `xe.chotot.com/135102923.htm` 폰 에뮬레이션 폭 360 · 384 · 412에서 직접 측정): ① 초톳 사진 칸은 폭과 상관없이 **높이 250px 고정**, 사진은 `object-fit: contain`(자르지 않음), 바탕 `#222`, 화면 맨 위(y=0)에서 시작하며 위·옆에 남는 칸은 바탕색으로 보인다(react-slick 슬라이더, 칸 안쪽 높이 256). 우리 상세 사진 칸도 250 · `contain` · `#222`로 바꿨다(앞의 「높이를 사진 비율에 맞춤」 규칙 대체, 16:9 사진은 폭 384에서 위아래 약 17px · 412에서 약 9px 바탕색 띠). ② 초톳 넘기기: 손가락을 따라 사진 줄이 움직이고, 놓으면 폭의 1/5(77px at 384)을 넘게 끌었을 때만 다음 장으로 넘어가며(270px 끌기 → 넘어감) 넘어가는 시간은 **약 500ms · CSS `ease`**(−656 → −768을 약 480ms), 관성 굴림 없이 한 번에 한 장. 우리 상세 사진도 같은 방식으로 바꿨다(`src/prototype/detail/paged-carousel.tsx`: 폭 1/5 · 500ms · `ease` · 끝에서는 0.35배 저항 · 세로로 더 움직이면 세로 스크롤 우선). 로컬 측정: 270px 끌기 → 약 500ms에 2/20으로 넘어감, 40px 끌기 → 제자리로 돌아와 1/… 그대로. 이전에는 공용 `Carousel`(관성 굴림 + 나중에 다시 맞춤)을 썼다. 피드 사진(목록)은 아직 브라우저 기본 넘기기를 쓰며 이번에 바꾸지 않았다. 초톳의 양쪽 끝 이어 돌기(복제 슬라이드)·좌우 화살표는 넣지 않았다.

- 상세 사진 넘기기 오류 수정(2026-10-14 「넘겨지지도 않아」): 앞의 초톳식 넘기기가 천천히 · 비스듬히 · 중간에 멈추며 끌 때 넘어가지 않았다. 원인 ① 끌던 도중 포인터 캡처가 풀리면(로컬 재현: 첫 움직임 직후와 244px 근처에서 `lostpointercapture`) 이후 움직임이 사진 칸으로 오지 않아 끌기가 멈추고 손을 뗄 때도 처리되지 않았다 → 캡처를 쓰지 않고 누른 순간부터 window에서 움직임 · 손 뗌 · 취소를 직접 받는다. ② 스크롤이 90ms 멈추면 가까운 사진으로 되돌리던 예전 맞춤 타이머가 끌던 위치를 되돌렸다 → 타이머를 없앴다(넘기기는 놓는 순간 직접 맞춘다). ③ 세로 우선 판정을 세로 12px 이상이고 가로의 1.5배를 넘을 때로 느슨하게 했다. 로컬 터치 재현(412px): 중간 250ms 멈춤 · 비스듬히 · 느리게 끌기 모두 `2 / 20`으로 넘어감(수정 전은 비스듬히 · 느리게가 `1 / 20`).

- 피드 사진 넘기기를 상세와 같은 초톳 방식으로(2026-10-14 「피드도 같은 속도로 맞춰」): 모바일 피드(목록) 카드의 사진 넘기기도 브라우저 기본 스냅 대신 상세와 같은 방식(`usePagedDrag`, `src/prototype/detail/paged-carousel.tsx`)을 쓴다 — 손가락(터치 · 펜 · 마우스)을 따라 움직이고, 폭의 1/5 넘게 끌면 한 장 넘어가며(약 500ms · `ease`, 관성 없음), 덜 끌면 제자리로 돌아온다. 세로로 더 움직이면 페이지 스크롤이 우선이다. 이전 마우스 전용 끌기(4px · 15%)는 이 방식으로 대체했다. 점 · 개수 알약 · 사진 사이 구분선 · 탭하면 상세 열기는 그대로. 로컬 터치 재현(412px): 빠르게 · 중간에 멈추며 · 비스듬히 · 천천히 끌기 모두 `2/20`으로 넘어가고, 짧게 끌기는 `1/20`으로 제자리, 세로 끌기는 페이지만 스크롤(scrollTop 432), 사진 탭은 상세가 열린다.

- 사진 넘기기를 업계 표준 갤러리 규칙으로 다시 만듦(2026-10-14 「UX 가이드 맞춰서 사진 이동 만들어, 가이드 찾아서 구현, 깃허브나 구글 검색」): 앞의 초톳 실측 규칙(폭 1/5 · 500ms)은 폰에서 어색해 아래 표준으로 대체한다. 상세와 피드가 같은 훅(`usePagedDrag`)을 쓴다. 근거는 Swiper 소스(`src/core/events/onTouchEnd.mjs` v11)와 API 기본값(github.com/nolimits4web/swiper, API 문서: speed 300 · shortSwipes true · longSwipesMs 300 · longSwipesRatio 0.5 · touchAngle 45 · threshold 0), Material 3 모션(구글 검색, medium2 300ms · standard 곡선 `cubic-bezier(0.2, 0, 0, 1)`), WAI-ARIA 캐러셀 관례(`role=region` · `aria-roledescription=carousel` · 키보드 ← →). 구현값: ① 손가락을 따라 사진 줄이 움직인다. ② 놓을 때 누른 지 **300ms 이하면 짧게 휙 밀어도(10px 이상)** 끌던 방향의 다음·이전 장으로 넘어가고, **300ms보다 오래 끌었으면 폭의 절반(50%) 이상** 끌어야 넘어가며 아니면 제자리로 돌아온다. ③ 넘어가는 시간 **300ms**, 곡선 `cubic-bezier(.2, 0, 0, 1)`, 한 번에 한 장(관성 굴림 없음). ④ 가로 45° 안쪽(|dx| ≥ |dy|)이면 사진 끌기, 세로가 더 크면 페이지 스크롤에 양보. ⑤ 처음·끝 사진에서는 끌어도 0.35배로 저항. ⑥ 사진 칸에 포커스를 두고 ← →로 넘길 수 있다. 로컬 터치 재현(412px, 상세 · 피드 모두): 60px/90ms 휙 → 다음 장 · 100px/700ms → 제자리 · 230px(56%)/900ms → 다음 장 · 비스듬히 빠르게 → 다음 장 · 세로 우세 → 제자리 · 첫 사진에서 오른쪽으로 → 제자리 · 키보드 → ← 동작. Embla 문서 사이트와 Swiper 공식 문서 사이트는 이 환경에서 열 수 없어 Swiper는 GitHub 소스로, Embla는 확인하지 못했다.

- 사진 넘기기 튕김 수정(2026-10-14 「사진 넘기면 퉁퉁 튕긴다」 → 「너 직접 써봐」): 원인 두 가지를 직접 재서 찾았다. ① 놓는 순간 손가락 속도(약 0.3px/ms)에서 한 프레임(17ms) 만에 50~70px로 튀어 나가는 곡선이었다(로그 `79 → 127 → 200 → 252`, 이전 `ease`/표준 곡선과 스프링 모두 첫 프레임 가속이 컸다). 놓는 순간의 위치 · 손가락 속도에서 시작해 목표 사진에 속도 0으로 도착하는 3차 에르미트 곡선(320ms)으로 바꿨다 — 로그 `75 → 85 → 99 → 116 → 136 → 158 → 182 …` 처럼 천천히 가속해 부드럽게 멈춘다(되돌아감 0). ② 이동 중에 다시 휙 밀면 넘기기가 씹혔다(앞으로 6번 연속 → 3장째에 그침). 이동 중 다시 누르면 가던 목표 사진을 기준으로 한 장 더 가도록 했다(Swiper와 같음) → 앞 6 · 뒤 2번 연속이 정확히 5장째. 이동 중 가볍게 눌렀다 떼면 가던 곳으로 마저 간다. 직접 사용 시험(412px, 상세 · 피드 모두): 연속 휙 6번 + 되돌리기 2번 → `5/20`, 최종 위치는 칸에 정확히 맞음(오차 0), 기존 시험(짧은 휙 · 느린 끌기 · 비스듬히 · 세로 · 끝 저항 · 키보드) 모두 통과.

- 사진 넘기기 원복(2026-10-14 「원래 안 그랬는데 사진 이동하면 튕긴다」): #589~#593에서 내가 만든 직접 구현(`usePagedDrag`, 에르미트 곡선·폭 1/5·Swiper식 규칙)이 튕김의 원인이어서 모두 걷어냈다. 상세는 공용 `Carousel`(관성 굴림) + 스크롤이 90ms 멈추면 가까운 사진으로 맞추는 원래 방식, 피드는 브라우저 `scroll-snap` + 마우스 끌기 원래 방식으로 되돌렸다. 상세 사진 칸 250px·`contain`·`#222`와 M3 사진 구분선·썸네일 흐린 채움(#586)은 그대로 둔다. 초톳 넘기기 실측값(약 500ms·폭 1/5)은 참고 기록으로만 남기고 적용하지 않는다.

- 상세 탭(2026-10-14 「좐좐처럼 상세정보 메뉴를 탭으로 바로 이동 · 일단 해보고 아니면 원복」, 좐좐 스티치 이미지의 `商品 · 车况 · 分期方案 · 车辆PK · 购车流程 · 评价` 탭 구조 참고, 영상은 볼 수 없어 움직임은 미반영): 모바일 중고차 상세의 사진·요약 바로 아래에 탭 줄(`DetailTabs`, 높이 44, 15/20 500 `#8C8C8C`, 선택 700 `#222` + 아래 2px 밑줄, 아래 1px `#EBEBEB`, 가로 스크롤)을 둔다. 탭은 아래 카드 제목을 읽어 만든다(`소개 · 차량정보 · 옵션 · 이력 · 점검 · A/S · 판매정보 · 판매자 · 동급`, 있는 카드만, 2개 미만이면 줄을 숨김). 스크롤하면 화면 맨 위(`position: sticky; top: 0`)에 붙고, 탭을 누르면 해당 카드가 탭 줄 바로 아래에 오게 부드럽게 이동한다(움직임 줄이기 설정이면 바로 이동). 스크롤하면 지금 보는 카드의 탭이 강조되고 선택 탭이 줄 가운데로 따라온다(누른 뒤 0.9초는 강조 고정, 맨 아래 도달 시 마지막 탭). PC 상세·바이크 상세는 그대로. 맞지 않으면 `DetailTabs` 한 줄과 CSS 블록만 지우면 원복된다. 측정(412, 서울오토갤러리 · 페라리): 탭 누른 뒤 카드 윗선이 탭 줄 아래 0px, 손가락 스크롤에 강조 따라감.

- 상세 탭 위 구분선(2026-10-14 「위도 구분선 주는게 어떨까」): 탭 줄 위에도 아래와 같은 1px `#EBEBEB` 구분선을 둔다(`border-top`). 사진·요약(흰 바탕)과 탭 줄 사이를 나누며, 탭이 화면 맨 위에 붙어도 같은 선이 그대로 있다.

- 상세 탭 이름(2026-10-14 「소개를 설명으로」): 첫 탭 `소개`를 `설명`으로 바꿨다(카드 제목 `차량 설명`과 맞춤). 나머지 탭 이름은 그대로.

- 상세 탭 이름(2026-10-14 「차량정보는 기본 정보로」): 탭 `차량정보`를 `기본 정보`로 바꿨다(카드 제목은 `차량 정보` 그대로). 탭 이름은 `설명 · 기본 정보 · 옵션 · 이력 · 점검 · A/S · 판매정보 · 판매자 · 동급`.

- 상세 탭 이름 정리(2026-10-14 「A/S 판매정보 탭 이름도 정리해줘, 보증현황」 → 「보증정보로」): 탭 `A/S`를 `보증정보`로(처음 `보증현황`을 줬다가 바꿈), `판매정보`를 카드 제목과 같은 `판매 정보`(띄어쓰기, `기본 정보`와 맞춤)로 바꿨다. 탭 이름은 `설명 · 기본 정보 · 옵션 · 이력 · 점검 · 보증정보 · 판매 정보 · 판매자 · 동급`. `판매 정보`는 사용자가 이름을 주지 않아 띄어쓰기만 정리한 것이다(다른 이름을 원하면 알려 주면 바꾼다).

- 성능·상태점검 보증 위 구분선 제거(2026-10-14 「성능상태보증 위 구분선 없애라」): 보증정보 카드에서 `성능·상태점검 보증` 줄 위의 1px `#f0f1f2` 구분선(`.warranty-box .warranty-inspection` `border-top`)을 없앴다. 줄 위 여백 18은 그대로라 간격은 바뀌지 않는다.

- 상세 지역 줄 분리(2026-10-14 「지역도 서울 서초구 양재동 / 단지ㆍ상사명 이렇게 분리하자, 복잡한 거 줄이자」): 상세 상단 지역을 항상 두 줄로 나눈다. 1줄 = `시도 구군`(동이 확인된 단지만 동까지: 서울오토갤러리 = `서울 서초구 양재동`), 2줄 = `단지ㆍ상사명`(가운데점 `ㆍ`로 이음, 항목 단위 줄바꿈). 앞의 「한 줄에 들어가면 이어 쓰고 넘치면 상사명만 아랫줄」 자동 줄바꿈은 이 규칙이 대체한다(링크 밑줄은 그대로: 단지 → 카테고리, 상사명 → 딜러 페이지). 동 자료가 있는 단지는 서울오토갤러리뿐이라 도이치오토월드 등은 `경기 수원시`로 둔다(단지 동 자료를 주면 `detailLocationDong`에 추가). 목록 카드의 지역 줄은 그대로다(`BbmResultCard`의 선택 속성 `locationDong`은 상세 상단만 넘긴다). 측정(384, 서울오토갤러리): 1줄 `서울 서초구 양재동`, 2줄 `서울오토갤러리ㆍ디앤디플러스`, 줄 높이 각 20.

- 상세 등록시간 표기(2026-10-14 「10분 전, 등록자는 이제 안 쓴다」): 상세 상단 시계 줄에서 `등록` 글자를 뺐다. `등록 10분 전` → `10분 전`(시계 아이콘 + 시간만). 다른 화면의 문구는 바꾸지 않았다.

- 상세 지역은 구군까지(2026-10-14 「지역은 구군까지, 경기 수원시 권선구」): 앞의 「서울오토갤러리만 동(`양재동`)까지」를 취소한다. 상세 상단 지역 1줄은 시도 구군까지이고, 시 아래에 구가 있으면 구까지 쓴다(`경기 수원시 권선구`). 지역 자료에 구가 없는 도이치오토월드는 사용자가 알려 준 `권선구`를 붙이고(`detailLocationDong`), 서울오토갤러리는 `서울 서초구`다. 2줄은 `단지ㆍ상사명` 그대로. 목록 카드는 그대로다(`BbmResultCard` 속성 `locationDong`은 상세 상단만 넘긴다). 측정(384): 도이치오토월드 `경기 수원시 권선구` / `도이치오토월드ㆍ준모터스`, 서울오토갤러리 `서울 서초구` / `서울오토갤러리ㆍ디앤디플러스`.

- 보증정보 카드 정리(2026-10-14 「보증정보 타이틀 우측 꺾쇠 없애고 · 보증 막대 세로 간격 동일하게 · 보증 있는 막대 색상 초톳 막대 색상으로」): ① 제목 오른쪽 꺾쇠 버튼과 그 안내 펼침(`warranty-guide`)을 없앴다. ② 세 줄(제조사 보증 차체/일반 · 엔진/주요 · 성능·상태점검 보증) 사이 간격을 모두 22px로 같게 했다(마지막 줄 위 여분 18px 제거, 측정 22 · 22). ③ 보증이 있는 막대(채움)는 초톳 막대 파랑 `#306BD9`로 바꿨다(초톳 상세 `Khoảng giá thị trường` 가격 범위 막대 캡처 1080×2340 픽셀 값 RGB 48·107·217, 트랙 `#F1F1F1`은 우리 트랙 `#e5e7ea` 그대로). 앞의 `#222` 채움은 대체.

- 상세 섹션 카드 간격 통일(2026-10-14 「메뉴 섹션별 타이틀과 하단 위아래 간격 초톳 측정해서 기준 모두 적용해라, 다 제각각이다」, 초톳 상세 캡처 1080×2340 ÷2.8125 실측 `Mô tả chi tiết` · `Thông số chi tiết` 카드): 카드 사이 10(9.9), 카드 윗선 → 제목 글자 윗선 15.3~16.0(대문자 M 15.3 · T 16.0), 제목 글자 아랫선 → 본문 첫 글자 윗선 21.4~21.7(본문 대문자 높이 10), 마지막 내용 아랫선 → 카드 아랫선 15.0(마지막이 박스인 경우 박스 아랫선 기준). 우리 모바일 상세(`.detail-gray-stack > .detail-card`)는 이전에 카드 사이 8, 윗선 → 제목 14.2~17.8, 제목 → 본문 15.3~41.6, 마지막 → 아랫선 0~47.3으로 제각각이었다. 이제 카드 사이 10, 윗선 → 제목 15.5(카드 위 안쪽 여백 11), 제목 → 본문 21.5, 마지막 → 아랫선 15로 같고, 본문마다 첫 줄 안쪽 여백이 달라 제목 아래 여백 `--dh`와 카드 아래 여백 `--db`를 카드별로 보정했다(설명 13.2 · 기본 정보 7.1 · 옵션 6.8 · 보험 이력 17.7(파란 박스 윗선 기준) · 점검 14.6 · 보증정보 14.1 · 판매 정보 7.1). 측정은 카드 스크린샷 잉크 행(384, DPR 2.8125): 윗선 → 제목 14.2~15.6(한글 글자 모양 차 ±1), 제목 → 본문 20.6~22.4, 마지막 → 아랫선 14.6~16.0(판매 정보·보험 이력은 마지막이 연한 박스·구분선이라 박스 아랫선 15). PC 상세·바이크 상세·`동급`·`판매자` 레일 제목은 바꾸지 않았다.

- 상세 상단 초톳 전수 대조(2026-10-14 「제조사 모델명 · 메타정보 · 지역 · 등록일 · 판매자정보 및 프사, 초톳 원본과 사이즈 · 글자 크기 · 위아래 간격 전수조사, 단 가격 색은 검정」, 초톳 `Máy Medicube Age-R Booster Pro Mini` 상세 캡처 1080×2340 ÷2.8125, 사진 아랫선 기준 · 같은 방법으로 우리 `.vehicle-summary`를 384/DPR 2.8125로 찍어 글자 잉크 윗·아랫선 측정): **초톳(사진 아래 기준)** 제목 글자 윗선 20.3(대문자 14.9 ≈ 21px, 줄 간격 28.1, 왼쪽 16) → 메타 윗선 83.2(제목 아랫선 62.9에서 20.3, 대문자 10.3 = 14px) → 가격 숫자 윗선 113.8(메타 아랫선에서 20.6, 숫자 높이 15.6 ≈ 22px) → 지역 글자 윗선 152.9(가격 아랫선에서 23.8, 글자 15px · 줄 간격 24.5, 2줄째 회색, 글자 왼쪽 40.9, 핀 잉크 13.2×16.7) → 시간 글자 윗선 210.5(지역 2줄 아랫선에서 22.8, 14px, 시계 잉크 16.7) → 프사 지름 46.6(왼쪽 16.7, 이름 글자 왼쪽 77.2 = 프사와 간격 13.9, 이름 윗선이 프사 윗선보다 4.9 아래, 2줄째 글자 윗선이 이름 윗선보다 24.6 아래). **우리 이전 → 지금**: 제목 아랫선 → 메타 15.6 → 20.6, 메타 → 가격 숫자 15.3(숫자 높이 14.4) → 20.3(숫자 높이 15.6, 가격 20 → 22px), 가격 → 지역 23.8 → 23.8(지역 줄을 앞 20 → 24.5로 키우고 위 여백 12 → 6.7), 지역 줄 간격 19.9 → 24.2, 지역 → 시간 20.9 → 22.7(시간 글자 15 → 14px), 프사 48 → 46(간격 12 → 14, 이름 윗선 3.0 → 5.3). 가격 색은 검정 `#222` 그대로(초톳 분홍 `#F0325E` 아님). 같은 캡처 묶음(자동차 `VinFast VF6` 캡처와 이번 `Medicube`)에서 **서로 다른 값은 바꾸지 않았다**: 제목 글자 크기(이번 14.9 vs 차 캡처 13.5 → 우리 19px 유지, 줄 간격 29.5 유지), 핀·시계 아이콘 크기(이번 13.2×16.7 · 16.7 vs 차 캡처 15.6×19.9 → 유지), 메타 글자색(이번 `#222` vs 차 캡처 회색 → `#595959` 유지). 판매자 2줄째는 초톳이 14px 회색인데 우리는 사용자 지시(차란차 크기)로 16/24라 그대로 둔다. 초톳의 시간과 판매자 사이 약 43px 공백은 채팅 입력 상자 자리라 따라 하지 않았다(우리 간격 유지).

- 상세 지역 2줄 개편(2026-10-14 「이렇게 가자: 서울 서초구 서울오토갤러리 / 박상용 딜러ㆍ상사명 / 서울오토갤러리 밑줄 빼고 파랑색으로」): 상세 상단 지역을 `1줄 = 지역(구군, 3단계면 구까지) + 단지`, `2줄 = 딜러 이름ㆍ상사명`으로 바꾼다. 예: `서울 서초구 서울오토갤러리` / `박상용 딜러ㆍ디앤디플러스`, `경기 수원시 권선구 도이치오토월드` / `강동호 딜러ㆍ준모터스`. 단지 이름은 지역과 한 칸(4px) 띄워 이어 쓰고 밑줄 없이 파랑 `#306BD9`(초톳 막대 파랑과 같은 값)로 쓴다(누르면 그 카테고리 목록, 링크 동작 그대로). 2줄은 판매자 이름 칸과 같은 `이름 딜러` 형식(`박상용 딜러`)과 상사명을 가운데점 `ㆍ`로 잇고 상사명의 링크 밑줄(딜러 페이지가 있는 서울오토갤러리 딜러 5명)은 그대로 둔다. 개인 판매자는 2줄을 그리지 않는다. 앞의 `1줄 시도 구군 / 2줄 단지ㆍ상사명` 분리는 이 규칙이 대체한다. 목록 카드의 지역 줄은 그대로다(`BbmResultCard` 속성 `detailLocation`은 상세 상단만 넘긴다).

- 상사명을 판매자 이름 옆으로(2026-10-14 「상사를 프사 딜러 옆으로」): 상세 지역 2줄(`딜러 이름ㆍ상사명`)을 없애고 지역은 `지역 + 단지` 1줄만 둔다. 상사명은 판매자 칸(프사 오른쪽) 이름줄에 `박상용 딜러ㆍ디앤디플러스`로 이어 쓴다(이름 16/22 600, 상사명 16/22 400 `#222`, 가운데점 `ㆍ`, 넘치면 상사명이 말줄임). 딜러 페이지가 있는 서울오토갤러리 딜러 5명의 상사명은 밑줄 링크 그대로다(예: `브로엠와이` → `?profile=dealer&shop=450555&emp=1`). 개인 판매자는 상사명이 없다. 앞의 「지역 2줄 개편」 중 2줄(딜러ㆍ상사명)은 이 규칙이 대체하고 1줄(지역 + 파랑 단지)은 그대로다.

- 상세 지역·등록일 아이콘(2026-10-14): 노션의 AutoScout24 원본 `위치(map-pin)_24_24`와 `시계_20_20`으로 교체한다. 핀은 24×24 상자에 원본 24 viewBox, 시계는 20×20 상자에 같은 24 viewBox를 유지한다. 핀의 보이는 왼쪽과 시계 상자는 x=16, 두 줄의 텍스트 시작은 x=40으로 맞춘다. 두 아이콘은 원본 경로의 선 굵기·비율을 바꾸지 않고 색만 상세 본문 `#222`로 통일한다.

- 서울오토갤러리 매물 추가: 레인지로버(2026-10-15 「매물추가해 / 사진 모두」): 랜드로버 레인지로버 4세대 `5.0 V8 SC LWB SV AB`(19년08월식은 월 값 없이 연식 2019 · 52,000km · 가솔린 · 5000cc · 미색 · SUV · 직접매도)를 서울오토갤러리 카테고리 맨 위에 더했다(`number` 24, 딜러 김태규 · (주)투제이모터웍스, 서울오토갤러리 421호). 가격은 시트 값이 `상담`이라 `가격 상담`이다(`price: null`). 사진 17장은 사용자 드라이브 폴더의 원본(1120×840 JPG)을 그대로 `public/assets/cars/seoul-autogallery-v01/rr/rr-01~17.jpg`에 저장했다(번호판 흐림 · 배경 처리 · 자르기 없음). 목록 썸네일은 사본 없이 원본을 정사각 칸 가운데에 비율대로 보이고 남는 칸은 흐린 같은 사진으로 채운다(`listCrop`). 연락처 · 차량번호 · 제시번호 · 원본 URL은 저장하지 않았다. `www.seoulautogallery.com`은 이 환경에서 막혀 있어 사이트 사진 대신 드라이브 사본을 썼다. 월(08)은 카드 `cardSpec`에 쓰지 않고 숫자 연식을 쓴다(다른 서울오토갤러리 행과 같음, 월 표기가 필요하면 알려 주면 `19년08월`로 바꾼다).

- 제조사 로고 칩 그림자 카드 시안(2026-10-15 「이 디자인으로 별도 주소」, 이집트 중고차 앱 딜러 화면 캡처 923px ÷2.404 → 384 실측, 미리보기 전용): 주소 끝 `&qfbrand=shadowcard`일 때만 과쯔 제조사 로고 레일(승용 중고차·국산차 등 일반 레일)을 흰 카드로 바꾼다. 카드 80×80 · 반경 8 · 간격 10 · 첫 카드 왼쪽 16 · 테두리 없이 옅은 그림자 `0 1px 4px rgba(0,0,0,.22)`, 로고 칸 40×40(카드 위 4), 이름 14/16 400 `#222`, 아래에 `(대수)` 14/16 `#595959`(그 제조사의 화면 샘플 매물 수), 선택은 파랑 2px 안쪽 테두리. 맨 앞에 `전체 (N)` 카드(로고 없이 이름 700 + 대수, 제조사 선택 해제)를 두고 국산·수입 구분선은 숨긴다. 레일 높이 96(카드 80 + 위아래 8). 기본 화면과 다른 카테고리·`수입차`·럭셔리 로고 레일은 그대로다. 구현 `src/prototype/listing/qf-brand-shadowcard.css`, 주소 예 `?qf=guazi&category=중고차&qfbrand=shadowcard`. 결정되면 기본으로 승격하고 파라미터를 뺀다. 수입차(럭셔리 로고 레일 경유)·바이크·트럭 레일은 아직 적용하지 않았다.

- 그림자 카드 시안 글자 크기 보정(2026-10-15 「텍스트 크기 봐」, 같은 앱 다른 캡처 1080×2340 ÷2.8125 잉크 실측): 원본은 이름 `Nissan` 대문자 높이 7.5 · 폭 29.5, `(6)` 괄호 높이 8.9 · 폭 11.7이고 우리 14px은 `(8)` 괄호 높이 13.2 · 폭 15.3이라 원본보다 약 1.5배 컸다. 높이 ÷0.72 · 폭 비율로 환산한 원본 글자는 10~11px이라 이름·`(대수)`를 모두 11/16 400으로 줄였다(`전체`는 700). 줄 간격 16, 로고 칸 40, 카드 80×80은 그대로다.

- 상세 상단 판매자명·브레드크럼 시안(2026-10-15 「별도 주소 · 상세페이지에 판매자명 페이지 브레드크럼 · 사진 위에 올린 버전 추가」, 태국 카이디 매물 상세 캡처 923px ÷2.404 → 384 환산, 미리보기 전용, 실제 매물 상세 모바일만): 주소 끝 `&detailtop=above`는 사진 위에 흰 머리줄(뒤로 · 공유 · 더보기, 높이 54) → 판매자 줄(높이 68, 프사 42 · 이름 `김태규 딜러` 16/22 700 · 보조줄 `상사 · N대 판매중`(개인은 `개인 판매자`) 14/20 `#595959` · 오른쪽 `›`, 누르면 딜러 페이지 — 화면이 있는 서울오토갤러리 딜러만 링크) → 경로 줄(`홈 › 차량 › 중고차 › SUV`, 13/18 `#595959`, 중고차가 아니면 바디타입 없이 `트럭·특장`·`바이크`·`건설기계`) → 좌우 16 · 반경 12 사진 칸(높이 250, 빈 곳 `#f2f2f2`)이다. 사진 한 장 폭도 칸에 맞춰 줄였다(`100vw − 32`). `&detailtop=overlay`는 사진 칸을 그대로(전폭 250 · 뒤로·공유 버튼 그대로) 두고 위쪽에 검정 그라데이션(112, 55%→0)을 깔고 흰 경로 줄을 버튼 아래(top 50)에, 판매자 칩(흰 94% 알약, 높이 44, 프사 32 · 이름 14/20 700 · `›`)을 왼쪽 아래(왼쪽 16 · 아래 12)에 올린다(오른쪽 아래 `1 / 17` 개수 알약과 겹치지 않게 최대 폭 `100% − 112`). 파라미터가 없으면 기존 상세 그대로이며, 결정되면 하나를 기본으로 하고 파라미터를 뺀다. 팔로워·별점은 우리에게 실제 값이 없어 넣지 않았다. 구현 `src/prototype/detail/index.tsx`(`DetailTopSeller` · `DetailTopCrumbs`), `detail.css` 끝 블록.

- 로고 박스형(그림자 카드) 럭셔리카 적용(2026-10-15 「로고 박스형 럭셔리카 시안 따로해서 적용해라」): 앞의 `&qfbrand=shadowcard` 그림자 카드 디자인(카드 80×80 · 그림자 · 로고 · 이름 · (대수) · 맨 앞 `전체 (N)` · 선택 파랑 2px)을 럭셔리카 16개 브랜드 로고 레일(`is-lux-logo`, 슈퍼카 포함 같은 레일)에도 적용했다. 같은 주소 끝 파라미터를 쓴다: `?qf=guazi&category=럭셔리카&qfbrand=shadowcard`. 로고는 기존 오토홈 원본(`autohome2`) 그대로이고 대수는 그 브랜드의 화면 매물 수다(0대는 기존처럼 흐리게). 파라미터가 없으면 기존 무배경 로고 레일 그대로다. 결정되면 기본으로 승격하고 파라미터를 뺀다.

- 그림자 카드 선택 색(2026-10-15 「선택된건 에어비앤비 색상」): `&qfbrand=shadowcard` 카드의 선택 테두리를 임시 파랑(`#1b4cdb`)에서 에어비앤비 검정 `#222` 2px로 바꿨다(안쪽 테두리, 그림자 그대로). 일반 중고차 레일과 럭셔리카·슈퍼카 레일에 모두 적용된다.

- 그림자 카드 원본 재대조(2026-10-15 「다시 카드칩 크기 박스 음영 등 우리꺼와 크로스체크」, 이집트 중고차 앱 딜러 화면 캡처 1080×2340 ÷2.8125 픽셀 실측 · 우리 쪽은 같은 배율 DPR 2.8125로 찍어 같은 방법으로 측정): 원본 카드 폭·높이 80×80(피치 90 = 간격 10, 모서리 반경 약 8), 카드 위 바탕 `#F3F4F6`, 선택 테두리 카드 안쪽 2px(`#003FE5`, 우리는 에어비앤비 `#222`), 그림자는 아래로만 번진다 — 카드 아래 0.7px 지점이 바탕보다 15% 어둡고 4px 아래에서 사라지며(밝기 207 · 213 · 228 · 239 · 243), 위쪽은 번짐 없음, 옆은 4%. 로고 중심은 카드 위 25.8, 이름 윗선 50.1(대문자 높이 7.5), `(대수)` 윗선 66.1(괄호 높이 8.9). 우리 이전 값은 크기·간격·반경·선택 테두리가 같았고 다음을 고쳤다: ① 그림자 `0 1px 4px .22` → `0 1.6px 2px rgba(0,0,0,.18)`(측정 아래 207 · 219 · 232 · 241, 옆 232, 위쪽 번짐 5% → 0) ② 카드 위 안쪽 여백 4 → 6(로고 중심 24 → 26.1, 이름 윗선 47.3 → 50.1, 대수 64.0 → 66.5) ③ 글자 11 → 10.5px(대수 괄호 높이 10.3 → 10.0) ④ 레일 바탕을 흰색에서 `#F3F4F6`으로(원본은 회색 판 위에 흰 카드). 첫 카드 왼쪽은 원본 17, 우리 16(퀵필터 시작선 규칙 유지). 한글과 영문 글꼴이 달라 글자 높이는 완전히 같게 맞출 수 없다.

- 그림자 카드 레일 바탕 제거(2026-10-15 「우린 배경색 빼자」): 앞의 「레일 바탕 `#F3F4F6`」을 취소한다. `&qfbrand=shadowcard` 레일은 기본 화면과 같은 흰 바탕이고 카드(흰색)는 그림자로만 구분된다. 카드 크기·그림자·글자·선택 `#222`는 그대로다.

- 그림자 카드 박스 윤곽 복원(2026-10-15 「위 카드 박스 없어졋다 준」): 레일 바탕을 뺀 뒤 흰 카드가 흰 화면에 묻혀 박스가 안 보였다. 레일은 흰색 그대로 두고 카드에 1px 옅은 윤곽 `rgba(0,0,0,.07)`을 더하고 그림자를 `0 1.6px 3px rgba(0,0,0,.14)`로 조금 진하게 했다. 선택은 `#222` 2px 안쪽 테두리 그대로.

- 그림자 카드 윤곽을 오토스카우트 카드선으로(2026-10-15 「사이즈는 건드리지 말고 오토스카우트 라인 크로스체크」, 오토스카우트24 모바일 검색 결과 카드 캡처 1080×2340 ÷2.8125 픽셀 실측): 카드는 테두리선 없이 그림자만 쓴다. 카드 가장자리 어두움은 왼쪽 옆 12%, 위 6%, 아래 18.5%이고 번짐은 옆 약 8 · 위 약 10 · 아래 약 10(CSS px)이다. 가우시안 모델로 맞추면 `0 3px 7px rgba(0,0,0,.24)`(아래로 약 2.7 치우침, 번짐 σ 약 3.7)다. 앞의 1px 옅은 윤곽 + `0 1.6px 3px .14`는 대체하며, 카드 크기 · 반경 · 간격 · 글자는 건드리지 않았다. 선택은 `#222` 안쪽 2px 그대로.

- 그림자 카드에 페라리 모델 이미지 추가(2026-10-15 「페라리 모델 이미지도 이 카드에 추가해봐라」): `&qfbrand=shadowcard`일 때 럭셔리카·슈퍼카에서 페라리 로고를 고르면 나오는 모델 레일(`.is-ferrari-model-row`)도 같은 흰 카드(80×80 · 반경 8 · `0 3px 7px .24` 그림자 · 선택 `#222` 2px · 간격 10 · 첫 카드 왼쪽 16 · 레일 96)로 그린다. 로고 칸(40×40) 자리에 모델 이미지 칸 64×36(`contain` · 아래 맞춤, 카드 위 9)을 두고 이름 10.5/16, 아래에 `(대수)` 10.5/16 `#595959`(그 모델의 화면 매물 수)를 쓴다. 이미지는 기존 페라리 모델 카탈로그 컷(`ferrari-models/angle`) 그대로이고, 파라미터가 없으면 기존 모델 레일 그대로다. 384 측정: 카드 80×80, 이미지 위 9 · 이름 위 48 · 대수 위 64(모두 카드 안).

- 그림자 카드 위아래 간격 + 글자 위치 재대조(2026-10-15 「카드 칩 위아래 간격 잡아」 「카드칩 내 텍스트 크기 위치 등」, 이집트 앱 Xtreme Auto 딜러 화면 캡처 1080×2340 ÷2.8125 잉크 실측): ① 위아래 간격 — 이전 칩 줄 → 카드 24 · 카드 → 정렬 줄 6.5로 불균형이었다. 레일 높이를 96 → 98, 안쪽 여백을 `0 16px 18px`(카드 위쪽 맞춤)로 바꿔 칩 줄(또는 페라리 지역 줄) → 카드 위 16 · 카드 아래 → 다음 줄 16으로 같게 했다(중고차 · 럭셔리카 · 페라리 모델 레일 384 측정 16 / 16, 페라리 모델 레일은 지역 줄 아래라 위 16 · 레일 높이 96으로 아래 16). 그림자는 카드 아래로 약 10 번지므로 아래 간격이 위보다 작아 보이지 않게 둘을 같게 했다. ② 글자 — 원본 카드(약 80×79) 안에서 이름 잉크 윗선 49.0, 대수 `(13)` 잉크 65.0~73.6(괄호 높이 8.9), 로고 잉크 8.9~39.8. 우리는 이름 49.8 · 대수 66.1~75.7(10.0)이라 이름 위 여백을 1 → 0.2로 올리고(48.7), 대수는 글자 10.5 → 9.5px · 위 −1px로 바꿔 65.1~73.6(8.9)로 맞췄다. 카드 크기 80×80 · 이름 10.5/16은 그대로. 원본 로고는 잉크 높이가 31(Hyundai)로 우리(17.8)보다 크지만 로고 크기는 건드리지 않았다(사용자 지시 「사이즈는 건드리지 말고」).

- 그림자 카드 위쪽 그림자 잘림 방지(2026-10-15 「위 라인 또 사라지게했다」): 위아래 간격을 16/16으로 맞추며 레일 안쪽 위 여백을 0으로 둬서 카드 위 그림자가 가로 스크롤 레일에 잘렸다. 일반·럭셔리 로고 레일(`.is-kr-maker.is-brand-shadowcard`)을 위로 8 넓히고(`margin-top: -8px`, 높이 106) 안쪽 위 여백 8을 둬 그림자를 살렸다. 칩 줄 → 카드 16, 카드 → 아래 16, 카드 크기·그림자 값은 그대로. 384 측정: 위 16 · 아래 16, 카드 위 밝기에서 그림자 확인. 페라리 모델 레일은 자체 위 여백 16이 있어 영향 없음.

- 그림자 카드 페라리 모델 레일 위쪽 그림자 잘림 방지(2026-10-15 「위 라인쳐라」): 페라리 모델 레일은 트랙 안쪽 위 여백이 0이라 카드 위 그림자가 잘렸다. 레일 안쪽 위 여백 16 → 8, 트랙 높이 104 · 안쪽 `8px 16px 16px`로 바꿔 지역 줄 → 카드 16 · 카드 → 아래 16은 그대로, 위 그림자만 살렸다. 384 측정: 위 16 · 아래 16, 카드 위 밝기 254 → 248.

- 그림자 카드 바이크 유형 적용(2026-10-15 「바이크 유형에도 적용하자 굉장히 어울린다」): `&qfbrand=shadowcard`일 때 바이크 첫 화면 유형 레일 13종(`is-bike-type-row`)도 같은 흰 그림자 카드(80×80 · 반경 8 · `0 3px 7px .24` · 간격 10 · 첫 카드 왼쪽 16)로 그린다. 이미지 칸 64×36(`contain` · 아래 맞춤), 이름 10.5/16, 아래 `(대수)` 9.5/16 `#595959`(그 장르의 화면 바이크 매물 수, `filter.bikeGenre` 기준). 위쪽 그림자 잘림 방지는 로고 레일과 같다(레일 위로 8 · 안쪽 위 8). 384 측정: 칩 줄 → 카드 16 · 카드 → 아래 16. 파라미터가 없으면 기존 유형 레일 그대로. 바이크 제조사·모델 레일은 이미 로고 레일 규칙으로 적용되어 있다.

- 그림자 카드 트럭 유형 적용(2026-10-15 「트럭유형도」): `&qfbrand=shadowcard`일 때 트럭·특장 첫 화면 유형 레일(`is-truck-type-row`, 14종)도 같은 흰 그림자 카드(80×80 · 이미지 64×36 · 이름 · `(대수)` = 그 형식의 화면 트럭 매물 수 `truck.format` 기준)로 그린다. 위에 적재중량 줄이 있어 바이크처럼 위로 겹치지 않고 트랙 안쪽 `16px 16px 16px`(레일 높이 112)로 적재중량 줄 → 카드 16 · 카드 → 아래 16을 만들며 그 안에 위 그림자를 둔다. 384·1440 측정 모두 16 / 16. 파라미터가 없으면 기존 레일 그대로. 건설기계 유형·세부형식 레일은 아직 적용하지 않았다.

- 그림자 카드 바디타입 줄 적용(2026-10-15 「원본 놓고 카드칩 퀵필터로 하나씩 변경하고 배포」): `&qfbrand=shadowcard`일 때 국산차·수입차 첫 화면 바디타입 줄(`is-car-body-type`, 세단·해치백·왜건·쿠페·컨버터블·SUV·RV·밴·픽업·리무진)도 같은 흰 그림자 카드(80×80 · 이미지 64×36 · 이름 · `(대수)` = 그 바디타입의 화면 매물 수, `filter.body` 기준 · 승합 → 밴(승합) · 스포츠카 → 쿠페)로 그린다. 위는 칩 줄 → 카드 16(레일 위로 8 · 안쪽 위 8), 아래는 제조사 줄 카드까지 16(안쪽 아래 16 + 제조사 줄 위로 8). 모바일 384 측정 16 / 16(수입차 · 국산차). PC 1440은 제조사 줄까지 24로 남아 있다(확인 필요). 파라미터가 없으면 기존 줄 그대로. 원본은 그대로 두고 카드 시안을 하나씩 늘리는 중이다(다음: 일반 모델 줄 → 세부모델 줄 → 건설기계).

- 그림자 카드 일반 모델 줄 적용(2026-10-15 「하나씩 변경하고 배포」 2번째): `&qfbrand=shadowcard`일 때 제조사를 고른 뒤 나오는 모델 줄(페라리 외 모든 제조사, `is-shadow-model-row`)도 같은 흰 그림자 카드(80×80 · 이미지 64×36 · 이름 · `(대수)` = 그 모델의 화면 매물 수, 페라리 모델 줄과 같은 계산)로 그린다. 위는 칩 줄 → 카드 16(레일 위로 8 · 안쪽 위 8), 아래 안쪽 16. 모바일 384 측정 위 16, 이미지가 없는 모델은 기존 빈 칸 그림(점선 + 노션 그림)이 카드 안에 그대로 나오고 대수 `(0)`도 표시된다(확인 필요). 파라미터가 없으면 기존 줄 그대로. 다음: 세부모델 줄 → 건설기계.

- 그림자 카드 세부모델 줄 적용(2026-10-15 「하나씩 변경하고 배포」 3번째): `&qfbrand=shadowcard`일 때 모델을 고른 뒤 나오는 세부모델 줄도 모델 줄과 같은 흰 그림자 카드(`is-shadow-model-row`, 80×80 · 이미지 64×36)로 그린다. 둘째 줄은 대수 대신 기존 연식 글자(`2022~현재`)를 그대로 쓴다(세부모델은 연식이 더 필요한 정보). 위 16(칩 줄 → 카드), 이미지가 없는 세부모델은 기존 빈 칸 그림. 모바일 384 · PC 1440 모두 동작 확인. 파라미터가 없으면 기존 줄 그대로. 다음: 건설기계.

- 그림자 카드 건설기계 줄 적용(2026-10-15 「하나씩 변경하고 배포」 4번째): `&qfbrand=shadowcard`일 때 건설기계 퀵필터(`HeavyQuickFilter`, `.heavy-qf.is-shadowcard`)의 유형(굴착기 · 불도저 · 로더 …) · 제조사 로고 · 모델 · 세부모델 줄을 같은 흰 그림자 카드(80×80 · 이미지 64×36(로고는 40×40) · 이름 10.5/16 · 아래 `(대수)` 9.5/16)로 그린다. 유형·제조사 카드는 대수를 새로 보여 주고(`(15)` 등, 기존 매물 수 계산 그대로), 모델·세부모델 카드는 기존 대수 글자를 같은 스타일로 쓴다. 세부 유형 알약 줄(`heavy-qf-detail-chip`)과 선택 완료 막대는 그대로. 위는 칩 줄 → 카드 16(퀵슬롯 위 8 + 트랙 안쪽 위 8), 아래 16(트랙 안쪽 아래 16). 모바일 384 유형 · 제조사 단계 측정 16 / 16. 파라미터가 없으면 기존 줄 그대로. 남은 것: PC 바디타입 아래 간격 24 → 16, 자재운반장비 · 부품 유형 줄은 이미지 레일 없음.

- 그림자 카드 PC 간격 정리(2026-10-15 「PC 간격도 맞춰서 배포해라」): PC(개발 시안형 `.is-bbm`)는 stable-top.css가 퀵슬롯 안 줄의 위 여백을 0으로 고정해, 바디타입 → 제조사 줄 사이가 24 · 지역 줄 → 카드 24 · 카드 → 카드 영역 끝 8~34로 제각각이었다. 더 구체적인 선택자로 고쳐 1440 측정 기준 **지역 줄 → 카드 16 · 줄 사이 16 · 카드 → 카드 영역 끝 16**으로 맞췄다(중고차 · 수입차 · 국산차 · 럭셔리카 · 바이크 · 건설기계 · 벤츠 모델 줄 모두). 방법: 퀵슬롯 위 여백 8 · 아래 안쪽 8, 레일 위로 8(margin-top −8) · 높이 104 · 트랙 안쪽 `8px 20px 16px`, 카드 영역(`.bbm-content-head`) 아래 여백 0, 건설기계는 컴포넌트 위로 8. 트럭 유형 줄은 위 적재중량 줄의 알약이 줄 가운데에 있어 알약 → 카드가 24~28이었으므로 트랙 안쪽 위 여백을 모바일 8 · PC 4로 줄여 보이는 알약 → 카드 16(PC·모바일 측정)으로 맞췄다. 페라리 모델 줄(PC)은 지역 줄 구조가 달라 이번에는 건드리지 않았다(카드 → 영역 끝 18). 파라미터가 없으면 기존 화면 그대로.
- PC 국산차·수입차 바디타입 우선 시나리오(2026-10-18 「올드카처럼」, 「수입차도 바디타입 알약칩」): `?qf=guazi&pc=1&category=국산차|수입차`의 첫 퀵필터는 올드카의 `연대 알약 → 제조사 로고` 계층을 따라 `바디타입 알약 → 브랜드 로고` 순서로 표시한다. 첫 라벨은 `바디타입:`이며 선택지는 `세단 · 해치백 · 왜건 · 쿠페 · 컨버터블 · SUV · RV · 밴(승합) · 픽업트럭 · 리무진`이다. 같은 알약을 다시 누르면 선택이 해제된다. 모바일은 기존 이미지형 바디타입 레일을 유지한다.
- PC 일반 중고차 판매자 퀵칩 제거(2026-10-18): `?qf=guazi&pc=1`의 일반 중고차 계열 상단 빠른 필터에서 `판매자` 칩과 판매자 적용 칩을 표시하지 않는다. 판매자 조건은 좌측 상세 필터와 매물 목록의 `전체 · 개인 · 딜러 · 브랜드` 탭으로 계속 제공한다. 트럭·중기·바이크·중고부품 전용 화면은 기존 칩 구성을 유지한다.
- PC 일반 중고차 목록·필터 위치 교체(2026-10-18): 1280px 이상에서 본문을 `매물 리스트(왼쪽) · 필터 280px(오른쪽)` 순서로 배치한다. 필터를 접으면 오른쪽 열만 48px로 줄어든다. 1024~1279px 필터 서랍과 모바일, 트럭·중기·바이크·캠핑카·중고부품의 기존 배치는 유지한다.
- PC 필터 배치 4안 보존(2026-10-18): 일반 중고차 PC에서 `&filterLayout=left`는 `필터 280px(왼쪽) · 간격 40 · 매물`, `&filterLayout=right`는 `매물 · 간격 40 · 필터 280px(오른쪽)`, `&filterLayout=compact`는 좌측 필터안에 더해 Hatla2ee처럼 상단 검색조건 카드도 아래 매물 영역과 같은 880px로 줄여 오른쪽 시작선을 맞춘다. `&filterLayout=bare`는 좌측 필터·우측 매물을 유지하면서 큰 상단 검색조건·브랜드 박스만 제거하고 중고차 하위 메뉴는 남긴다. 파라미터가 없으면 현재 선택안인 `right`를 기본으로 한다. 1024~1279px와 모바일은 기존 반응형을 유지한다.
- PC 국산차 로고·브랜드명 간격(2026-10-18): 국산차 제조사 레일도 올드카처럼 40×40 로고 하단과 브랜드명 상단을 8px로 붙인다(기존 14px). 카드 84×102, 로고 상단 6px, 브랜드명 14px과 다른 카테고리·모바일 간격은 유지한다.

- 그림자 카드 `전체 (N)` 카드 제거(2026-10-15 「전체빼라」): `&qfbrand=shadowcard`의 제조사·럭셔리 로고 줄 맨 앞에 두던 `전체 (N)` 카드를 뺐다. 로고 줄은 첫 카드부터 브랜드가 바로 시작한다(제조사 선택 해제는 위 칩의 ×로 한다). 카드 크기·간격·그림자는 그대로다. CSS의 `.is-brand-all` 규칙은 남겼지만 쓰이지 않는다.

- PC 메인 검색바 시안(2026-10-17 「초톳·카이디 2개 형태로 검색바 교체, 레거시 느낌 벗어나자」, 미리보기 전용, 기본 화면은 그대로): 주소 끝 `&pcsearch=chotot` = 초톳 xe.chotot.com 1440 실측 구성(맨 위 로그인·회원가입·고객센터 줄 제거, 헤더 줄 68, `[로고] [위치 아이콘 전국 ▾ 알약 40] [검색 알약 40 · #F4F4F4 · 테두리 없음 · 왼쪽 돋보기 · 입력 16px · 오른쪽 32 원형 검색 버튼] [찜 · 알림 아이콘 40] [채팅 · 로그인 테두리 알약 40] [내차팔기 채운 알약 40]`). `&pcsearch=kaidee` = 카이디 kaidee.com 1440 실측 구성(맨 위 줄 제거, 헤더 줄 80, `[로고] [검색 알약 50 · #F5F5F5 · 왼쪽 36 원형 검색 버튼 · 입력 16px · 안내 "○○에서 무엇을 찾으세요? / 를 눌러 검색", 키보드 / 로 검색창 이동] [내차팔기 44 · 반경 12] [채팅 원형 44 옅은 파랑] [찜 · 마이 원형 40]`). 두 시안 모두 검색창을 누르면 흰 바탕 + 보배드림 파랑 `#1B498C` 2px 테두리와 옅은 그림자, 검색·주 버튼은 `#1B498C`(초톳 노랑·카이디 파랑 대신 우리 브랜드색). 아래 메뉴 줄(GNB)은 그대로.

- PC GNB·LNB 비교안 기록(2026-10-18): 기본 화면은 최종 선택한 `GNB 글자 탭 + 44px LNB 평면 글자 탭 + 필터 알약 칩`이다. `&lnb=a`는 LNB 칩을 남긴 초기 엔카형, `&lnb=b`는 중립색 작은 글자 탭 비교안, `&lnb=c`는 LNB 줄을 제거하고 카드 제목 드롭다운을 쓰는 비교안으로만 보존한다.

- PC 하위메뉴 시안 2차(2026-10-18 「필터 위로 카테고리 칩 · 엔카처럼 밑줄 밑 사각칩 한 묶음, 시안 만들어봐라」, 미리보기 전용, 기본 화면은 그대로): 세 시안 모두 경로 줄과 필터 줄의 카테고리 칩(`중고차 ×`)을 숨긴다. `&lnb=d` = 엔카 묶음형(흰 헤더 띠를 아래로 늘려 GNB 밑줄 아래 18px에 사각 칩 줄, 띠 아래 1px `#EBEBEB` 선, 칩 높이 40 · 반경 8 · 1px `#DDDDDD` · 14/500, 선택 `#222` 채움 흰 글자 700, 간격 8. 엔카 전기·친환경 PC 1440 실측 칩 42 · 반경 6 · 14px · 선택 `#181818`). `&lnb=e` = 필터 위로(같은 사각 칩 줄을 카드 안 제목 아래 · 필터 칩 위에, 아래 1px `#F0F0F0` 구분선). `&lnb=f` = 제목 탭(카드 제목 자리에 하위 메뉴 큰 글자 탭 18/26 600 `#8C8C8C`, 선택 `#222` 700, 간격 22, 검색저장은 오른쪽 끝). 결정되면 하나를 기본으로 하고 파라미터를 뺀다. D 보완(같은 날 「너도 수정 작업 들어가라」): 하위 메뉴가 하나뿐인 메뉴(바이크 등)는 칩 줄과 흰 띠를 그리지 않고 헤더 아래 1px 선을 되살린다(`:has()` 조건).

- PC 하위메뉴 띠(2026-10-18 「아래 칩이 어설프다, 구분선을 위아래 따서 거기에 하위메뉴」): 기본(파라미터 없음) 중고차·트럭 하위메뉴 줄은 본문 폭 흰 상자가 아니라 화면 전체 폭 흰 띠(높이 56)다. 위 구분선은 헤더 아래 1px `#EBEBEB`, 아래 구분선은 띠 아래 1px `#E5E7EB`(전체 폭), 칩(32 · 반경 6)은 띠 세로 가운데, 띠 아래 → 필터 카드 16. 띠는 `border-image`로 바깥까지 칠해 가로 스크롤이 생기지 않는다(1440 · 1280 · 1100 확인).

- PC 카드 제목 「전체 중고차」(2026-10-18 「전체 중고차 타이틀 달아라」): PC 필터 카드 제목은 카테고리 `중고차`일 때 하위메뉴 선택 칩과 같은 `전체 중고차`로 쓴다. 다른 카테고리 제목과 모바일 제목(`중고차`)은 그대로다.

- PC 카드 제목 아래 설명(2026-10-18 「초톳처럼 타이틀 밑에 주석 설명, 모든 유형의 중고차 매물을 검색할 수 있습니다」, 초톳 xe.chotot.com PC 1440 실측: 제목 아래 4 · 12/18 400 `#595959` · 한 줄 말줄임): PC 필터 카드 제목 줄 아래에 카테고리별 한 줄 설명(`.bbm-ct-desc`, `bbmCategoryDescription`)을 둔다. 예: 중고차 `국산차·수입차·전기차 등 모든 유형의 중고차 매물을 검색할 수 있습니다.` 정해진 문구가 없는 카테고리는 `○○ 매물을 검색할 수 있습니다.` 초톳의 매물 수·날짜와 「더보기」는 넣지 않았다. 모바일은 그대로다.

- PC 국산차·수입차 `제조사:` 라벨(2026-10-18 「제조사도 바디타입과 동일하게 제조사: 표기」): 바디타입 알약 줄 아래 로고 줄 맨 앞에 `바디타입:`과 같은 라벨 `제조사:`(14/20 500 `#777`)를 둔다. 두 라벨은 최소 폭 64로 맞춰 첫 알약과 첫 로고 칸이 같은 x에서 시작하고, `제조사:`는 40×40 로고 상자 세로 가운데(위 10)에 둔다. 제조사를 고르면 바디타입 줄과 함께 사라진다. 모바일은 그대로.
- `제조사:` 줄 정렬 보정(2026-10-18 「바디타입과 제조사 맞춰 정렬」): 로고 칸(84)은 내용이 가운데 정렬이라 칸 시작을 알약과 같게 두면 첫 로고·이름이 약 20px 안쪽에 보였다. 로고 줄만 18px 당겨(라벨 `margin-right: -16px`) 첫 로고·브랜드명의 보이는 왼쪽이 첫 알약 테두리(x 214, 1440 기준)와 같은 선에 오게 했다(측정: 페라리 로고 212 · 이름 글자 약 218, 현대 로고 220). 라벨 두 개의 x(140)는 그대로.
- PC 하위메뉴를 필터 카드 안으로(2026-10-18 「하위 메뉴는 노출하지 말고 필터 박스 안에서 해결, 너무 산만하다, 탑메뉴 밑줄만 남겨라」): 기본(파라미터 없음) 중고차·트럭 화면은 GNB 아래 하위메뉴 띠(`BbSecondaryNav`)를 그리지 않는다. 대신 필터 카드 제목 자리가 하위메뉴 글자 탭(`BbLnbTitleTabs`)이 된다(16/24, 비선택 500 `#8C8C8C`, 선택 700 `#222`, 간격 20, 밑줄 없음). 밑줄은 GNB 현재 메뉴 2px만 쓴다. 제목 아래 설명 줄·검색저장은 그대로. 앞의 「PC 하위메뉴 띠」 기본 규칙은 이 규칙이 대체하며, `&lnb=a~f` 비교안은 그대로 남긴다.
- 카드 하위메뉴 탭 현재 메뉴 칩 바탕(2026-10-18 「활성화된 메뉴 칩 배경 씌워봐라」): 모든 탭을 32px 알약 상자(좌우 12, 간격 4)로 두고 현재 메뉴만 연회색 `#F1F2F4` 바탕 + 700 `#222`, 마우스를 올리면 `#F7F7F8`. 탭 줄은 왼쪽으로 12 당겨 글자 시작선을 설명 줄·필터 칩(1440 기준 x 140)과 맞춘다. 필터 적용 칩(검정)과 구분되도록 회색을 쓴다. 밑줄은 여전히 GNB만.
