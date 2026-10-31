<script setup lang="ts">
// 초톳 「Chọn lượt đăng tin từ」(등록 방식) — 혜택 / 유료 두 묶음, 고른 카드 테두리 강조, 아래 「적용」.
// 보배드림: 일반 등록(무료) · 프리미엄 등록(유료, 시안 — 결제하지 않음). 유료는 미리 골라 두지 않는다.
import { ref } from "vue";
import Sheet from "./Sheet.vue";
import Ico from "./Ico.vue";
import { IC } from "../lib/icons";
import type { PostType } from "../lib/form";

const props = defineProps<{ value: PostType }>();
const emit = defineEmits<{ close: []; apply: [PostType] }>();
const pick = ref<PostType>(props.value);
</script>
<template>
  <Sheet title="등록 방식 고르기" left @close="emit('close')">
    <p class="post-sec">보배드림 혜택</p>
    <button type="button" class="post-card" :class="{ 'is-on': pick === 'free' }" :aria-pressed="pick === 'free'" @click="pick = 'free'">
      <span class="post-card__img"><Ico :src="IC.coupon" /></span>
      <span><b>일반 등록(무료)</b><small>노출 기간 60일</small><small>개인 판매자 첫 매물 무료</small></span>
      <span class="post-card__qty">x1</span>
    </button>
    <p class="post-sec">유료</p>
    <button type="button" class="post-card" :class="{ 'is-on': pick === 'premium' }" :aria-pressed="pick === 'premium'" @click="pick = 'premium'">
      <span class="post-card__img"><img :src="IC.premium" alt="" /></span>
      <span><b>프리미엄 등록</b><small>목록 위쪽 노출 · 촬영 키트 쇼츠 대표 노출</small><small>가격 · 기간은 결제 전에 다시 보여 드려요</small></span>
      <span />
    </button>
    <template #foot><button type="button" class="btn btn--pri" @click="emit('apply', pick)">적용</button></template>
  </Sheet>
</template>
