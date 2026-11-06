<!-- 커뮤니티 글쓰기 · 네이버 카페 PC 웹형(2026-11-06 「PC 웹 만들어라 · 우리 폰트는 프리텐다드」).
     네이버 카페 PC 글쓰기 구성: 위 머리 띠(로고 · 「카페 글쓰기」 · 임시등록 N · 등록) → 가운데 본문 칸
     (게시판 ▾ · 말머리(→ 글 종류) ▾ → 제목 → 편집기 상자(콘텐츠 도구 줄 · 서식 줄 · 본문) → 태그)
     + 오른쪽 따라오는 설정 칸(공지 · 공개 설정 · 검색 허용 · 댓글 · 스크랩 · 복사 · 본문 숨기기 · 사진 크기).
     기능 · 상태 · 등록은 앱형과 같은 useCommunityWrite 를 쓴다. 글감 · 장소 · 일정 · 투표 · 태그 화면은 앱형 부품을 가운데 창으로 띄운다.
     글꼴은 프리텐다드(기본서체 자리). 아이콘은 레딧 원본(색만 CSS). -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
const logo = siteAsset('assets/bbm/header-logo.svg')
const s = computed(() => w.editor.state.value)
const inQuote = computed(() => s.value.quote > 0)
const keep = (event: Event) => event.preventDefault()
function setBody(el: unknown) { emit('body', el as HTMLElement | null) }

/* ---------- 게시판 고르기(PC: 선택 상자 아래로 펼침) ---------- */
const boardOpen = ref(false)
const boardQuery = ref('')
const squash = (text: string) => text.replace(/\s+/g, '').toLowerCase()
const boardShown = computed(() => {
  const q = squash(boardQuery.value)
  return w.groups.value
    .map(group => ({ section: group.section, items: group.items.filter(name => !q || squash(name).includes(q)) }))
    .filter(group => group.items.length)
})
function pickBoard(name: string) { w.board.value = name; boardOpen.value = false; boardQuery.value = '' }

/* ---------- 콘텐츠 도구 ---------- */
const stickerOpen = ref(false)
const linkOpen = ref(false)
const photoInput = ref<HTMLInputElement | null>(null)
const videoInput = ref<HTMLInputElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
function pickMedia(event: Event, kind: 'photo' | 'video') {
  const input = event.target as HTMLInputElement
  if (input.files?.length) w.addMedia(input.files, kind)
  input.value = ''
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
}
function attachLink(href: string) {
  linkOpen.value = false
  if (!w.attachUrl(href)) w.toast('링크를 다시 확인해주세요.')
}
type ToolKey = 'photo' | 'video' | 'sticker' | 'quote' | 'divider' | 'place' | 'link' | 'file' | 'schedule' | 'poll' | 'material'
const tools: { key: ToolKey, label: string, icon: string }[] = [
  { key: 'photo', label: '사진', icon: 'icon-image-post-outline' },
  { key: 'video', label: '동영상', icon: 'icon-video-post-outline' },
  { key: 'sticker', label: '스티커', icon: 'icon-emoji-outline' },
  { key: 'quote', label: '인용구', icon: 'icon-quote-outline' },
  { key: 'divider', label: '구분선', icon: 'icon-subtract-outline' },
  { key: 'place', label: '장소', icon: 'icon-location-outline' },
  { key: 'link', label: '링크', icon: 'icon-link-outline' },
  { key: 'file', label: '파일', icon: 'icon-attach-outline' },
  { key: 'schedule', label: '일정', icon: 'icon-calendar-outline' },
  { key: 'poll', label: '투표', icon: 'icon-statistics-outline' },
  { key: 'material', label: '글감', icon: 'icon-topic-cars-outline' },
]
function runTool(key: ToolKey) {
  if (key !== 'sticker') stickerOpen.value = false
  if (key === 'photo') photoInput.value?.click()
  else if (key === 'video') videoInput.value?.click()
  else if (key === 'sticker') stickerOpen.value = !stickerOpen.value
  else if (key === 'quote') w.editor.insertQuote(1)
  else if (key === 'divider') w.editor.insertDivider()
  else if (key === 'link') linkOpen.value = true
  else if (key === 'file') fileInput.value?.click()
  else w.tool.value = key
}

/* ---------- 스티커(도구 줄 아래 펼침 판) ---------- */
interface EmojiItem { e: string, c: string, d?: string }
const packs: [string, string, string][] = [['face-emotion', '😀', '표정'], ['person-people', '👋', '사람'], ['animals-nature', '🐶', '동물'], ['food-drink', '🍔', '음식'], ['travel-places', '🚗', '여행'], ['activities-events', '⚽', '활동'], ['objects', '💡', '사물'], ['symbols', '❤️', '기호'], ['flags', '🏁', '깃발']]
const pack = useState('write-emoji-category', () => 'face-emotion')
const emojis = useState<EmojiItem[]>('write-emojis', () => [])
watch(stickerOpen, (open) => {
  if (!open || emojis.value.length) return
  fetch(communityAsset('data/emoji-v17.json'))
    .then(response => response.json() as Promise<{ emojis?: EmojiItem[] }>)
    .then((data) => { emojis.value = data.emojis || [] })
    .catch(() => { emojis.value = ['😀', '😂', '😍', '👍', '🔥', '🎉', '🚗', '🏍️'].map(e => ({ e, c: 'face-emotion' })) })
})
const stickerList = computed(() => emojis.value.filter(item => item.c === pack.value).slice(0, 160))

/* ---------- 태그 ---------- */
const tagInput = ref('')
function addTag() {
  const parts = tagInput.value.split(/[#,\s]+/).map(part => part.trim()).filter(Boolean)
  tagInput.value = ''
  if (!parts.length) return
  const next = [...w.tags.value]
  for (const tag of parts) {
    if (next.includes(tag)) continue
    if (next.length >= 10) { w.toast('태그는 10개까지 넣을 수 있어요.'); break }
    next.push(tag.slice(0, 20))
  }
  w.tags.value = next
  w.tagDraft.value = next.map(tag => `#${tag}`).join(' ')
}
function removeTag(tag: string) {
  w.tags.value = w.tags.value.filter(item => item !== tag)
  w.tagDraft.value = w.tags.value.map(item => `#${item}`).join(' ')
}
function tagKey(event: KeyboardEvent) {
  if (event.isComposing) return
  if (event.key === 'Enter' || event.key === ',' || event.key === ' ') { event.preventDefault(); addTag() }
  else if (event.key === 'Backspace' && !tagInput.value && w.tags.value.length) removeTag(w.tags.value[w.tags.value.length - 1]!)
}

/* ---------- 임시등록 · 나가기 ---------- */
const DRAFT_KEY = 'bbm.community.writeDraft.v2'
const draftCount = ref(0)
function readDraftCount() { try { draftCount.value = localStorage.getItem(DRAFT_KEY) ? 1 : 0 } catch { draftCount.value = 0 } }
const dialog = ref<'' | 'save' | 'exit'>('')
const hasContent = computed(() => { void w.editor.version.value; return Boolean(w.title.value.trim() || w.editor.text().trim() || w.photos.value.length || w.videos.value.length || w.editor.countNodes('writeCard') || w.editor.countNodes('editorPoll')) })
function onExit() { if (hasContent.value) dialog.value = 'exit'; else w.exit() }
function serverSave() { dialog.value = ''; w.saveDraft(); readDraftCount() }
function localSave() { dialog.value = ''; w.saveLocal(); readDraftCount() }
const saveActions = computed(() => [
  { label: '임시등록', tone: 'green' as const, run: serverSave },
  { label: '이 기기에 임시보관', tone: 'gray' as const, run: localSave },
])
const exitActions = computed(() => [
  { label: '글쓰기 취소', tone: 'gray' as const, run: () => { dialog.value = ''; w.exit() } },
  { label: '이 기기에 임시보관', tone: 'green' as const, run: () => { dialog.value = ''; if (w.saveLocal()) window.setTimeout(() => w.exit(), 400) } },
])

/* ---------- 바깥을 누르면 펼친 목록을 닫는다 ---------- */
function onDocDown(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  if (boardOpen.value && !target?.closest('.npc-board')) boardOpen.value = false
  if (stickerOpen.value && !target?.closest('.npc-sticker, .npc-tool.is-sticker')) stickerOpen.value = false
}
function onKey(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  boardOpen.value = false
  stickerOpen.value = false
}
onMounted(() => {
  readDraftCount()
  document.addEventListener('mousedown', onDocDown)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocDown)
  document.removeEventListener('keydown', onKey)
})
const visibilityLabel = { member: '멤버 공개', all: '전체 공개' } as const
</script>

<template>
  <main class="npc" data-write-style="naver-pc" data-testid="community-write">
    <header class="npc-head">
      <div class="npc-head-in">
        <button class="npc-logo" type="button" aria-label="글쓰기 나가기" @click="onExit"><img :src="logo" alt="보배드림"></button>
        <h1>커뮤니티 글쓰기</h1>
        <div class="npc-head-actions">
          <button class="npc-temp" type="button" @click="dialog = 'save'">임시등록<span aria-label="임시글 수">{{ draftCount }}</span></button>
          <button class="npc-submit" type="button" :aria-disabled="w.backend.value.busy" @click="w.submit()">등록</button>
        </div>
      </div>
    </header>

    <div class="npc-wrap">
      <div class="npc-main">
        <div class="npc-taxonomy">
          <div class="npc-board">
            <button class="npc-select" type="button" aria-haspopup="listbox" :aria-expanded="boardOpen" :class="{ 'is-empty': !w.board.value }" @click="boardOpen = !boardOpen">
              <span>{{ w.board.value || '게시판을 선택해 주세요.' }}</span><img :src="icon('icon-caret-down-outline')" alt="">
            </button>
            <div v-if="boardOpen" class="npc-board-menu" role="listbox" aria-label="게시판">
              <label class="npc-board-search"><img :src="icon('icon-search-outline')" alt=""><span class="sr-only">게시판 검색</span><input v-model="boardQuery" type="search" placeholder="게시판 검색" autocomplete="off"></label>
              <div class="npc-board-list">
                <section v-for="group in boardShown" :key="group.section">
                  <h3>{{ group.section }}</h3>
                  <button v-for="name in group.items" :key="name" type="button" role="option" :aria-selected="w.board.value === name" :class="{ 'is-on': w.board.value === name }" @click="pickBoard(name)">{{ name }}</button>
                </section>
                <p v-if="!boardShown.length" class="npc-empty">찾는 게시판이 없어요.</p>
              </div>
            </div>
          </div>
          <button class="npc-select is-type" type="button" aria-haspopup="dialog" :class="{ 'is-empty': w.postType.value.id === 'normal' }" @click="w.tool.value = 'type'">
            <span>{{ w.postType.value.id === 'normal' ? '글 종류(말머리) 선택' : w.postType.value.label }}</span><img :src="icon('icon-caret-down-outline')" alt="">
          </button>
        </div>

        <label class="sr-only" for="npcTitle">제목</label>
        <input id="npcTitle" v-model="w.title.value" class="npc-title" maxlength="80" placeholder="제목을 입력해 주세요." autocomplete="off">

        <section class="npc-editor" aria-label="본문 편집기">
          <div class="npc-tools" role="toolbar" aria-label="콘텐츠 도구" @mousedown="keep">
            <button v-for="t in tools" :key="t.key" class="npc-tool" :class="[`is-${t.key}`, { 'is-on': t.key === 'sticker' && stickerOpen }]" type="button" @click="runTool(t.key)">
              <img :src="icon(t.icon)" alt=""><span>{{ t.label }}</span>
            </button>
          </div>
          <div v-if="stickerOpen" class="npc-sticker" role="region" aria-label="스티커">
            <nav class="npc-sticker-tabs" aria-label="스티커 묶음">
              <button v-for="[key, face, name] in packs" :key="key" type="button" :class="{ 'is-on': pack === key }" :aria-pressed="pack === key" :title="name" @click="pack = key">{{ face }}</button>
            </nav>
            <div class="npc-sticker-grid">
              <button v-for="(item, index) in stickerList" :key="`${index}-${item.e}`" type="button" :aria-label="item.d || item.e" @mousedown="keep" @click="w.editor.insertSticker(item.e)">{{ item.e }}</button>
            </div>
          </div>
          <div class="npc-format" @mousedown="keep">
            <WriteQuoteBar v-if="inQuote" :editor="w.editor" />
            <WriteFormatBar :editor="w.editor" naver @link="linkOpen = true" />
          </div>
          <PostTypeFields v-if="w.postType.value.id !== 'normal'" :type="w.postType.value" :values="w.typeValues.value" :problem="w.triedSubmit.value ? w.typeProblem.value : ''" @change="(key, value) => (w.typeValues.value = { ...w.typeValues.value, [key]: value })" @open="w.tool.value = 'type'" />
          <article :ref="setBody" class="aw-editor-body is-naver" />
        </section>

        <div class="npc-tags" @click="($event.currentTarget as HTMLElement).querySelector('input')?.focus()">
          <span v-for="tag in w.tags.value" :key="tag" class="npc-tag">#{{ tag }}<button type="button" :aria-label="`${tag} 태그 빼기`" @click.stop="removeTag(tag)"><img :src="icon('icon-close-outline')" alt=""></button></span>
          <label class="sr-only" for="npcTag">태그</label>
          <input id="npcTag" v-model="tagInput" :placeholder="w.tags.value.length ? '' : '# 태그를 입력해 주세요(최대 10개)'" autocomplete="off" :disabled="w.tags.value.length >= 10" @keydown="tagKey" @blur="addTag">
          <small>{{ w.tags.value.length }}/10</small>
        </div>
      </div>

      <aside class="npc-side" aria-labelledby="npcSideTitle">
        <h2 id="npcSideTitle">글쓰기 설정</h2>
        <label class="aw-switch-row"><span>공지로 등록</span><input v-model="w.settings.value.notice" type="checkbox" role="switch"><i aria-hidden="true" /></label>
        <fieldset class="npc-visibility">
          <legend>공개 설정</legend>
          <label v-for="(label, key) in visibilityLabel" :key="key"><input v-model="w.settings.value.visibility" type="radio" name="npcVisibility" :value="key"><span>{{ label }}</span></label>
        </fieldset>
        <label class="aw-switch-row is-desc"><span>검색 · 보배드림 서비스 공개 허용<small>허용하면 회원이 아닌 사람도 검색 결과에서 이 글을 볼 수 있습니다.</small></span><input v-model="w.allowSearch.value" type="checkbox" role="switch"><i aria-hidden="true" /></label>
        <label class="aw-switch-row"><span>댓글 허용</span><input v-model="w.settings.value.comments" type="checkbox" role="switch"><i aria-hidden="true" /></label>
        <label class="aw-switch-row"><span>카페, 블로그 스크랩 허용</span><input v-model="w.settings.value.scrap" type="checkbox" role="switch"><i aria-hidden="true" /></label>
        <label class="aw-switch-row"><span>복사, 저장 허용</span><input v-model="w.settings.value.copy" type="checkbox" role="switch"><i aria-hidden="true" /></label>
        <label class="aw-switch-row"><span>본문 숨기기</span><input v-model="w.hideBody.value" type="checkbox" role="switch"><i aria-hidden="true" /></label>
        <label class="npc-size"><span>첨부 사진 크기</span>
          <select v-model="w.settings.value.photoSize" aria-label="첨부 사진 크기"><option value="large">크게(가로크기 1280)</option><option value="medium">보통(가로크기 960)</option><option value="original">원본</option></select>
        </label>
      </aside>
    </div>

    <input ref="photoInput" class="sr-only" type="file" accept="image/*" multiple @change="pickMedia($event, 'photo')">
    <input ref="videoInput" class="sr-only" type="file" accept="video/mp4,video/webm,video/quicktime" multiple @change="pickMedia($event, 'video')">
    <input ref="fileInput" class="sr-only" type="file" @change="pickFile">
    <WriteUrlDialog v-if="linkOpen" placeholder="URL을 입력하세요." @ok="attachLink" @cancel="linkOpen = false" />
    <NaverDialog
      v-if="dialog === 'save'"
      title="임시저장 방법을 선택하세요."
      :lines="['임시등록 : 보배드림 서버에 저장해 다른 기기에서도 이어서 작성할 수 있습니다.', '이 기기에 임시보관 : 이 브라우저에서만 이어서 작성할 수 있습니다.']"
      :actions="saveActions" layout="stack" closable @close="dialog = ''"
    />
    <NaverDialog v-else-if="dialog === 'exit'" :lines="['글쓰기를 취소하시겠습니까?', '이 기기에 임시보관하면', '나중에 이어서 작성할 수 있습니다.']" :actions="exitActions" @close="dialog = ''" />
  </main>
</template>
