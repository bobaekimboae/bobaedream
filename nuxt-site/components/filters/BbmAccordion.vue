<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-filter-parts.tsx 의 BbmAccordion
// onToggle → emit("toggle"), onReset → emit("reset") + showReset(리액트에서 onReset 을 줬을 때만 [초기화] 버튼이 보임)
// children → 기본 slot(펼쳤을 때만 그림)
import { asset } from "@proto/data";
import "@proto/filters/bbm-filter-parts.css";

withDefaults(defineProps<{ label: string; open: boolean; path?: string; showReset?: boolean; className?: string }>(), { showReset: false, className: "" });
const emit = defineEmits<{ toggle: []; reset: [] }>();
const icon = (name: string) => asset(`icons/bb/${name}.svg`);
const chevronStyle = { "--bb-icon": `url("${icon("chevron-down")}")`, "--bb-size": "20px" };
</script>
<template>
  <section :class="`bbm-filter-item${open ? ' is-open' : ''}${className ? ` ${className}` : ''}`">
    <button type="button" class="bbm-filter-toggle" :aria-expanded="open" @click="emit('toggle')">
      <span class="bbm-filter-label">{{ label }}<small v-if="!open && path" class="bbm-filter-path">{{ path }}</small></span>
      <span class="bbm-filter-chevron bb-icon" :style="chevronStyle" aria-hidden="true" />
    </button>
    <button v-if="showReset" type="button" class="bbm-filter-item-reset" @click="emit('reset')">초기화</button>
    <slot v-if="open" />
  </section>
</template>
