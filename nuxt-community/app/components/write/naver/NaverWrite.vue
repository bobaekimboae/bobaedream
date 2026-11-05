<!-- 커뮤니티 글쓰기 · 네이버 카페형(2026-11-06 네이버 카페 앱 글쓰기를 폰에 연결해 화면 · 동작을 직접 확인하고 맞춤).
     머리줄(× · 임시저장 · 연초록 「등록」) → 게시판 줄 → (글 종류 줄) → 제목 → 본문 → 태그 글자
     → 화면 아래에 붙은 도구 줄(사진·동영상 · T · 스티커 · 글감 · 태그 · ··· · 설정). T 는 도구 줄 위에 서식 줄, 스티커 · ··· 은 도구 줄 아래 판을 연다.
     치지직형에서 가져온 것: 글 종류(특수 글쓰기) 줄 · 본문 숨기기(설정) · 링크 미리보기 카드 · 투표 사진. 아이콘은 레딧 원본(색만 CSS) -->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CommunityWrite } from '~/composables/write/useCommunityWrite'
import PostTypeFields from '../app/PostTypeFields.vue'
import WriteFormatBar from '../app/WriteFormatBar.vue'
import WriteQuoteBar from '../app/WriteQuoteBar.vue'
import WriteUrlDialog from '../app/WriteUrlDialog.vue'
import NaverDialog from './NaverDialog.vue'

const props = defineProps<{ w: CommunityWrite }>()
const emit = defineEmits<{ body: [el: HTMLElement | null] }>()
const w = props.w
const icon = (name: string) => communityAsset(`assets/reddit-write/${name}.svg`)
type Panel = '' | 'sticker' | 'more'
const panel = ref<Panel>('')
const textTools = ref(false)
const linkOpen = ref(false)
const dialog = ref<'' | 'save' | 'exit'>('')
const mediaInput = ref<HTMLInputElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const s = computed(() => w.editor.state.value)
const inQuote = computed(() => s.value.quote > 0)
const keep = (event: Event) => event.preventDefault()
function setBody(el: unknown) { emit('body', el as HTMLElement | null) }

/* ---------- 도구 줄 ---------- */
function blurEditor() { (document.activeElement as HTMLElement | null)?.blur?.() }
function togglePanel(next: Exclude<Panel, ''>) {
  if (panel.value === next) { panel.value = ''; w.editor.editor.value?.commands.focus(); return }
  panel.value = next
  textTools.value = false
  blurEditor()
}
function toggleText() {
  textTools.value = !textTools.value
  panel.value = ''
  if (textTools.value) w.editor.editor.value?.commands.focus()
}
/** 네이버 카페 앱 「사진, 동영상」: 한 번에 사진 · 동영상을 함께 고른다 */
function pickMedia(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files ? [...input.files] : []
  input.value = ''
  const toList = (list: File[]) => { const dt = new DataTransfer(); list.forEach(file => dt.items.add(file)); return dt.files }
  const photos = files.filter(file => file.type.startsWith('image/'))
  const videos = files.filter(file => file.type.startsWith('video/'))
  if (photos.length) w.addMedia(toList(photos), 'photo')
  if (videos.length) w.addMedia(toList(videos), 'video')
}
function pickFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (file.size > 20 * 1024 * 1024) { w.toast('파일은 20MB까지 첨부할 수 있어요.'); return }
  const size = file.size >= 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(file.size / 1024))}KB`
  const ext = (file.name.split('.').pop() || '').toUpperCase()
  w.editor.insertCard({ kind: 'file', title: file.name, sub: [ext, size].filter(Boolean).join(' · '), meta: '첨부 파일은 등록할 때 함께 올라가요' })
  panel.value = ''
}
function moreAction(kind: 'quote' | 'divider' | 'link' | 'file' | 'place' | 'schedule' | 'poll') {
  if (kind === 'quote') { panel.value = ''; textTools.value = true; w.editor.insertQuote(1); return }
  if (kind === 'divider') { w.editor.insertDivider(); return }
  if (kind === 'link') { linkOpen.value = true; return }
  if (kind === 'file') { fileInput.value?.click(); return }
  panel.value = ''
  w.tool.value = kind
}
function attachLink(href: string) {
  linkOpen.value = false
  panel.value = ''
  if (!w.attachUrl(href)) w.toast('링크를 다시 확인해주세요.')
}

/* ---------- 스티커 판(키보드 자리) ---------- */
interface EmojiItem { e: string, c: string, d?: string }
const packs: [string, string][] = [['face-emotion', '😀'], ['person-people', '👋'], ['animals-nature', '🐶'], ['food-drink', '🍔'], ['travel-places', '🚗'], ['activities-events', '⚽'], ['objects', '💡'], ['symbols', '❤️'], ['flags', '🏁']]
const pack = useState('write-emoji-category', () => 'face-emotion')
const emojis = useState<EmojiItem[]>('write-emojis', () => [])
watch(panel, (value) => {
  if (value !== 'sticker' || emojis.value.length) return
  fetch(communityAsset('data/emoji-v17.json'))
    .then(response => response.json() as Promise<{ emojis?: EmojiItem[] }>)
    .then((data) => { emojis.value = data.emojis || [] })
    .catch(() => { emojis.value = ['😀', '😂', '😍', '👍', '🔥', '🎉', '🚗', '🏍️'].map(e => ({ e, c: 'face-emotion' })) })
})
const stickerList = computed(() => emojis.value.filter(item => item.c === pack.value).slice(0, 120))
function pickSticker(emoji: string) { w.editor.insertSticker(emoji) }

/* ---------- 임시저장 · 나가기 ---------- */
const hasContent = computed(() => { void w.editor.version.value; return Boolean(w.title.value.trim() || w.editor.text().trim() || w.photos.value.length || w.videos.value.length || w.editor.countNodes('writeCard') || w.editor.countNodes('editorPoll')) })
function onClose() { if (hasContent.value) dialog.value = 'exit'; else w.exit() }
function serverSave() { dialog.value = ''; w.saveDraft() }
function localSave() { dialog.value = ''; w.saveLocal() }
function localSaveAndExit() { dialog.value = ''; if (w.saveLocal()) window.setTimeout(() => w.exit(), 400) }
const saveActions = computed(() => [
  { label: '임시등록', tone: 'green' as const, run: serverSave },
  { label: '이 기기에 임시보관', tone: 'gray' as const, run: localSave },
])
const exitActions = computed(() => [
  { label: '글쓰기 취소', tone: 'gray' as const, run: () => { dialog.value = ''; w.exit() } },
  { label: '이 기기에 임시보관', tone: 'green' as const, run: localSaveAndExit },
])

/* ---------- 화면 아래 도구 줄: 휴대폰 키보드가 올라오면 그 위에 붙는다 ---------- */
const dock = ref<HTMLElement | null>(null)
const lift = ref(0)
const dockHeight = ref(48)
function placeDock() {
  const vv = window.visualViewport
  lift.value = vv ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) : 0
  dockHeight.value = dock.value?.offsetHeight || 48
}
let observer: ResizeObserver | null = null
onMounted(() => {
  placeDock()
  window.visualViewport?.addEventListener('resize', placeDock)
  window.visualViewport?.addEventListener('scroll', placeDock)
  observer = new ResizeObserver(placeDock)
  if (dock.value) observer.observe(dock.value)
})
onBeforeUnmount(() => {
  window.visualViewport?.removeEventListener('resize', placeDock)
  window.visualViewport?.removeEventListener('scroll', placeDock)
  observer?.disconnect()
})
/* 본문을 누르면 아래 판(스티커 · 더보기)은 닫힌다(키보드가 그 자리를 쓴다) */
watch(() => w.editor.focused.value, (focused) => { if (focused && panel.value) panel.value = '' })
watch(inQuote, (quote) => { if (quote) panel.value = '' })
nextTick(placeDock)
</script>

<template>
  <main class="nw" data-write-style="naver" data-testid="community-write" :style="{ '--nw-dock': `${dockHeight + lift}px` }">
    <header class="nw-head">
      <button class="nw-close" type="button" aria-label="닫기" @click="onClose"><img :src="icon('icon-close-outline')" alt=""></button>
      <button class="nw-save" type="button" @click="dialog = 'save'">임시저장</button>
      <button class="nw-submit" type="button" :aria-disabled="w.backend.value.busy" @click="w.submit()">등록</button>
    </header>

    <button class="nw-row" type="button" aria-haspopup="dialog" :class="{ 'is-empty': !w.board.value }" @click="w.tool.value = 'board'">
      <span>{{ w.board.value || '게시판을 선택해 주세요.' }}</span><img :src="icon('icon-caret-down-outline')" alt="">
    </button>
    <button class="nw-row is-type" type="button" aria-haspopup="dialog" :class="{ 'is-empty': w.postType.value.id === 'normal' }" @click="w.tool.value = 'type'">
      <span>{{ w.postType.value.id === 'normal' ? '글 종류 선택' : w.postType.value.label }}</span><img :src="icon('icon-caret-down-outline')" alt="">
    </button>

    <label class="sr-only" for="nwTitle">제목</label>
    <input id="nwTitle" v-model="w.title.value" class="nw-title" maxlength="80" placeholder="제목" autocomplete="off" enterkeyhint="next" @focus="panel = ''">

    <PostTypeFields v-if="w.postType.value.id !== 'normal'" :type="w.postType.value" :values="w.typeValues.value" :problem="w.triedSubmit.value ? w.typeProblem.value : ''" @change="(key, value) => (w.typeValues.value = { ...w.typeValues.value, [key]: value })" @open="w.tool.value = 'type'" />

    <section class="nw-editor" aria-label="본문 편집기">
      <article :ref="setBody" class="aw-editor-body is-naver" />
    </section>
    <button v-if="w.tags.value.length" class="nw-tags" type="button" aria-label="태그 고치기" @click="w.tool.value = 'tags'">
      <span v-for="tag in w.tags.value" :key="tag">#{{ tag }}</span>
    </button>
    <p v-if="w.hideBody.value || w.settings.value.notice" class="nw-flags">
      <span v-if="w.settings.value.notice">공지로 등록</span><span v-if="w.hideBody.value">본문 숨기기</span>
    </p>

    <div ref="dock" class="nw-dock" :style="{ bottom: `${lift}px` }">
      <div v-if="textTools || inQuote" class="nw-format" @mousedown="keep"><WriteFormatBar :editor="w.editor" naver @link="linkOpen = true" /></div>
      <div v-if="inQuote" class="nw-quote" @mousedown="keep"><WriteQuoteBar :editor="w.editor" /></div>
      <div v-else class="nw-tools" role="toolbar" aria-label="글쓰기 도구" @mousedown="keep">
        <button type="button" aria-label="사진, 동영상" @click="mediaInput?.click()"><img :src="icon('icon-camera-outline')" alt=""></button>
        <button type="button" aria-label="텍스트 설정" :aria-expanded="textTools" :class="{ 'is-on': textTools }" @click="toggleText"><img :src="icon('icon-text-outline')" alt=""></button>
        <button type="button" aria-label="스티커" :aria-expanded="panel === 'sticker'" :class="{ 'is-on': panel === 'sticker' }" @click="togglePanel('sticker')"><img :src="icon('icon-emoji-outline')" alt=""></button>
        <button type="button" aria-label="글감" @click="panel = ''; w.tool.value = 'material'"><img :src="icon('icon-topic-cars-outline')" alt=""></button>
        <button type="button" aria-label="태그" @click="panel = ''; w.tool.value = 'tags'"><img :src="icon('icon-tag-outline')" alt=""></button>
        <button type="button" aria-label="더보기" :aria-expanded="panel === 'more'" :class="{ 'is-on': panel === 'more' }" @click="togglePanel('more')"><img :src="icon('icon-overflow-horizontal-outline')" alt=""></button>
        <button class="nw-gear" type="button" aria-label="게시글 설정" @click="panel = ''; w.tool.value = 'settings'"><img :src="icon('icon-settings-outline')" alt=""></button>
      </div>

      <div v-if="panel === 'sticker'" class="nw-panel is-sticker" role="region" aria-label="스티커">
        <div class="nw-sticker-grid">
          <button v-for="(item, index) in stickerList" :key="`${index}-${item.e}`" type="button" :aria-label="item.d || item.e" @click="pickSticker(item.e)">{{ item.e }}</button>
        </div>
        <nav class="nw-sticker-tabs" aria-label="스티커 묶음">
          <button v-for="[key, face] in packs" :key="key" type="button" :class="{ 'is-on': pack === key }" :aria-pressed="pack === key" @click="pack = key">{{ face }}</button>
        </nav>
      </div>
      <div v-else-if="panel === 'more'" class="nw-panel is-more" role="region" aria-label="더보기">
        <button type="button" @click="moreAction('quote')"><img :src="icon('icon-quote-outline')" alt=""><span>인용구</span></button>
        <button type="button" @click="moreAction('divider')"><img :src="icon('icon-subtract-outline')" alt=""><span>구분선</span></button>
        <button type="button" @click="moreAction('link')"><img :src="icon('icon-link-outline')" alt=""><span>링크</span></button>
        <button type="button" @click="moreAction('file')"><img :src="icon('icon-attach-outline')" alt=""><span>파일</span></button>
        <button type="button" @click="moreAction('place')"><img :src="icon('icon-location-outline')" alt=""><span>장소</span></button>
        <button type="button" @click="moreAction('schedule')"><img :src="icon('icon-calendar-outline')" alt=""><span>일정</span></button>
        <button type="button" @click="moreAction('poll')"><img :src="icon('icon-statistics-outline')" alt=""><span>투표</span></button>
      </div>
    </div>

    <input ref="mediaInput" class="sr-only" type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple @change="pickMedia">
    <input ref="fileInput" class="sr-only" type="file" @change="pickFile">
    <WriteUrlDialog v-if="linkOpen" placeholder="URL을 입력하세요." @ok="attachLink" @cancel="linkOpen = false" />
    <NaverDialog
      v-if="dialog === 'save'"
      title="임시저장 방법을 선택하세요."
      :lines="['임시등록 : 보배드림 서버에 저장해 PC 및 다른 기기에서도 이어서 작성할 수 있습니다.', '이 기기에 임시보관 : 이 기기에서만 이어서 작성할 수 있으며 데이터 소모 없이 저장됩니다.']"
      :actions="saveActions" layout="stack" closable @close="dialog = ''"
    />
    <NaverDialog v-else-if="dialog === 'exit'" :lines="['글쓰기를 취소하시겠습니까?', '이 기기에 임시보관하면', '나중에 이어서 작성할 수 있습니다.']" :actions="exitActions" @close="dialog = ''" />
  </main>
</template>
