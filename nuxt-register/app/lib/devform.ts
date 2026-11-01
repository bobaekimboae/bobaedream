// 보배드림 테스트 서버 등록폼(dev.bbmuseum.co.kr/car/register/form, 2026-11-01 직접 확인)의 값 · 문구.
// 화면 모양은 초톳 기준이고, 여기에는 테스트 서버 「양식」만 둔다. 실제 차량번호 조회 API는 부르지 않는다.
import { registerPolicyHtml } from "@proto/register/header-html";
import { optionGroups, leaseCompanies, rentCompanies, descriptionDrafts } from "@proto/register/data";

/** 차량번호 조회 목업: 14러0927 하나만 돌려준다(테스트 서버 조회 결과를 화면 값 그대로 옮김) */
export const MOCK_PLATE = "14러0927";
export const mockLookup: Record<string, string> = {
  plate: MOCK_PLATE,
  maker: "BMW",
  model: "3시리즈",
  year: "2015",
  month: "11월",
  formYear: "2016",
  gen: "3시리즈 (F30) · 12~18년",
  fuel: "디젤",
  grade: "320d xDrive",
  cc: "1,995",
  seizure: "0",
  mortgage: "0",
  gear: "자동",
};
/** 조회로 채워지면 바꿀 수 없는 칸(테스트 서버에서 회색으로 잠김). 세부모델 · 등급은 다시 고를 수 있다 */
export const LOCK_ON_LOOKUP = ["plate", "maker", "model", "year", "month", "formYear", "fuel", "cc", "gear"];
export const normPlate = (s: string) => s.replace(/\s/g, "");

export const OPTION_GROUPS = optionGroups.map((g) => ({ title: g.title, items: g.items.map((i) => i.name) }));
export const LEASE_COMPANIES = leaseCompanies;
export const RENT_COMPANIES = rentCompanies;
export const DESC_DRAFTS = descriptionDrafts;
export const SALE_KINDS = ["일반", "리스승계", "렌트"] as const;
export type SaleKind = (typeof SALE_KINDS)[number];

/** 「기본양식」을 고르면 상세설명에 넣는 틀(테스트 서버와 같음) */
export const DESC_TEMPLATE = "[차량 한줄 소개]\n\n[차량 상태]\n- 외관 상태:\n- 실내 상태:\n\n[주요 옵션]\n- 주요 옵션:\n- 추가 장착 사항:\n\n[판매 안내]\n- 차량 확인 가능 시간:\n- 기타 안내사항:";

/** 판매자 연락처: 실제 번호 대신 0으로 가린 값(테스트 서버는 로그인 회원 번호를 보여 준다) */
export const SELLER_PHONE = "010-0000-0000";

export const POLICY_LINES = [
  "허위매물 운영정책에 위반될 경우, 별도의 환불 없이 광고가 삭제되며 이용이 제한될 수 있습니다.",
];
export const INSPECTION_WARN = [
  "딜러 회원(자동차매매업자)이 성능·상태점검기록부, 제시신고번호를 미기재 시 과태료가 부과됩니다.",
  "(제84조 제4항 제21의3호 신설) 과태료 1차 50만 원, 2차 75만 원, 3차 100만 원 부과",
];
/** 「허위매물 운영정책」 본문: 테스트 서버 팝업 원문 그대로 */
export const POLICY_HTML = registerPolicyHtml;
