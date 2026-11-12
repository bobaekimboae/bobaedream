import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRuntimeConfig, useState } from '#imports'
import { acceptReport, makeRequest, normalizePlate, readRecent, RECENT_KEY, validateLookup } from '../lib/history.ts'
import type { HistoryReport, LookupInput, Recent } from '../lib/history.ts'

export function useVehicleHistory() {
  const config = useRuntimeConfig()
  const report = ref<HistoryReport | null>(null)
  const loading = ref(false)
  const error = ref('')
  const storageNotice = ref('')
  const recent = useState<Recent[]>('vehicle-history:recent', () => [])
  let controller: AbortController | null = null
  let sequence = 0
  onMounted(() => {
    try { recent.value = readRecent(localStorage.getItem(RECENT_KEY)) }
    catch { storageNotice.value = '이 브라우저에서는 최근 검색이력을 저장할 수 없습니다.' }
  })
  function persist() {
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(recent.value)) }
    catch { storageNotice.value = '최근 검색이력 저장이 제한되어도 현재 조회 결과는 확인할 수 있습니다.' }
  }
  function cancel() { sequence++; controller?.abort(); controller = null; loading.value = false }
  onBeforeUnmount(cancel)
  function reset() { cancel(); report.value = null; error.value = '' }
  async function lookup(input: LookupInput) {
    if (loading.value) return false
    error.value = validateLookup(input)
    if (error.value) return false
    const endpoint = String(config.public.historyApiUrl || '')
    if (!endpoint) { error.value = '차량이력 API가 설정되지 않았습니다.'; return false }
    const request = makeRequest(input, crypto.randomUUID())
    const token = ++sequence
    controller = new AbortController()
    const signal = controller.signal
    let timedOut = false
    const timer = setTimeout(() => { timedOut = true; controller?.abort() }, 45000)
    loading.value = true; report.value = null
    try {
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(request), signal,
      })
      if (!response.headers.get('content-type')?.toLowerCase().includes('application/json')) throw new Error('조회 서버의 응답 형식이 올바르지 않습니다.')
      const value: unknown = await response.json()
      if (!response.ok) {
        const body = value && typeof value === 'object' ? value as Record<string, unknown> : {}
        const messages: Record<string, string> = {
          INVALID_PLATE: '차량번호를 확인해주세요.', INVALID_OWNER: input.mode === 'dealer' ? '현재 번호판만으로 조회할 수 없습니다. 소유자 확인 조회를 선택해주세요.' : '소유자 정보를 확인해주세요.',
          OWNER_MISMATCH: '차량번호와 소유자명이 일치하지 않습니다.',
          PROVIDER_UNAVAILABLE: '조회 기관에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
        }
        throw new Error(response.status === 401 || response.status === 403 ? '로그인 또는 차량 조회 권한을 확인해주세요.' : messages[String(body.code)] || '차량 정보를 조회하지 못했습니다. 잠시 후 다시 시도해주세요.')
      }
      const data = acceptReport(value)
      if (sequence !== token) return false
      report.value = { ...data, plate: request.plate, lookupMode: input.mode }
      const vehicle = data.vehicle || {}
      const name = vehicle.name || [vehicle.manufacturer, vehicle.model, vehicle.trim || vehicle.trimName].filter(Boolean).join(' ') || '차량정보'
      recent.value = [{ plate: request.plate, name, grade: data.risk?.grade || data.grade || data.riskGrade || '—', mode: input.mode, date: new Date().toLocaleDateString('ko-KR') }, ...recent.value.filter(x => normalizePlate(x.plate) !== request.plate)].slice(0, 10)
      persist()
      return true
    } catch (cause) {
      if (sequence !== token) return false
      error.value = timedOut ? '조회 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.' : signal.aborted ? '조회가 취소되었습니다.' : cause instanceof TypeError ? '조회 서버에 연결할 수 없습니다. 네트워크와 API 연결을 확인해주세요.' : cause instanceof Error ? cause.message : '조회 중 오류가 발생했습니다.'
      return false
    } finally {
      clearTimeout(timer)
      if (sequence === token) { loading.value = false; controller = null }
    }
  }
  function clearRecent() { recent.value = []; persist() }
  return { report, loading, error, recent, storageNotice, lookup, reset, clearRecent }
}
