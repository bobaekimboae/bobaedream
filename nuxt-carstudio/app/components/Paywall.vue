<script setup lang="ts">
// 원본 크레딧 화면: 위 차 사진 · 「Edit your photos with ease」 · 월 600/300/100 크레딧 알약(가운데가 「Most popular」 채움) · 자동 갱신 · EULA · Privacy · Restore.
// 원본은 알약을 누르면 바로 스토어 결제로 넘어간다. 결제는 붙이지 않았다(가격 · 결제 수단 미정).
import { onBeforeUnmount, onMounted, ref } from "vue";
import Icon from "./Icon.vue";
import { rd, sitePath } from "../lib/site";
const emit = defineEmits<{ close: []; toast: [t: string] }>();
const plans = [
  { id: 600, label: "월 600 크레딧" },
  { id: 300, label: "월 300 크레딧", best: true },
  { id: 100, label: "월 100 크레딧" },
];
const pick = ref(300);
const hero = sitePath("assets", "cars", "seoul-autogallery-v01", "rr", "rr-02.jpg");
function buy(id: number) {
  pick.value = id;
  emit("toast", "결제는 아직 준비 중이에요. 지금은 영상이 한시 무료예요.");
}
const esc = (e: KeyboardEvent) => { if (e.key === "Escape") emit("close"); };
onMounted(() => window.addEventListener("keydown", esc));
onBeforeUnmount(() => window.removeEventListener("keydown", esc));
</script>
<template>
  <div class="pay" role="dialog" aria-label="크레딧">
    <div class="pay-hero" :style="{ backgroundImage: `url('${hero}')` }" />
    <button class="x" type="button" aria-label="닫기" @click="emit('close')"><Icon :src="rd('close-outline')" /></button>
    <button class="rs" type="button" @click="emit('toast', '복원할 구매 내역이 없어요.')">구매 복원</button>
    <h2>사진 편집을<br />쉽고 빠르게</h2>
    <p>매달 100 크레딧으로 바로 시작해 보세요.</p>
    <p class="auto">자동 갱신 · 언제든 해지할 수 있어요</p>
    <div class="plans">
      <button v-for="p in plans" :key="p.id" class="plan" type="button" :aria-pressed="pick === p.id" @click="buy(p.id)">
        <b>{{ p.label }}</b><span>가격 준비 중</span><em v-if="p.best">가장 인기</em>
      </button>
    </div>
    <div class="foot"><button type="button">이용약관</button><button type="button">개인정보</button></div>
  </div>
</template>
