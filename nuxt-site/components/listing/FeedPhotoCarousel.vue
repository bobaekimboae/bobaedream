<script setup lang="ts">
// 리액트 bbm-list.tsx 의 FeedPhotoCarousel(파일 안 전용 부품).
// 피드 보기 사진 넘기기(레딧식): 가로 스와이프(scroll-snap) + 아래 가운데 점 알약(현재 점 흰색, 가장자리 점은 작게) + 오른쪽 위 「현재/전체」 개수
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { asset } from "@proto/data";
import { retryExternalPhoto } from "./bbm-list-local";

const props = defineProps<{ photos: string[]; alt: string; fit: "cover" | "contain" }>();
const wrapRef = ref<HTMLDivElement | null>(null);
const trackRef = ref<HTMLDivElement | null>(null);
let frame = 0;
const index = ref(0);
// 레딧처럼 사진 개수는 넘길 때만 잠깐 보이고 1.5초 뒤 저절로 사라진다(2026-10-10)
const countVisible = ref(false);
let countTimer = 0;
const flashCount = () => {
  countVisible.value = true;
  window.clearTimeout(countTimer);
  countTimer = window.setTimeout(() => { countVisible.value = false; }, 1500);
};
// 스크롤 버벅임 완화(2026-10-10): 첫 사진만 먼저 그리고, 나머지 사진은 카드가 화면 근처에 온 뒤에야 붙인다(처음부터 수십 장을 한꺼번에 디코딩하지 않음)
const armed = ref(false);
let observer: IntersectionObserver | undefined;
watch([armed, wrapRef], () => {
  observer?.disconnect();
  observer = undefined;
  const node = wrapRef.value;
  if (!node || armed.value) return;
  if (typeof IntersectionObserver === "undefined") { armed.value = true; return; }
  const next = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) { armed.value = true; next.disconnect(); } }, { rootMargin: "120px 0px" });
  next.observe(node);
  observer = next;
}, { immediate: true, flush: "post" });
onBeforeUnmount(() => { observer?.disconnect(); cancelAnimationFrame(frame); window.clearTimeout(countTimer); });
// 스크롤 이벤트마다 계산하지 않고 한 프레임에 한 번만 현재 장 번호를 갱신한다
const onScroll = () => {
  if (trackRef.value && trackRef.value.scrollLeft > 1) flashCount();
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    const track = trackRef.value;
    if (!track || !track.clientWidth) return;
    index.value = Math.max(0, Math.min(props.photos.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
  });
};
// 마우스 끌기(2026-10-12 「피드형에서 레딧처럼 사진 좌우 제스처 안 되고」): 터치는 브라우저가 알아서 넘기지만 마우스는 끌어도 안 넘어가서,
// 마우스로 끌면 사진 줄이 따라오고 놓으면 가까운 사진에 붙는다. 터치·펜은 그대로 둔다.
let drag: { x: number; left: number; moved: boolean } | null = null;
const onPointerDown = (event: PointerEvent) => {
  if (event.pointerType !== "mouse" || event.button !== 0 || !trackRef.value) return;
  drag = { x: event.clientX, left: trackRef.value.scrollLeft, moved: false };
};
const onPointerMove = (event: PointerEvent) => {
  const track = trackRef.value;
  const state = drag;
  if (!track || !state) return;
  const dx = event.clientX - state.x;
  if (!state.moved && Math.abs(dx) < 4) return;
  if (!state.moved) { state.moved = true; track.style.scrollSnapType = "none"; track.setPointerCapture(event.pointerId); }
  track.scrollLeft = state.left - dx;
};
const endDrag = (event: PointerEvent) => {
  const track = trackRef.value;
  const state = drag;
  drag = null;
  if (!track || !state?.moved) return;
  if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
  const width = track.clientWidth || 1;
  const dx = event.clientX - state.x;
  const from = Math.round(state.left / width);
  const target = Math.max(0, Math.min(props.photos.length - 1, Math.abs(dx) > width * 0.15 ? from + (dx < 0 ? 1 : -1) : from));
  track.style.scrollSnapType = "";
  track.scrollTo({ left: target * width, behavior: "smooth" });
  // 끌고 난 뒤 곧바로 오는 클릭이 상세로 열리지 않게 한 번 막는다
  const block = (e: MouseEvent) => { e.stopPropagation(); e.preventDefault(); };
  track.addEventListener("click", block, { capture: true, once: true });
  window.setTimeout(() => track.removeEventListener("click", block, true), 0);
};
const onTrackClick = (event: MouseEvent) => { if (trackRef.value && trackRef.value.scrollLeft % trackRef.value.clientWidth) event.stopPropagation(); };
// 점은 최대 5개(2026-10-12 「5개로 줄여서」): 뒤에 사진이 더 있는 쪽 끝 점만 작게(끝 3px · 그 안쪽 4px)
const dotMax = 5;
const start = computed(() => Math.max(0, Math.min(index.value - 2, props.photos.length - dotMax)));
const dots = computed(() => props.photos.map((_, i) => i).slice(start.value, start.value + dotMax));
const dotClass = (i: number) => {
  const moreBefore = start.value > 0;
  const moreAfter = start.value + dotMax < props.photos.length;
  const s = start.value;
  return `${i === index.value ? "is-on" : ""}${(moreBefore && i === s) || (moreAfter && i === s + dotMax - 1) ? " is-edge" : (moreBefore && i === s + 1) || (moreAfter && i === s + dotMax - 2) ? " is-near" : ""}`.trim();
};
</script>
<template>
  <div ref="wrapRef" class="bbm-feed-carousel-wrap">
    <div ref="trackRef" class="bbm-feed-carousel" @scroll="onScroll" @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="endDrag" @pointercancel="endDrag" @click="onTrackClick">
      <template v-for="(src, i) in photos" :key="src + i">
        <img v-if="armed || i === 0" :class="fit === 'contain' ? 'is-catalog' : ''" :src="asset(src)" :alt="i === 0 ? alt : `${alt} 사진 ${i + 1}`" :draggable="false" decoding="async" @error="retryExternalPhoto" />
        <span v-else class="bbm-feed-slide-empty" aria-hidden="true" />
      </template>
    </div>
    <span :class="`bbm-feed-count${countVisible ? ' is-visible' : ''}`" :aria-label="`사진 ${photos.length}장 중 ${index + 1}번째`">{{ index + 1 }}/{{ photos.length }}</span>
    <div class="bbm-feed-dots" aria-hidden="true">
      <i v-for="i in dots" :key="i" :class="dotClass(i)" />
    </div>
  </div>
</template>
