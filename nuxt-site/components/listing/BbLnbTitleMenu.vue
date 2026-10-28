<script setup lang="ts">
// 원본: src/prototype/listing/pc-bbmuseum.tsx BbLnbTitleMenu (onChooseCategory → emit chooseCategory)
import { computed, onBeforeUnmount, ref, watch } from "vue";
import BbIcon from "./BbIcon.vue";
import { bbActiveGnbItem, bbGnbSubmenus, bbSubnavCurrent, type BbGnbSubItem } from "../../lib/listing/pc-bbmuseum-internal";

const props = defineProps<{ title: string; category: string; categoryDetail: string | null }>();
const emit = defineEmits<{ chooseCategory: [category: string, detail?: string] }>();
const open = ref(false);
const root = ref<HTMLDivElement | null>(null);
const activeItem = computed(() => bbActiveGnbItem(props.category));
const items = computed(() => bbGnbSubmenus[activeItem.value] ?? bbGnbSubmenus["전체 차량"]);
const current = computed(() => items.value.find((item) => bbSubnavCurrent(item, props.category, props.categoryDetail)));

let cleanup: (() => void) | null = null;
watch(open, (value) => {
  cleanup?.();
  cleanup = null;
  if (!value) return;
  const close = (event: MouseEvent) => { if (!root.value?.contains(event.target as Node)) open.value = false; };
  const esc = (event: KeyboardEvent) => { if (event.key === "Escape") open.value = false; };
  document.addEventListener("mousedown", close);
  document.addEventListener("keydown", esc);
  cleanup = () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
});
onBeforeUnmount(() => cleanup?.());
const choose = (item: BbGnbSubItem) => { open.value = false; emit("chooseCategory", item.category, item.detail); };
</script>
<template>
  <div ref="root" class="bbm-lnb-title">
    <h1 class="bbm-ct-title bbm-summary">
      <button type="button" class="bbm-lnb-title-button" aria-haspopup="menu" :aria-expanded="open" @click="open = !open">
        <span>{{ title }}</span><span v-if="current && current.label !== title && !current.label.includes('전체')" class="bbm-lnb-title-sub">{{ current.label }}</span>
        <BbIcon name="chevron-down" :size="20" />
      </button>
    </h1>
    <div v-if="open" class="bbm-lnb-title-menu" role="menu">
      <button v-for="item in items" :key="`${item.category}-${item.detail ?? item.label}`" type="button" role="menuitem" :class="item === current ? 'is-current' : ''" :aria-current="item === current ? 'page' : undefined" @click="choose(item)">{{ item.label }}</button>
    </div>
  </div>
</template>
