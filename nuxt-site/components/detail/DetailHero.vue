<script setup lang="ts">
// 리액트 DetailHero(detail/index.tsx). onBack → emit("back").
// 사진 줄은 mobile/Carousel(.detail-media-carousel > .detail-media-track > img). 스크롤 위치로 사진 번호를 정하고 90ms 뒤 가까운 사진에 맞춘다.
// 썸네일 줄(&thumbs=on)은 requestAnimationFrame 감속 이동(리액트와 같은 값).
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { getActiveDetailCar } from "@proto/data";
import Carousel from "../mobile/Carousel.vue";
import DetailHeroActions from "./DetailHeroActions.vue";
import DetailTopSeller from "./DetailTopSeller.vue";
import DetailTopCrumbs from "./DetailTopCrumbs.vue";
import { detailPhotosOf, detailTopMode, THUMB_EDGE_LEFT, THUMB_EDGE_RIGHT } from "./detail-local";

const emit = defineEmits<{ back: [] }>();
const topCar = getActiveDetailCar();
const photos = detailPhotosOf(topCar);
const imageAspectRatio = topCar?.imageAspectRatio;
const photoIndex = ref(1);
const heroRef = ref<HTMLElement | null>(null);
const thumbsRef = ref<HTMLDivElement | null>(null);
let jumpLock: number | null = null;
let jumpTimer = 0;
let stripAnim = 0;
let stripTarget: number | null = null;
let removeScroll: (() => void) | null = null;

const topMode = topCar ? detailTopMode() : null;
const showThumbs = photos.length > 1 && new URLSearchParams(window.location.search).get("thumbs") === "on";
const showPlay = () => photoIndex.value === 1 && (topCar ? topCar.filter?.video : true);

onMounted(() => {
  const carousel = heroRef.value?.querySelector<HTMLElement>(".detail-media-carousel");
  const firstPhoto = carousel?.querySelector<HTMLElement>(".detail-media-track > img");
  if (!carousel || !firstPhoto) return;
  let snapTimer = 0;
  const updatePhotoIndex = () => {
    const photoWidth = firstPhoto.getBoundingClientRect().width || carousel.clientWidth;
    const nextIndex = Math.min(photos.length, Math.max(1, Math.round(carousel.scrollLeft / photoWidth) + 1));
    // 썸네일을 눌러 먼 사진으로 갈 때는 지나가는 사진 번호를 무시한다(눌린 칸이 즉시 선택, 도착하면 잠금 해제)
    const lock = jumpLock;
    if (lock !== null) {
      if (nextIndex !== lock) return;
      jumpLock = null;
    }
    photoIndex.value = nextIndex;
    window.clearTimeout(snapTimer);
    snapTimer = window.setTimeout(() => {
      const targetLeft = photoWidth * (nextIndex - 1);
      if (Math.abs(carousel.scrollLeft - targetLeft) > 1) carousel.scrollTo({ left: targetLeft, behavior: "smooth" });
    }, 90);
  };
  carousel.addEventListener("scroll", updatePhotoIndex, { passive: true });
  updatePhotoIndex();
  removeScroll = () => {
    window.clearTimeout(snapTimer);
    carousel.removeEventListener("scroll", updatePhotoIndex);
  };
});
onBeforeUnmount(() => {
  removeScroll?.();
  window.cancelAnimationFrame(stripAnim);
  window.clearTimeout(jumpTimer);
});

// 선택한 썸네일이 줄 안에서 완전히 보이도록 필요할 때만 줄을 가로로 옮긴다(카이디 방식, 페이지 스크롤은 건드리지 않음)
const moveStrip = () => {
  const strip = thumbsRef.value;
  const index = photoIndex.value;
  const thumb = strip?.children[index - 1] as HTMLElement | undefined;
  if (!strip || !thumb) return;
  const prev = (strip.children[index - 2] as HTMLElement | undefined) ?? thumb;
  const next = (strip.children[index] as HTMLElement | undefined) ?? thumb;
  const maxLeft = Math.max(0, strip.scrollWidth - strip.clientWidth);
  const left = index === 1 ? 0 : prev.offsetLeft - THUMB_EDGE_LEFT;
  const right = next.offsetLeft + next.offsetWidth + THUMB_EDGE_RIGHT - strip.clientWidth;
  const from = stripTarget ?? strip.scrollLeft;
  const target = Math.min(maxLeft, Math.max(0, left < from ? left : right > from ? right : from));
  if (Math.abs(target - strip.scrollLeft) < 1 && stripTarget === null) return;
  stripTarget = target;
  window.cancelAnimationFrame(stripAnim);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    strip.scrollLeft = target;
    stripTarget = null;
    return;
  }
  const step = () => {
    const goal = stripTarget;
    if (goal === null) return;
    const diff = goal - strip.scrollLeft;
    if (Math.abs(diff) < 0.5) {
      strip.scrollLeft = goal;
      stripTarget = null;
      return;
    }
    strip.scrollLeft += diff * 0.22 + Math.sign(diff) * 0.4;
    stripAnim = window.requestAnimationFrame(step);
  };
  stripAnim = window.requestAnimationFrame(step);
};
onMounted(moveStrip);
watch(photoIndex, () => { void nextTick(moveStrip); }, { flush: "post" });

const choosePhoto = (index: number) => {
  const carousel = heroRef.value?.querySelector<HTMLElement>(".detail-media-carousel");
  const firstPhoto = carousel?.querySelector<HTMLElement>(".detail-media-track > img");
  if (!carousel || !firstPhoto) return;
  jumpLock = index + 1;
  window.clearTimeout(jumpTimer);
  jumpTimer = window.setTimeout(() => { jumpLock = null; }, 1200);
  photoIndex.value = index + 1;
  carousel.scrollTo({ left: firstPhoto.getBoundingClientRect().width * index, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
};

// 썸네일 줄 키보드 조작(WAI-ARIA 캐러셀 관례): 좌우 화살표로 이전·다음, Home·End로 처음·끝
const onThumbKey = (event: KeyboardEvent) => {
  const keys: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 };
  let next = -1;
  if (event.key in keys) next = Math.min(photos.length - 1, Math.max(0, photoIndex.value - 1 + keys[event.key]));
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = photos.length - 1;
  if (next < 0) return;
  event.preventDefault();
  choosePhoto(next);
  (thumbsRef.value?.children[next] as HTMLElement | undefined)?.focus({ preventScroll: true });
};
</script>
<template>
  <template v-if="topMode === 'above' && topCar"><div class="detail-top-head"><DetailHeroActions @back="emit('back')" /></div><DetailTopSeller :car="topCar" /><DetailTopCrumbs :car="topCar" /></template>
  <section ref="heroRef" :class="`detail-hero${topMode ? ` is-top-${topMode}` : ''}`" aria-label="차량 사진">
    <div class="detail-hero-main">
      <Carousel aria-label="차량 사진" class-name="detail-media-carousel" content-class-name="detail-media-track">
        <img v-for="(photo, index) in photos" :key="`${photo}-${index}`" :src="photo" :alt="`차량 사진 ${index + 1}`" :draggable="false" />
      </Carousel>
      <span v-if="showPlay()" class="detail-video-play" aria-hidden="true"><span /></span>
      <div class="detail-photo-count" aria-live="polite" aria-atomic="true">{{ photoIndex }} / {{ photos.length }}</div>
      <DetailHeroActions v-if="topMode !== 'above'" @back="emit('back')" />
      <template v-if="topMode === 'overlay' && topCar"><div class="detail-top-overlay"><DetailTopCrumbs :car="topCar" /></div><DetailTopSeller :car="topCar" overlay /></template>
    </div>
  </section>
  <div v-if="showThumbs" ref="thumbsRef" class="detail-thumbs" role="group" aria-label="차량 사진 썸네일" @keydown="onThumbKey">
    <button v-for="(photo, index) in photos" :key="`${photo}-${index}`" type="button" :aria-label="`사진 ${index + 1} 보기`" :aria-pressed="index === photoIndex - 1" :class="index === photoIndex - 1 ? 'is-active' : ''" :style="imageAspectRatio ? { height: `${64 / imageAspectRatio}px` } : undefined" @click="choosePhoto(index)"><img :src="photo" alt="" :draggable="false" loading="lazy" :style="imageAspectRatio ? { objectFit: 'contain' } : undefined" /></button>
  </div>
</template>
