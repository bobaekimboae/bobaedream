<script setup lang="ts">
// 리액트 src/prototype/register/index.tsx 의 RegisterForm 안 saleExtraModal(kind) — 리스 승계 · 렌트 상세 팝업.
// patch(next) → emit("patch", next)(부모가 { ...value, ...next } 로 저장), onClose → emit("close"). notify 는 함수 prop.
import { computed } from "vue";
import { leaseCompanies, rentCompanies } from "@proto/register/data";
import Pop from "./ui/Pop.vue";
import ChoiceGroup from "./ui/ChoiceGroup.vue";
import SelectBox from "./ui/SelectBox.vue";
import UnderlineAmount from "./ui/UnderlineAmount.vue";
import type { SaleExtra } from "./register-local";

const props = defineProps<{ kind: "lease" | "rent"; open: boolean; value: SaleExtra; notify: (message: string) => void }>();
const emit = defineEmits<{ patch: [next: Partial<SaleExtra>]; close: [] }>();

const isLease = computed(() => props.kind === "lease");
const word = computed(() => isLease.value ? "리스" : "렌트");
const patch = (next: Partial<SaleExtra>) => emit("patch", next);
const years = Array.from({ length: 7 }, (_, index) => String(2026 + index));
const months = Array.from({ length: 12 }, (_, index) => String(index + 1));
const days = (year: string, month: string) => year && month ? Array.from({ length: new Date(Number(year), Number(month), 0).getDate() }, (_, index) => String(index + 1)) : [];
const monthsBetween = (from: [string, string, string], to: [string, string, string]) => from[0] && from[1] && to[0] && to[1] ? Math.max(0, (Number(to[0]) - Number(from[0])) * 12 + Number(to[1]) - Number(from[1])) : null;
const total = computed(() => monthsBetween(props.value.start, props.value.end));
const remain = computed(() => {
  const now = new Date();
  return props.value.end[0] && props.value.end[1] ? monthsBetween([String(now.getFullYear()), String(now.getMonth() + 1), ""], props.value.end) : null;
});
const locked = (which: "start" | "end") => which === "end" && !props.value.start[2];
const setPart = (which: "start" | "end", index: number, next: string) => {
  const copy = [...props.value[which]] as [string, string, string];
  copy[index] = next;
  for (let reset = index + 1; reset < 3; reset += 1) copy[reset] = "";
  patch({ [which]: copy } as Partial<SaleExtra>);
};
const amountRows = computed(() => [["monthly", `월 ${word.value}료`, `월 ${word.value}료를 입력해주세요`], ["deposit", "보증금", "보증금을 입력해주세요"], ["residual", "잔존가치", "잔존가치를 입력해주세요"]] as const);
const toggleExpiry = (next: string) => patch({ expiry: props.value.expiry.includes(next) ? props.value.expiry.filter((item) => item !== next) : [...props.value.expiry, next] });
const onFile = (event: Event) => {
  const files = (event.currentTarget as HTMLInputElement).files;
  if (files?.length) props.notify(`목업: ${files[0].name} 선택됨(업로드하지 않음)`);
};
</script>
<template>
  <Pop :open="open" :id="`rd_p_sale_${kind}`" :title="isLease ? '리스 승계' : '렌트'" @close="emit('close')">
    <div class="register-sale-modal-form">
      <div class="register-sale-modal-form__row">
        <span class="register-sale-modal-form__label">유형</span>
        <div class="register-sale-modal-form__value">
          <ChoiceGroup :name="`register-detail-${kind}-type`" class-name="register-sale-modal-form__choice-group" :value="value.type" :options="isLease ? [{ value: 'operating', label: '운용리스' }, { value: 'finance', label: '금융리스' }] : [{ value: 'succession', label: '렌트승계' }, { value: 'long-term', label: '장기렌트' }]" @change="patch({ type: $event })" />
        </div>
      </div>
      <div class="register-sale-modal-form__row">
        <span class="register-sale-modal-form__label">{{ word }}사</span>
        <div class="register-sale-modal-form__value"><SelectBox size="lg" search :value="value.company" :placeholder="`${word}사를 선택해주세요`" :options="isLease ? leaseCompanies : rentCompanies" @change="patch({ company: $event })" /></div>
      </div>
      <div class="register-sale-modal-form__row">
        <span class="register-sale-modal-form__label">인수 시 정산금</span>
        <div class="register-sale-modal-form__value">
          <ChoiceGroup :name="`register-detail-${kind}-settlement-type`" class-name="register-sale-modal-form__choice-group" :value="value.settlement" :options="[{ value: 'takeover', label: '인수금' }, { value: 'support', label: '승계지원금' }]" @change="patch({ settlement: $event })" />
        </div>
      </div>
      <div class="register-sale-modal-form__row register-sale-modal-form__row--value-only">
        <span class="register-sale-modal-form__label" />
        <div class="register-sale-modal-form__value"><UnderlineAmount :id="`register-detail-${kind}-settlement-amount`" placeholder="정산금을 입력해주세요" :value="value.settlementAmount" @change="patch({ settlementAmount: $event })" /></div>
      </div>
      <div v-for="[key, label, placeholder] in amountRows" :key="key" class="register-sale-modal-form__row">
        <span class="register-sale-modal-form__label">{{ label }}</span>
        <div class="register-sale-modal-form__value"><UnderlineAmount :id="`register-detail-${kind}-${key}`" :placeholder="placeholder" :value="value[key]" @change="patch({ [key]: $event })" /></div>
      </div>
      <div class="register-sale-modal-form__row register-sale-modal-form__row--period">
        <span class="register-sale-modal-form__label">{{ word }}기간</span>
        <div class="register-sale-modal-form__value register-sale-modal-form__period">
          <div v-for="which in (['start', 'end'] as const)" :key="which" class="register-sale-modal-form__period-row">
            <SelectBox size="lg" :value="value[which][0]" placeholder="년" :options="years" :disabled="locked(which)" @change="setPart(which, 0, $event)" />
            <SelectBox size="lg" :value="value[which][1]" placeholder="월" :options="months" :disabled="locked(which) || !value[which][0]" @change="setPart(which, 1, $event)" />
            <SelectBox size="lg" :value="value[which][2]" placeholder="일" :options="days(value[which][0], value[which][1])" :disabled="locked(which) || !value[which][1]" @change="setPart(which, 2, $event)" />
            <span class="register-sale-modal-form__period-text">{{ which === "start" ? "부터" : "까지" }}</span>
          </div>
          <div class="register-sale-modal-form__period-row register-sale-modal-form__period-row--months">
            <span class="register-sale-modal-form__period-text">잔여</span>
            <UnderlineAmount class-name="register-sale-modal-form__month-input" :id="`register-detail-${kind}-remain-month`" placeholder="" unit="개월" read-only :value="remain === null ? '' : String(remain)" />
            <span class="register-sale-modal-form__period-text">{{ isLease ? "/ 총" : "총" }}</span>
            <UnderlineAmount class-name="register-sale-modal-form__month-input" :id="`register-detail-${kind}-total-month`" placeholder="" unit="개월" read-only :value="total === null ? '' : String(total)" />
          </div>
        </div>
      </div>
      <div v-if="isLease" class="register-sale-modal-form__row">
        <span class="register-sale-modal-form__label">미회수원금</span>
        <div class="register-sale-modal-form__value"><UnderlineAmount id="register-detail-lease-unrecovered-principal" placeholder="미회수원금을 입력해주세요" :value="value.unrecovered" @change="patch({ unrecovered: $event })" /></div>
      </div>
      <div class="register-sale-modal-form__row">
        <span class="register-sale-modal-form__label">만기 시</span>
        <div class="register-sale-modal-form__value">
          <ChoiceGroup multiple :name="`register-detail-${kind}-expiry-type`" class-name="register-sale-modal-form__choice-group" :value="value.expiry" :options="[{ value: 'own', label: '소유' }, { value: 'return', label: '반납' }]" @change="toggleExpiry" />
        </div>
      </div>
      <div class="register-sale-modal-form__row register-sale-modal-form__row--stack register-sale-modal-form__row--schedule">
        <span class="register-sale-modal-form__label">상환 스케줄표(선택)</span>
        <div class="register-sale-modal-form__value register-sale-modal-form__value--stack">
          <label class="ui-file-dropzone ui-file-dropzone--lg ui-file-dropzone--mobile-sm register-sale-modal-form__image-button">
            <input class="ui-file-dropzone__input" type="file" accept="image/*" @change="onFile" />
            <span class="ui-file-dropzone__content">
              <i class="ui-file-dropzone__camera" />
              <span class="ui-file-dropzone__label" />
              <span class="ui-file-dropzone__text"><span class="ui-file-dropzone__title">파일 선택</span><span class="ui-file-dropzone__description">또는 여기로 파일을 끌어오세요.</span></span>
            </span>
          </label>
        </div>
      </div>
    </div>
    <template #footer><div class="pop-ft"><button type="button" class="pop-ft__button pop-ft__button--single" @click="emit('close')">완료</button></div></template>
  </Pop>
</template>
