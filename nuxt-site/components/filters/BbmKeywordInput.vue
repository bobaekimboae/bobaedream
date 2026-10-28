<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-filter-parts.tsx 의 BbmKeywordInput. onChange → emit("change", next)
import { asset } from "@proto/data";
import "@proto/filters/bbm-filter-parts.css";

defineProps<{ value: string; placeholder: string }>();
const emit = defineEmits<{ change: [next: string] }>();
const searchStyle = { "--bb-icon": `url("${asset("icons/bb/search.svg")}")`, "--bb-size": "18px" };
</script>
<template>
  <label class="bbmf-keyword">
    <input :value="value" :placeholder="placeholder" :aria-label="placeholder" @input="emit('change', ($event.currentTarget as HTMLInputElement).value)">
    <span class="bb-icon" :style="searchStyle" aria-hidden="true" />
  </label>
</template>
