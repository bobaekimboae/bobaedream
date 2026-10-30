<script setup lang="ts">
// 리액트 BikeRegister.tsx 의 DetailInput. onChange → emit("change").
import { syncControlled } from "../../../lib/controlled-input";
import { digits, withComma } from "./bike-register-icons";

const props = defineProps<{ label: string; value: string; unit: string; required?: boolean; error?: string; pencil?: boolean }>();
const emit = defineEmits<{ change: [value: string] }>();
const onInput = (event: Event) => {
  emit("change", digits((event.currentTarget as HTMLInputElement).value).slice(0, 7));
  syncControlled(event, () => withComma(props.value));
};
</script>
<template>
  <label :class="`bike-reg-input-row${error ? ' is-error' : ''}`">
    <span>{{ label }}<em v-if="required">*</em></span>
    <span><input :value="withComma(value)" inputmode="numeric" :aria-label="label" @input="onInput"><b>{{ unit }}</b>
      <!-- 임시: 초톳 선 연필 아이콘 원본이 180개 묶음에 없음 -->
      <svg v-if="pencil" class="bike-reg-pencil" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" /><path d="m14 8 2 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
    </span>
  </label>
  <p v-if="error" class="bike-reg-error is-row">{{ error }}</p>
</template>
