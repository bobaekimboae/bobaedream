import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseUrl=process.env.COMMUNITY_URL||'http://127.0.0.1:4176/community/naver-cafe-list.html?view=compact';
const outputDir=path.resolve('artifacts','community-board-order-1015');
const failures=[];
const check=(condition,message)=>{if(!condition)failures.push(message)};
const storageKey='bbm.community.boardChannels.v2';
const legacyStorageKey='bbm.community.boardOrder.v1';

await mkdir(outputDir,{recursive:true});
const browser=await chromium.launch({headless:true});

for(const width of [360,384,412,592,1280]){
  const page=await browser.newPage({viewport:{width,height:width===592?1280:844}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text())});
  await page.goto(baseUrl,{waitUntil:'domcontentloaded'});
  await page.evaluate(({storageKey,legacyStorageKey})=>{localStorage.removeItem(storageKey);localStorage.removeItem(legacyStorageKey)},{storageKey,legacyStorageKey});
  await page.reload({waitUntil:'domcontentloaded'});

  const nav=page.locator('.boardChannelTab');
  check(await nav.count()===32,`${width}px 상단 채널 수가 32개가 아닙니다`);
  check((await nav.nth(0).textContent())?.trim()==='전체',`${width}px 첫 채널이 전체가 아닙니다`);
  check((await nav.nth(1).textContent())?.trim()==='베스트',`${width}px 둘째 채널이 베스트가 아닙니다`);
  check(await nav.nth(0).getAttribute('data-board-id')==='home',`${width}px 전체 ID가 home이 아닙니다`);
  check(await nav.nth(1).getAttribute('data-board-id')==='best',`${width}px 베스트 ID가 best가 아닙니다`);
  check(await page.locator('.boardChannelAvatar').count()===0,`${width}px 탑메뉴에 게시판 프사가 남아 있습니다`);
  const backIcon=await page.locator('.appbar .back img').evaluate(element=>({src:element.src,width:element.getBoundingClientRect().width,height:element.getBoundingClientRect().height,loaded:element.complete&&element.naturalWidth>0}));
  check(/\/(?:assets|%61ssets)\/bbm\/m-header-back\.svg$/i.test(backIcon.src),`${width}px 뒤로가기 아이콘이 중고차 목록 아이콘이 아닙니다: ${backIcon.src}`);
  check(backIcon.width===24&&backIcon.height===24,`${width}px 뒤로가기 아이콘 크기가 ${backIcon.width}×${backIcon.height}px입니다`);
  check(backIcon.loaded,`${width}px 뒤로가기 아이콘이 로드되지 않았습니다`);
  check(await page.locator('#boardOrderMenu').isVisible(),`${width}px 메뉴보기 버튼이 없습니다`);
  check(await page.locator('.appbar .hamburger').isVisible(),`${width}px 상단 햄버거 버튼이 없습니다`);
  check(!await page.locator('#viewBtn').isVisible(),`${width}px 기존 보기 방식 버튼이 아직 노출됩니다`);
  check(!await page.locator('#typeBtn').isVisible(),`${width}px 현재 보기 방식 문구가 아직 노출됩니다`);
  const overflow=await page.evaluate(()=>({body:document.documentElement.scrollWidth-document.documentElement.clientWidth,track:document.getElementById('boardChannelTrack').scrollWidth,scroller:document.getElementById('boardChannelScroller').clientWidth}));
  check(overflow.body===0,`${width}px 페이지 가로 오버플로가 ${overflow.body}px입니다`);
  check(overflow.track>overflow.scroller,`${width}px 게시판 메뉴가 가로 스크롤되지 않습니다`);
  const navStyle=await nav.nth(2).evaluate(element=>{
    const style=getComputedStyle(element);
    const underline=getComputedStyle(element,'::after');
    return {height:element.getBoundingClientRect().height,fontSize:style.fontSize,fontWeight:style.fontWeight,letterSpacing:style.letterSpacing,underlineHeight:underline.height};
  });
  check(navStyle.height===44,`${width}px 탑메뉴 높이가 ${navStyle.height}px입니다`);
  check(navStyle.fontSize==='16px',`${width}px 탑메뉴 글자 크기가 ${navStyle.fontSize}입니다`);
  check(navStyle.fontWeight==='700',`${width}px 선택 탑메뉴 굵기가 ${navStyle.fontWeight}입니다`);
  check(navStyle.letterSpacing==='-0.3px',`${width}px 탑메뉴 자간이 ${navStyle.letterSpacing}입니다`);
  check(navStyle.underlineHeight==='2px',`${width}px 선택 밑줄 두께가 ${navStyle.underlineHeight}입니다`);
  if(width===384)await page.screenshot({path:path.join(outputDir,'mobile-384-top-menu-tiktok-text.png'),fullPage:false});

  await page.locator('#boardOrderMenu').click();
  check(await page.locator('.boardOrderPanel').isVisible(),'전체 게시판 화면이 열리지 않았습니다');
  check(await page.locator('.boardOrderViewEntry').isVisible(),'햄버거 메뉴에 보기 방식이 없습니다');
  check(await page.locator('.boardOrderCurrentView').count()===0,'보기 방식에 현재 유형 문구가 남아 있습니다');
  await page.locator('.boardOrderViewEntry').click();
  check(await page.locator('.boardOrderBackdrop').isHidden(),'보기 방식 진입 뒤 햄버거 메뉴가 닫히지 않았습니다');
  check(await page.locator('#sheet').isVisible(),'햄버거에서 보기 방식 시트가 열리지 않았습니다');
  check((await page.locator('.sheetTitle').textContent())?.trim()==='보기방식 편집','보기 방식 시트 제목이 다릅니다');
  await page.locator('#sheetClose').click();
  await page.locator('.appbar .hamburger').click();
  check(await page.locator('.boardOrderPanel').isVisible(),'상단 햄버거에서 커뮤니티 메뉴가 열리지 않았습니다');
  check(!await page.locator('.boardOrderViewEntry').isVisible(),'상단 전체 메뉴에 보기 방식이 노출되었습니다');
  await page.locator('.boardOrderClose').focus();
  await page.keyboard.press('Shift+Tab');
  check(await page.locator('.boardOrderPanel').evaluate(panel=>panel.contains(document.activeElement)),'모달에서 Shift+Tab 포커스가 밖으로 빠졌습니다');
  check(await page.locator('.boardOrderFixed').count()===2,'고정 채널이 2개가 아닙니다');
  check(await page.locator('.boardOrderItem[data-movable="true"]').count()===30,'이동 채널이 30개가 아닙니다');
  check(await page.locator('.boardOrderAvatar').count()===0,'전체 게시판 칩에 프로필 이미지가 남아 있습니다');
  check(await page.locator('.boardOrderRemove').count()===0,'일반 상태에 제외 버튼이 노출되었습니다');
  check((await page.locator('.boardOrderEdit').textContent())?.trim()==='편집','일반 상태 버튼이 편집이 아닙니다');
  const columns=await page.locator('.boardOrderMyGrid').evaluate(element=>getComputedStyle(element).gridTemplateColumns.split(' ').length);
  check(columns===4,`${width}px 기본 그리드 열 수가 ${columns}개입니다`);
  const itemHeight=await page.locator('.boardOrderItem').first().evaluate(element=>element.getBoundingClientRect().height);
  check(itemHeight===40,`${width}px 채널 높이가 ${itemHeight}px입니다`);
  const clipped=await page.locator('.boardOrderName').evaluateAll(elements=>elements.filter(element=>element.scrollWidth>element.clientWidth+1).map(element=>element.textContent));
  check(clipped.length===0,`${width}px 잘린 축약명이 있습니다: ${clipped.join(', ')}`);
  if(width===384)await page.screenshot({path:path.join(outputDir,'mobile-384-channel-normal.png'),fullPage:false});
  if(width===592)await page.screenshot({path:path.join(outputDir,'mobile-592-channel-normal.png'),fullPage:false});
  if(width===1280)await page.screenshot({path:path.join(outputDir,'pc-1280-channel-normal.png'),fullPage:false});

  if(width===384){
    await page.locator('.boardOrderItem[data-board-id="politics"]').click();
    check(await page.locator('.boardOrderBackdrop').isHidden(),'일반 상태 채널 선택 뒤 메뉴가 닫히지 않았습니다');
    check((await page.locator('.boardSelectName').textContent())?.trim()==='정치/시사게시판','채널 선택값이 본문에 반영되지 않았습니다');
    check(new URL(page.url()).searchParams.get('board')==='politics','안정적인 게시판 ID가 URL에 반영되지 않았습니다');

    await page.locator('#boardOrderMenu').click();
    await page.locator('.boardOrderEdit').click();
    check((await page.locator('.boardOrderEdit').textContent())?.trim()==='완료','편집 상태 버튼이 완료가 아닙니다');
    check(await page.locator('.boardOrderRemove').count()===30,'편집 상태 일반 채널 제외 버튼 수가 다릅니다');
    check(await page.locator('.boardOrderFixed .boardOrderRemove').count()===0,'고정 채널에 제외 버튼이 생겼습니다');
    check(await page.locator('.boardOrderFixed[draggable="true"]').count()===0,'고정 채널이 드래그 가능 상태입니다');
    check(await page.locator('.boardOrderFixedIcon').count()===2,'고정 게시판 잠금 표시가 2개가 아닙니다');
    check(await page.locator('.boardOrderFixed[tabindex]').count()===0,'편집 중 고정 게시판이 키보드 포커스를 받습니다');
    check(await page.locator('.boardOrderFixed[aria-disabled="true"]').count()===2,'편집 중 고정 게시판 비활성 상태가 명시되지 않았습니다');
    const touchAction=await page.locator('.boardOrderItem[data-board-id="free"]').evaluate(element=>getComputedStyle(element).touchAction);
    check(touchAction==='none',`편집 칩 touch-action이 ${touchAction}입니다`);
    const removeTarget=await page.locator('.boardOrderRemove').first().evaluate(element=>({width:element.getBoundingClientRect().width,height:element.getBoundingClientRect().height}));
    check(removeTarget.width===44&&removeTarget.height===44,`제외 버튼 터치 영역이 ${removeTarget.width}×${removeTarget.height}px입니다`);
    const removeOverlaps=await page.locator('.boardOrderMyGrid').evaluate(grid=>{
      const items=[...grid.querySelectorAll('.boardOrderItem')];
      return items.flatMap(item=>{
        const remove=item.querySelector('.boardOrderRemove');
        if(!remove)return[];
        const a=remove.getBoundingClientRect();
        return items.filter(other=>other!==item).filter(other=>{const b=other.getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top}).map(other=>`${item.dataset.boardId}->${other.dataset.boardId}`);
      });
    });
    check(removeOverlaps.length===0,`제외 버튼 터치 영역이 이웃 칩과 겹칩니다: ${removeOverlaps.join(', ')}`);
    await page.screenshot({path:path.join(outputDir,'mobile-384-channel-edit.png'),fullPage:false});

    await page.locator('.boardOrderItem[data-board-id="car-news"] .boardOrderRemove').click();
    check(await page.locator('.boardOrderAdd[data-board-id="car-news"]').count()===1,'제외 게시판이 게시판 분류에 나타나지 않았습니다');
    check(await page.locator('.boardChannelTab[data-board-id="car-news"]').count()===0,'제외 게시판이 즉시 저장되지 않았습니다');
    check(await page.locator('.boardOrderUndo').isVisible(),'제외 후 5초 되돌리기가 노출되지 않았습니다');
    await page.locator('.boardOrderUndo').click();
    check(await page.locator('.boardChannelTab[data-board-id="car-news"]').count()===1,'되돌리기로 게시판이 복구되지 않았습니다');
    await page.locator('.boardOrderItem[data-board-id="car-news"] .boardOrderRemove').click();
    await page.locator('.boardOrderEdit').click();
    check((await page.locator('.boardOrderEdit').textContent())?.trim()==='편집','완료 뒤 일반 상태로 돌아오지 않았습니다');
    check(await page.locator('.boardChannelTab[data-board-id="car-news"]').count()===0,'제외 게시판이 상단 채널에 남았습니다');
    await page.locator('.boardOrderAdd[data-board-id="car-news"]').click();
    check(await page.locator('.boardChannelTab[data-board-id="car-news"]').count()===1,'게시판 재추가가 상단 채널에 반영되지 않았습니다');

    await page.locator('.boardOrderEdit').click();
    const first=page.locator('.boardOrderItem[data-movable="true"]').first();
    const second=page.locator('.boardOrderItem[data-movable="true"]').nth(1);
    const secondId=await second.getAttribute('data-board-id');
    await second.dragTo(first,{targetPosition:{x:4,y:24}});
    const ids=await page.locator('.boardChannelTab').evaluateAll(elements=>elements.map(element=>element.dataset.boardId));
    check(ids[0]==='home'&&ids[1]==='best','순서 변경 뒤 고정 채널 위치가 바뀌었습니다');
    check(ids[2]===secondId,'변경한 일반 채널 순서가 반영되지 않았습니다');
    await page.reload({waitUntil:'domcontentloaded'});
    const persisted=await page.locator('.boardChannelTab').evaluateAll(elements=>elements.map(element=>element.dataset.boardId));
    check(persisted[0]==='home'&&persisted[1]==='best'&&persisted[2]===secondId,'새로고침 뒤 고정·변경 순서가 유지되지 않았습니다');

    await page.locator('#boardOrderMenu').click();
    await page.locator('.boardOrderEdit').click();
    await page.locator('.boardOrderItem[data-board-id="free"] .boardOrderRemove').click();
    await page.locator('.boardOrderClose').click();
    check(await page.locator('.boardChannelTab[data-board-id="free"]').count()===0,'편집 중 닫았을 때 자동 저장이 유지되지 않았습니다');
    check(await page.locator('#boardOrderMenu').evaluate(element=>document.activeElement===element),'모달을 연 게시판 메뉴보기 버튼으로 포커스가 돌아오지 않았습니다');
  }else{
    await page.locator('.boardOrderClose').click();
  }
  check(errors.length===0,`${width}px runtime errors: ${errors.join(' | ')}`);
  await page.close();
}

const touchContext=await browser.newContext({viewport:{width:384,height:844},isMobile:true,hasTouch:true});
const touchPage=await touchContext.newPage();
const touchErrors=[];
touchPage.on('pageerror',error=>touchErrors.push(error.message));
touchPage.on('console',message=>{if(message.type()==='error')touchErrors.push(message.text())});
await touchPage.goto(baseUrl,{waitUntil:'domcontentloaded'});
await touchPage.evaluate(({storageKey,legacyStorageKey})=>{localStorage.removeItem(storageKey);localStorage.removeItem(legacyStorageKey)},{storageKey,legacyStorageKey});
await touchPage.reload({waitUntil:'domcontentloaded'});
await touchPage.locator('#boardOrderMenu').click();
await touchPage.locator('.boardOrderEdit').click();
const touchSource=await touchPage.locator('.boardOrderItem[data-board-id="car-news"]').boundingBox();
const touchTarget=await touchPage.locator('.boardOrderItem[data-board-id="free"]').boundingBox();
check(Boolean(touchSource&&touchTarget),'터치 드래그 대상 칩 좌표를 찾지 못했습니다');
if(touchSource&&touchTarget){
  const cdp=await touchContext.newCDPSession(touchPage);
  const start={x:touchSource.x+20,y:touchSource.y+touchSource.height/2};
  const end={x:touchTarget.x+8,y:touchTarget.y+touchTarget.height/2};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:start.x,y:start.y,radiusX:1,radiusY:1,force:1}]});
  await touchPage.waitForTimeout(420);
  check(await touchPage.locator('.boardOrderItem[data-board-id="car-news"].dragging').count()===1,'350ms 길게 누른 뒤 터치 드래그가 시작되지 않았습니다');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:end.x,y:end.y,radiusX:1,radiusY:1,force:1}]});
  await touchPage.waitForTimeout(80);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const touchOrder=await touchPage.locator('.boardOrderItem[data-movable="true"]').evaluateAll(elements=>elements.slice(0,3).map(element=>element.dataset.boardId));
  check(touchOrder[0]==='car-news'&&touchOrder[1]==='free',`모바일 길게 누르기 이동 결과가 다릅니다: ${touchOrder.join(', ')}`);
  const touchNav=await touchPage.locator('.boardChannelTab').evaluateAll(elements=>elements.slice(0,4).map(element=>element.dataset.boardId));
  check(touchNav[0]==='home'&&touchNav[1]==='best'&&touchNav[2]==='car-news','모바일 이동이 상단 게시판 순서에 즉시 반영되지 않았습니다');
  await touchPage.screenshot({path:path.join(outputDir,'mobile-384-touch-reorder.png'),fullPage:false});
  await touchPage.reload({waitUntil:'domcontentloaded'});
  const touchPersisted=await touchPage.locator('.boardChannelTab').evaluateAll(elements=>elements.slice(0,4).map(element=>element.dataset.boardId));
  check(touchPersisted[2]==='car-news'&&touchPersisted[3]==='free',`모바일 이동 순서가 새로고침 뒤 유지되지 않았습니다: ${touchPersisted.join(', ')}`);
}
check(touchErrors.length===0,`모바일 터치 runtime errors: ${touchErrors.join(' | ')}`);
await touchContext.close();

const migration=await browser.newPage({viewport:{width:384,height:844}});
await migration.goto(baseUrl,{waitUntil:'domcontentloaded'});
await migration.evaluate(({storageKey,legacyStorageKey})=>{
  localStorage.removeItem(storageKey);
  localStorage.setItem(legacyStorageKey,JSON.stringify(['politics','best','politics','free','unknown-board']));
},{storageKey,legacyStorageKey});
await migration.reload({waitUntil:'domcontentloaded'});
const migrated=await migration.locator('.boardChannelTab').evaluateAll(elements=>elements.map(element=>element.dataset.boardId));
check(migrated[0]==='home'&&migrated[1]==='best'&&migrated[2]==='politics'&&migrated[3]==='free','v1 순서 이전 결과가 다릅니다');
check(new Set(migrated).size===32,'v1 이전 뒤 중복 또는 누락 채널이 있습니다');
const saved=await migration.evaluate(storageKey=>JSON.parse(localStorage.getItem(storageKey)),storageKey);
check(saved?.version===2&&JSON.stringify(saved.fixedIds)===JSON.stringify(['home','best']),'v2 저장 구조가 다릅니다');
await migration.close();

for(const columns of [3,4]){
  const preview=await browser.newPage({viewport:{width:384,height:844}});
  await preview.goto(`${baseUrl}${baseUrl.includes('?')?'&':'?'}menu=all&boardGrid=${columns}`,{waitUntil:'domcontentloaded'});
  await preview.locator('.boardOrderPanel').waitFor({state:'visible'});
  const actualColumns=await preview.locator('.boardOrderMyGrid').evaluate(element=>getComputedStyle(element).gridTemplateColumns.split(' ').length);
  check(actualColumns===columns,`384px ${columns}열 시안이 ${actualColumns}열로 표시됩니다`);
  const chipStyles=await preview.locator('.boardOrderItem').first().evaluate(element=>{const style=getComputedStyle(element);return{height:element.getBoundingClientRect().height,backgroundColor:style.backgroundColor,borderRadius:style.borderRadius}});
  check(chipStyles.height===40,`${columns}열 시안 칩 높이가 ${chipStyles.height}px입니다`);
  check(chipStyles.backgroundColor==='rgb(241, 242, 243)',`${columns}열 시안 고정 칩 바탕색이 ${chipStyles.backgroundColor}입니다`);
  check(chipStyles.borderRadius==='8px',`${columns}열 시안 칩 모서리가 ${chipStyles.borderRadius}입니다`);
  await preview.screenshot({path:path.join(outputDir,`mobile-384-baidu-${columns}-column.png`),fullPage:false});
  await preview.close();
}
await browser.close();

if(failures.length){console.error(JSON.stringify({ok:false,failures},null,2));process.exit(1)}
console.log(JSON.stringify({ok:true,channels:32,fixed:['전체','베스트'],movable:30,sections:{게시판:13,자료실:17},widths:[360,384,412,592,1280],defaultColumns:4,previewColumns:[3,4],chipHeight:40,removeTarget:44,undoSeconds:5,migration:'v1-to-v2',outputDir},null,2));
