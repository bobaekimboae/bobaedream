import { useEffect, useMemo, useState } from "react";
import "./bike-register.css";

const publicBase = typeof document === "undefined" ? import.meta.env.BASE_URL : new URL(".", document.baseURI).pathname;
const asset = (path: string) => `${publicBase}${path}`;
const icons = {
  back: asset("assets/maker-model/icons/finn-back-arrow-18.svg"),
  close: asset("assets/maker-model/icons/chotot-close.svg"),
  search: asset("assets/maker-model/icons/chotot-search-gray.svg"),
  chevron: asset("assets/maker-model/icons/chotot-chevron-right.svg"),
  check: asset("assets/maker-model/icons/chotot-check.svg"),
  info: asset("assets/detail/option-info.svg"),
  camera: asset("shortform-uploader/public/icons/camera.svg"),
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
type PickerName = "maker" | "model" | "year" | "type" | "origin" | "warranty" | "documents" | null;

const yearOptions = Array.from({ length: 47 }, (_, index) => `${2026 - index}년`);
const bikeTypeOptions = ["스쿠터", "네이키드", "스포츠", "크루저", "투어러", "멀티퍼퍼스", "클래식", "오프로드", "언더본·비즈니스", "삼륜", "ATV", "기타"];
const originOptions = ["국산", "일본", "유럽", "미국", "중국", "대만", "기타"];
const warrantyOptions = ["제조사 보증", "판매자 보증", "보증 없음"];
const documentOptions = ["서류 있음", "서류 일부 있음", "서류 없음"];

function Segment({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  return <div className="bike-reg-segment">{options.map((option) => <button type="button" key={option} className={value === option ? "is-active" : ""} onClick={() => onChange(option)}>{option}</button>)}</div>;
}

function SelectRow({ label, value, required, info, onClick }: { label: string; value?: string; required?: boolean; info?: boolean; onClick?: () => void }) {
  return <button type="button" className="bike-reg-row" disabled={!onClick} onClick={onClick}>
    <span className="bike-reg-row__label">{label}{required ? <em>*</em> : null}{info ? <img src={icons.info} alt="" /> : null}</span>
    <span className={value ? "bike-reg-row__value" : "bike-reg-row__value is-empty"}>{value || "선택"}</span>
    {onClick ? <img className="bike-reg-row__chevron" src={icons.chevron} alt="" /> : null}
  </button>;
}

function InputRow({ label, value, placeholder, unit, onChange }: { label: string; value: string; placeholder: string; unit?: string; onChange: (value: string) => void }) {
  return <label className="bike-reg-input-row">
    <span>{label}<em>*</em></span>
    <span><input value={value} inputMode={unit ? "numeric" : "text"} placeholder={placeholder} onChange={(event) => onChange(event.currentTarget.value)} />{unit ? <b>{unit}</b> : null}</span>
  </label>;
}

function FullPicker({ title, options, selected, searchable, onClose, onSelect }: { title: string; options: string[]; selected: string; searchable?: boolean; onClose: () => void; onSelect: (value: string) => void }) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => options.filter((option) => option.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())), [options, query]);
  return <section className="bike-reg-picker" role="dialog" aria-modal="true" aria-label={title}>
    <header><button type="button" aria-label="닫기" onClick={onClose}><img src={icons.close} alt="" /></button><h2>{title}</h2><span /></header>
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
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [address, setAddress] = useState("");
  const [seller, setSeller] = useState("개인");
  const [condition, setCondition] = useState("중고");
  const [maker, setMaker] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [type, setType] = useState("");
  const [mileage, setMileage] = useState("");
  const [cc, setCc] = useState("");
  const [origin, setOrigin] = useState("");
  const [warranty, setWarranty] = useState("");
  const [documents, setDocuments] = useState("");

  useEffect(() => {
    document.documentElement.classList.add("bbm-bike-register-page");
    document.title = "바이크 매물 등록 - 보배드림";
    window.scrollTo(0, 0);
    fetch(asset("data/bike-catalog-1005/catalog.json"))
      .then((response) => response.json())
      .then((data) => setMakers((data.makers as BikeMaker[])
        .filter((item) => item.visible !== false)
        .sort((a, b) => a.name.localeCompare(b.name, "ko"))))
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

  const pickerMap = {
    maker: { title: "제조사 선택", options: makers.map((item) => item.name), selected: maker, searchable: true },
    model: { title: "모델 선택", options: modelOptions, selected: model, searchable: true },
    year: { title: "연식 선택", options: yearOptions, selected: year },
    type: { title: "바이크 유형 선택", options: bikeTypeOptions, selected: type },
    origin: { title: "원산지 선택", options: originOptions, selected: origin },
    warranty: { title: "보증 선택", options: warrantyOptions, selected: warranty },
    documents: { title: "서류 상태 선택", options: documentOptions, selected: documents },
  } as const;

  const choose = (value: string) => {
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

  return <div className="bike-reg-page">
    <div className="bike-reg-shell">
      <header className="bike-reg-header"><button type="button" aria-label="뒤로가기" onClick={() => history.back()}><img src={icons.back} alt="" /></button><h1>바이크 매물 등록</h1><button type="button" onClick={() => setToast("입력 내용이 임시저장되었습니다.")}>임시저장</button></header>
      <main className="bike-reg-main">
        <section className="bike-reg-section bike-reg-media">
          <div className="bike-reg-section-title"><h2>사진/영상<em>*</em></h2><img src={icons.info} alt="" /></div>
          <button type="button" className="bike-reg-upload" onClick={() => setToast("사진·영상 선택은 시안에서 제공하지 않습니다.")}><img src={icons.camera} alt="" /><strong>사진/영상 추가</strong><small>0/10</small></button>
          <p>첫 번째 사진이 대표 이미지로 표시됩니다.</p>
        </section>
        <section className="bike-reg-section bike-reg-copy">
          <label className="bike-reg-description"><span>매물 설명<em>*</em></span><textarea maxLength={1500} value={description} placeholder="바이크의 상태와 특징을 자세히 알려주세요." onChange={(event) => setDescription(event.currentTarget.value)} /><small>{description.length}/1500자</small></label>
          <button type="button" className="bike-reg-ai" onClick={aiCopy}>AI 설명 추천</button>
          <label className="bike-reg-title"><span>매물 제목<em>*</em></span><input maxLength={40} value={title} placeholder="예: 혼다 PCX 125 무사고" onChange={(event) => setTitle(event.currentTarget.value)} />{title ? <button type="button" aria-label="제목 지우기" onClick={() => setTitle("")}><img src={icons.close} alt="" /></button> : null}</label>
          <InputRow label="판매가격" value={price} placeholder="가격 입력" unit="만원" onChange={setPrice} />
          <InputRow label="거래지역" value={address} placeholder="동네 또는 지역 입력" onChange={setAddress} />
        </section>
        <div className="bike-reg-divider" />
        <section className="bike-reg-section bike-reg-seller"><h2>판매자 유형</h2><Segment value={seller} options={["개인", "판매업자"]} onChange={setSeller} /></section>
        <div className="bike-reg-divider" />
        <section className="bike-reg-detail">
          <h2>상세 정보</h2>
          <SelectRow label="카테고리" value="바이크" required />
          <SelectRow label="서류 상태" value={documents} info onClick={() => setPicker("documents")} />
          <div className="bike-reg-condition"><span>차량 상태<em>*</em></span><Segment value={condition} options={["중고", "신차"]} onChange={setCondition} /></div>
          <SelectRow label="제조사" value={maker} required onClick={() => setPicker("maker")} />
          <SelectRow label="모델" value={model} required onClick={openModel} />
          <SelectRow label="연식" value={year} required onClick={() => setPicker("year")} />
          <SelectRow label="바이크 유형" value={type} required onClick={() => setPicker("type")} />
          <InputRow label="주행거리" value={mileage} placeholder="주행거리 입력" unit="km" onChange={setMileage} />
          <InputRow label="배기량" value={cc} placeholder="배기량 입력" unit="cc" onChange={setCc} />
          <SelectRow label="원산지" value={origin} onClick={() => setPicker("origin")} />
          <SelectRow label="보증" value={warranty} onClick={() => setPicker("warranty")} />
        </section>
      </main>
      <footer className="bike-reg-actions"><button type="button" onClick={() => setToast("미리보기 화면을 준비 중입니다.")}>미리보기</button><button type="button" onClick={() => setToast("시안에서는 실제 등록을 진행하지 않습니다.")}>매물 등록</button></footer>
    </div>
    {picker ? <FullPicker {...pickerMap[picker]} onClose={() => setPicker(null)} onSelect={choose} /> : null}
    {toast ? <div className="bike-reg-toast" role="status">{toast}</div> : null}
  </div>;
}
