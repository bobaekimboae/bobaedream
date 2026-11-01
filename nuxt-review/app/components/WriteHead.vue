<script setup lang="ts">
// 글쓰기 머리(동처띠 NewPublisherActivityV2 실측, 1080 → 384 ÷ 2.8125):
//   차를 고르기 전 = 닫기 + 글 종류 탭 줄(动态 · 懂车分 · … · 能耗 → 보배드림은 리뷰 · 연비·전비 두 개)
//   차를 고른 뒤 = 닫기 + 「리뷰 ⇄」 제목 + 오른쪽 등록 버튼. ⇄ 를 누르면 다시 탭 줄이 열린다.
// 등록 버튼: 리뷰는 늘 눌리고 누를 때 빠진 것을 알려 준다 · 연비는 조건을 채우기 전까지 흐리게(원본과 같음).
import { ref, watch } from "vue";
import Ico from "./Ico.vue";
import { IC } from "../lib/icons";
import type { Board } from "../lib/route";

const p = defineProps<{ kind: Board; picked: boolean; canPost: boolean }>();
const emit = defineEmits<{ close: []; post: []; switch: [Board] }>();
const tabs = ref(!p.picked);
watch(() => p.picked, (v) => (tabs.value = !v));
const KINDS: { id: Board; label: string }[] = [{ id: "review", label: "리뷰" }, { id: "fuel", label: "연비·전비" }];
const pick = (k: Board) => { if (k === p.kind) tabs.value = !p.picked; else emit("switch", k); };
</script>

<template>
  <header class="whead">
    <button type="button" class="whead__x" aria-label="닫기" @click="emit('close')"><Ico :src="IC.close" /></button>
    <nav v-if="tabs" class="whead__tabs" aria-label="글 종류">
      <button v-for="k in KINDS" :key="k.id" type="button" :class="{ on: k.id === kind }" :aria-current="k.id === kind ? 'page' : undefined" @click="pick(k.id)">{{ k.label }}</button>
    </nav>
    <template v-else>
      <h1 class="whead__title"><span>{{ kind === "review" ? "리뷰" : "연비·전비" }}</span></h1>
      <button type="button" class="whead__switch" aria-label="글 종류 바꾸기" @click="tabs = true"><Ico :src="IC.switch" /></button>
      <button type="button" class="whead__post" :class="{ 'is-off': !canPost }" :aria-disabled="!canPost" @click="emit('post')">등록</button>
    </template>
  </header>
</template>
