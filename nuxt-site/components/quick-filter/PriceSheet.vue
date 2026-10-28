<script setup lang="ts">
// 리액트 src/prototype/quick-filter/index.tsx 의 PriceSheet
// onChange → emit("change", value), onClose → "close", onReset → "reset", onConfirm → "confirm"
import { computed, nextTick } from "vue";
import { formatPriceValue, pricePresets, priceSteps, type PriceSelection } from "@proto/data";
import Icon from "../shared/Icon.vue";

const props = defineProps<{ value: PriceSelection; resultCount: number }>();
const emit = defineEmits<{ change: [value: PriceSelection]; close: []; reset: []; confirm: [] }>();

const minIndex = computed(() => Math.max(0, priceSteps.indexOf(props.value.min)));
const maxIndex = computed(() => (props.value.max === null ? priceSteps.length - 1 : Math.max(1, priceSteps.indexOf(props.value.max))));
const rangeMax = priceSteps.length - 1;
const rangeStyle = computed(() => ({
  "--price-start": `${(minIndex.value / rangeMax) * 100}%`,
  "--price-end": `${(maxIndex.value / rangeMax) * 100}%`,
}));
const setMinIndex = (nextIndex: number) => {
  const safeIndex = Math.min(nextIndex, maxIndex.value - 1);
  emit("change", { ...props.value, min: priceSteps[safeIndex] });
};
const setMaxIndex = (nextIndex: number) => {
  const safeIndex = Math.max(nextIndex, minIndex.value + 1);
  emit("change", { ...props.value, max: safeIndex === rangeMax ? null : priceSteps[safeIndex] });
};
// 리액트 제어 입력처럼: 부모가 값을 바꾸지 않으면 손잡이를 원래 값으로 되돌린다
const onRange = (event: Event, which: "min" | "max") => {
  const input = event.currentTarget as HTMLInputElement;
  if (which === "min") setMinIndex(Number(input.value)); else setMaxIndex(Number(input.value));
  void nextTick(() => { input.value = String(which === "min" ? minIndex.value : maxIndex.value); });
};
</script>
<template>
  <div class="price-filter-sheet">
    <button class="price-filter-close" type="button" aria-label="가격 필터 닫기" @click="emit('close')"><Icon name="sheet-close.svg" /></button>
    <div class="price-mode-tabs" role="tablist" aria-label="가격 유형">
      <button type="button" role="tab" :aria-selected="value.mode === 'cash'" :class="value.mode === 'cash' ? 'is-selected' : ''" @click="emit('change', { ...value, mode: 'cash' })">현금 차량</button>
      <button type="button" role="tab" :aria-selected="value.mode === 'lease'" :class="value.mode === 'lease' ? 'is-selected' : ''" @click="emit('change', { ...value, mode: 'lease' })">리스/렌트</button>
    </div>
    <div class="price-filter-body">
      <div class="price-input-row" aria-label="선택한 가격 범위">
        <div class="price-input-box"><span>최소</span><strong>{{ formatPriceValue(value.min) }}</strong><b>만원</b></div>
        <span class="price-range-separator">~</span>
        <div class="price-input-box"><span>최대</span><strong>{{ value.max === null ? "전체" : formatPriceValue(value.max) }}</strong><b>만원</b></div>
      </div>
      <div class="price-range" :style="rangeStyle">
        <div class="price-range-line" aria-hidden="true" />
        <input type="range" min="0" :max="rangeMax" step="1" :value="minIndex" aria-label="최소 가격" @input="onRange($event, 'min')" />
        <input type="range" min="0" :max="rangeMax" step="1" :value="maxIndex" aria-label="최대 가격" @input="onRange($event, 'max')" />
        <div class="price-range-labels" aria-hidden="true"><span>0원</span><span>5,000만원</span><span>전체</span></div>
      </div>
      <div class="price-presets" aria-label="추천 가격 범위">
        <button v-for="preset in pricePresets" :key="preset.label" type="button" :class="value.min === preset.min && value.max === preset.max ? 'is-selected' : ''" :aria-pressed="value.min === preset.min && value.max === preset.max" @click="emit('change', { ...value, min: preset.min, max: preset.max })">{{ preset.label }}</button>
      </div>
    </div>
    <div class="price-filter-actions">
      <button type="button" class="price-filter-reset" @click="emit('reset')">초기화</button>
      <button type="button" class="price-filter-confirm" @click="emit('confirm')">{{ resultCount.toLocaleString("ko-KR") }}대 매물 보기</button>
    </div>
  </div>
</template>
