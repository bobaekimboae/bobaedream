<script setup lang="ts">
// 리액트 src/prototype/register/ui.tsx 의 ChoiceGroup. onChange → emit("change", value)
// 리액트 제어 라디오·체크박스처럼: 부모가 값을 바꾸지 않으면(예: 같은 값) 체크 상태를 다시 맞춘다
import { nextTick } from "vue";

type ChoiceOption = { value: string; label: string; disabled?: boolean };
const props = withDefaults(defineProps<{ name: string; value: string | string[]; options: ChoiceOption[]; className?: string; multiple?: boolean; size?: "lg" | "sm"; mobile?: "sm" | "lg" }>(), { size: "lg", mobile: "sm" });
const emit = defineEmits<{ change: [value: string] }>();
const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(" ");
const isOn = (option: string) => Array.isArray(props.value) ? props.value.includes(option) : props.value === option;
const onChange = (event: Event, option: string) => {
  const input = event.currentTarget as HTMLInputElement;
  emit("change", option);
  void nextTick(() => { if (input.checked !== isOn(option)) input.checked = isOn(option); });
};
</script>
<template>
  <div :class="cx('ui-choice-group', `ui-choice-group--${size}`, `ui-choice-group--mobile-${mobile}`, className)">
    <label v-for="(option, index) in options" :key="option.value" :class="cx('ui-choice', isOn(option.value) && 'is-selected', option.disabled && 'is-disabled')">
      <input :id="`${name}-${index}`" :type="multiple ? 'checkbox' : 'radio'" :name="name" :value="option.value" :checked="isOn(option.value)" :disabled="option.disabled" @change="onChange($event, option.value)" />
      <span class="ui-choice__button"><span class="ui-choice__label">{{ option.label }}</span></span>
    </label>
  </div>
</template>
