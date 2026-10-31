// 브라우저 모델 실측. 외부 파일은 curl 중계/캐시하므로 이동통신망 다운로드 벤치마크가 아니다.
// PLAYWRIGHT_MODULE=/absolute/playwright/index.mjs node scripts/benchmark-capture-ai.mjs
import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {spawn,execFile} from 'node:child_process';import{readdirSync,writeFileSync,readFileSync,existsSync,mkdirSync}from'node:fs';import{promisify}from'node:util';import{createHash}from'node:crypto';import{fileURLToPath}from'node:url';
import {cueOf} from '../lib/frame-cue.ts';
const{chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const app=fileURLToPath(new URL('../',import.meta.url)); const out=fileURLToPath(new URL('../../reports/pr-1102-validation/',import.meta.url));mkdirSync(out,{recursive:true});
const cache=process.env.MODEL_CACHE_DIR||'/tmp/capture-model-cache';mkdirSync(cache,{recursive:true});
const files=Array.from({length:17},(_,i)=>`/bobaedream/assets/cars/deutsch-autoworld-v01/p/${String(i).padStart(4,'0')}.webp`);
const server=spawn(process.execPath,[app+'scripts/serve.mjs','5194']);await new Promise((r,j)=>{const t=setTimeout(()=>j(Error('server start timeout')),10000);server.stdout.once('data',()=>{clearTimeout(t);r()});server.once('exit',code=>j(Error('server exited '+code)));});let browser;
const mirror=createServer((req,res)=>{const key=(req.url||'/').slice(1);if(!/^[a-f0-9]{64}$/.test(key)){res.writeHead(404);res.end();return;}res.writeHead(200,{'access-control-allow-origin':'*','content-type':'application/octet-stream'});createReadStream(cache+'/'+key).pipe(res);});await new Promise(r=>mirror.listen(5195,'127.0.0.1',r));
const all=[];try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});const system=await browser.newBrowserCDPSession();
 const memory=async()=>{const p=await system.send('SystemInfo.getProcessInfo');let rss=0;for(const x of p.processInfo)try{const s=readFileSync(`/proc/${x.id}/status`,'utf8');rss+=Number(s.match(/VmRSS:\s+(\d+)/)?.[1]||0);}catch{}return {processRssMiB:rss ? rss/1024 : null,cpuSeconds:p.processInfo.some(x=>x.cpuTime>0)?p.processInfo.reduce((s,x)=>s+x.cpuTime,0):null,note:rss?'sum of process RSS; shared pages may be counted twice':'unavailable in this environment'};};
 const workerHeap=async()=>{
  try {
   const {targetInfos}=await system.send('Target.getTargets');const target=targetInfos.find(t=>t.type==='worker'&&t.url.includes('capture-ai.worker-'));
   if(!target)return {available:false,note:'worker target unavailable'};
   const {sessionId}=await system.send('Target.attachToTarget',{targetId:target.targetId,flatten:false});
   const value=await new Promise(async(resolve)=>{
    const t=setTimeout(()=>{system.off('Target.receivedMessageFromTarget',receive);resolve({available:false,note:'worker heap measurement timed out'});},3000);
    function receive(event){if(event.sessionId!==sessionId)return;const msg=JSON.parse(event.message);if(msg.id!==992)return;clearTimeout(t);system.off('Target.receivedMessageFromTarget',receive);resolve(msg.result?{available:true,...msg.result}:{available:false,error:msg.error});}
    system.on('Target.receivedMessageFromTarget',receive);
    await system.send('Target.sendMessageToTarget',{sessionId,message:JSON.stringify({id:992,method:'Runtime.getHeapUsage'})});
   });await system.send('Target.detachFromTarget',{sessionId});return value;
  }catch(e){return {available:false,note:e.message};}
 };
 const worker=readdirSync(app+'.output/public/_nuxt/').find(s=>s.startsWith('capture-ai.worker-'));
 for(const mode of (process.env.BENCH_MODES||'default512,limited320').split(',')){
  const context=await browser.newContext();
  await context.route('https://**/*',async route=>{const url=route.request().url();const path=cache+'/'+createHash('sha256').update(url).digest('hex');try{if(!existsSync(path)){console.log('DOWNLOAD',url);await promisify(execFile)('curl',['-fsSL','--max-time','90',url,'-o',path]);}await route.fulfill({status:302,headers:{location:'http://127.0.0.1:5195/'+createHash('sha256').update(url).digest('hex'),'access-control-allow-origin':'*'}});}catch{await route.abort();}});
  if(mode==='default512')await context.route('**/capture-ai.worker-*.js',async route=>{const text=readFileSync(app+'.output/public/_nuxt/'+worker,'utf8');if(!text.includes('shortest_edge:320,longest_edge:448'))throw Error('size marker missing');await route.fulfill({body:text.replace('shortest_edge:320,longest_edge:448','shortest_edge:512,longest_edge:1333'),contentType:'application/javascript'});});
  const page=await context.newPage();await page.goto('http://127.0.0.1:5194/bobaedream/nuxt-shootkit/');
  page.on('console',m=>{if(m.text().startsWith('BENCH'))console.log(mode,m.text())});
  console.log('START',mode);const before=await memory();
  await page.evaluate(worker=>{window.benchWorker=new Worker('/bobaedream/nuxt-shootkit/_nuxt/'+worker,{type:'module'});window.longTasks=[];new PerformanceObserver(l=>window.longTasks.push(...l.getEntries().map(e=>e.duration))).observe({entryTypes:['longtask']});},worker);
  const rows=[];
  for(const transform of (mode==='slot'?[]:mode==='default512'?['original','far']:['original','far','near','left','right','top','bottom'])){
   const batch=await page.evaluate(async({files,transform})=>{
    const rows=[];let seq=0;
    for(const file of files){
     const image=new Image();image.src=file;await image.decode();const c=document.createElement('canvas');c.width=448;c.height=336;const g=c.getContext('2d',{willReadFrequently:true});g.fillStyle='#ddd';g.fillRect(0,0,448,336);
     const scale=transform==='far'?.42:transform==='near'?2:transform==='left'||transform==='right'?.7:1;
     const x=(448-448*scale)/2+(transform==='left'?-89.6:transform==='right'?89.6:0);const y=(336-336*scale)/2+(transform==='top'?-154:transform==='bottom'?154:0);
     g.drawImage(image,x,y,448*scale,336*scale);const pixels=g.getImageData(0,0,448,336).data;const start=performance.now();
     const result=await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('timeout')),120000);window.benchWorker.onmessage=({data})=>{clearTimeout(t);resolve(data)};window.benchWorker.onerror=e=>{clearTimeout(t);reject(Error(e.message))};window.benchWorker.postMessage({id:++seq,op:'detect',pixels:pixels.buffer,w:448,h:336},[pixels.buffer]);});
     if(result.error)throw Error(result.error);rows.push({file,transform,ms:result.ms,elapsed:performance.now()-start,dets:result.result});
    }console.log('BENCH',transform,'completed');return rows;
   },{files:mode==='default512'?files.slice(0,2):files,transform});
   for(const r of batch){r.width=448;r.height=336;r.cue=cueOf(r.dets,448,336,'q34');const ds=r.dets.filter(d=>['car','truck','bus'].includes(d.label)&&d.score>=.5).sort((a,b)=>(b.box.xmax-b.box.xmin)*(b.box.ymax-b.box.ymin)-(a.box.xmax-a.box.xmin)*(a.box.ymax-a.box.ymin));const b=ds[0]?.box;r.oldCue=!b?null:b.xmin/448<.02||b.xmax/448>.98?'back':(b.xmin+b.xmax)/896<.39?'left':(b.xmin+b.xmax)/896>.61?'right':(b.xmax-b.xmin)/448<.55?'closer':'ok';}
   rows.push(...batch);writeFileSync(out+`benchmark-${mode}.json`,JSON.stringify({mode,before,rows},null,2));
  }
  let slotResults;
  if(mode==='slot') {
   slotResults=await page.evaluate(async()=>{
    const im=new Image();im.src='/bobaedream/assets/cars/deutsch-autoworld-v01/p/0000.webp';await im.decode();const c=document.createElement('canvas');c.width=448;c.height=336;const g=c.getContext('2d');g.drawImage(im,0,0,448,336);
    const call=message=>new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('slot AI timeout')),120000);window.benchWorker.onmessage=({data})=>{clearTimeout(t);resolve(data)};window.benchWorker.onerror=e=>{clearTimeout(t);reject(Error(e.message))};window.benchWorker.postMessage(message);});
    const out=[];const p=g.getImageData(0,0,448,336).data;// CLIP 단독 측정: 위치 모델과 동시 상주시키지 않는다.

    for(let i=2;i<4;i++)out.push(await call({id:i,op:'classify',src:c.toDataURL('image/jpeg',.9),base:new URL('/bobaedream/',location.href).href}));
    return out;
   });
   console.log('SLOT',JSON.stringify(slotResults));
  }
  const loaded=await memory();loaded.workerHeap=await workerHeap();
  const longTasks=await page.evaluate(()=>window.longTasks);
  await page.evaluate(()=>window.benchWorker.terminate());await page.waitForTimeout(1000);const stopped=await memory();
  const summary={mode,before,loaded,stopped,longTasks,rows,slotResults};writeFileSync(out+`benchmark-${mode}.json`,JSON.stringify(summary,null,2));all.push(summary);await context.close();
 }
 console.log('BENCHMARK_COMPLETE',all.map(x=>({mode:x.mode,count:x.rows.length,before:x.before,loaded:x.loaded,stopped:x.stopped})));
}finally{await browser?.close();server.kill();mirror.close()}
