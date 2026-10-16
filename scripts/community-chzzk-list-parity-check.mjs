import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const baseUrl = process.env.BBM_BASE_URL || 'http://127.0.0.1:4182';
const outputDir = path.join(root, 'artifacts', 'community-chzzk-list-parity-1017');
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];
let failed = false;

for (const width of [360, 384, 412]) {
  const page = await browser.newPage({ viewport: { width, height: 852 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${baseUrl}/community/naver-cafe-list.html?view=compact`, { waitUntil: 'networkidle' });

  const metrics = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.item')];
    const freshRows = rows.filter((row) => row.classList.contains('fresh'));
    const visibleDots = rows.filter((row) => getComputedStyle(row.querySelector('.dot')).display !== 'none');
    const thumbs = [...document.querySelectorAll('.item .thumbWrap')];
    const noThumbs = rows.filter((row) => row.classList.contains('noThumb'));
    const firstThumbRow = rows.find((row) => row.querySelector('.thumbWrap'));
    const firstThumb = firstThumbRow?.querySelector('.thumbWrap');
    const title = firstThumbRow?.querySelector('.body');
    const reply = document.querySelector('.compactReply');
    const item = rows[0];
    const thumbStyle = firstThumb ? getComputedStyle(firstThumb) : null;
    return {
      compact: document.querySelector('.phone')?.classList.contains('compactMode'),
      listType: document.getElementById('typeLabel')?.textContent?.trim(),
      descriptionsHidden: getComputedStyle(document.getElementById('boardDescriptionSection')).display === 'none' && getComputedStyle(document.getElementById('headwordSection')).display === 'none',
      notices: document.querySelectorAll('.compactNotice').length,
      botVisible: getComputedStyle(document.getElementById('compactLead')).display !== 'none',
      rows: rows.length,
      freshRows: freshRows.length,
      visibleDots: visibleDots.length,
      thumbs: thumbs.length,
      noThumbs: noThumbs.length,
      videoBadges: [...document.querySelectorAll('.thumbWrap>.play')].filter((el) => getComputedStyle(el).display !== 'none').length,
      linkBadges: document.querySelectorAll('.mediaLinkBadge').length,
      photoBadges: document.querySelectorAll('.photoBadge').length,
      rightThumb: Boolean(firstThumb && title && firstThumb.getBoundingClientRect().left > title.getBoundingClientRect().left),
      itemHeight: item ? Math.round(item.getBoundingClientRect().height) : 0,
      thumbSize: thumbStyle ? [Math.round(parseFloat(thumbStyle.width)), Math.round(parseFloat(thumbStyle.height))] : [0, 0],
      replyColor: reply ? getComputedStyle(reply).color : '',
      recommendIcon: document.querySelector('.metaRecommend .metaAsset')?.getAttribute('src') || '',
      brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.getAttribute('src')),
      firstItemTarget: item?.getAttribute('data-id') || '',
      noticeTarget: document.querySelector('.compactNotice')?.getAttribute('data-notice-id') || ''
    };
  });

  const checks = {
    compactRoute: metrics.compact && metrics.listType === '간결형',
    chzzkLead: metrics.descriptionsHidden && metrics.notices === 3 && metrics.botVisible,
    mixedRows: metrics.rows >= 20 && metrics.thumbs > 0 && metrics.noThumbs > 0,
    mediaStates: metrics.videoBadges > 0 && metrics.linkBadges > 0 && metrics.photoBadges > 0,
    newDots: metrics.visibleDots === metrics.freshRows,
    rightThumb: metrics.rightThumb,
    dimensions: metrics.itemHeight === 70 && metrics.thumbSize[0] === 52 && metrics.thumbSize[1] === 52,
    preservedExceptions: metrics.replyColor === 'rgb(35, 143, 227)' && metrics.recommendIcon.includes('recommend-thumb-up.svg'),
    targets: metrics.firstItemTarget === '1' && metrics.noticeTarget === '1',
    runtime: errors.length === 0
  };
  if (width === 384) {
    await Promise.all([
      page.waitForURL(/chzzk-detail\.html\?id=1&v=20261015chzzk/),
      page.locator('.item[data-id="1"]').click()
    ]);
    checks.itemNavigation = page.url().includes('chzzk-detail.html?id=1');
    await page.goto(`${baseUrl}/community/naver-cafe-list.html?view=compact`, { waitUntil: 'networkidle' });
    await Promise.all([
      page.waitForURL(/chzzk-detail\.html\?id=1&v=20261017compactnotice/),
      page.locator('.compactNotice[data-notice-id="1"]').click()
    ]);
    checks.noticeNavigation = page.url().includes('v=20261017compactnotice');
    await page.goto(`${baseUrl}/community/naver-cafe-list.html?view=compact`, { waitUntil: 'networkidle' });
  }
  if (Object.values(checks).some((value) => !value)) failed = true;
  results.push({ width, checks, metrics, errors });
  if (width === 384) await page.screenshot({ path: path.join(outputDir, 'implementation-mobile-384.png'), fullPage: true });
  await page.close();
}

await browser.close();
await fs.writeFile(path.join(outputDir, 'results.json'), `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify({ pass: !failed, results }, null, 2));
if (failed) process.exitCode = 1;
