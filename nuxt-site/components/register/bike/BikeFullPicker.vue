<script setup lang="ts">
// 리액트 BikeRegister.tsx 의 FullPicker. onBack 을 주는지 여부 → boolean prop `showBack`(지금은 쓰는 곳 없음).
// onBack → emit("back"), onClose → emit("close"), onSelect → emit("select").
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { icons } from "./bike-register-icons";

const props = defineProps<{ title: string; options: readonly string[]; selected: string; searchable?: boolean; showBack?: boolean }>();
const emit = defineEmits<{ back: []; close: []; select: [value: string] }>();
const query = ref("");
// 닫히면 연 줄로 포커스를 돌려준다(코덱스 검수 4)
let opener: HTMLElement | null = null;
onMounted(() => { opener = document.activeElement as HTMLElement | null; });
onBeforeUnmount(() => { opener?.focus?.({ preventScroll: true }); });
const visible = computed(() => props.options.filter((option) => option.toLocaleLowerCase().replace(/\s/g, "").includes(query.value.trim().toLocaleLowerCase().replace(/\s/g, ""))));
const onListKey = (event: KeyboardEvent) => {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  const items = [...(event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>("button[role=radio]")];
  const index = items.indexOf(document.activeElement as HTMLButtonElement);
  items[Math.max(0, Math.min(items.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)))]?.focus();
  event.preventDefault();
};
</script>
<template>
  <section class="bike-reg-picker" role="dialog" aria-modal="true" :aria-label="title">
    <header>
      <button v-if="showBack" type="button" aria-label="이전" @click="emit('back')"><img :src="icons.back" alt=""></button>
      <button v-else type="button" aria-label="닫기" @click="emit('close')"><img :src="icons.close" alt=""></button>
      <h2>{{ title }}</h2>
      <button v-if="showBack" type="button" aria-label="닫기" @click="emit('close')"><img :src="icons.close" alt=""></button>
      <span v-else />
    </header>
    <label v-if="searchable" class="bike-reg-picker__search"><img :src="icons.search" alt=""><input :value="query" placeholder="검색" :aria-label="`${title.replace(' 선택', '')} 검색`" @input="query = ($event.currentTarget as HTMLInputElement).value"><button v-if="query" type="button" aria-label="검색어 지우기" @click="query = ''"><img :src="icons.close" alt=""></button></label>
    <div class="bike-reg-picker__list" role="radiogroup" :aria-label="title" @keydown="onListKey">
      <button v-for="option in visible" :key="option" type="button" role="radio" :aria-checked="selected === option" :class="selected === option ? 'is-selected' : ''" @click="emit('select', option)"><span>{{ option }}</span><i><img v-if="selected === option" :src="icons.check" alt=""></i></button>
      <p v-if="!visible.length">검색 결과가 없습니다.</p>
    </div>
  </section>
</template>
