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

  const label=await page.locator('#typeLabel').textContent();
  const cardCount=await page.locator('.chototFeedCard').count();
  const railBox=await page.locator('.chototMediaRail').first().boundingBox();
  const metrics=await page.locator('.chototMediaRail').first().evaluate(element=>({
    scrollWidth:element.scrollWidth,
    clientWidth:element.clientWidth,
    bodyScrollWidth:document.documentElement.scrollWidth,
    bodyClientWidth:document.documentElement.clientWidth
  }));
  if(label?.trim()!=='피드형 · 초톳')throw new Error(`${name}: unexpected label ${label}`);
  if(cardCount!==10)throw new Error(`${name}: expected 10 cards, got ${cardCount}`);
  if(!railBox||Math.abs(railBox.height-expectedMediaHeight)>1)throw new Error(`${name}: expected media height ${expectedMediaHeight}, got ${railBox?.height}`);
  if(metrics.scrollWidth<=metrics.clientWidth)throw new Error(`${name}: first media rail is not horizontally scrollable`);
  if(metrics.bodyScrollWidth>metrics.bodyClientWidth+1)throw new Error(`${name}: body overflows horizontally`);

  await page.locator('.chototFeedMoreText').first().click();
  if(!await page.locator('.chototFeedBodyWrap').first().evaluate(element=>element.classList.contains('expanded')))throw new Error(`${name}: more-text expansion failed`);
  await page.locator('.chototVoteButton[data-vote="up"]').first().click();
  if(await page.locator('.chototVoteButton[data-vote="up"]').first().getAttribute('aria-pressed')!=='true')throw new Error(`${name}: vote toggle failed`);
  await page.locator('.chototActionButton[data-save]').first().click();
  if(await page.locator('.chototActionButton[data-save]').first().getAttribute('aria-pressed')!=='true')throw new Error(`${name}: save toggle failed`);

  const firstMedia=page.locator('.chototMediaItem').first();
  await firstMedia.click();
  await page.locator('#chototGallery.open').waitFor({state:'visible'});
  await page.locator('.chototGalleryClose').click();
  await page.locator('#chototGallery.open').waitFor({state:'hidden'});
  await page.locator('.chototFeedMoreText').first().click();
  await page.locator('.chototVoteButton[data-vote="up"]').first().click();
  await page.locator('.chototActionButton[data-save]').first().click();

  const screenshot=path.join(artifactDir,`${name}.png`);
  const viewportScreenshot=path.join(artifactDir,`${name}-viewport.png`);
  await page.screenshot({path:screenshot,fullPage:true});
  await page.screenshot({path:viewportScreenshot,fullPage:false});
  const entry={name,viewport,label:label.trim(),cardCount,railBox,metrics,screenshot,viewportScreenshot,consoleErrors,failedResources};
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
