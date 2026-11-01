<script setup lang="ts">
// 여러 개 고르기 시트(테스트 서버 「차량 옵션」 항목을 초톳 시트 모양으로).
// 초톳 「Chọn …」 시트와 같은 머리 · 검색 · 48 줄에 오른쪽 네모 체크 20, 아래 고정 「초기화 · N개 적용」. 고른 것은 「적용」을 눌러야 들어간다.
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import Ico from "./Ico.vue";
import { IC } from "../lib/icons";

const props = defineProps<{ title: string; groups: { title: string; items: string[] }[]; value: string[] }>();
const emit = defineEmits<{ apply: [string[]]; close: [] }>();
const draft = ref(new Set(props.value));
const q = ref("");
const closeBtn = ref<HTMLButtonElement | null>(null);
const norm = (s: string) => s.replace(/\s|-/g, "").toLowerCase();
const shown = computed(() => {
  const k = norm(q.value);
  if (!k) return props.groups;
  return props.groups.map((g) => ({ ...g, items: g.items.filter((i) => norm(i).includes(k)) })).filter((g) => g.items.length);
});
const toggle = (it: string) => {
  const s = new Set(draft.value);
  if (s.has(it)) s.delete(it);
  else s.add(it);
  draft.value = s;
};
const order = computed(() => props.groups.flatMap((g) => g.items));
const apply = () => emit("apply", order.value.filter((i) => draft.value.has(i)));
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
    <section class="sheet sheet--full sheet--picker" role="dialog" aria-modal="true" :aria-label="title">
      <header class="sheet__head">
        <button ref="closeBtn" type="button" class="sheet__x" aria-label="닫기" @click="emit('close')"><Ico :src="IC.close" /></button>
        <h2>{{ title }}</h2>
      </header>
      <label class="sheet__search">
        <Ico :src="IC.search" />
        <input v-model="q" type="search" placeholder="검색" :aria-label="`${title} 검색`" />
      </label>
      <div class="sheet__list">
        <template v-for="g in shown" :key="g.title">
          <p class="sheet__sec">{{ g.title }}</p>
          <button v-for="it in g.items" :key="it" type="button" class="opt" :class="{ 'is-on': draft.has(it) }" role="checkbox" :aria-checked="draft.has(it)" @click="toggle(it)">
            <span>{{ it }}</span>
            <span class="box"><Ico v-if="draft.has(it)" :src="IC.check" /></span>
          </button>
        </template>
        <p v-if="!shown.length" class="sheet__empty">검색 결과가 없어요</p>
      </div>
      <footer class="sheet__foot sheet__foot--two">
        <button type="button" class="btn btn--line" :disabled="!draft.size" @click="draft = new Set()">초기화</button>
        <button type="button" class="btn btn--pri" @click="apply">{{ draft.size ? `${draft.size}개 적용` : "적용" }}</button>
      </footer>
    </section>
  </div>
</template>
