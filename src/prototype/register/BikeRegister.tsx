import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import regionsKr from "../data/regions-kr.json";
import "./bike-register.css";

// 1차 수정(2026-10-09 노션 「시안 수정 사항」 클로드 코드 1~15): 초톳 앱 등록 화면 크기(1080÷2.8125) + 노란색 → #222 계열.
const publicBase = typeof document === "undefined" ? import.meta.env.BASE_URL : new URL(".", document.baseURI).pathname;
const asset = (path: string) => `${publicBase}${path}`;
const chotot = (name: string) => asset(`assets/register/chotot-v01/${name}`);
const icons = {
  back: asset("assets/bbm/m-header-back.svg"),
  close: asset("assets/ui/notion-close.svg"),
  search: asset("assets/maker-model/icons/chotot-search-gray.svg"),
  chevron: chotot("chevron-right.svg"),
  check: asset("assets/maker-model/icons/chotot-check.svg"),
  info: chotot("info.svg"),
  upload: chotot("upload-media.png"),
  photoDelete: chotot("image-upload-delete.svg"),
  caret: chotot("caret-down.svg"),
  clear: chotot("clear-text.svg"),
  detail: chotot("detail-info.svg"),
};

type BikeModel = { code: string; name: string };
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
type PickerName = "maker" | "model" | "year" | "type" | "origin" | "warranty" | "documents" | "sido" | "district" | null;

const yearOptions = Array.from({ length: 47 }, (_, index) => `${2026 - index}년`);
const bikeTypeOptions = ["스쿠터", "네이키드", "스포츠", "크루저", "투어러", "멀티퍼퍼스", "클래식", "오프로드", "언더본·비즈니스", "삼륜", "ATV", "기타"];
const originOptions = ["국산", "일본", "유럽", "미국", "중국", "대만", "기타"];
const warrantyOptions = ["제조사 보증", "판매자 보증", "보증 없음"];
const documentOptions = ["서류 있음", "서류 일부 있음", "서류 없음"];
// 시안 작업 마스터 확정 사항 8: 국산 KR모터스 · 디앤에이모터스를 맨 앞에
const pinnedMakers = ["KR모터스(효성)", "디앤에이모터스(대림)"];
const maxPhotos = 10;
const regionDistricts = regionsKr.districts as Record<string, string[]>;
const samplePhoto = (index: number) => asset(`assets/bike/listings/v08/bike-v08-${String((index % 50) + 1).padStart(2, "0")}.webp`);
const digits = (value: string) => value.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
const withComma = (value: string) => value ? Number(value).toLocaleString("ko-KR") : "";

function Pills({ value, options, onChange, error }: { value: string; options: string[]; onChange: (value: string) => void; error?: boolean }) {
  return <div className={`bike-reg-pills${error ? " is-error" : ""}`}>{options.map((option) => <button type="button" key={option} className={value === option ? "is-active" : ""} aria-pressed={value === option} onClick={() => onChange(option)}>{option}</button>)}</div>;
}

function SelectRow({ label, value, required, info, error, onClick }: { label: string; value?: string; required?: boolean; info?: boolean; error?: boolean; onClick?: () => void }) {
  return <button type="button" className="bike-reg-row" disabled={!onClick} onClick={onClick}>
    <span className="bike-reg-row__label">{label}{required ? <em>*</em> : null}{info ? <img src={icons.info} alt="" /> : null}</span>
    <span className={`bike-reg-row__value${value ? "" : error ? " is-error" : " is-empty"}`}>{value || "선택"}</span>
    {onClick ? <img className="bike-reg-row__chevron" src={icons.chevron} alt="" /> : <span />}
  </button>;
}

function DetailInput({ label, value, unit, required, error, pencil, onChange }: { label: string; value: string; unit: string; required?: boolean; error?: string; pencil?: boolean; onChange: (value: string) => void }) {
  return <>
    <label className={`bike-reg-input-row${error ? " is-error" : ""}`}>
      <span>{label}{required ? <em>*</em> : null}</span>
      <span><input value={withComma(value)} inputMode="numeric" placeholder="0" onChange={(event) => onChange(digits(event.currentTarget.value).slice(0, 7))} /><b>{unit}</b>
        {pencil ? <svg className="bike-reg-pencil" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="m14 8 2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg> : null}
      </span>
    </label>
    {error ? <p className="bike-reg-error is-row">{error}</p> : null}
  </>;
}

// 초톳 입력칸: 테두리 상자 안 작은 라벨 + 값, 비면 빨간 테두리 + 아래 안내
function BoxField({ label, error, className, children }: { label: string; error?: string; className?: string; children: ReactNode }) {
  return <div className={`bike-reg-field${className ? ` ${className}` : ""}${error ? " is-error" : ""}`}>
    <label className="bike-reg-field__box"><span className="bike-reg-field__label">{label}<em>*</em></span>{children}</label>
    {error ? <p className="bike-reg-error">{error}</p> : null}
  </div>;
}

function FullPicker({ title, options, selected, searchable, onBack, onClose, onSelect }: { title: string; options: string[]; selected: string; searchable?: boolean; onBack?: () => void; onClose: () => void; onSelect: (value: string) => void }) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => options.filter((option) => option.toLocaleLowerCase().replace(/\s/g, "").includes(query.trim().toLocaleLowerCase().replace(/\s/g, ""))), [options, query]);
  return <section className="bike-reg-picker" role="dialog" aria-modal="true" aria-label={title}>
    <header>
      {onBack ? <button type="button" aria-label="이전" onClick={onBack}><img src={icons.back} alt="" /></button> : <button type="button" aria-label="닫기" onClick={onClose}><img src={icons.close} alt="" /></button>}
      <h2>{title}</h2>
      {onBack ? <button type="button" aria-label="닫기" onClick={onClose}><img src={icons.close} alt="" /></button> : <span />}
    </header>
    {searchable ? <label className="bike-reg-picker__search"><img src={icons.search} alt="" /><input value={query} placeholder="검색" onChange={(event) => setQuery(event.currentTarget.value)} />{query ? <button type="button" aria-label="검색어 지우기" onClick={() => setQuery("")}><img src={icons.close} alt="" /></button> : null}</label> : null}
    <div className="bike-reg-picker__list">
      {visible.map((option) => <button type="button" key={option} className={selected === option ? "is-selected" : ""} onClick={() => onSelect(option)}><span>{option}</span><i>{selected === option ? <img src={icons.check} alt="" /> : null}</i></button>)}
      {!visible.length ? <p>검색 결과가 없습니다.</p> : null}
    </div>
  </section>;
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
  const [draftSido, setDraftSido] = useState("");
  const [seller, setSeller] = useState("");
  const [condition, setCondition] = useState("");
  const [maker, setMaker] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [type, setType] = useState("");
  const [mileage, setMileage] = useState("");
  const [cc, setCc] = useState("");
  const [origin, setOrigin] = useState("");
  const [warranty, setWarranty] = useState("");
  const [documents, setDocuments] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const photoCounter = useRef(0);

  useEffect(() => {
    document.documentElement.classList.add("bbm-bike-register-page");
    document.title = "바이크 매물 등록 - 보배드림";
    window.scrollTo(0, 0);
    fetch(asset("data/bike-catalog-1005/catalog.json"))
      .then((response) => response.json())
      .then((data) => setMakers((data.makers as BikeMaker[])
        .filter((item) => item.visible !== false)
        .sort((a, b) => {
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

  const errors = {
    photos: submitted && photos.length === 0,
    description: submitted && !description.trim() ? "매물 설명을 입력해 주세요" : "",
    title: submitted && !title.trim() ? "제목을 입력해 주세요" : "",
    price: submitted && !price ? "판매 가격을 입력해 주세요" : "",
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
    model: { title: "모델 선택", options: modelOptions, selected: model, searchable: true },
    year: { title: "연식 선택", options: yearOptions, selected: year },
    type: { title: "바이크 유형 선택", options: bikeTypeOptions, selected: type },
    origin: { title: "원산지 선택", options: originOptions, selected: origin },
    warranty: { title: "보증 선택", options: warrantyOptions, selected: warranty },
    documents: { title: "서류 상태 선택", options: documentOptions, selected: documents },
    sido: { title: "거래 지역", options: regionsKr.sido as string[], selected: sido },
    district: { title: draftSido, options: [`${draftSido} 전체`, ...(regionDistricts[draftSido] ?? [])] as string[], selected: sido === draftSido ? district || `${draftSido} 전체` : "" },
  } as const;

  const choose = (value: string) => {
    if (picker === "sido") {
      if (!(regionDistricts[value] ?? []).length) { setSido(value); setDistrict(""); setPicker(null); return; }
      setDraftSido(value); setPicker("district"); return;
    }
    if (picker === "district") { setSido(draftSido); setDistrict(value === `${draftSido} 전체` ? "" : value); }
    if (picker === "maker") { setMaker(value); setModel(""); }
    if (picker === "model") setModel(value);
    if (picker === "year") setYear(value);
    if (picker === "type") setType(value);
    if (picker === "origin") setOrigin(value);
    if (picker === "warranty") setWarranty(value);
    if (picker === "documents") setDocuments(value);
    setPicker(null);
  };

  const openModel = () => maker ? setPicker("model") : setToast("제조사를 먼저 선택해주세요.");
  const aiCopy = () => setDescription("관리 상태가 좋고 주행이 부드러운 바이크입니다. 외관과 소모품 상태를 확인했으며, 자세한 내용은 문의 시 안내드리겠습니다.");
  const addPhoto = () => {
    if (photos.length >= maxPhotos) { setToast(`사진은 ${maxPhotos}장까지 올릴 수 있어요.`); return; }
    // 시안: 실제 파일을 올리지 않고 바이크 예시 사진을 붙인다
    setPhotos((current) => [...current, samplePhoto(photoCounter.current++)]);
  };
  const submit = () => {
    setSubmitted(true);
    const required = [photos.length > 0, description.trim(), title.trim(), price, sido, seller, condition, maker, model, year, type, mileage];
    if (required.some((item) => !item)) {
      setToast("필수 항목을 입력해 주세요.");
      window.setTimeout(() => document.querySelector(".bike-reg-page .is-error")?.scrollIntoView({ block: "center", behavior: "smooth" }), 0);
      return;
    }
    setToast("시안에서는 실제 등록을 진행하지 않습니다.");
  };

  return <div className="bike-reg-page">
    <div className="bike-reg-shell">
      <header className="bike-reg-header"><button type="button" aria-label="뒤로가기" onClick={() => history.back()}><img src={icons.back} alt="" /></button><h1>바이크 매물 등록</h1><button type="button" onClick={() => setToast("시안에서는 임시저장을 지원하지 않습니다.")}>임시저장</button></header>
      <main className="bike-reg-main">
        <section className="bike-reg-card">
          <div className="bike-reg-section-title"><h2>사진/영상<em>*</em></h2><button type="button" aria-label="사진 안내" onClick={() => setToast("첫 번째 사진이 대표 이미지로 표시됩니다.")}><img src={icons.info} alt="" /></button></div>
          <div className={`bike-reg-media${errors.photos ? " is-error" : ""}`}>
            <button type="button" className="bike-reg-media__add" aria-label="사진/영상 추가" onClick={addPhoto}><img src={icons.upload} alt="" /></button>
            {photos.map((photo, index) => <div key={`${photo}-${index}`} className="bike-reg-media__thumb">
              <img className="bike-reg-media__image" src={photo} alt={`사진 ${index + 1}`} />
              <button type="button" className="bike-reg-media__delete" aria-label={`사진 ${index + 1} 삭제`} onClick={() => setPhotos((current) => current.filter((_, i) => i !== index))}><img src={icons.photoDelete} alt="" /></button>
              {index === 0 ? <span className="bike-reg-media__cover">대표 사진</span> : null}
            </div>)}
          </div>
          <p className={`bike-reg-media-hint${errors.photos ? " is-error" : ""}`}>{errors.photos ? "사진을 1장 이상 올려 주세요" : `길게 눌러 사진 순서를 바꿀 수 있어요 · ${photos.length}/${maxPhotos}`}</p>

          <BoxField label="매물 설명" className="is-textarea" error={errors.description}>
            <textarea maxLength={1500} value={description} placeholder="바이크의 상태와 특징을 자세히 알려주세요." onChange={(event) => setDescription(event.currentTarget.value)} />
          </BoxField>
          <div className="bike-reg-under"><button type="button" className="bike-reg-ai" onClick={aiCopy}>AI 설명 추천</button><small>{description.length}/1500자</small></div>
          <BoxField label="매물 제목" error={errors.title}>
            <input maxLength={40} value={title} placeholder="예: 혼다 PCX 125 무사고" onChange={(event) => setTitle(event.currentTarget.value)} />
            {title ? <button type="button" className="bike-reg-field__clear" aria-label="제목 지우기" onClick={(event) => { event.preventDefault(); setTitle(""); }}><img src={icons.clear} alt="" /></button> : null}
          </BoxField>
          <BoxField label="판매가격" error={errors.price}>
            <input inputMode="numeric" value={withComma(price)} placeholder="가격 입력" onChange={(event) => setPrice(digits(event.currentTarget.value).slice(0, 7))} />
            <b className="bike-reg-field__unit">만원</b>
          </BoxField>
          <div className={`bike-reg-field is-select${errors.address ? " is-error" : ""}`}>
            <button type="button" className="bike-reg-field__box" onClick={() => setPicker("sido")}>
              <span className="bike-reg-field__label">거래지역<em>*</em></span>
              <span className={`bike-reg-field__value${sido ? "" : " is-empty"}`}>{sido ? `${sido}${district ? ` ${district}` : ""}` : "지역 선택"}</span>
              <img className="bike-reg-field__caret" src={icons.caret} alt="" />
            </button>
            {errors.address ? <p className="bike-reg-error">{errors.address}</p> : null}
          </div>
          <div className={`bike-reg-inline${errors.seller ? " is-error" : ""}`}><span>판매자 유형<em>*</em></span><Pills value={seller} options={["개인", "딜러"]} onChange={setSeller} /></div>
        </section>

        <section className="bike-reg-card bike-reg-detail">
          <h2><img src={icons.detail} alt="" />상세 정보</h2>
          <SelectRow label="카테고리" value="바이크" required />
          <SelectRow label="서류 상태" value={documents} info onClick={() => setPicker("documents")} />
          <div className={`bike-reg-condition${errors.condition ? " is-error" : ""}`}><span>차량 상태<em>*</em></span><Pills value={condition} options={["중고", "신차"]} onChange={setCondition} /></div>
          <SelectRow label="제조사" value={maker} required error={errors.maker} onClick={() => setPicker("maker")} />
          <SelectRow label="모델" value={model} required error={errors.model} onClick={openModel} />
          <SelectRow label="연식" value={year} required error={errors.year} onClick={() => setPicker("year")} />
          <SelectRow label="바이크 유형" value={type} required error={errors.type} onClick={() => setPicker("type")} />
          <DetailInput label="주행거리" value={mileage} unit="km" required pencil error={errors.mileage} onChange={setMileage} />
          <DetailInput label="배기량" value={cc} unit="cc" onChange={setCc} />
          <SelectRow label="원산지" value={origin} onClick={() => setPicker("origin")} />
          <SelectRow label="보증" value={warranty} onClick={() => setPicker("warranty")} />
        </section>
      </main>
      <footer className="bike-reg-actions"><button type="button" onClick={() => setToast("시안에서는 미리보기를 지원하지 않습니다.")}>미리보기</button><button type="button" onClick={submit}>매물 등록</button></footer>
    </div>
    {picker ? <FullPicker {...pickerMap[picker]} onBack={picker === "district" ? () => setPicker("sido") : undefined} onClose={() => setPicker(null)} onSelect={choose} /> : null}
    {toast ? <div className="bike-reg-toast" role="status">{toast}</div> : null}
  </div>;
}
