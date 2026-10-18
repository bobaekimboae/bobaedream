import { useMemo, useState, type ReactNode } from "react";
import type { QuickGenerationOption, QuickModelVisual } from "../data";
import { BbmModal } from "../filters/bbm-filter-parts";
import "./maker-hierarchy-modal.css";

type Step = "maker" | "model" | "generation";

type Props = {
  onClose: () => void;
  onApply: (maker: string | null, model: string | null, generation: string | null) => void;
  renderMakerLogo: () => ReactNode;
  modelNames: string[];
  modelVisuals: Record<string, QuickModelVisual>;
  generationsByModel: Record<string, QuickGenerationOption[]>;
  formatModel: (name: string) => string;
};

const numberFromCount = (value?: string) => value ? Number(value.replace(/[^0-9]/g, "")) || 0 : 0;
const formatCount = (value: number) => value.toLocaleString("ko-KR");

export function MakerHierarchyModal({ onClose, onApply, renderMakerLogo, modelNames, modelVisuals, generationsByModel, formatModel }: Props) {
  const [step, setStep] = useState<Step>("maker");
  const [query, setQuery] = useState("");
  const [draftMaker, setDraftMaker] = useState<string | null>(null);
  const [draftModel, setDraftModel] = useState<string | null>(null);
  const [draftGeneration, setDraftGeneration] = useState<string | null>(null);

  const modelRows = useMemo(() => modelNames.filter((name) => !query.trim() || formatModel(name).toLowerCase().includes(query.trim().toLowerCase())), [formatModel, modelNames, query]);
  const generationRows = useMemo(() => draftModel ? (generationsByModel[draftModel] ?? []).filter((item) => {
    const keyword = query.trim().toLowerCase();
    return !keyword || `${item.cardLabel ?? item.displayLabel ?? item.name} ${item.cardSub ?? item.years}`.toLowerCase().includes(keyword);
  }) : [], [draftModel, generationsByModel, query]);
  const makerCount = useMemo(() => modelNames.reduce((sum, name) => sum + numberFromCount(modelVisuals[name]?.count), 0), [modelNames, modelVisuals]);
  const selectedGeneration = draftModel && draftGeneration ? (generationsByModel[draftModel] ?? []).find((item) => item.name === draftGeneration) : undefined;
  const resultCount = selectedGeneration?.count ?? (draftModel ? numberFromCount(modelVisuals[draftModel]?.count) : makerCount);

  const goMaker = () => { setStep("maker"); setQuery(""); setDraftMaker(null); setDraftModel(null); setDraftGeneration(null); };
  const goModel = () => { setStep("model"); setQuery(""); setDraftModel(null); setDraftGeneration(null); };
  const back = step === "generation" ? goModel : step === "model" ? goMaker : undefined;
  const title = step === "maker" ? "제조사" : step === "model" ? "현대 모델" : formatModel(draftModel ?? "세부모델");
  const placeholder = step === "maker" ? "제조사 검색" : step === "model" ? "모델 검색" : "세부모델 검색";

  return (
    <BbmModal title={title} variant="vehicle-hierarchy" flush onBack={back} onClose={onClose} footer={
      <div className="maker-hierarchy-actions">
        <button type="button" className="maker-hierarchy-reset" onClick={goMaker}>초기화</button>
        <button type="button" className="maker-hierarchy-confirm" disabled={!draftMaker} onClick={() => onApply(draftMaker, draftModel, draftGeneration)}>{draftMaker ? `${formatCount(resultCount)}대 보기` : "제조사를 선택해 주세요"}</button>
      </div>
    }>
      <div className="maker-hierarchy">
        <div className="maker-hierarchy-search">
          <span aria-hidden="true" />
          <input value={query} placeholder={placeholder} aria-label={placeholder} onChange={(event) => setQuery(event.target.value)} />
        </div>
        {draftMaker ? <div className="maker-hierarchy-path" aria-label="선택한 차량 경로">
          <button type="button" onClick={goMaker}>현대 <b aria-hidden="true">×</b></button>
          {draftModel ? <button type="button" onClick={goModel}>{formatModel(draftModel)} <b aria-hidden="true">×</b></button> : null}
          {selectedGeneration ? <button type="button" onClick={() => setDraftGeneration(null)}>{selectedGeneration.cardLabel ?? selectedGeneration.displayLabel ?? selectedGeneration.name} <b aria-hidden="true">×</b></button> : null}
        </div> : null}
        {step === "maker" ? <section className="maker-hierarchy-section">
          <p>국산차</p>
          <button type="button" className="maker-hierarchy-row is-maker" onClick={() => { setDraftMaker("현대"); setStep("model"); setQuery(""); }}>
            <span className="maker-hierarchy-logo">{renderMakerLogo()}</span>
            <span className="maker-hierarchy-copy"><strong>현대</strong></span>
            <small>{formatCount(makerCount)}</small><i aria-hidden="true" />
          </button>
        </section> : null}
        {step === "model" ? <section className="maker-hierarchy-section is-list">
          <p>모델</p>
          {modelRows.map((name) => {
            const visual = modelVisuals[name];
            return <button key={name} type="button" className="maker-hierarchy-row is-vehicle" onClick={() => { setDraftModel(name); setDraftGeneration(null); setStep("generation"); setQuery(""); }}>
              <span className={`maker-hierarchy-image is-${visual?.bodyFit ?? "width"}`}>{visual?.image ? <img src={visual.image} alt="" draggable={false} /> : null}</span>
              <span className="maker-hierarchy-copy"><strong>{formatModel(name)}</strong><em>{visual?.bodyType ?? "중고차"}</em></span>
              <small>{formatCount(numberFromCount(visual?.count))}</small><i aria-hidden="true" />
            </button>;
          })}
        </section> : null}
        {step === "generation" ? <section className="maker-hierarchy-section is-list">
          <p>세부모델</p>
          {generationRows.map((item) => <button key={item.name} type="button" className={`maker-hierarchy-row is-vehicle${draftGeneration === item.name ? " is-selected" : ""}`} aria-pressed={draftGeneration === item.name} onClick={() => setDraftGeneration(item.name)}>
            <span className={`maker-hierarchy-image is-${item.bodyFit ?? "width"}`}>{item.image ? <img src={item.image} alt="" draggable={false} /> : null}</span>
            <span className="maker-hierarchy-copy"><strong>{item.cardLabel ?? item.displayLabel ?? item.name}</strong><em>{item.cardSub ?? item.years}</em></span>
            <small>{formatCount(item.count ?? 0)}</small><i aria-hidden="true" />
          </button>)}
        </section> : null}
      </div>
    </BbmModal>
  );
}
