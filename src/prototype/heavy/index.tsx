import { useState } from "react";
import {
  approvedHeavyManufacturers,
  approvedHeavySubmodels,
  heavyImageCandidates,
  type HeavyImageCandidate,
  type HeavySubmodelSlot,
} from "./manifest";
import { emptyHeavySelection, heavyRowsFor, type HeavySelection } from "./data";
import "./heavy.css";

type HeavyQuickFilterProps = { value: HeavySelection; onChange: (next: HeavySelection) => void };
const heavyAsset = (fileName: string) => `${import.meta.env.BASE_URL}assets/heavy/${fileName}`;

function HeavySlotImage({ candidates, alt }: { candidates: readonly HeavyImageCandidate[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const current = candidates[index];
  if (!current || failed) return <span className="heavy-qf-text-mark" aria-label={alt}>{alt.slice(0, 3)}</span>;
  return (
    <img
      src={heavyAsset(current.file)}
      alt={alt}
      draggable={false}
      data-fallback-level={current.fallbackLevel}
      onError={() => index + 1 < candidates.length ? setIndex(index + 1) : setFailed(true)}
    />
  );
}

const modelSlotsFor = (value: HeavySelection) => approvedHeavySubmodels.filter((slot) =>
  slot.manufacturerCode === value.manufacturerCode
  && (!value.equipmentTypeCode || slot.equipmentTypeCode === value.equipmentTypeCode)
  && (!value.detailTypeCode || value.detailTypeCode === "all" || slot.detailTypeCode === value.detailTypeCode));

const modelGroupsFor = (value: HeavySelection) => {
  const map = new Map<string, { slot: HeavySubmodelSlot; count: number }>();
  for (const slot of modelSlotsFor(value)) {
    const current = map.get(slot.modelCode);
    map.set(slot.modelCode, { slot: current?.slot ?? slot, count: (current?.count ?? 0) + slot.scenarioIds.length });
  }
  return [...map.values()];
};

export function HeavyQuickFilter({ value, onChange }: HeavyQuickFilterProps) {
  const manufacturer = approvedHeavyManufacturers.find((slot) => slot.manufacturerCode === value.manufacturerCode);
  const modelGroups = modelGroupsFor(value);
  const submodels = approvedHeavySubmodels.filter((slot) =>
    slot.manufacturerCode === value.manufacturerCode
    && slot.modelCode === value.modelCode
    && (!value.equipmentTypeCode || slot.equipmentTypeCode === value.equipmentTypeCode)
    && (!value.detailTypeCode || value.detailTypeCode === "all" || slot.detailTypeCode === value.detailTypeCode));
  const selectedSubmodel = approvedHeavySubmodels.find((slot) => slot.submodelCode === value.submodelCode);

  const depth = !value.manufacturerCode
    ? "제조사"
    : !value.modelCode
      ? "모델"
      : !value.submodelCode
        ? "세부모델 · 세부 형식"
        : "선택 완료";

  const chooseManufacturer = (manufacturerCode: string) => {
    const slot = approvedHeavyManufacturers.find((item) => item.manufacturerCode === manufacturerCode);
    if (!slot) return;
    onChange({
      ...value,
      maker: slot.name,
      model: null,
      submodel: null,
      manufacturerCode: slot.manufacturerCode,
      modelCode: null,
      submodelCode: null,
    });
  };

  const chooseModel = (slot: HeavySubmodelSlot) => onChange({
    ...value,
    maker: manufacturer?.name ?? value.maker,
    model: slot.modelLabel,
    submodel: null,
    manufacturerCode: slot.manufacturerCode,
    modelCode: slot.modelCode,
    submodelCode: null,
  });

  const chooseSubmodel = (slot: HeavySubmodelSlot) => onChange({
    ...value,
    form: slot.equipmentTypeLabel,
    detail: slot.detailTypeLabel,
    maker: manufacturer?.name ?? value.maker,
    model: slot.modelLabel,
    submodel: slot.submodelLabel,
    equipmentTypeCode: slot.equipmentTypeCode,
    detailTypeCode: slot.detailTypeCode,
    manufacturerCode: slot.manufacturerCode,
    modelCode: slot.modelCode,
    submodelCode: slot.submodelCode,
  });

  const clearCurrent = () => {
    if (value.submodelCode) {
      onChange({ ...value, form: null, detail: null, submodel: null, equipmentTypeCode: null, detailTypeCode: null, submodelCode: null });
      return;
    }
    if (value.modelCode) {
      onChange({ ...value, model: null, submodel: null, modelCode: null, submodelCode: null });
      return;
    }
    onChange({ ...value, maker: null, model: null, submodel: null, manufacturerCode: null, modelCode: null, submodelCode: null });
  };

  const resultCount = heavyRowsFor(value).length;

  return (
    <section className="heavy-qf" aria-label={`건설기계 ${depth} 빠른 선택`}>
      <div className="heavy-qf-heading">
        <div>
          <strong>{depth}</strong>
          <span>제조사 원본 · 초톳 슬롯 v06</span>
        </div>
        <div className="heavy-qf-actions">
          {value.manufacturerCode ? <button type="button" onClick={clearCurrent}>선택 해제</button> : null}
          <button type="button" onClick={() => onChange(emptyHeavySelection)}>전체 초기화</button>
        </div>
      </div>

      {!value.manufacturerCode ? (
        <div className="heavy-qf-track" role="list" aria-label="제조사 로고 10개">
          {approvedHeavyManufacturers.map((slot) => {
            const count = heavyRowsFor({
              equipmentTypeCode: value.equipmentTypeCode,
              detailTypeCode: value.detailTypeCode,
              manufacturerCode: slot.manufacturerCode,
            }).length;
            const logoCandidates: HeavyImageCandidate[] = [{ file: `logos/${slot.logoFile}`, fallbackLevel: 0, label: "제조사 로고" }];
            return (
              <button key={slot.manufacturerCode} type="button" className="heavy-qf-card is-logo" onClick={() => chooseManufacturer(slot.manufacturerCode)} role="listitem" data-manufacturer-code={slot.manufacturerCode} aria-label={`${slot.name} ${count}대`}>
                <span className="heavy-qf-symbol"><HeavySlotImage candidates={logoCandidates} alt={`${slot.name} 로고`} /></span>
                <strong>{slot.name}</strong>
              </button>
            );
          })}
        </div>
      ) : !value.modelCode && modelGroups.length ? (
        <div className="heavy-qf-track" role="list" aria-label={`${manufacturer?.name ?? ""} 모델 이미지`}>
          {modelGroups.map(({ slot, count }) => (
            <button key={slot.modelCode} type="button" className="heavy-qf-card is-machine" onClick={() => chooseModel(slot)} role="listitem" data-model-code={slot.modelCode}>
              <span className="heavy-qf-symbol"><HeavySlotImage candidates={heavyImageCandidates(slot, "model")} alt={`${slot.modelLabel} 모델`} /></span>
              <strong>{slot.modelLabel}</strong>
              <small>{count.toLocaleString("ko-KR")}대</small>
            </button>
          ))}
        </div>
      ) : value.modelCode && !value.submodelCode && submodels.length ? (
        <div className="heavy-qf-track" role="list" aria-label={`${value.model ?? ""} 세부모델과 세부 형식 이미지`}>
          {submodels.map((slot) => (
            <button key={slot.submodelCode} type="button" className="heavy-qf-card is-machine" onClick={() => chooseSubmodel(slot)} role="listitem" data-submodel-code={slot.submodelCode} data-equipment-type-code={slot.equipmentTypeCode} data-detail-type-code={slot.detailTypeCode}>
              <span className="heavy-qf-symbol"><HeavySlotImage candidates={heavyImageCandidates(slot, "submodel")} alt={`${slot.submodelLabel} 세부 형식`} /></span>
              <strong>{slot.submodelLabel}</strong>
              <small>{slot.detailTypeLabel} · {slot.scenarioIds.length}대</small>
            </button>
          ))}
        </div>
      ) : selectedSubmodel ? (
        <button type="button" className="heavy-qf-complete" onClick={clearCurrent}>
          <span className="heavy-qf-symbol"><HeavySlotImage candidates={heavyImageCandidates(selectedSubmodel, "submodel")} alt={selectedSubmodel.submodelLabel} /></span>
          <strong>{manufacturer?.name} {selectedSubmodel.submodelLabel}</strong>
          <small>{selectedSubmodel.equipmentTypeLabel} · {selectedSubmodel.detailTypeLabel} · {resultCount}대</small>
        </button>
      ) : (
        <div className="heavy-qf-zero" role="status">
          <strong>조건에 맞는 모델이 없습니다.</strong>
          <span>v04 가상 매물 30대 기준 0건입니다. 다른 제조사를 선택해 주세요.</span>
          <button type="button" onClick={clearCurrent}>제조사 선택 해제</button>
        </div>
      )}
    </section>
  );
}
