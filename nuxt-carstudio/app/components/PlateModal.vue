<script setup lang="ts">
// 번호판 창(Car Studio 머리의 번호판 · 연필 단추): 가리는 방법을 고르고, 사진 위 노란 칸을 끌어 번호판 자리에 맞춘다.
// 자동 인식은 아직 없어 차 아래쪽 가운데를 먼저 짐작해 둔다. 칸 모서리 동그라미로 크기를 바꾼다.
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import Modal from "./Modal.vue";
import PlateIllu from "./PlateIllu.vue";
import type { Photo, PlateMode, Project, Rect } from "../lib/store";
import { readPlates } from "../lib/store";
import { guessPlate } from "../lib/process";

const props = defineProps<{ project: Project; photo: Photo }>();
const emit = defineEmits<{ close: []; apply: [v: { plateMode: PlateMode; customPlate: string; rect: Rect | null; all: boolean }] }>();
const mode = ref<PlateMode>(props.project.plateMode);
const plates = readPlates();
const custom = ref(props.project.customPlate || (plates[0] ? `${plates[0].text}|${plates[0].color}` : "보배드림|#FFFFFF"));
const rect = reactive<Rect>(props.photo.plate ? { ...props.photo.plate } : props.photo.box ? guessPlate(props.photo.box, props.photo.w, props.photo.h) : { x: 0.42, y: 0.7, w: 0.16, h: 0.045 });
const url = URL.createObjectURL(props.photo.original);
onBeforeUnmount(() => URL.revokeObjectURL(url));
const imgBox = ref<HTMLElement | null>(null);
const size = reactive({ w: 0, h: 0 });
function measure() {
  const r = imgBox.value?.getBoundingClientRect();
  if (r) Object.assign(size, { w: r.width, h: r.height });
}
onMounted(() => window.setTimeout(measure, 30));
let drag: { kind: "move" | "size"; x: number; y: number; r: Rect } | null = null;
function down(e: PointerEvent, kind: "move" | "size") {
  e.preventDefault();
  e.stopPropagation();
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  drag = { kind, x: e.clientX, y: e.clientY, r: { ...rect } };
}
function move(e: PointerEvent) {
  if (!drag || !size.w) return;
  const dx = (e.clientX - drag.x) / size.w;
  const dy = (e.clientY - drag.y) / size.h;
  if (drag.kind === "move") {
    rect.x = Math.min(1 - rect.w, Math.max(0, drag.r.x + dx));
    rect.y = Math.min(1 - rect.h, Math.max(0, drag.r.y + dy));
  } else {
    rect.w = Math.min(1 - rect.x, Math.max(0.03, drag.r.w + dx));
    rect.h = Math.min(1 - rect.y, Math.max(0.015, drag.r.h + dy));
  }
}
function key(e: KeyboardEvent) {
  const s = e.shiftKey ? 0.02 : 0.005;
  const m: Record<string, () => void> = { ArrowLeft: () => (rect.x -= s), ArrowRight: () => (rect.x += s), ArrowUp: () => (rect.y -= s), ArrowDown: () => (rect.y += s) };
  if (m[e.key]) {
    e.preventDefault();
    m[e.key]();
  }
}
const style = computed(() => ({ left: `${rect.x * 100}%`, top: `${rect.y * 100}%`, width: `${rect.w * 100}%`, height: `${rect.h * 100}%` }));
function apply() {
  emit("apply", { plateMode: mode.value, customPlate: mode.value === "custom" ? custom.value : props.project.customPlate, rect: { ...rect }, all: false });
}
const OPTS: { id: PlateMode; label: string }[] = [
  { id: "keep", label: "그대로" },
  { id: "blur", label: "흐리게" },
  { id: "white", label: "흰 판" },
  { id: "custom", label: "내 번호판" },
];
</script>
<template>
  <Modal title="번호판" wide @close="emit('close')">
    <div class="chips" role="radiogroup" aria-label="번호판 처리">
      <button v-for="o in OPTS" :key="o.id" class="chip" :class="{ 'is-on': mode === o.id }" type="button" role="radio" :aria-checked="mode === o.id" @click="mode = o.id">{{ o.label }}</button>
    </div>
    <div v-if="mode === 'custom'" class="plates">
      <button v-for="p in plates" :key="p.id" class="plate-chip" :class="{ 'is-on': custom === `${p.text}|${p.color}` }" type="button" :style="{ background: p.color }" @click="custom = `${p.text}|${p.color}`">{{ p.text }}</button>
      <span v-if="!plates.length" style="font-size: 13px; color: var(--sub)">저장한 번호판이 없어 「보배드림」 흰 판을 써요. 새 판은 새 프로젝트를 만들 때 추가할 수 있어요.</span>
    </div>
    <div v-if="mode === 'keep'" class="illu"><PlateIllu mode="keep" /></div>
    <template v-else>
      <p style="margin: 0; font-size: 13px; color: var(--sub)">노란 칸을 번호판 위로 끌어 맞추세요. 오른쪽 아래 동그라미로 크기를 바꿔요(키보드: 화살표).</p>
      <div style="position: relative; line-height: 0; border-radius: 12px; overflow: hidden; touch-action: none" @pointermove="move" @pointerup="drag = null" @pointercancel="drag = null">
        <img ref="imgBox" :src="url" alt="원본 사진" style="width: 100%; height: auto; display: block" draggable="false" @load="measure" />
        <div class="plate-box" :style="style" tabindex="0" role="slider" aria-label="번호판 칸 위치" :aria-valuenow="Math.round(rect.x * 100)" @pointerdown="down($event, 'move')" @keydown="key"><b @pointerdown="down($event, 'size')" /></div>
      </div>
    </template>
    <template #foot>
      <button class="btn btn-line" type="button" @click="emit('close')">취소</button>
      <button class="btn btn-pri" type="button" @click="apply">적용</button>
    </template>
  </Modal>
</template>
