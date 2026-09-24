import { useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { ChevronRightIcon } from "@radix-ui/react-icons";
import { KeyboardInput, useKeyboard } from "../../mobile";
import { Icon } from "../shared";
import {
  asset,
  dongchediBrandLogo,
  formatPriceValue,
  categorySheetItems,
  compactGenerationCardYearLabel,
  formatModelLabel,
  generationCardLabel,
  makerOptions,
  pricePresets,
  priceSteps,
  quickGenerationsByMakerModel,
  quickModelVisualsByMaker,
  quickModelsByMaker,
  toTrimOption,
  usedCarCategoryOptions,
  type BrandRailOption,
  type MakerOption,
  type PriceSelection,
  type VehicleBodyFit,
} from "../data";

function CategoryFilterSheet({ selected, onChoose, onClose }: { selected: string; onChoose: (category: string) => void; onClose: () => void }) {
  const [usedCarOpen, setUsedCarOpen] = useState(true);
  const selectedChild = selected === "전체" || selected === "중고차" ? "전체" : selected;

  return (
    <div className="category-filter-sheet">
      <header className="category-filter-header">
        <h2>카테고리</h2>
        <button type="button" aria-label="카테고리 닫기" onClick={onClose}><Icon name="category-sheet-close.svg" /></button>
      </header>
      <div className="category-filter-list">
        {categorySheetItems.map((item) => item.name === "중고차" ? (
          <section key={item.name} className="category-filter-group">
            <div className="category-filter-row">
              <span className="category-filter-mark"><img src={asset(item.icon ?? "categories/used-car.svg")} alt="" aria-hidden="true" draggable={false} /></span>
              <strong>{item.name}</strong>
              <button className="category-filter-toggle" type="button" aria-label={`중고차 하위 카테고리 ${usedCarOpen ? "숨기기" : "보기"}`} aria-expanded={usedCarOpen} onClick={() => setUsedCarOpen((open) => !open)}><Icon name={usedCarOpen ? "category-chevron-down.svg" : "category-chevron-right.svg"} /></button>
            </div>
            {usedCarOpen ? <div className="category-filter-children" aria-label="중고차 하위 카테고리">
              {usedCarCategoryOptions.map((option) => <button key={option} type="button" className={selectedChild === option ? "is-selected" : ""} aria-pressed={selectedChild === option} onClick={() => onChoose(option)}>{option}</button>)}
            </div> : null}
          </section>
        ) : (
          <button key={item.name} className="category-filter-row category-filter-link" type="button" onClick={() => onChoose(item.name)}>
            <span className="category-filter-mark">{item.icon ? <img src={asset(item.icon)} alt="" aria-hidden="true" draggable={false} /> : null}</span>
            <strong>{item.name}</strong>
            <Icon name="category-chevron-right.svg" />
          </button>
        ))}
      </div>
    </div>
  );
}

function MakerMark({ option }: { option: MakerOption }) {
  if (option.logo) return <img className="maker-option-logo" src={option.logo} alt="" aria-hidden="true" draggable={false} />;
  if (!option.icon) return null;
  return <svg className="maker-option-logo" viewBox="0 0 24 24" fill={option.color ?? `#${option.icon.hex}`} aria-hidden="true"><path d={option.icon.path} /></svg>;
}

const depthBrandLogoOverrides: Record<string, string> = {
  벤츠: dongchediBrandLogo("benz"),
  포르쉐: dongchediBrandLogo("porsche"),
};
const wordmarkBrandNames = new Set(["아우디", "기아", "미니", "랜드로버", "렉서스"]);

function BrandRailMark({ option, variant = "default" }: { option: BrandRailOption; variant?: "default" | "depth" }) {
  const isDepth = variant === "depth";
  const logoClass = `brand-logo${isDepth ? " is-depth" : ""}${isDepth && wordmarkBrandNames.has(option.name) ? " is-wordmark" : ""}`;
  const logo = isDepth && option.logo ? depthBrandLogoOverrides[option.name] ?? option.logo : option.logo;
  if (logo) return <span className={logoClass}><img className={option.full ? "brand-full" : ""} src={logo} alt="" aria-hidden="true" draggable={false} /></span>;
  if (option.icon) return <span className={logoClass}><svg viewBox="0 0 24 24" fill={option.color ?? `#${option.icon.hex}`} aria-hidden="true"><path d={option.icon.path} /></svg></span>;
  return <span className={logoClass}><span className="brand-logo-fallback" aria-hidden="true">{option.name.slice(0, 2)}</span></span>;
}

function ElectricSparkIcon() {
  return <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M9.2 1.2 3.5 8.7h3.8l-.7 6.1 5.9-7.8H8.6l.6-5.8Z" fill="currentColor" /></svg>;
}

function DepthCard({ label, sub, image, imageFit = "width", selected, disabled, mediaKind, isEV, onClick }: { label: string; sub?: string; image?: ReactNode; imageFit?: VehicleBodyFit; selected?: boolean; disabled?: boolean; mediaKind?: "brand"; isEV?: boolean; onClick: () => void }) {
  const mediaClassName = `depth-card-media${mediaKind === "brand" ? " is-brand" : ` is-fit-${imageFit}`}`;
  return (
    <button type="button" className={`depth-card${selected ? " is-selected" : ""}`} disabled={disabled} aria-pressed={Boolean(selected)} onClick={onClick}>
      {isEV ? <span className="depth-card-ev" role="img" aria-label="전기차"><ElectricSparkIcon /></span> : null}
      <span className={mediaClassName}>{image}</span>
      <strong className="depth-card-label">{label}</strong>
      {sub ? <small className="depth-card-sub">{sub}</small> : null}
    </button>
  );
}

function TrimChip({ label, selected, disabled, onClick }: { label: string; selected?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`trim-chip${selected ? " is-selected" : ""}`} disabled={disabled} aria-pressed={Boolean(selected)} onClick={onClick}>
      {label}
    </button>
  );
}

function MakerSheet({ selected, onChoose, onClose }: { selected: string | null; onChoose: (maker: string | null) => void; onClose: () => void }) {
  const keyboard = useKeyboard();
  const [query, setQuery] = useState("");
  const filteredOptions = makerOptions.filter((option) => option.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="maker-sheet">
      <button type="button" className="maker-sheet-close" aria-label="제조사 선택 닫기" onClick={onClose}><Icon name="sheet-close.svg" /></button>
      <label className="maker-search">
        <Icon name="search.svg" />
        <KeyboardInput aria-label="제조사 검색" value={query} onChange={(event) => setQuery(event.currentTarget.value)} onBlur={() => keyboard.hide()} placeholder="검색" />
      </label>
      <div className="maker-list" role="radiogroup" aria-label="제조사 목록">
        {filteredOptions.map((option) => (
          <label key={option.name} className={`maker-option${selected === option.maker ? " is-selected" : ""}`}>
            <MakerMark option={option} />
            <span>{option.name}</span>
            <input type="radio" name="maker" value={option.maker} checked={selected === option.maker} onChange={() => onChoose(option.maker)} />
          </label>
        ))}
        {!filteredOptions.length ? <div className="maker-empty"><strong>검색 결과가 없어요</strong><span>다른 제조사명을 입력해보세요.</span></div> : null}
      </div>
    </div>
  );
}

function PriceSheet({ value, onChange, onClose, onReset, onConfirm, resultCount }: { value: PriceSelection; onChange: (value: PriceSelection) => void; onClose: () => void; onReset: () => void; onConfirm: () => void; resultCount: number }) {
  const minIndex = Math.max(0, priceSteps.indexOf(value.min));
  const maxIndex = value.max === null ? priceSteps.length - 1 : Math.max(1, priceSteps.indexOf(value.max));
  const rangeMax = priceSteps.length - 1;
  const rangeStyle = {
    "--price-start": `${(minIndex / rangeMax) * 100}%`,
    "--price-end": `${(maxIndex / rangeMax) * 100}%`,
  } as CSSProperties;
  const setMinIndex = (nextIndex: number) => {
    const safeIndex = Math.min(nextIndex, maxIndex - 1);
    onChange({ ...value, min: priceSteps[safeIndex] });
  };
  const setMaxIndex = (nextIndex: number) => {
    const safeIndex = Math.max(nextIndex, minIndex + 1);
    onChange({ ...value, max: safeIndex === rangeMax ? null : priceSteps[safeIndex] });
  };

  return (
    <div className="price-filter-sheet">
      <button className="price-filter-close" type="button" aria-label="가격 필터 닫기" onClick={onClose}><Icon name="sheet-close.svg" /></button>
      <div className="price-mode-tabs" role="tablist" aria-label="가격 유형">
        <button type="button" role="tab" aria-selected={value.mode === "cash"} className={value.mode === "cash" ? "is-selected" : ""} onClick={() => onChange({ ...value, mode: "cash" })}>현금 차량</button>
        <button type="button" role="tab" aria-selected={value.mode === "lease"} className={value.mode === "lease" ? "is-selected" : ""} onClick={() => onChange({ ...value, mode: "lease" })}>리스/렌트</button>
      </div>
      <div className="price-filter-body">
        <div className="price-input-row" aria-label="선택한 가격 범위">
          <div className="price-input-box"><span>최소</span><strong>{formatPriceValue(value.min)}</strong><b>만원</b></div>
          <span className="price-range-separator">~</span>
          <div className="price-input-box"><span>최대</span><strong>{value.max === null ? "전체" : formatPriceValue(value.max)}</strong><b>만원</b></div>
        </div>
        <div className="price-range" style={rangeStyle}>
          <div className="price-range-line" aria-hidden="true" />
          <input type="range" min="0" max={rangeMax} step="1" value={minIndex} aria-label="최소 가격" onChange={(event) => setMinIndex(Number(event.currentTarget.value))} />
          <input type="range" min="0" max={rangeMax} step="1" value={maxIndex} aria-label="최대 가격" onChange={(event) => setMaxIndex(Number(event.currentTarget.value))} />
          <div className="price-range-labels" aria-hidden="true"><span>0원</span><span>5,000만원</span><span>전체</span></div>
        </div>
        <div className="price-presets" aria-label="추천 가격 범위">
          {pricePresets.map((preset) => {
            const selected = value.min === preset.min && value.max === preset.max;
            return <button key={preset.label} type="button" className={selected ? "is-selected" : ""} aria-pressed={selected} onClick={() => onChange({ ...value, min: preset.min, max: preset.max })}>{preset.label}</button>;
          })}
        </div>
      </div>
      <div className="price-filter-actions">
        <button type="button" className="price-filter-reset" onClick={onReset}>초기화</button>
        <button type="button" className="price-filter-confirm" onClick={onConfirm}>{resultCount.toLocaleString("ko-KR")}대 매물 보기</button>
      </div>
    </div>
  );
}

function VehiclePickerSheet({
  maker,
  model,
  generation,
  makerOptions,
  onApply,
}: {
  maker: string | null;
  model: string | null;
  generation: string | null;
  makerOptions: BrandRailOption[];
  onApply: (maker: string | null, model: string | null, generation: string | null) => void;
}) {
  const [draftMaker, setDraftMaker] = useState<string | null>(maker);
  const [draftModel, setDraftModel] = useState<string | null>(model);
  const [draftGeneration, setDraftGeneration] = useState<string | null>(generation);
  const modelOptions = draftMaker ? quickModelsByMaker[draftMaker] ?? [] : [];
  const generationOptions = draftMaker && draftModel ? quickGenerationsByMakerModel[draftMaker]?.[draftModel] ?? [] : [];
  const generationEmptyText = draftModel ? "세대 정보 없음" : "모델을 먼저 선택하세요.";
  const visibleMakerOptions = makerOptions.filter((option) => option.maker);

  useEffect(() => {
    setDraftMaker(maker);
    setDraftModel(model);
    setDraftGeneration(generation);
  }, [maker, model, generation]);

  const chooseMaker = (nextMaker: string | null) => {
    setDraftMaker(nextMaker);
    setDraftModel(null);
    setDraftGeneration(null);
  };
  const chooseModel = (nextModel: string | null) => {
    setDraftModel(nextModel);
    setDraftGeneration(null);
  };

  return (
    <div className="vehicle-picker-sheet">
      <section className="vehicle-picker-section">
        <h3>제조사</h3>
        <div className="vehicle-picker-grid is-makers">
          {visibleMakerOptions.map((option) => (
            <button key={option.name} type="button" className={draftMaker === option.maker ? "is-selected" : ""} aria-pressed={draftMaker === option.maker} onClick={() => chooseMaker(option.maker ?? null)}>
              <BrandRailMark option={option} />
              <span>{option.name}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="vehicle-picker-section">
        <h3>모델</h3>
        <div className="vehicle-picker-grid">
          {modelOptions.length ? modelOptions.map((option) => {
            const disabled = quickModelVisualsByMaker[draftMaker ?? ""]?.[option]?.count === "0대";
            return <button key={option} type="button" className={draftModel === option ? "is-selected" : ""} aria-pressed={draftModel === option} disabled={disabled} onClick={() => chooseModel(option)}>{formatModelLabel(option)}</button>;
          }) : <p>제조사를 먼저 선택하세요.</p>}
        </div>
      </section>
      <section className="vehicle-picker-section">
        <h3>세대</h3>
        <div className="vehicle-picker-grid is-generations">
          {generationOptions.length ? generationOptions.map((option) => {
            const disabled = (option.count ?? option.variants.reduce((sum, variant) => sum + toTrimOption(variant).count, 0)) === 0;
            return (
              <button key={option.name} type="button" className={draftGeneration === option.name ? "is-selected" : ""} aria-pressed={draftGeneration === option.name} disabled={disabled} onClick={() => setDraftGeneration(option.name)}>
                <strong>{generationCardLabel(option)}</strong>
                <small>{compactGenerationCardYearLabel(option.years)}</small>
              </button>
            );
          }) : <p>{generationEmptyText}</p>}
        </div>
      </section>
      <div className="vehicle-picker-actions">
        <button type="button" className="vehicle-picker-reset" onClick={() => chooseMaker(null)}>초기화</button>
        <button type="button" className="vehicle-picker-apply" onClick={() => onApply(draftMaker, draftModel, draftGeneration)}>적용</button>
      </div>
    </div>
  );
}


export {
  CategoryFilterSheet,
  MakerMark,
  BrandRailMark,
  ElectricSparkIcon,
  DepthCard,
  TrimChip,
  MakerSheet,
  PriceSheet,
  VehiclePickerSheet,
};
