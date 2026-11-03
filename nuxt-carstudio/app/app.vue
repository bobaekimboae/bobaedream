<script setup lang="ts">
// 화면 고르기: ?v=home(기본) · start · projects · details · making · result&id= · profile. 휴대폰 뒤로가기 = 원본 「Back」.
import { onMounted, ref } from "vue";
import Home from "./components/Home.vue";
import Start from "./components/Start.vue";
import Projects from "./components/Projects.vue";
import Details from "./components/Details.vue";
import Making from "./components/Making.vue";
import Result from "./components/Result.vue";
import Paywall from "./components/Paywall.vue";
import Profile from "./components/Profile.vue";
import { loadAll } from "./lib/store";
import { query } from "./lib/site";
import PcHeader from "./components/PcHeader.vue";
import { isPc, keepLayoutParams, watchLayout } from "./lib/layout";

const VIEWS = ["home", "start", "projects", "details", "making", "result", "profile"];
const view = ref("home");
const id = ref("");
const project = ref("");
const pay = ref(false);
const toast = ref("");
let tt = 0;
const read = () => {
  const q = query();
  // 배포 확인 주소의 &v=<커밋>도 같은 이름을 쓰므로, 아는 화면 이름이 아니면 홈으로 연다
  const v = q.get("v") || "home";
  view.value = VIEWS.includes(v) ? v : "home";
  id.value = q.get("id") || "";
  project.value = q.get("project") || "";
};
function go(v: string, extra: Record<string, string> = {}, replace = false) {
  const u = new URL(window.location.href);
  u.search = "";
  if (v !== "home") u.searchParams.set("v", v);
  for (const [k, val] of Object.entries(extra)) u.searchParams.set(k, val);
  keepLayoutParams(u);
  if (replace) history.replaceState(history.state, "", u);
  else history.pushState({ inApp: true }, "", u);
  read();
  window.scrollTo(0, 0);
}
function back() {
  if (history.state?.inApp) history.back();
  else go("home", {}, true);
}
function say(t: string) {
  toast.value = t;
  clearTimeout(tt);
  tt = window.setTimeout(() => (toast.value = ""), 2600);
}
onMounted(async () => {
  watchLayout();
  read();
  window.addEventListener("popstate", read);
  await loadAll();
});
</script>

<template>
  <div class="app" :class="{ 'is-pc': isPc }">
    <PcHeader v-if="isPc" :view="view" @go="go" @pay="pay = true" />
    <Home v-if="view === 'home'" @go="go" @pay="pay = true" @toast="say" />
    <Start v-else-if="view === 'start'" @back="back" @go="go" />
    <Projects v-else-if="view === 'projects'" @back="back" @go="go" />
    <Details v-else-if="view === 'details'" :key="project || 'new'" :project-id="project" @back="back" @go="go" @toast="say" />
    <Making v-else-if="view === 'making'" :id="id" @go="go" @back="back" />
    <Result v-else-if="view === 'result'" :id="id" @back="back" @go="go" @toast="say" />
    <Profile v-else-if="view === 'profile'" @go="go" @pay="pay = true" @toast="say" />
    <Paywall v-if="pay" @close="pay = false" @toast="say" />
    <div v-if="toast" class="toast" role="status">{{ toast }}</div>
  </div>
</template>
