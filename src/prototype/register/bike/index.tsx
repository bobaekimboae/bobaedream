// 바이크 매물 등록 시안(?register=bike, 2026-10-09).
// 뼈대 = 초톳 앱 「Đăng tin Xe cộ」(앱 캡처 1080÷2.8125 실측) + 코덱스 모바일웹 384 DOM 측정(사진 칸·설명칸·하단 버튼).
// 노란 강조색은 보배드림 #222 계열로 바꾼다. 아이콘은 노션 초톳 아이콘 원본(public/assets/register/chotot-v01).
// 실제 업로드·등록·임시저장 요청은 보내지 않는다. 제조사·모델 목록은 바이크 기준표(public/data/vehicle-catalog/bikes-index-v1.json)를 읽기만 한다.
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import regionsKr from "../../data/regions-kr.json";
import "./bike-register.css";

const asset = (path: string) => `${import.meta.env.BASE_URL}assets/${path}`;
const icon = (name: string) => asset(`register/chotot-v01/${name}`);
const catalogUrl = `${import.meta.env.BASE_URL}data/vehicle-catalog/bikes-index-v1.json`;

type Make = { id: string; name: string; englishName?: string; country?: string; kind?: string; sortOrder: number };
type Group = { id: string; makeId: string; name: string; sortOrder: number };
type Model = { id: string; makeId: string; groupId: string; name: string; genre?: string; displacement?: string; firstYear?: string; latestYear?: string; sortOrder: number };
type Catalog = { manufacturers: Make[]; modelGroups: Group[]; models: Model[] };

// 시안 작업 마스터 검토(10/9) 8번: 국산 KR모터스 · 디앤에이모터스를 맨 앞에, 나머지는 기준표 순서(라이트바겐 기준)
const pinnedMakers = ["KR모터스(효성)", "디앤에이모터스(대림)"];
const transmissions = ["수동", "자동(CVT)", "자동(DCT)", "세미오토"];
const licenses = ["원동기장치 면허", "2종 소형"];
const origins = ["국산", "수입"];
const warranties = ["없음", "판매자 보증", "제조사 보증 남음"];
const tuningOptions = ["없음", "있음"];
const maintenanceOptions = ["있음", "없음"];
const fallbackGenres = ["네이키드", "스쿠터", "스포츠", "크루저", "멀티퍼포즈", "투어러", "언더본·비즈니스", "클래식", "오프로드", "삼륜"];
const sampleMaxPhotos = 10;
const descriptionMax = 1500;
const thisYear = new Date().getFullYear();
const years = Array.from({ length: thisYear - 1979 }, (_, index) => String(thisYear - index));

type SheetKey = null | "address" | "maker" | "group" | "model" | "year" | "genre" | "transmission" | "license" | "origin" | "warranty" | "tuning" | "maintenance";
type Form = {
  photos: string[];
  description: string;
  title: string;
  price: string;
  sido: string;
  district: string;
  seller: "" | "개인" | "딜러";
  docPhoto: boolean;
  docShow: boolean;
  condition: "" | "중고" | "신차";
  makerId: string;
  groupId: string;
  modelId: string;
  year: string;
  genre: string;
  mileage: string;
  displacement: string;
  transmission: string;
  license: string;
  origin: string;
  warranty: string;
  tuning: string;
  maintenance: string;
};
const emptyForm: Form = { photos: [], description: "", title: "", price: "", sido: "", district: "", seller: "", docPhoto: false, docShow: false, condition: "", makerId: "", groupId: "", modelId: "", year: "", genre: "", mileage: "", displacement: "", transmission: "", license: "", origin: "", warranty: "", tuning: "", maintenance: "" };

const samplePhoto = (index: number) => asset(`bike/listings/v08/bike-v08-${String((index % 50) + 1).padStart(2, "0")}.webp`);
const digits = (value: string) => value.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
const withComma = (value: string) => value ? Number(value).toLocaleString("ko-KR") : "";

function useCatalog() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(catalogUrl).then((response) => response.json()).then((data: Catalog) => { if (alive) setCatalog(data); }).catch(() => undefined);
    return () => { alive = false; };
  }, []);
  return catalog;
}

function useIsWide() {
  const query = "(min-width: 768px)";
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setWide(list.matches);
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, []);
  return wide;
}

// 선택창: 모바일 = 아래에서 올라오는 시트, PC(768+) = 가운데 모달. 같은 내용·동작
function Sheet({ open, title, onClose, onBack, search, onSearch, children }: { open: boolean; title: string; onClose: () => void; onBack?: () => void; search?: string; onSearch?: (value: string) => void; children: ReactNode }) {
  const wide = useIsWide();
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = previous; };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className={`bkr-sheet${wide ? " is-modal" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
      <div className="bkr-sheet__dim" onClick={onClose} />
      <div className="bkr-sheet__panel">
        <div className="bkr-sheet__header">
          {onBack ? <button type="button" className="bkr-sheet__icon-button is-back" aria-label="이전" onClick={onBack}><img src={asset("bbm/m-header-back.svg")} alt="" /></button> : null}
          <h2 className="bkr-sheet__title">{title}</h2>
          <button type="button" className="bkr-sheet__icon-button is-close" aria-label="닫기" onClick={onClose}><img src={icon("close-window.svg")} alt="" /></button>
        </div>
        {onSearch ? (
          <label className="bkr-sheet__search">
            <img src={icon("search-gray.svg")} alt="" />
            <input type="search" value={search ?? ""} placeholder="검색" onChange={(event) => onSearch(event.target.value)} />
          </label>
        ) : null}
        <div className="bkr-sheet__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

function SheetOption({ label, sub, selected, onClick }: { label: string; sub?: string; selected?: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`bkr-option${selected ? " is-selected" : ""}`} onClick={onClick}>
      <span className="bkr-option__text"><span className="bkr-option__label">{label}</span>{sub ? <span className="bkr-option__sub">{sub}</span> : null}</span>
      {selected ? <img className="bkr-option__check" src={icon("check-mark.svg")} alt="선택됨" /> : null}
    </button>
  );
}

// 초톳 입력칸: 테두리 상자 안에 작은 라벨(값이 있거나 포커스) / 가운데 큰 라벨(빈 칸)
function Field({ label, required, value, error, focused, children, right, onClick, className }: { label: string; required?: boolean; value: boolean; error?: string; focused?: boolean; children?: ReactNode; right?: ReactNode; onClick?: () => void; className?: string }) {
  return (
    <div className={`bkr-field-wrap${className ? ` ${className}` : ""}`}>
      <div className={`bkr-field${value || focused ? " is-filled" : ""}${focused ? " is-focused" : ""}${error ? " is-error" : ""}${onClick ? " is-button" : ""}`} onClick={onClick}>
        <span className="bkr-field__label">{label}{required ? <span className="bkr-req">*</span> : null}</span>
        <span className="bkr-field__control">{children}</span>
        {right ? <span className="bkr-field__right">{right}</span> : null}
      </div>
      {error ? <p className="bkr-error">{error}</p> : null}
    </div>
  );
}

function Row({ label, required, value, placeholder = "선택해 주세요", error, onClick, fixed, children }: { label: string; required?: boolean; value?: string; placeholder?: string; error?: boolean; onClick?: () => void; fixed?: boolean; children?: ReactNode }) {
  const content = (
    <>
      <span className="bkr-row__label">{label}{required ? <span className="bkr-req">*</span> : null}</span>
      {children ?? <span className={`bkr-row__value${value ? "" : error ? " is-error" : " is-empty"}`}>{value || placeholder}</span>}
      {fixed || children ? null : <img className="bkr-row__chevron" src={icon("chevron-right.svg")} alt="" />}
    </>
  );
  return onClick ? <button type="button" className={`bkr-row${fixed ? " is-fixed" : ""}`} onClick={onClick}>{content}</button> : <div className={`bkr-row${fixed ? " is-fixed" : ""}`}>{content}</div>;
}

function Pills<T extends string>({ options, value, onChange }: { options: T[]; value: T | ""; onChange: (value: T) => void }) {
  return (
    <span className="bkr-pills">
      {options.map((option) => <button key={option} type="button" className={`bkr-pill${value === option ? " is-selected" : ""}`} aria-pressed={value === option} onClick={() => onChange(option)}>{option}</button>)}
    </span>
  );
}

function sampleForm(catalog: Catalog | null): Form {
  // ?register=bike&sample=1 : 화면 확인용 예시(바이크 v08 시나리오 1번과 같은 차종)
  const make = catalog?.manufacturers.find((item) => item.name === "혼다");
  const group = catalog?.modelGroups.find((item) => item.makeId === make?.id && item.name === "PCX");
  const model = catalog?.models.find((item) => item.groupId === group?.id);
  return { ...emptyForm, photos: [samplePhoto(3), samplePhoto(4), samplePhoto(5)], description: "출퇴근용으로 타던 PCX 125 판매합니다.\n정기 점검 꾸준히 받았고 사고 이력 없습니다.\n직거래 우선, 시운전 가능합니다.", title: "혼다 PCX 125 2023년식 무사고", price: "320", sido: "서울", district: "마포구", seller: "개인", condition: "중고", makerId: make?.id ?? "", groupId: group?.id ?? "", modelId: model?.id ?? "", year: "2023", genre: model?.genre ?? "스쿠터", mileage: "8200", displacement: "125", transmission: "자동(CVT)", license: "원동기장치 면허", origin: "수입", warranty: "없음", tuning: "없음", maintenance: "있음" };
}

export default function BikeRegisterPage() {
  const catalog = useCatalog();
  const wantSample = useMemo(() => new URLSearchParams(window.location.search).get("sample") === "1", []);
  const [form, setForm] = useState<Form>(emptyForm);
  const [sheet, setSheet] = useState<SheetKey>(null);
  const [search, setSearch] = useState("");
  const [addressSido, setAddressSido] = useState("");
  const [focus, setFocus] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState("");
  const photoCounter = useRef(0);
  const toastTimer = useRef(0);

  useEffect(() => {
    document.documentElement.classList.add("bkr-page");
    document.title = "바이크 매물 등록 - 보배드림";
    return () => document.documentElement.classList.remove("bkr-page");
  }, []);
  useEffect(() => { if (wantSample && catalog) setForm(sampleForm(catalog)); }, [wantSample, catalog]);

  const notify = (text: string) => {
    setToast(text);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2200);
  };
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((current) => ({ ...current, [key]: value }));
  const openSheet = (key: SheetKey) => { setSearch(""); setSheet(key); };
  const closeSheet = () => { setSheet(null); setAddressSido(""); };

  const makers = useMemo(() => {
    const list = [...(catalog?.manufacturers ?? [])];
    return list.sort((a, b) => {
      const pa = pinnedMakers.indexOf(a.name);
      const pb = pinnedMakers.indexOf(b.name);
      if (pa !== -1 || pb !== -1) return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
      return a.sortOrder - b.sortOrder;
    });
  }, [catalog]);
  const maker = makers.find((item) => item.id === form.makerId);
  const groups = useMemo(() => (catalog?.modelGroups ?? []).filter((item) => item.makeId === form.makerId).sort((a, b) => a.sortOrder - b.sortOrder), [catalog, form.makerId]);
  const group = groups.find((item) => item.id === form.groupId);
  const models = useMemo(() => (catalog?.models ?? []).filter((item) => item.groupId === form.groupId).sort((a, b) => a.sortOrder - b.sortOrder), [catalog, form.groupId]);
  const model = models.find((item) => item.id === form.modelId);
  const genres = useMemo(() => {
    const found = Array.from(new Set((catalog?.models ?? []).map((item) => item.genre).filter((item): item is string => Boolean(item))));
    return found.length ? found : fallbackGenres;
  }, [catalog]);
  const filterBy = <T,>(items: T[], text: (item: T) => string) => {
    const query = search.trim().toLowerCase().replace(/\s/g, "");
    return query ? items.filter((item) => text(item).toLowerCase().replace(/\s/g, "").includes(query)) : items;
  };

  const errors = {
    photos: submitted && form.photos.length === 0,
    description: submitted && !form.description.trim() ? "매물 설명을 입력해 주세요" : "",
    title: submitted && !form.title.trim() ? "제목을 입력해 주세요" : "",
    price: submitted && !form.price ? "판매 가격을 입력해 주세요" : "",
    address: submitted && !form.sido ? "거래 지역을 선택해 주세요" : "",
    seller: submitted && !form.seller,
    condition: submitted && !form.condition,
    maker: submitted && !form.makerId,
    group: submitted && !form.groupId,
    year: submitted && !form.year,
    genre: submitted && !form.genre,
    mileage: submitted && !form.mileage ? "주행거리를 입력해 주세요" : "",
  };

  const addPhoto = () => {
    if (form.photos.length >= sampleMaxPhotos) { notify(`사진은 ${sampleMaxPhotos}장까지 올릴 수 있어요.`); return; }
    // 시안: 파일을 올리지 않고 바이크 예시 사진을 붙인다
    const next = samplePhoto(photoCounter.current++);
    set("photos", [...form.photos, next]);
  };
  const removePhoto = (index: number) => set("photos", form.photos.filter((_, current) => current !== index));
  const submit = () => {
    setSubmitted(true);
    const required = [form.photos.length > 0, form.description.trim(), form.title.trim(), form.price, form.sido, form.seller, form.condition, form.makerId, form.groupId, form.year, form.genre, form.mileage];
    if (required.some((item) => !item)) {
      notify("필수 항목을 입력해 주세요.");
      window.setTimeout(() => document.querySelector(".bkr .is-error, .bkr .bkr-row__value.is-error, .bkr .bkr-media.is-error")?.scrollIntoView({ block: "center", behavior: "smooth" }), 0);
      return;
    }
    notify("시안에서는 등록 요청을 보내지 않습니다.");
  };

  const sheetTitle: Record<Exclude<SheetKey, null>, string> = { address: addressSido || "거래 지역", maker: "제조사", group: "모델", model: "세부 모델", year: "연식", genre: "장르", transmission: "변속기", license: "필요 면허", origin: "제조국", warranty: "보증", tuning: "튜닝", maintenance: "정비 이력" };
  const simpleSheets: Partial<Record<Exclude<SheetKey, null>, { key: keyof Form; options: string[] }>> = {
    year: { key: "year", options: years },
    genre: { key: "genre", options: genres },
    transmission: { key: "transmission", options: transmissions },
    license: { key: "license", options: licenses },
    origin: { key: "origin", options: origins },
    warranty: { key: "warranty", options: warranties },
    tuning: { key: "tuning", options: tuningOptions },
    maintenance: { key: "maintenance", options: maintenanceOptions },
  };
  const simple = sheet ? simpleSheets[sheet] : undefined;

  return (
    <div className="bkr">
      <header className="bkr-header">
        <button type="button" className="bkr-header__back" aria-label="뒤로" onClick={() => window.history.back()}><img src={asset("bbm/m-header-back.svg")} alt="" /></button>
        <h1 className="bkr-header__title">바이크 매물 등록</h1>
        <button type="button" className="bkr-header__draft" onClick={() => notify("시안에서는 임시저장을 지원하지 않습니다.")}>임시저장</button>
      </header>

      <main className="bkr-main">
        <section className="bkr-card" aria-label="매물 기본 정보">
          <div className="bkr-media-head">
            <span className="bkr-section-label">사진/영상<span className="bkr-req">*</span></span>
            <button type="button" className="bkr-icon-button" aria-label="사진 안내" onClick={() => notify("대표 사진은 차량 왼쪽 측면이 잘 보이게 찍어 주세요.")}><img src={icon("info.svg")} alt="" /></button>
          </div>
          <div className={`bkr-media${errors.photos ? " is-error" : ""}`}>
            <button type="button" className="bkr-media__add" aria-label="사진/영상 추가" onClick={addPhoto}><img src={icon("upload-media.png")} alt="" /></button>
            {form.photos.map((photo, index) => (
              <div key={`${photo}-${index}`} className="bkr-media__thumb">
                <img className="bkr-media__image" src={photo} alt={`사진 ${index + 1}`} />
                <button type="button" className="bkr-media__delete" aria-label={`사진 ${index + 1} 삭제`} onClick={() => removePhoto(index)}><img src={icon("image-upload-delete.svg")} alt="" /></button>
                {index === 0 ? <span className="bkr-media__cover">대표 사진</span> : null}
              </div>
            ))}
          </div>
          <p className={`bkr-media-hint${errors.photos ? " is-error" : ""}`}>{errors.photos ? "사진을 1장 이상 올려 주세요" : "길게 눌러 사진 순서를 바꿀 수 있어요"}</p>

          <Field className="is-textarea" label="매물 설명" required value={Boolean(form.description)} focused={focus === "description"} error={errors.description}>
            <textarea value={form.description} maxLength={descriptionMax} onFocus={() => setFocus("description")} onBlur={() => setFocus("")} onChange={(event) => set("description", event.target.value)} placeholder={focus === "description" ? "차량 상태, 정비 이력, 튜닝 여부, 거래 방법 등을 자세히 적어 주세요" : ""} />
          </Field>
          <p className="bkr-counter">{form.description.length}/{descriptionMax}자</p>

          <Field label="제목" required value={Boolean(form.title)} focused={focus === "title"} error={errors.title} right={form.title ? <button type="button" className="bkr-icon-button" aria-label="제목 지우기" onMouseDown={(event) => event.preventDefault()} onClick={() => set("title", "")}><img src={icon("clear-text.svg")} alt="" /></button> : null}>
            <input value={form.title} maxLength={50} onFocus={() => setFocus("title")} onBlur={() => setFocus("")} onChange={(event) => set("title", event.target.value)} />
          </Field>
          <Field label="판매 가격" required value={Boolean(form.price)} focused={focus === "price"} error={errors.price} right={<span className="bkr-unit">만원</span>}>
            <input inputMode="numeric" value={withComma(form.price)} onFocus={() => setFocus("price")} onBlur={() => setFocus("")} onChange={(event) => set("price", digits(event.target.value).slice(0, 7))} />
          </Field>
          <Field label="거래 지역" required value={Boolean(form.sido)} error={errors.address} onClick={() => openSheet("address")} right={<img className="bkr-caret" src={icon("caret-down.svg")} alt="" />}>
            <span className="bkr-field__value">{form.sido ? `${form.sido}${form.district ? ` ${form.district}` : ""}` : ""}</span>
          </Field>
          <div className="bkr-inline-row">
            <span className={`bkr-section-label${errors.seller ? " is-error" : ""}`}>판매자<span className="bkr-req">*</span></span>
            <Pills options={["개인", "딜러"] as const} value={form.seller} onChange={(value) => set("seller", value)} />
          </div>
        </section>

        <section className="bkr-card is-detail" aria-label="상세 정보">
          <h2 className="bkr-detail-title"><img src={icon("detail-info.svg")} alt="" />상세 정보</h2>
          <Row label="카테고리" required value="중고차 · 바이크" fixed />

          <div className="bkr-doc">
            <div className="bkr-doc__head">
              <span className="bkr-doc__title">이륜차 사용신고필증</span>
              <button type="button" className="bkr-icon-button" aria-label="서류 안내" onClick={() => notify("번호판·소유자 정보는 가려서 올려 주세요.")}><img src={icon("info.svg")} alt="" /></button>
            </div>
            <button type="button" className={`bkr-doc__add${form.docPhoto ? " is-filled" : ""}`} aria-label="서류 사진 추가" onClick={() => set("docPhoto", !form.docPhoto)}>
              {form.docPhoto ? <span className="bkr-doc__done">첨부됨</span> : <img src={icon("image.svg")} alt="" />}
            </button>
            <label className="bkr-check">
              <span>매물에 서류 사진 표시</span>
              <input type="checkbox" checked={form.docShow} onChange={(event) => set("docShow", event.target.checked)} />
              <span className="bkr-check__box" aria-hidden="true" />
            </label>
          </div>

          <div className="bkr-inline-row is-detail">
            <span className={`bkr-row__label${errors.condition ? " is-error" : ""}`}>상태<span className="bkr-req">*</span></span>
            <Pills options={["중고", "신차"] as const} value={form.condition} onChange={(value) => set("condition", value)} />
          </div>
          <Row label="제조사" required value={maker?.name} error={errors.maker} onClick={() => openSheet("maker")} />
          <Row label="모델" required value={group?.name} error={errors.group} placeholder={form.makerId ? "선택해 주세요" : "제조사를 먼저 선택해 주세요"} onClick={() => form.makerId ? openSheet("group") : openSheet("maker")} />
          {form.groupId && models.length > 1 ? <Row label="세부 모델" value={model?.name} onClick={() => openSheet("model")} /> : null}
          <Row label="연식" required value={form.year ? `${form.year}년식` : ""} error={errors.year} onClick={() => openSheet("year")} />
          <Row label="장르" required value={form.genre} error={errors.genre} onClick={() => openSheet("genre")} />
          <div className={`bkr-row is-input${errors.mileage ? " has-error" : ""}`}>
            <span className="bkr-row__label">주행거리<span className="bkr-req">*</span></span>
            <span className="bkr-row__input">
              <input inputMode="numeric" aria-label="주행거리" placeholder="0" value={withComma(form.mileage)} onChange={(event) => set("mileage", digits(event.target.value).slice(0, 7))} />
              <span className="bkr-unit">km</span>
              <svg className="bkr-pencil" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="m14 8 2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </span>
          </div>
          {errors.mileage ? <p className="bkr-error is-row">{errors.mileage}</p> : null}
          <div className="bkr-row is-input">
            <span className="bkr-row__label">배기량</span>
            <span className="bkr-row__input">
              <input inputMode="numeric" aria-label="배기량" placeholder="0" value={withComma(form.displacement)} onChange={(event) => set("displacement", digits(event.target.value).slice(0, 5))} />
              <span className="bkr-unit">cc</span>
            </span>
          </div>
          <Row label="변속기" value={form.transmission} onClick={() => openSheet("transmission")} />
          <Row label="필요 면허" value={form.license} onClick={() => openSheet("license")} />
          <Row label="제조국" value={form.origin} onClick={() => openSheet("origin")} />
          <Row label="보증" value={form.warranty} onClick={() => openSheet("warranty")} />
          <Row label="튜닝" value={form.tuning} onClick={() => openSheet("tuning")} />
          <Row label="정비 이력" value={form.maintenance} onClick={() => openSheet("maintenance")} />
        </section>
      </main>

      <footer className="bkr-actions">
        <button type="button" className="bkr-button is-outline" onClick={() => notify("시안에서는 미리보기를 지원하지 않습니다.")}>미리보기</button>
        <button type="button" className="bkr-button is-primary" onClick={submit}>등록하기</button>
      </footer>

      <Sheet open={sheet === "address"} title={sheetTitle.address} onClose={closeSheet} onBack={addressSido ? () => setAddressSido("") : undefined}>
        {!addressSido
          ? (regionsKr.sido as string[]).map((sido) => <SheetOption key={sido} label={sido} selected={form.sido === sido} onClick={() => { const list = (regionsKr.districts as Record<string, string[]>)[sido] ?? []; if (!list.length) { setForm((current) => ({ ...current, sido, district: "" })); closeSheet(); } else setAddressSido(sido); }} />)
          : [<SheetOption key="all" label={`${addressSido} 전체`} selected={form.sido === addressSido && !form.district} onClick={() => { setForm((current) => ({ ...current, sido: addressSido, district: "" })); closeSheet(); }} />,
             ...((regionsKr.districts as Record<string, string[]>)[addressSido] ?? []).map((district) => <SheetOption key={district} label={district} selected={form.sido === addressSido && form.district === district} onClick={() => { setForm((current) => ({ ...current, sido: addressSido, district })); closeSheet(); }} />)]}
      </Sheet>
      <Sheet open={sheet === "maker"} title={sheetTitle.maker} onClose={closeSheet} search={search} onSearch={setSearch}>
        {!catalog ? <p className="bkr-sheet__empty">불러오는 중…</p> : filterBy(makers, (item) => `${item.name}${item.englishName ?? ""}`).map((item) => (
          <SheetOption key={item.id} label={item.name} sub={item.englishName} selected={form.makerId === item.id} onClick={() => { setForm((current) => ({ ...current, makerId: item.id, groupId: "", modelId: "", origin: current.origin || (item.kind === "국산" ? "국산" : "수입") })); setSearch(""); setSheet("group"); }} />
        ))}
      </Sheet>
      <Sheet open={sheet === "group"} title={maker ? `${maker.name} 모델` : sheetTitle.group} onClose={closeSheet} onBack={() => openSheet("maker")} search={search} onSearch={setSearch}>
        {filterBy(groups, (item) => item.name).map((item) => (
          <SheetOption key={item.id} label={item.name} selected={form.groupId === item.id} onClick={() => {
            const list = (catalog?.models ?? []).filter((entry) => entry.groupId === item.id);
            const only = list.length === 1 ? list[0] : undefined;
            setForm((current) => ({ ...current, groupId: item.id, modelId: only?.id ?? "", genre: only?.genre ?? current.genre, displacement: only?.displacement ? String(Math.round(Number(only.displacement))) : current.displacement }));
            if (list.length > 1) { setSearch(""); setSheet("model"); } else closeSheet();
          }} />
        ))}
      </Sheet>
      <Sheet open={sheet === "model"} title={group ? `${group.name} 세부 모델` : sheetTitle.model} onClose={closeSheet} onBack={() => openSheet("group")}>
        {models.map((item) => (
          <SheetOption key={item.id} label={item.name} sub={[item.displacement ? `${Math.round(Number(item.displacement))}cc` : "", item.firstYear ? `${item.firstYear}~${item.latestYear ?? ""}` : ""].filter(Boolean).join(" · ")} selected={form.modelId === item.id} onClick={() => { setForm((current) => ({ ...current, modelId: item.id, genre: item.genre ?? current.genre, displacement: item.displacement ? String(Math.round(Number(item.displacement))) : current.displacement })); closeSheet(); }} />
        ))}
      </Sheet>
      {simple ? (
        <Sheet open title={sheetTitle[sheet as Exclude<SheetKey, null>]} onClose={closeSheet}>
          {simple.options.map((option) => <SheetOption key={option} label={sheet === "year" ? `${option}년식` : option} selected={form[simple.key] === option} onClick={() => { set(simple.key, option as never); closeSheet(); }} />)}
        </Sheet>
      ) : null}

      {toast ? <div className="bkr-toast" role="status">{toast}</div> : null}
    </div>
  );
}
