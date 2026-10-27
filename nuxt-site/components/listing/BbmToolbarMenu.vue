<script setup lang="ts">
// 리액트 bbm-list-area.tsx 의 BbmToolbarMenu(원본 car-list-toolbar-menu): 버튼 오른쪽 아래 8px, 바깥을 누르면 닫힘
// onClose → emit("close"), onSelect(option) → emit("select", option), children → 기본 slot
import { onBeforeUnmount, ref, watch } from "vue";
import "@proto/listing/bbm-list-area.css";

const props = defineProps<{ open: boolean; options: readonly string[]; selected: string }>();
const emit = defineEmits<{ close: []; select: [option: string] }>();
const wrapRef = ref<HTMLDivElement | null>(null);
let cleanup: (() => void) | undefined;
watch(() => props.open, (open) => {
  cleanup?.();
  cleanup = undefined;
  if (!open) return;
  const close = (event: PointerEvent) => { if (!wrapRef.value?.contains(event.target as Node)) emit("close"); };
  const escape = (event: KeyboardEvent) => { if (event.key === "Escape") emit("close"); };
  document.addEventListener("pointerdown", close);
  document.addEventListener("keydown", escape);
  cleanup = () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
}, { immediate: true });
onBeforeUnmount(() => cleanup?.());
</script>
<template>
  <div ref="wrapRef" class="bbm-menu-wrap">
    <slot />
    <div v-if="open" class="car-list-toolbar-menu">
      <div class="car-list-toolbar-menu__grid">
        <button v-for="option in options" :key="option" type="button" :class="`ui-btn ui-btn--ghost ui-btn--md ui-btn--align-left car-list-toolbar-menu__item${option === selected ? ' is-selected' : ''}`" :aria-pressed="option === selected" @click="emit('select', option)">
          <span class="ui-btn__label">{{ option }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
