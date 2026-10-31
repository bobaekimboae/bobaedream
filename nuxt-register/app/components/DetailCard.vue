<script setup lang="ts">
// 초톳 「Thông tin chi tiết」 카드: 52 줄 · 왼쪽 이름(16/600 #595959) · 오른쪽 값 + 셰브론, 빈 필수 칸은 「선택해 주세요」 빨강.
// 숫자 칸(주행거리 등)은 줄 안에서 바로 입력(초톳 「Số Km đã đi」 + 연필).
import Ico from "./Ico.vue";
import PillRow from "./PillRow.vue";
import { IC } from "../lib/icons";
import type { Category, Field } from "../lib/categories";

const props = defineProps<{ cat: Category; fields: Field[]; values: Record<string, string>; err: (k: string) => string }>();
const emit = defineEmits<{ open: [Field]; set: [string, string]; category: [] }>();
const onNum = (f: Field, e: Event) => {
  const el = e.target as HTMLInputElement;
  if (f.kind === "number") {
    const raw = el.value.replace(/[^0-9.]/g, "");
    const [a, b] = raw.split(".");
    const n = a ? Number(a).toLocaleString("ko-KR") : "";
    el.value = b !== undefined && ["kWh", "톤", "%"].includes(f.unit ?? "") ? `${n || "0"}.${b.slice(0, 1)}` : n;
  }
  emit("set", f.key, el.value);
};
</script>
<template>
  <section class="card card--detail" aria-labelledby="detail-title">
    <h2 id="detail-title" class="detail-title"><Ico :src="IC.detail" />상세 정보</h2>
    <button type="button" class="row row--cat" aria-haspopup="dialog" @click="emit('category')">
      <span class="row__label">카테고리<span class="req"> *</span></span>
      <span class="row__value">차량 / {{ cat.name }}</span>
      <Ico class="row__chev" :src="IC.chevron" />
    </button>
    <template v-for="f in fields" :key="f.key">
      <div v-if="f.kind === 'pills'" class="row row--pills" style="display: block">
        <PillRow :label="f.label" :options="f.options as string[]" :model-value="values[f.key] ?? ''" :required="f.required" :error="err(f.key)" @update:model-value="(v: string) => emit('set', f.key, v)" />
      </div>
      <button v-else-if="f.kind === 'pick'" type="button" class="row" :class="{ 'is-err': err(f.key) }" aria-haspopup="dialog" @click="emit('open', f)">
        <span class="row__label">{{ f.label }}<span v-if="f.required" class="req"> *</span></span>
        <span class="row__value" :class="{ 'is-err': err(f.key) }">{{ values[f.key] || (err(f.key) ? err(f.key) : "선택") }}</span>
        <Ico class="row__chev" :src="IC.chevron" />
      </button>
      <div v-else class="row-wrap" :class="{ 'is-err': err(f.key) }">
        <label class="row row--input">
          <span class="row__label">{{ f.label }}<span v-if="f.required" class="req"> *</span></span>
          <input
            class="row__input"
            :value="values[f.key] ?? ''"
            :inputmode="f.kind === 'number' ? 'decimal' : undefined"
            :placeholder="f.placeholder ?? (f.kind === 'number' ? '' : '입력')"
            :aria-invalid="Boolean(err(f.key))"
            @input="(e) => onNum(f, e)"
          />
          <span v-if="f.unit" class="row__unit">{{ f.unit }}</span>
          <Ico class="row__edit" :src="IC.edit" />
        </label>
        <p v-if="err(f.key)" class="row-err" role="alert">{{ err(f.key) }}</p>
      </div>
    </template>
  </section>
</template>
