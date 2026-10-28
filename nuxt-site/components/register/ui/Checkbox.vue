<script setup lang="ts">
// 리액트 src/prototype/register/ui.tsx 의 Checkbox. onChange → emit("change", checked). label(ReactNode) → string prop(쓰는 곳은 모두 글자)
import { nextTick } from "vue";

const props = withDefaults(defineProps<{ checked: boolean; label: string; className?: string; size?: "lg" | "md"; id?: string; name?: string }>(), { size: "lg" });
const emit = defineEmits<{ change: [checked: boolean] }>();
const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(" ");
const onChange = (event: Event) => {
  const input = event.currentTarget as HTMLInputElement;
  emit("change", input.checked);
  void nextTick(() => { if (input.checked !== props.checked) input.checked = props.checked; });
};
</script>
<template>
  <label :class="cx('ui-checkbox ui-checkbox--square', size === 'lg' ? 'ui-checkbox--lg' : 'ui-checkbox--md ui-checkbox--mobile-md', className)">
    <input class="ui-checkbox__input" :id="id" :name="name" type="checkbox" :checked="checked" @change="onChange" />
    <span class="ui-checkbox__mark" aria-hidden="true"><i class="ui-checkbox__icon" /></span>
    <span class="ui-checkbox__label">{{ label }}</span>
  </label>
</template>
