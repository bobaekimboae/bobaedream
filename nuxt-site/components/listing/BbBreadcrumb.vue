<script setup lang="ts">
// 원본: src/prototype/listing/pc-bbmuseum.tsx BbBreadcrumb (onChooseCategory → emit chooseCategory)
import { computed } from "vue";
import { bbActiveGnbItem, bbGnbItems, bbGnbSubmenus, bbSubnavCurrent } from "../../lib/listing/pc-bbmuseum-internal";

type BbBreadcrumbItem = { label: string; category: string; detail?: string; current?: boolean };

const props = defineProps<{ category: string; categoryDetail: string | null }>();
const emit = defineEmits<{ chooseCategory: [category: string, detail?: string] }>();

const items = computed(() => {
  const { category, categoryDetail } = props;
  const activeItem = bbActiveGnbItem(category);
  const subnavItems = bbGnbSubmenus[activeItem] ?? bbGnbSubmenus["전체 차량"];
  const currentSubnavItem = subnavItems.find((item) => bbSubnavCurrent(item, category, categoryDetail));
  const result: BbBreadcrumbItem[] = [{ label: "보배드림 차량", category: "전체" }];
  if (activeItem === "트럭 · 특장") {
    if (!categoryDetail) result.push({ label: "트럭 · 특장", category, current: true });
    else {
      result.push({ label: "트럭 · 특장", category: "트럭 · 특장" });
      result.push({ label: currentSubnavItem?.label ?? categoryDetail, category, detail: categoryDetail, current: true });
    }
  } else {
    const activeLabel = bbGnbItems.find((item) => item.label === activeItem)?.label;
    const currentLabel = currentSubnavItem?.label ?? categoryDetail ?? (category === "전체" ? "전체차량" : activeLabel ?? category);
    result.push({ label: currentLabel, category, detail: categoryDetail ?? undefined, current: true });
  }
  return result;
});
</script>
<template>
  <nav class="bbm-ct-crumbs" aria-label="현재 위치">
    <ol>
      <li v-for="(item, index) in items" :key="`${item.category}-${item.detail ?? item.label}`">
        <span v-if="index > 0" class="bbm-ct-crumb-sep" aria-hidden="true">/</span>
        <strong v-if="item.current" aria-current="page">{{ item.label }}</strong>
        <button v-else type="button" @click="emit('chooseCategory', item.category, item.detail)">{{ item.label }}</button>
      </li>
    </ol>
  </nav>
</template>
