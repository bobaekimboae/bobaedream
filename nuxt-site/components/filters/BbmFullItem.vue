<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-filter-parts.tsx 의 BbmFullItem
// onOpen → emit("open"), onClear → emit("clear") + showClear(리액트에서 onClear 를 줬을 때만 "×" 버튼)
import "@proto/filters/bbm-filter-parts.css";

withDefaults(defineProps<{ label: string; icon?: string; value?: string; showClear?: boolean }>(), { showClear: false });
const emit = defineEmits<{ open: []; clear: [] }>();
</script>
<template>
  <div :class="`bbmf-full-item-wrap${value ? ' is-applied' : ''}`">
    <button type="button" class="bbmf-full-item" @click="emit('open')"><span class="bbmf-full-item-label"><img v-if="icon" :src="icon" alt="" aria-hidden="true">{{ label }}</span><i class="bbmf-full-chevron" aria-hidden="true" /></button>
    <span v-if="value" class="bbmf-full-value"><span>{{ value }}</span><button v-if="showClear" type="button" :aria-label="`${label} 조건 해제`" @click="emit('clear')">×</button></span>
  </div>
</template>
