<script setup lang="ts">
// 새 글 종류 목록: 이 브라우저에서 등록한 글 + 「글쓰기」. (리뷰 · 연비는 기존 게시판 목록을 쓴다)
import { computed } from "vue";
import Ico from "../Ico.vue";
import { IC } from "../../lib/icons";
import { KIND_LABEL, posts } from "../../lib/publish";
import { ymdKo } from "../../lib/data";
import { back, go, type Kind } from "../../lib/route";

const p = defineProps<{ kind: Kind }>();
const list = computed(() => posts(p.kind));
</script>
<template>
  <main class="plist">
    <header class="pprev__head"><button type="button" aria-label="뒤로" @click="back"><Ico :src="IC.back" /></button><b>내 {{ KIND_LABEL[kind] }} 글</b><button type="button" class="plist__new" @click="go({ board: kind, view: 'write' })">글쓰기</button></header>
    <p v-if="!list.length" class="pdetail__none">아직 쓴 글이 없어요</p>
    <button v-for="x in list" :key="x.id" type="button" class="plist__row" @click="go({ board: kind, view: 'detail', id: x.id })">
      <img v-if="x.media[0]" :src="x.media[0].kind === 'video' ? x.media[0].cover || '' : x.media[0].src" alt="" />
      <div><b>{{ x.title || x.body.slice(0, 40) || "제목 없음" }}</b><small>{{ ymdKo(x.createdAt) }}</small></div>
    </button>
  </main>
</template>
