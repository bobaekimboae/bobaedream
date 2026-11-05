// 게시판 탑메뉴(hupu-board-navigation.js init) 상태: 선택 게시판 · 내 게시판 순서 · 주소 반영.
import type { InjectionKey } from 'vue'
import type { Router } from 'vue-router'
import { boardById, boardForId, loadChannelState, loadDefaultHome, recordRecentBoard, type ListBoard } from './listBoards'
import type { ListPage } from './useListPage'

export function communitySectionForBoard(id: string) {
  return id === 'home' || id === 'all' || id === 'best' ? 'home'
    : ['accident-blackbox', 'scoop'].includes(id) ? 'report'
      : ['autohome-complaint', 'chezhiwang-complaint'].includes(id) ? 'defect' : 'board'
}

export function createListNav(page: ListPage, router: Router, query: Record<string, string | undefined>) {
  const queryId = query.board || ''
  const selectedId = ref(queryId === 'home' || queryId === 'all' || boardById[queryId] ? queryId : loadDefaultHome())
  const activeOrder = ref<string[]>(loadChannelState().activeOrder)
  const navOn = ref(selectedId.value) // 탑메뉴에서 .on 이 붙은 게시판(넘기기 미리보기 중에는 selectedId 와 다를 수 있다)
  const navCurrent = ref(selectedId.value) // aria-current 가 붙은 게시판(renderNav 할 때만 바뀐다)
  const scrollSignal = ref(0)
  const panelColumns = query.boardGrid === '3' ? 3 : 4

  function renderNav() {
    activeOrder.value = loadChannelState().activeOrder
    navOn.value = selectedId.value
    navCurrent.value = selectedId.value
  }
  function updateQuery(id: string) {
    page.queryBoard.value = id === 'home' ? '' : id
    const q = { ...router.currentRoute.value.query }
    if (id === 'home') delete q.board
    else q.board = id
    router.replace({ path: router.currentRoute.value.path, query: q, hash: router.currentRoute.value.hash })
  }
  function onSelect(board: ListBoard, options: { silent?: boolean }) {
    page.selectBoard(board.displayName, board.topicKey, { fromNavigation: true, silent: options.silent })
    page.communitySection.value = communitySectionForBoard(board.id)
  }
  function choose(id: string, options: { skipQuery?: boolean; silent?: boolean; preview?: boolean } = {}) {
    const board = boardForId(id)
    if (!board) return
    selectedId.value = id
    renderNav()
    page.avatarBoard.value = board
    if (!options.skipQuery) updateQuery(id)
    if (boardById[id] && !options.preview) recordRecentBoard(id)
    onSelect(board, { silent: !!options.silent })
    if (!options.preview) scrollSignal.value++
  }
  /** 넘기기 미리보기: 탑메뉴 · 주소 · 최근 기록은 그대로 두고 본문만 바꾼다 */
  function renderPreview(id: string) {
    const board = boardForId(id)
    if (!board) return
    selectedId.value = id
    page.avatarBoard.value = board
    onSelect(board, { silent: true })
  }
  function setSelectedByLabel(label: string) {
    const board = Object.values(boardById).find(b => b.displayName === label)
    if (board) {
      selectedId.value = board.id; renderNav(); page.avatarBoard.value = board; updateQuery(board.id); scrollSignal.value++
    } else if (label === '전체 게시글' || label === '전체') {
      selectedId.value = 'home'; renderNav(); page.avatarBoard.value = boardForId('home')!; updateQuery('home'); scrollSignal.value++
    }
  }
  page.setOnBoardSelected(setSelectedByLabel)
  function channelIds() {
    return ['home', 'all', 'best', ...activeOrder.value.filter(id => boardById[id])]
  }
  return { selectedId, activeOrder, navOn, navCurrent, scrollSignal, panelColumns, renderNav, updateQuery, choose, renderPreview, setSelectedByLabel, channelIds }
}
export type ListNav = ReturnType<typeof createListNav>
export const listNavKey: InjectionKey<ListNav> = Symbol('listNav')
export function useListNavCtx(): ListNav {
  const nav = inject(listNavKey)
  if (!nav) throw new Error('탑메뉴 상태가 없습니다')
  return nav
}
