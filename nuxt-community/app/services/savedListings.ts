import type { DemoVehicle } from './accountDemo'

export const savedLimit = 100
export type SavedTab = 'ad' | 'video' | 'post'
export function savedTab(value: unknown): SavedTab { return value === 'video' || value === 'post' ? value : 'ad' }

/** A session row remains visible after unlike, as on the captured Chotot page. */
export function toggleSaved(rows: DemoVehicle[], vehicle: DemoVehicle): DemoVehicle[] {
  if (rows.some(row => row.id === vehicle.id)) return rows.filter(row => row.id !== vehicle.id)
  if (rows.length >= savedLimit) throw new Error('관심 매물은 최대 100개까지 저장할 수 있습니다.')
  return [structuredClone(vehicle), ...rows]
}

export function savedVehicleUrl(vehicle: DemoVehicle, origin: string, base: string, desktop?: boolean) {
  const root = new URL(base, origin)
  const target = new URL(vehicle.url, root)
  if (target.origin !== root.origin || !['https:', 'http:'].includes(target.protocol)) throw new Error('매물 주소를 확인해 주세요.')
  if (desktop === true) target.searchParams.set('pc', '1')
  if (desktop === false) target.searchParams.delete('pc')
  target.searchParams.delete('accountListing')
  target.searchParams.set('accountListing', vehicle.id)
  return target.href
}
