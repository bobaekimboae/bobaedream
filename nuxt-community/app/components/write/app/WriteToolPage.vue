<!-- 치지직 앱처럼 화면 전체를 덮는 도구 화면(스티커 · 링크 · 투표 · 글 종류). 머리줄: 왼쪽 버튼 · 가운데 제목 · 오른쪽 버튼 -->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{ title: string, leftIcon?: string, leftLabel?: string, actionLabel?: string, actionDisabled?: boolean, actionTone?: 'soft' | 'solid' }>(), {
  leftIcon: 'icon-close-outline', leftLabel: '닫기', actionLabel: '', actionDisabled: false, actionTone: 'solid',
})
const emit = defineEmits<{ left: [], action: [] }>()
const root = ref<HTMLElement | null>(null)
const icon = (name: string) => communityAsset(`assets/reddit-write/${name}.svg`)
function onKey(event: KeyboardEvent) { if (event.key === 'Escape') emit('left') }
onMounted(() => { document.addEventListener('keydown', onKey); root.value?.focus({ preventScroll: true }) })
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
void props
</script>

<template>
  <section ref="root" class="awp" tabindex="-1" role="dialog" aria-modal="true" :aria-label="title">
    <header class="awp-head">
      <button class="awp-left" type="button" :aria-label="leftLabel" @click="emit('left')"><img :src="icon(leftIcon)" alt=""></button>
      <h2>{{ title }}</h2>
      <button v-if="actionLabel" class="awp-action" :class="`is-${actionTone}`" type="button" :disabled="actionDisabled" @click="emit('action')">{{ actionLabel }}</button>
    </header>
    <div class="awp-body"><slot /></div>
  </section>
</template>
