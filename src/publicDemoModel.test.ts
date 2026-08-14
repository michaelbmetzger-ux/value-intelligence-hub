import { describe, expect, it } from 'vitest'
import { calculatePublicDemoScenario, publicDemoImprovements } from './publicDemoModel'

describe('public Value Intelligence demo', () => {
  it('uses a fixed fictional company and leaves its baseline unchanged before a choice', () => {
    const result = calculatePublicDemoScenario([])

    expect(result.scenario.changedCategories).toHaveLength(0)
    expect(result.scenario.proposed.enterpriseValue).toBe(result.scenario.current.enterpriseValue)
    expect(result.financials.normalizedEbitda).toBeGreaterThan(0)
    expect(result.companyName).toContain('Sample')
  })

  it('turns a selected improvement into an evidence-gated scenario', () => {
    const result = calculatePublicDemoScenario(['leadership'])
    const leadership = result.scenario.scores.find((item) => item.id === 'leadership')

    expect(leadership?.proposedScore).toBeGreaterThan(leadership?.currentScore ?? 0)
    expect(result.scenario.enterpriseValueDelta).toBeGreaterThan(0)
    expect(result.selectedImprovements[0]?.evidence.length).toBeGreaterThan(0)
  })

  it('limits the public experience to two valid, unique improvements', () => {
    const result = calculatePublicDemoScenario(['leadership', 'leadership', 'invalid', 'operations', 'finance'])

    expect(result.selectedImprovements.map((item) => item.id)).toEqual(['leadership', 'operations'])
    expect(result.scenario.changedCategories).toHaveLength(2)
  })

  it('offers only leadership, operations, and finance choices', () => {
    expect(publicDemoImprovements.map((item) => item.id)).toEqual(['leadership', 'operations', 'finance'])
  })
})
