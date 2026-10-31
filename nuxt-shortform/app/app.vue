<script setup lang="ts">
// 화면 고르기: ?v=dashboard(기본) · new · order&id= · pricing. 페이지 라우터 없이 주소 검색어로 바꾼다(정적 배포).
import { onMounted, ref } from "vue";
import Brand from "./components/Brand.vue";
import Icon from "./components/Icon.vue";
import Dashboard from "./components/Dashboard.vue";
import NewVideo from "./components/NewVideo.vue";
import OrderView from "./components/OrderView.vue";
import Pricing from "./components/Pricing.vue";
import { loadAll, state } from "./lib/jobs";
import { readProfile } from "./lib/store";
import { ct, query, rd } from "./lib/site";

const view = ref("dashboard");
const id = ref("");
const open = ref(false);
/** 「새 영상」을 누를 때마다 빈 양식으로 새로 연다 */
const newKey = ref(0);
const toast = ref("");
let tt = 0;
const profile = ref(readProfile());
const read = () => {
  const q = query();
  view.value = q.get("v") || "dashboard";
  id.value = q.get("id") || "";
};
function go(v: string, oid?: string) {
  const u = new URL(window.location.href);
  u.search = "";
  if (v !== "dashboard") u.searchParams.set("v", v);
  if (oid) u.searchParams.set("id", oid);
  if (v === "new") newKey.value += 1;
  history.pushState(null, "", u);
  read();
  open.value = false;
  profile.value = readProfile();
  window.scrollTo({ top: 0 });
}
function say(t: string) {
  toast.value = t;
  window.clearTimeout(tt);
  tt = window.setTimeout(() => (toast.value = ""), 3200);
}
onMounted(() => {
  read();
  void loadAll();
  window.addEventListener("popstate", read);
  // 만드는 중에 창을 닫으면 멈춘다: 한 번 묻는다
  window.addEventListener("beforeunload", (e) => {
    if (state.busy) e.preventDefault();
  });
});
const NAV = [
  { v: "dashboard", label: "대시보드", icon: rd("view-grid-outline") },
  { v: "new", label: "새 영상", icon: rd("video-camera-outline") },
  { v: "pricing", label: "크레딧", icon: ct("chotot-common-bag") },
];
</script>
<template>
  <div class="sf">
    <header class="sf-top">
      <Brand @home="go('dashboard')" />
      <button type="button" :aria-label="open ? '메뉴 닫기' : '메뉴 열기'" :aria-expanded="open" @click="open = !open"><Icon :src="ct('chotot-common-menu')" /></button>
    </header>
    <aside :class="`sf-side ${open ? 'is-open' : ''}`" @click.self="open = false">
      <Brand @home="go('dashboard')" />
      <nav class="sf-nav" aria-label="메뉴">
        <a v-for="n in NAV" :key="n.v" :href="n.v === 'dashboard' ? '?' : `?v=${n.v}`" :class="view === n.v || (n.v === 'dashboard' && view === 'order') ? 'is-on' : ''" :aria-current="view === n.v ? 'page' : undefined" @click.prevent="go(n.v)">
          <Icon :src="n.icon" />{{ n.label }}
        </a>
      </nav>
      <div class="sf-side-credit">
        <span class="sf-k">남은 크레딧</span>
        <strong>{{ state.loaded ? state.credits : "–" }}</strong>
        <a href="?v=pricing" @click.prevent="go('pricing')">크레딧 보기</a>
      </div>
      <div class="sf-me">
        <i><img v-if="profile.logo" :src="profile.logo" alt="" /><template v-else>{{ (profile.name || "딜러").slice(0, 2) }}</template></i>
        <span>{{ profile.name ? `${profile.name} 딜러` : "판매자 정보는 새 영상 2단계에서" }}</span>
      </div>
    </aside>
    <main class="sf-main">
      <Dashboard v-if="view === 'dashboard'" @go="go" />
      <NewVideo v-else-if="view === 'new'" :key="`new-${newKey}`" @go="go" @toast="say" />
      <OrderView v-else-if="view === 'order'" :id="id" @go="go" @toast="say" />
      <Pricing v-else-if="view === 'pricing'" @toast="say" />
      <Dashboard v-else @go="go" />
    </main>
    <div v-if="toast" class="toast" role="status">{{ toast }}</div>
  </div>
</template>
