<script setup lang="ts">
// 리액트 BikeRegister.tsx 의 SelectRow. onClick 을 안 주면 눌리지 않는 div(카테고리) → 여기서는 boolean prop `fixed`.
// onClick → emit("click").
import { icons } from "./bike-register-icons";

withDefaults(defineProps<{ label: string; value?: string; required?: boolean; info?: boolean; error?: boolean; muted?: boolean; placeholder?: string; fixed?: boolean }>(), { placeholder: "선택" });
const emit = defineEmits<{ click: [] }>();
</script>
<template>
  <div v-if="fixed" class="bike-reg-row is-fixed">
    <span class="bike-reg-row__label">{{ label }}<em v-if="required">*</em></span>
    <span class="bike-reg-row__value">{{ value }}</span>
    <span />
  </div>
  <button v-else type="button" :class="`bike-reg-row${muted ? ' is-muted' : ''}`" @click="emit('click')">
    <span class="bike-reg-row__label">{{ label }}<em v-if="required">*</em><img v-if="info" :src="icons.info" alt=""></span>
    <span :class="`bike-reg-row__value${value ? '' : error ? ' is-error' : ' is-empty'}`">{{ value || (error ? "선택해 주세요" : placeholder) }}</span>
    <img class="bike-reg-row__chevron" :src="icons.chevron" alt="">
  </button>
</template>
