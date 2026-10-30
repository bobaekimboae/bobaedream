<script setup lang="ts">
// 리액트 bbm-list.tsx 의 BbmHeadlinePreviewLinks
import "@proto/listing/bbm-tokens.css";
import "@proto/listing/thumbnail-states.css";
import { getHeadlineTone, headlinePositionLinks, type HeadlineTone } from "./bbm-list-local";

const selectedTone = getHeadlineTone();
const hrefFor = (tone: HeadlineTone) => {
  const params = new URLSearchParams(window.location.search);
  params.set("titlepos", "after-model");
  if (tone === "blue") params.set("titlecolor", "blue");
  else params.delete("titlecolor");
  return `${window.location.pathname}?${params.toString()}`;
};
</script>
<template>
  <nav class="bbm-headline-preview" aria-label="제목 3번 색상 시안">
    <strong>제목 3번 색상 비교</strong>
    <div class="bbm-headline-preview__links">
      <a v-for="item in headlinePositionLinks" :key="item.tone" :href="hrefFor(item.tone)" :class="selectedTone === item.tone ? 'is-selected' : ''" :aria-current="selectedTone === item.tone ? 'page' : undefined" :aria-label="`${item.short} — ${item.label}`" :title="item.label">{{ item.short }}</a>
    </div>
  </nav>
</template>
