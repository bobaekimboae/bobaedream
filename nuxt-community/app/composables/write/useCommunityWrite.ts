// 커뮤니티 글쓰기 공용 상태(치지직형 · 네이버 카페형 두 화면이 같은 기능을 쓰도록 한 곳에 둔다, 2026-11-05)
// 게시판 · 제목 · 본문 · 태그 · 본문 숨기기 · 글 종류 · 임시저장 · 등록. 화면 모양은 각 화면 컴포넌트가 맡는다.
import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import type { PollData } from './legacyLibs'
import { embedLib, loadWriteLibs } from './legacyLibs'
import { POST_TYPES, postTypeById, postTypeProblem, postTypeSummary } from './postTypes'
import { useAppEditor } from './useAppEditor'
import { useWriteMedia } from './useWriteMedia'
import { POST_KEY, bodyLines, boardGroups, parseTags, resolveReturnTo } from './writeUtils'

/** 새 글쓰기 임시저장(예전 간결형 저장 키와 따로 둔다: 글 종류 · 정렬 · 인용구 모양이 더해져 모양이 다르다) */
export const APP_DRAFT_KEY = 'bbm.community.writeDraft.v2'

export type WriteStyle = 'chzzk' | 'naver'
export type ToolPage = '' | 'board' | 'sticker' | 'link' | 'poll' | 'type' | 'tags'

export function useCommunityWrite(bodyEl: Ref<HTMLElement | null>, style: WriteStyle) {
  const route = useRoute()
  const query = (name: string) => { const value = route.query[name]; return String((Array.isArray(value) ? value[0] : value) || '') }
  const returnTo = resolveReturnTo(query('returnTo'))
  const groups = boardGroups(query('board'))

  /* ---------- 알림 · 안내 창 ---------- */
  const toastText = ref('')
  const toastShown = ref(false)
  let toastTimer = 0
  function toast(message: string) {
    toastText.value = message
    toastShown.value = true
    window.clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => { toastShown.value = false }, 1800)
  }
  /** 치지직 앱의 가운데 안내 창(「제목을 입력해주세요.」 + 확인) */
  const alertText = ref('')
  const confirmBox = ref<{ title: string, message: string, ok: string, onOk: () => void } | null>(null)

  /* ---------- 글 ---------- */
  const board = ref(query('board'))
  const title = ref('')
  const tags = ref<string[]>([])
  const tagDraft = ref('')
  const hideBody = ref(false)
  const allowSearch = ref(true)
  const postTypeId = ref(POST_TYPES.some(type => type.id === query('type')) ? query('type') : 'normal')
  const typeValues = ref<Record<string, unknown>>({})
  const postType = computed(() => postTypeById(postTypeId.value))

  const { photos, videos, addFiles, removeMedia, revokeAll } = useWriteMedia(toast)
  const tool = ref<ToolPage>('')

  const editor = useAppEditor(bodyEl, {
    placeholder: () => (postType.value.id === 'normal' && style === 'naver' ? '내용을 입력하세요.' : postType.value.placeholder),
    onRemoveMedia: id => removeMedia(id),
    onEditPoll: () => { tool.value = 'poll' },
    onRemovePoll: () => toast('투표를 삭제했습니다.'),
    compactBlocks: style === 'chzzk',
    pollIcon: communityAsset('assets/reddit-write/icon-poll-post-outline.svg'),
  })

  const bodyLength = computed(() => { void editor.version.value; return editor.text().replace(/\s/g, '').length })
  const triedSubmit = ref(false)
  const typeProblem = computed(() => postTypeProblem(postType.value, typeValues.value, { bodyLength: bodyLength.value, photos: photos.value.length }))
  /** 치지직 앱: 제목이 있으면 등록 버튼이 보라색으로 켜진다(게시판 · 본문은 누를 때 확인) */
  const canPress = computed(() => Boolean(title.value.trim()))

  /** 본문 안내 문구는 글 종류마다 달라서 편집기 상자의 CSS 변수(--aw-ph)로 넘긴다 */
  function paintPlaceholder() {
    const dom = editor.editor.value?.view.dom as HTMLElement | undefined
    const text = postType.value.id === 'normal' && style === 'naver' ? '내용을 입력하세요.' : postType.value.placeholder
    dom?.style.setProperty('--aw-ph', JSON.stringify(text))
  }
  function setType(id: string) {
    if (id === postTypeId.value) { tool.value = ''; return }
    postTypeId.value = id
    typeValues.value = {}
    triedSubmit.value = false
    tool.value = ''
    paintPlaceholder()
    toast(`${postTypeById(id).label} 글로 바꿨어요.`)
  }

  /* ---------- 태그 ---------- */
  function commitTags(raw = tagDraft.value) {
    tags.value = parseTags(raw)
    tagDraft.value = tags.value.map(tag => `#${tag}`).join(' ')
  }

  /* ---------- 첨부 ---------- */
  function addMedia(files: FileList | null, kind: 'photo' | 'video') {
    const added = addFiles(files, kind)
    added.forEach(item => editor.insertMedia(item))
  }
  function attachUrl(href: string): boolean {
    const lib = embedLib()
    const raw = (lib?.fromCode ? lib.fromCode(href) : href).trim()
    let parsed: URL
    try { parsed = new URL(raw) } catch { return false }
    if (!['http:', 'https:'].includes(parsed.protocol)) return false
    const item = lib?.info(parsed.href)
    if (item) {
      if (item.render === 'preview') item.title = '미리보기를 불러오는 중…'
      editor.insertEmbed(item)
    }
    else editor.setLink(parsed.href)
    return true
  }
  function applyPoll(poll: PollData) { editor.applyPoll(poll); tool.value = '' }

  /* ---------- 임시저장 · 나가기 · 등록 ---------- */
  function snapshot() {
    return { board: board.value, title: title.value, body: editor.html(), tags: tags.value, hideBody: hideBody.value, allowSearch: allowSearch.value, type: postTypeId.value, values: typeValues.value, savedAt: new Date().toISOString() }
  }
  function saveDraft(silent = false) {
    if (!title.value.trim()) { if (!silent) alertText.value = '제목을 입력해주세요.'; return false }
    try { localStorage.setItem(APP_DRAFT_KEY, JSON.stringify(snapshot())) } catch { /* 저장소를 못 쓰면 넘어간다 */ }
    if (!silent) toast('임시저장되었습니다.')
    return true
  }
  function exit() { navigateTo(returnTo) }

  async function submit() {
    if (!title.value.trim()) { alertText.value = '제목을 입력해주세요.'; return }
    if (!board.value) { alertText.value = '게시판을 선택해주세요.'; return }
    const hasBody = editor.text() || photos.value.length || videos.value.length || editor.countNodes('writeEmbed') || editor.countNodes('editorPoll')
    if (!hasBody) { alertText.value = '내용을 입력해주세요.'; return }
    if (typeProblem.value) { triedSubmit.value = true; alertText.value = typeProblem.value; return }
    const list = [...photos.value, ...videos.value]
    const stored = await Promise.all(list.map(item => item.saved || Promise.resolve(false)))
    const html = editor.html()
    try {
      localStorage.setItem(POST_KEY, JSON.stringify({
        status: 'LOCAL_PREVIEW', source: `community-write-${style}`, board: board.value, head: postType.value.id === 'normal' ? '' : postType.value.label,
        title: title.value.trim(), body: bodyLines(html), html, embeds: editor.collectEmbeds(),
        media: list.filter((_item, index) => stored[index]).map(item => ({ id: item.id, kind: item.kind === 'photo' ? 'image' : 'video', name: item.name })),
        tags: tags.value.map(tag => `#${tag}`).join(' '), photos: photos.value.map(({ id, name }) => ({ id, name })), videos: videos.value.map(({ id, name }) => ({ id, name })),
        hideBody: hideBody.value, allowSearch: allowSearch.value,
        postType: postType.value.id, postTypeLabel: postType.value.label, postTypeValues: typeValues.value, postTypeSummary: postTypeSummary(postType.value, typeValues.value),
        submittedAt: new Date().toISOString(),
      }))
      localStorage.removeItem(APP_DRAFT_KEY)
    }
    catch { /* 미리보기 저장 실패 */ }
    confirmBox.value = { title: '게시물 등록 완료', message: '게시판에서 등록한 글을 확인할 수 있습니다.', ok: '확인', onOk: () => navigateTo(returnTo) }
  }

  /* ---------- 시작 · 끝 ---------- */
  async function start() {
    try { await loadWriteLibs() } catch { /* 임베드 · 투표 카드만 간단히 보인다 */ }
    let draft: ReturnType<typeof snapshot> | null = null
    try { draft = JSON.parse(localStorage.getItem(APP_DRAFT_KEY) || 'null') } catch { draft = null }
    editor.create()
    paintPlaceholder()
    if (draft && (draft.title || draft.body)) {
      confirmBox.value = {
        title: '임시저장한 글이 있어요',
        message: `「${draft.title || '제목 없음'}」을(를) 이어서 쓸까요?`,
        ok: '이어 쓰기',
        onOk: () => {
          if (!draft) return
          board.value = board.value || draft.board || ''
          title.value = draft.title || ''
          tags.value = Array.isArray(draft.tags) ? draft.tags : []
          tagDraft.value = tags.value.map(tag => `#${tag}`).join(' ')
          hideBody.value = Boolean(draft.hideBody)
          allowSearch.value = draft.allowSearch !== false
          if (POST_TYPES.some(type => type.id === draft.type)) postTypeId.value = draft.type
          typeValues.value = draft.values || {}
          paintPlaceholder()
          editor.setHtml(draft.body || '')
        },
      }
    }
  }
  function stop() {
    window.clearTimeout(toastTimer)
    editor.destroy()
    revokeAll()
  }
  onBeforeUnmount(stop)

  watch(tool, (value) => { document.body.style.overflow = value ? 'hidden' : '' })

  return {
    style, returnTo, groups, board, title, tags, tagDraft, hideBody, allowSearch,
    postTypeId, postType, typeValues, typeProblem, triedSubmit, setType, bodyLength,
    photos, videos, editor, tool, canPress,
    toastText, toastShown, toast, alertText, confirmBox,
    commitTags, addMedia, attachUrl, applyPoll, saveDraft, exit, submit, start,
  }
}

export type CommunityWrite = ReturnType<typeof useCommunityWrite>
