<script setup lang="ts">
// 리액트 src/main-home/MainHome.tsx 의 MainHome 을 옮김. 데이터 배열은 리액트 파일이 export 하지 않아 그대로 복사했다(keep in sync).
// 차이: 입력칸 onChange → @input. "./?…" 주소는 <base href="/bobaedream/"> 덕분에 리액트와 같은 곳(사이트 맨 위)으로 간다.
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import "@src/main-home/main-home.css";

const bbmAsset = (path: string) => ["assets", "bbm", path].join("/");

const vehicleIcon = (name: string) => `./prototypes/autotrader-bobaedream-main/category-vehicles-v3/${name}-left-v01.png`;
const categoryItems: { label: string; icon: string; category: string; image?: string }[] = [
  { label: "숏폼카", icon: "short", category: "중고차" },
  { label: "국산차", icon: "domestic", category: "중고차", image: vehicleIcon("domestic") },
  { label: "수입차", icon: "import", category: "수입차", image: vehicleIcon("imported") },
  { label: "화물·특장", icon: "truck", category: "트럭 · 특장", image: vehicleIcon("truck") },
  { label: "전기차", icon: "electric", category: "전기차", image: vehicleIcon("electric") },
  { label: "바이크", icon: "bike", category: "바이크", image: vehicleIcon("bike") },
  { label: "슈퍼카", icon: "super", category: "수입차", image: "./prototypes/autotrader-bobaedream-main/autotrader-body-types-v2/coupe.png" },
  { label: "올드카", icon: "old", category: "올드카", image: bbmAsset("generated/quickfilter-v01/car_mercedes_gclass_w460_v01.png") },
  { label: "캠핑카", icon: "camping", category: "캠핑카", image: vehicleIcon("camper") },
  { label: "더보기", icon: "more", category: "more" },
];

const shortformItems = [
  {
    rank: 1,
    image: bbmAsset("generated/quickfilter-v01/car_mercedes_gclass_w465_v01.png"),
    title: "포드 머스탱 코스트 67",
    description: "맞춤 제작된 클래식의 정석",
    author: "조이모터스 이인걸",
  },
  {
    rank: 2,
    image: bbmAsset("generated/quickfilter-v01/car_mercedes_gclass_w460_v01.png"),
    title: "로터스 에미라 V6",
    description: "AMG와 협업한 6기통 괴물 엔진",
    author: "벤츠인증중고차",
  },
];

const communityPosts = [
  ["대패 삼겹살 개발자.", "3241"],
  ["남자들이 여자 배 만지는걸 좋아하는 이유", "248"],
  ["아스날 교수님 렌즈를 통해본 손흥민", "248"],
  ["실시간 국뽕타임 손 흥 민", "248"],
  ["경기도 중학교 운동회 도중 경찰이 출동했어요.", "248"],
  ["출소 후 다시 찾아온 성폭행범 불태운 엄마", "248"],
  ["컬러화한 광복군 창설식 사진", "248"],
  ["30년 다닌 직장에서 퇴직금 갖고 장난치는것 같습니다...", "248"],
  ["손흥민에 대해 엄청난 리스펙을 보이는 제이미 캐러거", "248"],
  ["팁으로 50달러 받고 빡친 이유", "248"],
];
const popularRanges = ["1~10위", "11~20위", "실시간", "어제", "주간", "댓글순"];

const menuOpen = ref(false);
const searchQuery = ref("");
const toast = ref("");
const popularRange = ref("1~10위");
const hidePolitics = ref(false);
const searchRef = ref<HTMLInputElement | null>(null);

onMounted(() => {
  document.documentElement.classList.add("main-home-open");
  document.body.classList.add("main-home-open");
});
onBeforeUnmount(() => {
  document.documentElement.classList.remove("main-home-open");
  document.body.classList.remove("main-home-open");
});

watch(toast, (value, _old, onCleanup) => {
  if (!value) return;
  const timer = window.setTimeout(() => { toast.value = ""; }, 1800);
  onCleanup(() => window.clearTimeout(timer));
});

const openCommunity = () => { window.location.href = "./community/bobaedream-pc-board-list.html?layout=reddit"; };
const navigateToListing = ({ query, category }: { query?: string; category?: string } = {}) => {
  const params = new URLSearchParams({ qf: "guazi" });
  if (query?.trim()) params.set("q", query.trim());
  if (category && category !== "중고차") params.set("category", category);
  window.location.href = `./?${params.toString()}`;
};
const showPreparing = (message: string) => { toast.value = message; };
const scrollToShortform = () => document.getElementById("today-shortform")?.scrollIntoView({ behavior: "smooth" });
const onCategory = (item: (typeof categoryItems)[number]) => item.category === "more" ? (menuOpen.value = true) : navigateToListing({ category: item.category });
</script>

<template>
  <div class="main-home-stage">
    <main class="main-home" aria-label="보배드림 모바일 메인 시안 2">
      <header class="mh-header">
        <button class="mh-header-menu" type="button" aria-label="전체 메뉴" :aria-expanded="menuOpen" @click="menuOpen = true"><img :src="bbmAsset('header-menu.svg')" alt="" /></button>
        <a class="mh-brand" href="./?home=1" aria-label="보배드림 홈">
          <img :src="bbmAsset('main-home-logo.svg')" alt="보배드림" />
        </a>
        <button class="mh-open-app" type="button" @click="showPreparing('보배드림 앱을 준비 중입니다.')">앱 열기</button>
      </header>

      <form class="mh-search-wrap" role="search" @submit.prevent="navigateToListing({ query: searchQuery })">
        <label class="mh-search-box">
          <img :src="bbmAsset('header-search.svg')" alt="" aria-hidden="true" />
          <input ref="searchRef" type="search" :value="searchQuery" placeholder="원하는 차량을 검색하세요" aria-label="차량 검색" @input="searchQuery = ($event.currentTarget as HTMLInputElement).value" />
        </label>
      </form>

      <nav class="mh-primary-nav" aria-label="주요 메뉴">
        <a class="is-active" href="./?home=1" aria-current="page">홈</a>
        <button type="button" @click="scrollToShortform">숏폼카</button>
        <button type="button" @click="navigateToListing()">차량 검색</button>
        <button type="button" @click="showPreparing('내차팔기 등록 화면을 준비 중입니다.')">내차팔기</button>
        <button type="button" @click="openCommunity">커뮤니티</button>
      </nav>

      <section class="mh-category-grid" aria-label="차량 서비스">
        <button v-for="item in categoryItems" :key="item.label" type="button" @click="onCategory(item)">
          <span :class="`mh-category-icon is-${item.icon}`" aria-hidden="true">
            <img v-if="item.image" :src="item.image" alt="" />
            <template v-if="item.icon === 'more'"><i /><i /><i /><i /></template>
          </span>
          <strong>{{ item.label }}</strong>
        </button>
      </section>

      <div class="mh-section-divider" />

      <section id="today-shortform" class="mh-content-section mh-shortform" aria-labelledby="mh-shortform-title">
        <header class="mh-section-title"><h2 id="mh-shortform-title">오늘의 숏폼카</h2><button type="button" @click="showPreparing('숏폼카 전체 목록을 준비 중입니다.')">더보기</button></header>
        <div class="mh-shortform-list">
          <button v-for="item in shortformItems" :key="item.rank" class="mh-shortform-row" type="button" @click="showPreparing(`${item.title} 영상을 준비 중입니다.`)">
            <span class="mh-shortform-thumb"><img :src="item.image" alt="" /></span>
            <span class="mh-shortform-copy">
              <strong><em>{{ item.rank }}</em>{{ item.title }}</strong>
              <span>{{ item.description }}</span>
              <small>{{ item.author }} · 조회 <b>30,000</b></small>
            </span>
          </button>
        </div>
      </section>

      <div class="mh-section-divider" />

      <section class="mh-content-section mh-community" aria-labelledby="mh-community-title">
        <header class="mh-section-title">
          <h2 id="mh-community-title">커뮤니티 인기글</h2>
          <label class="mh-politics-toggle"><input type="checkbox" :checked="hidePolitics" @change="hidePolitics = ($event.currentTarget as HTMLInputElement).checked" /><span aria-hidden="true" />정치 X</label>
        </header>
        <div class="mh-popular-tabs" role="tablist" aria-label="인기글 기간">
          <button v-for="label in popularRanges" :key="label" type="button" :class="popularRange === label ? 'is-active' : ''" @click="popularRange = label">{{ label }}</button>
        </div>
        <ol class="mh-popular-list">
          <li v-for="([title, comments], index) in communityPosts" :key="title"><button type="button" @click="openCommunity"><b>{{ index + 1 }}</b><span>{{ title }}</span><em>[{{ comments }}]</em></button></li>
        </ol>
      </section>

      <div v-if="menuOpen" class="mh-menu-layer">
        <button class="mh-menu-dim" type="button" aria-label="전체 메뉴 닫기" @click="menuOpen = false" />
        <aside class="mh-menu-panel" role="dialog" aria-modal="true" aria-labelledby="mh-menu-title">
          <header><h2 id="mh-menu-title">전체 메뉴</h2><button type="button" aria-label="닫기" @click="menuOpen = false"><img :src="bbmAsset('m-full-close.svg')" alt="" /></button></header>
          <nav aria-label="전체 서비스">
            <button type="button" @click="navigateToListing()"><strong>차량 검색</strong><span>국산·수입 중고차 찾기</span></button>
            <button type="button" @click="openCommunity"><strong>커뮤니티</strong><span>자동차 이야기와 실시간 피드</span></button>
            <button type="button" @click="navigateToListing({ category: '트럭 · 특장' })"><strong>화물·특장</strong><span>화물차와 특장차 매물</span></button>
            <button type="button" @click="navigateToListing({ category: '바이크' })"><strong>바이크</strong><span>모터사이클 매물</span></button>
            <button type="button" @click="navigateToListing({ category: '캠핑카' })"><strong>캠핑카</strong><span>캠핑카와 트레일러 매물</span></button>
          </nav>
        </aside>
      </div>
      <div v-if="toast" class="mh-toast" role="status">{{ toast }}</div>
    </main>
  </div>
</template>
