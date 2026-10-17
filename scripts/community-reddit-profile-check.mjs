import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const baseUrl = process.env.BBM_BASE_URL || 'http://127.0.0.1:4182';
const outputDir = path.join(root, 'artifacts', 'community-reddit-profile-1017');
await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
let failed = false;

for (const width of [360, 384, 412]) {
  const page = await browser.newPage({ viewport: { width, height: 852 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${baseUrl}/community/reddit-profile.html`, { waitUntil: 'networkidle' });
  const initial = await page.evaluate(() => ({
    width: Math.round(document.querySelector('.profilePhone').getBoundingClientRect().width),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    tabs: [...document.querySelectorAll('.tabBtn')].map((el) => el.textContent.trim()),
    active: document.querySelector('.tabBtn.active')?.dataset.tab,
    heroHeight: Math.round(document.querySelector('.profileHero').getBoundingClientRect().height),
    broken: [...document.images].filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.getAttribute('src'))
  }));
  const checks = {
    frame: initial.width === Math.min(width, 393),
    noOverflow: !initial.overflow,
    tabs: initial.tabs.join('|') === '게시물|댓글|저장 항목|정보' && initial.active === 'posts',
    hero: initial.heroHeight === 405,
    images: initial.broken.length === 0
  };
  for (const tab of ['comments', 'saved', 'about', 'posts']) {
    await page.locator(`[data-tab="${tab}"]`).click();
    checks[`tab_${tab}`] = await page.locator(`[data-panel="${tab}"]`).isVisible();
  }
  if (width === 384) {
    await page.screenshot({ path: path.join(outputDir, 'profile-posts-384.png'), fullPage: true });
    await page.locator('[data-tab="comments"]').click();
    await page.screenshot({ path: path.join(outputDir, 'profile-comments-384.png'), fullPage: true });
    await page.locator('[data-tab="saved"]').click();
    await page.screenshot({ path: path.join(outputDir, 'profile-saved-384.png'), fullPage: true });
    await page.locator('[data-tab="about"]').click();
    await page.screenshot({ path: path.join(outputDir, 'profile-about-384.png'), fullPage: true });
    await page.goto(`${baseUrl}/community/reddit-profile-edit.html`, { waitUntil: 'networkidle' });
    await page.locator('#displayNameInput').fill('테스트 오너');
    await page.locator('#bioInput').fill('직접 타본 차량 이야기를 기록합니다.');
    await page.locator('#addSocial').click();
    await page.locator('.socialRow input').fill('https://example.com/owner');
    checks.editEnabled = await page.locator('#saveProfile').isEnabled();
    await page.screenshot({ path: path.join(outputDir, 'profile-edit-384.png'), fullPage: true });
    await Promise.all([page.waitForURL(/reddit-profile\.html/), page.locator('#saveProfile').click()]);
    checks.persisted = (await page.locator('#displayName').textContent())?.trim() === '테스트 오너' && (await page.locator('#profileBio').textContent())?.trim().includes('차량 이야기');
    await page.evaluate(() => localStorage.removeItem('bbm.community.profile.v1'));
  }
  checks.runtime = errors.length === 0;
  if (Object.values(checks).some((value) => !value)) failed = true;
  results.push({ width, checks, initial, errors });
  await page.close();
}
await browser.close();
await fs.writeFile(path.join(outputDir, 'results.json'), `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify({ pass: !failed, results }, null, 2));
if (failed) process.exitCode = 1;
