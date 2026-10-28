// 리액트 src/prototype/filters/bbm-price.tsx 안의 내보내지 않은 상수·계산 함수(Vue 부품 여럿이 같이 쓰므로 복사). 원본을 고치면 여기도 같이 고친다.
import { bbmRangePresets } from "@proto/filters/bbm-filter-options";
import { setBbmRange, type BbmFilterValues, type BbmPriceTab } from "@proto/filters/bbm-filter-state";

export const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
export const PRICE_TABS: BbmPriceTab[] = ["일반", "리스 / 렌트"];
export const PRICE_PRESETS = bbmRangePresets.price?.presets ?? [];
export const digits = (text: string) => text.replace(/[^\d]/g, "");
export const comma = (text: string) => { const value = digits(text); return value ? Number(value).toLocaleString("ko-KR") : ""; };
export const priceInvalid = (value: BbmFilterValues) => {
  const min = Number(digits(value.ranges.price?.min ?? ""));
  const max = Number(digits(value.ranges.price?.max ?? ""));
  return Boolean(min && max && min > max);
};
export const clearPrice = (value: BbmFilterValues): BbmFilterValues => ({ ...setBbmRange(value, "price", { min: "", max: "" }), priceTab: "일반" });
