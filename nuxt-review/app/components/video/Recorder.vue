<script setup lang="ts">
// 촬영 화면(동처띠 拍摄): 오른쪽 세로 줄 전환 · 속도 · 필터 · 타이머 · 마이크, 아래 소품 · 녹화 버튼 · 업로드,
// 맨 아래 모드 탭 앨범 · 탭해서 촬영 · 길게 눌러 촬영. 최대 60초, 위쪽 진행 막대.
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import Ico from "../Ico.vue";
import { VI } from "../../lib/video-icons";
import { FILTERS, pickMime } from "./render";
import { KINDS, type Kind } from "../../lib/route";
import { KIND_LABEL } from "../../lib/publish";
import { IC } from "../../lib/icons";

// kind: 글쓰기 키트의 「영상」 탭에서 열 때만 넘긴다. 원본처럼 머리에 「영상 ⇄」(처음엔 글 종류 탭 줄)을 보여 준다.
const props = defineProps<{ kind?: Kind }>();
const emit = defineEmits<{ recorded: [blob: Blob, rate: number, filter: string]; album: []; close: []; kind: [Kind] }>();
const kinds = ref(Boolean(props.kind));

const MAX = 60;
const live = ref<HTMLVideoElement | null>(null);
const facing = ref<"environment" | "user">("environment");
const mic = ref(true);
const speed = ref(1);
const timer = ref(0);
const filter = ref("normal");
const mode = ref<"tap" | "hold">("hold");
const panel = ref<"" | "speed" | "filter" | "timer">("");
const err = ref("");
const recording = ref(false);
const elapsed = ref(0);
const count = ref(0);
const toast = ref("");
let stream: MediaStream | null = null;
let rec: MediaRecorder | null = null;
let chunks: Blob[] = [];
let t0 = 0;
let raf = 0;
let cd = 0;

async function open() {
  stream?.getTracks().forEach((t) => t.stop());
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing.value, width: { ideal: 1080 }, height: { ideal: 1920 } }, audio: mic.value });
    err.value = "";
    if (live.value) { live.value.srcObject = stream; await live.value.play().catch(() => {}); }
  } catch {
    err.value = "카메라 사용을 허용해 주세요";
  }
}
onMounted(open);
onBeforeUnmount(() => { stopRec(true); stream?.getTracks().forEach((t) => t.stop()); clearInterval(cd); });

const say = (m: string) => { toast.value = m; setTimeout(() => (toast.value = ""), 1600); };
const flip = () => { facing.value = facing.value === "user" ? "environment" : "user"; open(); };
const toggleMic = () => { mic.value = !mic.value; say(mic.value ? "마이크를 켰어요" : "마이크를 껐어요"); open(); };
const filterCssLive = computed(() => FILTERS.find((f) => f.id === filter.value)?.css || "none");

function startRec() {
  if (!stream || recording.value) return;
  const mime = pickMime();
  if (!mime) { say("이 브라우저는 촬영을 지원하지 않아요"); return; }
  chunks = [];
  rec = new MediaRecorder(stream, { mimeType: mime });
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.onstop = () => {
    const blob = new Blob(chunks, { type: mime.split(";")[0] });
    if (blob.size && elapsed.value >= 0.5) emit("recorded", blob, speed.value, filter.value);
    else if (blob.size) say("조금 더 길게 찍어 주세요");
  };
  rec.start(200);
  recording.value = true;
  panel.value = "";
  t0 = performance.now();
  const tick = () => {
    elapsed.value = (performance.now() - t0) / 1000;
    if (elapsed.value >= MAX) { stopRec(); return; }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}
function stopRec(silent = false) {
  cancelAnimationFrame(raf);
  if (!recording.value) return;
  recording.value = false;
  if (silent && rec) rec.onstop = null;
  if (rec && rec.state !== "inactive") rec.stop();
}
function withTimer(go: () => void) {
  if (!timer.value) return go();
  count.value = timer.value;
  cd = window.setInterval(() => {
    count.value--;
    if (count.value <= 0) { clearInterval(cd); go(); }
  }, 1000);
}
// 탭해서 촬영: 누를 때마다 시작/멈춤, 길게 눌러 촬영: 누르는 동안만(타이머가 있으면 탭처럼)
const onDown = () => {
  if (count.value > 0) return;
  if (mode.value === "hold" && !timer.value) startRec();
};
const onUp = () => {
  if (mode.value === "hold" && !timer.value) { stopRec(); return; }
};
const onClick = () => {
  if (count.value > 0) { clearInterval(cd); count.value = 0; return; }
  if (mode.value === "tap" || timer.value) recording.value ? stopRec() : withTimer(startRec);
};
const tabs = [
  { id: "album", name: "앨범" },
  { id: "tap", name: "탭해서 촬영" },
  { id: "hold", name: "길게 눌러 촬영" },
] as const;
const setTab = (id: string) => {
  if (recording.value) return;
  if (id === "album") emit("album");
  else mode.value = id as "tap" | "hold";
};
defineExpose({
  esc: () => {
    if (panel.value) { panel.value = ""; return true; }
    if (count.value) { clearInterval(cd); count.value = 0; return true; }
    if (recording.value) { stopRec(true); return true; }
    return false;
  },
});
</script>

<template>
  <div class="vf-rec">
    <video ref="live" class="vf-rec__live" :class="{ 'is-front': facing === 'user' }" :style="{ filter: filterCssLive }" muted playsinline autoplay />
    <p v-if="err" class="vf-rec__err">{{ err }}</p>
    <div class="vf-rec__bar" aria-hidden="true"><i :style="{ width: `${(elapsed / MAX) * 100}%` }" /></div>
    <header class="vf-rec__top">
      <button class="vf-ibtn" type="button" aria-label="닫기" @click="emit('close')"><Ico :src="VI.close" /></button>
      <nav v-if="kind && kinds && !recording" class="vf-rec__kinds" aria-label="글 종류">
        <button v-for="k in KINDS" :key="k" type="button" :class="{ on: k === kind }" :aria-current="k === kind ? 'page' : undefined" @click="k === kind ? (kinds = false) : emit('kind', k)">{{ KIND_LABEL[k] }}</button>
      </nav>
      <template v-else-if="kind"><strong class="vf-rec__title">{{ KIND_LABEL[kind] }}</strong><button v-show="!recording" class="vf-rec__sw" type="button" aria-label="글 종류 바꾸기" @click="kinds = true"><Ico :src="IC.switch" /></button></template>
      <strong v-else>동영상</strong>
      <span v-if="recording" class="vf-rec__time" role="status">{{ elapsed.toFixed(1) }}초</span>
    </header>

    <nav v-show="!recording && !(kind && kinds)" class="vf-rec__side" aria-label="촬영 설정">
      <button type="button" aria-label="카메라 전환" @click="flip"><Ico :src="VI.flip" /><span>전환</span></button>
      <button type="button" :aria-pressed="panel === 'speed'" @click="panel = panel === 'speed' ? '' : 'speed'"><Ico :src="VI.speed" /><span>속도</span></button>
      <button type="button" :aria-pressed="panel === 'filter'" @click="panel = panel === 'filter' ? '' : 'filter'"><Ico :src="VI.filter" /><span>필터</span></button>
      <button type="button" :aria-pressed="panel === 'timer'" @click="panel = panel === 'timer' ? '' : 'timer'"><Ico :src="VI.timer" /><span>{{ timer ? `${timer}초` : "타이머" }}</span></button>
      <button type="button" :aria-pressed="mic" @click="toggleMic"><Ico :src="VI.mic" /><span :class="{ 'is-off': !mic }">{{ mic ? "마이크" : "마이크 끔" }}</span></button>
    </nav>

    <div v-if="panel === 'speed'" class="vf-seg vf-rec__panel" role="radiogroup" aria-label="촬영 속도">
      <button v-for="s in [0.5, 1, 2]" :key="s" type="button" role="radio" :aria-checked="speed === s" :class="{ 'is-on': speed === s }" @click="speed = s">{{ s === 0.5 ? "느리게" : s === 1 ? "보통" : "빠르게" }}</button>
    </div>
    <div v-if="panel === 'timer'" class="vf-seg vf-rec__panel" role="radiogroup" aria-label="타이머">
      <button v-for="s in [0, 3, 10]" :key="s" type="button" role="radio" :aria-checked="timer === s" :class="{ 'is-on': timer === s }" @click="timer = s">{{ s ? `${s}초` : "끄기" }}</button>
    </div>
    <div v-if="panel === 'filter'" class="vf-rec__filters vf-rec__panel" role="radiogroup" aria-label="필터">
      <button v-for="f in FILTERS" :key="f.id" type="button" role="radio" :aria-checked="filter === f.id" :class="{ 'is-on': filter === f.id }" @click="filter = f.id">
        <i :style="{ filter: f.css }" /><span>{{ f.name }}</span>
      </button>
    </div>

    <div v-if="count > 0" class="vf-rec__count" role="status">{{ count }}</div>

    <div class="vf-rec__dock">
      <button v-show="!recording" class="vf-rec__aux" type="button" @click="say('소품은 준비 중이에요')"><Ico :src="VI.prop" /><span>소품</span></button>
      <button
        class="vf-recbtn"
        :class="{ 'is-rec': recording, 'is-tap': mode === 'tap' || timer > 0 }"
        type="button"
        :aria-label="recording ? '촬영 멈추기' : mode === 'hold' && !timer ? '길게 눌러 촬영' : '촬영 시작'"
        @pointerdown="onDown"
        @pointerup="onUp"
        @pointercancel="onUp"
        @pointerleave="recording && mode === 'hold' && !timer ? onUp() : null"
        @click="onClick"
        @contextmenu.prevent
      ><i /></button>
      <button v-show="!recording" class="vf-rec__aux" type="button" @click="emit('album')"><Ico :src="VI.upload" /><span>업로드</span></button>
    </div>
    <nav class="vf-rec__modes" aria-label="촬영 방식">
      <button v-for="t in tabs" :key="t.id" type="button" :class="{ 'is-on': t.id === mode }" :aria-current="t.id === mode" @click="setTab(t.id)">{{ t.name }}</button>
    </nav>
    <p v-if="toast" class="vf-toast" role="status">{{ toast }}</p>
  </div>
</template>
