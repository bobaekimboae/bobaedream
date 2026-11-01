<script setup lang="ts">
// 보배드림 차량 리뷰 · 연비 게시판 — 동처띠(懂车帝) 앱의 懂车分 · 能耗/车主续航 화면과 같은 구조 · 동작.
// 주소 하나로 6개 화면: ?board=review|fuel × view=list|detail|write (&id=)
import { onMounted, ref } from "vue";
import ReviewList from "./components/ReviewList.vue";
import ReviewDetail from "./components/ReviewDetail.vue";
import ReviewWrite from "./components/ReviewWrite.vue";
import FuelList from "./components/FuelList.vue";
import FuelDetail from "./components/FuelDetail.vue";
import FuelWrite from "./components/FuelWrite.vue";
import AskDialog from "./components/AskDialog.vue";
import { route, startRouter, replace, type Board } from "./lib/route";
import { askState, toastState } from "./lib/ui";

const ready = ref(false);
onMounted(() => { startRouter(); ready.value = true; });
/** 글쓰기 머리의 종류 탭: 리뷰 ↔ 연비 글쓰기로 바로 바꾼다(원본 탭과 같음) */
const switchWriter = (b: Board) => replace({ board: b, view: "write" });
</script>

<template>
  <div v-if="ready" class="app" :data-board="route.board" :data-view="route.view">
    <template v-if="route.board === 'review'">
      <ReviewList v-if="route.view === 'list'" />
      <ReviewDetail v-else-if="route.view === 'detail'" :id="route.id" :key="route.id" />
      <ReviewWrite v-else key="rw" @switch="switchWriter" />
    </template>
    <template v-else>
      <FuelList v-if="route.view === 'list'" />
      <FuelDetail v-else-if="route.view === 'detail'" :id="route.id" :key="route.id" />
      <FuelWrite v-else key="fw" @switch="switchWriter" />
    </template>
    <div v-if="toastState.text" :key="toastState.n" class="toast" role="status" aria-live="polite">{{ toastState.text }}</div>
    <AskDialog v-if="askState.v" />
  </div>
</template>
