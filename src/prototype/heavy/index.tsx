import { useState } from "react";
import {
  approvedHeavyManufacturers,
  approvedHeavySubmodels,
  heavyImageCandidates,
  type HeavyImageCandidate,
  type HeavySubmodelSlot,
} from "./manifest";
import {
  emptyHeavySelection,
  heavyDetailCodeFor,
  heavyDetailsFor,
  heavyFormLabelByCode,
  heavyRowsFor,
  type HeavySelection,
} from "./data";
import "./heavy.css";

type HeavyQuickFilterProps = { value: HeavySelection; onChange: (next: HeavySelection) => void };
const heavyAsset = (fileName: string) => `${import.meta.env.BASE_URL}assets/heavy/${fileName}`;

const heavyTypeQuickFilters = [
  { code: "hydraulic_excavator", label: "굴착기", imageFile: "types/v04/web/heavy_excavator_side_v04.png" },
  { code: "bulldozer", label: "불도저", imageFile: "types/v04/web/heavy_bulldozer_side_v04.png" },
  { code: "wheel_loader", label: "로더", imageFile: "types/v04/web/heavy_loader_side_v04.png" },
  { code: "forklift", label: "지게차", imageFile: "types/v04/web/heavy_forklift_side_v04.png" },
  { code: "scraper", label: "스크레이퍼", imageFile: "types/v04/web/heavy_scraper_side_v04.png" },
  { code: "dump_truck", label: "덤프트럭", imageFile: "types/v04/web/heavy_dump_truck_side_v04.png" },
  { code: "crawler_crane", label: "기중기", imageFile: "types/v04/web/heavy_crane_side_v04.png" },
  { code: "motor_grader", label: "모터그레이더", imageFile: "types/v04/web/heavy_motor_grader_side_v04.png" },
  { code: "vibratory_roller", label: "롤러", imageFile: "types/v04/web/heavy_roller_side_v04.png" },
  { code: "soil_stabilizer", label: "노상안정기", imageFile: "types/v04/web/heavy_soil_stabilizer_side_v04.png" },
  { code: "concrete_batching_plant", label: "콘크리트뱃칭플랜트", imageFile: "types/v04/web/heavy_concrete_batching_plant_side_v04.png" },
  { code: "concrete_finisher", label: "콘크리트피니셔", imageFile: "types/v04/web/heavy_concrete_finisher_side_v04.png" },
  { code: "concrete_spreader", label: "콘크리트살포기", imageFile: "types/v04/web/heavy_concrete_spreader_side_v04.png" },
  { code: "concrete_mixer_truck", label: "콘크리트믹서트럭", imageFile: "types/v04/web/heavy_concrete_mixer_truck_side_v04.png" },
  { code: "concrete_pump", label: "콘크리트펌프", imageFile: "types/v04/web/heavy_concrete_pump_side_v04.png" },
  { code: "asphalt_mixing_plant", label: "아스팔트믹싱플랜트", imageFile: "types/v04/web/heavy_asphalt_mixing_plant_side_v04.png" },
  { code: "asphalt_finisher", label: "아스팔트피니셔", imageFile: "types/v04/web/heavy_asphalt_finisher_side_v04.png" },
  { code: "asphalt_distributor", label: "아스팔트살포기", imageFile: "types/v04/web/heavy_asphalt_distributor_side_v04.png" },
  { code: "aggregate_spreader", label: "골재살포기", imageFile: "types/v04/web/heavy_aggregate_spreader_side_v04.png" },
  { code: "crusher", label: "쇄석기", imageFile: "types/v04/web/heavy_crusher_side_v04.png" },
  { code: "air_compressor", label: "공기압축기", imageFile: "types/v04/web/heavy_air_compressor_side_v04.png" },
  { code: "drilling_rig", label: "천공기", imageFile: "types/v04/web/heavy_drilling_rig_side_v04.png" },
  { code: "pile_driver", label: "항타 및 항발기", imageFile: "types/v04/web/heavy_pile_driver_side_v04.png" },
  { code: "gravel_collector", label: "자갈채취기", imageFile: "types/v04/web/heavy_gravel_collector_side_v04.png" },
  { code: "dredger", label: "준설선", imageFile: "types/v04/web/heavy_dredger_side_v04.png" },
  { code: "special_equipment", label: "특수건설기계", imageFile: "types/v04/web/heavy_special_equipment_side_v04.png" },
  { code: "tower_crane", label: "타워크레인", imageFile: "types/v04/web/heavy_tower_crane_side_v04.png" },
] as const;

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
  const detailOptions = heavyDetailsFor(value.form);
  const modelGroups = modelGroupsFor(value);
  const submodels = approvedHeavySubmodels.filter((slot) =>
    slot.manufacturerCode === value.manufacturerCode
    && slot.modelCode === value.modelCode
    && (!value.equipmentTypeCode || slot.equipmentTypeCode === value.equipmentTypeCode)
    && (!value.detailTypeCode || value.detailTypeCode === "all" || slot.detailTypeCode === value.detailTypeCode));
  const selectedSubmodel = approvedHeavySubmodels.find((slot) => slot.submodelCode === value.submodelCode);

  const depth = !value.equipmentTypeCode
    ? "유형"
    : !value.detailTypeCode && detailOptions.length > 1
      ? "세부 유형"
      : !value.manufacturerCode
        ? "제조사"
        : !value.modelCode
          ? "모델"
          : !value.submodelCode
            ? "세부모델"
            : "선택 완료";

  const chooseEquipmentType = (equipmentTypeCode: string) => {
    const form = heavyFormLabelByCode[equipmentTypeCode] ?? null;
    if (!form) return;
    const options = heavyDetailsFor(form);
    const autoDetail = options.length <= 1 ? options[0] ?? "전체" : null;
    onChange({
      ...emptyHeavySelection,
      form,
      detail: autoDetail,
      equipmentTypeCode,
      detailTypeCode: autoDetail ? heavyDetailCodeFor(form, autoDetail) : null,
    });
  };

  const chooseDetail = (detail: string) => {
    if (!value.form || !value.equipmentTypeCode) return;
    onChange({
      ...value,
      detail,
      detailTypeCode: heavyDetailCodeFor(value.form, detail),
      maker: null,
      model: null,
      submodel: null,
      manufacturerCode: null,
      modelCode: null,
      submodelCode: null,
    });
  };

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
    if (value.manufacturerCode) {
      onChange({ ...value, maker: null, model: null, submodel: null, manufacturerCode: null, modelCode: null, submodelCode: null });
      return;
    }
    if (value.detailTypeCode) {
      onChange({ ...value, detail: null, detailTypeCode: null });
      return;
    }
    onChange(emptyHeavySelection);
  };

  const resultCount = heavyRowsFor(value).length;

  return (
    <section className="heavy-qf" aria-label={`건설기계 ${depth} 빠른 선택`}>
      {!value.equipmentTypeCode ? (
        <div className="heavy-qf-track is-type-track" role="list" aria-label="건설기계 법정 유형 27개">
          {heavyTypeQuickFilters.map((type) => {
            const count = heavyRowsFor({ equipmentTypeCode: type.code }).length;
            const imageCandidates: HeavyImageCandidate[] = [{ file: type.imageFile, fallbackLevel: 0, label: "건설기계 유형 이미지" }];
            return (
              <button key={type.code} type="button" className="heavy-qf-card is-type" onClick={() => chooseEquipmentType(type.code)} role="listitem" data-equipment-type-code={type.code} aria-label={`${type.label} ${count}대`}>
                <span className="heavy-qf-symbol"><HeavySlotImage candidates={imageCandidates} alt={`${type.label} 유형`} /></span>
                <strong>{type.label}</strong>
              </button>
            );
          })}
        </div>
      ) : !value.detailTypeCode && detailOptions.length > 1 ? (
        <div className="heavy-qf-detail-track" role="list" aria-label={`${value.form ?? ""} 세부 유형`}>
          {detailOptions.map((detail) => {
            const count = heavyRowsFor({ equipmentTypeCode: value.equipmentTypeCode, detail: detail === "전체" ? null : detail }).length;
            return (
              <button key={detail} type="button" className="heavy-qf-detail-chip" onClick={() => chooseDetail(detail)} role="listitem" aria-label={`${detail} ${count}대`}>
                {detail}
              </button>
            );
          })}
        </div>
      ) : !value.manufacturerCode ? (
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
