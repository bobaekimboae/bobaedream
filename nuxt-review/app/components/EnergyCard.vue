<script setup lang="ts">
// 연비 공유 카드(동처띠 「近期数据 80% 能耗领先同车型」 공유 그림을 화면 부품으로 다시 그림): 300 폭으로 그리고 width에 맞춰 줄인다.
// 수치는 글의 실측값, 「동급 대비 상위 %」 · 추이 선은 같은 동력 방식 글 평균으로 계산한 화면 확인용 값이다.
import { computed } from "vue";
import { asset } from "../lib/site";
import { fuelPosts, fuelText, type FuelPost } from "../lib/data";

const p = withDefaults(defineProps<{ post: FuelPost; width?: number }>(), { width: 300 });
const eff = (x: FuelPost) => (x.energy ? 100 / x.energy : x.fuel ?? 0);
const peers = computed(() => fuelPosts().filter((x) => x.powertrain === p.post.powertrain).map(eff).filter(Boolean));
const pct = computed(() => {
  const a = peers.value.reduce((s, v) => s + v, 0) / (peers.value.length || 1);
  return Math.max(5, Math.min(99, Math.round(50 + ((eff(p.post) - a) / (a || 1)) * 120)));
});
const main = computed(() => fuelText(p.post)[0]);
const cost = computed(() => {
  if (p.post.energy) return Math.round(300 / (100 / p.post.energy));
  if (p.post.fuel) return Math.round(1700 / p.post.fuel);
  return 0;
});
const seed = computed(() => Number(p.post.id.replace(/\D/g, "").slice(-3)) || 7);
const pts = computed(() => {
  const base = eff(p.post) || 10;
  return Array.from({ length: 7 }, (_, i) => +(base * (0.9 + (((seed.value * (i + 3)) % 17) / 100))).toFixed(1));
});
const line = computed(() => {
  const max = Math.max(...pts.value) * 1.15, min = Math.min(...pts.value) * 0.85;
  return pts.value.map((v, i) => `${20 + i * 40},${70 - ((v - min) / (max - min || 1)) * 56}`).join(" ");
});
const mood = computed(() => (pct.value >= 70 ? "아주 잘하고 있어요, 계속 유지해 보세요!" : pct.value >= 40 ? "평균 수준이에요, 조금만 더 아껴 볼까요?" : "급가속을 줄이면 더 좋아져요"));
</script>

<template>
  <div class="ecard-wrap" :style="{ width: `${width}px`, height: `${width * (460 / 300)}px` }" role="img" :aria-label="`${post.model} 연비 기록 카드: ${main ? main.label + ' ' + main.value + main.unit : ''}, 같은 동력 방식 대비 상위 ${100 - pct}%`">
    <div class="ecard" :style="{ transform: `scale(${width / 300})` }">
      <div class="ecard__top"><b>최근 데이터</b><span class="ecard__rank">랭킹</span></div>
      <div class="ecard__pct">{{ pct }}<small>%</small></div>
      <p class="ecard__cap">같은 차종보다 효율이 좋아요</p>
      <img v-if="post.photo" class="ecard__car" :src="asset(post.photo)" alt="" />
      <span class="ecard__mood">{{ mood }}</span>
      <div class="ecard__boxes">
        <div><b>{{ main ? `${main.value}${main.unit}` : "-" }}</b><span>{{ main?.label ?? "평균" }}</span></div>
        <div><b>{{ cost }}원/km</b><span>1km당 비용</span></div>
      </div>
      <div class="ecard__chart">
        <div class="ecard__ct"><b>최근 효율 추이</b><span><i class="me" />나 <i class="avg" />같은 차종 평균</span></div>
        <svg viewBox="0 0 280 80" aria-hidden="true"><line v-for="y in [14, 42, 70]" :key="y" x1="10" x2="270" :y1="y" :y2="y" /><polyline class="avg" points="20,40 260,40" /><polyline class="me" :points="line" /></svg>
      </div>
    </div>
  </div>
</template>
