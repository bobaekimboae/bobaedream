<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-filter-panels.tsx 의 BodyTypeList(내보내지 않은 부품). onChange → emit("change", next)
import { asset } from "@proto/data";
import { bbmCheckOptions } from "@proto/filters/bbm-filter-options";
import { toggleBbmCheck, type BbmFilterValues } from "@proto/filters/bbm-filter-state";
import { bodyTypeIcons, externalBodyTypes, optionCount, type CountOf } from "../../lib/filters/bbm-filter-panels";
import ExternalLinkIcon from "../icons/ExternalLinkIcon.vue";

const props = defineProps<{ value: BbmFilterValues; countOf?: CountOf }>();
const emit = defineEmits<{ change: [next: BbmFilterValues] }>();
const rows = () => bbmCheckOptions.bodyType.map((label) => ({
  label,
  checked: Boolean(props.value.checks.bodyType?.includes(label)),
  count: optionCount(props.countOf, "bodyType", label),
  external: externalBodyTypes.has(label),
}));
</script>
<template>
  <div class="bbmf-body-type-list" role="group" aria-label="바디타입">
    <button
      v-for="row in rows()"
      :key="row.label"
      type="button"
      role="checkbox"
      :aria-checked="row.checked"
      :class="`bbmf-body-type-row${row.checked ? ' is-checked' : ''}`"
      @click="emit('change', toggleBbmCheck(value, 'bodyType', row.label))"
    >
      <i class="bbmf-seller-check" aria-hidden="true" />
      <span class="bbmf-seller-icon" aria-hidden="true"><img :src="asset(bodyTypeIcons[row.label])" alt="" :draggable="false"></span>
      <span class="bbmf-body-type-label">{{ row.label }}</span>
      <ExternalLinkIcon v-if="row.external" class="bbmf-body-type-external" aria-label="별도 페이지에서 보기" />
      <span v-else-if="row.count !== null && row.count !== undefined" class="bbmf-seller-count">{{ row.count.toLocaleString("ko-KR") }}</span>
    </button>
  </div>
</template>
