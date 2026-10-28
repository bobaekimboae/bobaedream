// 리액트 src/prototype/filters/bbm-mileage.tsx 안의 내보내지 않은 계산 함수(Vue 부품 여럿이 같이 쓰므로 복사). 원본을 고치면 여기도 같이 고친다.
import { MILEAGE_MAX, MILEAGE_STEP, MILEAGE_TICKS } from "@proto/filters/bbm-mileage";

export const MILEAGE_POINTER_STEP = 100;
export const digits = (text: string) => text.replace(/[^\d]/g, "");
export const comma = (n: number) => n.toLocaleString("ko-KR");

// 값 간격은 서로 달라도 일곱 기준점은 여섯 칸에 동일 간격으로 배치한다.
export const pct = (value: number) => {
  const safe = Math.max(0, Math.min(MILEAGE_MAX, value));
  const last = MILEAGE_TICKS.length - 1;
  const index = Math.min(last - 1, Math.max(0, MILEAGE_TICKS.findIndex((tick) => safe <= tick) - 1));
  const from = MILEAGE_TICKS[index]; const to = MILEAGE_TICKS[index + 1];
  return (index + (safe - from) / (to - from)) / last;
};
export const valueFromPct = (ratio: number) => {
  const safe = Math.max(0, Math.min(1, ratio));
  const last = MILEAGE_TICKS.length - 1;
  const scaled = safe * last; const index = Math.min(last - 1, Math.floor(scaled));
  const from = MILEAGE_TICKS[index]; const to = MILEAGE_TICKS[index + 1];
  return from + (to - from) * (scaled - index);
};
export const snap = (value: number) => Math.max(0, Math.min(MILEAGE_MAX, Math.round(value / MILEAGE_STEP) * MILEAGE_STEP));
export const snapPointer = (value: number) => Math.max(0, Math.min(MILEAGE_MAX, Math.round(value / MILEAGE_POINTER_STEP) * MILEAGE_POINTER_STEP));
export const tickLabel = (value: number) => (value === 0 ? "0" : value === MILEAGE_MAX ? "15만+" : `${value / 10000}만`);

export const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
export const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
