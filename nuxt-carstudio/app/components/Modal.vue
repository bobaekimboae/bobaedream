<script setup lang="ts">
// 공용 창: PC는 가운데 창, 모바일 앱은 아래에서 올라오는 시트(app.css .cs.is-app .dlg).
// 열리면 닫기 단추에 포커스, Tab은 창 안에서만 돌고 Esc · 바깥 누름은 닫는다. 닫히면 연 단추로 포커스를 돌려준다.
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import Icon from "./Icon.vue";
import { I } from "../lib/site";

const props = defineProps<{ title: string; wide?: boolean; noClose?: boolean }>();
const emit = defineEmits<{ close: [] }>();
const box = ref<HTMLElement | null>(null);
const closeBtn = ref<HTMLButtonElement | null>(null);
let opener: Element | null = null;
const id = `dlg-${Math.random().toString(36).slice(2, 8)}`;
function onKey(e: KeyboardEvent) {
  if (e.key === "Escape" && !props.noClose) {
    e.stopPropagation();
    emit("close");
  }
  if (e.key !== "Tab" || !box.value) return;
  const f = [...box.value.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")].filter((x) => x.offsetParent !== null);
  if (!f.length) return;
  const first = f[0];
  const last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
onMounted(async () => {
  opener = document.activeElement;
  document.body.style.overflow = "hidden";
  await nextTick();
  (closeBtn.value ?? box.value)?.focus({ preventScroll: true });
});
onBeforeUnmount(() => {
  document.body.style.overflow = "";
  if (opener instanceof HTMLElement) opener.focus({ preventScroll: true });
});
</script>
<template>
  <div class="dim" @mousedown.self="!noClose && emit('close')" @keydown="onKey">
    <div ref="box" class="dlg" :class="{ 'dlg-wide': wide }" role="dialog" aria-modal="true" :aria-labelledby="id" tabindex="-1">
      <div class="dlg-h">
        <slot name="lead" />
        <h2 :id="id">{{ title }}</h2>
        <button v-if="!noClose" ref="closeBtn" class="icon-btn" type="button" aria-label="닫기" @click="emit('close')"><Icon :src="I.close" /></button>
      </div>
      <div class="dlg-b"><slot /></div>
      <div v-if="$slots.foot" class="dlg-f"><slot name="foot" /></div>
    </div>
  </div>
</template>
