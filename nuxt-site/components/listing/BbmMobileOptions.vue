<script setup lang="ts" generic="T extends string">
// 리액트 bbm-list.tsx 의 BbmMobileOptions(모바일 목록 제어 줄: 숏폼매물 · 판매자 · 정렬 · 보기 방식).
// onToggleVideo → emit("toggleVideo"), onSort → "sort", onSellerChange(tab) → "sellerChange", onView → "view". extra(ReactNode) → 이름 있는 slot #extra
import { computed } from "vue";
import { bbmIcon } from "@proto/listing/bbm-list";
import "@proto/listing/bbm-tokens.css";
import "@proto/listing/thumbnail-states.css";
import Cross2Icon from "../icons/Cross2Icon.vue";

const props = withDefaults(defineProps<{
  videoOnly: boolean;
  sortLabel: string;
  sellerTabs: readonly T[];
  sellerValue: string;
  viewMode: string;
  groupLabel?: string;
  navigationLabel?: string;
}>(), { groupLabel: "숏폼카와 판매자 유형", navigationLabel: "정렬, 숏폼카, 판매자 유형과 보기 방식" });
const emit = defineEmits<{ toggleVideo: []; sort: []; sellerChange: [tab: T]; view: [] }>();
defineSlots<{ extra?(): unknown }>();
const viewIcon = computed(() => (props.viewMode === "갤러리로 보기" ? "view-list-chotot-v02" : "view-grid-chotot-v02"));
</script>
<template>
  <nav class="bbm-m-options" :aria-label="navigationLabel">
    <div class="bbm-m-filter-tabs" role="group" :aria-label="groupLabel">
      <button type="button" :class="`bbm-m-filter-tab${videoOnly ? ' is-selected' : ''}`" :aria-pressed="videoOnly" @click="emit('toggleVideo')">
        <span>숏폼카</span><Cross2Icon v-if="videoOnly" class="bbm-m-filter-clear" aria-hidden="true" />
      </button>
      <button v-for="tab in sellerTabs" :key="tab" type="button" :class="`bbm-m-filter-tab${sellerValue === tab ? ' is-selected' : ''}`" :aria-pressed="sellerValue === tab" @click="emit('sellerChange', tab)">
        <span>{{ tab }}</span><Cross2Icon v-if="sellerValue === tab" class="bbm-m-filter-clear" aria-hidden="true" />
      </button>
    </div>
    <slot name="extra" />
    <button type="button" class="bbm-m-sort" @click="emit('sort')"><span>{{ sortLabel }}</span><img :src="bbmIcon('toolbar-sort-chevron')" alt="" aria-hidden="true" /></button>
    <button type="button" class="bbm-m-view" aria-label="보기 방식 선택" @click="emit('view')"><img :src="bbmIcon(viewIcon)" alt="" aria-hidden="true" /></button>
  </nav>
</template>
