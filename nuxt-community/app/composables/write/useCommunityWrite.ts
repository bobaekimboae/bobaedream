// 커뮤니티 글쓰기 공용 상태(치지직형 · 네이버 카페형 두 화면이 같은 기능을 쓰도록 한 곳에 둔다, 2026-11-05)
// 게시판 · 제목 · 본문 · 태그 · 본문 숨기기 · 글 종류 · 임시저장 · 등록. 화면 모양은 각 화면 컴포넌트가 맡는다.
import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import type { PollData } from './legacyLibs'
import { embedLib, loadWriteLibs } from './legacyLibs'
import { POST_TYPES, objectParticle, postTypeById, postTypeProblem, postTypeSummary } from './postTypes'
import { useAppEditor } from './useAppEditor'
import { useWriteMedia } from './useWriteMedia'
import { POST_KEY, bodyLines, boardGroups, parseTags, resolveReturnTo } from './writeUtils'
import { buildArticlePayload, pendingUploads, type Uploaded } from './bbmArticle'
import { BbmError, bbmBase, bbmToken, createArticle, fileOf, loadBoardGroups, saveArticleDraft, uploadMedia } from './bbmBackend'

/** 새 글쓰기 임시저장(예전 간결형 저장 키와 따로 둔다: 글 종류 · 정렬 · 인용구 모양이 더해져 모양이 다르다) */
export const APP_DRAFT_KEY = 'bbm.community.writeDraft.v2'

export type WriteStyle = 'chzzk' | 'naver'
export type ToolPage = '' | 'board' | 'sticker' | 'link' | 'poll' | 'type' | 'tags'

export function useCommunityWrite(bodyEl: Ref<HTMLElement | null>, style: WriteStyle) {
  const route = useRoute()
  const query = (name: string) => { const value = route.query[name]; return String((Array.isArray(value) ? value[0] : value) || '') }
  const returnTo = resolveReturnTo(query('returnTo'))
  const groups = ref(boardGroups(query('board')))
  /** 보배드림 서버 연결(?bbm=proxy). 켜져 있으면 게시판 · 등록 · 임시저장을 서버로 보낸다 */
  const backend = ref({ on: Boolean(bbmBase()), ready: false, error: '', busy: false, draftId: null as number | string | null })
  const boardCodes = new Map<string, string>()

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
  /** 치지직형: 동영상은 「동영상 업로드」 화면을 거친 뒤 넣고, 사진은 교체도 한다 */
  function takeFiles(files: FileList | File[] | null, kind: 'photo' | 'video') { return addFiles(files, kind) }
  function dropMedia(id: string) { removeMedia(id) }
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
    if (!silent && backend.value.on && bbmToken() && boardCodes.has(board.value) && !backend.value.busy) {
      backend.value.busy = true
      serverPayload(editor.html())
        .then(payload => saveArticleDraft(payload, backend.value.draftId))
        .then((id) => { backend.value.draftId = id; toast('보배드림 서버에 임시저장했어요.') })
        .catch((error) => { alertText.value = error instanceof Error ? error.message : '임시저장에 실패했습니다.' })
        .finally(() => { backend.value.busy = false })
      return true
    }
    if (!silent) toast('임시저장되었습니다.')
    return true
  }
  function exit() { navigateTo(returnTo) }

  /** 본문 사진 · 동영상 · 대표 이미지 · 투표 사진을 서버에 올리고 서버 주소로 바꾼 등록 값 */
  async function serverPayload(html: string) {
    const code = boardCodes.get(board.value)
    if (!code) throw new BbmError('게시판 목록에서 게시판을 다시 선택해주세요.', 0)
    const pending = pendingUploads(html)
    const uploaded = new Map<string, Uploaded>()
    if (pending.length) {
      const files = await Promise.all(pending.map((item, index) => fileOf(item.key, `${item.role}-${index + 1}`)))
      const result = await uploadMedia(files, pending.map(item => item.alt))
      pending.forEach((item, index) => { if (result[index]) uploaded.set(item.key, result[index]!) })
    }
    const summary = postType.value.id === 'normal' ? [] : [postType.value.label, ...postTypeSummary(postType.value, typeValues.value)]
    return buildArticlePayload({ html, title: title.value, boardCode: code, draftId: backend.value.draftId, summary }, uploaded)
  }
  async function submitToServer() {
    if (backend.value.busy) return
    if (!bbmToken()) { alertText.value = '보배드림에 로그인해야 글을 올릴 수 있어요.'; return }
    backend.value.busy = true
    toast('글을 올리고 있어요.')
    try {
      const payload = await serverPayload(editor.html())
      const res = await createArticle(payload)
      try { localStorage.removeItem(APP_DRAFT_KEY) } catch { /* 지울 게 없으면 넘어간다 */ }
      const id = res.data?.public_id
      confirmBox.value = { title: '게시물 등록 완료', message: id ? `보배드림 게시판에 올렸어요. (글 번호 ${id})` : '보배드림 게시판에 올렸어요.', ok: '확인', onOk: () => navigateTo(returnTo) }
    }
    catch (error) { alertText.value = error instanceof Error ? error.message : '게시글 등록에 실패했습니다.' }
    finally { backend.value.busy = false }
  }

  async function submit() {
    if (!title.value.trim()) { alertText.value = '제목을 입력해주세요.'; return }
    if (!board.value) { alertText.value = '게시판을 선택해주세요.'; return }
    const hasBody = editor.text() || photos.value.length || videos.value.length || editor.countNodes('writeEmbed') || editor.countNodes('editorPoll')
    if (!hasBody) { alertText.value = '내용을 입력해주세요.'; return }
    if (typeProblem.value) { triedSubmit.value = true; alertText.value = typeProblem.value; return }
    if (backend.value.on) { await submitToServer(); return }
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
  async function loadServerBoards() {
    try {
      const list = await loadBoardGroups()
      boardCodes.clear()
      list.forEach(group => group.boards.forEach(item => boardCodes.set(item.name, item.code)))
      const wanted = query('board')
      const byCode = list.flatMap(group => group.boards).find(item => item.code === wanted)
      if (byCode) board.value = byCode.name
      else if (board.value && !boardCodes.has(board.value)) board.value = ''
      groups.value = list.map(group => ({ section: group.name, items: group.boards.map(item => item.name) }))
      backend.value.ready = true
    }
    catch (error) { backend.value.error = error instanceof Error ? error.message : '게시판을 불러오지 못했어요.' }
  }

  async function start() {
    if (backend.value.on) { bbmToken(); void loadServerBoards() }
    try { await loadWriteLibs() } catch { /* 임베드 · 투표 카드만 간단히 보인다 */ }
    let draft: ReturnType<typeof snapshot> | null = null
    try { draft = JSON.parse(localStorage.getItem(APP_DRAFT_KEY) || 'null') } catch { draft = null }
    editor.create()
    paintPlaceholder()
    if (draft && (draft.title || draft.body)) {
      confirmBox.value = {
        title: '임시저장한 글이 있어요',
        message: `「${draft.title || '제목 없음'}」${objectParticle(draft.title || '제목 없음')} 이어서 쓸까요?`,
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
    style, returnTo, groups, backend, board, title, tags, tagDraft, hideBody, allowSearch,
    postTypeId, postType, typeValues, typeProblem, triedSubmit, setType, bodyLength,
    photos, videos, editor, tool, canPress,
    toastText, toastShown, toast, alertText, confirmBox,
    commitTags, addMedia, takeFiles, dropMedia, attachUrl, applyPoll, saveDraft, exit, submit, start,
  }
}

export type CommunityWrite = ReturnType<typeof useCommunityWrite>
