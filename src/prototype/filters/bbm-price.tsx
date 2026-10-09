import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { setBbmRange, type BbmFilterValues } from "./bbm-filter-state";
import "./bbm-price.css";

/*
 * 가격 필터 = 초톳 모바일웹·PC 가격 필터 구조 그대로(2026-10-09 xe.chotot.com 실측, 384 · 1440 DOM).
 * 슬라이더(0 ~ 상한+) + 최소·최대 직접 입력 + 「초기화 / 적용」. 탭·구간 칩·제목 줄 없음.
 * 노란색(#FFD400)은 보배드림 #222, 옅은 노랑(#FFE884, 마우스 올림)은 #8C8C8C로 바꾼다.
 * 값은 만원 단위 쉼표 문자열로 ranges.price에 저장한다(기존 필터 상태 그대로).
 */
const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
const digits = (text: string) => text.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
const comma = (text: string) => { const value = digits(text); return value ? Number(value).toLocaleString("ko-KR") : ""; };
const toNumber = (text: string | undefined) => { const value = digits(text ?? ""); return value ? Number(value) : null; };

// 슬라이더 범위: 초톳은 0~100 triệu, 1칸 = 1 triệu(100칸). 우리는 승용 0~1억(100만원 칸), 부품·용품 0~500만원(5만원 칸)
type Scale = { step: number; maxLabel: string };
const CAR_SCALE: Scale = { step: 100, maxLabel: "1억원+" };
const PARTS_SCALE: Scale = { step: 5, maxLabel: "500만원+" };
const STEPS = 100;

const clampPos = (value: number) => Math.max(0, Math.min(STEPS, value));
const posOf = (value: number | null, scale: Scale, fallback: number) => value === null ? fallback : clampPos(Math.round(value / scale.step));

/** 본문(슬라이더 + 입력 두 칸 + 오류 문구). 모바일 바텀시트와 PC 팝오버가 같이 쓴다. */
export function PriceFinalPanel({ value, onChange, scale = CAR_SCALE }: { value: BbmFilterValues; onChange: (next: BbmFilterValues) => void; scale?: Scale; presets?: string[]; hideTabs?: boolean }) {
  const range = value.ranges.price ?? { min: "", max: "" };
  const min = toNumber(range.min);
  const max = toNumber(range.max);
  const invalid = min !== null && max !== null && min > max;
  const minPos = posOf(min, scale, 0);
  const maxPos = posOf(max, scale, STEPS);
  const write = (next: { min?: string; max?: string }) => onChange(setBbmRange(value, "price", { min: next.min ?? range.min, max: next.max ?? range.max }));
  // 손잡이를 움직이면 두 칸이 함께 채워진다(초톳: 최소를 끌면 최대 칸에 100.000.000이 들어감). 손잡이는 서로 넘지 않는다.
  const drag = (key: "min" | "max", pos: number) => {
    const nextMin = key === "min" ? Math.min(pos, maxPos) : minPos;
    const nextMax = key === "max" ? Math.max(pos, minPos) : maxPos;
    write({ min: (nextMin * scale.step).toLocaleString("ko-KR"), max: (nextMax * scale.step).toLocaleString("ko-KR") });
  };
  const progress: CSSProperties = { left: `${Math.min(minPos, maxPos)}%`, right: `${STEPS - Math.max(minPos, maxPos)}%` };
  return <div className="pc-panel">
    <div className="pc-slider-row">
      <span className="pc-slider-end">0</span>
      <div className="pc-slider">
        <div className="pc-track"><div className="pc-progress" style={progress} /></div>
        <div className="pc-ranges">
          <input type="range" className="pc-range is-min" min={0} max={STEPS} step={1} value={minPos} aria-label="최저 가격" aria-valuetext={min === null ? "0원" : `${min.toLocaleString("ko-KR")}만원`} onChange={(event) => drag("min", Number(event.currentTarget.value))} />
          <input type="range" className="pc-range is-max" min={0} max={STEPS} step={1} value={maxPos} aria-label="최고 가격" aria-valuetext={max === null ? scale.maxLabel : `${max.toLocaleString("ko-KR")}만원`} onChange={(event) => drag("max", Number(event.currentTarget.value))} />
        </div>
      </div>
      <span className="pc-slider-end">{scale.maxLabel}</span>
    </div>
    <div className="pc-inputs">
      <PriceBox label="최저 가격" value={range.min} error={invalid} onChange={(text) => write({ min: text })} />
      <span className="pc-sep" aria-hidden="true">-</span>
      <PriceBox label="최고 가격" value={range.max} error={invalid} onChange={(text) => write({ max: text })} />
    </div>
    {invalid ? <p className="pc-error" role="alert">낮은 가격부터 높은 가격 순으로 입력해 주세요</p> : null}
  </div>;
}

// 초톳 「Input Field - Currency」: 2px 테두리 상자, 안쪽 떠오르는 라벨(14 → 10 굵게), 오른쪽 단위
function PriceBox({ label, value, error, onChange }: { label: string; value: string; error: boolean; onChange: (text: string) => void }) {
  return <label className={`pc-box${value ? " has-value" : ""}${error ? " is-error" : ""}`}>
    <input type="text" inputMode="decimal" autoComplete="off" value={value} aria-label={label} aria-invalid={error || undefined} onChange={(event) => onChange(comma(event.currentTarget.value))} />
    <span className="pc-label" aria-hidden="true">{label}</span>
    <span className="pc-unit" aria-hidden="true">만원</span>
  </label>;
}

function useScrollLock(enabled: boolean) {
  useLayoutEffect(() => {
    if (!enabled) return;
    const scroller = document.querySelector<HTMLElement>(".marketplace")?.closest<HTMLElement>(".mobile-scroll");
    if (!scroller) return;
    const previous = scroller.style.overflowY;
    const top = scroller.scrollTop;
    scroller.style.overflowY = "hidden";
    return () => { scroller.style.overflowY = previous; scroller.scrollTop = top; };
  }, [enabled]);
}

/**
 * 모바일: 아래에서 올라오는 시트(위 모서리 20, 제목·닫기 없음). PC: 가격 칩 바로 아래 12px에 붙는 팝오버(폭 360, 모서리 20, 그림자 0 0 16 25%).
 * 배경·Esc는 입력 중인 값을 버리고, 「적용」만 반영한다. 「초기화」는 가격을 지우고 바로 닫는다(초톳 Xóa lọc과 같음).
 */
export function PriceFinalSheet({ value, onApply, onClose, variant = "sheet", returnFocus, presets }: { presets?: string[]; hideTabs?: boolean; value: BbmFilterValues; countOf?: (next: BbmFilterValues) => number; onApply: (next: BbmFilterValues) => void; onClose: () => void; variant?: "sheet" | "modal"; returnFocus?: () => HTMLElement | null }) {
  const popover = variant === "modal";
  const scale = presets && presets.some((preset) => preset.includes("만원") && !preset.includes("천")) ? PARTS_SCALE : CAR_SCALE;
  const [draft, setDraft] = useState(value);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const dialog = useRef<HTMLElement>(null);
  useScrollLock(true);
  useLayoutEffect(() => {
    if (!popover) return;
    const place = () => setAnchor(returnFocus?.()?.getBoundingClientRect() ?? null);
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [popover, returnFocus]);
  const close = () => { onClose(); window.requestAnimationFrame(() => returnFocus?.()?.focus({ preventScroll: true })); };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  // 초톳처럼 입력칸에 바로 커서를 두지 않는다(모바일 키패드가 뜨지 않게). 포커스는 시트 자체로만 옮긴다
  useEffect(() => { window.requestAnimationFrame(() => dialog.current?.focus({ preventScroll: true })); }, []);
  const trap = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== "Tab" || !dialog.current) return;
    const items = [...dialog.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (!items.length) return;
    const first = items[0]; const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus({ preventScroll: true }); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus({ preventScroll: true }); }
  };
  const range = draft.ranges.price;
  const min = toNumber(range?.min);
  const max = toNumber(range?.max);
  const empty = min === null && max === null;
  const invalid = min !== null && max !== null && min > max;
  const apply = () => { onApply({ ...value, priceTab: "일반", ranges: { ...value.ranges, price: draft.ranges.price } }); close(); };
  const reset = () => { onApply({ ...setBbmRange(value, "price", { min: "", max: "" }), priceTab: "일반" }); close(); };
  const style: CSSProperties | undefined = popover && anchor ? { top: anchor.bottom + 12, left: Math.min(anchor.left, window.innerWidth - 360 - 16) } : undefined;
  return createPortal(<div className={`pc-overlay ${popover ? "is-popover" : "is-sheet"}${popover && !anchor ? " is-centered" : ""}`} onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <section ref={dialog} className="pc-sheet" style={style} role="dialog" aria-modal="true" aria-label="가격" tabIndex={-1} onKeyDown={trap}>
      <PriceFinalPanel value={draft} onChange={setDraft} scale={scale} />
      <div className="pc-actions">
        <button type="button" className="pc-button is-outline" onClick={reset}>초기화</button>
        <button type="button" className="pc-button is-primary" disabled={empty || invalid} onClick={apply}>적용</button>
      </div>
    </section>
  </div>, document.body);
}
