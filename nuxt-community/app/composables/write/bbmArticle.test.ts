// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { buildArticlePayload, pendingUploads, pollDays, type Uploaded } from './bbmArticle'

const poll = { title: '어떤 차', options: ['세단', 'SUV', ''], images: ['data:image/jpeg;base64,AAA', '', ''], multiple: true, anonymous: true, visibility: 'after_vote', endsAt: '' }
const html = [
  '<p>본문 <strong>굵게</strong></p>',
  '<figure class="write-media" data-media-id="photo_1" data-kind="photo"><img src="blob:a" alt="a.jpg"><figcaption style="text-align:center">첫 사진</figcaption></figure>',
  '<figure class="write-media" data-media-id="video_1" data-kind="video"><video src="blob:v" controls="true" playsinline="true" poster="data:image/jpeg;base64,PP"></video></figure>',
  `<section class="editor-poll" data-poll='${JSON.stringify(poll)}'></section>`,
  '<p data-placeholder="x"></p>',
].join('')

describe('pendingUploads', () => {
  it('사진 · 동영상 · 대표 이미지 · 투표 사진을 한 번씩', () => {
    expect(pendingUploads(html).map(item => [item.role, item.key, item.alt])).toEqual([
      ['image', 'blob:a', '첫 사진'],
      ['video', 'blob:v', ''],
      ['poster', 'data:image/jpeg;base64,PP', ''],
      ['poll', 'data:image/jpeg;base64,AAA', ''],
    ])
  })
})

describe('buildArticlePayload', () => {
  const up = new Map<string, Uploaded>([
    ['blob:a', { upload_id: 11, url: 'https://file9.bobaedream.co.kr/a.jpg' }],
    ['blob:v', { upload_id: 12, url: 'https://file9.bobaedream.co.kr/v.mp4' }],
    ['data:image/jpeg;base64,PP', { upload_id: 13, url: 'https://file9.bobaedream.co.kr/p.jpg' }],
    ['data:image/jpeg;base64,AAA', { upload_id: 14, url: 'https://file9.bobaedream.co.kr/o.jpg' }],
  ])
  const payload = buildArticlePayload({ html, title: ' 제목 ', boardCode: 'free', summary: ['질문', '분류 정비'] }, up)

  it('보배드림 등록 형식', () => {
    expect(payload).toMatchObject({ board_code: 'free', category_id: null, title: '제목', type: 'poll', link_url: null, draft_id: null })
    expect(payload.media).toEqual([
      { upload_id: 11, sort_order: 0, alt: '첫 사진' },
      { upload_id: 12, sort_order: 1, thumbnail_upload_id: 13 },
    ])
    expect(payload.poll).toEqual({ selection_type: 'multiple', duration_days: 1, result_visibility: 'voters_only', options: [{ label: '세단', upload_id: 14, sort_order: 0 }, { label: 'SUV', upload_id: null, sort_order: 1 }] })
  })
  it('본문 주소를 서버 주소로 바꾸고 투표 카드는 뺀다', () => {
    const c = payload.content || ''
    expect(c).toContain('src="https://file9.bobaedream.co.kr/a.jpg"')
    expect(c).toContain('<video src="https://file9.bobaedream.co.kr/v.mp4" data-type="community-video"')
    expect(c).toContain('poster="https://file9.bobaedream.co.kr/p.jpg"')
    expect(c).not.toContain('blob:')
    expect(c).not.toContain('editor-poll')
    expect(c.startsWith('<p>질문 · 분류 정비</p>')).toBe(true)
    expect(c).not.toContain('data-media-id')
    expect(c.endsWith('<p></p>')).toBe(false)
  })
  it('투표 없으면 normal, 빈 본문이면 null', () => {
    const p = buildArticlePayload({ html: '<p></p>', title: 't', boardCode: 'free' }, new Map())
    expect(p.type).toBe('normal')
    expect(p.content).toBeNull()
  })
})

describe('pollDays', () => {
  it('1~7일', () => {
    const now = Date.parse('2026-11-05T00:00:00Z')
    expect(pollDays('', now)).toBe(1)
    expect(pollDays('2026-11-08T00:00:00Z', now)).toBe(3)
    expect(pollDays('2026-12-30T00:00:00Z', now)).toBe(7)
  })
})
