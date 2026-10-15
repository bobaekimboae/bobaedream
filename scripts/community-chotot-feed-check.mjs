import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl=process.env.CHOTOT_FEED_URL||'http://127.0.0.1:4178/community/naver-cafe-list.html?view=chotot';
const artifactDir=path.resolve('artifacts/community-chotot-feed-1015');
await mkdir(artifactDir,{recursive:true});

const browser=await chromium.launch({channel:'chrome',headless:true});
const report={url:baseUrl,cases:[]};

async function checkCase(name,viewport,expectedMediaHeight){
  const page=await browser.newPage({viewport,deviceScaleFactor:1});
  const consoleErrors=[];
  const failedResources=[];
  page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text())});
  page.on('response',response=>{if(response.status()>=400)failedResources.push(`${response.status()} ${response.url()}`)});
  await page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('.chototFeedCard').first().waitFor({state:'visible'});
  await page.waitForTimeout(700);

  const label=await page.locator('#typeLabel').textContent();
  if(!await page.locator('.phone.chototFeedMode').count())throw new Error(`${name}: direct Chotot view reverted after delayed board initialization`);
  const firstTitle=(await page.locator('.chototFeedTitle').first().textContent())?.trim();
  const cardCount=await page.locator('.chototFeedCard').count();
  const railBox=await page.locator('.chototMediaRail').first().boundingBox();
  const metrics=await page.locator('.chototMediaRail').first().evaluate(element=>({
    scrollWidth:element.scrollWidth,
    clientWidth:element.clientWidth,
    bodyScrollWidth:document.documentElement.scrollWidth,
    bodyClientWidth:document.documentElement.clientWidth
  }));
  if(label?.trim()!=='피드형 · 초톳')throw new Error(`${name}: unexpected label ${label}`);
  if(firstTitle!=='주말 모임에 등장한 블루 SUV, 실물 색감은 이렇습니다')throw new Error(`${name}: realistic scenario copy is missing`);
  if(cardCount!==10)throw new Error(`${name}: expected 10 cards, got ${cardCount}`);
  if(!await page.locator('.chototFeedCard').first().locator(':scope > .chototMediaShell:first-child').count())throw new Error(`${name}: media is not the first block in the card`);
  if(!railBox||Math.abs(railBox.height-expectedMediaHeight)>1)throw new Error(`${name}: expected media height ${expectedMediaHeight}, got ${railBox?.height}`);
  if(metrics.scrollWidth<=metrics.clientWidth)throw new Error(`${name}: first media rail is not horizontally scrollable`);
  if(metrics.bodyScrollWidth>metrics.bodyClientWidth+1)throw new Error(`${name}: body overflows horizontally`);
  const initialMediaPosition=await page.locator('.chototMediaRail').first().evaluate(rail=>{
    const first=rail.firstElementChild;
    return {scrollLeft:rail.scrollLeft,visualOffset:first.getBoundingClientRect().left-rail.getBoundingClientRect().left,counter:rail.parentElement.querySelector('.chototMediaCount')?.textContent?.trim()};
  });
  if(Math.abs(initialMediaPosition.visualOffset)>1||initialMediaPosition.counter!=='1 / 6')throw new Error(`${name}: feed did not start at first image: ${JSON.stringify(initialMediaPosition)}`);
  const counterAlignment=await page.locator('.chototFeedCard').first().evaluate(card=>{
    const first=card.querySelector('.chototMediaItem');
    const counter=card.querySelector('.chototMediaCount');
    const firstRect=first.getBoundingClientRect();
    const counterRect=counter.getBoundingClientRect();
    return {firstRight:firstRect.right,counterRight:counterRect.right,delta:firstRect.right-counterRect.right};
  });
  if(Math.abs(counterAlignment.delta-9)>1)throw new Error(`${name}: media counter is not anchored to the first image: ${JSON.stringify(counterAlignment)}`);
  const mediaInset=await page.locator('.chototFeedCard').first().evaluate(card=>{
    const firstRect=card.querySelector('.chototMediaItem').getBoundingClientRect();
    const cardRect=card.getBoundingClientRect();
    const style=getComputedStyle(card);
    return {actual:firstRect.left-cardRect.left,expected:parseFloat(style.borderLeftWidth)+parseFloat(style.paddingLeft)};
  });
  if(Math.abs(mediaInset.actual-mediaInset.expected)>1)throw new Error(`${name}: first image is not aligned to the card content inset: ${JSON.stringify(mediaInset)}`);
  const restoredMediaPosition=await page.locator('.chototMediaRail').first().evaluate(async rail=>{
    rail.scrollLeft=rail.scrollWidth;
    window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const first=rail.firstElementChild;
    return {scrollLeft:rail.scrollLeft,visualOffset:first.getBoundingClientRect().left-rail.getBoundingClientRect().left,counter:rail.parentElement.querySelector('.chototMediaCount')?.textContent?.trim()};
  });
  if(Math.abs(restoredMediaPosition.visualOffset)>1||restoredMediaPosition.counter!=='1 / 6')throw new Error(`${name}: restored feed did not reset to first image: ${JSON.stringify(restoredMediaPosition)}`);
  const mediaScenarioCoverage=await page.locator('.chototFeedCard').evaluateAll(cards=>cards.map(card=>({
    count:card.querySelectorAll('.chototMediaItem').length,
    ratios:[...card.querySelectorAll('.chototMediaItem')].map(item=>item.dataset.ratio),
    hasVideo:Boolean(card.querySelector('.chototMediaItem.video'))
  })));
  const expectedCounts=[6,5,3,4,4,1,1,2,5,3];
  if(JSON.stringify(mediaScenarioCoverage.map(item=>item.count))!==JSON.stringify(expectedCounts))throw new Error(`${name}: media scenarios are incomplete: ${JSON.stringify(mediaScenarioCoverage)}`);
  if(mediaScenarioCoverage.filter(item=>item.hasVideo).length!==1)throw new Error(`${name}: video scenario coverage is incomplete`);
  const firstImage=page.locator('.chototMediaItem img').first();
  await firstImage.waitFor({state:'visible'});
  await firstImage.scrollIntoViewIfNeeded();
  await page.waitForFunction(image=>image.complete&&image.naturalWidth>0,await firstImage.elementHandle());
  const imageState=await firstImage.evaluate(image=>({complete:image.complete,naturalWidth:image.naturalWidth,src:image.currentSrc}));
  if(!imageState.complete||imageState.naturalWidth<300)throw new Error(`${name}: local vehicle image did not load: ${JSON.stringify(imageState)}`);

  const touchIsolation=await page.locator('.chototMediaRail').first().evaluate(rail=>{
    const card=rail.closest('.chototFeedCard');
    card.dataset.touchStable='true';
    const makeTouch=(type,property,x,y)=>{
      const event=new Event(type,{bubbles:true,cancelable:true});
      Object.defineProperty(event,property,{value:[{clientX:x,clientY:y}]});
      return event;
    };
    rail.dispatchEvent(makeTouch('touchstart','touches',300,400));
    rail.dispatchEvent(makeTouch('touchend','changedTouches',110,405));
    return card.isConnected&&card.dataset.touchStable==='true';
  });
  if(!touchIsolation)throw new Error(`${name}: media swipe escaped to the board swipe handler`);

  await page.locator('.chototFeedMoreText').first().click();
  if(!await page.locator('.chototFeedBodyWrap').first().evaluate(element=>element.classList.contains('expanded')))throw new Error(`${name}: more-text expansion failed`);
  await page.locator('.chototVoteButton[data-vote="up"]').first().click();
  if(await page.locator('.chototVoteButton[data-vote="up"]').first().getAttribute('aria-pressed')!=='true')throw new Error(`${name}: vote toggle failed`);
  await page.locator('.chototActionButton[data-save]').first().click();
  if(await page.locator('.chototActionButton[data-save]').first().getAttribute('aria-pressed')!=='true')throw new Error(`${name}: save toggle failed`);

  const firstMedia=page.locator('.chototMediaItem').first();
  const dragSuppressed=await firstMedia.evaluate(item=>{
    item.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:280,clientY:420,pointerId:1}));
    item.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:150,clientY:422,pointerId:1}));
    item.click();
    return !document.getElementById('chototGallery')?.classList.contains('open');
  });
  if(!dragSuppressed)throw new Error(`${name}: horizontal media drag incorrectly opened the gallery`);
  await page.evaluate(()=>window.scrollTo(0,Math.min(360,document.documentElement.scrollHeight-innerHeight)));
  await firstMedia.scrollIntoViewIfNeeded();
  const scrollBeforeGallery=await page.evaluate(()=>window.scrollY);
  const urlBeforeGallery=page.url();
  await firstMedia.click();
  await page.locator('#chototGallery.open').waitFor({state:'visible'});
  if(page.url()!==urlBeforeGallery)throw new Error(`${name}: media tap unexpectedly navigated away`);
  await page.locator('.chototGalleryClose').click();
  await page.locator('#chototGallery.open').waitFor({state:'hidden'});
  const scrollAfterGallery=await page.evaluate(()=>window.scrollY);
  if(Math.abs(scrollAfterGallery-scrollBeforeGallery)>2)throw new Error(`${name}: gallery close did not restore scroll position (${scrollBeforeGallery} -> ${scrollAfterGallery})`);
  await page.locator('.chototFeedMoreText').first().click();
  await page.locator('.chototVoteButton[data-vote="up"]').first().click();
  await page.locator('.chototActionButton[data-save]').first().click();

  await page.evaluate(()=>window.scrollTo(0,0));
  await page.waitForTimeout(100);
  const screenshot=path.join(artifactDir,`${name}.png`);
  const viewportScreenshot=path.join(artifactDir,`${name}-viewport.png`);
  await page.screenshot({path:screenshot,fullPage:true});
  await page.screenshot({path:viewportScreenshot,fullPage:false});
  const entry={name,viewport,label:label.trim(),firstTitle,cardCount,railBox,metrics,initialMediaPosition,counterAlignment,mediaInset,restoredMediaPosition,mediaScenarioCoverage,imageState,touchIsolation,dragSuppressed,scrollBeforeGallery,scrollAfterGallery,screenshot,viewportScreenshot,consoleErrors,failedResources};
  report.cases.push(entry);
  if(failedResources.length)throw new Error(`${name}: failed resources: ${failedResources.join(' | ')}`);
  if(consoleErrors.length)throw new Error(`${name}: console errors: ${consoleErrors.join(' | ')}`);
  await page.close();
}

async function checkViewSelector(){
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
  const selectorUrl=new URL(baseUrl);
  selectorUrl.search='';
  await page.goto(selectorUrl.href,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#viewBtn').click();
  await page.locator('[data-mode="feed-chotot"]').click();
  await page.locator('.chototFeedCard').first().waitFor({state:'visible'});
  const label=(await page.locator('#typeLabel').textContent())?.trim();
  if(label!=='피드형 · 초톳')throw new Error(`selector: unexpected label ${label}`);
  report.cases.push({name:'view-selector',viewport:{width:390,height:844},label,result:'passed'});
  await page.close();
}

try{
  await checkViewSelector();
  await checkCase('mobile-390x844',{width:390,height:844},194);
  await checkCase('desktop-1200x900',{width:1200,height:900},240);
  report.result='passed';
}catch(error){
  report.result='failed';
  report.error=String(error?.stack||error);
  throw error;
}finally{
  await writeFile(path.join(artifactDir,'report.json'),JSON.stringify(report,null,2),'utf8');
  await browser.close();
}

console.log(`Chotot feed verification passed: ${artifactDir}`);
