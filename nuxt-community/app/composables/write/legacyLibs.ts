// 글쓰기 화면이 쓰는 정적 커뮤니티 공용 라이브러리(public/community/community-embed.js · community-poll.js).
// 목록 · 상세 · 글쓰기가 같은 모양을 쓰도록 원본 파일 한 곳을 그대로 불러와 전역 값을 받는다(복사 · 다시 쓰기 없음).

export interface EmbedItem {
  url: string
  render: 'iframe' | 'preview' | string
  src?: string
  provider?: string
  title?: string
  tall?: boolean
  description?: string
  image?: string
  site?: string
  logo?: string
  lang?: string
}

export interface EmbedMeta {
  title?: string
  description?: string
  image?: string
  site?: string
  logo?: string
  lang?: string
}

export interface BbmEmbedLib {
  fromCode: (value: string) => string
  info: (href: string) => EmbedItem | null
  fetchMeta: (url: string) => Promise<EmbedMeta>
  cardHtml: (item: EmbedItem) => string
  frameHtml: (item: EmbedItem) => string
}

export interface PollData {
  title: string
  options: string[]
  images: string[]
  multiple: boolean
  anonymous: boolean
  visibility: string
  endsAt: string
}

export interface BbmPollLib {
  html: (poll: PollData, opts?: Record<string, unknown>) => string
}

/** 두 라이브러리를 순서대로 불러온다(정적 판 <script> 순서와 같게: embed → poll) */
export async function loadWriteLibs(): Promise<void> {
  await loadLegacyScript('community-embed.js')
  await loadLegacyScript('community-poll.js')
}

export function embedLib(): BbmEmbedLib | undefined {
  return (globalThis as Record<string, unknown>).BBM_EMBED as BbmEmbedLib | undefined
}

export function pollLib(): BbmPollLib | undefined {
  return (globalThis as Record<string, unknown>).BBM_POLL as BbmPollLib | undefined
}

/** 원본 라이브러리가 만든 HTML 안의 './media/…' 상대 주소(파비콘 저장본)를 community 폴더 기준으로 바꾼다 */
export function fixLegacyPaths(html: string): string {
  return html.replace(/(src|href)="\.\/media\//g, (_m, attr: string) => `${attr}="${communityAsset('media/')}`)
}
