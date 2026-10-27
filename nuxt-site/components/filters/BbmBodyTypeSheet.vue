<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-filter-panels.tsx 의 BbmBodyTypeSheet
// onApply → emit("apply", next), onClose → emit("close"). countWith·countOf 는 값을 돌려받으므로 함수 prop 그대로
import { computed, shallowRef } from "vue";
import { setBbmChecks, type BbmFilterValues } from "@proto/filters/bbm-filter-state";
import type { CountOf } from "../../lib/filters/bbm-filter-panels";
import BbmSheet from "./BbmSheet.vue";
import BodyTypeList from "./BodyTypeList.vue";

const props = defineProps<{ value: BbmFilterValues; countWith: (next: BbmFilterValues) => number; countOf?: CountOf }>();
const emit = defineEmits<{ apply: [next: BbmFilterValues]; close: [] }>();
const draft = shallowRef<BbmFilterValues>({
  ...props.value,
  checks: { ...props.value.checks, bodyType: [...(props.value.checks.bodyType ?? [])] },
  order: [...(props.value.order ?? [])],
});
const selected = computed(() => draft.value.checks.bodyType ?? []);
const resultCount = computed(() => props.countWith(draft.value));
const confirm = () => { emit("apply", draft.value); emit("close"); };
</script>
<template>
  <BbmSheet title="바디타입" subtitle="차량의 용도가 아닌 외형을 기준으로 분류하는 필터입니다." variant="body-type" @close="emit('close')">
    <BodyTypeList :value="draft" :count-of="countOf" @change="draft = $event" />
    <template #footer>
      <div class="bbmf-seller-actions"><button type="button" class="bbmf-seller-reset" :disabled="!selected.length" @click="draft = setBbmChecks(draft, 'bodyType', [])">초기화</button><button type="button" class="bbmf-seller-confirm" @click="confirm">{{ resultCount.toLocaleString("ko-KR") }}대 보기</button></div>
    </template>
  </BbmSheet>
</template>
