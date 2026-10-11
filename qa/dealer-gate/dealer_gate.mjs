// 딜러 화면 자동 게이트 v2 (시안 작업 마스터, 2026-10-11) — 홈·판매 차량·정보 탭 공용
// 사용: node qa/dealer-gate/dealer_gate.mjs "<딜러 화면 URL(tab 없이)>" [home|posts|ads|rating|info|all]
import { chromium } from 'playwright';
import fs from 'fs';
const dir=new URL('./',import.meta.url);
const base=process.argv[2];const which=process.argv[3]||'all';
const tabs=which==='all'?['home','posts','ads','rating','info']:[which];
const sel=JSON.parse(fs.readFileSync(new URL('selectors_dp.json',dir)));
const exe=fs.existsSync('/opt/pw-browsers/chromium')?{executablePath:'/opt/pw-browsers/chromium'}:{};
const b=await chromium.launch(exe);let totalFail=0;const out=[['탭','결과','항목','실측','기준']];
for(const tab of tabs){
 const spec=JSON.parse(fs.readFileSync(new URL(`spec_${tab}_384.json`,dir)));
 const c=await b.newContext({viewport:{width:384,height:832},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const p=await c.newPage();const errs=[];
 p.on('console',m=>{if(m.type()==='error'&&!/favicon/.test(m.location().url||''))errs.push(m.text())});
 const url=tab==='home'?base:base+(base.includes('?')?'&':'?')+'tab='+tab;
 await p.goto(url,{waitUntil:'networkidle',timeout:60000});await p.waitForTimeout(1500);
 const M=await p.evaluate(sel=>{const o={};for(const[k,s]of Object.entries(sel)){if(k==='scroller')continue;o[k]=[...document.querySelectorAll(s)].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0}).slice(0,8).map(e=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e);return {x:r.left,y:r.top,w:r.width,h:r.height,b:r.bottom,fs:c.fontSize,fw:c.fontWeight,lh:c.lineHeight,color:c.color,bg:c.backgroundColor,radius:c.borderRadius,border:c.borderTopStyle==='none'&&c.borderLeftStyle==='none'?'none':c.borderTopWidth+' '+c.borderTopColor,borderColor:c.borderTopColor,borderTopColor:c.borderTopColor,borderBottomColor:c.borderBottomColor,borderBottomWidth:c.borderBottomWidth,pos:c.position}})}
  o.broken=[...document.querySelectorAll('img')].filter(i=>i.complete&&i.naturalWidth===0).length;o.sw=document.documentElement.scrollWidth;return o},sel);
 const R=[];const ok=(n,a,e,t=1)=>{const pass=typeof e==='number'?(typeof a==='number'&&Math.abs(a-e)<=t):String(a)===String(e);R.push([pass?'PASS':'FAIL',n,typeof a==='number'?Math.round(a*10)/10:a,e]);};
 const g=k=>M[k]&&M[k][0];
 for(const k of spec.present||[])R.push([g(k)?'PASS':'FAIL',`있어야 함: ${k}`,g(k)?'있음':'없음','있음']);
 for(const k of spec.absent||[])R.push([g(k)?'FAIL':'PASS',`없어야 함: ${k}`,g(k)?'있음':'없음','없음']);
 for(const[k,v]of Object.entries(spec.slots)){const e=g(k);if(!e){if(!(spec.absent||[]).includes(k))R.push(['FAIL',`${k} 없음`,'-',sel[k]]);continue;}
  for(const[f,exp]of Object.entries(v)){
   if(f==='count')ok(`${k}.count`,M[k].length,exp,0);
   else if(['w','h','x'].includes(f))ok(`${k}.${f}`,e[f],exp);
   else if(f==='pitchX'||f==='pitchY'){const a=M[k];if(a.length>1){const ax=f==='pitchX'?'x':'y';let worst=exp;for(let i=1;i<a.length;i++){const d=a[i][ax]-a[i-1][ax];if(d<=0)continue;if(Math.abs(d-exp)>Math.abs(worst-exp))worst=d;}ok(`${k}.${f}(최대 오차)`,worst,exp);}}
   else if(f==='gridRowGap'){const a=M[k];if(a.length>2){const r2=a.find(z=>z.y>a[0].b);if(r2)ok(`${k}.gridRowGap`,r2.y-a[0].b,exp);else R.push(['FAIL',`${k}.gridRowGap`,'2줄 아님',exp]);}}
   else if(f in e)ok(`${k}.${f}`,e[f],exp);}}
 const pt={};for(const k of Object.keys(M)){const e=g(k);if(e&&typeof e==='object'){pt[k+'Top']=e.y;pt[k+'Bottom']=e.b;}}
 for(const[a,bb,exp]of spec.gaps){if(pt[a]==null||pt[bb]==null){R.push(['FAIL',`gap ${a}→${bb}`,'측정 불가',exp]);continue;}ok(`gap ${a}→${bb}`,pt[bb]-pt[a],exp);}
 if(spec.checks&&spec.checks.fitCards){const fc=spec.checks.fitCards;const res=await p.evaluate(([s,pad])=>{const cards=[...document.querySelectorAll(s)];const rows={};for(const c of cards){const r=c.getBoundingClientRect();const t=c.querySelector('span');const tr=t?t.getBoundingClientRect():r;(rows[Math.round(r.top)]=rows[Math.round(r.top)]||[]).push({h:r.height,top:r.top,th:tr.height,tt:tr.top})}let worstH=0,worstC=0;for(const k in rows){const row=rows[k];const exp=Math.max(...row.map(z=>z.th))+pad;for(const z of row){worstH=Math.max(worstH,Math.abs(z.h-exp));const center=(z.tt-z.top)-(z.h-z.th)/2;worstC=Math.max(worstC,Math.abs(center));}}return [worstH,worstC]},[sel[fc.slot],fc.pad]);
  ok(`${fc.slot} 높이=글 높이+${fc.pad}(최대 오차)`,res[0],0);ok(`${fc.slot} 글 세로 가운데(최대 오차)`,res[1],0);}
 const scrollTo=async y=>{await p.evaluate(([s,y])=>{const e=document.querySelector(s)||document.scrollingElement;e.scrollTop=y;window.scrollTo(0,y)},[sel.scroller,y]);await p.waitForTimeout(300);};
 const ch=spec.checks||{};
 for(const bd of ch.band||[]){const y0=pt[bd.from];if(y0==null){R.push(['FAIL',`band ${bd.from}+${bd.offset}`,'측정 불가',bd.color]);continue;}
  const abs=y0+bd.offset;await scrollTo(Math.max(0,abs-300));
  const col=await p.evaluate(([s,abs])=>{const e=document.querySelector(s);const top=e?e.scrollTop:scrollY;const vy=abs-top;let n=document.elementFromPoint(300,vy);while(n&&n!==document.body){const c=getComputedStyle(n),r=n.getBoundingClientRect(),bt=parseFloat(c.borderTopWidth)||0;if(bt&&vy>=r.top&&vy<r.top+bt)return c.borderTopColor;if(c.backgroundColor!=='rgba(0, 0, 0, 0)')return c.backgroundColor;n=n.parentElement}return 'none'},[sel.scroller,abs]);
  ok(`band ${bd.from}+${bd.offset} 바탕색`,col,bd.color);}
 if(ch.sticky){const want=(pt[ch.sticky.slot+'Top']||0)+200;await scrollTo(want);const [t,got]=await p.evaluate(([s,sc])=>{const e=document.querySelector(s);const x=document.querySelector(sc);return [e?e.getBoundingClientRect().top:null,x?x.scrollTop:scrollY]},[sel[ch.sticky.slot],sel.scroller]);
  if(got<want-150)R.push(['PASS',`${ch.sticky.slot} 고정`,'페이지가 짧아 확인 생략',`스크롤 ${Math.round(got)}`]);else R.push([t!==null&&t>=ch.sticky.min&&t<=ch.sticky.max?'PASS':'FAIL',`${ch.sticky.slot} 고정(스크롤 ${Math.round(got)})`,t===null?'-':Math.round(t),`${ch.sticky.min}~${ch.sticky.max}`]);
  await p.screenshot({path:`gate_${tab}_scrolled.png`});await scrollTo(0);}
 await p.screenshot({path:`gate_${tab}_top.png`});
 if(ch.noBroken)ok('깨진 이미지',M.broken,0,0);if(ch.noOverflow)ok('가로 넘침(scrollWidth)',M.sw,ch.noOverflow,0);if(ch.noConsoleError)ok('콘솔 오류(favicon 제외)',errs.length,0,0);
 const f=R.filter(r=>r[0]==='FAIL').length;totalFail+=f;
 for(const r of R)out.push([tab,...r]);out.push([tab,'합계',`PASS ${R.length-f} / FAIL ${f}`,'','']);
 await c.close();}
await b.close();
for(const r of out)console.log(r.join('\t'));
fs.writeFileSync('gate_result.tsv',out.map(r=>r.join('\t')).join('\n'));
process.exit(totalFail?1:0);
