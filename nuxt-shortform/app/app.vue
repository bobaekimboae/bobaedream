<script setup lang="ts">
// 화면 고르기: ?v=dashboard(기본) · samples · new · order&id= · pricing. 페이지 라우터 없이 주소 검색어로 바꾼다(정적 배포).
// autohaus-video와 같이 로그인하지 않으면 모든 화면이 로그인 화면이 된다. 결제 뒤에는 ?payment=success로 대시보드에 알림을 띄운다.
import { onMounted, ref } from "vue";
import Brand from "./components/Brand.vue";
import Icon from "./components/Icon.vue";
import Login from "./components/Login.vue";
import Dashboard from "./components/Dashboard.vue";
import Samples from "./components/Samples.vue";
import NewVideo from "./components/NewVideo.vue";
import OrderView from "./components/OrderView.vue";
import Pricing from "./components/Pricing.vue";
import { loadAll, state } from "./lib/jobs";
import { auth, loadSession, signOut } from "./lib/auth";
import { readProfile } from "./lib/store";
import { ct, query, rd } from "./lib/site";

const ready = ref(false);
const view = ref("dashboard");
const id = ref("");
const paid = ref(false);
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
  paid.value = q.get("payment") === "success";
};
function go(v: string, oid?: string, extra?: Record<string, string>) {
  const u = new URL(window.location.href);
  u.search = "";
  if (v !== "dashboard") u.searchParams.set("v", v);
  if (oid) u.searchParams.set("id", oid);
  for (const [k, val] of Object.entries(extra ?? {})) u.searchParams.set(k, val);
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
function onLogin() {
  void loadAll(auth.email);
  if (view.value === "login") go("dashboard");
}
function logout() {
  if (state.busy && !window.confirm("영상을 만드는 중이에요. 로그아웃하면 멈춰요. 로그아웃할까요?")) return;
  signOut();
  open.value = false;
  go("dashboard");
}
onMounted(() => {
  read();
  loadSession();
  if (auth.email) void loadAll(auth.email);
  ready.value = true;
  window.addEventListener("popstate", read);
  // 만드는 중에 창을 닫으면 멈춘다: 한 번 묻는다
  window.addEventListener("beforeunload", (e) => {
    if (state.busy) e.preventDefault();
  });
});
const NAV = [
  { v: "dashboard", label: "대시보드", icon: rd("view-grid-outline") },
  { v: "samples", label: "샘플 영상", icon: rd("video-camera-outline") },
  { v: "new", label: "새 영상", icon: rd("video-camera-outline") },
  { v: "pricing", label: "크레딧 · 가격", icon: ct("chotot-common-bag") },
];
const credits = () => (state.loaded ? state.credits : "–");
</script>
<template>
  <template v-if="ready">
    <div v-if="!auth.email && view === 'samples'" class="sf-public">
      <header class="sf-public-head">
        <Brand @home="go('dashboard')" />
        <button class="btn is-sm" type="button" @click="go('dashboard')">로그인</button>
      </header>
      <main class="sf-public-main"><Samples @go="go" /></main>
    </div>
    <Login v-else-if="!auth.email" @done="onLogin" />
    <div v-else class="sf">
      <header class="sf-top">
        <button type="button" :aria-label="open ? '메뉴 닫기' : '메뉴 열기'" :aria-expanded="open" @click="open = !open"><Icon :src="ct('chotot-common-menu')" /></button>
        <Brand @home="go('dashboard')" />
        <a class="sf-top-credit" href="?v=pricing" @click.prevent="go('pricing')"><b>{{ credits() }}</b>크레딧</a>
      </header>
      <aside :class="`sf-side ${open ? 'is-open' : ''}`" @click.self="open = false">
        <div class="sf-side-head">
          <Brand @home="go('dashboard')" />
          <button class="sf-side-x" type="button" aria-label="메뉴 닫기" @click="open = false"><Icon :src="rd('close-outline')" /></button>
        </div>
        <nav class="sf-nav" aria-label="메뉴">
          <a v-for="n in NAV" :key="n.v" :href="n.v === 'dashboard' ? '?' : `?v=${n.v}`" :class="view === n.v || (n.v === 'dashboard' && view === 'order') ? 'is-on' : ''" :aria-current="view === n.v ? 'page' : undefined" @click.prevent="go(n.v)">
            <Icon :src="n.icon" />{{ n.label }}
          </a>
        </nav>
        <div class="sf-side-credit">
          <span class="sf-k">남은 크레딧</span>
          <strong>{{ credits() }}</strong>
          <a href="?v=pricing" @click.prevent="go('pricing')">크레딧 구매 <span aria-hidden="true">→</span></a>
        </div>
        <div class="sf-me">
          <i><img v-if="profile.logo" :src="profile.logo" alt="" /><template v-else>{{ auth.email.slice(0, 2).toUpperCase() }}</template></i>
          <span>{{ auth.email }}</span>
        </div>
        <button class="sf-logout" type="button" @click="logout"><Icon :src="ct('chotot-common-logout')" />로그아웃</button>
      </aside>
      <main class="sf-main">
        <Dashboard v-if="view === 'dashboard'" :paid="paid" @go="go" />
        <Samples v-else-if="view === 'samples'" @go="go" />
        <NewVideo v-else-if="view === 'new'" :key="`new-${newKey}`" @go="go" @toast="say" />
        <OrderView v-else-if="view === 'order'" :id="id" @go="go" @toast="say" />
        <Pricing v-else-if="view === 'pricing'" @go="go" @toast="say" />
        <Dashboard v-else :paid="false" @go="go" />
      </main>
      <div v-if="toast" class="toast" role="status">{{ toast }}</div>
    </div>
  </template>
</template>
