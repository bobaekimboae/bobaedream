<script setup lang="ts">
// 리액트 src/prototype/register/ChototParityRegister.tsx 의 PillGroup. onChange → emit("change", value)
defineProps<{ label: string; value: string; options: string[]; compact?: boolean }>();
const emit = defineEmits<{ change: [value: string] }>();
</script>
<template>
  <fieldset :class="`ct-pills${compact ? ' is-compact' : ''}`">
    <legend>{{ label }}</legend>
    <div class="ct-pill-row">
      <button v-for="option in options" :key="option" type="button" :class="value === option ? 'is-selected' : ''" :aria-pressed="value === option" @click="emit('change', option)">{{ option }}</button>
    </div>
  </fieldset>
</template>
