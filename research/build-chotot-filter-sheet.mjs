import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "C:\\Users\\bobae\\work\\bobaedream-work\\outputs\\chotot-filter-research";
const outputPath = `${outputDir}\\초톳_중고차_필터_UX_분석_및_보배드림_적용표.xlsx`;
const rootDrive = "https://drive.google.com/drive/folders/1rC6tnQqcH4QODQT2Wu3MHL6L6UxlwYp-?usp=drive_link";

const sheets = [
  {
    name: "01_필터목록",
    headers: ["순번", "초톳 필터명", "진입 위치", "화면 유형", "전체 길이", "하위 필터", "적용 방식", "초기화 방식", "Drive 폴더", "상태"],
    rows: [
      [1, "전체 필터", "리스트 상단 Lọc 버튼", "전체화면형 바텀시트", "상단-중단-하단 확인", "제조사·색상·원산지", "하단 CTA로 리스트 반영", "Xóa lọc", rootDrive, "조사 진행"],
      [2, "제조사·모델", "빠른 제조사 아이콘 / 전체 필터", "빠른 필터 + 하위 목록", "빠른 칩과 전체 목록 확인", "제조사 선택 후 모델", "선택 즉시 결과/칩 갱신", "개별 칩 또는 전체 초기화", rootDrive, "조사 진행"],
      [3, "가격", "전체 필터 가격 범위", "범위 입력", "상단 입력 + 하단 고정 CTA", "없음", "입력 즉시 결과 수 갱신, CTA로 리스트 반영", "Xóa lọc", rootDrive, "조사 진행"],
    ],
  },
  {
    name: "02_화면구조",
    headers: ["필터 순번", "화면 순번", "스크롤 위치", "섹션명", "섹션 순서", "UI 유형", "고정 여부", "캡처 링크", "관찰 메모"],
    rows: [
      [1, "01", "상단", "가격", 1, "최소/최대 숫자 입력", "아님", "https://drive.google.com/file/d/1ilW2-9iF91Aaq6_-b9EH1_eBaxqCQn1b/view?usp=drivesdk", "Từ/Đến 범위 입력"],
      [1, "01", "상단", "좌석 수", 2, "선택 칩", "아님", "https://drive.google.com/file/d/1ilW2-9iF91Aaq6_-b9EH1_eBaxqCQn1b/view?usp=drivesdk", "2, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 기타"],
      [1, "01", "상단", "제조사", 3, "하위 목록 진입 셀", "아님", "https://drive.google.com/file/d/1ilW2-9iF91Aaq6_-b9EH1_eBaxqCQn1b/view?usp=drivesdk", "제조사 선택 후 모델 섹션 생성"],
      [1, "02", "하단", "색상", 1, "하위 목록 진입 셀", "아님", "https://drive.google.com/file/d/1-FCZ5wjL0LEKFVk2t0WXiwz4AKIFNX8A/view?usp=drivesdk", "Màu sắc"],
      [1, "02", "하단", "원산지", 2, "하위 목록 진입 셀", "아님", "https://drive.google.com/file/d/1-FCZ5wjL0LEKFVk2t0WXiwz4AKIFNX8A/view?usp=drivesdk", "Xuất xứ"],
      [1, "02", "하단", "차체 유형", 3, "복수 선택 칩", "아님", "https://drive.google.com/file/d/1-FCZ5wjL0LEKFVk2t0WXiwz4AKIFNX8A/view?usp=drivesdk", "세단, SUV/Crossover, 해치백, 픽업, 미니밴, 밴, 쿠페, 컨버터블, 기타"],
      [1, "03", "최하단 CTA", "초기화 / 결과 보기", 6, "고정 버튼 2개", "고정", "https://drive.google.com/file/d/1q34TC-cZ9WMLS2YuegSipg-5Oc__L9hN/view?usp=drivesdk", "좌측 초기화, 우측 노란색 결과 CTA"],
    ],
  },
  {
    name: "03_선택항목",
    headers: ["필터 순번", "섹션명", "항목 순번", "선택 항목명", "선택 방식", "단일·복수", "기본값", "선택 후 변화", "하위 연결"],
    rows: [
      [1, "차체 유형", 1, "세단", "칩", "미확인", "미선택", "CTA 결과 수 갱신 여부 추가 확인", "없음"],
      [1, "차체 유형", 2, "SUV / Crossover", "칩", "미확인", "미선택", "CTA 결과 수 갱신 여부 추가 확인", "없음"],
      [1, "동영상 매물", 1, "동영상 있음", "토글", "단일", "꺼짐", "CTA 결과 수 갱신 여부 추가 확인", "없음"],
      [1, "판매자", 1, "개인", "칩", "미확인", "미선택", "CTA 결과 수 갱신 여부 추가 확인", "없음"],
      [2, "빠른 제조사", 1, "Hyundai", "아이콘/칩", "단일", "미선택", "검색어·칩·모델 제안·리스트 갱신", "모델 제안"],
      [2, "모델 제안", 1, "Accent", "빠른 칩", "단일", "미선택", "모델 칩·리스트 갱신", "없음"],
      [3, "가격", 1, "최소값", "숫자 입력", "범위", "비어 있음", "CTA 결과 수 18,062 → 18,056", "없음"],
    ],
  },
  {
    name: "04_상태전환",
    headers: ["필터 순번", "시작 상태", "사용자 동작", "결과 상태", "결과 수 변화", "리스트 변화", "칩 변화", "닫기·뒤로가기 규칙"],
    rows: [
      [2, "자동차 기본 리스트", "Hyundai 빠른 제조사 선택", "Hyundai 필터 적용", "표시되지 않음", "Hyundai 매물만 표시", "Hyundai 칩 추가", "추가 조사"],
      [2, "Hyundai 필터 적용", "Accent 모델 칩 선택", "Hyundai Accent 적용", "표시되지 않음", "Accent 매물만 표시", "Accent 칩 추가", "추가 조사"],
      [3, "가격 비어 있음", "최소값 5 입력", "가격 하한 입력", "18,062 → 18,056", "CTA 전에는 리스트 유지", "CTA 전에는 미노출", "추가 조사"],
      [3, "가격 하한 입력", "하단 결과 CTA 선택", "가격 필터 적용", "표시되지 않음", "가격 조건 리스트 표시", "Trên 5 đ 칩 추가", "추가 조사"],
      [1, "필터 적용 리스트", "상단 Xóa lọc 선택", "전체 카테고리 기본 리스트", "표시되지 않음", "자동차 범주도 해제됨", "필터 칩 제거", "전체 초기화의 범위 확인됨"],
    ],
  },
  {
    name: "05_캡처목록",
    headers: ["파일명", "Drive 링크", "필터명", "상태", "분석 완료", "보배드림 반영 완료"],
    rows: [
      ["00_리스트_기본.png", "https://drive.google.com/file/d/104L93nK77scGYSgKdA5ZXMTt8e7UwW0J/view?usp=drivesdk", "리스트", "기본", "예", "아니오"],
      ["01_전체필터_01_상단.png", "https://drive.google.com/file/d/1ilW2-9iF91Aaq6_-b9EH1_eBaxqCQn1b/view?usp=drivesdk", "전체 필터", "상단", "예", "아니오"],
      ["01_전체필터_02_하단항목.png", "https://drive.google.com/file/d/1-FCZ5wjL0LEKFVk2t0WXiwz4AKIFNX8A/view?usp=drivesdk", "전체 필터", "하단 항목", "예", "아니오"],
      ["01_전체필터_03_최하단_CTA.png", "https://drive.google.com/file/d/1q34TC-cZ9WMLS2YuegSipg-5Oc__L9hN/view?usp=drivesdk", "전체 필터", "최하단 CTA", "예", "아니오"],
      ["02_제조사_04_빠른Hyundai_적용후리스트.png", "https://drive.google.com/file/d/1v9T2h78539wlSN38u4xpa-gjVVUwCDRs/view?usp=drivesdk", "제조사", "Hyundai 적용", "예", "아니오"],
      ["02_제조사_05_Hyundai_Accent_적용후리스트.png", "https://drive.google.com/file/d/1AAlcb1NWAYmxgAEXaFiGrAeEFQl-npLB/view?usp=drivesdk", "제조사·모델", "Accent 적용", "예", "아니오"],
      ["03_가격_02_최소값선택_결과수변화.png", "https://drive.google.com/file/d/1XqDKHLS6F4oHw75UFd0GljfbmmOnKxq_/view?usp=drivesdk", "가격", "입력 직후", "예", "아니오"],
      ["03_가격_03_적용후리스트_필터칩.png", "https://drive.google.com/file/d/19sALLsb7G2wW0mLtA6H2xA1PW0i1S6lj/view?usp=drivesdk", "가격", "적용 후 리스트", "예", "아니오"],
    ],
  },
  {
    name: "06_보배드림매핑",
    headers: ["초톳 필터", "초톳 관찰 근거", "보배드림 데이터 필드", "보배드림 구현 방식", "구현 파일", "상태"],
    rows: [
      ["전체 필터", "상단/하단/고정 CTA 캡처", "15대 테스트 매물 전체", "전체 화면형 필터 패널 + 하단 고정 CTA", "public/assets/chotot-filter-prototype.*", "대기"],
      ["제조사·모델", "Hyundai → Accent 빠른 선택 캡처", "brand, model", "제조사 선택 후 모델 칩을 동적으로 노출", "public/assets/chotot-filter-prototype.js", "대기"],
      ["가격", "범위 입력·결과 수·적용 리스트 캡처", "price", "최소/최대 만원 입력 + 실시간 결과 수 + 적용", "public/assets/chotot-filter-prototype.js", "대기"],
      ["차체 유형", "전체 필터 하단 칩 캡처", "bodyType", "복수 선택 칩", "public/assets/chotot-filter-prototype.js", "추가 조사 후 구현"],
      ["판매자", "전체 필터 하단 칩 캡처", "sellerType", "판매자 유형 칩", "public/assets/chotot-filter-prototype.js", "추가 조사 후 구현"],
    ],
  },
  {
    name: "07_QA비교",
    headers: ["필터", "비교 항목", "초톳 관찰 결과", "보배드림 시안 결과", "일치 여부", "수정 사항"],
    rows: [
      ["전체 필터", "하단 CTA", "초기화와 결과 보기가 나란히 고정", "미구현", "미검증", "구현 예정"],
      ["제조사·모델", "의존형 하위 필터", "Hyundai 선택 후 모델 제안 노출", "미구현", "미검증", "구현 예정"],
      ["가격", "결과 수 갱신", "입력 즉시 CTA 결과 수 변경, CTA 선택 후 리스트 반영", "미구현", "미검증", "구현 예정"],
    ],
  },
];

const workbook = Workbook.create();

for (const definition of sheets) {
  const sheet = workbook.worksheets.add(definition.name);
  sheet.showGridLines = false;
  sheet.getRange(`A1:${String.fromCharCode(64 + definition.headers.length)}1`).merge();
  sheet.getRange("A1").values = [["초톳 중고차 필터 UX 분석 및 보배드림 적용표"]];
  sheet.getRange("A1").format = {
    fill: "#1F2937",
    font: { bold: true, color: "#FFFFFF", size: 14 },
    horizontalAlignment: "left",
  };
  sheet.getRangeByIndexes(1, 0, 1, definition.headers.length).values = [definition.headers];
  sheet.getRangeByIndexes(1, 0, 1, definition.headers.length).format = {
    fill: "#E5E7EB",
    font: { bold: true, color: "#111827" },
    wrapText: true,
    horizontalAlignment: "center",
    verticalAlignment: "center",
    borders: { preset: "all", style: "thin", color: "#D1D5DB" },
  };
  if (definition.rows.length > 0) {
    sheet.getRangeByIndexes(2, 0, definition.rows.length, definition.headers.length).values = definition.rows;
    sheet.getRangeByIndexes(2, 0, definition.rows.length, definition.headers.length).format = {
      wrapText: true,
      verticalAlignment: "top",
      borders: { preset: "inside", style: "thin", color: "#E5E7EB" },
    };
  }
  sheet.getRangeByIndexes(0, 0, definition.rows.length + 2, definition.headers.length).format.autofitColumns();
  sheet.getRangeByIndexes(0, 0, definition.rows.length + 2, definition.headers.length).format.autofitRows();
  sheet.freezePanes.freezeRows(2);
}

await fs.mkdir(outputDir, { recursive: true });
const exported = await SpreadsheetFile.exportXlsx(workbook);
await exported.save(outputPath);

const inspection = await workbook.inspect({
  kind: "workbook,sheet,table",
  maxChars: 3500,
  tableMaxRows: 4,
  tableMaxCols: 8,
});
console.log(inspection.ndjson);

const preview = await workbook.render({
  sheetName: "02_화면구조",
  range: "A1:I9",
  scale: 1,
  format: "png",
});
await fs.writeFile(`${outputDir}\\sheet-preview.png`, new Uint8Array(await preview.arrayBuffer()));
console.log(outputPath);
