<script setup lang="ts">
// 편집기(Car Studio /editor): 새 프로젝트면 사진 올리기 단계, ?id=가 있으면 작업 화면.
// 올리기: 끌어다 놓기 · 사진 고르기 · 촬영 키트 → 처리 방식 창 → AI 처리(진행률) → 작업 화면.
import { computed, onBeforeUnmount, ref } from "vue";
import Icon from "./Icon.vue";
import UploadModal from "./UploadModal.vue";
import Workspace from "./Workspace.vue";
import { addCredits, fmtDate, go, say, spend, ui } from "../lib/app";
import { I, sitePath } from "../lib/site";
import { listProjects, newId, putProject, type Mode, type PlateMode, type Project } from "../lib/store";
import { processPhoto } from "../lib/process";
import { posterOf } from "../lib/compose";
import Modal from "./Modal.vue";
import { kitDrafts, kitPhotos, type KitDraft } from "../lib/shootkit-link";

defineProps<{ app: boolean }>();
const MAX = 30;
type Pick = { id: string; file: File; url: string };
const files = ref<Pick[]>([]);
const over = ref(false);
const askOpen = ref(false);
const busy = ref<{ text: string; sub: string; p: number } | null>(null);
const input = ref<HTMLInputElement | null>(null);
function add(list: FileList | File[] | null) {
  const imgs = [...(list ?? [])].filter((f) => f.type.startsWith("image/"));
  if (!imgs.length) return say("사진 파일(JPG · PNG · WEBP)만 올릴 수 있어요.");
  const room = MAX - files.value.length;
  if (imgs.length > room) say(`한 프로젝트에 사진은 ${MAX}장까지예요. ${Math.max(0, room)}장만 넣었어요.`);
  for (const f of imgs.slice(0, Math.max(0, room))) files.value.push({ id: newId("f"), file: f, url: URL.createObjectURL(f) });
}
function drop(e: DragEvent) {
  over.value = false;
  add(e.dataTransfer?.files ?? null);
}
function removeFile(id: string) {
  const f = files.value.find((x) => x.id === id);
  if (f) URL.revokeObjectURL(f.url);
  files.value = files.value.filter((x) => x.id !== id);
}
onBeforeUnmount(() => files.value.forEach((f) => URL.revokeObjectURL(f.url)));
function start() {
  if (!files.value.length) return say("사진을 먼저 올려 주세요.");
  askOpen.value = true;
}
const today = fmtDate(Date.now());
async function confirm(v: { mode: Mode; plateMode: PlateMode; customPlate: string }) {
  const n = files.value.length;
  if (ui.credits < n) {
    askOpen.value = false;
    ui.buyOpen = true;
    return say(`크레딧이 ${n - ui.credits}개 모자라요. 크레딧을 더 넣어 주세요.`);
  }
  askOpen.value = false;
  spend(n);
  const photos = [];
  busy.value = { text: "AI가 사진을 처리하고 있어요", sub: "차 찾기 기능을 준비하는 중…", p: 0 };
  let failed = 0;
  for (let i = 0; i < n; i++) {
    busy.value = { text: "AI가 사진을 처리하고 있어요", sub: `${i + 1} / ${n}장 · 차를 찾아 배경과 나누는 중`, p: i / n };
    const ph = await processPhoto(files.value[i].file, (mp) => {
      if (busy.value) busy.value = { ...busy.value, sub: `차 찾기 기능 받는 중 ${Math.round(mp * 100)}% (처음 한 번만)`, p: (i + mp * 0.6) / n };
    });
    if (ph.error) failed++;
    photos.push(ph);
  }
  if (failed) addCredits(failed);
  const count = (await listProjects().catch(() => [])).length;
  const p: Project = {
    id: newId(),
    name: `매물 ${count + 1}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    mode: v.mode,
    plateMode: v.plateMode,
    customPlate: v.customPlate,
    photos,
    settings: { aspect: "original", resolution: "fhd", grid: false, logo: null, logoAt: "tr" },
    versions: [],
    videos: [],
    poster: "",
  };
  busy.value = { text: "거의 다 됐어요", sub: "목록 표지를 만드는 중", p: 0.98 };
  p.poster = await posterOf(p).catch(() => "");
  p.versions.push({ id: newId("v"), at: Date.now(), label: "처음 결과", photos: p.photos.map(({ id, bg, pos, adjust, reflect, plate }) => ({ id, bg, pos: { ...pos }, adjust: { ...adjust }, reflect, plate: plate ? { ...plate } : null })), settings: { aspect: p.settings.aspect, resolution: p.settings.resolution, grid: false, logoAt: "tr" } });
  await putProject(p);
  busy.value = null;
  files.value.forEach((f) => URL.revokeObjectURL(f.url));
  files.value = [];
  say(failed ? `${n - failed}장 처리했어요. 차를 찾지 못한 ${failed}장은 크레딧을 돌려드렸어요.` : `${n}장을 처리했어요.`);
  go("editor", { id: p.id });
}
const shootkit = sitePath("nuxt-shootkit") + "/";
const kitOpen = ref(false);
const kitList = ref<KitDraft[] | null>(null);
async function openKit() {
  kitOpen.value = true;
  kitList.value = null;
  kitList.value = await kitDrafts();
}
async function takeKit(id: string) {
  const fs = await kitPhotos(id);
  kitOpen.value = false;
  if (!fs.length) return say("그 글의 사진을 읽지 못했어요.");
  add(fs);
  say(`촬영 키트 사진 ${fs.length}장을 가져왔어요.`);
}
const has = computed(() => files.value.length > 0);
</script>
<template>
  <Workspace v-if="ui.id" :id="ui.id" :app="app" />
  <section v-else>
    <div class="ed-top">
      <button class="btn btn-ghost btn-sm" type="button" @click="go('orders')"><Icon :src="I.back" /> 뒤로</button>
      <span class="grow" />
    </div>
    <div class="ed">
      <div class="stage">
        <div class="drop" :class="{ 'is-over': over }" @dragover.prevent="over = true" @dragleave="over = false" @drop.prevent="drop">
          <Icon :src="I.upload" class="ico-big" />
          <strong>사진을 여기에 끌어다 놓으세요</strong>
          <span>JPG · PNG · WEBP · 한 번에 {{ MAX }}장까지 · 사진은 이 기기 밖으로 나가지 않아요</span>
          <div class="drop-actions">
            <button class="btn btn-pri" type="button" @click="input?.click()"><Icon :src="I.image" /> 사진 올리기</button>
            <button class="btn btn-line" type="button" @click="openKit"><Icon :src="I.camera" /> 촬영 키트에서 가져오기</button>
          </div>
          <input ref="input" class="vh" type="file" accept="image/*" multiple @change="add(($event.target as HTMLInputElement).files); ($event.target as HTMLInputElement).value = ''" />
        </div>
        <div v-if="has" class="strip" aria-label="올린 사진">
          <div v-for="(f, i) in files" :key="f.id" class="thumb" :style="{ backgroundImage: `url(${f.url})` }">
            <span class="n">{{ i + 1 }}</span>
            <button class="x" type="button" :aria-label="`${i + 1}번 사진 빼기`" @click="removeFile(f.id)"><Icon :src="I.close" /></button>
          </div>
        </div>
        <div v-if="has" class="strip-meta"><span>{{ today }} · {{ files.length }}장 선택됨</span><button class="btn btn-ghost btn-sm" type="button" @click="files.forEach((f) => removeFile(f.id))">모두 빼기</button></div>
      </div>
      <div class="side">
        <div v-if="!has" class="lock"><Icon :src="I.image" /><span>사진을 올리면 배경 · 스튜디오 설정이 열려요</span></div>
        <div class="acc"><div class="acc-h"><span class="num">1</span> 배경<Icon :src="I.chevDown" /></div></div>
        <div class="acc"><div class="acc-h"><span class="num">2</span> 스튜디오<Icon :src="I.chevDown" /></div></div>
        <div class="acc"><div class="acc-h"><span class="num">3</span> 추가 설정<Icon :src="I.chevDown" /></div></div>
        <button class="btn btn-pri btn-block" type="button" :disabled="!has" @click="start"><Icon :src="I.spark" /> {{ has ? `사진 ${files.length}장 처리 시작` : "사진을 먼저 올려 주세요" }}</button>
      </div>
    </div>
    <Modal v-if="kitOpen" title="촬영 키트에서 가져오기" @close="kitOpen = false">
      <p style="margin: 0; color: var(--sub)">이 기기의 촬영 키트에 보관된 사진을 가져와요. 사진은 기기 밖으로 나가지 않아요.</p>
      <div v-if="kitList === null" class="empty"><div class="spinner" /></div>
      <div v-else-if="!kitList.length" class="empty"><strong>보관된 촬영 사진이 없어요</strong><span>촬영 키트에서 찍고 「임시저장」을 누르면 여기에 나와요.</span><a class="btn btn-pri" :href="shootkit"><Icon :src="I.camera" /> 촬영 키트 열기</a></div>
      <div v-else style="display: grid; gap: 8px">
        <button v-for="d in kitList" :key="d.id" class="opt" type="button" @click="takeKit(d.id)">
          <span class="thumb" :style="{ width: '72px', height: '54px', backgroundImage: d.thumb ? `url(${d.thumb})` : 'none' }" />
          <span><strong>{{ d.label }}</strong><small>사진 {{ d.photoCount }}장{{ d.region ? ` · ${d.region.sido} ${d.region.gu}` : "" }}</small></span>
        </button>
      </div>
    </Modal>
    <UploadModal v-if="askOpen" :count="files.length" :credits="ui.credits" @close="askOpen = false" @confirm="confirm" />
    <div v-if="busy" class="busy" role="alertdialog" aria-live="polite" aria-label="AI 처리 중">
      <div class="spinner" />
      <strong>{{ busy.text }}</strong>
      <div class="progress" role="progressbar" :aria-valuenow="Math.round(busy.p * 100)" aria-valuemin="0" aria-valuemax="100"><i :style="{ width: `${Math.round(busy.p * 100)}%` }" /></div>
      <span>{{ Math.round(busy.p * 100) }}%</span>
      <small>{{ busy.sub }}</small>
    </div>
  </section>
</template>
