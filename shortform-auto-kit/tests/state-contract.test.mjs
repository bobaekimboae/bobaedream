import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const contract = JSON.parse(await readFile(new URL('../shared/contracts/state-model.json', import.meta.url), 'utf8'))

test('render flow has the required four main stages', () => {
  for (const state of ['queued', 'analyzing', 'rendering', 'completed']) {
    assert.ok(contract.render.states.includes(state))
  }
})

test('publishing is gated by human approval and sold-state blocking', () => {
  assert.ok(contract.invariants.includes('publish requires approval=approved'))
  assert.ok(contract.invariants.includes('sold listing blocks scheduled and publishing'))
})

test('idempotency contract rejects payload changes for the same key', () => {
  assert.equal(contract.idempotency.header, 'Idempotency-Key')
  assert.equal(contract.idempotency.same_key_different_payload, '409 IDEMPOTENCY_CONFLICT')
  assert.equal(contract.idempotency.ttl_hours, 24)
})

test('channel publishing is tracked independently', () => {
  assert.ok(contract.invariants.includes('channel publish states are independent'))
})

