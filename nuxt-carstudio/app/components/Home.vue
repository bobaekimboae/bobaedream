<script setup lang="ts">
// 원본 홈: 로고 · 크레딧 / Welcome / Photo Shooting · Create Video / Previous Uploads(Photos | My Videos · 검색 · 카드) / 아래 Home · 카메라 · Profile
import { computed, onBeforeUnmount, ref } from "vue";
import Icon from "./Icon.vue";
import { state, removeVideo } from "../lib/store";
import { fileName } from "../lib/jobs";
import { as, ct, rd, sitePath } from "../lib/site";
import type { VideoItem } from "../lib/types";
import { isPc } from "../lib/layout";
import { PROJECTS } from "../lib/projects";

const emit = defineEmits<{ go: [v: string, extra?: Record<string, string>]; pay: []; toast: [t: string] }>();
// 원본 기본 탭은 「사진」. 영상을 만들고 돌아오면(?tab=videos) 「내 영상」
const tab = ref<"photos" | "videos">(new URLSearchParams(window.location.search).get("tab") === "videos" ? "videos" : "photos");
const q = ref("");
const live = ref("");
const shoot = sitePath("nuxt-shootkit", "");
const sample = (n: string) => sitePath("assets", "cars", "seoul-autogallery-v01", "rr", n);
const list = computed(() => state.videos.filter((v) => !q.value.trim() || `${v.title} ${v.id}`.toLowerCase().includes(q.value.trim().toLowerCase())));
const photoSets = computed(() => list.value.filter((v) => v.photos.length));
// 원본 사진 탭 = 올린 사진 묶음(프로젝트). 「내 프로젝트」에 있는 매물도 같은 목록에 나온다
type Upload = { key: string; code: string; date: string; photos: string[]; go: () => void };
const fmt = (s: string) => { const [y, m, d] = s.split("."); return `${d}/${m}/${y}`; };
const uploads = computed<Upload[]>(() => {
  const qq = q.value.trim().toLowerCase();
  const fromProjects = PROJECTS.filter((p) => !qq || `${p.title} ${p.id}`.toLowerCase().includes(qq)).map((p) => ({ key: p.id, code: p.id.replace(/-/g, "").toUpperCase().padEnd(8, "0"), date: fmt(p.date), photos: p.photos, go: () => emit("go", "details", { project: p.id }) }));
  const fromVideos = photoSets.value.map((v) => ({ key: v.id, code: v.id, date: date(v.createdAt), photos: v.photos.map(urlOf), go: () => (v.status === "making" ? emit("go", "making", { id: v.id }) : emit("go", "result", { id: v.id })) }));
  return [...fromVideos, ...fromProjects];
});
const stepU = (u: Upload, d: number) => { const n = u.photos.length; idx.value[u.key] = ((idx.value[u.key] ?? 0) + d + n) % n; };
const date = (t: number) => new Date(t).toLocaleDateString("en-GB").replace(/\//g, "/");

// 사진 탭: 카드마다 큰 사진 + ‹ › + 작은 사진 줄
const idx = ref<Record<string, number>>({});
const urls = new Map<Blob, string>();
const urlOf = (b: Blob) => { let u = urls.get(b); if (!u) { u = URL.createObjectURL(b); urls.set(b, u); } return u; };
onBeforeUnmount(() => urls.forEach((u) => URL.revokeObjectURL(u)));
const vurls = new Map<string, string>();
const vurl = (v: VideoItem) => { if (!v.video) return ""; let u = vurls.get(v.id); if (!u) { u = URL.createObjectURL(v.video); vurls.set(v.id, u); } return u; };
onBeforeUnmount(() => vurls.forEach((u) => URL.revokeObjectURL(u)));

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
    <div class="wordmark">보배 카스튜디오</div>
    <button class="credit" type="button" :aria-label="`남은 크레딧 ${state.credits}개 · 크레딧 사기`" @click="emit('pay')">{{ state.credits }} <i>+</i></button>
  </header>
  <main class="home-main">
    <h1 class="welcome">환영합니다 <b>{{ state.profile.name || "딜러님" }}</b></h1>
    <div class="feat">
      <a class="feat-card" :href="shoot" style="text-decoration: none; color: inherit">
        <b>사진 촬영</b><span>스튜디오 품질로 찍기</span>
        <span class="art"><img :src="sample('rr-02.jpg')" alt="" /></span>
      </a>
      <button class="feat-card" type="button" @click="emit('go', 'start')">
        <b>영상 만들기</b><span>사진을 영상으로</span>
        <span class="art" style="background: transparent"><span class="art-stack"><img :src="sample('rr-03.jpg')" alt="" /><img :src="sample('rr-01.jpg')" alt="" /></span><span class="arrow">→</span><span class="art-thumb"><img :src="sample('rr-02.jpg')" alt="" /><i class="lg">LOGO</i><i class="pl"><Icon :src="rd('play-fill')" /></i><i class="tt">2019 레인지로버</i><i class="pr">8,900만원</i></span></span>
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
      <p v-if="!uploads.length" class="empty">아직 올린 사진이 없어요.<br />「영상 만들기」에서 차량 사진을 올려 보세요.</p>
      <section v-for="u in uploads" :key="u.key" class="upl">
        <div class="upl-h"><span>{{ u.code }} • {{ u.date }}</span><button type="button" @click="u.go()">자세히 <Icon :src="ct('chotot-pc-detail-chevron-right-white-bg')" /></button></div>
        <div class="ph-main">
          <img class="ph-fill" :src="u.photos[idx[u.key] ?? 0]" alt="" aria-hidden="true" />
          <img class="ph-img" :src="u.photos[idx[u.key] ?? 0]" :alt="`사진 ${(idx[u.key] ?? 0) + 1}`" />
          <button v-if="u.photos.length > 1" class="ph-nav l" type="button" aria-label="이전 사진" @click="stepU(u, -1)"><Icon :src="ct('chotot-pc-detail-chevron-left-white-bg')" /></button>
          <button v-if="u.photos.length > 1" class="ph-nav r" type="button" aria-label="다음 사진" @click="stepU(u, 1)"><Icon :src="ct('chotot-pc-detail-chevron-right-white-bg')" /></button>
        </div>
        <div class="photo-strip"><button v-for="(src, i) in u.photos" :key="i" type="button" :aria-label="`사진 ${i + 1} 보기`" :aria-pressed="i === (idx[u.key] ?? 0)" @click="idx[u.key] = i"><img :src="src" alt="" loading="lazy" /></button></div>
      </section>
    </template>
    <template v-else>
      <p v-if="!list.length" class="empty">아직 만든 영상이 없어요.</p>
      <section v-for="v in list" :key="v.id" class="upl">
        <div class="upl-h"><span>{{ v.title || "차량" }}</span><button type="button" @click="v.status === 'making' ? emit('go', 'making', { id: v.id }) : emit('go', 'result', { id: v.id })">자세히 <Icon :src="ct('chotot-pc-detail-chevron-right-white-bg')" /></button></div>
        <div v-if="v.status === 'making'" class="making-card"><span class="spin" /> 영상을 만드는 중… {{ Math.round(v.progress * 100) }}%</div>
        <div v-else-if="v.status === 'failed'" class="making-card" style="color: #C0392B">{{ v.error || "영상을 만들지 못했어요." }} <button class="btn line" type="button" style="margin-left: auto; height: 34px; padding: 0 10px" @click="removeVideo(v.id)">지우기</button></div>
        <template v-else>
          <div class="upl-vid"><video v-if="live === v.id" :src="vurl(v)" controls autoplay playsinline /><template v-else><img :src="v.poster" :alt="`${v.title} 영상 표지`" /><button class="pbtn" type="button" :aria-label="`${v.title} 영상 재생`" @click="live = v.id"><Icon :src="rd('play-fill')" /></button></template></div>
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
