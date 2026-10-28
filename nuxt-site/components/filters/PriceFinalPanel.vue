<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-price.tsx 의 PriceFinalPanel. onChange → emit("change", next)
// 가격 본문은 모바일 바텀시트와 PC 중앙 모달이 완전히 같은 컴포넌트를 공유한다.
// presets: 카테고리별 가격 구간(부품·용품은 만원 단위). 없으면 승용 구간. hideTabs: 리스·렌트가 없는 카테고리
import { computed } from "vue";
import { bbmPricePresetRange, setBbmRange, type BbmFilterValues } from "@proto/filters/bbm-filter-state";
import { PRICE_PRESETS, PRICE_TABS, priceInvalid } from "../../lib/filters/bbm-price";
import PriceField from "./PriceField.vue";
import "@proto/filters/bbm-mileage.css";
import "@proto/filters/bbm-price.css";

const props = withDefaults(defineProps<{ value: BbmFilterValues; presets?: string[]; hideTabs?: boolean }>(), { presets: () => PRICE_PRESETS, hideTabs: false });
const emit = defineEmits<{ change: [next: BbmFilterValues] }>();
const range = computed(() => props.value.ranges.price ?? { min: "", max: "" });
const pickPreset = (preset: string) => {
  if (preset === "전체" || range.value.preset === preset) return emit("change", setBbmRange(props.value, "price", { min: "", max: "" }));
  emit("change", setBbmRange(props.value, "price", bbmPricePresetRange(preset)));
};
const type = (key: "min" | "max", text: string) => emit("change", setBbmRange(props.value, "price", { min: range.value.min, max: range.value.max, [key]: text }));
const isSelected = (preset: string) => preset === "전체" ? !range.value.min && !range.value.max : range.value.preset === preset;
</script>
<template>
  <div class="pf-panel">
    <div v-if="!hideTabs" class="pf-tabs" role="tablist" aria-label="가격 종류">
      <button v-for="tab in PRICE_TABS" :key="tab" type="button" role="tab" :aria-selected="value.priceTab === tab" :class="value.priceTab === tab ? 'is-selected' : ''" @click="emit('change', { ...value, priceTab: tab })">{{ tab }}</button>
    </div>
    <div class="pf-input-block">
      <div class="pf-inputs"><PriceField label="최저 가격" :value="range.min" @change="type('min', $event)" /><span class="pf-sep" aria-hidden="true">–</span><PriceField label="최고 가격" :value="range.max" @change="type('max', $event)" /></div>
      <p v-if="priceInvalid(value)" class="pf-error" role="alert">최저 가격이 최고 가격보다 높습니다.</p>
    </div>
    <p class="pf-guide">원하는 가격을 직접 입력하거나 구간을 선택하세요.</p>
    <div class="pf-chips" role="group" aria-label="가격 구간">
      <button v-for="preset in presets" :key="preset" type="button" :class="isSelected(preset) ? 'is-selected' : ''" :aria-pressed="isSelected(preset)" @click="pickPreset(preset)">{{ preset === "9천만원~" ? "9천만원 이상" : preset }}</button>
    </div>
  </div>
</template>
