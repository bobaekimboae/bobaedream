<script setup lang="ts">
// 리액트 src/prototype/register/ui.tsx 의 FloatSelect. onChange → emit("change", value)
import SelectBox from "./SelectBox.vue";

defineProps<{
  label: string;
  value: string;
  options: string[];
  required?: boolean;
  disabled?: boolean;
  search?: boolean;
  className?: string;
  validation?: string;
}>();
const emit = defineEmits<{ change: [value: string] }>();
const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(" ");
</script>
<template>
  <span :class="cx('ui-floating-label-select ui-floating-label-select--form ui-floating-label-select--mobile-form', value && 'ui-floating-label-select--floating ui-floating-label-select--has-value', disabled && 'is-disabled', 'register-detail-floating-select', className, required && 'is-required')" :data-register-validation="validation">
    <label class="ui-floating-label-select__label">{{ label }}</label>
    <SelectBox :value="value" :options="options" :disabled="disabled" :search="search" class-name="ui-floating-label-select__select" @change="emit('change', $event)" />
  </span>
</template>
