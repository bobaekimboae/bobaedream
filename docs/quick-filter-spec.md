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

- Guazi 필터 버튼 아이콘은 노션 `0_0_필터 FilterHeader`의 원본 SVG를 `public/assets/bbm/chip-filter-header.svg`에 적용한다. 24×24 viewBox 안의 세 조절선이며 위·아래 핸들은 x=8, 가운데 핸들은 x=16이다. PC와 모바일이 같은 파일을 20×20px로 표시한다. 파일명을 별도로 두어 이전 브라우저 캐시와 구분한다. 이전 깔때기·단순 조절선·비교용 아이콘은 기본안으로 사용하지 않는다.
- Top chip order: `[필터] [중고차/카테고리] [요약 칩] [트림] [가격] [연식] [주행] [색상]`.
- Guazi (dev-draft baseline, QF-091·QF-089): top chips follow the bbmuseum original. Before a manufacturer: `[필터] [전체차량] [applied chips] [제조사] [연식] [가격] [연료] [판매자]`; after: `[필터] [전체차량] [요약 칩] [모델 until a model is chosen] [트림] [applied chips] [연식] [가격] [연료] [판매자]`. Group chips with a value leave the row. The summary chip keeps its 220px max width, clear, and depth-return behavior.
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
- PC (QF-106b, manual v1.2): layer 0 crumbs sit outside the card on the gray page (header → 16, 18 tall, same left edge as the card, crumbs → card 12). Card: 16 → ① title row 32 → 18 → ② chip row 32 → 18 → ③ region pill row 32 (always; `지역:` + regions + `내 주변`; single select, re-click clears) → 16 → ④ quick slot (always) → card end 16 (image row) / 24 (pill row). Only two card heights (plain 282 / pill 220; card look 252 / 220).
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

## PC Left Filter Order (QF-110)

- Guazi PC left filter (and the 1024–1279 drawer) order comes from one config array `bbmFilterOrder` in `src/prototype/filters/bbm-filter-options.ts`: `제조사 · 모델` (open by default) → `연식` → `주행거리` → `가격` → `바디타입` → `차급` (closed) → `지역` → `매매단지` → … (rest unchanged). The filter header stays on top. ChoTot/Dongchedi PC keep the original order (`order` prop not passed). The mobile filter sheet is unchanged for now and can switch to the same array later. Check: `npm run check:sidebar`.

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
- Font order: `"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`, applied to every text element in guazi with `!important` (debug badge/overlays excluded), because the shared `src/prototype/base.css` still imports the CDN static `Pretendard` for ChoTot/Dongchedi (unchanged).
- Intermediate weights (650, 750) now render as themselves. Checks: `node scripts/font-impact-check.mjs` (line wraps/clipping before vs after), `node scripts/font-load-measure.mjs` (first-screen load).

## PC Mileage Chip Modal (QF-118)

- Guazi PC (1024+) top chip row: `필터 · 중고차 · 제조사 · 연식 · 주행거리 · 가격 · 연료 · 판매자` (left filter order). The `주행거리 ▾` chip uses the same chip spec; with a value it leaves the row and the black applied chip (`1만km 이하` · `3~6만km` · `3.5~8만km` · `15만km 이상` + ×, mileage only) appears with the other applied chips and counts in `필터 N`. Mobile chip row unchanged.
- The chip opens `MileageFinalSheet variant="modal"` (same QF-117 part and QF-119 rules): centered, width `min(480px, 100vw − 48px)`, radius 16, max height `100vh − 96px` (only the body scrolls), 50% dim, page scroll locked with scrollbar-width compensation, 0.15s fade + 8px rise (none with reduced motion). Content = mobile sheet (header 64, inputs `1fr 12px 1fr` gap 10, chips 3 columns, footer 80); at 480 the grid gives inputs 208 and chips 144.
- Draft starts from the applied value; `N대 보기` applies mileage only (list, chips, left sidebar); close, backdrop and Esc discard; 초기화 clears only the mileage draft. The list stays frozen while open.
- Accessibility: `role="dialog"`, `aria-modal`, `aria-labelledby`, focus on close (preventScroll) when opened, Tab trapped, focus returns to the mileage chip (or its applied chip). Check: `node scripts/mileage-modal-check.mjs`.
- Slider drag keeps the active handle in a synchronous ref so the first fast pointer move is not dropped. Handles keep a constant visual size while dragging; no grab/release scale animation is used because it reads as positional bounce, especially on the right handle.
- Pointer dragging follows the rail in 100km increments so a 393px rail does not visibly jump 3–4px per update. Keyboard arrows retain the 1,000km step for efficient accessible operation.
- The mileage reset action follows the Airbnb-style state cue: `#B7B7B7` and disabled when the draft range is empty, `#222` and enabled as soon as any mileage value is selected; resetting returns it to gray immediately.
- The drag value bubble changes to edge-aligned positioning only at the exact 0 and 100,000 endpoints. Intermediate values keep the same centered anchor so crossing the former edge threshold does not look like the handle jumped.

## Seller Type Sheet

- The `판매자` quick-filter chip is pinned immediately after the fixed `필터` control on PC and mobile. When applied, its dark applied chip stays in the same position instead of moving into the general applied-chip group.
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
- 바이크 매물 v08(2026-10-08 「바이크 카테고리도 럭셔리카처럼 실제 매물 같은 정보로」): 바이크 목록은 사용자 지시 매물 `bike-001`(할리 포티에잇48, 맨 위) + 구글 시트 「가상 매물 시나리오 › 바이크」 50행(`src/prototype/bike/scenario-v08.ts`, 사진 `public/assets/bike/listings/v08/`)이다. v07의 나머지 가상 29대는 목록에서 뺐다. 제조사·모델·연식·주행·지역·가격·배기량·서류·판매자 기재 상태·튜닝·정비 요약은 시트 값 그대로, 장르·면허·변속기는 모델 기준으로 정한 값, 판매자 이름은 가상(개인 = 가상 인물 이름, 업체 = `가상 이름 딜러`). 라이트바겐 인증중고 매물만 「인증중고차」 배지(샘플 배지 없음), 업데이트순은 시트 게시일 최신순(`updateRank`, 게시 0일 = N시간 전 · 그 외 N일 전). 원본 상세 URL·매물 ID는 저장하지 않는다. 목록 썸네일은 럭셔리카 규칙 사본(43장, 근접 사진 5장 · 차 영역 오인 2장 제외).
- 바이크 카드(2026-10-07): 제목은 `제조사 모델` 한 줄(2행 없음), 스펙 줄은 `장르 · 연식 · 주행 · 배기량`(예: `네이키드 · 2023 · 2만km · 2,300cc`, 2026-10-08 「2002 숫자만 표기하자」 · 「일단 바이크만」으로 바이크만 연식 숫자만, 다른 카테고리는 `N년식` 유지).
- 건설기계 카드: 제목은 `제조사 모델` 한 줄(2행 없음, 제조사 미확인 매물은 원래 매물명), 스펙 줄은 `등록연월 · 사용시간 · 연료`(`1,800시간`, 2026-10-08 「h → 시간」; 자재운반장비도 `480시간`).
- 부품/용품 카드(2026-10-07): 제목 `제조사 모델 분류`(분류 낱말이 모델명에 있으면 생략), 스펙 줄 `규격 · 수량 · 적용 차종 · 상태`(예: `245/45R18 · 4개 · 그랜저 GN7 · 중고 80%`), 가격은 부품 가격대(`partsCardDetailsV01`, 3~420만원). 연식·연료·변속기·「해당 없음」은 넣지 않는다.
- 부품/용품 필터(2026-10-07): 상단 칩은 연식·주행거리·연료 대신 `분류 · 상태 · 적용 차종 · 가격`. 좌측 필터·모바일 전체 필터 순서는 `partsFilterOrder`(브랜드 → 분류 → 상태 → 적용 차종 → 가격 → 지역). 가격 구간은 `partsPricePresets`(`~5만원 · 5~20만원 · 20~50만원 · 50~100만원 · 100~300만원 · 300만원~`)이고 리스·렌트 탭은 숨긴다. 상태는 `새 상품 · 미사용 · 중고`(중고 NN%는 중고로), 적용 차종의 `범용 5x112` 등은 `범용`으로 묶는다.
- 캠핑카 카드(2026-10-08 개편): 구분은 `모터홈 · 카라반 · 트레일러`(`캐러밴` 표기 폐지, 카테고리 칩도 `전체 · 모터홈 · 카라반 · 트레일러`). 제목은 `제조사 모델 + 세부 형태`(클래스 C · 캠퍼밴 · 팝업 캠퍼, 구분 낱말은 제목에서 뺌). 스펙 줄은 바이크 장르처럼 구분을 맨 앞에: 모터홈 `모터홈 · 20년06월 · 8만km · 전기`, 카라반·트레일러 `카라반 · 18년형`. 모터홈만 그 아래 둘째 줄 `승차 6명 · 취침 3명`(2026-10-08 「인」 → 「명」)(승차 정원 `campingSeatsV01`, 가상 값). 카라반·트레일러는 한 줄에 들어가므로 `카라반 · 18년형 · 취침 4명` 한 줄(2026-10-08, `견인형`은 뺌). 해외 표기(영국 `4 berth`·미국 `Sleeps 4`·독일 `4 Schlafplätze`·일본 `就寝4名`)처럼 침대 수가 아니라 인원 기준. 모든 카테고리 매물 제목에 `UI 검증용 가상 매물`을 넣지 않는다.
- 트레일러 카드(2026-10-07): 엔진이 없어 첫 줄 `등록연월`, 둘째 줄 `적재량 · 길이 · 축`(예: `적재 27톤 · 14m · 3축`, `trailerSpecsV01`), 2행은 세부형식만.
- 목록 카드의 판매자·지역에는 「(가상)」 「가상 매물 전시장」 같은 표기를 쓰지 않는다(2026-10-07). 바이크·트럭·건설기계·캠핑카·자재운반장비·부품 매물의 딜러는 `가상 인물 이름 + 딜러`(승용과 같은 형식, `virtualSellerName`), 개인은 `개인판매자` 대신 가상 인물 이름만(김성일 · 홍성주 등 `privatePersonNames`, 승용 포함), 지역은 시도·시군구만. 상세 화면·시나리오 원본의 가상 표기는 그대로다.
- 실매물처럼 지시값을 보여줄 매물은 `Car.cardSpec`(예: `24년11월 · 4천km · 가솔린`)을 쓰되, 주행거리는 정확값을 넣어도 목록에서는 축약(`56,067km` → `6만km`, 2026-10-08 「주행거리는 축약해라」)한다.
- 트럭·특장 카드(엔카 화물·특장 등급명 규칙): 1행 `제조사 모델`, 2행 `톤수 + 세부형식`(예: `8.5톤 윙바디`, `1톤 카고`), 스펙 줄 `등록연월 · 주행 · 연료`(2026-10-08 유형 접두어는 붙였다가 「트럭은 연식 앞에 유형 제거」로 뺌), 그 아래 둘째 줄 `마력 · 적재용량 · 차축 구성`(예: `460마력 · 적재 11톤 · 6x2`, 적재는 톤으로 축약(`적재 1톤` · `적재 2.5톤`, 2026-10-08), 둘째 줄은 첫 줄에 간격 없이 붙임(`.bbm-card-spec.is-capacity` margin-top 0), 2026-10-08 사용자 지시, Truck1 목록 표기 참고). 마력·차축은 모델·톤수별 대표 제원으로 정한 가상 값(`truckPowerSpecsV01`). 적재는 톤 단위면 `적재 N톤`, 버스 인승·탱크 ㎘·믹서 ㎥는 그대로, 트랙터처럼 적재가 차축과 같으면 생략. 엔진 없는 트레일러는 기존 `적재량 · 길이 · 축` 한 줄. 주행 9,500km 이상은 만 단위(`1만km`).
- The first specification follows the compact Charancha registration-month notation instead of Encar-style slash notation: month known = `24년08월` (two-digit month, no space, no `식`), month unknown = `24년식`. Keep the source value unchanged and normalize only the listing display. Do not use `24/08식` or `24년 8월`.
- The unselected listing-card favorite icon uses the ChoTot reference SVG at 24px with `#8C8C8C`; the selected state keeps the same silhouette and changes only its fill color.
- In mobile list and feed views, place the favorite action at the right edge of the first vehicle-title row, following the Karrot card pattern. Reserve space only on the model row so the trim row keeps its full width. Gallery keeps the favorite over the photo, and text view keeps its compact top-right placement.
- Seller profile photos in mobile list and feed views are 16×16px circles (JOB-8, ChoTot app remeasure: avatar 16, avatar→name visible gap ≈6.6, location center → seller center 24, seller center → card divider 28; PC keeps 20×20) with `object-fit: cover` and centered cropping. The ChoTot source pack is retained in full, but vehicle-only photos, brand/dealer logos, and advertising creatives must never be assigned as seller profiles. Use distinct approved portraits per visible listing and fall back to the existing default profile icon when no approved photo is assigned.
- QA can open feed view directly with `?qf=guazi&view=feed`; the default `?qf=guazi` remains list view.
- 피드 보기(2026-10-10 「피드형이니 전체가 피드형」, 테스트 서버 dev.bbmuseum `car-list-feed-card` 390 실측): 모든 매물이 같은 큰 카드다(첫 매물만 크게 하던 초톳 규칙 폐지). 카드 위아래 12 + 아래 1px #EBEBEB, 사진 가로 꽉 참 358:207.3 · 반경 12 · 시간 11/600, 사진 → 제목 10, 제목 16/22.4 600 #1A1A1A, 사양 15/24 #9E9E9E, 가격 18/25.2 700(만원 16 400), 배지 20(11 · 500), 지역 14/18 #9E9E9E, 판매자 줄 34(프로필 20 · 이름 12/16.8 #3A3A3A) 오른쪽에 전화 · 채팅 · 찜 20(간격 24, 전화 아이콘은 dev 원본 `card-phone.svg`). 수치는 `src/prototype/listing/qf-m-view-modes.css`.
- List-view top-to-top rhythm: final title row → specification 24px, specification → price 20px, price → badge 17px, badge → location 36px, and location → seller 24px. Cards without a badge collapse the badge slot and use price → location 28px. Do not restore a fixed 195px minimum card height; the card follows its actual content.
- 과쯔 승용 샘플 매물 사진(2026-10-07): 실매물 사진 출처가 확정되기 전까지 같은 제조사·모델의 `public/assets/models/kr/{makerId}/{value}.png`(당근·보배드림 모델 이미지, CREDITS 있음)를 `imageFit: "contain"`으로 표시한다. 이 이미지가 없는 차종(제네시스 G80·아우디 A6·랜드로버·렉서스 ES300h·페라리 296·롤스로이스 팬텀)은 다른 차 사진 대신 빈 사진 칸을 쓴다. 엔카 캡처(`maker-model/generations`)는 쓰지 않는다.
- 목록 썸네일은 2026-10-07 크기 조정(그림 썸네일 연회색 바탕·여백 자른 사본, 실사 사진 contain)을 모두 원복했다(「강제로 조정하니 이상하다」). 그림 썸네일은 흰 바탕 6px 여백 contain, 실사 사진은 cover.
- 실사 목록 썸네일 정규화(2026-10-08 「썸네일들도 럭셔리카처럼」): `listing-photos/v01` · `bike/listings` · `heavy/listings` 실사 62장은 럭셔리카와 같은 규칙(분할 모델로 찾은 차 영역 기준 차 폭 = 칸의 90% · 바닥선 = 위에서 85%, 키 큰 차는 높이 75% 이하)으로 만든 600×600 사본(`…/thumb/이름.webp`, 표 `src/prototype/data/list-thumbs-v01.json`)을 목록 썸네일로 쓴다(`normalizedListThumb`). 여백 채우기는 배경이 고른 스튜디오 사진(도이치오토월드 3001~3004 · 포터2 · 할리)에만 하고, 야외 사진은 여백을 만들지 않고 사진 안에서 정사각으로만 잘라 차를 가운데·아래 85%에 둔다. 근접 촬영·광고 이미지·묶음 사진(바이크 001_v01 · 008 · 009_v01 · 019_v01 · 027, 건설기계 001 · 003 · 005 · 007 · 008 · 015 · 018 · 024 · 030)은 원본 그대로. 피드 대표 사진과 그림(contain)은 원본.
- `판매중` is not shown in the mobile seller row. Removing a filter chip or badge must also remove its reserved space; price, location, and seller content move together according to the no-badge rhythm.
- 위치 줄(2026-10-08): 중고차(승용)는 개인·딜러 모두 `시도 구군 · 단지`(예: `경기 수원시 · 도이치오토월드`, 「중고차 매물은 지역에 단지 붙이고」), 그 밖의 모든 카테고리(트럭·바이크·건설기계·캠핑카 등)는 `시도 구군`까지만(`placeSidoGugun`, 3단계 `경기 수원시 권선구`는 `경기 수원시`로).
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
- 트럭·특장 이미지·로고 퀵필터도 다른 카테고리와 동일하게 좌측 제목 슬롯을 사용하지 않는다. 형식·세부 형식·제조사·모델·세부모델은 PC 20px, 모바일 16px에서 바로 시작한다. 모바일 제조사 로고 반복 피치는 초톳과 같은 84px이고, 트럭 이미지 카드는 이미지 볼륨과 비겹침을 위해 기존 카드 폭·간격을 유지한다. 실사 이미지는 투명 원본의 가로 비율을 유지한 채 보이는 면을 모바일 76×48px, PC 88×55px로 잡는다.
- 목록은 승용 샘플을 재사용하지 않고 `truck/scenario-v01.ts`의 가상 트럭 30대만 사용한다.
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
- 트럭·특장 PC 상단 카드에서는 지역 칩 줄을 노출하지 않는다. 지역 선택은 PC 좌측 `트럭 전용 필터 > 지역`에서 제공하며 모바일 지역 UI는 유지한다.
- 트럭·특장 PC 상단의 기본 필터 칩과 형식·세부 형식·적재 규격·브랜드 빠른 선택 줄은 유지한다. PC에서 제거하는 것은 지역 칩 줄뿐이며 좌측 `트럭 전용 필터 > 지역`과 모바일 지역 UI도 유지한다.
- 2026-10-04 초톳 모바일 웹 직접 실측(Pixel 7 폭 412): 제조사 슬롯 64×56, 이미지 36×36, 이미지–명칭 간격 2px, 명칭 폭 56px(슬롯 좌우 4px), 명칭 12/500/18 `#595959`, 가운데 정렬이다. 트럭 형식·세부형식·유형도 이 텍스트 슬롯 규칙을 적용한다. 보배 실사 슬롯은 모바일 80px 폭에서 명칭 폭 72px, PC 132px 폭에서 명칭 폭 124px로 좌우 4px 여백을 유지하며, 이미지 아래 2px에서 12/500/18 `#595959` 명칭을 최대 두 줄로 줄바꿈한다. 말줄임표는 표시하지 않는다.
- 2026-10-04 트럭 매물 목록의 제조사 뎁스는 `형식 → 차급 → 톤수·규격` 선택이 끝난 뒤 같은 퀵필터 자리에 노출한다. 이 화면은 초톳 앱·카테고리 레일형 규격을 사용해 모바일 셀 76×102·PC 셀 84×102, 공통 로고 상자 40×40, 셀 간격 8px, 첫 시작 모바일 16px·PC 20px로 고정한다. 초톳 모바일웹 64×56 압축형은 다른 표면의 변형으로 구분한다.

### 초톳 필터 칩·목록 보기 원본 규칙 v47

- 모바일 필터 칩은 높이 32px, `#F4F4F4`, 모서리 9999px, 14/500/20, 내부 상하 4px·좌우 12px, 내부 간격 2px, 칩 사이 4px을 사용한다.
- 고정 필터 칩도 숫자 고정 폭을 두지 않고 문구에 따른 자연 폭을 쓴다. 한국어 `필터`와 베트남어 `Lọc`의 글자 폭 차이는 정상이다.
- 펼침 아이콘은 `public/assets/bbm/filter-toggle-chotot-v01.svg`의 노션 원본 패스를 수정하지 않고 20×20px 슬롯에 표시한다. CSS clip-path나 별도 재그리기는 금지한다.
- 모바일 보기 전환은 32×32px 터치영역을 유지하되 배경·테두리·원형 외곽선을 표시하지 않는다. 갤러리 화면의 목록형 복귀 아이콘은 `view-list-chotot-v02.svg` 원본을 20×20px로 표시한다.
- 모바일 목록형 썸네일은 120×120px, 반경 8px, 정보와 12px 간격이다. 제목 16/600/20 `#222`, 메타·위치 14/400/20 `#595959`, 가격 숫자 16/700/24 `#222` · 「만원」 16/400 `#222`(현대 인증중고차 방식, 빨강 사용 안 함), 판매자 12/400/18, 아바타 16px(JOB-8 초톳 재실측), 구분선 1px `#EBEBEB`(JOB-8 dev 동일), 좌우 여백 16px을 모든 카테고리의 공통 목록 컴포넌트에 적용한다.

### 트럭 유형 모달·바텀시트 v39

- 실제 목록 상단 칩과 PC 좌측 필터의 명칭은 `트럭 유형`으로 통일한다.
- 상위 유형은 카고(화물)트럭, 윙바디·탑차, 냉장·냉동차, 덤프·콘크리트차, 크레인·고소작업차, 탱크로리, 환경·폐기물차, 견인·운송차, 트랙터·트레일러, 특수차, 버스, 캠핑카·카라반, 기타 13개다.
- PC는 중앙 모달, 모바일은 바텀시트로 열며 동일한 트리·상태·대수를 사용한다.
- 행은 `체크박스 → 유형 이미지 → 명칭 → 대수 → 하위 화살표` 순서다. 하위 화살표는 자식이 있는 항목에만 표시한다.
- 헤더 64px, 모바일 제목 20/28px, 본문 좌우 20px, 체크박스 20px, 열 간격 12px, 하단 액션 80px·버튼 52px을 기준으로 한다.
- 트럭 유형 이미지 인지성 시안은 모바일 행 64px·PC 행 60px, 공통 이미지 표면 56×40px(`#F7F7F7`, `1px #ECECEC`, 반경 6px), `contain`·`center bottom`을 사용한다. 카고·윙바디·탱크로리·카고크레인은 앞머리가 왼쪽인 측면형 v02 샘플을 우선 연결하며 나머지 유형은 기존 이미지를 유지한다.
- 유형 이미지는 AutoScout24의 카탈로그형 정측면·균일 조명·고정 여백을 기본으로 하고, 한국·일본 상용차의 실제 차체 비례를 유지한다. 트럭은 흰색 캡을 공통 뼈대로 두고 용도를 결정하는 적재함·장비부에만 포인트 색을 준다: 윙바디 딥레드, 냉장·냉동 글래시어 블루, 도로용 덤프 스틸 블루그레이, 탱크로리 알루미늄 실버+블루 밴드, 견인 장비 오렌지. 산업용 노랑은 건설기계에만 사용한다. 로고·문자·번호판은 넣지 않으며, 90도 좌향 정측면·투명 배경·공통 기준선을 지킨다.
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

- 전체차량의 카테고리 레일에서 `중고차`를 누르면 하위 텍스트 메뉴를 거치지 않고 바로 승용 브랜드 로고 레일을 표시한다.
- `트럭/특장차`는 기존처럼 형식 이미지 레일로 바로 진입한다.
- `바이크`, `건설기계`, `자재운반장비`, `부품/용품`처럼 하위 항목이 `전체` 하나뿐인 카테고리는 중복 알약칩을 표시하지 않고 해당 카테고리의 다음 퀵필터 또는 목록으로 바로 진입한다.
- 실제 하위 선택이 있는 `캠핑카`만 `전체 · 모터홈 · 카라반 · 트레일러` 알약칩을 유지한다.

## 럭셔리카 카테고리 v01 (2026-10-08)

- 구조: 차량 › 중고차 › 럭셔리카(`?category=럭셔리카`, 카테고리 시트 중고차 하위 칩). 과쯔에서는 승용 샘플 대신 전용 가상 매물 29대(`src/prototype/data/luxury-category-v01.ts`)만 보여준다. 다른 카테고리·전체차량 목록은 바꾸지 않는다.
- 원천: 구글 시트 「가상 매물 시나리오 › 럭셔리카」(차량번호 · 등록연월 · 주행 · 연료 · 지역 · 차명, 중복 1행과 사진 없는 3대 제외)와 드라이브 매물 사진(파일명 = 차량번호). 사진은 차량번호 대신 `public/assets/cars/luxury-category-v01/lux-NN.webp`로 저장하고, 데이터의 `vehicleNumber`로만 대조한다(화면에 차량번호 미표시).
- 카드 메타: 제조사+모델(+세대·트림) / `등록연월 · 주행(축약) · 연료`(`cardSpec`, 시트 값 그대로 `26년01월(25년형)` · `가솔린+전기`) / `시도 구군 · 매매단지` / 판매자명 + 프로필.
- 매매단지는 KB차차차 마스터에 있는 실제 단지 16곳(서울 3 · 경기 2 · 인천 · 대전 · 부산 2 · 대구 · 광주 · 울산 · 경남 · 충북 · 제주)에 가상 딜러 16명을 두고 1~2대씩 배정한다(사용자 지시 「서울오토갤러리 등 전국으로 여러 개」). 데이터에 정한 단지를 그대로 쓰며 `dealerComplexByRegion`으로 바꾸지 않는다.
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
