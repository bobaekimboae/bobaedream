<script setup lang="ts">
// 가운데 확인창(동처띠 「再写30字…确定要放弃吗？」 · 放弃 / 继续编辑): Esc · 바깥 = 왼쪽 버튼과 같지 않고 그냥 닫기(취소 = 계속 쓰기 쪽)
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { askState } from "../lib/ui";
const okBtn = ref<HTMLButtonElement | null>(null);
const done = (v: boolean) => { const a = askState.v; askState.v = null; a?.resolve(v); };
const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") done(true); };
onMounted(async () => { document.addEventListener("keydown", onKey); await nextTick(); okBtn.value?.focus({ preventScroll: true }); });
onBeforeUnmount(() => document.removeEventListener("keydown", onKey));
</script>
<template>
  <div class="ask" role="alertdialog" aria-modal="true" :aria-label="askState.v?.title">
    <div class="ask__dim" @click="done(true)" />
    <div class="ask__box">
      <p>{{ askState.v?.title }}</p>
      <div class="ask__btns">
        <button type="button" class="ask__no" @click="done(false)">{{ askState.v?.cancel }}</button>
        <button ref="okBtn" type="button" class="ask__ok" @click="done(true)">{{ askState.v?.ok }}</button>
      </div>
    </div>
  </div>
</template>
