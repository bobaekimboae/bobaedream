<script setup lang="ts">
// 리뷰 상세(동처띠 실측): 어두운 머리 · 작성자 · 팔로우 → 어두운 점수판(평가 차종 · 별 · 점수 · 평가 말, 차종 줄, 항목 점수 4열)
// → 작성일 → 보유 기간 상자(구매 시기 · 차량 가격 · 구매 지역 · 실연비) → 본문 → 사진 → 댓글 → 아래 고정 막대.
// 스크롤하면 머리가 흰색으로 바뀌고 작성자 이름이 머리에 붙는다(원본 상세 머리 동작).
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import Ico from "./Ico.vue";
import Stars from "./Stars.vue";
import Comments from "./Comments.vue";
import DetailBar from "./DetailBar.vue";
import { IC } from "../lib/icons";
import { asset, site } from "../lib/site";
import { fmtScore, scoreWord, ymd } from "../lib/data";
import { R, toggle } from "../lib/react";
import { back, go, replace } from "../lib/route";
import { ask, toast } from "../lib/ui";
import { api } from "../lib/api/client";
import { useReviews } from "../lib/actions";

const p = defineProps<{ id: string }>();
const list = useReviews();
const r = computed(() => list.value.find((x) => x.id === p.id));
const cmts = ref<InstanceType<typeof Comments> | null>(null);
const solid = ref(false);
const onScroll = () => (solid.value = window.scrollY > 140);
onMounted(() => window.addEventListener("scroll", onScroll, { passive: true }));
onBeforeUnmount(() => window.removeEventListener("scroll", onScroll));
/** 점수판 4열에 맞춘 짧은 이름(원본 外观 · 内饰 · 空间 · 配置 · 驾驶感受 · 续航能耗) */
const short = (l: string) => ({ "편의·안전 사양": "사양", "동력·핸들링": "동력", "주행거리·전비": "주행거리", "인포테인먼트": "인포", "주행 보조": "주행보조" } as Record<string, string>)[l] ?? l;
const img = (s: string) => (s.startsWith("data:") ? s : asset(s));
const share = async () => {
  try { if (navigator.share) await navigator.share({ title: r.value?.title, url: window.location.href }); else { await navigator.clipboard.writeText(window.location.href); toast("링크를 복사했어요"); } } catch { /* 취소 */ }
};
const del = async () => {
  if (!r.value) return;
  const keep = await ask("이 리뷰를 지울까요?", "지우기", "그대로 두기");
  if (!keep) { await api.deletePost("review", r.value.id); toast("리뷰를 지웠어요"); replace({ board: "review", view: "list" }); }
};
</script>

<template>
  <main v-if="r" class="rdet">
    <header class="rdet__head" :class="{ solid }">
      <button type="button" class="hicon" aria-label="뒤로" @click="back"><Ico :src="IC.back" /></button>
      <span v-if="solid" class="rdet__mini"><img :src="site(r.avatar)" alt="" />{{ r.author }}</span>
      <span class="sp" />
      <button type="button" class="hicon" aria-label="게시판 검색" @click="go({ board: 'review', view: 'list' })"><Ico :src="IC.search" /></button>
      <button type="button" class="hicon" aria-label="공유" @click="share"><Ico :src="IC.share" /></button>
    </header>

    <section class="rdet__dark">
      <div class="rdet__who">
        <img :src="site(r.avatar)" alt="" />
        <div><b>{{ r.author }}</b><span>{{ r.model }} {{ r.owner ? "오너" : "시승" }}<template v-if="r.location"> · {{ r.location }}</template></span></div>
        <button v-if="r.can?.delete ?? r.mine" type="button" class="rdet__del" @click="del">삭제</button>
        <button v-else type="button" class="follow follow--dark" :class="{ on: R.follow[r.author] }" @click="toggle('follow', r.author)">{{ R.follow[r.author] ? "팔로잉" : "+ 팔로우" }}</button>
      </div>
      <div class="rdet__board">
        <div class="rdet__line"><b>{{ r.brand }} {{ r.model }} 평가</b><Stars :score="r.rating" :size="12" /><em>{{ fmtScore(r.rating) }}</em><span>“{{ scoreWord(r.rating) }}”</span></div>
        <button type="button" class="rdet__trim" @click="go({ board: 'review', view: 'list' })">차종: {{ r.trim }}<i class="tri tri--r" /></button>
        <dl class="rdet__grid"><div v-for="x in r.ratings" :key="x.label"><dt>{{ short(x.label) }}</dt><dd>{{ x.score.toFixed(1) }}</dd></div></dl>
      </div>
    </section>

    <section class="rdet__body">
      <time class="rdet__date">{{ ymd(r.publishedAt) }} 리뷰 작성</time>
      <div v-if="r.owner" class="own">
        <b class="own__t"><Ico :src="IC.odometer" />{{ r.ownership }}</b>
        <dl v-if="r.purchase" class="own__grid">
          <div><dd>{{ r.purchase.month }}</dd><dt>구매 시기</dt></div>
          <div><dd>{{ r.purchase.price.toLocaleString() }}만원</dd><dt>차량 가격</dt></div>
          <div><dd>{{ r.purchase.city }}</dd><dt>구매 지역</dt></div>
          <div><dd>{{ r.purchase.metric }}</dd><dt>{{ r.powertrain === "ev" ? "실주행거리" : "실연비" }}</dt></div>
        </dl>
      </div>
      <p class="rdet__text">{{ r.body }}</p>
      <img v-for="(s, i) in r.images" :key="i" class="rdet__img" :src="img(s)" alt="" loading="lazy" />
      <p class="rdet__views">조회 {{ r.views.toLocaleString() }}</p>
    </section>

    <Comments ref="cmts" board="review" :post-id="r.id" :list="r.commentList" :total="r.comments" />
    <DetailBar board="review" :id="r.id" :likes="r.likes" :comments="r.comments" dislike @comment="cmts?.compose()" />
  </main>
  <main v-else class="gone"><p>지워졌거나 없는 리뷰예요</p><button type="button" @click="replace({ board: 'review', view: 'list' })">목록으로</button></main>
</template>
