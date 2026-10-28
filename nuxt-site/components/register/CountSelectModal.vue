<script setup lang="ts">
// 리액트 src/prototype/register/index.tsx 의 RegisterForm 안 countModal(kind) — 압류·저당 개수 선택 팝업(모바일).
// set(option) + close() → emit("pick", option) 뒤 부모가 닫는다. onClose → emit("close")
import { countOptions } from "@proto/register/data";
import Pop from "./ui/Pop.vue";
import { cx } from "./register-local";

const props = defineProps<{ kind: "seizure" | "mortgage"; open: boolean; value: string }>();
const emit = defineEmits<{ pick: [option: string]; close: [] }>();
const label = props.kind === "seizure" ? "압류" : "저당";
</script>
<template>
  <Pop :open="open" :title="`${label} 선택`" class-name="register-count-select-modal" body-class-name="register-count-select-modal__body" @close="emit('close')">
    <div class="register-count-select-list" role="listbox" :aria-label="`${label} 선택`">
      <button v-for="option in countOptions" :key="option" type="button" role="option" :aria-selected="option === value" :class="cx('register-count-select-list__item', option === value && 'is-selected')" @click="emit('pick', option)">
        <span>{{ option }}</span><span class="register-count-select-list__radio" />
      </button>
    </div>
  </Pop>
</template>
