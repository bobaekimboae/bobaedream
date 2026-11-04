// PC 레딧형 글쓰기 — 정적 public/community/reddit-write.js 의 데이터 · 규칙 (2026-11-04)
export const WRITE_DRAFT_KEY = 'bbm.community.redditWriteDraft.v1'
export const LATEST_POST_KEY = 'bbm.community.latestPost.v2'

export const communities = [
  { name: '자동차뉴스', members: '12.8만 명', letter: 'N' },
  { name: '브랜드 자동차 정보', members: '브랜드 정보', letter: 'B' },
  { name: '자유게시판', members: '48.2만 명', letter: '자' },
  { name: '국산차 오너톡', members: '19.4만 명', letter: '국' },
  { name: '수입차 라운지', members: '11.7만 명', letter: '수' },
  { name: '전기차', members: '8.6만 명', letter: '전' },
  { name: '정비 · DIY', members: '7.1만 명', letter: '정' },
  { name: '중고차', members: '16.3만 명', letter: '중' },
  { name: '블랙박스 제보', members: '21.5만 명', letter: '블' },
]
export const flairs = ['신차', '산업', '정책', '전기차', '모빌리티', '안전', '시승기', '정비']

/**
 * 정적 판 returnTo: 같은 사이트의 community/naver-cafe-list.html 만 받는다.
 * 넉스트에서는 그 화면이 앱 안 「/」 이므로 「/?…」 로 바꾼다. 앱 안 주소(/?…)로 넘어와도 받는다.
 */
export function resolveReturnTo(raw: string | null | undefined, origin: string, base: string): string {
  const fallback = '/?view=reddit'
  if (!raw) return fallback
  try {
    if (raw.startsWith('/?') || raw === '/') return raw
    const url = new URL(raw, base)
    if (url.origin === origin && url.pathname.endsWith('/community/naver-cafe-list.html')) return '/' + url.search + url.hash
    return fallback
  } catch {
    return fallback
  }
}

/** 정적 판 setPoll: 선택지가 2개보다 적으면 빈 칸으로 채운다(options 가 없으면 정적 판처럼 4칸이 된다). */
export function padPoll(options: string[] | undefined): string[] {
  return (options || ['', '']).concat(Array(Math.max(0, 2 - (options || []).length)).fill(''))
}
