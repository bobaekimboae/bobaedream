<script setup lang="ts">
// 리액트 src/prototype/register/ui.tsx 의 UnderlineAmount. onChange → emit("change", value)
import { formatNumber } from "@proto/register/ui";
import { syncControlled } from "../../../lib/controlled-input";

const props = withDefaults(defineProps<{ id: string; placeholder: string; value: string; unit?: string; readOnly?: boolean; className?: string }>(), { unit: "만원", className: "register-sale-modal-form__amount-input" });
const emit = defineEmits<{ change: [value: string] }>();
const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(" ");
const onInput = (event: Event) => {
  emit("change", formatNumber((event.currentTarget as HTMLInputElement).value));
  syncControlled(event, () => props.value);
};
</script>
<template>
  <span :class="cx('ui-responsive-input', className)">
    <span class="ui-underline-input ui-underline-input--lg ui-underline-input--mobile-sm ui-underline-input--numeric ui-underline-input--align-right ui-responsive-input__mobile">
      <input class="ui-underline-input__control" :id="id" type="text" inputmode="numeric" :placeholder="placeholder" :readonly="readOnly" :value="value" @input="onInput" />
      <span class="ui-underline-input__unit">{{ unit }}</span>
    </span>
    <span class="ui-box-input ui-box-input--lg ui-box-input--numeric ui-box-input--align-left ui-responsive-input__desktop">
      <span class="ui-box-input__field">
        <input class="ui-box-input__control" :id="`${id}-pc`" type="text" inputmode="numeric" :placeholder="placeholder" :readonly="readOnly" :value="value" @input="onInput" />
        <span class="ui-box-input__unit">{{ unit }}</span>
      </span>
    </span>
  </span>
</template>
