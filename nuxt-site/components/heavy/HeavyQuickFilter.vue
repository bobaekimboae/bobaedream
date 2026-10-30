<script setup lang="ts">
// 리액트 src/prototype/heavy/index.tsx 의 HeavyQuickFilter. onChange → emit("change", next)
import { computed } from "vue";
import { approvedHeavyManufacturers, approvedHeavySubmodels, heavyImageCandidates, type HeavyImageCandidate, type HeavySubmodelSlot } from "@proto/heavy/manifest";
import { emptyHeavySelection, heavyDetailCodeFor, heavyDetailsFor, heavyFormLabelByCode, heavyRowsFor, type HeavySelection } from "@proto/heavy/data";
import { heavyTypeQuickFilters } from "@proto/heavy";
import HeavySlotImage from "./HeavySlotImage.vue";
import "@proto/heavy/heavy.css";

const props = defineProps<{ value: HeavySelection }>();
const emit = defineEmits<{ change: [next: HeavySelection] }>();
const onChange = (next: HeavySelection) => emit("change", next);

// 원본 파일 안의 내보내지 않은 계산 함수(복사)
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

const manufacturer = computed(() => approvedHeavyManufacturers.find((slot) => slot.manufacturerCode === props.value.manufacturerCode));
const detailOptions = computed(() => heavyDetailsFor(props.value.form));
const modelGroups = computed(() => modelGroupsFor(props.value));
const submodels = computed(() => approvedHeavySubmodels.filter((slot) =>
  slot.manufacturerCode === props.value.manufacturerCode
  && slot.modelCode === props.value.modelCode
  && (!props.value.equipmentTypeCode || slot.equipmentTypeCode === props.value.equipmentTypeCode)
  && (!props.value.detailTypeCode || props.value.detailTypeCode === "all" || slot.detailTypeCode === props.value.detailTypeCode)));
const selectedSubmodel = computed(() => approvedHeavySubmodels.find((slot) => slot.submodelCode === props.value.submodelCode));

const depth = computed(() => {
  const value = props.value;
  return !value.equipmentTypeCode
    ? "유형"
    : !value.detailTypeCode && detailOptions.value.length > 1
      ? "세부 유형"
      : !value.manufacturerCode
        ? "제조사"
        : !value.modelCode
          ? "모델"
          : !value.submodelCode
            ? "세부모델"
            : "선택 완료";
});

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
  const value = props.value;
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
    ...props.value,
    maker: slot.name,
    model: null,
    submodel: null,
    manufacturerCode: slot.manufacturerCode,
    modelCode: null,
    submodelCode: null,
  });
};

const chooseModel = (slot: HeavySubmodelSlot) => onChange({
  ...props.value,
  maker: manufacturer.value?.name ?? props.value.maker,
  model: slot.modelLabel,
  submodel: null,
  manufacturerCode: slot.manufacturerCode,
  modelCode: slot.modelCode,
  submodelCode: null,
});

const chooseSubmodel = (slot: HeavySubmodelSlot) => onChange({
  ...props.value,
  form: slot.equipmentTypeLabel,
  detail: slot.detailTypeLabel,
  maker: manufacturer.value?.name ?? props.value.maker,
  model: slot.modelLabel,
  submodel: slot.submodelLabel,
  equipmentTypeCode: slot.equipmentTypeCode,
  detailTypeCode: slot.detailTypeCode,
  manufacturerCode: slot.manufacturerCode,
  modelCode: slot.modelCode,
  submodelCode: slot.submodelCode,
});

const clearCurrent = () => {
  const value = props.value;
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

const resultCount = computed(() => heavyRowsFor(props.value).length);
const shadowCard = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("qfbrand") === "shadowcard";

const typeCards = computed(() => heavyTypeQuickFilters.map((type) => ({
  type,
  count: heavyRowsFor({ equipmentTypeCode: type.code }).length,
  imageCandidates: [{ file: type.imageFile, fallbackLevel: 0, label: "건설기계 유형 이미지" }] as HeavyImageCandidate[],
})));
const detailChips = computed(() => detailOptions.value.map((detail) => ({
  detail,
  count: heavyRowsFor({ equipmentTypeCode: props.value.equipmentTypeCode, detail: detail === "전체" ? null : detail }).length,
})));
const makerCards = computed(() => approvedHeavyManufacturers.map((slot) => ({
  slot,
  count: heavyRowsFor({
    equipmentTypeCode: props.value.equipmentTypeCode,
    detailTypeCode: props.value.detailTypeCode,
    manufacturerCode: slot.manufacturerCode,
  }).length,
  logoCandidates: [{ file: `logos/${slot.logoFile}`, fallbackLevel: 0, label: "제조사 로고" }] as HeavyImageCandidate[],
})));
</script>
<template>
  <section :class="`heavy-qf${shadowCard ? ' is-shadowcard' : ''}`" :aria-label="`건설기계 ${depth} 빠른 선택`">
    <div v-if="!value.equipmentTypeCode" class="heavy-qf-track is-type-track" role="list" aria-label="건설기계 법정 유형 27개">
      <button v-for="{ type, count, imageCandidates } in typeCards" :key="type.code" type="button" class="heavy-qf-card is-type" role="listitem" :data-equipment-type-code="type.code" :aria-label="`${type.label} ${count}대`" @click="chooseEquipmentType(type.code)">
        <span class="heavy-qf-symbol"><HeavySlotImage :candidates="imageCandidates" :alt="`${type.label} 유형`" /></span>
        <strong>{{ type.label }}</strong>
        <small v-if="shadowCard">({{ count }})</small>
      </button>
    </div>
    <div v-else-if="!value.detailTypeCode && detailOptions.length > 1" class="heavy-qf-detail-track" role="list" :aria-label="`${value.form ?? ''} 세부 유형`">
      <button v-for="{ detail, count } in detailChips" :key="detail" type="button" class="heavy-qf-detail-chip" role="listitem" :aria-label="`${detail} ${count}대`" @click="chooseDetail(detail)">{{ detail }}</button>
    </div>
    <div v-else-if="!value.manufacturerCode" class="heavy-qf-track" role="list" aria-label="제조사 로고 10개">
      <button v-for="{ slot, count, logoCandidates } in makerCards" :key="slot.manufacturerCode" type="button" class="heavy-qf-card is-logo" role="listitem" :data-manufacturer-code="slot.manufacturerCode" :aria-label="`${slot.name} ${count}대`" @click="chooseManufacturer(slot.manufacturerCode)">
        <span class="heavy-qf-symbol"><HeavySlotImage :candidates="logoCandidates" :alt="`${slot.name} 로고`" /></span>
        <strong>{{ slot.name }}</strong>
        <small v-if="shadowCard">({{ count }})</small>
      </button>
    </div>
    <div v-else-if="!value.modelCode && modelGroups.length" class="heavy-qf-track" role="list" :aria-label="`${manufacturer?.name ?? ''} 모델 이미지`">
      <button v-for="{ slot, count } in modelGroups" :key="slot.modelCode" type="button" class="heavy-qf-card is-machine" role="listitem" :data-model-code="slot.modelCode" @click="chooseModel(slot)">
        <span class="heavy-qf-symbol"><HeavySlotImage :candidates="heavyImageCandidates(slot, 'model')" :alt="`${slot.modelLabel} 모델`" /></span>
        <strong>{{ slot.modelLabel }}</strong>
        <small>{{ count.toLocaleString("ko-KR") }}대</small>
      </button>
    </div>
    <div v-else-if="value.modelCode && !value.submodelCode && submodels.length" class="heavy-qf-track" role="list" :aria-label="`${value.model ?? ''} 세부모델과 세부 형식 이미지`">
      <button v-for="slot in submodels" :key="slot.submodelCode" type="button" class="heavy-qf-card is-machine" role="listitem" :data-submodel-code="slot.submodelCode" :data-equipment-type-code="slot.equipmentTypeCode" :data-detail-type-code="slot.detailTypeCode" @click="chooseSubmodel(slot)">
        <span class="heavy-qf-symbol"><HeavySlotImage :candidates="heavyImageCandidates(slot, 'submodel')" :alt="`${slot.submodelLabel} 세부 형식`" /></span>
        <strong>{{ slot.submodelLabel }}</strong>
        <small>{{ slot.detailTypeLabel }} · {{ slot.scenarioIds.length }}대</small>
      </button>
    </div>
    <button v-else-if="selectedSubmodel" type="button" class="heavy-qf-complete" @click="clearCurrent">
      <span class="heavy-qf-symbol"><HeavySlotImage :candidates="heavyImageCandidates(selectedSubmodel, 'submodel')" :alt="selectedSubmodel.submodelLabel" /></span>
      <strong>{{ manufacturer?.name }} {{ selectedSubmodel.submodelLabel }}</strong>
      <small>{{ selectedSubmodel.equipmentTypeLabel }} · {{ selectedSubmodel.detailTypeLabel }} · {{ resultCount }}대</small>
    </button>
    <div v-else class="heavy-qf-zero" role="status">
      <strong>조건에 맞는 모델이 없습니다.</strong>
      <span>v04 가상 매물 30대 기준 0건입니다. 다른 제조사를 선택해 주세요.</span>
      <button type="button" @click="clearCurrent">제조사 선택 해제</button>
    </div>
  </section>
</template>
