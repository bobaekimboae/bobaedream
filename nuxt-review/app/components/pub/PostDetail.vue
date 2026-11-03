<script setup lang="ts">
// 새 글 종류(일상 · 질문 · 영상 · 긴 글 · 내 차 팔기 · 구매가)의 등록 결과 화면. 기본은 이 브라우저에 저장한 글, `?api=` 이면 서버 글.
import { onMounted, ref } from "vue";
import Ico from "../Ico.vue";
import PostView from "./PostView.vue";
import { IC } from "../../lib/icons";
import { KIND_LABEL } from "../../lib/publish";
import { pubApi, type PubKind, type ServerPost } from "../../lib/api/publish-client";
import { back, go, type Kind } from "../../lib/route";

const p = defineProps<{ id: string; kind: Kind }>();
const post = ref<ServerPost | null>(null);
const state = ref<"loading" | "ok" | "error">("loading");
const load = async () => {
  state.value = "loading";
  try { post.value = await pubApi.get(p.kind as PubKind, p.id); state.value = "ok"; } catch { state.value = "error"; }
};
onMounted(load);
</script>
<template>
  <main class="pdetail">
    <header class="pprev__head"><button type="button" aria-label="뒤로" @click="back"><Ico :src="IC.back" /></button><b>{{ KIND_LABEL[kind] }}</b></header>
    <p v-if="state === 'loading'" class="pdetail__none">불러오는 중이에요</p>
    <div v-else-if="state === 'error'" class="pdetail__none"><p>글을 불러오지 못했어요</p><button type="button" class="btn-pri" @click="load">다시 불러오기</button></div>
    <PostView v-else-if="post" :post="post" />
    <div v-else class="pdetail__none"><p>글을 찾을 수 없어요</p><button type="button" class="btn-pri" @click="go({ board: kind, view: 'write' })">새 글 쓰기</button></div>
  </main>
</template>
