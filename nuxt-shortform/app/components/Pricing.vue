<script setup lang="ts">
// 크레딧 구매: autohaus-video 「Credits kaufen」과 같은 동작(1개 · 10개 묶음 · 25개 묶음, 대당 금액, 「지금 구매」 → 결제 → 대시보드 결제 알림 + 안내 4줄).
// 보배드림 가격은 아직 정하지 않았다: 숫자를 지어내지 않고 「가격 미정」으로 둔다.
// 결제는 시안: 실제 돈은 오가지 않고 확인을 누르면 크레딧만 넣는다(실서비스는 토스페이먼츠 등 결제창으로 바꾼다).
import { ref } from "vue";
import Icon from "./Icon.vue";
import { addCredits } from "../lib/jobs";
import { ct, rd } from "../lib/site";

const emit = defineEmits<{ go: [view: string, id?: string, extra?: Record<string, string>]; toast: [t: string] }>();
const plans = [
  { id: "single", name: "한 대", credits: 1, best: false },
  { id: "pack10", name: "10대 묶음", credits: 10, best: true },
  { id: "pack25", name: "25대 묶음", credits: 25, best: false },
];
const buying = ref("");
async function buy(p: (typeof plans)[number]) {
  if (buying.value) return;
  if (!window.confirm(`${p.name}(크레딧 ${p.credits}개)를 살까요?\n시안이라 실제 결제는 하지 않고 크레딧만 넣어요.`)) return;
  buying.value = p.id;
  await new Promise((r) => setTimeout(r, 700));
  addCredits(p.credits);
  buying.value = "";
  emit("go", "dashboard", undefined, { payment: "success" });
}
</script>
<template>
  <div class="sf-wrap">
    <div class="sf-center">
      <h1>크레딧 구매</h1>
      <p>크레딧 1개 · 차량 영상 1편(형식 A + B 포함)</p>
    </div>
    <div class="sf-plans">
      <div v-for="p in plans" :key="p.id" :class="`card sf-plan ${p.best ? 'is-best' : ''}`">
        <span v-if="p.best" class="tag">가장 많이 고름</span>
        <h3>{{ p.name }}</h3>
        <span class="sub">크레딧 {{ p.credits }}개</span>
        <div class="price">가격 미정<small>대당 금액 미정</small></div>
        <button :class="`btn ${p.best ? 'is-main' : ''}`" type="button" :disabled="!!buying" @click="buy(p)">{{ buying === p.id ? "결제 중…" : "지금 구매" }}</button>
      </div>
    </div>
    <div class="card sf-trust">
      <div><Icon :src="ct('chotot-common-lock')" />안전한 결제(결제 연결 전 시안)</div>
      <div><Icon :src="rd('refresh-outline')" />크레딧은 기한 없이 써요</div>
      <div><Icon :src="ct('chotot-common-clock')" />완성 시간: 주문 후 1분 안팎</div>
      <div><Icon :src="rd('checkmark-fill')" />만족 보장 — 무료로 다시 만들기</div>
    </div>
  </div>
</template>
