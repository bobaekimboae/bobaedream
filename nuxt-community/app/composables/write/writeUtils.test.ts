import { describe, expect, it } from 'vitest'
import { boardGroups, canSubmit, dateOptions, deadlineDefaults, legacyFontFamily, legacyFontPx, parseTags, pollApplyDisabled, resolveReturnTo, tagSummary } from './writeUtils'

describe('글쓰기 계산(정적 판 chzzk-write.js 와 같은 규칙)', () => {
  it('주소 게시판이 목록에 없으면 「현재 게시판」을 맨 위에 둔다', () => {
    expect(boardGroups('F1')[0]).toEqual({ section: '현재 게시판', items: ['F1'] })
    expect(boardGroups('자유게시판')[0]!.section).toBe('보배드림 커뮤니티')
  })

  it('돌아갈 주소: 목록만 받고 그 밖은 목록 첫 화면', () => {
    expect(resolveReturnTo('')).toBe('/')
    expect(resolveReturnTo('/bobaedream/community/naver-cafe-list.html?board=free')).toBe('/?board=free')
    expect(resolveReturnTo('/?board=f1')).toBe('/?board=f1')
    expect(resolveReturnTo('/bobaedream/nuxt-community/#/?board=f1')).toBe('/?board=f1')
    expect(resolveReturnTo('https://evil.example/')).toBe('/')
    expect(resolveReturnTo('//evil.example/')).toBe('/')
    expect(resolveReturnTo('/write?x=1')).toBe('/')
  })

  it('태그: # 로 나누고 중복 제거, 최대 10개', () => {
    expect(parseTags('#자동차 #드라이브 #자동차')).toEqual(['자동차', '드라이브'])
    expect(parseTags(Array.from({ length: 12 }, (_, i) => `#t${i}`).join(' '))).toHaveLength(10)
    expect(tagSummary([])).toBe('#태그 입력 (#으로 구분, 최대 10개)')
    expect(tagSummary(['a', 'b'])).toBe('#a #b')
  })

  it('글자 크기 · 글꼴은 정적 판 <font size> 단계와 같다', () => {
    expect([13, 15, 17, 20, 24].map(legacyFontPx)).toEqual(['16px', '16px', '16px', '18px', '24px'])
    expect(legacyFontFamily('system')).toBe('sans-serif')
    expect(legacyFontFamily('Nanum Gothic')).toBe('Nanum Gothic')
  })

  it('투표: 제목 · 2개 이상 · 빈 항목 없음일 때만 확인', () => {
    expect(pollApplyDisabled('', [{ text: 'a', image: '' }, { text: 'b', image: '' }])).toBe(true)
    expect(pollApplyDisabled('t', [{ text: 'a', image: '' }])).toBe(true)
    expect(pollApplyDisabled('t', [{ text: 'a', image: '' }, { text: ' ', image: '' }])).toBe(true)
    expect(pollApplyDisabled('t', [{ text: 'a', image: '' }, { text: 'b', image: '' }])).toBe(false)
  })

  it('투표 종료 기본값: 지난 시각이면 하루 뒤, 분은 5분 단위', () => {
    const now = new Date(2026, 10, 4, 10, 7).getTime()
    expect(deadlineDefaults('', now)).toEqual({ year: 2026, month: 11, day: 5, hour: 10, minute: 10 })
    expect(dateOptions(1, 3, '월').map(o => o.label)).toEqual(['01월', '02월', '03월'])
  })

  it('등록 가능: 게시판 · 제목 · 내용(글 · 사진 · 영상 · 임베드 · 투표 중 하나)', () => {
    const base = { board: '자유게시판', title: '제목', text: '', photos: 0, videos: 0, embeds: 0, polls: 0 }
    expect(canSubmit(base)).toBe(false)
    expect(canSubmit({ ...base, text: '본문' })).toBe(true)
    expect(canSubmit({ ...base, polls: 1 })).toBe(true)
    expect(canSubmit({ ...base, board: '', text: '본문' })).toBe(false)
  })
})
