<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-filter-parts.tsx 의 BbmUnitField. onChange → emit("change", next)
// 리액트 제어 입력처럼: 부모가 값을 바꾸지 않으면 입력칸을 원래 값으로 되돌린다
import { nextTick } from "vue";
import { asset } from "@proto/data";
import "@proto/filters/bbm-filter-parts.css";

const props = defineProps<{ value: string; placeholder: string; unit: string }>();
const emit = defineEmits<{ change: [next: string] }>();
const chevronStyle = { "--bb-icon": `url("${asset("icons/bb/chevron-down.svg")}")`, "--bb-size": "18px" };
const onInput = (event: Event) => {
  const input = event.currentTarget as HTMLInputElement;
  emit("change", input.value.replace(/[^0-9.,]/g, ""));
  void nextTick(() => { if (input.value !== props.value) input.value = props.value; });
};
</script>
<template>
  <label class="bbmf-unit-field">
    <input inputmode="numeric" :value="value" :placeholder="placeholder" :aria-label="`${placeholder} ${unit}`" @input="onInput">
    <span class="bbmf-unit">{{ unit }}</span>
    <span class="bb-icon bbmf-unit-chevron" :style="chevronStyle" aria-hidden="true" />
  </label>
</template>
