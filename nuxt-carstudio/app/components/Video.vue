<script setup lang="ts">
// 영상(Car Studio Video BETA): 시작(두 칸) → 내 프로젝트에서 고르기 또는 새 사진 8~15장 + 영상 언어 → 차량 정보 · 틀 · 색 · 비율 · 음악 → 만드는 중 → 결과.
// 주소: ?v=video · &step=pick · &step=upload · &step=details&id= · &step=result&id=&vid=
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import Icon from "./Icon.vue";
import { fmtDate, go, say, ui } from "../lib/app";
import { I } from "../lib/site";
import { DEFAULT_ADJUST, DEFAULT_POS, getProject, listProjects, newId, putProject, readProfile, writeProfile, type Project } from "../lib/store";
import { DEFAULT_BG } from "../lib/backgrounds";
import { LANGS, PALETTES, TEMPLATES, kmText, makeVideo, photoImages, previewFrame, priceText, type CarInfo, type Lang, type Template, type VideoSpec } from "../lib/video";
import { MUSIC } from "@sf/music";
import type { MusicId } from "@sf/store";
import { saveBlob } from "../lib/zip";

defineProps<{ app: boolean }>();
const MIN = 8;
const MAX = 15;
const step = computed(() => ui.step);
const projects = ref<Project[]>([]);
const proj = ref<Project | null>(null);
const pickId = ref("");

async function loadFor() {
  if (step.value === "pick") projects.value = await listProjects().catch(() => []);
  if ((step.value === "details" || step.value === "result") && ui.id) {
    proj.value = (await getProject(ui.id).catch(() => undefined)) ?? null;
    if (!proj.value) {
      say("프로젝트를 찾지 못했어요.");
      go("video");
      return;
    }
    if (step.value === "details") initForm();
  }
}
onMounted(loadFor);
watch(() => [ui.step, ui.id], loadFor);

// ---------- 새 사진 올리기 ----------
type Up = { id: string; file: File; url: string };
const ups = ref<Up[]>([]);
const lang = ref<Lang>("ko");
const fileIn = ref<HTMLInputElement | null>(null);
function addUps(list: FileList | null) {
  const imgs = [...(list ?? [])].filter((f) => f.type.startsWith("image/"));
  const room = MAX - ups.value.length;
  if (imgs.length > room) say(`영상에는 사진 ${MAX}장까지 넣을 수 있어요.`);
  for (const f of imgs.slice(0, Math.max(0, room))) ups.value.push({ id: newId("u"), file: f, url: URL.createObjectURL(f) });
}
function moveUp(i: number, d: number) {
  const j = i + d;
  if (j < 0 || j >= ups.value.length) return;
  const a = [...ups.value];
  [a[i], a[j]] = [a[j], a[i]];
  ups.value = a;
}
async function fromUploads() {
  if (ups.value.length < MIN) return say(`사진을 ${MIN}장 이상 올려 주세요.`);
  const count = (await listProjects().catch(() => [])).length;
  const photos = [];
  for (const u of ups.value) {
    const img = await new Promise<HTMLImageElement | null>((ok) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => ok(null);
      i.src = u.url;
    });
    photos.push({ id: newId("ph"), original: u.file, cut: null, box: null, w: img?.naturalWidth || 1600, h: img?.naturalHeight || 1200, plate: null, bg: DEFAULT_BG, pos: { ...DEFAULT_POS }, adjust: { ...DEFAULT_ADJUST }, reflect: false, error: "" });
  }
  const p: Project = { id: newId(), name: `영상 ${count + 1}`, createdAt: Date.now(), updatedAt: Date.now(), mode: "blur", plateMode: "keep", customPlate: "", photos, settings: { aspect: "original", resolution: "fhd", grid: false, logo: null, logoAt: "tr" }, versions: [], videos: [], poster: ups.value[0] ? await thumbOf(ups.value[0].file) : "" };
  await putProject(p);
  ups.value.forEach((u) => URL.revokeObjectURL(u.url));
  ups.value = [];
  go("video", { step: "details", id: p.id, lang: lang.value });
}
async function thumbOf(f: Blob) {
  const u = URL.createObjectURL(f);
  try {
    const img = await new Promise<HTMLImageElement>((ok, no) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = no;
      i.src = u;
    });
    const c = document.createElement("canvas");
    const k = 480 / Math.max(img.naturalWidth, img.naturalHeight);
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.8);
  } catch {
    return "";
  } finally {
    URL.revokeObjectURL(u);
  }
}

// ---------- 차량 정보 · 틀 ----------
const OPTIONS = ["썬루프", "어라운드 뷰", "통풍 시트", "열선 핸들", "헤드업 디스플레이", "어댑티브 크루즈", "메모리 시트", "전동 트렁크", "프리미엄 사운드", "무선 충전", "1인 소유", "무사고"];
const FUELS = ["가솔린", "디젤", "하이브리드", "전기", "LPG"];
const GEARS = ["오토", "수동"];
const car = reactive<CarInfo>({ maker: "", model: "", year: "", mileage: "", fuel: "", gear: "", color: "", price: "", options: [], note: "" });
const profile = reactive(readProfile());
const tpl = ref<Template>("classic");
const palette = ref("ivory");
const aspect = ref<"9:16" | "1:1" | "16:9">("9:16");
const music = ref<MusicId>("calm");
const selected = ref<string[]>([]);
const DRAFT = "bbm-cs-video-car";
function initForm() {
  const p = proj.value!;
  try {
    Object.assign(car, JSON.parse(localStorage.getItem(DRAFT) || "{}"));
  } catch {
    // 처음
  }
  car.options = [...(car.options ?? [])];
  const q = new URLSearchParams(location.search);
  if (q.get("lang") === "en") lang.value = "en";
  selected.value = p.photos.slice(0, MAX).map((x) => x.id);
  void nextTick(drawPreviews);
}
const required = computed(() => car.maker.trim() && car.model.trim());
const estSeconds = computed(() => {
  const n = selected.value.length;
  if (tpl.value === "classic") return Math.round(3.2 + 2.6 * Math.min(3, Math.max(0, n - 1)) + 3.6 + (car.options.length ? 3.2 : 0) + 2.1 * Math.min(8, Math.max(0, n - 4)) + 3.2);
  return Math.round(Math.min(10, n) * (tpl.value === "card" ? 2.6 : 2.2) + 3);
});
function toggleOpt(o: string) {
  car.options = car.options.includes(o) ? car.options.filter((x) => x !== o) : [...car.options, o].slice(0, 6);
}
function togglePhoto(id: string) {
  if (selected.value.includes(id)) selected.value = selected.value.filter((x) => x !== id);
  else if (selected.value.length < MAX) selected.value = [...selected.value, id];
  else say(`사진은 ${MAX}장까지 고를 수 있어요.`);
}
// 틀 미리보기
const pv = ref<Record<string, HTMLCanvasElement | null>>({});
let pvImg: HTMLCanvasElement | null = null;
async function drawPreviews() {
  const p = proj.value;
  if (!p) return;
  if (!pvImg) pvImg = (await photoImages(p, selected.value.slice(0, 1), 720).catch(() => []))[0] ?? null;
  for (const t of TEMPLATES) {
    const c = pv.value[t.id];
    if (c) await previewFrame(c, p, spec(t.id), pvImg).catch(() => {});
  }
}
watch([palette, () => car.model, () => car.maker, () => car.year, () => car.mileage], () => void drawPreviews());
const spec = (t: Template = tpl.value): VideoSpec => ({ template: t, palette: palette.value, aspect: aspect.value, music: music.value, lang: lang.value, car: { ...car, options: [...car.options] }, dealer: { name: profile.name, company: profile.company, phone: profile.phone }, photoIds: selected.value });

// ---------- 만들기 ----------
const gen = ref<{ text: string; r: number } | null>(null);
async function make() {
  const p = proj.value;
  if (!p) return;
  if (!required.value) return say("제조사와 모델을 적어 주세요.");
  if (selected.value.length < MIN) return say(`사진을 ${MIN}장 이상 골라 주세요.`);
  try {
    localStorage.setItem(DRAFT, JSON.stringify({ ...car, note: "" }));
  } catch {
    // 무시
  }
  writeProfile({ ...profile });
  gen.value = { text: "영상 구성을 짜는 중", r: 0 };
  try {
    const out = await makeVideo(p, spec(), (text, r) => (gen.value = { text, r }));
    const v = { id: newId("vd"), at: Date.now(), template: tpl.value, aspect: aspect.value, seconds: out.seconds, video: out.video, title: [car.maker, car.model].join(" ").trim(), poster: p.poster };
    p.videos.unshift(v);
    p.updatedAt = Date.now();
    await putProject(p);
    gen.value = null;
    go("video", { step: "result", id: p.id, vid: v.id });
  } catch (e) {
    gen.value = null;
    say(e instanceof Error ? e.message : "영상을 만들지 못했어요.");
  }
}

// ---------- 결과 ----------
const vid = computed(() => {
  const q = new URLSearchParams(typeof location === "undefined" ? "" : location.search);
  const id = q.get("vid");
  return proj.value?.videos.find((v) => v.id === id) ?? proj.value?.videos[0] ?? null;
});
const vidUrl = ref("");
watch(vid, (v, _, onCleanup) => {
  if (!v) return;
  vidUrl.value = URL.createObjectURL(v.video);
  const u = vidUrl.value;
  onCleanup(() => URL.revokeObjectURL(u));
});
const fileName = computed(() => (vid.value ? `bobae_video_${vid.value.id.slice(-6)}_${vid.value.aspect.replace(":", "x")}.mp4` : "video.mp4"));
const caption = computed(() => {
  const c = proj.value;
  const v = vid.value;
  if (!c || !v) return "";
  return [v.title, "#보배드림 #중고차 #Shorts"].filter(Boolean).join("\n");
});
async function share(app?: string) {
  const v = vid.value;
  if (!v) return;
  try {
    await navigator.clipboard?.writeText(caption.value);
  } catch {
    // 무시
  }
  const file = new File([v.video], fileName.value, { type: "video/mp4" });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], text: caption.value });
      return;
    } catch {
      return;
    }
  }
  saveBlob(v.video, fileName.value);
  say(`${app ? `${app} 앱에서` : "원하는 곳에"} 올려 주세요. 영상을 내려받고 글을 복사했어요.`);
}
const liked = ref<"" | "up" | "down">("");
function regen() {
  const p = proj.value;
  if (p) go("video", { step: "details", id: p.id });
}
function dropUp(id: string) {
  const u = ups.value.find((x) => x.id === id);
  if (u) URL.revokeObjectURL(u.url);
  ups.value = ups.value.filter((x) => x.id !== id);
}
const urls = new Map<string, string>();
function photoUrl(id: string, b: Blob) {
  let u = urls.get(id);
  if (!u) {
    u = URL.createObjectURL(b);
    urls.set(id, u);
  }
  return u;
}
onBeforeUnmount(() => urls.forEach((u) => URL.revokeObjectURL(u)));
const TPL_LABEL = (id: string) => TEMPLATES.find((t) => t.id === id)?.label ?? id;
</script>
<template>
  <!-- 시작 -->
  <section v-if="!step">
    <div class="vd-head"><h1>매물 소개 영상 만들기 <span class="badge badge-beta">BETA</span> <span class="badge badge-free">무료</span></h1></div>
    <div class="vd-land">
      <button class="vd-card" type="button" @click="go('video', { step: 'pick' })">
        <span class="ico-c"><Icon :src="I.grid" /></span>
        <strong>내 프로젝트에서 만들기</strong>
        <p>편집기에서 배경을 바꾼 사진으로 바로 영상을 만들어요. 사진 {{ MIN }}장 이상인 프로젝트에서 고를 수 있어요.</p>
      </button>
      <button class="vd-card" type="button" @click="go('video', { step: 'upload' })">
        <span class="ico-c"><Icon :src="I.upload" /></span>
        <strong>새 사진 올리기</strong>
        <p>사진 {{ MIN }}~{{ MAX }}장을 올려 바로 영상을 만들어요. 크레딧을 쓰지 않아요.</p>
      </button>
    </div>
  </section>

  <!-- 프로젝트 고르기 -->
  <section v-else-if="step === 'pick'">
    <div class="vd-head">
      <button class="icon-btn" type="button" aria-label="뒤로" @click="go('video')"><Icon :src="I.back" /></button>
      <h1>프로젝트 고르기</h1>
      <div class="steps" aria-hidden="true"><i class="is-on" /><i /><i /></div>
    </div>
    <div v-if="projects.length" class="pick-grid">
      <button v-for="p in projects" :key="p.id" class="pick card" :class="{ 'is-off': p.photos.length < MIN, 'is-on': pickId === p.id }" type="button" :disabled="p.photos.length < MIN" @click="pickId = p.id">
        <div class="card-img" :style="p.poster ? { backgroundImage: `url(${p.poster})` } : {}"><span class="tag">{{ p.name }}</span></div>
        <div class="card-body"><div class="card-meta"><span>사진 {{ p.photos.length }}장</span><span>{{ fmtDate(p.createdAt) }}</span></div><small v-if="p.photos.length < MIN" style="color: var(--bad)">사진 {{ MIN - p.photos.length }}장이 더 필요해요</small></div>
      </button>
    </div>
    <div v-else class="empty"><strong>아직 프로젝트가 없어요</strong><span>편집기에서 사진 {{ MIN }}장 이상을 처리하거나, 새 사진을 올려 만들어 보세요.</span><button class="btn btn-pri" type="button" @click="go('video', { step: 'upload' })">새 사진 올리기</button></div>
    <div class="dl-bar"><button class="btn btn-pri" type="button" :disabled="!pickId" @click="go('video', { step: 'details', id: pickId })">다음</button></div>
  </section>

  <!-- 새 사진 -->
  <section v-else-if="step === 'upload'">
    <div class="vd-head">
      <button class="icon-btn" type="button" aria-label="뒤로" @click="go('video')"><Icon :src="I.back" /></button>
      <h1>사진 올리기</h1>
      <div class="steps" aria-hidden="true"><i class="is-on" /><i /><i /></div>
    </div>
    <div class="sec">
      <h2>사진 {{ MIN }}~{{ MAX }}장 <span style="margin-left: auto; font-size: 13px; font-weight: 600; color: var(--sub)">{{ ups.length }} / {{ MAX }}</span></h2>
      <p style="margin: 0; color: var(--sub); font-size: 13px">올린 순서대로 영상에 나와요. 첫 사진이 여는 장면이에요(외관 앞 3/4 추천).</p>
      <div class="thumbs-num">
        <div v-for="(u, i) in ups" :key="u.id" class="thumb" :style="{ backgroundImage: `url(${u.url})` }">
          <span class="n">{{ i + 1 }}</span>
          <button class="x" type="button" :aria-label="`${i + 1}번 빼기`" @click="dropUp(u.id)"><Icon :src="I.close" /></button>
          <span style="position: absolute; right: 4px; bottom: 4px; display: flex; gap: 2px">
            <button class="x" style="position: static" type="button" :aria-label="`${i + 1}번 앞으로`" :disabled="i === 0" @click="moveUp(i, -1)"><Icon :src="I.prev" /></button>
            <button class="x" style="position: static" type="button" :aria-label="`${i + 1}번 뒤로`" :disabled="i === ups.length - 1" @click="moveUp(i, 1)"><Icon :src="I.next" /></button>
          </span>
        </div>
        <button v-if="ups.length < MAX" class="bg-add" style="aspect-ratio: 4 / 3" type="button" @click="fileIn?.click()"><Icon :src="I.add" /><span>사진 추가</span></button>
      </div>
      <input ref="fileIn" class="vh" type="file" accept="image/*" multiple @change="addUps(($event.target as HTMLInputElement).files); ($event.target as HTMLInputElement).value = ''" />
      <div class="field"><span>영상 글자 언어</span>
        <div class="chips" role="radiogroup" aria-label="영상 언어"><button v-for="l in LANGS" :key="l.id" class="chip" :class="{ 'is-on': lang === l.id }" type="button" role="radio" :aria-checked="lang === l.id" @click="lang = l.id">{{ l.label }}</button></div>
      </div>
    </div>
    <div class="dl-bar"><button class="btn btn-pri" type="button" :disabled="ups.length < MIN" @click="fromUploads">{{ ups.length < MIN ? `사진 ${MIN - ups.length}장 더 올려 주세요` : "다음" }}</button></div>
  </section>

  <!-- 차량 정보 · 틀 -->
  <section v-else-if="step === 'details' && proj">
    <div class="vd-head">
      <button class="icon-btn" type="button" aria-label="뒤로" @click="go('video')"><Icon :src="I.back" /></button>
      <h1>{{ proj.name }} · 영상 설정</h1>
      <div class="steps" aria-hidden="true"><i class="is-on" /><i class="is-on" /><i /></div>
    </div>
    <div class="vd-form">
      <div style="display: grid; gap: 16px">
        <div class="sec">
          <h2>차량 정보</h2>
          <p style="margin: 0; font-size: 13px; color: var(--sub)">적은 내용만 영상 글자로 들어가요. 확인되지 않은 사고 이력 · 보증은 적지 마세요.</p>
          <div class="cols">
            <label class="field"><span>제조사 *</span><input v-model="car.maker" class="input" placeholder="예: 랜드로버" /></label>
            <label class="field"><span>모델 *</span><input v-model="car.model" class="input" placeholder="예: 레인지로버 SV" /></label>
            <label class="field"><span>연식</span><input v-model="car.year" class="input" inputmode="numeric" maxlength="4" placeholder="2019" /></label>
            <label class="field"><span>주행거리(km)</span><input v-model="car.mileage" class="input" inputmode="numeric" placeholder="52000" /></label>
            <label class="field"><span>연료</span><select v-model="car.fuel" class="input"><option value="">고르기</option><option v-for="f in FUELS" :key="f">{{ f }}</option></select></label>
            <label class="field"><span>변속기</span><select v-model="car.gear" class="input"><option value="">고르기</option><option v-for="g in GEARS" :key="g">{{ g }}</option></select></label>
            <label class="field"><span>색상</span><input v-model="car.color" class="input" placeholder="예: 화이트" /></label>
            <label class="field"><span>가격(만원)</span><input v-model="car.price" class="input" inputmode="numeric" placeholder="비우면 가격 상담" /></label>
          </div>
          <div class="field"><span>주요 사양(최대 6개)</span>
            <div class="chips"><button v-for="o in OPTIONS" :key="o" class="chip" :class="{ 'is-on': car.options.includes(o) }" type="button" :aria-pressed="car.options.includes(o)" @click="toggleOpt(o)">{{ o }}</button></div>
          </div>
        </div>
        <div class="sec">
          <h2>영상 틀</h2>
          <div class="tpls" role="radiogroup" aria-label="영상 틀">
            <button v-for="t in TEMPLATES" :key="t.id" class="tpl" :class="{ 'is-on': tpl === t.id }" type="button" role="radio" :aria-checked="tpl === t.id" @click="tpl = t.id">
              <canvas :ref="(el) => (pv[t.id] = el as HTMLCanvasElement | null)" width="180" height="320" />
              <strong>{{ t.label }}</strong><small>{{ t.desc }}</small>
            </button>
          </div>
          <div v-if="tpl === 'classic'" class="field"><span>색 조합</span>
            <div class="palettes" role="radiogroup" aria-label="색 조합">
              <button v-for="pal in PALETTES" :key="pal.id" class="palette" :class="{ 'is-on': palette === pal.id }" type="button" role="radio" :aria-checked="palette === pal.id" :aria-label="pal.label" :title="pal.label" @click="palette = pal.id"><i :style="{ background: pal.bg }" /><i :style="{ background: pal.ink }" /><i :style="{ background: pal.accent }" /></button>
            </div>
          </div>
          <div class="field"><span>화면 비율</span>
            <div class="chips" role="radiogroup" aria-label="화면 비율">
              <button v-for="a in [{ id: '9:16', l: '세로 9:16 · 릴스 · 쇼츠' }, { id: '1:1', l: '정사각 1:1' }, { id: '16:9', l: '가로 16:9 · 유튜브' }] as const" :key="a.id" class="chip" :class="{ 'is-on': aspect === a.id }" type="button" role="radio" :aria-checked="aspect === a.id" @click="aspect = a.id">{{ a.l }}</button>
            </div>
          </div>
          <div class="field"><span>배경 음악</span>
            <div class="chips" role="radiogroup" aria-label="배경 음악"><button v-for="m in MUSIC" :key="m.id" class="chip" :class="{ 'is-on': music === m.id }" type="button" role="radio" :aria-checked="music === m.id" :title="m.desc" @click="music = m.id">{{ m.label }}</button></div>
          </div>
          <div class="field"><span>내레이션</span>
            <div class="chips"><span class="chip is-on">글자만</span><span class="chip" style="color: var(--faint)">AI 음성 · 준비 중</span></div>
          </div>
        </div>
        <div class="sec">
          <h2>사진 고르기 <span style="margin-left: auto; font-size: 13px; font-weight: 600; color: var(--sub)">{{ selected.length }} / {{ MAX }} · {{ MIN }}장 이상</span></h2>
          <div class="thumbs-num">
            <button v-for="ph in proj.photos" :key="ph.id" class="thumb" :class="{ 'is-on': selected.includes(ph.id) }" type="button" :aria-pressed="selected.includes(ph.id)" :style="{ opacity: selected.includes(ph.id) ? 1 : 0.45 }" @click="togglePhoto(ph.id)">
              <img :src="photoUrl(ph.id, ph.original)" alt="" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px" />
              <span v-if="selected.includes(ph.id)" class="n">{{ selected.indexOf(ph.id) + 1 }}</span>
            </button>
          </div>
        </div>
        <div class="sec">
          <h2>끝 장면 판매자</h2>
          <div class="cols">
            <label class="field"><span>딜러 이름</span><input v-model="profile.name" class="input" placeholder="선택" /></label>
            <label class="field"><span>상사</span><input v-model="profile.company" class="input" placeholder="선택" /></label>
            <label class="field"><span>대표 번호(050 안심번호 권장)</span><input v-model="profile.phone" class="input" placeholder="선택 · 휴대폰 번호는 넣지 마세요" /></label>
          </div>
        </div>
      </div>
      <aside class="summary" aria-label="요약">
        <strong style="font-size: 16px">요약</strong>
        <dl>
          <dt>차량</dt><dd>{{ [car.maker, car.model].join(" ").trim() || "–" }}</dd>
          <dt>연식 · 주행</dt><dd>{{ [car.year, kmText(car.mileage)].filter(Boolean).join(" · ") || "–" }}</dd>
          <dt>가격</dt><dd>{{ priceText(car.price) || "가격 상담" }}</dd>
          <dt>사진</dt><dd>{{ selected.length }}장</dd>
          <dt>틀</dt><dd>{{ TPL_LABEL(tpl) }}</dd>
          <dt>비율</dt><dd>{{ aspect }}</dd>
          <dt>길이</dt><dd>약 {{ estSeconds }}초</dd>
          <dt>음악</dt><dd>{{ MUSIC.find((m) => m.id === music)?.label }}</dd>
          <dt>비용</dt><dd style="color: var(--ok)">무료(베타)</dd>
        </dl>
        <button class="btn btn-pri btn-block" type="button" :disabled="!required || selected.length < MIN" @click="make"><Icon :src="I.video" /> 영상 만들기</button>
        <small v-if="!required" style="color: var(--sub)">제조사와 모델을 적으면 만들 수 있어요.</small>
      </aside>
    </div>
    <div v-if="gen" class="busy" role="alertdialog" aria-live="polite" aria-label="영상 만드는 중">
      <div class="orb" />
      <strong>{{ gen.text }}</strong>
      <div class="progress"><i :style="{ width: `${Math.round(gen.r * 100)}%` }" /></div>
      <small>{{ Math.round(gen.r * 100) }}% · 이 화면을 닫지 마세요. 영상은 이 기기 안에서 만들어요.</small>
    </div>
  </section>

  <!-- 결과 -->
  <section v-else-if="step === 'result' && proj && vid">
    <div class="vd-head">
      <button class="icon-btn" type="button" aria-label="내 영상 목록" @click="go('orders', { tab: 'video' })"><Icon :src="I.back" /></button>
      <h1>{{ vid.title || proj.name }}</h1>
      <div class="steps" aria-hidden="true"><i class="is-on" /><i class="is-on" /><i class="is-on" /></div>
    </div>
    <div class="vd-result">
      <video :src="vidUrl" controls playsinline :style="{ aspectRatio: vid.aspect.replace(':', ' / ') }" />
      <div style="display: grid; gap: 16px">
        <div class="sec">
          <h2>영상이 완성됐어요</h2>
          <div style="display: flex; flex-wrap: wrap; gap: 8px">
            <button class="btn btn-pri" type="button" @click="saveBlob(vid.video, fileName)"><Icon :src="I.download" /> 내려받기</button>
            <button class="btn btn-line" type="button" @click="regen"><Icon :src="I.refresh" /> 다시 만들기</button>
            <button class="btn btn-line" type="button" @click="share()"><Icon :src="I.share" /> 공유</button>
          </div>
          <div class="share-row" aria-label="SNS에 올리기">
            <button class="share-btn" type="button" aria-label="인스타그램에 올리기" @click="share('인스타그램')"><img :src="I.instagram" alt="" width="24" height="24" /></button>
            <button class="share-btn" type="button" aria-label="틱톡에 올리기" @click="share('틱톡')"><img :src="I.tiktok" alt="" width="24" height="24" /></button>
            <button class="share-btn" type="button" aria-label="유튜브에 올리기" @click="share('유튜브')"><img :src="I.youtube" alt="" width="24" height="24" /></button>
            <button class="share-btn" type="button" aria-label="페이스북에 올리기" @click="share('페이스북')"><img :src="I.facebook" alt="" width="24" height="24" /></button>
          </div>
          <small style="color: var(--sub)">공유를 누르면 함께 올릴 글을 복사해 둬요. 휴대폰에서는 앱을 골라 바로 올릴 수 있어요.</small>
        </div>
        <div class="sec">
          <h2>영상 정보</h2>
          <dl class="list-dl">
            <dt>틀</dt><dd>{{ TPL_LABEL(vid.template) }}</dd>
            <dt>비율</dt><dd>{{ vid.aspect }}</dd>
            <dt>길이</dt><dd>{{ vid.seconds }}초</dd>
            <dt>만든 날</dt><dd>{{ fmtDate(vid.at) }}</dd>
            <dt>파일</dt><dd>{{ fileName }}</dd>
          </dl>
        </div>
        <div class="sec">
          <h2>결과가 마음에 드세요?</h2>
          <div class="chips">
            <button class="chip" :class="{ 'is-on': liked === 'up' }" type="button" :aria-pressed="liked === 'up'" @click="liked = 'up'; say('고마워요!')">좋아요</button>
            <button class="chip" :class="{ 'is-on': liked === 'down' }" type="button" :aria-pressed="liked === 'down'" @click="liked = 'down'; say('아쉬운 점은 다시 만들기에서 틀 · 사진을 바꿔 보세요.')">아쉬워요</button>
          </div>
        </div>
      </div>
    </div>
  </section>
  <div v-else class="empty"><div class="spinner" /><span>불러오는 중…</span></div>
</template>
