<script setup lang="ts">
// 리액트 src/prototype/listing/luxury-theme-header.tsx 의 LuxuryThemeHero
// header(ReactNode) → 이름 있는 slot "header", onNotify → emit("notify", message)
/** 럭셔리카 테마 헤더 시안(2026-10-08). `?luxhead=a` 보배 피그마 「슈퍼카 리스트」형(왼쪽 프로필) · `b` 좐좐 브랜드형(가운데 제목 + 차량 라인업). 없으면 기존 헤더 그대로 */
import { computed, ref } from "vue";
import { asset } from "@proto/data";
import type { LuxuryHeadVariant } from "@proto/listing/luxury-theme-header";
import "@proto/listing/luxury-theme-header.css";

defineProps<{ variant: LuxuryHeadVariant; listingCount: number; dealerCount: number }>();
const emit = defineEmits<{ notify: [message: string] }>();
/** 구독자 수는 UI 검증용 가상 값 */
const LUXURY_SUBSCRIBERS = 1284;
const subscribed = ref(false);
const subscribers = computed(() => LUXURY_SUBSCRIBERS + (subscribed.value ? 1 : 0));
const toggleSubscribe = () => {
  const was = subscribed.value;
  subscribed.value = !was;
  emit("notify", was ? "럭셔리카 구독을 해제했습니다." : "럭셔리카를 구독했습니다. 새 매물이 올라오면 알려드릴게요.");
};
</script>
<template>
  <section :class="`lux-hero is-${variant}`" aria-label="럭셔리카 카테고리 소개" :style="{ backgroundImage: `url(${asset(`cars/luxury-category-v01/hero/hero-${variant}.webp`)})` }">
    <div class="lux-hero-nav"><slot name="header" /></div>
    <div v-if="variant === 'a'" class="lux-hero-body">
      <div class="lux-hero-profile">
        <img class="lux-hero-avatar" :src="asset('cars/luxury-category-v01/hero/avatar.png')" alt="" />
        <div class="lux-hero-copy">
          <div class="lux-hero-title-row">
            <h1>럭셔리카</h1>
            <button type="button" :class="`lux-hero-subscribe${subscribed ? ' is-on' : ''}`" :aria-pressed="subscribed" @click="toggleSubscribe">
              <svg v-if="subscribed" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.2 5 8.6l4.6-5.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
              <svg v-else viewBox="0 0 12 12" aria-hidden="true"><path d="M6 2.2v7.6M2.2 6h7.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
              {{ subscribed ? "구독중" : "구독" }}
            </button>
          </div>
          <p class="lux-hero-stats"><b>{{ listingCount.toLocaleString("ko-KR") }}대</b> 판매 중 · 딜러 {{ dealerCount }}명 · <b>{{ subscribers.toLocaleString("ko-KR") }}명</b> 구독 중</p>
        </div>
      </div>
      <p class="lux-hero-desc">보배드림은 한국 유일의 럭셔리카 플랫폼. 검증된 딜러의 슈퍼카·하이엔드 매물만 모았습니다.</p>
      <button type="button" class="lux-hero-sell" @click="emit('notify', '럭셔리카 매물 등록 화면으로 이동 예정')">
        <span class="lux-hero-sell-plus" aria-hidden="true">+</span>
        <span>럭셔리카를 판매하시나요? <b>딜러 매물 등록하기</b></span>
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 3.5 4.5 4.5L6 12.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </button>
    </div>
    <div v-else class="lux-hero-body">
      <span class="lux-hero-eyebrow">BOBAEDREAM LUXURY</span>
      <h1>럭셔리카</h1>
      <p class="lux-hero-desc">보배드림은 한국 유일의 럭셔리카 플랫폼</p>
      <p class="lux-hero-stats"><b>{{ listingCount.toLocaleString("ko-KR") }}대</b> 판매 중 · 딜러 {{ dealerCount }}명 · <b>{{ subscribers.toLocaleString("ko-KR") }}명</b> 구독 중</p>
      <button type="button" :class="`lux-hero-subscribe${subscribed ? ' is-on' : ''}`" :aria-pressed="subscribed" @click="toggleSubscribe">
        <svg v-if="subscribed" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.2 5 8.6l4.6-5.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
        <svg v-else viewBox="0 0 12 12" aria-hidden="true"><path d="M6 2.2v7.6M2.2 6h7.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
        {{ subscribed ? "구독중" : "구독" }}
      </button>
    </div>
  </section>
</template>
