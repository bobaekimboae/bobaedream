<script setup lang="ts">
// PC 왼쪽 「등록 준비」: 꼭 채울 칸을 한눈에 보고, 누르면 그 칸으로 이동한다(앱에는 없음 — PC는 화면이 길어 빠진 칸을 찾기 어렵다).
import { computed } from "vue";

export type CheckItem = { key: string; label: string; done: boolean };
const props = defineProps<{ items: CheckItem[]; tried?: boolean }>();
const emit = defineEmits<{ go: [string] }>();
const doneN = computed(() => props.items.filter((i) => i.done).length);
const pct = computed(() => (props.items.length ? Math.round((doneN.value / props.items.length) * 100) : 0));
</script>
<template>
  <section class="card check pc-only" aria-labelledby="check-title">
    <div class="check__head">
      <h2 id="check-title">등록 준비</h2>
      <span class="check__n"><b>{{ doneN }}</b>/{{ items.length }}</span>
    </div>
    <div class="check__bar" role="progressbar" :aria-valuenow="pct" aria-valuemin="0" aria-valuemax="100" aria-label="필수 항목 채운 정도"><i :style="{ width: `${pct}%` }" /></div>
    <ul class="check__list">
      <li v-for="it in items" :key="it.key">
        <button type="button" class="check__item" :class="{ 'is-done': it.done, 'is-miss': tried && !it.done }" @click="emit('go', it.key)">
          <span class="check__dot" aria-hidden="true">
            <svg v-if="it.done" viewBox="0 0 16 16" width="12" height="12"><path d="M3.5 8.4 6.6 11.4 12.5 4.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </span>
          <span class="check__label">{{ it.label }}</span>
          <span class="check__state">{{ it.done ? "완료" : tried ? "빠졌어요" : "채우기" }}</span>
        </button>
      </li>
    </ul>
  </section>
</template>
