<script setup lang="ts">
// 원본: src/prototype/listing/pc-bbmuseum.tsx BbTruckFormatFilter
// 엔카 화물·특장 PC 좌측 필터(2026-10-18 실동작 대조): 형식 → 세부형식 → 적재용량을 한 단계씩 전환한다(referenceStyle).
// 선택 부모는 × 행으로 남기고, 적재용량은 칩이 아니라 한 줄 체크 행으로 표시한다. 모바일용 2줄 차급 설명은 섞지 않는다.
// value(BbTruckFilter) 안의 onXxx 함수는 데이터 그대로 부른다(emit 아님).
import { ref, watch } from "vue";
import BbIcon from "./BbIcon.vue";
import BbCatalogCount from "./BbCatalogCount.vue";
import BbTruckOptionLabel from "./BbTruckOptionLabel.vue";
import type { BbTruckFilter } from "@proto/listing/pc-bbmuseum";
import { truckFormatImageFor, truckSubtypeImageFor, truckSubtypeSecondaryLabel } from "@proto/data/truck-format-catalog";
import { inlineTruckPayloadSubtypes, type BbTruckView } from "../../lib/listing/pc-bbmuseum-internal";
import { useHalfRowFit } from "../../composables/listing/useHalfRowFit";

const props = withDefaults(defineProps<{ value: BbTruckFilter; showImages?: boolean; referenceStyle?: boolean }>(), { showImages: true, referenceStyle: false });

const stageFor = (): BbTruckView => {
  const value = props.value;
  return !value.format
    ? "format"
    : !value.subtype
      ? "subtype"
      : props.referenceStyle
        ? value.specGroups.length ? "spec" : "complete"
        : inlineTruckPayloadSubtypes.has(value.subtype)
          ? "subtype"
          : value.specGroups.length ? "spec" : "subtype";
};
const view = ref<BbTruckView>(stageFor());
const truckCatalogRef = ref<HTMLDivElement | null>(null);
useHalfRowFit(truckCatalogRef, () => props.referenceStyle, () => [view.value, props.value.format, props.value.subtype, props.value.spec]);
watch(() => [props.value.format, props.value.subtype, props.value.spec, props.value.specGroups.length], () => { view.value = stageFor(); });

const pathChips = () => {
  const value = props.value;
  return [
    value.format ? { key: "format", label: value.format, clear: value.onClearFormat } : null,
    value.subtype ? { key: "subtype", label: value.subtype, clear: value.onClearSubtype } : null,
    value.spec ? { key: "spec", label: value.spec, clear: value.onClearSpec } : null,
  ].filter((chip): chip is NonNullable<typeof chip> => Boolean(chip));
};
const chooseFormat = (name: string) => { props.value.onChooseFormat(name); view.value = "subtype"; };
const formatImage = (name: string) => props.showImages ? truckFormatImageFor(name) : null;
const subtypeImage = (name: string) => props.showImages ? truckSubtypeImageFor(props.value.format, name) : null;
const chooseSubtypeInline = (name: string) => { props.value.onChooseSubtype(name); view.value = inlineTruckPayloadSubtypes.has(name) ? "subtype" : "spec"; };
const chooseSubtypeReference = (name: string) => { props.value.onChooseSubtype(name); view.value = "complete"; };
const stripUnit = (label: string) => label.replace(/\s*\([^)]*\)\s*$/, "");
</script>
<template>
  <div v-if="referenceStyle" class="bbm-maker-grade bbm-truck-format is-reference is-encar" aria-label="형식과 적재용량 선택">
    <div ref="truckCatalogRef" class="bbm-catalog">
      <div v-if="view === 'format'" class="bbm-catalog-section">
        <p class="bbm-catalog-title">형식</p>
        <button v-for="option in value.formats" :key="option.name" type="button" class="bbm-catalog-row" :aria-pressed="false" @click="chooseFormat(option.name)"><BbTruckOptionLabel :name="option.name" :image="null" /><BbCatalogCount :value="option.count" /></button>
      </div>
      <div v-else class="bbm-catalog-section is-drill">
        <button type="button" class="bbm-encar-selected-row" :aria-label="`${value.format} 선택 해제`" @click="value.onClearFormat()">
          <span>{{ value.format }}</span><span class="bbm-encar-selected-x" aria-hidden="true">×</span>
        </button>
        <template v-if="view === 'subtype'">
          <p class="bbm-catalog-title">세부형식</p>
          <button v-for="option in value.subtypes" :key="option.name" type="button" :class="`bbm-catalog-row${value.subtype === option.name ? ' is-selected' : ''}`" :aria-pressed="value.subtype === option.name" @click="chooseSubtypeReference(option.name)">
            <BbTruckOptionLabel :name="option.name" :image="null" />
            <BbCatalogCount :value="option.count" />
          </button>
        </template>
        <template v-else>
          <button type="button" class="bbm-encar-selected-row is-child" :aria-label="`${value.subtype} 선택 해제`" @click="value.onClearSubtype()">
            <span>{{ value.subtype }}</span><span class="bbm-encar-selected-x" aria-hidden="true">×</span>
          </button>
          <div v-for="group in value.specGroups" :key="group.label" class="bbm-grade-group bbm-truck-spec-group is-encar-list">
            <p class="bbm-catalog-title">{{ stripUnit(group.label) }}</p>
            <div class="bbm-truck-spec-list"><button v-for="option in group.options" :key="`${group.label}-${option.name}`" type="button" role="checkbox" :aria-checked="value.spec === option.name" :disabled="option.count === 0" :class="value.spec === option.name ? 'is-selected' : ''" @click="value.onChooseSpec(option.name)">
              <span class="bbm-encar-checkbox" aria-hidden="true">{{ value.spec === option.name ? "✓" : "" }}</span><span class="bbm-truck-spec-name">{{ option.name }}</span><BbCatalogCount :value="option.count" />
            </button></div>
          </div>
        </template>
      </div>
    </div>
  </div>
  <div v-else class="bbm-maker-grade bbm-truck-format" aria-label="형식과 적재용량 선택">
    <div v-if="pathChips().length" class="bbm-path-chips" aria-label="선택한 형식과 적재용량">
      <button v-for="chip in pathChips()" :key="chip.key" type="button" class="bbm-path-chip" :aria-label="`${chip.label} 선택 해제`" @click="chip.clear()"><span>{{ chip.label }}</span><span class="bbm-path-chip-x" aria-hidden="true">×</span></button>
    </div>
    <div class="bbm-catalog">
      <div v-if="view === 'format'" class="bbm-catalog-section">
        <p class="bbm-catalog-title">형식</p>
        <button v-for="option in value.formats" :key="option.name" type="button" :class="`bbm-catalog-row${value.format === option.name ? ' is-selected' : ''}${formatImage(option.name) ? ' has-truck-image' : ''}`" :aria-pressed="value.format === option.name" @click="chooseFormat(option.name)"><BbTruckOptionLabel :name="option.name" :image="formatImage(option.name)" /><BbCatalogCount :value="option.count" /></button>
      </div>
      <div v-else-if="view === 'subtype'" class="bbm-catalog-section is-drill">
        <button type="button" class="bbm-catalog-back" @click="view = 'format'"><BbIcon name="chevron-left" :size="20" />{{ value.format }}</button>
        <p class="bbm-catalog-title">세부형식</p>
        <template v-for="option in value.subtypes" :key="option.name">
          <button type="button" :class="`bbm-catalog-row${value.subtype === option.name ? ' is-selected' : ''}${subtypeImage(option.name) ? ' has-truck-image' : ''}`" :aria-pressed="value.subtype === option.name" :aria-expanded="inlineTruckPayloadSubtypes.has(option.name) ? inlineTruckPayloadSubtypes.has(option.name) && value.subtype === option.name : undefined" @click="chooseSubtypeInline(option.name)">
            <BbTruckOptionLabel :name="option.name" :image="subtypeImage(option.name)" :secondary="truckSubtypeSecondaryLabel(value.format, option.name)" />
            <span class="bbm-truck-option-tail"><BbCatalogCount :value="option.count" /><BbIcon v-if="inlineTruckPayloadSubtypes.has(option.name)" name="chevron-down" :size="16" :class="value.subtype === option.name ? 'is-expanded' : ''" /></span>
          </button>
          <div v-if="inlineTruckPayloadSubtypes.has(option.name) && value.subtype === option.name" class="bbm-truck-inline-payload" :aria-label="`${option.name} 적재중량`">
            <p class="bbm-catalog-title">적재중량</p>
            <div v-for="group in value.specGroups" :key="group.label" class="bbm-truck-spec-chips">
              <button v-for="specOption in group.options" :key="`${group.label}-${specOption.name}`" type="button" :class="value.spec === specOption.name ? 'is-selected' : ''" :aria-pressed="value.spec === specOption.name" @click="value.onChooseSpec(specOption.name)"><span>{{ specOption.name }}</span><BbCatalogCount :value="specOption.count" /></button>
            </div>
          </div>
        </template>
      </div>
      <div v-else class="bbm-catalog-section is-drill">
        <button type="button" class="bbm-catalog-back" @click="view = 'subtype'"><BbIcon name="chevron-left" :size="20" />{{ value.subtype }}</button>
        <div v-for="group in value.specGroups" :key="group.label" class="bbm-grade-group bbm-truck-spec-group">
          <p class="bbm-catalog-title">{{ group.label }}</p>
          <div class="bbm-truck-spec-chips"><button v-for="option in group.options" :key="`${group.label}-${option.name}`" type="button" :class="value.spec === option.name ? 'is-selected' : ''" :aria-pressed="value.spec === option.name" @click="value.onChooseSpec(option.name)"><span>{{ option.name }}</span><BbCatalogCount :value="option.count" /></button></div>
        </div>
      </div>
    </div>
  </div>
</template>
