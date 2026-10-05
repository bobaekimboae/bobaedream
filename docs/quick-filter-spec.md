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
- Guazi (QF-100, preview only; 2026-10-03 재실측으로 규격 갱신): `&qfcard=plain` switches the maker/model/sub-model rails to a ChoTot-style plain look (`.marketplace.is-qf-plain`, `src/prototype/listing/qf-plain.css`); without it the default Guazi cards are unchanged. ChoTot brand-row measurements from four 1080×2340 captures at 384 CSS px: PC cell 84×102, pitch 92; mobile cell 76×102, pitch 84; both use a 40×40 logo box at top 6 and name 14/21 400 #595959 14 below. No background/border/selected state; pressed opacity 0.6 for 0.1s. Logo inside box: r ≤ 1.25 long side 82.5%, 1.25 < r < 1.6 width 91%, r ≥ 1.6 width 100%, centered. Rail gap below the chip row PC 16 · mobile 10; mobile first cell 4px left of the first chip. Model/sub-model rails use a separate photo slot: PC cell 84×102, mobile cell 72×102 with 8px gap; mobile image canvas 64×40 at top 6, `contain`, `center bottom`; name 14/21 600 #222 14 below; sub text 12/16 #8C8C8C. Measurements and rulebook: Google Sheet `보배드림 브랜드 로고·실사 슬롯 규칙 v01`.
- Guazi (QF-100 final): the plain ChoTot-style rails are the Guazi default (no parameter or `&qfcard=plain`); `&qfcard=card` shows the previous Guazi cards for comparison. Gap from the chip row to the maker/model/sub-model rail is PC 18 · mobile 14 (ChoTot's filter-chip row → region-chip row); if a region-chip row is added later, that row → maker rail is PC 16 · mobile 10. Model card second line is the body type in both looks (no listing count); sub-model second line stays the years.
- Guazi (QF-105): the trim rail is a ChoTot pill row in every Guazi look (`.marketplace.is-qf-guazi`, `src/prototype/listing/qf-trim.css`): white, 1px #DDDDDD, height 32, fully rounded, 16 side padding, 14px 400 #222, 8 gap, horizontal scroll, pressed opacity 0.6; no leading `전체` chip and no selected style. Start with all trims; pressing a pill applies that one trim at once, adds a black step chip after the sub-model chip (`[벤츠][C클래스][W206][C200 ×]`), closes the rail, and appends the trim to the title and breadcrumb; its × clears only the trim and reopens the rail. A sub-model with one trim shows no trim rail. Trim rail box = pill 32 (PC: chip row → pill 18, pill → top-card end 16; mobile: 2 above, 6 below). Rail labels (`모델` `세부모델` `트림`) are 14px 400 #595959 without colon, text left = first chip left (PC 140 at 1440, mobile 16), 12 to the first cell/pill, vertically centered on the cells. The left filter grade list keeps multi-select.
- Guazi (QF-103): rail vertical spacing follows ChoTot (plain and card; `src/prototype/listing/qf-rail-vertical.css`). PC: the maker/model/sub-model rail box equals the cell height (maker 102, model/sub-model their cell height; card 72), no overflow, chip row → cell 18, cell bottom → top-card end 16; the 110 quick slot shrinks to the rail and disappears when no rail is shown (trim chosen), so chip row → top-card end is 16. Mobile: rail box = 2 above + cells + 6 below (chip row → cell 12). Horizontal scrollbars are hidden. Check: `npm run check:rail-vertical` (`-- --mode=card` for the card look).

## Stable Top (QF-106)

- Guazi PC·mobile top structure follows `docs/stable-top-manual.md` (v1.1 in QF-106; v1.3 document, v1.2 layout applied in QF-106b) (layer tables, gaps, cell sizes, state table). `npm run check:stability` values must match that document; it replaces `check:rail-vertical` (QF-103 rules kept: rail box = cell height, no overflow, hidden scrollbars).
- Title is fixed by the entry category: `중고차` / `국산 중고차` / `수입 중고차` (no counts, dates, or chosen conditions). `<title>` is unchanged.
- PC (QF-106b, manual v1.2): layer 0 crumbs sit outside the card on the gray page (header → 16, 18 tall, same left edge as the card, crumbs → card 12). Card: 16 → ① title row 32 → 18 → ② chip row 32 → 18 → ③ region pill row 32 (always; `지역:` + regions + `내 주변`; single select, re-click clears) → 16 → ④ quick slot (always) → card end 16 (image row) / 24 (pill row). Only two card heights (plain 282 / pill 220; card look 252 / 220).
- Mobile: ① search 40 (top 10) → 8 → ② `지역: 전국 ▾` 32 (no region pill row; chosen region shows as `[서울 ×]` chip) → 10 → ③ chips 32 gap 4 → 14 → ④ slot (2 + cell + 6; first cell/label x = first chip − 4) → ⑤ 8px gray band, crumbs, title, related keyword pills 28.
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
- Plain logo size inside the shared 40×40 box by ratio r: r ≤ 1.25 long side 82.5% (33); 1.25 < r < 1.6 width 91% (36.4); r ≥ 1.6 width 100% (40). Mobile and PC use the same optical rule. ChoTot comparison: `node scripts/brand-rail-compare.mjs` (scale 4, painted bounds).

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
- 모바일 앱의 `숏폼매물`은 초톳 앱처럼 별도 스위치 없이 문구 자체를 누르는 텍스트 필터로 사용한다. 선택 상태는 초톳 실측 규격(높이 28px·좌우 8px·99px 라운드·12/18px 700·16px 해제 아이콘·무테두리·무그림자)을 따르고, 색상만 보배드림 Airbnb형 `#222` 배경·흰 글자로 바꾼다. PC는 문구 오른쪽의 38×22px 스위치(손잡이 16px·내부 여백 3px·이동 16px)를 유지한다.
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

- 초톳 원본처럼 퀵필터 이미지·로고 레일 아래에 제어행 하나만 둔다. 별도의 `숏폼매물` 행과 판매자 탭 행으로 나누지 않는다.
- 왼쪽부터 `숏폼매물 → 개인 → 딜러 → 정렬 → 보기 방식` 순서다. 세로 구분선은 두지 않으며, `전체`와 `브랜드` 탭도 이 모바일 제어행에 표시하지 않는다.
- 제어행은 높이 48px, 좌우 16px, 상하 8px이며 아래에 1px 구분선을 둔다. 정렬과 비선택 탭은 14/20px, 정렬 600·탭 500이다.
- `숏폼매물`, `개인`, `딜러`는 텍스트 탭이다. 선택된 항목만 초톳과 같은 높이 28px·좌우 8px·99px 라운드·12/18px 700·16px 해제 아이콘·무테두리·무그림자로 바뀌며, 색상만 `#222` 배경·흰 글자를 사용한다. 숏폼과 판매자 선택은 동시에 표시할 수 있다.
- 정렬은 아래 방향 꺾쇠, 보기 방식은 24px 4칸 그리드 아이콘을 사용한다. 좁은 화면에서는 왼쪽 선택 탭 묶음만 가로 스크롤하며 오른쪽의 정렬과 보기 방식은 고정한다.
- PC도 `숏폼매물` 문구 + 38×22px 스위치를 사용한다.

- These rules apply to the Guazi Bobaedream mobile listing (`.bbm-m-list`) at the 384px CSS-width reference. List and feed typography are intentionally different; do not merge their font-size rules.
- A vehicle title is always two semantic rows, not one title that happens to wrap: row 1 is manufacturer + model (`.bbm-card-model`), and row 2 is detailed model/trim (`.bbm-card-trim`). Each row stays on one line and ellipsizes independently. Do not add an arbitrary margin between the detailed-model row and the specification row.
- List view: title 15/19 600, specification 13px, location 13px, seller 12px, price 16px 700, and price unit 14px. Feed view: title 16/24, specification 14px, location 14px, price 17px 700, and price unit 14px.
- The first specification follows the compact Charancha registration-month notation instead of Encar-style slash notation: month known = `24년08월` (two-digit month, no space, no `식`), month unknown = `24년식`. Keep the source value unchanged and normalize only the listing display. Do not use `24/08식` or `24년 8월`.
- The unselected listing-card favorite icon uses the ChoTot reference SVG at 24px with `#8C8C8C`; the selected state keeps the same silhouette and changes only its fill color.
- In mobile list and feed views, place the favorite action at the right edge of the first vehicle-title row, following the Karrot card pattern. Reserve space only on the model row so the trim row keeps its full width. Gallery keeps the favorite over the photo, and text view keeps its compact top-right placement.
- Seller profile photos in list and feed views are always 20×20px circles with `object-fit: cover` and centered cropping. The ChoTot source pack is retained in full, but vehicle-only photos, brand/dealer logos, and advertising creatives must never be assigned as seller profiles. Use distinct approved portraits per visible listing and fall back to the existing default profile icon when no approved photo is assigned.
- QA can open feed view directly with `?qf=guazi&view=feed`; the default `?qf=guazi` remains list view.
- Feed view follows the measured ChoTot hierarchy at 384px: only the first result is a full-width featured card; every following result returns to the horizontal image-left/content-right card. The featured image uses an approximately 7:5 frame with an 8px radius, while following feed thumbnails are 120×120px. The Bobaedream UI-test headline between trim and specs is the only intentional information row added to that hierarchy.
- List-view top-to-top rhythm: final title row → specification 24px, specification → price 20px, price → badge 17px, badge → location 36px, and location → seller 24px. Cards without a badge collapse the badge slot and use price → location 28px. Do not restore a fixed 195px minimum card height; the card follows its actual content.
- Feed-view rhythm: image bottom → title 15px, title → specification 24px, specification → price 23px, price → location 28px, and location → seller 19px.
- `판매중` is not shown in the mobile seller row. Removing a filter chip or badge must also remove its reserved space; price, location, and seller content move together according to the no-badge rhythm.
- The location line uses `지역 · 단지명` for every non-private seller and region only for `개인`. A generic `매매단지` suffix is not accepted: use a real complex name from the KB차차차 regional complex master (`지역별_매매단지`) and keep the displayed region consistent with the complex's actual location.
- Keep the canonical complex name in source data. Only the listing label is compacted: `자동차매매단지` and `매매단지` become `단지` (`강남자동차매매단지` → `강남단지`, `판교매매단지` → `판교단지`). Proper names such as `도이치오토월드`, `서울오토갤러리`, `성수모터시티`, and `제주오토파크` remain unchanged. Detail views may show the full canonical name.
- Complex source checked on 2026-10-02: `https://docs.google.com/spreadsheets/d/1c9uhwF-a1qspoK8PgylBxKiruodytuvy/edit` (`KB차차차_지역별_매매단지_마스터_20260826.xlsx`). Treat it as read-only reference data.

## Existing Mode Notes

## 차량 기준표 정적 검색·이미지

- 승용 제조사·모델그룹·세대는 `public/data/vehicle-catalog/cars-index-v1.json`을 첫 화면에서 불러오고, 연료·구동·등급·세부등급 검색 색인은 검색창을 처음 누를 때만 `cars-search-v1.json`에서 불러온다.
- 바텀시트 하위 단계는 `cars/{makeId}.json` 제조사별 파일을 선택 시점에만 불러온다. 바이크도 `bikes-index-v1.json`, `bikes-search-v1.json`, `bikes/{makeId}.json`으로 같은 규칙을 쓴다.
- 공개 JSON은 표시용 경로·이름·세대코드·연월·판매상태·정렬 순위만 허용한다. 엔카 코드·엔카 이미지 경로·매물 수·가격·라이트바겐 ID·외부 URL은 금지한다.
- 지리와 바이크 `숨김 제안` 제조사는 공개 색인에서 제외한다.
- 검색은 띄어쓰기·하이픈·대소문자를 무시하고 영문 시리즈 표기, 초성, 브랜드 별칭, 세대코드를 지원한다. 결과 순서는 완전 일치 → 앞부분 일치 → 포함, 동일 이름은 최신 세대 우선이다.
- 검색 결과는 로고·세대 이미지 또는 회색 실루엣·전체 경로·연식을 표시한다. 선택하면 제조사/모델그룹/세대/최종 등급 칩을 세팅하고 같은 위치로 차량 바텀시트를 연다.
- 제조사 로고는 `public/assets/vehicle-catalog/logos/logo_{영문}.png` 256×256 투명 PNG를 사용한다. 원본이 없거나 사용자가 직접 등록하기로 한 KGM은 임의 대체하지 않고 자리표시로 둔다.
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
- 모바일 목록형 썸네일은 120×120px, 반경 8px, 정보와 12px 간격이다. 제목 16/600/20 `#222`, 메타·위치 14/400/20 `#595959`, 가격 16/700/24 `#E5193B`, 판매자 12/400/18, 아바타 20px, 구분선 1px `#F4F4F4`, 좌우 여백 16px을 모든 카테고리의 공통 목록 컴포넌트에 적용한다.

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

## 카테고리 진입 동작

- 전체차량의 카테고리 레일에서 `중고차`를 누르면 하위 텍스트 메뉴를 거치지 않고 바로 승용 브랜드 로고 레일을 표시한다.
- `트럭/특장차`는 기존처럼 형식 이미지 레일로 바로 진입한다.
- `바이크`, `건설기계`, `자재운반장비`, `부품/용품`처럼 하위 항목이 `전체` 하나뿐인 카테고리는 중복 알약칩을 표시하지 않고 해당 카테고리의 다음 퀵필터 또는 목록으로 바로 진입한다.
- 실제 하위 선택이 있는 `캠핑카`만 `전체 · 모터홈 · 캐러밴` 알약칩을 유지한다.

## 유형별 가상 매물과 브랜드

- 전용 데이터가 없던 `캠핑카`, `자재운반장비`, `부품/용품`은 승용 샘플을 재사용하지 않는다.
- 세 유형은 `category-virtual-scenario-v01.ts`의 전용 가상 매물을 각각 30개씩 사용한다. 판매자명·주소·가격·연식은 UI 검증용 가상 정보이며 실제 매물로 해석하지 않는다.
- 각 유형의 브랜드 빠른 선택은 전용 브랜드 10개와 `전체 브랜드` 한 칸으로 구성한다. 실제 인기 순위가 아니라 가상 매물 v01의 검증용 구성임을 브랜드 매니페스트에 명시한다.
- 캠핑카: 현대 · 기아 · 르노코리아 · 제일모빌 · 코치맨 · 벤츠 · 포드 · 피아트 · 아드리아 · 하이머.
- 자재운반장비: 현대머티리얼핸들링 · 두산밥캣 · 토요타L&F · 미쓰비시로지스넥스트 · 코마츠 · 클라크 · 헬리 · 항차 · 융하인리히 · 린데.
- 부품/용품: 한국타이어 · 금호타이어 · 넥센타이어 · 현대모비스 · 미쉐린 · 브리지스톤 · BBS · OZ레이싱 · 브렘보 · 보쉬.
- 브랜드 하나를 선택하면 해당 브랜드의 검증용 매물 3개로 좁혀진다. 목록은 첫 페이지 20개·둘째 페이지 10개다.
- 전용 실사 이미지가 아직 없는 항목은 유형별 기존 승인 이미지 슬롯을 임시로 재사용하며, `UI 검증용 가상 매물` 문구를 상세 모델 줄에 표시한다.

## 제조사·모델 모달 헤더

- 제조사·모델 모달의 공통 외곽은 QF-117 주행거리 바텀시트를 기준으로 한다. 헤더 높이 64px, 하단 구분선 1px `#E8E8E8`, 제목 20/28px·750·`-0.35px`, 닫기 버튼 44×44px 터치 영역과 24×24px X를 사용한다.
- 루트 제조사 화면은 제목을 왼쪽 24px에 두고 닫기 터치 영역의 오른쪽 끝을 20px에 둔다. 제목을 가운데 정렬하지 않는다.
- 모델·세부모델·등급 하위 화면은 왼쪽 이전 버튼 44×44px 터치 영역과 오른쪽 닫기 버튼 44×44px을 사용한다. 헤더 좌우 여백은 16px이며 이전 아이콘 다음 제목의 보이는 간격은 8px, 제목 시작점은 x=56px이다. 두 아이콘은 24×24px이며 헤더 세로 중앙선이 같아야 한다.
- 선택 경로 행의 32px 원형 X는 목록 행의 오른쪽 화살표 중심축과 맞춘다. 384px 화면에서 두 컨트롤 중심은 모두 오른쪽에서 28px이며, 매물 수는 그 왼쪽 열에서 오른쪽 정렬한다.
- 이전·닫기 버튼은 초톳 원본 계열 아이콘을 유지한다. 기본 배경과 테두리는 없고 모서리는 10px이며 hover 배경과 키보드 focus outline만 제공한다.
- 하단 액션은 QF-117과 동일하게 `80px + safe area`, 좌우 20px, 위 12px, 아래 `16px + safe area`, 버튼 간격 10px을 사용한다. 초기화는 92×52px·투명 배경·12px 모서리, `N대 보기`는 남은 폭×52px·`#222`·12px 모서리다. 선택값이 없을 때 초기화는 `#B7B7B7`과 disabled 상태다.
- 체크형 행은 체크박스 20×20px, 텍스트 간격 12px을 사용한다. 구분선은 체크박스가 아니라 텍스트 시작점부터 오른쪽 끝까지 긋고 마지막 행에는 표시하지 않는다. 로고가 있는 제조사 행은 v4 규칙대로 개별 구분선을 두지 않고 섹션 사이 회색 띠만 유지한다.
