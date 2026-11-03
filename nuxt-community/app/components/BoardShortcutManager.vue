<script setup lang="ts">
import type { CommunityBoard, CommunitySection } from '~/types/community'

/**
 * Nuxt port of the canonical board manager from
 * public/community/naver-cafe-list.html + hupu-board-navigation.js @ 9758e991.
 * Keep its information architecture and interaction separate from the left Reddit drawer.
 */
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

type MenuSection = '일반' | '자동차' | '차량/운송' | '사건제보' | '결함/불만'

const fixedIds = ['home', 'all', 'best'] as const
const menuSections: MenuSection[] = ['일반', '자동차', '차량/운송', '사건제보', '결함/불만']
const defaultExcludedIds = new Set(['adult', 'installation', 'free-media', 'caution', 'racing-model', 'military'])
const canonicalOrderIds = [
  'free', 'car-news', 'foreign-car-news', 'brand-car-info', 'vehicle-review', 'tuhu-review', 'fuel-economy',
  'autohome-complaint', 'chezhiwang-complaint', 'politics', 'test-drive', 'celebrity-car', 'adult', 'boba-story',
  'suggestion', 'kbo', 'mlb', 'overseas-football', 'domestic-football', 'f1', 'event', 'new-humor', 'humor',
  'accident-blackbox', 'domestic-car', 'import-car', 'tesla', 'bmw', 'mercedes-benz', 'my-car-photo', 'scoop',
  'car-media', 'installation', 'free-media', 'caution', 'racing-model', 'military', 'truck-bus-heavy',
  'aviation-rail', 'bike-cycle', 'oldcar-memory',
]
const storageKey = 'bbm.community.boardChannels.v2'
const legacyStorageKey = 'bbm.community.boardOrder.v1'

const panel = ref<HTMLElement | null>(null)
const scrollBody = ref<HTMLElement | null>(null)
const editing = ref(false)
const activeSection = ref<MenuSection>('일반')
const activeOrder = ref<string[]>([])
const dragBoardId = ref<string | null>(null)
const toastMessage = ref('')
const lastFocusedElement = shallowRef<HTMLElement | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | undefined
let bodyScrollY = 0
let bodyInlineStyle: Pick<CSSStyleDeclaration, 'position' | 'top' | 'width' | 'overflow'> | null = null

const assetBase = `${useRuntimeConfig().app.baseURL}community/media/panel-icons`
const movableBoards = computed(() => canonicalOrderIds
  .map(id => props.boards.find(board => board.id === id))
  .filter((board): board is CommunityBoard => Boolean(board)))
const defaultActiveOrder = computed(() => movableBoards.value.filter(board => !defaultExcludedIds.has(board.id)).map(board => board.id))
const boardById = computed(() => new Map(props.boards.map(board => [board.id, board])))
const fixedBoards = computed(() => fixedIds.map(id => boardById.value.get(id)).filter((board): board is CommunityBoard => Boolean(board)))
const myBoards = computed(() => activeOrder.value.map(id => boardById.value.get(id)).filter((board): board is CommunityBoard => Boolean(board)))
const menuGroups = computed(() => menuSections.map(name => ({
  name,
  boards: movableBoards.value.filter(board => menuSectionFor(board) === name),
})))

function menuSectionFor(board: CommunityBoard): MenuSection {
  if (board.sectionId === 'cars') return '자동차'
  if (board.sectionId === 'vehicles') return '차량/운송'
  if (board.sectionId === 'reports') return '사건제보'
  if (board.sectionId === 'defects') return '결함/불만'
  return '일반'
}

function normalizeOrder(value: unknown, appendMissing = false) {
  const validIds = new Set(movableBoards.value.map(board => board.id))
  const normalized = Array.isArray(value)
    ? value.filter((id): id is string => typeof id === 'string' && validIds.has(id))
    : []
  const unique = [...new Set(normalized)]
  if (appendMissing) defaultActiveOrder.value.forEach((id) => { if (!unique.includes(id)) unique.push(id) })
  return unique
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null') as { version?: number, activeOrder?: unknown } | null
    if (saved?.version === 2 && Array.isArray(saved.activeOrder)) {
      const normalized = normalizeOrder(saved.activeOrder)
      activeOrder.value = normalized.length ? normalized : defaultActiveOrder.value
      return
    }
  } catch {}
  try {
    const legacy = JSON.parse(localStorage.getItem(legacyStorageKey) || 'null')
    const normalized = normalizeOrder(legacy, true)
    if (normalized.length) {
      activeOrder.value = normalized
      saveState()
      return
    }
  } catch {}
  activeOrder.value = defaultActiveOrder.value
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify({
    version: 2,
    menuProfileVersion: 1,
    fixedIds: [...fixedIds],
    activeOrder: activeOrder.value,
    updatedAt: new Date().toISOString(),
  }))
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

function toggleEditing() {
  editing.value = !editing.value
  announce(editing.value ? '게시판 편집을 시작했습니다' : '게시판 편집을 마쳤습니다')
}

function resetOrder() {
  activeOrder.value = defaultActiveOrder.value
  saveState()
  announce('기본값으로 복원했습니다')
}

function addBoard(board: CommunityBoard) {
  if (activeOrder.value.includes(board.id)) return
  activeOrder.value = [...activeOrder.value, board.id]
  saveState()
  announce(`${board.name} 내 게시판에 추가`)
}

function removeBoard(board: CommunityBoard) {
  activeOrder.value = activeOrder.value.filter(id => id !== board.id)
  saveState()
  announce(`${board.name} 내 게시판에서 제외`)
}

function moveBoard(sourceId: string, targetId: string, persist = true) {
  const sourceIndex = activeOrder.value.indexOf(sourceId)
  const targetIndex = activeOrder.value.indexOf(targetId)
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return
  const next = [...activeOrder.value]
  next.splice(sourceIndex, 1)
  next.splice(targetIndex, 0, sourceId)
  activeOrder.value = next
  if (persist) saveState()
}

function onDragStart(event: DragEvent, boardId: string) {
  if (!editing.value) return event.preventDefault()
  dragBoardId.value = boardId
  event.dataTransfer?.setData('text/plain', boardId)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function onDrop(event: DragEvent, targetId: string) {
  event.preventDefault()
  const sourceId = dragBoardId.value || event.dataTransfer?.getData('text/plain')
  if (sourceId) moveBoard(sourceId, targetId)
  dragBoardId.value = null
}

function onTouchPointerMove(event: PointerEvent) {
  if (!editing.value || !dragBoardId.value || event.pointerType === 'mouse') return
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-movable="true"]')
  const targetId = target?.dataset.boardId
  if (targetId && targetId !== dragBoardId.value) moveBoard(dragBoardId.value, targetId, false)
}

function onTouchPointerEnd() {
  if (dragBoardId.value) saveState()
  dragBoardId.value = null
}

function selectMenuSection(name: MenuSection) {
  activeSection.value = name
  const target = scrollBody.value?.querySelector<HTMLElement>(`.boardOrderAvailableSection[data-section="${name}"]`)
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function onBodyScroll() {
  const body = scrollBody.value
  if (!body) return
  const tabs = body.querySelector<HTMLElement>('.boardOrderSectionTabs')
  const line = Math.max(tabs?.getBoundingClientRect().bottom || 0, body.getBoundingClientRect().top) + 24
  const sections = [...body.querySelectorAll<HTMLElement>('.boardOrderAvailableSection')]
  let current: MenuSection | undefined
  if (body.scrollTop + body.clientHeight >= body.scrollHeight - 2) current = sections.at(-1)?.dataset.section as MenuSection | undefined
  else sections.forEach((section) => { if (section.getBoundingClientRect().top <= line) current = section.dataset.section as MenuSection })
  if (current) activeSection.value = current
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
    loadState()
    activeSection.value = '일반'
    lastFocusedElement.value = document.activeElement as HTMLElement | null
    shell?.setAttribute('inert', '')
    lockBodyScroll()
    document.body.classList.add('boardOrderOpen')
    await nextTick()
    panel.value?.focus({ preventScroll: true })
  } else {
    shell?.removeAttribute('inert')
    document.body.classList.remove('boardOrderOpen')
    unlockBodyScroll()
    lastFocusedElement.value?.focus()
  }
}, { immediate: true })

onBeforeUnmount(() => {
  if (!import.meta.client) return
  document.querySelector<HTMLElement>('.community-shell')?.removeAttribute('inert')
  document.body.classList.remove('boardOrderOpen')
  unlockBodyScroll()
  if (toastTimer) clearTimeout(toastTimer)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="boardOrderBackdrop" @click.self="close">
      <section ref="panel" class="boardOrderPanel" role="dialog" aria-modal="true" aria-labelledby="boardOrderTitle" tabindex="-1" @keydown="onKeydown">
        <header class="boardOrderHeader">
          <h2 id="boardOrderTitle">전체 게시판</h2>
          <button class="boardOrderClose" type="button" aria-label="닫기" @click="close">
            <img :src="`${assetBase}/chotot-close.svg`" alt="">
          </button>
        </header>

        <div ref="scrollBody" class="boardOrderBody" @scroll.passive="onBodyScroll">
          <div class="boardOrderHeading">
            <div><strong>내 게시판</strong><span class="boardOrderGuide">{{ editing ? '끌어서 순서 바꾸기' : '눌러서 게시판 이동' }}</span></div>
            <div class="boardOrderHeadActions">
              <button class="boardOrderRestore" type="button" @click="resetOrder">
                <img :src="`${assetBase}/chotot-refresh.svg`" alt="">기본값 복원
              </button>
              <button class="boardOrderEdit" type="button" :aria-pressed="editing" @click="toggleEditing">
                <img :src="`${assetBase}/as24-pen.svg`" alt=""><span class="boardOrderEditLabel">{{ editing ? '완료' : '편집' }}</span>
              </button>
            </div>
          </div>

          <div class="boardOrderMyGrid">
            <div
              v-for="board in fixedBoards"
              :key="board.id"
              class="boardOrderItem boardOrderFixed"
              :class="{ selected: board.id === selectedBoardId }"
              :aria-current="board.id === selectedBoardId ? 'page' : undefined"
              :aria-disabled="editing"
              :role="editing ? undefined : 'button'"
              :tabindex="editing ? -1 : 0"
              @click="selectBoard(board.id)"
              @keydown.enter.prevent="selectBoard(board.id)"
              @keydown.space.prevent="selectBoard(board.id)"
            ><span class="boardOrderName">{{ board.shortName || board.name }}</span></div>

            <div
              v-for="board in myBoards"
              :key="board.id"
              class="boardOrderItem"
              :class="{ selected: board.id === selectedBoardId, editing, dragging: dragBoardId === board.id }"
              role="button"
              tabindex="0"
              :draggable="editing"
              :data-board-id="board.id"
              data-movable="true"
              :aria-current="board.id === selectedBoardId ? 'page' : undefined"
              @click="selectBoard(board.id)"
              @keydown.enter.prevent="selectBoard(board.id)"
              @keydown.space.prevent="selectBoard(board.id)"
              @dragstart="onDragStart($event, board.id)"
              @dragover.prevent
              @drop="onDrop($event, board.id)"
              @dragend="onTouchPointerEnd"
              @pointerdown="editing && $event.pointerType !== 'mouse' ? (dragBoardId = board.id) : undefined"
              @pointermove="onTouchPointerMove"
              @pointerup="onTouchPointerEnd"
              @pointercancel="onTouchPointerEnd"
            >
              <span class="boardOrderName">{{ board.shortName || board.name }}</span>
              <button v-if="editing" class="boardOrderRemove" type="button" :aria-label="`${board.name} 내 게시판에서 제외`" @click.stop="removeBoard(board)">
                <img :src="`${assetBase}/chotot-delete.svg`" alt="">
              </button>
            </div>
          </div>

          <div class="boardOrderAvailable">
            <div class="boardOrderSectionTabs" role="tablist" aria-label="게시판 분류">
              <button
                v-for="name in menuSections"
                :key="name"
                type="button"
                role="tab"
                :class="{ on: activeSection === name }"
                :aria-selected="activeSection === name"
                :tabindex="activeSection === name ? 0 : -1"
                @click="selectMenuSection(name)"
              >{{ name }}</button>
            </div>

            <div class="boardOrderAvailableSections">
              <section v-for="(group, index) in menuGroups" :key="group.name" class="boardOrderAvailableSection" :data-section="group.name">
                <h3 v-if="index > 0" class="boardOrderAvailableTitle">{{ group.name }}</h3>
                <div v-if="group.boards.some(board => !activeOrder.includes(board.id))" class="boardOrderAvailableGrid">
                  <button v-for="board in group.boards.filter(item => !activeOrder.includes(item.id))" :key="board.id" class="boardOrderAdd" type="button" @click="addBoard(board)">
                    <span>{{ board.shortName || board.name }}</span><img class="boardOrderPlusIcon" :src="`${assetBase}/as24-plus-in-circle.svg`" alt="">
                  </button>
                </div>
                <p v-else class="boardOrderSectionEmpty">모두 ‘내 게시판’에 추가했어요</p>
              </section>
            </div>
          </div>

          <p class="boardOrderHint">변경 내용은 바로 저장되며, 제외한 게시판은 아래에서 다시 추가할 수 있습니다.</p>
        </div>

        <div v-if="toastMessage" class="boardOrderToast" role="status" aria-live="polite"><span class="boardOrderToastText">{{ toastMessage }}</span></div>
        <div class="boardOrderLive" aria-live="polite" aria-atomic="true" />
      </section>
    </div>
  </Teleport>
</template>
