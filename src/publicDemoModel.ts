import { calculateDecisionLabScenario, type DecisionLabCategoryScore, type DecisionLabScenario } from './decisionLabModel'
import type { FinancialInputs, IndustryBenchmarkInputs } from './valuationModel'

export type PublicDemoImprovement = {
  id: 'leadership' | 'operations' | 'finance'
  title: string
  description: string
  priority: string
  evidence: string[]
}

export const publicDemoImprovements: PublicDemoImprovement[] = [
  {
    id: 'leadership',
    title: 'Build management depth',
    description: 'Move recurring decisions and client responsibilities beyond the owner.',
    priority: 'Choose one owner-controlled client handoff and assign a capable operating owner this quarter.',
    evidence: [
      'Named leaders can make defined decisions without the owner',
      'A current responsibility and succession map is in use',
      'Client delivery continues during a planned owner absence',
    ],
  },
  {
    id: 'operations',
    title: 'Standardize core operations',
    description: 'Make delivery capacity, quality, and handoffs repeatable and measurable.',
    priority: 'Document the highest-risk delivery workflow and track quality and capacity for 90 days.',
    evidence: [
      'Core delivery workflows are documented and followed',
      'Quality and capacity are measured consistently',
      'Work can be delivered without routine owner intervention',
    ],
  },
  {
    id: 'finance',
    title: 'Strengthen financial discipline',
    description: 'Use timely reporting, cash controls, and forecasting to make forward decisions.',
    priority: 'Establish a rolling cash forecast and review margin, collections, and capacity monthly.',
    evidence: [
      'Monthly financial reporting is timely and accurate',
      'Cash, margin, and forecast controls are in use',
      'Normalized earnings are supported by documented evidence',
    ],
  },
]

const companyName = 'Harbor Point Services | Sample company'

const financials: FinancialInputs = {
  revenue: 3_200_000,
  ebitdaMargin: 16,
  normalizedEbitda: 512_000,
  recurringRevenue: 42,
  ownerPctRevenue: 52,
  topClientPct: 24,
  dso: 44,
  runway: 4,
  debt: 250_000,
  revenueGrowth: 11,
}

const benchmark: IndustryBenchmarkInputs = {
  name: 'Professional Services',
  revenueGrowth: 10,
  ebitdaMargin: 18,
  recurringRevenue: 50,
  ownerDependency: 35,
  topClientPct: 20,
  dso: 40,
  evEbitdaMultiple: 4.6,
}

const transformationCategories = new Set(['leadership', 'operations', 'finance'])

const baselineScores: DecisionLabCategoryScore[] = [
  'planning',
  'leadership',
  'sales',
  'marketing',
  'people',
  'operations',
  'finance',
  'legal',
].map((id) => ({
  id,
  label: id.charAt(0).toUpperCase() + id.slice(1),
  currentScore: transformationCategories.has(id) ? 4 : 6,
  proposedScore: transformationCategories.has(id) ? 4 : 6,
}))

export function calculatePublicDemoScenario(selectedIds: string[]): {
  companyName: string
  financials: FinancialInputs
  benchmark: IndustryBenchmarkInputs
  selectedImprovements: PublicDemoImprovement[]
  scenario: DecisionLabScenario
} {
  const selectedImprovements = selectedIds.reduce<PublicDemoImprovement[]>((selected, id) => {
    const improvement = publicDemoImprovements.find((item) => item.id === id)
    if (!improvement || selected.some((item) => item.id === id) || selected.length >= 3) return selected
    return [...selected, improvement]
  }, [])
  const selectedSet = new Set(selectedImprovements.map((item) => item.id))
  const scores = baselineScores.map((item) => ({
    ...item,
    proposedScore: selectedSet.has(item.id as PublicDemoImprovement['id']) ? 9.5 : item.currentScore,
  }))

  return {
    companyName,
    financials: { ...financials },
    benchmark: { ...benchmark },
    selectedImprovements,
    scenario: calculateDecisionLabScenario({
      scores,
      financials,
      benchmark,
      dataQuality: 'demo',
    }),
  }
}
