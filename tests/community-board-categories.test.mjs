import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/community/hupu-board-navigation.js', import.meta.url), 'utf8');
const labels = ['일반', '자동차', '차량/운송', '사건제보', '결함/불만'];
const storageKey = 'bbm.community.boardChannels.v2';
const legacyKey = 'bbm.community.boardOrder.v1';

// Exercise the actual catalog and persistence functions, without a browser or DOM mock.
function load(seed = {}, unavailable = false) {
  const values = new Map(Object.entries(seed));
  const window = {};
  const localStorage = {
    getItem(key) { if (unavailable) throw new Error('storage unavailable'); return values.get(key) ?? null; },
    setItem(key, value) { if (unavailable) throw new Error('storage unavailable'); values.set(key, String(value)); },
  };
  vm.runInNewContext(source, { window, localStorage }, { timeout: 1000 });
  return { api: window.BBMCommunityBoardNavigation, values };
}
const plain = value => JSON.parse(JSON.stringify(value));
const sectionIds = (api, title) => plain(api.sections().find(section => section.title === title).boards.map(board => board.id));

test('category labels and order match the approved five-category structure', () => {
  assert.deepEqual(plain(load().api.sections().map(section => section.title)), labels);
});
test('category labels are unique and old short labels are absent', () => {
  const names = plain(load().api.sections().map(section => section.title));
  assert.equal(new Set(names).size, 5);
  for (const obsolete of ['차량', '제보', '결함']) assert.equal(names.includes(obsolete), false);
});
test('every nonfixed board belongs to exactly one category, without unknown IDs', () => {
  const { api } = load();
  const actual = plain(api.sections().flatMap(section => section.boards.map(board => board.id)));
  const expected = plain(api.catalog.filter(board => !board.fixed).map(board => board.id));
  assert.equal(new Set(actual).size, actual.length);
  assert.deepEqual(actual.slice().sort(), expected.slice().sort());
});
test('vehicle/transport contains truck, aviation/shipping/rail, and bike', () => {
  assert.deepEqual(sectionIds(load().api, '차량/운송'), ['truck-bus-heavy', 'aviation-rail', 'bike-cycle']);
});
test('aviation/shipping/rail is no longer in general', () => {
  assert.equal(sectionIds(load().api, '일반').includes('aviation-rail'), false);
});
test('incident reports retain their original board IDs', () => {
  assert.deepEqual(sectionIds(load().api, '사건제보'), ['accident-blackbox', 'scoop']);
});
test('defect/complaint boards remain separate from incident reports', () => {
  assert.deepEqual(sectionIds(load().api, '결함/불만'), ['autohome-complaint', 'chezhiwang-complaint']);
});
test('automotive boards and fixed home/all/best contract are preserved', () => {
  const { api } = load();
  assert.equal(sectionIds(api, '자동차').length, 17);
  assert.deepEqual(plain(api.fixedIds), ['home', 'all', 'best']);
  assert.equal(api.sections().some(section => section.boards.some(board => board.fixed)), false);
});
test('board display names and content topic keys are not replaced by category names', () => {
  const { api } = load();
  for (const [id, name, topic] of [
    ['aviation-rail', '항공/해운/철도', '전체'],
    ['bike-cycle', '오토바이/자전거', '전체'],
    ['accident-blackbox', '교통사고/블박', '블박'],
    ['autohome-complaint', '차량 결함·불만', '전체'],
  ]) {
    const board = api.catalog.find(board => board.id === id);
    assert.equal(board.displayName, name);
    assert.equal(board.topicKey, topic);
  }
});
test('existing v2 custom shortcut order survives category renaming unchanged', () => {
  const activeOrder = ['scoop', 'aviation-rail', 'autohome-complaint', 'free'];
  const saved = JSON.stringify({ version: 2, menuProfileVersion: 1, activeOrder });
  const { api, values } = load({ [storageKey]: saved });
  assert.deepEqual(plain(api.ordered().map(board => board.id)), ['best', ...activeOrder]);
  assert.equal(values.get(storageKey), saved);
});
test('existing home, favorites, and recent preferences are not rewritten by catalog loading', () => {
  const seed = {
    'bbm.community.defaultBoard.v1': 'aviation-rail',
    'bbm.community.favoriteBoards.v1': '["scoop","bike-cycle"]',
    'bbm.community.recentBoards.v1': '["autohome-complaint"]',
  };
  const { api, values } = load(seed);
  api.sections(); api.ordered();
  for (const [key, value] of Object.entries(seed)) assert.equal(values.get(key), value);
});
test('legacy shortcut IDs migrate without losing renamed-category boards', () => {
  const { api } = load({ [legacyKey]: JSON.stringify(['aviation-rail', 'scoop', 'bike-cycle']) });
  assert.deepEqual(plain(api.ordered().slice(0, 4).map(board => board.id)), ['best', 'aviation-rail', 'scoop', 'bike-cycle']);
});
test('normalization rejects duplicates, fixed IDs, and unknown IDs', () => {
  const actual = plain(load().api.normalizeOrder(['scoop', 'scoop', 'best', 'missing', 'aviation-rail']));
  assert.deepEqual(actual.slice(0, 2), ['scoop', 'aviation-rail']);
  assert.equal(actual.includes('best'), false);
  assert.equal(actual.includes('missing'), false);
  assert.equal(new Set(actual).size, actual.length);
});
test('malformed and unavailable storage still provide all categories', () => {
  for (const { api } of [load({ [storageKey]: '{invalid', [legacyKey]: '{invalid' }), load({}, true)]) {
    assert.deepEqual(plain(api.sections().map(section => section.title)), labels);
    assert.equal(api.ordered().length, 35);
  }
});
