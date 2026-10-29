<script setup lang="ts">
// 리액트 src/prototype/register/ChototParityRegister.tsx 의 Field.
// onChange → emit("change", value), onClear → emit("clear")
import { ref, computed, watch } from "vue";
import ChevronDownIcon from "../../icons/ChevronDownIcon.vue";
import Cross2Icon from "../../icons/Cross2Icon.vue";
import CheckIcon from "../../icons/CheckIcon.vue";
import { syncControlled } from "../../../lib/controlled-input";

const props = defineProps<{
  id: string;
  label: string;
  value: string;
  required?: boolean;
  placeholder?: string;
  error?: string;
  suffix?: string;
  clearable?: boolean;
  select?: boolean;
  options?: string[];
}>();
const emit = defineEmits<{ change: [value: string]; clear: [] }>();

const pickerOpen = ref(false);
watch(pickerOpen, (open, _prev, onCleanup) => {
  if (!open) return;
  const previousOverflow = document.body.style.overflow;
  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") pickerOpen.value = false;
  };
  document.body.style.overflow = "hidden";
  document.addEventListener("keydown", closeOnEscape);
  onCleanup(() => {
    document.body.style.overflow = previousOverflow;
    document.removeEventListener("keydown", closeOnEscape);
  });
});

const selectOptions = computed(() => props.options ?? (props.value ? [props.value] : []));
const onInput = (event: Event) => { emit("change", (event.currentTarget as HTMLInputElement).value); syncControlled(event, () => props.value); };
const pick = (option: string) => { emit("change", option); pickerOpen.value = false; };
</script>
<template>
  <div :class="`ct-field-wrap${error ? ' is-error' : ''}`">
    <div class="ct-field">
      <label :for="id">{{ label }}<span v-if="required" aria-hidden="true"> *</span></label>
      <button v-if="select" :id="id" type="button" class="ct-field-button" aria-haspopup="dialog" :aria-expanded="pickerOpen" @click="pickerOpen = true">
        <span :class="!value ? 'is-placeholder' : ''">{{ value || placeholder || "선택" }}</span>
        <ChevronDownIcon aria-hidden="true" />
      </button>
      <input v-else :id="id" :value="value" :placeholder="placeholder" @input="onInput" />
      <span v-if="suffix" class="ct-field-suffix">{{ suffix }}</span>
      <button v-if="clearable && value" type="button" class="ct-clear" :aria-label="`${label} 지우기`" @click="emit('clear')">
        <Cross2Icon />
      </button>
    </div>
    <p v-if="error" class="ct-error" role="alert">{{ error }}</p>
    <div v-if="select && pickerOpen" class="ct-picker-backdrop" role="presentation" @click="pickerOpen = false">
      <section class="ct-picker-sheet" role="dialog" aria-modal="true" :aria-labelledby="`${id}-picker-title`" @click.stop>
        <header>
          <h3 :id="`${id}-picker-title`">{{ label }} 선택</h3>
          <button type="button" :aria-label="`${label} 선택 닫기`" @click="pickerOpen = false"><Cross2Icon /></button>
        </header>
        <div class="ct-picker-options" role="radiogroup" :aria-label="`${label} 선택지`">
          <button v-for="option in selectOptions" :key="option" type="button" role="radio" :aria-checked="value === option" :class="value === option ? 'is-selected' : ''" @click="pick(option)">
            <span>{{ option }}</span>
            <span v-if="value === option" class="ct-picker-check" aria-hidden="true"><CheckIcon /></span>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
