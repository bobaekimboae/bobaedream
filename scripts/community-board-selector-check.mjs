import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.COMMUNITY_URL || 'http://127.0.0.1:4176/community/naver-cafe-list.html?view=compact';
const outputDir = path.resolve('artifacts', 'community-board-selector-1015');
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

const officialBoards = [
  '베스트글','자유게시판','자동차뉴스','해외 자동차뉴스','차량리뷰','정치/시사게시판','시승기/배틀/목격담','유명인의 차','성인게시판',
  '보배드림 이야기','제안/건의','국내야구','해외야구','해외축구','국내축구','이벤트',
  '신유머/감동/이슈','유머게시판','교통사고/블박','국산차게시판','수입차게시판','내차사진','직찍/특종발견',
  '자동차사진/동영상','장착시공사진','자유사진/동영상','후방주의방','레이싱모델','군사/무기','트럭/버스/중기',
  '항공/해운/철도','오토바이/자전거','올드카/추억거리',
];

await mkdir(outputDir, { recursive:true });
const browser = await chromium.launch({ headless:true });
const page = await browser.newPage({ viewport:{ width:384, height:844 } });
const runtimeErrors = [];
page.on('pageerror', (error) => runtimeErrors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(message.text()); });

await page.goto(baseUrl, { waitUntil:'domcontentloaded' });
await page.locator('#boardSelect').click();
await page.locator('.boardSheetScroll').waitFor({ state:'visible' });

const sectionTitles = await page.locator('.boardSectionTitle').allTextContents();
const boardLabels = await page.locator('.boardRow [data-board-label], .boardRow > span:nth-of-type(1)').allTextContents();
const normalizedLabels = boardLabels.map((label) => label.trim()).filter(Boolean);
check(JSON.stringify(sectionTitles.map((title) => title.trim())) === JSON.stringify(['게시판','자료실']), '게시판/자료실 구역명이 다릅니다');
check(await page.locator('.boardRow').count() === officialBoards.length + 1, `전체 게시글 포함 게시판 행 수가 ${officialBoards.length + 1}개가 아닙니다`);
check(await page.locator('.boardRowAvatar').count() === officialBoards.length + 1, `게시판 선택 프사가 ${officialBoards.length + 1}개가 아닙니다`);
const uniqueBoardAvatars = await page.locator('.boardRowAvatar').evaluateAll((elements) => new Set(elements.map((element) => element.src)).size);
check(uniqueBoardAvatars === officialBoards.length + 1, `게시판 선택 고유 프사가 ${uniqueBoardAvatars}개입니다`);
for (const board of officialBoards) check(normalizedLabels.filter((label) => label === board).length === 1, `${board} 게시판이 없거나 중복입니다`);
check(new Set(normalizedLabels).size === normalizedLabels.length, '게시판 이름이 중복되었습니다');

await page.screenshot({ path:path.join(outputDir, 'mobile-384-all-boards.png'), fullPage:false });

const bikeBoard = page.locator('[data-board-label="오토바이/자전거"]');
await bikeBoard.scrollIntoViewIfNeeded();
await bikeBoard.click();
check((await page.locator('.boardSelectName').textContent())?.trim() === '오토바이/자전거', '선택한 게시판명이 상단에 반영되지 않았습니다');
check(await page.locator('.item,.naverDiscussionCard').count() > 0, '게시판 선택 뒤 목록이 비었습니다');

await page.locator('#boardSelect').click();
const selectedBike = page.locator('[data-board-label="오토바이/자전거"]');
await selectedBike.scrollIntoViewIfNeeded();
check(await selectedBike.evaluate((element) => element.classList.contains('selected') && element.getAttribute('aria-current') === 'true'), '다시 열었을 때 선택 상태가 유지되지 않았습니다');
await page.locator('#sheetClose').click();

await Promise.all([
  page.waitForURL(/chzzk-write\.html/),
  page.locator('.fab').click(),
]);
const writerUrl = new URL(page.url());
check(writerUrl.searchParams.get('board') === '오토바이/자전거', '선택한 게시판이 글쓰기 화면에 전달되지 않았습니다');
check((await page.locator('#selectedBoard').textContent())?.trim() === '오토바이/자전거', '글쓰기 화면의 게시판 선택값이 다릅니다');

check(runtimeErrors.length === 0, `runtime errors: ${runtimeErrors.join(' | ')}`);
await browser.close();

if (failures.length) {
  console.error(JSON.stringify({ ok:false, failures, runtimeErrors }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok:true,
  officialBoardCount:officialBoards.length,
  selectorRowCount:officialBoards.length + 1,
  sections:sectionTitles,
  selectedBoard:'오토바이/자전거',
  writerHandoff:true,
  runtimeErrors,
  outputDir,
}, null, 2));
