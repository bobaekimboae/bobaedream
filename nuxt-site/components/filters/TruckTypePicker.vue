<script setup lang="ts">
// 리액트 src/prototype/filters/truck-type-picker.tsx 의 TruckTypePicker. onClose → emit("close")
// value(BbTruckFilter)는 함수(countForSelection · onApplySelection)를 담은 객체라 그대로 prop 으로 받는다.
// 원본은 desktop 이면 BbmModal, 아니면 BbmSheet 로 같은 본문을 감싼다 → 두 갈래로 같은 본문을 그린다(모달에는 onBack 을 주지 않음).
import { computed, ref, shallowRef, watch } from "vue";
import { asset } from "@proto/data";
import { truckFormatImageFor, truckSubtypeImageFor, truckSubtypeSecondaryLabel, truckTypeTree, type TruckTypeNode } from "@proto/data/truck-format-catalog";
import type { BbTruckFilter } from "@proto/listing/pc-bbmuseum";
import BbmActionBar from "./BbmActionBar.vue";
import BbmModal from "./BbmModal.vue";
import BbmSheet from "./BbmSheet.vue";
import "@proto/filters/truck-type-picker.css";

const props = defineProps<{ desktop: boolean; open: boolean; value: BbTruckFilter }>();
const emit = defineEmits<{ close: [] }>();

const nodeValue = (node: TruckTypeNode) => node.value ?? node.label;
const descendantValues = (node: TruckTypeNode): string[] => [nodeValue(node), ...(node.children ?? []).flatMap(descendantValues)];

const path = shallowRef<TruckTypeNode[]>([]);
const format = ref<string | null>(props.value.format);
const subtype = ref<string | null>(props.value.subtype);

watch([() => props.open, () => props.value.format, () => props.value.subtype], () => {
  if (!props.open) return;
  format.value = props.value.format;
  subtype.value = props.value.subtype;
  path.value = [];
}, { immediate: true });

const current = computed(() => path.value.at(-1) ?? null);
const options = computed(() => current.value?.children ?? truckTypeTree);
const root = computed(() => path.value[0] ?? null);
const formatCount = (next: string) => props.value.countForSelection(next);
const subtypeCount = (next: string) => root.value ? props.value.countForSelection(nodeValue(root.value), next) : 0;
const nodeCount = (node: TruckTypeNode) => {
  if (!current.value) return formatCount(nodeValue(node));
  const values = descendantValues(node);
  return values.reduce((sum, next) => sum + subtypeCount(next), 0);
};
const selected = (node: TruckTypeNode) => !current.value
  ? format.value === nodeValue(node) && !subtype.value
  : format.value === nodeValue(root.value!) && subtype.value === nodeValue(node);
const selectedWithin = (node: TruckTypeNode) => current.value && format.value === nodeValue(root.value!) && Boolean(subtype.value && descendantValues(node).includes(subtype.value));
const draftCount = computed(() => {
  if (!format.value) return props.value.formats.reduce((sum, option) => sum + option.count, 0);
  if (!subtype.value) return formatCount(format.value);
  return props.value.countForSelection(format.value, subtype.value);
});

const choose = (node: TruckTypeNode) => {
  const next = nodeValue(node);
  if (!current.value) {
    if (format.value === next && !subtype.value) format.value = null;
    else { format.value = next; subtype.value = null; }
    return;
  }
  const nextFormat = nodeValue(root.value!);
  if (format.value === nextFormat && subtype.value === next) subtype.value = null;
  else { format.value = nextFormat; subtype.value = next; }
};
const drill = (node: TruckTypeNode) => { path.value = [...path.value, node]; };
const reset = () => { format.value = null; subtype.value = null; path.value = []; };
const apply = () => { props.value.onApplySelection(format.value, subtype.value); emit("close"); };
const title = computed(() => current.value?.label ?? "트럭 유형");
const goBack = () => { path.value = path.value.slice(0, -1); };
const rows = computed(() => options.value.map((node) => {
  const next = nodeValue(node);
  const count = nodeCount(node);
  const image = current.value ? truckSubtypeImageFor(nodeValue(root.value!), next) : truckFormatImageFor(next);
  const secondaryLabel = current.value ? truckSubtypeSecondaryLabel(nodeValue(root.value!), next) : null;
  const isSelected = selected(node);
  const isPartial = !isSelected && Boolean(selectedWithin(node));
  return { node, next, count, hasChildren: Boolean(node.children?.length), image, secondaryLabel, isSelected, isPartial };
}));
const chevron = asset("icons/bb/chevron-left.svg");
</script>
<template>
  <template v-if="open">
    <BbmModal v-if="desktop" :title="title" flush @close="emit('close')">
      <div class="truck-type-picker" :aria-label="`${title} 선택`">
        <button v-if="current" type="button" class="truck-type-picker-back" @click="goBack"><img :src="chevron" alt="" aria-hidden="true">{{ title }}</button>
        <div class="truck-type-picker-list">
          <div v-for="row in rows" :key="row.next" :class="`truck-type-picker-row${row.isSelected ? ' is-selected' : ''}${row.isPartial ? ' is-partial' : ''}${row.count === 0 ? ' is-zero' : ''}`">
            <button type="button" class="truck-type-picker-select" role="checkbox" :aria-checked="row.isPartial ? 'mixed' : row.isSelected" :aria-label="`${row.node.label}, ${row.count.toLocaleString('ko-KR')}대 선택`" :disabled="row.count === 0" @click="choose(row.node)">
              <span class="truck-type-picker-check" aria-hidden="true" />
              <span class="truck-type-picker-image"><img v-if="row.image" :src="asset(row.image)" alt="" aria-hidden="true" :draggable="false"></span>
              <span class="truck-type-picker-label">{{ row.node.label }}<small v-if="row.secondaryLabel">{{ row.secondaryLabel }}</small></span>
              <span class="truck-type-picker-count">{{ row.count.toLocaleString("ko-KR") }}</span>
            </button>
            <button v-if="row.hasChildren" type="button" class="truck-type-picker-drill" :aria-label="`${row.node.label} 하위 유형 보기`" @click="drill(row.node)"><img :src="chevron" alt="" aria-hidden="true"></button>
          </div>
        </div>
      </div>
      <template #footer><BbmActionBar variant="modal" confirm-style="보기" :count="draftCount" @reset="reset" @confirm="apply" /></template>
    </BbmModal>
    <BbmSheet v-else :title="title" flush :show-back="Boolean(current)" @close="emit('close')" @back="goBack">
      <div class="truck-type-picker" :aria-label="`${title} 선택`">
        <div class="truck-type-picker-list">
          <div v-for="row in rows" :key="row.next" :class="`truck-type-picker-row${row.isSelected ? ' is-selected' : ''}${row.isPartial ? ' is-partial' : ''}${row.count === 0 ? ' is-zero' : ''}`">
            <button type="button" class="truck-type-picker-select" role="checkbox" :aria-checked="row.isPartial ? 'mixed' : row.isSelected" :aria-label="`${row.node.label}, ${row.count.toLocaleString('ko-KR')}대 선택`" :disabled="row.count === 0" @click="choose(row.node)">
              <span class="truck-type-picker-check" aria-hidden="true" />
              <span class="truck-type-picker-image"><img v-if="row.image" :src="asset(row.image)" alt="" aria-hidden="true" :draggable="false"></span>
              <span class="truck-type-picker-label">{{ row.node.label }}<small v-if="row.secondaryLabel">{{ row.secondaryLabel }}</small></span>
              <span class="truck-type-picker-count">{{ row.count.toLocaleString("ko-KR") }}</span>
            </button>
            <button v-if="row.hasChildren" type="button" class="truck-type-picker-drill" :aria-label="`${row.node.label} 하위 유형 보기`" @click="drill(row.node)"><img :src="chevron" alt="" aria-hidden="true"></button>
          </div>
        </div>
      </div>
      <!-- 모바일은 기본 전체 필터와 같은 하단 액션(초기화 112px + 파란 보기 버튼)을 쓴다. -->
      <template #footer><BbmActionBar variant="full" confirm-style="보기" :count="draftCount" @reset="reset" @confirm="apply" /></template>
    </BbmSheet>
  </template>
</template>
