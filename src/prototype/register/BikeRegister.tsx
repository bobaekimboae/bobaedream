import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import regionsKr from "../data/regions-kr.json";
import "./bike-register.css";

// 1차 수정(2026-10-09 노션 「시안 수정 사항」 클로드 코드 1~15): 초톳 앱 등록 화면 크기(1080÷2.8125) + 노란색 → #222 계열.
const publicBase = typeof document === "undefined" ? import.meta.env.BASE_URL : new URL(".", document.baseURI).pathname;
const asset = (path: string) => `${publicBase}${path}`;
const chotot = (name: string) => asset(`assets/register/chotot-v01/${name}`);
const icons = {
  // 임시: 초톳 헤더 ← 화살표 원본이 180개 묶음에 없음(보배드림 m-header-back.svg로 대신함)
  back: asset("assets/bbm/m-header-back.svg"),
  close: chotot("close-window.svg"),
  search: chotot("search-gray.svg"),
  chevron: chotot("chevron-right.svg"),
  check: chotot("check-mark.svg"),
  pin: chotot("location-pin.svg"),
  info: chotot("info.svg"),
  upload: chotot("upload-media.png"),
  photoDelete: chotot("image-upload-delete.svg"),
  caret: chotot("caret-down.svg"),
  clear: chotot("clear-text.svg"),
  detail: chotot("detail-info.svg"),
};

type BikeModel = { code: string; name: string; genre?: string; cc_band?: string };
type BikeGroup = { code: string; name: string; models?: BikeModel[] };
type BikeMaker = {
  code: string;
  name: string;
  visible?: boolean;
  popular?: boolean;
  sort?: number;
  uses_groups?: boolean;
  groups?: BikeGroup[];
  models?: BikeModel[];
};
type PickerName = "maker" | "model" | "year" | "type" | "ccBand" | "warranty" | "sido" | "district" | "motor" | "range" | "charge" | null;
// 2차 수정(10/9 초톳 화면 녹화): 주소 = 「Địa chỉ」 바텀시트(시도·구군·상세 주소·표시 미리보기·완료), 뒤로 = 「Lưu tin nháp?」 확인 시트
type SheetName = "address" | "draft" | "gallery" | "photoRules" | "docInfo" | null;
// 3차 수정(10/9 초톳 등록 풀버전 녹화): 사진 고르기 화면 · 사진 규칙 · 서류 사진 칸 · 전기 바이크 전용 칸 · 보증 기간

// 연식: 최신 → 과거, 맨 아래 「1979년 이전」(시안 작업 마스터 D3)
const yearOptions = [...Array.from({ length: 47 }, (_, index) => `${2026 - index}년`), "1979년 이전"];
const bikeTypeOptions = ["스쿠터", "네이키드", "스포츠", "크루저", "투어러", "멀티퍼퍼스", "클래식", "오프로드", "언더본·비즈니스", "삼륜", "ATV", "기타"];
// 배기량 구간 = 바이크 기준표 cc_bands(GooBike 구간). 「전기」를 고르면 전기 바이크 전용 칸을 보여준다
const ccBandOptions = ["50cc 이하", "51~125cc", "126~250cc", "251~400cc", "401~750cc", "751cc 이상", "전기"];
const electricBand = "전기";
const motorOptions = ["2,000W 미만", "2,000~2,999W", "3,000~3,999W", "4,000~5,000W", "5,000W 초과"];
const rangeOptions = ["100km 미만", "100~199km", "200~299km", "300~399km", "400~500km", "500km 초과"];
const chargeOptions = ["1시간 미만", "1~3시간", "4~6시간", "6시간 초과"];
const galleryCount = 23;
const warrantyOptions = ["1~6개월", "7~11개월", "1년", "2년", "3년", "3년 초과"];
// 시안 작업 마스터 확정 사항 8: 국산 KR모터스 · 디앤에이모터스를 맨 앞에
const pinnedMakers = ["KR모터스(효성)", "디앤에이모터스(대림)"];
const maxPhotos = 10;
const titleMax = 50;
const priceMin = 10;
const priceMax = 99999;
const regionDistricts = regionsKr.districts as Record<string, string[]>;
const samplePhoto = (index: number) => asset(`assets/bike/listings/v08/bike-v08-${String((index % 50) + 1).padStart(2, "0")}.webp`);
const digits = (value: string) => value.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
const withComma = (value: string) => value ? Number(value).toLocaleString("ko-KR") : "";

function Pills({ value, options, onChange, error }: { value: string; options: string[]; onChange: (value: string) => void; error?: boolean }) {
  return <div className={`bike-reg-pills${error ? " is-error" : ""}`}>{options.map((option) => <button type="button" key={option} className={value === option ? "is-active" : ""} aria-pressed={value === option} onClick={() => onChange(option)}>{option}</button>)}</div>;
}

function SelectRow({ label, value, required, info, error, placeholder = "선택", onClick }: { label: string; value?: string; required?: boolean; info?: boolean; error?: boolean; placeholder?: string; onClick?: () => void }) {
  // 카테고리처럼 고정값인 줄은 눌리지 않는 div(시안 작업 마스터 B6)
  if (!onClick) return <div className="bike-reg-row is-fixed">
    <span className="bike-reg-row__label">{label}{required ? <em>*</em> : null}</span>
    <span className="bike-reg-row__value">{value}</span>
    <span />
  </div>;
  return <button type="button" className="bike-reg-row" onClick={onClick}>
    <span className="bike-reg-row__label">{label}{required ? <em>*</em> : null}{info ? <img src={icons.info} alt="" /> : null}</span>
    <span className={`bike-reg-row__value${value ? "" : error ? " is-error" : " is-empty"}`}>{value || (error ? "선택해 주세요" : placeholder)}</span>
    <img className="bike-reg-row__chevron" src={icons.chevron} alt="" />
  </button>;
}

function DetailInput({ label, value, unit, required, error, pencil, onChange }: { label: string; value: string; unit: string; required?: boolean; error?: string; pencil?: boolean; onChange: (value: string) => void }) {
  return <>
    <label className={`bike-reg-input-row${error ? " is-error" : ""}`}>
      <span>{label}{required ? <em>*</em> : null}</span>
      <span><input value={withComma(value)} inputMode="numeric" placeholder="0" onChange={(event) => onChange(digits(event.currentTarget.value).slice(0, 7))} /><b>{unit}</b>
        {/* 임시: 초톳 선 연필 아이콘 원본이 180개 묶음에 없음 */}
        {pencil ? <svg className="bike-reg-pencil" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="m14 8 2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg> : null}
      </span>
    </label>
    {error ? <p className="bike-reg-error is-row">{error}</p> : null}
  </>;
}

// 초톳 입력칸: 테두리 상자 안 작은 라벨 + 값, 비면 빨간 테두리 + 아래 안내
// 초톳 필터 입력칸(Input Field) 방식: 비어 있으면 라벨이 칸 안 가운데, 값이 있거나 누르면 위로 작게 올라간다(2026-10-09)
function BoxField({ label, error, className, filled, children }: { label: string; error?: string; className?: string; filled?: boolean; children: ReactNode }) {
  return <div className={`bike-reg-field${className ? ` ${className}` : ""}${filled ? " has-value" : ""}${error ? " is-error" : ""}`}>
    <label className="bike-reg-field__box"><span className="bike-reg-field__label">{label}<em>*</em></span>{children}</label>
    {error ? <p className="bike-reg-error">{error}</p> : null}
  </div>;
}

function FullPicker({ title, options, selected, searchable, onBack, onClose, onSelect }: { title: string; options: string[]; selected: string; searchable?: boolean; onBack?: () => void; onClose: () => void; onSelect: (value: string) => void }) {
  const [query, setQuery] = useState("");
  // 닫히면 연 줄로 포커스를 돌려준다(코덱스 검수 4)
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    return () => { opener?.focus?.({ preventScroll: true }); };
  }, []);
  const visible = useMemo(() => options.filter((option) => option.toLocaleLowerCase().replace(/\s/g, "").includes(query.trim().toLocaleLowerCase().replace(/\s/g, ""))), [options, query]);
  return <section className="bike-reg-picker" role="dialog" aria-modal="true" aria-label={title}>
    <header>
      {onBack ? <button type="button" aria-label="이전" onClick={onBack}><img src={icons.back} alt="" /></button> : <button type="button" aria-label="닫기" onClick={onClose}><img src={icons.close} alt="" /></button>}
      <h2>{title}</h2>
      {onBack ? <button type="button" aria-label="닫기" onClick={onClose}><img src={icons.close} alt="" /></button> : <span />}
    </header>
    {searchable ? <label className="bike-reg-picker__search"><img src={icons.search} alt="" /><input value={query} placeholder="검색" aria-label={`${title.replace(" 선택", "")} 검색`} onChange={(event) => setQuery(event.currentTarget.value)} />{query ? <button type="button" aria-label="검색어 지우기" onClick={() => setQuery("")}><img src={icons.close} alt="" /></button> : null}</label> : null}
    <div className="bike-reg-picker__list" role="radiogroup" aria-label={title} onKeyDown={(event) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const items = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button[role=radio]")];
      const index = items.indexOf(document.activeElement as HTMLButtonElement);
      items[Math.max(0, Math.min(items.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)))]?.focus();
      event.preventDefault();
    }}>
      {visible.map((option) => <button type="button" role="radio" aria-checked={selected === option} key={option} className={selected === option ? "is-selected" : ""} onClick={() => onSelect(option)}><span>{option}</span><i>{selected === option ? <img src={icons.check} alt="" /> : null}</i></button>)}
      {!visible.length ? <p>검색 결과가 없습니다.</p> : null}
    </div>
  </section>;
}

function BottomSheet({ title, onClose, footer, children }: { title: string; onClose: () => void; footer: ReactNode; children: ReactNode }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return <div className="bike-reg-sheet" role="dialog" aria-modal="true" aria-label={title}>
    <div className="bike-reg-sheet__dim" onClick={onClose} />
    <section className="bike-reg-sheet__panel">
      <header><button type="button" aria-label="닫기" onClick={onClose}><img src={icons.close} alt="" /></button><h2>{title}</h2><span /></header>
      <div className="bike-reg-sheet__body">{children}</div>
      <footer>{footer}</footer>
    </section>
  </div>;
}

export default function BikeRegister() {
  const [makers, setMakers] = useState<BikeMaker[]>([]);
  const [picker, setPicker] = useState<PickerName>(null);
  const [toast, setToast] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [sido, setSido] = useState("");
  const [district, setDistrict] = useState("");
  const [seller, setSeller] = useState("");
  const [condition, setCondition] = useState("");
  const [maker, setMaker] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [type, setType] = useState("");
  const [mileage, setMileage] = useState("");
  const [ccBand, setCcBand] = useState("");
  const [warranty, setWarranty] = useState("");
  const [docPhotos, setDocPhotos] = useState<string[]>([]);
  const [docShow, setDocShow] = useState(false);
  const [motor, setMotor] = useState("");
  const [battery, setBattery] = useState("");
  const [range, setRange] = useState("");
  const [charge, setCharge] = useState("");
  const [gallerySelection, setGallerySelection] = useState<string[]>([]);
  const [detailAddress, setDetailAddress] = useState("");
  const [sheet, setSheet] = useState<SheetName>(null);
  const [addrDraft, setAddrDraft] = useState({ sido: "", district: "", detail: "" });
  const [submitted, setSubmitted] = useState(false);
  const photoCounter = useRef(0);

  useEffect(() => {
    document.documentElement.classList.add("bbm-bike-register-page");
    // 마스터 PC DOM 측정 글꼴 Reddit Sans(라틴·숫자). 한글은 Pretendard로 이어진다.
    if (!document.getElementById("bike-reg-reddit-sans")) {
      const link = document.createElement("link");
      link.id = "bike-reg-reddit-sans";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Reddit+Sans:wght@400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
    document.title = "바이크 매물 등록 - 보배드림";
    window.scrollTo(0, 0);
    fetch(asset("data/bike-catalog-1005/catalog.json"))
      .then((response) => response.json())
      .then((data) => setMakers((data.makers as BikeMaker[])
        .filter((item) => item.visible !== false)
        .sort((a, b) => {
          // 「기타 제조사」는 맨 아래, KR모터스·디앤에이모터스는 맨 위, 나머지는 기준표 sort(라이트바겐 기준) 순서
          const ea = a.name === "기타 제조사" ? 1 : 0;
          const eb = b.name === "기타 제조사" ? 1 : 0;
          if (ea !== eb) return ea - eb;
          const pa = pinnedMakers.indexOf(a.name);
          const pb = pinnedMakers.indexOf(b.name);
          if (pa !== -1 || pb !== -1) return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
          return (a.sort ?? 999) - (b.sort ?? 999) || a.name.localeCompare(b.name, "ko");
        })))
      .catch(() => setMakers([]));
    return () => document.documentElement.classList.remove("bbm-bike-register-page");
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selectedMaker = makers.find((item) => item.name === maker);
  const modelOptions = useMemo(() => selectedMaker?.uses_groups === false
    ? (selectedMaker.models ?? selectedMaker.groups?.flatMap((group) => group.models ?? []) ?? []).map((item) => item.name)
    : (selectedMaker?.groups ?? []).map((item) => item.name), [selectedMaker]);
  // 모델 목록 끝에 「기타 모델」(코덱스 검수 2)
  const modelChoices = useMemo(() => modelOptions.length ? [...modelOptions, "기타 모델"] : modelOptions, [modelOptions]);
  const modelInfo = (name: string) => {
    const group = selectedMaker?.groups?.find((item) => item.name === name);
    const list = group?.models ?? selectedMaker?.models?.filter((item) => item.name === name) ?? [];
    return list[0];
  };

  const errors = {
    photos: submitted && photos.length === 0,
    description: submitted && !description.trim() ? "매물 설명을 입력해 주세요" : "",
    title: submitted && !title.trim() ? "제목을 입력해 주세요" : "",
    price: submitted && !price ? "판매 가격을 입력해 주세요" : price && (Number(price) < priceMin || Number(price) > priceMax) ? `${priceMin}만원 ~ ${priceMax.toLocaleString("ko-KR")}만원 사이로 입력해 주세요` : "",
    address: submitted && !sido ? "거래 지역을 선택해 주세요" : "",
    seller: submitted && !seller,
    condition: submitted && !condition,
    maker: submitted && !maker,
    model: submitted && !model,
    year: submitted && !year,
    type: submitted && !type,
    mileage: submitted && !mileage ? "주행거리를 입력해 주세요" : "",
  };

  const pickerMap = {
    maker: { title: "제조사 선택", options: makers.map((item) => item.name), selected: maker, searchable: true },
    model: { title: "모델 선택", options: modelChoices, selected: model, searchable: true },
    year: { title: "연식 선택", options: yearOptions, selected: year, searchable: true },
    ccBand: { title: "배기량 선택", options: ccBandOptions, selected: ccBand },
    type: { title: "바이크 유형 선택", options: bikeTypeOptions, selected: type },
    warranty: { title: "보증 선택", options: warrantyOptions, selected: warranty },
    motor: { title: "모터 출력 선택", options: motorOptions, selected: motor },
    range: { title: "1회 충전 주행거리 선택", options: rangeOptions, selected: range },
    charge: { title: "충전 시간 선택", options: chargeOptions, selected: charge },
    sido: { title: "시/도 선택", options: regionsKr.sido as string[], selected: addrDraft.sido },
    district: { title: "구/군 선택", options: (regionDistricts[addrDraft.sido] ?? []) as string[], selected: addrDraft.district },
  } as const;

  const choose = (picked: string) => {
    // 초톳 필터 라디오: 이미 고른 항목을 다시 누르면 선택을 해제한다(시·도, 구·군은 제외)
    const current = picker ? (pickerMap as Record<string, { selected: string }>)[picker]?.selected : "";
    const value = picker !== "sido" && picker !== "district" && current === picked ? "" : picked;
    if (picker === "sido") setAddrDraft((current) => ({ ...current, sido: value, district: current.sido === value ? current.district : "" }));
    if (picker === "district") setAddrDraft((current) => ({ ...current, district: value }));
    if (picker === "maker") { setMaker(value); setModel(""); }
    if (picker === "model") {
      setModel(value);
      // 모델을 고르면 기준표의 장르·배기량 구간으로 빈 칸을 채운다
      const info = modelInfo(value);
      if (info?.genre && !type) setType(info.genre);
      if (info?.cc_band && !ccBand) setCcBand(info.cc_band);
    }
    if (picker === "ccBand") setCcBand(value);
    if (picker === "year") setYear(value);
    if (picker === "type") setType(value);
    if (picker === "warranty") setWarranty(value);
    if (picker === "motor") setMotor(value);
    if (picker === "range") setRange(value);
    if (picker === "charge") setCharge(value);
    setPicker(null);
  };

  // 제조사 전에는 모델 줄에 안내를 계속 보여주고, 누르면 제조사 선택창으로 보낸다(코덱스 검수 1)
  const openModel = () => setPicker(maker ? "model" : "maker");
  // 시안: 실제 파일을 올리지 않고, 초톳 「Tất cả」 사진 고르기 화면 모양으로 바이크 예시 사진(v08)을 고른다
  const addPhoto = () => {
    if (photos.length >= maxPhotos) { setToast(`사진은 ${maxPhotos}장까지 올릴 수 있어요.`); return; }
    setGallerySelection([]); setSheet("gallery");
  };
  const toggleGallery = (photo: string) => setGallerySelection((current) => {
    if (current.includes(photo)) return current.filter((item) => item !== photo);
    if (photos.length + current.length >= maxPhotos) { setToast(`사진은 ${maxPhotos}장까지 올릴 수 있어요.`); return current; }
    return [...current, photo];
  });
  // 업로드 % 표시: 실제 업로드 없이 화면만 0→100%로 보여준다
  const [uploading, setUploading] = useState<Record<string, number>>({});
  const applyGallery = () => {
    const added = gallerySelection;
    setPhotos((current) => [...current, ...added]);
    setSheet(null);
    setUploading((current) => ({ ...current, ...Object.fromEntries(added.map((photo) => [photo, 0])) }));
    added.forEach((photo, order) => {
      [25, 60, 99, 100].forEach((value, step) => window.setTimeout(() => setUploading((current) => ({ ...current, [photo]: value })), 250 * (step + 1) + order * 200));
    });
  };
  const addDocPhoto = () => setDocPhotos((current) => current.length >= 2 ? (setToast("서류 사진은 2장까지 올릴 수 있어요."), current) : [...current, samplePhoto(40 + photoCounter.current++)]);
  const isElectric = ccBand === electricBand;
  const openAddress = () => { setAddrDraft({ sido, district, detail: detailAddress }); setSheet("address"); };
  const addrNeedsDistrict = Boolean((regionDistricts[addrDraft.sido] ?? []).length);
  const addrReady = Boolean(addrDraft.sido) && (!addrNeedsDistrict || Boolean(addrDraft.district));
  const addrPreview = [addrDraft.sido, addrDraft.district, addrDraft.detail.trim()].filter(Boolean).join(" ");
  const applyAddress = () => {
    if (!addrReady) { setToast(addrDraft.sido ? "구/군을 선택해 주세요." : "시/도를 선택해 주세요."); return; }
    setSido(addrDraft.sido); setDistrict(addrDraft.district); setDetailAddress(addrDraft.detail.trim()); setSheet(null);
  };
  const submit = () => {
    setSubmitted(true);
    const required = [photos.length > 0, description.trim(), title.trim(), price, sido, seller, condition, maker, model, year, type, mileage];
    if (required.some((item) => !item) || errors.price) {
      setToast("필수 항목을 입력해 주세요.");
      window.setTimeout(() => document.querySelector(".bike-reg-page .is-error")?.scrollIntoView({ block: "center", behavior: "smooth" }), 0);
      return;
    }
    setToast("시안에서는 실제 등록을 진행하지 않습니다.");
  };

  return <div className="bike-reg-page">
    <div className="bike-reg-shell">
      <header className="bike-reg-header"><button type="button" aria-label="뒤로가기" onClick={() => setSheet("draft")}><img src={icons.back} alt="" /></button><h1>바이크 매물 등록</h1><button type="button" onClick={() => setToast("시안에서는 임시저장을 지원하지 않습니다.")}>임시저장</button></header>
      <main className="bike-reg-main">
        <section className="bike-reg-card">
          <div className="bike-reg-section-title"><h2>사진/영상<em>*</em></h2><button type="button" aria-label="사진 안내" onClick={() => setSheet("photoRules")}><img src={icons.info} alt="" /></button></div>
          <div className={`bike-reg-media${errors.photos ? " is-error" : ""}`}>
            <button type="button" className="bike-reg-media__add" aria-label="사진/영상 추가" onClick={addPhoto}><img src={icons.upload} alt="" /></button>
            {photos.map((photo, index) => <div key={`${photo}-${index}`} className="bike-reg-media__thumb">
              <img className="bike-reg-media__image" src={photo} alt={`사진 ${index + 1}`} />
              <button type="button" className="bike-reg-media__delete" aria-label={`사진 ${index + 1} 삭제`} onClick={() => setPhotos((current) => current.filter((_, i) => i !== index))}><img src={icons.photoDelete} alt="" /></button>
              {index === 0 ? <span className="bike-reg-media__cover">대표</span> : null}
              {(uploading[photo] ?? 100) < 100 ? <span className="bike-reg-media__progress">{uploading[photo]}%</span> : null}
            </div>)}
          </div>
          <p className={`bike-reg-media-hint${errors.photos ? " is-error" : ""}`}>{errors.photos ? "사진을 1장 이상 올려 주세요" : `길게 눌러 사진 순서를 바꿀 수 있어요 · ${photos.length}/${maxPhotos}`}</p>

          <BoxField label="매물 설명" className="is-textarea" filled={Boolean(description)} error={errors.description}>
            <textarea maxLength={1500} value={description} placeholder="바이크의 상태와 특징을 자세히 알려주세요." onChange={(event) => setDescription(event.currentTarget.value)} />
          </BoxField>
          <p className="bike-reg-counter is-description">{description.length}/1500자</p>
          <BoxField label="매물 제목" filled={Boolean(title)} error={errors.title}>
            <input maxLength={titleMax} value={title} placeholder="예: 혼다 PCX 125 무사고" onChange={(event) => setTitle(event.currentTarget.value)} />
            {title ? <button type="button" className="bike-reg-field__clear" aria-label="제목 지우기" onClick={(event) => { event.preventDefault(); setTitle(""); }}><img src={icons.clear} alt="" /></button> : null}
          </BoxField>
          <p className="bike-reg-counter">{title.length}/{titleMax}자</p>
          <BoxField label="판매가격" filled={Boolean(price)} error={errors.price}>
            <input inputMode="numeric" value={withComma(price)} placeholder="가격 입력" onChange={(event) => setPrice(digits(event.currentTarget.value).slice(0, 7))} />
            <b className="bike-reg-field__unit">만원</b>
          </BoxField>
          <div className={`bike-reg-field is-select${sido ? " has-value" : ""}${errors.address ? " is-error" : ""}`}>
            <button type="button" className="bike-reg-field__box" onClick={openAddress}>
              <span className="bike-reg-field__label">거래지역<em>*</em></span>
              <span className={`bike-reg-field__value${sido ? "" : " is-empty"}`}>{sido ? [sido, district, detailAddress].filter(Boolean).join(" ") : ""}</span>
              <img className="bike-reg-field__caret" src={icons.caret} alt="" />
            </button>
            {errors.address ? <p className="bike-reg-error">{errors.address}</p> : null}
          </div>
          <div className={`bike-reg-inline${errors.seller ? " is-error" : ""}`}><span>판매자 유형<em>*</em></span><Pills value={seller} options={["개인", "딜러"]} onChange={setSeller} /></div>
        </section>

        <section className="bike-reg-card bike-reg-detail">
          <h2><img src={icons.detail} alt="" />상세 정보</h2>
          <SelectRow label="카테고리" value="바이크" required />
          <div className="bike-reg-doc">
            <div className="bike-reg-doc__head"><span>이륜차 사용신고필증</span><button type="button" aria-label="서류 안내" onClick={() => setSheet("docInfo")}><img src={icons.info} alt="" /></button></div>
            <div className="bike-reg-doc__photos">
              <button type="button" className="bike-reg-doc__add" aria-label="서류 사진 추가" onClick={addDocPhoto}><img src={chotot("image.svg")} alt="" /></button>
              {docPhotos.map((photo, index) => <div key={`${photo}-${index}`} className="bike-reg-doc__thumb"><img src={photo} alt={`서류 사진 ${index + 1}`} /><button type="button" aria-label={`서류 사진 ${index + 1} 삭제`} onClick={() => setDocPhotos((current) => current.filter((_, i) => i !== index))}><img src={icons.photoDelete} alt="" /></button></div>)}
            </div>
            <label className="bike-reg-check"><span>매물에 서류 사진 표시</span><input type="checkbox" checked={docShow} onChange={(event) => setDocShow(event.currentTarget.checked)} /><i aria-hidden="true" /></label>
          </div>
          <div className={`bike-reg-condition${errors.condition ? " is-error" : ""}`}><span>상태<em>*</em></span><Pills value={condition} options={["중고", "신차"]} onChange={setCondition} /></div>
          <SelectRow label="제조사" value={maker} required error={errors.maker} onClick={() => setPicker("maker")} />
          <SelectRow label="모델" value={model} required error={errors.model} placeholder={maker ? "선택" : "제조사 선택 후 선택 가능"} onClick={openModel} />
          <SelectRow label="연식" value={year} required error={errors.year} onClick={() => setPicker("year")} />
          <SelectRow label="바이크 유형" value={type} required error={errors.type} onClick={() => setPicker("type")} />
          <DetailInput label="주행거리" value={mileage} unit="km" required pencil error={errors.mileage} onChange={setMileage} />
          <SelectRow label="배기량" value={ccBand} onClick={() => setPicker("ccBand")} />
          {isElectric ? <>
            <SelectRow label="모터 출력" value={motor} onClick={() => setPicker("motor")} />
            <div className="bike-reg-condition"><span>배터리 포함</span><Pills value={battery} options={["없음", "있음"]} onChange={setBattery} /></div>
            <SelectRow label="1회 충전 주행거리" value={range} onClick={() => setPicker("range")} />
            <SelectRow label="충전 시간" value={charge} onClick={() => setPicker("charge")} />
          </> : null}
          <SelectRow label="보증" value={warranty} onClick={() => setPicker("warranty")} />
        </section>
      </main>
      <footer className="bike-reg-actions"><button type="button" onClick={() => setToast("시안에서는 미리보기를 지원하지 않습니다.")}>미리보기</button><button type="button" onClick={submit}>매물 등록</button></footer>
    </div>
    {sheet === "address" ? <BottomSheet title="거래 지역" onClose={() => setSheet(null)} footer={<button type="button" className="is-primary is-wide" onClick={applyAddress}>완료</button>}>
      <div className="bike-reg-address">
        <div className={`bike-reg-field is-select${addrDraft.sido ? " has-value" : ""}`}><button type="button" className="bike-reg-field__box" onClick={() => setPicker("sido")}><span className="bike-reg-field__label">시/도<em>*</em></span><span className={`bike-reg-field__value${addrDraft.sido ? "" : " is-empty"}`}>{addrDraft.sido}</span><img className="bike-reg-field__caret" src={icons.caret} alt="" /></button></div>
        <div className={`bike-reg-field is-select${addrDraft.district || (addrDraft.sido && !addrNeedsDistrict) ? " has-value" : ""}`}><button type="button" className="bike-reg-field__box" disabled={!addrNeedsDistrict} onClick={() => setPicker("district")}><span className="bike-reg-field__label">구/군{addrNeedsDistrict ? <em>*</em> : null}</span><span className={`bike-reg-field__value${addrDraft.district ? "" : " is-empty"}`}>{addrDraft.district || (addrDraft.sido && !addrNeedsDistrict ? "구/군 없음" : "")}</span><img className="bike-reg-field__caret" src={icons.caret} alt="" /></button></div>
        <div className="bike-reg-field is-plain"><label className="bike-reg-field__box"><input value={addrDraft.detail} maxLength={40} placeholder="상세 주소(선택)" onChange={(event) => { const detail = event.currentTarget.value; setAddrDraft((current) => ({ ...current, detail })); }} />{addrDraft.detail ? <button type="button" className="bike-reg-field__clear" aria-label="상세 주소 지우기" onClick={(event) => { event.preventDefault(); setAddrDraft((current) => ({ ...current, detail: "" })); }}><img src={icons.clear} alt="" /></button> : null}</label></div>
        <div className="bike-reg-address__preview"><img src={icons.pin} alt="" /><p><strong>매물에 표시될 주소</strong>{addrPreview || "시/도와 구/군을 선택해 주세요"}</p></div>
      </div>
    </BottomSheet> : null}
    {sheet === "draft" ? <BottomSheet title="임시저장할까요?" onClose={() => setSheet(null)} footer={<><button type="button" className="is-outline" onClick={() => { setSheet(null); history.back(); }}>저장 안 함</button><button type="button" className="is-primary" onClick={() => { setSheet(null); setToast("시안에서는 임시저장을 지원하지 않습니다."); }}>임시저장</button></>}>
      <p className="bike-reg-sheet__text">작성 중인 매물을 저장해 두고 나중에 이어서 등록해요.</p>
    </BottomSheet> : null}
    {sheet === "gallery" ? <section className="bike-reg-gallery" role="dialog" aria-modal="true" aria-label="사진 고르기">
      <header><button type="button" aria-label="닫기" onClick={() => setSheet(null)}><img src={icons.close} alt="" /></button><h2>전체 사진<img src={icons.caret} alt="" /></h2><span /></header>
      <div className="bike-reg-gallery__grid">
        {/* 임시: 초톳 카메라 아이콘 원본이 180개 묶음에 없음 */}
        <button type="button" className="bike-reg-gallery__camera" onClick={() => setToast("시안에서는 카메라를 열지 않습니다.")}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 5.5 9.8 3.8c.2-.2.4-.3.7-.3h3c.3 0 .5.1.7.3l1.3 1.7H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2h3.5Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="12" cy="12.5" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>카메라</button>
        {Array.from({ length: galleryCount }, (_, index) => samplePhoto(index)).map((photo) => {
          const order = gallerySelection.indexOf(photo);
          return <button type="button" key={photo} className={`bike-reg-gallery__item${order >= 0 ? " is-selected" : ""}`} aria-pressed={order >= 0} onClick={() => toggleGallery(photo)}><img src={photo} alt="" /><i>{order >= 0 ? order + 1 : null}</i></button>;
        })}
      </div>
      <footer>
        <p className="bike-reg-gallery__tip">팁: 왼쪽 옆모습이 잘 보이는 사진을 대표 사진으로 올려 주세요.</p>
        <div className="bike-reg-gallery__bar">
          <div className="bike-reg-gallery__picked">{gallerySelection.length ? gallerySelection.map((photo) => <span key={photo}><img src={photo} alt="" /><button type="button" aria-label="선택 해제" onClick={() => toggleGallery(photo)}><img src={icons.photoDelete} alt="" /></button></span>) : <small>사진을 골라 주세요 · 최대 {maxPhotos - photos.length}장</small>}</div>
          <button type="button" className="bike-reg-gallery__next" disabled={!gallerySelection.length} onClick={applyGallery}>다음{gallerySelection.length ? ` ${gallerySelection.length}` : ""}</button>
        </div>
      </footer>
    </section> : null}
    {sheet === "photoRules" ? <BottomSheet title="사진 등록 규칙" onClose={() => setSheet(null)} footer={<button type="button" className="is-primary" onClick={() => setSheet(null)}>확인</button>}>
      <div className="bike-reg-rules">
        <h3><span className="is-ok" aria-hidden="true">✓</span>권장</h3>
        <p>판매하는 바이크를 직접 찍은 사진이 보는 사람에게 믿음을 줘요.</p>
        <div className="bike-reg-rules__photos"><img src={samplePhoto(0)} alt="좋은 예 1" /><img src={samplePhoto(1)} alt="좋은 예 2" /></div>
        <h3><span className="is-no" aria-hidden="true">−</span>올릴 수 없어요</h3>
        <p>다른 매물이나 예전 매물에 쓴 사진을 그대로 쓴 사진</p>
        <h3><span className="is-no" aria-hidden="true">−</span>올릴 수 없어요</h3>
        <p>링크, 전화번호, 글자, 업체 이름, 꾸밈 테두리가 들어간 사진</p>
        <h3><span className="is-no" aria-hidden="true">−</span>올릴 수 없어요</h3>
        <p>한 장에 5MB가 넘는 사진</p>
      </div>
    </BottomSheet> : null}
    {sheet === "docInfo" ? <BottomSheet title="서류 사진 안내" onClose={() => setSheet(null)} footer={<button type="button" className="is-primary" onClick={() => setSheet(null)}>확인</button>}>
      <div className="bike-reg-rules">
        <h3>서류 사진 올리는 방법</h3>
        <p>이륜차 사용신고필증 앞면을 올려 주세요.</p>
        <ul><li>번호판과 소유자 이름·주민등록번호는 가려 주세요.</li><li>서류 사진을 매물에 보여줄지는 직접 고를 수 있어요.</li><li>서류가 없으면 비워 두어도 등록할 수 있어요.</li></ul>
      </div>
    </BottomSheet> : null}
    {picker ? <FullPicker {...pickerMap[picker]} onClose={() => setPicker(null)} onSelect={choose} /> : null}
    {toast ? <div className="bike-reg-toast" role="status">{toast}</div> : null}
  </div>;
}
