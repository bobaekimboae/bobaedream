import { useMemo, useState, type ReactNode } from "react";
import { CheckIcon, ChevronRightIcon, Cross2Icon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import type { QuickGenerationOption, QuickModelVisual } from "../data";
import { BbmModal, BbmSheet } from "../filters/bbm-filter-parts";
import "./maker-hierarchy-modal.css";

type Step = "maker" | "model" | "generation";

export type MakerHierarchyOption = {
  name: string;
  kind?: string | null;
  logoPath?: string | null;
};

type Props = {
  mode: "modal" | "sheet";
  onClose: () => void;
  onApply: (maker: string | null, model: string | null, generation: string | null) => void;
  initialMaker: string | null;
  initialModel: string | null;
  initialGeneration: string | null;
  startStep?: Step;
  makers: MakerHierarchyOption[];
  renderMakerLogo: (maker: MakerHierarchyOption) => ReactNode;
  modelsByMaker: Record<string, string[]>;
  modelVisualsByMaker: Record<string, Record<string, QuickModelVisual>>;
  generationsByMakerModel: Record<string, Record<string, QuickGenerationOption[]>>;
  formatModel: (name: string) => string;
  onPreviewMaker?: (maker: string) => void;
};

const numberFromCount = (value?: string) => value ? Number(value.replace(/[^0-9]/g, "")) || 0 : 0;
const formatCount = (value: number) => value.toLocaleString("ko-KR");

const inferStep = (maker: string | null, model: string | null, requested?: Step): Step => {
  if (requested === "maker") return "maker";
  if (!maker) return "maker";
  if (requested === "model") return "model";
  if (requested === "generation" && model) return "generation";
  return model ? "generation" : "model";
};

export function MakerHierarchyModal({
  mode,
  onClose,
  onApply,
  initialMaker,
  initialModel,
  initialGeneration,
  startStep,
  makers,
  renderMakerLogo,
  modelsByMaker,
  modelVisualsByMaker,
  generationsByMakerModel,
  formatModel,
  onPreviewMaker,
}: Props) {
  const [step, setStep] = useState<Step>(() => inferStep(initialMaker, initialModel, startStep));
  const [query, setQuery] = useState("");
  const [draftMaker, setDraftMaker] = useState<string | null>(initialMaker);
  const [draftModel, setDraftModel] = useState<string | null>(initialModel);
  const [draftGeneration, setDraftGeneration] = useState<string | null>(initialGeneration);

  const modelNames = draftMaker ? modelsByMaker[draftMaker] ?? [] : [];
  const modelVisuals = draftMaker ? modelVisualsByMaker[draftMaker] ?? {} : {};
  const generationsByModel = draftMaker ? generationsByMakerModel[draftMaker] ?? {} : {};
  const keyword = query.trim().toLowerCase();
  const visibleMakers = useMemo(() => makers.filter((maker) => !keyword || maker.name.toLowerCase().includes(keyword)), [keyword, makers]);
  const makerSections = useMemo(() => {
    const kinds = ["국산", "수입", "기타"];
    return kinds.map((kind) => ({
      key: kind,
      label: kind === "국산" ? "국산차" : kind === "수입" ? "수입차" : "기타",
      rows: visibleMakers.filter((maker) => (maker.kind ?? "기타") === kind),
    })).filter((section) => section.rows.length);
  }, [visibleMakers]);
  const modelRows = useMemo(() => modelNames.filter((name) => !keyword || formatModel(name).toLowerCase().includes(keyword)), [formatModel, keyword, modelNames]);
  const generationRows = useMemo(() => draftModel ? (generationsByModel[draftModel] ?? []).filter((item) => (
    !keyword || `${item.cardLabel ?? item.displayLabel ?? item.name} ${item.cardSub ?? item.years}`.toLowerCase().includes(keyword)
  )) : [], [draftModel, generationsByModel, keyword]);
  const makerCount = (maker: string) => (modelsByMaker[maker] ?? []).reduce((sum, name) => (
    sum + numberFromCount(modelVisualsByMaker[maker]?.[name]?.count)
  ), 0);
  const selectedGeneration = draftModel && draftGeneration ? (generationsByModel[draftModel] ?? []).find((item) => item.name === draftGeneration) : undefined;
  const modelCount = draftModel ? numberFromCount(modelVisuals[draftModel]?.count) : modelNames.reduce((sum, name) => sum + numberFromCount(modelVisuals[name]?.count), 0);
  const resultCount = draftMaker ? selectedGeneration?.count ?? modelCount : makers.reduce((sum, maker) => sum + makerCount(maker.name), 0);

  const goMaker = () => { setStep("maker"); setQuery(""); };
  const goModel = () => { setStep("model"); setQuery(""); setDraftModel(null); setDraftGeneration(null); };
  const reset = () => { setStep("maker"); setQuery(""); setDraftMaker(null); setDraftModel(null); setDraftGeneration(null); };
  const chooseMaker = (maker: string) => {
    setDraftMaker(maker);
    setDraftModel(null);
    setDraftGeneration(null);
    setStep("model");
    setQuery("");
    onPreviewMaker?.(maker);
  };
  const back = step === "generation" ? goModel : step === "model" ? goMaker : undefined;
  const title = step === "maker" ? "제조사" : step === "model" ? `${draftMaker ?? ""} 모델` : formatModel(draftModel ?? "세부모델");
  const placeholder = step === "maker" ? "제조사 검색" : step === "model" ? "모델 검색" : "세부모델 검색";
  const footer = (
    <div className="maker-hierarchy-actions">
      <button type="button" className="maker-hierarchy-reset" disabled={!draftMaker && !draftModel && !draftGeneration} onClick={reset}>초기화</button>
      <button type="button" className="maker-hierarchy-confirm" onClick={() => onApply(draftMaker, draftModel, draftGeneration)}>
        {formatCount(resultCount)}대 보기
      </button>
    </div>
  );

  const content = (
    <div className="maker-hierarchy" data-testid="maker-hierarchy">
      <label className="maker-hierarchy-search">
        <MagnifyingGlassIcon aria-hidden="true" />
        <input value={query} placeholder={placeholder} aria-label={placeholder} onChange={(event) => setQuery(event.target.value)} />
      </label>
      {draftMaker ? <div className="maker-hierarchy-path" aria-label="선택한 차량 경로">
        <button type="button" onClick={goMaker}>{draftMaker} <Cross2Icon aria-hidden="true" /></button>
        {draftModel ? <button type="button" onClick={goModel}>{formatModel(draftModel)} <Cross2Icon aria-hidden="true" /></button> : null}
        {selectedGeneration ? <button type="button" onClick={() => setDraftGeneration(null)}>{selectedGeneration.cardLabel ?? selectedGeneration.displayLabel ?? selectedGeneration.name} <Cross2Icon aria-hidden="true" /></button> : null}
      </div> : null}
      {step === "maker" ? <div className="maker-hierarchy-maker-sections">
        {makerSections.map((section) => <section key={section.key} className="maker-hierarchy-section">
          <p>{section.label}</p>
          {section.rows.map((maker) => <button key={maker.name} type="button" className="maker-hierarchy-row is-maker" data-maker={maker.name} onClick={() => chooseMaker(maker.name)}>
            <span className="maker-hierarchy-logo">{renderMakerLogo(maker)}</span>
            <span className="maker-hierarchy-copy"><strong>{maker.name}</strong></span>
            <small>{formatCount(makerCount(maker.name))}</small>
            <ChevronRightIcon aria-hidden="true" />
          </button>)}
        </section>)}
        {!visibleMakers.length ? <p className="maker-hierarchy-empty">검색 결과가 없습니다.</p> : null}
      </div> : null}
      {step === "model" ? <section className="maker-hierarchy-section is-list">
        <p>모델</p>
        {modelRows.map((name) => {
          const visual = modelVisuals[name];
          return <button key={name} type="button" className="maker-hierarchy-row is-vehicle" data-model={name} onClick={() => { setDraftModel(name); setDraftGeneration(null); setStep("generation"); setQuery(""); }}>
            <span className={`maker-hierarchy-image is-${visual?.bodyFit ?? "width"}`}>{visual?.image ? <img src={visual.image} alt="" draggable={false} /> : null}</span>
            <span className="maker-hierarchy-copy"><strong>{formatModel(name)}</strong><em>{visual?.bodyType ?? "중고차"}</em></span>
            <small>{formatCount(numberFromCount(visual?.count))}</small><ChevronRightIcon aria-hidden="true" />
          </button>;
        })}
        {!modelRows.length ? <p className="maker-hierarchy-empty">등록된 모델이 없습니다.</p> : null}
      </section> : null}
      {step === "generation" ? <section className="maker-hierarchy-section is-list">
        <p>세부모델</p>
        {generationRows.map((item) => <button key={item.name} type="button" className={`maker-hierarchy-row is-vehicle${draftGeneration === item.name ? " is-selected" : ""}`} data-generation={item.name} aria-pressed={draftGeneration === item.name} onClick={() => setDraftGeneration(item.name)}>
          <span className={`maker-hierarchy-image is-${item.bodyFit ?? "width"}`}>{item.image ? <img src={item.image} alt="" draggable={false} /> : null}</span>
          <span className="maker-hierarchy-copy"><strong>{item.cardLabel ?? item.displayLabel ?? item.name}</strong><em>{item.cardSub ?? item.years}</em></span>
          <small>{formatCount(item.count ?? 0)}</small>{draftGeneration === item.name ? <CheckIcon aria-hidden="true" /> : <ChevronRightIcon aria-hidden="true" />}
        </button>)}
        {!generationRows.length ? <p className="maker-hierarchy-empty">세부모델 정보가 없습니다. 모델까지만 선택할 수 있습니다.</p> : null}
      </section> : null}
    </div>
  );

  return mode === "sheet"
    ? <BbmSheet title={title} flush onBack={back} onClose={onClose} footer={footer}>{content}</BbmSheet>
    : <BbmModal title={title} variant="vehicle-hierarchy" flush onBack={back} onClose={onClose} footer={footer}>{content}</BbmModal>;
}
