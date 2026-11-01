import { describe, expect, it } from 'vitest'
import type { CommunityBoard, CommunityPost } from '../types/community'
import { highlight, hotScore, parseQuery, searchBoards, searchPosts } from './communitySearch'

const boards: CommunityBoard[] = [
  { id: 'domestic', sectionId: 'cars', name: '국산차게시판', headwords: ['현대'], canWrite: true },
  { id: 'maintenance', sectionId: 'cars', name: '정비 · DIY', headwords: ['정비'], canWrite: true },
]
const base = { excerpt: '', updatedAt: '2026-11-01T00:00:00Z', comments: 0, likes: 0, dislikes: 0, views: 0 }
const posts: CommunityPost[] = [
  { ...base, id: 'a', boardId: 'domestic', headword: '현대', title: '그랜저 IG 겨울 시동 지연', author: '아침', createdAt: '2026-11-01T06:00:00Z', likes: 60, comments: 40 },
  { ...base, id: 'b', boardId: 'maintenance', headword: '정비', title: '엔진오일 교환 주기', excerpt: '겨울에는 시동 전에 확인', author: '정비아빠', createdAt: '2026-10-30T09:00:00Z', likes: 80, comments: 50 },
  { ...base, id: 'c', boardId: 'maintenance', headword: '정비', title: '배터리 광고 글', author: '광고봇', createdAt: '2026-11-01T07:00:00Z', likes: 1 },
]
const now = Date.parse('2026-11-01T08:00:00Z')

describe('parseQuery', () => {
  it('검색어 문법(게시판·작성자·제목·말머리·빼기·따옴표)을 나눈다', () => {
    const parsed = parseQuery('게시판:정비 작성자:정비아빠 제목:"교환 주기" 말머리:정비 -광고 오일')
    expect(parsed).toMatchObject({ board: '정비', author: '정비아빠', title: '교환 주기', headword: '정비', excludes: ['광고'], terms: ['오일'] })
  })
})

describe('searchPosts', () => {
  it('띄어쓰기가 달라도 찾는다', () => {
    expect(searchPosts(posts, boards, { query: '그랜저IG', sort: 'relevance', period: 'all', now }).hits.map(hit => hit.post.id)).toEqual(['a'])
  })
  it('제목에 맞은 글을 본문에만 맞은 글보다 위에 둔다', () => {
    expect(searchPosts(posts, boards, { query: '시동', sort: 'relevance', period: 'all', now }).hits.map(hit => hit.post.id)).toEqual(['a', 'b'])
  })
  it('게시판 범위·기간·빼기 조건을 적용하고 게시판별 대수를 센다', () => {
    const result = searchPosts(posts, boards, { query: '시동', sort: 'relevance', period: 'day', now })
    expect(result.hits.map(hit => hit.post.id)).toEqual(['a'])
    expect(searchPosts(posts, boards, { query: '게시판:정비 -광고', sort: 'new', period: 'all', now }).hits.map(hit => hit.post.id)).toEqual(['b'])
    expect(searchPosts(posts, boards, { query: '겨울', sort: 'relevance', period: 'all', now }).facets.map(facet => facet.count)).toEqual([1, 1])
  })
  it('없는 게시판 이름은 결과 없이 알려 준다', () => {
    expect(searchPosts(posts, boards, { query: '게시판:없는곳 시동', sort: 'relevance', period: 'all', now }).unknownBoard).toBe('없는곳')
  })
})

describe('hotScore', () => {
  it('추천 10배는 12.5시간 늦게 올린 글과 같다', () => {
    const early = hotScore(10, 0, '2026-11-01T00:00:00Z')
    const late = hotScore(1, 0, '2026-11-01T12:30:00Z')
    expect(early).toBeCloseTo(late, 5)
  })
})

describe('highlight · searchBoards', () => {
  it('찾은 글자만 표시한다', () => {
    expect(highlight('그랜저 IG 겨울', '그랜저ig').filter(part => part.hit).map(part => part.text)).toEqual(['그랜저 IG'])
  })
  it('게시판 이름과 말머리로 게시판을 찾는다', () => {
    expect(searchBoards(boards, posts, '현대').map(item => item.board.id)).toEqual(['domestic'])
  })
})
