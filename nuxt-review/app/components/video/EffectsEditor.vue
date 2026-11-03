<script setup lang="ts">
// 효과 편집(동처띠 编辑): 오른쪽 세로 자막 · 표지, 아래 필터 · 효과 · 번호판 가리기 · 음량, 위 뒤로 + 다음.
// 효과 화면은 취소/저장, 타임라인 위치를 고른 뒤 효과 버튼을 누르고 있는 동안 그 구간에 효과가 들어간다.
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import Ico from "../Ico.vue";
import { VI } from "../../lib/video-icons";
import { drag, useFit } from "./fit";
import {
  EFFECTS, FILTERS, FILTER_TABS, TIME_FX, Player, fxColor, makePlan, mmss, previewSize, uid,
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
onBeforeUnmount(() => player?.destroy());
watch(plan, (p) => { player?.setPlan(p); if (!player?.playing) player?.seek(Math.min(u.value, dur.value)); });
// 멈춘 상태에서 필터 · 자막 · 번호판을 바꾸면 화면을 다시 그린다
watch(() => [st.filter, st.plate && { ...st.plate }, st.captions.map((c) => ({ ...c })), st.effects.length], () => { if (!player?.playing) player?.render(); }, { deep: true });
watch(() => st.volume, (v) => { if (player) player.volume = v; });

const play = () => { player?.play(); playing.value = true; };
const pause = () => { player?.pause(); playing.value = false; };
const toggle = () => (playing.value ? pause() : play());
const say = (m: string) => { toast.value = m; setTimeout(() => (toast.value = ""), 1600); };

// 패널 열기: 효과 · 표지는 취소/저장이 있어 들어갈 때 상태를 기억한다
function open(p: Panel) {
  if (p === "effect" || p === "cover") {
    snapshot = JSON.stringify({ effects: st.effects, timeFx: st.timeFx, cover: st.cover });
    pause();
    if (p === "cover") player?.seek(Math.min(st.cover.t, dur.value));
  }
  panel.value = panel.value === p ? "" : p;
}
function cancelFull() {
  const s = JSON.parse(snapshot || "{}");
  if (s.effects) { st.effects.splice(0, st.effects.length, ...s.effects); st.timeFx = s.timeFx; st.cover = s.cover; }
  panel.value = "";
  play();
}
function saveFull() {
  if (panel.value === "cover") st.cover.t = u.value;
  panel.value = "";
  play();
}

/* 번호판 가리기 */
function togglePlate() {
  if (st.plate) { st.plate = null; say("번호판 가리기를 껐어요"); }
  else { st.plate = { x: 0.34, y: 0.62, w: 0.32, h: 0.075, style: "blur" }; say("상자를 번호판 위로 끌어 옮겨 주세요"); }
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

/* 자막 */
const capText = ref("");
const capBox = ref<HTMLInputElement | null>(null);
function addCaption() {
  const t = capText.value.trim();
  if (!t) { capBox.value?.focus(); return; }
  st.captions.push({ id: uid(), text: t, start: Math.min(u.value, Math.max(0, dur.value - 0.5)), end: Math.min(dur.value, u.value + 2.5), x: 0.5, y: 0.8 });
  capText.value = "";
  player?.render();
}
const delCaption = (id: string) => { const i = st.captions.findIndex((c) => c.id === id); if (i >= 0) st.captions.splice(i, 1); player?.render(); };
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
    if (holding.value) { holdEnd(); return true; }
    if (panel.value === "effect" || panel.value === "cover") { cancelFull(); return true; }
    if (panel.value) { panel.value = ""; return true; }
    return false;
  },
});
const full = computed(() => panel.value === "effect" || panel.value === "cover");
</script>

<template>
  <div class="vf-fx" :class="{ 'is-full': full }">
    <header class="vf-head">
      <template v-if="!full">
        <button class="vf-ibtn" type="button" aria-label="뒤로" @click="emit('back')"><Ico :src="VI.back" /></button>
        <h2 class="vf-hide-t">효과 편집</h2>
        <button class="vf-next" type="button" @click="pause(); emit('next')">다음</button>
      </template>
      <template v-else>
        <button class="vf-cancel" type="button" @click="cancelFull">취소</button>
        <h2>{{ panel === "effect" ? "효과" : "표지" }}</h2>
        <button class="vf-next" type="button" @click="saveFull">저장</button>
      </template>
    </header>

    <div ref="stage" class="vf-stage" @click.self="toggle">
      <div class="vf-frame" :style="{ width: `${box.w}px`, height: `${box.h}px` }" @click.self="toggle">
        <canvas ref="canvas" class="vf-canvas" @click="toggle" />
        <span v-if="!playing && panel !== 'cover'" class="vf-play" aria-hidden="true"><Ico :src="VI.play" /></span>
        <!-- 번호판 상자 -->
        <div
          v-if="st.plate && !full"
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
        <p v-if="panel === 'cover' && st.cover.title" class="vf-covertitle">{{ st.cover.title }}</p>
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
      <label>
        <span>원본 소리</span>
        <input v-model.number="st.volume" type="range" min="0" max="1" step="0.01" :style="{ '--p': `${st.volume * 100}%` }" />
        <b>{{ Math.round(st.volume * 100) }}%</b>
      </label>
    </section>

    <!-- 자막 -->
    <section v-if="panel === 'caption'" class="vf-pane vf-caps" aria-label="자막">
      <div class="vf-caps__add">
        <input ref="capBox" v-model="capText" type="text" maxlength="40" placeholder="자막을 입력하세요" @keydown.enter="addCaption" />
        <button type="button" class="vf-next" @click="addCaption">추가</button>
      </div>
      <p class="vf-caps__hint">지금 위치({{ mmss(u) }})부터 2.5초 동안 나와요 · 화면의 자막을 끌어 옮길 수 있어요</p>
      <ul>
        <li v-for="c in st.captions" :key="c.id">
          <input v-model="c.text" type="text" maxlength="40" aria-label="자막 문구" />
          <div class="vf-caps__time">
            <label>시작 <input type="range" min="0" :max="dur" step="0.1" :value="c.start" @input="setCapTime(c, 'start', +($event.target as HTMLInputElement).value)" /> {{ c.start.toFixed(1) }}s</label>
            <label>끝 <input type="range" min="0" :max="dur" step="0.1" :value="c.end" @input="setCapTime(c, 'end', +($event.target as HTMLInputElement).value)" /> {{ c.end.toFixed(1) }}s</label>
          </div>
          <button type="button" class="vf-ibtn" aria-label="자막 지우기" @click="delCaption(c.id)"><Ico :src="VI.del" /></button>
        </li>
      </ul>
    </section>

    <!-- 효과 · 표지 아래 판 -->
    <section v-if="full" class="vf-fullpane">
      <div class="vf-tl">
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
      <template v-else>
        <div class="vf-coverbody">
          <p class="vf-fxhint">막대를 끌어 표지로 쓸 장면을 고르세요</p>
          <input v-model="st.cover.title" class="vf-covertext" type="text" maxlength="24" placeholder="표지 제목 (선택)" aria-label="표지 제목" />
        </div>
      </template>
    </section>

    <!-- 아래 도구 줄 -->
    <nav v-if="!full" class="vf-tools" aria-label="편집 도구">
      <button type="button" :aria-pressed="panel === 'filter'" @click="open('filter')"><Ico :src="VI.filter" /><span>필터</span></button>
      <button type="button" @click="open('effect')"><Ico :src="VI.effect" /><span>효과</span></button>
      <button type="button" :aria-pressed="!!st.plate" :class="{ 'is-on': !!st.plate }" @click="togglePlate"><Ico :src="VI.plate" /><span>번호판 가리기</span></button>
      <button type="button" :aria-pressed="panel === 'volume'" @click="open('volume')"><Ico :src="VI.volume" /><span>음량</span></button>
    </nav>
    <p v-if="toast" class="vf-toast" role="status">{{ toast }}</p>
  </div>
</template>
