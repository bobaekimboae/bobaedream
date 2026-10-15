import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.COMMUNITY_URL || 'http://127.0.0.1:4182/community/naver-cafe-list.html?view=compact';
const outputDir = path.resolve('artifacts', 'community-headword-toggle-1015');
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });

for (const width of [360, 384, 412]) {
  const page = await browser.newPage({ viewport: { width, height: 844 } });
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(message.text()); });
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

  const section = page.locator('#headwordSection');
  const category = page.locator('#category');
  const toggle = page.locator('#categoryToggle');
  const boardTop = page.locator('.boardTop');
  const metrics = await page.evaluate(() => {
    const section = document.querySelector('#headwordSection');
    const category = document.querySelector('#category');
    const board = document.querySelector('.boardTop');
    const avatar = document.querySelector('.boardAvatar');
    const notice = document.querySelector('.noticeText');
    const chip = document.querySelector('.cat');
    const header = document.querySelector('.appbar');
    const search = document.querySelector('.communitySearch');
    const compactReply = document.querySelector('.compactReply');
    const searchIcon = search.querySelector('img');
    const boardChevron = document.querySelector('.boardChevron');
    const sectionBox = section.getBoundingClientRect();
    const categoryBox = category.getBoundingClientRect();
    const boardBox = board.getBoundingClientRect();
    const chipBox = chip.getBoundingClientRect();
    const avatarBox = avatar.getBoundingClientRect();
    const headerBox = header.getBoundingClientRect();
    const searchBox = search.getBoundingClientRect();
    return {
      sectionTop: sectionBox.top,
      boardBottom: boardBox.bottom,
      sectionHeight: sectionBox.height,
      categoryHeight: categoryBox.height,
      chipHeight: chipBox.height,
      chipFontSize: getComputedStyle(chip).fontSize,
      boardBorderBottom: getComputedStyle(board).borderBottomWidth,
      avatarWidth: avatarBox.width,
      avatarHeight: avatarBox.height,
      noticeWeight: getComputedStyle(notice).fontWeight,
      noticeBadgeCount: document.querySelectorAll('.noticeBadge').length,
      headerHeight: headerBox.height,
      searchHeight: searchBox.height,
      searchText: search.textContent.trim(),
      searchWithinViewport: searchBox.left >= 0 && searchBox.right <= innerWidth,
      compactReplyFontSize: getComputedStyle(compactReply).fontSize,
      searchIconSrc: searchIcon.getAttribute('src'),
      searchIconLoaded: searchIcon.complete && searchIcon.naturalWidth > 0,
      boardChevronContent: getComputedStyle(boardChevron).content,
      scrollWidth: document.documentElement.scrollWidth,
      viewport: innerWidth,
    };
  });
  check(Math.abs(metrics.sectionTop - metrics.boardBottom) <= 1, `${width}px: 말머리가 게시판명 바로 아래에 있지 않습니다`);
  check(Math.abs(metrics.sectionHeight - 48) <= 1, `${width}px: 접힌 말머리 높이가 48px가 아닙니다 (${metrics.sectionHeight})`);
  check(Math.abs(metrics.chipHeight - 32) <= 1, `${width}px: 칩 높이가 32px가 아닙니다 (${metrics.chipHeight})`);
  check(metrics.chipFontSize === (width <= 370 ? '13.7px' : '14px'), `${width}px: 칩 글자 크기가 다릅니다 (${metrics.chipFontSize})`);
  check(metrics.boardBorderBottom === '0px', `${width}px: 게시판명 아래 구분선이 남아 있습니다 (${metrics.boardBorderBottom})`);
  check(Math.abs(metrics.avatarWidth - 48) <= 1 && Math.abs(metrics.avatarHeight - 48) <= 1, `${width}px: 게시판 프로필이 48px가 아닙니다 (${metrics.avatarWidth}x${metrics.avatarHeight})`);
  check(Number(metrics.noticeWeight) >= 700, `${width}px: 공지 제목이 볼드가 아닙니다 (${metrics.noticeWeight})`);
  check(metrics.noticeBadgeCount === 0, `${width}px: 공지 칩이 남아 있습니다 (${metrics.noticeBadgeCount})`);
  check(Math.abs(metrics.headerHeight - 56) <= 1, `${width}px: 상단 높이가 56px가 아닙니다 (${metrics.headerHeight})`);
  check(Math.abs(metrics.searchHeight - 42) <= 1, `${width}px: 검색바 높이가 42px가 아닙니다 (${metrics.searchHeight})`);
  check(metrics.searchText === '커뮤니티', `${width}px: 검색바 텍스트가 다릅니다 (${metrics.searchText})`);
  check(metrics.searchWithinViewport, `${width}px: 검색바가 화면 밖으로 잘렸습니다`);
  check(metrics.compactReplyFontSize === '13px', `${width}px: 댓글 수 글자 크기가 13px가 아닙니다 (${metrics.compactReplyFontSize})`);
  check(metrics.searchIconSrc === 'assets/chotot-search-gray.svg' && metrics.searchIconLoaded, `${width}px: 초톳 검색 아이콘이 연결되지 않았습니다`);
  check(metrics.boardChevronContent.includes('chotot-arrow-right.svg'), `${width}px: 초톳 오른쪽 화살표가 연결되지 않았습니다 (${metrics.boardChevronContent})`);
  check(metrics.scrollWidth <= metrics.viewport, `${width}px: 가로 화면 잘림 (${metrics.scrollWidth}/${metrics.viewport})`);
  check(await toggle.getAttribute('aria-expanded') === 'false', `${width}px: 초기 접힘 상태가 아닙니다`);

  if (width === 384) await page.screenshot({ path: path.join(outputDir, 'mobile-384-collapsed.png'), fullPage: false });
  await toggle.click();
  check(await toggle.getAttribute('aria-expanded') === 'true', `${width}px: 펼침 상태가 반영되지 않습니다`);
  check(await section.evaluate((element) => element.classList.contains('expanded')), `${width}px: 펼침 클래스가 없습니다`);
  const expandedHeight = await category.evaluate((element) => element.getBoundingClientRect().height);
  check(expandedHeight > 48, `${width}px: 칩이 여러 줄로 펼쳐지지 않습니다 (${expandedHeight})`);

  const tuning = page.getByRole('button', { name: '튜닝', exact: true });
  await tuning.click();
  check(await tuning.getAttribute('aria-pressed') === 'true', `${width}px: 펼친 상태에서 칩 선택이 되지 않습니다`);
  check(await section.evaluate((element) => element.classList.contains('expanded')), `${width}px: 칩 선택 후 펼침 상태가 유지되지 않습니다`);
  if (width === 384) await page.screenshot({ path: path.join(outputDir, 'mobile-384-expanded.png'), fullPage: false });

  await toggle.click();
  check(await toggle.getAttribute('aria-expanded') === 'false', `${width}px: 다시 접히지 않습니다`);
  check(!(await section.evaluate((element) => element.classList.contains('expanded'))), `${width}px: 접힘 클래스 상태가 틀립니다`);

  if (width === 384) {
    await page.locator('.communitySearch').click();
    check(await page.locator('#toast').textContent() === '커뮤니티 검색 준비중', `${width}px: 검색바 동작 안내가 표시되지 않습니다`);
  }

  check(runtimeErrors.length === 0, `${width}px: 브라우저 오류 ${runtimeErrors.join(' | ')}`);
  await page.close();
}

await browser.close();

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  viewports: [360, 384, 412],
  collapsedHeight: 48,
  chipHeight: 32,
  interactions: ['expand', 'select', 'collapse'],
  outputDir,
}, null, 2));
