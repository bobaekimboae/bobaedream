// QF-089: 적용 칩(진한 채움 + ×) 문구와 해제. 원본 실측: 체크는 선택지 이름("SUV", "디젤"),
// 가격은 "3,000만원부터 3,999만원까지", 한쪽만 있으면 "…부터" / "…까지".
import { bbmRangePresets, bbmSidebarItems } from "./bbm-filter-options";
import { bbmAppliedIds, bbmRangeBounds, clearBbmKey, rangeIsSet, toggleBbmCheck, type BbmCheckKey, type BbmFilterValues, type BbmRangeKey } from "./bbm-filter-state";

export type BbmAppliedChip = { id: string; label: string; clear: (value: BbmFilterValues) => BbmFilterValues };

const rangeUnit: Partial<Record<BbmRangeKey, string>> = { price: "만원", mileage: "km", year: "년", power: "마력", efficiency: "km/L", displacement: "cc", weight: "kg", length: "mm", width: "mm", height: "mm", evRange: "km" };

export function bbmRangeLabel(key: BbmRangeKey, value: BbmFilterValues) {
  const range = value.ranges[key];
  if (!rangeIsSet(range) || !range) return "";
  if (key === "year") return range.min || range.max ? `${range.min ? `${range.min} ` : ""}~${range.max ? ` ${range.max}` : ""}` : range.preset ?? "";
  if (key === "mileage") {
    const { min, max } = bbmRangeBounds(key, range);
    const short = (n: number) => { const man = Math.floor(n / 10000); const rest = n % 10000; const cheon = Math.floor(rest / 1000); return n < 1000 ? `${n}` : `${man ? `${man}만` : ""}${cheon ? `${cheon}천` : ""}${rest % 1000 ? rest % 1000 : ""}`; };
    if (min === null && max === null) return range.preset ?? "";
    return `${[min !== null ? `${short(min)}부터` : "", max !== null ? `${short(max)}까지` : ""].filter(Boolean).join(" ")} km`;
  }
  if (!range.min && !range.max && range.preset && key !== "price") return range.preset;
  const { min, max } = bbmRangeBounds(key, range);
  const unit = rangeUnit[key] ?? bbmRangePresets[key]?.unit ?? "";
  const text = (n: number) => `${n.toLocaleString("ko-KR")}${unit}`;
  if (min === null && max === null) return range.preset ?? "";
  return [min !== null ? `${text(min)}부터` : "", max !== null ? `${text(max)}까지` : ""].filter(Boolean).join(" ");
}

export function bbmAppliedChips(value: BbmFilterValues): BbmAppliedChip[] {
  return bbmAppliedIds(value).map((id): BbmAppliedChip => {
    if (id === "ad") return { id, label: value.adPeriod, clear: (next) => clearBbmKey(next, "adPeriod") };
    if (id === "keyword") return { id, label: value.keyword, clear: (next) => clearBbmKey(next, "keyword") };
    const [kind, key, option] = id.split(":");
    if (kind === "check") return { id, label: option, clear: (next) => toggleBbmCheck(next, key as BbmCheckKey, option) };
    return { id, label: bbmRangeLabel(key as BbmRangeKey, value), clear: (next) => clearBbmKey(next, key as BbmRangeKey) };
  }).filter((chip) => chip.label);
}

// 사이드바·전체 필터 항목에 값이 걸렸는지(제목 파랑 + 왼쪽 막대)와 값 요약(모바일 항목 오른쪽 회색 알약)
export function bbmItemValue(label: string, value: BbmFilterValues): string {
  const item = bbmSidebarItems.find((entry) => entry.label === label);
  if (!item) return "";
  if (label === "시트색상") return [...(value.checks.seatColor ?? []), ...(value.checks.seatFinish ?? [])].join(", ");
  if (label === "크기") return (["length", "width", "height"] as BbmRangeKey[]).map((key) => bbmRangeLabel(key, value)).filter(Boolean).join(", ");
  if (label === "광고기간") return value.adPeriod !== "전체" ? value.adPeriod : "";
  if (label === "차량번호 / 판매자") return value.keyword.trim();
  if (item.checkKey) return (value.checks[item.checkKey] ?? []).join(", ");
  if (item.rangeKey) return bbmRangeLabel(item.rangeKey, value);
  return "";
}
