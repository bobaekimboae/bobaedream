<script setup lang="ts">
// 리액트 ShootSimplePrototype.tsx 안의 Header 부품. onBack → emit("back").
import ChevronLeftIcon from "../../icons/ChevronLeftIcon.vue";
import Cross2Icon from "../../icons/Cross2Icon.vue";

defineProps<{ title: string; close?: boolean }>();
const emit = defineEmits<{ back: [] }>();
</script>
<template>
  <header class="sc-header">
    <button type="button" class="sc-icon-button" :aria-label="close ? '닫기' : '뒤로'" @click="emit('back')">
      <Cross2Icon v-if="close" /><ChevronLeftIcon v-else />
    </button>
    <strong>{{ title }}</strong>
    <span class="sc-header-space" />
  </header>
</template>
