<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-mileage.tsx 의 Field(주행거리 입력칸, 내보내지 않은 부품)
// onChange → emit("change", next), onDone → emit("done")(Enter·포커스 이동. 리액트는 onDone 이 있을 때만 걸었으나 듣는 쪽이 없으면 아무 일 없음 — 같은 동작)
// 리액트 제어 입력처럼: 부모가 값을 바꾸지 않으면 입력칸을 원래 값으로 되돌린다
import { nextTick } from "vue";
import { comma, digits } from "../../lib/filters/bbm-mileage";
import "@proto/filters/bbm-mileage.css";

const props = defineProps<{ label: string; value: string }>();
const emit = defineEmits<{ change: [next: string]; done: [] }>();
const onInput = (event: Event) => {
  const input = event.currentTarget as HTMLInputElement;
  const d = digits(input.value);
  emit("change", d ? comma(Number(d)) : "");
  void nextTick(() => { if (input.value !== props.value) input.value = props.value; });
};
</script>
<template>
  <label :class="`mf-field${value ? ' has-value' : ''}`">
    <input inputmode="numeric" autocomplete="off" :value="value" :aria-label="label" @input="onInput" @keydown="$event.key === 'Enter' ? emit('done') : undefined" @blur="emit('done')">
    <span class="mf-floating" aria-hidden="true">{{ label }}</span>
    <span class="mf-unit" aria-hidden="true">km</span>
  </label>
</template>
