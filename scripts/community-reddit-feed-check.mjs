import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const url=process.env.REDDIT_FEED_URL||'http://127.0.0.1:4176/community/naver-cafe-list.html?view=reddit';
const outputDir=path.resolve('artifacts','community-reddit-feed-1015');
const failures=[];
const check=(condition,message)=>{if(!condition) failures.push(message);};

await mkdir(outputDir,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:384,height:844}});
const runtimeErrors=[];
page.on('pageerror',(error)=>runtimeErrors.push(error.message));
page.on('console',(message)=>{if(message.type()==='error') runtimeErrors.push(message.text());});

await page.goto(url,{waitUntil:'domcontentloaded'});
await page.locator('.redditFeedCard').first().waitFor({state:'visible'});

check(await page.locator('.redditFeedCard').count()===5,'상세 시나리오 게시물 5개가 아니다');
check(await page.locator('.redditFeedActions').count()===5,'게시물별 반응 영역이 없다');
check(await page.locator('.redditFeedMedia').count()===4,'두 번째 이후 게시물 이미지 4개가 아니다');

const first=page.locator('.redditFeedCard').first();
const up=first.getByRole('button',{name:'추천',exact:true});
const down=first.getByRole('button',{name:'비추천',exact:true});
await up.click();
check(await up.getAttribute('aria-pressed')==='true','추천 상태가 선택되지 않는다');
check((await first.locator('.redditScore').textContent())?.trim()==='1','추천 점수가 1이 아니다');
check(await page.locator('#redditRecommendation').getAttribute('class').then((value)=>value.includes('show')),'추천 안내 토스트가 열리지 않는다');
await down.click();
check(await up.getAttribute('aria-pressed')==='false','추천·비추천이 동시에 선택된다');
check(await down.getAttribute('aria-pressed')==='true','비추천 상태가 선택되지 않는다');
check((await first.locator('.redditScore').textContent())?.trim()==='-1','비추천 점수가 -1이 아니다');

const metrics=await page.evaluate(()=>({
  viewport:innerWidth,
  scrollWidth:document.documentElement.scrollWidth,
  title:getComputedStyle(document.querySelector('.redditFeedTitle')).fontSize,
  preview:getComputedStyle(document.querySelector('.redditFeedPreview')).fontSize
}));
check(metrics.scrollWidth<=metrics.viewport,`가로 잘림 발생: ${metrics.scrollWidth}/${metrics.viewport}`);
check(metrics.title==='18px',`제목 크기 불일치: ${metrics.title}`);
check(metrics.preview==='16px',`본문 크기 불일치: ${metrics.preview}`);
check(runtimeErrors.length===0,`브라우저 오류: ${runtimeErrors.join(' | ')}`);

await page.screenshot({path:path.join(outputDir,'mobile-384-reddit-feed.png'),fullPage:false});
await browser.close();

if(failures.length){
  console.error(failures.map((failure)=>`FAIL: ${failure}`).join('\n'));
  process.exit(1);
}

console.log('PASS: Reddit-style feed cards 5');
console.log('PASS: exclusive vote states and recommendation toast');
console.log(`PASS: type scale ${metrics.title}/${metrics.preview}`);
console.log(`PASS: mobile width ${metrics.scrollWidth}/${metrics.viewport}`);
