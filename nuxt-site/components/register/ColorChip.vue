<script setup lang="ts">
// 리액트 src/prototype/register/index.tsx 의 RegisterForm 안 colorChip(item, selected, onPick). onPick → emit("pick")
import type { RegisterColor } from "@proto/register/data";
import { cx } from "./register-local";

defineProps<{ item: RegisterColor; selected: boolean }>();
const emit = defineEmits<{ pick: [] }>();
</script>
<template>
  <button type="button" :class="cx('register-color-chip', selected && 'sel')" @click="emit('pick')">
    <span class="register-color-chip__swatch" aria-hidden="true"><span v-for="(tone, index) in item.swatch" :key="index" class="register-color-chip__swatch-color" :style="{ background: tone }" /></span>
    <span class="register-color-chip__label">{{ item.name }}</span>
  </button>
</template>
