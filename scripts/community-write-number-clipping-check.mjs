import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.WRITE_PARITY_URL || 'http://127.0.0.1:4173/community/naver-write-parity.html';
const outputDir = path.resolve('artifacts', 'community-write-number-clipping-1015');
const viewports = [
  { name:'mobile-360', width:360, height:800 },
  { name:'mobile-384', width:384, height:844 },
  { name:'mobile-412', width:412, height:915 },
  { name:'desktop-1536', width:1536, height:864 },
];
const fontSizes = ['11','13','15','16','19','24','28','30','34','38'];
const failures = [];
const results = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function numericLeafAudit() {
  const visibleDialog = [...document.querySelectorAll('.tool-dialog')].find((dialog) => dialog.getClientRects().length > 0);
  const root = visibleDialog || document.querySelector('main') || document.body;
  return [...root.querySelectorAll('*')]
    .filter((element) => {
      if (element.getClientRects().length === 0 || element.tagName === 'OPTION') return false;
      if (element.matches('.sr-only,input[type="color"]')) return false;
      const text = (element.matches('input,select') ? element.value : element.innerText || element.textContent || '').trim();
      if (!/\d/.test(text)) return false;
      if (element.matches('input,select')) return true;
      return ![...element.children].some((child) => /\d/.test((child.innerText || child.textContent || '').trim()));
    })
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        tag:element.tagName,
        id:element.id || '',
        className:typeof element.className === 'string' ? element.className : '',
        text:(element.matches('input,select') ? element.value : element.innerText || element.textContent || '').trim(),
        outsideViewport:rect.left < -0.5 || rect.right > innerWidth + 0.5,
        internalOverflow:element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1,
      };
    });
}

await mkdir(outputDir, { recursive:true });
const browser = await chromium.launch({ headless:true });

for (const viewport of viewports) {
  const page = await browser.newPage({ viewport });
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(message.text()); });
  await page.goto(baseUrl, { waitUntil:'load' });
  await page.getByRole('button', { name:'텍스트 도구막대' }).click();

  const toolbar = page.locator('.text-toolbar');
  const sizeSelect = page.locator('#fontSize');
  const selectStyle = await sizeSelect.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const barRect = element.closest('.text-toolbar').getBoundingClientRect();
    return {
      appearance:style.appearance,
      backgroundImage:style.backgroundImage,
      paddingLeft:Number.parseFloat(style.paddingLeft),
      paddingRight:Number.parseFloat(style.paddingRight),
      width:rect.width,
      fullyVisible:rect.left >= barRect.left - 0.5 && rect.right <= barRect.right + 0.5,
    };
  });
  check(selectStyle.appearance === 'none', `${viewport.name}: font-size select still uses native appearance`);
  check(selectStyle.backgroundImage.includes('chevron-down.svg'), `${viewport.name}: custom chevron missing`);
  check(selectStyle.width >= 68, `${viewport.name}: font-size width ${selectStyle.width}`);
  check(selectStyle.width - selectStyle.paddingLeft - selectStyle.paddingRight >= 30, `${viewport.name}: font-size text budget too small`);
  check(selectStyle.fullyVisible, `${viewport.name}: font-size control is clipped by toolbar`);

  const sizeChecks = [];
  for (const value of fontSizes) {
    await sizeSelect.selectOption(value);
    const selected = await sizeSelect.inputValue();
    sizeChecks.push({ value, selected, pass:selected === value });
    check(selected === value, `${viewport.name}: font-size ${value} did not remain selected`);
  }

  await page.locator('#blockStyle').selectOption('blockquote');
  await page.locator('#fontFamily').selectOption('NanumSquareNeo');
  await sizeSelect.selectOption('38');
  await page.locator('#textAlign').selectOption('justifyCenter');
  await page.screenshot({ path:path.join(outputDir, `${viewport.name}-toolbar-long-values.png`), fullPage:false });

  const baseNumbers = (await page.evaluate(numericLeafAudit)).filter((item) => !['foreColor','backColor'].includes(item.id));
  check(baseNumbers.every((item) => !item.internalOverflow || item.tag === 'SELECT'), `${viewport.name}: base numeric overflow ${JSON.stringify(baseNumbers)}`);

  await page.getByRole('button', { name:'투표', exact:true }).click();
  const pollNumbers = await page.evaluate(numericLeafAudit);
  check(pollNumbers.every((item) => !item.internalOverflow && !item.outsideViewport), `${viewport.name}: poll numeric clipping ${JSON.stringify(pollNumbers)}`);
  await page.screenshot({ path:path.join(outputDir, `${viewport.name}-poll-numbers.png`), fullPage:false });
  await page.getByRole('dialog', { name:'투표 만들기' }).getByRole('button', { name:'닫기' }).click();

  await page.getByRole('button', { name:'스티커', exact:true }).click();
  await page.locator('#emojiResultCount').waitFor({ state:'visible' });
  const emojiNumbers = await page.evaluate(numericLeafAudit);
  check(emojiNumbers.every((item) => !item.internalOverflow && !item.outsideViewport), `${viewport.name}: emoji numeric clipping ${JSON.stringify(emojiNumbers)}`);
  await page.screenshot({ path:path.join(outputDir, `${viewport.name}-emoji-numbers.png`), fullPage:false });

  results.push({
    viewport:viewport.name,
    fontSizes:sizeChecks,
    toolbar:{ clientWidth:await toolbar.evaluate((element) => element.clientWidth), scrollWidth:await toolbar.evaluate((element) => element.scrollWidth) },
    baseNumbers,
    pollNumbers:pollNumbers.filter((item) => /(?:\d+일|\d+개|최대\d+)/.test(item.text)),
    emojiNumbers:emojiNumbers.filter((item) => /\d/.test(item.text)),
    runtimeErrors,
  });
  check(runtimeErrors.length === 0, `${viewport.name}: runtime errors ${runtimeErrors.join(' | ')}`);
  await page.close();
}

await browser.close();

if (failures.length) {
  console.error(JSON.stringify({ ok:false, failures, results }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok:true, viewports:viewports.map(({ name }) => name), fontSizes, results, outputDir }, null, 2));
