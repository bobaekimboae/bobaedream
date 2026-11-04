<script setup lang="ts">
// 돌려서 고르는 칸(동처띠 上牌年月 · 当前行驶里程 · 过户次数 시트 실측: 가운데 줄이 선택, 위아래 흐림, 아래 「确定」).
// 열마다 세로로 스크롤해 가운데에 멈춘 값을 고른다. 키보드 ↑↓ 도 된다.
import { nextTick, onMounted, ref } from "vue";

const p = defineProps<{ cols: { options: string[]; value: string; suffix?: string; label: string }[] }>();
const emit = defineEmits<{ change: [number, string] }>();
const ROW = 40;
const els = ref<HTMLElement[]>([]);
let t: ReturnType<typeof setTimeout> | undefined;
const onScroll = (ci: number) => {
  clearTimeout(t);
  t = setTimeout(() => {
    const el = els.value[ci]; if (!el) return;
    const i = Math.max(0, Math.min(p.cols[ci]!.options.length - 1, Math.round(el.scrollTop / ROW)));
    emit("change", ci, p.cols[ci]!.options[i]!);
  }, 90);
};
const key = (ci: number, e: KeyboardEvent) => {
  const c = p.cols[ci]!; const i = c.options.indexOf(c.value);
  const n = e.key === "ArrowDown" ? i + 1 : e.key === "ArrowUp" ? i - 1 : i;
  if (n === i || n < 0 || n >= c.options.length) return;
  e.preventDefault(); emit("change", ci, c.options[n]!); els.value[ci]?.scrollTo({ top: n * ROW, behavior: "smooth" });
};
onMounted(async () => { await nextTick(); p.cols.forEach((c, ci) => { const i = Math.max(0, c.options.indexOf(c.value)); if (els.value[ci]) els.value[ci]!.scrollTop = i * ROW; }); });
</script>

<template>
  <div class="wheel">
    <i class="wheel__band" aria-hidden="true" />
    <div v-for="(c, ci) in cols" :key="ci" :ref="(el) => { if (el) els[ci] = el as HTMLElement; }" class="wheel__col" role="listbox" tabindex="0" :aria-label="c.label" :aria-activedescendant="`w${ci}-${c.options.indexOf(c.value)}`" @scroll.passive="onScroll(ci)" @keydown="key(ci, $event)">
      <div class="wheel__pad" />
      <div v-for="(o, i) in c.options" :id="`w${ci}-${i}`" :key="o" class="wheel__opt" role="option" :aria-selected="o === c.value" :class="{ on: o === c.value }" @click="els[ci]?.scrollTo({ top: i * 40, behavior: 'smooth' })">{{ o }}{{ c.suffix ?? "" }}</div>
      <div class="wheel__pad" />
    </div>
  </div>
</template>
