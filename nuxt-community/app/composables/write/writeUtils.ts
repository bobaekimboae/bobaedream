// 글쓰기 화면의 순수 계산(자동 가져오기 없이 시험할 수 있게 따로 둔다). 원본: public/community/chzzk-write.js

/** 정적 판과 같은 저장 키(정적 · 넉스트 판이 같은 임시저장 · 등록 미리보기를 이어 쓴다) */
export const POST_KEY = 'bbm.community.latestPost.v2'
export const DRAFT_KEY = 'bbm.community.chzzkDraft.v1'
export const MEDIA_DB = 'bbm-notion-write-media'

export const DEFAULT_BOARDS: { section: string, items: string[] }[] = [
  { section: '보배드림 커뮤니티', items: ['자유게시판', '국산차 오너톡', '수입차 라운지', '전기차', '정비 · DIY', '튜닝'] },
  { section: '거래 · 제보', items: ['중고차', '보험 · 사고', '블랙박스 제보', '바이크'] },
  { section: '자동차 정보', items: ['자동차뉴스', '브랜드 자동차 정보', '차량리뷰'] },
]

/** 주소로 들어온 게시판이 목록에 없으면 맨 위에 「현재 게시판」으로 보여 준다 */
export function boardGroups(fromBoard: string) {
  const groups = DEFAULT_BOARDS.map(group => ({ section: group.section, items: [...group.items] }))
  if (fromBoard && !groups.some(group => group.items.includes(fromBoard))) groups.unshift({ section: '현재 게시판', items: [fromBoard] })
  return groups
}

/**
 * returnTo → 넉스트 안 주소. 정적 판은 같은 출처의 naver-cafe-list.html 만 받았다.
 * 넉스트 판: '/…' 앱 안 주소, 또는 예전 정적 목록 주소(…/community/naver-cafe-list.html?…)를 '/?…' 로 바꾼다. 그 밖은 '/'.
 */
export function resolveReturnTo(requested: string): string {
  if (!requested) return '/'
  // 넉스트 판 전체 주소(…/nuxt-community/#/?board=…)는 # 뒤 앱 안 주소만 쓴다
  const hashed = requested.match(/^(?:https?:\/\/[^/]+)?\/[^#]*nuxt-community\/?#(\/.*)$/)
  if (hashed) requested = hashed[1]!
  const legacy = requested.match(/\/community\/naver-cafe-list\.html(\?[^#]*)?(#.*)?$/) || requested.match(/^\.?\/?naver-cafe-list\.html(\?[^#]*)?(#.*)?$/)
  if (legacy) return `/${legacy[1] || ''}`
  if (requested.startsWith('/') && !requested.startsWith('//') && !/^\/(write|posts\/)/.test(requested)) return requested
  return '/'
}

/** 태그 입력 → 최대 10개, 중복 제거 */
export function parseTags(raw: string): string[] {
  return [...new Set(raw.split('#').map(value => value.trim()).filter(Boolean))].slice(0, 10)
}

export function tagSummary(tags: string[]): string {
  return tags.length ? tags.map(tag => `#${tag}`).join(' ') : '#태그 입력 (#으로 구분, 최대 10개)'
}

/**
 * 정적 판의 execCommand('fontSize', round(px/5)) 는 <font size=N> 을 만들었다.
 * HTML 글자 크기 단계 → 실제 px: 1=10 2=13 3=16 4=18 5=24 6=32 7=48
 */
export function legacyFontPx(selected: number): string {
  const step = Math.max(1, Math.min(7, Math.round(selected / 5)))
  return `${[10, 13, 16, 18, 24, 32, 48][step - 1]}px`
}

export function legacyFontFamily(value: string): string {
  return value === 'system' ? 'sans-serif' : value
}

/** 임시저장 글을 되살릴 때: 글자·서식만 남기고 스크립트·on* 속성·javascript: 주소는 걷어 낸다 */
export function safeDraftHtml(html: string): string {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  doc.querySelectorAll('script,style,iframe[srcdoc],object,embed,link,meta').forEach(node => node.remove())
  doc.body.querySelectorAll('*').forEach((node) => {
    ;[...node.attributes].forEach((attr) => {
      if (/^on/i.test(attr.name) || (/^(href|src|xlink:href|action|formaction)$/i.test(attr.name) && /^\s*javascript:/i.test(attr.value))) node.removeAttribute(attr.name)
    })
  })
  const first = doc.body.firstChild as HTMLElement | null
  return first ? first.innerHTML : ''
}

/** 목록 카드 요약용 본문 줄(임베드·투표 글자는 빼고) */
export function bodyLines(html: string): string[] {
  const copy = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html').body.firstChild as HTMLElement
  copy.querySelectorAll('.write-embed,.editor-poll').forEach(node => node.remove())
  copy.querySelectorAll('p,div,h3,blockquote,li,br,hr').forEach((node) => {
    node.before(copy.ownerDocument.createTextNode('\n'))
    node.after(copy.ownerDocument.createTextNode('\n'))
  })
  return (copy.textContent || '').split(/\n+/).map(line => line.trim()).filter(Boolean)
}

export interface DateOption { value: number, label: string }
export function dateOptions(start: number, end: number, suffix: string): DateOption[] {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index).map(value => ({ value, label: `${String(value).padStart(2, '0')}${suffix}` }))
}

/** 투표 종료 기본값: 저장된 시각이 앞으로면 그 값, 아니면 지금부터 하루 뒤. 분은 5분 단위 올림 */
export function deadlineDefaults(value: string, now = Date.now()) {
  const base = value && Date.parse(value) > now ? new Date(value) : new Date(now + 864e5)
  return {
    year: base.getFullYear(),
    month: base.getMonth() + 1,
    day: base.getDate(),
    hour: base.getHours(),
    minute: Math.ceil(base.getMinutes() / 5) * 5 % 60,
  }
}

export interface PollRowValue { text: string, image: string }

/** 확인 버튼 사용 가능: 제목 · 2개 이상 · 모든 항목 입력 */
export function pollApplyDisabled(pollTitle: string, rows: PollRowValue[]): boolean {
  return !pollTitle.trim() || rows.length < 2 || rows.some(item => !item.text.trim())
}

/** 등록 가능: 게시판 · 제목 · (본문 글자 | 사진 | 영상 | 임베드 | 투표) */
export function canSubmit(state: { board: string, title: string, text: string, photos: number, videos: number, embeds: number, polls: number }): boolean {
  return Boolean(state.board && state.title.trim() && (state.text.trim() || state.photos || state.videos || state.embeds || state.polls))
}
