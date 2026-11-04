<script setup lang="ts">
// PC 레딧형 글쓰기 — 정적 public/community/reddit-write.html(+ reddit-write.js, ?layout=reddit 로 엶) 이식 (2026-11-04)
// reddit-write.css 는 이 화면에 있는 동안만 붙인다. 본문은 정적 판과 같은 contenteditable + execCommand 서식이다.
import writeCss from '../../../../public/community/reddit-write.css?raw'
import { communities, flairs, LATEST_POST_KEY, padPoll, resolveReturnTo, WRITE_DRAFT_KEY } from '~/composables/pc/pcWrite'
import { appHref, readStore, usePcLegacyStyles, writeStore } from '~/composables/pc/usePcBoard'

type Media = { id: string; kind: 'image' | 'video'; name: string; url: string }
type Link = { url: string; label: string }
type Panel = 'link' | 'poll' | 'ama'

const route = useRoute()
const router = useRouter()
const q = (key: string) => {
  const v = route.query[key]
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null)
}

// main.css 가 정적 판에 없는 값을 깐 규칙(.brand · .header-actions)을 reddit-write.css 앞에서 기본값으로 되돌린다.
const WRITE_RESET = [
  '.brand{justify-self:revert;display:revert;align-items:revert;gap:revert;color:revert}',
  '.brand-mark{width:revert;height:revert;display:revert;place-items:revert;border-radius:revert;background:revert;color:revert;font-size:revert;font-weight:revert}',
  '.brand strong{font-size:revert;line-height:revert;font-weight:revert;letter-spacing:revert}',
  '.header-actions{justify-self:revert;display:revert;align-items:revert;gap:revert}',
  '.header-actions>button{width:revert;height:revert;display:revert;place-items:revert}',
  '.header-actions img{width:revert;height:revert}',
].join('\n')
const WRITE_ROOT = ':root{background:var(--canvas);color:var(--ink);font-family:Pretendard,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans KR",sans-serif;font-synthesis:initial}'

const dialog = ref<null | 'community' | 'flair'>(null)
usePcLegacyStyles({
  sheets: [writeCss],
  reset: WRITE_RESET,
  root: WRITE_ROOT,
  htmlClass: () => '',
  title: () => '게시물 작성 · 보배드림',
})
// 정적 판 openDialog/closeDialog: document.body.style.overflow
watch(dialog, open => { document.body.style.overflow = open ? 'hidden' : '' })

// 정적 판 returnTo 는 community/reddit-write.html 기준으로 풀린다.
const returnTo = resolveReturnTo(q('returnTo'), location.origin, location.origin + communityAsset('reddit-write.html'))
const backHref = appHref('/?view=reddit')

const state = reactive({
  community: q('board') || '자동차뉴스',
  media: [] as Media[],
  flairs: [] as string[],
  spoiler: false,
  nsfw: false,
  link: null as Link | null,
})
const title = ref('')
const bodyEl = ref<HTMLDivElement | null>(null)
const titleEl = ref<HTMLTextAreaElement | null>(null)
const imageInput = ref<HTMLInputElement | null>(null)
const videoInput = ref<HTMLInputElement | null>(null)
const searchEl = ref<HTMLInputElement | null>(null)
const draftStatus = ref('변경사항 없음')
const toastText = ref('')
const toastShown = ref(false)
const shownFlairs = ref<string[]>([])
const pressed = ref<string[]>([])
const communityQuery = ref('')
const panels = reactive({ link: false, poll: false, ama: false })
const activeTools = reactive({ link: false, poll: false, ama: false })
const pollOptions = ref<string[]>([])
const pollDuration = ref('3')
const linkUrl = ref('')
const linkLabel = ref('')
const amaTime = ref('')
const amaHosts = ref('')
const ready = ref(false) // 정적 판 sync() 가 끝나기 전에는 게시 버튼이 HTML 그대로(disabled)
const bodyText = ref('')
let saveTimer: ReturnType<typeof setTimeout> | undefined
let toastTimer: ReturnType<typeof setTimeout> | undefined

const selected = computed(() => communities.find(item => item.name === state.community) || communities[0]!)
const visibleCommunities = computed(() => {
  const normalized = communityQuery.value.trim().toLowerCase()
  return communities.filter(item => !normalized || item.name.toLowerCase().includes(normalized))
})

function showToast(message: string) {
  toastText.value = message
  toastShown.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastShown.value = false }, 1900)
}
function uid(prefix: string) { return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7) }
function bodyPlain() { return bodyEl.value?.textContent || '' }
function isReady() { return Boolean(state.community && title.value.trim() && (bodyPlain().trim() || state.media.length || state.link)) }
const canPublish = ref(false)
function resizeTitle() {
  const el = titleEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(116, el.scrollHeight) + 'px'
}
function sync() {
  bodyText.value = bodyPlain()
  canPublish.value = isReady()
  ready.value = true
  nextTick(resizeTitle)
}
function dirty() {
  draftStatus.value = '저장되지 않음'
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => saveDraft(false), 900)
  sync()
}
function readPoll() {
  if (!panels.poll) return null
  return { options: pollOptions.value.map(v => v.trim()).filter(Boolean), duration: pollDuration.value }
}
function readAma() {
  if (!panels.ama) return null
  return { time: amaTime.value, hosts: amaHosts.value.trim() }
}
function saveDraft(silent: boolean) {
  const draft = { community: state.community, title: title.value, body: bodyEl.value?.innerHTML || '', flairs: state.flairs, spoiler: state.spoiler, nsfw: state.nsfw, poll: readPoll(), ama: readAma(), link: state.link, savedAt: Date.now() }
  writeStore(WRITE_DRAFT_KEY, JSON.stringify(draft))
  draftStatus.value = '임시 저장됨'
  if (!silent) showToast('임시 저장했습니다.')
}
function restoreDraft() {
  try {
    const draft = JSON.parse(readStore(WRITE_DRAFT_KEY) || 'null')
    if (!draft) return
    state.community = draft.community || state.community
    title.value = draft.title || ''
    if (bodyEl.value) bodyEl.value.innerHTML = draft.body || ''
    state.flairs = Array.isArray(draft.flairs) ? draft.flairs : []
    state.spoiler = Boolean(draft.spoiler)
    state.nsfw = Boolean(draft.nsfw)
    state.link = draft.link || null
    renderLink()
    if (draft.poll) { openPanel('poll'); pollOptions.value = padPoll(draft.poll.options); pollDuration.value = String(draft.poll.duration || 3) }
    if (draft.ama) { openPanel('ama'); amaTime.value = draft.ama.time || ''; amaHosts.value = draft.ama.hosts || '' }
    shownFlairs.value = state.flairs.slice()
    draftStatus.value = '임시 저장 복원됨'
  } catch {
    showToast('임시 저장본을 불러오지 못했습니다.')
  }
}
function renderLink() {
  if (!state.link) return
  panels.link = true
  linkUrl.value = state.link.url || ''
  linkLabel.value = state.link.label || ''
  activeTools.link = true
}

// ---------- 창 ----------
function openDialog(kind: 'community' | 'flair') {
  dialog.value = kind
  if (kind === 'community') {
    communityQuery.value = '' // 정적 판 renderCommunityList(''): 목록만 다시 그리고 입력칸 글자는 그대로 둔다
    setTimeout(() => searchEl.value?.focus(), 30)
  } else {
    pressed.value = flairs.filter(f => state.flairs.includes(f))
  }
}
function closeDialog() { dialog.value = null }
function pickCommunity(name: string) { state.community = name; closeDialog(); dirty() }
function toggleFlair(flair: string) {
  const on = !pressed.value.includes(flair)
  pressed.value = on ? flairs.filter(f => f === flair || pressed.value.includes(f)) : pressed.value.filter(f => f !== flair)
  state.flairs = pressed.value.slice(0, 3)
}
function applyFlair() { shownFlairs.value = state.flairs.slice(); closeDialog(); dirty() }

// ---------- 넣기 판 ----------
function openPanel(kind: Panel) {
  for (const name of ['link', 'poll', 'ama'] as Panel[]) {
    const open = name === kind && panels[name]
    panels[name] = !(name !== kind || open)
    activeTools[name] = name === kind && !open
  }
  if (kind === 'poll' && !pollOptions.value.length) pollOptions.value = ['', '']
}
function closePanel(name: Panel) {
  panels[name] = false
  activeTools[name] = false
  if (name === 'link') state.link = null
  dirty()
}
function addPollOption() {
  if (pollOptions.value.length >= 6) return showToast('선택지는 최대 6개입니다.')
  pollOptions.value = pollOptions.value.concat('')
  dirty()
}
function removePollOption(index: number) {
  if (pollOptions.value.length <= 2) return showToast('선택지는 두 개 이상 필요합니다.')
  pollOptions.value = pollOptions.value.filter((_, i) => i !== index)
  dirty()
}
function confirmLink() {
  const raw = linkUrl.value.trim()
  try {
    const parsed = new URL(raw)
    if (!/^https?:$/.test(parsed.protocol)) throw new Error()
    state.link = { url: parsed.href, label: linkLabel.value.trim() || parsed.hostname }
    showToast('링크를 추가했습니다.')
    dirty()
  } catch {
    showToast('올바른 웹 주소를 입력해 주세요.')
  }
}
function toggle(key: 'spoiler' | 'nsfw') { state[key] = !state[key]; dirty() }

// ---------- 첨부 ----------
function addFiles(files: FileList | File[] | null, kind: 'image' | 'video') {
  Array.from(files || []).slice(0, kind === 'image' ? 20 : 5).forEach(file => {
    state.media.push({ id: uid(kind), kind, name: file.name, url: URL.createObjectURL(file) })
  })
  dirty()
}
function removeMedia(id: string) {
  const index = state.media.findIndex(item => item.id === id)
  if (index > -1) {
    URL.revokeObjectURL(state.media[index]!.url)
    state.media.splice(index, 1)
    dirty()
  }
}
function onFiles(event: Event, kind: 'image' | 'video') {
  const input = event.target as HTMLInputElement
  addFiles(input.files, kind)
  input.value = ''
}
function filesFrom(list: FileList | undefined | null) { return Array.from(list || []) }
function onPaste(event: ClipboardEvent) {
  const files = filesFrom(event.clipboardData?.files)
  if (!files.length) return
  event.preventDefault()
  addFiles(files.filter(f => f.type.startsWith('image/')), 'image')
  addFiles(files.filter(f => f.type.startsWith('video/')), 'video')
}
function onDragOver(event: DragEvent) { if (event.dataTransfer && event.dataTransfer.files.length) event.preventDefault() }
function onDrop(event: DragEvent) {
  const files = filesFrom(event.dataTransfer?.files)
  if (!files.length) return
  event.preventDefault()
  addFiles(files.filter(f => f.type.startsWith('image/')), 'image')
  addFiles(files.filter(f => f.type.startsWith('video/')), 'video')
}

// ---------- 서식 ----------
function format(command: string, value?: string) {
  bodyEl.value?.focus()
  document.execCommand(command, false, value || undefined)
  dirty()
}
function addBodyLink() {
  const selection = window.getSelection()
  const selectedText = selection && selection.toString()
  const url = prompt('링크 주소를 입력하세요.', 'https://')
  if (!url) return
  try {
    const parsed = new URL(url)
    if (!/^https?:$/.test(parsed.protocol)) throw new Error()
    format('createLink', parsed.href)
    if (!selectedText) document.execCommand('insertText', false, parsed.href)
  } catch {
    showToast('올바른 웹 주소를 입력해 주세요.')
  }
}

// ---------- 게시 ----------
function buildPost() {
  const poll = readPoll()
  const ama = readAma()
  const html = bodyEl.value?.innerHTML || ''
  const reader = document.createElement('div')
  reader.innerHTML = html
  const plain = (reader.textContent || '').replace(/\s+/g, ' ').trim()
  return {
    id: Date.now(), status: 'LOCAL_PREVIEW', source: 'reddit-write', boardId: state.community === '자동차뉴스' ? 'car-news' : 'community', board: state.community,
    head: state.flairs[0] || state.community, category: state.flairs[0] || state.community, title: title.value.trim(), body: plain ? [plain] : [], html,
    media: state.media.map(item => ({ kind: item.kind, name: item.name })),
    photos: state.media.filter(item => item.kind === 'image').map(item => ({ name: item.name })),
    videos: state.media.filter(item => item.kind === 'video').map(item => ({ name: item.name })),
    link: state.link, poll, ama, flairs: state.flairs.slice(), spoiler: state.spoiler, nsfw: state.nsfw, submittedAt: new Date().toISOString(),
  }
}
function publish() {
  if (!isReady()) { showToast('게시판, 제목, 내용을 확인해 주세요.'); return }
  const poll = readPoll()
  if (poll && poll.options.length < 2) { showToast('투표 선택지를 두 개 이상 입력해 주세요.'); return }
  const post = buildPost()
  try {
    // 정적 판은 car-news-table.js(BBMCarNewsTable)가 있을 때 자동차뉴스 표에도 넣는다. 그 파일은 지금 저장소에 없다(정적 판도 404).
    localStorage.setItem(LATEST_POST_KEY, JSON.stringify(post))
    localStorage.removeItem(WRITE_DRAFT_KEY)
  } catch {
    showToast('게시물을 저장하지 못했습니다.')
    return
  }
  showToast('게시물을 등록했습니다.')
  setTimeout(() => router.push(returnTo), 500)
}
function onSubmit() { publish() }
function cancel() { router.push(returnTo) }

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeDialog()
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); saveDraft(false) }
}
function leaveSave() { if (title.value.trim() || bodyPlain().trim()) saveDraft(true) }

onMounted(() => {
  restoreDraft()
  sync()
  document.addEventListener('keydown', onKeydown)
  window.addEventListener('beforeunload', leaveSave)
})
onBeforeUnmount(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKeydown)
  window.removeEventListener('beforeunload', leaveSave)
  clearTimeout(saveTimer)
  leaveSave() // 정적 판 beforeunload 와 같다(화면을 떠날 때 내용이 있으면 조용히 저장)
})
</script>

<template>
  <div class="pcWriteRoot" style="display:contents">
    <header class="global-header">
      <a class="brand" :href="backHref" aria-label="보배드림 커뮤니티">
        <span class="brand-mark" aria-hidden="true">b</span>
        <strong>보배드림</strong>
      </a>
      <button class="search-pill" type="button" aria-label="커뮤니티 검색">
        <img :src="communityAsset('assets/reddit-ui/search.svg')" alt="">
        <span>커뮤니티 검색</span>
      </button>
      <nav class="header-actions" aria-label="빠른 메뉴">
        <button type="button" aria-label="메뉴"><img :src="communityAsset('assets/reddit-ui/menu.svg')" alt=""></button>
        <button class="profile-button" type="button" aria-label="내 프로필"><img :src="communityAsset('assets/chotot-default-avatar.svg')" alt=""></button>
      </nav>
    </header>

    <div class="page-grid">
      <aside class="left-rail" aria-label="커뮤니티 메뉴">
        <a :href="backHref"><span class="rail-icon"><img :src="communityAsset('assets/reddit-ui/back.svg')" alt=""></span>피드로 돌아가기</a>
        <button type="button"><span class="rail-icon"><img :src="communityAsset('assets/reddit-ui/view-card.svg')" alt=""></span>인기 게시물</button>
        <button type="button"><span class="rail-icon"><img :src="communityAsset('assets/reddit-ui/view-list.svg')" alt=""></span>최신 게시물</button>
        <hr>
        <p>최근 게시판</p>
        <button type="button"><span class="community-dot is-news">N</span>자동차뉴스</button>
        <button type="button"><span class="community-dot">B</span>브랜드 자동차 정보</button>
        <button type="button"><span class="community-dot">자</span>자유게시판</button>
        <button type="button"><span class="community-dot">국</span>국산차 오너톡</button>
      </aside>

      <main class="composer-column" data-testid="reddit-write-page">
        <div class="mobile-titlebar">
          <a :href="backHref" aria-label="닫기"><img :src="communityAsset('assets/write-parity/close.svg')" alt=""></a>
          <strong>게시물 작성</strong>
          <button id="mobilePostButton" type="button" data-action="publish" :disabled="!ready || !canPublish" @click="publish">게시</button>
        </div>

        <section class="composer-heading">
          <div>
            <h1>게시물 작성</h1>
            <span id="draftStatus" role="status">{{ draftStatus }}</span>
          </div>
          <button class="draft-button" type="button" data-action="save-draft" @click="saveDraft(false)">임시 저장</button>
        </section>

        <button id="communityPicker" class="community-picker" type="button" aria-haspopup="dialog" @click="openDialog('community')">
          <span class="community-avatar">{{ selected.letter }}</span>
          <span><small>게시할 커뮤니티</small><strong id="selectedCommunity">{{ selected.name }}</strong></span>
          <img :src="communityAsset('assets/reddit-ui/chevron-down.svg')" alt="">
        </button>

        <form id="composerForm" class="composer-card" novalidate @submit.prevent="onSubmit">
          <div class="title-field">
            <textarea id="postTitle" ref="titleEl" v-model="title" rows="1" maxlength="300" placeholder="제목" aria-label="게시물 제목" @input="dirty" />
            <span><b id="titleCount">{{ title.length }}</b>/300</span>
          </div>

          <div id="flairRow" class="selected-tags" :hidden="!shownFlairs.length"><span v-for="flair in shownFlairs" :key="flair">{{ flair }}</span></div>

          <section class="editor-shell" aria-label="본문 편집기">
            <div id="postBody" ref="bodyEl" class="post-body" contenteditable="true" role="textbox" aria-multiline="true" data-placeholder="내용을 입력하세요." @input="dirty" @paste="onPaste" @dragover="onDragOver" @drop="onDrop" />
            <div id="attachmentArea" class="attachment-area" :hidden="!state.media.length">
              <article v-for="item in state.media" :key="item.id" class="media-tile" :data-media-id="item.id"><img v-if="item.kind === 'image'" :src="item.url" :alt="item.name"><video v-else :src="item.url" controls playsinline /><button type="button" :data-remove-media="item.id" aria-label="삭제" @click="removeMedia(item.id)"><img :src="communityAsset('assets/write-parity/close.svg')" alt=""></button><small>{{ item.name }}</small></article>
            </div>
            <div id="linkPanel" class="insert-panel" :hidden="!panels.link">
              <div class="panel-heading"><img :src="communityAsset('assets/write-parity/link.svg')" alt=""><strong>링크</strong><button type="button" data-close-panel="link" aria-label="닫기" @click="closePanel('link')"><img :src="communityAsset('assets/write-parity/close.svg')" alt=""></button></div>
              <input id="linkUrl" v-model="linkUrl" type="url" inputmode="url" placeholder="https://" aria-label="링크 주소" @input="dirty">
              <input id="linkLabel" v-model="linkLabel" maxlength="100" placeholder="링크 제목 (선택)" aria-label="링크 제목" @input="dirty">
              <button type="button" data-action="confirm-link" @click="confirmLink">링크 추가</button>
            </div>
            <div id="pollPanel" class="insert-panel" :hidden="!panels.poll">
              <div class="panel-heading"><img :src="communityAsset('assets/write-parity/table.svg')" alt=""><strong>투표</strong><button type="button" data-close-panel="poll" aria-label="닫기" @click="closePanel('poll')"><img :src="communityAsset('assets/write-parity/close.svg')" alt=""></button></div>
              <div id="pollOptions" class="poll-options"><div v-for="(_, index) in pollOptions" :key="index" class="poll-row"><b>{{ index + 1 }}</b><input v-model="pollOptions[index]" class="poll-option" maxlength="80" :placeholder="'선택지 ' + (index + 1)" @input="dirty"><button type="button" :data-remove-poll="index" aria-label="선택지 삭제" @click="removePollOption(index)">×</button></div></div>
              <button class="add-option" type="button" data-action="add-poll-option" @click="addPollOption">선택지 추가</button>
              <label class="duration-field">투표 기간<select id="pollDuration" v-model="pollDuration" @input="dirty"><option value="1">1일</option><option value="3">3일</option><option value="7">7일</option></select></label>
            </div>
            <div id="amaPanel" class="insert-panel" :hidden="!panels.ama">
              <div class="panel-heading"><img :src="communityAsset('assets/write-parity/sticker.svg')" alt=""><strong>AMA 설정</strong><button type="button" data-close-panel="ama" aria-label="닫기" @click="closePanel('ama')"><img :src="communityAsset('assets/write-parity/close.svg')" alt=""></button></div>
              <label>시작 시간<input id="amaTime" v-model="amaTime" type="datetime-local" @input="dirty"></label>
              <label>공동 진행자<input id="amaHosts" v-model="amaHosts" maxlength="100" placeholder="닉네임을 쉼표로 구분" @input="dirty"></label>
            </div>

            <div class="format-toolbar" role="toolbar" aria-label="텍스트 서식">
              <button type="button" data-command="bold" aria-label="굵게" @click="format('bold')"><img :src="communityAsset('assets/write-parity/bold.svg')" alt=""></button>
              <button type="button" data-command="italic" aria-label="기울임" @click="format('italic')"><img :src="communityAsset('assets/write-parity/italic.svg')" alt=""></button>
              <button type="button" data-command="strikeThrough" aria-label="취소선" @click="format('strikeThrough')"><img :src="communityAsset('assets/write-parity/strike.svg')" alt=""></button>
              <button type="button" data-action="format-link" aria-label="본문 링크" @click="addBodyLink"><img :src="communityAsset('assets/write-parity/link.svg')" alt=""></button>
              <button type="button" data-command="insertUnorderedList" aria-label="글머리 기호" @click="format('insertUnorderedList')"><img :src="communityAsset('assets/reddit-ui/view-list.svg')" alt=""></button>
              <button type="button" data-command="formatBlock" data-value="blockquote" aria-label="인용" @click="format('formatBlock', 'blockquote')"><img :src="communityAsset('assets/write-parity/quote.svg')" alt=""></button>
            </div>

            <div class="insert-toolbar" role="toolbar" aria-label="게시물에 추가">
              <button type="button" data-action="image" aria-label="이미지 추가" @click="imageInput?.click()"><img :src="communityAsset('assets/write-parity/photo.svg')" alt=""><span>이미지</span></button>
              <button type="button" data-action="video" aria-label="동영상 추가" @click="videoInput?.click()"><img :src="communityAsset('assets/write-parity/video.svg')" alt=""><span>동영상</span></button>
              <button type="button" data-action="link" aria-label="링크 추가" :class="{ 'is-active': activeTools.link }" @click="openPanel('link')"><img :src="communityAsset('assets/write-parity/link.svg')" alt=""><span>링크</span></button>
              <button type="button" data-action="poll" aria-label="투표 추가" :class="{ 'is-active': activeTools.poll }" @click="openPanel('poll')"><img :src="communityAsset('assets/write-parity/table.svg')" alt=""><span>투표</span></button>
              <button type="button" data-action="ama" aria-label="AMA 추가" :class="{ 'is-active': activeTools.ama }" @click="openPanel('ama')"><img :src="communityAsset('assets/write-parity/sticker.svg')" alt=""><span>AMA</span></button>
            </div>
          </section>

          <div class="post-options">
            <button type="button" data-action="flair" @click="openDialog('flair')"><img :src="communityAsset('assets/write-parity/tag.svg')" alt="">플레어 및 태그</button>
            <button type="button" data-toggle="spoiler" :aria-pressed="state.spoiler ? 'true' : 'false'" @click="toggle('spoiler')">스포일러</button>
            <button type="button" data-toggle="nsfw" :aria-pressed="state.nsfw ? 'true' : 'false'" @click="toggle('nsfw')">18+</button>
          </div>

          <footer class="composer-actions">
            <button class="cancel-button" type="button" data-action="cancel" @click="cancel">취소</button>
            <button id="desktopPostButton" class="post-button" type="submit" :disabled="!ready || !canPublish">게시</button>
          </footer>
        </form>
      </main>

      <aside class="rules-card">
        <h2><span class="community-avatar">{{ selected.letter }}</span>자동차뉴스 게시 규칙</h2>
        <ol>
          <li><b>자동차 관련 내용을 작성해 주세요</b><span>기사, 신차, 정책, 정비와 시장 소식을 다룹니다.</span></li>
          <li><b>출처를 명확히 표시해 주세요</b><span>외부 자료는 링크와 작성자를 함께 적어 주세요.</span></li>
          <li><b>중복 게시물을 확인해 주세요</b><span>같은 소식이 있는지 검색 후 작성해 주세요.</span></li>
          <li><b>개인정보를 올리지 마세요</b><span>번호판과 연락처 등 민감한 정보는 가려 주세요.</span></li>
        </ol>
      </aside>
    </div>

    <input id="imageInput" ref="imageInput" type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple hidden @change="onFiles($event, 'image')">
    <input id="videoInput" ref="videoInput" type="file" accept="video/mp4,video/webm,video/quicktime" multiple hidden @change="onFiles($event, 'video')">

    <div id="dialogBackdrop" class="dialog-backdrop" :hidden="!dialog" @click.self="closeDialog">
      <section id="communityDialog" class="dialog" role="dialog" aria-modal="true" aria-labelledby="communityDialogTitle" :hidden="dialog !== 'community'">
        <header><button type="button" data-action="close-dialog" aria-label="닫기" @click="closeDialog"><img :src="communityAsset('assets/write-parity/close.svg')" alt=""></button><h2 id="communityDialogTitle">커뮤니티 선택</h2><span /></header>
        <label class="dialog-search"><img :src="communityAsset('assets/reddit-ui/search.svg')" alt=""><input id="communitySearch" ref="searchEl" placeholder="커뮤니티 검색" @input="communityQuery = ($event.target as HTMLInputElement).value"></label>
        <div id="communityList" class="community-list"><button v-for="item in visibleCommunities" :key="item.name" class="community-option" :class="{ 'is-selected': item.name === state.community }" type="button" :data-community="item.name" @click="pickCommunity(item.name)"><span class="community-avatar">{{ item.letter }}</span><span><strong>{{ item.name }}</strong><small>회원 {{ item.members }}</small></span></button></div>
      </section>
      <section id="flairDialog" class="dialog" role="dialog" aria-modal="true" aria-labelledby="flairDialogTitle" :hidden="dialog !== 'flair'">
        <header><button type="button" data-action="close-dialog" aria-label="닫기" @click="closeDialog"><img :src="communityAsset('assets/write-parity/close.svg')" alt=""></button><h2 id="flairDialogTitle">플레어 및 태그</h2><button type="button" data-action="apply-flair" @click="applyFlair">적용</button></header>
        <div id="flairList" class="flair-list"><button v-for="flair in flairs" :key="flair" class="flair-option" type="button" :data-flair="flair" :aria-pressed="pressed.includes(flair) ? 'true' : 'false'" @click="toggleFlair(flair)"><span>{{ flair }}</span></button></div>
      </section>
    </div>

    <div id="toast" class="toast" role="status" :hidden="!toastShown">{{ toastText }}</div>
  </div>
</template>
