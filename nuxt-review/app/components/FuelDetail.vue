<script setup lang="ts">
// 연비 상세(동처띠 실측): 머리(뒤로 · 프사 · 이름 · 팔로우 · 오너 줄 · 검색 · 공유) → 사진 넘기기(공유 카드 + 올린 사진, n/N)
// → 파란 제목 「모델 연비·전비 공유 (✎ 같은 차로 쓰기)」 → 본문 → 정보 상자(주행거리 · 연비 · 전비 · 완충 주행거리 · 온도) → 날짜 · 지역 → 차종 모임 카드 → 댓글 → 아래 막대
import { computed, ref } from "vue";
import Ico from "./Ico.vue";
import EnergyCard from "./EnergyCard.vue";
import Comments from "./Comments.vue";
import DetailBar from "./DetailBar.vue";
import { IC } from "../lib/icons";
import { asset, site } from "../lib/site";
import { fuelPosts, fuelText, ymdKo } from "../lib/data";
import { R, toggle } from "../lib/react";
import { back, go, replace } from "../lib/route";
import { ask, toast } from "../lib/ui";
import { api } from "../lib/api/client";
import { useFuel } from "../lib/actions";

const p = defineProps<{ id: string }>();
const list = useFuel();
const post = computed(() => list.value.find((x) => x.id === p.id));
const cmts = ref<InstanceType<typeof Comments> | null>(null);
const slide = ref(0);
const strip = ref<HTMLElement | null>(null);
const slides = computed(() => (post.value ? 1 + post.value.images.filter((s) => s !== post.value!.photo).length : 1));
const extra = computed(() => (post.value ? post.value.images.filter((s) => s !== post.value!.photo) : []));
const members = computed(() => fuelPosts().filter((x) => x.model === post.value?.model).length * 1287 + 3021);
const onStrip = () => { const el = strip.value; if (el) slide.value = Math.round(el.scrollLeft / el.clientWidth); };
const img = (s: string) => (s.startsWith("data:") ? s : asset(s));
const share = async () => {
  try { if (navigator.share) await navigator.share({ title: post.value?.title, url: window.location.href }); else { await navigator.clipboard.writeText(window.location.href); toast("링크를 복사했어요"); } } catch { /* 취소 */ }
};
const del = async () => {
  if (!post.value) return;
  const keep = await ask("이 기록을 지울까요?", "지우기", "그대로 두기");
  if (!keep) { await api.deletePost("fuel", post.value.id); toast("기록을 지웠어요"); replace({ board: "fuel", view: "list" }); }
};
</script>

<template>
  <main v-if="post" class="fdet">
    <header class="fdet__head">
      <button type="button" class="hicon" aria-label="뒤로" @click="back"><Ico :src="IC.back" /></button>
      <img :src="site(post.avatar)" alt="" class="fdet__av" />
      <div class="fdet__who"><b>{{ post.author }}<button v-if="!(post.can?.delete ?? post.mine)" type="button" class="follow follow--text" :class="{ on: R.follow[post.author] }" @click="toggle('follow', post.author)">{{ R.follow[post.author] ? "팔로잉" : "팔로우" }}</button></b><span><img v-if="post.brandLogo" :src="asset(post.brandLogo)" alt="" />{{ post.model }} 오너 · 보유 {{ post.ownerYears }}년</span></div>
      <button type="button" class="hicon" aria-label="게시판 검색" @click="go({ board: 'fuel', view: 'list' })"><Ico :src="IC.search" /></button>
      <button type="button" class="hicon" aria-label="공유" @click="share"><Ico :src="IC.share" /></button>
    </header>

    <div class="fdet__gallery">
      <div ref="strip" class="fdet__strip" @scroll.passive="onStrip">
        <div class="fdet__slide"><EnergyCard :post="post" :width="230" /></div>
        <div v-for="(s, i) in extra" :key="i" class="fdet__slide"><img :src="img(s)" alt="" loading="lazy" /></div>
      </div>
      <span v-if="slides > 1" class="fdet__count">{{ slide + 1 }}/{{ slides }}</span>
    </div>

    <section class="fdet__body">
      <h1 class="fdet__title">{{ post.model }} 연비·전비 공유<button type="button" @click="go({ board: 'fuel', view: 'write' })">(<Ico :src="IC.edit" />같은 차로 쓰기)</button></h1>
      <p v-if="post.title && !post.title.endsWith('공유')" class="fdet__sub">{{ post.title }}</p>
      <p class="fdet__text">{{ post.body }}</p>
      <dl class="fdet__info">
        <div><dt><Ico :src="IC.odometer" />주행거리</dt><dd>{{ post.odometer.toLocaleString() }}km</dd></div>
        <div v-for="x in fuelText(post)" :key="x.label"><dt>{{ x.label }}</dt><dd>{{ x.value }}{{ x.unit }}</dd></div>
        <div v-if="post.range"><dt>완충 실주행거리</dt><dd>{{ post.range }}km</dd></div>
        <div v-if="post.temperature != null"><dt>측정 온도</dt><dd>{{ post.temperature }}℃</dd></div>
      </dl>
      <p class="fdet__meta">{{ ymdKo(post.publishedAt) }} · {{ post.city }}<button v-if="post.can?.delete ?? post.mine" type="button" @click="del">삭제</button></p>
      <div class="club">
        <img v-if="post.photo" :src="asset(post.photo)" alt="" />
        <div><b>{{ post.model }} · 오너 모임</b><span>{{ members.toLocaleString() }}명 활동 중</span></div>
        <div class="club__btns"><button type="button" @click="go({ board: 'review', view: 'list' })">리뷰 보기</button><button type="button" class="on" @click="go({ board: 'fuel', view: 'list' })">기록 더 보기</button></div>
      </div>
    </section>

    <Comments ref="cmts" board="fuel" :post-id="post.id" :list="post.commentList" :total="post.comments" />
    <DetailBar board="fuel" :id="post.id" :likes="post.likes" :comments="post.comments" @comment="cmts?.compose()" />
  </main>
  <main v-else class="gone"><p>지워졌거나 없는 기록이에요</p><button type="button" @click="replace({ board: 'fuel', view: 'list' })">목록으로</button></main>
</template>
