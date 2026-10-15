import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const url = process.env.CHZZK_DETAIL_URL || 'http://127.0.0.1:4176/community/chzzk-detail.html?id=8326278';
const outputDir = path.resolve('artifacts', 'community-chzzk-detail-actions-1015');
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

await mkdir(outputDir, { recursive:true });
const browser = await chromium.launch({ headless:true });
const page = await browser.newPage({ viewport:{ width:384, height:844 } });
const runtimeErrors = [];
page.on('pageerror', (error) => runtimeErrors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(message.text()); });

await page.goto(url, { waitUntil:'domcontentloaded' });
await page.locator('#upBtn').waitFor({ state:'visible' });

check((await page.locator('body').innerText()).includes('추천'), '추천 문구가 없다');
check((await page.locator('body').innerText()).includes('비추'), '비추 문구가 없다');
check(!(await page.locator('body').innerText()).includes('버프'), '버프 문구가 남아 있다');
check(!(await page.locator('body').innerText()).includes('너프'), '너프 문구가 남아 있다');
check(await page.locator('.commentShareButton').count() === 2, '댓글·답글 공유 버튼 수가 2개가 아니다');
check(await page.locator('.moreCommentButton').count() === 2, '댓글·답글 더보기 버튼 수가 2개가 아니다');
check(await page.locator('.replyButton').count() === 2, '댓글·답글 답글 버튼 수가 2개가 아니다');

await page.locator('#upBtn').click();
check(await page.locator('#upBtn').getAttribute('aria-pressed') === 'true', '게시글 추천이 선택되지 않는다');
check((await page.locator('#score').textContent())?.trim() === '17', '게시글 추천 점수가 증가하지 않는다');
await page.locator('#downBtn').click();
check(await page.locator('#upBtn').getAttribute('aria-pressed') === 'false', '추천과 비추가 동시에 선택된다');
check(await page.locator('#downBtn').getAttribute('aria-pressed') === 'true', '게시글 비추가 선택되지 않는다');

const commentUp = page.locator('.miniVotes button[aria-label="댓글 추천"]');
const commentDown = page.locator('.miniVotes button[aria-label="댓글 비추"]');
await commentUp.click();
await commentDown.click();
check(!(await commentUp.getAttribute('class') || '').includes('active'), '댓글 추천과 비추가 동시에 선택된다');
check((await commentDown.getAttribute('class') || '').includes('active'), '댓글 비추가 선택되지 않는다');

await page.locator('.replyButton').first().click();
check(await page.locator('#commentInput').inputValue() === '@쿠로토라 ', '답글 버튼이 작성 입력창을 준비하지 않는다');

const dimensions = await page.evaluate(() => ({ viewport:innerWidth, scrollWidth:document.documentElement.scrollWidth }));
check(dimensions.scrollWidth <= dimensions.viewport, `가로 잘림 발생: ${dimensions.scrollWidth}/${dimensions.viewport}`);
await page.locator('.commentTools').first().scrollIntoViewIfNeeded();
await page.screenshot({ path:path.join(outputDir, 'mobile-384-comment-actions.png'), fullPage:false });

const inquiryUrl = new URL(url);
inquiryUrl.searchParams.set('id', '8325190');
await page.goto(inquiryUrl.toString(), { waitUntil:'domcontentloaded' });
await page.locator('.commentTools').first().waitFor({ state:'visible' });
check(!(await page.locator('body').innerText()).includes('버프'), '사용자 문의글에 버프 문구가 남아 있다');
check(!(await page.locator('body').innerText()).includes('너프'), '사용자 문의글에 너프 문구가 남아 있다');
check(await page.locator('.commentShareButton').count() === 1, '사용자 문의글 댓글 공유 버튼이 없다');
await page.locator('.replyButton').click();
check(await page.locator('#commentInput').inputValue() === '@익씽 ', '사용자 문의글 답글 대상이 올바르지 않다');

check(runtimeErrors.length === 0, `브라우저 오류: ${runtimeErrors.join(' | ')}`);
await browser.close();

if (failures.length) {
  console.error(failures.map((failure) => `FAIL: ${failure}`).join('\n'));
  process.exit(1);
}

console.log('PASS: Chzzk detail Reddit-style actions');
console.log('PASS: recommendation labels and exclusive states');
console.log('PASS: comment reply/share/more actions');
console.log(`PASS: mobile width ${dimensions.scrollWidth}/${dimensions.viewport}`);
