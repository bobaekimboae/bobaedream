// JOB-7: dev /car/register 화면의 공용 입력 부품. 클래스 이름은 dev 원본(ui-floating-label-input 등) 그대로 써서
// register.css(원본 규칙 추출본)가 같은 모양을 그리게 한다.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { registerIcons } from "./data";

const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(" ");

type FloatInputProps = {
  label: string;
  value: string;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  numeric?: boolean;
  unit?: string;
  chevron?: boolean;
  error?: string;
  message?: string;
  id?: string;
  name?: string;
  maxLength?: number;
  className?: string;
  validation?: string;
  selected?: boolean;
  formVariant?: boolean;
  onChange?: (value: string) => void;
  onOpen?: () => void;
};

export function FloatInput({ label, value, required, readOnly, disabled, numeric, unit, chevron, error, message, id, name, maxLength, className, validation, selected, formVariant = true, onChange, onOpen }: FloatInputProps) {
  const [focused, setFocused] = useState(false);
  const hasValue = value !== "";
  const root = cx(
    "ui-floating-label-input",
    formVariant && "ui-floating-label-input--form ui-floating-label-input--mobile-form",
    (hasValue || focused) && "ui-floating-label-input--floating",
    numeric && "ui-floating-label-input--numeric",
    "ui-floating-label-input--align-left",
    chevron && "ui-floating-label-input--with-icon",
    unit && "ui-floating-label-input--with-unit",
    disabled && "ui-floating-label-input--disabled",
    readOnly && "ui-floating-label-input--readonly",
    required && "ui-floating-label-input--required",
    hasValue && "ui-floating-label-input--has-value",
    className,
    selected && hasValue && "is-selected",
    error && "is-validation-error",
    error && validation && "register-validation-target",
  );
  const input = (
    <input
      className="ui-floating-label-input__control"
      id={id}
      name={name}
      type="text"
      placeholder=""
      inputMode={numeric ? "numeric" : undefined}
      maxLength={maxLength}
      readOnly={readOnly}
      disabled={disabled}
      value={value}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(event) => onChange?.(numeric ? formatNumber(event.target.value) : event.target.value)}
    />
  );
  const field = (
    <span
      className={root}
      data-register-validation={validation}
      // 빈 입력칸은 글자 줄이 높이 0으로 접혀 있어, 칸 아무 곳이나 눌러도 입력창에 커서가 가게 한다(2026-10-09 「차량번호 입력 안먹히는데」)
      onClick={(event) => {
        if (disabled) return;
        if (onOpen) { onOpen(); return; }
        if (readOnly) return;
        const control = event.currentTarget.querySelector<HTMLInputElement>(".ui-floating-label-input__control");
        if (control && document.activeElement !== control) control.focus();
      }}
    >
      <span className="ui-floating-label-input__field">
        <span className="ui-floating-label-input__body">
          <label className="ui-floating-label-input__label" htmlFor={id}>
            <span className="ui-floating-label-input__label-text">{label}</span>
            {required ? <span className="ui-floating-label-input__required" aria-hidden="true">*</span> : null}
          </label>
          <span className={cx("ui-floating-label-input__input-row", unit && "ui-floating-label-input__input-row--form-unit ui-floating-label-input__input-row--mobile-form-unit")}>
            {input}
            {unit ? <span className="ui-floating-label-input__unit ui-floating-label-input__unit--form ui-floating-label-input__unit--mobile-form">{unit}</span> : null}
          </span>
        </span>
        {chevron ? <img className="ui-floating-label-input__icon ui-floating-label-input__icon--chevron-right-20" src={registerIcons.chevronRight20} alt="" /> : null}
      </span>
      {message ? <span className="ui-floating-label-input__meta"><span className="ui-floating-label-input__message">{message}</span></span> : null}
    </span>
  );
  return field;
}

export function formatNumber(raw: string) {
  const digits = raw.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
  return digits ? Number(digits).toLocaleString("ko-KR") : "";
}

export function ValidationMessage({ text }: { text?: string }) {
  return text ? <span className="register-validation-message">{text}</span> : null;
}

type SelectBoxProps = {
  value: string;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  search?: boolean;
  size?: "form" | "lg";
  className?: string;
  onChange: (value: string) => void;
};

// ui-select-box: 버튼을 누르면 아래로 목록(ui-select-box__menu)이 열리는 원본 셀렉트
export function SelectBox({ value, options, placeholder, disabled, search, size = "form", className, onChange }: SelectBoxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);
  const list = query ? options.filter((option) => option.includes(query)) : options;
  return (
    <span
      ref={ref}
      className={cx(
        "ui-select-box ui-fake-scrollbar",
        size === "form" ? "ui-select-box--form ui-select-box--mobile-form" : "ui-select-box--lg ui-select-box--mobile-sm",
        !value && "is-placeholder",
        disabled && "is-disabled",
        open && "is-open",
        className,
      )}
    >
      <button type="button" className="ui-select-box__control" disabled={disabled} onClick={() => setOpen(!open)}>
        <span className="ui-select-box__label">{value || placeholder}</span>
        <span className="ui-select-box__chevron" aria-hidden="true" />
      </button>
      <span className="ui-select-box__menu" role="listbox">
        {search ? <span className="ui-select-box__search"><input className="ui-select-box__search-input" type="search" placeholder="검색어를 입력해주세요" value={query} onChange={(event) => setQuery(event.target.value)} /></span> : null}
        {list.map((option) => (
          <button key={option} type="button" role="option" aria-selected={option === value} className={cx("ui-select-box__option", option === value && "is-selected")} onClick={() => { onChange(option); setOpen(false); setQuery(""); }}>{option}</button>
        ))}
      </span>
      <span className="ui-fake-scrollbar__track" aria-hidden="true"><span className="ui-fake-scrollbar__thumb" aria-hidden="true" /></span>
    </span>
  );
}

type FloatSelectProps = {
  label: string;
  value: string;
  options: string[];
  required?: boolean;
  disabled?: boolean;
  search?: boolean;
  className?: string;
  validation?: string;
  onChange: (value: string) => void;
};

export function FloatSelect({ label, value, options, required, disabled, search, className, validation, onChange }: FloatSelectProps) {
  return (
    <span className={cx("ui-floating-label-select ui-floating-label-select--form ui-floating-label-select--mobile-form", value && "ui-floating-label-select--floating ui-floating-label-select--has-value", disabled && "is-disabled", "register-detail-floating-select", className, required && "is-required")} data-register-validation={validation}>
      <label className="ui-floating-label-select__label">{label}</label>
      <SelectBox value={value} options={options} disabled={disabled} search={search} className="ui-floating-label-select__select" onChange={onChange} />
    </span>
  );
}

type ChoiceOption = { value: string; label: string; disabled?: boolean };

export function ChoiceGroup({ name, value, options, onChange, className, multiple, size = "lg", mobile = "sm" }: { name: string; value: string | string[]; options: ChoiceOption[]; onChange: (value: string) => void; className?: string; multiple?: boolean; size?: "lg" | "sm"; mobile?: "sm" | "lg" }) {
  const isOn = (option: string) => Array.isArray(value) ? value.includes(option) : value === option;
  return (
    <div className={cx("ui-choice-group", `ui-choice-group--${size}`, `ui-choice-group--mobile-${mobile}`, className)}>
      {options.map((option, index) => (
        <label key={option.value} className={cx("ui-choice", isOn(option.value) && "is-selected", option.disabled && "is-disabled")}>
          <input id={`${name}-${index}`} type={multiple ? "checkbox" : "radio"} name={name} value={option.value} checked={isOn(option.value)} disabled={option.disabled} onChange={() => onChange(option.value)} />
          <span className="ui-choice__button"><span className="ui-choice__label">{option.label}</span></span>
        </label>
      ))}
    </div>
  );
}

export function Checkbox({ checked, label, onChange, className, size = "lg", id, name }: { checked: boolean; label: ReactNode; onChange: (checked: boolean) => void; className?: string; size?: "lg" | "md"; id?: string; name?: string }) {
  return (
    <label className={cx("ui-checkbox ui-checkbox--square", size === "lg" ? "ui-checkbox--lg" : "ui-checkbox--md ui-checkbox--mobile-md", className)}>
      <input className="ui-checkbox__input" id={id} name={name} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span className="ui-checkbox__mark" aria-hidden="true"><i className="ui-checkbox__icon" /></span>
      <span className="ui-checkbox__label">{label}</span>
    </label>
  );
}

// dev 원본 팝업(pop): 모바일은 전체 화면·바텀시트, PC는 가운데 모달. 모양은 클래스에 따라 register.css가 정한다
export function Pop({ open, title, className, bodyClassName, onClose, footer, children, id, rawBody }: { open: boolean; title: string; className?: string; bodyClassName?: string; onClose: () => void; footer?: ReactNode; children: ReactNode; id?: string; rawBody?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return toRegisterLayer(
    <div className={cx("pop", className, "open")} id={id} role="dialog" aria-modal="true" aria-label={title} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="pop-panel ui-fake-scrollbar">
        <div className="pop-hd">
          <button type="button" className="ui-btn ui-btn--ghost pb" aria-label="닫기" onClick={onClose}><i className="screen-icon-back" /></button>
          <span className="pt">{title}</span>
          <span className="ps" />
        </div>
        {rawBody ? children : <div className={cx("pop-body", bodyClassName)}>{children}</div>}
        {footer}
        <span className="ui-fake-scrollbar__track"><span className="ui-fake-scrollbar__thumb" /></span>
      </div>
    </div>,
  );
}

// dev 확인창(.confirm-modal): 제목 + 아니요 · 확인 두 버튼. 배경을 누르거나 Esc를 누르면 아니요와 같다
export function ConfirmModal({ open, title, cancelLabel, confirmLabel, onCancel, onConfirm }: { open: boolean; title: string; cancelLabel: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);
  if (!open) return null;
  return toRegisterLayer(
    <div className="confirm-modal is-open">
      <div className="confirm-modal__backdrop" onClick={onCancel} />
      <div className="confirm-modal__panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="confirm-modal__main"><h3 className="confirm-modal__title">{title}</h3></div>
        <div className="confirm-modal__footer">
          <button type="button" className="ui-btn ui-btn--outline ui-btn--lg ui-btn--align-center ui-btn--pill ui-btn--bordered" onClick={onCancel}><span className="ui-btn__label">{cancelLabel}</span></button>
          <button type="button" className="ui-btn ui-btn--primary ui-btn--lg ui-btn--align-center ui-btn--pill" onClick={onConfirm}><span className="ui-btn__label">{confirmLabel}</span></button>
        </div>
      </div>
    </div>,
  );
}

// dev는 팝업을 body 바로 아래에 둔다(폼 페이지 범위 규칙이 팝업에 닿지 않음). 시안은 원본 CSS를 .bbm-register 아래로 묶었으므로 그 루트 바로 아래로 옮긴다
export function toRegisterLayer(node: ReactNode) {
  const root = typeof document === "undefined" ? null : document.querySelector(".bbm-register");
  return root ? createPortal(node, root) : node;
}

export function UnderlineAmount({ id, placeholder, value, unit = "만원", readOnly, onChange, className = "register-sale-modal-form__amount-input" }: { id: string; placeholder: string; value: string; unit?: string; readOnly?: boolean; onChange?: (value: string) => void; className?: string }) {
  const change = (raw: string) => onChange?.(formatNumber(raw));
  return (
    <span className={cx("ui-responsive-input", className)}>
      <span className="ui-underline-input ui-underline-input--lg ui-underline-input--mobile-sm ui-underline-input--numeric ui-underline-input--align-right ui-responsive-input__mobile">
        <input className="ui-underline-input__control" id={id} type="text" inputMode="numeric" placeholder={placeholder} readOnly={readOnly} value={value} onChange={(event) => change(event.target.value)} />
        <span className="ui-underline-input__unit">{unit}</span>
      </span>
      <span className="ui-box-input ui-box-input--lg ui-box-input--numeric ui-box-input--align-left ui-responsive-input__desktop">
        <span className="ui-box-input__field">
          <input className="ui-box-input__control" id={`${id}-pc`} type="text" inputMode="numeric" placeholder={placeholder} readOnly={readOnly} value={value} onChange={(event) => change(event.target.value)} />
          <span className="ui-box-input__unit">{unit}</span>
        </span>
      </span>
    </span>
  );
}
