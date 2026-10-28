<script setup lang="ts">
// 리액트 bbm-list.tsx 의 BbmBottomGnb(모바일 하단 탭바: 홈 · 채팅 · 매물등록(＋ 원형) · 커뮤니티 · 마이). onNotify(message) → emit("notify", message)
import { bbmIcon } from "@proto/listing/bbm-list";
import "@proto/listing/bbm-tokens.css";
import "@proto/listing/thumbnail-states.css";

const emit = defineEmits<{ notify: [message: string] }>();
const items: Array<[string, string]> = [["홈", "home"], ["채팅", "chat"], ["매물등록", "register"], ["커뮤니티", "community"], ["마이", "my"]];
const chooseBottomMenu = (label: string, icon: string) => {
  if (icon === "home") return;
  if (icon === "community") {
    window.location.assign(new URL("community/naver-cafe-list.html", window.location.href).toString());
    return;
  }
  emit("notify", `${label}은(는) 정식 서비스에서 이용해 주세요.`);
};
</script>
<template>
  <nav class="bbm-bottom-gnb" aria-label="하단 메뉴">
    <img class="bbm-bottom-gnb__background" :src="bbmIcon('m-gnb-background')" alt="" aria-hidden="true" />
    <div class="bbm-bottom-gnb__inner">
      <template v-for="[label, icon] in items" :key="label">
        <button v-if="icon === 'register'" type="button" class="bbm-bottom-gnb__item is-register" @click="emit('notify', '매물등록은 정식 서비스에서 이용해 주세요.')">
          <span class="bbm-bottom-gnb__register-button"><img :src="bbmIcon('m-gnb-register')" alt="" aria-hidden="true" /></span>
          <span class="bbm-bottom-gnb__register-label">{{ label }}</span>
        </button>
        <button v-else type="button" :class="`bbm-bottom-gnb__item${icon === 'home' ? ' is-active' : ''}`" :aria-current="icon === 'home' ? 'page' : undefined" @click="chooseBottomMenu(label, icon)">
          <img :src="bbmIcon(`m-gnb-${icon}`)" alt="" aria-hidden="true" />
          <span class="bbm-bottom-gnb__label">{{ label }}</span>
        </button>
      </template>
    </div>
  </nav>
</template>
