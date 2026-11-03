<script setup lang="ts">
// 동영상 올리기 흐름(동처띠 视频发布 재현): 고르기(앨범 · 카메라) → 촬영 → 동영상 편집(구간 · 속도) → 효과 편집 → 만들기.
// 결과는 done 이벤트로 { blob, url, cover, duration, width, height }를 넘긴다. 서버 없이 브라우저 안에서 만든다.
import { onBeforeUnmount, onMounted, reactive, ref, shallowRef } from "vue";
import "../assets/css/video-editor.css";
import Picker from "./video/Picker.vue";
import Recorder from "./video/Recorder.vue";
import TrimEditor from "./video/TrimEditor.vue";
import EffectsEditor from "./video/EffectsEditor.vue";
import { Seq, exportVideo, makeClip, makePlan, type Clip, type EditState, type ExportResult } from "./video/render";

const props = withDefaults(defineProps<{ start?: "album" | "camera" }>(), { start: "album" });
const emit = defineEmits<{ done: [ExportResult]; close: [] }>();

const MAX_CLIPS = 9;
type Step = "pick" | "record" | "trim" | "fx";
const step = ref<Step>(props.start === "camera" ? "record" : "pick");
const clips = ref<Clip[]>([]);
const selected = ref<string[]>([]);
const loading = ref(0);
const seq = shallowRef<Seq | null>(null);
const a = ref(0);
const b = ref(0);
const speed = ref(1);
const busy = ref(false);
const progress = ref(0);
const error = ref("");
const exporting = ref(false);
const child = ref<{ esc: () => boolean } | null>(null);
let abort: AbortController | null = null;

const freshState = (): EditState => ({ filter: "normal", effects: [], timeFx: { kind: "none", at: 0 }, plate: null, captions: [], volume: 1, cover: { t: 0, title: "" } });
const st = reactive<EditState>(freshState());

async function addFiles(files: File[]) {
  loading.value += files.length;
  for (const f of files) {
    try {
      const c = await makeClip(f, f.name);
      clips.value.unshift(c);
      if (selected.value.length < MAX_CLIPS) selected.value.push(c.id);
    } catch { flash("읽을 수 없는 영상이 있어요"); }
    loading.value--;
  }
}
function toggle(id: string) {
  const i = selected.value.indexOf(id);
  if (i >= 0) selected.value.splice(i, 1);
  else if (selected.value.length < MAX_CLIPS) selected.value.push(id);
  else flash(`최대 ${MAX_CLIPS}개까지 고를 수 있어요`);
}
async function onRecorded(blob: Blob, rate: number, filter: string) {
  step.value = "pick";
  loading.value++;
  try {
    const c = await makeClip(blob, `촬영 ${new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`, rate, filter);
    clips.value.unshift(c);
    selected.value = [c.id];
    await toTrim();
  } catch { flash("촬영한 영상을 읽지 못했어요"); }
  loading.value--;
}
async function toTrim() {
  const list = selected.value.map((id) => clips.value.find((c) => c.id === id)).filter(Boolean) as Clip[];
  if (!list.length) return;
  seq.value?.dispose();
  busy.value = true;
  try {
    seq.value = await new Seq(list).load();
  } catch { flash("영상을 열지 못했어요"); busy.value = false; return; }
  busy.value = false;
  a.value = 0;
  b.value = Math.min(seq.value.total, 60);
  speed.value = 1;
  Object.assign(st, freshState());
  // 촬영 때 고른 필터는 효과 편집의 처음 필터로
  const f = list[0]?.filter;
  if (f && f !== "normal") st.filter = f;
  step.value = "trim";
}

async function doExport() {
  if (!seq.value) return;
  abort = new AbortController();
  busy.value = true;
  exporting.value = true;
  progress.value = 0;
  try {
    const res = await exportVideo({
      seq: seq.value,
      plan: makePlan(a.value, b.value, speed.value, st.timeFx),
      look: { filter: st.filter, effects: st.effects, plate: st.plate, captions: st.captions },
      volume: st.volume,
      cover: st.cover,
      onProgress: (p) => (progress.value = p),
      signal: abort.signal,
    });
    busy.value = false;
    emit("done", res);
  } catch (e) {
    busy.value = false;
    if ((e as Error).name !== "AbortError") flash((e as Error).message || "영상을 만들지 못했어요");
  }
  abort = null;
  exporting.value = false;
}
const cancelExport = () => abort?.abort();

let flashTimer = 0;
function flash(m: string) {
  error.value = m;
  clearTimeout(flashTimer);
  flashTimer = window.setTimeout(() => (error.value = ""), 2000);
}

function back() {
  if (step.value === "fx") step.value = "trim";
  else if (step.value === "trim") step.value = "pick";
  else if (step.value === "record") step.value = "pick";
  else emit("close");
}
// Esc: 맨 위 패널부터 닫는다
function onKey(e: KeyboardEvent) {
  if (e.key !== "Escape") return;
  e.preventDefault();
  if (busy.value) { if (exporting.value) cancelExport(); return; }
  if (child.value?.esc()) return;
  back();
}
onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  abort?.abort();
  seq.value?.dispose();
  clips.value.forEach((c) => URL.revokeObjectURL(c.url));
});
</script>

<template>
  <div class="vf" role="dialog" aria-modal="true" aria-label="동영상 올리기">
    <Picker
      v-if="step === 'pick'"
      ref="child"
      :clips="clips"
      :selected="selected"
      :loading="loading"
      :max="MAX_CLIPS"
      @add="addFiles"
      @toggle="toggle"
      @next="toTrim"
      @record="step = 'record'"
      @close="emit('close')"
    />
    <Recorder v-else-if="step === 'record'" ref="child" @recorded="onRecorded" @album="step = 'pick'" @close="emit('close')" />
    <TrimEditor
      v-else-if="step === 'trim' && seq"
      ref="child"
      v-model:a="a"
      v-model:b="b"
      v-model:speed="speed"
      :seq="seq"
      @back="step = 'pick'"
      @next="step = 'fx'"
    />
    <EffectsEditor
      v-else-if="step === 'fx' && seq"
      ref="child"
      :seq="seq"
      :a="a"
      :b="b"
      :speed="speed"
      :st="st"
      :thumb="seq.clips[0]?.thumb || ''"
      @back="step = 'trim'"
      @next="doExport"
    />

    <div v-if="busy" class="vf-busy" role="alertdialog" aria-label="영상 만드는 중">
      <div class="vf-busy__box">
        <span class="vf-ring" :style="{ '--p': `${Math.round(progress * 100)}%` }" />
        <p v-if="exporting">영상 만드는 중 {{ Math.round(progress * 100) }}%</p>
        <p v-else>영상을 여는 중…</p>
        <button v-if="exporting" type="button" class="vf-busy__cancel" @click="cancelExport">취소</button>
      </div>
    </div>
    <p v-if="error" class="vf-toast is-err" role="alert">{{ error }}</p>
  </div>
</template>
