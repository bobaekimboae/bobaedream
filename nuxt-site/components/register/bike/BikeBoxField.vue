<script setup lang="ts">
// 리액트 BikeRegister.tsx 의 BoxField. children → 기본 slot.
defineProps<{ label: string; error?: string; className?: string; filled?: boolean }>();
</script>
<template>
  <div :class="`bike-reg-field${className ? ` ${className}` : ''}${filled ? ' has-value' : ''}${error ? ' is-error' : ''}`">
    <label class="bike-reg-field__box"><span class="bike-reg-field__label">{{ label }}<em>*</em></span><slot /></label>
    <p v-if="error" class="bike-reg-error">{{ error }}</p>
  </div>
</template>
