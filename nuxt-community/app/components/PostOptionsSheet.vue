<script setup lang="ts">
import type { CommunityPopularPeriod, CommunitySort, CommunityView } from '~/types/community'

const props = defineProps<{
  open: boolean
  sort: CommunitySort
  popularPeriod: CommunityPopularPeriod
  view: CommunityView
  headwords: string[]
  headword: string
}>()

const emit = defineEmits<{
  close: []
  'update:sort': [value: CommunitySort]
  'update:popularPeriod': [value: CommunityPopularPeriod]
  'update:view': [value: CommunityView]
  'update:headword': [value: string]
}>()

const iconRoot = `${useRuntimeConfig().app.baseURL}icons`
const panel = ref<'main' | 'popular'>('main')
const popularPeriods: { value: CommunityPopularPeriod, label: string }[] = [
  { value: 'hour', label: '지난 1시간' },
  { value: 'day', label: '지난 24시간' },
  { value: 'week', label: '지난 1주' },
  { value: 'month', label: '지난 1개월' },
  { value: 'year', label: '지난 1년' },
  { value: 'all', label: '전체 기간' },
]
const popularPeriodLabel = computed(() => popularPeriods.find(item => item.value === props.popularPeriod)?.label || '전체 기간')

watch(() => props.open, (open) => { if (open) panel.value = 'main' })

function chooseSort(value: CommunitySort) {
  emit('update:sort', value)
}

function choosePopularPeriod(value: CommunityPopularPeriod) {
  emit('update:popularPeriod', value)
  emit('update:sort', 'popular')
  panel.value = 'main'
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
          <header class="sheet-handle-header" :class="{ 'has-back': panel === 'popular' }">
            <span class="sheet-handle" aria-hidden="true" />
            <button v-if="panel === 'popular'" type="button" class="sheet-back" aria-label="게시글 옵션으로 돌아가기" @click="panel = 'main'"><img :src="`${iconRoot}/chzzk/back.svg`" alt="" /></button>
            <h2 id="post-options-title">{{ panel === 'popular' ? '인기' : '게시글 옵션' }}</h2>
            <button type="button" aria-label="닫기" class="sheet-close" @click="emit('close')">×</button>
          </header>

          <template v-if="panel === 'main'">
          <div class="option-group">
            <h3>정렬</h3>
            <div class="sort-choice-list">
              <button :class="{ 'is-selected': props.sort === 'latest' }" type="button" @click="chooseSort('latest')"><span>최신순</span><b aria-hidden="true">✓</b></button>
              <button :class="{ 'is-selected': props.sort === 'latest-comment' }" type="button" @click="chooseSort('latest-comment')"><span><strong>최신 댓글순</strong><small>최근 댓글이 달린 글을 먼저 보여줍니다.</small></span><b aria-hidden="true">✓</b></button>
              <button :class="{ 'is-selected': props.sort === 'popular' }" type="button" aria-haspopup="dialog" @click="panel = 'popular'"><span><strong>인기</strong><small>{{ popularPeriodLabel }}</small></span><b class="sort-chevron" aria-hidden="true">›</b></button>
            </div>
          </div>

          <div class="option-group">
            <h3>보기</h3>
            <div class="view-choice-grid">
              <button :class="{ 'is-selected': props.view === 'compact' }" type="button" @click="chooseView('compact')">
                <span class="compact-view-icon" aria-hidden="true"><i /><i /><i /></span>
                <span>간결형</span>
              </button>
              <button :class="{ 'is-selected': props.view === 'list' }" type="button" @click="chooseView('list')">
                <img :src="`${iconRoot}/view-list.svg`" alt="" />
                <span>목록형</span>
              </button>
              <button :class="{ 'is-selected': props.view === 'feed' }" type="button" @click="chooseView('feed')">
                <img :src="`${iconRoot}/view-feed.svg`" alt="" />
                <span>피드형</span>
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
          </template>

          <div v-else class="popular-period-list" role="radiogroup" aria-label="인기 기간">
            <button v-for="item in popularPeriods" :key="item.value" type="button" role="radio" :aria-checked="props.popularPeriod === item.value" :class="{ 'is-selected': props.popularPeriod === item.value }" @click="choosePopularPeriod(item.value)">
              <i aria-hidden="true" />
              <span>{{ item.label }}</span>
              <b aria-hidden="true">✓</b>
            </button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
