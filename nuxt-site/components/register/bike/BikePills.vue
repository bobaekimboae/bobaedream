<script setup lang="ts">
// 리액트 BikeRegister.tsx 의 Pills. onChange → emit("change").
defineProps<{ value: string; options: string[]; error?: boolean }>();
const emit = defineEmits<{ change: [value: string] }>();
</script>
<template>
  <div :class="`bike-reg-pills${error ? ' is-error' : ''}`"><button v-for="option in options" :key="option" type="button" :class="value === option ? 'is-active' : ''" :aria-pressed="value === option" @click="emit('change', option)">{{ option }}</button></div>
</template>
