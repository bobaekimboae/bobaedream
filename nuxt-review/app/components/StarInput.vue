<script setup lang="ts">
// 별점 고르기(동처띠 작성 화면 실측): 별 하나를 왼쪽 · 오른쪽 절반으로 나눠 0.5점씩.
// 누르면 그 별 위에 「반 별 · 온 별」 고르기 상자가 잠깐 떠서 바로 바꿀 수 있다(원본: 고른 칸 #FFFAEB · 노랑 테두리, 1.5초 뒤 사라짐).
// 키보드: ← → 로 0.5점씩, Home/End 로 0.5/5.
import { onBeforeUnmount, ref } from "vue";
import { IC } from "../lib/icons";
import { starPop } from "../lib/ui";
const p = defineProps<{ modelValue: number; label: string; disabled?: boolean }>();
const emit = defineEmits<{ "update:modelValue": [number]; blocked: [] }>();
const pop = ref(0);
let t: ReturnType<typeof setTimeout> | undefined;
const fill = (i: number) => Math.max(0, Math.min(1, p.modelValue - i)) * 100;
const set = (v: number, from?: number) => {
  if (p.disabled) return emit("blocked");
  emit("update:modelValue", Math.max(0.5, Math.min(5, v)));
  if (from) {
    pop.value = from;
    starPop.key = p.label;
    clearTimeout(t);
    t = setTimeout(() => (pop.value = 0), 1500);
  }
};
const onKey = (e: KeyboardEvent) => {
  const map: Record<string, number> = { ArrowRight: p.modelValue + 0.5, ArrowUp: p.modelValue + 0.5, ArrowLeft: p.modelValue - 0.5, ArrowDown: p.modelValue - 0.5, Home: 0.5, End: 5 };
  if (e.key in map) { e.preventDefault(); set(map[e.key]!); }
};
onBeforeUnmount(() => clearTimeout(t));
</script>
<template>
  <span class="star-in" :class="{ 'is-off': disabled }" role="slider" tabindex="0" :aria-label="`${label} 별점`" aria-valuemin="0" aria-valuemax="5" :aria-valuenow="modelValue" :aria-valuetext="modelValue ? `${modelValue.toFixed(1)}점` : '선택 안 함'" @keydown="onKey">
    <span v-for="i in 5" :key="i" class="star-in__one">
      <i class="star-in__bg" :style="{ '--src': `url('${IC.star}')` }" />
      <i class="star-in__fg" :style="{ '--src': `url('${IC.star}')`, width: `${fill(i - 1)}%` }" />
      <button type="button" class="star-in__half star-in__half--l" tabindex="-1" :aria-label="`${i - 0.5}점`" @click="set(i - 0.5, i)" />
      <button type="button" class="star-in__half star-in__half--r" tabindex="-1" :aria-label="`${i}점`" @click="set(i, i)" />
    </span>
    <span v-if="pop && starPop.key === label" class="star-pop" :style="{ left: `${Math.min((pop - 1) * 30 + 10, 110)}px` }" @click.stop>
      <button type="button" :class="{ on: modelValue === pop - 0.5 }" :aria-label="`${pop - 0.5}점`" @click="set(pop - 0.5, pop)"><i class="star-pop__s" :style="{ '--src': `url('${IC.star}')` }"><b /></i><small>{{ (pop - 0.5).toFixed(1) }}점</small></button>
      <button type="button" :class="{ on: modelValue === pop }" :aria-label="`${pop}점`" @click="set(pop, pop)"><i class="star-pop__s star-pop__s--full" :style="{ '--src': `url('${IC.star}')` }" /><small>{{ pop.toFixed(1) }}점</small></button>
    </span>
  </span>
</template>
