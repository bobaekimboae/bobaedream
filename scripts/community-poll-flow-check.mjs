import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.COMMUNITY_URL || 'http://127.0.0.1:4174/community/naver-cafe-list.html?view=naver-discussion&board=%EC%9E%90%EC%9C%A0%EA%B2%8C%EC%8B%9C%ED%8C%90';
const outputDir = path.resolve('artifacts', 'community-poll-1017');
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const onePixelPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZIfsAAAAASUVORK5CYII=', 'base64');

await mkdir(outputDir, { recursive:true });
const browser = await chromium.launch({ headless:true });
const context = await browser.newContext({ viewport:{ width:390, height:844 } });
const page = await context.newPage();
const runtimeErrors = [];
page.on('pageerror', (error) => runtimeErrors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(message.text()); });

await page.goto(baseUrl, { waitUntil:'domcontentloaded' });
await page.evaluate(() => {
  localStorage.removeItem('bbm.community.latestPost.v2');
  localStorage.removeItem('bbm-community-poll-v1');
  localStorage.removeItem('bbm.community.chzzkDraft.v1');
});
await page.reload({ waitUntil:'domcontentloaded' });
await Promise.all([page.waitForURL(/chzzk-write\.html/), page.locator('.fab').click()]);
await page.getByRole('button', { name:'투표', exact:true }).click();

check(await page.locator('#sheetOverlay').getAttribute('class') === 'overlay is-poll', '투표 전용 모달 클래스가 적용되지 않았다');
check(await page.locator('.poll-option').count() === 3, '초기 선택지가 3개가 아니다');
check(await page.locator('#pollAnonymous').isChecked(), '무기명 투표가 기본값이 아니다');
check(await page.locator('[name="pollEndMode"][value="none"]').isChecked(), '자동 종료 없음이 기본값이 아니다');
check(await page.locator('#pollVisibility option').allTextContents().then((items) => items.join('|')) === '투표 참여 후 보기|투표 종료 후 보기|비공개', '결과 공개 조건이 원본과 다르다');
check(await page.locator('#sheetPrimary').isDisabled(), '필수값 입력 전 확인 버튼이 활성화되어 있다');

for (let index = 3; index < 20; index += 1) await page.locator('[data-add-option]').click();
check(await page.locator('.poll-option').count() === 20, '선택지 최대 20개가 적용되지 않았다');
check(await page.locator('[data-add-option]').isDisabled(), '20개에서 항목 추가가 비활성화되지 않았다');
for (let index = 20; index > 3; index -= 1) await page.locator('.poll-remove').last().click();

await page.locator('#pollTitle').fill('가장 선호하는 자동차 유형은?');
await page.locator('.poll-option').nth(0).fill('스포츠카');
await page.locator('.poll-option').nth(1).fill('세단');
await page.locator('.poll-option').nth(2).fill('SUV');
await page.evaluate(() => {
  const rows = [...document.querySelectorAll('.poll-row')];
  const transfer = new DataTransfer();
  rows[2].dispatchEvent(new DragEvent('dragstart', { bubbles:true, dataTransfer:transfer }));
  const top = rows[0].getBoundingClientRect().top;
  rows[0].dispatchEvent(new DragEvent('dragover', { bubbles:true, cancelable:true, clientY:top, dataTransfer:transfer }));
  rows[0].dispatchEvent(new DragEvent('drop', { bubbles:true, cancelable:true, clientY:top, dataTransfer:transfer }));
  rows[2].dispatchEvent(new DragEvent('dragend', { bubbles:true, dataTransfer:transfer }));
});
check(await page.locator('.poll-option').first().inputValue() === 'SUV', '선택지 드래그 순서 변경이 적용되지 않았다');
await page.locator('.poll-image-button').first().click();
await page.locator('#pollImageInput').setInputFiles({ name:'sports-car.png', mimeType:'image/png', buffer:onePixelPng });
await page.locator('.poll-image-button.has-image').waitFor({ state:'visible' });
await page.locator('#pollMultiple').check();
await page.locator('#pollVisibility').selectOption('after_close');
await page.locator('[name="pollEndMode"][value="date"]').check();
check(await page.locator('#pollDeadlineFields').isVisible(), '특정 날짜 종료 필드가 표시되지 않았다');
await page.locator('[name="pollEndMode"][value="none"]').check();
check(await page.locator('#sheetPrimary').isEnabled(), '유효한 투표에서 확인 버튼이 활성화되지 않았다');
await page.screenshot({ path:path.join(outputDir, '01-mobile-poll-editor.png'), fullPage:false });
await page.locator('#sheetPrimary').click();

check(await page.locator('.editor-poll').count() === 1, '본문에 투표 카드가 삽입되지 않았다');
check(await page.locator('.editor-poll .bbmPollOption').count() === 3, '본문 투표 카드 선택지가 3개가 아니다');
check(await page.locator('.editor-poll .bbmPollOptionImage').count() === 1, '선택지 이미지가 본문 카드에 표시되지 않았다');
await page.locator('#postTitle').fill('자동차 유형 선호도 투표');
check(await page.locator('.submit-button').isEnabled(), '투표 글 등록 버튼이 활성화되지 않았다');
await page.locator('.submit-button').click();
await page.getByRole('dialog', { name:'게시물 등록 완료' }).waitFor({ state:'visible' });
await Promise.all([page.waitForURL(/naver-cafe-list\.html/), page.locator('.dialog-confirm').click()]);

const localCard = page.locator('[data-discussion-post]').filter({ hasText:'자동차 유형 선호도 투표' }).first();
check(await localCard.isVisible(), '등록한 글이 목록 첫 화면에 노출되지 않았다');
check(await localCard.locator('.bbmPoll').count() === 1, '목록에서 투표 미리보기가 노출되지 않았다');
check(await localCard.locator('.bbmPollOption').count() === 3, '목록 투표 선택지가 잘못 복원되었다');
check(await localCard.locator('.bbmPollCount').count() === 0, '종료 후 공개 투표 결과가 목록에서 먼저 노출되었다');
await page.screenshot({ path:path.join(outputDir, '02-mobile-list-registered.png'), fullPage:false });

await Promise.all([page.waitForURL(/chzzk-detail\.html.*local=1/), localCard.locator('.naverDiscussionTitle').click()]);
check((await page.locator('#postTitle').textContent())?.trim() === '자동차 유형 선호도 투표', '상세 제목이 등록값과 다르다');
check(await page.locator('#postBody .bbmPollOption').count() === 3, '상세 투표 선택지가 누락되었다');
check(await page.locator('#postBody .bbmPollCount').count() === 0, '투표 전 결과가 노출되었다');
await page.locator('#postBody [data-poll-option="0"]').click();
await page.locator('#postBody [data-poll-option="2"]').click();
await page.locator('#postBody [data-poll-vote]').click();
check(await page.locator('#postBody .bbmPollCount').count() === 0, '종료 전 결과가 노출되었다');
await page.locator('#postBody [data-poll-end]').click();
check(await page.locator('#postBody .bbmPollCount').count() === 3, '종료 후 결과가 표시되지 않았다');
await page.reload({ waitUntil:'domcontentloaded' });
check(await page.locator('#postBody .bbmPollCount').count() === 3, '새로고침 후 투표 결과가 유지되지 않았다');
await page.screenshot({ path:path.join(outputDir, '03-mobile-detail-voted.png'), fullPage:false });

const overflow = await page.evaluate(() => ({ viewport:innerWidth, width:document.documentElement.scrollWidth }));
check(overflow.width <= overflow.viewport, `모바일 가로 넘침 ${overflow.width}/${overflow.viewport}`);
await context.close();

const desktop = await browser.newContext({ viewport:{ width:1440, height:900 } });
const desktopPage = await desktop.newPage();
desktopPage.on('pageerror', (error) => runtimeErrors.push(error.message));
desktopPage.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(message.text()); });
await desktopPage.goto(new URL('./chzzk-write.html?board=%EC%9E%90%EC%9C%A0%EA%B2%8C%EC%8B%9C%ED%8C%90', baseUrl).toString(), { waitUntil:'domcontentloaded' });
await desktopPage.getByRole('button', { name:'투표', exact:true }).click();
await desktopPage.locator('#pollTitle').fill('PC 투표 UI 확인');
await desktopPage.locator('.poll-option').nth(0).fill('선택지 A');
await desktopPage.locator('.poll-option').nth(1).fill('선택지 B');
await desktopPage.locator('.poll-option').nth(2).fill('선택지 C');
const desktopModal = await desktopPage.locator('#sheetOverlay .sheet').evaluate((element) => {
  const rect = element.getBoundingClientRect(); const style = getComputedStyle(element);
  return { width:Math.round(rect.width), borderRadius:style.borderRadius, viewport:innerWidth, scrollWidth:document.documentElement.scrollWidth };
});
check(desktopModal.width === 570, `PC 투표 모달 폭이 570px이 아니다: ${desktopModal.width}`);
check(desktopModal.borderRadius === '12px', `PC 투표 모달 모서리가 12px이 아니다: ${desktopModal.borderRadius}`);
check(desktopModal.scrollWidth <= desktopModal.viewport, `PC 가로 넘침 ${desktopModal.scrollWidth}/${desktopModal.viewport}`);
await desktopPage.screenshot({ path:path.join(outputDir, '04-desktop-poll-editor.png'), fullPage:false });
await desktop.close();

check(runtimeErrors.length === 0, `브라우저 오류: ${runtimeErrors.join(' | ')}`);
await browser.close();
if (failures.length) {
  console.error(JSON.stringify({ ok:false, failures, runtimeErrors }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({
  ok:true,
  flow:['투표 작성','20개 제한','선택지 순서 변경','선택지 이미지','종료 조건','등록','목록 노출','상세 투표','결과 공개 조건','새로고침 유지'],
  viewports:['390x844','1440x900'],
  runtimeErrors,
  outputDir,
}, null, 2));
