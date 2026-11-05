<!-- 태그 첨부(네이버 카페 앱 2026-11-06 폰 확인): ← 태그 첨부 · 확인(바뀌면 초록).
     굵은 회색 안내 「태그 입력 (최대10개)」 + 연초록 「추가」 단추 · 아래 회색 알약 「#태그 ×」. 확인을 눌러야 본문 아래에 들어간다 -->
<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { parseTags } from '~/composables/write/writeUtils'
import WriteToolPage from '../app/WriteToolPage.vue'

const props = defineProps<{ tags: string[] }>()
const emit = defineEmits<{ done: [tags: string[]], close: [], toast: [message: string] }>()
const list = ref<string[]>([...props.tags])
const draft = ref('')
const input = ref<HTMLInputElement | null>(null)
const changed = computed(() => list.value.join('\u0000') !== props.tags.join('\u0000'))
nextTick(() => input.value?.focus())

function add() {
  const next = parseTags(draft.value).filter(tag => !list.value.includes(tag))
  if (!next.length) { draft.value = ''; return }
  if (list.value.length + next.length > 10) { emit('toast', '태그는 최대 10개까지 넣을 수 있어요.'); return }
  list.value = [...list.value, ...next]
  draft.value = ''
  input.value?.focus()
}
function remove(tag: string) { list.value = list.value.filter(item => item !== tag) }
</script>

<template>
  <WriteToolPage title="태그 첨부" left-label="뒤로가기" action-label="확인" action-tone="soft" :action-disabled="!changed" @left="emit('close')" @action="emit('done', list)">
    <div class="nwt">
      <div class="nwt-row">
        <label class="sr-only" for="nwtInput">태그</label>
        <input id="nwtInput" ref="input" v-model="draft" maxlength="40" placeholder="태그 입력 (최대10개)" autocomplete="off" enterkeyhint="done" @keydown.enter.prevent="add">
        <button class="nwt-add" type="button" :disabled="!draft.trim()" @click="add">추가</button>
      </div>
      <ul class="nwt-chips" aria-label="넣은 태그">
        <li v-for="tag in list" :key="tag"><span>#{{ tag }}</span><button type="button" :aria-label="`${tag} 태그 빼기`" @click="remove(tag)"><img :src="communityAsset('assets/reddit-write/icon-close-outline.svg')" alt=""></button></li>
      </ul>
    </div>
  </WriteToolPage>
</template>
