<!-- 예전 간결형 글쓰기(정적 chzzk-write.html 이식본). 비교용: /write?style=legacy -->
<!-- 커뮤니티 모바일 글쓰기(간결형). 정본: public/community/chzzk-write.html · chzzk-write.js
     DOM 구조 · 클래스 이름은 정적 판과 같게 두고, CSS 는 정적 판 파일을 그대로 쓴다(이 화면이 떠 있는 동안에만 붙인다). -->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import writeCss from '../../../../public/community/chzzk-write.css?raw'
import fontsCss from '../../../../public/community/community-editor-fonts.css?raw'
import pollCss from '../../../../public/community/community-poll.css?raw'
import newsCardCss from '../../../../public/community/news-card.css?raw'
import fixCss from '~/assets/css/legacy/write-nuxt.css?raw'
import WriteBoardSheet from '~/components/write/WriteBoardSheet.vue'
import WriteTagsSheet from '~/components/write/WriteTagsSheet.vue'
import WriteEmojiSheet from '~/components/write/WriteEmojiSheet.vue'
import WriteLinkSheet from '~/components/write/WriteLinkSheet.vue'
import WritePollSheet from '~/components/write/WritePollSheet.vue'
import type { PollData } from '~/composables/write/legacyLibs'
import { embedLib, loadWriteLibs } from '~/composables/write/legacyLibs'
import { useWriteEditor } from '~/composables/write/useWriteEditor'
import { useWriteMedia } from '~/composables/write/useWriteMedia'
import { DRAFT_KEY, POST_KEY, bodyLines, boardGroups, canSubmit, resolveReturnTo, tagSummary } from '~/composables/write/writeUtils'

/* 정적 판 CSS 안의 상대 주소(assets/…)는 커뮤니티 폴더 기준이다 */
const withCommunityUrls = (css: string) => css.replace(/url\((["']?)assets\//g, (_m, quote: string) => `url(${quote}${communityAsset('assets/')}`)
useHead({
  title: '글쓰기 | 보배드림',
  meta: [{ name: 'robots', content: 'noindex,nofollow' }],
  style: [
    { key: 'write-fonts', textContent: fontsCss },
    { key: 'write-main', textContent: writeCss },
    { key: 'write-poll', textContent: pollCss },
    { key: 'write-news-card', textContent: withCommunityUrls(newsCardCss) },
    { key: 'write-nuxt', textContent: fixCss },
  ],
})

const route = useRoute()
const query = (name: string) => { const value = route.query[name]; return String((Array.isArray(value) ? value[0] : value) || '') }
const returnTo = resolveReturnTo(query('returnTo'))
const groups = boardGroups(query('board'))
const icon = (name: string) => communityAsset(`assets/reddit-ui/${name}.svg`)

/* ---------- 알림 ---------- */
const toastText = ref('')
const toastHidden = ref(true)
let toastTimer = 0
function showToast(message: string) {
  toastText.value = message
  toastHidden.value = false
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toastHidden.value = true }, 1500)
}

/* ---------- 상태 ---------- */
const board = ref(query('board'))
const title = ref('')
const tags = ref<string[]>([])
const hideBody = ref(false)
const textToolsOpen = ref(false)
const dialog = ref<{ title: string, message: string } | null>(null)
const photoInput = ref<HTMLInputElement | null>(null)
const videoInput = ref<HTMLInputElement | null>(null)
const bodyEl = ref<HTMLElement | null>(null)

const { photos, videos, addFiles, removeMedia, revokeAll } = useWriteMedia(showToast)
const media = computed(() => [...photos.value, ...videos.value])

type SheetKind = '' | 'board' | 'tags' | 'sticker' | 'link' | 'poll'
const sheet = ref<SheetKind>('')
const sheetTitle = ref('선택')
const sheetPrimaryLabel = ref('')
const sheetKey = ref(0)
const sheetBodyRef = ref<{ primary: () => void, disabled: boolean } | null>(null)
const pollCurrent = ref<PollData | null>(null)

const writer = useWriteEditor(bodyEl, {
  onRemoveEmbed: () => {},
  onEditPoll: () => openSheet('poll', '투표', '확인'),
  onRemovePoll: () => showToast('투표를 삭제했습니다.'),
})

const ready = computed(() => {
  void writer.version.value
  return canSubmit({
    board: board.value,
    title: title.value,
    text: writer.text(),
    photos: photos.value.length,
    videos: videos.value.length,
    embeds: writer.countNodes('writeEmbed'),
    polls: writer.countNodes('editorPoll'),
  })
})

/* ---------- 시트 ---------- */
function openSheet(kind: Exclude<SheetKind, ''>, heading: string, primary = '') {
  if (kind === 'poll') { pollCurrent.value = writer.currentPoll(); primary = '확인' }
  sheet.value = kind
  sheetTitle.value = heading
  sheetPrimaryLabel.value = primary
  sheetKey.value += 1
  document.body.style.overflow = 'hidden'
}
function closeSheet() {
  sheet.value = ''
  document.body.style.overflow = ''
}
const primaryDisabled = computed(() => sheet.value === 'poll' && Boolean(sheetBodyRef.value?.disabled))
function onPrimary() { sheetBodyRef.value?.primary() }

function pickBoard(name: string) { board.value = name; closeSheet() }
function applyTags(next: string[]) { tags.value = next; closeSheet() }
function pickEmoji(emoji: string) { writer.insertText(emoji); closeSheet() }
function attachEmbed(href: string) {
  const item = embedLib()?.info(href)
  if (!item) { showToast('올바른 URL을 입력해주세요.'); closeSheet(); return }
  if (item.render === 'preview') item.title = '미리보기를 불러오는 중…'
  writer.insertEmbed(item)
  showToast(item.render === 'iframe' ? `${item.provider} 임베드를 넣었습니다.` : '이 사이트는 임베드를 지원하지 않아 링크 카드로 넣었어요.')
  closeSheet()
}
function attachLink(href: string, label: string) { writer.insertLink(href, label); closeSheet() }
function applyPoll(pollData: PollData) { writer.applyPoll(pollData); closeSheet() }

/* ---------- 도구 ---------- */
function onBlockStyle(event: Event) { writer.formatBlock((event.target as HTMLSelectElement).value) }
function onFontFamily(event: Event) { writer.setFontFamily((event.target as HTMLSelectElement).value) }
function onFontSize(event: Event) { writer.setFontSize(Number((event.target as HTMLSelectElement).value)) }
function onFiles(kind: 'photo' | 'video') {
  const input = kind === 'photo' ? photoInput.value : videoInput.value
  addFiles(input?.files || null, kind)
}

/* ---------- 저장 · 나가기 · 등록 ---------- */
function saveDraft() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ board: board.value, title: title.value, body: writer.html(), tags: tags.value, hideBody: hideBody.value, savedAt: new Date().toISOString() }))
    showToast('임시 저장했습니다.')
  }
  catch { /* 저장소를 쓸 수 없으면 정적 판처럼 알림 없이 넘어간다 */ }
}
function exitWriter() {
  if (title.value.trim() || writer.text()) saveDraft()
  navigateTo(returnTo)
}
async function submitPost() {
  if (!ready.value) return
  const list = media.value
  const stored = await Promise.all(list.map(item => item.saved || Promise.resolve(false)))
  const savedMedia = list.filter((_item, index) => stored[index]).map(item => ({ id: item.id, kind: item.kind === 'photo' ? 'image' : 'video', name: item.name }))
  const html = writer.html()
  try {
    localStorage.setItem(POST_KEY, JSON.stringify({ status: 'LOCAL_PREVIEW', source: 'chzzk-compact', board: board.value, head: '', title: title.value.trim(), body: bodyLines(html), html, embeds: writer.collectEmbeds(), media: savedMedia, tags: tags.value.map(tag => `#${tag}`).join(' '), photos: photos.value.map(({ id, name }) => ({ id, name })), videos: videos.value.map(({ id, name }) => ({ id, name })), hideBody: hideBody.value, submittedAt: new Date().toISOString() }))
    localStorage.removeItem(DRAFT_KEY)
  }
  catch { /* 미리보기 저장 실패는 정적 판과 같이 알림 창만 띄운다 */ }
  dialog.value = { title: '게시물 등록 완료', message: '간결형 게시판에서 등록한 글을 확인할 수 있습니다.' }
}
function confirmDialog() {
  const done = dialog.value?.title === '게시물 등록 완료'
  dialog.value = null
  if (done) navigateTo(returnTo)
}

function onKeydown(event: KeyboardEvent) { if (event.key === 'Escape') closeSheet() }

onMounted(async () => {
  useState('write-emoji-category').value = 'face-emotion'
  document.addEventListener('keydown', onKeydown)
  try { await loadWriteLibs() }
  catch { /* 공용 라이브러리를 못 불러와도 글쓰기는 된다(임베드 · 투표 카드만 간단히) */ }
  /* 임시 저장한 글을 다시 열면 게시판·제목·본문·태그·본문 숨기기를 되살린다 */
  let draftBody = ''
  let restored = false
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null')
    if (draft) {
      if (!board.value) board.value = draft.board || ''
      if (draft.title || draft.body) {
        title.value = draft.title || ''
        draftBody = draft.body || ''
        tags.value = Array.isArray(draft.tags) ? draft.tags : []
        hideBody.value = Boolean(draft.hideBody)
        restored = true
      }
    }
  }
  catch { /* ignore invalid local draft */ }
  await nextTick()
  writer.create()
  if (draftBody) writer.setHtml(draftBody)
  if (restored) showToast('임시 저장한 글을 불러왔습니다.')
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
  window.clearTimeout(toastTimer)
  writer.destroy()
  revokeAll()
})
watch(sheet, (value) => { if (!value) sheetBodyRef.value = null })
</script>

<template>
  <div class="chzzk-write-root">
    <main class="chzzk-write" data-testid="chzzk-write-page">
      <header class="write-head">
        <button class="head-close" type="button" aria-label="닫기" data-action="exit" @click="exitWriter">×</button>
        <h1>글쓰기</h1>
        <div class="head-actions">
          <button class="save-button" type="button" data-action="save-draft" @click="saveDraft">저장</button>
          <button class="submit-button" type="button" data-action="submit" :disabled="!ready" @click="submitPost">등록</button>
        </div>
      </header>

      <button id="boardButton" class="board-button" :class="{ 'has-value': board }" type="button" data-action="board" aria-expanded="false" @click="openSheet('board', '게시판 선택')">
        <img :src="icon('icon-communities-outline')" alt="">
        <span id="selectedBoard">{{ board || '게시판을 선택하세요' }}</span>
        <img class="chevron" :src="icon('icon-caret-down-outline')" alt="">
      </button>

      <label class="sr-only" for="postTitle">제목</label>
      <input id="postTitle" v-model="title" class="title-input" maxlength="80" placeholder="제목을 입력해주세요" autocomplete="off">

      <section class="editor" aria-label="본문 편집기">
        <div class="main-tools" role="toolbar" aria-label="콘텐츠 도구">
          <button type="button" data-action="photo" aria-label="사진" @click="photoInput?.click()"><img :src="icon('icon-image-post-outline')" alt=""></button>
          <button type="button" data-action="video" aria-label="동영상" @click="videoInput?.click()"><img :src="icon('icon-video-post-outline')" alt=""></button>
          <button type="button" data-action="text-tools" aria-label="텍스트 도구막대" :aria-expanded="textToolsOpen ? 'true' : 'false'" @click="textToolsOpen = !textToolsOpen"><img :src="icon('icon-text-size-outline')" alt=""></button>
          <button type="button" data-action="sticker" aria-label="스티커" @click="openSheet('sticker', '스티커')"><img :src="icon('icon-sticker-outline')" alt=""></button>
          <button type="button" data-action="quote" aria-label="인용구" @click="writer.insertQuote('인용할 내용을 입력하세요')"><img :src="icon('icon-quote-outline')" alt=""></button>
          <button type="button" data-action="divider" aria-label="구분선" @click="writer.insertDivider()"><span class="line-icon">−</span></button>
          <button type="button" data-action="link" aria-label="링크" @click="openSheet('link', '링크', '첨부')"><img :src="icon('icon-link-outline')" alt=""></button>
          <button class="poll-tool" type="button" data-action="poll" aria-label="투표" @click="openSheet('poll', '투표', '등록')"><img :src="icon('icon-statistics-outline')" alt=""><i>NEW</i></button>
        </div>

        <div id="textTools" class="text-tools" role="toolbar" aria-label="텍스트 서식" :hidden="!textToolsOpen">
          <select id="blockStyle" aria-label="문단 스타일" @change="onBlockStyle"><option value="p">본문</option><option value="h3">소제목</option><option value="blockquote">인용구</option></select>
          <select id="fontFamily" aria-label="글꼴" @change="onFontFamily"><option value="system">기본서체</option><option value="Nanum Gothic">나눔고딕</option><option value="Nanum Myeongjo">나눔명조</option></select>
          <select id="fontSize" aria-label="글자 크기" @change="onFontSize"><option>13</option><option selected>15</option><option>17</option><option>20</option><option>24</option></select>
          <button type="button" data-command="justifyLeft" aria-label="왼쪽 정렬" @click="writer.command('justifyLeft')">≡</button>
          <button type="button" data-command="bold" aria-label="굵게" @click="writer.command('bold')"><b>B</b></button>
          <button type="button" data-command="italic" aria-label="기울이기" @click="writer.command('italic')"><i>I</i></button>
          <button type="button" data-command="underline" aria-label="밑줄" @click="writer.command('underline')"><u>U</u></button>
        </div>

        <article id="postBody" ref="bodyEl" class="editor-body" contenteditable="true" role="textbox" aria-multiline="true" data-placeholder="함께 나누고 싶은 얘기를 남겨주세요." />
        <section id="mediaList" class="media-list" aria-label="첨부 미디어" :hidden="media.length === 0">
          <article v-for="item in media" :key="item.id" class="media-card" :data-media-id="item.id">
            <img v-if="item.kind === 'photo'" :src="item.url" :alt="item.name"><video v-else :src="item.url" controls playsinline /><footer><span>{{ item.name }}</span><button type="button" data-remove-media @click="removeMedia(item.id)">삭제</button></footer>
          </article>
        </section>
      </section>

      <button class="tag-button" type="button" data-action="tags" @click="openSheet('tags', '태그', '완료')"><b>#</b><span id="tagSummary">{{ tagSummary(tags) }}</span></button>
      <label class="hide-row"><img :src="icon('icon-hide-outline')" alt=""><span>본문 숨기기</span><input id="hideBody" v-model="hideBody" type="checkbox"><i aria-hidden="true" /></label>

      <footer class="write-foot">
        <button type="button" data-action="exit" @click="exitWriter">취소</button>
        <button class="footer-save" type="button" data-action="save-draft" @click="saveDraft">저장</button>
        <button class="footer-submit" type="button" data-action="submit" :disabled="!ready" @click="submitPost">등록</button>
      </footer>
    </main>

    <input id="photoInput" ref="photoInput" class="sr-only" type="file" accept="image/*" multiple @change="onFiles('photo')">
    <input id="videoInput" ref="videoInput" class="sr-only" type="file" accept="video/mp4,video/webm,video/quicktime" multiple @change="onFiles('video')">

    <div id="sheetOverlay" class="overlay" :class="{ 'is-poll': sheet === 'poll' }" :hidden="!sheet" @click.self="closeSheet">
      <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheetTitle">
        <header><button type="button" aria-label="뒤로가기" data-action="close-sheet" @click="closeSheet">‹</button><h2 id="sheetTitle">{{ sheetTitle }}</h2><button id="sheetPrimary" class="sheet-primary" type="button" :hidden="!sheetPrimaryLabel" :disabled="primaryDisabled" @click="onPrimary">{{ sheetPrimaryLabel }}</button></header>
        <div id="sheetBody" class="sheet-body">
          <WriteBoardSheet v-if="sheet === 'board'" :key="sheetKey" :groups="groups" :selected="board" @pick="pickBoard" />
          <WriteTagsSheet v-else-if="sheet === 'tags'" :key="sheetKey" ref="sheetBodyRef" :tags="tags" @apply="applyTags" />
          <WriteEmojiSheet v-else-if="sheet === 'sticker'" :key="sheetKey" @pick="pickEmoji" />
          <WriteLinkSheet v-else-if="sheet === 'link'" :key="sheetKey" ref="sheetBodyRef" @toast="showToast" @embed="attachEmbed" @link="attachLink" />
          <WritePollSheet v-else-if="sheet === 'poll'" :key="sheetKey" ref="sheetBodyRef" :current="pollCurrent" @toast="showToast" @apply="applyPoll" />
        </div>
      </section>
    </div>

    <div id="dialogOverlay" class="overlay dialog-overlay" :hidden="!dialog">
      <section class="notice-dialog" role="dialog" aria-modal="true" aria-labelledby="dialogTitle">
        <h2 id="dialogTitle">{{ dialog?.title || '안내' }}</h2>
        <p id="dialogMessage">{{ dialog?.message || '' }}</p>
        <button class="dialog-confirm" type="button" data-action="close-dialog" @click="confirmDialog">확인</button>
      </section>
    </div>

    <div id="toast" class="toast" role="status" aria-live="polite" :hidden="toastHidden">{{ toastText }}</div>
  </div>
</template>
