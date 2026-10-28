<script setup lang="ts">
// 원본: src/prototype/listing/pc-bbmuseum.tsx BbSecondaryNav (onChooseCategory → emit chooseCategory)
import { computed } from "vue";
import { bbLnbVariant } from "@proto/listing/pc-bbmuseum";
import { bbActiveGnbItem, bbGnbSubmenus, bbSubnavCurrent } from "../../lib/listing/pc-bbmuseum-internal";

const props = defineProps<{ category: string; categoryDetail: string | null }>();
const emit = defineEmits<{ chooseCategory: [category: string, detail?: string] }>();
const activeItem = computed(() => bbActiveGnbItem(props.category));
const subnavItems = computed(() => bbGnbSubmenus[activeItem.value] ?? bbGnbSubmenus["전체 차량"]);
/* ?lnb=d: 하위 메뉴가 하나뿐(바이크 전체 등)이면 칩 줄을 그리지 않는다 */
const hidden = computed(() => bbLnbVariant() === "d" && subnavItems.value.length <= 1);
</script>
<template>
  <div v-if="!hidden" class="bbm-secondary-nav">
    <nav :class="`bbm-snb${activeItem === '국산차' ? ' is-all-visible' : ''}`" :aria-label="`${activeItem} 하위 메뉴`">
      <button v-for="item in subnavItems" :key="`${item.category}-${item.detail ?? item.label}`" type="button" :class="bbSubnavCurrent(item, category, categoryDetail) ? 'is-current' : ''" :aria-current="bbSubnavCurrent(item, category, categoryDetail) ? 'page' : undefined" @click="emit('chooseCategory', item.category, item.detail)">{{ item.label }}</button>
    </nav>
  </div>
</template>
