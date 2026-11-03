<script setup lang="ts">
// 원본 홈: 로고 · 크레딧 / Welcome / Photo Shooting · Create Video / Previous Uploads(Photos | My Videos · 검색 · 카드) / 아래 Home · 카메라 · Profile
import { computed, onBeforeUnmount, ref, watch } from "vue";
import Icon from "./Icon.vue";
import { state, removeVideo } from "../lib/store";
import { fileName } from "../lib/jobs";
import { as, ct, rd, sitePath } from "../lib/site";
import type { VideoItem } from "../lib/types";
import { isPc } from "../lib/layout";

const emit = defineEmits<{ go: [v: string, extra?: Record<string, string>]; pay: []; toast: [t: string] }>();
// 원본 기본 탭은 「사진」. 영상을 만들고 돌아오면(?tab=videos) 「내 영상」
const tab = ref<"photos" | "videos">(new URLSearchParams(window.location.search).get("tab") === "videos" ? "videos" : "photos");
const q = ref("");
const shoot = sitePath("nuxt-shootkit", "");
const sample = (n: string) => sitePath("assets", "cars", "seoul-autogallery-v01", "rr", n);
const list = computed(() => state.videos.filter((v) => !q.value.trim() || `${v.title} ${v.id}`.toLowerCase().includes(q.value.trim().toLowerCase())));
const photoSets = computed(() => list.value.filter((v) => v.photos.length));
const date = (t: number) => new Date(t).toLocaleDateString("en-GB").replace(/\//g, "/");

// 사진 탭: 카드마다 큰 사진 + ‹ › + 작은 사진 줄
const idx = ref<Record<string, number>>({});
const urls = new Map<Blob, string>();
const urlOf = (b: Blob) => { let u = urls.get(b); if (!u) { u = URL.createObjectURL(b); urls.set(b, u); } return u; };
onBeforeUnmount(() => urls.forEach((u) => URL.revokeObjectURL(u)));
const vurls = new Map<string, string>();
const vurl = (v: VideoItem) => { if (!v.video) return ""; let u = vurls.get(v.id); if (!u) { u = URL.createObjectURL(v.video); vurls.set(v.id, u); } return u; };
onBeforeUnmount(() => vurls.forEach((u) => URL.revokeObjectURL(u)));
const step = (v: VideoItem, d: number) => { const n = v.photos.length; idx.value[v.id] = ((idx.value[v.id] ?? 0) + d + n) % n; };
watch(() => state.videos.length, () => { if (state.videos.some((v) => v.status !== "failed") && tab.value === "photos" && !photoSets.value.length) tab.value = "videos"; });

function download(v: VideoItem) {
  if (!v.video) return;
  const a = document.createElement("a");
  a.href = vurl(v);
  a.download = fileName(v);
  a.click();
  emit("toast", "영상을 저장했어요.");
}
async function share(v: VideoItem) {
  if (!v.video) return;
  const file = new File([v.video], fileName(v), { type: "video/mp4" });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: v.title }); } catch { /* 닫음 */ }
  } else download(v);
}
</script>

<template>
  <header v-if="!isPc" class="home-top">
    <div class="wordmark">보배 카스튜디오<small>BOBAEDREAM CAR STUDIO</small></div>
    <button class="credit" type="button" :aria-label="`남은 크레딧 ${state.credits}개 · 크레딧 사기`" @click="emit('pay')">{{ state.credits }} <i>+</i></button>
  </header>
  <main class="home-main">
    <h1 class="welcome">환영합니다 <b>{{ state.profile.name || "딜러님" }}</b></h1>
    <div class="feat">
      <a class="feat-card" :href="shoot" style="text-decoration: none; color: inherit">
        <b>사진 촬영</b><span>스튜디오 품질로 찍기</span>
        <span class="art"><img :src="sample('rr-05.jpg')" alt="" style="width: 100%" /></span>
      </a>
      <button class="feat-card" type="button" @click="emit('go', 'start')">
        <b>영상 만들기</b><span>사진을 영상으로</span>
        <span class="art"><img :src="sample('rr-02.jpg')" alt="" style="width: 34px" /><span class="arrow">→</span><img :src="sample('rr-01.jpg')" alt="" style="flex: 1; min-width: 0" /></span>
      </button>
    </div>
    <div class="divider" />
    <h2 class="h2">이전 작업</h2>
    <div class="seg" role="tablist">
      <button role="tab" type="button" :aria-selected="tab === 'photos'" @click="tab = 'photos'">사진</button>
      <button role="tab" type="button" :aria-selected="tab === 'videos'" @click="tab = 'videos'">내 영상</button>
    </div>
    <label class="search"><Icon :src="ct('chotot-common-search')" /><span class="sr">이전 작업 검색</span><input v-model="q" placeholder="이전 작업 검색" /></label>

    <div class="upl-list" :class="tab">
    <template v-if="tab === 'photos'">
      <p v-if="!photoSets.length" class="empty">아직 올린 사진이 없어요.<br />「영상 만들기」에서 차량 사진을 올려 보세요.</p>
      <section v-for="v in photoSets" :key="v.id" class="upl">
        <div class="upl-h"><span>{{ v.id }} · {{ date(v.createdAt) }}</span><button type="button" @click="v.status === 'making' ? emit('go', 'making', { id: v.id }) : emit('go', 'result', { id: v.id })">자세히 <Icon :src="rd('back-outline-24')" style="transform: rotate(180deg)" /></button></div>
        <div class="ph-main">
          <img :src="urlOf(v.photos[idx[v.id] ?? 0]!)" :alt="`${v.title} 사진 ${(idx[v.id] ?? 0) + 1}`" />
          <button class="ph-nav l" type="button" aria-label="이전 사진" @click="step(v, -1)"><Icon :src="rd('back-outline-24')" /></button>
          <button class="ph-nav r" type="button" aria-label="다음 사진" @click="step(v, 1)"><Icon :src="rd('back-outline-24')" style="transform: rotate(180deg)" /></button>
        </div>
        <div class="photo-strip"><img v-for="(b, i) in v.photos" :key="i" :src="urlOf(b)" alt="" :style="{ outline: i === (idx[v.id] ?? 0) ? '2px solid var(--or)' : 'none' }" @click="idx[v.id] = i" /></div>
      </section>
    </template>
    <template v-else>
      <p v-if="!list.length" class="empty">아직 만든 영상이 없어요.</p>
      <section v-for="v in list" :key="v.id" class="upl">
        <div class="upl-h"><span>{{ v.title || "차량" }}</span><button type="button" @click="v.status === 'making' ? emit('go', 'making', { id: v.id }) : emit('go', 'result', { id: v.id })">자세히 <Icon :src="rd('back-outline-24')" style="transform: rotate(180deg)" /></button></div>
        <div v-if="v.status === 'making'" class="making-card"><span class="spin" /> 영상을 만드는 중… {{ Math.round(v.progress * 100) }}%</div>
        <div v-else-if="v.status === 'failed'" class="making-card" style="color: #C0392B">{{ v.error || "영상을 만들지 못했어요." }} <button class="btn line" type="button" style="margin-left: auto; height: 34px; padding: 0 10px" @click="removeVideo(v.id)">지우기</button></div>
        <template v-else>
          <div class="upl-vid" :style="{ aspectRatio: v.options.aspect.replace(':', ' / ') }"><video :src="vurl(v)" :poster="v.poster" controls playsinline preload="metadata" /></div>
          <div class="upl-tags"><span class="tag">{{ v.options.aspect }}</span><span class="tag">{{ { classic: "클래식", modern: "모던", showcase: "쇼케이스" }[v.options.template] }}</span></div>
          <div class="row2">
            <button class="btn line" type="button" @click="share(v)"><Icon :src="ct('chotot-common-share')" /> 공유</button>
            <button class="btn line" type="button" @click="download(v)"><Icon :src="rd('forward-outline')" style="transform: rotate(90deg)" /> 내려받기</button>
          </div>
        </template>
      </section>
    </template>
    </div>
  </main>
  <nav v-if="!isPc" class="nav" aria-label="아래 메뉴">
    <button type="button" aria-current="page"><Icon :src="as('complex-home-as24')" />홈</button>
    <a class="fab" :href="shoot" aria-label="사진 촬영" style="display: flex; align-items: center"><Icon :src="rd('camera-outline-24')" /></a>
    <button type="button" @click="emit('go', 'profile')"><Icon :src="ct('chotot-common-user')" />프로필</button>
  </nav>
</template>
