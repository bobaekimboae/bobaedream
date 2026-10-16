#!/usr/bin/env node
// 게시판 전용 테이블 만들기: data/boards/<게시판>.csv → public/community/data/board-<게시판>.js
// 사용: node scripts/community-board-table.mjs car-news
// CSV 열은 public/community/data/board-car-news.js 머리말의 열 설명과 같다(첫 줄 = 열 이름).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const boards = {
  'car-news': { displayName: '자동차뉴스', idStart: 9100001, defaultView: 'naver-discussion-thumb' },
  'vehicle-review': { displayName: '차량리뷰', idStart: 9200001 },
};
const board = process.argv[2];
if (!boards[board]) {
  console.error(`게시판 이름을 넣어 주세요: ${Object.keys(boards).join(', ')}`);
  process.exit(1);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const csvPath = path.join(root, 'data', 'boards', `${board}.csv`);
const outPath = path.join(root, 'public', 'community', 'data', `board-${board}.js`);
const commonColumns = ['id', 'category', 'title', 'summary', 'body', 'source', 'sourceUrl', 'author', 'publishedAt', 'thumbnail', 'images', 'views', 'comments', 'likes', 'tags'];
const reviewColumns = ['reviewId', 'modelId', 'brand', 'model', 'trim', 'powertrain', 'rating', 'owner', 'ownershipLabel', 'benchmark', 'location', 'ratings', 'brandLogo'];
const columns = commonColumns.concat(reviewColumns);

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ''));
}

const [header, ...lines] = parseCsv(fs.readFileSync(csvPath, 'utf8').replace(/^﻿/, ''));
const requiredColumns = board === 'vehicle-review' ? columns : commonColumns;
const missing = requiredColumns.filter((c) => !header.includes(c));
if (missing.length) { console.error(`CSV에 없는 열: ${missing.join(', ')}`); process.exit(1); }
const { displayName, idStart, defaultView } = boards[board];
const seen = new Set();
const problems = [];
const rows = lines.map((line, index) => {
  const row = {};
  columns.forEach((c) => { row[c] = header.includes(c) ? (line[header.indexOf(c)] || '').trim() : ''; });
  if (!row.id) row.id = String(idStart + index);
  if (seen.has(row.id)) problems.push(`${index + 2}번째 줄: id ${row.id} 중복`);
  seen.add(row.id);
  if (!/^\d+$/.test(row.id)) problems.push(`${index + 2}번째 줄: id는 숫자만 (${row.id})`);
  if (!row.title) problems.push(`${index + 2}번째 줄: 제목 없음`);
  if (row.publishedAt && Number.isNaN(Date.parse(row.publishedAt))) problems.push(`${index + 2}번째 줄: publishedAt 형식 오류 (${row.publishedAt})`);
  return row;
});
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }

const head = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8').split('(function(){')[0] : `/* ${displayName} 게시판 전용 테이블. data/boards/${board}.csv에서 생성한다. */\n`;
const body = `(function(){
  'use strict';
  var tables=window.BBM_BOARD_TABLES=window.BBM_BOARD_TABLES||{};
  tables[${JSON.stringify(board)}]={
    board:${JSON.stringify(board)},
    displayName:${JSON.stringify(displayName)},
    idStart:${idStart},
    defaultView:${JSON.stringify(defaultView || '')},
    updatedAt:${JSON.stringify(new Date().toISOString())},
    rows:${JSON.stringify(rows, null, 2).replace(/\n/g, '\n    ')}
  };
})();
`;
fs.writeFileSync(outPath, head + body);
console.log(`${board}: ${rows.length}개 글 → ${path.relative(root, outPath)}`);
