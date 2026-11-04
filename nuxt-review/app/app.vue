<script setup lang="ts">
// 보배드림 동처띠 글쓰기 키트 — 동처띠(懂车帝 9.2.9) 발행 화면의 글 종류 8개와 리뷰 · 연비 게시판.
// 주소: ?board=dynamic|review|ask|video|long|sell|price|fuel × view=list|detail|write (&id=)
// 리뷰 · 연비는 게시판 목록 · 상세까지, 나머지 6개는 글쓰기 + 내가 쓴 글 보기. 커뮤니티 기본 글쓰기는 치지직 방식으로 따로 둔다.
import { onMounted, ref } from "vue";
import ReviewList from "./components/ReviewList.vue";
import ReviewDetail from "./components/ReviewDetail.vue";
import ReviewWrite from "./components/ReviewWrite.vue";
import FuelList from "./components/FuelList.vue";
import FuelDetail from "./components/FuelDetail.vue";
import FuelWrite from "./components/FuelWrite.vue";
import AskDialog from "./components/AskDialog.vue";
import DynamicWrite from "./components/pub/DynamicWrite.vue";
import AskWrite from "./components/pub/AskWrite.vue";
import VideoWrite from "./components/pub/VideoWrite.vue";
import LongWrite from "./components/pub/LongWrite.vue";
import SellWrite from "./components/pub/SellWrite.vue";
import PriceWrite from "./components/pub/PriceWrite.vue";
import PostDetail from "./components/pub/PostDetail.vue";
import PostList from "./components/pub/PostList.vue";
import { route, startRouter, replace, type Kind } from "./lib/route";
import { askState, toastState } from "./lib/ui";

const ready = ref(false);
onMounted(() => { startRouter(); ready.value = true; });
/** 글쓰기 머리의 종류 탭: 다른 종류 글쓰기로 바로 바꾼다(원본 탭과 같음) */
const switchWriter = (b: Kind) => replace({ board: b, view: "write" });
const WRITERS = { dynamic: DynamicWrite, ask: AskWrite, video: VideoWrite, long: LongWrite, sell: SellWrite, price: PriceWrite } as const;
</script>

<template>
  <div v-if="ready" class="app" :data-board="route.board" :data-view="route.view">
    <template v-if="route.board === 'review'">
      <ReviewList v-if="route.view === 'list'" />
      <ReviewDetail v-else-if="route.view === 'detail'" :id="route.id" :key="route.id" />
      <ReviewWrite v-else key="rw" @switch="switchWriter" />
    </template>
    <template v-else-if="route.board === 'fuel'">
      <FuelList v-if="route.view === 'list'" />
      <FuelDetail v-else-if="route.view === 'detail'" :id="route.id" :key="route.id" />
      <FuelWrite v-else key="fw" @switch="switchWriter" />
    </template>
    <template v-else>
      <PostList v-if="route.view === 'list'" :kind="route.board" />
      <PostDetail v-else-if="route.view === 'detail'" :id="route.id" :key="route.id" :kind="route.board" />
      <component :is="WRITERS[route.board]" v-else :key="route.board" @switch="switchWriter" />
    </template>
    <div v-if="toastState.text" :key="toastState.n" class="toast" role="status" aria-live="polite">{{ toastState.text }}</div>
    <AskDialog v-if="askState.v" />
  </div>
</template>
