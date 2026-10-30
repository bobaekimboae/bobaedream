<script setup lang="ts">
// 리액트 src/prototype/register/ui.tsx 의 SelectBox. ui-select-box: 버튼을 누르면 아래로 목록(ui-select-box__menu)이 열리는 원본 셀렉트.
// onChange → emit("change", value)
import { ref, computed, watch } from "vue";
import { syncControlled } from "../../../lib/controlled-input";

const props = withDefaults(defineProps<{
  value: string;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  search?: boolean;
  size?: "form" | "lg";
  className?: string;
}>(), { size: "form" });
const emit = defineEmits<{ change: [value: string] }>();

const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(" ");
const open = ref(false);
const query = ref("");
const rootRef = ref<HTMLSpanElement | null>(null);
watch(open, (isOpen, _prev, onCleanup) => {
  if (!isOpen) return;
  const close = (event: PointerEvent) => { if (!rootRef.value?.contains(event.target as Node)) open.value = false; };
  document.addEventListener("pointerdown", close);
  onCleanup(() => document.removeEventListener("pointerdown", close));
});
const list = computed(() => query.value ? props.options.filter((option) => option.includes(query.value)) : props.options);
const pick = (option: string) => { emit("change", option); open.value = false; query.value = ""; };
const onSearch = (event: Event) => { query.value = (event.currentTarget as HTMLInputElement).value; syncControlled(event, () => query.value); };
</script>
<template>
  <span
    ref="rootRef"
    :class="cx(
      'ui-select-box ui-fake-scrollbar',
      size === 'form' ? 'ui-select-box--form ui-select-box--mobile-form' : 'ui-select-box--lg ui-select-box--mobile-sm',
      !value && 'is-placeholder',
      disabled && 'is-disabled',
      open && 'is-open',
      className,
    )"
  >
    <button type="button" class="ui-select-box__control" :disabled="disabled" @click="open = !open">
      <span class="ui-select-box__label">{{ value || placeholder }}</span>
      <span class="ui-select-box__chevron" aria-hidden="true" />
    </button>
    <span class="ui-select-box__menu" role="listbox">
      <span v-if="search" class="ui-select-box__search"><input class="ui-select-box__search-input" type="search" placeholder="검색어를 입력해주세요" :value="query" @input="onSearch" /></span>
      <button v-for="option in list" :key="option" type="button" role="option" :aria-selected="option === value" :class="cx('ui-select-box__option', option === value && 'is-selected')" @click="pick(option)">{{ option }}</button>
    </span>
    <span class="ui-fake-scrollbar__track" aria-hidden="true"><span class="ui-fake-scrollbar__thumb" aria-hidden="true" /></span>
  </span>
</template>
