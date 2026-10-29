<script setup lang="ts">
// 리액트 src/prototype/register/index.tsx 의 MobileHeader.
// dev 원본 MobilePageHeader 컴포넌트의 범위 속성(data-v-f78f6b94). 원본 CSS가 이 속성으로 제목 18px·격자 배치를 건다.
// onBack → emit("back"), right(ReactNode) → slot "right"(없으면 빈 칸)
import { registerIcons } from "@proto/register/data";

defineProps<{ title: string; className?: string }>();
const emit = defineEmits<{ back: [] }>();
const cx = (...names: Array<string | false | null | undefined>) => names.filter(Boolean).join(" ");
</script>
<template>
  <div data-v-f78f6b94="" :class="cx('mobile-page-header', className)">
    <button data-v-f78f6b94="" type="button" class="mobile-page-header__button" aria-label="뒤로" @click="emit('back')"><img data-v-f78f6b94="" class="mobile-page-header__icon" :src="registerIcons.back" alt="" /></button>
    <span data-v-f78f6b94="" class="mobile-page-header__title">{{ title }}</span>
    <slot name="right"><span data-v-f78f6b94="" class="mobile-page-header__spacer" aria-hidden="true" /></slot>
  </div>
</template>
