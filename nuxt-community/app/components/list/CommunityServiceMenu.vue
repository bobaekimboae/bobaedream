<script setup lang="ts">
// 왼쪽 ☰ 로 여는 커뮤니티 메뉴(레딧식 서랍). hupu-board-navigation.js renderServiceMenu 이식.
import { boardAvatarSrc, boardById, boardSections, favoriteStorageKey, loadBoardIds, movableBoards, recentStorageKey, saveBoardIds, type ListBoard } from '~/composables/list/listBoards'
import { useListNavCtx } from '~/composables/list/useListNav'

const emit = defineEmits<{ openPanel: []; openView: [] }>()
const nav = useListNavCtx()
const a = (p: string) => communityAsset(p)
const open = ref(false)
const recentExpanded = ref(false)
const favoriteIds = ref<string[]>([])
const recentIds = ref<string[]>([])
const panel = ref<HTMLElement | null>(null)
let opener: HTMLElement | null = null
const sections = boardSections()

function refresh() {
  favoriteIds.value = loadBoardIds(favoriteStorageKey, movableBoards.length)
  recentIds.value = loadBoardIds(recentStorageKey, 6)
}
const recentBoards = computed(() => recentIds.value.map(id => boardById[id]).filter(Boolean) as ListBoard[])
const visibleRecent = computed(() => (recentExpanded.value ? recentBoards.value : recentBoards.value.slice(0, 3)))
const favoriteBoards = computed(() => favoriteIds.value.map(id => boardById[id]).filter(Boolean) as ListBoard[])
const groupOpen = reactive<Record<string, boolean>>({})

function toggleFavorite(id: string) {
  const ids = loadBoardIds(favoriteStorageKey, movableBoards.length)
  const index = ids.indexOf(id)
  if (index >= 0) ids.splice(index, 1)
  else ids.unshift(id)
  saveBoardIds(favoriteStorageKey, ids, movableBoards.length)
  refresh()
}
function focusable() {
  return Array.from(panel.value?.parentElement?.querySelectorAll<HTMLElement>('button,[href],[tabindex]:not([tabindex="-1"])') || [])
    .filter(el => !(el as HTMLButtonElement).disabled && !el.hidden && el.getClientRects().length > 0)
}
function openMenu() {
  opener = document.activeElement as HTMLElement | null
  refresh()
  sections.forEach((s) => { groupOpen[s.title] = s.boards.some(b => b.id === nav.selectedId.value) })
  open.value = true
  document.body.classList.add('communityMenuOpen')
  nextTick(() => focusable()[0]?.focus())
}
function closeMenu() {
  open.value = false
  document.body.classList.remove('communityMenuOpen')
  if (opener && opener.isConnected) opener.focus()
}
function pick(id: string) { nav.choose(id); closeMenu() }
function onBackdrop(event: MouseEvent) { if (event.target === event.currentTarget) closeMenu() }
function onKeydown(event: KeyboardEvent) {
  if (!open.value) return
  if (event.key === 'Escape') { event.preventDefault(); closeMenu(); return }
  if (event.key === 'Tab') {
    const list = focusable()
    if (!list.length) return
    const first = list[0]!, last = list[list.length - 1]!
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }
}
function onToggle(title: string, event: Event) { groupOpen[title] = (event.target as HTMLDetailsElement).open }
onMounted(() => document.addEventListener('keydown', onKeydown, true))
onBeforeUnmount(() => { document.removeEventListener('keydown', onKeydown, true); document.body.classList.remove('communityMenuOpen') })
defineExpose({ openMenu, isOpen: () => open.value })
</script>

<template>
  <Teleport to="body">
    <div class="communityMenuBackdrop" :hidden="!open" @click="onBackdrop">
      <section ref="panel" class="communityMenuPanel" role="dialog" aria-modal="true" aria-label="커뮤니티 메뉴">
        <div class="communityMenuBody">
          <nav class="communityMenuPrimary" aria-label="커뮤니티 주요 메뉴">
            <button type="button" data-service-board="all" :class="{ selected: nav.selectedId.value === 'all' }" @click="pick('all')"><img :src="a('assets/reddit-rail/latest.svg')" alt=""><span>최신</span></button>
          </nav>
          <div class="communityMenuDivider" />
          <button class="communityMenuUtility communityMenuCreateEntry" type="button" @click="closeMenu(); emit('openPanel')"><img :src="a('assets/reddit-rail/create-community.svg')" alt=""><span>커뮤니티 만들기</span></button>
          <div class="communityMenuDivider" />
          <section class="communityMenuRecentSection">
            <header class="communityMenuRecentHeader"><strong>최근에 방문함</strong><button class="communityMenuRecentMore" type="button" :hidden="recentBoards.length <= 3" @click="recentExpanded = !recentExpanded">{{ recentExpanded ? '접기' : '모두 보기' }}</button></header>
            <div class="communityMenuRecent">
              <template v-if="visibleRecent.length">
                <div v-for="board in visibleRecent" :key="board.id" :class="['communityMenuBoardRow', 'withoutFavorite', { selected: board.id === nav.selectedId.value }]">
                  <button class="communityMenuBoard" type="button" :data-service-board="board.id" @click="pick(board.id)"><img :src="boardAvatarSrc(board)" alt="" aria-hidden="true"><span>{{ board.displayName }}</span></button>
                </div>
              </template>
              <p v-else class="communityMenuEmpty">방문한 게시판이 여기에 표시됩니다.</p>
            </div>
          </section>
          <div class="communityMenuDivider" />
          <details class="communityMenuGroup communityMenuFavoriteGroup" open>
            <summary><span>즐겨찾기</span><img :src="a('assets/reddit-rail/section-toggle.svg')" alt="" aria-hidden="true"></summary>
            <div class="communityMenuFavorites">
              <template v-if="favoriteBoards.length">
                <div v-for="board in favoriteBoards" :key="board.id" :class="['communityMenuBoardRow', { selected: board.id === nav.selectedId.value }]">
                  <button class="communityMenuBoard" type="button" :data-service-board="board.id" @click="pick(board.id)"><img :src="boardAvatarSrc(board)" alt="" aria-hidden="true"><span>{{ board.displayName }}</span></button>
                  <button class="communityMenuFavoriteToggle isFavorite" type="button" :data-favorite-board="board.id" :aria-label="board.displayName + ' 즐겨찾기 해제'" aria-pressed="true" @click.stop.prevent="toggleFavorite(board.id)"><img :src="a('assets/reddit-rail/favorite-selected.svg?v=20261102redditdrawer4')" alt="" aria-hidden="true"></button>
                </div>
              </template>
              <p v-else class="communityMenuEmpty">게시판 옆 별표를 눌러 추가하세요.</p>
            </div>
          </details>
          <div class="communityMenuDivider" />
          <div class="communityMenuSectionTitle">전체 게시판</div>
          <div class="communityMenuGroups">
            <details v-for="section in sections" :key="section.title" class="communityMenuGroup" :open="groupOpen[section.title]" @toggle="onToggle(section.title, $event)">
              <summary><span>{{ section.title }}</span><img :src="a('assets/reddit-rail/section-toggle.svg')" alt="" aria-hidden="true"></summary>
              <div>
                <div v-for="board in section.boards" :key="board.id" :class="['communityMenuBoardRow', { selected: board.id === nav.selectedId.value }]">
                  <button class="communityMenuBoard" type="button" :data-service-board="board.id" @click="pick(board.id)"><img :src="boardAvatarSrc(board)" alt="" aria-hidden="true"><span>{{ board.displayName }}</span></button>
                  <button
                    :class="['communityMenuFavoriteToggle', { isFavorite: favoriteIds.includes(board.id) }]"
                    type="button"
                    :data-favorite-board="board.id"
                    :aria-label="board.displayName + ' 즐겨찾기 ' + (favoriteIds.includes(board.id) ? '해제' : '추가')"
                    :aria-pressed="(favoriteIds.includes(board.id))"
                    @click.stop.prevent="toggleFavorite(board.id)"
                  ><img :src="a('assets/reddit-rail/' + (favoriteIds.includes(board.id) ? 'favorite-selected.svg?v=20261102redditdrawer4' : 'favorite.svg'))" alt="" aria-hidden="true"></button>
                </div>
              </div>
            </details>
          </div>
          <div class="communityMenuDivider" />
          <button class="communityMenuUtility communityMenuViewEntry" type="button" @click="closeMenu(); emit('openView')"><img :src="a('assets/reddit-ui/view-list.svg')" alt=""><span>보기 방식</span><img class="communityMenuUtilityArrow" :src="a('assets/reddit-ui/chevron-right.svg')" alt=""></button>
          <button class="communityMenuUtility communityMenuBoardEntry" type="button" @click="closeMenu(); emit('openPanel')"><img :src="a('assets/reddit-rail/favorite.svg')" alt=""><span>게시판 관리</span><img class="communityMenuUtilityArrow" :src="a('assets/reddit-ui/chevron-right.svg')" alt=""></button>
        </div>
      </section>
    </div>
  </Teleport>
</template>
