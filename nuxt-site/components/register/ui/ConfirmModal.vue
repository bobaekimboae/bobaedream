<script setup lang="ts">
// 리액트 src/prototype/register/ui.tsx 의 ConfirmModal. dev 확인창(.confirm-modal): 제목 + 아니요 · 확인 두 버튼. 배경을 누르거나 Esc를 누르면 아니요와 같다.
// onCancel → emit("cancel"), onConfirm → emit("confirm")
import { watch } from "vue";
import RegisterLayer from "./RegisterLayer.vue";

const props = defineProps<{ open: boolean; title: string; cancelLabel: string; confirmLabel: string }>();
const emit = defineEmits<{ cancel: []; confirm: [] }>();
watch(() => props.open, (open, _prev, onCleanup) => {
  if (!open) return;
  const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") emit("cancel"); };
  document.addEventListener("keydown", onKey);
  onCleanup(() => document.removeEventListener("keydown", onKey));
}, { immediate: true });
</script>
<template>
  <RegisterLayer v-if="open">
    <div class="confirm-modal is-open">
      <div class="confirm-modal__backdrop" @click="emit('cancel')" />
      <div class="confirm-modal__panel" role="dialog" aria-modal="true" :aria-label="title">
        <div class="confirm-modal__main"><h3 class="confirm-modal__title">{{ title }}</h3></div>
        <div class="confirm-modal__footer">
          <button type="button" class="ui-btn ui-btn--outline ui-btn--lg ui-btn--align-center ui-btn--pill ui-btn--bordered" @click="emit('cancel')"><span class="ui-btn__label">{{ cancelLabel }}</span></button>
          <button type="button" class="ui-btn ui-btn--primary ui-btn--lg ui-btn--align-center ui-btn--pill" @click="emit('confirm')"><span class="ui-btn__label">{{ confirmLabel }}</span></button>
        </div>
      </div>
    </div>
  </RegisterLayer>
</template>
