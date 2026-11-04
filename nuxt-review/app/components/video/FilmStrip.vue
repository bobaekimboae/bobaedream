<script setup lang="ts">
// 동처띠 자막 · 표지 화면의 필름 줄: 가운데 고정 재생선 · 줄을 좌우로 밀어 위치를 고른다.
// 자막 모드에서는 자막 구간(노란 막대)을 줄 위에 깔고, 누르면 고르고, 양 끝 손잡이로 길이를 바꾼다.
import { nextTick, onMounted, ref, watch } from "vue";
import { drag } from "./fit";
import type { Caption } from "./render";

const props = withDefaults(defineProps<{ frames: string[]; dur: number; u: number; pps?: number; captions?: Caption[]; sel?: string | null; mode?: "caption" | "cover" }>(), { pps: 37, captions: () => [], sel: null, mode: "caption" });
const emit = defineEmits<{ seek: [t: number]; select: [id: string | null]; time: [id: string, k: "start" | "end", v: number] }>();

const box = ref<HTMLElement | null>(null);
const half = ref(0);
let fromUser = true;
const width = () => Math.max(1, props.dur * props.pps);

function syncScroll() {
  const el = box.value;
  if (!el) return;
  const want = props.u * props.pps;
  if (Math.abs(el.scrollLeft - want) < 1) return;
  fromUser = false;
  el.scrollLeft = want;
  requestAnimationFrame(() => (fromUser = true));
}
watch(() => props.u, syncScroll);
onMounted(async () => {
  half.value = (box.value?.clientWidth ?? 0) / 2;
  await nextTick();
  syncScroll();
});
function onScroll() {
  if (!fromUser || !box.value) return;
  emit("seek", Math.max(0, Math.min(props.dur, box.value.scrollLeft / props.pps)));
}
const keyStep = (e: KeyboardEvent) => {
  const d = e.key === "ArrowLeft" ? -0.5 : e.key === "ArrowRight" ? 0.5 : 0;
  if (!d) return;
  e.preventDefault();
  emit("seek", Math.max(0, Math.min(props.dur, props.u + d)));
};
function handle(c: Caption, k: "start" | "end", e: PointerEvent) {
  e.stopPropagation();
  emit("select", c.id);
  const v0 = c[k];
  drag(e, (dx) => emit("time", c.id, k, v0 + dx / props.pps));
}
const tileW = () => (props.frames.length ? width() / props.frames.length : props.pps);
</script>

<template>
  <div class="vf-film" :class="`is-${mode}`">
    <div
      ref="box"
      class="vf-film__scroll"
      tabindex="0"
      role="slider"
      :aria-label="mode === 'cover' ? '표지 장면 고르기' : '재생 위치'"
      :aria-valuenow="Math.round(u * 10) / 10"
      :aria-valuemin="0"
      :aria-valuemax="dur"
      @scroll.passive="onScroll"
      @keydown="keyStep"
    >
      <div class="vf-film__track" :style="{ width: `${width()}px`, marginLeft: `${half}px`, marginRight: `${half}px` }">
        <img v-for="(f, i) in frames" :key="i" :src="f" alt="" draggable="false" :style="{ width: `${tileW()}px` }" />
        <template v-if="mode === 'caption'">
          <button
            v-for="c in captions"
            :key="c.id"
            type="button"
            class="vf-film__cap"
            :class="{ 'is-sel': sel === c.id }"
            :style="{ left: `${c.start * pps}px`, width: `${Math.max(8, (c.end - c.start) * pps)}px` }"
            :aria-label="`자막 ${c.text}`"
            @click.stop="emit('select', sel === c.id ? null : c.id)"
          >
            <template v-if="sel === c.id">
              <i class="vf-film__h is-l" aria-hidden="true" @pointerdown="handle(c, 'start', $event)" />
              <i class="vf-film__h is-r" aria-hidden="true" @pointerdown="handle(c, 'end', $event)" />
            </template>
          </button>
        </template>
      </div>
    </div>
    <i class="vf-film__head" aria-hidden="true" />
  </div>
</template>
