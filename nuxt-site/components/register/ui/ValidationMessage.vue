<script setup lang="ts">
// 리액트 src/prototype/register/ui.tsx 의 ValidationMessage
defineProps<{ text?: string }>();
</script>
<template>
  <span v-if="text" class="register-validation-message">{{ text }}</span>
</template>
