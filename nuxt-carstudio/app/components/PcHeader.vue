<script setup lang="ts">
// PC웹 머리: 로고 · 메뉴(홈 · 영상 만들기 · 내 프로젝트 · 프로필) · 크레딧 · 새 영상
import { state } from "../lib/store";
import { sitePath } from "../lib/site";
const props = defineProps<{ view: string }>();
const emit = defineEmits<{ go: [v: string, extra?: Record<string, string>]; pay: [] }>();
const shoot = sitePath("nuxt-shootkit", "");
const on = (v: string[]) => v.includes(props.view);
</script>
<template>
  <header class="pch">
    <div class="pch-in">
      <button class="wordmark" type="button" @click="emit('go', 'home')">보배 카스튜디오<small>BOBAEDREAM CAR STUDIO</small></button>
      <nav class="pch-nav" aria-label="메뉴">
        <button type="button" :aria-current="on(['home']) ? 'page' : undefined" @click="emit('go', 'home')">홈</button>
        <button type="button" :aria-current="on(['start', 'details', 'making', 'result']) ? 'page' : undefined" @click="emit('go', 'start')">영상 만들기</button>
        <button type="button" :aria-current="on(['projects']) ? 'page' : undefined" @click="emit('go', 'projects')">내 프로젝트</button>
        <a :href="shoot">사진 촬영</a>
        <button type="button" :aria-current="on(['profile']) ? 'page' : undefined" @click="emit('go', 'profile')">프로필</button>
      </nav>
      <div class="pch-r">
        <button class="credit" type="button" :aria-label="`남은 크레딧 ${state.credits}개 · 크레딧 사기`" @click="emit('pay')">{{ state.credits }} <i>+</i></button>
        <button class="btn or" type="button" style="padding: 0 18px" @click="emit('go', 'start')">✦ 새 영상</button>
      </div>
    </div>
  </header>
</template>
