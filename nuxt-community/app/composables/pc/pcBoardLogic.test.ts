import { describe, expect, it } from 'vitest'
import {
  boardForUrl, boardFromCategory, boardNotices, detailPath, getPostsForBoard, railKey, renderBoard, setRedditLayout, topMenuKey, withLayout, type PcPost,
} from './pcBoardLogic'
import { padPoll, resolveReturnTo } from './pcWrite'

const posts: PcPost[] = [
  ['국산차', '쏘렌토 후기', '가', '방금', 10, 5, 1, '본문 보험', 'domestic-001', '국산차 오너톡'],
  ['수입차', 'BMW 질문', '나', '1분 전', 30, 1, 0, '', 'import-001'],
  ['보험', '할증 계산', '다', '2분 전', '1,200', 9, 2],
]

describe('정적 PC 게시판 규칙', () => {
  it('withLayout 은 정적 판처럼 layout 을 뒤에 붙인다', () => {
    expect(withLayout('/pc?board=a', 'reddit')).toBe('/pc?board=a&layout=reddit')
    expect(withLayout('/pc', 'reddit')).toBe('/pc?layout=reddit')
    expect(withLayout('/pc', '')).toBe('/pc')
  })
  it('레딧 모드 링크는 layout=reddit 을 한 번만 둔다', () => {
    expect(setRedditLayout('/pc?view=home&layout=reddit', true)).toBe('/pc?view=home&layout=reddit')
    expect(setRedditLayout('/pc', true)).toBe('/pc?layout=reddit')
    expect(setRedditLayout('/pc?view=home', false)).toBe('/pc?view=home')
  })
  it('게시판 고르기: 레딧은 전체, 일반은 저장된 게시판', () => {
    expect(boardForUrl({}, 'reddit', '수입차')).toBe('전체 게시글')
    expect(boardForUrl({}, '', '수입차')).toBe('수입차')
    expect(boardForUrl({ q: 'x' }, '', '수입차')).toBe('전체 게시글')
    expect(boardForUrl({ board: '정비' }, '', null)).toBe('정비')
  })
  it('분류 → 게시판, 게시판 → 글(없으면 대체 글 5개)', () => {
    expect(boardFromCategory('보험')).toBe('보험·사고')
    expect(getPostsForBoard('수입차', posts).map(p => p[1])).toEqual(['BMW 질문'])
    expect(getPostsForBoard('교통법규', posts)).toHaveLength(5)
  })
  it('레딧 전체 게시글에는 공지 3개가 앞에, 피드에는 없다', () => {
    const board = renderBoard('전체 게시글', {}, 'reddit', posts)
    expect(board.posts.slice(0, 3)).toEqual(boardNotices)
    expect(board.title).toBe('전체 게시글')
    const feed = renderBoard('전체 게시글', { view: 'feed' }, 'reddit', posts)
    expect(feed.title).toBe('피드')
    expect(feed.posts).toHaveLength(3)
  })
  it('검색 · 정렬 · 섹션 제목', () => {
    expect(renderBoard('전체 게시글', { q: '보험' }, '', posts).posts.map(p => p[1])).toEqual(['쏘렌토 후기', '할증 계산'])
    expect(renderBoard('전체 게시글', { q: '보험' }, '', posts).title).toBe('“보험” 검색 결과')
    expect(renderBoard('전체 게시글', { sort: 'popular' }, '', posts).posts[0]![1]).toBe('할증 계산')
    expect(renderBoard('전체 게시글', { section: 'politics' }, '', posts).title).toBe('정치/시사 전체글')
    expect(renderBoard('전체 게시글', { section: 'car', topic: '수입차' }, '', posts).title).toBe('수입차')
  })
  it('메뉴 선택 키', () => {
    expect(topMenuKey({ view: 'home' })).toBe('home')
    expect(topMenuKey({ board: '블랙박스' })).toBe('report')
    expect(railKey({ view: 'feed' })).toBe('popular')
    expect(railKey({ board: '공지' })).toBe('news')
    expect(railKey({})).toBe('explore')
  })
  it('상세 주소', () => {
    expect(detailPath('국산차 오너톡', posts[0]!, 'reddit')).toBe('/pc/posts/domestic-001?board=%EA%B5%AD%EC%82%B0%EC%B0%A8%20%EC%98%A4%EB%84%88%ED%86%A1&post=%EC%8F%98%EB%A0%8C%ED%86%A0%20%ED%9B%84%EA%B8%B0&postId=domestic-001&layout=reddit')
    expect(detailPath('보험·사고', posts[2]!, '').startsWith('/pc/posts/view?')).toBe(true)
  })
})

describe('레딧형 글쓰기 규칙', () => {
  it('returnTo 는 커뮤니티 목록만 받는다', () => {
    const base = 'http://h/bobaedream/community/reddit-write.html'
    expect(resolveReturnTo(null, 'http://h', base)).toBe('/?view=reddit')
    expect(resolveReturnTo('naver-cafe-list.html?board=free', 'http://h', base)).toBe('/?board=free')
    expect(resolveReturnTo('https://evil.example/community/naver-cafe-list.html', 'http://h', base)).toBe('/?view=reddit')
    expect(resolveReturnTo('/?board=f1', 'http://h', base)).toBe('/?board=f1')
  })
  it('투표 선택지 채우기는 정적 판과 같다', () => {
    expect(padPoll(['a'])).toEqual(['a', ''])
    expect(padPoll(undefined)).toEqual(['', '', '', ''])
  })
})
