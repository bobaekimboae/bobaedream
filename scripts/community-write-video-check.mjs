import { chromium } from '@playwright/test';

const url = process.env.WRITE_PARITY_URL || 'http://127.0.0.1:4173/community/naver-write-parity.html';
const fakeMp4 = Buffer.from('000000186674797069736f6d0000020069736f6d69736f32', 'hex');
const browser = await chromium.launch({ headless:true });
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

for (const viewport of [{ name:'desktop', width:1440, height:900 }, { name:'mobile', width:384, height:844 }]) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  await page.goto(url, { waitUntil:'domcontentloaded' });

  await page.getByRole('button', { name:'동영상', exact:true }).click();
  assert(await page.getByText('내 기기에서 업로드', { exact:true }).isVisible(), `${viewport.name}: upload choice`);
  assert(await page.locator('#toolUrl').isVisible(), `${viewport.name}: url choice retained`);
  await page.locator('#videoInput').setInputFiles({ name:'drive.mp4', mimeType:'video/mp4', buffer:fakeMp4 });
  await page.waitForFunction(() => document.querySelectorAll('.editor-media[data-media-kind="video"]').length === 1);

  const video = page.locator('.editor-media[data-media-kind="video"]');
  assert(await video.locator('video[controls][playsinline]').count() === 1, `${viewport.name}: native video player`);
  await video.getByRole('button', { name:'동영상 편집 도구 열기', exact:true }).click();
  assert(await video.locator('.media-quick-toolbar').isVisible(), `${viewport.name}: video selection toolbar`);
  await video.getByRole('button', { name:'작게', exact:true }).click();
  await video.getByRole('button', { name:'오른쪽 정렬', exact:true }).click();
  assert(await video.evaluate((element) => element.classList.contains('is-small') && element.dataset.align === 'right'), `${viewport.name}: width and alignment`);
  await video.locator('.video-caption').fill('주행 영상 설명');

  await video.getByRole('button', { name:'링크', exact:true }).click();
  await page.locator('#toolUrl').fill('https://example.com/drive');
  await page.locator('#toolApply').click();
  await video.getByRole('button', { name:'동영상 편집 도구 열기', exact:true }).click();
  await video.getByRole('button', { name:'교체', exact:true }).click();
  await page.locator('#replaceVideoInput').setInputFiles({ name:'replacement.webm', mimeType:'video/webm', buffer:fakeMp4 });
  await page.waitForFunction(() => document.querySelector('.editor-media[data-media-kind="video"] figcaption small')?.textContent.includes('replacement.webm'));
  assert(await video.locator('.video-caption').textContent() === '주행 영상 설명', `${viewport.name}: replace keeps caption`);

  await page.getByRole('button', { name:'임시등록', exact:true }).click();
  const draft = await page.evaluate(() => JSON.parse(localStorage.getItem('bbm.community.writeDraft.v2')));
  assert(draft?.videos?.length === 1 && draft.videos[0].caption === '주행 영상 설명', `${viewport.name}: video draft serialized`);
  await page.reload({ waitUntil:'domcontentloaded' });
  await page.getByRole('button', { name:/임시 1/ }).click();
  await page.getByRole('button', { name:'수정', exact:true }).click();
  await page.waitForFunction(() => document.querySelector('.editor-media[data-media-kind="video"] video')?.src.startsWith('blob:'));
  assert(await page.locator('.video-caption').textContent() === '주행 영상 설명', `${viewport.name}: video draft restored`);

  await page.getByRole('button', { name:'동영상 편집 도구 열기', exact:true }).click();
  await page.locator('.editor-media[data-media-kind="video"]').getByRole('button', { name:'삭제', exact:true }).click();
  assert(await page.locator('.editor-media[data-media-kind="video"]').count() === 0, `${viewport.name}: video delete`);

  await page.getByRole('button', { name:'동영상', exact:true }).click();
  await page.locator('#toolUrl').fill('https://example.com/video');
  await page.locator('#toolText').fill('외부 영상');
  await page.locator('#toolApply').click();
  assert(await page.locator('.embed-card').count() === 1, `${viewport.name}: external video card`);
  assert(runtimeErrors.length === 0, `${viewport.name}: runtime ${runtimeErrors.join(' | ')}`);
  assert(await page.evaluate(() => document.documentElement.scrollWidth === innerWidth), `${viewport.name}: horizontal overflow`);
  await context.close();
}

const limitContext = await browser.newContext({ viewport:{ width:1280, height:800 } });
const limitPage = await limitContext.newPage();
await limitPage.goto(url, { waitUntil:'domcontentloaded' });
const videos = Array.from({ length:11 }, (_, index) => ({ name:`video-${index + 1}.mp4`, mimeType:'video/mp4', buffer:fakeMp4 }));
await limitPage.locator('#videoInput').setInputFiles(videos);
await limitPage.waitForFunction(() => document.querySelectorAll('.editor-media[data-media-kind="video"]').length === 10);
assert(await limitPage.locator('.editor-media[data-media-kind="video"]').count() === 10, 'limits: maximum 10 videos');
assert(await limitPage.getByText('첨부하지 못한 동영상', { exact:true }).isVisible(), 'limits: overflow feedback');
await limitContext.close();

await browser.close();
if (failures.length) { console.error(JSON.stringify({ ok:false, failures }, null, 2)); process.exit(1); }
console.log(JSON.stringify({ ok:true, scenarios:14, viewports:['desktop','mobile'] }, null, 2));
