<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-filter-parts.tsx 의 BbmActionBar. onReset → emit("reset"), onConfirm → emit("confirm")
import "@proto/filters/bbm-filter-parts.css";

withDefaults(defineProps<{ count: number; confirmStyle?: "확인" | "보기"; variant?: "modal" | "sheet" | "full"; resetLabel?: string; confirmLabel?: string }>(), { confirmStyle: "확인", variant: "modal", resetLabel: "초기화" });
const emit = defineEmits<{ reset: []; confirm: [] }>();
const formatCount = (count: number) => count.toLocaleString("ko-KR");
</script>
<template>
  <div :class="`bbmf-actions is-${variant}`">
    <button type="button" class="bbmf-reset" @click="emit('reset')">{{ resetLabel }}</button>
    <button type="button" class="bbmf-confirm" @click="emit('confirm')">{{ confirmLabel ?? (confirmStyle === "확인" ? `확인 ${formatCount(count)}대` : `${formatCount(count)}대 보기`) }}</button>
  </div>
</template>
