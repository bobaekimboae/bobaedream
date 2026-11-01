// 커뮤니티 검색 규칙. 화면(Nuxt)과 서버(Laravel + Meilisearch)가 같은 뜻으로 쓰도록 한 곳에 둔다.
// 정렬 다섯 가지 · 기간 여섯 가지 · 인기(hot) 계산식은 레딧 공개 코드
// (github.com/reddit-archive/reddit, r2/r2/lib/providers/search/cloudsearch.py · r2/r2/lib/db/_sorts.pyx,
// CPAL 1.0)의 규칙만 참고해 새로 작성했다. 코드는 옮기지 않았다.
import type { CommunityBoard, CommunityPost } from '../types/community'

export type SearchType = 'posts' | 'boards' | 'comments' | 'people'
export type SearchSort = 'relevance' | 'hot' | 'top' | 'new' | 'comments'
export type SearchPeriod = 'hour' | 'day' | 'week' | 'month' | 'year' | 'all'

export interface SearchComment {
  id: string
  postId: string
  author: string
  text: string
  createdAt: string
  likes: number
}

export interface ParsedQuery {
  terms: string[]
  phrases: string[]
  excludes: string[]
  board?: string
  author?: string
  title?: string
  headword?: string
}

export interface Segment { text: string; hit: boolean }

export const searchSortLabels: Record<SearchSort, string> = { relevance: '관련도순', hot: '인기순', top: '추천순', new: '최신순', comments: '댓글 많은 순' }
export const searchPeriodLabels: Record<SearchPeriod, string> = { hour: '1시간', day: '오늘', week: '이번 주', month: '이번 달', year: '올해', all: '전체 기간' }
export const searchTypeLabels: Record<SearchType, string> = { posts: '게시글', boards: '게시판', comments: '댓글', people: '사람' }

const periodMs: Record<SearchPeriod, number> = {
  hour: 3_600_000,
  day: 86_400_000,
  week: 7 * 86_400_000,
  month: 31 * 86_400_000,
  year: 366 * 86_400_000,
  all: Number.POSITIVE_INFINITY,
}

// 검색어 문법. 한국어 이름과 영어 이름을 모두 받는다.
const operatorKeys: Record<string, keyof Pick<ParsedQuery, 'board' | 'author' | 'title' | 'headword'>> = {
  게시판: 'board', board: 'board',
  작성자: 'author', author: 'author',
  제목: 'title', title: 'title',
  말머리: 'headword', flair: 'headword',
}

export function normalize(value: string) {
  return value.normalize('NFC').toLowerCase().trim()
}

// "그랜저IG"와 "그랜저 IG"를 같게 본다. 공백·하이픈·가운데점을 빼고 비교한다.
export function compact(value: string) {
  return normalize(value).replace(/[\s\-·・.]/g, '')
}

export function parseQuery(raw: string): ParsedQuery {
  const parsed: ParsedQuery = { terms: [], phrases: [], excludes: [] }
  const pattern = /(-?)(?:([가-힣a-z]+):)?(?:"([^"]+)"|(\S+))/gi
  for (const match of raw.matchAll(pattern)) {
    const negative = match[1] === '-'
    const key = match[2] ? operatorKeys[match[2].toLowerCase()] : undefined
    const value = (match[3] ?? match[4] ?? '').trim()
    if (!value) continue
    if (match[2] && !key) {
      // 모르는 접두어는 글자 그대로 검색어로 둔다.
      parsed.terms.push(normalize(`${match[2]}:${value}`))
      continue
    }
    if (key) { parsed[key] = value; continue }
    if (negative) { parsed.excludes.push(normalize(value)); continue }
    if (match[3]) parsed.phrases.push(normalize(value))
    else parsed.terms.push(normalize(value))
  }
  return parsed
}

export function hasCondition(parsed: ParsedQuery) {
  return Boolean(parsed.terms.length || parsed.phrases.length || parsed.board || parsed.author || parsed.title || parsed.headword)
}

// 인기(hot) 점수: 추천 차이를 로그로 줄이고, 올린 시각을 45,000초(12.5시간)마다 1점씩 더한다.
// 추천이 10배면 12.5시간 늦게 올린 글과 같은 순위가 된다. 서버는 같은 식을 예약 작업으로 계산해 정렬 칸에 둔다.
export function hotScore(likes: number, dislikes: number, createdAt: string) {
  const score = likes - dislikes
  const order = Math.log10(Math.max(Math.abs(score), 1))
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0
  const seconds = Date.parse(createdAt) / 1000 - 1134028003
  return Math.round((sign * order + seconds / 45000) * 1e7) / 1e7
}

function contains(haystack: string, needle: string) {
  if (!needle) return true
  return normalize(haystack).includes(needle) || compact(haystack).includes(compact(needle))
}

export function resolveBoard(boards: CommunityBoard[], value?: string) {
  if (!value) return undefined
  const key = compact(value)
  return boards.find(board => board.id === value)
    ?? boards.find(board => compact(board.name) === key)
    ?? boards.find(board => compact(board.name).startsWith(key))
}

interface PostDoc { post: CommunityPost; board?: CommunityBoard }

function postScore(doc: PostDoc, parsed: ParsedQuery) {
  const { post, board } = doc
  let score = 0
  for (const term of [...parsed.terms, ...parsed.phrases]) {
    let best = 0
    if (contains(post.title, term)) best = Math.max(best, normalize(post.title).startsWith(term) ? 12 : 10)
    if (post.headword && compact(post.headword) === compact(term)) best = Math.max(best, 7)
    if (board && contains(board.name, term)) best = Math.max(best, 4)
    if (contains(post.excerpt, term)) best = Math.max(best, 3)
    if (contains(post.author, term)) best = Math.max(best, 2)
    if (!best) return 0
    score += best
  }
  if (parsed.terms.length > 1 && contains(post.title, parsed.terms.join(' '))) score += 6
  return score || 1
}

export interface PostSearchOptions {
  query: string
  boardId?: string
  sort: SearchSort
  period: SearchPeriod
  now?: number
}

export interface PostHit { post: CommunityPost; board?: CommunityBoard; score: number }

export function searchPosts(posts: CommunityPost[], boards: CommunityBoard[], options: PostSearchOptions) {
  const parsed = parseQuery(options.query)
  const now = options.now ?? Date.now()
  const scopeBoard = resolveBoard(boards, parsed.board) ?? boards.find(board => board.id === options.boardId)
  const boardById = new Map(boards.map(board => [board.id, board]))
  const candidates: PostHit[] = []
  if (parsed.board && !resolveBoard(boards, parsed.board)) {
    return { hits: [] as PostHit[], facets: [] as Array<{ board: CommunityBoard; count: number }>, parsed, scopeBoard: undefined, unknownBoard: parsed.board as string | undefined }
  }

  for (const post of posts) {
    const board = boardById.get(post.boardId)
    if (scopeBoard && post.boardId !== scopeBoard.id) continue
    if (parsed.author && !contains(post.author, normalize(parsed.author))) continue
    if (parsed.title && !contains(post.title, normalize(parsed.title))) continue
    if (parsed.headword && compact(post.headword ?? '') !== compact(parsed.headword)) continue
    if (parsed.excludes.some(word => contains(`${post.title} ${post.excerpt}`, word))) continue
    if (now - Date.parse(post.createdAt) > periodMs[options.period]) continue
    const score = postScore({ post, board }, parsed)
    if (!score) continue
    candidates.push({ post, board, score })
  }

  const sorted = candidates.sort((a, b) => compareHits(a, b, options.sort))
  // 게시판별 대수(패싯). 게시판 범위를 고르기 전 기준으로 센다.
  const facetSource = scopeBoard ? searchPosts(posts, boards, { ...options, boardId: undefined, query: options.query.replace(/(?:게시판|board):(?:"[^"]+"|\S+)/gi, '') }).hits : sorted
  const counts = new Map<string, number>()
  for (const hit of facetSource) counts.set(hit.post.boardId, (counts.get(hit.post.boardId) ?? 0) + 1)
  const facets = [...counts.entries()]
    .map(([id, count]) => ({ board: boardById.get(id)!, count }))
    .filter(facet => facet.board)
    .sort((a, b) => b.count - a.count || a.board.name.localeCompare(b.board.name, 'ko'))

  return { hits: sorted, facets, parsed, scopeBoard, unknownBoard: undefined as string | undefined }
}

function compareHits(a: PostHit, b: PostHit, sort: SearchSort) {
  const pa = a.post
  const pb = b.post
  switch (sort) {
    case 'hot': return hotScore(pb.likes, pb.dislikes, pb.createdAt) - hotScore(pa.likes, pa.dislikes, pa.createdAt)
    case 'top': return (pb.likes - pb.dislikes) - (pa.likes - pa.dislikes)
    case 'new': return Date.parse(pb.createdAt) - Date.parse(pa.createdAt)
    case 'comments': return pb.comments - pa.comments
    default:
      return b.score - a.score || hotScore(pb.likes, pb.dislikes, pb.createdAt) - hotScore(pa.likes, pa.dislikes, pa.createdAt)
  }
}

export function searchBoards(boards: CommunityBoard[], posts: CommunityPost[], query: string) {
  const parsed = parseQuery(query)
  const words = [...parsed.terms, ...parsed.phrases]
  if (!words.length) return []
  return boards
    .map((board) => {
      const text = `${board.name} ${board.headwords.join(' ')}`
      const score = words.every(word => contains(text, word)) ? (contains(board.name, words[0]!) ? 2 : 1) : 0
      return { board, score, posts: posts.filter(post => post.boardId === board.id).length }
    })
    .filter(item => item.score)
    .sort((a, b) => b.score - a.score || b.posts - a.posts)
}

export function searchPeople(posts: CommunityPost[], comments: SearchComment[], query: string) {
  const parsed = parseQuery(query)
  const word = parsed.author ? normalize(parsed.author) : [...parsed.terms, ...parsed.phrases].join(' ')
  if (!word) return []
  const people = new Map<string, { name: string; posts: number; comments: number; likes: number }>()
  for (const post of posts) {
    const person = people.get(post.author) ?? { name: post.author, posts: 0, comments: 0, likes: 0 }
    person.posts += 1
    person.likes += post.likes
    people.set(post.author, person)
  }
  for (const comment of comments) {
    const person = people.get(comment.author) ?? { name: comment.author, posts: 0, comments: 0, likes: 0 }
    person.comments += 1
    person.likes += comment.likes
    people.set(comment.author, person)
  }
  return [...people.values()]
    .filter(person => contains(person.name, word))
    .sort((a, b) => Number(normalize(b.name).startsWith(word)) - Number(normalize(a.name).startsWith(word)) || b.likes - a.likes)
}

export function searchComments(comments: SearchComment[], posts: CommunityPost[], options: PostSearchOptions & { boards: CommunityBoard[] }) {
  const parsed = parseQuery(options.query)
  const now = options.now ?? Date.now()
  const words = [...parsed.terms, ...parsed.phrases]
  const scopeBoard = resolveBoard(options.boards, parsed.board) ?? options.boards.find(board => board.id === options.boardId)
  const postById = new Map(posts.map(post => [post.id, post]))
  return comments
    .map(comment => ({ comment, post: postById.get(comment.postId) }))
    .filter((item): item is { comment: SearchComment; post: CommunityPost } => Boolean(item.post))
    .filter(({ comment, post }) => {
      if (scopeBoard && post.boardId !== scopeBoard.id) return false
      if (parsed.author && !contains(comment.author, normalize(parsed.author))) return false
      if (parsed.excludes.some(word => contains(comment.text, word))) return false
      if (now - Date.parse(comment.createdAt) > periodMs[options.period]) return false
      return words.every(word => contains(comment.text, word)) && (words.length > 0 || Boolean(parsed.author))
    })
    .sort((a, b) => {
      if (options.sort === 'new') return Date.parse(b.comment.createdAt) - Date.parse(a.comment.createdAt)
      if (options.sort === 'top' || options.sort === 'hot') return b.comment.likes - a.comment.likes
      return b.comment.likes - a.comment.likes || Date.parse(b.comment.createdAt) - Date.parse(a.comment.createdAt)
    })
}

// 찾은 글자 표시. HTML을 만들지 않고 조각으로 나눠 화면이 글자로만 그린다(서버의 _formatted도 같은 방식으로 다룬다).
export function highlight(text: string, query: string): Segment[] {
  const parsed = parseQuery(query)
  const words = [...parsed.terms, ...parsed.phrases, parsed.title, parsed.author].filter((word): word is string => Boolean(word)).map(normalize)
  if (!words.length || !text) return [{ text, hit: false }]
  const lower = text.normalize('NFC').toLowerCase()
  const marks = new Array<boolean>(text.length).fill(false)
  for (const word of words) {
    let from = 0
    while (word && (from = lower.indexOf(word, from)) !== -1) {
      for (let i = from; i < from + word.length; i += 1) marks[i] = true
      from += word.length
    }
    // 띄어쓰기가 다른 경우(그랜저IG ↔ 그랜저 IG): 공백을 건너뛰며 다시 맞춰 본다.
    const target = compact(word)
    if (target.length > 1 && !lower.includes(word)) {
      for (let start = 0; start < lower.length; start += 1) {
        let i = start
        let j = 0
        while (i < lower.length && j < target.length) {
          if (/[\s\-·・.]/.test(lower[i]!)) { i += 1; continue }
          if (lower[i] !== target[j]) break
          i += 1; j += 1
        }
        if (j === target.length) { for (let k = start; k < i; k += 1) marks[k] = true; start = i - 1 }
      }
    }
  }
  const segments: Segment[] = []
  for (let i = 0; i < text.length; i += 1) {
    const last = segments[segments.length - 1]
    if (last && last.hit === marks[i]) last.text += text[i]
    else segments.push({ text: text[i]!, hit: marks[i]! })
  }
  return segments
}

// 본문 미리보기는 찾은 낱말 앞뒤만 잘라 보여 준다(Meilisearch cropLength와 같은 뜻).
export function crop(text: string, query: string, length = 60) {
  const parsed = parseQuery(query)
  const word = [...parsed.terms, ...parsed.phrases][0]
  if (!word || text.length <= length) return text
  const index = text.toLowerCase().indexOf(word)
  if (index < 0) return text.slice(0, length) + '…'
  const start = Math.max(0, index - Math.floor(length / 3))
  return `${start > 0 ? '…' : ''}${text.slice(start, start + length)}${start + length < text.length ? '…' : ''}`
}
