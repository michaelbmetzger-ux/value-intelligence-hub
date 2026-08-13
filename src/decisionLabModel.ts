import {
  calculateEnterpriseValue,
  calculateIndustryAnchoredMultiple,
  type DataQuality,
  type FinancialInputs,
  type IndustryBenchmarkInputs,
  type MultipleMethodology,
} from './valuationModel'

export type DecisionLabCategoryScore = {
  id: string
  label: string
  currentScore: number
  proposedScore: number
}

export type DecisionLabValuation = {
  valueEngineScore: number
  methodology: MultipleMethodology
  enterpriseValue: number | null
}

export type DecisionLabScenario = {
  scores: DecisionLabCategoryScore[]
  current: DecisionLabValuation
  proposed: DecisionLabValuation
  changedCategories: DecisionLabCategoryScore[]
  scoreDelta: number
  multipleDelta: number
  enterpriseValueDelta: number | null
  ceilingLimited: boolean
}

function clampScore(score: number) {
  if (!Number.isFinite(score)) return 0
  return Math.min(10, Math.max(0, score))
}

function averageScore(scores: DecisionLabCategoryScore[], key: 'currentScore' | 'proposedScore') {
  if (!scores.length) return 0
  return scores.reduce((sum, item) => sum + item[key], 0) / scores.length
}

function buildValuation({
  valueEngineScore,
  financials,
  benchmark,
  dataQuality,
}: {
  valueEngineScore: number
  financials: FinancialInputs
  benchmark: IndustryBenchmarkInputs
  dataQuality: DataQuality
}): DecisionLabValuation {
  const methodology = calculateIndustryAnchoredMultiple({
    financials,
    benchmark,
    vesScore: valueEngineScore,
    dataQuality,
  })

  return {
    valueEngineScore,
    methodology,
    enterpriseValue: calculateEnterpriseValue(financials.normalizedEbitda, methodology.adjusted),
  }
}

export function calculateDecisionLabScenario({
  scores,
  financials,
  benchmark,
  dataQuality,
}: {
  scores: DecisionLabCategoryScore[]
  financials: FinancialInputs
  benchmark: IndustryBenchmarkInputs
  dataQuality: DataQuality
}): DecisionLabScenario {
  const normalizedScores = scores.map((item) => ({
    ...item,
    currentScore: clampScore(item.currentScore),
    proposedScore: clampScore(item.proposedScore),
  }))
  const currentScore = averageScore(normalizedScores, 'currentScore')
  const proposedScore = averageScore(normalizedScores, 'proposedScore')
  const current = buildValuation({ valueEngineScore: currentScore, financials, benchmark, dataQuality })
  const proposed = buildValuation({ valueEngineScore: proposedScore, financials, benchmark, dataQuality })
  const changedCategories = normalizedScores.filter((item) => item.currentScore !== item.proposedScore)
  const enterpriseValueDelta = current.enterpriseValue == null || proposed.enterpriseValue == null
    ? null
    : proposed.enterpriseValue - current.enterpriseValue

  return {
    scores: normalizedScores,
    current,
    proposed,
    changedCategories,
    scoreDelta: proposedScore - currentScore,
    multipleDelta: proposed.methodology.adjusted - current.methodology.adjusted,
    enterpriseValueDelta,
    ceilingLimited: proposed.methodology.adjusted === proposed.methodology.ceiling && proposedScore > currentScore,
  }
}
