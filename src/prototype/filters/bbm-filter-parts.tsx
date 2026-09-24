import { useEffect, type CSSProperties, type ReactNode } from "react";
import { asset } from "../data";
import "./bbm-filter-parts.css";

// QF-076: 개발 시안형 필터 공통 부품. 원본(dev.bbmuseum.co.kr/car/list) 실측 수치만 따르고 코드·이미지는 새로 만든다.
// 수치 근거와 원본 비교표는 docs/bbm-filter-spec.md.

const icon = (name: string) => asset(`icons/bb/${name}.svg`);
const formatCount = (count: number) => count.toLocaleString("ko-KR");

// ── 사이드바 아코디언 항목(펼침형·모달형 공용 머리). 펼침형은 children 을 아래에, 모달형은 onOpenModal 로 412 모달을 띄운다
export function BbmAccordion({ label, open, onToggle, path, onReset, children, className = "" }: { label: string; open: boolean; onToggle: () => void; path?: string; onReset?: () => void; children?: ReactNode; className?: string }) {
  return (
    <section className={`bbm-filter-item${open ? " is-open" : ""}${className ? ` ${className}` : ""}`}>
      <button type="button" className="bbm-filter-toggle" aria-expanded={open} onClick={onToggle}>
        <span className="bbm-filter-label">{label}{!open && path ? <small className="bbm-filter-path">{path}</small> : null}</span>
        <span className="bbm-filter-chevron bb-icon" style={{ "--bb-icon": `url("${icon("chevron-down")}")`, "--bb-size": "20px" } as CSSProperties} aria-hidden="true" />
      </button>
      {onReset ? <button type="button" className="bbm-filter-item-reset" onClick={onReset}>초기화</button> : null}
      {open ? children : null}
    </section>
  );
}

// ── 체크 행. size="sidebar"(체크 17, 행 간격 33.6, 수 오른쪽 끝) / "modal"(체크 20, 행 간격 36, 수 이름 오른쪽 8)
export function BbmCheckRow({ label, count, checked, onToggle, size = "modal" }: { label: string; count?: number | null; checked: boolean; onToggle: () => void; size?: "sidebar" | "modal" | "option" }) {
  const disabled = count === 0 && !checked;
  return (
    <button type="button" role="checkbox" aria-checked={checked} aria-disabled={disabled || undefined} disabled={disabled} className={`bbmf-check is-${size}${checked ? " is-checked" : ""}${disabled ? " is-disabled" : ""}`} onClick={onToggle}>
      <i className="bbmf-check-box" style={{ "--bbmf-check-icon": `url("${icon("check")}")` } as CSSProperties} aria-hidden="true" />
      <span className="bbmf-check-label">{label}</span>
      {count === null || count === undefined ? null : <span className="bbmf-check-count">{formatCount(count)}</span>}
    </button>
  );
}

// ── 체크 목록(1열·2열). 지역·매매단지는 2열(열 폭 186)
export function BbmCheckGrid({ columns = 1, children, label }: { columns?: 1 | 2; children: ReactNode; label?: string }) {
  return <div className={`bbmf-check-grid is-col-${columns}`} role="group" aria-label={label}>{children}</div>;
}

// ── 단위 입력칸(원본 combo box: 입력 + 단위 + ▾). 사이드바 216×40 · 모달 166×48
export function BbmUnitField({ value, placeholder, unit, onChange }: { value: string; placeholder: string; unit: string; onChange: (next: string) => void }) {
  return (
    <label className="bbmf-unit-field">
      <input inputMode="numeric" value={value} placeholder={placeholder} aria-label={`${placeholder} ${unit}`} onChange={(event) => onChange(event.target.value.replace(/[^0-9.,]/g, ""))} />
      <span className="bbmf-unit">{unit}</span>
      <span className="bb-icon bbmf-unit-chevron" style={{ "--bb-icon": `url("${icon("chevron-down")}")`, "--bb-size": "18px" } as CSSProperties} aria-hidden="true" />
    </label>
  );
}

// ── 범위 입력: layout="stack"(사이드바, 최저/최대 두 줄 + 오른쪽 "부터/까지") · "inline"(모달, 최저 ~ 최대 한 줄)
export function BbmRangeInputs({ unit, min, max, onChange, layout = "inline" }: { unit: string; min: string; max: string; onChange: (next: { min: string; max: string }) => void; layout?: "stack" | "inline" }) {
  const minField = <BbmUnitField value={min} placeholder="최저" unit={unit} onChange={(next) => onChange({ min: next, max })} />;
  const maxField = <BbmUnitField value={max} placeholder="최대" unit={unit} onChange={(next) => onChange({ min, max: next })} />;
  return layout === "inline"
    ? <div className="bbmf-range is-inline">{minField}<span className="bbmf-range-sep" aria-hidden="true">~</span>{maxField}</div>
    : <div className="bbmf-range is-stack"><div>{minField}<span className="bbmf-range-word">부터</span></div><div>{maxField}<span className="bbmf-range-word">까지</span></div></div>;
}

// ── 범위 슬라이더(모양만: 양 끝 손잡이 + 파랑 막대). 이번 과제는 목록을 거르지 않으므로 값과 연결하지 않는다
export function BbmSlider({ label }: { label: string }) {
  return <div className="bbmf-slider" role="img" aria-label={`${label} 범위 막대`}><i /><b className="is-min" /><b className="is-max" /></div>;
}

// ── 선택 상자(연식 년·월). 105×40, 테두리 #E0E0E0, 라운드 8
export function BbmSelectBox({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (next: string) => void }) {
  return (
    <label className="bbmf-select">
      <select value={value} aria-label={label} onChange={(event) => onChange(event.target.value)}>
        <option value="">{label}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
      <span className="bb-icon bbmf-unit-chevron" style={{ "--bb-icon": `url("${icon("chevron-down")}")`, "--bb-size": "18px" } as CSSProperties} aria-hidden="true" />
    </label>
  );
}

// ── 색 칩(외부색상·시트색상): 회색 칩 높이 40 · 라운드 6 · 안쪽 10/12, 앞에 색 동그라미 16. swatch 없으면 글자만(시트 마감)
export function BbmColorChips({ options, selected, onToggle, swatches }: { options: string[]; selected: string[]; onToggle: (option: string) => void; swatches?: Record<string, string> }) {
  return (
    <div className="bbmf-color-chips">
      {options.map((option) => (
        <button key={option} type="button" aria-pressed={selected.includes(option)} className={selected.includes(option) ? "is-selected" : ""} onClick={() => onToggle(option)}>
          {swatches?.[option] ? <i className="bbmf-swatch" style={{ background: swatches[option] }} aria-hidden="true" /> : null}
          <span>{option}</span>
        </button>
      ))}
    </div>
  );
}

// ── 선택 버튼 2열(변속기 182×40 · 광고기간 181×44). full 첫 칸은 한 줄 전체(광고기간 "전체")
export function BbmChoiceGrid({ options, selected, onToggle, size = "md", firstFull = false }: { options: string[]; selected: string[]; onToggle: (option: string) => void; size?: "md" | "lg"; firstFull?: boolean }) {
  return (
    <div className={`bbmf-choices is-${size}${firstFull ? " is-first-full" : ""}`}>
      {options.map((option) => <button key={option} type="button" aria-pressed={selected.includes(option)} className={selected.includes(option) ? "is-selected" : ""} onClick={() => onToggle(option)}>{option}</button>)}
    </div>
  );
}

// ── 검색칸(차량번호 / 판매자): 252×44, 오른쪽 돋보기(파랑)
export function BbmKeywordInput({ value, placeholder, onChange }: { value: string; placeholder: string; onChange: (next: string) => void }) {
  return (
    <label className="bbmf-keyword">
      <input value={value} placeholder={placeholder} aria-label={placeholder} onChange={(event) => onChange(event.target.value)} />
      <span className="bb-icon" style={{ "--bb-icon": `url("${icon("search")}")`, "--bb-size": "18px" } as CSSProperties} aria-hidden="true" />
    </label>
  );
}

// ── 구간 칩(회색 배경). 모달은 2열(181×44, 간격 10), 사이드바는 3열(77.3×44)
export function BbmPresetChips({ options, selected, onPick, columns = 2 }: { options: string[]; selected?: string | null; onPick: (option: string) => void; columns?: 2 | 3 }) {
  return (
    <div className={`bbmf-presets is-col-${columns}`}>
      {options.map((option) => <button key={option} type="button" aria-pressed={selected === option} className={selected === option ? "is-selected" : ""} onClick={() => onPick(option)}>{option}</button>)}
    </div>
  );
}

// ── 탭(가격 일반/리스·렌트, 옵션 외관·내장…). 탭 126×44.4, 16px 600, 선택 #1A1A1A · 미선택 #767676
// variant="side": 옵션 모달 왼쪽 세로 탭(62×32, 12px 600, 라운드 20, 선택 #4D4D4D·흰 글자, 미선택 #F3F3F3·#B3B3B3)
export function BbmTabs<T extends string>({ tabs, value, onChange, label, variant = "line" }: { tabs: readonly T[]; value: T; onChange: (tab: T) => void; label: string; variant?: "line" | "side" }) {
  return (
    <div className={`bbmf-tabs is-${variant}`} role="tablist" aria-label={label}>
      {tabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={tab === value} className={tab === value ? "is-selected" : ""} onClick={() => onChange(tab)}>{tab}</button>)}
    </div>
  );
}

// ── 아래 버튼 줄: [초기화] + [확인 N대 | N대 보기]. variant 별 색: modal·sheet 진한 남색(#010F21), full 파랑
// 옵션 모달만 [취소] + [선택완료](resetLabel·confirmLabel 로 바꾼다)
export function BbmActionBar({ onReset, onConfirm, count, confirmStyle = "확인", variant = "modal", resetLabel = "초기화", confirmLabel }: { onReset: () => void; onConfirm: () => void; count: number; confirmStyle?: "확인" | "보기"; variant?: "modal" | "sheet" | "full"; resetLabel?: string; confirmLabel?: string }) {
  return (
    <div className={`bbmf-actions is-${variant}`}>
      <button type="button" className="bbmf-reset" onClick={onReset}>{resetLabel}</button>
      <button type="button" className="bbmf-confirm" onClick={onConfirm}>{confirmLabel ?? (confirmStyle === "확인" ? `확인 ${formatCount(count)}대` : `${formatCount(count)}대 보기`)}</button>
    </div>
  );
}

// Esc 로 닫기(모달·시트·전체 화면 공용)
function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return <button type="button" className="bbmf-close" aria-label="닫기" onClick={onClose}><img src={icon("close")} alt="" draggable={false} /></button>;
}

// ── PC 가운데 모달: 폭 412, 라운드 14, 딤 rgba(0,0,0,.5), 제목 16/22.4 600 가운데 + 오른쪽 닫기 24×32
export function BbmModal({ title, titleIcon, onClose, footer, children, wide = false }: { title: string; titleIcon?: ReactNode; onClose: () => void; footer?: ReactNode; children: ReactNode; wide?: boolean }) {
  useEscape(onClose);
  return (
    <div className="bbmf-overlay is-modal" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`bbmf-modal${wide ? " is-tall" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="bbmf-modal-header"><h3>{titleIcon}{title}</h3><CloseButton onClose={onClose} /></header>
        <div className="bbmf-modal-body">{children}</div>
        {footer}
      </section>
    </div>
  );
}

// ── 모바일 바텀시트: 제목 가운데 + 닫기, 아래 [초기화] + [N대 보기]
export function BbmSheet({ title, onClose, footer, children }: { title: string; onClose: () => void; footer?: ReactNode; children: ReactNode }) {
  useEscape(onClose);
  return (
    <div className="bbmf-overlay is-sheet" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="bbmf-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <header className="bbmf-sheet-header"><h3>{title}</h3><CloseButton onClose={onClose} /></header>
        <div className="bbmf-sheet-body">{children}</div>
        {footer}
      </section>
    </div>
  );
}

// ── 모바일 전체 필터 화면 틀: 머리(제목 왼쪽 · 닫기 오른쪽), 검색조건 유지·최근검색기록·[검색조건 저장], 항목 목록(행 58), 아래 버튼 줄
export function BbmFullItem({ label, onOpen }: { label: string; onOpen: () => void }) {
  return <button type="button" className="bbmf-full-item" onClick={onOpen}><span>{label}</span></button>;
}

export function BbmFullFilter({ onClose, tools, footer, children }: { onClose: () => void; tools?: ReactNode; footer?: ReactNode; children: ReactNode }) {
  useEscape(onClose);
  return (
    <div className="bbmf-full" role="dialog" aria-modal="true" aria-label="필터">
      <header className="bbmf-full-header"><h3>필터</h3><CloseButton onClose={onClose} /></header>
      {tools ? <div className="bbmf-full-tools">{tools}</div> : null}
      <div className="bbmf-full-body">{children}</div>
      {footer}
    </div>
  );
}
