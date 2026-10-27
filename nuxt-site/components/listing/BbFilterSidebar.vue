<script setup lang="ts">
// 원본: src/prototype/listing/pc-bbmuseum.tsx BbFilterSidebar
// 대응: onReset → emit reset · onNotify → emit notify(message) · onBbmChange → emit bbmChange(next)
//       leadingFilters(ReactNode) → 이름 있는 slot "leadingFilters"
//       countWithBbm · countOf 는 값을 돌려받는 함수라 함수 prop 그대로.
// resetSignal: 값이 바뀔 때마다 "초기화" 확인 창을 연다(QF-093 왼쪽 펼침판 아래 [초기화] 버튼용)
// brandLogos: 과쯔 모드만 제조사 행 앞에 로고 24×24(QF-096). 초톳·동처띠 PC 는 그대로
import { computed, ref, shallowRef, watch } from "vue";
import BbSwitch from "./BbSwitch.vue";
import BbMakerGradeFilter from "./BbMakerGradeFilter.vue";
import BbTruckFormatFilter from "./BbTruckFormatFilter.vue";
import BbmModal from "../filters/BbmModal.vue";
import BbmActionBar from "../filters/BbmActionBar.vue";
import BbmExpandPanel from "../filters/BbmExpandPanel.vue";
import BbmModalPanel from "../filters/BbmModalPanel.vue";
import PriceFinalSheet from "../filters/PriceFinalSheet.vue";
import { daangnFilterLabel, splitDaangnFilterOrder, type BbmFilterItem } from "@proto/filters/bbm-filter-options";
import { clearBbmItem } from "@proto/filters/bbm-filter-panels";
import { bbmItemValue } from "@proto/filters/bbm-applied";
import type { BbmCheckKey, BbmFilterValues } from "@proto/filters/bbm-filter-state";
import { bbCatalog, bbMakerLabel, type BbMakerSection, type BbMakerSelection, type BbTruckFilter } from "@proto/listing/pc-bbmuseum";
import {
  bbFilterItemByLabel, bbFilterMenuOriginal, bbMakerItem, bbmAsset, charanchaAlwaysOpen, charanchaFilterLabels, charanchaFilterOrder, type BbDrillView,
} from "../../lib/listing/pc-bbmuseum-internal";

const props = withDefaults(defineProps<{
  mileageFinal?: boolean; priceFinal?: boolean; pricePresets?: string[]; order?: string[]; selection: BbMakerSelection; appliedCount: number; historyCount?: number;
  bbm: BbmFilterValues; countWithBbm: (next: BbmFilterValues) => number; countOf?: (key: BbmCheckKey, option: string) => number | null; resetSignal?: number;
  brandLogos?: boolean; brandLogoCategory?: string; makerSections?: BbMakerSection[]; truckFilter?: BbTruckFilter; collapsible?: boolean; referenceMakerFlow?: boolean;
  makerOpenByDefault?: boolean; singleOpen?: boolean; showMakerCounts?: boolean; allowEmptyMakerOptions?: boolean; makerLabel?: string;
}>(), {
  mileageFinal: false, priceFinal: false, pricePresets: undefined, order: () => bbFilterMenuOriginal, historyCount: undefined, countOf: undefined, resetSignal: 0,
  brandLogos: false, brandLogoCategory: undefined, makerSections: () => bbCatalog, truckFilter: undefined, collapsible: false, referenceMakerFlow: false,
  makerOpenByDefault: false, singleOpen: false, showMakerCounts: true, allowEmptyMakerOptions: false, makerLabel: undefined,
});
const emit = defineEmits<{ reset: []; notify: [message: string]; bbmChange: [next: BbmFilterValues] }>();
const notify = (message: string) => emit("notify", message);
const onBbmChange = (next: BbmFilterValues) => emit("bbmChange", next);

// 모달형 항목: 사이드바 대신 412 모달을 연다. 원본 실측(2026-09-24): 모달 안 선택은 초안이고 [확인 N대]를 눌러야 조건이 걸린다(닫기 X는 버림)
const modalItem = ref<BbmFilterItem | null>(null);
const priceOpen = ref(false);
const draft = shallowRef<BbmFilterValues>(props.bbm);
const openModal = (item: BbmFilterItem) => { draft.value = props.bbm; modalItem.value = item; };
// 원본: 머리 "초기화"는 확인 창(필터 초기화 / 선택한 필터를 초기화하시겠습니까? / [취소][초기화])을 거친다
const confirmReset = ref(false);
const sidebarCollapsed = ref(false);
const moreFiltersOpen = ref(false);
const availableOnly = ref(false);
watch(() => props.resetSignal, () => { confirmReset.value = true; });
const truckFilterLabel = "형식/적재용량";
const hasTruckFilter = computed(() => Boolean(props.truckFilter));
const openItems = ref<string[]>(props.truckFilter ? [truckFilterLabel, ...(props.makerOpenByDefault ? [bbMakerItem] : [])] : props.makerOpenByDefault ? [bbMakerItem] : []);
watch(() => [props.makerOpenByDefault, props.singleOpen], () => {
  if (!props.makerOpenByDefault) return;
  const current = openItems.value;
  openItems.value = current.includes(bbMakerItem) ? current : props.singleOpen ? [bbMakerItem] : [...current, bbMakerItem];
}, { immediate: true });
const keepSearch = ref(false);
const viewFor = (): BbDrillView => {
  const { maker, model, generation } = props.selection;
  return maker && model && generation
    ? { stage: "grade", maker, model, generation }
    : maker && model
      ? { stage: "generation", maker, model }
      : maker
        ? { stage: "model", maker }
        : { stage: "maker" };
};
const view = ref<BbDrillView>(viewFor());
// 퀵필터·상단 칩에서 바뀐 선택을 사이드바 단계에 반영(같은 단계로 열기)
watch(() => [props.selection.maker, props.selection.model, props.selection.generation], () => { view.value = viewFor(); });
const toggle = (label: string) => {
  const current = openItems.value;
  openItems.value = current.includes(label) ? current.filter((item) => item !== label) : props.singleOpen && !hasTruckFilter.value ? [label] : [...current, label];
};
const collapsedPath = computed(() => {
  const { maker, model } = props.selection;
  return [
    maker ? bbMakerLabel(maker) : null,
    maker && model ? props.selection.modelLabel ?? model : null,
    props.selection.grades.length ? `등급 ${props.selection.grades.length}개` : props.selection.generation ? props.selection.generationLabel ?? props.selection.generation : null,
  ].filter(Boolean).join(" › ");
});
// 차란차 PC 좌측 필터(2026-10-18 「레퍼런스 하나 정해서 그대로」): 차란차 노출 순서를 그대로 쓰고 나머지는 「필터 더보기」 아래로
const charancha = computed(() => props.referenceMakerFlow);
const filterOrders = computed(() => {
  const order = props.order;
  // 바이크는 라이트바겐 기준 항목을 전부 좌측에 노출하고, 승용만 차란차 핵심 항목/더보기 구성을 쓴다.
  const charanchaPrimary = charancha.value ? props.brandLogoCategory === "바이크" || hasTruckFilter.value ? order : charanchaFilterOrder.filter((label) => order.includes(label)) : [];
  return hasTruckFilter.value
    ? { primary: order, secondary: [] as string[] }
    : charancha.value
      ? { primary: charanchaPrimary, secondary: order.filter((label) => !charanchaPrimary.includes(label)) }
      : splitDaangnFilterOrder(order);
});
// 필터 더보기 안에 숨은 항목 중 적용된 조건 수(검정 당구공 배지, 차란차 모드만)
const hiddenAppliedCount = computed(() => charancha.value ? filterOrders.value.secondary.filter((label) => Boolean(bbmItemValue(label, props.bbm))).length : 0);

type ItemInfo = { label: string; open: boolean; isMaker: boolean; filterItem: BbmFilterItem | undefined; displayLabel: string; applied: boolean; alwaysOpen: boolean; dialog: boolean };
const itemInfo = (label: string): ItemInfo => {
  const open = openItems.value.includes(label);
  const isMaker = label === bbMakerItem;
  const filterItem = bbFilterItemByLabel.get(label);
  const displayLabel = props.truckFilter && isMaker
    ? "제조사/모델/등급"
    : isMaker && props.makerLabel
      ? props.makerLabel
      : props.truckFilter && label === "차량번호 / 판매자"
        ? "차량번호/판매자 이름"
        : charancha.value && charanchaFilterLabels[label]
          ? charanchaFilterLabels[label]
          : daangnFilterLabel(label);
  const applied = isMaker ? Boolean(props.selection.maker) : Boolean(bbmItemValue(label, props.bbm));
  // 차란차형: 차량번호 / 판매자 검색은 접지 않고 제목 아래에 입력창을 바로 둔다(꺾쇠 없음)
  const alwaysOpen = charancha.value && !hasTruckFilter.value && charanchaAlwaysOpen.has(label);
  const dialog = filterItem?.mode === "modal" || (props.priceFinal && label === "가격");
  return { label, open, isMaker, filterItem, displayLabel, applied, alwaysOpen, dialog };
};
type MenuEntry = { kind: "item"; info: ItemInfo } | { kind: "more" } | { kind: "groupTitle" } | { kind: "exclude" };
const menuEntries = computed<MenuEntry[]>(() => {
  const { primary, secondary } = filterOrders.value;
  const entries: MenuEntry[] = primary.map((label) => ({ kind: "item", info: itemInfo(label) }));
  if (secondary.length) entries.push({ kind: "more" });
  if (moreFiltersOpen.value) {
    if (props.truckFilter) entries.push({ kind: "groupTitle" });
    for (const label of secondary) entries.push({ kind: "item", info: itemInfo(label) });
    if (primary.includes(bbMakerItem) && props.brandLogoCategory !== "바이크") entries.push({ kind: "exclude" });
  }
  return entries;
});
const entryKey = (entry: MenuEntry) => entry.kind === "item" ? entry.info.label : `__${entry.kind}`;
const clickToggle = (info: ItemInfo) => {
  if (props.priceFinal && info.label === "가격") priceOpen.value = true;
  else if (info.filterItem?.mode === "modal") openModal(info.filterItem);
  else toggle(info.label);
};

const truckInfo = computed(() => {
  const truckFilter = props.truckFilter;
  if (!truckFilter) return null;
  return {
    open: openItems.value.includes(truckFilterLabel),
    applied: Boolean(truckFilter.format || truckFilter.subtype || truckFilter.spec),
    path: [truckFilter.format, truckFilter.subtype, truckFilter.spec].filter(Boolean).join(" › "),
  };
});

const closeModal = () => { modalItem.value = null; };
const confirmModal = () => { onBbmChange(draft.value); modalItem.value = null; };
const resetModalDraft = () => { if (modalItem.value) draft.value = clearBbmItem(modalItem.value, draft.value); };
const changeModalPanel = (next: BbmFilterValues) => {
  // 광고기간은 원본처럼 아래 버튼 없이 고르면 바로 반영하고 닫는다
  if (modalItem.value?.label === "광고기간") { onBbmChange(next); modalItem.value = null; }
  else draft.value = next;
};
const confirmResetAction = () => { availableOnly.value = false; moreFiltersOpen.value = false; emit("reset"); confirmReset.value = false; };
</script>
<template>
  <aside v-if="collapsible && sidebarCollapsed" class="bbm-filter is-collapsed" aria-label="필터 접힘">
    <button type="button" class="bbm-filter-expand" aria-label="좌측 필터 펼치기" @click="sidebarCollapsed = false"><span aria-hidden="true">›</span><strong>필터</strong></button>
  </aside>
  <aside v-else :class="`bbm-filter${charancha ? ' is-charancha' : ''}${hasTruckFilter ? ' is-truck-reference' : ''}`" aria-label="필터">
    <div v-if="charancha" class="bbm-filter-summary is-charancha">
      <h4 class="bbm-cha-title">필터</h4>
      <div class="bbm-cha-actions">
        <button type="button" @click="notify(bbm.history ? '최근 필터 기록은 정식 서비스에서 이용해 주세요.' : '최근 필터 기록이 없습니다.')">최근 필터 기록</button>
        <i aria-hidden="true" />
        <button type="button" @click="confirmReset = true"><span class="bbm-cha-reset-icon" aria-hidden="true">↺</span>초기화</button>
      </div>
    </div>
    <div v-else class="bbm-filter-summary">
      <div class="bbm-filter-summary-top">
        <!-- QF-074: 제목 오른쪽 적용 필터 개수 배지(0개면 숨김) + 오른쪽 끝 모두 지우기 -->
        <div class="bbm-filter-title"><strong>필터</strong><span v-if="appliedCount > 0" class="bbm-filter-count" :aria-label="`적용된 필터 ${appliedCount}개`">{{ appliedCount }}</span></div>
        <div class="bbm-filter-summary-actions">
          <button type="button" class="bbm-filter-reset" @click="confirmReset = true">초기화</button>
          <button v-if="collapsible" type="button" class="bbm-filter-collapse" @click="sidebarCollapsed = true">숨기기</button>
        </div>
      </div>
      <div class="bbm-filter-summary-tools">
        <label class="bbm-filter-keep"><BbSwitch :checked="keepSearch" label="검색조건 유지" @change="keepSearch = !keepSearch" /><span>검색조건 유지</span></label>
        <button type="button" class="bbm-filter-history" @click="notify(bbm.history ? '최근 검색 기록은 정식 서비스에서 이용해 주세요.' : '최근 검색 기록이 없습니다.')">최근검색기록 <b>{{ historyCount ?? bbm.history ?? 0 }}</b></button>
      </div>
    </div>
    <div class="bbm-filter-menu">
      <div v-if="!charancha" class="bbm-filter-status">
        <span>상태</span>
        <label><BbSwitch :checked="availableOnly" label="거래 가능만 보기" @change="availableOnly = !availableOnly" /><strong>거래 가능만 보기</strong></label>
      </div>
      <slot name="leadingFilters" />
      <section v-if="truckFilter && truckInfo" :class="`bbm-filter-item is-truck-format${truckInfo.open ? ' is-open' : ''}${truckInfo.applied ? ' is-applied' : ''}`">
        <button type="button" class="bbm-filter-toggle" :aria-expanded="truckInfo.open" @click="toggle(truckFilterLabel)">
          <span class="bbm-filter-label"><span class="bbm-filter-label-text">형식/적재용량</span><small v-if="truckInfo.path && !referenceMakerFlow" class="bbm-filter-path">{{ truckInfo.path }}</small></span>
          <img class="bbm-filter-chevron" :src="bbmAsset('filter-chevron')" alt="" aria-hidden="true">
        </button>
        <button v-if="truckFilter.format" type="button" class="bbm-filter-item-reset" @click="truckFilter.onClearFormat()">초기화</button>
        <!-- 엔카 화물·특장 필터처럼 왼쪽 탐색은 이미지 없이 형식명과 매물 수만 읽게 한다. -->
        <BbTruckFormatFilter v-if="truckInfo.open" :value="truckFilter" :show-images="false" :reference-style="referenceMakerFlow" />
      </section>
      <template v-for="entry in menuEntries" :key="entryKey(entry)">
        <template v-if="entry.kind === 'item'">
          <section v-if="entry.info.alwaysOpen" :class="`bbm-filter-item is-open is-always-open${entry.info.applied ? ' is-applied' : ''}`">
            <div class="bbm-filter-toggle is-static"><span class="bbm-filter-label"><span class="bbm-filter-label-text">{{ entry.info.displayLabel }}</span></span></div>
            <BbmExpandPanel :label="entry.info.label" :value="bbm" :count-of="countOf" :mileage-final="mileageFinal" @change="onBbmChange" />
          </section>
          <section v-else :class="`bbm-filter-item${entry.info.open ? ' is-open' : ''}${entry.info.isMaker ? ' is-maker-grade' : ''}${entry.info.applied ? ' is-applied' : ''}`">
            <button type="button" class="bbm-filter-toggle" :aria-expanded="entry.info.dialog ? undefined : entry.info.open" :aria-haspopup="entry.info.dialog ? 'dialog' : undefined" @click="clickToggle(entry.info)">
              <span class="bbm-filter-label"><span class="bbm-filter-label-text"><img v-if="entry.info.label === '전기차 주행 가능 거리'" class="bbm-filter-label-icon" :src="bbmAsset('filter-ev-range')" alt="" aria-hidden="true">{{ entry.info.displayLabel }}</span><small v-if="entry.info.isMaker && !entry.info.open && collapsedPath" class="bbm-filter-path">{{ collapsedPath }}</small></span>
              <img class="bbm-filter-chevron" :src="bbmAsset('filter-chevron')" alt="" aria-hidden="true">
            </button>
            <button v-if="entry.info.isMaker && selection.maker && !referenceMakerFlow" type="button" class="bbm-filter-item-reset" @click="selection.onClearMaker()">초기화</button>
            <template v-if="entry.info.open">
              <BbMakerGradeFilter v-if="entry.info.isMaker" :selection="selection" :view="view" :brand-logos="brandLogos" :brand-logo-category="brandLogoCategory" :maker-sections="makerSections" :reference-style="referenceMakerFlow" :show-inventory-counts="showMakerCounts" :allow-empty-options="allowEmptyMakerOptions" @set-view="(next) => (view = next)" />
              <BbmExpandPanel v-else :label="entry.info.label" :value="bbm" :count-of="countOf" :mileage-final="mileageFinal" @change="onBbmChange" />
            </template>
          </section>
        </template>
        <button v-else-if="entry.kind === 'more'" type="button" class="bbm-filter-more-toggle" :aria-expanded="moreFiltersOpen" @click="moreFiltersOpen = !moreFiltersOpen"><span>{{ moreFiltersOpen ? "필터 접기" : "필터 더보기" }}<b v-if="hiddenAppliedCount" class="bbm-cha-more-count" :aria-label="`적용된 조건 ${hiddenAppliedCount}개`">{{ hiddenAppliedCount }}</b></span><i aria-hidden="true" /></button>
        <div v-else-if="entry.kind === 'groupTitle'" class="bbm-filter-group-title">추가 필터</div>
        <div v-else class="bbm-filter-action"><button type="button" class="bbmf-exclude" @click="notify('제조사·모델 제외하기는 정식 서비스에서 이용해 주세요.')"><i class="bbmf-circle-icon is-minus" aria-hidden="true" />제조사·모델 제외하기</button></div>
      </template>
    </div>
    <BbmModal v-if="modalItem" :title="modalItem.modalTitle ?? modalItem.displayLabel ?? modalItem.label" :wide="modalItem.label === '옵션'" @close="closeModal">
      <template v-if="modalItem.label !== '광고기간'" #footer>
        <BbmActionBar v-if="modalItem.label === '옵션'" :count="0" reset-label="취소" confirm-label="선택완료" @reset="closeModal" @confirm="confirmModal" />
        <BbmActionBar v-else :count="countWithBbm(draft)" @reset="resetModalDraft" @confirm="confirmModal" />
      </template>
      <!-- 광고기간은 원본처럼 아래 버튼 없이 고르면 바로 반영하고 닫는다 -->
      <BbmModalPanel :item="modalItem" :value="draft" :count-of="countOf" @change="changeModalPanel" />
    </BbmModal>
    <PriceFinalSheet v-if="priceOpen" variant="modal" :value="bbm" :count-of="countWithBbm" :presets="pricePresets" :hide-tabs="Boolean(pricePresets)" @apply="onBbmChange" @close="priceOpen = false" />
    <BbmModal v-if="confirmReset" title="필터 초기화" @close="confirmReset = false">
      <template #footer><BbmActionBar :count="0" reset-label="취소" confirm-label="초기화" @reset="confirmReset = false" @confirm="confirmResetAction" /></template>
      <p class="bbmf-confirm-text">선택한 필터를 초기화하시겠습니까?</p>
    </BbmModal>
  </aside>
</template>
