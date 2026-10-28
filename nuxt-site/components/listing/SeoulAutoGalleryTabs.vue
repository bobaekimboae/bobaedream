<script setup lang="ts">
// 리액트 seoul-auto-gallery-directory.tsx 의 SeoulAutoGalleryTabs. onChange → emit("change", value).
import { sagTabItems as tabItems, type SeoulAutoGallerySection } from "./seoul-auto-gallery-local";
import "@proto/listing/seoul-auto-gallery-directory.css";
import "@proto/listing/seoul-auto-gallery-dealer-rail.css";

defineProps<{ value: SeoulAutoGallerySection }>();
const emit = defineEmits<{ change: [value: SeoulAutoGallerySection] }>();
</script>
<template>
  <nav class="sag-directory-tabs" role="tablist" aria-label="서울오토갤러리 탐색">
    <button
      v-for="item in tabItems"
      :key="item.value"
      type="button"
      role="tab"
      :aria-selected="value === item.value"
      :class="value === item.value ? 'is-selected' : undefined"
      @click="emit('change', item.value)"
    >
      <span>{{ item.label }}</span>
    </button>
  </nav>
</template>
