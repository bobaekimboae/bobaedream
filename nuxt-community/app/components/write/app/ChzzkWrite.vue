<!-- 커뮤니티 글쓰기 · 치지직형(2026-11-05 치지직 앱 글쓰기를 폰에 연결해 화면 · 동작을 직접 확인하고 맞춤)
     머리줄(× · 글쓰기 · 저장 · 등록) → 게시판 선택 → 제목 → 도구 줄 8개 → (서식 줄) → 본문 → 태그 · 본문 숨기기 -->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CommunityWrite } from '~/composables/write/useCommunityWrite'
import PostTypeFields from './PostTypeFields.vue'
import WriteBlockBar from './WriteBlockBar.vue'
import WriteUrlDialog from './WriteUrlDialog.vue'
import WriteVideoPage, { type VideoMeta } from './WriteVideoPage.vue'
import WriteFormatBar from './WriteFormatBar.vue'
import WriteQuoteBar from './WriteQuoteBar.vue'

const props = defineProps<{ w: CommunityWrite }>()
const emit = defineEmits<{ body: [el: HTMLElement | null] }>()
const w = props.w
const icon = (name: string) => communityAsset(`assets/reddit-write/${name}.svg`)
const textTools = ref(false)
const tagFocus = ref(false)
const photoInput = ref<HTMLInputElement | null>(null)
const videoInput = ref<HTMLInputElement | null>(null)
const replaceInput = ref<HTMLInputElement | null>(null)

/* ---------- 사진 · 동영상(치지직 앱 2026-11-05 폰 3차) ----------
   사진: 한 번에 1장. 고르면 도구 줄 「교체 · 링크 · 삭제」.
   동영상: 고르면 「동영상 업로드」 화면(대표 이미지 · 제목 · 정보 · 태그) → 「등록」으로 본문에 들어간다. */
function pickPhoto(event: Event) {
  const input = event.target as HTMLInputElement
  w.addMedia(input.files, 'photo')
  input.value = ''
}
type Pending = { id: string, url: string, name: string, file: File }
const videoQueue = ref<Pending[]>([])
const videoEdit = ref<{ pos: number, initial: Partial<VideoMeta> } | null>(null)
function pickVideo(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files ? [...input.files] : []
  input.value = ''
  const items = w.takeFiles(files, 'video')
  videoQueue.value = [...videoQueue.value, ...items.map((item, i) => ({ id: item.id, url: item.url, name: item.name, file: files[i]! }))]
}
function videoDone(meta: VideoMeta) {
  if (videoEdit.value) {
    const { pos } = videoEdit.value
    videoEdit.value = null
    w.editor.setMediaAttrs({ title: meta.title, info: meta.info, tags: meta.tags }, pos)
    return
  }
  const item = videoQueue.value[0]
  if (!item) return
  videoQueue.value = videoQueue.value.slice(1)
  w.editor.insertMedia({ id: item.id, kind: 'video', url: item.url, name: item.name }, { ...meta })
}
function videoClose() {
  if (videoEdit.value) { videoEdit.value = null; return }
  const item = videoQueue.value[0]
  if (item) w.dropMedia(item.id)
  videoQueue.value = videoQueue.value.slice(1)
}
function editVideo() {
  const pos = w.editor.block.value?.pos
  const attrs = w.editor.mediaAt()
  if (typeof pos !== 'number' || !attrs) return
  videoEdit.value = { pos, initial: { title: String(attrs.title || ''), info: String(attrs.info || ''), tags: String(attrs.tags || ''), poster: String(attrs.poster || ''), duration: String(attrs.duration || '') } }
}
/* 사진 교체: 같은 자리 · 같은 설명을 두고 그림만 바꾼다 */
const replacePos = ref<number | null>(null)
function startReplace() { replacePos.value = w.editor.block.value?.pos ?? null; replaceInput.value?.click() }
function pickReplace(event: Event) {
  const input = event.target as HTMLInputElement
  const at = replacePos.value
  const [item] = w.takeFiles(input.files ? [...input.files].slice(0, 1) : [], 'photo')
  input.value = ''
  if (!item || at === null) return
  const before = w.editor.setMediaAttrs({ mediaId: item.id, src: item.url, name: item.name }, at)
  if (before?.mediaId) w.dropMedia(String(before.mediaId))
}
/* 링크: 사진 자체(도구 줄 링크) · 설명 글자(설명 도구 줄 링크) */
const linkFor = ref<'media' | 'caption' | null>(null)
const linkPos = ref<number | null>(null)
function openLink(kind: 'media' | 'caption') {
  linkPos.value = kind === 'media' ? (w.editor.block.value?.pos ?? null) : w.editor.captionPos.value
  linkFor.value = kind
}
const linkValue = computed(() => {
  const attrs = linkPos.value === null ? null : w.editor.mediaAt(linkPos.value)
  return attrs ? String((linkFor.value === 'caption' ? attrs.captionHref : attrs.href) || '') : ''
})
function linkOk(href: string) {
  const at = linkPos.value
  const kind = linkFor.value
  linkFor.value = null
  if (at === null) return
  w.editor.setMediaAttrs(kind === 'caption' ? { captionHref: href } : { href }, at)
}
const caption = computed(() => w.editor.caption.value)
const s = computed(() => w.editor.state.value)
const inQuote = computed(() => s.value.quote > 0)
/* 치지직: 본문을 쓰는 동안(키보드가 올라온 동안)은 「본문 숨기기」 줄을 숨긴다 */
const writing = computed(() => w.editor.focused.value && !w.editor.block.value)
const keep = (event: Event) => event.preventDefault()
function setBody(el: unknown) { emit('body', el as HTMLElement | null) }

/* 선택된 블록 아래 오른쪽의 보라 「위로 · 아래로」 탭(치지직 앱: 상자 오른쪽 끝에 붙음, 단추 37×33) */
const editorBox = ref<HTMLElement | null>(null)
const movePos = ref<{ top: number, right: number } | null>(null)
const block = computed(() => w.editor.block.value)
function placeMoveTab() {
  const box = editorBox.value
  const dom = w.editor.blockDom()
  if (!box || !dom || !block.value) { movePos.value = null; return }
  const a = box.getBoundingClientRect()
  const b = (dom.querySelector('.write-media-frame') || dom).getBoundingClientRect()
  // 상자 아래가 화면 밖이면(긴 동영상 · 사진) 상자 오른쪽 위 안쪽에 붙인다(폰 3차)
  const below = b.bottom + 33 <= window.innerHeight
  movePos.value = { top: (below ? b.bottom : Math.max(b.top, 45)) - a.top, right: a.right - b.right }
}
watch(() => [block.value?.pos, block.value?.name, block.value?.align, block.value?.divider, w.editor.version.value], () => nextTick(placeMoveTab))
let resize: ResizeObserver | null = null
onMounted(() => {
  resize = new ResizeObserver(() => placeMoveTab())
  if (editorBox.value) resize.observe(editorBox.value)
  window.addEventListener('resize', placeMoveTab)
  window.addEventListener('scroll', placeMoveTab, { passive: true })
})
onBeforeUnmount(() => { resize?.disconnect(); window.removeEventListener('resize', placeMoveTab); window.removeEventListener('scroll', placeMoveTab) })
/* 치지직: 맨 끝이 블록이면 그 아래 빈 곳(61)을 눌러 새 문단을 연다(「본문 추가」) */
const endsWithBlock = computed(() => {
  void w.editor.version.value
  const doc = w.editor.editor.value?.state.doc
  const last = doc?.lastChild
  return Boolean(last && last.type.name !== 'paragraph' && last.type.name !== 'heading' && last.type.name !== 'bulletList')
})
function addParagraph() {
  const ed = w.editor.editor.value
  if (!ed) return
  ed.chain().insertContentAt(ed.state.doc.content.size, { type: 'paragraph' }).focus('end').run()
}
function editPoll() { w.tool.value = 'poll' }
function toTop() { window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }) }
</script>

<template>
  <main class="aw-chzzk" data-write-style="chzzk" data-testid="community-write">
    <header class="aw-head">
      <button class="aw-head-close" type="button" aria-label="닫기" @click="w.exit()"><img :src="icon('icon-close-outline')" alt=""></button>
      <h1>글쓰기</h1>
      <button class="aw-pill is-save" type="button" @click="w.saveDraft()">저장</button>
      <button class="aw-pill is-submit" type="button" :class="{ 'is-on': w.canPress.value }" :aria-disabled="!w.canPress.value" @click="w.canPress.value && w.submit()">등록</button>
    </header>

    <div class="aw-pick-row">
      <button class="aw-board" :class="{ 'has-value': w.board.value }" type="button" aria-haspopup="dialog" @click="w.tool.value = 'board'">
        <img :src="icon('icon-communities-outline')" alt=""><span>{{ w.board.value || '게시판을 선택하세요' }}</span><img class="aw-caret" :src="icon('icon-caret-down-fill')" alt="">
      </button>
      <button class="aw-kind" type="button" aria-haspopup="dialog" :aria-label="`글 종류 ${w.postType.value.label}`" @click="w.tool.value = 'type'">{{ w.postType.value.label }}<img class="aw-caret" :src="icon('icon-caret-down-fill')" alt=""></button>
    </div>

    <label class="sr-only" for="awTitle">제목</label>
    <input id="awTitle" v-model="w.title.value" class="aw-title" maxlength="80" placeholder="제목을 입력해주세요" autocomplete="off">

    <div v-if="caption" class="aw-tools is-caption" role="toolbar" aria-label="설명 도구" @mousedown.prevent>
      <button type="button" :aria-label="`설명 정렬 ${caption.align === 'center' ? '가운데' : caption.align === 'left' ? '왼쪽' : '오른쪽'} · 눌러서 바꾸기`" @click="w.editor.cycleCaptionAlign()"><img :src="icon(`icon-align-${caption.align}-outline`)" alt=""></button>
      <button type="button" aria-label="굵게" :aria-pressed="caption.bold" :class="{ 'is-on': caption.bold }" @click="w.editor.setCaptionAttrs({ captionBold: !caption.bold })"><img :src="icon('icon-bold-outline')" alt=""></button>
      <button type="button" aria-label="설명에 링크 걸기" :class="{ 'is-on': caption.href }" @click="openLink('caption')"><img :src="icon('icon-link-outline')" alt=""></button>
    </div>
    <WriteBlockBar v-else-if="block" :editor="w.editor" @edit-poll="editPoll" @replace="startReplace" @link="openLink('media')" @edit-video="editVideo" />
    <div v-else-if="inQuote" class="aw-tool-wrap"><WriteQuoteBar :editor="w.editor" /></div>
    <div v-else class="aw-tools" role="toolbar" aria-label="콘텐츠 도구" @mousedown="keep">
      <button type="button" aria-label="사진" @click="photoInput?.click()"><img :src="icon('icon-image-post-outline')" alt=""></button>
      <button type="button" aria-label="동영상" @click="videoInput?.click()"><img :src="icon('icon-video-post-outline')" alt=""></button>
      <button type="button" aria-label="텍스트 서식" :aria-expanded="textTools" :class="{ 'is-on': textTools }" @click="textTools = !textTools"><img :src="icon('icon-text-size-outline')" alt=""></button>
      <button type="button" aria-label="스티커" @click="w.tool.value = 'sticker'"><img :src="icon('icon-sticker-outline')" alt=""></button>
      <button type="button" aria-label="인용구" @click="w.editor.insertQuote(1)"><img :src="icon('icon-quote-outline')" alt=""></button>
      <button type="button" aria-label="구분선" @click="w.editor.insertDivider()"><img :src="icon('icon-subtract-outline')" alt=""></button>
      <button type="button" aria-label="링크" @click="w.tool.value = 'link'"><img :src="icon('icon-link-outline')" alt=""></button>
      <button type="button" aria-label="투표" @click="w.tool.value = 'poll'"><img :src="icon('icon-statistics-outline')" alt=""></button>
    </div>
    <WriteFormatBar v-if="!block && !caption && (textTools || inQuote)" :editor="w.editor" @link="w.tool.value = 'link'" />

    <PostTypeFields v-if="w.postType.value.id !== 'normal'" :type="w.postType.value" :values="w.typeValues.value" :problem="w.triedSubmit.value ? w.typeProblem.value : ''" @change="(key, value) => (w.typeValues.value = { ...w.typeValues.value, [key]: value })" @open="w.tool.value = 'type'" />

    <section ref="editorBox" class="aw-editor" aria-label="본문 편집기">
      <article :ref="setBody" class="aw-editor-body" />
      <button v-if="endsWithBlock" class="aw-add-body" type="button" aria-label="본문 추가" @click="addParagraph" />
      <div v-if="block && movePos" class="aw-move" :style="{ top: `${movePos.top}px`, right: `${movePos.right}px` }" @mousedown.prevent>
        <button type="button" aria-label="위로" :disabled="block.first" @click="w.editor.moveBlock(-1)"><img :src="icon('icon-up-outline')" alt=""></button>
        <button type="button" aria-label="아래로" :disabled="block.last" @click="w.editor.moveBlock(1)"><img :src="icon('icon-down-outline')" alt=""></button>
      </div>
    </section>

    <footer class="aw-foot" :class="{ 'is-writing': writing }">
      <label class="aw-tag-row">
        <span class="aw-tag-mark" aria-hidden="true"><img :src="icon('icon-hashtag-outline')" alt=""></span>
        <span class="sr-only">태그</span>
        <input v-model="w.tagDraft.value" maxlength="140" placeholder="#태그 입력 (#으로 구분, 최대 10개)" autocomplete="off" enterkeyhint="done" @focus="tagFocus = true" @blur="tagFocus = false; w.commitTags()" @keydown.enter.prevent="w.commitTags()">
      </label>
      <label v-if="!writing && !tagFocus" class="aw-hide-row">
        <img :src="icon('icon-hide-outline')" alt=""><span>본문 숨기기</span>
        <input v-model="w.hideBody.value" type="checkbox" role="switch"><i aria-hidden="true" />
      </label>
    </footer>

    <div class="aw-actions">
      <button class="is-cancel" type="button" @click="w.exit()">취소</button>
      <button class="is-save" type="button" @click="w.saveDraft()">저장</button>
      <button class="is-submit" type="button" :class="{ 'is-on': w.canPress.value }" :aria-disabled="!w.canPress.value" @click="w.canPress.value && w.submit()">등록</button>
    </div>
    <div class="aw-bottom">
      <button class="aw-totop" type="button" @click="toTop"><i aria-hidden="true"><img :src="icon('icon-up-arrow-outline')" alt=""></i>맨 위로</button>
    </div>

    <input ref="photoInput" class="sr-only" type="file" accept="image/*" @change="pickPhoto">
    <input ref="replaceInput" class="sr-only" type="file" accept="image/*" @change="pickReplace">
    <input ref="videoInput" class="sr-only" type="file" accept="video/mp4,video/webm,video/quicktime" multiple @change="pickVideo">
    <WriteVideoPage v-if="videoEdit" mode="edit" :initial="videoEdit.initial" @done="videoDone" @close="videoClose" />
    <WriteVideoPage v-else-if="videoQueue[0]" :key="videoQueue[0].id" mode="upload" :file="videoQueue[0].file" :url="videoQueue[0].url" @done="videoDone" @close="videoClose" />
    <WriteUrlDialog v-if="linkFor" :value="linkValue" @ok="linkOk" @cancel="linkFor = null" />
  </main>
</template>
