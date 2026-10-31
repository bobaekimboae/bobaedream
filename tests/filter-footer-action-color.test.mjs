import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../src/prototype/filters/bbm-filter-parts.css', import.meta.url), 'utf8');
const rule = css.slice(css.indexOf('/* Bobaedream filter footer actions'));
const primaryClasses = [
  'bbmf-confirm', 'bbmf-seller-confirm', 'bbmf-category-confirm',
  'mf-confirm', 'maker-hierarchy-confirm', 'vehicle-picker-apply',
  'price-filter-confirm', 'region-confirm',
];

test('all eight filter footer variants use one exact blue token', () => {
  assert.match(rule, /--bbmf-footer-action-blue:\s*#306bd9;/i);
  for (const name of primaryClasses) assert.ok(rule.includes(`.${name}`), name);
  assert.match(rule, /background:\s*var\(--bbmf-footer-action-blue\) !important;/);
  assert.match(rule, /border-color:\s*var\(--bbmf-footer-action-blue\) !important;/);
  assert.match(rule, /color:\s*#fff;/);
});

test('portal-safe scope excludes frozen ChoTot and Dongchedi modes', () => {
  assert.equal((rule.match(/body:has\(\.marketplace\.is-qf-guazi\)/g) || []).length, 3);
  assert.doesNotMatch(rule, /body\s*\{|:root\s*\{/);
});

test('disabled footer actions and reset/cancel/option controls are excluded', () => {
  assert.equal((rule.match(/\):not\(:disabled\)/g) || []).length, 2);
  assert.doesNotMatch(rule, /\.(?:mf-reset|bbmf-reset|bbmf-seller-reset|mf-chip|bbmf-check-box)\b/);
});

test('Nuxt filter components share the patched stylesheet', () => {
  for (const name of ['BbmActionBar', 'BbmSheet', 'BbmModal', 'BbmFullFilter']) {
    const component = readFileSync(new URL(`../nuxt-site/components/filters/${name}.vue`, import.meta.url), 'utf8');
    assert.ok(component.includes('@proto/filters/bbm-filter-parts.css'), name);
  }
});
