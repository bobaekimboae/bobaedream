<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-filter-parts.tsx 의 BbmCheckRow. onToggle → emit("toggle")
import { computed } from "vue";
import { asset } from "@proto/data";
import "@proto/filters/bbm-filter-parts.css";

const props = withDefaults(defineProps<{ label: string; count?: number | null; checked: boolean; size?: "sidebar" | "modal" | "option"; leadingIcon?: string }>(), { size: "modal" });
const emit = defineEmits<{ toggle: [] }>();
const disabled = computed(() => props.count === 0 && !props.checked);
const boxStyle = { "--bbmf-check-icon": `url("${asset("icons/bb/check.svg")}")` };
</script>
<template>
  <button type="button" role="checkbox" :aria-checked="checked" :aria-disabled="disabled || undefined" :disabled="disabled" :class="`bbmf-check is-${size}${leadingIcon ? ' has-leading-icon' : ''}${checked ? ' is-checked' : ''}${disabled ? ' is-disabled' : ''}`" @click="emit('toggle')">
    <i class="bbmf-check-box" :style="boxStyle" aria-hidden="true" />
    <span v-if="leadingIcon" class="bbmf-check-leading-icon" aria-hidden="true"><img :src="asset(leadingIcon)" alt="" :draggable="false"></span>
    <span class="bbmf-check-label">{{ label }}</span>
    <span v-if="count !== null && count !== undefined" class="bbmf-check-count">{{ count.toLocaleString("ko-KR") }}</span>
  </button>
</template>
