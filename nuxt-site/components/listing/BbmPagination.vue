<script setup lang="ts">
// 리액트 bbm-list-area.tsx 의 BbmPagination(원본 ui-pagination). onChange(page) → emit("change", page)
// 번호 묶음: PC 10개 · 모바일 3개, 끝에서는 묶음을 앞으로 당겨 채운다. 첫 페이지에서는 [첫·이전], 마지막 페이지에서는 [다음·마지막]을 숨긴다
import { computed } from "vue";
import { bbmPageWindow } from "@proto/listing/bbm-list-area";
import { bbmIcon } from "@proto/listing/bbm-list";
import "@proto/listing/bbm-list-area.css";

const props = defineProps<{ page: number; total: number; windowSize: number }>();
const emit = defineEmits<{ change: [page: number] }>();
const pages = computed(() => bbmPageWindow(props.page, props.total, props.windowSize));
const controls = computed(() => ({
  first: { label: "첫 페이지", target: 1, hidden: props.page <= 1, icon: "pagination-double", left: true },
  prev: { label: "이전 페이지", target: props.page - 1, hidden: props.page <= 1, icon: "pagination-single", left: true },
  next: { label: "다음 페이지", target: props.page + 1, hidden: props.page >= props.total, icon: "pagination-single", left: false },
  last: { label: "마지막 페이지", target: props.total, hidden: props.page >= props.total, icon: "pagination-double", left: false },
}));
</script>
<template>
  <div class="car-list-pagination">
    <nav class="ui-pagination" aria-label="페이지네이션">
      <button v-for="c in [controls.first, controls.prev]" :key="c.label" type="button" class="ui-pagination__control" :disabled="c.hidden" :aria-label="c.label" :style="c.hidden ? { display: 'none' } : undefined" @click="emit('change', c.target)">
        <img :class="`ui-pagination__icon${c.left ? ' ui-pagination__icon--left' : ''}`" :src="bbmIcon(c.icon)" alt="" aria-hidden="true" />
      </button>
      <ol class="ui-pagination__pages">
        <li v-for="number in pages" :key="number" class="ui-pagination__page-item">
          <button type="button" :class="`ui-pagination__page${number === page ? ' is-active' : ''}`" :aria-current="number === page ? 'page' : undefined" :aria-label="`${number} 페이지`" @click="emit('change', number)">{{ number }}</button>
        </li>
      </ol>
      <button v-for="c in [controls.next, controls.last]" :key="c.label" type="button" class="ui-pagination__control" :disabled="c.hidden" :aria-label="c.label" :style="c.hidden ? { display: 'none' } : undefined" @click="emit('change', c.target)">
        <img :class="`ui-pagination__icon${c.left ? ' ui-pagination__icon--left' : ''}`" :src="bbmIcon(c.icon)" alt="" aria-hidden="true" />
      </button>
    </nav>
  </div>
</template>
