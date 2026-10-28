<script setup lang="ts">
// 리액트 src/mobile/components.tsx 의 MobileTextField.
import KeyboardInput from "./KeyboardInput.vue";

defineProps<{ id: string; label: string; placeholder?: string; testId?: string }>();
</script>
<template>
  <label class="mobile-field" :for="id">
    <span class="field-label">{{ label }}</span>
    <KeyboardInput :id="id" :data-testid="testId" :placeholder="placeholder" />
  </label>
</template>
