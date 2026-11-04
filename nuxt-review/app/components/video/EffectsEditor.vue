<script setup lang="ts">
// 효과 편집(동처띠 编辑): 오른쪽 세로 자막 · 표지, 아래 필터 · 효과 · 번호판 가리기 · 음량, 위 뒤로 + 다음.
// 효과 화면은 취소/저장, 타임라인 위치를 고른 뒤 효과 버튼을 누르고 있는 동안 그 구간에 효과가 들어간다.
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import Ico from "../Ico.vue";
import { VI } from "../../lib/video-icons";
import { drag, useFit } from "./fit";
import { useRuntimeConfig } from "#app";
import { scanPlates, setPlateBase, trackCount } from "./plate-detect";
import FilmStrip from "./FilmStrip.vue";
import {
  EFFECTS, FILTERS, FILTER_TABS, TIME_FX, Player, fxColor, makePlan, mmss, planFrames, previewSize, uid,
  type Caption, type EditState, type FxKind, type Look, type Seq, type TimeFx, type FxRange,
} from "./render";

const props = defineProps<{ seq: Seq; a: number; b: number; speed: number; st: EditState; thumb: string }>();
const emit = defineEmits<{ next: []; back: [] }>();
const st = props.st;

type Panel = "" | "filter" | "effect" | "volume" | "caption" | "cover";
const panel = ref<Panel>("");
const stage = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const track = ref<HTMLElement | null>(null);
const u = ref(0);
const playing = ref(false);
const size = previewSize(props.seq);
const { box } = useFit(stage, () => size.w / size.h);
const filterTab = ref<"film" | "scene" | "tone">("film");
const fxTab = ref<"fx" | "time">("fx");
const holding = ref<FxRange | null>(null);
const toast = ref("");
let player: Player | null = null;
let snapshot = "";

const look = (): Look => ({ filter: st.filter, effects: st.effects, plate: st.plate, captions: st.captions });
const plan = computed(() => makePlan(props.a, props.b, props.speed, st.timeFx));
const dur = computed(() => plan.value.reduce((s, x) => Math.max(s, x.o + x.d), 0));

onMounted(async () => {
  if (!canvas.value) return;
  canvas.value.width = size.w;
  canvas.value.height = size.h;
  player = new Player(props.seq, canvas.value, look);
  player.onTime = (t) => (u.value = t);
  player.volume = st.volume;
  player.setPlan(plan.value);
  await player.seek(0);
  play();
});
onBeforeUnmount(() => { scanAbort?.abort(); player?.destroy(); });
watch(plan, (p) => { player?.setPlan(p); if (!player?.playing) player?.seek(Math.min(u.value, dur.value)); });
// 멈춘 상태에서 필터 · 자막 · 번호판을 바꾸면 화면을 다시 그린다
watch(() => [st.filter, st.plate && { ...st.plate, track: !!st.plate.track }, st.captions.map((c) => ({ ...c })), st.effects.length], () => { if (!player?.playing) player?.render(); }, { deep: true });
watch(() => st.volume, (v) => { if (player) player.volume = v; });

const play = () => { player?.play(); playing.value = true; };
const pause = () => { player?.pause(); playing.value = false; };
const toggle = () => (playing.value ? pause() : play());
// 원본: 필터 · 음량 판이 열려 있으면 아래 도구 줄이 숨고, 화면을 누르면 판이 닫힌다
const tapStage = () => { if (panel.value === "filter" || panel.value === "volume") panel.value = ""; else toggle(); };
const say = (m: string) => { toast.value = m; setTimeout(() => (toast.value = ""), 1600); };

// 패널 열기: 효과 · 표지는 취소/저장이 있어 들어갈 때 상태를 기억한다
function open(p: Panel) {
  if (p === "effect" || p === "cover" || p === "caption") {
    snapshot = JSON.stringify({ effects: st.effects, timeFx: st.timeFx, cover: st.cover, captions: st.captions });
    pause();
    selCap.value = null;
    if (p === "cover") player?.seek(Math.min(st.cover.t, dur.value));
    if (p !== "effect") ensureFrames();
  }
  panel.value = panel.value === p ? "" : p;
}
function cancelFull() {
  const s = JSON.parse(snapshot || "{}");
  if (s.effects) { st.effects.splice(0, st.effects.length, ...s.effects); st.timeFx = s.timeFx; st.cover = s.cover; st.captions.splice(0, st.captions.length, ...s.captions); }
  panel.value = "";
  selCap.value = null;
  play();
}
function saveFull() {
  if (panel.value === "cover") st.cover.t = u.value;
  panel.value = "";
  selCap.value = null;
  play();
}

/* 번호판 가리기: 누르면 구간을 훑어 번호판을 자동으로 찾고(동처띠 「识别成功」), 못 찾으면 직접 옮기는 상자를 띄운다 */
setPlateBase(useRuntimeConfig().app.baseURL);
const scan = reactive({ on: false, pct: 0 });
let scanAbort: AbortController | null = null;
async function togglePlate() {
  if (scan.on) return;
  if (st.plate) { st.plate = null; say("번호판 가리기를 껐어요"); return; }
  pause();
  scan.on = true;
  scan.pct = 0;
  scanAbort = new AbortController();
  try {
    const track = await scanPlates(props.seq, props.a, props.b, (p) => (scan.pct = Math.round(p * 100)), scanAbort.signal);
    if (trackCount(track)) { st.plate = { x: 0, y: 0, w: 0, h: 0, style: "blur", track }; say("번호판을 찾아 가렸어요"); }
    else { st.plate = { x: 0.34, y: 0.62, w: 0.32, h: 0.075, style: "blur" }; say("번호판을 찾지 못했어요 · 상자를 번호판 위로 옮겨 주세요"); }
  } catch (e) {
    if ((e as Error).name !== "AbortError") { st.plate = { x: 0.34, y: 0.62, w: 0.32, h: 0.075, style: "blur" }; say("자동으로 찾지 못했어요 · 상자를 번호판 위로 옮겨 주세요"); }
  }
  scan.on = false;
  scanAbort = null;
  player?.render();
}
const cancelScan = () => scanAbort?.abort();
/** 자동으로 찾은 뒤에도 놓친 곳이 있으면 직접 상자로 바꿀 수 있다 */
function manualPlate() {
  if (!st.plate) return;
  st.plate = { x: 0.34, y: 0.62, w: 0.32, h: 0.075, style: st.plate.style };
  say("상자를 번호판 위로 끌어 옮겨 주세요");
}
function movePlate(e: PointerEvent) {
  const p = st.plate;
  if (!p) return;
  const x0 = p.x, y0 = p.y;
  drag(e, (dx, dy) => {
    p.x = Math.max(0, Math.min(1 - p.w, x0 + dx / box.value.w));
    p.y = Math.max(0, Math.min(1 - p.h, y0 + dy / box.value.h));
  });
}
function sizePlate(e: PointerEvent) {
  e.stopPropagation();
  const p = st.plate;
  if (!p) return;
  const w0 = p.w, h0 = p.h;
  drag(e, (dx, dy) => {
    p.w = Math.max(0.08, Math.min(1 - p.x, w0 + dx / box.value.w));
    p.h = Math.max(0.03, Math.min(1 - p.y, h0 + dy / box.value.h));
  });
}
const plateKey = (e: KeyboardEvent) => {
  const p = st.plate;
  if (!p) return;
  const d = 0.01, k = e.key;
  if (!k.startsWith("Arrow")) return;
  e.preventDefault();
  if (e.shiftKey) {
    if (k === "ArrowRight") p.w = Math.min(1 - p.x, p.w + d);
    if (k === "ArrowLeft") p.w = Math.max(0.08, p.w - d);
    if (k === "ArrowDown") p.h = Math.min(1 - p.y, p.h + d);
    if (k === "ArrowUp") p.h = Math.max(0.03, p.h - d);
  } else {
    if (k === "ArrowRight") p.x = Math.min(1 - p.w, p.x + d);
    if (k === "ArrowLeft") p.x = Math.max(0, p.x - d);
    if (k === "ArrowDown") p.y = Math.min(1 - p.h, p.y + d);
    if (k === "ArrowUp") p.y = Math.max(0, p.y - d);
  }
};

/* 타임라인(효과 · 표지) */
function scrub(e: PointerEvent) {
  if (!track.value) return;
  pause();
  const r = track.value.getBoundingClientRect();
  const go = (x: number) => player?.seek(Math.max(0, Math.min(1, (x - r.left) / r.width)) * dur.value);
  go(e.clientX);
  drag(e, (_dx, _dy, ev) => go(ev.clientX));
}
const scrubKey = (e: KeyboardEvent) => {
  const d = e.key === "ArrowLeft" ? -0.5 : e.key === "ArrowRight" ? 0.5 : 0;
  if (!d) return;
  e.preventDefault();
  pause();
  player?.seek(Math.max(0, Math.min(dur.value, u.value + d)));
};

/* 효과: 누르고 있는 동안 기록 */
function holdStart(kind: FxKind, e: PointerEvent) {
  e.preventDefault();
  if (!player || holding.value) return;
  if (u.value >= dur.value - 0.05) player.seek(0);
  const r = reactive<FxRange>({ kind, start: player.t, end: player.t });
  st.effects.push(r);
  holding.value = r;
  player.loop = false;
  player.onTime = (t) => { u.value = t; if (holding.value) holding.value.end = t; };
  player.onEnd = holdEnd;
  play();
}
function holdEnd() {
  if (!player || !holding.value) return;
  pause();
  player.loop = true;
  player.onTime = (t) => (u.value = t);
  player.onEnd = undefined;
  const h = holding.value;
  holding.value = null;
  if (h.end - h.start < 0.05) st.effects.splice(st.effects.indexOf(h), 1);
}
// 키보드: 스페이스/엔터로 눌렀다 떼기
const fxKeyDown = (kind: FxKind, e: KeyboardEvent) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) holdStart(kind, e as unknown as PointerEvent); };
const fxKeyUp = (e: KeyboardEvent) => { if (e.key === " " || e.key === "Enter") holdEnd(); };
const undoFx = () => { st.effects.pop(); player?.render(); };
const setTimeFx = (kind: TimeFx["kind"]) => {
  // 반복 · 슬로모션은 지금 위치(원본 시각)에서
  const at = props.a + u.value * props.speed;
  st.timeFx = { kind, at: Math.min(at, props.b - 0.2) };
  player?.seek(0);
};
const tfxMark = computed(() => (st.timeFx.kind === "repeat" || st.timeFx.kind === "slow" ? ((st.timeFx.at - props.a) / props.speed / dur.value) * 100 : -1));

/* 자막(동처띠 字幕 화면): 필름 줄 위치에서 「직접 추가」 → 가운데 입력 창 → ✓, 고른 자막은 「자막 수정」 · 지우기 · 양 끝 손잡이로 길이 */
const frames = ref<string[]>([]);
let framesFor = "";
async function ensureFrames() {
  const key = JSON.stringify(plan.value);
  if (frames.value.length && framesFor === key) return;
  framesFor = key;
  frames.value = [];
  frames.value = await planFrames(props.seq, plan.value, Math.max(6, Math.min(90, Math.round(dur.value))));
}
const selCap = ref<string | null>(null);
const capInput = reactive({ open: false, text: "", id: "" as string });
const capBox = ref<HTMLInputElement | null>(null);
function openCapInput(id = "") {
  pause();
  capInput.id = id;
  capInput.text = id ? st.captions.find((c) => c.id === id)?.text ?? "" : "";
  capInput.open = true;
  setTimeout(() => capBox.value?.focus(), 30);
}
function okCapInput() {
  const t = capInput.text.trim();
  if (!t) { capBox.value?.focus(); return; }
  if (capInput.id) { const c = st.captions.find((x) => x.id === capInput.id); if (c) c.text = t; }
  else {
    const start = Math.min(u.value, Math.max(0, dur.value - 0.5));
    const c: Caption = { id: uid(), text: t, start, end: Math.min(dur.value, start + 2), x: 0.5, y: 0.7 };
    st.captions.push(c);
    selCap.value = c.id;
  }
  capInput.open = false;
  player?.render();
}
const delCaption = (id: string) => { const i = st.captions.findIndex((c) => c.id === id); if (i >= 0) st.captions.splice(i, 1); selCap.value = null; player?.render(); };
const autoCaption = () => say("자동 인식은 음성 인식 서버를 연결한 뒤에 쓸 수 있어요 · 지금은 직접 추가해 주세요");
const onCapTime = (id: string, k: "start" | "end", v: number) => { const c = st.captions.find((x) => x.id === id); if (c) setCapTime(c, k, v); };
const seekStrip = (t: number) => { pause(); player?.seek(t); };
const visibleCaps = computed(() => st.captions.filter((c) => c.text && u.value >= c.start && u.value < c.end));
function moveCap(c: Caption, e: PointerEvent) {
  pause();
  const x0 = c.x, y0 = c.y;
  drag(e, (dx, dy) => {
    c.x = Math.max(0.1, Math.min(0.9, x0 + dx / box.value.w));
    c.y = Math.max(0.06, Math.min(0.94, y0 + dy / box.value.h));
  });
}
const setCapTime = (c: Caption, k: "start" | "end", v: number) => {
  if (k === "start") c.start = Math.max(0, Math.min(v, c.end - 0.3));
  else c.end = Math.min(dur.value, Math.max(v, c.start + 0.3));
  pause();
  player?.seek(c[k] === c.end ? Math.max(0, c.end - 0.05) : c.start);
};

/* 표지 */
const filterThumb = computed(() => props.thumb);
const pct = (t: number) => `${(t / (dur.value || 1)) * 100}%`;

defineExpose({
  esc: () => {
    if (scan.on) { cancelScan(); return true; }
    if (capInput.open) { capInput.open = false; return true; }
    if (holding.value) { holdEnd(); return true; }
    if (full.value) { cancelFull(); return true; }
    if (panel.value) { panel.value = ""; return true; }
    return false;
  },
});
const full = computed(() => panel.value === "effect" || panel.value === "cover" || panel.value === "caption");
</script>

<template>
  <div class="vf-fx" :class="{ 'is-full': full }">
    <header class="vf-head">
      <template v-if="!full">
        <button class="vf-ibtn" type="button" aria-label="뒤로" @click="emit('back')"><Ico :src="VI.back" /></button>
        <h2 class="vf-hide-t">효과 편집</h2>
        <button class="vf-next" type="button" @click="pause(); emit('next')">다음</button>
      </template>
      <template v-else-if="panel === 'effect'">
        <button class="vf-cancel" type="button" @click="cancelFull">취소</button>
        <h2 class="vf-hide-t">효과</h2>
        <button class="vf-next" type="button" @click="saveFull">저장</button>
      </template>
      <template v-else>
        <button class="vf-ibtn" type="button" aria-label="뒤로" @click="cancelFull"><Ico :src="VI.back" /></button>
        <h2 :class="{ 'vf-hide-t': panel === 'caption' }">{{ panel === "cover" ? "표지 선택" : "자막" }}</h2>
        <button class="vf-next" type="button" @click="saveFull">완료</button>
      </template>
    </header>

    <div ref="stage" class="vf-stage" @click.self="tapStage">
      <div class="vf-frame" :style="{ width: `${box.w}px`, height: `${box.h}px` }" @click.self="tapStage">
        <canvas ref="canvas" class="vf-canvas" @click="tapStage" />
        <span v-if="!playing && panel !== 'cover'" class="vf-play" aria-hidden="true"><Ico :src="VI.play" /></span>
        <!-- 번호판 상자 -->
        <div
          v-if="st.plate && !st.plate.track && !full"
          class="vf-plate"
          tabindex="0"
          role="group"
          aria-label="번호판 가림 상자 · 화살표로 이동, Shift+화살표로 크기"
          :style="{ left: `${st.plate.x * 100}%`, top: `${st.plate.y * 100}%`, width: `${st.plate.w * 100}%`, height: `${st.plate.h * 100}%` }"
          @pointerdown="movePlate"
          @keydown="plateKey"
        >
          <i class="vf-plate__size" aria-hidden="true" @pointerdown="sizePlate" />
        </div>
        <!-- 자막 끌기 -->
        <template v-if="panel === 'caption'">
          <div
            v-for="c in visibleCaps"
            :key="c.id"
            class="vf-capdrag"
            :style="{ left: `${c.x * 100}%`, top: `${c.y * 100}%` }"
            :aria-label="`자막 위치: ${c.text}`"
            @pointerdown="moveCap(c, $event)"
          />
        </template>
      </div>
      <nav v-if="!full" class="vf-fx__side" aria-label="자막과 표지">
        <button type="button" :aria-pressed="panel === 'caption'" @click="open('caption')"><Ico :src="VI.caption" /><span>자막</span></button>
        <button type="button" @click="open('cover')"><Ico :src="VI.cover" /><span>표지</span></button>
      </nav>
    </div>

    <!-- 번호판 도구 -->
    <div v-if="st.plate && !panel" class="vf-plate-tools" role="radiogroup" aria-label="가림 방식">
      <button type="button" role="radio" :aria-checked="st.plate.style === 'blur'" :class="{ 'is-on': st.plate.style === 'blur' }" @click="st.plate.style = 'blur'">흐림</button>
      <button type="button" role="radio" :aria-checked="st.plate.style === 'sticker'" :class="{ 'is-on': st.plate.style === 'sticker' }" @click="st.plate.style = 'sticker'">보배드림 스티커</button>
      <button v-if="st.plate.track" type="button" class="vf-plate-tools__manual" @click="manualPlate">직접 옮기기</button>
    </div>
    <div v-if="scan.on" class="vf-busy" role="alertdialog" aria-label="번호판 찾는 중">
      <div class="vf-busy__box">
        <span class="vf-ring" :style="{ '--p': `${scan.pct}%` }" />
        <p>번호판을 찾는 중 {{ scan.pct }}%</p>
        <button type="button" class="vf-busy__cancel" @click="cancelScan">취소</button>
      </div>
    </div>

    <!-- 필터 -->
    <section v-if="panel === 'filter'" class="vf-pane" aria-label="필터">
      <div class="vf-tabs">
        <button v-for="t in FILTER_TABS" :key="t.id" type="button" :class="{ 'is-on': filterTab === t.id }" :aria-pressed="filterTab === t.id" @click="filterTab = t.id">{{ t.name }}</button>
      </div>
      <div class="vf-fthumbs" role="radiogroup" aria-label="필터 고르기">
        <button
          v-for="f in FILTERS.filter((x) => x.tab === filterTab || x.id === 'normal')"
          :key="f.id"
          type="button"
          role="radio"
          :aria-checked="st.filter === f.id"
          :class="{ 'is-on': st.filter === f.id }"
          @click="st.filter = f.id"
        >
          <span class="vf-fthumb"><img :src="filterThumb" alt="" :style="{ filter: f.css }" /><Ico v-if="st.filter === f.id" :src="VI.check" /></span>
          <em>{{ f.name }}</em>
        </button>
      </div>
    </section>

    <!-- 음량 -->
    <section v-if="panel === 'volume'" class="vf-pane vf-vol" aria-label="음량">
      <button type="button" class="vf-vol__ok" aria-label="음량 닫기" @click="panel = ''"><Ico :src="VI.check" /></button>
      <label>
        <span>원본 소리</span>
        <input v-model.number="st.volume" type="range" min="0" max="1" step="0.01" :style="{ '--p': `${st.volume * 100}%` }" />
      </label>
      <!-- 원본(동처띠 配乐): 배경 음악을 고르지 않으면 막혀 있다 -->
      <label class="is-off">
        <span>배경 음악</span>
        <input type="range" min="0" max="1" step="0.01" value="0" disabled aria-label="배경 음악(고른 음악이 없어요)" />
      </label>
    </section>

    <!-- 효과 · 표지 아래 판 -->
    <section v-if="full" class="vf-fullpane">
      <div v-if="panel !== 'effect'" class="vf-filmwrap" :class="`is-${panel}`">
        <p v-if="panel === 'cover'" class="vf-fxhint">좌우로 밀어 표지를 고르세요</p>
        <div class="vf-filmrow">
          <button v-if="panel === 'caption'" type="button" class="vf-filmplay" :aria-label="playing ? '멈추기' : '재생'" @click="toggle"><Ico :src="playing ? VI.pause : VI.play" /></button>
          <FilmStrip :frames="frames" :dur="dur" :u="u" :pps="panel === 'cover' ? Math.max(24, (58 * Math.max(1, frames.length)) / (dur || 1)) : 40" :mode="panel === 'cover' ? 'cover' : 'caption'" :captions="st.captions" :sel="selCap" @seek="seekStrip" @select="selCap = $event" @time="onCapTime" />
        </div>
        <span v-if="panel === 'caption'" class="vf-filmdur">{{ mmss(dur) }}</span>
        <div v-if="panel === 'caption'" class="vf-capbtns">
          <template v-if="selCap">
            <button type="button" class="vf-capbtn" @click="openCapInput(selCap)"><Ico :src="VI.edit" />자막 수정</button>
            <button type="button" class="vf-capbtn is-round" aria-label="자막 지우기" @click="delCaption(selCap)"><Ico :src="VI.del" /></button>
          </template>
          <template v-else>
            <button type="button" class="vf-capbtn" @click="autoCaption"><Ico :src="VI.caption" />자동 인식</button>
            <button type="button" class="vf-capbtn is-pri" @click="openCapInput()">+ 직접 추가</button>
          </template>
        </div>
      </div>
      <div v-else class="vf-tl">
        <span>{{ mmss(u) }}</span>
        <div
          ref="track"
          class="vf-tl__track"
          role="slider"
          tabindex="0"
          aria-label="재생 위치"
          :aria-valuenow="Math.round(u * 10) / 10"
          :aria-valuemin="0"
          :aria-valuemax="dur"
          @pointerdown="scrub"
          @keydown="scrubKey"
        >
          <template v-if="panel === 'effect'">
            <i v-for="(e, i) in st.effects" :key="i" class="vf-tl__seg" :style="{ left: pct(e.start), width: pct(Math.max(0.02, e.end - e.start)), background: fxColor(e.kind) }" />
            <i v-for="c in st.captions" :key="c.id" class="vf-tl__cap" :style="{ left: pct(c.start), width: pct(c.end - c.start) }" />
            <i v-if="tfxMark >= 0" class="vf-tl__mark" :style="{ left: `${tfxMark}%` }" />
          </template>
          <b class="vf-tl__knob" :style="{ left: pct(u) }" />
        </div>
        <span>{{ mmss(dur) }}</span>
      </div>

      <template v-if="panel === 'effect'">
        <div class="vf-fxbody">
          <template v-if="fxTab === 'fx'">
            <p class="vf-fxhint">위치를 고른 뒤 누르고 있으면 효과가 들어가요</p>
            <div class="vf-fxbtns">
              <button
                v-for="e in EFFECTS"
                :key="e.kind"
                type="button"
                :class="{ 'is-on': holding?.kind === e.kind }"
                :aria-label="`${e.name} 효과, 누르고 있는 동안 적용`"
                @pointerdown="holdStart(e.kind, $event)"
                @pointerup="holdEnd"
                @pointercancel="holdEnd"
                @pointerleave="holding ? holdEnd() : null"
                @keydown="fxKeyDown(e.kind, $event)"
                @keyup="fxKeyUp"
                @contextmenu.prevent
              >
                <span class="vf-fxdot" :style="{ '--c': e.color }"><img :src="thumb" alt="" /></span>
                <em>{{ e.name }}</em>
              </button>
            </div>
            <button v-if="st.effects.length" type="button" class="vf-undo" @click="undoFx"><Ico :src="VI.undo" />되돌리기</button>
          </template>
          <template v-else>
            <p class="vf-fxhint">반복 · 슬로모션은 지금 위치에서 1초 동안 들어가요</p>
            <div class="vf-fxbtns" role="radiogroup" aria-label="시간 효과">
              <button v-for="t in TIME_FX" :key="t.kind" type="button" role="radio" :aria-checked="st.timeFx.kind === t.kind" :class="{ 'is-on': st.timeFx.kind === t.kind }" @click="setTimeFx(t.kind)">
                <span class="vf-fxdot" :style="{ '--c': '#306BD9' }"><img :src="thumb" alt="" /></span>
                <em>{{ t.name }}</em>
              </button>
            </div>
          </template>
        </div>
        <nav class="vf-fxtabs">
          <button type="button" :class="{ 'is-on': fxTab === 'fx' }" :aria-pressed="fxTab === 'fx'" @click="fxTab = 'fx'">필터 효과</button>
          <i aria-hidden="true" />
          <button type="button" :class="{ 'is-on': fxTab === 'time' }" :aria-pressed="fxTab === 'time'" @click="fxTab = 'time'">시간 효과</button>
        </nav>
      </template>
    </section>

    <!-- 아래 도구 줄 -->
    <nav v-if="!full && panel !== 'filter' && panel !== 'volume'" class="vf-tools" aria-label="편집 도구">
      <button type="button" aria-pressed="false" @click="open('filter')"><Ico :src="VI.filter" /><span>필터</span></button>
      <button type="button" @click="open('effect')"><Ico :src="VI.effect" /><span>효과</span></button>
      <button type="button" :aria-pressed="!!st.plate" :class="{ 'is-on': !!st.plate }" :disabled="scan.on" @click="togglePlate"><Ico :src="VI.plate" /><span>번호판 가리기</span></button>
      <button type="button" aria-pressed="false" @click="open('volume')"><Ico :src="VI.volume" /><span>음량</span></button>
    </nav>
    <div v-if="capInput.open" class="vf-capin" role="dialog" aria-modal="true" aria-label="자막 입력">
      <input ref="capBox" v-model="capInput.text" type="text" maxlength="40" placeholder="자막을 입력하세요" @keydown.enter="okCapInput" />
      <div class="vf-capin__btns">
        <button type="button" class="vf-capin__x" aria-label="취소" @click="capInput.open = false"><Ico :src="VI.close" /></button>
        <button type="button" class="vf-capin__ok" aria-label="확인" @click="okCapInput"><Ico :src="VI.check" /></button>
      </div>
    </div>
    <p v-if="toast" class="vf-toast" role="status">{{ toast }}</p>
  </div>
</template>
