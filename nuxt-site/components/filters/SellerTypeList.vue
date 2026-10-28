<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-filter-panels.tsx 의 SellerTypeList(내보내지 않은 부품). onChange → emit("change", next)
import { asset } from "@proto/data";
import { toggleBbmCheck, type BbmFilterValues } from "@proto/filters/bbm-filter-state";
import { optionCount, sellerTypeOptions, type CountOf } from "../../lib/filters/bbm-filter-panels";

const props = defineProps<{ value: BbmFilterValues; countOf?: CountOf }>();
const emit = defineEmits<{ change: [next: BbmFilterValues] }>();
const rows = () => sellerTypeOptions.map((option) => {
  const count = optionCount(props.countOf, "sellerKind", option.label);
  const checked = Boolean(props.value.checks.sellerKind?.includes(option.label));
  return { option, count, checked, disabled: count === 0 && !checked };
});
</script>
<template>
  <div class="bbmf-seller-list" role="group" aria-label="판매자 유형">
    <button
      v-for="row in rows()"
      :key="row.option.label"
      type="button"
      role="checkbox"
      :aria-checked="row.checked"
      :aria-disabled="row.disabled || undefined"
      :disabled="row.disabled"
      :class="`bbmf-seller-row${row.option.description ? ' has-description' : ''}${row.checked ? ' is-checked' : ''}${row.disabled ? ' is-disabled' : ''}`"
      @click="emit('change', toggleBbmCheck(value, 'sellerKind', row.option.label))"
    >
      <i class="bbmf-seller-check" aria-hidden="true" />
      <span class="bbmf-seller-icon" aria-hidden="true"><img :src="asset(row.option.icon)" alt="" :draggable="false"></span>
      <span class="bbmf-seller-copy">
        <strong>{{ row.option.label }}</strong>
        <small v-if="row.option.description">{{ row.option.description }}</small>
      </span>
      <span v-if="row.count !== null && row.count !== undefined" class="bbmf-seller-count">{{ row.count.toLocaleString("ko-KR") }}</span>
    </button>
  </div>
</template>
