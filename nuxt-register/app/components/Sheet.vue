<script setup lang="ts">
// 바텀시트 공통(초톳 「Chọn lượt đăng tin từ」 · 「Quy định hình ảnh」): 위 모서리 16 · 48 머리 · Esc/바깥 누르면 닫힘
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import Ico from "./Ico.vue";
import { IC } from "../lib/icons";

defineProps<{ title: string; full?: boolean; left?: boolean }>();
const emit = defineEmits<{ close: [] }>();
const x = ref<HTMLButtonElement | null>(null);
const onKey = (e: KeyboardEvent) => e.key === "Escape" && emit("close");
onMounted(async () => {
  document.addEventListener("keydown", onKey);
  document.body.style.overflow = "hidden";
  await nextTick();
  x.value?.focus({ preventScroll: true });
});
onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKey);
  document.body.style.overflow = "";
});
</script>
<template>
  <div class="dim" @click="emit('close')" />
  <section class="sheet" :class="{ 'sheet--full': full, 'post-sheet': left }" role="dialog" aria-modal="true" :aria-label="title">
    <header class="sheet__head">
      <button ref="x" type="button" class="sheet__x" aria-label="닫기" @click="emit('close')"><Ico :src="IC.close" /></button>
      <h2>{{ title }}</h2>
    </header>
    <div class="sheet__list"><slot /></div>
    <footer v-if="$slots.foot" class="sheet__foot"><slot name="foot" /></footer>
  </section>
</template>
