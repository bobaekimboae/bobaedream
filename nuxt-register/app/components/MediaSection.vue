<script setup lang="ts">
// 초톳 「Hình ảnh/Video *」: 88×88 칸(모서리 12) · 첫 칸 = 추가 버튼(연한 바탕 + 원본 아이콘) · 첫 사진 아래 「대표」 띠
// · 오른쪽 위 지우기 · 「길게 눌러 순서 바꾸기」. 노랑 → 파랑.
import { onBeforeUnmount, ref } from "vue";
import Ico from "./Ico.vue";
import { IC } from "../lib/icons";
import type { Media } from "../lib/form";

const props = defineProps<{ media: Media[]; error?: string; max: number }>();
const emit = defineEmits<{ add: []; remove: [string]; move: [number, number]; info: []; view: [number] }>();

// 길게 눌러 끌기(손가락) · 끌어다 놓기(마우스)
const dragId = ref<string | null>(null);
const overId = ref<string | null>(null);
let timer = 0;
/** 길게 눌러 끌기를 시작했으면 손을 뗀 뒤의 누름은 크게 보기로 넘기지 않는다 */
let dragged = false;
let startX = 0;
let startY = 0;
const idAt = (x: number, y: number) => (document.elementFromPoint(x, y) as HTMLElement | null)?.closest<HTMLElement>("[data-mid]")?.dataset.mid ?? null;
const down = (id: string, e: PointerEvent) => {
  if (e.pointerType === "mouse") return;
  dragged = false;
  startX = e.clientX;
  startY = e.clientY;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    dragId.value = id;
    dragged = true;
    navigator.vibrate?.(15);
  }, 380);
};
const move = (e: PointerEvent) => {
  if (!dragId.value) {
    if (Math.hypot(e.clientX - startX, e.clientY - startY) > 8) window.clearTimeout(timer);
    return;
  }
  e.preventDefault();
  overId.value = idAt(e.clientX, e.clientY);
};
const up = () => {
  window.clearTimeout(timer);
  if (dragId.value && overId.value && overId.value !== dragId.value) drop(overId.value);
  dragId.value = null;
  overId.value = null;
};
const drop = (target: string) => {
  const from = props.media.findIndex((m) => m.id === dragId.value);
  const to = props.media.findIndex((m) => m.id === target);
  if (from >= 0 && to >= 0) emit("move", from, to);
};
onBeforeUnmount(() => window.clearTimeout(timer));
</script>
<template>
  <div>
    <div class="media-head">
      <h2>사진/영상<span class="req"> *</span></h2>
      <button type="button" class="media-head__info" aria-label="사진 규칙 보기" @click="emit('info')"><Ico :src="IC.info" /></button>
    </div>
    <div class="media-row" aria-label="올린 사진과 영상" @pointermove="move" @pointerup="up" @pointercancel="up">
      <button v-if="media.length < max" type="button" class="media-add" :class="{ 'is-err': error }" aria-label="사진 · 영상 추가" @click="emit('add')"><Ico :src="IC.media" /></button>
      <div
        v-for="(m, i) in media"
        :key="m.id"
        class="thumb"
        :class="{ 'is-drag': dragId === m.id, 'is-over': overId === m.id && dragId !== m.id }"
        :data-mid="m.id"
        draggable="true"
        @pointerdown="(e) => down(m.id, e)"
        @dragstart="dragId = m.id"
        @dragover.prevent="overId = m.id"
        @drop.prevent="drop(m.id); dragId = null; overId = null"
        @dragend="dragId = null; overId = null"
        @contextmenu.prevent
        @click="!dragged && emit('view', i)"
      >
        <img :src="m.kind === 'video' ? m.poster || '' : m.src" :alt="`${i + 1}번째 ${m.kind === 'video' ? '영상' : '사진'}`" draggable="false" />
        <span v-if="m.kind === 'video'" class="thumb__vid"><Ico :src="IC.play" />{{ m.seconds ? `0:${String(m.seconds).padStart(2, "0")}` : "영상" }}</span>
        <span v-else-if="m.from === 'shoot' && i > 0" class="thumb__src">촬영 키트</span>
        <button type="button" class="thumb__x" :aria-label="`${i + 1}번째 지우기`" @click.stop="emit('remove', m.id)"><img :src="IC.remove" alt="" /></button>
        <span v-if="i === 0" class="thumb__cover">대표 사진</span>
      </div>
    </div>
    <p class="media-help">길게 눌러 사진 순서를 바꿀 수 있어요</p>
    <p v-if="error" class="media-err" role="alert">{{ error }}</p>
  </div>
</template>
