<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-filter-parts.tsx 의 BbmSheet(createPortal → Teleport to body)
// onClose → emit("close"), onBack → emit("back") + showBack(리액트에서 onBack 을 줬을 때만 제목이 "← 제목" 버튼)
// children → 기본 slot, footer → slot "footer"
import { computed, ref, useId } from "vue";
import { asset } from "@proto/data";
import { handleDialogKeyDown, useDialogFocus } from "../../composables/filters/useDialogFocus";
import { useHistoryDismiss } from "../../composables/filters/useHistoryDismiss";
import "@proto/filters/bbm-filter-parts.css";

const props = withDefaults(defineProps<{ showBack?: boolean; title: string; subtitle?: string; flush?: boolean; modalBody?: boolean; variant?: "default" | "seller" | "body-type" | "category" }>(), { showBack: false, flush: false, modalBody: false, variant: "default" });
const emit = defineEmits<{ close: []; back: [] }>();
const titleId = useId();
const dialogRef = ref<HTMLElement | null>(null);
const closeRef = ref<HTMLElement | null>(null);
const close = () => emit("close");
useDialogFocus(dialogRef, closeRef);
useHistoryDismiss("__bbmfSheet", `bbmf-sheet:${titleId}`, close);

const seller = computed(() => props.variant === "seller");
const bodyType = computed(() => props.variant === "body-type");
const category = computed(() => props.variant === "category");
const refined = computed(() => seller.value || bodyType.value);
</script>
<template>
  <Teleport to="body">
    <div :class="`bbmf-overlay is-sheet${refined ? ' is-seller-overlay' : ''}`" @click.self="close">
      <section ref="dialogRef" :class="`bbmf-sheet${modalBody ? ' is-modal-body' : ''}${seller ? ' is-seller' : ''}${bodyType ? ' is-body-type' : ''}${category ? ' is-category' : ''}`" role="dialog" aria-modal="true" :aria-labelledby="titleId" @keydown="handleDialogKeyDown($event, close)">
        <!-- QF-111: onBack 이 있으면 제목 앞 "←"(누르면 이전 단계) -->
        <header class="bbmf-sheet-header"><div class="bbmf-sheet-heading"><h3 v-if="showBack" :id="titleId"><button type="button" class="bbmf-sheet-back" :aria-label="`${title} 뒤로`" @click="emit('back')">← {{ title }}</button></h3><h3 v-else :id="titleId">{{ title }}</h3><p v-if="subtitle">{{ subtitle }}</p></div><button ref="closeRef" type="button" class="bbmf-close" aria-label="닫기" @click="close"><img :src="asset('bbm/modal-close.svg')" alt="" :draggable="false"></button></header>
        <div :class="`bbmf-sheet-body${flush ? ' is-flush' : ''}`"><slot /></div>
        <slot name="footer" />
      </section>
    </div>
  </Teleport>
</template>
