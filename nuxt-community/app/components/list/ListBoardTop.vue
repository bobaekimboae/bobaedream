<script setup lang="ts">
// 게시판 프로필 줄 · 설명 줄 · 말머리 줄 · 클린봇 안내. reddit-board-profile.js 와 목록 스크립트의 renderTabs 이식.
import { boardAvatarSrc } from '~/composables/list/listBoards'
import { subscriptionKey } from '~/composables/list/listBoardCopy'
import { useListPageCtx } from '~/composables/list/useListPage'
import { centerChip } from '~/composables/list/centerChip'

const emit = defineEmits<{ boardSelect: []; viewSheet: []; typeSheet: []; postOptions: [] }>()
const page = useListPageCtx()
const a = (p: string) => communityAsset(p)
const categoryEl = ref<HTMLElement | null>(null)
const subscribedTick = ref(0)
const subscribed = computed(() => {
  void subscribedTick.value
  try { return localStorage.getItem(subscriptionKey(page.boardName.value.trim() || '자유게시판')) === '1' } catch { return false }
})
function toggleSubscribe() {
  const label = page.boardName.value.trim() || '자유게시판'
  try { localStorage.setItem(subscriptionKey(label), subscribed.value ? '0' : '1') } catch { /* 무시 */ }
  subscribedTick.value++
}
const avatarSrc = computed(() => (page.avatarBoard.value ? boardAvatarSrc(page.avatarBoard.value) : a('assets/free-board-avatar.png')))
const avatarAlt = computed(() => (page.avatarBoard.value ? (page.avatarBoard.value.displayName || '') + ' 프로필' : ''))

// 말머리 줄: 마지막으로 그린 쪽(목록 스크립트 renderTabs / 네이버 토론 피드 syncHeadwords)의 모양을 따른다
const chips = computed(() => page.topics.value.map((t, i) => {
  const discussion = page.categoryOwner.value === 'discussion'
  const on = discussion ? t === page.discussionHeadword.value : i === page.active.value
  return { t, i, on, discussion }
}))
function chipClick(chip: { t: string; i: number; discussion: boolean }) {
  if (chip.discussion) { page.discussionHeadword.value = chip.t; page.discussionRender(); return }
  page.active.value = chip.i
  page.renderTabs()
  page.renderList()
}
function centerSelected() {
  if (page.headwordsExpanded.value) return
  const selected = categoryEl.value?.querySelector('.cat.on')
  centerChip(selected)
}
watch(() => [page.renderSeq.value, page.discussionHeadword.value, page.active.value, page.categoryOwner.value], () => nextTick(centerSelected))
onMounted(() => nextTick(centerSelected))

// 말머리 줄 · 목록 위 좌우 밀기(정적 판 touchstart/touchend 55px) — 게시판 넘기기가 시작되지 않은 경우에만
let sx = 0, sy = 0, swipeBlocked = false
function onTouchStart(e: TouchEvent) {
  const t = e.touches[0]!
  sx = t.clientX; sy = t.clientY
  swipeBlocked = Boolean((e.target as Element).closest('.naverDiscussionMediaShell,.chototMediaShell'))
}
function onTouchEnd(e: TouchEvent & { __bbmSwipe?: boolean }) {
  if (e.__bbmSwipe || (window as unknown as { __bbmBoardSwipeActive?: boolean }).__bbmBoardSwipeActive) { swipeBlocked = false; return }
  if (swipeBlocked) { swipeBlocked = false; return }
  const t = e.changedTouches[0]!
  const dx = t.clientX - sx, dy = t.clientY - sy
  if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.35) {
    page.active.value = Math.max(0, Math.min(page.topics.value.length - 1, page.active.value + (dx < 0 ? 1 : -1)))
    page.renderTabs()
    page.renderList()
    page.toast(page.topics.value[page.active.value] + ' 선택')
  }
}
defineExpose({ onTouchStart, onTouchEnd })
</script>

<template>
  <section class="boardTop redditProfileReady">
    <button id="boardSelect" class="boardSelect" aria-label="게시판 선택" @click="emit('boardSelect')"><img class="boardAvatar" :src="avatarSrc" :alt="avatarAlt"><span class="boardIdentityCopy"><span class="boardIdentityTitle"><span class="boardSelectName">{{ page.boardName.value }}</span><img class="boardChevron" :src="a('assets/reddit-ui/chevron-right.svg')" alt=""></span><span class="boardStats">{{ page.stats.value }}</span></span></button>
    <button type="button" class="boardSubscribe" :aria-pressed="(subscribed)" :aria-label="(page.boardName.value.trim() || '자유게시판') + ' ' + (subscribed ? '팔로우 취소' : '팔로우')" @click.stop="toggleSubscribe">{{ subscribed ? '팔로잉' : '팔로우' }}</button>
    <div class="boardTools">
      <button id="viewBtn" class="viewIconBtn" aria-label="보기 방식" @click="emit('viewSheet')"><img :src="a('assets/reddit-ui/view-card.svg')" alt=""><span class="boardToolLabel">보기 방식</span></button>
      <button id="typeBtn" class="typeSelect" aria-label="유형 선택" @click="emit('typeSheet')"><span id="typeLabel" class="viewText">{{ page.typeLabel.value }}</span><img class="chev" :src="a('assets/reddit-ui/chevron-down.svg')" alt=""></button>
    </div>
  </section>
  <section id="boardDescriptionSection" :class="['boardDescriptionSection', 'redditDescriptionReady', { expanded: page.boardDescriptionExpanded.value }]">
    <div class="boardDescription"><span id="boardDescriptionText" class="boardDescriptionText">{{ page.description.value }}</span></div>
    <button id="boardDescriptionToggle" class="sectionToggle descriptionToggle" type="button" :aria-expanded="(page.boardDescriptionExpanded.value)" aria-controls="boardDescriptionText" :aria-label="page.boardDescriptionExpanded.value ? '게시판 설명 접기' : '게시판 설명 전체 열기'" @click="page.setBoardDescriptionExpanded(!page.boardDescriptionExpanded.value)"><img :src="a('assets/reddit-ui/chevron-down.svg')" alt=""></button>
  </section>
  <section id="headwordSection" :class="['headwordSection', { expanded: page.headwordsExpanded.value }]">
    <button id="postFilterBtn" :class="['postFilterBtn', { active: page.postFilterApplied.value }]" type="button" :aria-pressed="(page.postFilterApplied.value)" :aria-label="page.postFilterApplied.value ? '게시글 옵션 열기, 필터 적용됨' : '게시글 옵션 열기'" @click="emit('postOptions')"><img :src="a('assets/reddit-ui/icon-filter-outline.svg')" alt=""></button>
    <nav id="category" ref="categoryEl" class="category" aria-label="말머리" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
      <template v-for="chip in chips" :key="chip.i">
        <button v-if="chip.discussion" :class="['cat', { on: chip.on }]" type="button" :data-discussion-headword="chip.t" :aria-pressed="chip.on ? 'true' : 'false'" @click="chipClick(chip)">{{ chip.t }}</button>
        <button v-else :class="['cat', { on: chip.on }]" :data-i="chip.i" :aria-pressed="chip.on ? 'true' : 'false'" @click="chipClick(chip)">{{ chip.t }}</button>
      </template>
    </nav>
    <button id="categoryToggle" class="categoryToggle sectionToggle" type="button" :aria-expanded="(page.headwordsExpanded.value)" aria-controls="category" :aria-label="page.headwordsExpanded.value ? '말머리 접기' : '말머리 전체 열기'" @click="page.setHeadwordsExpanded(!page.headwordsExpanded.value)"><img :src="a('assets/reddit-ui/chevron-down.svg')" alt=""></button>
  </section>
  <section id="compactLead" class="compactLead" aria-label="클린봇 안내">
    <div class="compactCleanBot"><span class="compactBotIcon"><img :src="a('assets/reddit-ui/icon-bot-outline.svg')" alt=""></span><span><strong>클린봇이</strong> 악성게시글을 감지합니다.</span><button id="compactBotSetting" type="button" aria-label="클린봇 설정" @click="page.toast('클린봇이 켜져 있습니다')"><img :src="a('assets/reddit-ui/icon-settings-outline.svg')" alt=""></button></div>
  </section>
</template>
