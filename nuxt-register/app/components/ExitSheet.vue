<script setup lang="ts">
// 초톳 「Lưu tin nháp?」(뒤로 · 휴대폰 뒤로가기): 48 머리(회색 원 X · 가운데 제목) → 선 → 안내 한 줄 → 선 → 「저장 안 함」 테두리 · 「임시저장」 주 버튼(40).
// X · 바깥 누름은 닫고 그대로 머문다.
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import Ico from "./Ico.vue";
import { IC } from "../lib/icons";

const emit = defineEmits<{ close: []; leave: []; save: [] }>();
const x = ref<HTMLButtonElement | null>(null);
let prevOverflow = "";
const onKey = (e: KeyboardEvent) => e.key === "Escape" && emit("close");
onMounted(async () => {
  document.addEventListener("keydown", onKey);
  prevOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  await nextTick();
  x.value?.focus({ preventScroll: true });
});
onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKey);
  document.body.style.overflow = prevOverflow;
});
</script>
<template>
  <div class="layer">
  <div class="dim" @click="emit('close')" />
  <section class="sheet exit" role="alertdialog" aria-modal="true" aria-labelledby="exit-t" aria-describedby="exit-d">
    <header class="sheet__head sheet__head--line">
      <button ref="x" type="button" class="sheet__x sheet__x--round" aria-label="닫기" @click="emit('close')"><Ico :src="IC.close" /></button>
      <h2 id="exit-t">임시저장할까요?</h2>
    </header>
    <p id="exit-d" class="exit__body">쓰던 매물을 저장해 두고 나중에 이어서 쓸 수 있어요.</p>
    <footer class="exit__foot">
      <button type="button" class="btn btn--line" @click="emit('leave')">저장 안 함</button>
      <button type="button" class="btn btn--pri" @click="emit('save')">임시저장</button>
    </footer>
  </section>
  </div>
</template>
