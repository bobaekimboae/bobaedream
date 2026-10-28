<script setup lang="ts">
// 리액트 src/prototype/quick-filter/index.tsx 의 MakerSheet. onChoose → emit("choose", maker), onClose → emit("close")
import { computed, ref } from "vue";
import { makerOptions } from "@proto/data";
import Icon from "../shared/Icon.vue";
import MakerMark from "./MakerMark.vue";
// 의존: 모바일 묶음 담당(src/mobile/Keyboard.tsx → KeyboardInput.vue · useKeyboard)
import KeyboardInput from "../mobile/KeyboardInput.vue";
import { useKeyboard } from "../../composables/mobile/useKeyboard";

defineProps<{ selected: string | null }>();
const emit = defineEmits<{ choose: [maker: string | null]; close: [] }>();
const keyboard = useKeyboard();
const query = ref("");
const filteredOptions = computed(() => makerOptions.filter((option) => option.name.toLowerCase().includes(query.value.trim().toLowerCase())));
const onInput = (event: Event) => { query.value = (event.currentTarget as HTMLInputElement).value; };
</script>
<template>
  <div class="maker-sheet">
    <button type="button" class="maker-sheet-close" aria-label="제조사 선택 닫기" @click="emit('close')"><Icon name="sheet-close.svg" /></button>
    <label class="maker-search">
      <Icon name="search.svg" />
      <KeyboardInput aria-label="제조사 검색" :value="query" placeholder="검색" @input="onInput" @blur="keyboard.hide()" />
    </label>
    <div class="maker-list" role="radiogroup" aria-label="제조사 목록">
      <label v-for="option in filteredOptions" :key="option.name" :class="`maker-option${selected === option.maker ? ' is-selected' : ''}`">
        <MakerMark :option="option" />
        <span>{{ option.name }}</span>
        <input type="radio" name="maker" :value="option.maker" :checked="selected === option.maker" @change="emit('choose', option.maker)" />
      </label>
      <div v-if="!filteredOptions.length" class="maker-empty"><strong>검색 결과가 없어요</strong><span>다른 제조사명을 입력해보세요.</span></div>
    </div>
  </div>
</template>
