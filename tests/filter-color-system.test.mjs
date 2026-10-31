import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const file = (name) => readFileSync(new URL(name, import.meta.url), 'utf8');
const css = file('../src/prototype/filters/filter-color-system.css');
const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
const rules = [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
const luminance = (hex) => {
  const values = hex.match(/[a-f\d]{2}/gi).map((v) => parseInt(v, 16) / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
};
const contrast = (a, b) => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };

test('all color rules are portal-safe Guazi-only and exclude independent bike/truck themes', () => {
  assert.ok(rules.length >= 20);
  for (const [, selector] of rules) {
    assert.ok(selector.trim().startsWith('html:not([data-site="bike"]):not([data-site="truck"]) body:has(.marketplace.is-qf-guazi)'), selector);
  }
});

test('one primary alias, accessible pale selection ink and explicit hover are defined', () => {
  assert.match(css, /--bbmf-accent: var\(--bbmf-footer-action-blue, #306bd9\)/);
  assert.match(css, /--bbmf-accent-soft: #edf3ff/);
  assert.ok(contrast('ffffff', '306bd9') >= 4.5);
  assert.ok(contrast('2456b3', 'edf3ff') >= 4.5);
  assert.ok(contrast('306bd9', 'ffffff') >= 3);
});

test('sliders cover active fill, handles, bubble, generic range and both native engines', () => {
  for (const selector of ['.mf-fill', '.mf-handle-dot', '.mf-bubble', '.bbmf-slider i', '.bbmf-slider b', '.price-range-line', '::-webkit-slider-thumb', '::-moz-range-thumb']) assert.ok(css.includes(selector), selector);
  assert.doesNotMatch(css, /\.mf-track\s*[,\{]/);
});

test('selection inventory includes presets, checks, mixed truck rows, switches, tabs and hierarchical pickers', () => {
  for (const selector of [
    '.mf-chip.is-selected', '.bbmf-presets button.is-selected', '.bbmf-color-chips button.is-selected',
    '.bbmf-choices button.is-selected', '.bbmf-tabs.is-side button.is-selected', '.bbmf-tabs:not(.is-side)',
    '.bbmf-check.is-checked:not(.is-disabled)', '.bbmf-seller-row.is-checked:not(.is-disabled)', '.bbmf-body-type-row.is-checked',
    '.truck-type-picker-row.is-partial', '.bbmf-keep-switch.is-on', '.bbmf-daangn-switch.is-on',
    '.maker-hierarchy-row.is-selected', '.vehicle-picker-grid button.is-selected', '.stable-region-cell.is-selected',
    '.region-menu button[aria-selected="true"]', '.bbm-category-child-pills button.is-selected', '.bbmf-bike-genre-row.is-checked',
    '.bbm-model-check', '.bbm-maker-name', '.car-list-toolbar-pop-modal__options .ui-btn.is-selected',
  ]) assert.ok(css.includes(selector), selector);
});

test('focus is scoped to filter controls and does not remove error, reset or disabled styles', () => {
  assert.match(css, /:focus-visible:not\(:disabled\)/);
  assert.match(css, /outline: 2px solid var\(--bbmf-accent\) !important/);
  assert.doesNotMatch(withoutComments, /\.bbmf-swatch|\.pf-error|\.mf-error|:disabled\s*\{|\.mf-reset\s*[,\{]/);
  assert.doesNotMatch(css, /--bbm-blue:|--blue:/);
  assert.doesNotMatch(css, /\.filter-chip|\.stable-pill|\.bbm-gnb/);
});

test('common stylesheet imports the palette before legacy rules, including Nuxt consumers', () => {
  assert.ok(file('../src/prototype/filters/bbm-filter-parts.css').startsWith('@import "./filter-color-system.css";'));
  for (const name of ['BbmSheet', 'BbmModal', 'BbmActionBar', 'BbmFullFilter']) assert.ok(file(`../nuxt-site/components/filters/${name}.vue`).includes('@proto/filters/bbm-filter-parts.css'));
});
