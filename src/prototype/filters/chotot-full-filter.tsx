import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "./chotot-full-filter.css";

/*
 * 전체 필터 = 초톳 「Lọc Nâng Cao」 구조 그대로(2026-10-09 xe.chotot.com 모바일웹 384 · PC 1440 DOM·CSS 실측).
 * 머리(✕ + 가운데 제목, 48, 아래 1px #E8E8E8) → 접고 펴는 섹션들(제목 16/500/24 + 오른쪽 ⌃) → 아래 「초기화」 + 「N대 보기」.
 * 단일 선택 = 라디오(다시 누르면 해제), 여러 선택 = 체크박스(줄 사이 #F4F4F4), 켜고 끄기 = 스위치 52×32.
 * 긴 목록은 5개 + 「더 보기 ▾」. 노랑 #FFD400 → 보배드림 #222, 옅은 노랑 #FFE884 → #8C8C8C.
 */
export type ChototOption = { value: string; label?: string };
export type ChototSection =
  | { kind: "custom"; key: string; title: string; body: ReactNode }
  | { kind: "radio"; key: string; title: string; options: ChototOption[]; selected: string | null; onSelect: (value: string | null) => void; visible?: number }
  | { kind: "check"; key: string; title: string; options: ChototOption[]; selected: string[]; onToggle: (value: string) => void; visible?: number }
  | { kind: "inputs"; key: string; title: string; minLabel: string; maxLabel: string; unit: string; min: string; max: string; format?: (text: string) => string; onChange: (min: string, max: string) => void }
  | { kind: "toggle"; key: string; title: string; label: string; on: boolean; onToggle: () => void }
  | { kind: "text"; key: string; title: string; label: string; value: string; onChange: (value: string) => void }
  | { kind: "button"; key: string; title: string; label: string; value?: string; onClick: () => void };

const chotot = (name: string) => `${import.meta.env.BASE_URL}assets/register/chotot-v01/${name}`;
const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';
const SHOW = 5;

// 섹션 접기 화살표 = 초톳 180개 묶음 chotot-list-detail-toggle-arrow.svg(아래 ⌄). 펼친 상태는 180° 돌려 ⌃
function Chevron({ open }: { open: boolean }) {
  return <img className={`cf-chevron${open ? " is-open" : ""}`} src={chotot("toggle-arrow.svg")} alt="" aria-hidden="true" />;
}

// 선택 체크 = 초톳 check-mark.svg(노션 초톳 DB). 흰색으로 보이게 CSS filter
function Check() {
  return <img className="cf-check" src={chotot("check-mark.svg")} alt="" aria-hidden="true" />;
}

function MoreButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return <button type="button" className="cf-more" aria-expanded={open} onClick={onClick}>{open ? "접기" : "더 보기"}<img src={chotot("caret-down.svg")} alt="" aria-hidden="true" className={open ? "is-open" : ""} /></button>;
}

function RadioList({ section }: { section: Extract<ChototSection, { kind: "radio" }> }) {
  const [more, setMore] = useState(false);
  const limit = section.visible ?? SHOW;
  const selectedIndex = section.options.findIndex((option) => option.value === section.selected);
  const shown = more || section.options.length <= limit + 1 ? section.options : section.options.slice(0, Math.max(limit, selectedIndex + 1));
  return <div className="cf-list is-radio" role="radiogroup" aria-label={section.title}>
    {shown.map((option) => {
      const on = option.value === section.selected;
      return <button type="button" key={option.value} role="radio" aria-checked={on} className={`cf-row${on ? " is-selected" : ""}`} onClick={() => section.onSelect(on ? null : option.value)}>
        <span className="cf-row-label">{option.label ?? option.value}</span>
        <span className="cf-radio" aria-hidden="true">{on ? <Check /> : null}</span>
      </button>;
    })}
    {section.options.length > limit + 1 ? <MoreButton open={more} onClick={() => setMore((value) => !value)} /> : null}
  </div>;
}

function CheckList({ section }: { section: Extract<ChototSection, { kind: "check" }> }) {
  const [more, setMore] = useState(false);
  const limit = section.visible ?? SHOW;
  const shown = more || section.options.length <= limit + 1 ? section.options : section.options.filter((option, index) => index < limit || section.selected.includes(option.value));
  return <div className="cf-list is-check" role="group" aria-label={section.title}>
    {shown.map((option) => {
      const on = section.selected.includes(option.value);
      return <button type="button" key={option.value} role="checkbox" aria-checked={on} className={`cf-row${on ? " is-selected" : ""}`} onClick={() => section.onToggle(option.value)}>
        <span className="cf-row-label">{option.label ?? option.value}</span>
        <span className="cf-checkbox" aria-hidden="true">{on ? <Check /> : null}</span>
      </button>;
    })}
    {section.options.length > limit + 1 ? <MoreButton open={more} onClick={() => setMore((value) => !value)} /> : null}
  </div>;
}

// 초톳 「Năm đăng ký」 입력 두 칸(가격 칸과 같은 상자, 라벨이 칸 안에 있다가 위로 올라감)
function InputBox({ label, unit, value, invalid, onChange }: { label: string; unit: string; value: string; invalid: boolean; onChange: (text: string) => void }) {
  return <label className={`cf-box${value ? " has-value" : ""}${invalid ? " is-error" : ""}`}>
    <input type="text" inputMode="numeric" autoComplete="off" value={value} aria-label={label} aria-invalid={invalid || undefined} onChange={(event) => onChange(event.currentTarget.value)} />
    <span className="cf-box-label" aria-hidden="true">{label}</span>
    {unit ? <span className="cf-box-unit" aria-hidden="true">{unit}</span> : null}
  </label>;
}

function Inputs({ section }: { section: Extract<ChototSection, { kind: "inputs" }> }) {
  const format = section.format ?? ((text: string) => text.replace(/[^\d]/g, ""));
  const num = (text: string) => { const digits = text.replace(/[^\d]/g, ""); return digits ? Number(digits) : null; };
  const min = num(section.min); const max = num(section.max);
  const invalid = min !== null && max !== null && min > max;
  return <div className="cf-inputs-wrap">
    <div className="cf-inputs">
      <InputBox label={section.minLabel} unit={section.unit} value={section.min} invalid={invalid} onChange={(text) => section.onChange(format(text), section.max)} />
      <span className="cf-sep" aria-hidden="true">-</span>
      <InputBox label={section.maxLabel} unit={section.unit} value={section.max} invalid={invalid} onChange={(text) => section.onChange(section.min, format(text))} />
    </div>
    {invalid ? <p className="cf-error" role="alert">낮은 값부터 높은 값 순으로 입력해 주세요</p> : null}
  </div>;
}

function SectionBody({ section }: { section: ChototSection }) {
  if (section.kind === "custom") return <div className="cf-custom">{section.body}</div>;
  if (section.kind === "radio") return <RadioList section={section} />;
  if (section.kind === "check") return <CheckList section={section} />;
  if (section.kind === "inputs") return <Inputs section={section} />;
  if (section.kind === "toggle") return <button type="button" role="switch" aria-checked={section.on} className="cf-toggle-row" onClick={section.onToggle}>
    <span>{section.label}</span><span className={`cf-switch${section.on ? " is-on" : ""}`} aria-hidden="true"><i /></span>
  </button>;
  if (section.kind === "text") return <div className="cf-inputs-wrap"><label className={`cf-box is-wide${section.value ? " has-value" : ""}`}>
    <input type="text" autoComplete="off" value={section.value} aria-label={section.label} onChange={(event) => section.onChange(event.currentTarget.value)} />
    <span className="cf-box-label" aria-hidden="true">{section.label}</span>
  </label></div>;
  return <button type="button" className="cf-row is-link" onClick={section.onClick}><span className="cf-row-label">{section.label}</span><span className="cf-row-value">{section.value}</span><img className="cf-row-chevron" src={chotot("chevron-right.svg")} alt="" aria-hidden="true" /></button>;
}

export function ChototFullFilter({ title = "필터", sections, count, onReset, onApply, onClose, variant, defaultClosed = [] }: { title?: string; sections: ChototSection[]; count: number; onReset: () => void; onApply: () => void; onClose: () => void; variant: "sheet" | "modal"; defaultClosed?: string[] }) {
  // 초톳은 섹션이 7개라 모두 펼쳐 둔다. 우리는 항목이 많아 기본 항목 밖(필터 더보기 쪽)은 처음에 접어 둔다
  const [closed, setClosed] = useState<string[]>(defaultClosed);
  const dialog = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    window.requestAnimationFrame(() => closeButton.current?.focus({ preventScroll: true }));
    return () => { window.removeEventListener("keydown", onKey); previous?.focus?.({ preventScroll: true }); };
  }, [onClose]);
  const trap = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== "Tab" || !dialog.current) return;
    const items = [...dialog.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (!items.length) return;
    const first = items[0]; const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  const toggle = (key: string) => setClosed((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  return createPortal(<div className={`cf-overlay is-${variant}`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialog} className="cf-dialog" role="dialog" aria-modal="true" aria-label={title} onKeyDown={trap}>
      <header className="cf-header">
        <button ref={closeButton} type="button" className="cf-close" aria-label="닫기" onClick={onClose}><img src={chotot("close-window.svg")} alt="" aria-hidden="true" /></button>
        <h2>{title}</h2>
      </header>
      <div className="cf-body">
        {sections.map((section) => {
          const open = !closed.includes(section.key);
          return <div key={section.key} className={`cf-section is-${section.kind}`}>
            <button type="button" className="cf-section-title" aria-expanded={open} onClick={() => toggle(section.key)}><span>{section.title}</span><Chevron open={open} /></button>
            {open ? <SectionBody section={section} /> : null}
          </div>;
        })}
      </div>
      <footer className="cf-footer">
        <button type="button" className="cf-reset" onClick={onReset}>초기화</button>
        <button type="button" className="cf-apply" onClick={onApply}>{count.toLocaleString("ko-KR")}대 보기</button>
      </footer>
    </section>
  </div>, document.body);
}
