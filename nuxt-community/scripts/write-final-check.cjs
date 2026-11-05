// 커뮤니티 글쓰기(치지직형) 최종 기능 시험 51항목. usage: FIX=<시험 파일 폴더> node scripts/write-final-check.cjs [base]
const { chromium } = require('playwright');
const BASE = process.argv[2] || 'http://127.0.0.1:5230';
const URL = BASE + '/bobaedream/nuxt-community/#/write';
const D = process.env.FIX || __dirname; // 시험용 사진(car_a.jpg · car_b.jpg)과 동영상(clip.webm)이 있는 폴더
const results = [];
const ok = (name, pass, info = '') => { results.push([pass ? 'PASS' : 'FAIL', name, info]); };
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ viewport: { width: 384, height: 832 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const p = await c.newPage(); p.setDefaultTimeout(4000);
  const errs = [];
  await p.route(/unsplash|youtube|instagram|microlink|tiktok|ytimg|cdninstagram|googleusercontent|jsonlink|noembed/, r => r.abort());
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_FAILED|net::/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  p.on('response', r => { if (r.status() >= 400 && !/favicon/.test(r.url())) errs.push('HTTP ' + r.status() + ' ' + r.url()); });
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(700);
  const W = sel => p.locator(sel).first();
  const count = sel => p.locator(sel).count();
  const body = 'article.aw-editor-body';
  const tool = l => `.aw-tools [aria-label="${l}"]`;
  const step = async (name, fn) => { console.error('STEP', name); try { await fn(); } catch (e) { ok(name, false, 'ERR ' + e.message.split('\n')[0]); } };

  // 1. 첫 화면
  await step('첫 화면', async () => {
    const icons = await p.$$eval('.aw-tools button img', a => a.map(i => i.getAttribute('src').replace(/.*\//, '')));
    ok('도구 줄 8개', icons.length === 8, icons.join(','));
    ok('등록 꺼짐', await W('.aw-head .is-submit').getAttribute('aria-disabled') === 'true');
  });
  // 2. 제목 없이 등록
  await step('제목 없이 저장', async () => {
    await W('.aw-head .is-save').click(); await p.waitForTimeout(300);
    const t = await p.locator('.aw-alert').innerText().catch(() => '');
    ok('제목 없음 안내', /제목을 입력/.test(t), t.replace(/\n/g, ' '));
    if (await count('.aw-alert-ok')) await W('.aw-alert-ok').click();
  });
  // 3. 게시판 선택
  await step('게시판 선택', async () => {
    await W('.aw-board').click(); await p.waitForTimeout(300);
    const n = await count('.aw-board-list button');
    ok('게시판 목록 열림', n > 3, n + '개');
    await W('.aw-board-list button').click(); await p.waitForTimeout(300);
    const v = await W('.aw-board span').innerText();
    ok('게시판 반영', !/선택하세요/.test(v), v);
  });
  // 4. 제목 · 등록 켜짐
  await step('제목', async () => {
    await W('#awTitle').fill('기능 시험 제목');
    await p.waitForTimeout(200);
    ok('등록 켜짐', await W('.aw-head .is-submit').getAttribute('aria-disabled') === 'false');
  });
  // 5. 본문 + 서식
  await step('본문 서식', async () => {
    await W(body).click(); await p.keyboard.type('본문 첫 줄');
    await W(tool('텍스트 서식')).click(); await p.waitForTimeout(200);
    ok('서식 줄 열림', await count('.aw-format') > 0);
    await p.keyboard.press('Shift+Home');
    for (const l of ['굵게', '기울이기', '밑줄', '취소선']) { await W(`.aw-format [aria-label="${l}"]`).click(); await p.waitForTimeout(80); }
    const html = await W(body).innerHTML();
    ok('굵게·기울임·밑줄·취소선', /<strong|<b>/.test(html) && /<em|<i>/.test(html) && /<u>/.test(html) && /<s>|<del|<strike/.test(html), html.slice(0, 160));
    await W('.aw-format [aria-label="글자색"]').click(); await p.waitForTimeout(150);
    const sw = await count('.aw-swatch');
    ok('색 목록', sw >= 10, sw + '개');
    await p.locator('.aw-swatch').nth(3).click(); await p.waitForTimeout(150);
    ok('글자색 적용', /color/.test(await W(body).innerHTML()));
    if (await count('.aw-format-back')) await W('.aw-format-back').click();
    await W('.aw-format-text.is-size').click(); await p.waitForTimeout(150);
    const sizes = await p.locator('.aw-format button').allInnerTexts();
    ok('글자 크기 목록', sizes.some(s => /24/.test(s)), sizes.join('|').slice(0, 80));
    await p.locator('.aw-format button', { hasText: '24' }).first().click(); await p.waitForTimeout(150);
    ok('글자 크기 적용', /font-size:\s*24px/.test(await W(body).innerHTML()));
    if (await count('.aw-format-back')) await W('.aw-format-back').click();
    await W('.aw-format [aria-label="목록"]').click(); await p.waitForTimeout(150);
    ok('목록 적용', /<ul/.test(await W(body).innerHTML()));
    await W('.aw-format [aria-label="목록"]').click();
    await p.keyboard.press('End'); await p.keyboard.press('Enter');
    await W(tool('텍스트 서식')).click().catch(() => {});
  });
  // 6. 인용구
  await step('인용구', async () => {
    await W(body).click(); await p.keyboard.press('Control+End');
    await W(tool('인용구')).click(); await p.waitForTimeout(200);
    ok('인용구 들어감', await count('.aw-editor-body blockquote, .aw-editor-body [data-quote]') > 0);
    await p.keyboard.type('인용 내용');
    const minis = await count('.aw-quote-mini');
    ok('인용구 모양 6가지', minis >= 6, minis + '개');
    if (minis >= 3) { await p.locator('.aw-quote-pick, .aw-quote-mini').nth(2).click(); await p.waitForTimeout(150); }
    await p.keyboard.press('Enter'); await p.keyboard.press('Enter');
    await p.waitForTimeout(150);
  });
  // 7. 구분선
  await step('구분선', async () => {
    await W(body).click(); await p.keyboard.press('Control+End');
    const before = await count('.aw-editor-body hr, .aw-editor-body [data-divider]');
    await W(tool('구분선')).click(); await p.waitForTimeout(250);
    const after = await count('.aw-editor-body hr, .aw-editor-body [data-divider]');
    ok('구분선 들어감', after === before + 1, `${before}→${after}`);
    await p.locator('.aw-editor-body hr, .aw-editor-body [data-divider]').last().click(); await p.waitForTimeout(250);
    const picks = await count('.aw-divider-picks button');
    ok('구분선 모양 고르기', picks === 8, picks + '개');
    if (picks) { await p.locator('.aw-divider-picks button').nth(4).click(); await p.waitForTimeout(150); }
    ok('위로·아래로 탭', await count('.aw-move') === 1);
  });
  // 8. 스티커
  await step('스티커', async () => {
    await W(body).click(); await p.keyboard.press('Control+End');
    await W(tool('스티커')).click().catch(async () => { await W('.aw-add-body').click(); await W(tool('스티커')).click(); });
    await p.waitForTimeout(400);
    const n = await count('.aw-sticker-grid button');
    ok('스티커 목록', n > 4, n + '개');
    await W('.aw-sticker-grid button').click(); await p.waitForTimeout(300);
    ok('스티커 들어감', await count('.aw-sticker-grid') === 0 && /img|sticker|emoji/i.test(await W(body).innerHTML()));
  });
  // 9. 링크
  await step('링크', async () => {
    if (await count('.aw-add-body')) await W('.aw-add-body').click();
    await W(body).click(); await p.keyboard.press('Control+End');
    await W(tool('링크')).click(); await p.waitForTimeout(300);
    const inp = p.locator('.awp input').first();
    await inp.fill('https://www.bobaedream.co.kr/view?code=best&No=1'); await p.keyboard.press('Enter'); await p.waitForTimeout(1500);
    const t = await p.locator('.awp').innerText();
    ok('링크 미리보기/실패 안내', /실패|첨부|bobaedream/i.test(t), t.replace(/\n/g, ' ').slice(0, 100));
    const attach = p.locator('.awp-action');
    if (await attach.count() && !(await attach.isDisabled())) { await attach.click(); await p.waitForTimeout(300); }
    else await W('.awp-left').click();
    ok('링크 화면 닫힘', await count('.awp') === 0);
  });
  // 10. 투표
  await step('투표', async () => {
    if (await count('.aw-add-body')) await W('.aw-add-body').click();
    await W(body).click(); await p.keyboard.press('Control+End');
    await W(tool('투표')).click(); await p.waitForTimeout(300);
    ok('투표 등록 꺼짐', await W('.awp-action').isDisabled());
    await W('.aw-poll-field input').fill('어떤 차가 좋나요');
    const rows = p.locator('.aw-poll-row input');
    await rows.nth(0).fill('세단'); await rows.nth(1).fill('SUV');
    await W('.aw-poll-add').click(); await p.waitForTimeout(100);
    ok('항목 추가', await count('.aw-poll-row') === 4);
    await p.locator('.aw-switch-row input').nth(0).check({ force: true });
    await p.locator('.aw-switch-row input').nth(2).check({ force: true }); await p.waitForTimeout(150);
    ok('자동 종료일 날짜 칸', await count('.aw-poll-deadline select') === 5);
    ok('투표 등록 켜짐', !(await W('.awp-action').isDisabled()));
    await W('.awp-action').click(); await p.waitForTimeout(300);
    ok('본문 투표', await count('.aw-editor-body [data-type="editorPoll"], .aw-editor-body .editor-poll, .aw-editor-body [data-poll]') > 0);
  });
  // 11. 사진
  await step('사진', async () => {
    if (await count('.aw-add-body')) await W('.aw-add-body').click();
    await W(body).click(); await p.keyboard.press('Control+End');
    await p.setInputFiles('.aw-chzzk input[type=file][accept="image/*"] >> nth=0', D + '/car_a.jpg'); await p.waitForTimeout(600);
    if (await count('.aw-add-body')) await W('.aw-add-body').click();
    await p.setInputFiles('.aw-chzzk input[type=file][accept="image/*"] >> nth=0', D + '/car_b.jpg'); await p.waitForTimeout(600);
    const m = await count('.aw-editor-body .write-media-frame');
    ok('사진 2장', m === 2, m + '장');
    ok('대표 1개', await count('.aw-editor-body .is-rep') === 1);
    await p.locator('.aw-editor-body .write-media-frame').first().click(); await p.waitForTimeout(200);
    await p.locator('.aw-editor-body .write-media-cap').first().fill('첫 사진 설명');
    await p.waitForTimeout(150);
    ok('설명 도구 줄', await count('.aw-tools.is-caption') === 1);
    await p.locator('.aw-editor-body .write-media-frame').nth(1).click(); await p.waitForTimeout(200);
    const bar = await p.$$eval('.aw-tools.is-block button', a => a.map(x => x.getAttribute('aria-label')));
    ok('사진 블록 도구', bar.includes('사진 교체') && bar.includes('사진에 링크 걸기') && bar.includes('삭제'), bar.join(','));
    await p.locator('.aw-editor-body .write-media-rep').nth(1).click().catch(() => {}); await p.waitForTimeout(200);
    const repIdx = await p.$$eval('.aw-editor-body .write-media-frame', a => a.findIndex(x => x.closest('.is-rep')));
    ok('대표 바꾸기', repIdx === 1, 'idx ' + repIdx);
    await W('.aw-tools.is-block [aria-label="사진에 링크 걸기"]').click(); await p.waitForTimeout(200);
    await W('.awu-input').fill('bobaedream.co.kr'); await W('.awu .is-ok').click(); await p.waitForTimeout(200);
    ok('사진 링크', await count('.aw-tools.is-block .is-on') >= 1);
  });
  // 12. 동영상
  await step('동영상', async () => {
    if (await count('.aw-add-body')) await W('.aw-add-body').click();
    await W(body).click(); await p.keyboard.press('Control+End');
    await p.setInputFiles('.aw-chzzk input[type=file][accept^="video"]', D + '/clip.webm'); await p.waitForTimeout(500);
    ok('업로드 화면', await count('.awv') === 1);
    await p.waitForFunction(() => document.querySelectorAll('.awv-thumb img').length >= 5, null, { timeout: 15000 }).catch(() => {});
    ok('추천 섬네일 5장', await count('.awv-thumb img') >= 5);
    await W('#awv-title').fill('영상 제목');
    await W('.awv-tag-add').click(); await p.keyboard.type('세단'); await p.keyboard.press('Enter'); await p.waitForTimeout(100);
    ok('태그 추가', await count('.awv-tag') === 1);
    await W('.awv-submit').click(); await p.waitForTimeout(400);
    ok('본문 동영상 + 길이', await count('.aw-editor-body .write-media-play') === 1, await p.locator('.aw-editor-body .write-media-play').innerText().catch(() => ''));
    await p.locator('.aw-editor-body .write-media-frame:has(.write-media-play)').click(); await p.waitForTimeout(200);
    await W('.aw-tools.is-block [aria-label="동영상 정보 고치기"]').click(); await p.waitForTimeout(300);
    ok('정보 고치기 값 유지', (await W('#awv-title').inputValue()) === '영상 제목');
    await W('.awv-submit').click(); await p.waitForTimeout(200);
  });
  // 13. 블록 이동 · 삭제
  await step('블록 이동', async () => {
    await p.locator('.aw-editor-body .write-media-frame').first().click(); await p.waitForTimeout(200);
    const before = await p.$$eval('.aw-editor-body > *', a => a.map(x => x.tagName).join(','));
    await W('.aw-move [aria-label="위로"]').click(); await p.waitForTimeout(200);
    const after = await p.$$eval('.aw-editor-body > *', a => a.map(x => x.tagName).join(','));
    ok('위로 이동', before !== after);
    const n0 = await count('.aw-editor-body .write-media-frame');
    await W('.aw-block-delete').click(); await p.waitForTimeout(200);
    ok('블록 삭제', (await count('.aw-editor-body .write-media-frame')) === n0 - 1);
  });
  // 14. 태그 · 본문 숨기기
  await step('태그', async () => {
    await W('.aw-tag-row input').fill('#세단 #SUV'); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    const t = await p.locator('.aw-foot').innerText();
    ok('태그 반영', /세단/.test(t) || /세단/.test(await W('.aw-tag-row input').inputValue()), t.replace(/\n/g, ' ').slice(0, 80));
    await p.evaluate(() => document.activeElement && document.activeElement.blur());
    await p.waitForTimeout(200);
    const hide = p.locator('.aw-hide-row input');
    if (await hide.count()) { await hide.check({ force: true }); ok('본문 숨기기', await hide.isChecked()); } else ok('본문 숨기기', false, '줄 없음');
  });
  // 15. 글 종류
  await step('글 종류', async () => {
    await W('.aw-kind').click(); await p.waitForTimeout(300);
    const n = await count('.aw-type-list button');
    ok('글 종류 목록', n >= 6, n + '개');
    await p.locator('.aw-type-list button', { hasText: '질문' }).first().click(); await p.waitForTimeout(300);
    ok('질문 칸', await count('.aw-type-card') === 1);
  });
  // 16. 저장 · 다시 열기
  await step('저장', async () => {
    await W('.aw-head .is-save').click(); await p.waitForTimeout(400);
    const t = await p.locator('body').innerText();
    ok('저장 안내', /저장/.test(t));
    const d = await p.evaluate(() => localStorage.getItem('bbm.community.writeDraft.v2'));
    ok('임시저장 데이터', !!d && /기능 시험 제목/.test(d));
    await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(800);
    const a = await p.locator('.aw-alert').innerText().catch(() => '');
    ok('이어 쓰기 묻기', /이어서/.test(a), a.replace(/\n/g, ' '));
    if (await count('.aw-alert-ok')) await W('.aw-alert-ok').click(); await p.waitForTimeout(500);
    ok('제목 복원', (await W('#awTitle').inputValue()) === '기능 시험 제목');
  });
  // 17. 등록
  await step('등록', async () => {
    await W(body).click(); await p.keyboard.press('Control+End'); await p.keyboard.type(' 질문 본문은 다섯 글자 넘게');
    await W('.aw-head .is-submit').click(); await p.waitForTimeout(500);
    const a = await p.locator('.aw-alert').innerText().catch(() => '');
    ok('등록 결과', /등록 완료|입력|골라/.test(a), a.replace(/\n/g, ' '));
    if (await count('.aw-alert-ok')) { await W('.aw-alert-ok').click(); await p.waitForTimeout(200); }
    await W('.aw-type-chips button').click(); await p.waitForTimeout(150);
    await W('.aw-head .is-submit').click(); await p.waitForTimeout(500);
    const a2 = await p.locator('.aw-alert').innerText().catch(() => '');
    ok('등록 완료', /등록 완료/.test(a2), a2.replace(/\n/g, ' '));
    const post = await p.evaluate(() => localStorage.getItem('bbm.community.latestPost.v2'));
    ok('등록 글 저장', !!post || !/등록 완료/.test(a), post ? post.slice(0, 80) : '');
  });
  await p.screenshot({ path: D + '/ft_end.png' });
  console.log(results.map(r => r.join(' | ')).join('\n'));
  console.log('ERRORS', errs.length ? errs.join('\n') : 'none');
  console.log('SUMMARY', results.filter(r => r[0] === 'PASS').length + '/' + results.length);
  await b.close();
})();
