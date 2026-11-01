<script setup lang="ts">
// 리뷰 목록(동처띠 차량 모임 「懂车分」 탭 실측 2026-11-01):
//   점수판(평균 · 별 · 평가 말 · 참여 수 · 항목 막대 2열) → 순위 줄 → 차종 고르기 · 오너만 보기 → 정렬 알약 → 키워드 알약(펼치기) → 카드 → 「리뷰 쓰기」 떠 있는 버튼
import { computed, ref } from "vue";
import Ico from "./Ico.vue";
import Stars from "./Stars.vue";
import ListHead from "./ListHead.vue";
import Sheet from "./Sheet.vue";
import { IC } from "../lib/icons";
import { asset, site } from "../lib/site";
import { avg, fmtScore, scoreWord, ymd, type Review } from "../lib/data";
import { R, likeCount, toggle } from "../lib/react";
import { doVote, useReviews } from "../lib/actions";
import { go } from "../lib/route";
import { toast } from "../lib/ui";

const allRef = useReviews();
const all = computed(() => allRef.value);
const model = ref("");
const ownerOnly = ref(false);
const sort = ref<"all" | "new" | "bad" | "like">("all");
const tag = ref("");
const tagsOpen = ref(false);
const q = ref("");
const sheet = ref<"" | "model" | "rank">("");

const TAGS: [string, RegExp][] = [
  ["승차감 좋음", /승차감|편안|부드럽/], ["가속 시원함", /가속|힘이|출력/], ["연비 좋음", /연비|전비|효율/], ["공간 넉넉", /공간|트렁크|넉넉/],
  ["조용함", /정숙|조용/], ["핸들링 좋음", /조향|핸들링|코너/], ["옵션 풍부", /옵션|사양|편의/], ["디자인 만족", /디자인|외관|멋/], ["소음 아쉬움", /소음|시끄/], ["가격 아쉬움", /가격|비싸|부담/],
];
const scope = computed(() => all.value.filter((r) => (!model.value || `${r.brand} ${r.model}` === model.value) && (!ownerOnly.value || r.owner)));
const tags = computed(() => TAGS.map(([t, re]) => ({ t, n: scope.value.filter((r) => re.test(r.body)).length })).filter((x) => x.n).sort((a, b) => b.n - a.n));
const badPct = computed(() => Math.round((scope.value.filter((r) => r.rating < 3.5).length / (scope.value.length || 1)) * 100));
const list = computed(() => {
  const re = TAGS.find(([t]) => t === tag.value)?.[1];
  const k = q.value.replace(/\s/g, "").toLowerCase();
  let xs = scope.value.filter((r) => (!re || re.test(r.body)) && (!k || `${r.brand}${r.model}${r.title}${r.body}`.replace(/\s/g, "").toLowerCase().includes(k)));
  if (sort.value === "new") xs = [...xs].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  if (sort.value === "bad") xs = xs.filter((r) => r.rating < 3.5);
  if (sort.value === "like") xs = [...xs].sort((a, b) => b.likes - a.likes);
  return xs;
});
const score = computed(() => avg(scope.value.map((r) => r.rating)));
const bars = computed(() => {
  const m = new Map<string, number[]>();
  for (const r of scope.value) for (const x of r.ratings) m.set(x.label, [...(m.get(x.label) ?? []), x.score]);
  return [...m.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 7).map(([label, xs]) => ({ label: label.replace("편의·안전 사양", "사양").replace("동력·핸들링", "동력").replace("주행거리·전비", "주행거리"), v: avg(xs) }));
});
const models = computed(() => {
  const m = new Map<string, { name: string; n: number; s: number[] }>();
  for (const r of all.value) { const k = `${r.brand} ${r.model}`; const x = m.get(k) ?? { name: k, n: 0, s: [] }; x.n += 1; x.s.push(r.rating); m.set(k, x); }
  return [...m.values()].sort((a, b) => b.n - a.n);
});
const rank = computed(() => {
  if (!model.value) return null;
  const sorted = [...models.value].sort((a, b) => avg(b.s) - avg(a.s));
  return sorted.findIndex((x) => x.name === model.value) + 1;
});
const segment = computed(() => scope.value[0]?.benchmark?.replace(/평균.*/, "").trim() || "같은 차급");
const segAvg = computed(() => Number((scope.value[0]?.benchmark?.match(/([\d.]+)$/) || [0, avg(all.value.map((r) => r.rating))])[1]));
const hot = (r: Review) => r.commentList[0];
const share = async (r: Review) => {
  const url = new URL(`?board=review&view=detail&id=${r.id}`, window.location.href).href;
  try { if (navigator.share) await navigator.share({ title: r.title, url }); else { await navigator.clipboard.writeText(url); toast("링크를 복사했어요"); } } catch { /* 취소 */ }
};
const open = (r: Review) => go({ board: "review", view: "detail", id: r.id });
</script>

<template>
  <main class="list">
    <ListHead board="review" :title="model || '차량 리뷰'" :q="q" @update:q="q = $event" />

    <section class="score">
      <div class="score__main">
        <span class="score__brand">보배<br />점수</span>
        <b class="score__num">{{ score ? score.toFixed(2) : "-" }}</b>
        <div class="score__sub"><Stars :score="score" :size="12" /><span>{{ scoreWord(score) }}</span></div>
        <span class="score__cnt">{{ scope.length.toLocaleString() }}명 평가</span>
      </div>
      <ul class="score__bars">
        <li v-for="b in bars" :key="b.label"><span>{{ b.label }}</span><b>{{ b.v.toFixed(1) }}</b><i><em :style="{ width: `${(b.v / 5) * 100}%` }" /></i></li>
      </ul>
    </section>
    <div class="score__rank">
      <button type="button" @click="sheet = 'rank'">{{ segment }} <template v-if="rank">NO.{{ rank }}</template><template v-else>전체 {{ models.length }}개 차종</template><Ico :src="IC.chevron" /></button>
      <button type="button" @click="sheet = 'rank'">같은 차급 평균 {{ segAvg.toFixed(2) }}<i class="tri" /></button>
    </div>

    <div class="filters">
      <button type="button" class="filters__model" @click="sheet = 'model'">{{ model || "전체 차종" }}<i class="tri" /></button>
      <label class="switch"><span>오너만 보기</span><input v-model="ownerOnly" type="checkbox" role="switch" /><i /></label>
    </div>
    <div class="sorts" role="tablist" aria-label="정렬">
      <button v-for="s in ([['all', '전체'], ['new', '최신순'], ['bad', `혹평(${badPct}%)`], ['like', '공감 많은 순']] as const)" :key="s[0]" type="button" role="tab" :aria-selected="sort === s[0]" :class="{ on: sort === s[0] }" @click="sort = s[0]">{{ s[1] }}</button>
    </div>
    <div class="tags" :class="{ open: tagsOpen }">
      <button v-for="x in tags" :key="x.t" type="button" :class="{ on: tag === x.t }" :aria-pressed="tag === x.t" @click="tag = tag === x.t ? '' : x.t">{{ x.t }}({{ x.n }})</button>
    </div>
    <button v-if="tags.length > 4" type="button" class="tags__more" :aria-expanded="tagsOpen" @click="tagsOpen = !tagsOpen">{{ tagsOpen ? "접기" : "펼치기" }}<i class="tri" :class="{ up: tagsOpen }" /></button>

    <div class="feed">
      <template v-for="(r, i) in list" :key="r.id">
        <article class="rcard" @click="open(r)">
          <header class="rcard__who">
            <img :src="site(r.avatar)" alt="" class="rcard__av" />
            <div><b>{{ r.author }}</b><span><img v-if="r.brandLogo" :src="asset(r.brandLogo)" alt="" />{{ r.model }} {{ r.owner ? "오너 · 인증" : "시승" }}</span></div>
            <button type="button" class="follow" :class="{ on: R.follow[r.author] }" @click.stop="toggle('follow', r.author)">{{ R.follow[r.author] ? "팔로잉" : "팔로우" }}</button>
          </header>
          <div class="rcard__score"><Stars :score="r.rating" :size="13" /><b>{{ fmtScore(r.rating) }}</b><span>“{{ scoreWord(r.rating) }}”</span><span>{{ r.year }}년식</span><span v-if="r.owner" class="rcard__own">{{ r.ownership }}</span></div>
          <p class="rcard__body">{{ r.body }}</p>
          <div v-if="r.images.length" class="rcard__imgs"><img v-for="(src, j) in r.images.slice(0, 3)" :key="j" :src="src.startsWith('data:') ? src : asset(src)" alt="" loading="lazy" /></div>
          <time class="rcard__date">{{ ymd(r.publishedAt) }}</time>
          <div v-if="hot(r)" class="rcard__hot"><span><img :src="site(hot(r)!.avatar)" alt="" />{{ hot(r)!.author }}</span><p>{{ hot(r)!.body }}</p><Ico :src="IC.like" /></div>
          <footer class="rcard__act" @click.stop>
            <button type="button" @click="share(r)"><Ico :src="IC.share" />공유</button>
            <button type="button" @click="open(r)"><Ico :src="IC.comment" />{{ r.comments || "댓글" }}</button>
            <span class="vote">
              <button type="button" :class="{ on: R.like[r.id] === 1 }" :aria-pressed="R.like[r.id] === 1" @click="doVote('review', r.id, 1)"><Ico :src="IC.like" />공감 <template v-if="likeCount(r.id, r.likes)">{{ likeCount(r.id, r.likes) }}</template></button>
              <button type="button" :class="{ on: R.like[r.id] === -1 }" :aria-pressed="R.like[r.id] === -1" aria-label="비공감" @click="doVote('review', r.id, -1)"><Ico :src="IC.dislike" /></button>
            </span>
          </footer>
        </article>
        <aside v-if="i === 2" class="banner"><div><b>오너 평가단 모집</b><span>내 차 리뷰를 쓰고 평가단이 되어 보세요 <em @click="go({ board: 'review', view: 'write' })">바로 참여 ›</em></span></div><img :src="asset('cars/seoul-autogallery-v01/sag-02-1.webp')" alt="" /></aside>
      </template>
      <p v-if="!list.length" class="empty">조건에 맞는 리뷰가 없어요</p>
      <p v-else class="feed__end">더 이상 리뷰가 없어요</p>
    </div>

    <button type="button" class="fab" @click="go({ board: 'review', view: 'write' })"><Ico :src="IC.edit" />리뷰 쓰기</button>

    <Sheet v-if="sheet === 'model'" title="차종 선택" @close="sheet = ''">
      <button type="button" class="opt" :class="{ on: !model }" @click="model = ''; sheet = ''">전체 차종<span>{{ all.length }}</span></button>
      <button v-for="m in models" :key="m.name" type="button" class="opt" :class="{ on: model === m.name }" @click="model = m.name; sheet = ''">{{ m.name }}<span>{{ m.n }}</span></button>
    </Sheet>
    <Sheet v-if="sheet === 'rank'" title="평점 순위" @close="sheet = ''">
      <button v-for="(m, i) in [...models].sort((a, b) => avg(b.s) - avg(a.s))" :key="m.name" type="button" class="opt opt--rank" :class="{ on: model === m.name }" @click="model = m.name; sheet = ''"><em>{{ i + 1 }}</em>{{ m.name }}<span>{{ avg(m.s).toFixed(2) }}</span></button>
    </Sheet>
  </main>
</template>
