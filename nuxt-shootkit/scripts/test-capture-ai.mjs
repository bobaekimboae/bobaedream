import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { transpileModule } from 'typescript';
import { cueOf, cueStabilizer } from '../lib/frame-cue.ts';
const det = (l,t,r,b,score=.95,label='car') => ({label,score,box:{xmin:l*400,ymin:t*300,xmax:r*400,ymax:b*300}});
let passed=0;
function check(name, fn) { fn(); passed++; console.log('PASS', name); }
check('small centered car requests closer',()=>assert.equal(cueOf([det(.36,.35,.64,.65)],400,300,'q34'),'closer'));
for(const kind of ['side','q34','front','rear']) check(`small ${kind}`,()=>assert.equal(cueOf([det(.4,.4,.6,.6)],400,300,kind),'closer'));
for(const [name,box] of Object.entries({left:[0,.25,.8,.75],right:[.2,.25,1,.75],top:[.2,0,.8,.65],bottom:[.2,.35,.8,1]})) check(`clipped ${name}`,()=>assert.equal(cueOf([det(...box)],400,300,'side'),'back'));
check('too close with margin',()=>assert.equal(cueOf([det(.04,.04,.96,.96)],400,300,'q34'),'back'));
check('left offset',()=>assert.equal(cueOf([det(.05,.2,.65,.8)],400,300,'q34'),'left'));
check('right offset',()=>assert.equal(cueOf([det(.35,.2,.95,.8)],400,300,'q34'),'right'));
check('centered full car',()=>assert.equal(cueOf([det(.15,.2,.85,.8)],400,300,'q34'),'ok'));
check('tall front is not too far',()=>assert.equal(cueOf([det(.32,.18,.68,.82)],400,300,'front'),'ok'));
check('weak detection does not imply good position',()=>assert.equal(cueOf([det(.2,.2,.8,.8,.2)],400,300,'side'),null));
check('no car does not imply good position',()=>assert.equal(cueOf([],400,300,'side'),null));
check('ambiguous multiple cars',()=>assert.equal(cueOf([det(.03,.25,.45,.75),det(.55,.25,.97,.75)],400,300,'side'),null));
check('duplicate detections of one car still give a cue',()=>assert.equal(cueOf([det(.15,.2,.85,.8),det(.17,.21,.83,.79)],400,300,'q34'),'ok'));
check('invalid dimensions and boxes',()=>{for(const d of [0,NaN,-1])assert.equal(cueOf([det(.1,.1,.9,.9)],d,300,'side'),null);assert.equal(cueOf([det(.8,.2,.2,.8)],400,300,'side'),null);});
check('no cue for interior',()=>assert.equal(cueOf([det(.1,.1,.9,.9)],400,300,'dash'),null));
check('stabilizes only repeated results and clears lost detection',()=>{const f=cueStabilizer(); assert.equal(f('ok'),null);assert.equal(f('ok'),'ok');assert.equal(f('left'),null);assert.equal(f(null),null);assert.equal(f('ok'),null);});
// 실제 client 코드를 임시 모듈로 불러와 worker 통신과 취소를 검증한다. 모델/판정 함수는 대체하지 않는다.
const src=readFileSync(new URL('../lib/capture-ai.ts',import.meta.url),'utf8').replace('import { SITE_BASE } from "./site";', 'const SITE_BASE = "/bobaedream/";');
const js=transpileModule(src.replaceAll('import.meta.url', JSON.stringify(new URL('../lib/capture-ai.ts',import.meta.url).href)),{compilerOptions:{target:99,module:99}}).outputText;
class FakeWorker { static all=[]; sent=[]; terminated=false; constructor(){FakeWorker.all.push(this);} postMessage(m){this.sent.push(m);} terminate(){this.terminated=true;} reply(result=[]){this.onmessage({data:{id:this.sent.at(-1).id,result,ms:15}});} }
globalThis.Worker=FakeWorker;
globalThis.document={baseURI:'http://localhost/bobaedream/nuxt-shootkit/'};
const ai=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const pixels=()=>new Uint8ClampedArray(4);
const first=ai.detectFrame(pixels(),1,1); const worker=FakeWorker.all[0];
assert.equal(await ai.detectFrame(pixels(),1,1),null);
let replaced=false;const old=ai.classifyShot('old').catch(()=>{replaced=true;});
const latest=ai.classifyShot('latest');worker.reply([]);await first; await old;
const classifier=FakeWorker.all[1];assert.equal(replaced,true);assert.equal(worker.terminated,true);assert.equal(classifier.sent.length,1);assert.equal(classifier.sent[0].src,'latest');classifier.reply({cls:'front'});assert.equal((await latest).cls,'front');
passed++;console.log('PASS worker single-flight, dropped frames, bounded latest photo');
const pending=ai.detectFrame(pixels(),1,1).then(()=>false,()=>true);ai.stopCaptureAi();assert.equal(await pending,true);assert.equal(FakeWorker.all.at(-1).terminated,true);assert.equal(ai.aiBusy(),false);passed++;console.log('PASS stop terminates worker and rejects pending task');
console.log(`${passed} checks passed`);
