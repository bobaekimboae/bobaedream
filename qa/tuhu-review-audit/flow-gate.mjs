import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../../', import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), 'utf8');
const dataSource = read('public/community/data/board-tuhu-review.js');
const uiSource = read('public/community/tuhu-review-board.js');
const cssSource = read('public/community/tuhu-review-board.css');
const pageSource = read('public/community/naver-cafe-list.html');
const navSource = read('public/community/hupu-board-navigation.js');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(dataSource, context);
const table = context.window.BBM_BOARD_TABLES?.['tuhu-review'];
const rows = table?.rows || [];

let pass = 0;
let fail = 0;
function check(name, value) {
  if (value) {
    pass += 1;
    console.log(`PASS ${name}`);
  } else {
    fail += 1;
    console.error(`FAIL ${name}`);
  }
}

check('독립 테이블 ID', table?.board === 'tuhu-review');
check('샘플 리뷰 36건', rows.length === 36);
check('고유 리뷰 ID 36개', new Set(rows.map((row) => row.tuhuReviewId)).size === 36);
check('필수 제목·본문·작성자', rows.every((row) => row.title && row.body && row.author));
check('브랜드 로고', rows.every((row) => /vehicle-catalog\/logos\//.test(row.brandLogo)));
check('실제 차량 사진 2장 이상', rows.every((row) => Array.isArray(row.images) && row.images.length >= 2));
check('별점 범위 1~5', rows.every((row) => row.satisfaction >= 1 && row.satisfaction <= 5));
check('ICE 포함', rows.some((row) => row.powertrain === 'ice' && row.fuelConsumption));
check('EV 포함', rows.some((row) => row.powertrain === 'ev' && row.fullChargeRange));
check('HEV 포함', rows.some((row) => row.powertrain === 'hybrid' && row.fuelConsumption && row.fullChargeRange));
check('PHEV 포함', rows.some((row) => row.powertrain === 'phev' && row.fullChargeRange));
check('독립 리뷰 저장소', uiSource.includes("store='bobae-tuhu-reviews-v1'"));
check('독립 댓글 저장소', uiSource.includes("commentStore='bobae-tuhu-comments-v1'"));
check('5단계 만족도', /최고예요/.test(uiSource) && /사지 마세요/.test(uiSource));
check('ICE 실연비 분기', /실연비/.test(uiSource));
check('EV·PHEV 실주행거리 분기', /실주행거리/.test(uiSource));
check('HEV 순수전기 주행거리 분기', /순수전기 주행거리/.test(uiSource));
check('태그 최소 2개 검증', /2개 이상/.test(uiSource));
check('본문 30자 검증', /30자/.test(uiSource));
check('8개 평가 항목', ['공간','동력','조작·주행','외관','실내','기술·안전','승차감','가성비'].every((label) => uiSource.includes(`'${label}'`)));
check('목록·상세·등록 라우트', ['renderList','renderDetail','renderWriter'].every((name) => uiSource.includes(name)));
check('등록 후 상세 이동', /localStorage\.setItem\(store/.test(uiSource) && /route\(id\)/.test(uiSource));
check('보배드림 검정 활성 토큰', cssSource.includes('#1d1e20'));
check('테이블·CSS·JS 페이지 연결', ['board-tuhu-review.js','tuhu-review-board.css','tuhu-review-board.js'].every((name) => pageSource.includes(name)));
check('글쓰기 FAB 연결', pageSource.includes("activeBoardTable==='tuhu-review'"));
check('게시판 탐색 메뉴 연결', navSource.includes("id:'tuhu-review'"));

console.log(`RESULT PASS ${pass} / FAIL ${fail}`);
process.exitCode = fail ? 1 : 0;
