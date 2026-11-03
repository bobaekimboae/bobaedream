<script setup lang="ts">
// 새 글 종류 목록: 내가 등록한 글 + 「글쓰기」. 기본은 이 브라우저, `?api=` 이면 서버(내 글만). (리뷰 · 연비는 기존 게시판 목록을 쓴다)
import { onMounted, ref } from "vue";
import Ico from "../Ico.vue";
import { IC } from "../../lib/icons";
import { KIND_LABEL } from "../../lib/publish";
import { pubApi, type PubKind, type ServerPost } from "../../lib/api/publish-client";
import { ymdKo } from "../../lib/data";
import { back, go, type Kind } from "../../lib/route";

const p = defineProps<{ kind: Kind }>();
const list = ref<ServerPost[]>([]);
const state = ref<"loading" | "ok" | "error">("loading");
const load = async () => {
  state.value = "loading";
  try { list.value = await pubApi.list(p.kind as PubKind); state.value = "ok"; } catch { state.value = "error"; }
};
onMounted(load);
</script>
<template>
  <main class="plist">
    <header class="pprev__head"><button type="button" aria-label="뒤로" @click="back"><Ico :src="IC.back" /></button><b>내 {{ KIND_LABEL[kind] }} 글</b><button type="button" class="plist__new" @click="go({ board: kind, view: 'write' })">글쓰기</button></header>
    <p v-if="state === 'loading'" class="pdetail__none">불러오는 중이에요</p>
    <div v-else-if="state === 'error'" class="pdetail__none"><p>글을 불러오지 못했어요</p><button type="button" class="btn-pri" @click="load">다시 불러오기</button></div>
    <p v-else-if="!list.length" class="pdetail__none">아직 쓴 글이 없어요</p>
    <button v-for="x in list" :key="x.id" type="button" class="plist__row" @click="go({ board: kind, view: 'detail', id: x.id })">
      <img v-if="x.media[0]" :src="x.media[0].kind === 'video' ? x.media[0].cover || '' : x.media[0].src" alt="" />
      <div><b>{{ x.title || x.body.slice(0, 40) || "제목 없음" }}</b><small>{{ ymdKo(x.createdAt) }}</small></div>
    </button>
  </main>
</template>
