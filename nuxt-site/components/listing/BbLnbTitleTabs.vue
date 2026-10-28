<script setup lang="ts">
// 원본: src/prototype/listing/pc-bbmuseum.tsx BbLnbTitleTabs (onChooseCategory → emit chooseCategory)
/* 2026-10-18 ?lnb=f: 카드 제목 자리를 하위 메뉴 큰 글자 탭으로 */
import { computed } from "vue";
import { bbActiveGnbItem, bbGnbSubmenus, bbSubnavCurrent } from "../../lib/listing/pc-bbmuseum-internal";

const props = defineProps<{ category: string; categoryDetail: string | null }>();
const emit = defineEmits<{ chooseCategory: [category: string, detail?: string] }>();
const activeItem = computed(() => bbActiveGnbItem(props.category));
const items = computed(() => bbGnbSubmenus[activeItem.value] ?? bbGnbSubmenus["전체 차량"]);
</script>
<template>
  <nav class="bbm-lnb-title-tabs" :aria-label="`${activeItem} 하위 메뉴`">
    <button v-for="item in items" :key="`${item.category}-${item.detail ?? item.label}`" type="button" :class="bbSubnavCurrent(item, category, categoryDetail) ? 'is-current' : ''" :aria-current="bbSubnavCurrent(item, category, categoryDetail) ? 'page' : undefined" @click="emit('chooseCategory', item.category, item.detail)">{{ item.label }}</button>
  </nav>
</template>
