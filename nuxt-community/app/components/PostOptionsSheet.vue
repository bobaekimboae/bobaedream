<script setup lang="ts">
import type { CommunitySort, CommunityView } from '~/types/community'

const props = defineProps<{
  open: boolean
  sort: CommunitySort
  view: CommunityView
  headwords: string[]
  headword: string
}>()

const emit = defineEmits<{
  close: []
  'update:sort': [value: CommunitySort]
  'update:view': [value: CommunityView]
  'update:headword': [value: string]
}>()

const iconRoot = `${useRuntimeConfig().app.baseURL}icons`

function chooseSort(value: CommunitySort) {
  emit('update:sort', value)
}

function chooseView(value: CommunityView) {
  emit('update:view', value)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet-fade">
      <div v-if="props.open" class="sheet-backdrop" role="presentation" @click.self="emit('close')">
        <section class="post-options-sheet" role="dialog" aria-modal="true" aria-labelledby="post-options-title">
          <header class="sheet-handle-header">
            <span class="sheet-handle" aria-hidden="true" />
            <h2 id="post-options-title">게시글 옵션</h2>
            <button type="button" aria-label="닫기" class="sheet-close" @click="emit('close')">×</button>
          </header>

          <div class="option-group">
            <h3>정렬</h3>
            <div class="choice-grid choice-grid--three">
              <button :class="{ 'is-selected': props.sort === 'latest' }" type="button" @click="chooseSort('latest')">최신순</button>
              <button :class="{ 'is-selected': props.sort === 'latest-comment' }" type="button" @click="chooseSort('latest-comment')">최신 댓글순</button>
              <button :class="{ 'is-selected': props.sort === 'popular' }" type="button" @click="chooseSort('popular')">인기순</button>
            </div>
          </div>

          <div class="option-group">
            <h3>보기</h3>
            <div class="view-choice-grid">
              <button :class="{ 'is-selected': props.view === 'compact' }" type="button" @click="chooseView('compact')">
                <span class="compact-view-icon" aria-hidden="true"><i /><i /><i /></span>
                <span>간결형</span><small>치지직</small>
              </button>
              <button :class="{ 'is-selected': props.view === 'list' }" type="button" @click="chooseView('list')">
                <img :src="`${iconRoot}/view-list.svg`" alt="" />
                <span>목록형</span><small>네이버 카페</small>
              </button>
              <button :class="{ 'is-selected': props.view === 'feed' }" type="button" @click="chooseView('feed')">
                <img :src="`${iconRoot}/view-feed.svg`" alt="" />
                <span>피드형</span><small>증권 토론</small>
              </button>
            </div>
          </div>

          <div class="option-group option-group--last">
            <h3>말머리</h3>
            <div class="headword-choice-list">
              <button :class="{ 'is-selected': !props.headword }" type="button" @click="emit('update:headword', '')">전체</button>
              <button v-for="item in props.headwords" :key="item" :class="{ 'is-selected': props.headword === item }" type="button" @click="emit('update:headword', item)">{{ item }}</button>
            </div>
          </div>

          <footer class="sheet-action-footer">
            <button type="button" @click="emit('close')">적용</button>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
