<script setup lang="ts">
// 초톳 피드형 · 게시판형 / 딜러형(chotot-feed.js 이식). 사진 줄 가로 넘김 · 크게 보기 창 · 추천 · 저장 · 공유.
import type { ListPost } from '~/composables/list/listData'
import { cleanTitle } from '~/composables/list/listFormat'
import { useListPageCtx } from '~/composables/list/useListPage'

const props = defineProps<{ dealer: boolean }>()
const page = useListPageCtx()
const router = useRouter()
const a = (p: string) => communityAsset(p)
const avatarAssets = ['assets/chzzk-detail/author-avatar.png', 'assets/chzzk-detail/comment-avatar.gif', 'assets/chzzk-detail/default-user.png', 'assets/chzzk-detail/chzzk-operator-avatar.png', 'assets/chzzk-detail/comment-anonymous-avatar.png']
// 정적 판과 같은 계산: github.io 에서는 /bobaedream/assets/…, 그 밖(로컬)에서는 /assets/…
const projectAssetRoot = (/github\.io$/i.test(location.hostname) ? '/bobaedream' : '') + '/assets/'
const carAssets = Array.from({ length: 30 }, (_, i) => projectAssetRoot + 'cars/supercar-sheet-v01/sc-' + String(i + 1).padStart(3, '0') + '.jpg?v=20261015realfeed3')
const feedScenarios: Array<{ title: string; user: string; time: string; reply: number; media: number[]; layout: string[]; body: string }> = [
  { title: '주말 모임에 등장한 블루 SUV, 실물 색감은 이렇습니다', user: '성수동카스팟', time: '방금 전', reply: 18, media: [1, 4, 12, 15, 18, 22], layout: ['landscape', 'portrait', 'square', 'landscape', 'portrait', 'square'], body: '주말 자동차 모임에서 직접 촬영한 차량들입니다. 전시장 조명과 야외 자연광에서 색감이 어떻게 달라지는지 순서대로 담았습니다.' },
  { title: '수입차 전시장 실물 비교, 사진으로 먼저 보세요', user: '전시장한바퀴', time: '3분 전', reply: 31, media: [2, 3, 5, 6, 11], layout: ['landscape', 'landscape', 'square', 'square', 'portrait'], body: '같은 날 여러 전시장을 돌며 촬영했습니다. 차체 비율과 전면 디자인을 비교하기 쉽도록 정면과 측면 사진을 함께 올립니다.' },
  { title: '도산대로에서 만난 슈퍼카, 디테일 사진 모음', user: '도산대로직찍', time: '8분 전', reply: 42, media: [3, 9, 14], layout: ['landscape', 'portrait', 'square'], body: '도로에서 직접 본 차량을 안전한 위치에서 촬영했습니다. 사진을 좌우로 넘기면 전면, 휠, 후면 순서로 확인할 수 있습니다.' },
  { title: '블루 SUV 두 대 직접 비교해봤습니다', user: '패밀리카고민중', time: '17분 전', reply: 24, media: [1, 4, 17, 21], layout: ['landscape', 'landscape', 'portrait', 'square'], body: '패밀리카로 고민 중인 두 차량을 같은 기준으로 비교했습니다. 2열 공간과 트렁크, 휠 크기는 상세 사진에서 확인해 주세요.' },
  { title: '레드 페라리 출고 전 검수 사진 공유합니다', user: '출고검수팀장', time: '29분 전', reply: 15, media: [5, 7, 8, 16], layout: ['landscape', 'landscape', 'square', 'portrait'], body: '인도 전에 도장면과 휠, 실내 버튼 작동 상태를 확인했습니다. 사진은 보정하지 않은 원본 색감에 가깝게 올렸습니다.' },
  { title: '야간 주행 영상과 실제 배기음 기록', user: '밤드라이브', time: '41분 전', reply: 57, media: [10], layout: ['video'], body: '교통 법규를 지키며 촬영한 짧은 주행 영상입니다. 소리는 이어폰보다 휴대폰 스피커 기준으로 자연스럽게 들리도록 정리했습니다.' },
  { title: '오늘 입고된 중고 슈퍼카, 첫 점검 사진', user: '중고차보는눈', time: '1시간 전', reply: 36, media: [11], layout: ['landscape'], body: '입고 직후 세차 전 상태에서 촬영했습니다. 외판 단차와 타이어 마모, 실내 사용감은 계약 전에 한 번 더 확인할 예정입니다.' },
  { title: '동호회 차량 스티커 실제 부착 위치 비교', user: '스티커장인', time: '2시간 전', reply: 9, media: [13, 20], layout: ['square', 'landscape'], body: '같은 크기의 스티커를 유리와 차체에 각각 대봤습니다. 운전 시야를 가리지 않으면서 사진에도 잘 보이는 위치를 비교했습니다.' },
  { title: '구매 전 확인한 외관·휠·실내 사진 5장', user: '현금완납러', time: '3시간 전', reply: 68, media: [6, 8, 19, 23, 27], layout: ['landscape', 'portrait', 'square', 'landscape', 'portrait'], body: '매물 설명만으로 부족했던 부분을 현장에서 직접 촬영했습니다. 휠 스크래치와 시트 주름, 트렁크 마감까지 차례대로 확인할 수 있습니다.' },
  { title: '중고차 매물 볼 때 사진으로 먼저 거르는 기준', user: '성능기록부필수', time: '5시간 전', reply: 73, media: [24, 25, 26], layout: ['landscape', 'square', 'portrait'], body: '성능기록부를 보기 전에도 사진에서 확인할 수 있는 항목을 정리했습니다. 패널 간격, 타이어 편마모, 실내 버튼 마모를 먼저 살펴보세요.' },
]
const layouts = [
  ['portrait', 'portrait', 'portrait', 'portrait', 'portrait', 'portrait'], ['tall', 'tall', 'tall', 'tall', 'tall'], ['portrait', 'square'], ['portrait', 'landscape', 'portrait'],
  ['portrait', 'portrait', 'portrait', 'portrait'], ['video'], ['landscape'], ['square'], ['portrait', 'tall', 'square', 'landscape', 'portrait'], [],
]
const bodyCopy = [
  '주말 모임에서 촬영한 차량들입니다. 사진마다 비율이 달라도 잘리지 않게 한 줄로 넘겨볼 수 있도록 정리했습니다.', '세로로 찍은 실내 사진과 외관 사진을 함께 올립니다. 실제 색감과 옵션 구성을 확인하실 분은 사진을 눌러 크게 보세요.',
  '정비 전후 사진을 비교해 봤습니다. 첫 사진은 작업 전이고 두 번째 사진은 출고 직후입니다.', '출퇴근하면서 일주일 타본 후기입니다. 승차감과 정숙성은 기대 이상이었고 연비도 함께 기록해 두었습니다.',
  '이번 행사에서 직접 본 신차입니다. 앞모습부터 실내까지 순서대로 넘기면 전체 구성이 자연스럽게 이어집니다.', '짧게 촬영한 주행 영상입니다. 재생 버튼을 누르면 전체 화면에서 바로 확인할 수 있습니다.',
  '오늘 출고한 차량 한 장 남깁니다. 인도 전에 광택과 실내 검수까지 마쳤습니다.', '동호회 스티커 시안을 공유합니다. 실제 부착 크기와 색상을 한 번 더 조정하려고 합니다.',
  '차량 구입을 고민하는 분들을 위해 외관, 휠, 실내, 트렁크 순서로 사진을 모았습니다. 여러 비율의 사진을 좌우로 넘겨 확인할 수 있습니다.', '요즘 중고차 매물을 볼 때 꼭 확인하는 항목을 정리했습니다. 성능기록부와 보험 이력, 이전비 항목은 계약 전에 다시 확인하세요.',
]
const videoAssets = ['media/car-driving-road-v01.mp4', 'media/car-sunset-drive-v01.mp4', 'media/car-desert-drone-v01.mp4']
const redditIcon = (name: string) => a(({ bookmark: 'assets/reddit-ui/icon-save-outline.svg', 'bookmark-fill': 'assets/reddit-ui/icon-save-fill.svg', close: 'assets/reddit-ui/icon-close-outline.svg', 'vote-up': 'assets/reactions/recommend.svg', 'vote-down': 'assets/reactions/dislike.svg' } as Record<string, string>)[name] || 'assets/chzzk-detail/icons/' + name + '.svg?v=20261015chototfeed1')
const uiIcon = (name: string) => a('assets/reddit-ui/' + name + '.svg?v=20261016redditicons1')

type Item = { kind: string; src: string; ratio: string; poster?: string }
const cards = computed(() => {
  void page.renderSeq.value
  return page.bobaePosts.value.slice(0, 10).map((post, index) => {
    const p = { ...post, ...(feedScenarios[index] || {}) } as ListPost & { media?: number[]; layout?: string[]; body?: string | string[] }
    const layout = (p.layout as string[] | undefined) || layouts[index % layouts.length]!
    const media = (p.media as unknown as number[] | undefined)
    const source = (itemIndex: number) => {
      const selected = media && media.length ? media[itemIndex % media.length] : ((index * 3 + itemIndex) % carAssets.length) + 1
      return carAssets[(Math.max(1, Number(selected) || 1) - 1) % carAssets.length]!
    }
    const items: Item[] = layout.map((ratio, itemIndex) => (ratio === 'video'
      ? { kind: 'video', src: a(videoAssets[index % videoAssets.length]!), ratio: 'portrait', poster: source(itemIndex) }
      : { kind: 'image', src: source(itemIndex), ratio }))
    return { p, index, key: String(p.id), title: cleanTitle(p.title), items, score: ((Number(p.id || index + 1) * 7) % 46) + 3, body: (typeof p.body === 'string' ? p.body : '') || bodyCopy[index % bodyCopy.length]!, avatar: a(avatarAssets[index % avatarAssets.length]!) }
  })
})
const expanded = reactive<Record<string, boolean>>({})
const votes = reactive<Record<string, string>>({})
const saved = reactive<Record<string, boolean>>({})
const dealerLiked = reactive<Record<string, boolean>>({})
const counters = reactive<Record<string, { n: number; left: number }>>({})
const rails = new Map<string, HTMLElement>()
function setRail(key: string, el: unknown) { if (el instanceof HTMLElement) rails.set(key, el); else rails.delete(key) }
function placeCounter(key: string, itemEl: Element | null | undefined) {
  const rail = rails.get(key)
  const shell = rail?.parentElement
  if (!rail || !shell || !itemEl) return
  const sr = shell.getBoundingClientRect(), ir = itemEl.getBoundingClientRect()
  counters[key] = { n: counters[key]?.n || 1, left: Math.max(34, Math.min(sr.width - 9, ir.right - sr.left - 9)) }
}
function resetRail(key: string) {
  const rail = rails.get(key)
  if (!rail) return
  rail.scrollLeft = 0
  counters[key] = { n: 1, left: counters[key]?.left ?? 0 }
  placeCounter(key, rail.firstElementChild)
}
function onRailScroll(key: string) {
  const rail = rails.get(key)
  if (!rail) return
  const items = Array.from(rail.children) as HTMLElement[]
  const nearest = items.reduce((best, item, i) => { const d = Math.abs(item.offsetLeft - rail.scrollLeft); return d < best.d ? { i, d } : best }, { i: 0, d: Infinity })
  counters[key] = { n: nearest.i + 1, left: counters[key]?.left ?? 0 }
  placeCounter(key, items[nearest.i])
}
function scrollRail(key: string, dir: number) {
  const rail = rails.get(key)
  if (rail) rail.scrollBy({ left: dir * Math.max(220, rail.clientWidth * 0.78), behavior: 'smooth' })
}
function resetAll() { cards.value.forEach(c => resetRail(c.key)) }
watch(cards, () => nextTick(() => { resetAll(); requestAnimationFrame(resetAll) }))
function onPageShow() { requestAnimationFrame(resetAll) }
onMounted(() => { nextTick(() => { resetAll(); requestAnimationFrame(resetAll) }); window.addEventListener('pageshow', onPageShow); document.addEventListener('keydown', onGalleryKey) })
onBeforeUnmount(() => { window.removeEventListener('pageshow', onPageShow); document.removeEventListener('keydown', onGalleryKey); closeGallery() })

// ── 미디어 누르기(끌었으면 무시) ──
const gesture = { x: 0, y: 0, moved: false }
function onItemDown(e: PointerEvent) { gesture.x = e.clientX; gesture.y = e.clientY; gesture.moved = false }
function onItemMove(e: PointerEvent) { if (Math.abs(e.clientX - gesture.x) > 10 || Math.abs(e.clientY - gesture.y) > 10) gesture.moved = true }
function onItemClick(e: MouseEvent, items: Item[], i: number) {
  e.preventDefault(); e.stopPropagation()
  if (gesture.moved) { gesture.moved = false; return }
  openGallery(items, i, e.currentTarget as HTMLElement)
}
// ── 크게 보기 창 ──
const galleryMade = ref(false)
const galleryOpen = ref(false)
const galleryItems = ref<Item[]>([])
const galleryIndex = ref(0)
const galleryClose = ref<HTMLElement | null>(null)
let galleryOpener: HTMLElement | null = null
let lockedScrollY = 0
function openGallery(items: Item[], start: number, opener: HTMLElement) {
  galleryItems.value = items
  if (!items.length) return
  galleryIndex.value = Math.max(0, Math.min(start, items.length - 1))
  galleryMade.value = true
  galleryOpener = opener
  lockedScrollY = window.scrollY || 0
  galleryOpen.value = true
  document.body.classList.add('chototGalleryOpen')
  document.body.style.top = '-' + lockedScrollY + 'px'
  nextTick(() => galleryClose.value?.focus())
}
function closeGallery() {
  if (!galleryOpen.value) return
  galleryOpen.value = false
  document.body.classList.remove('chototGalleryOpen')
  document.body.style.top = ''
  window.scrollTo(0, lockedScrollY)
  if (galleryOpener && document.contains(galleryOpener)) galleryOpener.focus({ preventScroll: true })
}
function moveGallery(delta: number) {
  const n = galleryItems.value.length
  if (!n) return
  galleryIndex.value = (galleryIndex.value + delta + n) % n
}
function onGalleryKey(e: KeyboardEvent) {
  if (!galleryOpen.value) return
  if (e.key === 'Escape') closeGallery()
  if (e.key === 'ArrowLeft') moveGallery(-1)
  if (e.key === 'ArrowRight') moveGallery(1)
}
let touchStart: { x: number; y: number } | null = null
function gTouchStart(e: TouchEvent) { const t = e.touches[0]; if (t) touchStart = { x: t.clientX, y: t.clientY } }
function gTouchEnd(e: TouchEvent) {
  const t = e.changedTouches[0]
  if (!t || !touchStart) return
  const dx = t.clientX - touchStart.x, dy = t.clientY - touchStart.y
  touchStart = null
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.25) moveGallery(dx < 0 ? 1 : -1)
}
// ── 반응 ──
function vote(key: string, dir: string) { votes[key] = votes[key] === dir ? '' : dir }
function toggleSave(key: string) { saved[key] = !saved[key]; page.toast(saved[key] ? '게시물을 저장했습니다' : '저장을 취소했습니다') }
function share(id: string) {
  const url = location.origin + router.resolve({ path: '/posts/' + encodeURIComponent(id) }).href
  if (navigator.share) navigator.share({ title: '보배드림 게시물', url }).catch(() => {})
  else if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => {})
}
function href(p: ListPost) { return router.resolve({ path: '/posts/' + encodeURIComponent(String(p.id)), query: { v: props.dealer ? '20261015chototdealer' : '20261015chototfeed' } }).href }
function comments(id: string) { router.push({ path: '/posts/' + encodeURIComponent(id), hash: '#comments' }) }
function stopTouch(e: Event) { e.stopPropagation() }
</script>

<template>
  <div v-if="!dealer" class="chototFeedIntro"><strong>사진을 좌우로 넘겨보세요</strong><span>초톳처럼 원본 비율을 살린 가로 피드입니다.</span></div>
  <article v-for="c in cards" :key="c.key" :class="['chototFeedCard', { chototDealerFeedCard: dealer }]" :data-post-id="c.p.id">
    <template v-if="dealer">
      <div class="chototFeedIdentity"><img class="chototFeedAvatar" :src="c.avatar" :alt="c.p.user + ' 프로필'"><div class="chototFeedAuthor"><strong>{{ c.p.user }}</strong><span>보배드림 딜러 · {{ c.p.time || '방금 전' }}</span></div><button class="chototFeedMore" type="button" aria-label="게시물 더보기"><img :src="redditIcon('more-reddit')" alt=""></button></div>
      <a class="chototDealerCaption" :href="href(c.p)">{{ c.title }}</a>
    </template>
    <div v-if="c.items.length" class="chototMediaShell">
      <div :ref="(el) => setRail(c.key, el)" class="chototMediaRail" aria-label="게시물 미디어, 좌우로 넘기기" @scroll.passive="onRailScroll(c.key)" @touchstart.passive="stopTouch" @touchmove.passive="stopTouch" @touchend.passive="stopTouch" @touchcancel.passive="stopTouch">
        <template v-for="(item, i) in c.items" :key="i">
          <button v-if="item.kind === 'video'" class="chototMediaItem video" type="button" :data-media-index="i" data-kind="video" :data-src="item.src" data-ratio="portrait" aria-label="영상 크게 보기" @pointerdown="onItemDown" @pointermove="onItemMove" @pointercancel="gesture.moved = true" @click="onItemClick($event, c.items, i)"><video muted playsinline preload="metadata" :poster="item.poster"><source :src="item.src" type="video/mp4"></video><span class="chototVideoPlay" aria-hidden="true" /></button>
          <button v-else class="chototMediaItem" type="button" :data-media-index="i" data-kind="image" :data-src="item.src" :data-ratio="item.ratio" :aria-label="c.title + ' 사진 ' + (i + 1) + ' 크게 보기'" @pointerdown="onItemDown" @pointermove="onItemMove" @pointercancel="gesture.moved = true" @click="onItemClick($event, c.items, i)"><img :src="item.src" :alt="c.title + ' 사진 ' + (i + 1)" :loading="c.index === 0 && i === 0 ? 'eager' : 'lazy'" :fetchpriority="c.index === 0 && i === 0 ? 'high' : undefined"></button>
        </template>
      </div>
      <button class="chototRailArrow chototRailPrev" type="button" aria-label="이전 사진" @click.stop="scrollRail(c.key, -1)"><img :src="uiIcon('icon-left-outline')" alt=""></button>
      <button class="chototRailArrow chototRailNext" type="button" aria-label="다음 사진" @click.stop="scrollRail(c.key, 1)"><img :src="uiIcon('icon-right-outline')" alt=""></button>
      <span v-if="c.items.length > 1" class="chototMediaCount" :style="counters[c.key] ? { left: counters[c.key]!.left + 'px' } : undefined">{{ (counters[c.key]?.n || 1) + ' / ' + c.items.length }}</span>
    </div>
    <template v-if="!dealer">
      <div class="chototFeedIdentity"><img class="chototFeedAvatar" :src="c.avatar" :alt="c.p.user + ' 프로필'"><div class="chototFeedAuthor"><strong>{{ c.p.user }}</strong><span>보배드림 · {{ c.p.time || '방금 전' }}</span></div><button class="chototFeedMore" type="button" aria-label="게시물 더보기"><img :src="redditIcon('more-reddit')" alt=""></button></div>
      <a class="chototFeedTitle" :href="href(c.p)">{{ c.title }}</a>
      <div :class="['chototFeedBodyWrap', { expanded: expanded[c.key] }]"><p class="chototFeedBody">{{ c.body }}</p><button class="chototFeedMoreText" type="button" :aria-expanded="(!!expanded[c.key])" @click="expanded[c.key] = !expanded[c.key]">{{ expanded[c.key] ? '접기' : '더보기' }}</button></div>
      <div class="chototFeedActions" aria-label="게시물 반응">
        <div class="chototActionPill"><button :class="['chototVoteButton', { 'is-active': votes[c.key] === 'up' }]" type="button" data-vote="up" aria-label="추천" :aria-pressed="votes[c.key] === 'up' ? 'true' : 'false'" @click="vote(c.key, 'up')"><img :src="redditIcon('vote-up')" alt=""><span>{{ c.score }}</span></button><span class="chototVoteDivider" aria-hidden="true" /><button :class="['chototVoteButton', { 'is-active': votes[c.key] === 'down' }]" type="button" data-vote="down" aria-label="비추천" :aria-pressed="votes[c.key] === 'down' ? 'true' : 'false'" @click="vote(c.key, 'down')"><img :src="redditIcon('vote-down')" alt=""></button></div>
        <button class="chototActionButton" type="button" :data-comment="c.p.id" :aria-label="'댓글 ' + (c.p.reply || 0) + '개'" @click="comments(String(c.p.id))"><img :src="a('assets/reactions/comment-outline.svg')" alt=""><span>{{ c.p.reply || 0 }}</span></button>
        <button class="chototActionButton" type="button" :data-share="c.p.id" aria-label="공유" @click="share(String(c.p.id))"><img :src="redditIcon('share-reddit')" alt=""></button>
        <button :class="['chototActionButton', { 'is-active': saved[c.key] }]" type="button" :data-save="c.p.id" aria-label="저장" :aria-pressed="(!!saved[c.key])" @click="toggleSave(c.key)"><img :src="redditIcon('bookmark')" alt=""></button>
      </div>
    </template>
    <div v-else class="chototDealerActions" aria-label="딜러 게시물 반응과 연락">
      <button :class="['chototDealerAction', { 'is-active': dealerLiked[c.key] }]" type="button" data-dealer-like aria-label="추천" :aria-pressed="(!!dealerLiked[c.key])" @click="dealerLiked[c.key] = !dealerLiked[c.key]"><img :src="a('assets/reactions/recommend.svg')" alt=""><span>{{ dealerLiked[c.key] ? '1' : '0' }}</span></button>
      <button class="chototDealerAction" type="button" :data-comment="c.p.id" :aria-label="'댓글 ' + (c.p.reply || 0) + '개'" @click="comments(String(c.p.id))"><img :src="a('assets/reactions/comment-outline.svg')" alt=""><span>{{ c.p.reply || 0 }}</span></button>
      <a class="chototDealerAction" href="tel:02-2059-5211" aria-label="딜러에게 전화"><img class="autoScoutPhone" :src="uiIcon('phone-autoscout24')" alt=""><span>전화</span></a>
      <button class="chototDealerAction" type="button" data-dealer-chat aria-label="딜러와 채팅" @click="page.toast('딜러 채팅을 준비했습니다')"><img :src="uiIcon('chat')" alt=""><span>채팅</span></button>
      <button :class="['chototDealerAction', { 'is-active': saved[c.key] }]" type="button" :data-save="c.p.id" data-dealer-save aria-label="저장" :aria-pressed="(!!saved[c.key])" @click="toggleSave(c.key)"><img :src="redditIcon('bookmark')" alt=""><span>저장</span></button>
    </div>
  </article>
  <Teleport to="body">
    <div v-if="galleryMade" id="chototGallery" :class="['chototGallery', { open: galleryOpen }]" role="dialog" aria-modal="true" aria-label="미디어 크게 보기" @click.self="closeGallery" @touchstart.passive="gTouchStart" @touchend.passive="gTouchEnd">
      <div class="chototGalleryStage">
        <button ref="galleryClose" class="chototGalleryClose" type="button" aria-label="닫기" @click="closeGallery"><img :src="redditIcon('close')" alt=""></button>
        <span class="chototGalleryCounter">{{ galleryIndex + 1 }} / {{ galleryItems.length }}</span>
        <button class="chototGalleryNav chototGalleryPrev" type="button" aria-label="이전" :hidden="galleryItems.length < 2" @click="moveGallery(-1)"><img :src="uiIcon('icon-left-outline')" alt=""></button>
        <div class="chototGalleryContent">
          <video v-if="galleryItems[galleryIndex]?.kind === 'video'" :key="'v' + galleryIndex" class="chototGalleryVideo" :src="galleryItems[galleryIndex]!.src" controls autoplay playsinline />
          <img v-else-if="galleryItems[galleryIndex]" :key="'i' + galleryIndex" class="chototGalleryImage" :src="galleryItems[galleryIndex]!.src" alt="확대 사진">
        </div>
        <button class="chototGalleryNav chototGalleryNext" type="button" aria-label="다음" :hidden="galleryItems.length < 2" @click="moveGallery(1)"><img :src="uiIcon('icon-right-outline')" alt=""></button>
      </div>
    </div>
  </Teleport>
</template>
