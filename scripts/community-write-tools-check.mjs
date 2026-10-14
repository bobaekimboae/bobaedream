import { chromium } from '@playwright/test';

const url = process.env.WRITE_PARITY_URL || 'http://127.0.0.1:4173/community/naver-write-parity.html';
const viewports = [
  { name: 'desktop-1536', width: 1536, height: 864 },
  { name: 'mobile-384', width: 384, height: 844 },
];
const onePixelPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZIfsAAAAASUVORK5CYII=', 'base64');
const browser = await chromium.launch({ headless: true });
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

for (const viewport of viewports) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(message.text()); });
  await page.goto(url, { waitUntil: 'load' });

  assert(await page.getByText('게시물 허용 설정', { exact: true }).isVisible(), `${viewport.name}: permission title`);
  assert((await page.getByText(/네이버 서비스/).count()) === 0, `${viewport.name}: Naver-specific permission copy remains`);

  await page.getByRole('button', { name: '게시판 선택' }).click();
  await page.getByLabel('국산차 오너톡').check();
  await page.getByRole('button', { name: '말머리 선택' }).click();
  await page.getByLabel('현대').check();
  await page.getByPlaceholder('제목').fill('전체 기능 테스트');
  await page.locator('#postBody').fill('본문 테스트');

  await page.locator('#photoInput').setInputFiles({ name: 'car.png', mimeType: 'image/png', buffer: onePixelPng });
  await page.waitForFunction(() => document.querySelector('.editor-media img')?.naturalWidth > 0);
  assert((await page.locator('.editor-media').count()) === 1, `${viewport.name}: photo attach`);

  await page.getByRole('button', { name: '동영상', exact: true }).click();
  await page.locator('#toolUrl').fill('https://example.com/video');
  await page.locator('#toolText').fill('테스트 영상');
  await page.locator('#toolApply').click();
  assert((await page.locator('.embed-card').count()) === 1, `${viewport.name}: video card`);

  await page.getByRole('button', { name: '스티커', exact: true }).click();
  await page.locator('[data-choice="🚗"]').click();
  await page.locator('#toolApply').click();
  assert((await page.locator('.sticker-chip').count()) === 1, `${viewport.name}: sticker`);

  await page.getByRole('button', { name: '글감', exact: true }).click();
  await page.locator('[data-choice="내차소개"]').click();
  await page.locator('#toolApply').click();
  assert((await page.locator('.topic-card').count()) === 1, `${viewport.name}: topic`);
  assert((await page.locator('#postTags').inputValue()).includes('내차소개'), `${viewport.name}: topic tag sync`);

  await page.getByRole('button', { name: '링크', exact: true }).first().click();
  await page.locator('#toolUrl').fill('https://example.com/article');
  await page.locator('#toolText').fill('관련 글');
  await page.locator('#toolApply').click();
  assert((await page.locator('#postBody a[href="https://example.com/article"]').count()) === 1, `${viewport.name}: link`);

  await page.getByRole('button', { name: '장소', exact: true }).click();
  await page.locator('#toolText').fill('보배드림 테스트 센터');
  await page.locator('#toolAddress').fill('서울특별시 테스트로 1');
  await page.locator('#toolApply').click();
  assert((await page.locator('.place-card').count()) === 1, `${viewport.name}: place`);

  await page.getByRole('button', { name: '투표', exact: true }).click();
  await page.locator('#pollQuestion').fill('가장 기대되는 국산차는?');
  const pollOptions = page.locator('.poll-option-input');
  await pollOptions.nth(0).fill('현대 아이오닉 5');
  await pollOptions.nth(1).fill('기아 EV6');
  await page.getByRole('button', { name: '선택지 추가' }).click();
  await page.locator('.poll-option-input').nth(2).fill('제네시스 GV60');
  await page.locator('#pollMultiple').check();
  await page.locator('#pollAnonymous').check();
  await page.locator('#pollDuration').selectOption({ label:'3일' });
  await page.locator('#toolApply').click();
  assert((await page.locator('.poll-card').count()) === 1, `${viewport.name}: poll card`);
  assert((await page.locator('.poll-option-preview').count()) === 3, `${viewport.name}: poll options`);
  await page.locator('.poll-card').getByRole('button', { name:'수정' }).click();
  await page.locator('#pollQuestion').fill('가장 기대되는 국산 전기차는?');
  await page.locator('#toolApply').click();
  assert((await page.locator('.poll-card strong').textContent()) === '가장 기대되는 국산 전기차는?', `${viewport.name}: poll edit`);

  await page.locator('#fileInput').setInputFiles({ name: 'spec.txt', mimeType: 'text/plain', buffer: Buffer.from('vehicle spec') });
  assert((await page.locator('.attachment-item').count()) === 1, `${viewport.name}: file attachment`);

  await page.getByRole('button', { name: '텍스트 도구막대' }).click();
  assert(await page.locator('.text-toolbar').isVisible(), `${viewport.name}: text toolbar`);
  await page.getByRole('button', { name: '굵게' }).click();

  await page.locator('#visibilityButton').click();
  await page.locator('input[name="visibility"][value="전체 공개"]').check();
  await page.locator('#toolApply').click();
  assert((await page.locator('#visibilityButton').textContent()) === '전체 공개', `${viewport.name}: visibility`);
  await page.locator('#allowSearch').uncheck();

  await page.getByRole('button', { name: '임시등록' }).click();
  const draft = await page.evaluate(() => JSON.parse(localStorage.getItem('bbm.community.writeDraft.v2')));
  assert(draft?.visibility === '전체 공개', `${viewport.name}: persisted visibility`);
  assert(draft?.permissions?.search === false, `${viewport.name}: persisted permission`);
  assert(draft?.board === '국산차 오너톡' && draft?.head === '현대', `${viewport.name}: persisted board and head`);
  assert(draft?.body?.includes('가장 기대되는 국산 전기차는?'), `${viewport.name}: persisted poll`);

  const primaryColor = await page.getByRole('button', { name: '등록', exact: true }).first().evaluate((element) => getComputedStyle(element).backgroundColor);
  assert(primaryColor === 'rgb(255, 56, 92)', `${viewport.name}: primary color ${primaryColor}`);
  await page.getByRole('button', { name: '등록', exact: true }).first().click();
  assert(await page.getByText('게시물 등록 완료', { exact: true }).isVisible(), `${viewport.name}: submit confirmation`);
  const post = await page.evaluate(() => JSON.parse(localStorage.getItem('bbm.community.latestPost.v2')));
  assert(post?.status === 'LOCAL_PREVIEW' && post?.attachments?.length === 1, `${viewport.name}: saved post`);
  await page.getByRole('button', { name:'확인', exact:true }).click();
  await page.locator('.poll-card').getByRole('button', { name:'삭제' }).click();
  assert((await page.locator('.poll-card').count()) === 0, `${viewport.name}: poll delete`);

  const brokenImages = await page.locator('img').evaluateAll((images) => images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src));
  assert(brokenImages.length === 0, `${viewport.name}: broken images ${brokenImages.join(', ')}`);
  assert(runtimeErrors.length === 0, `${viewport.name}: runtime errors ${runtimeErrors.join(' | ')}`);
  assert(await page.evaluate(() => document.documentElement.scrollWidth === innerWidth), `${viewport.name}: horizontal overflow`);
  await context.close();
}

await browser.close();
if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, viewports: viewports.map(({ name }) => name), features: 21 }, null, 2));
