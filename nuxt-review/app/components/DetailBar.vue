<script setup lang="ts">
// 상세 아래 고정 막대(동처띠 실측): 「说点什么…」 입력 알약 + 댓글(없으면 「첫 댓글」) · 공감 · 즐겨찾기 (리뷰는 비공감도)
import Ico from "./Ico.vue";
import { IC } from "../lib/icons";
import { R, likeCount } from "../lib/react";
import { doBookmark, doVote } from "../lib/actions";
import type { Board } from "../lib/api/contract";

const p = defineProps<{ board: Board; id: string; likes: number; comments: number; dislike?: boolean }>();
const emit = defineEmits<{ comment: [] }>();
const save = () => doBookmark(p.board, p.id);
</script>
<template>
  <nav class="dbar" aria-label="반응">
    <button type="button" class="dbar__input" @click="emit('comment')"><Ico :src="IC.edit" />댓글을 남겨 주세요</button>
    <button type="button" class="dbar__btn" @click="emit('comment')"><Ico :src="IC.comment" /><span>{{ comments || "첫 댓글" }}</span></button>
    <button type="button" class="dbar__btn" :class="{ on: R.like[id] === 1 }" :aria-pressed="R.like[id] === 1" @click="doVote(board, id, 1)"><Ico :src="IC.like" /><span>{{ likeCount(id, likes) || "공감" }}</span></button>
    <button type="button" class="dbar__btn" :class="{ on: R.save[id] }" :aria-pressed="Boolean(R.save[id])" @click="save"><Ico :src="R.save[id] ? IC.bookmarkOn : IC.bookmark" /><span>즐겨찾기</span></button>
    <button v-if="dislike" type="button" class="dbar__btn" :class="{ on: R.like[id] === -1 }" :aria-pressed="R.like[id] === -1" @click="doVote(board, id, -1)"><Ico :src="IC.dislike" /><span>비공감</span></button>
  </nav>
</template>
