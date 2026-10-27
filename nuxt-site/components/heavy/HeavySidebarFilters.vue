<script setup lang="ts">
// 리액트 src/prototype/heavy/sidebar.tsx 의 HeavySidebarFilters. onChange → emit("change", next)
import { computed, ref } from "vue";
import { emptyHeavySelection, heavyDetailCodeFor, heavyDetailsFor, heavyFormLabelByCode, heavyInventory, heavyRowsFor, type HeavySelection } from "@proto/heavy/data";
import { approvedHeavyManufacturers } from "@proto/heavy/manifest";
import { heavyTypeQuickFilters } from "@proto/heavy";

const props = defineProps<{ value: HeavySelection }>();
const emit = defineEmits<{ change: [next: HeavySelection] }>();
const onChange = (next: HeavySelection) => emit("change", next);
const typesOpen = ref(true);
const makersOpen = ref(true);
// Keep the image rail's order, with existing inventory-only types accessible too.
const types: Array<{ code: string; label: string }> = heavyTypeQuickFilters.map(({ code, label }) => ({ code, label }));
for (const row of heavyInventory) {
  if (!types.some((type) => type.code === row.equipmentTypeCode)) types.push({ code: row.equipmentTypeCode, label: row.form });
}
const makers = approvedHeavyManufacturers.map((maker) => ({ code: maker.manufacturerCode, label: maker.name }));
for (const row of heavyInventory) {
  if (!makers.some((maker) => maker.code === row.manufacturerCode)) makers.push({ code: row.manufacturerCode, label: row.maker });
}
const typeScope = computed(() => ({ equipmentTypeCode: props.value.equipmentTypeCode, form: props.value.form, detailTypeCode: props.value.detailTypeCode, detail: props.value.detail }));
const chooseType = (code: string) => {
  if (props.value.equipmentTypeCode === code) { onChange(emptyHeavySelection); return; }
  const form = heavyFormLabelByCode[code];
  if (!form) return;
  const options = heavyDetailsFor(form);
  const detail = options.length <= 1 ? options[0] ?? "전체" : null;
  onChange({ ...emptyHeavySelection, equipmentTypeCode: code, form, detail, detailTypeCode: detail ? heavyDetailCodeFor(form, detail) : null });
};
const chooseDetail = (detail: string) => {
  const value = props.value;
  if (!value.form) return;
  const selected = value.detail === detail;
  onChange({ ...emptyHeavySelection, form: value.form, equipmentTypeCode: value.equipmentTypeCode, detail: selected ? null : detail, detailTypeCode: selected ? null : heavyDetailCodeFor(value.form, detail) });
};
const clearMaker = () => onChange({ ...props.value, maker: null, manufacturerCode: null, model: null, modelCode: null, submodel: null, submodelCode: null });
const typeRows = computed(() => types.map((type) => {
  const details = heavyDetailsFor(heavyFormLabelByCode[type.code]);
  return {
    type,
    selected: props.value.equipmentTypeCode === type.code,
    count: heavyRowsFor({ equipmentTypeCode: type.code }).length,
    details: ["전체", ...details.filter((detail) => detail !== "전체")].map((detail) => ({ detail, count: heavyRowsFor({ equipmentTypeCode: type.code, detail }).length })),
    hasDetails: details.length > 1,
  };
}));
const makerRows = computed(() => makers.map((maker) => {
  const rows = heavyRowsFor({ ...typeScope.value, manufacturerCode: maker.code });
  const models = Array.from(new Map(rows.map((row) => [row.modelCode, row])).values());
  return { maker, rows, models, selected: props.value.manufacturerCode === maker.code };
}));
const chooseMaker = (maker: { code: string; label: string }, selected: boolean) => selected ? clearMaker() : onChange({ ...props.value, maker: maker.label, manufacturerCode: maker.code, model: null, modelCode: null, submodel: null, submodelCode: null });
const chooseModel = (row: { modelCode: string; model: string }) => onChange({ ...props.value, model: props.value.modelCode === row.modelCode ? null : row.model, modelCode: props.value.modelCode === row.modelCode ? null : row.modelCode, submodel: null, submodelCode: null });
</script>
<template>
  <section :class="`bbm-filter-item heavy-sidebar-section${typesOpen ? ' is-open' : ''}`" aria-label="건설기계 유형·형식 필터">
    <button type="button" class="bbm-filter-toggle" :aria-expanded="typesOpen" @click="typesOpen = !typesOpen"><span>유형 · 형식</span><span class="heavy-sidebar-chevron" aria-hidden="true">⌄</span></button>
    <div v-if="typesOpen" class="heavy-sidebar-options" role="group" aria-label="건설기계 유형">
      <button type="button" class="heavy-sidebar-option" :aria-pressed="!value.equipmentTypeCode" @click="onChange(emptyHeavySelection)"><span>전체 유형</span><small>{{ heavyInventory.length }}</small></button>
      <div v-for="row in typeRows" :key="row.type.code">
        <button type="button" class="heavy-sidebar-option" :aria-pressed="row.selected" @click="chooseType(row.type.code)"><span>{{ row.type.label }}</span><small>{{ row.count }}</small></button>
        <div v-if="row.selected && row.hasDetails" class="heavy-sidebar-details" role="group" :aria-label="`${row.type.label} 세부 형식`">
          <button v-for="item in row.details" :key="item.detail" type="button" class="heavy-sidebar-option" :aria-pressed="value.detail === item.detail" @click="chooseDetail(item.detail)"><span>{{ item.detail }}</span><small>{{ item.count }}</small></button>
        </div>
      </div>
    </div>
  </section>
  <section :class="`bbm-filter-item heavy-sidebar-section${makersOpen ? ' is-open' : ''}`" aria-label="건설기계 제조사·모델 필터">
    <button type="button" class="bbm-filter-toggle" :aria-expanded="makersOpen" @click="makersOpen = !makersOpen"><span>제조사 · 모델</span><span class="heavy-sidebar-chevron" aria-hidden="true">⌄</span></button>
    <div v-if="makersOpen" class="heavy-sidebar-options" role="group" aria-label="건설기계 제조사">
      <button type="button" class="heavy-sidebar-option" :aria-pressed="!value.manufacturerCode" @click="clearMaker"><span>전체 제조사</span><small>{{ heavyRowsFor(typeScope).length }}</small></button>
      <div v-for="row in makerRows" :key="row.maker.code">
        <button type="button" class="heavy-sidebar-option" :aria-pressed="row.selected" @click="chooseMaker(row.maker, row.selected)"><span>{{ row.maker.label }}</span><small>{{ row.rows.length }}</small></button>
        <div v-if="row.selected" class="heavy-sidebar-details" role="group" :aria-label="`${row.maker.label} 모델`">
          <button v-for="model in row.models" :key="model.modelCode" type="button" class="heavy-sidebar-option" :aria-pressed="value.modelCode === model.modelCode" @click="chooseModel(model)"><span>{{ model.model }}</span><small>{{ row.rows.filter((item) => item.modelCode === model.modelCode).length }}</small></button>
          <p v-if="!row.models.length" class="heavy-sidebar-empty">등록된 모델이 없습니다.</p>
        </div>
      </div>
    </div>
  </section>
</template>
