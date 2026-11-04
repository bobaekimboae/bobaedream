// 정적 목록 화면(naver-cafe-list.html · naver-discussion-feed.js)의 숫자 · 글자 다듬기 함수.

export function count(v: unknown): string {
  const n = Math.max(0, Number(v) || 0)
  if (n < 10000) return String(n)
  const m = Math.floor(n / 1000) / 10
  return (m % 1 === 0 ? String(m) : m.toFixed(1)) + '만'
}
export function countFull(v: unknown): string {
  return String(Math.max(0, Number(v) || 0))
}
export function viewCount(v: unknown): string {
  return Math.max(0, Number(v) || 0).toLocaleString('ko-KR')
}
/** 네이버 토론형 반응 숫자(천·만) */
export function metric(value: unknown): string {
  const number = Math.max(0, Number(value) || 0)
  if (number >= 10000) {
    const man = Math.floor(number / 1000) / 10
    return (man % 1 === 0 ? String(man) : man.toFixed(1)) + '만'
  }
  if (number >= 1000) {
    const thousand = Math.floor(number / 100) / 10
    return (thousand % 1 === 0 ? String(thousand) : thousand.toFixed(1)) + '천'
  }
  return String(number)
}
export function cleanTitle(value: unknown): string {
  return String(value || '').replace(/^\[[^\]]+\]\s*/, '')
}
export function postAgeMinutes(value: unknown): number {
  const text = String(value || '')
  if (text === '방금 전') return 0
  const match = text.match(/(\d+)\s*(분|시간|일|주|개월|년)\s*전/)
  if (!match) return Infinity
  const unit = ({ 분: 1, 시간: 60, 일: 1440, 주: 10080, 개월: 43200, 년: 525600 } as Record<string, number>)[match[2]!] || Infinity
  return Number(match[1]) * unit
}
export const popularPeriodLimits: Record<string, number> = { hour: 60, day: 1440, week: 10080, month: 43200, year: 525600, all: Infinity }
export const popularPeriodLabels: Record<string, string> = { hour: '지난 1시간', day: '지난 24시간', week: '지난 1주', month: '지난 1개월', year: '지난 1년', all: '전체 기간' }
export function categoryFor(post: { category?: string; title?: string }): string {
  return post.category || String(post.title || '').match(/^\[([^\]]+)\]/)?.[1] || '자유'
}
