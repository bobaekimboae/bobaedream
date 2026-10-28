// src/prototype/listing/pc-bbmuseum.tsx 안에서 export 되지 않은 상수·계산 함수의 사본.
// 여러 Vue 부품(BbHeader · BbSecondaryNav · BbFilterSidebar …)이 함께 쓰므로 한 파일에 모았다.
// 원본을 고치면 이 파일도 같이 고친다(export 된 것은 원본에서 바로 import 한다).
import { BBM_MAKER_ITEM, bbmSidebarItems } from "@proto/filters/bbm-filter-options";
import { asset } from "@proto/data";
import { truckFormatCatalog } from "@proto/data/truck-format-catalog";

export type BbIconName = "search" | "mypage" | "heart" | "heart-filled" | "chat" | "notification" | "menu" | "chevron-down" | "filter" | "saved-search" | "view-list" | "location-pin" | "photo-count" | "chevron-left" | "check" | "circle-check" | "circle-check-off" | "circle-close";

export type BbGnbItem = { label: string; category?: string; action?: "home" | "community" | "more" | "bike-sell" | "bike-shop" | "bike-parts" | "truck-sell" | "truck-parts" };
export type BbGnbSubItem = { label: string; category: string; detail?: string };

export const bbGnbItems: readonly BbGnbItem[] = [
  { label: "전체 차량", category: "전체" },
  { label: "국산차", category: "국산차" },
  { label: "수입차", category: "수입차" },
  { label: "트럭 · 특장", category: "트럭 · 특장" },
  { label: "바이크", category: "바이크" },
  { label: "중고부품", category: "부품 · 용품" },
  { label: "커뮤니티", action: "community" },
  { label: "더보기", action: "more" },
];
export const bbGnbMoreItems: readonly BbGnbItem[] = [
  { label: "캠핑카", category: "캠핑카" },
  { label: "자재운반장비", category: "자재운반장비" },
  { label: "올드카", category: "올드카" },
];
export const bbBikeSiteGnbItems: readonly BbGnbItem[] = [
  { label: "중고 바이크", category: "바이크" },
  { label: "바이크샵", action: "bike-shop" },
  { label: "중고 용품·장비", category: "부품 · 용품", action: "bike-parts" },
  { label: "커뮤니티", action: "community" },
];
export const bbTruckSiteGnbItems: readonly BbGnbItem[] = [
  { label: "중고 트럭", category: "트럭 · 특장" },
  { label: "트럭 판매", category: "트럭 · 특장", action: "truck-sell" },
  { label: "트럭 부품", category: "부품 · 용품", action: "truck-parts" },
  { label: "커뮤니티", action: "community" },
];
const bbUsedCarCategories = new Set([
  "중고차", "국산차", "수입차", "전기차", "리스/렌트차량", "서울오토갤러리", "도이치오토월드", "SK V1 모터스",
  "브랜드 인증중고차", "매매단지별 검색", "팔린매물", "장애인차", "슈퍼카", "럭셔리카", "레어카", "JDM",
  "튜닝·커스텀카", "셀럽카",
]);
export const bbGnbSubmenus: Readonly<Record<string, readonly BbGnbSubItem[]>> = {
  "전체 차량": [
    { label: "전체차량", category: "전체" },
    { label: "중고차", category: "중고차" },
    { label: "트럭 · 특장", category: "트럭 · 특장" },
    { label: "바이크", category: "바이크" },
    { label: "캠핑카", category: "캠핑카" },
    { label: "중장비", category: "건설기계" },
    { label: "자재운반장비", category: "자재운반장비" },
    { label: "부품/용품", category: "부품 · 용품" },
  ],
  국산차: [{ label: "전체 국산차", category: "국산차" }],
  수입차: [
    { label: "전체 수입차", category: "수입차" },
  ],
  "트럭 · 특장": [
    { label: "전체 트럭", category: "트럭 · 특장" },
    ...truckFormatCatalog.slice(0, 7).map((item) => ({ label: item.name, category: "트럭 · 특장", detail: item.name })),
  ],
  바이크: [{ label: "바이크 전체", category: "바이크" }],
  중고부품: [{ label: "부품/용품 전체", category: "부품 · 용품" }],
  더보기: [
    { label: "캠핑카", category: "캠핑카" },
    { label: "자재운반장비", category: "자재운반장비" },
    { label: "올드카", category: "올드카" },
  ],
};
export function bbActiveGnbItem(category: string) {
  if (category === "부품 · 용품" && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("bikeMenu") === "parts") return "바이크";
  return category === "전체" ? "전체 차량"
    : category === "국산차" ? "국산차"
      : category === "수입차" ? "수입차"
        : bbUsedCarCategories.has(category) ? "전체 차량"
          : category === "트럭 · 특장" ? "트럭 · 특장"
            : category === "건설기계" || category === "자재운반장비" ? "전체 차량"
              : category === "캠핑카" ? "더보기"
                : category === "부품 · 용품" ? "중고부품"
                  : category === "바이크" ? category : "더보기";
}
export const bbSubnavCurrent = (item: BbGnbSubItem, category: string, categoryDetail: string | null) => {
  return item.category === category && (item.detail ? item.detail === categoryDetail : !categoryDetail);
};

// 2026-10-18 탑메뉴 현재 메뉴 표시: 기본 = 알약 없는 700 #222 글자 + 3px #222 밑줄(네이버 증권식).
// 비교 보존: `&gnbactive=pill`(이전 검정 알약) · `&gnbactive=text`(밑줄 없는 글자만)
export function bbGnbActiveMode(): "line" | "text" | "pill" {
  if (typeof window === "undefined") return "line";
  const v = new URLSearchParams(window.location.search).get("gnbactive");
  return v === "pill" || v === "text" ? v : "line";
}
// 2026-10-18 「초톳의 지역」 `&gnbsearch=pill`: 탑메뉴 `차량검색 ▾`만 초톳 지역 버튼(Toàn quốc ▾) 모양의 연회색 알약
export function bbGnbSearchPill(): boolean {
  if (typeof window === "undefined") return false;
  const v = new URLSearchParams(window.location.search).get("gnbsearch");
  return v === "pill" || v === "pillblue";
}
// 2026-10-18 「초톳 알약이 연한 블루」 `&gnbsearch=pillblue`
export function bbGnbSearchPillBlue(): boolean {
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).get("gnbsearch") === "pillblue";
}
export type BbLogoLanguage = "en" | "ko";
export function bbLogoLanguage(): BbLogoLanguage {
  if (typeof window === "undefined") return "ko";
  return new URLSearchParams(window.location.search).get("pclogo") === "en" ? "en" : "ko";
}
export type BbAuthState = "guest" | "member";
export function bbAuthState(): BbAuthState {
  if (typeof window === "undefined") return "guest";
  return new URLSearchParams(window.location.search).get("pcauth") === "member" ? "member" : "guest";
}
export const bbmAsset = (name: string) => asset(`bbm/${name}.svg`);

export const bbmServiceLogo = (category: string): string | null => {
  const key = category === "바이크" ? "bike"
    : category === "트럭 · 특장" ? "truck"
      : category === "건설기계" || category === "중장비" ? "construction"
        : category === "올드카" ? "oldcar"
          : null;
  return key ? asset(`bbm/service-logos/v01/bobaedream-${key}-v01.png`) : null;
};

// 원본 좌측 필터 27개 항목
export const bbMakerItem = BBM_MAKER_ITEM;
const passengerSidebarItems = bbmSidebarItems.filter((item) => !item.scope);
export const bbFilterMenuOriginal = [passengerSidebarItems[0].label, passengerSidebarItems[1].label, bbMakerItem, ...passengerSidebarItems.slice(2).map((item) => item.label)];
export const bbFilterItemByLabel = new Map(bbmSidebarItems.map((item) => [item.label, item]));

export type BbDrillView =
  | { stage: "maker" }
  | { stage: "model"; maker: string }
  | { stage: "generation"; maker: string; model: string }
  | { stage: "grade"; maker: string; model: string; generation: string };

export const popularModelsByMaker: Record<string, string[]> = {
  현대: ["그랜저", "아반떼", "싼타페", "쏘나타", "팰리세이드"],
  제네시스: ["G80", "GV80", "GV70", "G70", "G90"],
  기아: ["카니발", "쏘렌토", "K5", "스포티지", "K8"],
  쉐보레: ["트랙스", "스파크", "말리부", "트레일블레이저", "콜로라도"],
  르노코리아: ["QM6", "XM3", "SM6", "SM5", "SM3"],
  KG모빌리티: ["토레스", "티볼리", "렉스턴", "코란도", "무쏘"],
  BMW: ["5시리즈", "3시리즈", "X5", "X3", "X4"],
  벤츠: ["E클래스", "S클래스", "C클래스", "GLC클래스", "GLE클래스"],
};

export type BbTruckView = "format" | "subtype" | "spec" | "complete";
export const inlineTruckPayloadSubtypes = new Set(["경형", "소형"]);

// 2026-10-21 「필터 더보기 안 눌러도 판매 방식 아래에 차량번호 / 판매자 검색」: 더보기 밖 마지막 항목으로 두고 늘 펼친다
export const charanchaFilterOrder = [bbMakerItem, "차급", "바디타입", "연식", "주행거리", "가격", "옵션", "외부색상", "연료", "변속기", "지역", "매매단지", "판매자 유형", "판매방식", "차량번호 / 판매자"];
export const charanchaFilterLabels: Record<string, string> = { 차급: "차종", 바디타입: "바디타입", 외부색상: "색상", "판매자 유형": "판매자유형", 판매방식: "판매 방식", "차량번호 / 판매자": "차량번호 · 판매자 검색" };
export const charanchaAlwaysOpen = new Set(["차량번호 / 판매자"]);
