import { describe, expect, it } from 'vitest'
import type { CommunityPost } from '../types/community'
import { filterAndSortPosts } from './useCommunity'

const posts: CommunityPost[] = [
  { id: 'a', boardId: 'free', headword: '질문', title: 'A', excerpt: '', author: 'a', createdAt: '2026-11-01T01:00:00Z', updatedAt: '2026-11-01T04:00:00Z', comments: 2, likes: 3, dislikes: 0, views: 1 },
  { id: 'b', boardId: 'free', headword: '일상', title: 'B', excerpt: '', author: 'b', createdAt: '2026-11-01T03:00:00Z', updatedAt: '2026-11-01T03:00:00Z', comments: 10, likes: 1, dislikes: 0, views: 1 },
  { id: 'c', boardId: 'imported', headword: '질문', title: 'C', excerpt: '', author: 'c', createdAt: '2026-11-01T05:00:00Z', updatedAt: '2026-11-01T05:00:00Z', comments: 20, likes: 20, dislikes: 0, views: 1 },
]

describe('filterAndSortPosts', () => {
  it('선택한 게시판의 글만 반환한다', () => {
    expect(filterAndSortPosts(posts, 'free', '', 'latest').map(post => post.id)).toEqual(['b', 'a'])
  })

  it('말머리 필터를 게시판 조건과 함께 적용한다', () => {
    expect(filterAndSortPosts(posts, 'free', '질문', 'latest').map(post => post.id)).toEqual(['a'])
  })

  it('최신 댓글순과 인기순 의미를 분리한다', () => {
    expect(filterAndSortPosts(posts, 'free', '', 'latest-comment').map(post => post.id)).toEqual(['a', 'b'])
    expect(filterAndSortPosts(posts, 'free', '', 'popular').map(post => post.id)).toEqual(['b', 'a'])
  })
})
