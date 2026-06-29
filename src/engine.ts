import Papa from 'papaparse'
import {
  assessmentDimensions,
  industryKpis,
  universalKpis,
  type IndustryId,
  type KpiDefinition,
} from './data'

export type KpiValue = {
  id: string
  value: number | null
  source: 'imported' | 'manual' | 'calculated' | 'missing'
  confidence: 'high' | 'medium' | 'low' | 'missing'
  note: string
}

export type ImportFinding = {
  key: string
  label: string
  value: number
  matchedKpiId?: string
  confidence: 'high' | 'medium' | 'low'
  sourceLine: string
}

export type ImportReview = {
  reportType: 'profit-loss' | 'balance-sheet' | 'ar-aging' | 'cash-flow' | 'unknown'
  findings: ImportFinding[]
  missing: KpiDefinition[]
  nextSources: string[]
}

export type AssessmentScores = Record<string, number>

export type ForecastInputs = {
  revenue: number
  ebitdaMargin: number
  currentMultiple: number
  years: number
  annualGrowth: number
  marginExpansion: number
  multipleExpansion: number
}

export type ForecastPoint = {
  year: string
  revenue: number
  ebitda: number
  multiple: number
  value: number
}

const moneyPattern = /-?\(?\$?\s*[\d,]+(?:\.\d+)?\)?/

const qboAliases: Array<{
  id: string
  labels: string[]
  transform?: (value: number, all: Record<string, number>) => number
}> = [
  { id: 'revenue', labels: ['total income', 'total revenue', 'income', 'sales'] },
  { id: 'gross-margin', labels: ['gross profit'] },
  { id: 'normalized-ebitda', labels: ['net income', 'net ordinary income', 'net operating income', 'ebitda'] },
  { id: 'cash-runway', labels: ['total bank accounts', 'total cash', 'cash and cash equivalents'] },
  { id: 'dso', labels: ['total accounts receivable', 'accounts receivable', 'a/r'] },
  { id: 'labor-ratio', labels: ['payroll expenses', 'wages', 'contract labor', 'salaries'] },
]

export function getKpisForIndustry(industryId: IndustryId): KpiDefinition[] {
  return [...universalKpis, ...(industryKpis[industryId] ?? [])]
}

export function formatValue(value: number | null | undefined, unit: KpiDefinition['unit']) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'Missing'
  if (unit === '$') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value)
  }
  if (unit === '%') return `${Math.round(value * 10) / 10}%`
  if (unit === 'x') return `${Math.round(value * 10) / 10}x`
  if (unit === 'days') return `${Math.round(value)} days`
  return `${Math.round(value * 10) / 10}`
}

export function scoreLabel(score: number) {
  if (score >= 8) return 'Strong'
  if (score >= 6) return 'Developing'
  if (score >= 4) return 'Exposed'
  return 'Fragile'
}

export function calculateDimensionScores(scores: AssessmentScores) {
  return assessmentDimensions.map((dimension) => {
    const answered = dimension.questions.filter((question) => scores[question.id] !== undefined)
    const totalWeight = answered.reduce((sum, question) => sum + question.weight, 0)
    const weightedScore = answered.reduce((sum, question) => sum + scores[question.id] * question.weight, 0)
    return {
      id: dimension.id,
      name: dimension.name,
      score: totalWeight ? weightedScore / totalWeight : 0,
      answered: answered.length,
      total: dimension.questions.length,
    }
  })
}

export function calculateOverallScore(scores: AssessmentScores) {
  const dimensionScores = calculateDimensionScores(scores).filter((dimension) => dimension.answered > 0)
  if (!dimensionScores.length) return 0
  return dimensionScores.reduce((sum, dimension) => sum + dimension.score, 0) / dimensionScores.length
}

export function parseUploadedReport(fileName: string, rawText: string, kpis: KpiDefinition[]): ImportReview {
  const normalizedFile = fileName.toLowerCase()
  const reportType = inferReportType(normalizedFile, rawText)
  const findings = extractFindings(rawText)
  const matched = findings.map((finding) => matchFinding(finding, kpis))
  const matchedIds = new Set(matched.map((finding) => finding.matchedKpiId).filter(Boolean))
  const missing = kpis.filter((kpi) => kpi.automated !== 'manual' && !matchedIds.has(kpi.id))
  const nextSources = Array.from(
    new Set(
      missing.flatMap((kpi) => kpi.sourceReports).filter((source) => !source.toLowerCase().includes('profit and loss')),
    ),
  ).slice(0, 5)

  return {
    reportType,
    findings: matched,
    missing,
    nextSources,
  }
}

function inferReportType(fileName: string, rawText: string): ImportReview['reportType'] {
  const text = `${fileName} ${rawText.slice(0, 1000)}`.toLowerCase()
  if (text.includes('profit and loss') || text.includes('p&l')) return 'profit-loss'
  if (text.includes('balance sheet')) return 'balance-sheet'
  if (text.includes('aging') || text.includes('accounts receivable')) return 'ar-aging'
  if (text.includes('cash flow')) return 'cash-flow'
  return 'unknown'
}

function extractFindings(rawText: string): ImportFinding[] {
  const parsed = Papa.parse<string[]>(rawText, {
    skipEmptyLines: true,
  })
  const rows: string[][] = parsed.data.length ? parsed.data : rawText.split(/\r?\n/).map((line) => line.split(/\t|,/))

  return rows
    .map((row): ImportFinding | null => {
      const cells = row.map((cell) => String(cell ?? '').trim()).filter(Boolean)
      const joined = cells.join(' ')
      const valueCell = [...cells].reverse().find((cell) => moneyPattern.test(cell))
      if (!cells.length || !valueCell) return null
      const label = cells.find((cell) => !moneyPattern.test(cell)) ?? cells[0]
      const value = parseNumber(valueCell)
      if (!Number.isFinite(value)) return null
      return {
        key: normalizeLabel(label),
        label,
        value,
        confidence: 'medium' as const,
        sourceLine: joined,
      }
    })
    .filter((finding): finding is ImportFinding => Boolean(finding))
}

function matchFinding(finding: ImportFinding, kpis: KpiDefinition[]): ImportFinding {
  const direct = qboAliases.find((alias) => alias.labels.some((label) => finding.key.includes(normalizeLabel(label))))
  if (direct && kpis.some((kpi) => kpi.id === direct.id)) {
    return { ...finding, matchedKpiId: direct.id, confidence: 'high' }
  }

  const fuzzy = kpis.find((kpi) => {
    const name = normalizeLabel(kpi.name)
    return finding.key.includes(name) || name.includes(finding.key)
  })

  if (fuzzy) return { ...finding, matchedKpiId: fuzzy.id, confidence: 'medium' }
  return { ...finding, confidence: 'low' }
}

export function buildKpiValues(kpis: KpiDefinition[], review?: ImportReview): KpiValue[] {
  const values: Record<string, KpiValue> = Object.fromEntries(
    kpis.map((kpi) => [
      kpi.id,
      {
        id: kpi.id,
        value: null,
        source: kpi.automated === 'manual' ? 'manual' : 'missing',
        confidence: 'missing',
        note: kpi.automated === 'manual' ? 'Advisor input required' : 'No matching import found yet',
      } satisfies KpiValue,
    ]),
  )

  review?.findings.forEach((finding) => {
    if (!finding.matchedKpiId || !values[finding.matchedKpiId]) return
    values[finding.matchedKpiId] = {
      id: finding.matchedKpiId,
      value: finding.value,
      source: 'imported',
      confidence: finding.confidence,
      note: `Matched from ${finding.label}`,
    }
  })

  calculateDerived(values)
  return kpis.map((kpi) => values[kpi.id])
}

function calculateDerived(values: Record<string, KpiValue>) {
  const revenue = values.revenue?.value
  const ebitda = values['normalized-ebitda']?.value
  const grossProfit = values['gross-margin']?.value
  const labor = values['labor-ratio']?.value

  if (revenue && ebitda && values['ebitda-margin']) {
    values['ebitda-margin'] = {
      id: 'ebitda-margin',
      value: (ebitda / revenue) * 100,
      source: 'calculated',
      confidence: 'medium',
      note: 'Calculated from revenue and normalized EBITDA',
    }
  }

  if (revenue && grossProfit && grossProfit > 1 && values['gross-margin']) {
    values['gross-margin'] = {
      id: 'gross-margin',
      value: (grossProfit / revenue) * 100,
      source: 'calculated',
      confidence: 'medium',
      note: 'Calculated from gross profit and revenue',
    }
  }

  if (revenue && labor && labor > 1 && values['labor-ratio']) {
    values['labor-ratio'] = {
      id: 'labor-ratio',
      value: (labor / revenue) * 100,
      source: 'calculated',
      confidence: 'low',
      note: 'Estimated from labor line and revenue',
    }
  }
}

export function buildForecast(inputs: ForecastInputs): ForecastPoint[] {
  const points: ForecastPoint[] = []
  for (let year = 0; year <= inputs.years; year += 1) {
    const revenue = inputs.revenue * (1 + inputs.annualGrowth / 100) ** year
    const margin = inputs.ebitdaMargin + (inputs.marginExpansion / inputs.years) * year
    const ebitda = revenue * (margin / 100)
    const multiple = inputs.currentMultiple + (inputs.multipleExpansion / inputs.years) * year
    points.push({
      year: year === 0 ? 'Today' : `Year ${year}`,
      revenue,
      ebitda,
      multiple,
      value: ebitda * multiple,
    })
  }
  return points
}

export function valuationMultipleFromScore(score: number) {
  return 2.2 + Math.max(0, Math.min(10, score)) * 0.42
}

function parseNumber(value: string) {
  const isNegative = value.includes('(') && value.includes(')')
  const cleaned = value.replace(/[,$()\s]/g, '')
  const number = Number.parseFloat(cleaned)
  return isNegative ? -number : number
}

function normalizeLabel(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}
