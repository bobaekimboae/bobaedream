import { chromium } from '@playwright/test';

const url = process.env.WRITE_PARITY_URL || 'http://127.0.0.1:4173/community/naver-write-parity.html';
const viewports = [{ name:'PC-1536', width:1536, height:864 }, { name:'모바일-384', width:384, height:844 }];
const expectedFonts = ['기본서체','나눔고딕','나눔명조','나눔바른고딕','나눔스퀘어','나눔스퀘어 네오','마루부리','다시시작해','바른히피','우리딸손글씨'];
const expectedSizes = ['11','13','15','16','19','24','28','30','34','38'];
const expectedAlignments = ['왼쪽','가운데','오른쪽','양쪽'];
const checks = [];
const failures = [];
const record = (id, name, ok, detail = '') => { checks.push({ id, name, ok, detail }); if (!ok) failures.push(`${id} ${name}${detail ? ` — ${detail}` : ''}`); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const browser = await chromium.launch({ headless:true });
for (const viewport of viewports) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(url, { waitUntil:'domcontentloaded' });
  const tag = viewport.name;

  const boardInputs = page.locator('#boardList input[type="radio"]');
  record('NW-01', `${tag} 게시판 단일선택`, await page.locator('.board-select').count() === 1 && await boardInputs.count() === 10 && await boardInputs.evaluateAll((els) => els.every((el) => el.name === 'taxonomy')));
  record('NW-02', `${tag} 말머리 종속선택`, await page.locator('.head-select').isDisabled());
  record('NW-03', `${tag} 제목 80자 제한`, await page.locator('#postTitle').getAttribute('maxlength') === '80');
  record('NW-04', `${tag} 본문 편집`, await page.locator('#postBody[contenteditable="true"]').count() === 1);
  record('NW-05', `${tag} 사진 다중첨부`, await page.locator('#photoInput[multiple]').count() === 1);
  record('NW-06', `${tag} 동영상`, await page.getByRole('button', { name:'동영상', exact:true }).count() === 1);
  record('NW-07', `${tag} 텍스트 도구`, await page.getByRole('button', { name:'텍스트 도구막대' }).count() === 1);
  record('NW-08', `${tag} 이모지`, await page.getByRole('button', { name:'스티커', exact:true }).count() === 1);
  record('NW-09', `${tag} 글감`, await page.getByRole('button', { name:'글감', exact:true }).count() === 1);
  record('NW-10', `${tag} 인용구`, await page.getByRole('button', { name:'인용구', exact:true }).count() === 1);
  record('NW-11', `${tag} 구분선`, await page.getByRole('button', { name:'구분선', exact:true }).count() === 1);
  record('NW-12', `${tag} 링크`, await page.getByRole('button', { name:'링크', exact:true }).count() >= 1);
  record('NW-13', `${tag} 일반파일`, await page.locator('#fileInput[type="file"]').count() === 1);
  record('NW-14', `${tag} 장소`, await page.getByRole('button', { name:'장소', exact:true }).count() === 1);
  record('NW-15', `${tag} 투표`, await page.getByRole('button', { name:'투표', exact:true }).count() === 1);

  await page.locator('#postBody').fill('보배드림 텍스트 편집 기능');
  await page.locator('#postBody').evaluate((el) => { const range=document.createRange(); range.selectNodeContents(el); const selection=getSelection(); selection.removeAllRanges(); selection.addRange(range); });
  await page.getByRole('button', { name:'텍스트 도구막대' }).click();
  record('NW-16', `${tag} 문단 스타일`, same(await page.locator('#blockStyle option').allTextContents(), ['본문','인용구']));
  record('NW-17', `${tag} 네이버 글꼴 9종`, same(await page.locator('#fontFamily option').allTextContents(), expectedFonts));
  record('NW-18', `${tag} 네이버 글자크기 10종`, same(await page.locator('#fontSize option').allTextContents(), expectedSizes));
  record('NW-19', `${tag} 문단 정렬 4종`, same(await page.locator('#textAlign option').allTextContents(), expectedAlignments));
  await page.locator('#fontFamily').selectOption('Nanum Gothic');
  await page.locator('#fontSize').selectOption('24');
  const formattedHtml = await page.locator('#postBody').innerHTML();
  record('NW-20', `${tag} 글꼴 실제 적용`, /font-family:.*Nanum Gothic/i.test(formattedHtml), formattedHtml);
  record('NW-21', `${tag} 글자크기 실제 적용`, /font-size:\s*24px/i.test(formattedHtml), formattedHtml);
  await page.locator('#textAlign').selectOption('justifyCenter');
  record('NW-22', `${tag} 가운데 정렬 실제 적용`, await page.locator('#postBody').evaluate((el) => getComputedStyle(el.firstElementChild || el).textAlign === 'center'));
  record('NW-23', `${tag} 굵게`, await page.getByRole('button', { name:'굵게' }).count() === 1);
  record('NW-24', `${tag} 기울이기`, await page.getByRole('button', { name:'기울이기' }).count() === 1);
  record('NW-25', `${tag} 밑줄`, await page.getByRole('button', { name:'밑줄' }).count() === 1);
  record('NW-26', `${tag} 글자색`, await page.locator('#foreColor[type="color"]').count() === 1);
  record('NW-27', `${tag} 배경색`, await page.locator('#backColor[type="color"]').count() === 1);
  record('NW-28', `${tag} 취소선`, await page.getByRole('button', { name:'취소선' }).count() === 1);

  record('NW-29', `${tag} 태그 10개 안내`, (await page.locator('#postTags').getAttribute('placeholder')).includes('최대10개'));
  await page.locator('#visibilityButton').click();
  record('NW-30', `${tag} 공개 범위 2종`, same(await page.locator('input[name="visibility"]').evaluateAll((els) => els.map((el) => el.value)), ['전체 공개','멤버 공개']));
  await page.locator('[data-action="close-tool"]').first().click();
  record('NW-31', `${tag} 검색 허용`, await page.locator('#allowSearch').count() === 1);
  record('NW-32', `${tag} 상세설정 기본 접힘`, await page.locator('#advancedPermissions').isHidden());
  await page.getByRole('button', { name:'상세설정 펼치기' }).click();
  record('NW-33', `${tag} 스크랩 허용`, await page.getByText('카페 · 블로그 스크랩 허용', { exact:true }).isVisible());
  record('NW-34', `${tag} 복사·저장 허용`, await page.getByText('복사 · 저장 허용', { exact:true }).isVisible());
  record('NW-35', `${tag} 임시글`, await page.getByRole('button', { name:'임시등록' }).count() === 1);
  record('NW-36', `${tag} 등록 유효성`, await page.getByRole('button', { name:'등록', exact:true }).first().isDisabled());
  record('NW-37', `${tag} 검정 액션 토큰`, await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() === '#222'));
  record('NW-38', `${tag} 가로 넘침 없음`, await page.evaluate(() => document.documentElement.scrollWidth === innerWidth));
  record('NW-39', `${tag} 접근 가능한 레이블`, await page.locator('[aria-label],label').count() >= 20);
  record('NW-40', `${tag} 런타임 오류 없음`, errors.length === 0, errors.join(' | '));
  await context.close();
}
await browser.close();

const uniqueIds = new Set(checks.map((check) => check.id));
console.log(JSON.stringify({ ok:failures.length === 0, numberedFeatures:uniqueIds.size, checks:checks.length, failures }, null, 2));
if (failures.length) process.exit(1);
