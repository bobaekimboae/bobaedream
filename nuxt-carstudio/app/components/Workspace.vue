<script setup lang="ts">
// 작업 화면(Car Studio 편집 결과): 머리(이름 · 번호판 · 버전 기록 · 저장 · 의견) + 가운데 캔버스(차 끌기 · 모서리로 크기 · 격자)
// + 오른쪽 접는 칸 3개(① 배경 ② 스튜디오 ③ 추가 설정) + 아래 「선택한 사진 내려받기 · 모두 내려받기」.
// 모바일 앱은 칸 3개를 위쪽 탭으로 바꾸고 내려받기 줄을 아래 탭 막대 위에 붙인다.
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import Icon from "./Icon.vue";
import Modal from "./Modal.vue";
import PlateModal from "./PlateModal.vue";
import { fmtDate, go, say } from "../lib/app";
import { I } from "../lib/site";
import { BG_TABS, BGS, addMine, bgThumb, readMine, removeMine, type BgTab, type MineBg } from "../lib/backgrounds";
import { ASPECTS, RESOLUTIONS, blobImage, carRect, compose, optOf, outSize, posterOf, renderFile } from "../lib/compose";
import { DEFAULT_ADJUST, DEFAULT_POS, getProject, newId, putProject, type Adjust, type Photo, type Project } from "../lib/store";
import { makeZip, saveBlob } from "../lib/zip";

const props = defineProps<{ id: string; app: boolean }>();
const proj = ref<Project | null>(null);
const cur = ref(0);
const dirty = ref(false);
const panel = ref<"bg" | "studio" | "extra">("bg");
const done = reactive({ bg: false, studio: false, extra: false });
const bgTab = ref<BgTab>("studio");
const mine = ref<MineBg[]>([]);
const checked = ref<Set<string>>(new Set());
const menu = ref<"" | "versions">("");
const plateOpen = ref(false);
const nameOpen = ref(false);
const feedOpen = ref(false);
const nameDraft = ref("");
const saving = ref(false);
const drawing = ref(false);
const downloading = ref("");
const canvas = ref<HTMLCanvasElement | null>(null);
const wrap = ref<HTMLElement | null>(null);
const disp = reactive({ w: 0, h: 0, left: 0, top: 0 });
let logoImg: HTMLImageElement | null = null;

const photo = computed<Photo | null>(() => proj.value?.photos[cur.value] ?? null);
const canMove = computed(() => proj.value?.mode === "editor" && !!photo.value?.cut);

onMounted(async () => {
  const p = await getProject(props.id).catch(() => undefined);
  if (!p) {
    say("프로젝트를 찾지 못했어요.");
    return go("orders");
  }
  proj.value = p;
  mine.value = readMine();
  if (p.settings.logo) logoImg = await blobImage(p.settings.logo).catch(() => null);
  window.addEventListener("beforeunload", guard);
  window.addEventListener("resize", measure);
  document.addEventListener("click", closeMenu);
  await nextTick();
  void draw();
});
onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", guard);
  window.removeEventListener("resize", measure);
  document.removeEventListener("click", closeMenu);
});
function back() {
  if (dirty.value && !window.confirm("저장하지 않은 변경이 있어요. 저장하지 않고 나갈까요?")) return;
  go("orders");
}
const closeMenu = () => (menu.value = "");
function guard(e: BeforeUnloadEvent) {
  if (dirty.value) e.preventDefault();
}

// 미리보기 그리기(긴 변 1200, 모바일 900). 바뀔 때마다 한 프레임에 한 번
let pending = 0;
let seq = 0;
function draw() {
  cancelAnimationFrame(pending);
  return new Promise<void>((ok) => {
    pending = requestAnimationFrame(async () => {
      const p = proj.value;
      const ph = photo.value;
      const c = canvas.value;
      if (!p || !ph || !c) return ok();
      const my = ++seq;
      drawing.value = true;
      const side = props.app ? 900 : 1200;
      const { W, H } = outSize(ph, p.settings.aspect, side);
      const off = document.createElement("canvas");
      off.width = W;
      off.height = H;
      await compose(off.getContext("2d")!, ph, W, H, optOf(p, logoImg));
      if (my !== seq) return ok();
      c.width = W;
      c.height = H;
      c.getContext("2d")!.drawImage(off, 0, 0);
      drawing.value = false;
      measure();
      ok();
    });
  });
}
function measure() {
  const c = canvas.value;
  const w = wrap.value;
  if (!c || !w) return;
  const cr = c.getBoundingClientRect();
  const wr = w.getBoundingClientRect();
  disp.w = cr.width;
  disp.h = cr.height;
  disp.left = cr.left - wr.left;
  disp.top = cr.top - wr.top;
}
function touch() {
  dirty.value = true;
  void draw();
}
watch(cur, () => void draw());

// 차 상자(화면 좌표)
const box = computed(() => {
  const p = proj.value;
  const ph = photo.value;
  if (!p || !ph || !canMove.value || !disp.w) return null;
  const r = carRect(ph, disp.w, disp.h);
  return r ? { left: disp.left + r.x, top: disp.top + r.y, width: r.w, height: r.h } : null;
});
type Drag = { kind: "move" | "tl" | "tr" | "bl" | "br"; x: number; y: number; pos: Photo["pos"]; w: number };
let drag: Drag | null = null;
function down(e: PointerEvent, kind: Drag["kind"]) {
  const ph = photo.value;
  if (!ph || !box.value) return;
  e.preventDefault();
  e.stopPropagation();
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  drag = { kind, x: e.clientX, y: e.clientY, pos: { ...ph.pos }, w: box.value.width };
}
function move(e: PointerEvent) {
  const ph = photo.value;
  if (!drag || !ph) return;
  const dx = e.clientX - drag.x;
  const dy = e.clientY - drag.y;
  if (drag.kind === "move") {
    ph.pos.x = Math.min(0.95, Math.max(0.05, drag.pos.x + dx / disp.w));
    ph.pos.y = Math.min(1.1, Math.max(0.3, drag.pos.y + dy / disp.h));
  } else {
    const grow = drag.kind.endsWith("r") ? dx : -dx;
    ph.pos.scale = Math.min(2.2, Math.max(0.3, drag.pos.scale * ((drag.w + grow * 2) / drag.w)));
  }
  touch();
}
function up() {
  drag = null;
}
function wheel(e: WheelEvent) {
  const ph = photo.value;
  if (!ph || !canMove.value) return;
  e.preventDefault();
  ph.pos.scale = Math.min(2.2, Math.max(0.3, ph.pos.scale * (e.deltaY < 0 ? 1.05 : 0.95)));
  touch();
}
function nudge(e: KeyboardEvent) {
  const ph = photo.value;
  if (!ph || !canMove.value) return;
  const s = e.shiftKey ? 0.05 : 0.01;
  const k: Record<string, () => void> = {
    ArrowLeft: () => (ph.pos.x -= s),
    ArrowRight: () => (ph.pos.x += s),
    ArrowUp: () => (ph.pos.y -= s),
    ArrowDown: () => (ph.pos.y += s),
    "+": () => (ph.pos.scale = Math.min(2.2, ph.pos.scale * 1.05)),
    "-": () => (ph.pos.scale = Math.max(0.3, ph.pos.scale * 0.95)),
  };
  if (k[e.key]) {
    e.preventDefault();
    k[e.key]();
    touch();
  }
}

// 배경
const tabBgs = computed(() => (bgTab.value === "mine" ? [] : BGS.filter((b) => b.tab === bgTab.value)));
function setBg(id: string) {
  if (!photo.value) return;
  photo.value.bg = id;
  touch();
}
function allBg() {
  const p = proj.value;
  if (!p || !photo.value) return;
  for (const x of p.photos) x.bg = photo.value.bg;
  touch();
  say(`모든 사진(${p.photos.length}장)에 같은 배경을 넣었어요.`);
}
async function upMine(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0];
  (e.target as HTMLInputElement).value = "";
  if (!f) return;
  try {
    const m = await addMine(f);
    mine.value = readMine();
    setBg(m.id);
  } catch {
    say("배경 사진을 열지 못했어요.");
  }
}
function delMine(id: string) {
  removeMine(id);
  mine.value = readMine();
}

// 스튜디오
const SLIDERS: { key: keyof Adjust; label: string; min: number; max: number }[] = [
  { key: "rotate", label: "차 기울기", min: -15, max: 15 },
  { key: "contrast", label: "대비", min: -50, max: 50 },
  { key: "brightness", label: "밝기", min: -50, max: 50 },
  { key: "tint", label: "색조", min: -50, max: 50 },
  { key: "saturation", label: "채도", min: -50, max: 50 },
];
function resetStudio() {
  if (!photo.value) return;
  photo.value.adjust = { ...DEFAULT_ADJUST };
  photo.value.pos = { ...DEFAULT_POS };
  touch();
}
function setAspect(a: Project["settings"]["aspect"]) {
  if (!proj.value) return;
  proj.value.settings.aspect = a;
  touch();
}

// 추가 설정
async function upLogo(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0];
  (e.target as HTMLInputElement).value = "";
  if (!f || !proj.value) return;
  proj.value.settings.logo = f;
  logoImg = await blobImage(f).catch(() => null);
  touch();
}
function noLogo() {
  if (!proj.value) return;
  proj.value.settings.logo = null;
  logoImg = null;
  touch();
}
function allSettings() {
  const p = proj.value;
  const ph = photo.value;
  if (!p || !ph) return;
  for (const x of p.photos) {
    x.bg = ph.bg;
    x.adjust = { ...ph.adjust };
    x.reflect = ph.reflect;
  }
  touch();
  say("배경 · 보정을 모든 사진에 똑같이 넣었어요.");
}
function next(p: "bg" | "studio" | "extra") {
  done[panel.value] = true;
  panel.value = p;
}
async function complete() {
  done.extra = true;
  await save("완료");
}

// 저장 · 버전
async function save(label?: string) {
  const p = proj.value;
  if (!p || saving.value) return;
  saving.value = true;
  try {
    p.updatedAt = Date.now();
    p.versions.unshift({
      id: newId("v"),
      at: p.updatedAt,
      label: label || `저장 ${p.versions.length}`,
      photos: p.photos.map(({ id, bg, pos, adjust, reflect, plate }) => ({ id, bg, pos: { ...pos }, adjust: { ...adjust }, reflect, plate: plate ? { ...plate } : null })),
      settings: { aspect: p.settings.aspect, resolution: p.settings.resolution, grid: p.settings.grid, logoAt: p.settings.logoAt },
    });
    p.versions = p.versions.slice(0, 20);
    p.poster = await posterOf(p).catch(() => p.poster);
    await putProject(p);
    dirty.value = false;
    say("저장했어요.");
  } catch {
    say("저장하지 못했어요. 저장 공간을 확인해 주세요.");
  } finally {
    saving.value = false;
  }
}
function restore(vid: string) {
  const p = proj.value;
  const v = p?.versions.find((x) => x.id === vid);
  if (!p || !v) return;
  for (const s of v.photos) {
    const ph = p.photos.find((x) => x.id === s.id);
    if (ph) Object.assign(ph, { bg: s.bg, pos: { ...s.pos }, adjust: { ...s.adjust }, reflect: s.reflect, plate: s.plate ? { ...s.plate } : null });
  }
  Object.assign(p.settings, v.settings);
  menu.value = "";
  touch();
  say(`「${v.label}」 상태로 되돌렸어요. 저장을 눌러야 남아요.`);
}
const timeText = (t: number) => `${fmtDate(t)} ${String(new Date(t).getHours()).padStart(2, "0")}:${String(new Date(t).getMinutes()).padStart(2, "0")}`;

// 이름 · 번호판 · 의견
function openName() {
  nameDraft.value = proj.value?.name ?? "";
  nameOpen.value = true;
}
function saveName() {
  const t = nameDraft.value.trim().slice(0, 20);
  if (!t || !proj.value) return;
  proj.value.name = t;
  nameOpen.value = false;
  dirty.value = true;
}
function plateApply(v: { plateMode: Project["plateMode"]; customPlate: string; rect: Photo["plate"]; all: boolean }) {
  const p = proj.value;
  if (!p || !photo.value) return;
  p.plateMode = v.plateMode;
  p.customPlate = v.customPlate;
  photo.value.plate = v.rect;
  plateOpen.value = false;
  touch();
}
const ISSUES = ["차 가장자리가 잘렸어요", "배경이 남았어요", "그림자가 어색해요", "번호판이 안 가려졌어요", "차 색이 달라졌어요", "바퀴가 이상해요", "유리창 처리", "반사가 이상해요", "기타"];
const issues = ref<string[]>([]);
const note = ref("");
function sendFeedback() {
  feedOpen.value = false;
  issues.value = [];
  note.value = "";
  say("의견 고마워요. 다음 버전 개선에 쓸게요.");
}

// 내려받기(파일 이름은 영문만)
function toggleCheck(id: string) {
  const s = new Set(checked.value);
  if (s.has(id)) s.delete(id);
  else s.add(id);
  checked.value = s;
}
async function download(which: "sel" | "all") {
  const p = proj.value;
  if (!p || downloading.value) return;
  const list = which === "all" ? p.photos : p.photos.filter((x) => checked.value.has(x.id));
  if (!list.length) return say("내려받을 사진을 먼저 고르세요(사진 왼쪽 위 체크).");
  downloading.value = which;
  try {
    const files = [];
    for (let i = 0; i < list.length; i++) {
      const b = await renderFile(p, list[i], logoImg);
      files.push({ name: `bobae_studio_${p.id.slice(-6)}_${String(p.photos.indexOf(list[i]) + 1).padStart(2, "0")}.${b.type === "image/png" ? "png" : "jpg"}`, blob: b });
    }
    if (files.length === 1) saveBlob(files[0].blob, files[0].name);
    else saveBlob(await makeZip(files), `bobae_studio_${p.id.slice(-6)}.zip`);
    say(`사진 ${files.length}장을 내려받았어요.`);
  } catch {
    say("내려받지 못했어요. 다시 해 주세요.");
  } finally {
    downloading.value = "";
  }
}
const thumbUrl = new Map<string, string>();
function thumbOf(ph: Photo) {
  let u = thumbUrl.get(ph.id);
  if (!u) {
    u = URL.createObjectURL(ph.original);
    thumbUrl.set(ph.id, u);
  }
  return u;
}
onBeforeUnmount(() => thumbUrl.forEach((u) => URL.revokeObjectURL(u)));
const gridStyle = computed(() => ({ left: `${disp.left}px`, top: `${disp.top}px`, width: `${disp.w}px`, height: `${disp.h}px`, backgroundSize: `${disp.w / 6}px ${disp.h / 4}px` }));
const PANELS = [
  { id: "bg", label: "배경" },
  { id: "studio", label: "스튜디오" },
  { id: "extra", label: "추가 설정" },
] as const;
</script>
<template>
  <section v-if="proj && photo">
    <div class="ed-top">
      <button class="icon-btn" type="button" aria-label="내 프로젝트로" @click="back"><Icon :src="I.back" /></button>
      <button class="ed-name" type="button" :aria-label="`프로젝트 이름 ${proj.name}, 바꾸기`" @click="openName">{{ proj.name }} <Icon :src="I.edit" /></button>
      <button class="btn btn-line btn-sm" type="button" aria-label="번호판" @click="plateOpen = true"><Icon :src="I.mask" /><span class="btn-txt">번호판</span></button>
      <span class="grow" />
      <div class="menu-wrap">
        <button class="btn btn-line btn-sm" type="button" aria-label="버전 기록" aria-haspopup="menu" :aria-expanded="menu === 'versions'" @click.stop="menu = menu ? '' : 'versions'"><Icon :src="I.history" /><span class="btn-txt">버전 기록</span></button>
        <div v-if="menu === 'versions'" class="menu versions" role="menu" @click.stop>
          <button v-for="v in proj.versions" :key="v.id" type="button" role="menuitem" @click="restore(v.id)">{{ v.label }}<small>{{ timeText(v.at) }}</small></button>
          <span v-if="!proj.versions.length" class="muted" style="display: block; padding: 10px 12px">아직 저장한 버전이 없어요</span>
        </div>
      </div>
      <button class="icon-btn" type="button" aria-label="결과에 대한 의견 보내기" @click="feedOpen = true"><Icon :src="I.report" /></button>
      <button class="btn btn-dark btn-sm" :class="{ dirty }" type="button" :disabled="saving" @click="save()"><Icon :src="I.save2" />{{ saving ? "저장 중" : "저장" }}</button>
    </div>

    <div class="ed">
      <div class="stage">
        <div ref="wrap" class="canvas-wrap" @pointermove="move" @pointerup="up" @pointercancel="up" @wheel="wheel">
          <canvas ref="canvas" :aria-label="`${cur + 1}번 사진 미리보기`" role="img" />
          <div v-if="proj.settings.grid && disp.w" class="canvas-grid" :style="gridStyle" />
          <div v-if="box" class="car-box" :style="{ left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` }" tabindex="0" role="slider" aria-label="차 위치 · 크기(화살표로 옮기고 + · - 로 크기)" :aria-valuenow="Math.round(photo.pos.scale * 100)" @pointerdown="down($event, 'move')" @keydown="nudge">
            <i @pointerdown="down($event, 'tl')" /><i @pointerdown="down($event, 'tr')" /><i @pointerdown="down($event, 'bl')" /><i @pointerdown="down($event, 'br')" />
          </div>
          <span v-if="canMove" class="canvas-hint">차를 끌어 옮기고, 모서리로 크기를 바꿔요</span>
          <div v-if="drawing && !disp.w" class="canvas-busy">그리는 중…</div>
        </div>
        <p v-if="photo.error" class="err-note" style="margin-top: 10px">{{ photo.error }} 원본 사진은 그대로 두었어요(크레딧은 돌려드렸어요).</p>
        <div class="strip" aria-label="프로젝트 사진">
          <div v-for="(ph, i) in proj.photos" :key="ph.id" class="thumb" :class="{ 'is-on': i === cur }" :style="{ backgroundImage: `url(${thumbOf(ph)})` }">
            <button class="vh" type="button" style="all: unset; position: absolute; inset: 0; cursor: pointer" :aria-label="`${i + 1}번 사진 보기`" @click="cur = i" />
            <input type="checkbox" :checked="checked.has(ph.id)" :aria-label="`${i + 1}번 사진 내려받기로 고르기`" @change="toggleCheck(ph.id)" />
            <span class="n">{{ i + 1 }}</span>
            <span v-if="ph.error" class="warn">확인</span>
          </div>
        </div>
      </div>

      <div class="side">
        <div class="side-tabs seg" role="tablist" aria-label="설정">
          <button v-for="t in PANELS" :key="t.id" type="button" role="tab" :aria-selected="panel === t.id" :class="{ 'is-on': panel === t.id }" style="flex: 1" @click="panel = t.id">{{ t.label }}</button>
        </div>

        <div class="acc" :class="{ 'is-open': panel === 'bg', 'is-done': done.bg }">
          <button class="acc-h" type="button" :aria-expanded="panel === 'bg'" @click="panel = 'bg'"><span class="num">1</span> 배경<Icon :src="I.chevDown" /></button>
          <div v-if="panel === 'bg'" class="acc-b">
            <p v-if="proj.mode === 'blur'" style="margin: 0; font-size: 13px; color: var(--sub)">배경 흐림 방식은 찍은 장소를 흐리게 쓰므로 배경을 고르지 않아요.</p>
            <template v-else>
              <div class="tabs" role="tablist" aria-label="배경 종류">
                <button v-for="t in BG_TABS" :key="t.id" class="chip" :class="{ 'is-on': bgTab === t.id }" type="button" role="tab" :aria-selected="bgTab === t.id" @click="bgTab = t.id">{{ t.label }}</button>
              </div>
              <div class="bg-grid" role="radiogroup" aria-label="배경">
                <template v-if="bgTab === 'mine'">
                  <label class="bg-add" tabindex="0" @keydown.enter="($event.currentTarget as HTMLElement).querySelector('input')?.click()"><Icon :src="I.add" /><span>새로 추가</span><input class="vh" type="file" accept="image/*" @change="upMine" /></label>
                  <button v-for="m in mine" :key="m.id" class="bg-cell" :class="{ 'is-on': photo.bg === m.id }" type="button" role="radio" :aria-checked="photo.bg === m.id" :style="{ backgroundImage: `url(${m.url})` }" @click="setBg(m.id)" @contextmenu.prevent="delMine(m.id)"><span class="nm">{{ m.label }}</span></button>
                </template>
                <button v-for="b in tabBgs" v-else :key="b.id" class="bg-cell" :class="{ 'is-on': photo.bg === b.id }" type="button" role="radio" :aria-checked="photo.bg === b.id" :style="{ backgroundImage: `url(${bgThumb(b.id)})` }" @click="setBg(b.id)"><span class="nm">{{ b.label }}</span></button>
              </div>
              <div class="row"><span class="row-l">바닥 반사</span><button class="switch" type="button" role="switch" :aria-checked="photo.reflect" aria-label="바닥 반사" @click="photo.reflect = !photo.reflect; touch()" /></div>
              <button class="btn btn-line btn-sm" type="button" @click="allBg">모든 사진에 이 배경 넣기</button>
            </template>
            <div class="acc-foot"><span /><button class="btn btn-pri btn-sm" type="button" @click="next('studio')">다음</button></div>
          </div>
        </div>

        <div class="acc" :class="{ 'is-open': panel === 'studio', 'is-done': done.studio }">
          <button class="acc-h" type="button" :aria-expanded="panel === 'studio'" @click="panel = 'studio'"><span class="num">2</span> 스튜디오<Icon :src="I.chevDown" /></button>
          <div v-if="panel === 'studio'" class="acc-b">
            <div class="row"><span class="row-l">사진 보정</span><button class="btn btn-ghost btn-sm" type="button" @click="resetStudio"><Icon :src="I.refresh" /> 초기화</button></div>
            <label v-for="s in SLIDERS" :key="s.key" class="slider">
              <span class="row"><span class="row-l">{{ s.label }}</span><span>{{ photo.adjust[s.key] > 0 ? "+" : "" }}{{ photo.adjust[s.key] }}{{ s.key === 'rotate' ? '°' : '' }}</span></span>
              <input v-model.number="photo.adjust[s.key]" type="range" :min="s.min" :max="s.max" step="1" @input="touch" />
            </label>
            <div class="row"><span class="row-l">격자 보기</span><button class="switch" type="button" role="switch" :aria-checked="proj.settings.grid" aria-label="격자 보기" @click="proj.settings.grid = !proj.settings.grid" /></div>
            <div class="field"><span>화면 비율</span>
              <div class="chips" role="radiogroup" aria-label="화면 비율"><button v-for="a in ASPECTS" :key="a.id" class="chip" :class="{ 'is-on': proj.settings.aspect === a.id }" type="button" role="radio" :aria-checked="proj.settings.aspect === a.id" @click="setAspect(a.id)">{{ a.label }}</button></div>
            </div>
            <div class="field"><span>내려받을 크기</span>
              <div class="chips" role="radiogroup" aria-label="내려받을 크기"><button v-for="r in RESOLUTIONS" :key="r.id" class="chip" :class="{ 'is-on': proj.settings.resolution === r.id }" type="button" role="radio" :aria-checked="proj.settings.resolution === r.id" @click="proj.settings.resolution = r.id; dirty = true">{{ r.label }}</button></div>
            </div>
            <div class="acc-foot"><button class="btn btn-ghost btn-sm" type="button" @click="panel = 'bg'">이전</button><button class="btn btn-pri btn-sm" type="button" @click="next('extra')">다음</button></div>
          </div>
        </div>

        <div class="acc" :class="{ 'is-open': panel === 'extra', 'is-done': done.extra }">
          <button class="acc-h" type="button" :aria-expanded="panel === 'extra'" @click="panel = 'extra'"><span class="num">3</span> 추가 설정<Icon :src="I.chevDown" /></button>
          <div v-if="panel === 'extra'" class="acc-b">
            <div class="row"><span class="row-l">로고 넣기</span><button v-if="proj.settings.logo" class="btn btn-ghost btn-sm" type="button" @click="noLogo"><Icon :src="I.del" /> 빼기</button></div>
            <label class="bg-add" style="aspect-ratio: auto; height: 64px" tabindex="0"><Icon :src="I.sticker" /><span>{{ proj.settings.logo ? "다른 로고로 바꾸기" : "상사 로고 올리기(PNG 권장)" }}</span><input class="vh" type="file" accept="image/*" @change="upLogo" /></label>
            <div v-if="proj.settings.logo" class="field"><span>로고 자리</span>
              <div class="chips">
                <button v-for="a in [{ id: 'tl', l: '왼쪽 위' }, { id: 'tr', l: '오른쪽 위' }, { id: 'bl', l: '왼쪽 아래' }, { id: 'br', l: '오른쪽 아래' }] as const" :key="a.id" class="chip" :class="{ 'is-on': proj.settings.logoAt === a.id }" type="button" @click="proj.settings.logoAt = a.id; touch()">{{ a.l }}</button>
              </div>
            </div>
            <button class="btn btn-line btn-sm" type="button" @click="allSettings">이 사진 설정을 모든 사진에 넣기</button>
            <div class="acc-foot"><button class="btn btn-ghost btn-sm" type="button" @click="panel = 'studio'">이전</button><button class="btn btn-pri btn-sm" type="button" :disabled="saving" @click="complete">완료</button></div>
          </div>
        </div>
      </div>
    </div>

    <div class="dl-bar">
      <button class="btn btn-line" type="button" :disabled="!!downloading || saving" @click="download('sel')"><Icon :src="I.download" />{{ downloading === 'sel' ? "만드는 중…" : `선택한 사진 내려받기${checked.size ? ` (${checked.size})` : ''}` }}</button>
      <button class="btn btn-pri" type="button" :disabled="!!downloading || saving" @click="download('all')"><Icon :src="I.download" />{{ downloading === 'all' ? "만드는 중…" : "모두 내려받기" }}</button>
    </div>

    <PlateModal v-if="plateOpen" :project="proj" :photo="photo" @close="plateOpen = false" @apply="plateApply" />
    <Modal v-if="nameOpen" title="프로젝트 이름" @close="nameOpen = false">
      <label class="field"><span>이름(20자) · 차량번호는 넣지 마세요</span><input v-model="nameDraft" class="input" maxlength="20" @keydown.enter="saveName" /></label>
      <template #foot><button class="btn btn-line" type="button" @click="nameOpen = false">취소</button><button class="btn btn-pri" type="button" :disabled="!nameDraft.trim()" @click="saveName">바꾸기</button></template>
    </Modal>
    <Modal v-if="feedOpen" title="결과 사진 의견" @close="feedOpen = false">
      <p style="margin: 0; color: var(--sub)">{{ cur + 1 }}번 사진에서 어떤 점이 아쉬웠나요?</p>
      <div class="feedback-chips">
        <button v-for="t in ISSUES" :key="t" class="chip" :class="{ 'is-on': issues.includes(t) }" type="button" :aria-pressed="issues.includes(t)" @click="issues = issues.includes(t) ? issues.filter((x) => x !== t) : [...issues, t]">{{ t }}</button>
      </div>
      <label class="field"><span>자세히 적기(선택)</span><textarea v-model="note" class="input" maxlength="128" rows="3" /></label>
      <div class="counter">{{ note.length }}/128</div>
      <template #foot><button class="btn btn-line" type="button" @click="feedOpen = false">취소</button><button class="btn btn-pri" type="button" :disabled="!issues.length && !note.trim()" @click="sendFeedback">보내기</button></template>
    </Modal>
  </section>
  <div v-else class="empty"><div class="spinner" /><span>프로젝트를 여는 중…</span></div>
</template>

