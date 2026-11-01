<script setup lang="ts">
// 초톳 앱 「Chọn …」 시트: 화면 위까지 차는 시트 · 왼쪽 X · 가운데 제목 · 회색 알약 검색(40) · 48 줄 · 오른쪽 라디오 20.
// 선택 = 노랑 동그라미 체크 → 보배드림 파랑 동그라미 + 흰 체크. 고르면 바로 닫힌다(초톳과 같음).
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import Ico from "./Ico.vue";
import { IC } from "../lib/icons";

export type Section = { title?: string; items: string[] };
// 주소 고르기(시·도 · 시·군·구 · 읍·면·동)는 초톳 「Chọn Tỉnh/Thành phố」처럼 테두리 검색칸(52)이 늘 보이고, 나머지는 회색 알약 검색(40)을 8개 넘을 때만 보인다.
const props = defineProps<{ title: string; sections: Section[]; value?: string; loading?: boolean; back?: boolean; searchBox?: boolean; searchPh?: string; clearable?: boolean }>();
const emit = defineEmits<{ pick: [string]; close: []; back: []; clear: [] }>();
const q = ref("");
const closeBtn = ref<HTMLButtonElement | null>(null);
const norm = (s: string) => s.replace(/\s|-/g, "").toLowerCase();
const shown = computed(() => {
  const k = norm(q.value);
  if (!k) return props.sections;
  return [{ items: props.sections.flatMap((s) => s.items).filter((i) => norm(i).includes(k)) }];
});
const showSearch = computed(() => props.searchBox || props.loading || props.sections.reduce((n, s) => n + s.items.length, 0) > 8);
let prevOverflow = "";
const onKey = (e: KeyboardEvent) => {
  if (e.key === "Escape") emit("close");
};
onMounted(async () => {
  document.addEventListener("keydown", onKey);
  prevOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  await nextTick();
  closeBtn.value?.focus({ preventScroll: true });
});
onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKey);
  document.body.style.overflow = prevOverflow;
});
</script>
<template>
  <div class="layer">
  <div class="dim dim--picker" @click="emit('close')" />
  <section class="sheet sheet--full sheet--picker" :class="{ 'sheet--addr': searchBox }" role="dialog" aria-modal="true" :aria-label="title">
    <header class="sheet__head">
      <button v-if="back" ref="closeBtn" type="button" class="sheet__back" aria-label="이전" @click="emit('back')"><Ico :src="IC.back" /></button>
      <button v-else ref="closeBtn" type="button" class="sheet__x" aria-label="닫기" @click="emit('close')"><Ico :src="IC.close" /></button>
      <h2>{{ title }}</h2>
    </header>
    <label v-if="showSearch" class="sheet__search" :class="{ 'is-box': searchBox }">
      <Ico :src="searchBox ? IC.searchDark : IC.search" />
      <input v-model="q" type="search" :placeholder="searchPh || '검색'" :aria-label="`${title} 검색`" />
    </label>
    <div class="sheet__list" role="radiogroup" :aria-label="title">
      <p v-if="loading" class="sheet__empty">불러오는 중…</p>
      <template v-for="(s, i) in shown" v-else :key="i">
        <p v-if="s.title" class="sheet__sec">{{ s.title }}</p>
        <button v-for="it in s.items" :key="it" type="button" class="opt" :class="{ 'is-on': it === value }" role="radio" :aria-checked="it === value" @click="emit('pick', it)">
          <span>{{ it }}</span>
          <span class="radio"><Ico v-if="it === value" :src="IC.check" /></span>
        </button>
      </template>
      <p v-if="!loading && !shown.some((s) => s.items.length)" class="sheet__empty">{{ q ? "검색 결과가 없어요" : "고를 항목이 없어요" }}</p>
      <slot />
    </div>
    <footer v-if="clearable && value && !loading" class="sheet__foot sheet__foot--clear">
      <button type="button" class="btn btn--line btn--block" @click="emit('clear')">선택 지우기</button>
    </footer>
  </section>
  </div>
</template>
