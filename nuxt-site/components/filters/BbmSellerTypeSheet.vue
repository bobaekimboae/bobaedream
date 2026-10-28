<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-filter-panels.tsx 의 BbmSellerTypeSheet
// onApply → emit("apply", next), onClose → emit("close"). countWith·countOf 는 값을 돌려받으므로 함수 prop 그대로
import { computed, shallowRef } from "vue";
import { setBbmChecks, type BbmFilterValues } from "@proto/filters/bbm-filter-state";
import type { CountOf } from "../../lib/filters/bbm-filter-panels";
import BbmSheet from "./BbmSheet.vue";
import SellerTypeList from "./SellerTypeList.vue";

const props = defineProps<{ value: BbmFilterValues; countWith: (next: BbmFilterValues) => number; countOf?: CountOf }>();
const emit = defineEmits<{ apply: [next: BbmFilterValues]; close: [] }>();
const draft = shallowRef<BbmFilterValues>({
  ...props.value,
  checks: { ...props.value.checks, sellerKind: [...(props.value.checks.sellerKind ?? [])] },
  order: [...(props.value.order ?? [])],
});
const selected = computed(() => draft.value.checks.sellerKind ?? []);
const resultCount = computed(() => props.countWith(draft.value));
const confirm = () => { emit("apply", draft.value); emit("close"); };
</script>
<template>
  <BbmSheet title="판매자 유형" variant="seller" @close="emit('close')">
    <SellerTypeList :value="draft" :count-of="countOf" @change="draft = $event" />
    <template #footer>
      <div class="bbmf-seller-actions">
        <button
          type="button"
          class="bbmf-seller-reset"
          :disabled="!selected.length"
          @click="draft = setBbmChecks(draft, 'sellerKind', [])"
        >초기화</button>
        <button
          type="button"
          class="bbmf-seller-confirm"
          :aria-label="`${resultCount.toLocaleString('ko-KR')}대 보기`"
          @click="confirm"
        >{{ resultCount.toLocaleString("ko-KR") }}대 보기</button>
      </div>
    </template>
  </BbmSheet>
</template>
