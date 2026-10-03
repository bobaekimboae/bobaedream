import { SpreadsheetFile, Workbook } from "file:///C:/Users/bobae/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";
import fs from "node:fs/promises";

const outDir = "C:/Users/bobae/bobaedream-filter-header-icon/outputs/vehicle-image-rules-v01";
const outFile = `${outDir}/bobaedream_ai_vehicle_image_rules_v01.xlsx`;
const wb = Workbook.create();
const C = { navy: "#111827", blue: "#1B4C8C", rule: "#E5E7EB", text: "#222222", muted: "#666666", green: "#DFF5E8", amber: "#FFF3CD" };
const font = "Arial";

function init(sheet, title, subtitle, lastCol) {
  sheet.showGridlines = false;
  sheet.getRange("A1").values = [[title]];
  sheet.getRange("A1").format.font = { name: font, size: 16, bold: true, color: C.navy };
  sheet.getRange("A2").values = [[subtitle]];
  sheet.getRange("A2").format.font = { name: font, size: 10, italic: true, color: C.muted };
  sheet.getRange(`A3:${lastCol}3`).format.borders.bottom = { style: "thin", color: C.rule };
  sheet.freezePanes.freezeRows(4);
}

function writeTable(sheet, row, headers, rows, widths) {
  const last = String.fromCharCode(64 + headers.length);
  const head = sheet.getRange(`A${row}:${last}${row}`);
  head.values = [headers];
  head.format = { fill: C.navy, font: { name: font, size: 10, bold: true, color: "#FFFFFF" }, horizontalAlignment: "center", verticalAlignment: "middle" };
  const body = sheet.getRange(`A${row + 1}:${last}${row + rows.length}`);
  body.values = rows;
  body.format.font = { name: font, size: 10, color: C.text };
  body.format.wrapText = true;
  body.format.verticalAlignment = "middle";
  body.format.borders.bottom = { style: "hair", color: C.rule };
  rows.forEach((_, i) => { if (i % 2) sheet.getRange(`A${row + 1 + i}:${last}${row + 1 + i}`).format.fill = "#FAFAFB"; });
  widths.forEach((w, i) => sheet.getRange(`${String.fromCharCode(65 + i)}:${String.fromCharCode(65 + i)}`).format.columnWidth = w);
  head.format.rowHeight = 30;
  body.format.rowHeight = 40;
}

// Keep URLs as plain text. Google Sheets turns them into clickable links after
// import, while the local artifact renderer does not implement HYPERLINK().
const link = (url) => url;

const summary = wb.worksheets.add("결론");
init(summary, "보배드림 AI 차량·모델 이미지 제작 규칙 v01", "초톳 실측 규칙, 공식 제조사 제품사진 관례, 384px 시안 검수 결과", "K");
writeTable(summary, 4,
  ["대상","확정 방식","모바일","PC","원본","각도·렌즈","색·조명","그림자","라벨","금지","상태"],
  [
    ["카테고리·유형·모델","투명 누끼 + contain","80×108 셀 / 64×64","132×144 셀 / 88×88","1536×1024 RGBA PNG","승용 28°·70mm","5500K·계열 대표색","중성 회색 8~12%","12/18~14/20·2줄","cover·차체 절단","확정"],
    ["승용·브랜드 모델","좌측 앞 3/4, 오른쪽을 향함","실화상 56~64폭","실화상 78~88폭","같은 마스터","카메라 1.1m","펄 화이트 또는 계열 고정색","타이어 바로 아래","전체명 aria-label","모델마다 임의 각도·색","확정"],
    ["건설기계","부착물 접힌 완형","bbox≤82%","bbox≤82%","같은 마스터","24°·85mm·축 높이","건설 노랑·5500K","궤도/타이어 아래","유형명 우선","붐·버킷 절단","확정"],
    ["실제 매물 사진","카테고리 컷아웃과 분리","136×136 cover r8","160×160 cover r8","짧은 변≥800","차량별 focal point","사진 원색","없음","제목 2줄","퀵필터 누끼 재사용","기존 확정"],
    ["파일·버전","영문 소문자 + vNN","{category}_{maker}_{model}_v01.png","동일","덮어쓰기 금지","manifest 기록","원본 보존","웹 파생 별도","표시명 분리","한글·공백 파일명","확정"],
  ], [20,28,24,24,24,20,22,20,22,26,14]
);
summary.getRange("K5:K9").format.fill = C.green;

const slots = wb.worksheets.add("슬롯규격");
init(slots, "화면 위치별 슬롯 규격", "CSS px 기준. DPR은 원본 해상도로 대응하고 CSS 크기는 바꾸지 않는다", "L");
writeTable(slots, 4,
  ["ID","표면","용도","셀","피치/간격","미디어","실화상 안전영역","fit","정렬","라벨","긴 명칭","판정"],
  [
    ["S-01","모바일 카테고리 서브","차량 유형","80×108","80 / 0","64×64","폭≤88%·높이≤72%","contain","center bottom","12/18·500","2줄 clamp","확정"],
    ["S-02","모바일 매물리스트 상단","대카테고리","80×108","80 / 0","64×64","폭≤88%·높이≤72%","contain","center bottom","12/18·500","2줄 clamp","확정"],
    ["S-03","모바일 매물리스트 상단","제조사·모델","76×102","84 / 8","64×64 논리슬롯","승용 실화상≤64×40","contain","center bottom","14/20·500","2줄 clamp","확정"],
    ["S-04","모바일 필터 바텀시트","유형·모델","80×108","80 / 0","64×64","폭≤88%·높이≤72%","contain","center bottom","12/18·500","2줄 clamp","확정"],
    ["S-05","PC 카테고리 서브","차량 유형","132×144","132 / 0","88×88","폭≤88%·높이≤72%","contain","center bottom","16/24·500","2줄 clamp","확정"],
    ["S-06","PC 매물리스트 상단","제조사·모델","84×102","92 / 8","64×64~80×64","승용 실화상 폭≤80","contain","center bottom","14/20·500","2줄 clamp","내부 표준"],
    ["S-07","모바일 매물리스트","실제 매물","136×136","텍스트와 12","136×136","사진 전체 프레임","cover","focal point","목록 규칙","제목 2줄","기존 확정"],
    ["S-08","PC 매물리스트","실제 매물","160×160","텍스트와 16","160×160","사진 전체 프레임","cover","focal point","목록 규칙","제목 2줄","기존 확정"],
  ], [10,20,20,14,15,18,22,12,16,16,18,14]
);

const guide = wb.worksheets.add("제작규칙");
init(guide, "AI 생성·촬영·보정 규칙", "고정값과 유형별 예외를 한 표에서 관리", "J");
writeTable(guide, 4,
  ["분류","대상","확정값","허용 범위","필수 노출","자세·프레이밍","검수","실패 처리","금지","상태"],
  [
    ["공통","대표 객체","정확히 1개","차체 결합 부품만","전체 외곽","중앙 배치","5초 인지","재생성","여러 차량·사람","확정"],
    ["촬영","승용·모델","좌측 앞 3/4 28°","±3°","그릴·측면·네 바퀴","오른쪽을 향함, 바퀴 직진","방향·차고","재생성","좌우 혼용·광각","확정"],
    ["촬영","바이크","좌측 앞 3/4 32°","±4°","두 바퀴·핸들","사이드스탠드 최소","휠 지름·시트 높이","재생성","라이더·헬멧","규칙"],
    ["촬영","트럭·버스","20~24°","장축은 15°까지","캡·적재부·후축","모든 축 접지","전장 bbox≤90%","각도 수정","차체 끝 절단","규칙"],
    ["촬영","캠핑카","24°","±4°","캡·거주부·창","어닝 닫힘","Class A/B/C 동일색","재생성","캠핑 소품·사람","규칙"],
    ["촬영","굴착기","24°·축 높이","±4°","붐·암·버킷·궤도","붐 안쪽 접힘, 버킷 낮춤","bbox≤82%·하단74%","재생성","붐 절단·수직 전개","샘플 확정"],
    ["촬영","휠로더","24°·축 높이","±4°","버킷·관절·네 바퀴","버킷 낮춤","버킷 완형","재생성","버킷 화면 밖","샘플 확정"],
    ["촬영","지게차","24°·축 높이","±4°","마스트·포크·바퀴","마스트 낮춤, 포크 살짝 듦","3:2 캔버스","v02 정규화","마스트 과상승","샘플 확정"],
    ["촬영","보트","18°","±4°","선수·선미·상부","물 없이 선체 하부 정렬","bbox≤88%","재생성","파도·물 배경","규칙"],
    ["촬영","농기계","24°","±4°","작업기 포함","작업기 접힘","bbox≤82%","재생성","농장 배경","규칙"],
    ["촬영","부품·용품","정면 또는 30°","제품군 고정","제품 전체","광학 중심","동일군 크기","재생성","차량·손·패키지 문구","규칙"],
    ["조명","전체","5500K 대형 소프트박스","5000~6000K","도장·유리 경계","클리핑 없는 하이라이트","흰/회색 배경 대조","보정/재생성","색번짐·블랙홀","확정"],
    ["배경","전체","RGBA 완전 투명","모서리 alpha=0","미세 테두리","halo 없음","200% 확대","재생성","흰/검은 배경 굽힘","확정"],
    ["그림자","전체","중성 회색 10%","8~12%","접지 바로 아래","바닥면 없이 타원 blur","흰 배경에서 약하게","보정","검은 원형 그림자","확정"],
    ["출력","마스터","1536×1024 PNG RGBA","생성 차이는 v02 정규화","알파·전체 외곽","3:2 고정","메타데이터","반려","JPG 마스터","확정"],
    ["출력","웹 파생","WebP/AVIF ≤120KB 권장","복잡도별 예외","시각 품질","srcset 1x/2x/3x","LCP+선명도","재압축","1.5MB PNG 직접 전송","내부 표준"],
  ], [16,18,26,20,24,30,22,18,28,14]
);
guide.getRange("A5:J20").format.rowHeight = 52;

const sampleUrls = {
  sedan:"https://drive.google.com/file/d/1Md4k5aufmS-cNRMwzQqqmKIsB_bswt0b/view?usp=drivesdk", hatch:"https://drive.google.com/file/d/1kaQqs2ltVm4AxnUIM45U3xwFHvXNB0io/view?usp=drivesdk",
  suv:"https://drive.google.com/file/d/1vBN69T5IaFRW4g_CTshuipF1ko33JdFU/view?usp=drivesdk", coupe:"https://drive.google.com/file/d/11cWthvoF6buISRaw1OXZh7Yx0u0mdJQ8/view?usp=drivesdk",
  w460:"https://drive.google.com/file/d/1Hfk4W9VgRMeQKFV_7yS5vP51NUMqAtcy/view?usp=drivesdk", w463:"https://drive.google.com/file/d/1aj6iAWFyn1xnjZf4Fb34jcHFPFAkftw0/view?usp=drivesdk", w465:"https://drive.google.com/file/d/14nLArMj7lP0vHEK_V23rMpQ70U_TCdi1/view?usp=drivesdk",
  excavator:"https://drive.google.com/file/d/1hc9hhbHUNQbhSZlrSkez8fz9wntNespA/view?usp=drivesdk", loader:"https://drive.google.com/file/d/1ahu0yACwoKxUueudV78iA3Gh3zX9ZNl4/view?usp=drivesdk", forklift:"https://drive.google.com/file/d/1Yn2o1J5_A_kP2DJk8fojgnoMr-ty4sLG/view?usp=drivesdk"
};
const samples = wb.worksheets.add("샘플검수");
init(samples, "생성 샘플·384px 시안 검수", "이미지 원본과 리스트/바텀시트의 슬롯 결과를 함께 확인", "K");
writeTable(samples, 4,
  ["분류","표시명","파일명","원본 px","알파","각도","색","슬롯","결과","원본","메모"],
  [
    ["바디타입","세단","car_body_sedan_v01.png","1536×1024","통과","28°","펄 화이트","64×64","검수완료",link(sampleUrls.sedan),"형상·바닥선 양호"],
    ["바디타입","해치백","car_body_hatchback_v01.png","1536×1024","통과","28°","펄 화이트","64×64","검수완료",link(sampleUrls.hatch),"해치 실루엣 양호"],
    ["바디타입","SUV","car_body_suv_v01.png","1536×1024","통과","28°","펄 화이트","64×64","검수완료",link(sampleUrls.suv),"차고 구분 양호"],
    ["바디타입","쿠페","car_body_coupe_v01.png","1536×1024","통과","28°","펄 화이트","64×64","검수완료",link(sampleUrls.coupe),"2도어 실루엣 양호"],
    ["G-클래스","W460","car_mercedes_gclass_w460_v01.png","1536×1024","통과","28°","실버","64×64","검수완료",link(sampleUrls.w460),"세대 디테일 보존"],
    ["G-클래스","W463","car_mercedes_gclass_w463_v01.png","1536×1024","통과","28°","실버","64×64","검수완료",link(sampleUrls.w463),"동일 스케일"],
    ["G-클래스","최신형","car_mercedes_gclass_w465_v01.png","1536×1024","통과","28°","실버","64×64","검수완료",link(sampleUrls.w465),"동일 스케일"],
    ["건설기계","굴착기","heavy_excavator_v01.png","1536×1024","통과","24°","노랑","64×64","검수완료",link(sampleUrls.excavator),"붐·버킷 완형"],
    ["건설기계","휠로더","heavy_wheel_loader_v01.png","1536×1024","통과","24°","노랑","64×64","검수완료",link(sampleUrls.loader),"버킷 완형"],
    ["건설기계","지게차","heavy_forklift_v02.png","1536×1024","통과","24°","노랑","64×64","검수완료",link(sampleUrls.forklift),"v01 세로형→v02 정규화"],
  ], [16,16,34,16,12,10,16,14,14,14,28]
);
samples.getRange("I5:I14").format.fill = C.green;
samples.getRange("J5:J14").format.font = { name: font, size: 10, color: C.blue, underline: true };
samples.getRange("A17:F17").values = [["시안","표면","뷰포트","측정","판정","링크"]];
samples.getRange("A17:F17").format = { fill: C.navy, font: { name: font, size: 10, bold: true, color: "#FFFFFF" } };
samples.getRange("A18:F21").values = [
  ["승용 바디타입","모바일 리스트","384×844","80px 피치·64×64","통과",link("https://drive.google.com/file/d/1EpveQ_3e1qG6JClNPIZzREtVmTPG7cEa/view?usp=drivesdk")],
  ["G-클래스 3세대","모바일 리스트","384×844","2줄 라벨","통과",link("https://drive.google.com/file/d/1pgbtWdPUlzSllYekWTEo8APlPjm-tQUY/view?usp=drivesdk")],
  ["건설기계 3종","모바일 리스트","384×844","완형 인지","통과",link("https://drive.google.com/file/d/12z64HMACy1cenGWLobh2rHUe6gecSBJC/view?usp=drivesdk")],
  ["승용 바디타입","필터 바텀시트","384×844","고정 하단 액션","통과",link("https://drive.google.com/file/d/1Y-VXp1uYbqkOVyFCDUiyYx5DnCuAhn9b/view?usp=drivesdk")],
];
samples.getRange("A18:F21").format.font = { name: font, size: 10, color: C.text };
samples.getRange("E18:E21").format.fill = C.green;
samples.getRange("F18:F21").format.font = { name: font, size: 10, color: C.blue, underline: true };

const handoff = wb.worksheets.add("개발전달·출처");
init(handoff, "개발 전달·저장·근거", "파일명, manifest, CSS, QA와 외부 근거를 한 곳에서 관리", "H");
writeTable(handoff, 4,
  ["구분","키","값","예시/확인","개발 처리","검수","금지","상태"],
  [
    ["저장","원본","assets/source/{category}/{maker}/","assets/source/car/mercedes/","Drive 원본과 1:1","manifest 대조","임의 폴더","확정"],
    ["저장","웹 파생","public/assets/qf/{category}/{maker}/","WebP/AVIF srcset","빌드 생성","404 검사","원본 PNG 직접 전송","확정"],
    ["파일명","모델","{category}_{maker}_{model}_vNN.png","car_mercedes_gclass_w460_v01.png","영문 소문자","정규식","한글·공백·덮어쓰기","확정"],
    ["manifest","필수","id/category/maker/model/display_name/version/source/angle/bbox/baseline/status","baseline=0.72","CSV+JSON","누락 검사","코드 하드코딩","확정"],
    ["CSS","모바일","cell80/media64/label12-18","contain center bottom","토큰화","computed style","cover","확정"],
    ["CSS","PC","cell132/media88/label16-24","같은 마스터","임의 확대 금지","DPR1/2/3","모바일 래스터 확대","확정"],
    ["접근성","전체명","aria-label+title+원문 데이터","화면 2줄 clamp","표시명 분리","접근성 트리","원문 축약","확정"],
    ["버전","수정","v01→v02, 기존 보존","지게차 v02","CHANGELOG 기록","Drive/코드 대조","덮어쓰기","확정"],
    ["QA","모바일","360·384·430px","허용오차 ±1px","스크린샷","절단·하단선","한 폭만 확인","확정"],
    ["QA","PC","1280·1440px","슬롯·DPR","computed style","임의 확대 없음","전체폭 확대","확정"],
  ], [16,18,42,32,30,22,28,14]
);
handoff.getRange("A17:G17").values = [["분류","출처","용도","확인값","근거","링크","비고"]];
handoff.getRange("A17:G17").format = { fill: C.blue, font: { name: font, size: 10, bold: true, color: "#FFFFFF" } };
handoff.getRange("A18:G29").values = [
  ["기존 규칙","보배드림 슬롯 규칙 v02","채택값","64×48/40·76+8·버전","직접 읽음",link("https://docs.google.com/spreadsheets/d/1vCy9bVCo6xcpkzeSOQ3iMH5lXGKV7zak8Bb88BtWaIg/edit"),""],
  ["초톳 규칙","chotot slot rules v03","카테고리/매물 분리","64×64/120×120·PC88/160","직접 읽음",link("https://docs.google.com/spreadsheets/d/17rrGK9wuiicQ3_DoUGUb7x8CH1wVEzLNE4NEHGfjhgk/edit"),""],
  ["초톳 원본","실사 Drive","앱 화면","카테고리와 리스트 차이","캡처",link("https://drive.google.com/drive/folders/11HLbt-i1OlEr8BU4HxMAW9YtY0xNenLi"),""],
  ["초톳 웹","xe.chotot.com","긴 명칭","2줄 clamp·contain","직접 테스트",link("https://xe.chotot.com/"),""],
  ["공식","Mercedes-Benz G-Class","세대·형상","전·측면 특징","공식",link("https://g-class.mercedes-benz.com/en/g-class-suv"),""],
  ["공식","Mercedes-Benz G-Class 40주년","W460 역사","세대 디테일","공식",link("https://media.mercedes-benz.com/en/article/9bf7005d-5054-4ccb-97d7-28aba743f57e"),""],
  ["공식","Hyundai PALISADE","45° 제품사진","차량 전체·중립색","공식",link("https://www.hyundai.com/worldwide/en/suv/palisade-2026/highlights"),""],
  ["공식","Hyundai AZERA","세단 형상","승용 비례","공식",link("https://www.hyundai.com/worldwide/en/cars/azera-2023/highlights"),""],
  ["공식","Cat 313 Excavator","장비 사진","붐·버킷 완형","공식",link("https://www.cat.com/en_US/products/new/equipment/excavators/small-excavators/126701.html"),""],
  ["공식","Komatsu Wheel Loaders","장비 유형","버킷·차체 비례","공식",link("https://www.komatsu.com/en/products/wheel-loaders/"),""],
  ["경쟁사","Autohome 이미지 목록","차급·차종 이미지","제품사진 일관성","웹 확인",link("https://www.autohome.com.cn/cars/imglist-index"),""],
  ["산출물","샘플·검수 폴더","원본10+캡처4","Drive 저장","업로드 완료",link("https://drive.google.com/drive/folders/1YUI0R4v2GVtm1X0OEevqjputDftZ9zCA"),""],
];
handoff.getRange("A18:G29").format.font = { name: font, size: 10, color: C.text };
handoff.getRange("A18:G29").format.wrapText = true;
handoff.getRange("A18:G29").format.rowHeight = 40;
handoff.getRange("F18:F29").format.font = { name: font, size: 10, color: C.blue, underline: true };

wb.recalculate();
for (const name of ["결론", "슬롯규격", "제작규칙", "샘플검수", "개발전달·출처"]) {
  const png = await wb.render({ sheetName: name, autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(`${outDir}/preview_${name}.png`, new Uint8Array(await png.arrayBuffer()));
}
const file = await SpreadsheetFile.exportXlsx(wb);
await file.save(outFile);
console.log(outFile);
