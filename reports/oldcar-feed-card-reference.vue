<!--
  올드카 피드형 카드 Vue 참고 컴포넌트 v1 (2026-10-12)
  - 깃허브 시안(React)의 모바일 피드형 카드를 수치 그대로 옮긴 참고본이다. 프로젝트 구조(폴더·상태 관리·API 연결)에 맞게 옮긴다.
  - 데이터는 props.car 한 개. 값이 없는 항목은 그리지 않는다. 마력·세대 등 임시값은 MOCK 상수 확정 전까지 car 쪽에서 채운다.
  - 개발 지시문: reports/oldcar-feed-dev-brief-v1.md (OC-01 ~ OC-18)
-->
<template>
  <article class="feed-card">
    <div class="photo" aria-label="매물 사진">
      <div ref="track" class="track" @scroll="onScroll" @pointerdown="down" @pointermove="move" @pointerup="up" @pointercancel="up">
        <img v-for="(src, i) in car.images" :key="src + i" :src="src" :alt="i === 0 ? title : `${title} 사진 ${i + 1}`" draggable="false" />
      </div>
      <div class="time-scrim"><span class="time">{{ car.postedLabel }}</span></div>
      <span v-if="car.images.length > 1" class="count" :class="{ on: countVisible }">{{ index + 1 }}/{{ car.images.length }}</span>
      <div v-if="car.images.length > 1" class="dots" aria-hidden="true">
        <i v-for="d in dots" :key="d.i" :class="d.cls" />
      </div>
    </div>
    <h3 class="title">{{ title }}</h3>
    <p class="meta">{{ meta }}</p>
    <p class="price"><b>{{ priceNumber }}</b><span v-if="priceUnit">{{ priceUnit }}</span></p>
    <p class="place"><i class="pin" />{{ car.place }}</p>
    <div class="seller">
      <img class="avatar" :src="car.sellerAvatar" alt="" />
      <div class="who"><strong>{{ car.sellerName }}</strong><small v-if="car.sellerActiveCount">{{ car.sellerActiveCount }}대 판매중</small></div>
      <div class="actions"><button aria-label="전화" /><button aria-label="채팅" /><button aria-label="찜" /></div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";

const props = defineProps<{
  car: {
    title: string; year: number; mileageKm: number; fuel: string; horsepower?: number;
    generationLabel?: string; // 예: "3세대 (T3)" — 보배드림 모델 기준표
    priceMan: number | null; place: string; images: string[]; postedLabel: string;
    sellerName: string; sellerAvatar: string; sellerActiveCount?: number;
  };
}>();

const title = computed(() => props.car.title);
// OC-02: 연식 · 주행(축약) · 연료 · 마력 · 세대
const mileageLabel = (km: number) => (km >= 9500 ? `${Math.round(km / 1000) / 10}만km` : `${km.toLocaleString("ko-KR")}km`);
const meta = computed(() => [
  String(props.car.year), mileageLabel(props.car.mileageKm), props.car.fuel,
  props.car.horsepower ? `${props.car.horsepower}마력` : "", props.car.generationLabel ?? "",
].filter(Boolean).join(" · "));
// OC-05
const priceNumber = computed(() => (props.car.priceMan === null ? "가격 상담" : props.car.priceMan.toLocaleString("ko-KR")));
const priceUnit = computed(() => (props.car.priceMan === null ? "" : "만원"));

// OC-10~12: 사진 넘기기 · 점 최대 5개 · 개수 알약(넘길 때만 1.5초)
const track = ref<HTMLElement | null>(null);
const index = ref(0);
const countVisible = ref(false);
let countTimer = 0;
let frame = 0;
const DOT_MAX = 5;
const dots = computed(() => {
  const n = props.car.images.length;
  const start = Math.max(0, Math.min(index.value - 2, n - DOT_MAX));
  const moreBefore = start > 0;
  const moreAfter = start + DOT_MAX < n;
  return Array.from({ length: Math.min(DOT_MAX, n) }, (_, k) => {
    const i = start + k;
    const edge = (moreBefore && k === 0) || (moreAfter && k === DOT_MAX - 1);
    const near = !edge && ((moreBefore && k === 1) || (moreAfter && k === DOT_MAX - 2));
    return { i, cls: [i === index.value ? "on" : "", edge ? "edge" : near ? "near" : ""].join(" ").trim() };
  });
});
function onScroll() {
  const t = track.value;
  if (!t) return;
  if (t.scrollLeft > 1) { countVisible.value = true; clearTimeout(countTimer); countTimer = window.setTimeout(() => (countVisible.value = false), 1500); }
  if (frame) return;
  frame = requestAnimationFrame(() => { frame = 0; if (t.clientWidth) index.value = Math.max(0, Math.min(props.car.images.length - 1, Math.round(t.scrollLeft / t.clientWidth))); });
}
// 마우스 끌기: 4px 이상 끌면 시작, 폭의 15% 이상이면 다음·이전 장, 끌고 난 직후 클릭은 막는다
let drag: { x: number; left: number; moved: boolean } | null = null;
function down(e: PointerEvent) { if (e.pointerType === "mouse" && e.button === 0 && track.value) drag = { x: e.clientX, left: track.value.scrollLeft, moved: false }; }
function move(e: PointerEvent) {
  const t = track.value; if (!t || !drag) return;
  const dx = e.clientX - drag.x;
  if (!drag.moved && Math.abs(dx) < 4) return;
  if (!drag.moved) { drag.moved = true; t.style.scrollSnapType = "none"; t.setPointerCapture(e.pointerId); }
  t.scrollLeft = drag.left - dx;
}
function up(e: PointerEvent) {
  const t = track.value; const d = drag; drag = null;
  if (!t || !d?.moved) return;
  if (t.hasPointerCapture(e.pointerId)) t.releasePointerCapture(e.pointerId);
  const w = t.clientWidth || 1; const dx = e.clientX - d.x; const from = Math.round(d.left / w);
  const to = Math.max(0, Math.min(props.car.images.length - 1, Math.abs(dx) > w * 0.15 ? from + (dx < 0 ? 1 : -1) : from));
  t.style.scrollSnapType = ""; t.scrollTo({ left: to * w, behavior: "smooth" });
  const block = (ev: Event) => { ev.stopPropagation(); ev.preventDefault(); };
  t.addEventListener("click", block, { capture: true, once: true });
  window.setTimeout(() => t.removeEventListener("click", block, true), 0);
}
onBeforeUnmount(() => { clearTimeout(countTimer); cancelAnimationFrame(frame); });
</script>

<style scoped>
/* 수치: 모바일 390 기준. 색은 #222 / #595959 / #8C8C8C / 구분선 #E8E8E8 */
.feed-card { padding: 12px 16px; border-bottom: 1px solid #e8e8e8; font-family: "Pretendard Variable", Pretendard, system-ui, sans-serif; }
.photo { position: relative; aspect-ratio: 358 / 207.3; border-radius: 12px; overflow: hidden; background: #f2f2f2; }
.track { display: flex; height: 100%; overflow-x: auto; overflow-y: hidden; scroll-snap-type: x mandatory; scrollbar-width: none; touch-action: pan-x pan-y; }
.track img { flex: 0 0 100%; width: 100%; height: 100%; object-fit: cover; scroll-snap-align: start; }
/* OC-13 시간 배경 */
.time-scrim { position: absolute; inset: auto 0 0; height: 44px; padding: 0 10px 10px; display: flex; align-items: flex-end; background: linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.5)); pointer-events: none; }
.time { color: #fff; font: 600 12px/18px inherit; }
/* OC-12 개수 */
.count { position: absolute; top: 8px; right: 8px; height: 24px; padding: 0 8px; border-radius: 12px; background: rgba(0, 0, 0, 0.6); color: #fff; font: 600 12px/24px inherit; opacity: 0; transition: opacity 0.2s; }
.count.on { opacity: 1; }
/* OC-11 점 */
.dots { position: absolute; left: 50%; bottom: 10px; transform: translateX(-50%); display: flex; align-items: center; gap: 4px; height: 16px; padding: 0 7px; border-radius: 8px; background: rgba(0, 0, 0, 0.45); }
.dots i { width: 5px; height: 5px; border-radius: 50%; background: rgba(255, 255, 255, 0.55); }
.dots i.near { width: 4px; height: 4px; } .dots i.edge { width: 3px; height: 3px; } .dots i.on { background: #fff; }
/* OC-01 ~ OC-07 */
.title { margin: 10px 0 0; font: 700 17px/24px inherit; color: #222; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.meta { margin: 0; font-size: 15px; color: #595959; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.price { margin: 0; color: #222; } .price b { font-size: 17px; font-weight: 700; } .price span { font-size: 17px; font-weight: 400; }
.place { margin: 0; font-size: 15px; color: #8c8c8c; display: flex; align-items: center; gap: 5px; }
.pin { width: 15.6px; height: 15.6px; flex: none; } /* 위치 아이콘 SVG 연결 */
.seller { display: flex; align-items: center; margin-top: 4px; }
.avatar { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; }
.who { margin-left: 9px; } .who strong { font: 400 14px/16px inherit; color: #222; } .who small { display: block; margin-left: 3px; font-size: 13px; color: #8c8c8c; }
.actions { margin-left: auto; display: flex; gap: 20px; } .actions button { width: 20px; height: 20px; border: 0; background: none; color: #222; }
</style>
