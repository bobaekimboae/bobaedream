<!-- 커뮤니티 글쓰기 · 치지직형(2026-11-05 치지직 앱 글쓰기를 폰에 연결해 화면 · 동작을 직접 확인하고 맞춤)
     머리줄(× · 글쓰기 · 저장 · 등록) → 게시판 선택 → 제목 → 도구 줄 8개 → (서식 줄) → 본문 → 태그 · 본문 숨기기 -->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CommunityWrite } from '~/composables/write/useCommunityWrite'
import PostTypeFields from './PostTypeFields.vue'
import WriteBlockBar from './WriteBlockBar.vue'
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
  const b = dom.getBoundingClientRect()
  movePos.value = { top: b.bottom - a.top, right: a.right - b.right }
}
watch(() => [block.value?.pos, block.value?.name, block.value?.align, block.value?.divider, w.editor.version.value], () => nextTick(placeMoveTab))
let resize: ResizeObserver | null = null
onMounted(() => {
  resize = new ResizeObserver(() => placeMoveTab())
  if (editorBox.value) resize.observe(editorBox.value)
  window.addEventListener('resize', placeMoveTab)
})
onBeforeUnmount(() => { resize?.disconnect(); window.removeEventListener('resize', placeMoveTab) })
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
        <img :src="icon('icon-text-post-outline')" alt=""><span>{{ w.board.value || '게시판을 선택하세요' }}</span><img class="aw-caret" :src="icon('icon-caret-down-fill')" alt="">
      </button>
      <button class="aw-kind" type="button" aria-haspopup="dialog" :aria-label="`글 종류 ${w.postType.value.label}`" @click="w.tool.value = 'type'">{{ w.postType.value.label }}<img class="aw-caret" :src="icon('icon-caret-down-fill')" alt=""></button>
    </div>

    <label class="sr-only" for="awTitle">제목</label>
    <input id="awTitle" v-model="w.title.value" class="aw-title" maxlength="80" placeholder="제목을 입력해주세요" autocomplete="off">

    <WriteBlockBar v-if="block" :editor="w.editor" @edit-poll="editPoll" />
    <div v-else-if="inQuote" class="aw-tool-wrap"><WriteQuoteBar :editor="w.editor" /></div>
    <div v-else class="aw-tools" role="toolbar" aria-label="콘텐츠 도구" @mousedown="keep">
      <button type="button" aria-label="사진" @click="photoInput?.click()"><img :src="icon('icon-image-post-outline')" alt=""></button>
      <button type="button" aria-label="동영상" @click="videoInput?.click()"><img :src="icon('icon-video-post-outline')" alt=""></button>
      <button type="button" aria-label="텍스트 서식" :aria-expanded="textTools" :class="{ 'is-on': textTools }" @click="textTools = !textTools"><img :src="icon('icon-text-outline')" alt=""></button>
      <button type="button" aria-label="스티커" @click="w.tool.value = 'sticker'"><img :src="icon('icon-emoji-outline')" alt=""></button>
      <button type="button" aria-label="인용구" @click="w.editor.insertQuote(1)"><img :src="icon('icon-quote-outline')" alt=""></button>
      <button type="button" aria-label="구분선" @click="w.editor.insertDivider()"><img :src="icon('icon-subtract-outline')" alt=""></button>
      <button type="button" aria-label="링크" @click="w.tool.value = 'link'"><img :src="icon('icon-link-outline')" alt=""></button>
      <button type="button" aria-label="투표" @click="w.tool.value = 'poll'"><img :src="icon('icon-poll-post-outline')" alt=""></button>
    </div>
    <WriteFormatBar v-if="!block && (textTools || inQuote)" :editor="w.editor" @link="w.tool.value = 'link'" />

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
        <img :src="icon('icon-text-post-outline')" alt=""><span>본문 숨기기</span>
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

    <input ref="photoInput" class="sr-only" type="file" accept="image/*" multiple @change="w.addMedia(($event.target as HTMLInputElement).files, 'photo'); ($event.target as HTMLInputElement).value = ''">
    <input ref="videoInput" class="sr-only" type="file" accept="video/mp4,video/webm,video/quicktime" multiple @change="w.addMedia(($event.target as HTMLInputElement).files, 'video'); ($event.target as HTMLInputElement).value = ''">
  </main>
</template>
