// 리액트 src/prototype/register/index.tsx 에서 export 하지 않는 상수·작은 함수. keep in sync with index.tsx.
export type PopName = null | "model" | "level" | "color" | "seat" | "options" | "prohibit" | "region" | "descload" | "lease" | "rent" | "inspection" | "inspectionPc" | "photos" | "seizure" | "mortgage" | "policy";

export const descriptionTemplate = "[차량 한줄 소개]\n\n[차량 상태]\n- 외관 상태:\n- 실내 상태:\n\n[주요 옵션]\n- 주요 옵션:\n- 추가 장착 사항:\n\n[판매 안내]\n- 차량 확인 가능 시간:\n- 기타 안내사항:";
export const photoSlots = ["앞측면", "뒷측면", "전면", "후면", "휠/타이어", "엔진", "실내", "계기판", "변속기", "트렁크", ...Array.from({ length: 10 }, () => "옵션")];
export const mockAddresses = ["서울특별시 강남구 테헤란로 123", "서울특별시 성동구 성수이로 66", "경기도 수원시 권선구 경수대로 89", "인천광역시 서구 봉오대로 150"];

export type SaleExtra = { type: string; company: string; settlement: string; settlementAmount: string; monthly: string; deposit: string; residual: string; start: [string, string, string]; end: [string, string, string]; unrecovered: string; expiry: string[] };
export const emptySaleExtra = (type: string): SaleExtra => ({ type, company: "", settlement: "takeover", settlementAmount: "", monthly: "", deposit: "", residual: "", start: ["", "", ""], end: ["", "", ""], unrecovered: "", expiry: [] });

export function parseSeat(value: string) {
  const [color = "", finish = ""] = value.split(" / ");
  return { color, finish };
}

export const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(" ");
