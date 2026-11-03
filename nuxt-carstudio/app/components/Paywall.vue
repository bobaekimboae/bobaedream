<script setup lang="ts">
// 원본 크레딧 화면: 「Edit your photos with ease」 · 월 100/300/600 크레딧 구독 · 자동 갱신 · EULA · Privacy · Restore.
// 결제는 붙이지 않았다(가격 · 결제 수단 미정). 원본 가격(85,000 · 150,000 · 240,000원)은 비교용 보고서에만 적는다.
import { onBeforeUnmount, onMounted, ref } from "vue";
import Icon from "./Icon.vue";
import { rd } from "../lib/site";
const emit = defineEmits<{ close: []; toast: [t: string] }>();
const plans = [
  { id: 600, label: "월 600 크레딧" },
  { id: 300, label: "월 300 크레딧", best: true },
  { id: 100, label: "월 100 크레딧" },
];
const pick = ref(300);
const esc = (e: KeyboardEvent) => { if (e.key === "Escape") emit("close"); };
onMounted(() => window.addEventListener("keydown", esc));
onBeforeUnmount(() => window.removeEventListener("keydown", esc));
</script>
<template>
  <div class="pay" role="dialog" aria-label="크레딧">
    <button class="x" type="button" aria-label="닫기" @click="emit('close')"><Icon :src="rd('close-outline')" /></button>
    <button class="rs" type="button" @click="emit('toast', '복원할 구매 내역이 없어요.')">구매 복원</button>
    <h2>사진 편집을 쉽게</h2>
    <p>매달 100 크레딧부터 시작해 보세요.</p>
    <button v-for="p in plans" :key="p.id" class="plan" type="button" :aria-pressed="pick === p.id" @click="pick = p.id">
      <span><b>{{ p.label }}</b><span>가격 준비 중</span></span><em v-if="p.best">가장 인기</em>
    </button>
    <p class="auto">자동 갱신 · 언제든 해지할 수 있어요</p>
    <button class="btn or" type="button" style="height: 50px" @click="emit('toast', '결제는 아직 준비 중이에요. 지금은 영상이 한시 무료예요.')">계속</button>
    <div class="foot"><span>이용약관</span><span>개인정보 처리방침</span></div>
  </div>
</template>
