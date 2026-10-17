import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));
const source = read('public/community/chezhiwang-complaint-board.js');
const enhancements = read('public/community/chezhiwang-complaint-enhancements.js');
const html = read('public/community/naver-cafe-list.html');
const css = read('public/community/chezhiwang-complaint-fixes.css');
const tableSource = read('public/community/data/board-chezhiwang-complaint.js');

const sandbox = { window: {} };
vm.runInNewContext(tableSource, sandbox);
const table = sandbox.window.BBM_BOARD_TABLES['chezhiwang-complaint'];

let passed = 0;
const failures = [];
function gate(label, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS ${label}`);
  } else {
    failures.push(label);
    console.error(`FAIL ${label}`);
  }
}

gate('독립 테이블 id', Boolean(sandbox.window.BBM_BOARD_TABLES['chezhiwang-complaint']));
gate('기본 데이터 32건', table?.rows?.length === 32);
gate('게시물 id 전부 고유', new Set(table.rows.map((row) => row.complaintId)).size === table.rows.length);
gate('품질·서비스·기타·종합 네 유형', new Set(table.rows.map((row) => row.issueType)).size === 4);
gate('목록 필수 필드', table.rows.every((row) => row.complaintId && row.title && row.summary && row.brand && row.model));
gate('상세 필수 필드', table.rows.every((row) => row.body && row.purchaseDate && row.problemDate && row.dealerGroup));
gate('브랜드 로고 프사', table.rows.every((row) => /logo/i.test(row.brandLogo || '')));
gate('현실 차량 사진', table.rows.every((row) => /\.(webp|png|jpe?g)(\||$)/i.test(row.thumbnail || '')));
gate('연락처 독립 저장 키', source.includes('bobae-chezhiwang-complaints-v1'));
gate('댓글 독립 저장 키', source.includes('bobae-chezhiwang-complaint-comments-v1'));
gate('오토홈 저장 키 미사용', !source.includes('bobae-autohome-complaints'));
gate('목록·상세·등록 독립 라우팅', source.includes("if(id==='write')renderWriter();else if(id)renderDetail(id);else renderList()"));
gate('품질 항목 8개', /quality:\[[^\]]+\]/.test(source) && (source.match(/quality:\[([^\]]+)\]/)?.[1].split(',').length === 8));
gate('서비스 항목 7개', /service:\[[^\]]+\]/.test(source) && (source.match(/service:\[([^\]]+)\]/)?.[1].split(',').length === 7));
gate('기타 항목 4개', /other:\[[^\]]+\]/.test(source) && (source.match(/other:\[([^\]]+)\]/)?.[1].split(',').length === 4));
gate('종합 최소 2개', source.includes("state.type==='comprehensive'?2:1"));
gate('제목 60자 제한', source.includes('name="title" maxlength="60"'));
gate('원본 요약 24자 제한', source.includes('name="short" maxlength="24"'));
gate('상세 3000자 제한', source.includes('name="body" maxlength="3000"'));
gate('자동차·바이크 분기', source.includes("['car','자동차'],['motorcycle','바이크']"));
gate('바이크 제조사 카탈로그', source.includes('BMW 모토라드') && source.includes('혼다 모터사이클'));
gate('차량 카탈로그 연동', source.includes("fetch('../data/vehicle-catalog/cars-index-v1.json')"));
gate('나이 직접 입력', enhancements.includes("input.name = 'age'") && enhancements.includes("input.inputMode = 'numeric'"));
gate('성별은 남녀 두 선택지', enhancements.includes('removeOptionalGender'));
gate('자동차등록증 업로드', enhancements.includes('자동차등록증 촬영·업로드'));
gate('자동차등록증 개인정보 안내', enhancements.includes('사진은 공개되지 않으며 차량 정보 확인에만 사용됩니다'));
gate('바이크 사용신고필증 분기', enhancements.includes('이륜자동차 사용신고필증으로 정보 입력'));
gate('사진 업로드 분리', enhancements.includes('data-image-upload'));
gate('영상 업로드 분리', enhancements.includes('data-video-upload'));
gate('사진 6장·5MB 제한 안내', enhancements.includes('최대 6장 · 장당 5MB'));
gate('영상 MP4·50MB 제한 안내', enhancements.includes('MP4 · 최대 50MB'));
gate('증상·소통·정비이력 설명 안내', enhancements.includes('증상, 재현 조건, 판매·정비 업체와의 소통 내용, 평소 정비 이력'));
gate('공개 후 수정 제한 안내', enhancements.includes('공개 후에는 차량·사건 정보 수정이 제한'));
gate('전화·VIN·차량번호 비공개 안내', source.includes('차대번호·엔진번호·차량번호·연락처는 작성 확인용이며 공개되지 않습니다'));
gate('공식 접수 아님 고지', source.includes('공식 접수·통지가 아닌 공개 공론화 게시판'));
gate('상단 등록 버튼', source.includes('data-submit-top'));
gate('필드별 오류 영역', source.includes('czw-inline-error'));
gate('오류 요약 role alert', source.includes('role="alert"'));
gate('첫 오류 이동', source.includes("scrollIntoView({behavior:'smooth',block:'center'})"));
gate('댓글 입력 제한', source.includes('maxlength="300"'));
gate('공감·저장 상태', source.includes("classList.toggle('on')"));
gate('등록 완료 민감정보 안내', source.includes('민감 정보는 공개 글에 표시하지 않았습니다'));
gate('강화 스크립트 로드', html.includes('chezhiwang-complaint-enhancements.js'));
gate('강화 CSS 로드', html.includes('chezhiwang-complaint-fixes.css'));
gate('플랫 원본형 필드 스타일', css.includes('grid-template-columns:112px minmax(0,1fr)'));
gate('검정 활성 선택', css.includes('background:#222;color:#fff'));
gate('작은 화면 보정', css.includes('@media (max-width:360px)'));
gate('사용자 아이콘 존재', exists('public/icons/chotot/chotot-common-user.svg'));
gate('카메라 아이콘 존재', exists('public/community/assets/chzzk-detail/icons/camera.svg'));
gate('영상 아이콘 존재', exists('public/community/assets/reddit-ui/video.svg'));
gate('문서 아이콘 존재', exists('public/assets/bbm/detail-icons/document.svg'));

if (failures.length) {
  console.error(`\n${failures.length} failed / ${passed + failures.length} checks`);
  process.exit(1);
}
console.log(`\nPASS 10x Chezhiwang complaint gate: ${passed}/${passed}`);
