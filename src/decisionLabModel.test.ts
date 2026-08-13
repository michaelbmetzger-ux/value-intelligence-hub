import { describe, expect, it } from 'vitest'
import { calculateDecisionLabScenario } from './decisionLabModel'
import type { FinancialInputs, IndustryBenchmarkInputs } from './valuationModel'

const financials: FinancialInputs = {
  revenue: 2_000_000,
  ebitdaMargin: 18,
  normalizedEbitda: 500_000,
  recurringRevenue: 45,
  ownerPctRevenue: 45,
  topClientPct: 20,
  dso: 35,
  runway: 6,
  debt: 100_000,
  revenueGrowth: 6,
}

const benchmark: IndustryBenchmarkInputs = {
  name: 'Professional Services',
  revenueGrowth: 6,
  ebitdaMargin: 18,
  recurringRevenue: 45,
  ownerDependency: 45,
  topClientPct: 20,
  dso: 35,
  evEbitdaMultiple: 5,
}

const scores = [
  ['planning', 'Planning', 6],
  ['leadership', 'Leadership', 4],
  ['sales', 'Sales', 5],
  ['marketing', 'Marketing', 7],
  ['people', 'People', 6],
  ['operations', 'Operations', 5],
  ['finance', 'Finance', 8],
  ['legal', 'Legal', 7],
].map(([id, label, score]) => ({ id: String(id), label: String(label), currentScore: Number(score), proposedScore: Number(score) }))

describe('Decision Lab scenario model', () => {
  it('changes only the Value Engine scenario while preserving the industry-anchored method', () => {
    const scenario = calculateDecisionLabScenario({
      scores: scores.map((item) => item.id === 'leadership' || item.id === 'operations'
        ? { ...item, proposedScore: item.proposedScore + 2 }
        : item),
      financials,
      benchmark,
      dataQuality: 'actual',
    })

    expect(scenario.current.valueEngineScore).toBe(6)
    expect(scenario.proposed.valueEngineScore).toBe(6.5)
    expect(scenario.current.methodology.base).toBe(5)
    expect(scenario.proposed.methodology.base).toBe(5)
    expect(scenario.changedCategories.map((item) => item.id)).toEqual(['leadership', 'operations'])
    expect(scenario.proposed.enterpriseValue).toBeGreaterThan(scenario.current.enterpriseValue ?? 0)
    expect(scenario.enterpriseValueDelta).toBe(
      (scenario.proposed.enterpriseValue ?? 0) - (scenario.current.enterpriseValue ?? 0),
    )
  })

  it('clamps hypothetical category scores without mutating the evidence-supported baseline', () => {
    const original = structuredClone(scores)
    const scenario = calculateDecisionLabScenario({
      scores: scores.map((item) => item.id === 'planning' ? { ...item, currentScore: -4, proposedScore: 14 } : item),
      financials,
      benchmark,
      dataQuality: 'actual',
    })

    expect(scenario.scores.find((item) => item.id === 'planning')).toMatchObject({ currentScore: 0, proposedScore: 10 })
    expect(scores).toEqual(original)
  })

  it('keeps EV/EBITDA unavailable when normalized EBITDA is zero or negative', () => {
    const scenario = calculateDecisionLabScenario({
      scores: scores.map((item) => ({ ...item, proposedScore: 10 })),
      financials: { ...financials, normalizedEbitda: 0 },
      benchmark,
      dataQuality: 'actual',
    })

    expect(scenario.current.enterpriseValue).toBeNull()
    expect(scenario.proposed.enterpriseValue).toBeNull()
    expect(scenario.enterpriseValueDelta).toBeNull()
  })

  it('reports when the methodology ceiling prevents additional score-driven value', () => {
    const strongFinancials = {
      ...financials,
      revenue: 8_000_000,
      ebitdaMargin: 35,
      recurringRevenue: 95,
      ownerPctRevenue: 5,
      topClientPct: 2,
      dso: 5,
      revenueGrowth: 25,
    }
    const scenario = calculateDecisionLabScenario({
      scores: scores.map((item) => ({ ...item, currentScore: 9, proposedScore: 10 })),
      financials: strongFinancials,
      benchmark,
      dataQuality: 'actual',
    })

    expect(scenario.proposed.methodology.adjusted).toBe(scenario.proposed.methodology.ceiling)
    expect(scenario.ceilingLimited).toBe(true)
  })
})
