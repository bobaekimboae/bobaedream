<script setup lang="ts">
// 미리보기(초톳 「Xem trước」): 매물 상세 위쪽과 같은 순서 — 사진(250, contain) → 제목 → 요약 → 가격 → 지역 → 설명 → 상세 정보
import { computed, ref } from "vue";
import Sheet from "./Sheet.vue";
import Ico from "./Ico.vue";
import { IC } from "../lib/icons";
import { priceText, type FormState, regionLine } from "../lib/form";
import type { Category, Field } from "../lib/categories";

const props = defineProps<{ form: FormState; cat: Category; fields: Field[] }>();
const emit = defineEmits<{ close: [] }>();
const at = ref(0);
const cur = computed(() => props.form.media[at.value]);
const meta = computed(() => {
  const v = props.form.values;
  return [v.year, v.mileage ? `${v.mileage}km` : v.hours ? `${v.hours}시간` : "", v.fuel ?? v.genre ?? v.type ?? v.kind ?? ""].filter(Boolean).join(" · ");
});
const facts = computed(() =>
  props.fields
    .filter((f) => props.form.values[f.key] && f.key !== "plate")
    .map((f) => [f.label, f.kind === "multi" ? props.form.values[f.key].split("|").join(", ") : `${props.form.values[f.key]}${f.unit && f.kind === "number" ? ` ${f.unit}` : ""}`]),
);
</script>
<template>
  <Sheet title="미리보기" full @close="emit('close')">
    <div class="pv">
      <div class="pv__photo">
        <video v-if="cur?.kind === 'video'" :src="cur.src" :poster="cur.poster" controls playsinline />
        <img v-else-if="cur" :src="cur.src" alt="대표 사진" />
        <span v-if="form.media.length" class="pv__count">{{ at + 1 }} / {{ form.media.length }}</span>
      </div>
      <div v-if="form.media.length > 1" class="pv__strip">
        <button v-for="(m, i) in form.media" :key="m.id" type="button" :class="{ 'is-on': i === at }" :aria-label="`${i + 1}번째 보기`" @click="at = i"><img :src="m.kind === 'video' ? m.poster || '' : m.src" alt="" /></button>
      </div>
      <div class="pv__info">
        <h3 class="pv__title">{{ form.title || "매물 제목" }}</h3>
        <p v-if="meta" class="pv__meta">{{ meta }}</p>
        <p class="pv__price">{{ priceText(form.price) || "가격 미입력" }}<small v-if="form.price"> {{ cat.priceUnit }}</small></p>
        <p class="pv__loc"><Ico :src="IC.location" />{{ form.region ? regionLine(form.region) : "거래 지역 미입력" }}</p>
      </div>
      <section class="pv__sec"><h3>매물 설명</h3><p class="pv__desc">{{ form.desc || "설명이 없어요" }}</p></section>
      <section class="pv__sec">
        <h3>상세 정보</h3>
        <dl class="pv__facts">
          <dt>카테고리</dt><dd>{{ cat.name }}</dd>
          <template v-for="[k, v] in facts" :key="k"><dt>{{ k }}</dt><dd>{{ v }}</dd></template>
          <template v-if="cat.devForm">
            <dt>판매구분</dt><dd>{{ form.saleKind }}</dd>
            <dt>매매유형</dt><dd>{{ form.values.dealType || "-" }}</dd>
          </template>
          <template v-else><dt>판매자</dt><dd>{{ form.seller }}</dd></template>
        </dl>
      </section>
    </div>
  </Sheet>
</template>
