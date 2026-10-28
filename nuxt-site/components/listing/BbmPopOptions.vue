<script setup lang="ts">
// 리액트 bbm-list-area.tsx 의 BbmPopOptions(모바일 정렬·보기 방식 시트 본문, 원본 car-list-toolbar-pop-modal). onSelect(option) → emit("select", option)
import "@proto/listing/bbm-list-area.css";

defineProps<{ options: readonly string[]; selected: string }>();
const emit = defineEmits<{ select: [option: string] }>();
</script>
<template>
  <div class="car-list-toolbar-pop-modal__body">
    <div class="car-list-toolbar-pop-modal__options">
      <button v-for="option in options" :key="option" type="button" :class="`ui-btn ui-btn--outline ui-btn--lg ui-btn--align-center ui-btn--full${option === selected ? ' is-selected' : ''}`" :aria-pressed="option === selected" @click="emit('select', option)">
        <span class="ui-btn__label">{{ option }}</span>
      </button>
    </div>
  </div>
</template>
