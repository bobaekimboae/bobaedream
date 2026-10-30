<script setup lang="ts">
// 리액트 src/prototype/listing/stable-top.tsx 의 StableRegionSheet
// onChange → emit("change", next), onClose → "close", onNearby → "nearby"
// QF-111 모바일 "지역: 전국 ▾" 바텀시트(칩 줄은 추가하지 않음): 1단계 시도 17 알약(3열, 높이 40) + "내 주변"
// → 구·군이 있는 시도: 같은 시트가 2단계("← 서울", "서울 전체"(선택) + 구·군 3열) → 구·군 누르면 닫힘(칩 [서울 ×][강남구 ×])
// → 세종처럼 구·군이 없으면 1단계에서 바로 적용하고 닫힘
import { computed, ref } from "vue";
import { setBbmChecks, type BbmFilterValues } from "@proto/filters/bbm-filter-state";
import { bbmIcon } from "@proto/listing/bbm-list";
import { STABLE_REGION_OPTIONS, stableRegionState } from "@proto/listing/stable-top";
import regionsKr from "@proto/data/regions-kr.json";
// 의존: 필터 묶음 담당(src/prototype/filters/bbm-filter-parts.tsx 의 BbmSheet → BbmSheet.vue, onBack → show-back + @back)
import BbmSheet from "../filters/BbmSheet.vue";
import "@proto/listing/stable-top.css";
import "@proto/listing/qf-align.css";

const props = defineProps<{ value: BbmFilterValues }>();
const emit = defineEmits<{ change: [next: BbmFilterValues]; close: []; nearby: [] }>();
const districtsOf = (sido: string | null) => (sido ? (regionsKr.districts as Record<string, string[]>)[sido] ?? [] : []);

const current = computed(() => stableRegionState(props.value));
const initial = stableRegionState(props.value);
const step = ref<string | null>(initial.sido && initial.districts.length ? initial.sido : null);
const pickSido = (name: string) => {
  const next = setBbmChecks(setBbmChecks(props.value, "district", []), "region", [name]);
  emit("change", next);
  if (districtsOf(name).length) step.value = name; else emit("close");
};
const stepDistrictName = computed(() => (step.value && props.value.checks.region?.[0] === step.value ? stableRegionState(props.value).districtName : null));
const pickAll = () => {
  if (!step.value) return;
  emit("change", setBbmChecks(setBbmChecks(props.value, "region", [step.value]), "district", []));
  emit("close");
};
const pickDistrict = (name: string) => {
  if (!step.value) return;
  emit("change", setBbmChecks(setBbmChecks(props.value, "region", [step.value]), "district", [`${step.value} ${name}`]));
  emit("close");
};
</script>
<template>
  <BbmSheet v-if="step" :title="step" show-back @back="step = null" @close="emit('close')">
    <div class="stable-region-grid">
      <button type="button" :class="`stable-region-cell is-all${stepDistrictName ? '' : ' is-selected'}`" :aria-pressed="!stepDistrictName" @click="pickAll">{{ step }} 전체</button>
      <button v-for="name in districtsOf(step)" :key="name" type="button" :class="`stable-region-cell${stepDistrictName === name ? ' is-selected' : ''}`" :aria-pressed="stepDistrictName === name" @click="pickDistrict(name)">{{ name }}</button>
    </div>
  </BbmSheet>
  <BbmSheet v-else title="지역" @close="emit('close')">
    <div class="stable-region-grid">
      <button v-for="name in STABLE_REGION_OPTIONS" :key="name" type="button" :class="`stable-region-cell${current.sido === name ? ' is-selected' : ''}`" :aria-pressed="current.sido === name" @click="pickSido(name)">{{ name }}</button>
      <button type="button" class="stable-region-cell is-nearby" @click="emit('nearby')"><img :src="bbmIcon('m-region-location')" alt="" aria-hidden="true" />내 주변</button>
    </div>
  </BbmSheet>
</template>
