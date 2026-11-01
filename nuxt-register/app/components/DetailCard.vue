<script setup lang="ts">
// 초톳 「Thông tin chi tiết」 카드: 52 줄 · 왼쪽 이름(16/600 #595959) · 오른쪽 값 + 셰브론, 빈 필수 칸은 「선택해 주세요」 빨강.
// 숫자 칸(주행거리 등)은 줄 안에서 바로 입력(초톳 「Số Km đã đi」 + 연필).
import Ico from "./Ico.vue";
import PillRow from "./PillRow.vue";
import { IC } from "../lib/icons";
import type { Category, Field } from "../lib/categories";

// 테스트 서버 양식(중고차 · 전기차): 차량번호 줄(입력 + 「조회」) · 조회로 잠긴 칸(자물쇠 없이 회색 값, 셰브론 없음) · 옵션 여러 개 고르기 · 줄 아래 안내.
const props = defineProps<{ cat: Category; fields: Field[]; values: Record<string, string>; err: (k: string) => string; locked?: string[]; imported?: boolean }>();
const emit = defineEmits<{ open: [Field]; set: [string, string]; category: []; lookup: []; imported: [boolean] }>();
const isLocked = (k: string) => Boolean(props.locked?.includes(k));
const multiText = (v?: string) => {
  const n = v ? v.split("|").filter(Boolean).length : 0;
  return n ? `${n}개 선택` : "";
};
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
    <button type="button" class="row row--cat" data-key="@category" aria-haspopup="dialog" @click="emit('category')">
      <span class="row__label">카테고리<span class="req"> *</span></span>
      <span class="row__value">차량 / {{ cat.name }}</span>
      <Ico class="row__chev mo-only" :src="IC.chevron" />
      <Ico class="row__caret pc-only" :src="IC.caret" />
    </button>
    <template v-for="f in fields" :key="f.key">
      <div v-if="f.kind === 'plate'" class="row-wrap row-wrap--plate" :data-key="f.key" :class="{ 'is-err': err(f.key), 'has-val': values[f.key] }">
        <label class="row row--input">
          <span class="row__label">{{ f.label }}<span v-if="f.required" class="req"> *</span></span>
          <input
            class="row__input"
            :value="values[f.key] ?? ''"
            :readonly="isLocked(f.key)"
            maxlength="20"
            autocomplete="off"
            :placeholder="f.placeholder"
            :aria-invalid="Boolean(err(f.key))"
            @input="(e) => emit('set', f.key, (e.target as HTMLInputElement).value.replace(/\s/g, ''))"
            @keydown.enter.prevent="emit('lookup')"
          />
          <button v-if="isLocked(f.key)" type="button" class="row__clear row__clear--in" :aria-label="`${f.label} 지우고 다시 조회`" @click.prevent="emit('set', f.key, '')"><Ico :src="IC.clear" /></button>
          <button v-else-if="!imported" type="button" class="row__btn" :disabled="!values[f.key]" @click.prevent="emit('lookup')">조회</button>
        </label>
        <p v-if="err(f.key)" class="row-err" role="alert">{{ err(f.key) }}</p>
        <label class="row-check">
          <input type="checkbox" :checked="imported" :disabled="isLocked(f.key)" @change="(e) => emit('imported', (e.target as HTMLInputElement).checked)" />
          <span class="row-check__box" aria-hidden="true"><Ico :src="IC.check" /></span>
          <span>임시번호/직수입 차량등록</span>
        </label>
      </div>
      <div v-else-if="isLocked(f.key)" class="row row--locked has-val" :data-key="f.key">
        <span class="row__label">{{ f.label }}<span v-if="f.required" class="req"> *</span></span>
        <span class="row__value is-set">{{ values[f.key] }}{{ f.unit ? ` ${f.unit}` : "" }}</span>
      </div>
      <div v-else-if="f.kind === 'multi'" class="row-pick" :class="{ 'has-val': values[f.key] }" :data-key="f.key">
        <button type="button" class="row" aria-haspopup="dialog" @click="emit('open', f)">
          <span class="row__label">{{ f.label }}<span v-if="f.required" class="req"> *</span></span>
          <span class="row__value" :class="{ 'is-set': values[f.key] }">{{ multiText(values[f.key]) || "선택" }}</span>
          <Ico class="row__chev" :src="IC.chevron" />
        </button>
        <button v-if="values[f.key]" type="button" class="row__clear" :aria-label="`${f.label} 선택 모두 지우기`" @click="emit('set', f.key, '')"><Ico :src="IC.clear" /></button>
      </div>
      <div v-else-if="f.kind === 'pills'" class="row row--pills" :data-key="f.key" style="display: block">
        <PillRow :label="f.label" :options="f.options as string[]" :model-value="values[f.key] ?? ''" :required="f.required" :error="err(f.key)" @update:model-value="(v: string) => emit('set', f.key, v)" />
      </div>
      <div v-else-if="f.kind === 'pick'" class="row-pick" :class="{ 'has-val': values[f.key] }" :data-key="f.key">
        <button type="button" class="row" :class="{ 'is-err': err(f.key) }" aria-haspopup="dialog" @click="emit('open', f)">
          <span class="row__label">{{ f.label }}<span v-if="f.required" class="req"> *</span></span>
          <span class="row__value" :class="{ 'is-err': err(f.key), 'is-set': values[f.key] }">{{ values[f.key] || (err(f.key) ? err(f.key) : "선택") }}</span>
          <Ico class="row__chev" :src="IC.chevron" />
        </button>
        <button v-if="values[f.key]" type="button" class="row__clear" :aria-label="`${f.label} 선택 지우기`" @click="emit('set', f.key, '')"><Ico :src="IC.clear" /></button>
        <p v-if="f.hint" class="row-hint">{{ f.hint }}</p>
      </div>
      <div v-else class="row-wrap" :data-key="f.key" :class="{ 'is-err': err(f.key), 'has-val': values[f.key] }">
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
          <button v-if="values[f.key]" type="button" class="row__clear row__clear--in" :aria-label="`${f.label} 지우기`" @click.prevent="emit('set', f.key, '')"><Ico :src="IC.clear" /></button>
          <Ico v-else class="row__edit" :src="IC.edit" />
        </label>
        <p v-if="err(f.key)" class="row-err" role="alert">{{ err(f.key) }}</p>
      </div>
    </template>
  </section>
</template>
