<!-- 인용구 줄(치지직 앱: 인용구 안에 커서가 있으면 도구 줄이 인용구 모양 6가지 + 빨간 휴지통으로 바뀐다) -->
<script setup lang="ts">
import { computed } from 'vue'
import { QUOTE_STYLES } from '~/composables/write/appExtensions'
import type { AppEditor } from '~/composables/write/useAppEditor'

const props = defineProps<{ editor: AppEditor }>()
const icon = (name: string) => communityAsset(`assets/reddit-write/${name}.svg`)
const current = computed(() => props.editor.state.value.quote)
const keep = (event: Event) => event.preventDefault()
</script>

<template>
  <div class="aw-tools is-quote" role="toolbar" aria-label="인용구 모양" @mousedown="keep">
    <button v-for="item in QUOTE_STYLES" :key="item.id" type="button" class="aw-quote-pick" :class="{ 'is-on': current === item.id }" :aria-pressed="current === item.id" :aria-label="`인용구 ${item.label}`" @click="editor.setQuoteStyle(item.id)">
      <span :class="`aw-quote-mini is-${item.id}`" aria-hidden="true"><img v-if="item.id === 1 || item.id === 4" :src="icon('icon-quote-outline')" alt=""></span>
    </button>
    <button type="button" class="aw-quote-delete" aria-label="인용구 지우기" @click="editor.removeQuote()"><img :src="icon('icon-delete-outline')" alt=""></button>
  </div>
</template>
