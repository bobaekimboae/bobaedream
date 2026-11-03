<script setup lang="ts">
// 사진 · 영상 칸(동처띠 실측: 칸 252px → 89.6 CSS, 사이 11px → 4): 첫 사진에 「대표」, 오른쪽 위 ✕, 아래 「✎ 편집」, 끝에 「+ 계속 추가」.
// 사진을 길게 눌러 끌면 순서를 바꾼다(첫 칸 = 대표 사진).
import { ref } from "vue";
import Ico from "../Ico.vue";
import { IC } from "../../lib/icons";
import type { Media } from "../../lib/publish";

const p = defineProps<{ media: Media[]; max: number; mode: "dynamic" | "ask" | "sell" | "video" }>();
const emit = defineEmits<{ pick: []; video: []; edit: [number]; remove: [number]; move: [number, number]; ai: [] }>();
const drag = ref(-1);
const over = ref(-1);
let timer: ReturnType<typeof setTimeout> | undefined;
let sx = 0; let sy = 0; let moved = false;

const down = (i: number, e: PointerEvent) => {
  sx = e.clientX; sy = e.clientY; moved = false;
  timer = setTimeout(() => { drag.value = i; over.value = i; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); navigator.vibrate?.(10); }, 350);
};
const move = (e: PointerEvent) => {
  if (Math.hypot(e.clientX - sx, e.clientY - sy) > 6) moved = true;
  if (drag.value < 0) { if (moved) clearTimeout(timer); return; }
  const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-mi]");
  if (el) over.value = Number(el.dataset.mi);
};
const up = (i: number) => {
  clearTimeout(timer);
  if (drag.value >= 0) { if (over.value !== drag.value) emit("move", drag.value, over.value); drag.value = -1; over.value = -1; return; }
  if (!moved) emit("edit", i);
};
</script>

<template>
  <div class="pmedia" :class="`pmedia--${mode}`">
    <button v-if="mode === 'dynamic' && !media.length" type="button" class="pmedia__ai" @click="emit('ai')"><Ico :src="IC.powerup" /><span>AI 그림</span></button>
    <div v-for="(m, i) in media" :key="m.src.slice(-24) + i" class="pmedia__cell" :data-mi="i" :class="{ 'is-drag': drag === i, 'is-over': over === i && drag !== i }"
      @pointerdown="down(i, $event)" @pointermove="move" @pointerup="up(i)" @pointercancel="drag = -1">
      <img :src="m.kind === 'video' ? m.cover || '' : m.src" alt="" draggable="false" />
      <b v-if="i === 0 && mode !== 'video'" class="pmedia__cover">대표</b>
      <span v-if="m.kind === 'video'" class="pmedia__dur"><Ico :src="IC.play" />{{ Math.floor((m.duration ?? 0) / 60) }}:{{ String(Math.round((m.duration ?? 0) % 60)).padStart(2, "0") }}</span>
      <button type="button" class="pmedia__x" :aria-label="`${i + 1}번째 ${m.kind === 'video' ? '영상' : '사진'} 빼기`" @pointerdown.stop @pointerup.stop @click.stop="emit('remove', i)"><Ico :src="IC.remove" /></button>
      <span class="pmedia__edit"><Ico :src="IC.edit" />편집</span>
    </div>
    <template v-if="media.length < max && !(mode === 'video' && media.length)">
      <button v-if="mode !== 'video'" type="button" class="pmedia__add" @click="emit('pick')"><Ico :src="IC.add" /><span>{{ media.length ? "계속 추가" : mode === "sell" ? "차량 사진" : mode === "ask" ? "사진 추가" : "사진 올리기" }}</span></button>
      <button v-if="(mode === 'ask' && !media.some((m) => m.kind === 'video')) || mode === 'video'" type="button" class="pmedia__add" @click="emit('video')"><Ico :src="IC.video" /><span>영상 추가</span></button>
    </template>
  </div>
</template>
