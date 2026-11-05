// @vitest-environment happy-dom
// 상세 화면 데이터: 정적 chzzk-detail.js 와 같은 모드·글 고르기를 하는지 확인
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.stubGlobal('siteRoot', () => '/bobaedream/')
vi.stubGlobal('communityAsset', (path: string) => `/bobaedream/community/${path}`)
vi.stubGlobal('loadLegacyScript', () => Promise.resolve())

const { buildDetailModel, latestCommentCount } = await import('./detailData')
const { localBodyParts } = await import('./localBody')

beforeEach(() => {
  localStorage.clear()
  const w = window as unknown as Record<string, unknown>
  w.BOBAE_POSTS = [
    { id: 1, title: '[시승기] 장거리 후기', user: 'A', category: '시승기', time: '1분 전', view: 1025, likes: 3, body: ['본문'], comments: [{ id: '1-1', user: 'B', text: '댓글', replies: [{ id: '1-1-1', user: 'C', text: '답글' }] }] },
    { id: 2, title: '[시승기] 다른 글', user: 'Z', category: '시승기', reply: 7 },
  ]
  w.BOBAE_AVATAR_FOR = (name: string) => `assets/profile-avatars/${name}.svg`
  w.BBM_BOARD_TABLE = { allPosts: () => [] }
})

describe('buildDetailModel', () => {
  it('글 번호가 없거나 모르는 번호면 정적 HTML 예시 글(출첵!)', () => {
    const model = buildDetailModel({}, undefined, localBodyParts)
    expect(model.mode).toBe('reference')
    expect(model.title).toBe('출첵!')
    expect(model.authorView).toBe('34')
    expect(model.commentMode).toBe('reference')
    expect(buildDetailModel({}, '999999', localBodyParts).mode).toBe('reference')
  })

  it('시나리오 글: 말머리를 떼고, 저장된 댓글이 없으면 글의 댓글을 쓴다', () => {
    const model = buildDetailModel({}, '1', localBodyParts)
    expect(model.mode).toBe('scenario')
    expect(model.title).toBe('장거리 후기')
    expect(model.authorView).toBe('1,025')
    expect(model.bodyClasses).toEqual(['isScenarioPost'])
    expect(model.commentItems).toHaveLength(1)
    expect(model.latestItems[0]).toMatchObject({ text: '다른 글', postId: 2, comments: '7', hidden: false })
    expect(model.latestItems[1]?.hidden).toBe(true)
  })

  it('bbm.community.comments.<id> 에 저장된 댓글이 있으면 그것을 쓴다', () => {
    localStorage.setItem('bbm.community.comments.1', JSON.stringify([{ id: 'local-1', text: '저장된 댓글' }]))
    expect(buildDetailModel({}, '1', localBodyParts).commentItems[0]?.text).toBe('저장된 댓글')
  })

  it('공지 · 긴 공지 · 문의 글', () => {
    const notice = buildDetailModel({ type: 'notice' }, undefined, localBodyParts)
    expect(notice.isNotice).toBe(true)
    expect(notice.commentsDisabled).toBe(true)
    expect(notice.documentTitle).toBe('공지사항 | 보배드림 커뮤니티')
    const longNotice = buildDetailModel({}, '8303245', localBodyParts)
    expect(longNotice.mode).toBe('longNotice')
    expect(longNotice.title.startsWith('[안내]')).toBe(true)
    const inquiry = buildDetailModel({}, '8325190', localBodyParts)
    expect(inquiry.mode).toBe('inquiry')
    expect(inquiry.latestItems.map(item => item.postId)).toEqual([8325181, 8325147, 8325093])
  })

  it('글쓰기 저장본(?local=1): 서식·투표·임베드·구분선 순서 그대로', () => {
    localStorage.setItem('bbm.community.latestPost.v2', JSON.stringify({
      title: '로컬 글', submittedAt: '2025-11-04T01:00:00.000Z', board: '자유게시판', tags: '#가#나',
      html: '<p>첫 <b>굵게</b><script>x</script></p><h2>소제목</h2><hr><section class="editor-poll" data-poll=\'{"title":"투표","options":["가","나"]}\'></section><figure class="write-embed" data-embed-url="https://example.com/a"></figure>',
      embeds: [{ url: 'https://example.com/a', title: '기사' }],
    }))
    const model = buildDetailModel({ local: '1' }, String(Date.parse('2025-11-04T01:00:00.000Z')), localBodyParts)
    expect(model.mode).toBe('local')
    expect(model.boardLabel).toBe('자유')
    expect(model.tags).toEqual(['가', '나'])
    expect(model.bodyParts.map(part => part.kind)).toEqual(['copy', 'rule', 'poll', 'embed'])
    const copy = model.bodyParts[0] as Extract<typeof model.bodyParts[number], { kind: 'copy' }>
    expect(copy.lines[0]?.html).toBe('첫 <strong>굵게</strong>')
    expect(copy.lines[1]).toMatchObject({ tag: 'h3', html: '소제목' })
  })
})

describe('latestCommentCount', () => {
  it('reply 숫자가 있으면 그것, 없으면 댓글+답글 수', () => {
    expect(latestCommentCount({ id: 1, reply: 4 })).toBe(4)
    expect(latestCommentCount({ id: 1, comments: [{ id: 'a', replies: [{ id: 'b' }] }, { id: 'c' }] })).toBe(3)
  })
})
