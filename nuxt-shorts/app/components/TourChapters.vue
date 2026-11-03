<!--
  비디오 투어 부위 아이콘 줄(카스24형). 아이콘 = 노션 「호주_카스 24」 원본(남색 + 주황, 파일 수정 없음).
  지금 부위는 주황 고리, 누르면 그 부위 장면으로 간다. 부위 줄 위에 부위별 진행 막대.
-->
<script setup lang="ts">
import { nextTick, ref, watch } from "vue";
import { chapterIcon, chapterLabel, chapterShort } from "~/lib/chapters";
import type { Chapter } from "~/lib/types";

const props = defineProps<{ chapters: Chapter[]; now: number; progress: number }>();
const emit = defineEmits<{ seek: [i: number] }>();
const row = ref<HTMLElement | null>(null);
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
watch(
  () => props.now,
  async (i) => {
    await nextTick();
    const el = row.value?.children[i] as HTMLElement | undefined;
    if (!el) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ inline: "nearest", block: "nearest", behavior: reduce ? "auto" : "smooth" });
  },
);
</script>
<template>
  <div class="tour">
    <div class="tour__bar" aria-hidden="true">
      <i v-for="(c, i) in chapters" :key="i" :style="{ flexGrow: c.to - c.from }">
        <b :style="{ width: i < now ? '100%' : i === now ? `${Math.round(progress * 100)}%` : '0%' }" />
      </i>
    </div>
    <div ref="row" class="tour__row" role="group" aria-label="비디오 투어 부위로 이동">
      <button
        v-for="(c, i) in chapters"
        :key="c.key + i"
        type="button"
        :class="['tour__chip', { 'is-now': i === now }]"
        :aria-current="i === now ? 'true' : undefined"
        :aria-label="`${chapterLabel(c.key)} 장면으로 이동 · ${mmss(c.to - c.from)}`"
        @click.stop="emit('seek', i)"
      >
        <span class="tour__ring"><img :src="chapterIcon(c.key)" alt="" draggable="false" /></span>
        <span class="tour__name">{{ chapterShort(c.key) }}</span>
      </button>
    </div>
  </div>
</template>
