<script setup lang="ts">
import type { CommunityPost } from '~/types/community'

const props = defineProps<{ posts: CommunityPost[], headword: string }>()
const emit = defineEmits<{ 'update:headword': [value: string], openOptions: [] }>()

const base = useRuntimeConfig().app.baseURL
const alertEnabled = ref(false)
const following = ref(false)
const dday = computed(() => {
  const target = new Date('2026-11-07T00:30:00+09:00')
  const now = new Date()
  const targetDay = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate())
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.round((targetDay - today) / 86_400_000)
  return days > 0 ? `D-${days}` : days === 0 ? '오늘' : '종료'
})

const tabs = ['해외축구', '국내축구', 'F1', '이벤트', '유머이슈']
const headwords = ['전체', '경기', '다시보기', '규정', '기술', '직관']
const shortcuts = [
  ['calendar-outline.svg', '경기 일정'],
  ['list-numbered-outline.svg', '순위'],
  ['star-outline.svg', '내 팀'],
  ['play-outline.svg', '다시보기'],
  ['statistics-outline.svg', '기록'],
]

onMounted(() => {
  try {
    alertEnabled.value = localStorage.getItem('bbm.community.f1.alert') === '1'
    following.value = localStorage.getItem('bbm.community.f1.follow') === '1'
  } catch {}
})

function toggleAlert() {
  alertEnabled.value = !alertEnabled.value
  try { localStorage.setItem('bbm.community.f1.alert', alertEnabled.value ? '1' : '0') } catch {}
}
function toggleFollow() {
  following.value = !following.value
  try { localStorage.setItem('bbm.community.f1.follow', following.value ? '1' : '0') } catch {}
}
function timeLabel(iso: string) {
  const diff = Date.now() - Date.parse(iso)
  if (diff < 3_600_000) return `${Math.max(1, Math.floor(diff / 60_000))}분 전`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}시간 전`
  return new Intl.DateTimeFormat('ko-KR', { month: '2-digit', day: '2-digit' }).format(new Date(iso)).replace(/\. /g, '.').replace('.', '')
}
</script>

<template>
  <section class="f1-latest" aria-label="F1 게시판">
    <nav class="f1-category-tabs" aria-label="스포츠 게시판">
      <button v-for="tab in tabs" :key="tab" type="button" :class="{ 'is-active': tab === 'F1' }">{{ tab }}</button>
      <button class="f1-category-menu" type="button" aria-label="전체 스포츠 게시판"><span /><span /><span /></button>
    </nav>

    <section class="f1-banner">
      <img :src="`${base}community/assets/board-banners/f1.webp`" alt="F1 서킷 배너" />
      <div><small>BOBAEDREAM</small><strong>F1</strong><p>그랑프리 일정과 팬 이야기</p></div>
    </section>

    <section class="f1-races">
      <header><h2>주요 경기</h2><span>다음 경기 <b>{{ dday }}</b></span></header>
      <div class="f1-race-grid">
        <article class="f1-race-card">
          <div><b>멕시코시티 GP</b><span>▷ 다시보기</span></div>
          <strong>멕시코시티 그랑프리 결승</strong>
          <button type="button">다시보기</button>
        </article>
        <article class="f1-race-card">
          <div><b>상파울루 GP</b><span>11.07(토) 00:30</span></div>
          <strong>상파울루 그랑프리 연습 주행 1</strong>
          <button type="button" :class="{ 'is-on': alertEnabled }" @click="toggleAlert">{{ alertEnabled ? '알림 설정됨' : '알림 받기' }}</button>
        </article>
      </div>
      <nav class="f1-shortcuts" aria-label="F1 바로가기">
        <button v-for="shortcut in shortcuts" :key="shortcut[1]" type="button">
          <img :src="`${base}community/assets/f1/${shortcut[0]}`" alt="" /><span>{{ shortcut[1] }}</span>
        </button>
      </nav>
    </section>

    <section class="f1-board-profile">
      <div><h1>F1 <span aria-hidden="true">›</span></h1><p>팔로워 6.7만명 · 게시물 439개</p></div>
      <button type="button" :class="{ 'is-following': following }" @click="toggleFollow">{{ following ? '팔로잉' : '팔로우' }}</button>
    </section>

    <div class="f1-headwords">
      <button class="f1-filter-button" type="button" aria-label="게시글 옵션" @click="emit('openOptions')"><span /><span /><span /></button>
      <button v-for="item in headwords" :key="item" type="button" :class="{ 'is-active': (item === '전체' && !headword) || headword === item }" @click="emit('update:headword', item === '전체' ? '' : item)">{{ item }}</button>
    </div>

    <section class="f1-feed" aria-live="polite">
      <NuxtLink v-for="post in posts" :key="post.id" class="f1-feed-card" :to="`/posts/${post.id}`">
        <span class="f1-feed-headword">{{ post.headword }}</span>
        <header><span class="f1-feed-avatar">{{ post.author.slice(0, 1) }}</span><b>{{ post.author }}</b><time>{{ timeLabel(post.updatedAt) }}</time></header>
        <h2>{{ post.title }}</h2>
        <p>{{ post.excerpt }}</p>
        <img v-if="post.thumbnail" :src="post.thumbnail" alt="" />
        <footer><span>추천 {{ post.likes }}</span><span>댓글 {{ post.comments }}</span><span>조회 {{ post.views.toLocaleString() }}</span></footer>
      </NuxtLink>
    </section>
  </section>
</template>
