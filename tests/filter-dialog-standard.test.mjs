import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const yearUrl = new URL('../src/prototype/filters/bbm-year-range.ts', import.meta.url).href;
const stateSource = read('src/prototype/filters/bbm-filter-state.ts').replace('"./bbm-year-range"', JSON.stringify(yearUrl));
const state = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(stateSource)).toString('base64')}`);
const { emptyBbmFilters: empty, hasBbmFilterConditions, bbmFilterSignature, bbmDialogRangeError, setBbmRange, setBbmChecks, resetBbmFilters, matchesBbmFilters } = state;

test('reset availability ignores history, selection order and empty containers', () => {
  assert.equal(hasBbmFilterConditions(empty), false);
  assert.equal(hasBbmFilterConditions({ ...empty, history: 3, order: ['old'], checks: { fuel: [] }, ranges: { price: { min: '', max: '' } } }), false);
  assert.equal(hasBbmFilterConditions(setBbmChecks(empty, 'fuel', ['디젤'])), true);
  assert.equal(hasBbmFilterConditions({ ...empty, priceTab: '리스 / 렌트' }), true);
  assert.equal(hasBbmFilterConditions({ ...empty, keyword: '가나다' }), true);
});
test('multiselect comparison has stable search meaning', () => {
  assert.equal(bbmFilterSignature(setBbmChecks(empty, 'fuel', ['디젤', '가솔린'])), bbmFilterSignature(setBbmChecks(empty, 'fuel', ['가솔린', '디젤'])));
});
test('draft changes and reset do not mutate the applied filter', () => {
  const applied = setBbmChecks(setBbmRange(empty, 'price', { min: '1000', max: '4000' }), 'fuel', ['가솔린']);
  const original = structuredClone(applied);
  const draft = setBbmChecks(applied, 'fuel', ['디젤']);
  const cleared = resetBbmFilters(draft);
  assert.deepEqual(applied, original);
  assert.deepEqual(draft.ranges.price, applied.ranges.price);
  assert.equal(hasBbmFilterConditions(cleared), false);
});
test('numeric and year/month inversions fail while open and same-value ends pass', () => {
  assert.equal(bbmDialogRangeError(empty), null);
  for (const key of ['price', 'mileage', 'power', 'length']) {
    assert.ok(bbmDialogRangeError(setBbmRange(empty, key, { min: '3000', max: '1000' })));
    assert.equal(bbmDialogRangeError(setBbmRange(empty, key, { min: '3000', max: '3000' })), null);
    assert.equal(bbmDialogRangeError(setBbmRange(empty, key, { min: '3000', max: '' })), null);
  }
  assert.ok(bbmDialogRangeError(setBbmRange(empty, 'year', { min: '2025년 3월', max: '2025년 2월' })));
  assert.ok(bbmDialogRangeError(setBbmRange(empty, 'year', { min: '잘못된 연식', max: '' })));
});
test('zero matches are valid search conditions, not validation errors', () => {
  const value = setBbmRange(empty, 'price', { min: '90000', max: '' });
  assert.equal(bbmDialogRangeError(value), null);
  assert.equal(matchesBbmFilters({ title: '테스트', sellerType: '딜러', photos: 1, price: '3000' }, value), false);
  const part = read('src/prototype/filters/bbm-filter-parts.tsx');
  assert.match(part, /disabled=\{confirmDisabled\}/);
  assert.doesNotMatch(part, /disabled=\{count\s*(?:===|<=)/);
  assert.match(part, /confirmLabel \?\? `\$\{formatCount\(count\)\}대 보기`/);
});
test('all CSS rules retain portal-safe car/Guazi scope and independent-site exclusions', () => {
  const css = read('src/prototype/filters/filter-dialog-standard.css').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const rule of css.split('}').filter((rule) => rule.includes('{'))) {
    const selector = rule.split('{')[0].trim();
    assert.match(selector, /html:not\(\[data-site="bike"\]\):not\(\[data-site="truck"\]\) body:has\(\.marketplace\.is-qf-guazi/);
  }
  for (const token of ['--bbmf-dialog-header: 56px', '--bbmf-dialog-header: 64px', '--bbmf-dialog-title: 18px', '--bbmf-dialog-title: 20px', '--bbmf-dialog-action: 52px', '--bbmf-dialog-action: 48px', 'env(safe-area-inset-bottom, 0px)', 'min-width: 72px', 'width: 44px; height: 44px', 'box-shadow: none', 'border-radius: 12px']) assert.ok(css.includes(token), token);
  for (const selector of ['.bbmf-modal-header', '.bbmf-sheet-header', '.bbmf-full-header', '.mf-header', '.bbmf-actions', '.bbmf-seller-actions', '.bbmf-category-actions', '.mf-actions', '.maker-hierarchy-actions', '.vehicle-picker-actions', '.price-filter-actions', '.region-actions']) assert.ok(css.includes(selector), selector);
});
test('stylesheet uses shared import and does not touch vehicle artwork or the page header', () => {
  assert.match(read('src/prototype/filters/bbm-filter-parts.css'), /@import "\.\/filter-dialog-standard.css"/);
  assert.doesNotMatch(read('src/prototype/filters/filter-dialog-standard.css'), /\.bbmf-swatch|\.brand-logo|\.bbm-header/);
});
test('top chip and nested full-filter fields have separate transactional values', () => {
  const page = read('src/prototype/listing/index.tsx');
  assert.match(page, /const panelValue = bbmChipDraft \?\? bbmValue/);
  assert.match(page, /const setPanelValue = setBbmChipDraft/);
  assert.match(page, /const sheetValue = bbmItemDraft \?\? fullValue/);
  assert.match(page, /onConfirm=\{\(\) => \{ setSheetValue\(sheetValue\); closeFullItem\(\); \}\}/);
  assert.doesNotMatch(page, /setBbmFilters\(sheetValue\); closeFullItem/);
});
test('ordinary PC options use reset plus counted apply, not cancel plus uncounted selection', () => {
  const sidebar = read('src/prototype/listing/pc-bbmuseum.tsx');
  assert.doesNotMatch(sidebar, /confirmLabel="선택완료"/);
  assert.match(sidebar, /confirmDisabled=\{Boolean\(bbmDialogRangeError\(draft\)\)\}/);
});
test('region selection stays in a draft and gets the same explicit action bar', () => {
  const source = read('src/prototype/listing/stable-top.tsx');
  assert.match(source, /const \[draft, setDraft\] = useState\(value\)/);
  assert.match(source, /count=\{countOf\(draft\)\}/);
  assert.match(source, /onConfirm=\{\(\) => \{ onChange\(draft\); onClose\(\); \}\}/);
});
test('manufacturer action count reuses the actual listing predicate, not metadata totals', () => {
  const source = read('src/prototype/listing/index.tsx');
  assert.match(source, /const baseListCars = useMemo\(\(\) => carsForVehicleSelection\(\)/);
  assert.match(source, /countOfSelection=\{\(nextMaker, nextModel, nextGeneration\) => carsForVehicleSelection/);
  assert.match(read('src/prototype/listing/maker-hierarchy-modal.tsx'), /const resultCount = countOfSelection\(draftMaker, draftModel, draftGeneration\)/);
});
