<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-filter-parts.tsx 의 BbmFullFilter(createPortal → Teleport to body)
// onClose → emit("close"), onToggleKeep → emit("toggleKeep"), onSaveSearch → emit("saveSearch")
// children → 기본 slot, footer → slot "footer"
import { ref, useId } from "vue";
import { asset } from "@proto/data";
import { handleDialogKeyDown, useDialogFocus } from "../../composables/filters/useDialogFocus";
import { useHistoryDismiss } from "../../composables/filters/useHistoryDismiss";
import "@proto/filters/bbm-filter-parts.css";

withDefaults(defineProps<{ keepSearch?: boolean; history?: number; variant?: "default" | "daangn" }>(), { keepSearch: false, history: 0, variant: "default" });
const emit = defineEmits<{ close: []; toggleKeep: []; saveSearch: [] }>();
const dialogId = useId();
const dialogRef = ref<HTMLElement | null>(null);
const closeRef = ref<HTMLElement | null>(null);
const close = () => emit("close");
useDialogFocus(dialogRef, closeRef);
useHistoryDismiss("__bbmfFull", `bbmf-full:${dialogId}`, close);
</script>
<template>
  <Teleport to="body">
    <div v-if="variant === 'daangn'" class="bbmf-full-overlay is-daangn" @click.self="close">
      <div ref="dialogRef" class="bbmf-full is-daangn" role="dialog" aria-modal="true" aria-label="필터" @keydown="handleDialogKeyDown($event, close)">
        <header class="bbmf-full-header"><h3>필터</h3><button ref="closeRef" type="button" class="bbmf-full-close" aria-label="닫기" @click="close"><img :src="asset('bbm/m-full-close.svg')" alt="" :draggable="false"></button></header>
        <div class="bbmf-full-body">
          <div class="bbmf-full-menu"><slot /></div>
        </div>
        <slot name="footer" />
      </div>
    </div>
    <div v-else ref="dialogRef" class="bbmf-full" role="dialog" aria-modal="true" aria-label="필터" @keydown="handleDialogKeyDown($event, close)">
      <header class="bbmf-full-header"><h3>필터</h3><button ref="closeRef" type="button" class="bbmf-full-close" aria-label="닫기" @click="close"><img :src="asset('bbm/m-full-close.svg')" alt="" :draggable="false"></button></header>
      <div class="bbmf-full-body">
        <div class="bbmf-full-summary">
          <div class="bbmf-full-tools">
            <label class="bbmf-full-keep"><button type="button" role="switch" :aria-checked="Boolean(keepSearch)" aria-label="검색조건 유지" :class="`bbmf-keep-switch${keepSearch ? ' is-on' : ''}`" @click="emit('toggleKeep')"><span /></button><span>검색조건 유지</span></label>
            <button type="button" class="bbmf-full-history">최근검색기록 {{ history }}</button>
          </div>
          <button type="button" class="bbmf-save-search" @click="emit('saveSearch')"><i class="bbmf-circle-icon is-plus" aria-hidden="true" />검색조건 저장</button>
        </div>
        <div class="bbmf-full-menu"><slot /></div>
      </div>
      <slot name="footer" />
    </div>
  </Teleport>
</template>
