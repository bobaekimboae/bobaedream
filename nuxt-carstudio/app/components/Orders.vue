<script setup lang="ts">
// 내 프로젝트(Car Studio /editor/orders): 편집기 · 영상 나누기, 검색, 크레딧 더 사기,
// 새 프로젝트 칸(점선) · 안내 칸 · 프로젝트 칸, 아래 쪽 넘기기(보기 10/20 · 페이지 x/y · 총 N개).
// Car Studio는 차량번호로 찾지만 보배드림 시안은 차량번호를 저장하지 않아 프로젝트 이름으로 찾는다.
import { computed, onMounted, ref, watch } from "vue";
import Icon from "./Icon.vue";
import { fmtDate, go, say, ui } from "../lib/app";
import { I, sitePath } from "../lib/site";
import { deleteProject, listProjects, type Project } from "../lib/store";

defineProps<{ app: boolean }>();
const all = ref<Project[]>([]);
const loaded = ref(false);
const q = ref("");
const per = ref(10);
const page = ref(1);
async function load() {
  try {
    all.value = await listProjects();
  } catch {
    say("저장된 프로젝트를 읽지 못했어요.");
  }
  loaded.value = true;
}
onMounted(load);
const tab = computed(() => ui.tab);
function setTab(t: "editor" | "video") {
  go("orders", t === "video" ? { tab: "video" } : {});
}
const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();
const projects = computed(() => all.value.filter((p) => !q.value.trim() || norm(p.name).includes(norm(q.value))));
const videos = computed(() =>
  all.value
    .flatMap((p) => p.videos.map((v) => ({ ...v, project: p })))
    .filter((v) => !q.value.trim() || norm(v.title + v.project.name).includes(norm(q.value)))
    .sort((a, b) => b.at - a.at),
);
const rows = computed(() => (tab.value === "video" ? videos.value.length : projects.value.length));
const pages = computed(() => Math.max(1, Math.ceil(rows.value / per.value)));
watch([q, per, tab], () => (page.value = 1));
const slice = <T,>(arr: T[]) => arr.slice((page.value - 1) * per.value, page.value * per.value);
async function remove(p: Project) {
  if (!window.confirm(`「${p.name}」 프로젝트를 지울까요? 사진과 영상이 모두 지워져요.`)) return;
  await deleteProject(p.id);
  await load();
  say("프로젝트를 지웠어요.");
}
const shootkit = sitePath("nuxt-shootkit") + "/";
</script>
<template>
  <section>
    <div class="ord-top">
      <h1>내 프로젝트</h1>
      <div class="seg" role="tablist" aria-label="프로젝트 종류">
        <button type="button" role="tab" :aria-selected="tab === 'editor'" :class="{ 'is-on': tab === 'editor' }" @click="setTab('editor')">편집기</button>
        <button type="button" role="tab" :aria-selected="tab === 'video'" :class="{ 'is-on': tab === 'video' }" @click="setTab('video')">영상 <span class="badge badge-beta">BETA</span><span class="badge badge-free">무료</span></button>
      </div>
      <div class="ord-tools">
        <label class="search"><Icon :src="I.search" /><span class="vh">프로젝트 이름 검색</span><input v-model="q" class="input" type="search" placeholder="프로젝트 이름 검색" /></label>
        <button v-if="!app" class="btn btn-dark" type="button" @click="ui.buyOpen = true"><Icon :src="I.spark" /> 크레딧 더 사기</button>
      </div>
    </div>

    <div v-if="tab === 'editor'" class="grid">
      <button class="card card-new" type="button" @click="go('editor')">
        <span class="badge badge-new">NEW</span>
        <span class="plus-big"><Icon :src="I.add" /></span>
        <strong>새 프로젝트 시작</strong>
        <span>사진을 올리면 배경을 바꾸고 번호판을 가려 드려요</span>
      </button>
      <a class="card card-promo" :href="shootkit">
        <div>
          <h3>촬영 키트로 바로 찍기</h3>
          <p>각도 안내를 따라 찍은 사진이 그대로 이 편집기로 이어져요.</p>
        </div>
        <span class="btn btn-sm"><Icon :src="I.camera" /> 촬영 키트 열기</span>
      </a>
      <article v-for="p in slice(projects)" :key="p.id" class="card card-proj" tabindex="0" @click="go('editor', { id: p.id })" @keydown.enter="go('editor', { id: p.id })">
        <button class="card-del" type="button" :aria-label="`${p.name} 지우기`" @click.stop="remove(p)"><Icon :src="I.del" /></button>
        <div class="card-img" :style="p.poster ? { backgroundImage: `url(${p.poster})` } : {}"><span class="tag">{{ p.name }}</span></div>
        <div class="card-body">
          <div class="card-meta"><span>사진 {{ p.photos.length }}장</span><span>{{ fmtDate(p.createdAt) }}</span></div>
          <div class="card-foot"><span class="lbl">{{ p.mode === 'editor' ? '편집기' : p.mode === 'blur' ? '배경 흐림' : '멀티뷰' }}</span><span class="go">편집 ›</span></div>
        </div>
      </article>
    </div>

    <div v-else class="grid">
      <button class="card card-new" type="button" @click="go('video')">
        <span class="badge badge-new">NEW</span>
        <span class="plus-big"><Icon :src="I.video" /></span>
        <strong>새 영상 만들기</strong>
        <span>사진 8~15장으로 매물 소개 영상을 만들어요</span>
      </button>
      <article v-for="v in slice(videos)" :key="v.id" class="card card-proj" tabindex="0" @click="go('video', { step: 'result', id: v.project.id, vid: v.id })" @keydown.enter="go('video', { step: 'result', id: v.project.id, vid: v.id })">
        <div class="card-img" :style="v.poster ? { backgroundImage: `url(${v.poster})` } : {}"><span class="tag">{{ v.title || v.project.name }}</span><span class="play"><Icon :src="I.play" /></span></div>
        <div class="card-body">
          <div class="card-meta"><span>{{ v.aspect }} · {{ v.seconds }}초</span><span>{{ fmtDate(v.at) }}</span></div>
          <div class="card-foot"><span class="lbl">영상</span><span class="go">보기 ›</span></div>
        </div>
      </article>
    </div>

    <div v-if="loaded && rows === 0 && q.trim()" class="empty"><strong>「{{ q }}」 프로젝트가 없어요</strong><span>이름을 다시 확인해 주세요.</span></div>

    <div class="pager">
      <span>보기 <select v-model.number="per" class="input" aria-label="한 쪽에 보일 개수"><option :value="10">10</option><option :value="20">20</option></select></span>
      <div class="pager-nav">
        <button class="icon-btn" type="button" aria-label="이전 쪽" :disabled="page <= 1" @click="page--"><Icon :src="I.prev" /></button>
        <span>{{ page }} / {{ pages }} 쪽 · 총 {{ rows }}개</span>
        <button class="icon-btn" type="button" aria-label="다음 쪽" :disabled="page >= pages" @click="page++"><Icon :src="I.next" /></button>
      </div>
    </div>
  </section>
</template>
