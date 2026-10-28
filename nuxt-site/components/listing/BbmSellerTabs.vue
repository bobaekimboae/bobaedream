<script setup lang="ts" generic="T extends string">
// 리액트 bbm-list.tsx 의 BbmSellerTabs(목록 탭 전체 · 개인 · 딜러 · 브랜드). onChange(tab) → emit("change", tab), onBrand → emit("brand")
import "@proto/listing/bbm-tokens.css";
import "@proto/listing/thumbnail-states.css";

defineProps<{ tabs: readonly T[]; value: T }>();
const emit = defineEmits<{ change: [tab: T]; brand: [] }>();
</script>
<template>
  <div class="bbm-seller-tabs" role="tablist" aria-label="판매자 유형">
    <button v-for="tab in tabs" :key="tab" type="button" role="tab" :aria-selected="value === tab" :class="value === tab ? 'is-selected' : ''" @click="emit('change', tab)">{{ tab }}</button>
    <button type="button" role="tab" :aria-selected="false" @click="emit('brand')">브랜드</button>
  </div>
</template>
