import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('brand car information board is backed by its own table', async () => {
  const [list, detail, navigation, profile, table, generator, csv] = await Promise.all([
    readFile(new URL('../public/community/naver-cafe-list.html', import.meta.url), 'utf8'),
    readFile(new URL('../public/community/chzzk-detail.html', import.meta.url), 'utf8'),
    readFile(new URL('../public/community/hupu-board-navigation.js', import.meta.url), 'utf8'),
    readFile(new URL('../public/community/reddit-board-profile.js', import.meta.url), 'utf8'),
    readFile(new URL('../public/community/data/board-brand-car-info.js', import.meta.url), 'utf8'),
    readFile(new URL('../scripts/community-board-table.mjs', import.meta.url), 'utf8'),
    readFile(new URL('../data/boards/brand-car-info.csv', import.meta.url), 'utf8'),
  ]);

  assert.match(list, /board-brand-car-info\.js/);
  assert.match(detail, /board-brand-car-info\.js/);
  assert.match(navigation, /id:'brand-car-info',displayName:'브랜드 자동차 정보'/);
  assert.match(profile, /'브랜드 자동차 정보':'브랜드별 정보 · 독립 게시판'/);
  assert.match(table, /tables\["brand-car-info"\]/);
  assert.match(table, /"국산 브랜드"/);
  assert.match(generator, /'brand-car-info'/);
  assert.match(csv, /manufacturer,country,foundedYear,headquarters,officialUrl,brandType,currentStatus,aliases,logo/);
});
