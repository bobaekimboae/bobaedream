// 상세 화면 데이터: 정적 chzzk-detail.js 의 글 찾기 · 화면 모드 결정을 TS로 옮긴 것 (2026-11-04)
// 데이터의 단일 원본은 public/community(scenario-data.js · data/board-*.js …)이며 전역 값을 받아 쓴다.
import type { BodyPart, DetailComment, DetailMode, EmbedItem, LatestItem, SourcePost } from './types'
import { communityUrl } from './legacyAssets'

type LegacyWindow = Window & {
  BOBAE_POSTS?: SourcePost[]
  BOBAE_AVATAR_FOR?: (name: string) => string
  BBM_BOARD_TABLE?: { allPosts: () => SourcePost[] }
  BBM_BOARD_TABLES?: Record<string, { displayName?: string }>
  BBM_DISCUSSION_MEDIA?: { photosFor: (post: SourcePost) => Array<{ src: string; ratio?: number }>; videoFor: (post: SourcePost) => string }
  BBM_EMBED?: {
    info: (url: string) => EmbedItem | null
    faviconFor: (url: string) => string
    fetchMeta: (url: string) => Promise<Partial<EmbedItem> | null>
  }
}

export const legacyWin = (): LegacyWindow => window as LegacyWindow

/** 정적 페이지가 <script>로 읽던 순서 그대로 (community-embed.js 가 board-tables.js 보다 먼저) */
export const DETAIL_SCRIPTS = [
  'scenario-data.js',
  'discussion-media.js',
  'data/board-best.js',
  'data/board-car-news.js',
  'data/board-foreign-car-news.js',
  'data/board-brand-car-info.js',
  'data/board-f1.js',
  'community-embed.js',
  'board-tables.js',
]

export async function loadDetailScripts(): Promise<void> {
  await Promise.allSettled(DETAIL_SCRIPTS.map(path => loadLegacyScript(path)))
}

export const DUKKAEBI_POSTS: SourcePost[] = [
  { id: 8325190, title: '특정 채널의 채팅 이용 제한 해제 관련 문의드립니다', user: '두깝이', category: '자유게시판', date: '14시간 전', view: 91, likes: -4 },
  {
    id: 8325181, title: '가입 인사드립니다. 잘 부탁드려요', user: '두깝이', level: 7, category: '자유게시판', date: '1일 전', view: 128, likes: 8,
    authorAvatar: 'assets/chzzk-detail/user-default-avatar.png', tags: ['가입인사', '첫글'],
    body: ['안녕하세요. 오늘 처음 가입해서 인사드립니다.', '치지직 방송과 게임 이야기를 좋아해서 커뮤니티 글도 자주 읽어보려고 합니다.', '아직 모르는 기능이 많지만 이용 규칙을 지키면서 천천히 활동하겠습니다.', '앞으로 잘 부탁드립니다.'],
    comments: [
      { id: '8325181-1', user: '초록라임', level: 5, avatar: 'assets/chzzk-detail/comment-avatar.gif', text: '반갑습니다. 편하게 활동하세요!', date: '22시간 전', like: 4, replies: [] },
      { id: '8325181-2', user: '익씽', level: 12, avatar: 'assets/chzzk-detail/comment-anonymous-avatar.png', text: '공지 한 번 읽고 시작하시면 금방 적응하실 거예요.', date: '20시간 전', like: 2, replies: [] },
    ],
  },
  {
    id: 8325147, title: '치지직 채팅 이용 규칙은 어디에서 확인하나요?', user: '두깝이', level: 7, category: '자유게시판', date: '2일 전', view: 204, likes: 5,
    authorAvatar: 'assets/chzzk-detail/user-default-avatar.png', tags: ['채팅', '이용규칙'],
    body: ['채널마다 채팅 규칙이 조금씩 다른 것 같아 정확한 확인 위치를 찾고 있습니다.', '치지직 공통 운영정책과 스트리머별 채널 규칙을 각각 어디에서 볼 수 있을까요?', '모바일 앱에서 확인하는 경로를 아시는 분은 알려주시면 감사하겠습니다.'],
    comments: [
      { id: '8325147-1', user: '규칙먼저', level: 9, avatar: 'assets/chzzk-detail/comment-anonymous-avatar.png', text: '채널 정보의 이용 안내와 치지직 운영정책을 같이 확인하시면 됩니다.', date: '2일 전', like: 7, replies: [{ id: '8325147-1-1', user: '두깝이', level: 7, avatar: 'assets/chzzk-detail/user-default-avatar.png', writer: true, text: '확인했습니다. 알려주셔서 감사합니다.', date: '2일 전', like: 2 }] },
    ],
  },
  {
    id: 8325093, title: '구독 알림이 조금 늦게 오는 것 같습니다', user: '두깝이', level: 7, category: '자유게시판', date: '3일 전', view: 176, likes: 3,
    authorAvatar: 'assets/chzzk-detail/user-default-avatar.png', tags: ['구독알림', '모바일'],
    body: ['구독 중인 채널이 방송을 시작한 뒤 알림이 몇 분 늦게 도착하는 경우가 있습니다.', '앱 알림과 휴대폰 알림 권한은 모두 켜둔 상태입니다.', '비슷한 증상을 해결하신 분이 있다면 설정 방법을 공유 부탁드립니다.'],
    comments: [
      { id: '8325093-1', user: '알림체크', level: 4, avatar: 'assets/chzzk-detail/comment-avatar.gif', text: '배터리 최적화에서 치지직 앱을 제외하니 저는 좋아졌습니다.', date: '3일 전', like: 6, replies: [] },
    ],
  },
]

const stripHeadword = (value: unknown) => String(value || '').replace(/^\[[^\]]+\]\s*/, '')

export function latestCommentCount(item: SourcePost): number {
  const explicitCount = Number(item?.reply)
  if (Number.isFinite(explicitCount)) return Math.max(0, explicitCount)
  // 정적 판: Number(undefined) → NaN 이면 댓글 배열로 센다
  return (item?.comments || []).reduce((total, comment) => total + 1 + (comment.replies || []).length, 0)
}

/** 글쓰기 저장본(localStorage bbm.community.latestPost.v2) → 상세 글 모양 */
export function loadLocalPost(isLocal: boolean, id: number): SourcePost | null {
  if (!isLocal) return null
  try {
    const saved = JSON.parse(localStorage.getItem('bbm.community.latestPost.v2') || 'null')
    const savedId = Date.parse(saved?.submittedAt || saved?.savedAt || '')
    if (!saved || !savedId || savedId !== id) return null
    const container = new DOMParser().parseFromString(`<div>${Array.isArray(saved.body) ? '' : (saved.body || '')}</div>`, 'text/html').body.firstChild as HTMLElement
    const lines: string[] = Array.isArray(saved.body)
      ? saved.body.map((value: unknown) => String(value).trim()).filter(Boolean)
      : (container.innerText || container.textContent || '').split(/\n+/).map(value => value.trim()).filter(Boolean)
    return {
      id: savedId, title: saved.title, user: '보배드림 회원', level: 1, date: '방금 전', view: 0, likes: 0,
      board: saved.board || '자유게시판', tags: saved.tags || '', body: lines.length ? lines : ['내용이 없습니다.'],
      html: saved.html || (Array.isArray(saved.embeds) && saved.embeds.length && typeof saved.body === 'string' ? saved.body : ''),
      embeds: Array.isArray(saved.embeds) ? saved.embeds : [], media: Array.isArray(saved.media) ? saved.media : [], hideBody: Boolean(saved.hideBody),
    }
  }
  catch { return null }
}

export type DetailModel = {
  id: number
  isNotice: boolean
  mode: DetailMode
  post: SourcePost
  title: string
  authorName: string
  authorLevel: string
  authorDate: string
  authorView: string
  likesBase: number
  boardLabel: string
  avatarSrc: string
  avatarAlt: string
  operatorBadge: boolean
  bodyParts: BodyPart[]
  tags: string[]
  tagsHidden: boolean
  latestAuthor: string
  latestItems: LatestItem[]
  /** 처음 댓글 영역: 'reference' 정적 HTML 댓글 · 'inquiry' 숨김 댓글 · 'items' commentItems 로 그림 */
  commentMode: 'reference' | 'inquiry' | 'items'
  commentItems: DetailComment[]
  initialCommentCount: number
  commentsDisabled: boolean
  bodyClasses: string[]
  documentTitle: string
  photoTarget: number
}

const REFERENCE_LATEST = (): LatestItem[] => [
  { text: '출첵!', comments: '5', hidden: false },
  { text: '출첵!', comments: '12', hidden: false },
  { text: '출첵!', comments: '8', hidden: false },
]

function safeClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value ?? null)) as T
}

function readStoredComments(id: number, source: SourcePost): DetailComment[] {
  try {
    return JSON.parse(localStorage.getItem(`bbm.community.comments.${id}`) || 'null') || safeClone(source.comments || [])
  }
  catch {
    return safeClone(source.comments || [])
  }
}

/** 정적 chzzk-detail.js 의 setRegularContent() + setNoticeMode() 를 데이터로 바꾼 것 */
export function buildDetailModel(query: Record<string, unknown>, routeId: string | undefined, localParts: (post: SourcePost) => BodyPart[]): DetailModel {
  const w = legacyWin()
  const q = (key: string) => {
    const value = query[key]
    return Array.isArray(value) ? String(value[0] ?? '') : value === undefined || value === null ? null : String(value)
  }
  const id = Number(routeId || q('id') || 8326278)
  const isNotice = q('type') === 'notice' || q('notice') === '1'
  const isLongNotice = id === 8303245
  const isUserInquiry = id === 8325190
  const posts = w.BOBAE_POSTS || []
  const boardTablePosts = w.BBM_BOARD_TABLE ? w.BBM_BOARD_TABLE.allPosts() : []
  const allPosts: SourcePost[] = [...posts, ...DUKKAEBI_POSTS, ...boardTablePosts]
  const localSourcePost = loadLocalPost(q('local') === '1', id)
  const sourcePost = localSourcePost || allPosts.find(item => item.id === id)
  const isReferencePost = !localSourcePost && (id === 8326278 || id === 8131629 || isLongNotice || isUserInquiry || !sourcePost)
  const post: SourcePost = isLongNotice
    ? { id, title: '[안내] 24시간 방송 추천 \'루프 스테이션\' 안내 (10/9~10/11)', user: '치지직', level: 27, date: '10.08', view: 11269, likes: 30, body: [] }
    : isUserInquiry
      ? { id, title: '특정 채널의 채팅 이용 제한 해제 관련 문의드립니다', user: '두깝이', level: 7, date: '14시간 전', view: 91, likes: -4, body: [] }
      : isReferencePost
        ? { id, title: '출첵!', user: '쿠로토라', level: 17, date: '7시간 전', view: 34, likes: 16, body: ['출첵!'] }
        : sourcePost as SourcePost

  const mode: DetailMode = isLongNotice ? 'longNotice' : isUserInquiry ? 'inquiry' : localSourcePost ? 'local' : !isReferencePost ? 'scenario' : 'reference'
  const recommendationCount = Number(post.likes ?? 16)
  const model: DetailModel = {
    id,
    isNotice,
    mode,
    post,
    title: isLongNotice ? String(post.title) : String(post.title || '출첵!').replace(/^\[[^\]]+\]\s*/, ''),
    authorName: post.user || '쿠로토라',
    authorLevel: String(post.level || 17),
    authorDate: String(post.time || post.date || '7시간 전'),
    authorView: Number(post.view ?? 34).toLocaleString(),
    likesBase: recommendationCount,
    boardLabel: '자유게시판',
    avatarSrc: communityUrl('assets/chzzk-detail/author-avatar.png'),
    avatarAlt: '작성자 프로필',
    operatorBadge: false,
    bodyParts: [],
    tags: ['출첵', '출석체크'],
    tagsHidden: false,
    latestAuthor: post.user || '쿠로토라',
    latestItems: REFERENCE_LATEST(),
    commentMode: 'reference',
    commentItems: [],
    initialCommentCount: localSourcePost ? 0 : 2,
    commentsDisabled: false,
    bodyClasses: [],
    documentTitle: '',
    photoTarget: 0,
  }

  if (mode === 'longNotice') {
    model.bodyClasses.push('isLongNotice')
    model.boardLabel = '공지사항'
    model.avatarSrc = communityUrl('assets/chzzk-detail/chzzk-operator-avatar.png')
    model.avatarAlt = '치지직 운영자 프로필'
    model.operatorBadge = true
    model.latestItems[0]!.text = '[수정완료] 일부 라이브에서 채팅이 작동하지 않는 오류 발생 안내'
    model.latestItems[1]!.text = '[월즈 2026] LoL 한정판 시청 드롭스 안내'
    model.latestItems[2]!.text = '[24H LIVE] JTBC 채널 일시 중지 안내 (10/13)'
    model.commentsDisabled = true
  }
  else if (mode === 'inquiry') {
    model.bodyClasses.push('isUserInquiry')
    model.avatarSrc = communityUrl(w.BOBAE_AVATAR_FOR?.('두깝이') || 'assets/rank-avatars/minimal/avatar-01.png')
    model.avatarAlt = '두깝이 프로필'
    model.tagsHidden = true
    model.latestAuthor = '두깝이'
    DUKKAEBI_POSTS.filter(item => item.id !== id).forEach((next, index) => {
      const item = model.latestItems[index]
      if (!item) return
      item.text = String(next.title)
      item.postId = next.id
      item.comments = String(latestCommentCount(next))
      item.hidden = false
    })
    model.commentMode = 'inquiry'
  }
  else if (mode === 'scenario') {
    model.bodyClasses.push('isScenarioPost')
    model.boardLabel = post.boardTable ? (w.BBM_BOARD_TABLES?.[String(post.board)]?.displayName || String(post.category)) : (post.category || '자유게시판')
    if (post.authorAvatar) {
      model.avatarSrc = communityUrl(post.authorAvatar)
      model.avatarAlt = `${post.user || '회원'} 프로필`
    }
    model.bodyParts = scenarioParts(post, q('from') === 'discussion')
    model.photoTarget = Number(q('photo')) || 0
    const tags = ((post.tags as string[] | undefined) || [post.category]).filter(Boolean).slice(0, 10) as string[]
    model.tags = tags
    model.tagsHidden = tags.length === 0
    model.commentMode = 'items'
    model.commentItems = readStoredComments(id, post)
    const related = allPosts.filter(item => item.id !== post.id && (item.user === post.user || item.category === post.category)).slice(0, 3)
    model.latestItems = model.latestItems.map((item, index) => {
      const next = related[index]
      return next
        ? { text: stripHeadword(next.title), postId: next.id, comments: String(latestCommentCount(next)), hidden: false }
        : { ...item, postId: undefined, comments: '', hidden: true }
    })
  }
  if (localSourcePost) {
    model.boardLabel = String(post.board).replace('게시판', '').trim()
    model.bodyParts = localParts(post)
    const tags = String(post.tags || '').split('#').map(value => value.trim()).filter(Boolean).slice(0, 10)
    model.tags = tags
    model.tagsHidden = tags.length === 0
    model.commentMode = 'items'
    model.commentItems = []
  }
  model.documentTitle = `${model.title} | 보배드림 커뮤니티`

  if (isNotice) {
    model.bodyClasses.push('isNotice')
    model.latestAuthor = '치지직'
    model.latestItems[0]!.text = '[수정완료] 일부 라이브에서 채팅이 작동하지 않는 오류 안내'
    model.latestItems[1]!.text = '[월즈 2026] LoL 한정판 시청 드롭스 안내'
    model.latestItems[2]!.text = '[24H LIVE] JTBC 채널 일시 중지 안내 (10/13)'
    model.commentsDisabled = true
    model.documentTitle = '공지사항 | 보배드림 커뮤니티'
  }
  return model
}

function scenarioParts(post: SourcePost, fromDiscussionParam: boolean): BodyPart[] {
  const w = legacyWin()
  const parts: BodyPart[] = []
  const paragraphs = post.body && post.body.length ? post.body : ['좋은 정보 함께 나눠요.']
  const detailImage = post.detailImage || String(post.thumbnail || '').replace(/([?&])w=\d+/, '$1w=960')
  const fromDiscussion = fromDiscussionParam && w.BBM_DISCUSSION_MEDIA
  const discussionPhotos = fromDiscussion ? w.BBM_DISCUSSION_MEDIA!.photosFor(post) : []
  const discussionVideo = fromDiscussion ? w.BBM_DISCUSSION_MEDIA!.videoFor(post) : ''
  if (post.boardTable && Array.isArray(post.summary3) && post.summary3.length) parts.push({ kind: 'summary3', text: post.summary3.join(' ') })
  if (fromDiscussion) {
    discussionPhotos.forEach((photo, index) => {
      if (index === 0 && discussionVideo) parts.push({ kind: 'video', src: communityUrl(discussionVideo), poster: communityUrl(photo.src), elId: `detailPhoto${index + 1}`, ratio: photo.ratio || undefined })
      else parts.push({ kind: 'photo', src: communityUrl(photo.src), alt: `${post.title} 사진 ${index + 1}`, discussion: true, elId: `detailPhoto${index + 1}`, ratio: photo.ratio || undefined, eager: index < 2, lazyAttr: true })
    })
  }
  else if (post.boardTable && post.images && post.images.length) {
    post.images.forEach((src, index) => parts.push({ kind: 'photo', src: communityUrl(src), alt: `${post.title} 사진 ${index + 1}`, discussion: true, eager: index < 2, lazyAttr: true }))
  }
  else if (detailImage) {
    parts.push({ kind: 'photo', src: communityUrl(detailImage), alt: String(post.title), discussion: false, eager: true, lazyAttr: false })
  }
  if (post.boardTable && Array.isArray(post.embeds) && w.BBM_EMBED) {
    post.embeds.forEach((item) => {
      parts.push({ kind: 'embed', mode: 'block', item: (item.title || item.render === 'iframe') ? item : { ...item, title: stripHeadword(post.title) } })
    })
  }
  if (post.boardTable && post.poll) parts.push({ kind: 'poll', poll: post.poll, pollId: `board-${post.id}` })
  parts.push({ kind: 'copy', lines: paragraphs.map(paragraph => ({ tag: 'p' as const, html: escapeHtml(paragraph) })) })
  if (post.boardTable && (post.source || post.sourceUrl)) parts.push({ kind: 'source', source: String(post.source || ''), url: post.sourceUrl && /^https?:\/\//.test(post.sourceUrl) ? post.sourceUrl : '' })
  return parts
}

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[character] as string))
}
