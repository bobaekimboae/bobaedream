<script setup lang="ts">
// 「전체 게시판」 창(내 게시판 편집 · 끌어서 순서 바꾸기 · 추가 · 빼기). hupu-board-navigation.js 패널 부분 이식.
// 바이두 「我的频道管理」 동작: 길게 누르면 편집, 편집 중 누르면 빼기, 날아가는 이동, 손가락을 따라오는 끌기, 분류 탭 따라가기.
import { boardById, defaultActiveOrder, loadChannelState, menuSections, movableBoards, normalizeActiveOrder, saveChannelState } from '~/composables/list/listBoards'
import { useListNavCtx } from '~/composables/list/useListNav'

const nav = useListNavCtx()
const a = (p: string) => communityAsset(p)
const open = ref(false)
const editing = ref(false)
const draftOrder = ref<string[]>([])
const activeSection = ref('일반')
const live = ref('')
const toastHidden = ref(true)
const toastText = ref('')
const undoFn = ref<(() => void) | null>(null)
const panel = ref<HTMLElement | null>(null)
const body = ref<HTMLElement | null>(null)
const myGrid = ref<HTMLElement | null>(null)
const tabs = ref<HTMLElement | null>(null)
const sectionsEl = ref<HTMLElement | null>(null)
let opener: HTMLElement | null = null
let toastTimer: ReturnType<typeof setTimeout> | undefined
const reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

const order = computed(() => (editing.value ? draftOrder.value : nav.activeOrder.value))
const available = computed(() => {
  const act = new Set(order.value)
  return menuSections.map((section, index) => ({
    section,
    title: index === 0 ? '' : section,
    rest: movableBoards.filter(b => b.menuSection === section && !act.has(b.id)),
  }))
})
const fixedTiles = [['home', '홈', '커뮤니티 홈'], ['all', '전체', '전체 게시글'], ['best', '베스트', '베스트글']] as const

function announce(message: string) { live.value = message }
function hideToast() { clearTimeout(toastTimer); toastHidden.value = true; undoFn.value = null }
function showToast(message: string, undo?: () => void) {
  clearTimeout(toastTimer)
  toastText.value = message
  undoFn.value = undo || null
  toastHidden.value = false
  announce(message)
  toastTimer = setTimeout(hideToast, 5000)
}
function commitDraft(message?: string) {
  saveChannelState(draftOrder.value)
  nav.renderNav()
  if (message) announce(message)
}
function readGridOrder() {
  return Array.from(myGrid.value?.querySelectorAll<HTMLElement>('.boardOrderItem[data-movable="true"]') || []).map(el => el.dataset.boardId!)
}
function sameOrder(l: string[], r: string[]) { return l.length === r.length && l.every((id, i) => id === r[i]) }

// ── 날아가는 이동(FLIP) ──
function tileEls() {
  return Array.from(document.querySelectorAll<HTMLElement>('.boardOrderBackdrop .boardOrderItem[data-board-id],.boardOrderBackdrop .boardOrderAdd[data-board-id]'))
}
function snapshotTiles() {
  const map: Record<string, DOMRect> = {}
  tileEls().forEach((el) => { map[el.dataset.boardId + (el.classList.contains('boardOrderAdd') ? ':add' : '')] = el.getBoundingClientRect() })
  return map
}
function animateTiles(before: Record<string, DOMRect>, fly?: { target?: Element | null; from?: DOMRect }) {
  if (reduceMotion) return
  tileEls().forEach((el) => {
    const key = el.dataset.boardId + (el.classList.contains('boardOrderAdd') ? ':add' : '')
    if (fly && fly.target === el) return
    const old = before[key]
    if (!old) return
    const now = el.getBoundingClientRect()
    const dx = old.left - now.left, dy = old.top - now.top
    if (!dx && !dy) return
    el.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,0,0,1)' })
  })
  if (fly && fly.target && fly.from) {
    const to = fly.target.getBoundingClientRect()
    fly.target.animate([{ transform: 'translate(' + (fly.from.left - to.left) + 'px,' + (fly.from.top - to.top) + 'px)', opacity: 0.6 }, { transform: 'none', opacity: 1 }], { duration: 300, easing: 'cubic-bezier(.2,0,0,1)' })
  }
}

function setEditing(next: boolean) {
  if (editing.value && !next) commitDraft('게시판 편집을 마쳤습니다')
  if (!editing.value && next) { draftOrder.value = loadChannelState().activeOrder.slice(); announce('게시판 편집을 시작했습니다') }
  editing.value = !!next
}
function removeBoard(el: HTMLElement, id: string) {
  const from = el.getBoundingClientRect()
  const before = snapshotTiles()
  const name = boardById[id]?.displayName || ''
  draftOrder.value = draftOrder.value.filter(b => b !== id)
  commitDraft(name + ' 내 게시판에서 제외')
  if (nav.selectedId.value === id) nav.choose('home', { silent: true })
  nextTick(() => animateTiles(before, { from, target: sectionsEl.value?.querySelector('.boardOrderAdd[data-board-id="' + id + '"]') }))
}
function addBoard(event: MouseEvent, id: string) {
  const from = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const before = snapshotTiles()
  if (editing.value) {
    if (!draftOrder.value.includes(id)) draftOrder.value = [...draftOrder.value, id]
    commitDraft(boardById[id]!.displayName + ' 내 게시판에 추가')
  } else {
    const next = loadChannelState().activeOrder.slice()
    if (!next.includes(id)) next.push(id)
    saveChannelState(next)
    draftOrder.value = next.slice()
    nav.choose(id, { silent: true })
  }
  nextTick(() => animateTiles(before, { from, target: myGrid.value?.querySelector('.boardOrderItem[data-board-id="' + id + '"]') }))
  announce(boardById[id]!.displayName + ' 내 게시판에 추가')
}

// ── 누르기 · 길게 누르기 · 끌기 ──
let suppressClick = false
let longPressTimer: ReturnType<typeof setTimeout> | undefined
let longPressActive = false
let dragging: HTMLElement | null = null
let dragStartOrder: string[] = []
let dragPointerId: number | null = null
let dragPointerStart: { pointerId: number; x: number; y: number } | null = null
let dragGrab: { x: number; y: number } | null = null

function onTileClick(event: MouseEvent, id: string, movable: boolean) {
  if ((event.target as Element).closest('.boardOrderRemove') || longPressActive || suppressClick) return
  if (editing.value) {
    if (movable) removeBoard(event.currentTarget as HTMLElement, id)
    return
  }
  nav.choose(id)
  closePanel()
}
function onTileKey(event: KeyboardEvent, id: string, movable: boolean) {
  const el = event.currentTarget as HTMLElement
  if (!editing.value && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); nav.choose(id); closePanel(); return }
  if (!editing.value || !movable) return
  const list = draftOrder.value.slice()
  const index = list.indexOf(id)
  let next = index
  if (event.key === 'ArrowLeft') next = index - 1
  if (event.key === 'ArrowRight') next = index + 1
  if (event.key === 'ArrowUp') next = index - nav.panelColumns
  if (event.key === 'ArrowDown') next = index + nav.panelColumns
  if (next !== index && next >= 0 && next < list.length) {
    event.preventDefault()
    list.splice(index, 1)
    list.splice(next, 0, id)
    draftOrder.value = normalizeActiveOrder(list, false)
    commitDraft((boardById[id]?.displayName || '') + ' ' + (next + 4) + '번째로 이동·저장')
    nextTick(() => el.focus())
  }
}
function startDrag(el: HTMLElement, pointerId: number | null) {
  if (!el || dragging) return
  dragging = el
  dragStartOrder = readGridOrder()
  dragPointerId = pointerId
  longPressActive = true
  el.classList.add('dragging')
  if (dragPointerId != null) el.classList.add('isFloating')
  if (dragPointerStart) { const r = el.getBoundingClientRect(); dragGrab = { x: dragPointerStart.x - r.left, y: dragPointerStart.y - r.top } } else dragGrab = null
  el.setAttribute('aria-grabbed', 'true')
  document.body.classList.add('boardOrderDragging')
  if (dragPointerId != null) { try { el.setPointerCapture(dragPointerId) } catch { /* 무시 */ } }
}
function finishDrag(shouldSave?: boolean) {
  clearTimeout(longPressTimer)
  const el = dragging
  if (el) {
    el.classList.remove('dragging', 'isFloating')
    if (el.style.transform) {
      const settle = el.style.transform
      el.style.transform = ''
      if (!reduceMotion) el.animate([{ transform: settle }, { transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.2,0,0,1)' })
    }
    dragGrab = null
    suppressClick = true
    setTimeout(() => { suppressClick = false }, 350)
    el.setAttribute('aria-grabbed', 'false')
    if (dragPointerId != null) { try { el.releasePointerCapture(dragPointerId) } catch { /* 무시 */ } }
  }
  const changed = !sameOrder(dragStartOrder, draftOrder.value)
  if (longPressActive && changed && shouldSave !== false) commitDraft('게시판 순서를 저장했습니다')
  dragging = null
  dragStartOrder = []
  dragPointerId = null
  dragPointerStart = null
  longPressActive = false
  document.body.classList.remove('boardOrderDragging')
}
function followFinger(el: HTMLElement, event: PointerEvent | DragEvent) {
  if (!dragGrab || !myGrid.value) return
  const grid = myGrid.value.getBoundingClientRect()
  el.style.transform = 'translate(' + (event.clientX - dragGrab.x - grid.left - el.offsetLeft) + 'px,' + (event.clientY - dragGrab.y - grid.top - el.offsetTop) + 'px) scale(1.1)'
}
function moveItem(el: HTMLElement, targetEl: HTMLElement | null, event: { clientX: number; clientY: number }) {
  if (!targetEl || targetEl === el || targetEl.dataset.movable !== 'true') return false
  const id = el.dataset.boardId!, targetId = targetEl.dataset.boardId!
  const beforeOrder = draftOrder.value.slice()
  const rect = targetEl.getBoundingClientRect()
  const sameRow = event.clientY >= rect.top && event.clientY <= rect.bottom
  const before = sameRow ? event.clientX <= rect.left + rect.width / 2 : event.clientY < rect.top + rect.height / 2
  const list = beforeOrder.filter(b => b !== id)
  const ti = list.indexOf(targetId)
  list.splice(before ? ti : ti + 1, 0, id)
  if (sameOrder(beforeOrder, list)) return false
  const snap = snapshotTiles()
  draftOrder.value = normalizeActiveOrder(list, false)
  commitDraft()
  nextTick(() => { animateTiles(snap, { target: el }); if (dragging === el && 'pointerId' in event) followFinger(el, event as PointerEvent) })
  return true
}
function onTilePointerDown(event: PointerEvent, movable: boolean) {
  const el = event.currentTarget as HTMLElement
  if (!movable) return
  if (!editing.value) {
    clearTimeout(longPressTimer)
    const start = { x: event.clientX, y: event.clientY }
    el.onpointermove = (move) => { if (Math.abs(move.clientX - start.x) + Math.abs(move.clientY - start.y) > 8) clearTimeout(longPressTimer) }
    longPressTimer = setTimeout(() => {
      suppressClick = true
      setTimeout(() => { suppressClick = false }, 450)
      if (navigator.vibrate) { try { navigator.vibrate(12) } catch { /* 무시 */ } }
      setEditing(true)
    }, 450)
    return
  }
  if ((event.target as Element).closest('.boardOrderRemove') || event.pointerType === 'mouse') return
  clearTimeout(longPressTimer)
  const pointerId = event.pointerId
  dragPointerStart = { pointerId, x: event.clientX, y: event.clientY }
  longPressTimer = setTimeout(() => startDrag(el, pointerId), 180)
}
function onTilePointerMove(event: PointerEvent) {
  if (!editing.value) return
  const el = event.currentTarget as HTMLElement
  if (!longPressActive && dragPointerStart && dragPointerStart.pointerId === event.pointerId) {
    const dx = event.clientX - dragPointerStart.x, dy = event.clientY - dragPointerStart.y
    if (Math.sqrt(dx * dx + dy * dy) > 6) { clearTimeout(longPressTimer); startDrag(el, event.pointerId) }
  }
}
function onTilePointerUp() {
  if (!editing.value) { clearTimeout(longPressTimer); return }
  finishDrag(true)
}
function onDragStart(event: DragEvent, id: string) {
  startDrag(event.currentTarget as HTMLElement, null)
  if (event.dataTransfer) { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', id) }
}
function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (dragging) moveItem(dragging, event.currentTarget as HTMLElement, event)
}
function onDrop(event: DragEvent) {
  event.preventDefault()
  const sourceId = event.dataTransfer?.getData('text/plain')
  const source = sourceId ? myGrid.value?.querySelector<HTMLElement>('.boardOrderItem[data-board-id="' + sourceId + '"]') : null
  if (source && source !== event.currentTarget) moveItem(source, event.currentTarget as HTMLElement, event)
  finishDrag(true)
}
function dragMove(event: PointerEvent) {
  const el = dragging
  if (!longPressActive || !el || dragPointerId == null || event.pointerId !== dragPointerId) return
  event.preventDefault()
  const target = document.elementFromPoint(event.clientX, event.clientY)
  moveItem(el, target ? target.closest<HTMLElement>('.boardOrderItem[data-movable="true"]') : null, event)
  followFinger(el, event)
  if (body.value) {
    const r = body.value.getBoundingClientRect()
    if (event.clientY < r.top + 64) body.value.scrollTop -= 12
    if (event.clientY > r.bottom - 64) body.value.scrollTop += 12
  }
}
function dragEnd(event: PointerEvent) {
  if (dragging && longPressActive && dragPointerId != null && event.pointerId === dragPointerId) finishDrag(true)
}

// ── 분류 탭 ──
function selectAvailableSection(section: string, shouldScroll: boolean) {
  activeSection.value = menuSections.includes(section) ? section : '일반'
  if (shouldScroll) {
    const target = sectionsEl.value?.querySelector('.boardOrderAvailableSection[data-section="' + activeSection.value + '"]')
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
function onBodyScroll() {
  const b = body.value
  if (!b || !tabs.value || !sectionsEl.value) return
  const line = Math.max(tabs.value.getBoundingClientRect().bottom, b.getBoundingClientRect().top) + 24
  let current: string | null = null
  const all = sectionsEl.value.querySelectorAll<HTMLElement>('.boardOrderAvailableSection')
  if (b.scrollTop + b.clientHeight >= b.scrollHeight - 2) current = all.length ? all[all.length - 1]!.dataset.section! : null
  else all.forEach((sec) => { if (sec.getBoundingClientRect().top <= line) current = sec.dataset.section! })
  if (current && current !== activeSection.value) {
    selectAvailableSection(current, false)
    nextTick(() => {
      const on = tabs.value?.querySelector<HTMLElement>('.on')
      if (on && tabs.value) tabs.value.scrollTo({ left: on.offsetLeft - tabs.value.clientWidth / 2 + on.clientWidth / 2, behavior: reduceMotion ? 'auto' : 'smooth' })
    })
  }
}

function restore() {
  const prev = loadChannelState().activeOrder.slice()
  if (sameOrder(prev, defaultActiveOrder)) { showToast('이미 기본 순서입니다'); return }
  draftOrder.value = defaultActiveOrder.slice()
  commitDraft('기본 순서로 저장')
  showToast('기본 순서로 되돌렸습니다', () => { draftOrder.value = prev.slice(); commitDraft('이전 순서로 되돌림') })
}
function reset() {
  draftOrder.value = defaultActiveOrder.slice()
  commitDraft('기본 순서로 저장')
  showToast('기본 순서로 되돌렸습니다')
}
function openPanel(options: { opener?: HTMLElement | null } = {}) {
  opener = options.opener || (document.activeElement as HTMLElement | null)
  editing.value = false
  draftOrder.value = loadChannelState().activeOrder.slice()
  activeSection.value = '일반'
  open.value = true
  document.body.classList.add('boardOrderOpen')
  nextTick(() => panel.value?.focus({ preventScroll: true }))
}
function closePanel() {
  if (editing.value) commitDraft()
  finishDrag(false)
  hideToast()
  editing.value = false
  open.value = false
  document.body.classList.remove('boardOrderOpen')
  if (opener && opener.isConnected) opener.focus()
  else document.getElementById('boardOrderMenu')?.focus()
}
function focusable() {
  return Array.from(panel.value?.querySelectorAll<HTMLElement>('button,[href],[tabindex]:not([tabindex="-1"])') || [])
    .filter(el => !(el as HTMLButtonElement).disabled && !el.hidden && el.getAttribute('aria-disabled') !== 'true' && el.getClientRects().length > 0)
}
function onKeydown(event: KeyboardEvent) {
  if (!open.value) return
  if (event.key === 'Escape') { event.preventDefault(); closePanel(); return }
  if (event.key !== 'Tab') return
  const list = focusable()
  if (!list.length) return
  const first = list[0]!, last = list[list.length - 1]!
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}
function onBackdrop(event: MouseEvent) { if (event.target === event.currentTarget) closePanel() }
onMounted(() => {
  document.addEventListener('pointermove', dragMove, { passive: false })
  document.addEventListener('pointerup', dragEnd)
  document.addEventListener('pointercancel', dragEnd)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointermove', dragMove)
  document.removeEventListener('pointerup', dragEnd)
  document.removeEventListener('pointercancel', dragEnd)
  document.removeEventListener('keydown', onKeydown)
  document.body.classList.remove('boardOrderOpen', 'boardOrderDragging')
})
defineExpose({ openPanel, closePanel, isOpen: () => open.value })
</script>

<template>
  <Teleport to="body">
    <div :class="['boardOrderBackdrop', { isEditing: editing }]" :hidden="!open" @click="onBackdrop">
      <section ref="panel" class="boardOrderPanel" role="dialog" aria-modal="true" aria-labelledby="boardOrderTitle" tabindex="-1" :data-grid-columns="String(nav.panelColumns)">
        <header class="boardOrderHeader">
          <h2 id="boardOrderTitle">전체 게시판</h2>
          <button class="boardOrderClose" aria-label="닫기" @click="closePanel"><img :src="a('assets/reddit-ui/icon-close-outline.svg')" alt=""></button>
        </header>
        <div ref="body" class="boardOrderBody" data-spy="1" @scroll.passive="onBodyScroll">
          <div class="boardOrderHeading">
            <div><strong>내 게시판</strong><span class="boardOrderGuide">{{ editing ? '끌어서 순서 바꾸기' : '눌러서 게시판 이동' }}</span></div>
            <div class="boardOrderHeadActions">
              <button class="boardOrderRestore" type="button" @click="restore"><img :src="a('assets/reddit-ui/icon-refresh-outline.svg')" alt="">기본값 복원</button>
              <button class="boardOrderEdit" :aria-pressed="(editing)" @click="setEditing(!editing)"><img :src="a('assets/reddit-ui/icon-edit-outline.svg')" alt=""><span class="boardOrderEditLabel">{{ editing ? '완료' : '편집' }}</span></button>
            </div>
          </div>
          <div ref="myGrid" class="boardOrderMyGrid">
            <div
              v-for="[id, label, full] in fixedTiles"
              :key="id"
              :class="['boardOrderItem', 'boardOrderFixed', { selected: id === nav.selectedId.value }]"
              v-bind="editing ? { 'aria-disabled': 'true' } : { role: 'button', tabindex: '0' }"
              :data-board-id="id"
              data-fixed="true"
              :aria-label="full + ' 고정 게시판'"
              :aria-current="id === nav.selectedId.value ? 'page' : undefined"
              @click="onTileClick($event, id, false)"
              @keydown="onTileKey($event, id, false)"
            ><span class="boardOrderName">{{ label }}</span></div>
            <div
              v-for="(id, index) in order"
              :key="id"
              :class="['boardOrderItem', { selected: id === nav.selectedId.value, editing }]"
              role="button"
              tabindex="0"
              :draggable="editing ? 'true' : 'false'"
              :data-board-id="id"
              :data-board-name="boardById[id]!.displayName"
              data-movable="true"
              :aria-label="editing ? boardById[id]!.displayName + ' 현재 ' + (index + 4) + '번째, 방향키로 이동' : boardById[id]!.displayName + ' 이동'"
              :aria-grabbed="editing ? 'false' : undefined"
              :aria-posinset="editing ? String(index + 1) : undefined"
              :aria-setsize="editing ? String(order.length) : undefined"
              :aria-current="id === nav.selectedId.value ? 'page' : undefined"
              @click="onTileClick($event, id, true)"
              @keydown="onTileKey($event, id, true)"
              @pointerdown="onTilePointerDown($event, true)"
              @pointermove="onTilePointerMove"
              @pointerup="onTilePointerUp"
              @pointercancel="onTilePointerUp"
              @pointerleave="!editing && onTilePointerUp()"
              @contextmenu.prevent
              @dragstart="editing && onDragStart($event, id)"
              @dragenter="editing && onDragOver($event)"
              @dragover="editing && onDragOver($event)"
              @drop="editing && onDrop($event)"
              @dragend="editing && finishDrag(true)"
            ><span class="boardOrderName">{{ boardById[id]!.shortName }}</span><button
              v-if="editing"
              class="boardOrderRemove"
              :aria-label="boardById[id]!.displayName + ' 내 게시판에서 제외'"
              @pointerdown.stop
              @click.stop="removeBoard(($event.currentTarget as HTMLElement).parentElement as HTMLElement, id)"
            ><img :src="a('assets/reddit-ui/icon-clear-fill.svg')" alt=""></button></div>
          </div>
          <div class="boardOrderAvailable">
            <div ref="tabs" class="boardOrderSectionTabs" role="tablist" aria-label="게시판 분류">
              <button
                v-for="section in menuSections"
                :key="section"
                role="tab"
                :data-section="section"
                :class="{ on: section === activeSection }"
                :aria-selected="(section === activeSection)"
                :tabindex="section === activeSection ? 0 : -1"
                @click="selectAvailableSection(section, true)"
              >{{ section }}</button>
            </div>
            <div ref="sectionsEl" class="boardOrderAvailableSections">
              <section v-for="group in available" :key="group.section" class="boardOrderAvailableSection" :data-section="group.section">
                <h3 v-if="group.title" class="boardOrderAvailableTitle">{{ group.title }}</h3>
                <div v-if="group.rest.length" class="boardOrderAvailableGrid">
                  <button
                    v-for="board in group.rest"
                    :key="board.id"
                    class="boardOrderAdd"
                    :data-board-id="board.id"
                    :aria-label="board.displayName + ' 내 게시판에 추가'"
                    @click="addBoard($event, board.id)"
                  ><span>{{ board.shortName }}</span><img class="boardOrderPlusIcon" :src="a('assets/reddit-ui/icon-add-outline.svg')" alt=""></button>
                </div>
                <p v-else class="boardOrderSectionEmpty">모두 ‘내 게시판’에 추가했어요</p>
              </section>
            </div>
            <p class="boardOrderEmpty" hidden>모든 게시판이 내 게시판에 추가되어 있습니다.</p>
          </div>
          <button class="boardOrderReset" :hidden="!editing" @click="reset">기본 순서로 초기화</button>
          <p class="boardOrderHint">변경 내용은 바로 저장되며, 제외한 게시판은 아래에서 다시 추가할 수 있습니다.</p>
        </div>
        <div class="boardOrderToast" role="status" aria-live="polite" :hidden="toastHidden"><span class="boardOrderToastText">{{ toastText }}</span><button class="boardOrderUndo" type="button" :hidden="!undoFn" @click="() => { const u = undoFn; hideToast(); u && u() }">되돌리기</button></div>
        <div class="boardOrderLive" aria-live="polite" aria-atomic="true">{{ live }}</div>
      </section>
    </div>
  </Teleport>
</template>
