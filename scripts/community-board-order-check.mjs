import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseUrl=process.env.COMMUNITY_URL||'http://127.0.0.1:4176/community/naver-cafe-list.html?view=compact';
const outputDir=path.resolve('artifacts','community-board-order-1015');
const failures=[];
const check=(condition,message)=>{if(!condition)failures.push(message)};
const officialBoards=['베스트글','자유게시판','자동차뉴스/토론','정치/시사게시판','시승기/배틀/목격담','유명인의 차','성인게시판','보배드림 이야기','제안/건의','국내야구','해외야구','해외축구','국내축구','이벤트','신유머/감동/이슈','유머게시판','교통사고/블박','국산차게시판','수입차게시판','내차사진','직찍/특종발견','자동차사진/동영상','장착시공사진','자유사진/동영상','후방주의방','레이싱모델','군사/무기','트럭/버스/중기','항공/해운/철도','오토바이/자전거','올드카/추억거리'];

await mkdir(outputDir,{recursive:true});
const browser=await chromium.launch({headless:true});
for(const width of [360,384,412,1280]){
  const page=await browser.newPage({viewport:{width,height:844}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  await page.goto(baseUrl,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>localStorage.removeItem('bbm.community.boardOrder.v1'));
  await page.reload({waitUntil:'domcontentloaded'});
  const names=await page.locator('.boardChannelTab:not(.home)').allTextContents();
  check(names.length===31,`${width}px 상단 게시판 수가 31개가 아닙니다`);
  check(officialBoards.every(name=>names.includes(name)),`${width}px 상단 게시판 누락이 있습니다`);
  check(new Set(names).size===31,`${width}px 상단 게시판이 중복되었습니다`);
  check(await page.locator('#boardOrderMenu').isVisible(),`${width}px 메뉴보기 버튼이 없습니다`);
  const overflow=await page.evaluate(()=>({body:document.documentElement.scrollWidth-document.documentElement.clientWidth,track:document.getElementById('boardChannelTrack').scrollWidth,scroller:document.getElementById('boardChannelScroller').clientWidth}));
  check(overflow.body===0,`${width}px 페이지 가로 오버플로가 ${overflow.body}px입니다`);
  check(overflow.track>overflow.scroller,`${width}px 게시판 메뉴가 가로 스크롤되지 않습니다`);
  if(width===384)await page.screenshot({path:path.join(outputDir,'mobile-384-board-ribbon.png'),fullPage:false});
  if(width===1280)await page.screenshot({path:path.join(outputDir,'pc-1280-board-ribbon.png'),fullPage:false});

  await page.getByRole('button',{name:'오토바이/자전거',exact:true}).click();
  check((await page.locator('.boardSelectName').textContent())?.trim()==='오토바이/자전거','게시판 선택값이 본문에 반영되지 않았습니다');
  check(new URL(page.url()).searchParams.get('board')==='bike-cycle','안정적인 게시판 ID가 URL에 반영되지 않았습니다');
  check(await page.getByRole('button',{name:'오토바이/자전거',exact:true}).getAttribute('aria-current')==='page','선택 탭 상태가 없습니다');

  await page.locator('#boardOrderMenu').click();
  check(await page.locator('.boardOrderPanel').isVisible(),'게시판 순서 화면이 열리지 않았습니다');
  check(await page.locator('.boardOrderItem').count()===31,'순서 화면 게시판 수가 31개가 아닙니다');
  check(await page.locator('.boardOrderHome').textContent()==='홈 · 고정','홈 고정 표시가 없습니다');
  check(await page.locator('.boardOrderItem [aria-label*="삭제"]').count()===0,'게시판 삭제 기능이 노출되었습니다');
  if(width===384)await page.screenshot({path:path.join(outputDir,'mobile-384-board-order.png'),fullPage:false});
  if(width===1280)await page.screenshot({path:path.join(outputDir,'pc-1280-board-order.png'),fullPage:false});

  if(width===384){
    const first=page.locator('.boardOrderItem').first();
    const second=page.locator('.boardOrderItem').nth(1);
    await second.dragTo(first);
    await page.locator('.boardOrderDone').click();
    const reordered=await page.locator('.boardChannelTab:not(.home)').allTextContents();
    check(reordered[0]==='자유게시판'&&reordered[1]==='베스트글','변경한 순서가 상단에 반영되지 않았습니다');
    await page.reload({waitUntil:'domcontentloaded'});
    const persisted=await page.locator('.boardChannelTab:not(.home)').allTextContents();
    check(persisted[0]==='자유게시판'&&persisted[1]==='베스트글','새로고침 뒤 순서가 유지되지 않았습니다');
    await page.locator('#boardOrderMenu').click();
    await page.locator('.boardOrderReset').click();
    await page.locator('.boardOrderDone').click();
    const reset=await page.locator('.boardChannelTab:not(.home)').allTextContents();
    check(reset[0]==='베스트글'&&reset[1]==='자유게시판','기본 순서 초기화가 작동하지 않았습니다');
  }else{
    await page.locator('.boardOrderClose').click();
  }
  check(errors.length===0,`${width}px runtime errors: ${errors.join(' | ')}`);
  await page.close();
}
await browser.close();

if(failures.length){console.error(JSON.stringify({ok:false,failures},null,2));process.exit(1)}
console.log(JSON.stringify({ok:true,boards:31,widths:[360,384,412,1280],homeFixed:true,reorderPersistence:true,reset:true,outputDir},null,2));
