// PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node scripts/check-capture-ai.mjs
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const app=fileURLToPath(new URL('../',import.meta.url));
const out=fileURLToPath(new URL('../../reports/pr-1102-validation/',import.meta.url));mkdirSync(out,{recursive:true});
const server=spawn(process.execPath,[app+'scripts/serve.mjs','5192']);await new Promise((r,j)=>{const t=setTimeout(()=>j(Error('server start timeout')),10000);server.stdout.once('data',()=>{clearTimeout(t);r()});server.once('error',j);server.once('exit',code=>j(Error('server exited '+code)));});
const results=[];let browser;
try {
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 for(const width of [384,1440]) {
  const context=await browser.newContext({viewport:{width,height:900}}); const page=await context.newPage();const errors=[];let workers=0,modelRequests=0;
  page.on('pageerror',e=>errors.push(e.message));page.on('worker',()=>workers++);
  await context.route(/huggingface\.co|cdn\.jsdelivr\.net/,r=>{modelRequests++;return r.abort();});
  await context.addInitScript(()=>{
   localStorage.setItem('bbm-shoot-autosort-ok','1'); // 기존 앨범 동의는 촬영 AI 동의가 아니다
   let count=0;Object.defineProperty(window,'__cameraStarts',{get:()=>count});
   Object.defineProperty(navigator.mediaDevices,'getUserMedia',{value:async constraints=>{
    window.__cameraConstraints=constraints;count++;const c=document.createElement('canvas');c.width=1600;c.height=1200;const g=c.getContext('2d');
    const image=new Image();image.src='/bobaedream/assets/cars/deutsch-autoworld-v01/p/1820.webp';await image.decode();
    g.fillStyle='#ccc';g.fillRect(0,0,1600,1200);g.drawImage(image,0,0,1600,1200);return c.captureStream(5);
   }});
  });
  const ok=name=>{results.push({width,name,status:'pass'});console.log('PASS',width,name)};
  await page.goto('http://127.0.0.1:5192/bobaedream/nuxt-shootkit/');
  for(const [label,rear,trunk] of [['승용',true,true],['2인승',false,true],['트럭·화물',false,false]]){
   await page.getByRole('radio',{name:label,exact:true}).click();await page.getByRole('button',{name:'촬영 규칙 보기',exact:true}).click();
   const captions=await page.locator('.shoot-rules figcaption').allTextContents();assert.equal(captions.some(t=>t.includes('뒷좌석')),rear);assert.equal(captions.some(t=>t.includes('트렁크')),trunk);
   await page.locator('.shoot-rules').getByRole('button',{name:'뒤로',exact:true}).click();ok(label+' 촬영 규칙');
  }
  await page.getByRole('radio',{name:'2인승',exact:true}).click();await page.getByRole('button',{name:'촬영 규칙 보기',exact:true}).click();assert.equal(await page.locator('.shoot-rules figcaption').filter({hasText:'뒷좌석'}).count(),0);ok('2인승 규칙');
  await page.getByRole('button',{name:'뒤로',exact:true}).last().click();
  await page.getByRole('button',{name:'사진 추가',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('video')?.readyState>=2);
  assert.equal(await page.evaluate(()=>window.__cameraConstraints.video.frameRate.max),30);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForFunction(()=>!document.querySelector('video')?.srcObject);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForFunction(()=>document.querySelector('video')?.readyState>=2 && window.__cameraStarts>=2);ok('백그라운드 카메라 중지/복귀 및 최대30fps 요청');
  assert.equal(workers,0);assert.equal(modelRequests,0);assert.equal(await page.getByRole('button',{name:'AI 도움 · 칸 검사와 위치 안내'}).getAttribute('aria-pressed'),'false');ok('앨범 동의만으로 촬영 AI/다운로드 시작하지 않음');
  const ai=page.getByRole('button',{name:'AI 도움 · 칸 검사와 위치 안내'});
  await ai.click();await page.getByRole('button',{name:'다음에',exact:true}).click();assert.equal(workers,0);ok('AI 동의 취소');
  await ai.click();await page.getByRole('button',{name:'켜기',exact:true}).click();
  await page.locator('.shoot-shutter').click(); // 준비/실패 여부와 무관하게 촬영
  await ai.click();assert.equal(await ai.getAttribute('aria-pressed'),'false');ok('AI 준비 중 촬영 및 끄기');
  await page.getByRole('button',{name:'완료 1장',exact:true}).click();await page.locator('.shoot-tile__img').waitFor();
  assert((await page.locator('body').innerText()).includes('현장 촬영 1장'));ok('촬영 사진 출처와 등록화면 복귀');
  await page.locator('.shoot-tile__img').click();await page.locator('.shoot-origin-note').waitFor();assert((await page.locator('.shoot-origin-note').innerText()).includes('현장 촬영'));ok('미리보기 촬영시각');
  await page.screenshot({path:out+`preview-${width}.png`});
  await page.locator('.shoot-preview').getByRole('button',{name:'닫기',exact:true}).click();
  await page.getByRole('button',{name:/사진 추가 · 지금/}).click();assert.equal(await ai.getAttribute('aria-pressed'),'false');ok('AI 꺼짐 재진입 유지');
  await page.getByRole('tab',{name:'앨범',exact:true}).click();
  await page.locator('input[type=file]').setInputFiles(fileURLToPath(new URL('../../public/assets/cars/deutsch-autoworld-v01/p/1820.webp',import.meta.url)));
  await page.getByRole('button',{name:'완료',exact:true}).click();await page.locator('.shoot-tile__img').nth(1).waitFor();
  assert((await page.locator('body').innerText()).includes('앨범 1장'));ok('앨범 사진 저장/출처 구분');
  if(await page.locator('.shoot-sort').count()) await page.locator('.shoot-sort .shoot-icon-btn').first().click();
  await page.getByRole('button',{name:'임시저장',exact:true}).click();
  await page.getByText(/임시저장했어요 ·/).waitFor();
  const saved=await page.evaluate(()=>new Promise((resolve,reject)=>{const q=indexedDB.open('bbm-shootkit',1);q.onsuccess=()=>{const r=q.result.transaction('drafts').objectStore('drafts').getAll();r.onsuccess=()=>resolve(r.result.filter(d=>d.id!=='auto'));r.onerror=reject;};q.onerror=reject;}));
  assert(saved.some(d=>d.photos.length===2 && d.body==='two' && d.photos.some(p=>p.at) && d.photos.some(p=>p.fromAlbum)));
  console.log('DRAFT',width,(await page.locator('body').innerText()).slice(-350));
  await page.screenshot({path:out+`saved-${width}.png`});ok('임시저장 실행');
  await page.goto('http://127.0.0.1:5192/bobaedream/nuxt-shootkit/?vstage=58');
  assert.equal(await page.getByRole('radio',{name:'2인승',exact:true}).count(),0);
  await page.getByRole('button',{name:'사진 추가',exact:true}).click();assert.equal(await ai.count(),0);ok('58 재현 AI/차 종류 없음');
  assert.deepEqual(errors,[]);ok('브라우저 JS 오류 0');await context.close();
 }
 writeFileSync(out+'browser-regression.json',JSON.stringify({environment:'Linux Chromium 134, synthetic canvas camera; not Android/iPhone',results},null,2));console.log(JSON.stringify(results,null,2));
} finally {await browser?.close();server.kill();}
