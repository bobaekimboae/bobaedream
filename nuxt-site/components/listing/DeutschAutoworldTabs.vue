<script setup lang="ts">
// 리액트 deutsch-autoworld-directory.tsx 의 DeutschAutoworldTabs. onChange → emit("change", value).
import type { DeutschSection } from "@proto/listing/deutsch-autoworld-directory";
import { dawTabItems as tabItems } from "./deutsch-autoworld-local";
import "@proto/listing/seoul-auto-gallery-dealer-rail.css";
import "@proto/listing/seoul-auto-gallery-directory.css";
import "@proto/listing/deutsch-autoworld-directory.css";

defineProps<{ value: DeutschSection }>();
const emit = defineEmits<{ change: [value: DeutschSection] }>();
</script>
<template>
  <nav class="sag-directory-tabs" role="tablist" aria-label="도이치오토월드 탐색">
    <button v-for="item in tabItems" :key="item.value" type="button" role="tab" :aria-selected="value === item.value" :class="value === item.value ? 'is-selected' : undefined" @click="emit('change', item.value)">
      <span>{{ item.label }}</span>
    </button>
  </nav>
</template>
