<script setup lang="ts">
// 「동영상 편집」(동처띠 视频编辑): 위 미리보기(고른 구간 반복 재생), 아래 「선택 28.7s」 + 속도 아이콘,
// 필름 스트립의 왼쪽·오른쪽 손잡이로 구간(1~60초)을 고른다. 속도 아이콘을 누르면 느리게 · 보통 · 빠르게.
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import Ico from "../Ico.vue";
import { VI } from "../../lib/video-icons";
import { drag, useFit } from "./fit";
import { Player, makePlan, previewSize, stripFrames, type Look, type Seq } from "./render";

const props = defineProps<{ seq: Seq; a: number; b: number; speed: number }>();
const emit = defineEmits<{ "update:a": [v: number]; "update:b": [v: number]; "update:speed": [v: number]; next: []; back: [] }>();

const MIN = 1, MAX = 60;
const stage = ref<HTMLElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const strip = ref<HTMLElement | null>(null);
const frames = ref<string[]>([]);
const u = ref(0);
const playing = ref(false);
const showSpeed = ref(false);
const size = previewSize(props.seq);
const { box } = useFit(stage, () => size.w / size.h);
const total = props.seq.total;
const look: Look = { filter: "normal", effects: [], plate: null, captions: [] };
let player: Player | null = null;

const sel = computed(() => props.b - props.a);
const outSel = computed(() => sel.value / props.speed);
// 재생 위치(원본 시각) → 스트립 %
const headPct = computed(() => ((props.a + u.value * props.speed) / total) * 100);

const replan = () => {
  if (!player) return;
  player.setPlan(makePlan(props.a, props.b, props.speed, { kind: "none", at: 0 }));
};
onMounted(async () => {
  if (!canvas.value) return;
  canvas.value.width = size.w;
  canvas.value.height = size.h;
  player = new Player(props.seq, canvas.value, () => look);
  player.onTime = (t) => (u.value = t);
  replan();
  await player.seek(0);
  player.play();
  playing.value = true;
  frames.value = await stripFrames(props.seq.clips, Math.min(12, Math.max(6, Math.round(total / 3))));
});
onBeforeUnmount(() => player?.destroy());
watch(() => props.speed, () => { replan(); player?.seek(0).then(() => { player?.play(); playing.value = true; }); });

const toggle = () => { player?.toggle(); playing.value = !!player?.playing; };

// 손잡이 끌기: 끄는 동안 멈추고 그 손잡이 화면을 보여 준다
function handle(e: PointerEvent, side: "a" | "b") {
  if (!strip.value) return;
  const w = strip.value.clientWidth;
  const startA = props.a, startB = props.b;
  player?.pause();
  playing.value = false;
  drag(e, (dx) => {
    const dt = (dx / w) * total;
    if (side === "a") {
      const na = Math.max(0, Math.min(startA + dt, startB - MIN));
      emit("update:a", Math.max(na, startB - MAX));
    } else {
      const nb = Math.min(total, Math.max(startB + dt, startA + MIN));
      emit("update:b", Math.min(nb, startA + MAX));
    }
  }, async () => {
    replan();
    await player?.seek(0);
    player?.play();
    playing.value = true;
  });
}
watch(() => [props.a, props.b], () => {
  if (!player || player.playing) return;
  replan();
  // 끄는 중: 왼쪽은 시작 화면, 오른쪽은 끝 화면
  player.seek(0);
});
// 스트립을 누르면 그 위치로(구간 안)
function tapStrip(e: MouseEvent) {
  if (!strip.value || !player) return;
  const r = strip.value.getBoundingClientRect();
  const s = ((e.clientX - r.left) / r.width) * total;
  if (s < props.a || s > props.b) return;
  player.seek((s - props.a) / props.speed);
}
const keyHandle = (e: KeyboardEvent, side: "a" | "b") => {
  const d = e.key === "ArrowLeft" ? -0.5 : e.key === "ArrowRight" ? 0.5 : 0;
  if (!d) return;
  e.preventDefault();
  if (side === "a") emit("update:a", Math.max(0, Math.max(props.b - MAX, Math.min(props.a + d, props.b - MIN))));
  else emit("update:b", Math.min(total, Math.min(props.a + MAX, Math.max(props.b + d, props.a + MIN))));
  setTimeout(() => { replan(); player?.seek(0).then(() => player?.play()); playing.value = true; });
};
const speeds = [
  { v: 0.5, n: "느리게" },
  { v: 1, n: "보통" },
  { v: 2, n: "빠르게" },
];
defineExpose({ esc: () => { if (showSpeed.value) { showSpeed.value = false; return true; } return false; } });
</script>

<template>
  <div class="vf-edit">
    <header class="vf-head">
      <button class="vf-ibtn" type="button" aria-label="뒤로" @click="emit('back')"><Ico :src="VI.back" /></button>
      <h2>동영상 편집</h2>
      <button class="vf-next" type="button" @click="player?.pause(); emit('next')">다음</button>
    </header>
    <div ref="stage" class="vf-stage" @click="toggle">
      <div class="vf-frame" :style="{ width: `${box.w}px`, height: `${box.h}px` }">
        <canvas ref="canvas" class="vf-canvas" />
        <span v-if="!playing" class="vf-play" aria-hidden="true"><Ico :src="VI.play" /></span>
      </div>
    </div>
    <section class="vf-trim">
      <div v-if="showSpeed" class="vf-seg vf-trim__speed" role="radiogroup" aria-label="재생 속도">
        <button v-for="s in speeds" :key="s.v" type="button" role="radio" :aria-checked="speed === s.v" :class="{ 'is-on': speed === s.v }" @click="emit('update:speed', s.v)">{{ s.n }}</button>
      </div>
      <div class="vf-trim__row">
        <p>선택 <b>{{ outSel.toFixed(1) }}s</b></p>
        <button class="vf-speedbtn" type="button" :aria-pressed="showSpeed" aria-label="속도 조절" @click="showSpeed = !showSpeed">
          <Ico :src="VI.speed" /><em>{{ speed === 1 ? "OFF" : `${speed}x` }}</em>
        </button>
      </div>
      <div ref="strip" class="vf-strip" @click="tapStrip">
        <div class="vf-strip__frames">
          <img v-for="(f, i) in frames" :key="i" :src="f" alt="" />
        </div>
        <i class="vf-strip__dim" :style="{ left: 0, width: `${(a / total) * 100}%` }" />
        <i class="vf-strip__dim" :style="{ left: `${(b / total) * 100}%`, right: 0 }" />
        <div class="vf-strip__win" :style="{ left: `${(a / total) * 100}%`, width: `${(sel / total) * 100}%` }">
          <button class="vf-strip__h is-l" type="button" role="slider" aria-label="시작 위치" :aria-valuenow="Math.round(a * 10) / 10" :aria-valuemin="0" :aria-valuemax="total" @pointerdown.stop="handle($event, 'a')" @click.stop @keydown="keyHandle($event, 'a')"><i /></button>
          <button class="vf-strip__h is-r" type="button" role="slider" aria-label="끝 위치" :aria-valuenow="Math.round(b * 10) / 10" :aria-valuemin="0" :aria-valuemax="total" @pointerdown.stop="handle($event, 'b')" @click.stop @keydown="keyHandle($event, 'b')"><i /></button>
        </div>
        <i class="vf-strip__head" :style="{ left: `${headPct}%` }" />
      </div>
      <p class="vf-trim__hint">손잡이를 끌어 1~60초 구간을 고르세요</p>
    </section>
  </div>
</template>
