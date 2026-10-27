<script setup lang="ts">
// 원본: src/prototype/vehicle-catalog/index.tsx CatalogVehicleImage
import { computed } from "vue";
import { publicCatalogAsset, publicCatalogOriginalAsset } from "../../lib/vehicle-catalog/internal";
import "@proto/vehicle-catalog/vehicle-catalog.css";

const props = withDefaults(defineProps<{ path?: string | null; name: string; compact?: boolean }>(), { path: undefined, compact: false });
const source = computed(() => publicCatalogAsset(props.path));
const fallbackSource = computed(() => publicCatalogOriginalAsset(props.path));
const onError = (event: Event) => {
  const image = event.currentTarget as HTMLImageElement;
  const stage = image.dataset.fallbackStage;
  const fallback = fallbackSource.value;
  if (fallback && !stage && image.src !== new URL(fallback, document.baseURI).href) {
    image.dataset.fallbackStage = "switching";
    requestAnimationFrame(() => {
      image.dataset.fallbackStage = "fallback";
      image.src = fallback;
    });
    return;
  }
  if (stage === "switching") return;
  image.hidden = true;
};
</script>
<template>
  <span :class="`catalog-vehicle-image${compact ? ' is-compact' : ''}${source ? '' : ' is-placeholder'}`"><img v-if="source" :src="source" :alt="`${name} 차량`" loading="lazy" :draggable="false" @error="onError"><span v-else :aria-label="`${name} 이미지 없음`"><i /></span></span>
</template>
