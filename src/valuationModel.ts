export type DataQuality = 'demo' | 'partial' | 'actual'

export type FinancialInputs = {
  revenue: number
  ebitdaMargin: number
  normalizedEbitda: number
  recurringRevenue: number
  ownerPctRevenue: number
  topClientPct: number
  dso: number
  runway: number
  debt: number
  revenueGrowth?: number
}

export type IndustryBenchmarkInputs = {
  name: string
  revenueGrowth: number
  ebitdaMargin: number
  recurringRevenue: number
  ownerDependency: number
  topClientPct: number
  dso: number
  evEbitdaMultiple: number
}

export type MultipleAdjustment = {
  label: string
  amount: number
  reason: string
}

export type MultipleMethodology = {
  base: number
  adjusted: number
  floor: number
  ceiling: number
  adjustments: MultipleAdjustment[]
  methodology: string[]
}

export type ForecastAssumptions = {
  revenueGrowthRate: number
  marginExpansion: number
  recurringRevenueLift: number
  ownerDependencyReduction: number
  dsoReduction: number
  topClientReduction: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function roundTenth(value: number) {
  return Math.round(value * 10) / 10
}

export function projectReducedPercentage(current: number, reduction: number) {
  return clamp(current - reduction, 0, 100)
}

export function calculateEnterpriseValue(normalizedEbitda: number, multiple: number) {
  if (normalizedEbitda <= 0 || multiple <= 0) return null
  return normalizedEbitda * multiple
}

export function calculateBearCaseMultiple(
  currentMultiple: number,
  floor: number,
  adjustments: MultipleAdjustment[],
) {
  const companyRiskCount = adjustments.filter((item) => item.amount < 0 && !['Debt pressure', 'Cash runway'].includes(item.label)).length
  return roundTenth(clamp(currentMultiple - 0.55 - companyRiskCount * 0.12, floor, currentMultiple))
}

export function buildSensitivityMultiples(currentMultiple: number, targetMultiple: number) {
  const values = new Set<number>([roundTenth(currentMultiple), roundTenth(targetMultiple)])
  const start = Math.max(1, Math.floor(currentMultiple) - 1)
  const end = Math.ceil(targetMultiple)
  for (let multiple = start; multiple <= end; multiple += 1) values.add(multiple)
  return [...values].filter((multiple) => multiple <= targetMultiple).sort((a, b) => a - b)
}

function addAdjustment(
  adjustments: MultipleAdjustment[],
  label: string,
  amount: number,
  reason: string,
) {
  const rounded = roundTenth(amount)
  if (Math.abs(rounded) < 0.05) return
  adjustments.push({ label, amount: rounded, reason })
}

export function calculateIndustryAnchoredMultiple({
  financials,
  benchmark,
  vesScore,
  dataQuality,
}: {
  financials: FinancialInputs
  benchmark: IndustryBenchmarkInputs
  vesScore: number
  dataQuality: DataQuality
}): MultipleMethodology {
  const base = roundTenth(benchmark.evEbitdaMultiple)
  const adjustments: MultipleAdjustment[] = [
    {
      label: 'Industry benchmark',
      amount: 0,
      reason: `Starts with the selected ${benchmark.name} EV/EBITDA benchmark.`,
    },
  ]

  const sizeAdjustment = financials.revenue >= 5_000_000
    ? 0.4
    : financials.revenue >= 2_000_000
      ? 0.2
      : financials.revenue < 500_000
        ? -0.3
        : financials.revenue < 1_000_000
          ? -0.1
          : 0
  adjustments.push({
    label: 'Company size',
    amount: sizeAdjustment,
    reason: sizeAdjustment > 0
      ? 'Greater scale can improve marketability and buyer financing options.'
      : sizeAdjustment < 0
        ? 'Smaller scale can narrow the buyer pool and increase key-person sensitivity.'
        : 'Company scale is within the model’s neutral marketability band.',
  })

  const growthAdjustment = financials.revenueGrowth == null
    ? 0
    : clamp((financials.revenueGrowth - benchmark.revenueGrowth) / 15, -0.5, 0.5)
  adjustments.push({
    label: 'Revenue growth',
    amount: roundTenth(growthAdjustment),
    reason: financials.revenueGrowth == null
      ? 'Reliable trailing growth data is not available, so the model applies no growth premium or discount.'
      : financials.revenueGrowth >= benchmark.revenueGrowth
        ? 'Revenue growth meets or exceeds the selected industry baseline.'
        : 'Revenue growth trails the selected industry baseline.',
  })

  addAdjustment(
    adjustments,
    'Value Engine quality',
    (vesScore - 6) * 0.22,
    vesScore >= 6
      ? 'Transferability, systems, leadership, and durability support a premium.'
      : 'Lower transferability and business quality reduce buyer confidence.',
  )

  addAdjustment(
    adjustments,
    'EBITDA margin',
    clamp((financials.ebitdaMargin - benchmark.ebitdaMargin) / 10, -0.6, 0.6),
    financials.ebitdaMargin >= benchmark.ebitdaMargin
      ? 'Profitability is above the selected industry baseline.'
      : 'Profitability trails the selected industry baseline.',
  )

  addAdjustment(
    adjustments,
    'Recurring revenue',
    clamp((financials.recurringRevenue - benchmark.recurringRevenue) / 45, -0.6, 0.6),
    financials.recurringRevenue >= benchmark.recurringRevenue
      ? 'More repeatable revenue improves forecast confidence.'
      : 'Less repeatable revenue lowers forecast confidence.',
  )

  addAdjustment(
    adjustments,
    'Owner dependency',
    clamp((benchmark.ownerDependency - financials.ownerPctRevenue) / 45, -0.8, 0.7),
    financials.ownerPctRevenue <= benchmark.ownerDependency
      ? 'Lower owner dependency improves transferability.'
      : 'Higher owner dependency creates transferability risk.',
  )

  addAdjustment(
    adjustments,
    'Customer concentration',
    clamp((benchmark.topClientPct - financials.topClientPct) / 35, -0.6, 0.5),
    financials.topClientPct <= benchmark.topClientPct
      ? 'Lower top-client concentration reduces revenue risk.'
      : 'Higher top-client concentration increases buyer risk.',
  )

  addAdjustment(
    adjustments,
    'Collections speed',
    clamp((benchmark.dso - financials.dso) / 80, -0.4, 0.35),
    financials.dso <= benchmark.dso
      ? 'Collections are tighter than the industry baseline.'
      : 'Slower collections can reduce cash quality and buyer confidence.',
  )


  addAdjustment(
    adjustments,
    'Data confidence',
    dataQuality === 'actual' ? 0 : dataQuality === 'partial' ? -0.25 : -0.55,
    dataQuality === 'actual'
      ? 'Current reports support higher confidence in the valuation model.'
      : dataQuality === 'partial'
        ? 'Some inputs are still estimated or manually confirmed.'
        : 'Demo or missing source data requires a valuation confidence discount.',
  )

  const subtotal = adjustments.reduce((sum, item) => sum + item.amount, base)
  const floor = Math.max(1.5, base - 2)
  const ceiling = Math.min(10, base + 2.5)
  const adjusted = roundTenth(clamp(subtotal, floor, ceiling))
  const boundaryAdjustment = roundTenth(adjusted - subtotal)

  if (boundaryAdjustment !== 0) {
    adjustments.push({
      label: boundaryAdjustment < 0 ? 'Methodology ceiling' : 'Methodology floor',
      amount: boundaryAdjustment,
      reason: boundaryAdjustment < 0
        ? `Caps the modeled premium at ${ceiling.toFixed(1)}x to avoid overstating precision or buyer appetite.`
        : `Maintains a ${floor.toFixed(1)}x floor while clearly reflecting the identified company risks.`,
    })
  }

  return {
    base,
    adjusted,
    floor,
    ceiling,
    adjustments,
    methodology: [
      `The valuation starts with the ${benchmark.name} benchmark of ${base.toFixed(1)}x normalized EBITDA.`,
      'The app then adjusts that benchmark up or down for the company-specific facts a buyer would care about.',
      'The adjustment categories are company size, revenue growth, profitability, recurring revenue, owner dependency, customer concentration, collections speed, data confidence, and the Value Engine score.',
      `The final model multiple is ${adjusted.toFixed(1)}x after applying those adjustments.`,
    ],
  }
}

export function calculateForecastAssumptions({
  financials,
  benchmark,
  months,
}: {
  financials: FinancialInputs
  benchmark: IndustryBenchmarkInputs
  months: number
}): ForecastAssumptions {
  if (!Number.isFinite(months) || months < 0 || months > 12) {
    throw new RangeError('Forecast months must be between 0 and 12.')
  }
  const lift = months / 12
  const revenueGrowthRate = clamp(
    benchmark.revenueGrowth * 0.65 + Math.max(financials.recurringRevenue - benchmark.recurringRevenue, 0) * 0.06,
    2,
    Math.max(benchmark.revenueGrowth * 1.35, 3),
  )
  const marginGap = benchmark.ebitdaMargin - financials.ebitdaMargin
  const realizable = (modeled: number, available: number) => Math.min(roundTenth(modeled), Math.max(available, 0))
  const marginExpansion = realizable(clamp(Math.max(marginGap * 0.25, 1.2) * lift, 0.4 * lift, 3.5 * lift), 60 - financials.ebitdaMargin)
  const recurringRevenueLift = realizable(clamp(Math.max(benchmark.recurringRevenue - financials.recurringRevenue, 8) * 0.28 * lift, 1.5 * lift, 12 * lift), 100 - financials.recurringRevenue)
  const ownerDependencyReduction = realizable(clamp(Math.max(financials.ownerPctRevenue - benchmark.ownerDependency, 10) * 0.25 * lift, 1.5 * lift, 14 * lift), financials.ownerPctRevenue)
  const dsoReduction = realizable(clamp(Math.max(financials.dso - benchmark.dso, 3) * 0.25 * lift, 0.5 * lift, 8 * lift), financials.dso)
  const topClientReduction = realizable(clamp(Math.max(financials.topClientPct - benchmark.topClientPct, 4) * 0.25 * lift, 0.5 * lift, 6 * lift), financials.topClientPct)

  return {
    revenueGrowthRate: roundTenth(revenueGrowthRate),
    marginExpansion,
    recurringRevenueLift,
    ownerDependencyReduction,
    dsoReduction,
    topClientReduction,
  }
}
