import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.COMMUNITY_URL || 'http://127.0.0.1:4174/community/naver-cafe-list.html';
const outputDir = path.resolve('artifacts', 'community-compact-write-1015');
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

await mkdir(outputDir, { recursive:true });
const browser = await chromium.launch({ headless:true });
const page = await browser.newPage({ viewport:{ width:384, height:844 } });
const runtimeErrors = [];
page.on('pageerror', (error) => runtimeErrors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(message.text()); });

await page.goto(baseUrl, { waitUntil:'domcontentloaded' });
await page.evaluate(() => {
  localStorage.removeItem('bbm.community.latestPost.v2');
  localStorage.removeItem('bbm.community.writeDraft.v2');
  localStorage.removeItem('bbm.community.chzzkDraft.v1');
});
await page.reload({ waitUntil:'commit' });
await page.locator('#typeLabel').waitFor({ state:'visible' });

check((await page.locator('#typeLabel').textContent())?.trim() === '간결형', 'default list mode is not compact');
check(await page.locator('.fab').isVisible(), 'compact list write button is missing');
const titleStyle = await page.locator('.itemTitle').first().evaluate((element) => ({ fontSize:getComputedStyle(element).fontSize }));
const replyStyle = await page.locator('.compactReply').first().evaluate((element) => {
  const style = getComputedStyle(element);
  return { color:style.color, fontSize:style.fontSize };
});
check(replyStyle.color === 'rgb(35, 143, 227)', 'compact reply count is not Bobaedream blue');
check(replyStyle.fontSize === titleStyle.fontSize, 'compact reply parentheses and number do not match the title size');
check(/^\(\d+\)$/.test((await page.locator('.compactReply').first().textContent())?.trim() || ''), 'compact reply count format is not (number)');
await Promise.all([
  page.waitForURL(/chzzk-write\.html/),
  page.locator('.fab').click(),
]);

const entryUrl = new URL(page.url());
check(entryUrl.searchParams.get('source') === 'chzzk-compact', 'writer source query is missing');
check(entryUrl.searchParams.get('board') === '자유게시판', 'current board was not handed to writer');
check(entryUrl.searchParams.get('returnTo')?.includes('naver-cafe-list.html'), 'list return path is missing');
check((await page.locator('#selectedBoard').textContent())?.trim() === '자유게시판', 'writer board was not preselected');
check((await page.locator('.main-tools > button').count()) === 8, 'Chzzk writer tool count is not 8');
check(await page.getByRole('button', { name:'투표' }).isVisible(), 'poll tool is missing');
check(await page.getByRole('button', { name:'스티커' }).isVisible(), 'sticker tool is missing');
check(await page.getByRole('button', { name:'링크' }).isVisible(), 'link tool is missing');
await page.screenshot({ path:path.join(outputDir, 'mobile-384-chzzk-writer.png'), fullPage:false });

await page.getByRole('button', { name:'텍스트 도구막대' }).click();
check(await page.locator('#textTools').isVisible(), 'text toolbar did not open');
await page.getByRole('button', { name:'스티커' }).click();
await page.locator('.emoji-grid button').first().waitFor({ state:'visible' });
check(await page.locator('.emoji-tabs button').count() === 9, 'emoji categories are incomplete');
await page.getByRole('button', { name:'뒤로가기' }).click();
await page.getByRole('button', { name:'링크' }).click();
check(await page.locator('#linkUrl').isVisible(), 'link sheet did not open');
await page.getByRole('button', { name:'뒤로가기' }).click();
await page.getByRole('button', { name:'투표' }).click();
check((await page.locator('#sheetTitle').textContent())?.trim() === '투표', 'poll sheet did not open');
check((await page.locator('.poll-option').count()) === 3, 'poll sheet initial option count is not 3');
await page.screenshot({ path:path.join(outputDir, 'mobile-384-chzzk-poll.png'), fullPage:false });
await page.getByRole('button', { name:'뒤로가기' }).click();

await page.locator('#postTitle').fill('간결형 글쓰기 연동 테스트');
await page.locator('#postBody').fill('치지직형 상세 화면까지 이어지는 테스트 본문입니다.');
check(await page.locator('.submit-button').isEnabled(), 'submit did not become enabled');
await page.locator('.submit-button').click();
await page.getByRole('dialog', { name:'게시물 등록 완료' }).waitFor({ state:'visible' });
await Promise.all([
  page.waitForURL(/naver-cafe-list\.html/),
  page.locator('.dialog-confirm').click(),
]);

const localItem = page.locator('.item[data-local-post="true"]').first();
check(await localItem.isVisible(), 'submitted post did not appear in compact list');
check(await page.locator('.item[data-local-post="true"]').count() === 1, 'submitted post appeared more than once');
check((await localItem.textContent())?.includes('간결형 글쓰기 연동 테스트'), 'submitted title is missing from compact list');
await page.screenshot({ path:path.join(outputDir, 'mobile-384-compact-list-submitted.png'), fullPage:false });

await Promise.all([
  page.waitForURL(/chzzk-detail\.html.*local=1/),
  localItem.click(),
]);
check((await page.locator('#postTitle').textContent())?.trim() === '간결형 글쓰기 연동 테스트', 'submitted title did not reach Chzzk detail');
check((await page.locator('#postBody').textContent())?.includes('치지직형 상세 화면까지 이어지는 테스트 본문입니다.'), 'submitted body did not reach Chzzk detail');
check((await page.locator('#commentCount').textContent())?.trim() === '댓글 0', 'new post comment count is not zero');
check((await page.locator('#authorView').textContent())?.trim() === '0', 'new post view count is not zero');
check(await page.locator('#postBody .heroSticker').count() === 0, 'reference post sticker leaked into submitted post');
await page.screenshot({ path:path.join(outputDir, 'mobile-384-chzzk-detail-submitted.png'), fullPage:false });

check(runtimeErrors.length === 0, `runtime errors: ${runtimeErrors.join(' | ')}`);
await browser.close();

if (failures.length) {
  console.error(JSON.stringify({ ok:false, failures, runtimeErrors }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok:true,
  flow:['간결형 목록','치지직 글쓰기','게시판 자동 선택','8개 도구','투표','등록','목록 반영','치지직 상세'],
  viewport:'384x844',
  runtimeErrors,
  outputDir,
}, null, 2));
