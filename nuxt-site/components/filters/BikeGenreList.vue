<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-filter-panels.tsx 의 BikeGenreList(내보내지 않은 부품). onChange → emit("change", next)
import { asset } from "@proto/data";
import { bbmCheckOptions } from "@proto/filters/bbm-filter-options";
import { toggleBbmCheck, type BbmFilterValues } from "@proto/filters/bbm-filter-state";
import { bikeGenreImages, optionCount, type CountOf } from "../../lib/filters/bbm-filter-panels";

const props = defineProps<{ value: BbmFilterValues; countOf?: CountOf }>();
const emit = defineEmits<{ change: [next: BbmFilterValues] }>();
const rows = () => bbmCheckOptions.bikeGenre.map((label) => {
  const checked = Boolean(props.value.checks.bikeGenre?.includes(label));
  const count = optionCount(props.countOf, "bikeGenre", label);
  return { label, checked, count, disabled: count === 0 && !checked, image: bikeGenreImages[label] };
});
</script>
<template>
  <div class="bbmf-bike-genre-wrap">
    <p class="bbmf-bike-genre-guide">유형을 이미지로 확인하고 복수 선택할 수 있습니다.</p>
    <div class="bbmf-bike-genre-list" role="group" aria-label="바이크 장르">
      <button
        v-for="row in rows()"
        :key="row.label"
        type="button"
        role="checkbox"
        :aria-checked="row.checked"
        :aria-disabled="row.disabled || undefined"
        :disabled="row.disabled"
        :class="`bbmf-bike-genre-row${row.checked ? ' is-checked' : ''}${row.disabled ? ' is-disabled' : ''}`"
        @click="emit('change', toggleBbmCheck(value, 'bikeGenre', row.label))"
      >
        <span :class="`bbmf-bike-genre-image${row.image ? ' has-image' : ' is-pending'}`" aria-hidden="true">
          <img v-if="row.image" :src="asset(row.image)" alt="" :draggable="false">
        </span>
        <span class="bbmf-bike-genre-label">{{ row.label }}</span>
        <span v-if="row.count !== null && row.count !== undefined" class="bbmf-bike-genre-count">{{ row.count.toLocaleString("ko-KR") }}</span>
        <i class="bbmf-bike-genre-check" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>
