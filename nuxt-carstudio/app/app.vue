<script setup lang="ts">
// 보배드림 AI 스튜디오: Car Studio AI(app.carstudio.ai)와 같은 화면 구성 · 동작.
// 화면: ?v=orders(기본, 내 프로젝트) · editor(&id=) · video(&step=) · pricing · profile. 페이지 라우터 없이 주소 검색어로 바꾼다(정적 배포).
// 두 가지 모양: PC 웹(위 머리 메뉴) · 모바일 앱(767 이하 또는 ?app=1: 위 짧은 머리 + 아래 탭 막대 + 아래에서 올라오는 시트).
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import Icon from "./components/Icon.vue";
import Orders from "./components/Orders.vue";
import Editor from "./components/Editor.vue";
import Video from "./components/Video.vue";
import Pricing from "./components/Pricing.vue";
import Profile from "./components/Profile.vue";
import BuyCredits from "./components/BuyCredits.vue";
import { go, loadCredits, readRoute, say, ui } from "./lib/app";
import { I, sitePath } from "./lib/site";

const narrow = ref(false);
let mq: MediaQueryList | null = null;
const onMq = () => (narrow.value = !!mq?.matches);
const isApp = computed(() => ui.forceApp || narrow.value);
const menu = ref<"" | "lang" | "user">("");
const logo = sitePath("assets", "bbm", "header-logo.svg");
const LANGS = [
  { id: "ko", label: "한국어" },
  { id: "en", label: "English" },
  { id: "vi", label: "Tiếng Việt" },
  { id: "ja", label: "日本語" },
];
function pickLang(id: string) {
  menu.value = "";
  if (id !== "ko") say("지금은 한국어 화면만 있어요. 다른 언어는 준비 중이에요.");
}
function closeMenus(e: MouseEvent) {
  if (!(e.target as HTMLElement).closest(".menu-wrap")) menu.value = "";
}
onMounted(() => {
  readRoute();
  loadCredits();
  mq = window.matchMedia("(max-width: 767px)");
  onMq();
  mq.addEventListener("change", onMq);
  window.addEventListener("popstate", readRoute);
  document.addEventListener("click", closeMenus);
});
onBeforeUnmount(() => {
  mq?.removeEventListener("change", onMq);
  window.removeEventListener("popstate", readRoute);
  document.removeEventListener("click", closeMenus);
});
const tabOn = (v: string) => ui.view === v;
</script>
<template>
  <div class="cs" :class="{ 'is-app': isApp }">
    <!-- PC 머리(Car Studio: 로고 · PRICING / EDITOR 가운데 · 언어 · 크레딧 + · 프로필) -->
    <header class="hd">
      <div class="hd-in">
        <a class="brand" href="./" @click.prevent="go('orders')"><img :src="logo" alt="보배드림" /> <span>AI <b>스튜디오</b></span></a>
        <nav class="hd-nav" aria-label="주 메뉴">
          <a href="?v=pricing" :class="{ 'is-on': ui.view === 'pricing' }" @click.prevent="go('pricing')">요금제</a>
          <a href="./" :class="{ 'is-on': ui.view === 'orders' || ui.view === 'editor' }" @click.prevent="go('orders')">편집기</a>
          <a href="?v=video" :class="{ 'is-on': ui.view === 'video' }" @click.prevent="go('video')">영상 <span class="badge badge-beta" style="margin-left: 6px">BETA</span></a>
        </nav>
        <div class="hd-right">
          <div class="menu-wrap">
            <button class="pill" type="button" aria-haspopup="menu" :aria-expanded="menu === 'lang'" @click="menu = menu === 'lang' ? '' : 'lang'"><Icon :src="I.language" style="width: 18px; height: 18px" /> KO</button>
            <div v-if="menu === 'lang'" class="menu" role="menu">
              <button v-for="l in LANGS" :key="l.id" type="button" role="menuitem" :class="{ 'is-on': l.id === 'ko', muted: l.id !== 'ko' }" @click="pickLang(l.id)">{{ l.label }}<Icon v-if="l.id === 'ko'" :src="I.check" style="margin-left: auto; width: 16px" /></button>
            </div>
          </div>
          <button class="pill pill-credit" type="button" :aria-label="`크레딧 ${ui.credits}개, 더 사기`" @click="ui.buyOpen = true"><Icon :src="I.spark" style="width: 16px; color: var(--pri)" /> {{ ui.credits }} 크레딧 <span class="plus"><Icon :src="I.add" /></span></button>
          <div class="menu-wrap">
            <button class="avatar" type="button" aria-label="내 정보 메뉴" aria-haspopup="menu" :aria-expanded="menu === 'user'" @click="menu = menu === 'user' ? '' : 'user'"><Icon :src="I.user" /></button>
            <div v-if="menu === 'user'" class="menu" role="menu">
              <button type="button" role="menuitem" @click="menu = ''; go('profile')"><Icon :src="I.settings" /> 내 정보 · 스튜디오 설정</button>
              <button type="button" role="menuitem" @click="menu = ''; go('pricing')"><Icon :src="I.bag" /> 요금제</button>
              <button type="button" role="menuitem" @click="menu = ''; ui.buyOpen = true"><Icon :src="I.spark" /> 크레딧 더 사기</button>
              <a role="menuitem" :href="sitePath('nuxt-shootkit') + '/'"><Icon :src="I.camera" /> 촬영 키트 열기</a>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- 모바일 앱 머리 -->
    <header class="app-top">
      <a class="brand" href="./" @click.prevent="go('orders')"><img :src="logo" alt="보배드림" /></a>
      <span class="grow" />
      <button class="pill pill-credit" type="button" :aria-label="`크레딧 ${ui.credits}개, 더 사기`" @click="ui.buyOpen = true"><Icon :src="I.spark" style="width: 16px; color: var(--pri)" /> {{ ui.credits }} <span class="plus"><Icon :src="I.add" /></span></button>
    </header>

    <main class="main" :class="{ 'has-dl': ui.view === 'editor' && !!ui.id }">
      <Orders v-if="ui.view === 'orders'" :app="isApp" />
      <Editor v-else-if="ui.view === 'editor'" :key="ui.id || 'new'" :app="isApp" />
      <Video v-else-if="ui.view === 'video'" :app="isApp" />
      <Pricing v-else-if="ui.view === 'pricing'" />
      <Profile v-else-if="ui.view === 'profile'" />
    </main>
    <footer class="ft">보배드림 AI 스튜디오 · 시안 화면(서버 없이 이 브라우저 안에서만 동작) · 사진은 밖으로 나가지 않아요</footer>

    <!-- 모바일 앱 아래 탭 막대 -->
    <nav class="tabbar" aria-label="앱 메뉴">
      <a href="./" :class="{ 'is-on': tabOn('orders') }" @click.prevent="go('orders')"><Icon :src="I.grid" />프로젝트</a>
      <a href="?v=video" :class="{ 'is-on': tabOn('video') }" @click.prevent="go('video')"><Icon :src="I.video" />영상</a>
      <a href="?v=editor" class="make" :class="{ 'is-on': tabOn('editor') }" @click.prevent="go('editor')"><span class="fab"><Icon :src="I.add" /></span>새로 만들기</a>
      <a href="?v=pricing" :class="{ 'is-on': tabOn('pricing') }" @click.prevent="go('pricing')"><Icon :src="I.bag" />요금제</a>
      <a href="?v=profile" :class="{ 'is-on': tabOn('profile') }" @click.prevent="go('profile')"><Icon :src="I.user" />내 정보</a>
    </nav>

    <BuyCredits v-if="ui.buyOpen" />
    <div v-if="ui.toast" class="toast" role="status">{{ ui.toast }}</div>
  </div>
</template>
