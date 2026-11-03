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
}>()

const panel = ref<HTMLElement | null>(null)
const editing = ref(false)
const activeSectionId = ref<CommunitySectionId>('general')
const myBoardIds = ref<string[]>([])
const defaultBoardId = ref('free')
const toastMessage = ref('')
const lastFocusedElement = shallowRef<HTMLElement | null>(null)
const dragBoardId = ref<string | null>(null)
const sheetDragOffset = ref(0)
const sheetDragging = ref(false)
const sectionDragOffset = ref(0)
const sectionDragging = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | undefined
let reorderFrame: number | undefined
let sheetFrame: number | undefined
let sectionFrame: number | undefined
let reorderPoint: { x: number, y: number } | null = null
let sheetNextOffset = 0
let sectionNextOffset = 0
let orderChangedDuringPointerDrag = false
let suppressSectionClick = false
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

let sectionPointer: {
  pointerId: number
  startX: number
  startY: number
  lastX: number
  lastTime: number
  velocityX: number
  axis: PointerAxis
} | null = null

const boardOrderStorageKey = 'bbm.community.boardShortcutOrder.v2'
const defaultBoardStorageKey = 'bbm.community.defaultBoard.v1'
const defaultOrder = computed(() => props.boards.map(board => board.id))
const myBoards = computed(() => myBoardIds.value.map(id => props.boards.find(board => board.id === id)).filter((board): board is CommunityBoard => Boolean(board)))
const activeSection = computed(() => props.sections.find(section => section.id === activeSectionId.value) || props.sections[0]!)
const availableBoards = computed(() => activeSection.value.boards.filter(board => !myBoardIds.value.includes(board.id)))
const defaultBoard = computed(() => props.boards.find(board => board.id === defaultBoardId.value) || props.boards[0]!)

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
  const savedDefault = localStorage.getItem(defaultBoardStorageKey)
  defaultBoardId.value = savedDefault && props.boards.some(board => board.id === savedDefault) ? savedDefault : props.selectedBoardId
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

function selectBoard(id: string) {
  if (editing.value) return
  emit('select', id)
  close()
}

function addBoard(board: CommunityBoard) {
  if (myBoardIds.value.includes(board.id)) return
  myBoardIds.value = [...myBoardIds.value, board.id]
  saveOrder()
  announce(`${board.name}을 내 게시판에 추가했습니다`)
}

function removeBoard(board: CommunityBoard) {
  if (myBoardIds.value.length <= 1) {
    announce('내 게시판은 한 개 이상 필요합니다')
    return
  }
  myBoardIds.value = myBoardIds.value.filter(id => id !== board.id)
  if (defaultBoardId.value === board.id) {
    defaultBoardId.value = myBoardIds.value[0]!
    localStorage.setItem(defaultBoardStorageKey, defaultBoardId.value)
  }
  saveOrder()
  announce(`${board.name}을 내 게시판에서 제외했습니다`)
}

function setCurrentAsDefault() {
  defaultBoardId.value = props.selectedBoardId
  localStorage.setItem(defaultBoardStorageKey, defaultBoardId.value)
  announce(`${props.boards.find(board => board.id === defaultBoardId.value)?.name || '현재 게시판'}을 기본 홈으로 설정했습니다`)
}

function resetOrder() {
  myBoardIds.value = defaultOrder.value
  saveOrder()
  announce('기본 게시판 순서로 초기화했습니다')
}

function moveBoard(sourceId: string, targetId: string, persist = true) {
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
  if (!editing.value) return event.preventDefault()
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
  if (!editing.value || event.pointerType === 'mouse' || (event.target as HTMLElement).closest('.my-board-remove')) return
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

function setSectionOffset(offset: number) {
  sectionNextOffset = offset
  if (sectionFrame !== undefined) return
  sectionFrame = requestAnimationFrame(() => {
    sectionFrame = undefined
    sectionDragOffset.value = sectionNextOffset
  })
}

function onSectionPointerDown(event: PointerEvent) {
  if (event.pointerType === 'mouse' || (event.target as HTMLElement).closest('.board-section-tabs')) return
  sectionPointer = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    lastX: event.clientX,
    lastTime: event.timeStamp,
    velocityX: 0,
    axis: 'pending',
  }
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onSectionPointerMove(event: PointerEvent) {
  if (!sectionPointer || sectionPointer.pointerId !== event.pointerId) return
  const deltaX = event.clientX - sectionPointer.startX
  const deltaY = event.clientY - sectionPointer.startY
  if (sectionPointer.axis === 'pending' && Math.hypot(deltaX, deltaY) >= 10) {
    sectionPointer.axis = Math.abs(deltaX) > Math.abs(deltaY) * 1.15 ? 'horizontal' : 'vertical'
    sectionDragging.value = sectionPointer.axis === 'horizontal'
  }
  if (sectionPointer.axis !== 'horizontal') return

  event.preventDefault()
  const elapsed = Math.max(1, event.timeStamp - sectionPointer.lastTime)
  sectionPointer.velocityX = (event.clientX - sectionPointer.lastX) / elapsed
  sectionPointer.lastX = event.clientX
  sectionPointer.lastTime = event.timeStamp

  const currentIndex = props.sections.findIndex(section => section.id === activeSectionId.value)
  const atStart = currentIndex <= 0 && deltaX > 0
  const atEnd = currentIndex >= props.sections.length - 1 && deltaX < 0
  setSectionOffset((atStart || atEnd) ? deltaX * .24 : deltaX)
}

function onSectionPointerEnd(event: PointerEvent) {
  const library = event.currentTarget as HTMLElement
  if (library.hasPointerCapture(event.pointerId)) library.releasePointerCapture(event.pointerId)
  if (!sectionPointer || sectionPointer.pointerId !== event.pointerId) return
  const currentIndex = props.sections.findIndex(section => section.id === activeSectionId.value)
  const distance = sectionNextOffset
  const velocity = sectionPointer.velocityX
  suppressSectionClick = sectionPointer.axis === 'horizontal' && Math.abs(distance) >= 10
  const direction = distance < -52 || velocity < -.45 ? 1 : distance > 52 || velocity > .45 ? -1 : 0
  const nextIndex = Math.min(props.sections.length - 1, Math.max(0, currentIndex + direction))
  if (direction !== 0 && nextIndex !== currentIndex) activeSectionId.value = props.sections[nextIndex]!.id
  sectionPointer = null
  sectionDragging.value = false
  if (sectionFrame !== undefined) cancelAnimationFrame(sectionFrame)
  sectionFrame = undefined
  sectionNextOffset = 0
  sectionDragOffset.value = 0
  if (suppressSectionClick) setTimeout(() => { suppressSectionClick = false }, 0)
}

function onSectionClickCapture(event: MouseEvent) {
  if (!suppressSectionClick) return
  event.preventDefault()
  event.stopPropagation()
}

function selectSection(id: CommunitySectionId, event: MouseEvent) {
  activeSectionId.value = id
  ;(event.currentTarget as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
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
  if (reorderFrame !== undefined) cancelAnimationFrame(reorderFrame)
  if (sheetFrame !== undefined) cancelAnimationFrame(sheetFrame)
  if (sectionFrame !== undefined) cancelAnimationFrame(sectionFrame)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="board-manager-slide">
      <div v-if="open" class="board-manager-backdrop" @click.self="close">
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
            <button class="board-manager-close" type="button" aria-label="전체 게시판 닫기" @click="close">×</button>
          </header>

          <div class="board-manager-scroll">
            <button class="board-default-entry" type="button" @click="setCurrentAsDefault">
              <strong>기본 홈 설정</strong>
              <span>{{ defaultBoard.name }}</span>
              <b aria-hidden="true">›</b>
            </button>

            <div class="board-manager-heading">
              <div><strong>내 게시판</strong><span>{{ editing ? '길게 눌러 순서를 변경하세요' : '누르면 해당 게시판으로 이동합니다' }}</span></div>
              <button type="button" :aria-pressed="editing" @click="editing = !editing">{{ editing ? '완료' : '편집' }}</button>
            </div>

            <div class="my-board-grid" :class="{ 'is-editing': editing }" aria-label="내 게시판">
              <div
                v-for="board in myBoards"
                :key="board.id"
                class="my-board-chip"
                :class="{ 'is-current': board.id === selectedBoardId, 'is-dragging': dragBoardId === board.id }"
                :data-my-board-id="board.id"
                :draggable="editing"
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
                  :aria-disabled="editing"
                  :tabindex="editing ? -1 : 0"
                  @click="selectBoard(board.id)"
                >{{ board.name }}</button>
                <button v-if="editing" class="my-board-remove" type="button" :aria-label="`${board.name} 내 게시판에서 제외`" @click="removeBoard(board)">×</button>
              </div>
            </div>

            <section
              class="board-library"
              :class="{ 'is-section-dragging': sectionDragging }"
              :style="{ '--section-drag-x': `${sectionDragOffset}px` }"
              aria-labelledby="board-library-title"
              @pointerdown="onSectionPointerDown"
              @pointermove="onSectionPointerMove"
              @pointerup="onSectionPointerEnd"
              @pointercancel="onSectionPointerEnd"
              @click.capture="onSectionClickCapture"
            >
              <div class="board-section-tabs" role="tablist" aria-label="게시판 분류">
                <button
                  v-for="section in sections"
                  :key="section.id"
                  type="button"
                  role="tab"
                  :aria-selected="activeSectionId === section.id"
                  :class="{ 'is-active': activeSectionId === section.id }"
                  @click="selectSection(section.id, $event)"
                >{{ section.name }}</button>
              </div>
              <h3 id="board-library-title" class="visually-hidden">{{ activeSection.name }} 게시판</h3>
              <div class="available-board-grid">
                <button v-for="board in availableBoards" :key="board.id" type="button" @click="addBoard(board)"><span>{{ board.name }}</span><b aria-hidden="true">＋</b></button>
                <p v-if="!availableBoards.length">이 분류의 모든 게시판이 내 게시판에 추가되어 있습니다.</p>
              </div>
            </section>

            <button v-if="editing" class="board-order-reset" type="button" @click="resetOrder">기본 순서로 초기화</button>
            <p class="board-manager-hint">변경 내용은 바로 저장되며, 제외한 게시판은 아래에서 다시 추가할 수 있습니다.</p>
          </div>

          <p v-if="toastMessage" class="board-manager-toast" role="status" aria-live="polite">{{ toastMessage }}</p>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

