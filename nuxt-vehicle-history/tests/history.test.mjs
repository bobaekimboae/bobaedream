import test from 'node:test'
import assert from 'node:assert/strict'
import { acceptReport, buildHistory, countState, makeRequest, mileageSummary, normalizeOwner, numeric, readRecent, timeline, validateLookup } from '../app/lib/history.ts'

const input = { plate: '12가 3456', mode: 'dealer', owner: '전송하면 안 되는 값', consent: true }
test('dealer and owner preserve the staging request contract without leaking owner data', () => {
  const body = makeRequest(input, 'test-consent')
  assert.deepEqual(body, { plate: '12가3456', consentId: 'test-consent', purpose: 'USED_CAR_DEALER_LISTING_CHECK', molitLookupType: 'SALE_VEHICLE_OR_OWNER_UNCONSENTED' })
  const owner = makeRequest({ ...input, mode: 'owner', owner: '  주식회사 3M 모터스(서울)  ' }, 'test-consent')
  assert.equal(owner.owner, '주식회사 3M 모터스(서울)')
  assert.equal(owner.purpose, 'OWNER_VERIFIED_HISTORY_CHECK')
  assert.equal(owner.molitLookupType, 'OWNER_CONSENTED_OR_SELF')
  assert.equal(normalizeOwner('법인  123(주)'), '법인 123(주)')
})
test('invalid plate, missing owner and absent consent do not generate a request', () => {
  for (const item of [{ ...input, plate: '' }, { ...input, consent: false }, { ...input, mode: 'owner', owner: '' }]) assert.throws(() => makeRequest(item, 'test'))
  assert.equal(validateLookup({ ...input, plate: '서울12가3456' }), '')
})
test('unknown strings, blank, negative and non-finite values are not normal zero counts', () => {
  for (const x of [null, undefined, '', 'unknown', NaN, Infinity, -1, {}, false]) assert.equal(numeric(x), null)
  assert.equal(numeric('12,345'), 12345)
  assert.equal(countState('unknown'), 'unknown')
  assert.equal(countState(0), 'ok')
  assert.equal(countState(false), 'ok')
})
test('all nineteen cards remain unknown for a completely missing payload', () => {
  const items = buildHistory({})
  assert.equal(items.length, 19)
  assert.ok(items.every(x => x.state === 'unknown'))
  assert.equal(new Set(items.map(x => x.id)).size, 19)
})
test('partial special-accident and dealer/auction values do not become all-clear', () => {
  const cards = buildHistory({ insurance: { flood: false }, registration: { dealerHistory: { activeCount: 0 } } })
  assert.equal(cards.find(x => x.id === 'special').state, 'unknown')
  assert.equal(cards.find(x => x.id === 'dealer').state, 'unknown')
  assert.equal(buildHistory({ insurance: { flood: true } }).find(x => x.id === 'special').state, 'warn')
  assert.equal(buildHistory({ insurance: { flood: false, theft: false, totalLoss: false } }).find(x => x.id === 'special').state, 'ok')
  assert.equal(buildHistory({ registration: { manufacturerWarranty: { hasHistory: true } } }).find(x => x.id === 'warranty').state, 'ok')
})
test('mileage checks require comparable dated records and detect decreasing mileage', () => {
  assert.equal(mileageSummary({}).state, 'unknown')
  assert.equal(mileageSummary({ vehicle: { mileage: 1000 } }).state, 'unknown')
  assert.equal(mileageSummary({ registration: { mileageHistory: [{ date: '20250101', mileage: 1000 }, { date: '2026-01-01', mileage: 900 }] } }).state, 'warn')
  assert.equal(mileageSummary({ registration: { mileageHistory: [{ date: '2025-01-01', mileage: 1000 }, { date: '2026-01-01', mileage: 2000 }] } }).state, 'ok')
  assert.equal(mileageSummary({ registration: { mileageHistory: [{ date: '20250101', mileage: 1000 }, { date: '2025-12-01', mileage: 2000 }] } }).state, 'ok')
})
test('empty, malformed, and complete-provider-failure replies cannot be displayed as a successful report', () => {
  for (const v of [{}, [], null, { vehicle: 'bad' }, { vehicle: { name: 'test' }, registration: { timeline: [null] } }, { vehicle: { name: 'test' }, sourceStatus: { molit: 'failed', carHistory: 'failed' } }]) assert.throws(() => acceptReport(v))
})
test('partial provider failures discard stale affected records and retain successful results', () => {
  const result = acceptReport({ vehicle: { name: 'test' }, insurance: { accidentCount: 0 }, registration: { ownerChangeCount: 2 }, sourceStatus: { carHistory: 'failed', molit: 'success' } })
  assert.equal(result.insurance, undefined)
  assert.equal(result.registration.ownerChangeCount, 2)
  assert.equal(buildHistory(result).find(x => x.id === 'accidents').state, 'unknown')
  assert.equal(acceptReport({ registration: { ownerChangeCount: 2 }, sourceStatus: { carHistory: 'failed' } }).registration.ownerChangeCount, 2)
})
test('broken browser storage is safe and owner names and extraneous fields are never retained', () => {
  assert.deepEqual(readRecent('{bad json'), [])
  assert.deepEqual(readRecent('{}'), [])
  const rows = readRecent(JSON.stringify([{ plate: '12가3456', name: '<img src=x>', date: '2026-11-04', owner: 'secret' }]))
  assert.equal(rows[0].owner, undefined)
  assert.equal(rows[0].name, '<img src=x>') // Vue renders this as text, never v-html.
})
test('timeline keeps every record instead of silently truncating to thirty', () => {
  assert.equal(timeline({ registration: { timeline: Array.from({length:40}, (_,i) => ({ date: `2026-01-${String(i%28+1).padStart(2,'0')}`, title: `record ${i}` })) } }).length, 40)
})
