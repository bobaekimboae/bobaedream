<script setup lang="ts">
// 원본 New vehicle video: 띠(출시 기념 한시 무료) · 추천 카드(내 프로젝트에서 가져오기) · 사진 새로 올리기
import Icon from "./Icon.vue";
import TopBack from "./TopBack.vue";
import { ct, rd } from "../lib/site";
const emit = defineEmits<{ back: []; go: [v: string, extra?: Record<string, string>] }>();
</script>
<template>
  <TopBack @back="emit('back')" />
  <main class="page">
    <h1 class="h1">새 차량 영상</h1>
    <p class="lead">시작 방법을 고르세요: 내 프로젝트에서 가져오거나 사진을 새로 올립니다.</p>
    <div class="ribbon"><b>영상 AI: 출시 기념 한시 무료!</b></div>
    <section class="rec">
      <span class="rec-badge">✦ 추천 · 가장 빠름</span>
      <span class="rec-ico"><Icon :src="rd('image-post-outline')" /></span>
      <h3>내 프로젝트에서 가져오기</h3>
      <p>사진과 차량 정보가 이미 들어 있어요. 다시 올리거나 다시 적을 필요 없이 하나만 고르면 바로 영상이 됩니다.</p>
      <div class="chips"><span><Icon :src="rd('checkmark-fill')" /> 정보 준비됨</span><span><Icon :src="rd('checkmark-fill')" /> 약 2분이면 완성</span></div>
      <button class="btn or" type="button" @click="emit('go', 'projects')">내 프로젝트 보기 →</button>
    </section>
    <button class="up" type="button" @click="emit('go', 'details')">
      <span class="up-ico"><Icon :src="ct('chotot-listing-register-image-upload-color-change')" /></span>
      <h3>사진 새로 올리기</h3>
      <p>차량 사진을 고르세요. 제조사부터 모델까지 AI가 채워 드려요.</p>
    </button>
  </main>
</template>
