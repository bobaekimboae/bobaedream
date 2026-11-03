<script setup lang="ts">
import type { CommunityBoard, CommunitySection, CommunitySectionId } from '~/types/community'

const props = defineProps<{
  open: boolean
  sections: CommunitySection[]
  boards: CommunityBoard[]
  selectedBoardId: string
}>()

const emit = defineEmits<{
  close: []
  select: [boardId: string]
  choose: [boardId: string]
}>()

const iconRoot = `${useRuntimeConfig().app.baseURL}icons`
const panel = ref<HTMLElement | null>(null)
const editing = ref(false)
const activeSectionId = ref<CommunitySectionId>('general')
const myBoardIds = ref<string[]>([])
const toastMessage = ref('')
const scrollBox = ref<HTMLElement | null>(null)
// 홈 · 전체 · 베스트는 고정 칸이라 빼거나 옮기지 않는다(정적 판 fixedIds와 같음).
const fixedIds = ['home', 'all', 'best']
let longPressTimer: ReturnType<typeof setTimeout> | undefined
let suppressChipClick = false
const lastFocusedElement = shallowRef<HTMLElement | null>(null)
const dragBoardId = ref<string | null>(null)
const sheetDragOffset = ref(0)
const sheetDragging = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | undefined
let reorderFrame: number | undefined
let sheetFrame: number | undefined
let reorderPoint: { x: number, y: number } | null = null
let sheetNextOffset = 0
let orderChangedDuringPointerDrag = false
let bodyScrollY = 0
let bodyInlineStyle: Pick<CSSStyleDeclaration, 'position' | 'top' | 'width' | 'overflow'> | null = null

type PointerAxis = 'pending' | 'horizontal' | 'vertical'

let reorderPointer: {
  pointerId: number
  startX: number
  startY: number
  active: boolean
  lastTargetId: string | null
} | null = null

let sheetPointer: {
  pointerId: number
  startX: number
  startY: number
  lastY: number
  lastTime: number
  velocityY: number
  axis: PointerAxis
} | null = null

const boardOrderStorageKey = 'bbm.community.boardShortcutOrder.v2'
const defaultOrder = computed(() => props.boards.map(board => board.id))
const myBoards = computed(() => myBoardIds.value.map(id => props.boards.find(board => board.id === id)).filter((board): board is CommunityBoard => Boolean(board)))
// 텐센트 비디오 全部频道처럼 추가할 게시판은 분류 탭을 누를 때마다 바꾸지 않고, 모든 분류를 구역 제목으로 이어서 보여 준다.
const availableSections = computed(() => props.sections.map(section => ({ section, boards: section.boards.filter(board => !myBoardIds.value.includes(board.id)) })))
const isFixed = (id: string) => fixedIds.includes(id)

function normalizedOrder(value: unknown) {
  if (!Array.isArray(value)) return defaultOrder.value
  const ids = value.filter((id): id is string => typeof id === 'string' && props.boards.some(board => board.id === id))
  if (ids.length === 0) return defaultOrder.value
  return [...new Set(ids)]
}

function loadState() {
  try {
    myBoardIds.value = normalizedOrder(JSON.parse(localStorage.getItem(boardOrderStorageKey) || 'null'))
  } catch {
    myBoardIds.value = defaultOrder.value
  }
}

function saveOrder() {
  localStorage.setItem(boardOrderStorageKey, JSON.stringify(myBoardIds.value))
}

function announce(message: string) {
  toastMessage.value = message
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMessage.value = '' }, 1800)
}

function close() {
  editing.value = false
  emit('close')
}

// 평소: 누르면 그 게시판으로 이동하고 창을 닫는다. 편집 중: 칸 어디를 눌러도 내 게시판에서 빠진다(바이두와 같음).
function onChipClick(board: CommunityBoard) {
  if (suppressChipClick) return
  if (editing.value) { removeBoard(board); return }
  emit('select', board.id)
  close()
}

// + 칸: 편집 중이 아니면 내 게시판 맨 끝에 넣고 바로 지금 게시판으로 바꾼다(창은 열린 채). 편집 중에는 넣기만 한다.
function addBoard(board: CommunityBoard) {
  if (myBoardIds.value.includes(board.id)) return
  myBoardIds.value = [...myBoardIds.value, board.id]
  saveOrder()
  if (!editing.value) emit('choose', board.id)
  announce(`${board.name}을 내 게시판에 추가했습니다`)
}

function removeBoard(board: CommunityBoard) {
  if (isFixed(board.id)) return
  myBoardIds.value = myBoardIds.value.filter(id => id !== board.id)
  saveOrder()
  if (board.id === props.selectedBoardId) emit('choose', 'home')
  announce(`${board.name}을 내 게시판에서 제외했습니다`)
}

function restoreDefault() {
  myBoardIds.value = defaultOrder.value
  saveOrder()
  announce('기본 게시판 순서로 되돌렸습니다')
}

// 평소 상태에서 칸을 0.45초 길게 누르면 편집 모드로 바뀐다(진동 12ms, 지원 기기만).
function onChipLongPressStart(event: PointerEvent) {
  if (editing.value) return
  const start = { x: event.clientX, y: event.clientY }
  clearTimeout(longPressTimer)
  const target = event.currentTarget as HTMLElement
  const cancel = (move?: PointerEvent) => {
    if (move && Math.abs(move.clientX - start.x) + Math.abs(move.clientY - start.y) <= 8) return
    clearTimeout(longPressTimer)
    target.removeEventListener('pointermove', cancel)
  }
  target.addEventListener('pointermove', cancel)
  target.addEventListener('pointerup', () => cancel(), { once: true })
  target.addEventListener('pointercancel', () => cancel(), { once: true })
  longPressTimer = setTimeout(() => {
    suppressChipClick = true
    setTimeout(() => { suppressChipClick = false }, 450)
    try { navigator.vibrate?.(12) } catch {}
    editing.value = true
  }, 450)
}

// 분류 탭: 누르면 그 구역 제목으로 스크롤, 굴리면 보이는 구역으로 탭이 따라 바뀐다.
let spyPausedUntil = 0
function scrollToSection(id: CommunitySectionId) {
  activeSectionId.value = id
  spyPausedUntil = Date.now() + 700
  const box = scrollBox.value
  const target = box?.querySelector<HTMLElement>(`[data-section-id="${id}"]`)
  const tabs = box?.querySelector<HTMLElement>('.board-section-tabs')
  if (!box || !target) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  box.scrollTo({ top: target.offsetTop - (tabs?.offsetHeight || 0) - 16, behavior: reduce ? 'auto' : 'smooth' })
}

function onScrollSpy() {
  const box = scrollBox.value
  if (!box || Date.now() < spyPausedUntil) return
  const tabs = box.querySelector<HTMLElement>('.board-section-tabs')
  const line = box.scrollTop + (tabs?.offsetHeight || 0) + 24
  let current = props.sections[0]!.id
  for (const el of box.querySelectorAll<HTMLElement>('[data-section-id]')) {
    if (el.offsetTop <= line) current = el.dataset.sectionId as CommunitySectionId
  }
  activeSectionId.value = current
}

function moveBoard(sourceId: string, targetId: string, persist = true) {
  if (isFixed(sourceId) || isFixed(targetId)) return false
  const sourceIndex = myBoardIds.value.indexOf(sourceId)
  const targetIndex = myBoardIds.value.indexOf(targetId)
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return false
  const next = [...myBoardIds.value]
  next.splice(sourceIndex, 1)
  next.splice(targetIndex, 0, sourceId)
  myBoardIds.value = next
  if (persist) saveOrder()
  return true
}

function onDragStart(event: DragEvent, id: string) {
  if (!editing.value || isFixed(id)) return event.preventDefault()
  dragBoardId.value = id
  event.dataTransfer?.setData('text/plain', id)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function onDrop(event: DragEvent, targetId: string) {
  event.preventDefault()
  const sourceId = dragBoardId.value || event.dataTransfer?.getData('text/plain')
  if (sourceId) moveBoard(sourceId, targetId)
  dragBoardId.value = null
}

function onDragEnd() {
  dragBoardId.value = null
}

function onPointerDown(event: PointerEvent, id: string) {
  if (!editing.value) { onChipLongPressStart(event); return }
  if (event.pointerType === 'mouse' || isFixed(id) || (event.target as HTMLElement).closest('.my-board-remove')) return
  dragBoardId.value = id
  orderChangedDuringPointerDrag = false
  reorderPointer = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    active: false,
    lastTargetId: id,
  }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (!editing.value || !dragBoardId.value || !reorderPointer || reorderPointer.pointerId !== event.pointerId) return

  if (!reorderPointer.active) {
    const distance = Math.hypot(event.clientX - reorderPointer.startX, event.clientY - reorderPointer.startY)
    if (distance < 8) return
    reorderPointer.active = true
  }

  event.preventDefault()
  reorderPoint = { x: event.clientX, y: event.clientY }
  if (reorderFrame !== undefined) return
  reorderFrame = requestAnimationFrame(() => {
    reorderFrame = undefined
    processReorderPoint()
  })
}

function processReorderPoint() {
  if (!reorderPoint || !reorderPointer || !dragBoardId.value) return
  const target = document.elementFromPoint(reorderPoint.x, reorderPoint.y)?.closest<HTMLElement>('[data-my-board-id]')
  const targetId = target?.dataset.myBoardId || null
  if (!targetId || targetId === reorderPointer.lastTargetId) return
  reorderPointer.lastTargetId = targetId
  orderChangedDuringPointerDrag = moveBoard(dragBoardId.value, targetId, false) || orderChangedDuringPointerDrag
}

function onPointerEnd(event: PointerEvent) {
  const element = event.currentTarget as HTMLElement
  if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId)
  if (reorderFrame !== undefined) cancelAnimationFrame(reorderFrame)
  reorderFrame = undefined
  processReorderPoint()
  if (orderChangedDuringPointerDrag) saveOrder()
  reorderPoint = null
  reorderPointer = null
  if (orderChangedDuringPointerDrag) { suppressChipClick = true; setTimeout(() => { suppressChipClick = false }, 0) }
  orderChangedDuringPointerDrag = false
  dragBoardId.value = null
}

function setSheetOffset(offset: number) {
  sheetNextOffset = Math.max(0, offset)
  if (sheetFrame !== undefined) return
  sheetFrame = requestAnimationFrame(() => {
    sheetFrame = undefined
    sheetDragOffset.value = sheetNextOffset
  })
}

function onSheetPointerDown(event: PointerEvent) {
  if (event.pointerType === 'mouse' || (event.target as HTMLElement).closest('button')) return
  sheetPointer = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    lastY: event.clientY,
    lastTime: event.timeStamp,
    velocityY: 0,
    axis: 'pending',
  }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onSheetPointerMove(event: PointerEvent) {
  if (!sheetPointer || sheetPointer.pointerId !== event.pointerId) return
  const deltaX = event.clientX - sheetPointer.startX
  const deltaY = event.clientY - sheetPointer.startY
  if (sheetPointer.axis === 'pending' && Math.hypot(deltaX, deltaY) >= 10) {
    sheetPointer.axis = Math.abs(deltaY) > Math.abs(deltaX) * 1.15 ? 'vertical' : 'horizontal'
    sheetDragging.value = sheetPointer.axis === 'vertical'
  }
  if (sheetPointer.axis !== 'vertical') return

  event.preventDefault()
  const elapsed = Math.max(1, event.timeStamp - sheetPointer.lastTime)
  sheetPointer.velocityY = (event.clientY - sheetPointer.lastY) / elapsed
  sheetPointer.lastY = event.clientY
  sheetPointer.lastTime = event.timeStamp
  setSheetOffset(deltaY > 0 ? deltaY : deltaY * .12)
}

function onSheetPointerEnd(event: PointerEvent) {
  const header = event.currentTarget as HTMLElement
  if (header.hasPointerCapture(event.pointerId)) header.releasePointerCapture(event.pointerId)
  if (!sheetPointer || sheetPointer.pointerId !== event.pointerId) return
  const shouldClose = sheetPointer.axis === 'vertical' && (sheetNextOffset >= 92 || sheetPointer.velocityY >= .55)
  sheetPointer = null
  sheetDragging.value = false
  if (sheetFrame !== undefined) cancelAnimationFrame(sheetFrame)
  sheetFrame = undefined
  sheetNextOffset = 0
  if (shouldClose) {
    sheetDragOffset.value = Math.max(sheetNextOffset, 120)
    requestAnimationFrame(close)
    return
  }
  sheetDragOffset.value = 0
}

function lockBodyScroll() {
  bodyScrollY = window.scrollY
  bodyInlineStyle = {
    position: document.body.style.position,
    top: document.body.style.top,
    width: document.body.style.width,
    overflow: document.body.style.overflow,
  }
  document.body.style.position = 'fixed'
  document.body.style.top = `-${bodyScrollY}px`
  document.body.style.width = '100%'
  document.body.style.overflow = 'hidden'
}

function unlockBodyScroll() {
  if (!bodyInlineStyle) return
  document.body.style.position = bodyInlineStyle.position
  document.body.style.top = bodyInlineStyle.top
  document.body.style.width = bodyInlineStyle.width
  document.body.style.overflow = bodyInlineStyle.overflow
  bodyInlineStyle = null
  window.scrollTo(0, bodyScrollY)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key !== 'Tab' || !panel.value) return
  const focusable = [...panel.value.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')]
  if (!focusable.length) return
  const first = focusable[0]!
  const last = focusable.at(-1)!
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(() => props.open, async (open) => {
  if (!import.meta.client) return
  const shell = document.querySelector<HTMLElement>('.community-shell')
  if (open) {
    sheetPointer = null
    sheetDragging.value = false
    sheetNextOffset = 0
    sheetDragOffset.value = 0
    loadState()
    activeSectionId.value = props.sections[0]!.id
    lastFocusedElement.value = document.activeElement as HTMLElement | null
    shell?.setAttribute('inert', '')
    lockBodyScroll()
    document.body.classList.add('has-board-shortcut-manager')
    await nextTick()
    panel.value?.querySelector<HTMLElement>('.board-manager-close')?.focus()
  } else {
    shell?.removeAttribute('inert')
    document.body.classList.remove('has-board-shortcut-manager')
    unlockBodyScroll()
    lastFocusedElement.value?.focus()
  }
}, { immediate: true })

onBeforeUnmount(() => {
  if (!import.meta.client) return
  document.querySelector<HTMLElement>('.community-shell')?.removeAttribute('inert')
  document.body.classList.remove('has-board-shortcut-manager')
  unlockBodyScroll()
  if (toastTimer) clearTimeout(toastTimer)
  clearTimeout(longPressTimer)
  if (reorderFrame !== undefined) cancelAnimationFrame(reorderFrame)
  if (sheetFrame !== undefined) cancelAnimationFrame(sheetFrame)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="board-manager-slide">
      <div v-if="open" class="board-manager-backdrop" :class="{ 'is-editing': editing }" @click.self="close">
        <section
          ref="panel"
          class="board-shortcut-manager"
          :class="{ 'is-sheet-dragging': sheetDragging }"
          :style="{ '--sheet-drag-y': `${sheetDragOffset}px` }"
          role="dialog"
          aria-modal="true"
          aria-labelledby="board-manager-title"
          @keydown="onKeydown"
        >
          <header
            class="board-manager-header"
            @pointerdown="onSheetPointerDown"
            @pointermove="onSheetPointerMove"
            @pointerup="onSheetPointerEnd"
            @pointercancel="onSheetPointerEnd"
          >
            <h2 id="board-manager-title">전체 게시판</h2>
            <button class="board-manager-close" type="button" aria-label="전체 게시판 닫기" @click="close"><img :src="`${iconRoot}/panel/chotot-close.svg`" alt="" /></button>
          </header>

          <div ref="scrollBox" class="board-manager-scroll" @scroll.passive="onScrollSpy">
            <div class="board-manager-heading">
              <strong>내 게시판</strong>
              <div class="board-manager-actions">
                <button class="board-manager-restore" type="button" @click="restoreDefault"><img :src="`${iconRoot}/panel/chotot-refresh.svg`" alt="" />기본값 복원</button>
                <button class="board-manager-edit" type="button" :aria-pressed="editing" @click="editing = !editing"><img v-if="!editing" :src="`${iconRoot}/panel/as24-pen.svg`" alt="" />{{ editing ? '완료' : '편집' }}</button>
              </div>
            </div>

            <div class="my-board-grid" :class="{ 'is-editing': editing }" aria-label="내 게시판">
              <div
                v-for="board in myBoards"
                :key="board.id"
                class="my-board-chip"
                :class="{ 'is-current': board.id === selectedBoardId, 'is-fixed': isFixed(board.id), 'is-dragging': dragBoardId === board.id }"
                :data-my-board-id="board.id"
                :draggable="editing && !isFixed(board.id)"
                @dragstart="onDragStart($event, board.id)"
                @dragover.prevent
                @drop="onDrop($event, board.id)"
                @dragend="onDragEnd"
                @pointerdown="onPointerDown($event, board.id)"
                @pointermove="onPointerMove"
                @pointerup="onPointerEnd"
                @pointercancel="onPointerEnd"
              >
                <button
                  class="my-board-select"
                  type="button"
                  :aria-label="editing && !isFixed(board.id) ? `${board.name} 내 게시판에서 제외` : undefined"
                  :aria-disabled="editing && isFixed(board.id)"
                  @click="onChipClick(board)"
                >{{ board.shortName || board.name }}</button>
                <span v-if="editing && !isFixed(board.id)" class="my-board-remove" aria-hidden="true"><img :src="`${iconRoot}/panel/chotot-delete.svg`" alt="" /></span>
              </div>
            </div>

            <section class="board-library" aria-label="추가할 게시판">
              <div class="board-section-tabs" role="tablist" aria-label="게시판 분류">
                <button
                  v-for="section in sections"
                  :key="section.id"
                  type="button"
                  role="tab"
                  :aria-selected="activeSectionId === section.id"
                  :class="{ 'is-active': activeSectionId === section.id }"
                  @click="scrollToSection(section.id)"
                >{{ section.name }}</button>
              </div>
              <div v-for="(item, index) in availableSections" :key="item.section.id" class="available-board-section" :data-section-id="item.section.id">
                <h3 :class="{ 'visually-hidden': index === 0 }">{{ item.section.name }}</h3>
                <div class="available-board-grid">
                  <button v-for="board in item.boards" :key="board.id" type="button" :aria-label="`${board.name} 내 게시판에 추가`" @click="addBoard(board)"><img :src="`${iconRoot}/panel/as24-plus-in-circle.svg`" alt="" /><span>{{ board.shortName || board.name }}</span></button>
                  <p v-if="!item.boards.length">모두 ‘내 게시판’에 추가했어요</p>
                </div>
              </div>
            </section>
          </div>

          <p class="visually-hidden" role="status" aria-live="polite">{{ toastMessage }}</p>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
