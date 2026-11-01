// 최근 검색어는 이 브라우저에만 둔다. 인기 검색어는 서버를 붙이면 Redis 순위로 바뀐다(지금은 예시).
const storageKey = 'bbm.nuxt-community.recent-searches.v1'
const limit = 8

export const trendingSearchSeed = ['겨울 시동', '엔진오일 교환 주기', '블랙박스', '아이오닉5 주행거리', '무상수리', '타이어 교체']

export function useSearchHistory() {
  const recent = useState<string[]>('community-recent-searches', () => [])

  function load() {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '[]')
      recent.value = Array.isArray(stored) ? stored.filter((item: unknown): item is string => typeof item === 'string').slice(0, limit) : []
    } catch { recent.value = [] }
  }
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(recent.value)) } catch { /* 저장 공간이 없으면 이번 화면에서만 기억한다 */ }
  }
  function add(query: string) {
    const value = query.trim()
    if (!value) return
    recent.value = [value, ...recent.value.filter(item => item !== value)].slice(0, limit)
    save()
  }
  function remove(query: string) {
    recent.value = recent.value.filter(item => item !== query)
    save()
  }
  function clear() {
    recent.value = []
    save()
  }
  return { recent, load, add, remove, clear }
}
