<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-filter-parts.tsx 의 BbmRangeInputs. onChange → emit("change", { min, max })
import BbmUnitField from "./BbmUnitField.vue";
import "@proto/filters/bbm-filter-parts.css";

const props = withDefaults(defineProps<{ unit: string; min: string; max: string; layout?: "stack" | "inline" | "pair" }>(), { layout: "inline" });
const emit = defineEmits<{ change: [next: { min: string; max: string }] }>();
const setMin = (next: string) => emit("change", { min: next, max: props.max });
const setMax = (next: string) => emit("change", { min: props.min, max: next });
</script>
<template>
  <!-- pair: 가격 칩 모달·시트 원본 — [최저] 부터 [최대] 까지 한 줄 -->
  <div v-if="layout === 'pair'" class="bbmf-range is-pair"><BbmUnitField :value="min" placeholder="최저" :unit="unit" @change="setMin" /><span class="bbmf-range-word">부터</span><BbmUnitField :value="max" placeholder="최대" :unit="unit" @change="setMax" /><span class="bbmf-range-word">까지</span></div>
  <div v-else-if="layout === 'inline'" class="bbmf-range is-inline"><BbmUnitField :value="min" placeholder="최저" :unit="unit" @change="setMin" /><span class="bbmf-range-sep" aria-hidden="true">~</span><BbmUnitField :value="max" placeholder="최대" :unit="unit" @change="setMax" /></div>
  <div v-else class="bbmf-range is-stack"><div><BbmUnitField :value="min" placeholder="최저" :unit="unit" @change="setMin" /><span class="bbmf-range-word">부터</span></div><div><BbmUnitField :value="max" placeholder="최대" :unit="unit" @change="setMax" /><span class="bbmf-range-word">까지</span></div></div>
</template>
