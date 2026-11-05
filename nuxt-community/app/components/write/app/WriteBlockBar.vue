<!-- 선택된 블록 전용 도구 줄(치지직 앱 2026-11-05 2차 폰 확인)
     구분선: 정렬(누를 때마다 바뀜) | 모양 8가지 | 삭제
     투표: 왼쪽 · 가운데 · 오른쪽 정렬 | 고치기 | 삭제
     스티커 · 링크: 정렬(누를 때마다 바뀜) | 삭제 · 사진: 교체 | 링크 | 삭제 · 동영상: 정보 고치기 | 삭제(폰 3차) -->
<script setup lang="ts">
import { computed } from 'vue'
import { DIVIDER_STYLES } from '~/composables/write/appExtensions'
import type { AppEditor } from '~/composables/write/useAppEditor'

const props = defineProps<{ editor: AppEditor }>()
const emit = defineEmits<{ editPoll: [], replace: [], link: [], editVideo: [] }>()
const icon = (name: string) => communityAsset(`assets/reddit-write/${name}.svg`)
const b = computed(() => props.editor.block.value)
const alignLabel = { left: '왼쪽 정렬', center: '가운데 정렬', right: '오른쪽 정렬' } as const
const keep = (event: Event) => event.preventDefault()
</script>

<template>
  <div v-if="b" class="aw-tools is-block" role="toolbar" :aria-label="b.name === 'horizontalRule' ? '구분선 도구' : b.name === 'editorPoll' ? '투표 도구' : '블록 도구'" @mousedown="keep">
    <template v-if="b.name === 'editorPoll'">
      <button v-for="a in (['left', 'center', 'right'] as const)" :key="a" type="button" :aria-label="alignLabel[a]" :aria-pressed="b.align === a" @click="editor.setBlockAlign(a)"><img :src="icon(`icon-align-${a}-outline`)" alt=""></button>
      <i class="aw-block-sep" aria-hidden="true" />
      <button type="button" aria-label="투표 고치기" @click="emit('editPoll')"><img :src="icon('icon-edit-outline')" alt=""></button>
    </template>
    <template v-else-if="b.name === 'writeMedia' && b.kind === 'video'">
      <button type="button" aria-label="동영상 정보 고치기" @click="emit('editVideo')"><img :src="icon('icon-video-post-outline')" alt=""></button>
    </template>
    <template v-else-if="b.name === 'writeMedia'">
      <button type="button" aria-label="사진 교체" @click="emit('replace')"><img :src="icon('icon-image-post-outline')" alt=""></button>
      <button type="button" aria-label="사진에 링크 걸기" :class="{ 'is-on': b.href }" @click="emit('link')"><img :src="icon('icon-link-outline')" alt=""></button>
    </template>
    <template v-else>
      <button type="button" :aria-label="`${alignLabel[b.align]} · 눌러서 바꾸기`" @click="editor.cycleBlockAlign()"><img :src="icon(`icon-align-${b.align}-outline`)" alt=""></button>
      <template v-if="b.name === 'horizontalRule'">
        <i class="aw-block-sep" aria-hidden="true" />
        <div class="aw-divider-picks">
          <button v-for="n in DIVIDER_STYLES" :key="n" type="button" :aria-label="`구분선 ${n}`" :aria-pressed="b.divider === n" :class="{ 'is-on': b.divider === n }" @click="editor.setDividerStyle(n)"><span class="aw-div-prev" :class="`is-${n}`" aria-hidden="true" /></button>
        </div>
      </template>
    </template>
    <button class="aw-block-delete" type="button" aria-label="삭제" @click="editor.deleteBlock()"><img :src="icon('icon-delete-outline')" alt=""></button>
  </div>
</template>
