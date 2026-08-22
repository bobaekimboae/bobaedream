# ChoTot Filter Research And Prototype Execution Brief

## Outcome

The deliverable is an interactive ChoTot-informed filter prototype inside the
existing Bobaedream GitHub listing draft. Drive screenshots and the Google
Sheet are implementation evidence, not the end of the work.

## Sources And Destinations

- Source: ChoTot used-car listing in the mirrored Galaxy S25 app.
- Screenshot Drive folder: <https://drive.google.com/drive/folders/1rC6tnQqcH4QODQT2Wu3MHL6L6UxlwYp-?usp=drive_link>
- GitHub repository: <https://github.com/bobaekimboae/bobaedream.git>
- Published draft: <https://bobaekimboae.github.io/bobaedream/>

## Required Research Loop

For every filter that ChoTot actually exposes, repeat the complete loop before
calling it implemented:

1. Capture the unfiltered listing and the filter entry point.
2. Open the filter and scroll its internal content from top to bottom.
3. Capture the top, middle, bottom, fixed CTA area, and every revealed child
   screen or expanded section.
4. Record every section and option in its observed order. Do not infer options
   from a partial screen.
5. Capture selection states: none, one selected, multiple selections when
   available, range entry where available, and child-filter states.
6. Capture the result after applying the condition, including result count,
   listing changes, filter chips, individual removal, and reset.
7. Add the evidence and behavior to the Google Sheet.
8. Implement the observed structure and behavior in the existing Bobaedream
   prototype, using its test listings.
9. Compare the ChoTot captures and the prototype, then record QA results.

The filter must be treated as incomplete if its final scroll position, fixed
CTA, reset behavior, or result state has not been observed.

## Screenshot Rules

Store captures in the supplied Drive folder using this format:

`[filter-order]_[filter-name]_[screen-order]_[state].png`

Examples:

- `01_전체필터_01_진입.png`
- `01_전체필터_02_중단스크롤.png`
- `01_전체필터_03_하단CTA.png`
- `02_제조사_01_기본.png`
- `02_제조사_02_선택후.png`
- `02_제조사_03_모델하위화면.png`
- `03_가격_04_적용후리스트.png`

Use Drive folders by filter group: list baseline, all filters, brand/model,
price, year/mileage, region, vehicle condition/history, specification,
seller/sort, applied results/reset, and empty/exception states.

## Google Sheet

Create `초톳 중고차 필터 UX 분석 및 보배드림 적용표` in the same Drive
folder. Include these tabs:

- `01_필터목록`: order, filter name, entry point, screen type, full scroll
  length, child filter, apply rule, reset rule, Drive folder.
- `02_화면구조`: filter order, screen order, scroll position, section name,
  section order, UI type, fixed/sticky state, capture link, notes.
- `03_선택항목`: filter order, section, option order, option name, choice
  type, single/multiple, default, state change, child-filter relationship.
- `04_상태전환`: start state, user action, result state, count change,
  listing change, chip change, dismiss/back behavior.
- `05_캡처목록`: filename, Drive link, filter, state, analysis complete,
  prototype complete.
- `06_보배드림매핑`: ChoTot evidence, Bobaedream data field, implementation
  rule, code file/function, completion status.
- `07_QA비교`: filter, comparison point, observed ChoTot behavior, prototype
  behavior, pass/fail, required correction.

## Prototype Requirements

- Work on a new branch named `codex/chotot-filter-research-prototype`.
- Keep the current listing/detail draft and its 15 test listings. Do not build
  a separate dummy project.
- Implement only filters confirmed by captured ChoTot evidence.
- Preserve the observed filtering order, section order, child dependencies,
  selection type, bottom-sheet/full-screen pattern, CTA behavior, reset, and
  dismiss/back rules.
- Translate labels into Korean used-car language and map to actual Bobaedream
  test data. Do not use ChoTot branding, logos, or listing images.
- Use the test listing data for real filtering. Multiple conditions use AND
  logic; displayed count must equal rendered cards.
- Support applied chips, individual removal, full reset, empty results, detail
  navigation, back-navigation state restoration, scroll restoration, and
  refresh persistence.

Expected implementation locations:

- `public/assets/chotot-filter-prototype.css`
- `public/assets/chotot-filter-prototype.js`
- Existing `index.html` and `public/assets/test-listings-override.js` only as
  needed for safe integration.

## Gate Before Implementation

Do not implement a filter until all of these are true:

- Top, middle, bottom, and CTA states were captured.
- All observed options and section order are entered in the Sheet.
- Selection, reset, dismiss/back, and result behavior are entered in the Sheet.
- Its Bobaedream data mapping is recorded.

## Completion

The work is complete only when every captured, analyzed filter has a linked,
working implementation in the current GitHub draft; a user can operate it and
observe the test listing result change. Record the comparison and residual
differences in `design-qa.md`, run the project checks, commit, and open a PR.
