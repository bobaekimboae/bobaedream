<script setup lang="ts">
// 초톳 앱 테두리 입력칸: 비었을 때는 「이름 *」이 칸 가운데 회색, 값이 있거나 누르고 있으면 위에 작은 굵은 이름 + 값.
import { computed, ref } from "vue";
import Ico from "./Ico.vue";
import { IC } from "../lib/icons";

const props = defineProps<{
  id: string;
  label: string;
  modelValue: string;
  required?: boolean;
  error?: string;
  multiline?: boolean;
  maxlength?: number;
  suffix?: string;
  numeric?: boolean;
  clearable?: boolean;
  /** 고르기 칸(누르면 시트) */
  select?: boolean;
  display?: string;
  placeholder?: string;
}>();
const emit = defineEmits<{ "update:modelValue": [string]; open: []; blur: [] }>();
const focused = ref(false);
const filled = computed(() => Boolean(props.select ? props.display : props.modelValue));
const floated = computed(() => props.multiline || filled.value || focused.value);
const onInput = (e: Event) => {
  let v = (e.target as HTMLInputElement).value;
  if (props.numeric) {
    const n = v.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
    v = n ? Number(n).toLocaleString("ko-KR") : "";
    (e.target as HTMLInputElement).value = v;
  }
  emit("update:modelValue", v);
};
</script>
<template>
  <div class="of" :class="{ 'is-err': error }">
    <component :is="select ? 'button' : 'label'" class="of__box" :type="select ? 'button' : undefined" :for="select ? undefined : id" :aria-haspopup="select ? 'dialog' : undefined" @click="select && emit('open')">
      <span v-if="floated" class="of__label">{{ label }}<span v-if="required" class="req"> *</span></span>
      <span v-else class="of__ph">{{ label }}<span v-if="required" class="req"> *</span></span>
      <template v-if="select">
        <span v-if="filled" class="of__select">{{ display }}</span>
        <Ico class="of__caret" :src="IC.caret" />
      </template>
      <textarea
        v-else-if="multiline"
        :id="id"
        class="of__input"
        :value="modelValue"
        :maxlength="maxlength"
        :placeholder="placeholder"
        :aria-invalid="Boolean(error)"
        @input="onInput"
        @focus="focused = true"
        @blur="focused = false; emit('blur')"
      />
      <input
        v-else
        :id="id"
        class="of__input"
        :class="{ 'of__input--right': clearable || suffix, 'is-hidden': !floated }"
        :value="modelValue"
        :maxlength="maxlength"
        :inputmode="numeric ? 'numeric' : undefined"
        :placeholder="focused ? placeholder : undefined"
        :aria-invalid="Boolean(error)"
        @input="onInput"
        @focus="focused = true"
        @blur="focused = false; emit('blur')"
      />
      <span v-if="suffix" class="of__suffix">{{ suffix }}</span>
      <button v-if="clearable && modelValue && !select" type="button" class="of__clear" :aria-label="`${label} 지우기`" @click.prevent="emit('update:modelValue', '')"><Ico :src="IC.clear" style="color: #8c8c8c" /></button>
    </component>
    <p v-if="error" class="of__err" role="alert">{{ error }}</p>
    <slot />
  </div>
</template>
