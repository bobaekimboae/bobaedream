import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.WRITE_PARITY_URL || 'http://127.0.0.1:4173/community/naver-write-parity.html';
const outputDir = path.resolve('artifacts/community-write-parity-1015');
const viewports = [
  { name: 'desktop-source-1536x695', width: 1536, height: 695 },
  { name: 'desktop-1536', width: 1536, height: 864 },
  { name: 'mobile-384', width: 384, height: 844 },
  { name: 'mobile-360', width: 360, height: 800 },
  { name: 'mobile-412', width: 412, height: 915 },
];

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const failures = [];
const measurements = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

for (const viewport of viewports) {
  const page = await browser.newPage({ viewport });
  const externalRequests = [];
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(message.text()); });
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) externalRequests.push(request.url());
  });
  await page.goto(baseUrl, { waitUntil: 'load' });
  const brokenIcons = await page.locator('img').evaluateAll((images) => images
    .filter((image) => !image.complete || image.naturalWidth === 0)
    .map((image) => image.getAttribute('src')));
  assert(brokenIcons.length === 0, `${viewport.name}: broken icons ${brokenIcons.join(', ')}`);
  await page.screenshot({ path: path.join(outputDir, `${viewport.name}-viewport.png`) });
  await page.screenshot({ path: path.join(outputDir, `${viewport.name}-empty.png`), fullPage: true });

  const rects = await page.evaluate(() => {
    const rect = (selector) => {
      const r = document.querySelector(selector).getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
    };
    return {
      bodyWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      header: rect('.write-header'),
      board: rect('.board-select'),
      title: rect('#postTitle'),
      toolbar: rect('.primary-toolbar'),
      editor: rect('.editor-body'),
      tag: rect('.tag-area'),
    };
  });
  measurements.push({ viewport, rects });
  assert(rects.bodyWidth === rects.viewportWidth, `${viewport.name}: horizontal overflow ${rects.bodyWidth}/${rects.viewportWidth}`);
  assert(rects.header.height === 52, `${viewport.name}: header height ${rects.header.height}`);
  assert(rects.board.x === 16 && rects.board.height === 49, `${viewport.name}: board rect ${JSON.stringify(rects.board)}`);
  assert(rects.title.x === 16 && rects.title.height === 47, `${viewport.name}: title rect ${JSON.stringify(rects.title)}`);
  assert(rects.title.y === 120, `${viewport.name}: title y ${rects.title.y}`);
  assert(rects.toolbar.y === 188 && rects.toolbar.height === 48, `${viewport.name}: toolbar rect ${JSON.stringify(rects.toolbar)}`);
  assert(rects.editor.y === 236 && rects.editor.height === 300, `${viewport.name}: editor rect ${JSON.stringify(rects.editor)}`);
  assert(rects.tag.y === 536 && rects.tag.height === 45, `${viewport.name}: tag rect ${JSON.stringify(rects.tag)}`);
  assert(externalRequests.length === 0, `${viewport.name}: external requests ${externalRequests.join(', ')}`);
  assert(runtimeErrors.length === 0, `${viewport.name}: runtime errors ${runtimeErrors.join(' | ')}`);

  await page.getByRole('button', { name: '게시판을 선택해주세요.' }).click();
  const modal = await page.locator('.board-modal').boundingBox();
  assert(Math.round(modal.width) === 300 && Math.round(modal.height) === 417, `${viewport.name}: modal ${JSON.stringify(modal)}`);
  await page.screenshot({ path: path.join(outputDir, `${viewport.name}-board-modal.png`), fullPage: true });
  await page.getByPlaceholder('게시판 검색').fill('자동차');
  await page.getByText('자동차 이야기', { exact: true }).click();
  await page.getByPlaceholder('제목').fill('테스트 제목');
  await page.locator('#postBody').fill('테스트 본문');
  assert(await page.getByRole('button', { name: '등록', exact: true }).first().isEnabled(), `${viewport.name}: submit did not enable`);
  await page.getByRole('button', { name: '텍스트 도구막대' }).click();
  assert(await page.locator('.text-toolbar').isVisible(), `${viewport.name}: text toolbar hidden`);
  await page.screenshot({ path: path.join(outputDir, `${viewport.name}-filled-tools.png`), fullPage: true });
  await page.getByRole('button', { name: '임시등록' }).click();
  assert((await page.locator('#draftCount').textContent()) === '1', `${viewport.name}: draft count`);
  await page.getByRole('button', { name: /임시 1/ }).click();
  assert(await page.getByText('테스트 제목', { exact: true }).isVisible(), `${viewport.name}: draft not shown`);
  await page.waitForFunction(() => [...document.querySelectorAll('.draft-tools img')].every((image) => image.complete && image.naturalWidth > 0));
  const brokenDraftIcons = await page.locator('.draft-tools img').evaluateAll((images) => images
    .filter((image) => !image.complete || image.naturalWidth === 0)
    .map((image) => image.getAttribute('src')));
  assert(brokenDraftIcons.length === 0, `${viewport.name}: broken draft icons ${brokenDraftIcons.join(', ')}`);
  await page.getByRole('button', { name: '뒤로가기' }).click();
  await page.close();
}

await browser.close();
await writeFile(path.join(outputDir, 'measurements.json'), `${JSON.stringify(measurements, null, 2)}\n`);
if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, viewports: viewports.map(({ name }) => name), outputDir }, null, 2));
