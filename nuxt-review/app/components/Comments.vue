<script setup lang="ts">
// 댓글(동처띠 상세 실측): 「전체 댓글 · N」 → 내 프사 + 입력 알약(이미지 · 이모지) → 목록(프사 36 · 이름 · 본문 · 날짜 · 지역 · 답글 · 공감)
// 댓글이 없으면 「아직 첫 댓글이 없어요」 + 첫 댓글 쓰기 버튼(원본 「快来，前排还空着 · 抢首评」).
import { computed, nextTick, reactive, ref } from "vue";
import Ico from "./Ico.vue";
import { IC } from "../lib/icons";
import { site } from "../lib/site";
import { daysAgo, type Comment } from "../lib/data";
import { R, toggle } from "../lib/react";
import { doComment, doUncomment } from "../lib/actions";
import type { Board } from "../lib/api/contract";
import { toast } from "../lib/ui";

const p = defineProps<{ board: Board; postId: string; list: Comment[]; total: number }>();
const open = ref(false);
const openReplies = reactive<Record<string, boolean>>({});
/** 화면 확인용 답글(원본 「展开N条回复」) */
const REPLY = ["저도 같은 생각이에요.", "정보 감사합니다!", "제 차도 비슷하게 나와요."];
const REPLY_NAMES = ["도로위산책", "세차장단골", "출퇴근러", "남해안투어"];
const text = ref("");
const box = ref<HTMLTextAreaElement | null>(null);
const all = computed(() => [...(R.mine[p.postId] ?? []), ...p.list]);
const count = computed(() => Math.max(p.total, p.list.length) + (R.mine[p.postId]?.length ?? 0));

const compose = async () => { open.value = true; await nextTick(); box.value?.focus(); };
defineExpose({ compose });
const send = async () => {
  const t = text.value.trim();
  if (!t) return;
  try {
    await doComment(p.board, p.postId, t);
    text.value = "";
    open.value = false;
    toast("댓글을 달았어요");
  } catch (e) { toast((e as Error).message || "댓글을 달지 못했어요"); }
};
</script>

<template>
  <section class="cmts" aria-label="댓글">
    <h2 class="cmts__h">전체 댓글 · {{ count }}</h2>
    <button type="button" class="cmts__input" @click="compose">
      <img :src="site('community/assets/profile-avatars/avatar-01.svg')" alt="" />
      <span>좋은 댓글이 위에 먼저 보여요</span>
      <Ico :src="IC.image" /><Ico :src="IC.sticker" />
    </button>
    <div v-if="!all.length" class="cmts__empty">
      <b>아직 첫 댓글이 없어요</b>
      <span>의견을 남겨 주세요</span>
      <button type="button" @click="compose">첫 댓글 쓰기</button>
    </div>
    <ul v-else class="cmts__list">
      <li v-for="c in all" :key="c.id" class="cmt">
        <img :src="site(c.avatar)" alt="" class="cmt__av" />
        <div class="cmt__main">
          <b class="cmt__name">{{ c.author }}</b>
          <p class="cmt__body">{{ c.body }}</p>
          <div class="cmt__meta">
            <span>{{ c.daysAgo ? daysAgo(c.daysAgo) : "방금" }}<template v-if="c.region"> · {{ c.region }}</template></span>
            <button v-if="c.author === '나'" type="button" @click="doUncomment(board, postId, c.id)">삭제</button>
            <button v-else type="button" @click="compose">답글</button>
          </div>
          <ul v-if="openReplies[c.id]" class="cmt__replies">
            <li v-for="(t, j) in REPLY.slice(0, c.replies)" :key="j"><b>{{ REPLY_NAMES[(j + c.likes) % REPLY_NAMES.length] }}</b>{{ t }}</li>
          </ul>
          <button v-if="c.replies" type="button" class="cmt__more" :aria-expanded="Boolean(openReplies[c.id])" @click="openReplies[c.id] = !openReplies[c.id]">{{ openReplies[c.id] ? "답글 접기" : `답글 ${c.replies}개 더 보기` }}<i :class="{ up: openReplies[c.id] }" /></button>
        </div>
        <div class="cmt__votes">
        <button type="button" class="cmt__like" :class="{ on: R.cLike[c.id] }" :aria-pressed="Boolean(R.cLike[c.id])" :aria-label="`공감 ${c.likes + (R.cLike[c.id] ? 1 : 0)}`" @click="toggle('cLike', c.id)">
          <Ico :src="IC.like" /><span>{{ c.likes + (R.cLike[c.id] ? 1 : 0) || "공감" }}</span>
        </button>
        <button type="button" class="cmt__like" :class="{ on: R.cLike['x' + c.id] }" :aria-pressed="Boolean(R.cLike['x' + c.id])" aria-label="비공감" @click="toggle('cLike', 'x' + c.id)"><Ico :src="IC.dislike" /></button>
        </div>
      </li>
      <li class="cmts__end">더 이상 댓글이 없어요</li>
    </ul>

    <div v-if="open" class="compose" role="dialog" aria-modal="true" aria-label="댓글 쓰기">
      <div class="compose__dim" @click="open = false" />
      <div class="compose__box">
        <textarea ref="box" v-model="text" maxlength="500" rows="3" placeholder="좋은 댓글이 위에 먼저 보여요" aria-label="댓글" @keydown.esc="open = false" />
        <div class="compose__foot"><span>{{ [...text].length }}/500</span><button type="button" :disabled="!text.trim()" @click="send">등록</button></div>
      </div>
    </div>
  </section>
</template>
