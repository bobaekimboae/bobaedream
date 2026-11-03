<script setup lang="ts">
// 새 글 종류(일상 · 질문 · 영상 · 긴 글 · 내 차 팔기 · 구매가)의 등록 결과 화면. 서버 연결 전이라 이 브라우저에 저장한 글을 보여 준다.
import { computed } from "vue";
import Ico from "../Ico.vue";
import PostView from "./PostView.vue";
import { IC } from "../../lib/icons";
import { KIND_LABEL, postById } from "../../lib/publish";
import { back, go, type Kind } from "../../lib/route";

const p = defineProps<{ id: string; kind: Kind }>();
const post = computed(() => postById(p.id));
</script>
<template>
  <main class="pdetail">
    <header class="pprev__head"><button type="button" aria-label="뒤로" @click="back"><Ico :src="IC.back" /></button><b>{{ KIND_LABEL[kind] }}</b></header>
    <PostView v-if="post" :post="post" />
    <div v-else class="pdetail__none"><p>글을 찾을 수 없어요</p><button type="button" class="btn-pri" @click="go({ board: kind, view: 'write' })">새 글 쓰기</button></div>
  </main>
</template>
