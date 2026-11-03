<script setup lang="ts">
// 글쓰기 머리(동처띠 NewPublisherActivityV2 실측 2026-11-03, 1080 → 384 ÷ 2.8125):
//   처음 = 닫기 + 글 종류 탭 줄 8개(动态 · 懂车分 · 提问 · 视频 · 长帖 · 卖车帖 · 车主价 · 能耗, 가로로 넘김)
//   글을 쓰기 시작하면 = 닫기 + 「일상 ⇄」 제목 + 오른쪽 임시저장함(내용 없을 때) 또는 미리보기 + 등록.
//   ⇄ 를 누르면 다시 탭 줄이 열린다.
import { nextTick, ref, watch } from "vue";
import Ico from "./Ico.vue";
import { IC } from "../lib/icons";
import { KINDS, type Kind } from "../lib/route";
import { KIND_LABEL } from "../lib/publish";

const p = defineProps<{ kind: Kind; picked: boolean; canPost: boolean; preview?: boolean; drafts?: boolean; postLabel?: string }>();
const emit = defineEmits<{ close: []; post: []; switch: [Kind]; preview: []; drafts: [] }>();
const tabs = ref(!p.picked);
const nav = ref<HTMLElement | null>(null);
watch(() => p.picked, (v) => (tabs.value = !v));
/** 탭 줄이 열리면 지금 종류가 보이게 옮긴다 */
watch(tabs, async (v) => {
  if (!v) return;
  await nextTick();
  nav.value?.querySelector<HTMLElement>(".on")?.scrollIntoView({ inline: "center", block: "nearest" });
}, { immediate: true });
const pick = (k: Kind) => { if (k === p.kind) tabs.value = !p.picked; else emit("switch", k); };
</script>

<template>
  <header class="whead">
    <button type="button" class="whead__x" aria-label="닫기" @click="emit('close')"><Ico :src="IC.close" /></button>
    <nav v-if="tabs" ref="nav" class="whead__tabs" aria-label="글 종류">
      <button v-for="k in KINDS" :key="k" type="button" :class="{ on: k === kind }" :aria-current="k === kind ? 'page' : undefined" @click="pick(k)">{{ KIND_LABEL[k] }}</button>
    </nav>
    <template v-else>
      <h1 class="whead__title"><span>{{ KIND_LABEL[kind] }}</span></h1>
      <button type="button" class="whead__switch" aria-label="글 종류 바꾸기" @click="tabs = true"><Ico :src="IC.switch" /></button>
      <button v-if="drafts && !preview" type="button" class="whead__sub" @click="emit('drafts')"><Ico :src="IC.bookmark" />임시저장함</button>
      <button v-if="preview" type="button" class="whead__sub" @click="emit('preview')">미리보기</button>
      <button type="button" class="whead__post" :class="{ 'is-off': !canPost, 'has-sub': drafts || preview }" :aria-disabled="!canPost" @click="emit('post')">{{ postLabel || "등록" }}</button>
    </template>
  </header>
</template>
