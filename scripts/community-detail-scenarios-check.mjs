import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.COMMUNITY_DETAIL_URL || 'http://127.0.0.1:4176/community/chzzk-detail.html';
const outputDir = path.resolve('artifacts', 'community-detail-scenarios-1015');
const scenarios = [
  { id:1, title:'제네시스 GV80 장거리 시승 후기', comments:5, replies:2 },
  { id:2, title:'이번 업데이트 이후 달라진 점 정리', comments:6, replies:3 },
  { id:3, title:'모델Y 트렁크 매트 추천 부탁드립니다', comments:5, replies:2 },
  { id:4, title:'모델3 하이랜드 도어라이트 DIY 비용 공유', comments:4, replies:1 },
  { id:5, title:'프렁크 소프트 클로징 장착 후기입니다', comments:5, replies:2 },
];
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

await mkdir(outputDir, { recursive:true });
const browser = await chromium.launch({ headless:true });
const page = await browser.newPage({ viewport:{ width:384, height:844 } });
const runtimeErrors = [];
page.on('pageerror', (error) => runtimeErrors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(message.text()); });

for (const scenario of scenarios) {
  await page.goto(`${baseUrl}?id=${scenario.id}`, { waitUntil:'domcontentloaded' });
  await page.locator('.detailCopy').waitFor({ state:'visible' });
  check((await page.locator('#postTitle').textContent())?.trim() === scenario.title, `${scenario.id}: 제목 불일치`);
  check(await page.locator('.detailPhoto').count() === 1, `${scenario.id}: 상세 이미지 없음`);
  check(await page.locator('.detailCopy p').count() === 4, `${scenario.id}: 본문 단락이 4개가 아님`);
  check((await page.locator('#commentCount').textContent())?.trim() === `댓글 ${scenario.comments}`, `${scenario.id}: 댓글 합계 불일치`);
  check(await page.locator('.commentItem').count() === 3, `${scenario.id}: 상위 댓글이 3개가 아님`);
  check(await page.locator('.nestedReply').count() === scenario.replies, `${scenario.id}: 대댓글 수 불일치`);
  check(await page.locator('.commentShareButton').count() === scenario.comments, `${scenario.id}: 공유 버튼 수 불일치`);
  check(!(await page.locator('body').innerText()).includes('버프'), `${scenario.id}: 버프 문구가 남아 있음`);
  check(!(await page.locator('body').innerText()).includes('너프'), `${scenario.id}: 너프 문구가 남아 있음`);
  const dimensions = await page.evaluate(() => ({ viewport:innerWidth, scrollWidth:document.documentElement.scrollWidth }));
  check(dimensions.scrollWidth <= dimensions.viewport, `${scenario.id}: 가로 잘림 ${dimensions.scrollWidth}/${dimensions.viewport}`);
  await page.locator('.replyButton').first().click();
  check((await page.locator('#commentInput').inputValue()).startsWith('@'), `${scenario.id}: 답글 대상 입력 실패`);
  await page.screenshot({ path:path.join(outputDir, `scenario-${scenario.id}-mobile-384.png`), fullPage:true });
}

check(runtimeErrors.length === 0, `브라우저 오류: ${runtimeErrors.join(' | ')}`);
await browser.close();

if (failures.length) {
  console.error(failures.map((failure) => `FAIL: ${failure}`).join('\n'));
  process.exit(1);
}

console.log('PASS: 상세 게시물 시나리오 5개');
console.log('PASS: 본문 4단락 + 이미지 + 댓글/대댓글');
console.log('PASS: 모바일 384 가로 잘림 없음');
