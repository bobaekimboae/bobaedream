<script setup lang="ts">
// 초톳: 올린 사진을 누르면 검은 바탕 전체 화면으로 크게 본다. 오른쪽 위 「× 닫기」, 아래 가운데 점, 옆으로 밀어 넘긴다.
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import Ico from "./Ico.vue";
import { IC } from "../lib/icons";
import type { Media } from "../lib/form";

const props = defineProps<{ media: Media[]; start: number }>();
const emit = defineEmits<{ close: [] }>();
const cur = ref(props.start);
const track = ref<HTMLElement | null>(null);
const closeBtn = ref<HTMLButtonElement | null>(null);
const onScroll = () => {
  const t = track.value;
  if (t) cur.value = Math.round(t.scrollLeft / t.clientWidth);
};
let prevOverflow = "";
const onKey = (e: KeyboardEvent) => {
  if (e.key === "Escape") emit("close");
  const t = track.value;
  if (!t) return;
  if (e.key === "ArrowRight") t.scrollTo({ left: Math.min(props.media.length - 1, cur.value + 1) * t.clientWidth, behavior: "smooth" });
  if (e.key === "ArrowLeft") t.scrollTo({ left: Math.max(0, cur.value - 1) * t.clientWidth, behavior: "smooth" });
};
onMounted(async () => {
  document.addEventListener("keydown", onKey);
  prevOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  await nextTick();
  if (track.value) track.value.scrollLeft = props.start * track.value.clientWidth;
  closeBtn.value?.focus({ preventScroll: true });
});
onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKey);
  document.body.style.overflow = prevOverflow;
});
</script>
<template>
  <section class="viewer" role="dialog" aria-modal="true" :aria-label="`사진 크게 보기 ${cur + 1} / ${media.length}`">
    <button ref="closeBtn" type="button" class="viewer__x" @click="emit('close')"><Ico :src="IC.close" />닫기</button>
    <div ref="track" class="viewer__track" @scroll.passive="onScroll">
      <div v-for="(m, i) in media" :key="m.id" class="viewer__item">
        <video v-if="m.kind === 'video'" :src="m.src" :poster="m.poster" controls playsinline />
        <img v-else :src="m.src" :alt="`${i + 1}번째 사진`" />
      </div>
    </div>
    <div class="viewer__dots" aria-hidden="true"><i v-for="(m, i) in media" :key="m.id" :class="{ 'is-on': i === cur }" /></div>
  </section>
</template>
