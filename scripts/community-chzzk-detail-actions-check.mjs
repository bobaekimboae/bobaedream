import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const url = process.env.CHZZK_DETAIL_URL || 'http://127.0.0.1:4176/community/chzzk-detail.html?id=1';
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
check(await page.locator('#downBtn').getAttribute('aria-label') === '비추천', '비추천 접근성 문구가 없다');
check(!(await page.locator('body').innerText()).includes('버프'), '버프 문구가 남아 있다');
check(!(await page.locator('body').innerText()).includes('너프'), '너프 문구가 남아 있다');
check(await page.locator('.commentShareButton').count() === 5, '댓글·답글 공유 버튼 수가 5개가 아니다');
check(await page.locator('.moreCommentButton').count() === 5, '댓글·답글 더보기 버튼 수가 5개가 아니다');
check(await page.locator('.replyButton').count() === 5, '댓글·답글 답글 버튼 수가 5개가 아니다');
check(await page.locator('.commentVoteGroup').count() === 5, '댓글·답글 추천·비추천 묶음 수가 5개가 아니다');
check(await page.locator('.commentVoteButton').count() === 10, '댓글·답글 추천·비추천 버튼 수가 10개가 아니다');

const firstReplyUpvote = page.locator('.nestedTools .commentVoteButton[data-comment-vote="up"]').first();
const firstReplyVoteBefore = Number((await firstReplyUpvote.locator('span').textContent())?.trim());
await firstReplyUpvote.click();
check(await firstReplyUpvote.getAttribute('aria-pressed') === 'true', '답글 추천이 선택되지 않는다');
check(Number((await firstReplyUpvote.locator('span').textContent())?.trim()) === firstReplyVoteBefore + 1, '답글 추천 수가 증가하지 않는다');
await page.locator('.nestedTools .commentVoteButton[data-comment-vote="down"]').first().click();
check(await page.locator('.nestedTools .commentVoteButton[data-comment-vote="up"]').first().getAttribute('aria-pressed') === 'false', '답글 추천과 비추천이 동시에 선택된다');

const baseScore = Number((await page.locator('#score').textContent())?.trim());
await page.locator('#upBtn').click();
check(await page.locator('#upBtn').getAttribute('aria-pressed') === 'true', '게시글 추천이 선택되지 않는다');
check(Number((await page.locator('#score').textContent())?.trim()) === baseScore + 1, '게시글 추천 점수가 증가하지 않는다');
await page.locator('#downBtn').click();
check(await page.locator('#upBtn').getAttribute('aria-pressed') === 'false', '추천과 비추가 동시에 선택된다');
check(await page.locator('#downBtn').getAttribute('aria-pressed') === 'true', '게시글 비추가 선택되지 않는다');

await page.locator('.replyButton').first().click();
check(await page.locator('.commentContext').isVisible(), '답글 대상 표시가 열리지 않는다');
check((await page.locator('.commentContext strong').textContent())?.includes('에게 답글'), '답글 대상 문구가 없다');
check(await page.locator('#commentInput').getAttribute('placeholder') === '답글을 입력하세요.', '답글 입력 안내가 바뀌지 않는다');
const initialReplies = await page.locator('.nestedReply').count();
await page.locator('#commentInput').fill('직접 등록한 테스트 답글입니다');
await page.locator('#submitBtn').click();
check(await page.getByText('직접 등록한 테스트 답글입니다',{exact:true}).count() === 1, '답글이 목록에 추가되지 않는다');
check(await page.locator('.nestedReply').count() === initialReplies + 1, '답글 수가 증가하지 않는다');

const initialComments = await page.locator('.commentItem,.nestedReply').count();
await page.locator('#commentInput').fill('직접 등록한 테스트 댓글입니다');
await page.locator('#submitBtn').click();
check(await page.getByText('직접 등록한 테스트 댓글입니다',{exact:true}).count() === 1, '댓글이 목록에 추가되지 않는다');
check(await page.locator('.commentItem,.nestedReply').count() === initialComments + 1, '댓글 수가 증가하지 않는다');

const ownComment = page.locator('.commentItem').filter({hasText:'직접 등록한 테스트 댓글입니다'});
await ownComment.locator('.moreCommentButton').click();
check(await page.locator('.commentMenuSheet').isVisible(), '내 댓글 관리 바텀시트가 열리지 않는다');
await page.waitForTimeout(220);
await page.screenshot({ path:path.join(outputDir, 'mobile-384-comment-menu.png'), fullPage:false });
await page.getByRole('button',{name:'수정하기'}).click();
check(await page.locator('#commentInput').inputValue() === '직접 등록한 테스트 댓글입니다', '수정할 댓글을 입력창에 불러오지 못한다');
await page.locator('#commentInput').fill('수정한 테스트 댓글입니다');
await page.locator('#submitBtn').click();
check(await page.getByText('수정한 테스트 댓글입니다',{exact:true}).count() === 1, '댓글 수정이 반영되지 않는다');
const editedComment = page.locator('.commentItem').filter({hasText:'수정한 테스트 댓글입니다'});
await editedComment.locator('.moreCommentButton').click();
await page.getByRole('button',{name:'삭제하기'}).click();
check(await page.getByText('수정한 테스트 댓글입니다',{exact:true}).count() === 0, '댓글 삭제가 반영되지 않는다');

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
check(await page.locator('.miniVotes').count() === 0, '사용자 문의글 댓글에 추천·비추천이 남아 있다');
await page.locator('.replyButton').click();
check((await page.locator('.commentContext strong').textContent()) === '익씽에게 답글', '사용자 문의글 답글 대상이 올바르지 않다');

check(runtimeErrors.length === 0, `브라우저 오류: ${runtimeErrors.join(' | ')}`);
await browser.close();

if (failures.length) {
  console.error(failures.map((failure) => `FAIL: ${failure}`).join('\n'));
  process.exit(1);
}

console.log('PASS: Chzzk detail Reddit-style actions');
console.log('PASS: recommendation labels and exclusive states');
console.log('PASS: comment add/reply/edit/delete/share actions');
console.log('PASS: comment and reply recommendation controls');
console.log(`PASS: mobile width ${dimensions.scrollWidth}/${dimensions.viewport}`);
