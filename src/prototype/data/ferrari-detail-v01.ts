// 페라리 매물 상세정보 v01(2026-10-13 「상세정보 페라린 모두 실제 정보 적용」): 구글 시트 「페라리 매물 상세정보 입력용_2026-10-13」(차란차 공개 매물 기준)에서
// 끝까지 읽힌 값만 옮겼다. 차량번호·VIN·연락처·개인 딜러명·원본 URL·매물 ID는 저장하지 않는다. 값이 없거나 잘려 읽지 못한 항목은 비워 두고 화면에서 숨긴다.
export type FerrariDetail = {
  transmission: string;
  displacement: string;
  carType: string;
  body: string;
  color: string;
  saleType: string;
  shop: string;
  union: string;
  /** 시트의 「주요옵션」 중 잘리지 않은 항목만 */
  options: string[];
  /** 시트의 「상세옵션수」 */
  optionCount: number;
  inspection: boolean;
  /** 보험이력 조회 값(없으면 null = 이력 정보 없음) */
  insurance: null | { own: number; other: number; owners: number; plateChanges: number; special: string };
};

// 키 = `ferrariSheetRows`의 number
export const ferrariDetails: Record<number, FerrariDetail> = {
  1: { transmission: "자동", displacement: "3,902cc", carType: "대형", body: "컨버터블", color: "빨간색", saleType: "현금", shop: "주식회사 에이엠씨인터내셔널", union: "경기도자동차매매사업조합", options: ["주차감지센서", "후방카메라", "가죽시트", "전동시트", "열선시트", "스마트키"], optionCount: 31, inspection: true, insurance: { own: 0, other: 0, owners: 2, plateChanges: 1, special: "없음" } },
  2: { transmission: "자동", displacement: "6,496cc", carType: "중형", body: "SUV", color: "파란색", saleType: "현금", shop: "신원자동차매매상사", union: "경기도자동차매매사업조합", options: ["선루프", "LED헤드램프", "주차감지센서", "후방카메라", "가죽시트"], optionCount: 51, inspection: true, insurance: { own: 0, other: 0, owners: 1, plateChanges: 0, special: "없음" } },
  3: { transmission: "자동", displacement: "3,855cc", carType: "대형", body: "쿠페", color: "회색", saleType: "현금", shop: "코리아모터스", union: "경기도자동차매매사업조합", options: ["LED헤드램프", "주차감지센서", "후방카메라", "가죽시트", "전동시트"], optionCount: 39, inspection: true, insurance: null },
};
