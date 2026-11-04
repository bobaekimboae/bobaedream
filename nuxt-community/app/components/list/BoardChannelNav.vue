<script setup lang="ts">
// 게시판 탑메뉴(바이두식 탭 줄 + 오른쪽 「게시판 바로가기」 버튼). hupu-board-navigation.js renderNav · setupChannelFade 이식.
import { boardById } from '~/composables/list/listBoards'
import { useListNavCtx } from '~/composables/list/useListNav'

const emit = defineEmits<{ openPanel: [opener: HTMLElement | null] }>()
const nav = useListNavCtx()
const a = (p: string) => communityAsset(p)
const scroller = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)
const menuButton = ref<HTMLElement | null>(null)
const hasLeft = ref(false)
const items = computed(() => [
  { id: 'home', label: '홈', full: '커뮤니티 홈', home: true },
  { id: 'all', label: '전체', full: '전체 게시글', home: false },
  { id: 'best', label: '베스트', full: '베스트글', home: false },
  ...nav.activeOrder.value.map(id => boardById[id]).filter(Boolean).map(b => ({ id: b!.id, label: b!.shortName, full: b!.displayName, home: false })),
])
function upd() { if (scroller.value) hasLeft.value = scroller.value.scrollLeft > 2 }
function scrollSelected() {
  requestAnimationFrame(() => {
    const selected = track.value?.querySelector('.boardChannelTab.on')
    if (selected) selected.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  })
}
watch(() => nav.scrollSignal.value, () => nextTick(scrollSelected))
onMounted(() => {
  window.addEventListener('resize', upd)
  setTimeout(upd, 0)
  setTimeout(upd, 600)
  scrollSelected()
})
onBeforeUnmount(() => window.removeEventListener('resize', upd))
defineExpose({ menuButton })
</script>

<template>
  <nav id="boardChannelNav" class="boardChannelNav" aria-label="게시판 빠른 이동">
    <div id="boardChannelScroller" ref="scroller" :class="['boardChannelScroller', { hasLeft }]" @scroll.passive="upd">
      <div id="boardChannelTrack" ref="track" class="boardChannelTrack">
        <button
          v-for="item in items"
          :key="item.id"
          :class="['boardChannelTab', { home: item.home, on: nav.navOn.value === item.id }]"
          :data-board-id="item.id"
          :aria-label="item.full"
          :aria-current="nav.navCurrent.value === item.id ? 'page' : undefined"
          @click="nav.choose(item.id)"
        ><span>{{ item.label }}</span></button>
      </div>
    </div>
    <button id="boardOrderMenu" ref="menuButton" class="boardOrderMenu" aria-label="게시판 바로가기" @click="emit('openPanel', menuButton)"><img :src="a('assets/reddit-ui/menu.svg')" alt=""></button>
  </nav>
</template>
