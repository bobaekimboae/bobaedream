# Design QA

- Source visual truth: `/workspace/scratch/b09ba51c4538/generated_images/exec-e67dfdf8-4d8f-46a6-82dc-2248aa4f3d18.png`
- Source pixels: 852 × 1846, DPR not embedded
- Implementation: `http://terminal.local:4173/`
- Implementation screenshot: `cloud-browser://Chrome/-2762-4281-944e-a6d33ed2d812/2026-08-13T01:00:45+09:00`
- Browser viewport: 1363 × 936 CSS px, DPR 1
- App content frame: 720 × 1776.5 CSS px, centered
- State: vehicle information expanded, `직접 입력` selected, sample BMW X3 loaded
- Normalization: source and implementation were reviewed together at fitted display scale; surrounding desktop canvas was excluded from visual findings.

**Findings**

- No actionable P0, P1, or P2 issues remain.
- The new three-way input selector is an intentional product extension above the source vehicle fields. It retains the source hierarchy, white surface, blue selected state, thin dividers, and compact density.
- Fonts and typography: Pretendard-compatible Korean sans hierarchy, weight contrast, truncation, and small-label legibility are consistent with the selected visual direction.
- Spacing and layout rhythm: the 720 px centered frame preserves the compact mobile composition; the new selector uses equal-width tracks and does not push persistent actions out of view.
- Colors and tokens: blue active state, neutral gray borders, white surfaces, green completion state, and secondary gray copy remain consistent.
- Image quality: supplied BMW photos remain sharp, correctly cropped, and are not replaced by placeholders or generated UI art.
- Copy and content: `직접 입력`, `매물 URL`, and `차량번호` are concise and mutually exclusive. URL and plate modes explain their result and offer `직접 수정` as a recovery path.

**Primary interactions tested**

- Switched between all three vehicle-input tabs.
- Entered a sample listing URL and completed the information-load state.
- Entered `63어0894`, ran the plate-format check, and completed the vehicle lookup state.
- Returned to direct entry and verified all editable vehicle fields.
- Confirmed the seller section and persistent preview/generate actions remain present.

**Console review**

- No application-origin runtime error was introduced by the change.
- One React hydration warning is attributable to attributes injected into the `<html>` element by the cloud-browser extension and is not produced by the application markup.

**Full-view comparison evidence**

- The source visual and browser-rendered implementation were emitted together in one comparison view.
- Above-the-fold hierarchy, vehicle summary, completion bar, expanded vehicle section, row density, and sticky actions were checked.

**Focused region comparison evidence**

- Vehicle information region was checked in direct, URL, and plate states. A separate crop was unnecessary because field labels, active tabs, button states, and result card copy were readable in the 720 px app frame.

**Comparison history**

- Initial extension: added equal-width three-way selector, mode-specific URL/plate panels, loaded-result summary, and direct-edit recovery.
- Post-fix evidence: both import modes reached a visible result state; direct mode returned to the selected visual's row structure without layout breakage.
- Latest iteration: moved vehicle features into a dedicated expanded section with selected count and 30-feature entry point; split voice and music into independent accordions.
- Latest fix: browser QA found white-on-white voice action buttons. Added a scoped blue action-button override and rechecked both buttons at `rgb(31, 99, 233)` background with white text.
- Latest interaction evidence: feature count changed 3→4 on selection, voice speed control rendered, music volume control rendered, and no application-origin console errors were present.
- Preview text cleanup: removed template name, scene counter, plate-protection label, status badges, feature/meta duplication, and editor-only footer text from the 9:16 frame. When the synchronized caption already names the make/model/trim, the lower vehicle name now hides automatically.
- Preview/export parity: generated canvas output now uses the same reduced hierarchy—synchronized caption plus price, and vehicle name only when the caption does not already identify the vehicle.
- Post-fix browser evidence: the first frame contained only `오늘의 추천 매물, 2016 BMW X3` and `1,490만원`; all audited forbidden strings were absent and no application-origin console errors were found.

**Follow-up polish**

- P3: format mileage and price inside direct-entry fields while keeping raw numeric values in state.

**Implementation Checklist**

- [x] Three mutually exclusive input methods
- [x] Mode-specific fields only
- [x] URL import state
- [x] Korean vehicle-number validation and lookup state
- [x] Shared downstream vehicle data
- [x] Responsive styling
- [x] Lint and production build
- [x] Cloud-browser interaction verification

final result: passed
