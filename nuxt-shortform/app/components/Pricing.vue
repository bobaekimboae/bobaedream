<script setup lang="ts">
// autohaus-video 「Credits kaufen」과 같은 구성(1개 · 10개 묶음 · 25개 묶음 + 안내 4줄).
// 보배드림 가격은 아직 정하지 않았다: 숫자를 지어내지 않고 「가격 미정」으로 둔다. 결제는 시안이라 동작하지 않는다.
import Icon from "./Icon.vue";
import { ct, rd } from "../lib/site";
const emit = defineEmits<{ toast: [t: string] }>();
const plans = [
  { name: "한 대", sub: "크레딧 1개", best: false },
  { name: "10대 묶음", sub: "크레딧 10개", best: true },
  { name: "25대 묶음", sub: "크레딧 25개", best: false },
];
</script>
<template>
  <div class="sf-wrap">
    <div class="sf-center">
      <h1>크레딧</h1>
      <p>크레딧 1개 = 차 한 대 영상(세로 쇼츠 + 정사각 · 가로 판 포함)</p>
    </div>
    <div class="sf-plans">
      <div v-for="p in plans" :key="p.name" :class="`card sf-plan ${p.best ? 'is-best' : ''}`">
        <span v-if="p.best" class="tag">가장 많이 고름</span>
        <h3>{{ p.name }}</h3>
        <span class="sub">{{ p.sub }}</span>
        <div class="price">가격 미정<small>시안</small></div>
        <button :class="`btn ${p.best ? 'is-main' : ''}`" type="button" aria-disabled="true" @click="emit('toast', '시안 화면이라 결제는 아직 없어요 · 시험 크레딧으로 만들어 보세요')">결제 준비 중</button>
      </div>
    </div>
    <div class="card sf-trust">
      <div><Icon :src="ct('chotot-common-lock')" />지금은 시안이라 결제가 없어요</div>
      <div><Icon :src="rd('refresh-outline')" />크레딧은 기한 없이 써요</div>
      <div><Icon :src="ct('chotot-common-clock')" />사진을 올리면 1분 안팎에 바로 완성</div>
      <div><Icon :src="rd('checkmark-fill')" />마음에 안 들면 틀 · 음악을 바꿔 무료로 다시 만들기</div>
    </div>
  </div>
</template>
