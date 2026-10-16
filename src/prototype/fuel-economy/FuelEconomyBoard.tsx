import { useMemo, useState } from "react";
import { asset } from "../data";
import { ENERGY_STORAGE_KEY, energyModels, energyTypeLabel, type EnergyModel, type SavedEnergyPost } from "./fuel-economy-data";
import "./fuel-economy-board.css";

const publicBase = typeof document === "undefined" ? import.meta.env.BASE_URL : new URL(".", document.location.href).pathname;
const icon = (path: string) => `${publicBase}${path}`;
const icons = {
  close: "assets/register/chotot-v01/close-x.svg",
  back: "community/%61ssets/reddit-ui/back.svg",
  write: "community/%61ssets/reddit-ui/write.svg",
  image: "assets/register/chotot-v01/image.svg",
  chevron: "assets/register/chotot-v01/chevron-right.svg",
  check: "assets/register/chotot-v01/check-mark.svg",
  location: "icons/chotot/chotot-common-location-icon.svg",
};

const exampleImages = [
  "assets/register/guide/car_interior_cluster_on.jpg",
  "assets/register/guide/car_interior_dashboard.jpg",
];

const cities = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

type PickerStep = "brand" | "model" | "trim";

function UiIcon({ name }: { name: keyof typeof icons }) {
  return <img src={icon(icons[name])} alt="" aria-hidden="true" />;
}

function Logo({ model }: { model: EnergyModel }) {
  return <span className="fe-logo"><img src={asset(`brand/kr/${model.logo}`)} alt={`${model.brand} 엠블럼`} /></span>;
}

function oneDecimal(value: string) {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const [head, ...tail] = cleaned.split(".");
  return tail.length ? `${head}.${tail.join("").slice(0, 1)}` : head;
}

function integer(value: string) {
  return value.replace(/[^0-9]/g, "").slice(0, 7);
}

export default function FuelEconomyBoard() {
  const [model, setModel] = useState<EnergyModel | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [city, setCity] = useState("");
  const [odometer, setOdometer] = useState("");
  const [fuelConsumption, setFuelConsumption] = useState("");
  const [energyConsumption, setEnergyConsumption] = useState("");
  const [fullChargeRange, setFullChargeRange] = useState("");
  const [temperature, setTemperature] = useState("15");
  const [imageData, setImageData] = useState("");
  const [error, setError] = useState("");
  const [pickerStep, setPickerStep] = useState<PickerStep>("brand");
  const [pickerBrand, setPickerBrand] = useState("");
  const [pickerModel, setPickerModel] = useState("");
  const [modelQuery, setModelQuery] = useState("");
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [cityQuery, setCityQuery] = useState("");

  const needsFuel = model?.type === "ice" || model?.type === "hybrid" || model?.type === "phev";
  const needsEnergy = model?.type === "ev" || model?.type === "phev";
  const needsRange = model?.type === "ev";
  const progress = useMemo(() => Math.min(100, Math.round(body.trim().length / 2)), [body]);
  const brands = useMemo(() => Array.from(new Map(energyModels.map((item) => [item.brand, item])).values()), []);
  const series = useMemo(() => Array.from(new Map(energyModels.filter((item) => item.brand === pickerBrand).map((item) => [item.model, item])).values()), [pickerBrand]);
  const trims = useMemo(() => energyModels.filter((item) => item.brand === pickerBrand && item.model === pickerModel), [pickerBrand, pickerModel]);
  const visibleBrands = brands.filter((item) => item.brand.toLowerCase().includes(modelQuery.trim().toLowerCase()));
  const visibleCities = cities.filter((item) => item.includes(cityQuery.trim()));

  const close = () => {
    if ((title || body || model || imageData) && !window.confirm("작성 중인 연비·전비 기록을 닫을까요? 입력한 내용은 저장되지 않습니다.")) return;
    window.location.href = "./community/naver-cafe-list.html?board=fuel-economy";
  };

  const selectModel = (next: EnergyModel) => {
    if (model && model.id !== next.id && (odometer || fuelConsumption || energyConsumption || fullChargeRange) && !window.confirm("차량을 바꾸면 입력한 에너지 수치가 초기화됩니다. 변경할까요?")) return;
    setModel(next);
    setOdometer("");
    setFuelConsumption("");
    setEnergyConsumption("");
    setFullChargeRange("");
    setTemperature("15");
    setShowPicker(false);
    setError("");
  };

  const openModelPicker = () => {
    setPickerStep("brand");
    setPickerBrand("");
    setPickerModel("");
    setModelQuery("");
    setShowPicker(true);
  };

  const submit = () => {
    if (!model) return setError("차량 모델을 선택해 주세요.");
    if (!city) return setError("주행한 지역을 선택해 주세요.");
    if (!odometer) return setError("현재 총주행거리를 입력해 주세요.");
    if (needsFuel && !fuelConsumption) return setError("평균 연비를 입력해 주세요.");
    if (needsEnergy && !energyConsumption) return setError("평균 전비를 입력해 주세요.");
    if (needsRange && !fullChargeRange) return setError("완충 실주행거리를 입력해 주세요.");
    if (!body.trim()) return setError("실주행 경험을 입력해 주세요.");
    const fallback = `${model.brand} ${model.model} 실주행 ${needsEnergy ? "전비" : "연비"} 기록`;
    const post: SavedEnergyPost = {
      id: `energy-local-${Date.now()}`,
      modelId: model.id,
      title: title.trim() || fallback,
      body: body.trim(),
      city,
      odometer,
      fuelConsumption: needsFuel ? fuelConsumption : undefined,
      energyConsumption: needsEnergy ? energyConsumption : undefined,
      fullChargeRange: needsRange ? fullChargeRange : undefined,
      temperature: needsRange ? temperature : undefined,
      imageData: imageData || undefined,
      createdAt: new Date().toISOString(),
      author: "보배드림 회원",
    };
    try {
      const rows = JSON.parse(localStorage.getItem(ENERGY_STORAGE_KEY) ?? "[]") as SavedEnergyPost[];
      localStorage.setItem(ENERGY_STORAGE_KEY, JSON.stringify([post, ...rows]));
    } catch {
      return setError("기록을 저장하지 못했습니다. 저장 공간을 확인해 주세요.");
    }
    window.location.href = `./community/naver-cafe-list.html?board=fuel-economy&energy=${encodeURIComponent(post.id)}`;
  };

  return <section className="fe-write" aria-label="연비·전비 기록 등록">
    <header className="fe-head"><button type="button" onClick={close} aria-label="닫기"><UiIcon name="close" /></button><strong>연비·전비 기록</strong><button type="button" onClick={submit}><UiIcon name="write" />등록</button></header>
    <div className="fe-progress"><b>실제 주행 조건을 자세히 적으면 더 유용한 기록이 돼요</b><span><i style={{ width: `${progress}%` }} /></span></div>

    <section className="fe-card fe-media-card">
      <h2>에너지 사용 사진</h2>
      <p>계기판이나 차량 앱의 연비·전비 화면을 올려주세요.</p>
      <div className="fe-media-row">
        {imageData ? <div className="fe-preview"><img src={imageData} alt="첨부한 에너지 사용 사진" /><button type="button" onClick={() => setImageData("")}>삭제</button></div> : <label className="fe-image-add"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 4 * 1024 * 1024) return setError("사진은 4MB 이하만 첨부할 수 있어요."); const reader = new FileReader(); reader.onload = () => setImageData(String(reader.result || "")); reader.readAsDataURL(file); }} /><UiIcon name="image" /><b>사진 추가</b><small>계기판 · 앱 화면</small></label>}
        {exampleImages.map((src, index) => <figure className="fe-example" key={src}><img src={icon(src)} alt={`에너지 사용 사진 참고 예시 ${index + 1}`} /><figcaption>참고 예시</figcaption></figure>)}
      </div>
    </section>

    <label className="fe-card fe-title"><span><b>제목</b><small>선택 · {title.length}/60</small></span><input maxLength={60} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="제목을 입력하면 더 쉽게 발견돼요" /></label>
    <label className="fe-card fe-body"><span><b>실주행 경험</b><small>{body.length}/600</small></span><textarea maxLength={600} value={body} onChange={(event) => { setBody(event.target.value); setError(""); }} placeholder="도심·고속도로 비율, 날씨, 공조 사용, 충전 주기와 비용 등 실제 주행 경험을 알려주세요." /></label>

    <section className="fe-card fe-vehicle">
      <h2>차량과 주행 정보</h2>
      <button type="button" className="fe-model" onClick={openModelPicker}>{model ? <><Logo model={model} /><span><b>{model.brand} {model.model}</b><small>{model.trim} · {energyTypeLabel[model.type]}</small></span></> : <span><b>차량 모델 선택</b><small>브랜드·차종·세부 모델을 선택해 주세요</small></span>}<UiIcon name="chevron" /></button>
      {model ? <div className="fe-fields">
        <button type="button" className="fe-field-button" onClick={() => { setCityQuery(""); setShowCityPicker(true); }}><span>주행 지역<em>*</em></span><b>{city || "선택"}</b><UiIcon name="chevron" /></button>
        <label><span>현재 총주행거리</span><div><input inputMode="numeric" value={odometer} onChange={(event) => setOdometer(integer(event.target.value))} placeholder="0" /><em>km</em></div></label>
        {needsEnergy ? <label><span>평균 전비</span><div><input inputMode="decimal" value={energyConsumption} onChange={(event) => setEnergyConsumption(oneDecimal(event.target.value))} placeholder="0.0" /><em>kWh/100km</em></div></label> : null}
        {needsFuel ? <label><span>평균 연비</span><div><input inputMode="decimal" value={fuelConsumption} onChange={(event) => setFuelConsumption(oneDecimal(event.target.value))} placeholder="0.0" /><em>L/100km</em></div></label> : null}
        {needsRange ? <label className="fe-range-row"><span>완충 실주행거리</span><div className="fe-range-fields"><input aria-label="측정 온도" className="fe-temperature" inputMode="numeric" value={temperature} onChange={(event) => setTemperature(event.target.value.replace(/[^0-9-]/g, "").slice(0, 3))} /><em>℃</em><input aria-label="완충 실주행거리" inputMode="numeric" value={fullChargeRange} onChange={(event) => setFullChargeRange(integer(event.target.value))} placeholder="0" /><em>km</em></div></label> : null}
      </div> : <p className="fe-helper">차량을 선택하면 연료 유형에 맞는 연비·전비 입력란이 자동으로 표시됩니다.</p>}
    </section>

    {error ? <p className="fe-error" role="alert">{error}</p> : null}
    <button type="button" className="fe-submit" onClick={submit}>연비·전비 기록 등록</button>

    {showPicker ? <div className="fe-sheet" role="dialog" aria-modal="true" aria-label="차량 모델 선택"><button className="fe-sheet-backdrop" type="button" aria-label="닫기" onClick={() => setShowPicker(false)} /><section>
      <header>{pickerStep !== "brand" ? <button type="button" onClick={() => setPickerStep(pickerStep === "trim" ? "model" : "brand")} aria-label="이전"><UiIcon name="back" /></button> : <span />}
        <strong>{pickerStep === "brand" ? "브랜드 선택" : pickerStep === "model" ? "차종 선택" : "세부 모델 선택"}</strong>
        <button type="button" onClick={() => setShowPicker(false)} aria-label="닫기"><UiIcon name="close" /></button>
      </header>
      {pickerStep === "brand" ? <><label className="fe-sheet-search"><input value={modelQuery} onChange={(event) => setModelQuery(event.target.value)} placeholder="브랜드 검색" /></label>{visibleBrands.map((item) => <button key={item.brand} type="button" onClick={() => { setPickerBrand(item.brand); setPickerStep("model"); }}><Logo model={item} /><span><b>{item.brand}</b><small>{energyModels.filter((row) => row.brand === item.brand).length}개 차종</small></span><UiIcon name="chevron" /></button>)}</> : null}
      {pickerStep === "model" ? series.map((item) => <button key={item.model} type="button" onClick={() => { setPickerModel(item.model); setPickerStep("trim"); }}><Logo model={item} /><span><b>{item.brand} {item.model}</b><small>{energyTypeLabel[item.type]}</small></span><UiIcon name="chevron" /></button>) : null}
      {pickerStep === "trim" ? trims.map((item) => <button key={item.id} type="button" className={model?.id === item.id ? "is-active" : ""} onClick={() => selectModel(item)}><Logo model={item} /><span><b>{item.trim}</b><small>{item.brand} {item.model} · {energyTypeLabel[item.type]}</small></span>{model?.id === item.id ? <UiIcon name="check" /> : null}</button>) : null}
    </section></div> : null}

    {showCityPicker ? <div className="fe-sheet fe-city-sheet" role="dialog" aria-modal="true" aria-label="주행 지역 선택"><button className="fe-sheet-backdrop" type="button" aria-label="닫기" onClick={() => setShowCityPicker(false)} /><section>
      <header><span /><strong>주행 지역 선택</strong><button type="button" onClick={() => setShowCityPicker(false)} aria-label="닫기"><UiIcon name="close" /></button></header>
      <label className="fe-sheet-search"><input value={cityQuery} onChange={(event) => setCityQuery(event.target.value)} placeholder="지역 검색" /></label>
      {visibleCities.map((item) => <button key={item} type="button" className={city === item ? "is-active" : ""} onClick={() => { setCity(item); setShowCityPicker(false); setError(""); }}><span><b>{item}</b><small>{item === "서울" ? "서울특별시" : item}</small></span>{city === item ? <UiIcon name="check" /> : <UiIcon name="chevron" />}</button>)}
    </section></div> : null}
  </section>;
}
