import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.env.COMMUNITY_ROOT || 'http://127.0.0.1:4314';
const out = path.resolve('artifacts', 'community-fuel-economy-gate-1017');
const failures = [];
const results = [];
const check = (value, label) => { const pass = Boolean(value); results.push({ label, pass }); if (!pass) failures.push(label); };
await mkdir(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

await page.goto(`${root}/community/naver-cafe-list.html?board=fuel-economy`, { waitUntil: 'networkidle' });
await page.locator('.feb-card').first().waitFor();
check(await page.locator('.feb-card').count() === 20, '독립 게시판 테스트 기록 20개');
check(await page.locator('.feb-metrics').count() === 20, '모든 피드 카드에 에너지 수치 표시');
check(await page.locator('.feb-avatar img').count() >= 20, '모든 피드 카드에 브랜드 엠블럼 표시');
check((await page.locator('.boardSelectName').textContent())?.trim() === '연비·전비', '게시판명이 연비·전비로 표시');
await page.screenshot({ path: path.join(out, '01-list-mobile.png'), fullPage: true });

await page.locator('[data-type="ev"]').click();
check(await page.locator('.feb-card').count() > 0, '전기차 필터 동작');
check(await page.locator('.feb-card').evaluateAll((nodes) => nodes.every((node) => node.textContent.includes('전기차'))), '전기차 필터 결과 일치');
await page.locator('.feb-card-main').first().click();
await page.locator('.feb-detail').waitFor();
check(await page.locator('.feb-detail-metrics span').count() >= 2, '전기차 상세에 전비와 완충 실주행거리 표시');
check(await page.locator('.feb-comments form').count() === 1, '상세 댓글 입력 기능 표시');
check(await page.locator('.feb-actions button').count() === 3, '상세 하단 동작 버튼 표시');
await page.screenshot({ path: path.join(out, '02-detail-mobile.png'), fullPage: true });

await page.goto(`${root}/?community=fuel-economy&fuel=write&from=community`, { waitUntil: 'networkidle' });
await page.locator('.fe-write').waitFor();
check((await page.locator('.fe-head strong').textContent())?.trim() === '연비·전비 기록', '전용 글쓰기 화면 진입');
check(await page.locator('.fe-fields').count() === 0, '차량 선택 전 에너지 입력란 숨김');
await page.locator('.fe-model').click();
await page.getByRole('button', { name: /포르쉐 타이칸/ }).click();
const evText = await page.locator('.fe-fields').innerText();
check(evText.includes('평균 전비') && evText.includes('완충 실주행거리') && !evText.includes('평균 연비'), '전기차 가변 항목 정확');
await page.locator('.fe-model').click();
await page.getByRole('button', { name: /우루스 SE/ }).click();
const phevText = await page.locator('.fe-fields').innerText();
check(phevText.includes('평균 전비') && phevText.includes('평균 연비') && !phevText.includes('완충 실주행거리'), '플러그인 하이브리드 가변 항목 정확');
await page.locator('.fe-model').click();
await page.getByRole('button', { name: /BMW M3/ }).click();
const iceText = await page.locator('.fe-fields').innerText();
check(iceText.includes('평균 연비') && !iceText.includes('평균 전비') && !iceText.includes('완충 실주행거리'), '내연기관 가변 항목 정확');
await page.locator('.fe-fields select').selectOption({ label: '서울' });
await page.locator('.fe-fields input').nth(0).fill('12400');
await page.locator('.fe-fields input').nth(1).fill('8.7');
await page.locator('.fe-body textarea').fill('서울 도심 출퇴근과 자동차전용도로를 함께 주행하고 공조를 켠 상태에서 측정한 실제 연비입니다.');
await page.screenshot({ path: path.join(out, '03-writer-ice.png'), fullPage: true });
await page.locator('.fe-submit').click();
await page.waitForURL(/board=fuel-economy.*energy=energy-local-/);
await page.locator('.feb-detail').waitFor();
check((await page.locator('.feb-detail-metrics').innerText()).includes('8.7'), '새 기록 저장 후 상세 수치 유지');
check((await page.locator('.feb-facts').innerText()).includes('12,400km'), '새 기록 저장 후 주행거리 유지');
await page.screenshot({ path: path.join(out, '04-created-detail.png'), fullPage: true });

const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
desktop.on('pageerror', (error) => errors.push(error.message));
await desktop.goto(`${root}/community/naver-cafe-list.html?board=fuel-economy`, { waitUntil: 'networkidle' });
await desktop.locator('.feb-card').first().waitFor();
check(await desktop.locator('.feb-shell').evaluate((node) => node.getBoundingClientRect().width <= 620), 'PC에서 읽기 폭 620px 이하 유지');
await desktop.screenshot({ path: path.join(out, '05-list-desktop.png'), fullPage: true });

check(errors.length === 0, `브라우저 오류 0건 (${errors.join(' | ')})`);
await browser.close();
const report = { ok: failures.length === 0, pass: results.filter((row) => row.pass).length, fail: failures.length, failures, errors, results, outputDir: out };
await writeFile(path.join(out, 'result.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);
