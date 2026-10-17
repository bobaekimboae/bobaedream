import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=process.cwd();
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const checks=[];
function check(name,condition,detail=''){checks.push({name,pass:Boolean(condition),detail});}

const html=read('public/community/naver-cafe-list.html');
const nav=read('public/community/hupu-board-navigation.js');
const data=read('public/community/data/board-autohome-complaint.js');
const directory=read('public/community/data/importer-dealer-directory.js');
const directorySandbox={window:{}};
vm.runInNewContext(directory,directorySandbox);
const directoryData=directorySandbox.window.BBM_IMPORTER_DEALER_DIRECTORY;
const ui=read('public/community/autohome-complaint-board.js');
const css=read('public/community/autohome-complaint-board.css');
const catalog=JSON.parse(read('public/data/vehicle-catalog/cars-index-v1.json'));

check('board stylesheet wired',html.includes('autohome-complaint-board.css'));
check('board data wired',html.includes('board-autohome-complaint.js'));
check('stakeholder directory wired',html.includes('importer-dealer-directory.js'));
check('board renderer wired',html.includes('renderAutohomeComplaintBoardTable'));
check('navigation item exists',nav.includes("id:'autohome-complaint'"));
check('24 seed posts',data.includes('for(var i=0;i<24;i++)'));
check('list renderer',ui.includes('function renderList()'));
check('detail renderer',ui.includes('function renderDetail(id)'));
check('long writer',ui.includes('function renderLongWriter()'));
check('public discussion sorting',ui.includes('공감순')&&ui.includes('댓글순')&&ui.includes('해결 후기'));
check('four vehicle relation types',ui.includes('국내 신차')&&ui.includes('공식 수입차')&&ui.includes('병행수입차')&&ui.includes('중고차'));
check('imported stakeholder fields',ui.includes('공식 수입사 *')&&ui.includes('수입차 딜러사 *')&&ui.includes('판매·정비 지점 *'));
check('five verified brand directories',['BMW','벤츠','렉서스','포르쉐','람보르기니'].every((name)=>directory.includes(`'${name}'`)));
check('directory brands exist in catalog',Object.keys(directoryData.byMakeName).every((name)=>catalog.manufacturers.some((make)=>make.name===name)));
check('directory dealer candidates',Object.values(directoryData.byMakeName).every((entry)=>Array.isArray(entry.dealers)&&entry.dealers.length>0));
check('directory verified date',directoryData.verifiedAt==='2026-10-17',directoryData.verifiedAt);
check('directory suggestions and manual fallback',ui.includes('ahc-importer-options')&&ui.includes('ahc-dealer-options')&&ui.includes('직접 입력'));
check('source metadata retained',directory.includes('verifiedAt')&&directory.includes('source:')&&directory.includes('coverage:'));
check('seed parties use named businesses',data.includes("importer:'BMW 코리아'")&&data.includes("dealerGroup:'한성자동차'")&&data.includes("dealerGroup:'SQDA Motors'"));
check('domestic dealer fields',ui.includes('신차 딜러사 *')&&ui.includes('domesticDealer'));
check('used dealer fields',ui.includes('판매 상사 *')&&ui.includes('usedDealer'));
check('detail stakeholder table',ui.includes('관련 차량·이해관계자')&&ui.includes('partyRows(row)'));
check('no official workflow status',!ui.includes('답변 대기')&&!ui.includes('센터 확인 중')&&!ui.includes('제조사 전달')&&!ui.includes('조치 완료')&&!data.includes('답변 대기')&&!data.includes('센터 확인 중')&&!data.includes('제조사 전달')&&!data.includes('조치 완료'));
check('public disclosure disclaimer',ui.includes('공식 접수·통지 상태를 의미하지 않습니다'));
check('catalog used',ui.includes("fetch('../data/vehicle-catalog/cars-index-v1.json')"));
check('catalog manufacturer count',catalog.counts.manufacturers===62,String(catalog.counts.manufacturers));
check('catalog model count',catalog.counts.modelGroups===662,String(catalog.counts.modelGroups));
check('catalog generation count',catalog.counts.generations===1255,String(catalog.counts.generations));
check('required validation',ui.includes('차량 구분·제조사·모델·관련 업체·문제 유형·제목·상세 내용을 모두 입력'));
check('local-only storage',ui.includes("localStorage.setItem(storageKey"));
check('brand black active color',css.includes('background:#17191e'));
check('source audit documented',read('docs/autohome-complaint-platform-flow-20261017.md').includes('캡처 인덱스'));

for(const result of checks)console.log(`${result.pass?'PASS':'FAIL'}\t${result.name}${result.detail?'\t'+result.detail:''}`);
const failed=checks.filter((row)=>!row.pass);
console.log(`SUMMARY\tPASS ${checks.length-failed.length}\tFAIL ${failed.length}`);
if(failed.length)process.exit(1);
