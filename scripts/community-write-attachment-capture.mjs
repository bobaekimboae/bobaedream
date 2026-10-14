import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const url = process.env.WRITE_PARITY_URL || 'http://127.0.0.1:4173/community/naver-write-parity.html';
const root = process.cwd();
const output = path.join(root, 'artifacts', 'community-write-attachment-parity-1015');
const photos = ['sedan.png','suv.png','coupe.png'].map((name) => path.join(root, 'public', 'prototypes', 'passenger-body-types', 'assets', name));
await mkdir(output, { recursive:true });
const browser = await chromium.launch({ headless:true });
for (const viewport of [{ name:'pc-1440', width:1440, height:900 }, { name:'mobile-384', width:384, height:844 }]) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto(url, { waitUntil:'domcontentloaded' });
  if (viewport.name === 'mobile-384') {
    await page.getByRole('button', { name:'게시판 선택' }).click();
    await page.screenshot({ path:path.join(output, 'mobile-384-board-select.png') });
    await page.getByLabel('국산차 오너톡').check();
    await page.getByRole('button', { name:'말머리 선택' }).click();
    await page.screenshot({ path:path.join(output, 'mobile-384-head-select.png') });
    await page.getByLabel('현대').check();
    await page.getByRole('button', { name:'투표', exact:true }).click();
    await page.locator('#pollQuestion').fill('가장 기대되는 국산 전기차는?');
    await page.locator('.poll-option-input').nth(0).fill('현대 아이오닉 5');
    await page.locator('.poll-option-input').nth(1).fill('기아 EV6');
    await page.screenshot({ path:path.join(output, 'mobile-384-poll-dialog.png') });
    await page.locator('#toolApply').click();
  }
  await page.locator('#photoInput').setInputFiles(photos);
  await page.waitForFunction(() => document.querySelectorAll('.editor-media img').length === 3 && [...document.querySelectorAll('.editor-media img')].every((image) => image.naturalWidth > 0));
  await page.locator('.editor-media').nth(1).locator('img').click();
  await page.locator('.editor-media').nth(1).locator('.photo-caption').fill('측면 디자인과 휠 상태를 확인해 주세요.');
  await page.locator('.editor-media').nth(1).scrollIntoViewIfNeeded();
  await page.screenshot({ path:path.join(output, `${viewport.name}.png`), fullPage:true });
  if (viewport.name === 'mobile-384') {
    await page.locator('#postBody').focus();
    await page.locator('#postTags').scrollIntoViewIfNeeded();
    await page.screenshot({ path:path.join(output, 'mobile-384-focus-boundary.png') });
  }
  await context.close();
}
await browser.close();
console.log(JSON.stringify({ output, files:['pc-1440.png','mobile-384.png','mobile-384-focus-boundary.png','mobile-384-board-select.png','mobile-384-head-select.png','mobile-384-poll-dialog.png'] }, null, 2));
