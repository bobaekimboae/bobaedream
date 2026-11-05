// PC 커뮤니티(정적 bobaedream-pc-board-*.html + bobaedream-pc-interactions.js) 이식 — 순수 로직 (2026-11-04)
// 정적 판 규칙(게시판 이름 · 섹션 · 정렬 · 검색 · 공지 · 대체 글)을 그대로 옮긴다. Nuxt에 기대지 않아 단위 시험으로 확인한다.

/** [분류, 제목, 작성자, 시간, 조회, 추천, 댓글, 본문?, 글ID?, 게시판?, 공지?] */
export type PcPost = [string, string, string, string, number | string, number | string, number | string, string?, string?, string?, boolean?]
export type PcPopular = [string, number]
export type Params = Record<string, string | null | undefined>

export const STORE_POSTS = 'bobaePcDemoPosts'
export const STORE_LOGIN = 'bobaePcDemoLoggedIn'
export const STORE_BOARD = 'bobaePcCurrentBoard'

export const boardNotices: PcPost[] = [
  ['공지', '보배드림 커뮤니티 이용 수칙 및 게시판 운영 안내', '보배드림 운영팀', '10.24', '1,384', 12, 4, '', 'notice-guide', '공지', true],
  ['공지', '자동차 매물·거래 사칭 피해 예방 안내', '보배드림 운영팀', '10.23', '2,601', 8, 7, '', 'notice-safe-trade', '공지', true],
  ['공지', '개인정보 노출 및 게시물 신고 기준 안내', '보배드림 운영팀', '10.21', '3,872', 6, 11, '', 'notice-privacy', '공지', true],
]

export const boardNames = ['전체 게시글', '국산차 오너톡', '수입차 라운지', '전기차 충전소', 'SUV 패밀리카', '화물·특장', '중고차 문의', '정비 상담', '튜닝 인증', '보험·사고', '블랙박스 제보', '공지', '자유', '질문', '시승기', '출석체크', '국산차', '수입차', '전기차', '정비', '블랙박스', '사고/블박', '보험', '교통법규', '유머', '정치/시사', '베스트', '차량리뷰', '연비/전비', '결함/불만', '운영정책', '문의/제보']

const cfg = (categories: string[], label: string) => ({ categories, label })
export const boardConfig: Record<string, { categories: string[]; label: string }> = {
  '전체 게시글': cfg([], '전체'),
  '국산차 오너톡': cfg(['국산차'], '국산차'),
  '수입차 라운지': cfg(['수입차'], '수입차'),
  '전기차 충전소': cfg(['전기차'], '전기차'),
  'SUV 패밀리카': cfg(['SUV'], 'SUV'),
  '화물·특장': cfg(['화물'], '화물'),
  '중고차 문의': cfg(['중고차'], '중고차'),
  '정비 상담': cfg(['정비'], '정비'),
  '튜닝 인증': cfg(['튜닝'], '튜닝'),
  '보험·사고': cfg(['보험', '사고/블박'], '보험'),
  '블랙박스 제보': cfg(['블랙박스'], '블랙박스'),
  '공지': cfg(['공지'], '공지'),
  '자유': cfg(['자유'], '자유'),
  '질문': cfg(['질문'], '질문'),
  '시승기': cfg(['시승기'], '시승기'),
  '출석체크': cfg(['출석'], '출석'),
  '국산차': cfg(['국산차'], '국산차'),
  '수입차': cfg(['수입차'], '수입차'),
  '전기차': cfg(['전기차'], '전기차'),
  '정비': cfg(['정비'], '정비'),
  '블랙박스': cfg(['블랙박스'], '블랙박스'),
  '사고/블박': cfg(['사고/블박'], '사고'),
  '보험': cfg(['보험'], '보험'),
  '교통법규': cfg([], '교통법규'),
  '유머': cfg(['유머'], '유머'),
  '정치/시사': cfg(['정치/시사'], '정치/시사'),
  '베스트': cfg([], '베스트'),
  '차량리뷰': cfg([], '차량리뷰'),
  '연비/전비': cfg([], '연비/전비'),
  '결함/불만': cfg([], '결함/불만'),
  '운영정책': cfg([], '운영정책'),
  '문의/제보': cfg([], '문의/제보'),
}

export const sectionConfig: Record<string, { label: string; allLabel: string; topics: Record<string, string[]> }> = {
  car: { label: '자동차', allLabel: '전체', topics: { '전체': [], '국산차': ['국산차', 'SUV'], '수입차': ['수입차'], '전기차': ['전기차'] } },
  humor: { label: '유머', allLabel: '전체글', topics: { '전체글': [], '유머': ['유머'], '짤방': ['짤방'] } },
  politics: { label: '정치/시사', allLabel: '전체글', topics: { '전체글': [], '국민의힘': ['국민의힘'], '민주당': ['민주당'] } },
}

export const sectionPosts: Record<string, PcPost[]> = {
  humor: [
    ['유머', '세차장 진입 전에 꼭 확인해야 하는 뜻밖의 이유', '웃음충전', '방금', 342, 5, 18],
    ['짤방', '주차 한 번에 성공했을 때 표정', '주차달인', '4분 전', 518, 8, 27],
  ],
  politics: [
    ['국민의힘', '오늘 발표된 교통 정책 핵심 내용 정리', '정책읽기', '방금', 286, 3, 14],
    ['민주당', '자동차 세제 개편 관련 논의 내용 정리', '생활정치', '5분 전', 241, 2, 11],
  ],
}

export function numericMetric(value: unknown): number {
  return Number(String(value == null ? '0' : value).replace(/[^0-9.-]/g, '')) || 0
}

export function makeFallbackPosts(board: string): PcPost[] {
  const c = boardConfig[board] || { label: '자유' }
  return [
    [c.label, board + ' 첫 글로 실사용 후기 남깁니다', '보배시안러', '방금', 3, 0, 0],
    [c.label, board + '에서 자주 묻는 질문 정리해봤습니다', '질문정리', '8분 전', 18, 0, 2],
    [c.label, board + ' 관련해서 오너분들 의견 궁금합니다', '오너톡', '16분 전', 27, 0, 4],
    [c.label, board + ' 사진과 견적 비교 자료 공유합니다', '자료공유', '24분 전', 41, 1, 6],
    [c.label, board + ' 이번 주 인기 토론 주제 모음', '운영메모', '32분 전', 55, 0, 1],
  ]
}

export function getPostsForBoard(board: string, all: PcPost[]): PcPost[] {
  if (board === '전체 게시글') return all.slice()
  const c = boardConfig[board] || boardConfig['전체 게시글']!
  const filtered = all.filter(post => c.categories.indexOf(post[0]) !== -1 || String(post[1]).indexOf(board.replace(' 게시글', '')) !== -1)
  return filtered.length ? filtered : makeFallbackPosts(board)
}

export function boardFromCategory(category: string): string {
  const found = boardNames.find(name => name !== '전체 게시글' && (boardConfig[name]!.categories || []).indexOf(category) !== -1)
  return found || '전체 게시글'
}

export function sectionKeyFromParams(params: Params, board: string): string {
  const explicit = params.section
  if (explicit && sectionConfig[explicit]) return explicit
  if (board === '유머') return 'humor'
  if (board === '정치' || board === '정치/시사') return 'politics'
  if (board && boardConfig[board]) return 'car'
  return ''
}

export function shortcutToBoard(label: string) {
  if (label.indexOf('전기차') !== -1) return '전기차 충전소'
  if (label.indexOf('SUV') !== -1) return 'SUV 패밀리카'
  if (label.indexOf('정비') !== -1) return '정비 상담'
  if (label.indexOf('블랙박스') !== -1) return '블랙박스 제보'
  return '전체 게시글'
}

export function detailCopyFor(board: string, title: string) {
  return title + '에 대한 실제 오너 관점의 짧은 후기입니다. ' + board + ' 게시판에서 이어지는 토론 흐름을 확인할 수 있도록 작성자 정보, 최신 글, 반응, 댓글 영역을 같은 화면 리듬으로 배치했습니다.'
}

export function findPost(all: PcPost[], id: string | null | undefined, title: string | null | undefined): PcPost | null {
  if (id) {
    const byId = all.find(post => post[8] === id)
    if (byId) return byId
  }
  if (title) {
    const byTitle = all.find(post => post[1] === title)
    if (byTitle) return byTitle
  }
  return null
}

/** 정적 판 withLayout: layout 값이 있으면 뒤에 붙인다(중복 확인 없이, 정적 판과 같음). */
export function withLayout(url: string, layout: string) {
  if (!layout) return url
  return url + (url.indexOf('?') === -1 ? '?' : '&') + 'layout=' + encodeURIComponent(layout)
}

/** 정적 판 레딧 모드 링크 고치기(url.searchParams.set('layout','reddit')). */
export function setRedditLayout(url: string, on: boolean) {
  if (!on) return url
  const i = url.indexOf('?')
  const path = i === -1 ? url : url.slice(0, i)
  const params = new URLSearchParams(i === -1 ? '' : url.slice(i + 1))
  params.set('layout', 'reddit')
  return path + '?' + params.toString()
}

/** 정적 판 상세 주소 DETAIL_PAGE?board=…&post=…&postId=… → /pc/posts/<postId|view>?… */
export function detailPath(board: string, post: PcPost, layout: string) {
  let q = '?board=' + encodeURIComponent(board) + '&post=' + encodeURIComponent(post[1])
  if (post[8]) q += '&postId=' + encodeURIComponent(post[8])
  return '/pc/posts/' + encodeURIComponent(post[8] || 'view') + withLayout(q, layout)
}

export function boardForUrl(params: Params, layout: string, stored: string | null): string {
  const board = params.board || null
  if (layout === 'reddit' && !board) return '전체 게시글'
  return board || ((params.q || params.section || params.topic) ? '전체 게시글' : stored) || '전체 게시글'
}

export type RenderedBoard = { title: string; posts: PcPost[]; query: string; feed: boolean }

/** 정적 판 renderBoardRows: 제목 · 글 목록을 계산한다. */
export function renderBoard(board: string, params: Params, layout: string, all: PcPost[]): RenderedBoard {
  let title = board
  const section = sectionKeyFromParams(params, board) || 'car'
  const config = sectionConfig[section]
  let posts = section === 'car' ? getPostsForBoard(board, all) : (sectionPosts[section] || []).slice()
  const topic = params.topic || ''
  if (topic && config && topic !== config.allLabel) {
    const categories = config.topics[topic] || []
    posts = posts.filter(post => categories.indexOf(post[0]) !== -1)
    title = topic
  } else if (config && params.section) {
    title = config.label + ' ' + config.allLabel
  }
  const query = (params.q || '').trim()
  if (query) {
    const normalized = query.toLocaleLowerCase('ko-KR')
    posts = posts.filter(post => [post[0], post[1], post[2], post[7] || ''].join(' ').toLocaleLowerCase('ko-KR').indexOf(normalized) !== -1)
    title = '“' + query + '” 검색 결과'
  }
  const sort = params.sort || 'latest'
  if (sort === 'popular') posts.sort((a, b) => numericMetric(b[4]) - numericMetric(a[4]))
  if (sort === 'recommended') posts.sort((a, b) => numericMetric(b[5]) - numericMetric(a[5]))
  const feed = layout === 'reddit' && params.view === 'feed'
  if (layout === 'reddit' && !query) title = feed && board === '전체 게시글' ? '피드' : board
  if (layout === 'reddit' && !feed && !query && board === '전체 게시글') posts = boardNotices.concat(posts)
  return { title, posts, query, feed }
}

/** 상단 메뉴 · 모바일 메뉴 선택 키 */
export function topMenuKey(params: Params) {
  return params.view === 'home' ? 'home' : params.board === '블랙박스' ? 'report' : 'board'
}

/** 레딧 왼쪽 주 메뉴 선택 키 */
export function railKey(params: Params) {
  if (params.view === 'home') return 'home'
  if (params.view === 'feed') return 'popular'
  if (params.board === '공지') return 'news'
  return 'explore'
}

export function paramsFromQuery(query: Record<string, unknown>): Params {
  const out: Params = {}
  for (const [k, v] of Object.entries(query)) {
    const value = Array.isArray(v) ? v[0] : v
    out[k] = value == null ? null : String(value)
  }
  return out
}
