<script setup lang="ts">
// 리액트 src/prototype/register/index.tsx 의 Toast
defineProps<{ text: string }>();
</script>
<template>
  <div v-if="text" class="bbm-register-toast" role="status">{{ text }}</div>
</template>
