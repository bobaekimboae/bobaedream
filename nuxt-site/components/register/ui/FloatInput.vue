<script setup lang="ts">
// 리액트 src/prototype/register/ui.tsx 의 FloatInput. 클래스 이름은 dev 원본(ui-floating-label-input 등) 그대로.
// onChange → emit("change", value), onOpen → emit("open") + showOpen(리액트에서 onOpen 을 줬을 때만 칸을 눌러 여는 동작)
import { ref, computed } from "vue";
import { registerIcons } from "@proto/register/data";
import { formatNumber } from "@proto/register/ui";
import { syncControlled } from "../../../lib/controlled-input";

const props = withDefaults(defineProps<{
  label: string;
  value: string;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  numeric?: boolean;
  unit?: string;
  chevron?: boolean;
  error?: string;
  message?: string;
  id?: string;
  name?: string;
  maxLength?: number;
  className?: string;
  validation?: string;
  selected?: boolean;
  formVariant?: boolean;
  showOpen?: boolean;
}>(), { formVariant: true });
const emit = defineEmits<{ change: [value: string]; open: [] }>();

const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(" ");
const focused = ref(false);
const hasValue = computed(() => props.value !== "");
const root = computed(() => cx(
  "ui-floating-label-input",
  props.formVariant && "ui-floating-label-input--form ui-floating-label-input--mobile-form",
  (hasValue.value || focused.value) && "ui-floating-label-input--floating",
  props.numeric && "ui-floating-label-input--numeric",
  "ui-floating-label-input--align-left",
  props.chevron && "ui-floating-label-input--with-icon",
  props.unit && "ui-floating-label-input--with-unit",
  props.disabled && "ui-floating-label-input--disabled",
  props.readOnly && "ui-floating-label-input--readonly",
  props.required && "ui-floating-label-input--required",
  hasValue.value && "ui-floating-label-input--has-value",
  props.className,
  props.selected && hasValue.value && "is-selected",
  props.error && "is-validation-error",
  props.error && props.validation && "register-validation-target",
));
const onInput = (event: Event) => {
  const raw = (event.currentTarget as HTMLInputElement).value;
  emit("change", props.numeric ? formatNumber(raw) : raw);
  syncControlled(event, () => props.value);
};
// 빈 입력칸은 글자 줄이 높이 0으로 접혀 있어, 칸 아무 곳이나 눌러도 입력창에 커서가 가게 한다(2026-10-09 「차량번호 입력 안먹히는데」)
const onClick = (event: MouseEvent) => {
  if (props.disabled) return;
  if (props.showOpen) { emit("open"); return; }
  if (props.readOnly) return;
  const control = (event.currentTarget as HTMLElement).querySelector<HTMLInputElement>(".ui-floating-label-input__control");
  if (control && document.activeElement !== control) control.focus();
};
</script>
<template>
  <span :class="root" :data-register-validation="validation" @click="onClick">
    <span class="ui-floating-label-input__field">
      <span class="ui-floating-label-input__body">
        <label class="ui-floating-label-input__label" :for="id">
          <span class="ui-floating-label-input__label-text">{{ label }}</span>
          <span v-if="required" class="ui-floating-label-input__required" aria-hidden="true">*</span>
        </label>
        <span :class="cx('ui-floating-label-input__input-row', unit && 'ui-floating-label-input__input-row--form-unit ui-floating-label-input__input-row--mobile-form-unit')">
          <input
            class="ui-floating-label-input__control"
            :id="id"
            :name="name"
            type="text"
            placeholder=""
            :inputmode="numeric ? 'numeric' : undefined"
            :maxlength="maxLength"
            :readonly="readOnly"
            :disabled="disabled"
            :value="value"
            @focus="focused = true"
            @blur="focused = false"
            @input="onInput"
          />
          <span v-if="unit" class="ui-floating-label-input__unit ui-floating-label-input__unit--form ui-floating-label-input__unit--mobile-form">{{ unit }}</span>
        </span>
      </span>
      <img v-if="chevron" class="ui-floating-label-input__icon ui-floating-label-input__icon--chevron-right-20" :src="registerIcons.chevronRight20" alt="" />
    </span>
    <span v-if="message" class="ui-floating-label-input__meta"><span class="ui-floating-label-input__message">{{ message }}</span></span>
  </span>
</template>
