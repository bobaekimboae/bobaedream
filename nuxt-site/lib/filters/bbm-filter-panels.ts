// 리액트 src/prototype/filters/bbm-filter-panels.tsx 안의 내보내지 않은 데이터·계산 함수(여러 Vue 부품이 같이 쓰므로 한 곳에 복사).
// 원본을 고치면 여기도 같이 고친다.
import { bbmOriginalCounts } from "@proto/filters/bbm-original-counts";
import { bbmYearOptions } from "@proto/filters/bbm-year-range";
import type { BbmCheckKey, BbmFilterValues, BbmRangeKey } from "@proto/filters/bbm-filter-state";

// countOf: 우리 데이터로 거르는 항목의 선택지 옆 매물 수(QF-090). null 이면 원본 숫자 글자
export type CountOf = ((key: BbmCheckKey, option: string) => number | null) | undefined;
export type PanelValue = BbmFilterValues;

export const originalCount = (key: BbmCheckKey, option: string) => bbmOriginalCounts[key]?.[option] ?? null;
export const optionCount = (countOf: CountOf, key: BbmCheckKey, option: string) => countOf?.(key, option) ?? originalCount(key, option);

export const sellerTypeOptions = [
  { label: "개인", icon: "icons/seller-type/private.svg", description: null },
  { label: "딜러", icon: "icons/seller-type/dealer.svg", description: null },
  { label: "실차주", icon: "icons/seller-type/direct-owner.svg", description: "딜러가 직접 매입해 판매하는 차량" },
  { label: "브랜드 인증", icon: "icons/seller-type/brand-certified.svg", description: "제조사가 공식 인증·보증하는 차량" },
  { label: "리스·렌트 제휴", icon: "icons/seller-type/lease-rent.svg", description: "리스·렌터카 제휴 차량" },
] as const;

export const bodyTypeIcons: Record<string, string> = {
  "세단": "icons/body-type/sedan.svg",
  "해치백": "icons/body-type/hatchback.svg",
  "왜건": "icons/body-type/wagon.svg",
  "SUV": "icons/body-type/suv.svg",
  "RV": "icons/body-type/rv.svg",
  "쿠페": "icons/body-type/coupe.svg",
  "컨버터블": "icons/body-type/convertible.svg",
  "밴(승합)": "icons/body-type/cargo-van.svg",
  "픽업트럭": "icons/body-type/pickup.svg",
  "리무진": "icons/body-type/limousine.svg",
  "화물트럭": "icons/body-type/truck.svg",
  "버스": "icons/body-type/bus.svg",
  "캠핑카": "icons/body-type/camper.svg",
};

export const externalBodyTypes = new Set(["화물트럭", "버스", "캠핑카"]);

export const bikeGenreImages: Partial<Record<string, string>> = {
  "네이키드": "bike/types/autoscout-v01/naked.png",
  "스쿠터": "bike/types/autoscout-v01/scooter.png",
  "스포츠": "bike/types/autoscout-v01/sport.png",
  "멀티퍼포즈": "bike/types/autoscout-v01/multipurpose.png",
  "크루저": "bike/types/autoscout-v01/cruiser.png",
  "클래식": "bike/types/autoscout-v01/classic.png",
  "언더본": "bike/types/autoscout-v01/underbone.png",
  "투어러": "bike/types/autoscout-v01/tourer.png",
  "오프로드": "bike/types/autoscout-v01/offroad.png",
  "전기": "bike/types/autoscout-v01/electric.png",
  "삼륜": "bike/types/autoscout-v01/trike.png",
  "ATV": "bike/types/autoscout-v01/atv.png",
  "기타": "bike/types/autoscout-v01/other.png",
};

// 슬라이더 눈금 끝(원본 가격 슬라이더: 0 ~ 1억)
export const sliderMax: Partial<Record<BbmRangeKey, number>> = { price: 10000, mileage: 300000, power: 600, efficiency: 20, displacement: 5000, weight: 3000, evRange: 600, length: 6000, width: 2200, height: 2200 };
export const years = bbmYearOptions();
export const months = Array.from({ length: 12 }, (_, index) => `${index + 1}월`);

// 외부색상·시트색상 동그라미 색(원본 칩 모양을 따라 새로 정한 색. 투톤은 반반)
const half = (left: string, right: string) => `linear-gradient(90deg, ${left} 50%, ${right} 50%)`;
export const exteriorSwatches: Record<string, string> = {
  흰색: "#ffffff", 검정색: "#000000", 쥐색: "#5c5c5c", 청색: "#1b3f8a", 은색: "#e6e6e6", 은회색: "#b5b5b5", 빨간색: "#d0021b", 진주색: "#f4f1e4",
  노란색: "#f5e83a", 갈색: "#6b5530", 하늘색: "#6e8fa0", 녹색: "#19c80f", 담녹색: "#1d4a4a", 연금색: "#908571", 명은색: "#cdd5e0", 주황색: "#f07f12",
  연두색: "#93b25b", 자주색: "#7a2462", 은하색: "#a5abab", 갈대색: "#7c7b6e", 청옥색: "#22706f", 분홍색: "#f9c3d9", 검정투톤: half("#ffffff", "#000000"), 보라색: "#5b0e80",
  흰색투톤: half("#ffffff", "#e0e0e0"), 은색투톤: half("#ffffff", "#5c5c5c"), 금색: "#8c7430", 진주투톤: half("#f4f1e4", "#ffffff"), 갈색투톤: half("#6b5530", "#5c5c5c"), 금색투톤: half("#8c7430", "#3b3b3b"), 기타: "#ffffff",
};
export const seatSwatches: Record<string, string> = {
  "검정색 계열": "#000000", "갈색 계열": "#e0a56a", "베이지 계열": "#f0cfa0", "회색 계열": "#c8c8c8", "노란색 계열": "#f0c040", "녹색 계열": "#1a9a50",
  "빨간색 계열": "#d83a3a", "주황색 계열": "#f0662a", "청색 계열": "#1e3a9a", "흰색 계열": "#ffffff", 기타: "#ffffff",
};
