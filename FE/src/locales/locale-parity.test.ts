import { describe, expect, it } from 'vitest'
import en from '../locales/en.json'
import vi from '../locales/vi.json'

describe('locale key parity', () => {
  it('en and vi have the same keys', () => {
    const enKeys = Object.keys(en).sort()
    const viKeys = Object.keys(vi).sort()
    expect(viKeys).toEqual(enKeys)
  })

  it('has no empty values', () => {
    for (const [key, value] of Object.entries(en)) {
      expect(value.trim().length, `en.${key}`).toBeGreaterThan(0)
    }
    for (const [key, value] of Object.entries(vi)) {
      expect(value.trim().length, `vi.${key}`).toBeGreaterThan(0)
    }
  })
})
