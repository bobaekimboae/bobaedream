<!-- 링크(치지직 앱: 화면 전체 · 「링크」 · 오른쪽 「첨부」, 주소 검색칸에 넣고 돋보기 · 엔터 → 미리보기, 못 불러오면 안내 두 줄) -->
<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { embedLib, type EmbedItem } from '~/composables/write/legacyLibs'
import WriteToolPage from './WriteToolPage.vue'

const emit = defineEmits<{ attach: [href: string], close: [] }>()
const icon = (name: string) => communityAsset(`assets/reddit-write/${name}.svg`)
const url = ref('')
const input = ref<HTMLInputElement | null>(null)
const state = ref<'idle' | 'loading' | 'ok' | 'fail'>('idle')
const preview = ref<EmbedItem & { href: string } | null>(null)
const typing = ref(true)

function normalized(): string {
  const lib = embedLib()
  const raw = (lib?.fromCode ? lib.fromCode(url.value) : url.value).trim()
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : (raw ? `https://${raw}` : '')
  try {
    const parsed = new URL(withScheme)
    return ['http:', 'https:'].includes(parsed.protocol) && parsed.hostname.includes('.') ? parsed.href : ''
  }
  catch { return '' }
}
async function search() {
  input.value?.blur()
  typing.value = false
  const href = normalized()
  if (!href) { state.value = 'fail'; preview.value = null; return }
  state.value = 'loading'
  const lib = embedLib()
  const item = lib?.info(href)
  if (!item) { preview.value = { url: href, render: 'link', href, title: new URL(href).hostname }; state.value = 'ok'; return }
  if (item.render === 'preview' && lib) {
    try {
      const meta = await lib.fetchMeta(href)
      preview.value = { ...item, ...meta, href }
      state.value = meta.title ? 'ok' : 'fail'
    }
    catch { state.value = 'fail'; preview.value = null }
    return
  }
  preview.value = { ...item, href }
  state.value = 'ok'
}
const host = (href: string) => { try { return new URL(href).hostname } catch { return href } }
const canAttach = computed(() => state.value === 'ok' && Boolean(preview.value))
function clear() { url.value = ''; state.value = 'idle'; preview.value = null; nextTick(() => input.value?.focus()) }
function left() {
  // 치지직: 입력 중에는 왼쪽이 「키보드 내리기」, 키보드를 내리면 뒤로가기
  if (typing.value) { input.value?.blur(); typing.value = false; return }
  emit('close')
}
onMounted(() => nextTick(() => input.value?.focus()))
</script>

<template>
  <WriteToolPage title="링크" :left-icon="typing ? 'icon-keyboard-outline' : 'icon-back-outline'" :left-label="typing ? '키보드 내리기' : '뒤로가기'" action-label="첨부" action-tone="soft" :action-disabled="!canAttach" @left="left" @action="preview && emit('attach', preview.href)">
    <form class="aw-link-search" role="search" novalidate @submit.prevent="search">
      <label class="sr-only" for="awLinkUrl">링크 주소</label>
      <input id="awLinkUrl" ref="input" v-model="url" type="text" inputmode="url" autocapitalize="off" spellcheck="false" enterkeyhint="search" placeholder="URL을 입력하세요." autocomplete="off" @focus="typing = true">
      <button v-if="url && typing" class="aw-link-clear" type="button" aria-label="지우기" @click="clear"><img :src="icon('icon-clear-fill')" alt=""></button>
      <button class="aw-link-go" type="submit" aria-label="검색"><img :src="icon('icon-search-outline')" alt=""></button>
    </form>
    <p v-if="state === 'loading'" class="aw-link-note">링크 정보를 불러오는 중이에요.</p>
    <p v-else-if="state === 'fail'" class="aw-link-note">링크 정보를 불러오는 데 실패했습니다.<br>링크를 다시 확인해주세요.</p>
    <article v-else-if="state === 'ok' && preview" class="aw-link-card">
      <img v-if="preview.image" :src="preview.image" alt="">
      <div><strong>{{ preview.title || preview.href }}</strong><small>{{ preview.site || preview.provider || host(preview.href) }}</small></div>
    </article>
  </WriteToolPage>
</template>
