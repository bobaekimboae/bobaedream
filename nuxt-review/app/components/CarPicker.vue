<script setup lang="ts">
// 차량 고르기(동처띠 「3步选车」 실측): 브랜드(검색 · 자주 고르는 차 · 초성 색인) → 모델(사진 목록) → 트림(연식 탭 · 동력 묶음).
// 전체 화면, 머리 뒤로 = 한 단계 앞으로, 첫 단계에서 뒤로 = 닫기. Esc도 같다.
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import Ico from "./Ico.vue";
import { IC } from "../lib/icons";
import { asset } from "../lib/site";
import { carModels, ptLabel, type CarModel } from "../lib/data";

const p = defineProps<{ title: string }>();
const emit = defineEmits<{ close: []; pick: [CarModel] }>();

const all = carModels();
const step = ref<1 | 2 | 3>(1);
const brand = ref("");
const series = ref("");
const q = ref("");
const year = ref("");
const root = ref<HTMLElement | null>(null);

const CHO = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const BASE: Record<string, string> = { ㄲ: "ㄱ", ㄸ: "ㄷ", ㅃ: "ㅂ", ㅆ: "ㅅ", ㅉ: "ㅈ" };
const initial = (s: string) => {
  const c = s.charCodeAt(0);
  if (c >= 0xac00 && c <= 0xd7a3) { const ch = CHO[Math.floor((c - 0xac00) / 588)]!; return BASE[ch] ?? ch; }
  return s[0]!.toUpperCase();
};
const brands = computed(() => {
  const m = new Map<string, { brand: string; logo: string; count: number }>();
  for (const c of all) { const b = m.get(c.brand) ?? { brand: c.brand, logo: c.brandLogo, count: 0 }; b.count += 1; m.set(c.brand, b); }
  return [...m.values()].sort((a, b) => a.brand.localeCompare(b.brand, "ko"));
});
const groups = computed(() => {
  const g = new Map<string, typeof brands.value>();
  for (const b of brands.value) { const k = initial(b.brand); g.set(k, [...(g.get(k) ?? []), b]); }
  const order = (k: string) => (/[ㄱ-ㅎ]/.test(k) ? `0${k}` : `1${k}`);
  return [...g.entries()].sort((a, b) => order(a[0]).localeCompare(order(b[0]), "ko"));
});
const hot = computed(() => all.filter((c, i, arr) => c.photo && arr.findIndex((x) => x.model === c.model) === i).slice(0, 6));
const results = computed(() => {
  const k = q.value.replace(/\s/g, "").toLowerCase();
  if (!k) return [];
  return all.filter((c) => `${c.brand}${c.model}${c.trim}`.replace(/\s/g, "").toLowerCase().includes(k)).slice(0, 30);
});
const seriesList = computed(() => {
  const m = new Map<string, CarModel>();
  for (const c of all) if (c.brand === brand.value && !m.has(c.model)) m.set(c.model, c);
  return [...m.values()];
});
const trims = computed(() => all.filter((c) => c.brand === brand.value && c.model === series.value));
const yearOf = (c: CarModel) => (c.trim.match(/^(\d{4})/) || [])[1] ?? "기타";
const years = computed(() => [...new Set(trims.value.map(yearOf))].sort((a, b) => b.localeCompare(a)));
const trimGroups = computed(() => {
  const list = trims.value.filter((c) => !year.value || yearOf(c) === year.value);
  const g = new Map<string, CarModel[]>();
  for (const c of list) g.set(ptLabel[c.powertrain] ?? "", [...(g.get(ptLabel[c.powertrain] ?? "") ?? []), c]);
  return [...g.entries()];
});

const headTitle = computed(() => (step.value === 1 ? p.title : step.value === 2 ? "모델 선택" : "트림 선택"));
const pickBrand = (b: string) => { brand.value = b; step.value = 2; window.scrollTo?.(0, 0); };
const pickSeries = (s: string) => { series.value = s; step.value = 3; year.value = ""; };
const pickTrim = (c: CarModel) => emit("pick", c);
const back = () => { if (step.value === 1) emit("close"); else step.value = (step.value - 1) as 1 | 2; };
const jump = (k: string) => root.value?.querySelector(`[data-ini="${k}"]`)?.scrollIntoView({ block: "start" });

const onKey = (e: KeyboardEvent) => e.key === "Escape" && back();
let prev = "";
onMounted(async () => {
  document.addEventListener("keydown", onKey);
  prev = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  await nextTick();
  root.value?.querySelector<HTMLElement>(".picker__back")?.focus({ preventScroll: true });
});
onBeforeUnmount(() => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; });
</script>

<template>
  <div ref="root" class="picker" role="dialog" aria-modal="true" :aria-label="headTitle">
    <header class="picker__head">
      <button type="button" class="picker__back" aria-label="뒤로" @click="back"><Ico :src="IC.back" /></button>
      <h2>{{ headTitle }}</h2>
    </header>

    <div v-if="step === 1" class="picker__body">
      <label class="picker__search">
        <Ico :src="IC.search" />
        <input v-model="q" type="search" enterkeyhint="search" placeholder="브랜드 · 모델 이름으로 찾기" aria-label="차량 검색" />
        <button v-if="q" type="button" class="picker__clear" aria-label="검색어 지우기" @click="q = ''"><Ico :src="IC.clear" /></button>
      </label>
      <ul v-if="q" class="picker__results">
        <li v-for="c in results" :key="c.id + c.trim"><button type="button" @click="pickTrim(c)"><b>{{ c.brand }} {{ c.model }}</b><span>{{ c.trim }}</span></button></li>
        <li v-if="!results.length" class="picker__none">「{{ q }}」에 맞는 차가 없어요</li>
      </ul>
      <template v-else>
        <div class="picker__hot">
          <button v-for="c in hot" :key="c.id" type="button" @click="brand = c.brand; pickSeries(c.model); step = 3">
            <img :src="asset(c.photo)" alt="" loading="lazy" /><span>{{ c.model }}</span>
          </button>
        </div>
        <div v-for="[k, list] in groups" :key="k" class="picker__group" :data-ini="k">
          <h3>{{ k }}</h3>
          <button v-for="b in list" :key="b.brand" type="button" class="picker__brand" @click="pickBrand(b.brand)">
            <span class="picker__logo"><img v-if="b.logo" :src="asset(b.logo)" alt="" loading="lazy" /></span>{{ b.brand }}
          </button>
        </div>
        <nav class="picker__index" aria-label="초성 색인">
          <button v-for="[k] in groups" :key="k" type="button" @click="jump(k)">{{ k }}</button>
        </nav>
      </template>
    </div>

    <div v-else-if="step === 2" class="picker__body">
      <p class="picker__crumb">{{ brand }}</p>
      <button v-for="s in seriesList" :key="s.model" type="button" class="picker__series" @click="pickSeries(s.model)">
        <img v-if="s.photo" :src="asset(s.photo)" alt="" loading="lazy" /><span v-else class="picker__noimg" />
        <span>{{ s.model }}</span>
      </button>
    </div>

    <div v-else class="picker__body picker__body--trim">
      <div class="picker__years" role="tablist" aria-label="연식">
        <button type="button" role="tab" :aria-selected="!year" :class="{ on: !year }" @click="year = ''">전체</button>
        <button v-for="y in years" :key="y" type="button" role="tab" :aria-selected="year === y" :class="{ on: year === y }" @click="year = y">{{ y }}</button>
      </div>
      <section v-for="[g, list] in trimGroups" :key="g">
        <h3 class="picker__tg">{{ g }}</h3>
        <button v-for="c in list" :key="c.trim" type="button" class="picker__trim" @click="pickTrim(c)">
          <b>{{ c.trim }}</b><span class="picker__tag">{{ ptLabel[c.powertrain] }}</span>
        </button>
      </section>
    </div>
  </div>
</template>
