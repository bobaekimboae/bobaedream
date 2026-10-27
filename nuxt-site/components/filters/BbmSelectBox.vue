<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-filter-parts.tsx 의 BbmSelectBox. onChange → emit("change", next)
// 리액트 제어 select 처럼: 부모가 값을 바꾸지 않으면 원래 값으로 되돌린다
import { nextTick } from "vue";
import { asset } from "@proto/data";
import "@proto/filters/bbm-filter-parts.css";

const props = defineProps<{ label: string; value: string; options: string[] }>();
const emit = defineEmits<{ change: [next: string] }>();
const chevronStyle = { "--bb-icon": `url("${asset("icons/bb/chevron-down.svg")}")`, "--bb-size": "18px" };
const onChange = (event: Event) => {
  const select = event.currentTarget as HTMLSelectElement;
  emit("change", select.value);
  void nextTick(() => { if (select.value !== props.value) select.value = props.value; });
};
</script>
<template>
  <label class="bbmf-select">
    <select :value="value" :aria-label="label" @change="onChange">
      <option value="">{{ label }}</option>
      <option v-for="option in options" :key="option" :value="option">{{ option }}</option>
    </select>
    <span class="bb-icon bbmf-unit-chevron" :style="chevronStyle" aria-hidden="true" />
  </label>
</template>
