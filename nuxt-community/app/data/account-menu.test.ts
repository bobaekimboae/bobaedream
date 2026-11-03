import { describe, expect, it } from 'vitest'
import { accountGroups } from './account-menu'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'

describe('Shared account navigation contract', () => {
  it('keeps the reference group order and stable, unique action ids', () => {
    expect(accountGroups.map(g => g.id)).toEqual(['utilities', 'services', 'benefits', 'other'])
    const items = accountGroups.flatMap(g => g.items)
    expect(new Set(items.map(i => i.id)).size).toBe(items.length)
    expect(items.find(i => i.id === 'favorites')?.action).toBe('favorites')
  })
  it('ships the original SVG for every visible entry', () => {
    for (const item of accountGroups.flatMap(g => g.items)) {
      const svg = readFileSync(resolve(`public/icons/account/chotot-my-${item.icon}.svg`), 'utf8')
      expect(svg).toContain('<svg')
      expect(svg).not.toMatch(/<script|javascript:|\bonload=/i)
    }
  })
  it('preserves the bytes of every original Notion attachment', () => {
    const manifest = JSON.parse(readFileSync(resolve('public/icons/account/manifest.json'), 'utf8')) as { file: string; sha256: string }[]
    for (const entry of manifest) {
      const bytes = readFileSync(resolve('public/icons/account', entry.file))
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(entry.sha256)
    }
  })
})
