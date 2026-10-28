<script setup lang="ts">
// 원본: src/ChoTotFilterSheet.tsx VehicleCategoryChooser (onChange → emit change(value))
import { computed } from "vue";
import { vehicleCategoryOptions } from "@src/ChoTotFilterSheet";
import { uiAsset } from "../../lib/chotot-filter-internal";

const props = defineProps<{ value: string }>();
const emit = defineEmits<{ change: [value: string] }>();
const options = computed(() => props.value === "전체" ? vehicleCategoryOptions.filter((option) => option !== "전체") : vehicleCategoryOptions);
</script>
<template>
  <div class="chotot-category-source">
    <button type="button" class="chotot-category-parent" aria-expanded="true">
      <span class="chotot-category-icon" aria-hidden="true"><img :src="uiAsset('notion-list.svg')" alt=""></span>
      <span>{{ value === "전체" ? "전체" : "차량" }}</span>
      <span class="chotot-category-chevron is-open" aria-hidden="true"><img :src="uiAsset('notion-chevron-right.svg')" alt=""></span>
    </button>
    <div class="chotot-category-child-chips" aria-label="차량 카테고리">
      <button v-for="option in options" :key="option" type="button" :class="value === option ? 'is-selected' : ''" :aria-pressed="value === option" @click="emit('change', option)">{{ option }}</button>
    </div>
  </div>
</template>
