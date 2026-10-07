// JOB-7: 매물 등록 화면(dev https://dev.bbmuseum.co.kr/car/register → /car/register/form 기준, 2026-10-07 실측).
// ?register 로 연다. 1단계(차량번호·동의) → 다음(14러0927 목업 조회) → 등록 폼. 실제 API·업로드·등록 요청은 보내지 않는다.
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { BbmFooter } from "../listing/bbm-list-area";
import "../listing/bbm-list-area.css";
import "./register.css";
import { registerHeaderHtml, registerPhotoGuideHtml, registerPolicyHtml } from "./header-html";
import { inspectionPcHtml } from "./inspection-pc-html";
import {
  countOptions,
  descriptionDrafts,
  exteriorColors,
  leaseCompanies,
  levelGroups,
  mediaProhibitions,
  mockLookup,
  mockSellerPhone,
  monthOptions,
  optionGroups,
  registerIcons,
  rentCompanies,
  seatColors,
  seatFinishes,
  subModels,
  yearOptions,
  formYearOptions,
  type RegisterColor,
} from "./data";
import { Checkbox, ChoiceGroup, FloatInput, FloatSelect, Pop, SelectBox, toRegisterLayer, UnderlineAmount, ValidationMessage } from "./ui";

const asset = (path: string) => `${import.meta.env.BASE_URL}assets/${path}`;
const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(" ");

type PopName = null | "model" | "level" | "color" | "seat" | "options" | "prohibit" | "region" | "descload" | "lease" | "rent" | "inspection" | "inspectionPc" | "photos" | "seizure" | "mortgage" | "policy";

const descriptionTemplate = "[차량 한줄 소개]\n\n[차량 상태]\n- 외관 상태:\n- 실내 상태:\n\n[주요 옵션]\n- 주요 옵션:\n- 추가 장착 사항:\n\n[판매 안내]\n- 차량 확인 가능 시간:\n- 기타 안내사항:";
const photoSlots = ["앞측면", "뒷측면", "전면", "후면", "휠/타이어", "엔진", "실내", "계기판", "변속기", "트렁크", ...Array.from({ length: 10 }, () => "옵션")];
const mockAddresses = ["서울특별시 강남구 테헤란로 123", "서울특별시 성동구 성수이로 66", "경기도 수원시 권선구 경수대로 89", "인천광역시 서구 봉오대로 150"];

type SaleExtra = { type: string; company: string; settlement: string; settlementAmount: string; monthly: string; deposit: string; residual: string; start: [string, string, string]; end: [string, string, string]; unrecovered: string; expiry: string[] };
const emptySaleExtra = (type: string): SaleExtra => ({ type, company: "", settlement: "takeover", settlementAmount: "", monthly: "", deposit: "", residual: "", start: ["", "", ""], end: ["", "", ""], unrecovered: "", expiry: [] });

function useToast() {
  const [toast, setToast] = useState("");
  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  }, []);
  return { toast, notify };
}

function Toast({ text }: { text: string }) {
  if (!text) return null;
  return <div className="bbm-register-toast" role="status">{text}</div>;
}

// dev 원본 MobilePageHeader 컴포넌트의 범위 속성(data-v-f78f6b94). 원본 CSS가 이 속성으로 제목 18px·격자 배치를 건다
const headerScope = { "data-v-f78f6b94": "" };

function MobileHeader({ title, onBack, right, className }: { title: string; onBack: () => void; right?: ReactNode; className?: string }) {
  return (
    <div {...headerScope} className={cx("mobile-page-header", className)}>
      <button {...headerScope} type="button" className="mobile-page-header__button" aria-label="뒤로" onClick={onBack}><img {...headerScope} className="mobile-page-header__icon" src={registerIcons.back} alt="" /></button>
      <span {...headerScope} className="mobile-page-header__title">{title}</span>
      {right ?? <span {...headerScope} className="mobile-page-header__spacer" aria-hidden="true" />}
    </div>
  );
}

// ── 1단계: 유형 · 차량번호 · 임시번호 · 약관 동의 → 다음
function LookupStep({ onNext, notify }: { onNext: () => void; notify: (message: string) => void }) {
  const [plate, setPlate] = useState("");
  const [imported, setImported] = useState(false);
  const [agree, setAgree] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const ready = plate.trim() !== "" && agree;
  const submit = () => {
    if (!ready) return;
    if (plate.replace(/\s/g, "") !== mockLookup.plate) { notify(`목업 조회는 ${mockLookup.plate}만 지원합니다.`); return; }
    onNext();
  };
  return (
    <section className="app-content-panel car-register-page">
      <MobileHeader title="매물 등록" className="car-register-mobile-header" onBack={() => window.history.back()} />
      <main className="mobile-page-main car-register-main" aria-label="매물 등록">
        <section className="ui-content-card car-register-lookup-card">
          <div className="car-register-lookup-card__body ui-content-card__body">
            <div className="car-register-lookup-content">
              <div className="car-lookup-fields">
                <div className="ui-choice-group ui-choice-group--sm ui-choice-group--mobile-sm car-register-category-choice" id="s1Cat">
                  {[["자동차", "자동차"], ["오토바이", "오토바이"], ["화물·트럭", "화물 · 트럭"], ["기타", "기타"]].map(([value, label], index) => (
                    <label key={value} className={cx("s1-ct", index === 0 ? "is-selected" : "is-disabled", "ui-choice")}>
                      <input id={index === 0 ? "cat-car" : `category-${index}`} type="radio" name="category" value={value} defaultChecked={index === 0} disabled={index > 0} />
                      <span className="ui-choice__button"><span className="ui-choice__label">{label}</span></span>
                    </label>
                  ))}
                </div>
                <div className="car-form-group">
                  <FloatInput label="차량번호" required className="car-register-number-input" id="f_vnum" name="vnum" maxLength={20} value={plate} onChange={setPlate} message="등록할 차량번호를 띄어쓰기 없이 입력해주세요" />
                  <div className="s1-import-row">
                    <Checkbox className="s1-import" id="import" name="import" checked={imported} onChange={setImported} label="임시번호/직수입 차량등록" />
                    <button type="button" className="s1-import-link" onClick={() => notify("임시저장 목록은 정식 서비스에서 이용해 주세요.")}>임시저장 (0)</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <footer className="car-register-lookup-card__footer ui-content-card__footer">
            <div className="s1-policy">
              <p className="s1-policy-text"><button type="button" className="s1-policy-text-strong" onClick={() => setPolicyOpen(true)}>허위매물 운영정책</button>{" "}에 위반될 경우,<br />별도의 환불 없이 광고가 삭제되며 이용이 제한될 수 있습니다.</p>
              <Checkbox className="s1-policy-check" id="policy_agree" name="policy_agree" checked={agree} onChange={setAgree} label="위 내용을 확인하였으며 이에 동의합니다. (필수)" />
            </div>
            <div className="car-register-next-action">
              <button type="button" className="ui-btn ui-btn--primary ui-btn--xl ui-btn--mobile-xl ui-btn--align-center ui-btn--full car-register-next-button" disabled={!ready} onClick={submit}><span className="ui-btn__label">다음</span></button>
            </div>
          </footer>
        </section>
      </main>
      <Pop open={policyOpen} title="허위매물 운영정책" onClose={() => setPolicyOpen(false)} rawBody>
        <div className="s1-policy-modal pop-body" dangerouslySetInnerHTML={{ __html: registerPolicyHtml }} />
      </Pop>
    </section>
  );
}

// ── 등록 폼
function RegisterForm({ onBack, notify }: { onBack: () => void; notify: (message: string) => void }) {
  const [pop, setPop] = useState<PopName>(null);
  const close = useCallback(() => setPop(null), []);
  const [subModel, setSubModel] = useState(mockLookup.subModel);
  const [levelGroup, setLevelGroup] = useState(mockLookup.levelGroup);
  const [level, setLevel] = useState(`${mockLookup.level} ${mockLookup.levelClass}`);
  const [openGroup, setOpenGroup] = useState(mockLookup.levelGroup);
  const [openLevel, setOpenLevel] = useState(mockLookup.level);
  const [seizure, setSeizure] = useState(mockLookup.seizure);
  const [mortgage, setMortgage] = useState(mockLookup.mortgage);
  const [color, setColor] = useState("");
  const [seat, setSeat] = useState("");
  const [seatDraft, setSeatDraft] = useState({ color: "", finish: "" });
  const [mileage, setMileage] = useState("");
  const [transmission, setTransmission] = useState(mockLookup.transmission);
  const [warranty, setWarranty] = useState("available");
  const [importType, setImportType] = useState("official");
  const [saleType, setSaleType] = useState("direct");
  const initialOptions = useMemo(() => new Set(optionGroups.flatMap((group) => group.items.filter((item) => item.checked).map((item) => `${group.title}:${item.name}`))), []);
  const [options, setOptions] = useState<Set<string>>(initialOptions);
  const [optionDraft, setOptionDraft] = useState<Set<string>>(initialOptions);
  const [optionTab, setOptionTab] = useState(optionGroups[0].title);
  const [photos, setPhotos] = useState<Array<string | null>>(() => photoSlots.map(() => null));
  const [photoDraft, setPhotoDraft] = useState<Array<string | null>>(photos);
  const [photoGuideOpen, setPhotoGuideOpen] = useState(false);
  const [saleCategory, setSaleCategory] = useState("normal");
  const [lease, setLease] = useState<SaleExtra>(emptySaleExtra("operating"));
  const [rent, setRent] = useState<SaleExtra>(emptySaleExtra("succession"));
  const [price, setPrice] = useState("");
  const [address, setAddress] = useState({ base: "", detail: "" });
  const [addressDraft, setAddressDraft] = useState({ base: "", detail: "" });
  const [addressLayer, setAddressLayer] = useState(false);
  const [contact, setContact] = useState(true);
  const [descTitle, setDescTitle] = useState("");
  const [descType, setDescType] = useState("direct");
  const [descBody, setDescBody] = useState("");
  const [inspection, setInspection] = useState({ number: "", accident: "no", repair: "no" });
  const [inspectionDraft, setInspectionDraft] = useState(inspection);

  const photoGuideHtml = useMemo(() => registerPhotoGuideHtml.split("%ASSET%").join(asset("")), []);

  const errors = {
    color: color ? "" : "색상을 선택해주세요.",
    seat: seat ? "" : "시트색상을 선택해주세요.",
    mileage: mileage ? "" : "주행거리를 입력해주세요.",
    price: price ? "" : "판매가격을 입력해주세요.",
    region: address.base ? "" : "거래지역을 입력해주세요.",
  };
  const firstOption = optionGroups.flatMap((group) => group.items.filter((item) => options.has(`${group.title}:${item.name}`)).map((item) => item.name))[0];
  const optionLabel = options.size ? (options.size > 1 ? `${firstOption} 외 ${options.size - 1}개` : firstOption) : "";
  const photoCount = photos.filter(Boolean).length;

  useEffect(() => {
    if (pop !== "descload") return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pop, close]);

  useEffect(() => {
    document.documentElement.classList.toggle("is-modal-scroll-locked", pop !== null);
    return () => document.documentElement.classList.remove("is-modal-scroll-locked");
  }, [pop]);

  const submit = () => {
    const missing = Object.entries(errors).find(([, message]) => message);
    if (missing) {
      const target = document.querySelector(".bbm-register .is-validation-error");
      target?.scrollIntoView({ block: "center", behavior: "smooth" });
      notify(missing[1]);
      return;
    }
    notify("시안 목업이라 등록 요청을 보내지 않았습니다.");
  };

  const saleChoice = (value: string) => {
    setSaleCategory(value);
    if (value === "lease") setPop("lease");
    if (value === "rent") setPop("rent");
  };

  const colorChip = (item: RegisterColor, selected: boolean, onPick: () => void) => (
    <button key={item.name} type="button" className={cx("register-color-chip", selected && "sel")} onClick={onPick}>
      <span className="register-color-chip__swatch" aria-hidden="true">{item.swatch.map((tone, index) => <span key={index} className="register-color-chip__swatch-color" style={{ background: tone }} />)}</span>
      <span className="register-color-chip__label">{item.name}</span>
    </button>
  );

  const countModal = (kind: "seizure" | "mortgage") => {
    const label = kind === "seizure" ? "압류" : "저당";
    const value = kind === "seizure" ? seizure : mortgage;
    const set = kind === "seizure" ? setSeizure : setMortgage;
    return (
      <Pop open={pop === kind} title={`${label} 선택`} className="register-count-select-modal" bodyClassName="register-count-select-modal__body" onClose={close}>
        <div className="register-count-select-list" role="listbox" aria-label={`${label} 선택`}>
          {countOptions.map((option) => (
            <button key={option} type="button" role="option" aria-selected={option === value} className={cx("register-count-select-list__item", option === value && "is-selected")} onClick={() => { set(option); close(); }}>
              <span>{option}</span><span className="register-count-select-list__radio" />
            </button>
          ))}
        </div>
      </Pop>
    );
  };

  const saleExtraModal = (kind: "lease" | "rent") => {
    const isLease = kind === "lease";
    const value = isLease ? lease : rent;
    const set = isLease ? setLease : setRent;
    const word = isLease ? "리스" : "렌트";
    const patch = (next: Partial<SaleExtra>) => set({ ...value, ...next });
    const years = Array.from({ length: 7 }, (_, index) => String(2026 + index));
    const months = Array.from({ length: 12 }, (_, index) => String(index + 1));
    const days = (year: string, month: string) => year && month ? Array.from({ length: new Date(Number(year), Number(month), 0).getDate() }, (_, index) => String(index + 1)) : [];
    const monthsBetween = (from: [string, string, string], to: [string, string, string]) => from[0] && from[1] && to[0] && to[1] ? Math.max(0, (Number(to[0]) - Number(from[0])) * 12 + Number(to[1]) - Number(from[1])) : null;
    const total = monthsBetween(value.start, value.end);
    const now = new Date();
    const remain = value.end[0] && value.end[1] ? monthsBetween([String(now.getFullYear()), String(now.getMonth() + 1), ""], value.end) : null;
    const period = (which: "start" | "end") => {
      const part = value[which];
      const locked = which === "end" && !value.start[2];
      const setPart = (index: number, next: string) => {
        const copy = [...part] as [string, string, string];
        copy[index] = next;
        for (let reset = index + 1; reset < 3; reset += 1) copy[reset] = "";
        patch({ [which]: copy } as Partial<SaleExtra>);
      };
      return (
        <div className="register-sale-modal-form__period-row">
          <SelectBox size="lg" value={part[0]} placeholder="년" options={years} disabled={locked} onChange={(next) => setPart(0, next)} />
          <SelectBox size="lg" value={part[1]} placeholder="월" options={months} disabled={locked || !part[0]} onChange={(next) => setPart(1, next)} />
          <SelectBox size="lg" value={part[2]} placeholder="일" options={days(part[0], part[1])} disabled={locked || !part[1]} onChange={(next) => setPart(2, next)} />
          <span className="register-sale-modal-form__period-text">{which === "start" ? "부터" : "까지"}</span>
        </div>
      );
    };
    return (
      <Pop open={pop === kind} id={`rd_p_sale_${kind}`} title={isLease ? "리스 승계" : "렌트"} onClose={close} footer={<div className="pop-ft"><button type="button" className="pop-ft__button pop-ft__button--single" onClick={close}>완료</button></div>}>
        <div className="register-sale-modal-form">
          <div className="register-sale-modal-form__row">
            <span className="register-sale-modal-form__label">유형</span>
            <div className="register-sale-modal-form__value">
              <ChoiceGroup name={`register-detail-${kind}-type`} className="register-sale-modal-form__choice-group" value={value.type} onChange={(next) => patch({ type: next })} options={isLease ? [{ value: "operating", label: "운용리스" }, { value: "finance", label: "금융리스" }] : [{ value: "succession", label: "렌트승계" }, { value: "long-term", label: "장기렌트" }]} />
            </div>
          </div>
          <div className="register-sale-modal-form__row">
            <span className="register-sale-modal-form__label">{word}사</span>
            <div className="register-sale-modal-form__value"><SelectBox size="lg" search value={value.company} placeholder={`${word}사를 선택해주세요`} options={isLease ? leaseCompanies : rentCompanies} onChange={(next) => patch({ company: next })} /></div>
          </div>
          <div className="register-sale-modal-form__row">
            <span className="register-sale-modal-form__label">인수 시 정산금</span>
            <div className="register-sale-modal-form__value">
              <ChoiceGroup name={`register-detail-${kind}-settlement-type`} className="register-sale-modal-form__choice-group" value={value.settlement} onChange={(next) => patch({ settlement: next })} options={[{ value: "takeover", label: "인수금" }, { value: "support", label: "승계지원금" }]} />
            </div>
          </div>
          <div className="register-sale-modal-form__row register-sale-modal-form__row--value-only">
            <span className="register-sale-modal-form__label" />
            <div className="register-sale-modal-form__value"><UnderlineAmount id={`register-detail-${kind}-settlement-amount`} placeholder="정산금을 입력해주세요" value={value.settlementAmount} onChange={(next) => patch({ settlementAmount: next })} /></div>
          </div>
          {([["monthly", `월 ${word}료`, `월 ${word}료를 입력해주세요`], ["deposit", "보증금", "보증금을 입력해주세요"], ["residual", "잔존가치", "잔존가치를 입력해주세요"]] as const).map(([key, label, placeholder]) => (
            <div key={key} className="register-sale-modal-form__row">
              <span className="register-sale-modal-form__label">{label}</span>
              <div className="register-sale-modal-form__value"><UnderlineAmount id={`register-detail-${kind}-${key}`} placeholder={placeholder} value={value[key]} onChange={(next) => patch({ [key]: next } as Partial<SaleExtra>)} /></div>
            </div>
          ))}
          <div className="register-sale-modal-form__row register-sale-modal-form__row--period">
            <span className="register-sale-modal-form__label">{word}기간</span>
            <div className="register-sale-modal-form__value register-sale-modal-form__period">
              {period("start")}
              {period("end")}
              <div className="register-sale-modal-form__period-row register-sale-modal-form__period-row--months">
                <span className="register-sale-modal-form__period-text">잔여</span>
                <UnderlineAmount className="register-sale-modal-form__month-input" id={`register-detail-${kind}-remain-month`} placeholder="" unit="개월" readOnly value={remain === null ? "" : String(remain)} />
                <span className="register-sale-modal-form__period-text">{isLease ? "/ 총" : "총"}</span>
                <UnderlineAmount className="register-sale-modal-form__month-input" id={`register-detail-${kind}-total-month`} placeholder="" unit="개월" readOnly value={total === null ? "" : String(total)} />
              </div>
            </div>
          </div>
          {isLease ? (
            <div className="register-sale-modal-form__row">
              <span className="register-sale-modal-form__label">미회수원금</span>
              <div className="register-sale-modal-form__value"><UnderlineAmount id="register-detail-lease-unrecovered-principal" placeholder="미회수원금을 입력해주세요" value={value.unrecovered} onChange={(next) => patch({ unrecovered: next })} /></div>
            </div>
          ) : null}
          <div className="register-sale-modal-form__row">
            <span className="register-sale-modal-form__label">만기 시</span>
            <div className="register-sale-modal-form__value">
              <ChoiceGroup multiple name={`register-detail-${kind}-expiry-type`} className="register-sale-modal-form__choice-group" value={value.expiry} onChange={(next) => patch({ expiry: value.expiry.includes(next) ? value.expiry.filter((item) => item !== next) : [...value.expiry, next] })} options={[{ value: "own", label: "소유" }, { value: "return", label: "반납" }]} />
            </div>
          </div>
          <div className="register-sale-modal-form__row register-sale-modal-form__row--stack register-sale-modal-form__row--schedule">
            <span className="register-sale-modal-form__label">상환 스케줄표(선택)</span>
            <div className="register-sale-modal-form__value register-sale-modal-form__value--stack">
              <label className="ui-file-dropzone ui-file-dropzone--lg ui-file-dropzone--mobile-sm register-sale-modal-form__image-button">
                <input className="ui-file-dropzone__input" type="file" accept="image/*" onChange={(event) => { if (event.target.files?.length) notify(`목업: ${event.target.files[0].name} 선택됨(업로드하지 않음)`); }} />
                <span className="ui-file-dropzone__content">
                  <i className="ui-file-dropzone__camera" />
                  <span className="ui-file-dropzone__label" />
                  <span className="ui-file-dropzone__text"><span className="ui-file-dropzone__title">파일 선택</span><span className="ui-file-dropzone__description">또는 여기로 파일을 끌어오세요.</span></span>
                </span>
              </label>
            </div>
          </div>
        </div>
      </Pop>
    );
  };

  return (
    <section className="app-content-panel car-register-form-page">
      <section className="ui-app screen active" id="register-detail-page">
        <div className="register-detail-workspace">
          <MobileHeader title="매물 등록" className="register-detail-header" onBack={onBack} right={<button type="button" className="register-detail-header__save" onClick={() => notify("시안 목업이라 임시저장하지 않았습니다.")}>임시저장</button>} />
          <main className="ui-app__main register-detail-main">
            <div className="register-detail-content">
              <div className="register-detail-vehicle-section">
                <div className="register-detail-vehicle-header">
                  <img className="register-detail-vehicle-header-icon" src={registerIcons.vehicleHeader} alt="" aria-hidden="true" />
                  <span className="ui-text-heading-16">매물 정보</span>
                </div>
                <div className="register-detail-vehicle-body">
                  <div className="register-detail-vehicle-grid">
                    <div className="frow vnum-row register-detail-field--full"><div className="fv-area"><FloatInput label="차량번호" required readOnly value={mockLookup.plate} /></div></div>
                    <div className="frow"><div className="fv-area"><FloatInput label="제조사" required readOnly disabled chevron selected className="register-detail-modal-input" validation="maker" value={mockLookup.maker} /></div></div>
                    <div className="frow"><div className="fv-area"><FloatInput label="모델" required readOnly disabled chevron selected className="register-detail-modal-input" validation="group" value={mockLookup.model} /></div></div>
                    <div className="frow">
                      <div className="fv-area register-detail-year-selects">
                        <FloatSelect label="연식" required disabled search validation="year" value={mockLookup.year} options={yearOptions} onChange={() => undefined} />
                        <FloatSelect label="월" required disabled validation="year" className="register-detail-month-select is-year-locked" value={mockLookup.month} options={monthOptions} onChange={() => undefined} />
                      </div>
                    </div>
                    <div className="frow"><div className="fv-area"><FloatSelect label="형식연도" required disabled search validation="form-year" value={mockLookup.formYear} options={formYearOptions} onChange={() => undefined} /></div></div>
                    <div className="frow"><div className="fv-area"><FloatInput label="세부모델" required readOnly chevron selected className="register-detail-modal-input" validation="model" value={subModel} onOpen={() => setPop("model")} /></div></div>
                    <div className="frow"><div className="fv-area"><FloatInput label="연료" required readOnly disabled chevron selected className="register-detail-modal-input" validation="fuel" value={mockLookup.fuel} /></div></div>
                    <div className="frow"><div className="fv-area"><FloatInput label="등급" required readOnly chevron selected className="register-detail-modal-input" validation="level" value={level} onOpen={() => setPop("level")} /></div></div>
                    <div className="frow register-detail-cc-row"><div className="fv-area register-detail-cc-field"><FloatInput label="배기량" required disabled numeric unit="CC" id="register-detail-cc" name="cc" value={mockLookup.cc} /></div></div>
                    {([["seizure", "압류", seizure, setSeizure], ["mortgage", "저당", mortgage, setMortgage]] as const).map(([key, label, value, set]) => (
                      <div key={key} className="frow">
                        <div className="fv-area">
                          <FloatSelect label={label} required className="register-detail-count-select--desktop" value={value} options={countOptions} onChange={set} />
                          <FloatInput label={label} required readOnly chevron className="register-detail-modal-input register-detail-count-select--mobile" value={value} onOpen={() => setPop(key)} />
                        </div>
                      </div>
                    ))}
                    <div className="frow"><div className={cx("fv-area", errors.color && "has-validation-message")}><FloatInput label="색상" required readOnly chevron selected className="register-detail-modal-input" validation="exterior-color" error={errors.color} value={color} onOpen={() => setPop("color")} /><ValidationMessage text={errors.color} /></div></div>
                    <div className="frow"><div className={cx("fv-area", errors.seat && "has-validation-message")}><FloatInput label="시트색상" required readOnly chevron selected className="register-detail-modal-input" validation="seat-color" error={errors.seat} value={seat} onOpen={() => { setSeatDraft(parseSeat(seat)); setPop("seat"); }} /><ValidationMessage text={errors.seat} /></div></div>
                    <div className="frow"><div className={cx("fv-area", errors.mileage && "has-validation-message")}><FloatInput label="주행거리" required numeric unit="km" id="register-detail-sale-mileage" name="sale_mileage" error={errors.mileage} value={mileage} onChange={setMileage} /><ValidationMessage text={errors.mileage} /></div></div>
                    <div className="register-detail-choice-block register-detail-choice-block--transmission">
                      <span className="register-detail-choice-label is-required">변속기</span>
                      <ChoiceGroup name="register-detail-transmission" value={transmission} onChange={setTransmission} options={[{ value: "auto", label: "자동" }, { value: "manual", label: "수동", disabled: true }]} />
                    </div>
                    <div className="register-detail-choice-block">
                      <span className="register-detail-choice-label is-required">제조사 보증</span>
                      <ChoiceGroup name="register-detail-maker-warranty" value={warranty} onChange={setWarranty} options={[{ value: "available", label: "보증가능" }, { value: "expired", label: "보증만료" }]} />
                    </div>
                    <div className="register-detail-choice-block register-detail-field--full">
                      <span className="register-detail-choice-label is-required">수입구분</span>
                      <ChoiceGroup name="register-detail-import-type" value={importType} onChange={setImportType} options={[{ value: "official", label: "정식수입" }, { value: "parallel", label: "병행수입" }]} />
                    </div>
                    <div className="register-detail-choice-block register-detail-field--full register-detail-sale-type-row">
                      <span className="register-detail-choice-label is-required">매매유형</span>
                      <p className="register-detail-sale-type-guide">제시번호와 성능기록부가 없다면 '위탁판매'를 선택해 주세요.</p>
                      <div className="register-detail-sale-type-area">
                        <ChoiceGroup name="register-detail-sale-type" className="register-detail-sale-type-group" value={saleType} onChange={setSaleType} options={[{ value: "direct", label: "직접매도(실차주)" }, { value: "broker-own", label: "매매알선(소속 상사 매물)" }, { value: "broker-other", label: "매매알선(타 상사 매물)" }, { value: "consignment", label: "위탁판매(개인/법인)" }]} />
                      </div>
                    </div>
                    <div className="frow register-detail-field--full"><div className="fv-area"><FloatInput label="옵션" readOnly chevron selected className="register-detail-modal-input" value={optionLabel} onOpen={() => { setOptionDraft(new Set(options)); setPop("options"); }} /></div></div>
                  </div>
                </div>
              </div>
              <div className="register-detail-photo-section">
                <p className="register-media-video-tip">영상을 등록하시면<br />조회수를 높일 수 있어요🔥</p>
                <div className="register-media-header">
                  <h2 className="register-media-title">사진 및 영상</h2>
                  <button type="button" className="register-media-prohibition-button" onClick={() => setPop("prohibit")}>금지사항</button>
                </div>
                <div className="register-media-grid">
                  <button type="button" className="register-media-action" onClick={() => { setPhotoDraft(photos); setPop("photos"); }}><img src={registerIcons.mediaPhoto} alt="" aria-hidden="true" /><span>{photoCount ? `사진 ${photoCount}/20` : "사진 추가"}</span></button>
                  <button type="button" className="register-media-action" onClick={() => notify("목업: 영상 업로드는 지원하지 않습니다.")}><img src={registerIcons.mediaVideo} alt="" aria-hidden="true" /><span>영상 추가</span></button>
                  <button type="button" className="register-media-action" onClick={() => notify("목업: 외부영상 연결은 지원하지 않습니다.")}><img src={registerIcons.mediaLink} alt="" aria-hidden="true" /><span>외부영상 추가</span></button>
                </div>
              </div>
              <div className="register-detail-sale-section">
                <div className="register-detail-sale-header"><span className="ui-text-heading-16">판매 정보</span></div>
                <div className="register-detail-sale-body">
                  <div className="register-detail-sale-row register-detail-sale-category-row">
                    <span className="register-detail-sale-label is-required">판매구분</span>
                    <div className="register-detail-sale-value register-detail-sale-type">
                      <ChoiceGroup name="register-detail-sale-category" className="register-detail-sale-category-group" value={saleCategory} onChange={saleChoice} options={[{ value: "normal", label: "일반" }, { value: "lease", label: "리스승계" }, { value: "rent", label: "렌트" }]} />
                    </div>
                  </div>
                  <div className="register-detail-sale-row register-detail-sale-price-row">
                    <div className={cx("register-detail-sale-value", errors.price && "has-validation-message")}>
                      <FloatInput label="판매가격" required numeric unit="만원" id="register-detail-sale-price" name="sale_price" error={errors.price} value={price} onChange={setPrice} />
                      <ValidationMessage text={errors.price} />
                    </div>
                  </div>
                  <div className="register-detail-sale-row register-detail-sale-region-row">
                    <div className={cx("register-detail-sale-value", errors.region && "has-validation-message")}>
                      <FloatInput label="거래지역" required readOnly chevron className="register-detail-sale-address-input" id="register-detail-sale-region-label" error={errors.region} value={[address.base, address.detail].filter(Boolean).join(" ")} onOpen={() => { setAddressDraft(address); setAddressLayer(false); setPop("region"); }} />
                      <ValidationMessage text={errors.region} />
                    </div>
                  </div>
                  <div className="register-detail-sale-row register-detail-sale-contact-row">
                    <div className="register-detail-sale-contact-head">
                      <span className="register-detail-sale-label is-required">연락처</span>
                      <Checkbox size="md" className="register-detail-sale-contact-group" id="register-detail-sale-contact" name="register-detail-sale-contact" checked={contact} onChange={setContact} label={mockSellerPhone} />
                    </div>
                    <ul className="register-detail-sale-help">
                      <li>개인정보 보호를 위해 050 안심번호로 표시됩니다.</li>
                      <li>미선택 시 채팅으로만 판매상담할 수 있습니다.</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="register-detail-sale-section register-detail-description-card">
                <div className="register-detail-sale-body">
                  <div className="register-detail-description-section">
                    <div className="register-detail-description-header">
                      <span className="register-detail-description-title">상세설명</span>
                      <button type="button" className="register-detail-description-load" id="register-detail-description-list-trigger" onClick={() => setPop("descload")}>내 설명글 불러오기<img className="register-detail-description-load__chevron" src={registerIcons.chevronRight20} alt="" aria-hidden="true" /></button>
                    </div>
                    <FloatInput formVariant label="제목" id="register-detail-description-title" maxLength={40} value={descTitle} onChange={setDescTitle} />
                    <div className="register-detail-description-type">
                      <span className="register-detail-description-type__label">유형선택</span>
                      <ChoiceGroup name="register-detail-description-type" className="register-detail-description-type__choices" value={descType} onChange={(next) => { setDescType(next); if (next === "template" && !descBody) setDescBody(descriptionTemplate); }} options={[{ value: "direct", label: "직접입력" }, { value: "template", label: "기본양식" }]} />
                    </div>
                    <span className={cx("ui-floating-label-textarea ui-floating-label-textarea--md", descBody && "ui-floating-label-textarea--floating", "register-detail-description-content")}>
                      <span className="ui-floating-label-textarea__field">
                        <label className="ui-floating-label-textarea__label" htmlFor="register-detail-description-content">상세설명</label>
                        <textarea className="ui-floating-label-textarea__control" id="register-detail-description-content" name="register-detail-description-content" placeholder="" maxLength={2000} value={descBody} onChange={(event) => setDescBody(event.target.value)} />
                      </span>
                      <span className="ui-floating-label-textarea__count"><span>{descBody.length}</span>/2000</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="register-detail-inspection-section">
                <button type="button" className="register-detail-inspection-header" aria-label="성능·상태 점검기록부 등록" onClick={() => { setInspectionDraft(inspection); setPop(window.matchMedia("(min-width: 769px)").matches ? "inspectionPc" : "inspection"); }}>
                  <span className="register-detail-inspection-card-content">
                    <span className="register-detail-inspection-card-heading">
                      <span className="register-detail-inspection-title">성능 · 상태 점검기록부</span>
                      <span className="register-detail-inspection-chevron" aria-hidden="true"><img className="register-detail-inspection-header-icon" src={registerIcons.chevronRight20} alt="" /></span>
                    </span>
                    <span className="register-detail-inspection-warning">
                      <span>딜러 회원(자동차매매업자)이 성능·상태점검기록부, 제시신고번호를 미기재 시 과태료가 부과됩니다.</span>
                      <span>(제84조 제4항 제21의3호 신설) 과태료 1차 50만 원, 2차 75만 원, 3차 100만 원 부과</span>
                    </span>
                  </span>
                </button>
              </div>
              <section className="register-detail-service-section">
                <button type="button" className="register-detail-service-header" aria-label="부가서비스">
                  <span className="register-detail-service-title">부가서비스</span>
                  <span className="register-detail-service-chevron" aria-hidden="true"><img className="register-detail-service-chevron__icon" src={registerIcons.chevronRight20} alt="" /></span>
                </button>
              </section>
            </div>
          </main>
        </div>
      </section>
      <footer className="register-detail-page-footer">
        <footer className="ui-bottom-action-bar ui-bottom-action-bar--stretch register-detail-footer">
          <button type="button" className="ui-btn ui-btn--outline ui-btn--xl ui-btn--mobile-md ui-btn--align-center ui-btn--full register-detail-footer__save pop-ft__button pop-ft__button--cancel" onClick={() => notify("시안 목업이라 임시저장하지 않았습니다.")}><span className="ui-btn__label">임시저장</span></button>
          <button type="button" className="ui-btn ui-btn--primary ui-btn--xl ui-btn--mobile-md ui-btn--align-center ui-btn--full register-detail-footer__submit pop-ft__button pop-ft__button--confirm" onClick={submit}><span className="ui-btn__label">등록하기</span></button>
        </footer>
      </footer>

      <Pop open={pop === "model"} title="세부모델 선택" className="register-vehicle-full-modal register-choice-apply-modal" bodyClassName="register-detail-model-modal" onClose={close}>
        <div className="register-detail-model-list">
          {subModels.map((item) => (
            <button key={item.name} type="button" className={cx("register-detail-model-list-item", item.name === subModel && "sel")} onClick={() => { setSubModel(item.name); close(); }}>
              <span className="register-detail-model-list-item__thumb"><img className="register-detail-model-list-item__image" src={asset(item.img)} alt="" /></span>
              <span className="register-detail-model-list-item__content"><span className="register-detail-model-list-item__name">{item.name}</span></span>
            </button>
          ))}
          <p className="register-vehicle-request-text">등록하려는 제조사/모델이 없나요?{" "}<span onClick={() => notify("제조사/모델 추가 요청은 정식 서비스에서 이용해 주세요.")}>제조사/모델 추가 요청하기</span></p>
        </div>
      </Pop>

      <Pop open={pop === "level"} title="등급 선택" className="register-vehicle-full-modal register-choice-apply-modal" bodyClassName="register-level-modal" onClose={close}>
        <div className="register-level-list">
          {levelGroups.map((group, groupIndex) => {
            const groupOpen = openGroup === group.name;
            return (
              <section key={group.name} className={cx("register-level-tree-group", groupOpen && "is-open")}>
                <div className={cx("register-level-tree-group__button", group.name === levelGroup && "sel")} role="button" onClick={() => setOpenGroup(groupOpen ? "" : group.name)}>
                  <label className="ui-radio ui-radio--lg ui-radio--mobile-lg" onClick={(event) => event.preventDefault()}>
                    <input className="ui-radio__input" id={`register-level-group-${groupIndex}`} type="radio" name="register-level-group" checked={group.name === levelGroup} readOnly />
                    <span className="ui-radio__mark" />
                    <span className="ui-radio__label">{group.name}</span>
                  </label>
                </div>
                {groupOpen ? group.levels.map((item) => {
                  const levelOpen = openLevel === item.name;
                  const selectedLevel = level.startsWith(item.name) && group.name === levelGroup;
                  const pick = (value: string) => { setLevelGroup(group.name); setLevel(value); close(); };
                  return (
                    <div key={item.name} className={cx("register-level-group", levelOpen && "is-open")}>
                      <div className={cx("register-level-list-item", selectedLevel && "sel")} role="button" onClick={() => item.classes.length ? setOpenLevel(levelOpen ? "" : item.name) : pick(item.name)}>
                        <label className="ui-checkbox ui-checkbox--square ui-checkbox--lg ui-checkbox--mobile-lg" onClick={(event) => event.preventDefault()}>
                          <input className="ui-checkbox__input" type="checkbox" name="register-level" checked={selectedLevel} readOnly />
                          <span className="ui-checkbox__mark"><i className="ui-checkbox__icon" /></span>
                          <span className="ui-checkbox__label">{item.name}</span>
                        </label>
                      </div>
                      {levelOpen && item.classes.length ? (
                        <div className="register-level-class-list">
                          {item.classes.map((name) => {
                            const value = `${item.name} ${name}`;
                            return (
                              <div key={name} className={cx("register-level-class-list-item", level === value && "sel")} role="button" onClick={() => pick(value)}>
                                <label className="ui-checkbox ui-checkbox--square ui-checkbox--lg ui-checkbox--mobile-lg" onClick={(event) => event.preventDefault()}>
                                  <input className="ui-checkbox__input" type="checkbox" name="register-class" checked={level === value} readOnly />
                                  <span className="ui-checkbox__mark"><i className="ui-checkbox__icon" /></span>
                                  <span className="ui-checkbox__label">{name}</span>
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                }) : null}
              </section>
            );
          })}
          <p className="register-vehicle-request-text">등록하려는 제조사/모델이 없나요?{" "}<span onClick={() => notify("제조사/모델 추가 요청은 정식 서비스에서 이용해 주세요.")}>제조사/모델 추가 요청하기</span></p>
        </div>
      </Pop>

      {countModal("seizure")}
      {countModal("mortgage")}

      <Pop open={pop === "color"} id="rd_p_color" title="차량 외장 색상 선택" className="register-choice-apply-modal register-color-modal register-vehicle-full-modal" bodyClassName="register-color-select-modal" onClose={close}>
        <section className="register-color-select-section">
          <h2 className="register-color-select-title">대표 색상</h2>
          <div className="register-color-chip-grid">{exteriorColors.map((item) => colorChip(item, color === item.name, () => { setColor(item.name); close(); }))}</div>
        </section>
      </Pop>

      <Pop open={pop === "seat"} id="rd_p_color" title="차량 시트 색상 선택" className="register-choice-apply-modal register-color-modal" bodyClassName="register-color-select-modal" onClose={close}
        footer={(
          <div className="pop-ft">
            <button type="button" className="pop-ft__button pop-ft__button--cancel" onClick={() => setSeatDraft({ color: "", finish: "" })}>초기화</button>
            <button type="button" className="pop-ft__button pop-ft__button--confirm" disabled={!seatDraft.color} onClick={() => { setSeat(seatDraft.finish ? `${seatDraft.color} / ${seatDraft.finish}` : seatDraft.color); close(); }}>색상 적용</button>
          </div>
        )}>
        <section className="register-color-select-section">
          <h2 className="register-color-select-title">시트 색상</h2>
          <div className="register-color-chip-grid">{seatColors.map((item) => colorChip(item, seatDraft.color === item.name, () => setSeatDraft({ ...seatDraft, color: item.name })))}</div>
        </section>
        <section className="register-color-select-section">
          <h2 className="register-color-select-title">시트 마감 (선택)</h2>
          <ChoiceGroup name="seat-finish" mobile="lg" className="register-color-finish-choice-group" value={seatDraft.finish} onChange={(next) => setSeatDraft({ ...seatDraft, finish: seatDraft.finish === next ? "" : next })} options={seatFinishes.map((name) => ({ value: name, label: name }))} />
        </section>
      </Pop>

      <Pop open={pop === "options"} id="rd_p_opt" title="차량 옵션" className="register-option-modal register-vehicle-full-modal pop-opt" onClose={close} rawBody
        footer={(
          <div className="pop-ft">
            <button type="button" className="pop-ft__button pop-ft__button--cancel" onClick={close}>취소</button>
            <button type="button" className="pop-ft__button pop-ft__button--confirm" onClick={() => { setOptions(new Set(optionDraft)); close(); }}>선택완료{optionDraft.size}</button>
          </div>
        )}>
        <OptionSlot draft={optionDraft} setDraft={setOptionDraft} tab={optionTab} setTab={setOptionTab} />
      </Pop>

      <Pop open={pop === "prohibit"} title="사진 및 영상 금지사항" className="register-media-prohibition-modal" bodyClassName="register-media-prohibition-modal__body" onClose={close}>
        <ul className="register-media-prohibition-list">{mediaProhibitions.map((item) => <li key={item}>{item}</li>)}</ul>
      </Pop>

      <Pop open={pop === "photos"} id="rd_p_images" title="차량사진" bodyClassName="register-photo-modal-body" onClose={close}
        footer={(
          <div className="pop-ft">
            <button type="button" className="ui-btn ui-btn--outline ui-btn--xl ui-btn--mobile-md ui-btn--align-center ui-btn--bordered pop-ft__ui-button register-photo-modal__footer-button register-photo-modal__footer-button--cancel" onClick={close}><span className="ui-btn__label">취소</span></button>
            <button type="button" className="ui-btn ui-btn--outline ui-btn--xl ui-btn--mobile-md ui-btn--align-center ui-btn--bordered pop-ft__ui-button register-photo-modal__footer-button register-photo-modal__footer-button--reset" disabled={!photoDraft.some(Boolean)} onClick={() => setPhotoDraft(photoSlots.map(() => null))}><span className="ui-btn__label">초기화</span></button>
            <button type="button" className="ui-btn ui-btn--primary ui-btn--xl ui-btn--mobile-md ui-btn--align-center pop-ft__ui-button register-photo-modal__footer-button register-photo-modal__footer-button--confirm" onClick={() => { setPhotos(photoDraft); close(); }}><span className="ui-btn__label">등록하기</span></button>
          </div>
        )}>
        <div className="register-photo-modal">
          <button type="button" className="ui-btn ui-btn--outline ui-btn--md ui-btn--mobile-sm ui-btn--align-center ui-btn--bordered register-photo-modal__guide-button" onClick={() => setPhotoGuideOpen(true)}>
            <span className="ui-btn__label ui-btn__label--with-icon">차량 촬영 가이드<span className="ui-btn__icon-right ui-btn__icon-right--chevron" /></span>
          </button>
          <ul className="register-photo-modal__guide">
            <li>권장 비율은 4:3 입니다.</li>
            <li>사진을 터치해 편집하거나, 길게 눌러 위치를 교환할 수 있습니다.</li>
            <li>홍보성 문구가 포함된 사진은 광고와 함께 삭제될 수 있습니다.</li>
          </ul>
          <div className="register-photo-modal__list">
            {photoSlots.map((label, index) => (
              <label key={index} className={cx("register-photo-modal__item", photoDraft[index] && "has-photo")}>
                <input className="register-photo-modal__input" type="file" accept="image/*" hidden onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const next = [...photoDraft];
                  next[index] = URL.createObjectURL(file);
                  setPhotoDraft(next);
                }} />
                {photoDraft[index] ? <img className="bbm-register-photo-preview" src={photoDraft[index] ?? ""} alt={label} /> : null}
                <span className="register-photo-modal__content"><i className="register-photo-modal__camera" /><span className="register-photo-modal__label">{label}</span></span>
              </label>
            ))}
          </div>
        </div>
      </Pop>

      <Pop open={photoGuideOpen} id="rd_p_photo_guide" title="사진 촬영 가이드" onClose={() => setPhotoGuideOpen(false)} rawBody
        footer={<div className="pop-ft"><button type="button" className="ui-btn ui-btn--primary ui-btn--xl ui-btn--mobile-md ui-btn--align-center ui-btn--full pop-ft__ui-button pop-ft__ui-button--confirm" onClick={() => setPhotoGuideOpen(false)}><span className="ui-btn__label">확인 완료</span></button></div>}>
        <div className="pop-body register-photo-guide-modal-body" dangerouslySetInnerHTML={{ __html: photoGuideHtml }} />
      </Pop>

      <Pop open={pop === "region"} id="rd_p_region" title="거래 지역" className="register-vehicle-full-modal" bodyClassName="register-region-modal" onClose={close}
        footer={<div className="pop-ft"><button type="button" className="pop-ft__button pop-ft__button--single" onClick={() => { if (addressDraft.base) setAddress(addressDraft); close(); }}>입력</button></div>}>
        <div className="register-region-modal__field register-region-modal__field--address">
          <label className="register-region-modal__label" htmlFor="register-detail-region-address">주소</label>
          <input className="register-region-modal__input" id="register-detail-region-address" type="text" placeholder="주소를 입력해주세요" readOnly value={addressDraft.base} onClick={() => setAddressLayer(true)} />
          <div className="register-region-modal__address-layer" id="register-detail-region-address-layer" style={addressLayer ? { display: "block", overflowY: "auto" } : undefined}>
            {addressLayer ? (
              <ul className="bbm-register-address-mock" aria-label="주소 검색 결과(목업)">
                {mockAddresses.map((item) => <li key={item}><button type="button" onClick={() => { setAddressDraft({ ...addressDraft, base: item }); setAddressLayer(false); }}>{item}</button></li>)}
              </ul>
            ) : null}
          </div>
        </div>
        <div className="register-region-modal__field">
          <label className="register-region-modal__label" htmlFor="register-detail-region-address-detail">상세 주소</label>
          <input className="register-region-modal__input" id="register-detail-region-address-detail" type="text" placeholder="상세주소를 입력해주세요" value={addressDraft.detail} onChange={(event) => setAddressDraft({ ...addressDraft, detail: event.target.value })} />
        </div>
      </Pop>

      {pop === "descload" ? toRegisterLayer(
        <div className="ui-app-modal is-open">
          <button type="button" className="ui-app-modal__backdrop" aria-label="닫기" onClick={close} />
          <div className="ui-app-modal__panel ui-app-modal__panel--default ui-fake-scrollbar" role="dialog" aria-label="내 설명글 불러오기">
            <div className="ui-app-modal__header ui-app-modal__header--default">
              <div className="ui-app-modal__header-content">
                <div className="s1-draft-modal-title-group">
                  <h3 className="ui-app-modal__title">내 설명글 불러오기</h3>
                  <span className="s1-draft-modal-count">{descriptionDrafts.length}/9999999</span>
                </div>
              </div>
              <button type="button" className="ui-app-modal__close" aria-label="닫기" onClick={close}><img className="ui-app-modal__close-icon" src={registerIcons.modalClose} alt="" /></button>
            </div>
            <div className="ui-app-modal__main ui-app-modal__main--default">
              <div className="s1-draft-list register-description-list-modal">
                {descriptionDrafts.map((draft) => (
                  <div key={draft.title} className="s1-draft-item" role="button" onClick={() => { setDescTitle(draft.title); setDescBody(draft.body); setDescType("direct"); close(); }}>
                    <div className="s1-draft-item-left">
                      <p className="s1-draft-item-num">{draft.title}</p>
                      <p className="s1-draft-item-meta"><span className="s1-draft-item-meta-light">자동차</span><span className="s1-draft-item-meta-dot">·</span><span className="s1-draft-item-meta-strong">{draft.date}</span><span className="s1-draft-item-meta-light">수정됨</span></p>
                    </div>
                    <div className="s1-draft-item-actions">
                      <button type="button" className="ui-icon-btn" aria-label="수정" onClick={(event) => { event.stopPropagation(); notify("설명글 수정은 정식 서비스에서 이용해 주세요."); }}><img className="ui-icon-btn__icon" src={registerIcons.draftEdit} alt="" /></button>
                      <button type="button" className="ui-icon-btn" aria-label="삭제" onClick={(event) => { event.stopPropagation(); notify("설명글 삭제는 정식 서비스에서 이용해 주세요."); }}><img className="ui-icon-btn__icon" src={registerIcons.draftDelete} alt="" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>,
      ) : null}

      {pop === "inspectionPc" ? <InspectionPcModal onClose={close} notify={notify} /> : null}

      {saleExtraModal("lease")}
      {saleExtraModal("rent")}

      <Pop open={pop === "inspection"} id="rd_p_inspection" title="성능·상태 점검기록부" onClose={close}
        footer={(
          <div className="pop-ft">
            <button type="button" className="ui-btn ui-btn--outline ui-btn--lg ui-btn--mobile-sm ui-btn--align-center ui-btn--bordered pop-ft__ui-button--cancel" onClick={close}><span className="ui-btn__label">나중에 등록하기</span></button>
            <button type="button" className="ui-btn ui-btn--primary ui-btn--lg ui-btn--mobile-sm ui-btn--align-center pop-ft__ui-button--confirm" onClick={() => { setInspection(inspectionDraft); close(); }}><span className="ui-btn__label">완료</span></button>
          </div>
        )}>
        <div className="register-sale-modal-form register-inspection-modal">
          <div className="register-sale-modal-form__row">
            <span className="register-sale-modal-form__label">제시번호</span>
            <div className="register-sale-modal-form__value">
              <span className="ui-responsive-input">
                <span className="ui-underline-input ui-underline-input--lg ui-underline-input--mobile-sm ui-underline-input--align-right ui-responsive-input__mobile">
                  <input className="ui-underline-input__control" id="register-detail-inspection-number" type="text" maxLength={12} placeholder="제시번호를 입력해주세요" value={inspectionDraft.number} onChange={(event) => setInspectionDraft({ ...inspectionDraft, number: event.target.value })} />
                </span>
                <span className="ui-box-input ui-box-input--lg ui-box-input--align-left ui-responsive-input__desktop">
                  <span className="ui-box-input__field"><input className="ui-box-input__control" id="register-detail-inspection-number-pc" type="text" maxLength={12} placeholder="제시번호를 입력해주세요" value={inspectionDraft.number} onChange={(event) => setInspectionDraft({ ...inspectionDraft, number: event.target.value })} /></span>
                </span>
              </span>
            </div>
          </div>
          <p className="register-inspection-modal__help">중요정보(제시번호,성능점점기록부,조합/상사명) 미기재 또는 허위 기재시 표시 광고의 공정화에 관한 법률(20조 제1항 제1호)에 의해 1억원이하의 과태료가 부과될 수 있습니다.</p>
          {([["accident", "사고이력"], ["repair", "단순수리"]] as const).map(([key, label]) => (
            <div key={key} className="register-sale-modal-form__row">
              <span className="register-sale-modal-form__label">{label}</span>
              <div className="register-sale-modal-form__value">
                <ChoiceGroup name={`register-detail-inspection-${key}`} className="register-sale-modal-form__choice-group" value={inspectionDraft[key]} onChange={(next) => setInspectionDraft({ ...inspectionDraft, [key]: next })} options={[{ value: "yes", label: "예" }, { value: "no", label: "아니오" }]} />
              </div>
            </div>
          ))}
          <div className="register-inspection-upload">
            <div className="register-inspection-upload__title">성능점검 기록부 사진첨부</div>
            <div className="register-inspection-upload__desc">사진으로 간편하게 등록하세요. 직접입력은 PC에서 가능합니다.</div>
            <div className="register-inspection-upload__list">
              {[1, 2, 3, 4].map((page) => (
                <div key={page} className="register-inspection-upload__item">
                  <label className="register-inspection-upload__box">
                    <input className="register-inspection-upload__input" type="file" accept="image/*" hidden onChange={(event) => { if (event.target.files?.length) notify(`목업: 기록부 ${page}쪽 사진 선택됨(업로드하지 않음)`); }} />
                    <img className="register-inspection-upload__preview" src={asset(`register/default-report${page}.png`)} alt="" />
                    <span className="register-inspection-upload__overlay"><span className="register-inspection-upload__action"><i className="register-inspection-upload__camera" /><span className="register-inspection-upload__text">등록</span></span></span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Pop>
    </section>
  );
}

// PC(769px~)는 dev처럼 기록부 전 항목 직접입력 모달. 원본 마크업을 그대로 넣고 닫기·등록·선택 표시만 연결한다
function InspectionPcModal({ onClose, notify }: { onClose: () => void; notify: (message: string) => void }) {
  const html = useMemo(() => inspectionPcHtml.split("%ASSET%").join(asset("")), []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return toRegisterLayer(
    <div
      className="bbm-register-layer-host"
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest(".ui-app-modal__backdrop, .ui-app-modal__close")) { onClose(); return; }
        const button = target.closest(".register-inspection-pc-modal__footer button");
        if (button) {
          if (button.classList.contains("ui-btn--primary")) notify("시안 목업이라 기록부를 저장하지 않았습니다.");
          onClose();
        }
      }}
      onChange={(event) => {
        const input = event.target as HTMLInputElement;
        if (input.type !== "radio" && input.type !== "checkbox") return;
        const scope = input.closest(".ui-choice-group") ?? input.closest(".register-inspection-pc-modal__body");
        scope?.querySelectorAll<HTMLInputElement>(`input[name="${CSS.escape(input.name)}"]`).forEach((item) => item.closest(".ui-choice")?.classList.toggle("is-selected", item.checked));
      }}
    />,
  );
}

function parseSeat(value: string) {
  const [color = "", finish = ""] = value.split(" / ");
  return { color, finish };
}

// 옵션 팝업은 본문 구조가 달라(pop-slot-body > pop-container > side-tabs + pop-body) Pop rawBody 로 그린다
function OptionSlot({ draft, setDraft, tab, setTab }: { draft: Set<string>; setDraft: (next: Set<string>) => void; tab: string; setTab: (tab: string) => void }) {
  const toggle = (key: string) => {
    const next = new Set(draft);
    if (next.has(key)) next.delete(key); else next.add(key);
    setDraft(next);
  };
  return (
    <div className="pop-slot-body">
      <div className="pop-container">
        <aside className="side-tabs">
          {optionGroups.map((group) => <button key={group.title} type="button" className={cx("option-side-tab", tab === group.title && "active")} onClick={() => { setTab(group.title); document.getElementById(`bbm-register-opt-${group.title}`)?.scrollIntoView({ block: "start" }); }}>{group.title}</button>)}
        </aside>
        <div className="pop-body">
          {optionGroups.map((group) => (
            <section key={group.title} id={`bbm-register-opt-${group.title}`} className={cx("section-container", tab === group.title && "active")}>
              <h2 className="section-title">{group.title}</h2>
              <div className="section-list">
                {group.items.map((item) => {
                  const key = `${group.title}:${item.name}`;
                  return (
                    <label key={key} className={cx("ci opt-item", draft.has(key) && "sel")} onClick={(event) => { event.preventDefault(); toggle(key); }}>
                      <input type="checkbox" readOnly checked={draft.has(key)} />
                      <span className="check-circle" />
                      <span className="option-name">{item.name}</span>
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [step, setStep] = useState<"lookup" | "form">(() => new URLSearchParams(window.location.search).get("register") === "form" ? "form" : "lookup");
  const { toast, notify } = useToast();
  useEffect(() => {
    document.documentElement.classList.add("bbm-register-page");
    return () => document.documentElement.classList.remove("bbm-register-page");
  }, []);
  useEffect(() => {
    document.title = "매물 등록 - 보배드림";
    window.scrollTo(0, 0);
  }, [step]);
  return (
    <div className="bbm-register">
      <div className="app-shell">
        <header className="app-shell__header" dangerouslySetInnerHTML={{ __html: registerHeaderHtml }} onClick={(event) => { if ((event.target as HTMLElement).closest("a,button")) { event.preventDefault(); notify("시안에서는 상단 메뉴를 지원하지 않습니다."); } }} />
        <main className="app-shell__content">
          <div className="app-shell__content-inner">
            {step === "lookup" ? <LookupStep notify={notify} onNext={() => setStep("form")} /> : <RegisterForm notify={notify} onBack={() => setStep("lookup")} />}
          </div>
        </main>
        <BbmFooter onNotify={notify} />
      </div>
      <Toast text={toast} />
    </div>
  );
}
