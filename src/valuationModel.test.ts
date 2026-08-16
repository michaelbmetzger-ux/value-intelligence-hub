import { describe, expect, it } from 'vitest'
import {
  calculateIndustryAnchoredMultiple,
  calculateForecastAssumptions,
  calculateEnterpriseValue,
  calculateBearCaseMultiple,
  buildSensitivityMultiples,
  projectReducedPercentage,
  type FinancialInputs,
  type IndustryBenchmarkInputs,
} from './valuationModel'

const baseFinancials: FinancialInputs = {
  revenue: 1_000_000,
  ebitdaMargin: 18,
  normalizedEbitda: 180_000,
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

describe('industry-anchored valuation model', () => {
  it('anchors the base multiple to the selected industry benchmark instead of a generic VES-only formula', () => {
    const result = calculateIndustryAnchoredMultiple({
      financials: baseFinancials,
      benchmark,
      vesScore: 10,
      dataQuality: 'actual',
    })

    expect(result.base).toBe(5)
    expect(result.adjusted).toBeLessThan(7)
    expect(result.adjustments[0]).toMatchObject({ label: 'Industry benchmark', amount: 0 })
    expect(result.adjustments.map((item) => item.label)).toContain('Company size')
    expect(result.adjustments.map((item) => item.label)).toContain('Revenue growth')
    expect(result.adjustments.map((item) => item.label)).not.toContain('Debt load')
    expect(result.methodology[0]).toContain('starts with the Professional Services benchmark of 5.0x')
  })

  it('rewards strong company quality and discounts risk from owner dependency, concentration, and weak data', () => {
    const strong = calculateIndustryAnchoredMultiple({
      financials: {
        ...baseFinancials,
        ebitdaMargin: 28,
        recurringRevenue: 75,
        ownerPctRevenue: 20,
        topClientPct: 8,
        dso: 15,
        runway: 10,
        debt: 25_000,
      },
      benchmark,
      vesScore: 8.8,
      dataQuality: 'actual',
    })
    const risky = calculateIndustryAnchoredMultiple({
      financials: {
        ...baseFinancials,
        ebitdaMargin: 9,
        recurringRevenue: 10,
        ownerPctRevenue: 80,
        topClientPct: 45,
        dso: 70,
        runway: 2,
        debt: 700_000,
      },
      benchmark,
      vesScore: 4,
      dataQuality: 'demo',
    })

    expect(strong.adjusted).toBeGreaterThan(benchmark.evEbitdaMultiple)
    expect(risky.adjusted).toBeLessThan(benchmark.evEbitdaMultiple)
    expect(risky.adjustments.map((item) => item.label)).toContain('Data confidence')
    expect(risky.adjustments.map((item) => item.label)).toContain('Owner dependency')
    expect(risky.adjustments.map((item) => item.label)).toContain('Customer concentration')
  })

  it('uses explicit forecast assumptions for the upside case', () => {
    const assumptions = calculateForecastAssumptions({
      financials: baseFinancials,
      benchmark,
      months: 12,
    })

    expect(assumptions.revenueGrowthRate).toBeGreaterThan(0)
    expect(assumptions.revenueGrowthRate).toBeLessThanOrEqual(benchmark.revenueGrowth * 1.35)
    expect(assumptions.marginExpansion).toBeGreaterThan(0)
    expect(assumptions.recurringRevenueLift).toBeGreaterThan(0)
    expect(assumptions.ownerDependencyReduction).toBeGreaterThan(0)
  })

  it('never worsens an already-low percentage when forecasting a reduction', () => {
    expect(projectReducedPercentage(12, 2.5)).toBe(9.5)
    expect(projectReducedPercentage(3, 1)).toBe(2)
    expect(projectReducedPercentage(0.5, 1)).toBe(0)
  })

  it('marks EV/EBITDA as unavailable when normalized EBITDA is nonpositive', () => {
    expect(calculateEnterpriseValue(-100_000, 5)).toBeNull()
    expect(calculateEnterpriseValue(0, 5)).toBeNull()
    expect(calculateEnterpriseValue(180_000, 5)).toBe(900_000)
  })

  it('keeps the bear-case multiple independent of debt and cash risk signals', () => {
    const negativeAdjustments = [
      { label: 'Owner dependency', amount: -0.4, reason: 'Transferability risk.' },
      { label: 'Data confidence', amount: -0.3, reason: 'Partial inputs.' },
    ]

    expect(calculateBearCaseMultiple(5, 3, negativeAdjustments)).toBe(4.2)
    expect(calculateBearCaseMultiple(5, 3, [
      ...negativeAdjustments,
      { label: 'Debt pressure', amount: -5, reason: 'Capital structure item.' },
      { label: 'Cash runway', amount: -5, reason: 'Capital structure item.' },
    ])).toBe(4.2)
  })

  it('builds sensitivity multiples around the current case and includes the industry-specific ceiling', () => {
    expect(buildSensitivityMultiples(4.4, 7.5)).toEqual([3, 4, 4.4, 5, 6, 7, 7.5])
    expect(buildSensitivityMultiples(8.6, 10)).toContain(10)
  })

  it('keeps debt out of the enterprise-value multiple', () => {
    const lowDebt = calculateIndustryAnchoredMultiple({
      financials: { ...baseFinancials, debt: 0 },
      benchmark,
      vesScore: 7,
      dataQuality: 'actual',
    })
    const highDebt = calculateIndustryAnchoredMultiple({
      financials: { ...baseFinancials, debt: 2_000_000 },
      benchmark,
      vesScore: 7,
      dataQuality: 'actual',
    })

    expect(highDebt.adjusted).toBe(lowDebt.adjusted)
  })

  it('keeps cash runway out of the enterprise-value multiple', () => {
    const thinRunway = calculateIndustryAnchoredMultiple({
      financials: { ...baseFinancials, runway: 1, dso: 20 },
      benchmark,
      vesScore: 7,
      dataQuality: 'actual',
    })
    const longRunway = calculateIndustryAnchoredMultiple({
      financials: { ...baseFinancials, runway: 18, dso: 20 },
      benchmark,
      vesScore: 7,
      dataQuality: 'actual',
    })

    expect(longRunway.adjusted).toBe(thinRunway.adjusted)
    expect(longRunway.adjustments.map((item) => item.label)).not.toContain('Cash runway')
    expect(longRunway.adjustments.map((item) => item.label)).toContain('Collections speed')
  })

  it('reports only forecast improvements that can actually be applied', () => {
    const assumptions = calculateForecastAssumptions({
      financials: {
        ...baseFinancials,
        ebitdaMargin: 59.5,
        recurringRevenue: 99,
        ownerPctRevenue: 1,
        dso: 0,
        topClientPct: 0.5,
      },
      benchmark,
      months: 12,
    })

    expect(assumptions.marginExpansion).toBe(0.5)
    expect(assumptions.recurringRevenueLift).toBe(1)
    expect(assumptions.ownerDependencyReduction).toBe(1)
    expect(assumptions.dsoReduction).toBe(0)
    expect(assumptions.topClientReduction).toBe(0.5)
  })

  it('validates forecast horizons and reports exact realizable boundary changes', () => {
    expect(() => calculateForecastAssumptions({ financials: baseFinancials, benchmark, months: -1 })).toThrow('between 0 and 12')
    expect(() => calculateForecastAssumptions({ financials: baseFinancials, benchmark, months: 13 })).toThrow('between 0 and 12')

    const zero = calculateForecastAssumptions({ financials: baseFinancials, benchmark, months: 0 })
    expect(zero.marginExpansion).toBe(0)
    expect(zero.recurringRevenueLift).toBe(0)
    expect(zero.ownerDependencyReduction).toBe(0)
    expect(zero.dsoReduction).toBe(0)
    expect(zero.topClientReduction).toBe(0)

    const boundary = calculateForecastAssumptions({
      financials: {
        ...baseFinancials,
        ebitdaMargin: 59.94,
        recurringRevenue: 99.94,
        ownerPctRevenue: 0.06,
        dso: 0.06,
        topClientPct: 0.06,
      },
      benchmark,
      months: 12,
    })
    expect(boundary.marginExpansion).toBeCloseTo(0.06, 10)
    expect(boundary.recurringRevenueLift).toBeCloseTo(0.06, 10)
    expect(boundary.ownerDependencyReduction).toBeCloseTo(0.06, 10)
    expect(boundary.dsoReduction).toBeCloseTo(0.06, 10)
    expect(boundary.topClientReduction).toBeCloseTo(0.06, 10)
  })

  it('reconciles a quarter-point benchmark to the displayed one-decimal precision at the methodology floor', () => {
    const quarterPointBenchmark = { ...benchmark, evEbitdaMultiple: 3.75 }
    const result = calculateIndustryAnchoredMultiple({
      financials: {
        ...baseFinancials,
        revenue: 300_000,
        ebitdaMargin: 5,
        recurringRevenue: 0,
        ownerPctRevenue: 100,
        topClientPct: 100,
        dso: 90,
        runway: 0,
        revenueGrowth: -20,
      },
      benchmark: quarterPointBenchmark,
      vesScore: 0,
      dataQuality: 'demo',
    })

    const reconciled = result.base + result.adjustments.reduce((sum, item) => sum + item.amount, 0)
    expect(result.base).toBe(3.8)
    expect(reconciled).toBeCloseTo(result.adjusted, 10)
    expect(result.adjustments.map((item) => item.label)).toContain('Methodology floor')
  })

  it('reconciles visible adjustments to the final multiple when the methodology ceiling applies', () => {
    const result = calculateIndustryAnchoredMultiple({
      financials: {
        ...baseFinancials,
        revenue: 8_000_000,
        ebitdaMargin: 35,
        recurringRevenue: 95,
        ownerPctRevenue: 5,
        topClientPct: 3,
        dso: 5,
        runway: 18,
        debt: 0,
        revenueGrowth: 25,
      },
      benchmark,
      vesScore: 10,
      dataQuality: 'actual',
    })

    const reconciled = result.base + result.adjustments.reduce((sum, item) => sum + item.amount, 0)
    expect(result.adjusted).toBe(result.ceiling)
    expect(reconciled).toBeCloseTo(result.adjusted, 10)
    expect(result.adjustments.map((item) => item.label)).toContain('Methodology ceiling')
  })
})
