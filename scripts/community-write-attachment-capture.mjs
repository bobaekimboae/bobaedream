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
  await page.locator('#photoInput').setInputFiles(photos);
  await page.waitForFunction(() => document.querySelectorAll('.editor-media img').length === 3 && [...document.querySelectorAll('.editor-media img')].every((image) => image.naturalWidth > 0));
  await page.locator('.editor-media').nth(1).locator('img').click();
  await page.locator('.editor-media').nth(1).locator('.photo-caption').fill('측면 디자인과 휠 상태를 확인해 주세요.');
  await page.locator('.editor-media').nth(1).scrollIntoViewIfNeeded();
  await page.screenshot({ path:path.join(output, `${viewport.name}.png`), fullPage:true });
  await context.close();
}
await browser.close();
console.log(JSON.stringify({ output, files:['pc-1440.png','mobile-384.png'] }, null, 2));
