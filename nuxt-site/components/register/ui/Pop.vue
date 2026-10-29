<script setup lang="ts">
// 리액트 src/prototype/register/ui.tsx 의 Pop. dev 원본 팝업(pop): 모바일은 전체 화면·바텀시트, PC는 가운데 모달. 모양은 클래스에 따라 register.css가 정한다.
// onClose → emit("close"), children → 기본 slot, footer → slot "footer"
import { watch } from "vue";
import RegisterLayer from "./RegisterLayer.vue";

const props = defineProps<{ open: boolean; title: string; className?: string; bodyClassName?: string; id?: string; rawBody?: boolean }>();
const emit = defineEmits<{ close: [] }>();
const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(" ");
watch(() => props.open, (open, _prev, onCleanup) => {
  if (!open) return;
  const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") emit("close"); };
  document.addEventListener("keydown", onKey);
  onCleanup(() => document.removeEventListener("keydown", onKey));
}, { immediate: true });
</script>
<template>
  <RegisterLayer v-if="open">
    <div :class="cx('pop', className, 'open')" :id="id" role="dialog" aria-modal="true" :aria-label="title" @click.self="emit('close')">
      <div class="pop-panel ui-fake-scrollbar">
        <div class="pop-hd">
          <button type="button" class="ui-btn ui-btn--ghost pb" aria-label="닫기" @click="emit('close')"><i class="screen-icon-back" /></button>
          <span class="pt">{{ title }}</span>
          <span class="ps" />
        </div>
        <slot v-if="rawBody" />
        <div v-else :class="cx('pop-body', bodyClassName)"><slot /></div>
        <slot name="footer" />
        <span class="ui-fake-scrollbar__track"><span class="ui-fake-scrollbar__thumb" /></span>
      </div>
    </div>
  </RegisterLayer>
</template>
