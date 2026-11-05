import { describe, expect, it } from 'vitest'
import { POST_TYPES, fieldVisible, withObject, postTypeById, postTypeProblem, postTypeSummary } from './postTypes'

const ctx = { bodyLength: 40, photos: 1 }

describe('withObject', () => {
  it('받침에 맞춘다', () => {
    expect(withObject('분류')).toBe('분류를')
    expect(withObject('차종')).toBe('차종을')
    expect(withObject('EV6')).toBe('EV6을(를)')
  })
})

describe('글 종류(동처띠식 특수 글쓰기)', () => {
  it('목록 첫 칸은 일반이고, 모르는 값은 일반으로 돌아간다', () => {
    expect(POST_TYPES[0]!.id).toBe('normal')
    expect(postTypeById('nope').id).toBe('normal')
  })

  it('일반 글은 따로 막는 조건이 없다', () => {
    expect(postTypeProblem(postTypeById('normal'), {}, { bodyLength: 0, photos: 0 })).toBe('')
  })

  it('차량 리뷰: 필수 칸 → 별점 다섯 항목 → 본문 30자 순서로 알려 준다', () => {
    const review = postTypeById('review')
    expect(postTypeProblem(review, {}, ctx)).toBe('차종을 입력해 주세요.')
    const base = { car: '현대 아이오닉 5', owner: '오너예요' }
    expect(postTypeProblem(review, { ...base, score: { 디자인: 5 } }, ctx)).toBe('항목별 별점을 입력해 주세요.')
    const score = { 디자인: 5, 주행: 4, 편의: 4, 연비: 5, 가성비: 3 }
    expect(postTypeProblem(review, { ...base, score }, { bodyLength: 12, photos: 0 })).toContain('30자 이상')
    expect(postTypeProblem(review, { ...base, score }, ctx)).toBe('')
    expect(postTypeSummary(review, { ...base, score })).toContain('항목별 별점 평균 4.2')
  })

  it('연비 · 전비: 전기를 고르면 전비 칸만 필수가 된다', () => {
    const fuel = postTypeById('fuel')
    const electric = fuel.fields.find(field => field.key === 'electric')!
    const efficiency = fuel.fields.find(field => field.key === 'efficiency')!
    expect(fieldVisible(electric, { power: '전기' })).toBe(true)
    expect(fieldVisible(efficiency, { power: '전기' })).toBe(false)
    expect(postTypeProblem(fuel, { car: 'EV6', power: '전기' }, ctx)).toBe('전비를 입력해 주세요.')
    expect(postTypeProblem(fuel, { car: 'EV6', power: '전기', electric: '5.8' }, ctx)).toBe('')
  })

  it('내 차 팔기는 사진 1장 이상, 구매가는 차량가 절반 미만이면 막는다', () => {
    const sell = postTypeById('sell')
    const values = { car: 'BMW 520i', registered: '2022-03', mileage: '32000', price: '4200', region: '서울' }
    expect(postTypeProblem(sell, values, { bodyLength: 10, photos: 0 })).toBe('사진을 1장 이상 넣어 주세요.')
    const price = postTypeById('price')
    const paid = { car: 'GV80', listPrice: '7000', bought: '2026-10' }
    expect(postTypeProblem(price, { ...paid, paidPrice: '3000' }, ctx)).toContain('절반')
    expect(postTypeProblem(price, { ...paid, paidPrice: '6600' }, ctx)).toBe('')
  })
})
