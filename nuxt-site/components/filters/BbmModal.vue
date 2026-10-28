<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-filter-parts.tsx 의 BbmModal(createPortal → Teleport to body)
// onClose → emit("close"), onBack → emit("back") + showBack(리액트에서 onBack 을 줬을 때만 "←" 버튼)
// children → 기본 slot, titleIcon → slot "titleIcon", footer → slot "footer"
// 원본 CloseButton(내보내지 않은 작은 부품)은 같은 DOM 으로 이 안에 그대로 그린다.
import { ref } from "vue";
import { asset } from "@proto/data";
import { handleDialogKeyDown, useDialogFocus } from "../../composables/filters/useDialogFocus";
import "@proto/filters/bbm-filter-parts.css";

withDefaults(defineProps<{ title: string; showBack?: boolean; wide?: boolean; flush?: boolean; variant?: "default" | "vehicle-hierarchy" }>(), { showBack: false, wide: false, flush: false, variant: "default" });
const emit = defineEmits<{ close: []; back: [] }>();
const dialogRef = ref<HTMLElement | null>(null);
const closeRef = ref<HTMLElement | null>(null);
useDialogFocus(dialogRef, closeRef);
const close = () => emit("close");
</script>
<template>
  <Teleport to="body">
    <div class="bbmf-overlay is-modal" @click.self="close">
      <section ref="dialogRef" :class="`bbmf-modal${wide ? ' is-tall' : ''}${variant === 'vehicle-hierarchy' ? ' is-vehicle-hierarchy' : ''}`" role="dialog" aria-modal="true" :aria-label="title" @keydown="handleDialogKeyDown($event, close)">
        <header class="bbmf-modal-header"><button v-if="showBack" type="button" class="bbmf-modal-back" aria-label="이전 단계" @click="emit('back')">←</button><h3><slot name="titleIcon" />{{ title }}</h3><button ref="closeRef" type="button" class="bbmf-close" aria-label="닫기" @click="close"><img :src="asset('bbm/modal-close.svg')" alt="" :draggable="false"></button></header>
        <div :class="`bbmf-modal-body${flush ? ' is-flush' : ''}`"><slot /></div>
        <slot name="footer" />
      </section>
    </div>
  </Teleport>
</template>
