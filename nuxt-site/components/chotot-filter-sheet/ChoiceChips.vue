<script setup lang="ts">
// 원본: src/ChoTotFilterSheet.tsx ChoiceChips (onChange → emit change(value))
defineProps<{ options: string[]; value: string }>();
const emit = defineEmits<{ change: [value: string] }>();
</script>
<template>
  <div class="chotot-choice-chips"><button v-for="option in options" :key="option" type="button" :class="value === option ? 'is-selected' : ''" :aria-pressed="value === option" @click="emit('change', option)">{{ option }}</button></div>
</template>
