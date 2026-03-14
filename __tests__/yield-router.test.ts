import { describe, it, expect } from 'vitest'
import { pickBestYieldSource } from '@/lib/yield-router'

describe('pickBestYieldSource', () => {
  it('returns jupiter when jupiter APY is higher', () => {
    expect(pickBestYieldSource(0.08, 0.05)).toBe('jupiter')
  })
  it('returns voltr when voltr APY is higher', () => {
    expect(pickBestYieldSource(0.05, 0.08)).toBe('voltr')
  })
  it('returns jupiter when equal (default)', () => {
    expect(pickBestYieldSource(0.05, 0.05)).toBe('jupiter')
  })
  it('returns jupiter when voltr APY is null', () => {
    expect(pickBestYieldSource(0.05, null)).toBe('jupiter')
  })
})
