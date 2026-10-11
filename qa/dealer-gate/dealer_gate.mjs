// 딜러 화면 자동 비교 게이트 (시안 작업 마스터, 2026-10-11)
// 사용: node qa/dealer-gate/dealer_gate.mjs <URL> qa/dealer-gate/selectors_dp.json qa/dealer-gate/spec_home_384.json
import { chromium } from 'playwright';
import fs from 'fs';
const url=process.argv[2];
const sel=JSON.parse(fs.readFileSync(process.argv[3]));
const spec=JSON.parse(fs.readFileSync(process.argv[4]));
const exe=fs.existsSync('/opt/pw-browsers/chromium')?{executablePath:'/opt/pw-browsers/chromium'}:{};
const b=await chromium.launch(exe);
const c=await b.newContext({viewport:{width:384,height:832},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const p=await c.newPage();const errs=[];
p.on('console',m=>{if(m.type()==='error'&&!/favicon/.test(m.location().url||''))errs.push(m.text())});
await p.goto(url,{waitUntil:'networkidle',timeout:60000});await p.waitForTimeout(1500);
const M=await p.evaluate(sel=>{const o={};for(const[k,s]of Object.entries(sel)){const els=[...document.querySelectorAll(s)];o[k]=els.slice(0,8).map(e=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e);return {x:r.left,y:r.top,w:r.width,h:r.height,b:r.bottom,fs:c.fontSize,fw:c.fontWeight,lh:c.lineHeight,color:c.color,bg:c.backgroundColor,radius:c.borderRadius,border:c.borderTopStyle==='none'&&c.borderLeftStyle==='none'?'none':c.borderTopWidth+' '+c.borderTopColor,borderColor:c.borderTopColor,pos:c.position}})}
 o.broken=[...document.querySelectorAll('img')].filter(i=>i.complete&&i.naturalWidth===0).length;o.sw=document.documentElement.scrollWidth;return o},sel);
const R=[];const ok=(name,act,exp,tol=1)=>{const pass=typeof exp==='number'?Math.abs(act-exp)<=tol:String(act)===String(exp);R.push([pass?'PASS':'FAIL',name,typeof act==='number'?Math.round(act*10)/10:act,exp]);};
const g=k=>M[k]&&M[k][0];
const S=spec.slots;
for(const[k,v]of Object.entries(S)){const e=g(k);if(!e){R.push(['FAIL',k+' 없음','-','selector '+sel[k]]);continue;}
 for(const[f,exp]of Object.entries(v)){if(['w','h'].includes(f))ok(`${k}.${f}`,e[f],exp);
  else if(['fs','fw','lh','color','bg','radius','borderColor'].includes(f))ok(`${k}.${f}`,e[f],exp);
  else if(f==='border')ok(`${k}.border`,e.border,exp);}}
const pitch=(k,exp)=>{const a=M[k];if(a&&a.length>1){let worst=exp;for(let i=1;i<a.length;i++){const d=a[i].x-a[i-1].x;if(Math.abs(d-exp)>Math.abs(worst-exp))worst=d;}ok(k+".pitch(최대 오차)",worst,exp);}};
pitch('star',S.star.pitch);pitch('banner',S.banner.pitch);pitch('policyCard',S.policyCard.pitch);
if(g('banner'))ok('banner.firstX',g('banner').x,S.banner.firstX);
if(g('row')&&g('rowPhoto')){ok('row.photoX',g('rowPhoto').x,S.row.photoX);ok('row.textX',g('rowCopy').x,S.row.textX);}
if(g('logo')&&g('cover'))ok('logo.offsetFromCoverTop',g('logo').y-g('cover').y,S.logo.offsetFromCoverTop);
const pt={coverBottom:g('cover')?.b,shareBtnTop:g('shareBtn')?.y,nameTop:g('name')?.y,ratingTop:g('rating')?.y,ratingBottom:g('rating')?.b,addressTop:g('address')?.y,addressBottom:g('address')?.b,statsTop:g('stats')?.y,statsBottom:g('stats')?.b,tabsTop:g('tabs')?.y,tabsBottom:g('tabs')?.b,bannerTop:g('banner')?.y,bannerBottom:g('banner')?.b,introTitleTop:g('introTitle')?.y,moreLinkBottom:g('moreLink')?.b,inventoryTitleTop:g('inventoryTitle')?.y};
for(const[a,bb,exp]of spec.gaps){if(pt[a]==null||pt[bb]==null){R.push(['FAIL',`gap ${a}→${bb}`,'측정 불가',exp]);continue;}ok(`gap ${a}→${bb}`,pt[bb]-pt[a],exp);}
const shot=async(y)=>{await p.evaluate(([s,y])=>{const e=document.querySelector(s)||document.scrollingElement;e.scrollTop=y;window.scrollTo(0,y)},[sel.scroller,y]);await p.waitForTimeout(300);};
const bandAt=async(absY)=>{await shot(Math.max(0,absY-300));return await p.evaluate(([s,absY])=>{const e=document.querySelector(s);const top=e?e.scrollTop:scrollY;const vy=absY-top;const el=document.elementFromPoint(300,vy);let n=el,bg='';while(n&&n!==document.body){const c=getComputedStyle(n).backgroundColor;if(c!=='rgba(0, 0, 0, 0)'){bg=c;break}n=n.parentElement}return bg},[sel.scroller,absY]);};
if(pt.moreLinkBottom){ok('band after policy (#F4F4F4)',await bandAt(pt.moreLinkBottom+18+6),'rgb(244, 244, 244)');}
await shot(600);
const t1=await p.evaluate(s=>{const e=document.querySelector(s);return e?e.getBoundingClientRect().top:null},sel.tabs);
R.push([t1!==null&&t1>=0&&t1<120?'PASS':'FAIL','tabs sticky (scroll 600 → top)',t1===null?'-':Math.round(t1),'0~120 (헤더 바로 아래)']);
await p.screenshot({path:'gate_scroll600.png'});
ok('bottomBar.position',g('bottomBar')?.pos,'fixed');
ok('broken images',M.broken,0,0);ok('horizontal overflow (scrollWidth)',M.sw,384,0);ok('console errors (favicon 제외)',errs.length,0,0);
await b.close();
const fail=R.filter(r=>r[0]==='FAIL').length;
console.log(['결과','항목','실측','기준'].join('\t'));for(const r of R)console.log(r.join('\t'));
console.log(`\nPASS ${R.length-fail} / FAIL ${fail}`);
fs.writeFileSync('gate_result.tsv',[['결과','항목','실측','기준'],...R].map(r=>r.join('\t')).join('\n'));
process.exit(fail?1:0);
