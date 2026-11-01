<script setup lang="ts">
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { createCommunityApi } from '~/services/communityApi'
import type { CommunityAttachment, CommunityDraft } from '~/types/community'

const router = useRouter()
const runtimeConfig = useRuntimeConfig()
const { sections, boards, boardId } = useCommunity()
const iconRoot = `${runtimeConfig.app.baseURL}icons/write`
const draftStorageKey = 'bbm.nuxt-community.write-draft.v1'

const title = ref('')
const tags = ref<string[]>([])
const hideBody = ref(false)
const boardSheetOpen = ref(false)
const auxiliarySheet = ref<'none' | 'tags' | 'emoji' | 'link' | 'poll' | 'exit'>('none')
const textToolsOpen = ref(false)
const attachments = ref<CommunityAttachment[]>([])
const tagInput = ref('')
const linkInput = ref('')
const pollQuestion = ref('')
const pollOptions = ref(['', ''])
const toast = ref('')
const publishing = ref(false)
const dirty = ref(false)
const photoInput = ref<HTMLInputElement>()
const videoInput = ref<HTMLInputElement>()
let toastTimer: ReturnType<typeof setTimeout> | undefined
let autosaveTimer: ReturnType<typeof setTimeout> | undefined

const editor = shallowRef<Editor>()
const activeBoard = computed(() => boards.value.find(board => board.id === boardId.value) || boards.value[0]!)
const editorText = ref('')
const canSubmit = computed(() => Boolean(activeBoard.value?.id && title.value.trim() && (editorText.value || attachments.value.length)))

const emojis = ['😀', '😂', '😍', '👍', '🔥', '🎉', '🚗', '🏍️', '🛠️', '⚡', '💯', '🙏']

function notify(message: string) {
  toast.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 1700)
}

function scheduleAutosave() {
  dirty.value = true
  clearTimeout(autosaveTimer)
  autosaveTimer = setTimeout(() => saveDraft(false), 900)
}

function draftPayload(): CommunityDraft {
  return {
    id: 'current',
    boardId: activeBoard.value.id,
    title: title.value.trim(),
    html: editor.value?.getHTML() || '',
    text: editor.value?.getText() || '',
    tags: tags.value,
    hideBody: hideBody.value,
    updatedAt: new Date().toISOString(),
  }
}

function saveDraft(showMessage = true) {
  localStorage.setItem(draftStorageKey, JSON.stringify(draftPayload()))
  dirty.value = false
  if (showMessage) notify('임시 저장했습니다.')
}

function loadDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(draftStorageKey) || 'null') as CommunityDraft | null
    if (!draft) return
    if (draft.boardId && boards.value.some(board => board.id === draft.boardId)) boardId.value = draft.boardId
    title.value = draft.title || ''
    tags.value = Array.isArray(draft.tags) ? draft.tags.slice(0, 10) : []
    hideBody.value = Boolean(draft.hideBody)
    editor.value?.commands.setContent(draft.html || '')
    editorText.value = editor.value?.getText().trim() || ''
    if (draft.title || draft.text) notify('임시 저장한 글을 불러왔습니다.')
  } catch {
    localStorage.removeItem(draftStorageKey)
  }
}

function chooseBoard(id: string) {
  boardId.value = id
  boardSheetOpen.value = false
  scheduleAutosave()
}

function openSheet(kind: Exclude<typeof auxiliarySheet.value, 'none'>) {
  auxiliarySheet.value = kind
  if (kind === 'tags') tagInput.value = tags.value.map(tag => `#${tag}`).join(' ')
}

function closeAuxiliarySheet() {
  auxiliarySheet.value = 'none'
}

function applyTags() {
  tags.value = [...new Set(tagInput.value.split('#').map(value => value.trim().replace(/\s+/g, '')).filter(Boolean))].slice(0, 10)
  closeAuxiliarySheet()
  scheduleAutosave()
}

function applyLink() {
  try {
    const url = new URL(linkInput.value)
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('protocol')
    editor.value?.chain().focus().setLink({ href: url.href, target: '_blank' }).insertContent(url.hostname).run()
    linkInput.value = ''
    closeAuxiliarySheet()
  } catch {
    notify('올바른 웹 주소를 입력해주세요.')
  }
}

function insertEmoji(value: string) {
  editor.value?.chain().focus().insertContent(value).run()
  closeAuxiliarySheet()
}

function addPollOption() {
  if (pollOptions.value.length >= 10) return notify('선택지는 최대 10개입니다.')
  pollOptions.value.push('')
}

function insertPoll() {
  const options = pollOptions.value.map(value => value.trim()).filter(Boolean)
  if (!pollQuestion.value.trim() || options.length < 2) return notify('질문과 선택지 2개 이상을 입력해주세요.')
  const safeQuestion = pollQuestion.value.replace(/[<>]/g, '')
  const safeOptions = options.map(value => value.replace(/[<>]/g, ''))
  editor.value?.chain().focus().insertContent(`<div data-community-poll="true"><strong>${safeQuestion}</strong><ol>${safeOptions.map(value => `<li>${value}</li>`).join('')}</ol></div><p></p>`).run()
  pollQuestion.value = ''
  pollOptions.value = ['', '']
  closeAuxiliarySheet()
}

function addFiles(list: FileList | null, kind: 'image' | 'video') {
  if (!list?.length) return
  const limit = kind === 'image' ? 15 * 1024 * 1024 : 300 * 1024 * 1024
  const accepted = [...list].filter(file => file.size <= limit).slice(0, Math.max(0, 20 - attachments.value.length))
  for (const file of accepted) {
    attachments.value.push({ id: crypto.randomUUID(), kind, name: file.name, size: file.size, mime: file.type, previewUrl: URL.createObjectURL(file) })
  }
  if (accepted.length !== list.length) notify(kind === 'image' ? '이미지는 15MB 이하, 최대 20개입니다.' : '영상은 300MB 이하만 첨부할 수 있습니다.')
  scheduleAutosave()
}

function removeAttachment(id: string) {
  const item = attachments.value.find(attachment => attachment.id === id)
  if (item) URL.revokeObjectURL(item.previewUrl)
  attachments.value = attachments.value.filter(attachment => attachment.id !== id)
  scheduleAutosave()
}

async function publish() {
  if (!canSubmit.value || publishing.value) return
  publishing.value = true
  try {
    const api = createCommunityApi(String(runtimeConfig.public.communityApiBase || ''))
    const result = await api.publish({
      boardId: activeBoard.value.id,
      title: title.value.trim(),
      html: editor.value?.getHTML() || '',
      text: editor.value?.getText().trim() || '',
      tags: tags.value,
      hideBody: hideBody.value,
      attachmentIds: attachments.value.map(attachment => attachment.id),
    }, crypto.randomUUID())
    localStorage.removeItem(draftStorageKey)
    dirty.value = false
    await router.push({ path: `/posts/${result.id}`, query: { published: '1' } })
  } catch {
    notify('등록하지 못했습니다. 연결 상태를 확인해주세요.')
  } finally {
    publishing.value = false
  }
}

function requestExit() {
  if (!dirty.value && !title.value && !editorText.value) return router.push('/')
  openSheet('exit')
}

function confirmExit() {
  dirty.value = false
  closeAuxiliarySheet()
  router.push('/')
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!dirty.value) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => {
  editor.value = new Editor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: false,
      }),
      Link.configure({ openOnClick: false, autolink: true, protocols: ['http', 'https'] }),
      Placeholder.configure({ placeholder: '함께 나누고 싶은 얘기를 남겨주세요.' }),
    ],
    content: '',
    onUpdate: ({ editor: instance }) => {
      editorText.value = instance.getText().trim()
      scheduleAutosave()
    },
  })
  loadDraft()
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  editor.value?.destroy()
  attachments.value.forEach(attachment => URL.revokeObjectURL(attachment.previewUrl))
  clearTimeout(autosaveTimer)
  clearTimeout(toastTimer)
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

watch([title, hideBody], scheduleAutosave)
useHead({ title: '글쓰기 | 보배드림 커뮤니티' })
</script>

<template>
  <main class="write-page">
    <header class="write-header">
      <button type="button" class="write-close" aria-label="닫기" @click="requestExit">×</button>
      <h1>글쓰기</h1>
      <div class="write-header-actions"><button type="button" @click="saveDraft(true)">저장</button><button type="button" :disabled="!canSubmit || publishing" @click="publish">{{ publishing ? '등록 중' : '등록' }}</button></div>
    </header>

    <button type="button" class="write-board-button" @click="boardSheetOpen = true">
      <img :src="`${iconRoot}/community.svg`" alt="" /><strong>{{ activeBoard.name }}</strong><img :src="`${iconRoot}/chevron-down.svg`" alt="" />
    </button>

    <input v-model="title" class="write-title-input" maxlength="80" placeholder="제목을 입력해주세요" autocomplete="off" aria-label="제목" />

    <div class="write-toolbar" role="toolbar" aria-label="본문 도구">
      <button type="button" aria-label="사진" @click="photoInput?.click()"><img :src="`${iconRoot}/photo.svg`" alt="" /></button>
      <button type="button" aria-label="영상" @click="videoInput?.click()"><img :src="`${iconRoot}/video.svg`" alt="" /></button>
      <button type="button" aria-label="텍스트 서식" :class="{ 'is-active': textToolsOpen }" @click="textToolsOpen = !textToolsOpen"><img :src="`${iconRoot}/text.svg`" alt="" /></button>
      <button type="button" aria-label="이모지" @click="openSheet('emoji')"><img :src="`${iconRoot}/sticker.svg`" alt="" /></button>
      <button type="button" aria-label="인용구" @click="editor?.chain().focus().toggleBlockquote().run()"><img :src="`${iconRoot}/quote.svg`" alt="" /></button>
      <button type="button" aria-label="구분선" @click="editor?.chain().focus().setHorizontalRule().run()"><span class="toolbar-rule" /></button>
      <button type="button" aria-label="링크" @click="openSheet('link')"><img :src="`${iconRoot}/link.svg`" alt="" /></button>
      <button type="button" aria-label="투표" @click="openSheet('poll')"><img :src="`${iconRoot}/table.svg`" alt="" /></button>
    </div>

    <Transition name="tool-slide">
      <div v-if="textToolsOpen" class="text-toolbar" role="toolbar" aria-label="텍스트 서식">
        <button type="button" :class="{ 'is-active': editor?.isActive('heading', { level: 2 }) }" @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()">제목</button>
        <button type="button" :class="{ 'is-active': editor?.isActive('bold') }" @click="editor?.chain().focus().toggleBold().run()"><b>B</b></button>
        <button type="button" :class="{ 'is-active': editor?.isActive('italic') }" @click="editor?.chain().focus().toggleItalic().run()"><i>I</i></button>
        <button type="button" :class="{ 'is-active': editor?.isActive('bulletList') }" @click="editor?.chain().focus().toggleBulletList().run()">목록</button>
        <button type="button" @click="editor?.chain().focus().undo().run()">실행취소</button>
      </div>
    </Transition>

    <section class="write-editor" aria-label="본문 입력">
      <EditorContent v-if="editor" :editor="editor" />
      <div v-if="attachments.length" class="attachment-grid">
        <figure v-for="attachment in attachments" :key="attachment.id">
          <img v-if="attachment.kind === 'image'" :src="attachment.previewUrl" :alt="attachment.name" />
          <video v-else :src="attachment.previewUrl" controls playsinline />
          <figcaption><span>{{ attachment.name }}</span><button type="button" aria-label="첨부 삭제" @click="removeAttachment(attachment.id)">×</button></figcaption>
        </figure>
      </div>
    </section>

    <button type="button" class="write-tag-row" @click="openSheet('tags')"><span>#</span><strong>{{ tags.length ? tags.map(tag => `#${tag}`).join(' ') : '#태그 입력 (#으로 구분, 최대 10개)' }}</strong></button>
    <label class="write-hide-row"><img :src="`${iconRoot}/community.svg`" alt="" /><span>본문 숨기기</span><input v-model="hideBody" type="checkbox" /><i /></label>

    <input ref="photoInput" type="file" accept="image/*" multiple hidden @change="addFiles(($event.target as HTMLInputElement).files, 'image')" />
    <input ref="videoInput" type="file" accept="video/mp4,video/webm,video/quicktime" multiple hidden @change="addFiles(($event.target as HTMLInputElement).files, 'video')" />

    <BoardSelectSheet :open="boardSheetOpen" :sections="sections" :selected-id="activeBoard.id" @close="boardSheetOpen = false" @select="chooseBoard" />

    <Teleport to="body">
      <Transition name="sheet-fade">
        <div v-if="auxiliarySheet !== 'none'" class="sheet-backdrop sheet-backdrop--solid" @click.self="closeAuxiliarySheet">
          <section class="write-aux-sheet" role="dialog" aria-modal="true">
            <header><h2>{{ auxiliarySheet === 'tags' ? '태그 입력' : auxiliarySheet === 'emoji' ? '이모지' : auxiliarySheet === 'link' ? '링크 추가' : auxiliarySheet === 'poll' ? '투표' : '작성 취소' }}</h2><button type="button" aria-label="닫기" @click="closeAuxiliarySheet">×</button></header>
            <div v-if="auxiliarySheet === 'tags'" class="aux-form"><input v-model="tagInput" maxlength="120" placeholder="#으로 구분, 최대 10개" /><p>예: #국산차 #정비 #드라이브</p><button type="button" @click="applyTags">적용</button></div>
            <div v-else-if="auxiliarySheet === 'emoji'" class="emoji-picker"><button v-for="emoji in emojis" :key="emoji" type="button" @click="insertEmoji(emoji)">{{ emoji }}</button></div>
            <div v-else-if="auxiliarySheet === 'link'" class="aux-form"><input v-model="linkInput" inputmode="url" placeholder="https://" /><p>http:// 또는 https:// 주소만 추가할 수 있습니다.</p><button type="button" @click="applyLink">추가</button></div>
            <div v-else-if="auxiliarySheet === 'poll'" class="aux-form"><input v-model="pollQuestion" maxlength="80" placeholder="투표 질문" /><div class="poll-option-fields"><input v-for="(_, index) in pollOptions" :key="index" v-model="pollOptions[index]" maxlength="60" :placeholder="`선택지 ${index + 1}`" /></div><button type="button" class="secondary" @click="addPollOption">+ 선택지 추가</button><button type="button" @click="insertPoll">본문에 넣기</button></div>
            <div v-else class="exit-confirm"><p>작성 중인 내용이 있습니다.<br />글쓰기를 종료할까요?</p><button type="button" @click="saveDraft(true); closeAuxiliarySheet()">임시 저장</button><button type="button" class="danger" @click="confirmExit">저장하지 않고 나가기</button></div>
          </section>
        </div>
      </Transition>
    </Teleport>

    <Transition name="toast"><p v-if="toast" class="community-toast" role="status">{{ toast }}</p></Transition>
  </main>
</template>
