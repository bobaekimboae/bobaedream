import { useState } from "react";
import { emptyHeavySelection, heavyDetailCodeFor, heavyDetailsFor, heavyFormLabelByCode, heavyInventory, heavyRowsFor, type HeavySelection } from "./data";
import { approvedHeavyManufacturers } from "./manifest";
import { heavyTypeQuickFilters } from ".";

type Props = { value: HeavySelection; onChange: (next: HeavySelection) => void };

export function HeavySidebarFilters({ value, onChange }: Props) {
  const [typesOpen, setTypesOpen] = useState(true);
  const [makersOpen, setMakersOpen] = useState(true);
  // Keep the image rail's order, with existing inventory-only types accessible too.
  const types: Array<{ code: string; label: string }> = heavyTypeQuickFilters.map(({ code, label }) => ({ code, label }));
  for (const row of heavyInventory) {
    if (!types.some((type) => type.code === row.equipmentTypeCode)) types.push({ code: row.equipmentTypeCode, label: row.form });
  }
  const typeScope = { equipmentTypeCode: value.equipmentTypeCode, form: value.form, detailTypeCode: value.detailTypeCode, detail: value.detail };
  const makers = approvedHeavyManufacturers.map((maker) => ({ code: maker.manufacturerCode, label: maker.name }));
  for (const row of heavyInventory) {
    if (!makers.some((maker) => maker.code === row.manufacturerCode)) makers.push({ code: row.manufacturerCode, label: row.maker });
  }
  const chooseType = (code: string) => {
    if (value.equipmentTypeCode === code) { onChange(emptyHeavySelection); return; }
    const form = heavyFormLabelByCode[code];
    if (!form) return;
    const options = heavyDetailsFor(form);
    const detail = options.length <= 1 ? options[0] ?? "전체" : null;
    onChange({ ...emptyHeavySelection, equipmentTypeCode: code, form, detail, detailTypeCode: detail ? heavyDetailCodeFor(form, detail) : null });
  };
  const chooseDetail = (detail: string) => {
    if (!value.form) return;
    const selected = value.detail === detail;
    onChange({ ...emptyHeavySelection, form: value.form, equipmentTypeCode: value.equipmentTypeCode, detail: selected ? null : detail, detailTypeCode: selected ? null : heavyDetailCodeFor(value.form, detail) });
  };
  const clearMaker = () => onChange({ ...value, maker: null, manufacturerCode: null, model: null, modelCode: null, submodel: null, submodelCode: null });
  return <>
    <section className={`bbm-filter-item heavy-sidebar-section${typesOpen ? " is-open" : ""}`} aria-label="건설기계 유형·형식 필터">
      <button type="button" className="bbm-filter-toggle" aria-expanded={typesOpen} onClick={() => setTypesOpen(!typesOpen)}><span>유형 · 형식</span><span className="heavy-sidebar-chevron" aria-hidden="true">⌄</span></button>
      {typesOpen ? <div className="heavy-sidebar-options" role="group" aria-label="건설기계 유형">
        <button type="button" className="heavy-sidebar-option" aria-pressed={!value.equipmentTypeCode} onClick={() => onChange(emptyHeavySelection)}><span>전체 유형</span><small>{heavyInventory.length}</small></button>
        {types.map((type) => {
          const selected = value.equipmentTypeCode === type.code;
          const details = heavyDetailsFor(heavyFormLabelByCode[type.code]);
          return <div key={type.code}>
            <button type="button" className="heavy-sidebar-option" aria-pressed={selected} onClick={() => chooseType(type.code)}><span>{type.label}</span><small>{heavyRowsFor({ equipmentTypeCode: type.code }).length}</small></button>
            {selected && details.length > 1 ? <div className="heavy-sidebar-details" role="group" aria-label={`${type.label} 세부 형식`}>
              {['전체', ...details.filter((detail) => detail !== '전체')].map((detail) => <button key={detail} type="button" className="heavy-sidebar-option" aria-pressed={value.detail === detail} onClick={() => chooseDetail(detail)}><span>{detail}</span><small>{heavyRowsFor({ equipmentTypeCode: type.code, detail }).length}</small></button>)}
            </div> : null}
          </div>;
        })}
      </div> : null}
    </section>
    <section className={`bbm-filter-item heavy-sidebar-section${makersOpen ? " is-open" : ""}`} aria-label="건설기계 제조사·모델 필터">
      <button type="button" className="bbm-filter-toggle" aria-expanded={makersOpen} onClick={() => setMakersOpen(!makersOpen)}><span>제조사 · 모델</span><span className="heavy-sidebar-chevron" aria-hidden="true">⌄</span></button>
      {makersOpen ? <div className="heavy-sidebar-options" role="group" aria-label="건설기계 제조사">
        <button type="button" className="heavy-sidebar-option" aria-pressed={!value.manufacturerCode} onClick={clearMaker}><span>전체 제조사</span><small>{heavyRowsFor(typeScope).length}</small></button>
        {makers.map((maker) => {
          const selected = value.manufacturerCode === maker.code;
          const rows = heavyRowsFor({ ...typeScope, manufacturerCode: maker.code });
          const models = Array.from(new Map(rows.map((row) => [row.modelCode, row])).values());
          return <div key={maker.code}>
            <button type="button" className="heavy-sidebar-option" aria-pressed={selected} onClick={() => selected ? clearMaker() : onChange({ ...value, maker: maker.label, manufacturerCode: maker.code, model: null, modelCode: null, submodel: null, submodelCode: null })}><span>{maker.label}</span><small>{rows.length}</small></button>
            {selected ? <div className="heavy-sidebar-details" role="group" aria-label={`${maker.label} 모델`}>
              {models.map((row) => <button key={row.modelCode} type="button" className="heavy-sidebar-option" aria-pressed={value.modelCode === row.modelCode} onClick={() => onChange({ ...value, model: value.modelCode === row.modelCode ? null : row.model, modelCode: value.modelCode === row.modelCode ? null : row.modelCode, submodel: null, submodelCode: null })}><span>{row.model}</span><small>{rows.filter((item) => item.modelCode === row.modelCode).length}</small></button>)}
              {!models.length ? <p className="heavy-sidebar-empty">등록된 모델이 없습니다.</p> : null}
            </div> : null}
          </div>;
        })}
      </div> : null}
    </section>
  </>;
}
