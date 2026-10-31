import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import { bbmToday, bbmYearOptions, bbmCurrentYearPreset, bbmYearBounds, bbmRegistrationDate, matchesBbmYear, bbmSingleYearLabel } from '../src/prototype/filters/bbm-year-range.ts';

const instant = new Date('2026-11-01T00:00:00Z');
const helperUrl = new URL('../src/prototype/filters/bbm-year-range.ts', import.meta.url).href;
const source = readFileSync(new URL('../src/prototype/filters/bbm-filter-state.ts', import.meta.url), 'utf8').replace('"./bbm-year-range"', JSON.stringify(helperUrl));
const state = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString('base64')}`);
const { emptyBbmFilters, setBbmRange, matchesBbmFilters, bbmYearPresetRange } = state;
const yearOnly = (year) => ({ filter: { year } });
const dated = (text) => ({ filter: { year: 2024 }, cardSpec: [text] });

test('presets use current Korean month, including UTC month/year boundaries', () => {
  assert.deepEqual(bbmToday(new Date('2026-10-31T15:00:00Z')), { year: 2026, month: 11 });
  assert.deepEqual(bbmToday(new Date('2026-12-31T15:00:00Z')), { year: 2027, month: 1 });
  assert.deepEqual(bbmYearPresetRange('~3년', instant), { min: '2023년 11월', max: '2026년 11월', preset: '~3년' });
  assert.deepEqual(bbmCurrentYearPreset('6년~', instant), { min: '', max: '2020년 11월', preset: '6년~' });
  assert.equal(bbmCurrentYearPreset('~1년', new Date('2027-01-01T00:00:00Z')).max, '2027년 1월');
});

test('year dropdown rolls forward without a hardcoded 2026 maximum', () => {
  const options = bbmYearOptions(new Date('2027-01-01T00:00:00Z'));
  assert.equal(options[0], '2027년');
  assert.equal(options.at(-1), '1980년');
  assert.equal(options.length, 48);
});

test('same-year and same-month applied chips do not duplicate the year suffix', () => {
  assert.equal(bbmSingleYearLabel('2024'), '2024년');
  assert.equal(bbmSingleYearLabel('2024년'), '2024년');
  assert.equal(bbmSingleYearLabel('2024년 11월'), '2024년 11월');
});

test('month bounds are inclusive and year-only rails cover the entire year', () => {
  assert.deepEqual(bbmYearBounds({ min: '2024년 3월', max: '2024년 6월' }), { min: 202403, max: 202406, valid: true });
  assert.deepEqual(bbmYearBounds({ min: '2024', max: '2024' }), { min: 202401, max: 202412, valid: true });
  for (const [month, expected] of [[2, false], [3, true], [6, true], [7, false]]) {
    assert.equal(matchesBbmYear(dated(`24년${month}월`), { min: '2024년 3월', max: '2024년 6월' }), expected);
  }
});

test('preset-only saved values use the same current month contract', () => {
  assert.deepEqual(bbmYearBounds({ min: '', max: '', preset: '~3년' }, instant), { min: 202311, max: 202611, valid: true });
  assert.equal(matchesBbmYear({ registrationYearMonth: '2023-10' }, { min: '', max: '', preset: '~3년' }, instant), false);
});

test('explicit registration month wins over model-year and card text', () => {
  assert.deepEqual(bbmRegistrationDate({ ...dated('24년03월'), registrationYearMonth: '2023-12' }), { year: 2023, month: 12 });
  assert.deepEqual(bbmRegistrationDate({ ...dated('24년03월'), filter: { year: 2022, registrationMonth: 7 } }), { year: 2022, month: 7 });
  assert.deepEqual(bbmRegistrationDate({ filter: { year: 2025 }, specs: ['24년08월(25년형)'] }), { year: 2024, month: 8 });
  assert.deepEqual(bbmRegistrationDate({ specs: ['99년12월'] }), { year: 1999, month: 12 });
});

test('unknown month is not invented and matches only a fully covered year', () => {
  assert.equal(matchesBbmYear(yearOnly(2024), { min: '2024년 3월', max: '2024년 12월' }), false);
  assert.equal(matchesBbmYear(yearOnly(2024), { min: '2024년 1월', max: '2024년 12월' }), true);
  assert.equal(matchesBbmYear(yearOnly(2024), { min: '2023년 11월', max: '2025년 11월' }), true);
  assert.equal(matchesBbmYear({}, { min: '2024', max: '' }), false);
  assert.equal(matchesBbmYear({}, { min: '', max: '' }), true);
});

test('open-ended ranges include their boundary month', () => {
  assert.equal(matchesBbmYear(dated('24년03월'), { min: '2024년 3월', max: '' }), true);
  assert.equal(matchesBbmYear(dated('24년02월'), { min: '2024년 3월', max: '' }), false);
  assert.equal(matchesBbmYear(dated('24년03월'), { min: '', max: '2024년 3월' }), true);
  assert.equal(matchesBbmYear(dated('24년04월'), { min: '', max: '2024년 3월' }), false);
});

test('invalid, orphan-month and inverted ranges cannot silently match everything', () => {
  for (const range of [
    { min: '2024년 13월', max: '' }, { min: '11월', max: '' },
    { min: '2024년 7월', max: '2024년 6월' }, { min: '', max: '', preset: 'bogus' },
  ]) assert.equal(matchesBbmYear(dated('24년06월'), range), false);
  assert.equal(matchesBbmYear({ registrationYearMonth: '2024-00' }, { min: '2024', max: '2024' }), false);
});

test('real listing predicate applies months, AND conditions, facet exclusion and reset', () => {
  const car = { title: '현대 테스트', sellerType: '개인', photos: 1, price: '2,000 만원', cardSpec: ['24년06월'], filter: { year: 2024, fuel: '디젤' } };
  const june = setBbmRange(emptyBbmFilters, 'year', { min: '2024년 6월', max: '2024년 6월' });
  const july = setBbmRange(emptyBbmFilters, 'year', { min: '2024년 7월', max: '2024년 7월' });
  assert.equal(matchesBbmFilters(car, june), true);
  assert.equal(matchesBbmFilters(car, july), false);
  assert.equal(matchesBbmFilters(car, july, 'year'), true);
  assert.equal(matchesBbmFilters(car, { ...june, checks: { fuel: ['가솔린'] } }), false);
  assert.equal(matchesBbmFilters(car, state.clearBbmKey(july, 'year')), true);
  assert.deepEqual(state.bbmRangeBounds('year', june.ranges.year), { min: 202406, max: 202406, valid: true });
});

test('Nuxt and deployed panels use the same year helper and preset', () => {
  const panels = readFileSync(new URL('../src/prototype/filters/bbm-filter-panels.tsx', import.meta.url), 'utf8');
  const nuxt = readFileSync(new URL('../nuxt-site/lib/filters/bbm-filter-panels.ts', import.meta.url), 'utf8');
  for (const text of [panels, nuxt]) {
    assert.ok(text.includes('bbmYearOptions()'));
    assert.doesNotMatch(text, /const thisYear = 2026/);
  }
});
