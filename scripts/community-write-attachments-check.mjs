import { chromium } from '@playwright/test';

const url = process.env.WRITE_PARITY_URL || 'http://127.0.0.1:4173/community/naver-write-parity.html';
const onePixelPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZIfsAAAAASUVORK5CYII=', 'base64');
const browser = await chromium.launch({ headless:true });
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

for (const viewport of [{ name:'desktop', width:1440, height:900 }, { name:'mobile', width:384, height:844 }]) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  await page.goto(url, { waitUntil:'domcontentloaded' });

  await page.locator('#photoInput').setInputFiles([
    { name:'front.jpg', mimeType:'image/jpeg', buffer:onePixelPng },
    { name:'side.png', mimeType:'image/png', buffer:onePixelPng },
    { name:'rear.webp', mimeType:'image/webp', buffer:onePixelPng },
  ]);
  await page.waitForFunction(() => document.querySelectorAll('.editor-media').length === 3);
  assert(await page.locator('.editor-media').count() === 3, `${viewport.name}: multiple image upload`);
  assert(await page.locator('.cover-badge:not([hidden])').count() === 1, `${viewport.name}: one initial cover`);
  const orderBefore = await page.locator('.editor-media').evaluateAll((items) => items.map((item) => item.dataset.mediaId));
  await page.evaluate(() => {
    const items = [...document.querySelectorAll('.editor-media')];
    const dataTransfer = new DataTransfer();
    items[0].dispatchEvent(new DragEvent('dragstart', { bubbles:true, cancelable:true, dataTransfer }));
    const rect = items.at(-1).getBoundingClientRect();
    items.at(-1).dispatchEvent(new DragEvent('drop', { bubbles:true, cancelable:true, dataTransfer, clientY:rect.bottom - 1 }));
    items[0].dispatchEvent(new DragEvent('dragend', { bubbles:true, cancelable:true, dataTransfer }));
  });
  const orderAfter = await page.locator('.editor-media').evaluateAll((items) => items.map((item) => item.dataset.mediaId));
  assert(orderBefore.join(',') !== orderAfter.join(','), `${viewport.name}: drag reorder`);

  const second = page.locator('.editor-media').nth(1);
  await second.locator('img').click();
  assert(await second.locator('.media-quick-toolbar').isVisible(), `${viewport.name}: selection toolbar`);
  await second.locator('[data-action="set-cover"]').click();
  assert(await page.locator('.cover-badge:not([hidden])').count() === 1, `${viewport.name}: one cover after change`);
  assert(await second.locator('.cover-badge:not([hidden])').count() === 1, `${viewport.name}: selected cover`);

  await second.getByRole('button', { name:'작게', exact:true }).click();
  await second.getByRole('button', { name:'오른쪽 정렬', exact:true }).click();
  assert(await second.evaluate((el) => el.classList.contains('is-small') && el.dataset.align === 'right'), `${viewport.name}: width and alignment`);
  await second.locator('.photo-caption').fill('두 번째 사진 설명');

  await second.getByRole('button', { name:'링크', exact:true }).click();
  await page.locator('#toolUrl').fill('https://example.com/car');
  await page.locator('#toolApply').click();
  await second.getByRole('button', { name:'편집', exact:true }).click();
  await page.getByRole('button', { name:'↷ 오른쪽', exact:true }).click();
  await page.getByRole('button', { name:'흑백', exact:true }).click();
  await page.getByRole('button', { name:'1:1', exact:true }).click();
  await page.getByRole('button', { name:'완료', exact:true }).click();
  assert((await second.locator('img').getAttribute('style')).includes('rotate(90deg)'), `${viewport.name}: rotate applied`);
  assert((await second.locator('img').getAttribute('style')).includes('grayscale(1)'), `${viewport.name}: filter applied`);

  await second.getByRole('button', { name:'교체', exact:true }).click();
  await page.locator('#replacePhotoInput').setInputFiles({ name:'replacement.png', mimeType:'image/png', buffer:onePixelPng });
  await page.waitForFunction(() => document.querySelectorAll('.editor-media img')[1]?.alt === 'replacement.png');
  assert(await second.locator('.photo-caption').textContent() === '두 번째 사진 설명', `${viewport.name}: replace keeps caption`);

  await page.evaluate(() => {
    const file = new File([Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZIfsAAAAASUVORK5CYII='), c => c.charCodeAt(0))], 'drop.png', { type:'image/png' });
    const dt = new DataTransfer(); dt.items.add(file);
    document.querySelector('#postBody').dispatchEvent(new DragEvent('drop', { bubbles:true, cancelable:true, dataTransfer:dt }));
  });
  await page.waitForFunction(() => document.querySelectorAll('.editor-media').length === 4);
  assert(await page.locator('.editor-media').count() === 4, `${viewport.name}: drag drop upload`);

  await page.evaluate(() => {
    const file = new File([Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZIfsAAAAASUVORK5CYII='), c => c.charCodeAt(0))], 'paste.png', { type:'image/png' });
    const dt = new DataTransfer(); dt.items.add(file);
    document.querySelector('#postBody').dispatchEvent(new ClipboardEvent('paste', { bubbles:true, cancelable:true, clipboardData:dt }));
  });
  await page.waitForFunction(() => document.querySelectorAll('.editor-media').length === 5);
  assert(await page.locator('.editor-media').count() === 5, `${viewport.name}: clipboard upload`);

  await page.locator('#photoInput').setInputFiles({ name:'not-image.txt', mimeType:'text/plain', buffer:Buffer.from('x') });
  assert(await page.getByText('첨부하지 못한 사진', { exact:true }).isVisible(), `${viewport.name}: invalid format dialog`);
  await page.getByRole('button', { name:'확인', exact:true }).click();

  await page.getByRole('button', { name:'임시등록', exact:true }).click();
  const draftBeforeReload = await page.evaluate(() => JSON.parse(localStorage.getItem('bbm.community.writeDraft.v2')));
  assert(draftBeforeReload?.photos?.some((photo) => photo.caption === '두 번째 사진 설명'), `${viewport.name}: draft caption serialized`);
  await page.reload({ waitUntil:'domcontentloaded' });
  await page.getByRole('button', { name:/임시 1/ }).click();
  await page.getByRole('button', { name:'수정', exact:true }).click();
  await page.waitForTimeout(1200);
  if (process.env.DEBUG_ATTACHMENTS) console.log('restored', await page.evaluate(() => ({ saved:JSON.parse(localStorage.getItem('bbm.community.writeDraft.v2')).photos.map((p) => [p.id,p.caption]), dom:[...document.querySelectorAll('.editor-media')].map((f) => [f.dataset.mediaId,f.querySelector('.photo-caption').textContent]) })));
  assert(await page.locator('.editor-media').count() === 5, `${viewport.name}: draft image restore`);
  assert(await page.locator('.editor-media img').evaluateAll((images) => images.every((image) => image.naturalWidth > 0)), `${viewport.name}: restored image blobs`);
  assert(await page.locator('.photo-caption').evaluateAll((inputs) => inputs.filter((input) => input.textContent === '두 번째 사진 설명').length) === 1, `${viewport.name}: draft caption restore`);

  await page.locator('.editor-media').last().locator('img').click();
  await page.locator('.editor-media').last().getByRole('button', { name:'삭제', exact:true }).click();
  assert(await page.locator('.editor-media').count() === 4, `${viewport.name}: individual delete`);
  assert(runtimeErrors.length === 0, `${viewport.name}: runtime ${runtimeErrors.join(' | ')}`);
  assert(await page.evaluate(() => document.documentElement.scrollWidth === innerWidth), `${viewport.name}: horizontal overflow`);
  await context.close();
}

const limitContext = await browser.newContext({ viewport:{ width:1280, height:800 } });
const limitPage = await limitContext.newPage();
await limitPage.goto(url, { waitUntil:'domcontentloaded' });
assert(await limitPage.locator('#photoInput').getAttribute('accept') === '.jpg,.jpeg,.gif,.png,.bmp,.heic,.heif,.webp', 'limits: accepted extensions');
const hundredOne = Array.from({ length:101 }, (_, index) => ({ name:`photo-${index + 1}.png`, mimeType:'image/png', buffer:onePixelPng }));
await limitPage.locator('#photoInput').setInputFiles(hundredOne);
await limitPage.waitForFunction(() => document.querySelectorAll('.editor-media').length === 100, null, { timeout:30000 });
assert(await limitPage.locator('.editor-media').count() === 100, 'limits: maximum 100 photos');
assert(await limitPage.getByText('첨부하지 못한 사진', { exact:true }).isVisible(), 'limits: overflow feedback');
await limitPage.getByRole('button', { name:'확인', exact:true }).click();
await limitContext.close();

const rejectContext = await browser.newContext({ viewport:{ width:1280, height:800 } });
const rejectPage = await rejectContext.newPage();
await rejectPage.goto(url, { waitUntil:'domcontentloaded' });
await rejectPage.locator('#photoInput').setInputFiles({ name:'over-20mb.png', mimeType:'image/png', buffer:Buffer.alloc(20 * 1024 * 1024 + 1) });
assert(await rejectPage.locator('.editor-media').count() === 0, 'limits: reject image over 20MB');
assert(await rejectPage.getByText(/20MB 초과/).isVisible(), 'limits: oversize feedback');
await rejectContext.close();

await browser.close();
if (failures.length) { console.error(JSON.stringify({ ok:false, failures }, null, 2)); process.exit(1); }
console.log(JSON.stringify({ ok:true, scenarios:22, viewports:['desktop','mobile'] }, null, 2));
