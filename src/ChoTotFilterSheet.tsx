import { useEffect, useMemo, useRef, useState } from "react";
import type { PriceSelection, SellerType } from "./Prototype";
import "./chotot-filter.css";

export type ChoTotFilterState = {
  price: PriceSelection;
  seats: string;
  maker: string | null;
  model: string | null;
  year: string;
  condition: string;
  mileageMax: string;
  owners: string;
  transmission: string;
  fuel: string;
  colors: string[];
  origin: string;
  body: string;
  videoOnly: boolean;
  seller: SellerType;
};

export type ChoTotFilterFocus = "price" | "seats" | "maker" | "model" | "year" | "condition" | "mileage" | "owners" | "transmission" | "fuel" | "color" | "origin" | "body" | "video" | "seller";

export const emptyChoTotFilters: ChoTotFilterState = {
  price: { mode: "cash", min: 0, max: null },
  seats: "전체",
  maker: null,
  model: null,
  year: "전체",
  condition: "전체",
  mileageMax: "",
  owners: "전체",
  transmission: "전체",
  fuel: "전체",
  colors: [],
  origin: "전체",
  body: "전체",
  videoOnly: false,
  seller: "전체",
};

type View = "root" | "color" | "origin" | "model";

const makerOptions = ["현대", "기아", "제네시스", "BMW", "벤츠", "아우디", "포르쉐", "랜드로버", "렉서스", "벤틀리", "페라리", "람보르기니", "롤스로이스"];
const modelsByMaker: Record<string, string[]> = {
  현대: ["그랜저 GN7", "아이오닉 5"],
  기아: ["카니발 4세대", "쏘렌토 MQ4"],
  제네시스: ["G80 RG3"],
  BMW: ["5시리즈 530i"],
  벤츠: ["E클래스 E 300 4MATIC"],
  아우디: ["A6 3.0 TDI 콰트로"],
  포르쉐: ["718 박스터"],
  랜드로버: ["레인지로버 스포츠"],
  렉서스: ["ES300h"],
  벤틀리: ["컨티넨탈 GT"],
  페라리: ["296 GTB"],
  람보르기니: ["우라칸 EVO"],
  롤스로이스: ["팬텀"],
};
const colorOptions = ["흰색", "검정", "회색", "은색", "빨강", "노랑", "파랑", "초록"];
const originOptions = ["국산", "독일", "일본", "영국", "이탈리아"];

function asset(path: string) {
  return `${import.meta.env.BASE_URL}assets/ui/${path}`;
}

function LabelRow({ label, summary, onClick }: { label: string; summary?: string; onClick: () => void }) {
  return (
    <button type="button" className="chotot-row" onClick={onClick}>
      <span>{label}</span>
      <b className={summary ? "has-summary" : ""}>{summary ?? "선택"}</b>
      <img src={asset("notion-chevron-right.svg")} alt="" aria-hidden="true" />
    </button>
  );
}

function Section({ title, focus, children }: { title: string; focus: ChoTotFilterFocus; children: React.ReactNode }) {
  return <section className="chotot-filter-section" data-filter-focus={focus}><h3>{title}</h3>{children}</section>;
}

function ChoiceChips({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  return <div className="chotot-choice-chips">{options.map((option) => <button key={option} type="button" className={value === option ? "is-selected" : ""} aria-pressed={value === option} onClick={() => onChange(option)}>{option}</button>)}</div>;
}

function MiniHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return <header className="chotot-nested-header"><button type="button" aria-label={`${title} 화면 닫기`} onClick={onBack}><img src={asset("notion-close.svg")} alt="" /></button><h2>{title}</h2></header>;
}

const quickFilterTitles: Record<ChoTotFilterFocus, string> = {
  price: "가격", seats: "좌석 수", maker: "제조사", model: "모델", year: "연식", condition: "차량 상태", mileage: "주행거리", owners: "소유자 수", transmission: "변속기", fuel: "연료", color: "색상", origin: "원산지", body: "차체 유형", video: "영상 매물", seller: "판매자",
};

export function ChoTotQuickFilterSheet({ focus, value, onChange, onClose, onConfirm, resultCount }: {
  focus: ChoTotFilterFocus;
  value: ChoTotFilterState;
  onChange: (value: ChoTotFilterState) => void;
  onClose: () => void;
  onConfirm: () => void;
  resultCount: number;
}) {
  const [modelSearch, setModelSearch] = useState("");
  const setValue = <K extends keyof ChoTotFilterState>(key: K, next: ChoTotFilterState[K]) => onChange({ ...value, [key]: next });
  const reset = () => {
    if (focus === "price") onChange({ ...value, price: { mode: "cash", min: 0, max: null } });
    else if (focus === "seats") setValue("seats", "전체");
    else if (focus === "maker") onChange({ ...value, maker: null, model: null });
    else if (focus === "model") setValue("model", null);
    else if (focus === "year") setValue("year", "전체");
    else if (focus === "condition") onChange({ ...value, condition: "전체", mileageMax: "" });
    else if (focus === "mileage") setValue("mileageMax", "");
    else if (focus === "owners") setValue("owners", "전체");
    else if (focus === "transmission") setValue("transmission", "전체");
    else if (focus === "fuel") setValue("fuel", "전체");
    else if (focus === "color") setValue("colors", []);
    else if (focus === "origin") setValue("origin", "전체");
    else if (focus === "body") setValue("body", "전체");
    else if (focus === "video") setValue("videoOnly", false);
    else setValue("seller", "전체");
  };
  const title = quickFilterTitles[focus];
  const modelOptions = value.maker ? modelsByMaker[value.maker] ?? [] : [];
  const searchedModels = modelOptions.filter((model) => model.toLowerCase().includes(modelSearch.toLowerCase()));
  const tall = ["maker", "model", "color", "origin"].includes(focus);

  return <div className={`chotot-filter-sheet chotot-quick-sheet${tall ? " is-tall" : ""}`} data-quick-filter={focus}>
    <header className="chotot-filter-header"><h2>{title}</h2><button type="button" aria-label={`${title} 닫기`} onClick={onClose}><img src={asset("notion-close.svg")} alt="" /></button></header>
    <div className="chotot-filter-scroll">
      <section className="chotot-filter-section chotot-quick-section">
        {focus === "price" ? <><div className="chotot-price-fields"><label><span>최소</span><input inputMode="numeric" value={value.price.min || ""} onChange={(event) => setValue("price", { ...value.price, min: Number(event.currentTarget.value.replaceAll(",", "")) || 0 })} placeholder="최소 금액" /><b>만원</b></label><span>~</span><label><span>최대</span><input inputMode="numeric" value={value.price.max ?? ""} onChange={(event) => setValue("price", { ...value.price, max: event.currentTarget.value ? Number(event.currentTarget.value.replaceAll(",", "")) : null })} placeholder="최대 금액" /><b>만원</b></label></div><div className="chotot-choice-chips compact"><button type="button" className={value.price.min === 0 && value.price.max === 1000 ? "is-selected" : ""} onClick={() => setValue("price", { ...value.price, min: 0, max: 1000 })}>1천만원 이하</button><button type="button" className={value.price.min === 1000 && value.price.max === 3000 ? "is-selected" : ""} onClick={() => setValue("price", { ...value.price, min: 1000, max: 3000 })}>1천~3천만원</button><button type="button" className={value.price.min === 3000 && value.price.max === 7000 ? "is-selected" : ""} onClick={() => setValue("price", { ...value.price, min: 3000, max: 7000 })}>3천~7천만원</button></div></> : null}
        {focus === "seats" ? <ChoiceChips options={["전체", "2인승", "4인승", "5인승", "6인승", "7인승 이상"]} value={value.seats} onChange={(next) => setValue("seats", next)} /> : null}
        {focus === "maker" ? <ChoiceChips options={makerOptions} value={value.maker ?? ""} onChange={(next) => onChange({ ...value, maker: next, model: null })} /> : null}
        {focus === "model" ? <>{value.maker ? <label className="chotot-search"><img src={asset("notion-search.svg")} alt="" /><input value={modelSearch} onChange={(event) => setModelSearch(event.currentTarget.value)} placeholder={`${value.maker} 모델 검색`} /></label> : null}<div className="chotot-radio-list">{value.maker ? searchedModels.map((model) => <button key={model} type="button" onClick={() => setValue("model", model)}><span>{model}</span><i className={value.model === model ? "is-selected" : ""} /></button>) : <p className="chotot-empty-copy">제조사를 먼저 선택하세요.</p>}</div></> : null}
        {focus === "year" ? <ChoiceChips options={["전체", "2024~2026", "2021~2023", "2018~2020", "2017 이전"]} value={value.year} onChange={(next) => setValue("year", next)} /> : null}
        {focus === "condition" ? <ChoiceChips options={["전체", "신차", "중고"]} value={value.condition} onChange={(next) => setValue("condition", next)} /> : null}
        {focus === "mileage" ? <label className="chotot-inline-field chotot-mileage-field"><span>최대 주행거리</span><input inputMode="numeric" value={value.mileageMax} onChange={(event) => setValue("mileageMax", event.currentTarget.value.replaceAll(",", ""))} placeholder="예: 50,000" /><b>km 이하</b></label> : null}
        {focus === "owners" ? <ChoiceChips options={["전체", "1인", "2인", "3인 이상"]} value={value.owners} onChange={(next) => setValue("owners", next)} /> : null}
        {focus === "transmission" ? <ChoiceChips options={["전체", "오토", "수동", "CVT"]} value={value.transmission} onChange={(next) => setValue("transmission", next)} /> : null}
        {focus === "fuel" ? <ChoiceChips options={["전체", "가솔린", "디젤", "하이브리드", "전기"]} value={value.fuel} onChange={(next) => setValue("fuel", next)} /> : null}
        {focus === "color" ? <div className="chotot-check-list">{colorOptions.map((color) => <label key={color}><span>{color}</span><input type="checkbox" checked={value.colors.includes(color)} onChange={() => setValue("colors", value.colors.includes(color) ? value.colors.filter((entry) => entry !== color) : [...value.colors, color])} /></label>)}</div> : null}
        {focus === "origin" ? <div className="chotot-radio-list">{originOptions.map((origin) => <button key={origin} type="button" onClick={() => setValue("origin", origin)}><span>{origin}</span><i className={value.origin === origin ? "is-selected" : ""} /></button>)}</div> : null}
        {focus === "body" ? <ChoiceChips options={["전체", "세단", "SUV", "해치백", "승합", "스포츠카"]} value={value.body} onChange={(next) => setValue("body", next)} /> : null}
        {focus === "video" ? <button type="button" className={`chotot-toggle-row${value.videoOnly ? " is-on" : ""}`} role="switch" aria-checked={value.videoOnly} onClick={() => setValue("videoOnly", !value.videoOnly)}><span>영상이 있는 매물만 보기</span><i /></button> : null}
        {focus === "seller" ? <ChoiceChips options={["전체", "개인", "딜러"]} value={value.seller} onChange={(next) => setValue("seller", next as SellerType)} /> : null}
      </section>
    </div>
    <footer className="chotot-filter-actions"><button type="button" onClick={reset}>초기화</button><button type="button" onClick={onConfirm}>{resultCount.toLocaleString("ko-KR")}대 결과 보기</button></footer>
  </div>;
}

export function ChoTotFilterSheet({ value, onChange, onClose, onReset, onConfirm, resultCount, focus }: {
  value: ChoTotFilterState;
  onChange: (value: ChoTotFilterState) => void;
  onClose: () => void;
  onReset: () => void;
  onConfirm: () => void;
  resultCount: number;
  focus?: ChoTotFilterFocus | null;
}) {
  const [view, setView] = useState<View>("root");
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const priceSummary = value.price.min || value.price.max !== null
    ? `${value.price.min ? `${value.price.min.toLocaleString("ko-KR")}만원` : "최소"} ~ ${value.price.max === null ? "전체" : `${value.price.max.toLocaleString("ko-KR")}만원`}`
    : undefined;
  const selectedColors = value.colors.join(", ");
  const modelOptions = value.maker ? modelsByMaker[value.maker] ?? [] : [];
  const searchedModels = useMemo(() => modelOptions.filter((model) => model.toLowerCase().includes(search.toLowerCase())), [modelOptions, search]);

  const setValue = <K extends keyof ChoTotFilterState>(key: K, next: ChoTotFilterState[K]) => onChange({ ...value, [key]: next });
  const chooseMaker = (maker: string) => onChange({ ...value, maker, model: null });

  useEffect(() => {
    if (!focus || view !== "root") return;
    rootRef.current?.querySelector<HTMLElement>(`[data-filter-focus="${focus}"]`)?.scrollIntoView({ block: "start" });
  }, [focus, view]);

  if (view === "color") {
    return <div className="chotot-filter-sheet chotot-nested-sheet">
      <MiniHeader title="색상" onBack={() => setView("root")} />
      <div className="chotot-nested-content"><label className="chotot-search"><img src={asset("notion-search.svg")} alt="" /><input value={search} onChange={(event) => setSearch(event.currentTarget.value)} placeholder="색상 검색" /></label>
        <div className="chotot-check-list">{colorOptions.filter((color) => color.includes(search)).map((color) => <label key={color}><span>{color}</span><input type="checkbox" checked={value.colors.includes(color)} onChange={() => setValue("colors", value.colors.includes(color) ? value.colors.filter((entry) => entry !== color) : [...value.colors, color])} /></label>)}</div>
      </div>
      <div className="chotot-nested-actions"><button type="button" onClick={() => setValue("colors", [])}>초기화</button><button type="button" onClick={() => { setSearch(""); setView("root"); }}>적용</button></div>
    </div>;
  }

  if (view === "origin") {
    return <div className="chotot-filter-sheet chotot-nested-sheet">
      <MiniHeader title="원산지" onBack={() => setView("root")} />
      <div className="chotot-nested-content"><label className="chotot-search"><img src={asset("notion-search.svg")} alt="" /><input value={search} onChange={(event) => setSearch(event.currentTarget.value)} placeholder="원산지 검색" /></label>
        <div className="chotot-radio-list">{originOptions.filter((origin) => origin.includes(search)).map((origin) => <button key={origin} type="button" onClick={() => { setValue("origin", origin); setSearch(""); setView("root"); }}><span>{origin}</span><i className={value.origin === origin ? "is-selected" : ""} /></button>)}</div>
      </div>
      <div className="chotot-nested-actions"><button type="button" onClick={() => { setValue("origin", "전체"); setView("root"); }}>초기화</button></div>
    </div>;
  }

  if (view === "model") {
    return <div className="chotot-filter-sheet chotot-nested-sheet">
      <MiniHeader title={value.maker ? `${value.maker} 모델` : "모델"} onBack={() => setView("root")} />
      <div className="chotot-nested-content"><label className="chotot-search"><img src={asset("notion-search.svg")} alt="" /><input value={search} onChange={(event) => setSearch(event.currentTarget.value)} placeholder="모델 검색" /></label>
        <div className="chotot-radio-list">{searchedModels.map((model) => <button key={model} type="button" onClick={() => { setValue("model", model); setSearch(""); setView("root"); }}><span>{model}</span><i className={value.model === model ? "is-selected" : ""} /></button>)}{!value.maker ? <p className="chotot-empty-copy">제조사를 먼저 선택하세요.</p> : null}</div>
      </div>
      <div className="chotot-nested-actions"><button type="button" onClick={() => { setValue("model", null); setView("root"); }}>초기화</button></div>
    </div>;
  }

  return <div className="chotot-filter-sheet" ref={rootRef}>
    <header className="chotot-filter-header"><h2>필터</h2><button type="button" aria-label="필터 닫기" onClick={onClose}><img src={asset("notion-close.svg")} alt="" /></button></header>
    <div className="chotot-filter-scroll">
      <Section title="가격" focus="price">
        <div className="chotot-price-fields"><label><span>최소</span><input inputMode="numeric" value={value.price.min || ""} onChange={(event) => setValue("price", { ...value.price, min: Number(event.currentTarget.value.replaceAll(",", "")) || 0 })} placeholder="최소 금액" /><b>만원</b></label><span>~</span><label><span>최대</span><input inputMode="numeric" value={value.price.max ?? ""} onChange={(event) => setValue("price", { ...value.price, max: event.currentTarget.value ? Number(event.currentTarget.value.replaceAll(",", "")) : null })} placeholder="최대 금액" /><b>만원</b></label></div>
        <div className="chotot-choice-chips compact"><button type="button" className={value.price.min === 0 && value.price.max === 1000 ? "is-selected" : ""} onClick={() => setValue("price", { ...value.price, min: 0, max: 1000 })}>1천만원 이하</button><button type="button" className={value.price.min === 1000 && value.price.max === 3000 ? "is-selected" : ""} onClick={() => setValue("price", { ...value.price, min: 1000, max: 3000 })}>1천~3천만원</button><button type="button" className={value.price.min === 3000 && value.price.max === 7000 ? "is-selected" : ""} onClick={() => setValue("price", { ...value.price, min: 3000, max: 7000 })}>3천~7천만원</button></div>
      </Section>
      <Section title="좌석 수" focus="seats"><ChoiceChips options={["전체", "2인승", "4인승", "5인승", "6인승", "7인승 이상"]} value={value.seats} onChange={(seats) => setValue("seats", seats)} /></Section>
      <Section title="제조사" focus="maker"><ChoiceChips options={makerOptions} value={value.maker ?? ""} onChange={chooseMaker} />{value.maker ? <LabelRow label="모델" summary={value.model ?? `${value.maker} 전체`} onClick={() => { setSearch(""); setView("model"); }} /> : null}</Section>
      <Section title="연식" focus="year"><ChoiceChips options={["전체", "2024~2026", "2021~2023", "2018~2020", "2017 이전"]} value={value.year} onChange={(year) => setValue("year", year)} /></Section>
      <Section title="차량 상태" focus="condition"><ChoiceChips options={["전체", "신차", "중고"]} value={value.condition} onChange={(condition) => setValue("condition", condition)} />{value.condition === "중고" ? <label className="chotot-inline-field"><span>주행거리</span><input inputMode="numeric" value={value.mileageMax} onChange={(event) => setValue("mileageMax", event.currentTarget.value)} placeholder="최대 주행거리" /><b>km 이하</b></label> : null}</Section>
      <Section title="소유자 수" focus="owners"><ChoiceChips options={["전체", "1인", "2인", "3인 이상"]} value={value.owners} onChange={(owners) => setValue("owners", owners)} /></Section>
      <Section title="변속기" focus="transmission"><ChoiceChips options={["전체", "오토", "수동", "CVT"]} value={value.transmission} onChange={(transmission) => setValue("transmission", transmission)} /></Section>
      <Section title="연료" focus="fuel"><ChoiceChips options={["전체", "가솔린", "디젤", "하이브리드", "전기"]} value={value.fuel} onChange={(fuel) => setValue("fuel", fuel)} /></Section>
      <Section title="색상" focus="color"><LabelRow label="외장 색상" summary={selectedColors || undefined} onClick={() => { setSearch(""); setView("color"); }} /></Section>
      <Section title="원산지" focus="origin"><LabelRow label="원산지" summary={value.origin === "전체" ? undefined : value.origin} onClick={() => { setSearch(""); setView("origin"); }} /></Section>
      <Section title="차체 유형" focus="body"><ChoiceChips options={["전체", "세단", "SUV", "해치백", "승합", "스포츠카"]} value={value.body} onChange={(body) => setValue("body", body)} /></Section>
      <Section title="영상 매물" focus="video"><button type="button" className={`chotot-toggle-row${value.videoOnly ? " is-on" : ""}`} role="switch" aria-checked={value.videoOnly} onClick={() => setValue("videoOnly", !value.videoOnly)}><span>영상이 있는 매물만 보기</span><i /></button></Section>
      <Section title="판매자" focus="seller"><ChoiceChips options={["전체", "개인", "딜러"]} value={value.seller} onChange={(seller) => setValue("seller", seller as SellerType)} /></Section>
    </div>
    <footer className="chotot-filter-actions"><button type="button" onClick={onReset}>초기화</button><button type="button" onClick={onConfirm}>{resultCount.toLocaleString("ko-KR")}대 결과 보기</button></footer>
  </div>;
}
