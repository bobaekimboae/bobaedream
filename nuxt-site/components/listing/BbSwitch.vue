<script setup lang="ts">
// 원본: src/prototype/listing/pc-bbmuseum.tsx BbSwitch (onChange → emit change)
defineProps<{ checked: boolean; label: string }>();
const emit = defineEmits<{ change: [] }>();
</script>
<template>
  <button type="button" role="switch" :aria-checked="checked" :aria-label="label" :class="`bbm-switch${checked ? ' is-on' : ''}`" @click="emit('change')"><span /></button>
</template>
