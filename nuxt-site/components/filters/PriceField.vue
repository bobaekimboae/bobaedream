<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-price.tsx 의 PriceField(내보내지 않은 부품). onChange → emit("change", next)
// 리액트 제어 입력처럼: 부모가 값을 바꾸지 않으면 입력칸을 원래 값으로 되돌린다
import { nextTick } from "vue";
import { comma } from "../../lib/filters/bbm-price";
import "@proto/filters/bbm-mileage.css";
import "@proto/filters/bbm-price.css";

const props = defineProps<{ label: string; value: string }>();
const emit = defineEmits<{ change: [next: string] }>();
const onInput = (event: Event) => {
  const input = event.currentTarget as HTMLInputElement;
  emit("change", comma(input.value));
  void nextTick(() => { if (input.value !== props.value) input.value = props.value; });
};
</script>
<template>
  <label :class="`pf-field${value ? ' has-value' : ''}`">
    <input inputmode="numeric" autocomplete="off" :value="value" :aria-label="label" @input="onInput">
    <span class="pf-floating" aria-hidden="true">{{ label }}</span><span class="pf-unit" aria-hidden="true">만원</span>
  </label>
</template>
