// 상세 화면 이식에서 쓰는 모양 (정적 chzzk-detail.js 의 객체 모양 그대로)

export type DetailComment = {
  id: string
  user?: string
  level?: string | number
  avatar?: string
  text?: string
  date?: string
  like?: number
  dislike?: number
  viewerVote?: '' | 'up' | 'down'
  writer?: boolean
  own?: boolean
  replies?: DetailComment[]
  [key: string]: unknown
}

export type EmbedItem = {
  url?: string
  render?: string
  src?: string
  provider?: string
  title?: string
  tall?: boolean
  wide?: boolean
  reel?: boolean
  crop?: string
  height?: number
  kind?: string
  image?: string
  logo?: string
  site?: string
  description?: string
  lang?: string
  caption?: string
  noHydrate?: boolean
  [key: string]: unknown
}

export type PollData = {
  title?: string
  options?: string[]
  images?: string[]
  multiple?: boolean
  anonymous?: boolean
  visibility?: string
  endsAt?: string
  note?: string
}

export type SourcePost = {
  id: number
  title?: string
  user?: string
  level?: string | number
  category?: string
  board?: string
  boardTable?: boolean
  date?: string
  time?: string
  view?: number
  likes?: number
  reply?: number
  authorAvatar?: string
  tags?: string[] | string
  body?: string[]
  comments?: DetailComment[]
  detailImage?: string
  thumbnail?: string
  thumb?: string
  images?: string[]
  photos?: number
  embeds?: EmbedItem[]
  source?: string
  sourceUrl?: string
  summary3?: string[]
  poll?: PollData | null
  // 글쓰기에서 온 글(?local=1)
  html?: string
  media?: Array<{ id: string; kind?: string; name?: string }>
  hideBody?: boolean
  [key: string]: unknown
}

/** 본문 영역에 차례대로 놓이는 덩어리 */
export type BodyPart =
  | { kind: 'summary3'; text: string }
  | { kind: 'photo'; src: string; alt: string; discussion: boolean; elId?: string; ratio?: number; eager: boolean; lazyAttr: boolean }
  | { kind: 'video'; src: string; poster: string; elId: string; ratio?: number }
  | { kind: 'embed'; item: EmbedItem; mode: 'block' | 'local' }
  | { kind: 'poll'; poll: PollData; pollId: string }
  | { kind: 'copy'; lines: Array<{ tag: 'p' | 'h3' | 'blockquote' | 'ul' | 'ol'; html: string; items?: string[] }> }
  | { kind: 'source'; source: string; url: string }
  | { kind: 'rule' }
  | { kind: 'localMedia'; media: Array<{ id: string; kind?: string; name?: string }> }

export type LatestItem = { text: string; comments: string; postId?: number; hidden: boolean }

export type DetailMode = 'reference' | 'longNotice' | 'inquiry' | 'scenario' | 'local'
