import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { jsPDF } from 'jspdf'
import Papa from 'papaparse'
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ChevronDown,
  Circle,
  CircleDollarSign,
  ClipboardCheck,
  Database,
  Download,
  FileSpreadsheet,
  FlaskConical,
  Gauge,
  LineChart,
  ListChecks,
  Lock,
  MessageSquareText,
  Plus,
  Radar,
  ShieldCheck,
  Target,
  Upload,
  Users,
} from 'lucide-react'
import { assessmentDimensions } from './assessmentBank'
import {
  acceptInvitation,
  buildInitialAuthState,
  createInvitation,
  signIn,
  visibleClientsForSession,
  type AuthState,
  type Invitation,
  type PortalRole,
  type Session,
} from './authModel'
import {
  buildSensitivityMultiples,
  calculateBearCaseMultiple,
  calculateForecastAssumptions,
  calculateEnterpriseValue,
  calculateIndustryAnchoredMultiple,
  projectReducedPercentage,
  type MultipleMethodology,
} from './valuationModel'
import {
  DecisionLab,
  type DecisionLabScenarioRecord,
} from './DecisionLab'
import './App.css'

type View = 'dashboard' | 'value-engine' | 'decision-lab' | 'kpis' | 'forecast' | 'reports'
type PortalMode = 'advisor' | 'client'
type ClientId = string
type IndustryBenchmarkId =
  | 'professional-services'
  | 'law-firm'
  | 'salon-spa'
  | 'medical-practice'
  | 'agency'
  | 'contractor'
  | 'saas'
  | 'pest-control'
  | 'home-healthcare'
  | 'kitchen-bath-remodeling'
  | 'salon-suites'
  | 'roofing-solar'
  | 'adu-contracting'
  | 'hvac'
  | 'paving'
  | 'non-emergency-medical-transport'
  | 'plumbing'
  | 'print-marketing'
  | 'chimney-fireplace'
  | 'electrical'
  | 'water-filtration'
  | 'landscaping'
  | 'laundry-service'
  | 'flooring-epoxy'
  | 'hair-restoration'
  | 'pool-services'
  | 'hydration-services'
  | 'septic-porta-potty'
  | 'equipment-rental'
  | 'urgent-care'
  | 'fencing'
  | 'towing-repair'
  | 'med-spa'
  | 'janitorial-services'
  | 'garage-door-services'
  | 'commercial-cleaning'
  | 'niche-markets'

type KpiViewSection = 'data-confidence' | 'kpi-table' | 'industry-benchmarking'
type ForecastViewSection =
  | 'forward-health'
  | 'risk-radar'
  | 'valuation-range'
  | 'source-map'
  | 'rolling-forecast'
  | 'forecast-vs-industry'
  | 'assumptions'
  | 'multiple-sensitivity'

type ViewPreferenceOption<T extends string> = {
  id: T
  label: string
  description: string
}

type Financials = {
  revenue: number
  totalExpenses: number
  ebitda: number
  ebitdaMargin: number
  ownerAddbacks: number
  normalizedEbitda: number
  cash: number
  ar: number
  payroll: number
  currentAssets: number
  currentLiabilities: number
  workingCapital: number
  operatingCashFlow: number
  debt: number
  dso: number
  recurringRevenue: number
  customerCount: number
  newClientsThisMonth: number
  churnRate: number
  laborPct: number
  runway: number
  ownerPctRevenue: number
  topClientPct: number
  grossMargin: number
  pipelineCoverage: number
  revenuePerClient: number
}

type AssessmentData = Record<string, Record<string, number>>

type MonthlySnapshot = {
  month: string
  revenue: number
  ebitda: number
  ebitdaMargin: number
  vesScore: number
  value: number | null
  valuationMethod?: 'industry-anchored-v1'
  healthScore?: number
  grossMargin?: number
  dso?: number
  runway?: number
  recurringRevenue?: number
  ownerPctRevenue?: number
  topClientPct?: number
  dimensionScores?: Record<string, number>
  note?: string
}

type QuestionResponse = {
  score: number
  answer: string
  evidence: string
  status: 'sample' | 'missing' | 'confirmed'
}

type AdvisorObjective = {
  id: string
  title: string
  detail: string
  dimensionId: string
  owner: string
  impact: {
    scoreLift: number
    recurringRevenueLift?: number
    ownerDependencyDrop?: number
    pipelineCoverageLift?: number
  }
  completedAt?: string
}

type Client = {
  id: ClientId
  name: string
  industry: string
  advisors: string[]
  lastUpdated: string
  dataQuality: 'demo' | 'partial' | 'actual'
  data: {
    financials: Financials
    assessment: AssessmentData
    questionResponses: Record<string, QuestionResponse>
    monthlyHistory: MonthlySnapshot[]
    qboImportLog?: QboImportLog[]
    crmImportLog?: QboImportLog[]
    advisorObjectives: AdvisorObjective[]
    decisionLabScenarios?: DecisionLabScenarioRecord[]
    sharedDecisionLabScenarioId?: string
  }
}

type CompanyForm = {
  name: string
  industryId: IndustryBenchmarkId
  advisor: string
}

type LoginForm = {
  email: string
}

type InviteForm = {
  email: string
  role: Exclude<PortalRole, 'owner'>
  clientId: ClientId
}

type AcceptInviteForm = {
  token: string
  name: string
  password: string
}

type InviteNotice = Pick<Invitation, 'token' | 'email' | 'role' | 'clientIds'>

type UploadStatus = {
  tone: 'success' | 'warning'
  message: string
  changes?: ImportChange[]
  skipped?: string[]
  missing?: string[]
}

type ImportChange = {
  label: string
  before: string
  after: string
}

type QboImportLog = {
  id: string
  date: string
  files: string[]
  recognized: string[]
  changes: ImportChange[]
  skipped: string[]
  missing: string[]
}

type RiskTone = 'green' | 'yellow' | 'red'

type ForwardHealthPeriod = {
  label: string
  healthScore: number
  cash: number
  runway: number
  revenue: number
  margin: number
  value: number | null
  confidence: 'High' | 'Medium' | 'Low'
}

type RiskSignal = {
  id: string
  label: string
  tone: RiskTone
  score: number
  metric: string
  summary: string
  action: string
}

type ValuationScenario = {
  label: 'Bear' | 'Base' | 'Upside'
  value: number | null
  multiple: number
  summary: string
}

type CfoAdvisoryModel = {
  forwardHealth: ForwardHealthPeriod[]
  riskSignals: RiskSignal[]
  valuationRange: ValuationScenario[]
  multipleMethodology: MultipleMethodology
  primaryRisk: RiskSignal
  secondaryRisk: RiskSignal
  whatBreaksFirst: string
  cashDangerDate: string
  monthlyCashFlow: number
  breakEvenGap: number
  revenueVolatility: number
}

type IndustryBenchmark = {
  id: IndustryBenchmarkId
  name: string
  basis: string
  revenueGrowth: number
  ebitdaMargin: number
  grossMargin: number
  recurringRevenue: number
  ownerDependency: number
  topClientPct: number
  dso: number
  evEbitdaMultiple: number
  revenuePerFte?: number
  sourceNotes: string[]
}

type AssessmentQuestion = (typeof assessmentDimensions)[number]['questions'][number]

const dimensions = [
  { id: 'planning', label: 'Planning', icon: Target, color: '#2563eb' },
  { id: 'leadership', label: 'Leadership', icon: Users, color: '#7c3aed' },
  { id: 'sales', label: 'Sales', icon: ArrowUpRight, color: '#d97706' },
  { id: 'marketing', label: 'Marketing', icon: MessageSquareText, color: '#0891b2' },
  { id: 'people', label: 'People', icon: Users, color: '#16a34a' },
  { id: 'operations', label: 'Operations', icon: Gauge, color: '#ea580c' },
  { id: 'finance', label: 'Finance', icon: CircleDollarSign, color: '#0284c7' },
  { id: 'legal', label: 'Legal', icon: ShieldCheck, color: '#be185d' },
]

const kpiViewOptions: ViewPreferenceOption<KpiViewSection>[] = [
  { id: 'data-confidence', label: 'Data confidence', description: 'Shows what is real, demo, and still missing.' },
  { id: 'kpi-table', label: 'KPI table', description: 'Shows the full operating KPI table.' },
  { id: 'industry-benchmarking', label: 'Industry benchmarking', description: 'Compares company KPIs against the selected industry.' },
]

const forecastViewOptions: ViewPreferenceOption<ForecastViewSection>[] = [
  { id: 'forward-health', label: 'Forward health', description: 'Shows current, 30-day, 90-day, 6-month, and 12-month health.' },
  { id: 'risk-radar', label: 'Risk radar', description: 'Shows the highest-risk signals behind the forecast.' },
  { id: 'valuation-range', label: 'Valuation range', description: 'Shows bear, base, and upside enterprise-value cases.' },
  { id: 'source-map', label: 'Source map', description: 'Shows where forecast numbers come from.' },
  { id: 'rolling-forecast', label: 'Rolling forecast', description: 'Shows projected revenue, margin, VES, and enterprise value by period.' },
  { id: 'forecast-vs-industry', label: 'Forecast vs industry', description: 'Compares 12-month projection against industry averages.' },
  { id: 'assumptions', label: 'Assumptions', description: 'Shows the levers behind the projection.' },
  { id: 'multiple-sensitivity', label: 'Multiple sensitivity', description: 'Shows normalized EBITDA across buyer multiple cases.' },
]

const defaultKpiViewSections: KpiViewSection[] = kpiViewOptions.map((option) => option.id)
const defaultForecastViewSections: ForecastViewSection[] = forecastViewOptions.map((option) => option.id)
const focusKpiViewSections: KpiViewSection[] = ['kpi-table', 'industry-benchmarking']
const focusForecastViewSections: ForecastViewSection[] = ['forward-health', 'valuation-range', 'rolling-forecast']

const qboReports = [
  {
    id: 'pl',
    name: 'Profit and Loss',
    timing: 'Monthly, trailing 12 months, and prior-year comparison',
    purpose: 'Revenue, gross margin, EBITDA, add-backs, labor ratio, and margin trend.',
    steps: ['Reports', 'Profit and Loss', 'Set period to trailing 12 months', 'Display columns by month', 'Add prior-year comparison', 'Export to CSV'],
    mapped: ['Revenue', 'Gross margin', 'EBITDA', 'EBITDA margin', 'Labor %'],
  },
  {
    id: 'bs',
    name: 'Balance Sheet',
    timing: 'Month-end snapshot plus trailing 12 months',
    purpose: 'Cash, debt, working capital, equity, A/R, and liquidity position.',
    steps: ['Reports', 'Balance Sheet', 'Set date to month end', 'Use standard accrual layout', 'Export to CSV'],
    mapped: ['Cash', 'Working capital', 'A/R', 'Liabilities', 'Runway'],
  },
  {
    id: 'ar',
    name: 'A/R Aging Summary',
    timing: 'Month end',
    purpose: 'Receivables risk, DSO, collection drag, and cash conversion issues.',
    steps: ['Reports', 'Accounts Receivable Aging Summary', 'Set date to month end', 'Review aging buckets', 'Export to CSV'],
    mapped: ['DSO', 'A/R balance', '60+ day A/R'],
  },
  {
    id: 'cash-flow',
    name: 'Statement of Cash Flows',
    timing: 'Monthly and year-to-date',
    purpose: 'Operating cash flow, owner distributions, financing changes, and runway.',
    steps: ['Reports', 'Statement of Cash Flows', 'Set period to year-to-date', 'Confirm accrual/cash basis matches advisory model', 'Export to CSV'],
    mapped: ['Operating cash flow', 'Runway', 'Net cash change'],
  },
  {
    id: 'sales-customer',
    name: 'Sales by Customer Summary',
    timing: 'Trailing 12 months',
    purpose: 'Client concentration, referral dependence, recurring revenue quality, and retention risk.',
    steps: ['Reports', 'Sales by Customer Summary', 'Set period to last 12 months', 'Sort by total revenue', 'Export to CSV'],
    mapped: ['Top client %', 'Customer count', 'Concentration risk', 'Revenue per client'],
  },
]

const defaultAdvisorObjectives: AdvisorObjective[] = [
  {
    id: 'confirm-qbo-baseline',
    title: 'Confirm QBO baseline',
    detail: 'Load the current P&L, Balance Sheet, A/R Aging, Cash Flow, and Sales by Customer files.',
    dimensionId: 'finance',
    owner: 'Advisor',
    impact: { scoreLift: 0.35, pipelineCoverageLift: 0.1 },
  },
  {
    id: 'document-owner-handoff',
    title: 'Document owner handoff map',
    detail: 'Map the owner-led sales, delivery, client communication, and decision workflows.',
    dimensionId: 'leadership',
    owner: 'Advisor + owner',
    impact: { scoreLift: 0.65, ownerDependencyDrop: 6 },
  },
  {
    id: 'package-recurring-offer',
    title: 'Package recurring offer',
    detail: 'Define one repeatable monthly offer, renewal cadence, pricing logic, and success KPI.',
    dimensionId: 'sales',
    owner: 'Advisor + owner',
    impact: { scoreLift: 0.55, recurringRevenueLift: 5, pipelineCoverageLift: 0.25 },
  },
  {
    id: 'codify-delivery-workflow',
    title: 'Codify delivery workflow',
    detail: 'Document the core client delivery workflow from intake through monthly review.',
    dimensionId: 'operations',
    owner: 'Advisor',
    impact: { scoreLift: 0.5, ownerDependencyDrop: 4 },
  },
  {
    id: 'attach-low-score-evidence',
    title: 'Attach evidence to weak scores',
    detail: 'Add evidence for the lowest Value Engine answers and identify the next measurable proof point.',
    dimensionId: 'planning',
    owner: 'Advisor',
    impact: { scoreLift: 0.4 },
  },
]

const industryBenchmarks: IndustryBenchmark[] = [
  {
    id: 'professional-services',
    name: 'Professional Services',
    basis: 'Professional services, consulting, advisory, and similar people-led service firms.',
    revenueGrowth: 5,
    ebitdaMargin: 14,
    grossMargin: 50,
    recurringRevenue: 55,
    ownerDependency: 45,
    topClientPct: 20,
    dso: 45,
    evEbitdaMultiple: 5.5,
    revenuePerFte: 180000,
    sourceNotes: ['SPI / Rocketlane 2026 professional services EBITDA context', 'Accelo 2026 professional services benchmarks', 'NYU Stern January 2026 sector data'],
  },
  {
    id: 'law-firm',
    name: 'Law Firm',
    basis: 'Small and mid-size law firms where realization, collections, and attorney leverage drive results.',
    revenueGrowth: 8,
    ebitdaMargin: 30,
    grossMargin: 55,
    recurringRevenue: 25,
    ownerDependency: 45,
    topClientPct: 20,
    dso: 45,
    evEbitdaMultiple: 4.5,
    revenuePerFte: 220000,
    sourceNotes: ['BigHand 2026 law firm finance report', 'Law Society 2026 financial benchmarking survey', 'Law firm profitability benchmark ranges'],
  },
  {
    id: 'salon-spa',
    name: 'Salon & Spa',
    basis: 'Salon, spa, med-spa adjacent, and beauty/wellness service businesses.',
    revenueGrowth: 4.2,
    ebitdaMargin: 12,
    grossMargin: 45,
    recurringRevenue: 25,
    ownerDependency: 50,
    topClientPct: 10,
    dso: 7,
    evEbitdaMultiple: 3.5,
    revenuePerFte: 95000,
    sourceNotes: ['ISPA 2026 Big Five spa statistics', 'Zenoti 2026 beauty and wellness benchmark framing', 'Small service business valuation ranges'],
  },
  {
    id: 'medical-practice',
    name: 'Medical Practice',
    basis: 'Office-based physician, dental, and outpatient healthcare practices.',
    revenueGrowth: 5,
    ebitdaMargin: 15,
    grossMargin: 45,
    recurringRevenue: 65,
    ownerDependency: 40,
    topClientPct: 10,
    dso: 35,
    evEbitdaMultiple: 6.5,
    revenuePerFte: 210000,
    sourceNotes: ['Medical practice transaction and KPI benchmark ranges', 'FOCUS 2026 physician practice M&A context', 'Healthcare practice margin benchmarks'],
  },
  {
    id: 'agency',
    name: 'Marketing Agency',
    basis: 'Digital marketing, creative, content, and specialist agency firms.',
    revenueGrowth: 7.5,
    ebitdaMargin: 18,
    grossMargin: 50,
    recurringRevenue: 60,
    ownerDependency: 45,
    topClientPct: 20,
    dso: 45,
    evEbitdaMultiple: 5,
    revenuePerFte: 163000,
    sourceNotes: ['Promethean / agency benchmark summaries for 2026', 'Agency margin and revenue-per-FTE benchmark summaries', 'Digital agency valuation guidance'],
  },
  {
    id: 'contractor',
    name: 'Contractor',
    basis: 'Construction services, contractors, and specialty trade businesses.',
    revenueGrowth: 5,
    ebitdaMargin: 9,
    grossMargin: 22,
    recurringRevenue: 15,
    ownerDependency: 45,
    topClientPct: 20,
    dso: 45,
    evEbitdaMultiple: 4.5,
    revenuePerFte: 250000,
    sourceNotes: ['CSIMarket Q1 2026 construction services EBITDA margin', '2026 construction benchmark gross margin ranges', 'Lower-middle-market construction valuation ranges'],
  },
  {
    id: 'saas',
    name: 'SaaS',
    basis: 'B2B SaaS and AI-native software companies.',
    revenueGrowth: 15,
    ebitdaMargin: 7,
    grossMargin: 75,
    recurringRevenue: 90,
    ownerDependency: 30,
    topClientPct: 15,
    dso: 30,
    evEbitdaMultiple: 8,
    revenuePerFte: 275000,
    sourceNotes: ['Aleph / Benchmarkit 2026 SaaS and AI performance benchmarks', 'SaaS Capital 2026 private B2B SaaS spending benchmarks', 'NYU Stern January 2026 software sector data'],
  },
  {
    id: 'pest-control',
    name: 'Pest Control',
    basis: 'Recurring pest control, termite, wildlife, and commercial route services.',
    revenueGrowth: 5.7,
    ebitdaMargin: 25,
    grossMargin: 50,
    recurringRevenue: 65,
    ownerDependency: 45,
    topClientPct: 15,
    dso: 25,
    evEbitdaMultiple: 4,
    revenuePerFte: 170000,
    sourceNotes: ['Top 30 Playbook: $24.9B 2023 revenue, 33,000 entities, $32.8B projected by 2028.', 'Top 30 Playbook investor insight: 20-30% profit margins and 3-5x EBITDA valuations.'],
  },
  {
    id: 'home-healthcare',
    name: 'Home Healthcare',
    basis: 'In-home care, caregiver services, skilled and non-skilled home health operations.',
    revenueGrowth: 7.5,
    ebitdaMargin: 20,
    grossMargin: 35,
    recurringRevenue: 75,
    ownerDependency: 40,
    topClientPct: 10,
    dso: 35,
    evEbitdaMultiple: 4,
    revenuePerFte: 85000,
    sourceNotes: ['Top 30 Playbook: $143.95B 2023 revenue, 483,000 entities, $296.41B projected by 2033.', 'Top 30 Playbook investor insight: 15-25% net profit and 3-5x EBITDA valuations.'],
  },
  {
    id: 'kitchen-bath-remodeling',
    name: 'Kitchen & Bath Remodeling',
    basis: 'Kitchen, bath, and residential remodeling businesses with design-build project economics.',
    revenueGrowth: 16.7,
    ebitdaMargin: 27.5,
    grossMargin: 42,
    recurringRevenue: 10,
    ownerDependency: 50,
    topClientPct: 20,
    dso: 25,
    evEbitdaMultiple: 4,
    revenuePerFte: 240000,
    sourceNotes: ['Top 30 Playbook: $179B 2023 revenue, 726,000 entities, $387B projected by 2028.', 'Top 30 Playbook investor insight: 20-35% net margins and 3-5x EBITDA valuations.'],
  },
  {
    id: 'salon-suites',
    name: 'Salon Suites',
    basis: 'Real-estate-backed salon suite rental businesses with recurring booth or suite rent.',
    revenueGrowth: 7.7,
    ebitdaMargin: 38,
    grossMargin: 65,
    recurringRevenue: 85,
    ownerDependency: 35,
    topClientPct: 10,
    dso: 7,
    evEbitdaMultiple: 4,
    revenuePerFte: 220000,
    sourceNotes: ['Top 30 Playbook: $20B 2023 revenue, 3,000 entities, $29B projected by 2028.', 'Top 30 Playbook investor insight: net margins pushing 40% and 3-5x EBITDA valuations.'],
  },
  {
    id: 'roofing-solar',
    name: 'Roofing & Solar',
    basis: 'Roofing, insurance restoration, solar add-on, and exterior home-service businesses.',
    revenueGrowth: 23.4,
    ebitdaMargin: 25,
    grossMargin: 35,
    recurringRevenue: 15,
    ownerDependency: 50,
    topClientPct: 20,
    dso: 25,
    evEbitdaMultiple: 4,
    revenuePerFte: 260000,
    sourceNotes: ['Top 30 Playbook: $226.5B 2023 revenue, 112,000 entities, $647.88B projected by 2028.', 'Top 30 Playbook investor insight: 20-30% net profit and 3-5x EBITDA valuations.'],
  },
  {
    id: 'adu-contracting',
    name: 'ADU Contracting',
    basis: 'Accessory dwelling unit design, permitting, construction, and specialty contracting.',
    revenueGrowth: 7.2,
    ebitdaMargin: 25,
    grossMargin: 35,
    recurringRevenue: 5,
    ownerDependency: 55,
    topClientPct: 20,
    dso: 35,
    evEbitdaMultiple: 4,
    revenuePerFte: 230000,
    sourceNotes: ['Top 30 Playbook: $615.9M 2023 revenue, $1.24B projected by 2033.', 'Top 30 Playbook investor insight: 20-30% profit margins and 3-5x EBITDA valuations.'],
  },
  {
    id: 'hvac',
    name: 'HVAC',
    basis: 'Residential and light commercial HVAC service, replacement, maintenance, and installation.',
    revenueGrowth: 3.5,
    ebitdaMargin: 20,
    grossMargin: 45,
    recurringRevenue: 35,
    ownerDependency: 45,
    topClientPct: 15,
    dso: 25,
    evEbitdaMultiple: 4,
    revenuePerFte: 220000,
    sourceNotes: ['Top 30 Playbook: $31.3B 2024 revenue, 146,000 entities, $38.5B projected by 2030.', 'Top 30 Playbook investor insight: 15-25% net margins and 3-5x EBITDA valuations.'],
  },
  {
    id: 'paving',
    name: 'Paving',
    basis: 'Asphalt, concrete, driveway, parking lot, and municipal paving contractors.',
    revenueGrowth: 4.2,
    ebitdaMargin: 25,
    grossMargin: 35,
    recurringRevenue: 15,
    ownerDependency: 50,
    topClientPct: 20,
    dso: 35,
    evEbitdaMultiple: 3.5,
    revenuePerFte: 250000,
    sourceNotes: ['Top 30 Playbook: $2.5B 2024 revenue, 137,000 entities, $3.2B projected by 2030.', 'Top 30 Playbook investor insight: 20-30% margins and 3-4x EBITDA valuations.'],
  },
  {
    id: 'non-emergency-medical-transport',
    name: 'Non-Emergency Medical Transport',
    basis: 'NEMT, accessible transportation, fleet scheduling, and healthcare logistics services.',
    revenueGrowth: 9.2,
    ebitdaMargin: 20,
    grossMargin: 35,
    recurringRevenue: 70,
    ownerDependency: 40,
    topClientPct: 20,
    dso: 45,
    evEbitdaMultiple: 4,
    revenuePerFte: 120000,
    sourceNotes: ['Top 30 Playbook: $6.6B 2023 revenue, 10,000 entities, $13.4B projected by 2031.', 'Top 30 Playbook investor insight: 15-25% EBITDA margins and 3-5x valuations.'],
  },
  {
    id: 'plumbing',
    name: 'Plumbing',
    basis: 'Residential and commercial plumbing service, repair, replacement, and maintenance.',
    revenueGrowth: 2.8,
    ebitdaMargin: 25,
    grossMargin: 45,
    recurringRevenue: 30,
    ownerDependency: 45,
    topClientPct: 15,
    dso: 20,
    evEbitdaMultiple: 4,
    revenuePerFte: 220000,
    sourceNotes: ['Top 30 Playbook: $126.4B 2023 revenue, 132,000 entities, $145.2B projected by 2028.', 'Top 30 Playbook investor insight: 20-30% profit margins and 3-5x EBITDA valuations.'],
  },
  {
    id: 'print-marketing',
    name: 'Print Marketing',
    basis: 'Print, branded merchandise, direct mail, design fulfillment, and local marketing services.',
    revenueGrowth: 2.3,
    ebitdaMargin: 27.5,
    grossMargin: 45,
    recurringRevenue: 40,
    ownerDependency: 45,
    topClientPct: 20,
    dso: 35,
    evEbitdaMultiple: 3.75,
    revenuePerFte: 180000,
    sourceNotes: ['Top 30 Playbook: $126.9B 2024 revenue, 35,000 entities, $139.2B projected by 2028.', 'Top 30 Playbook investor insight: 20-35% margins and 3-4.5x EBITDA valuations.'],
  },
  {
    id: 'chimney-fireplace',
    name: 'Chimney & Fireplace',
    basis: 'Chimney sweep, fireplace installation, repair, inspection, and safety services.',
    revenueGrowth: 4.2,
    ebitdaMargin: 35,
    grossMargin: 50,
    recurringRevenue: 20,
    ownerDependency: 50,
    topClientPct: 15,
    dso: 20,
    evEbitdaMultiple: 3.5,
    revenuePerFte: 180000,
    sourceNotes: ['Top 30 Playbook: $10.9B 2024 revenue, $13.4B projected by 2029.', 'Top 30 Playbook investor insight: 30-40% margins and 3-4x EBITDA valuations.'],
  },
  {
    id: 'electrical',
    name: 'Electrical',
    basis: 'Residential and commercial electrical service, panel upgrades, installs, and maintenance.',
    revenueGrowth: 1.5,
    ebitdaMargin: 27.5,
    grossMargin: 42,
    recurringRevenue: 25,
    ownerDependency: 45,
    topClientPct: 15,
    dso: 30,
    evEbitdaMultiple: 4,
    revenuePerFte: 230000,
    sourceNotes: ['Top 30 Playbook: $237.6B 2023 revenue, 70,000 entities, $256.6B projected by 2029.', 'Top 30 Playbook investor insight: 20-35% margins and 3-5x EBITDA valuations.'],
  },
  {
    id: 'water-filtration',
    name: 'Water Filtration',
    basis: 'Water treatment, filtration installation, service plans, and recurring consumables.',
    revenueGrowth: 16.1,
    ebitdaMargin: 25,
    grossMargin: 50,
    recurringRevenue: 55,
    ownerDependency: 40,
    topClientPct: 15,
    dso: 25,
    evEbitdaMultiple: 4,
    revenuePerFte: 200000,
    sourceNotes: ['Top 30 Playbook: $1.8B 2023 revenue, 44,000 entities, $3.8B projected by 2029.', 'Top 30 Playbook investor insight: 20-30% margins and 3-5x EBITDA valuations.'],
  },
  {
    id: 'landscaping',
    name: 'Landscaping',
    basis: 'Residential and commercial landscaping, maintenance routes, enhancement, and seasonal services.',
    revenueGrowth: 7.6,
    ebitdaMargin: 20,
    grossMargin: 40,
    recurringRevenue: 60,
    ownerDependency: 45,
    topClientPct: 20,
    dso: 30,
    evEbitdaMultiple: 3.5,
    revenuePerFte: 140000,
    sourceNotes: ['Top 30 Playbook: $153B 2024 revenue, 641,000 entities, $221B projected by 2029.', 'Top 30 Playbook investor insight: 15-25% profit margins and 3-4x EBITDA valuations.'],
  },
  {
    id: 'laundry-service',
    name: 'Laundry Service',
    basis: 'Route-based laundry, linen, wash-and-fold, and B2B textile service businesses.',
    revenueGrowth: 6.1,
    ebitdaMargin: 27.5,
    grossMargin: 45,
    recurringRevenue: 60,
    ownerDependency: 45,
    topClientPct: 20,
    dso: 30,
    evEbitdaMultiple: 4,
    revenuePerFte: 150000,
    sourceNotes: ['Top 30 Playbook: $15.3B 2023 revenue, 31,000 entities, $26B projected by 2032.', 'Top 30 Playbook investor insight: 25-30% profit margins and 3-5x EBITDA valuations.'],
  },
  {
    id: 'flooring-epoxy',
    name: 'Flooring & Epoxy',
    basis: 'Flooring installation, epoxy, garage floor coating, and specialty surface services.',
    revenueGrowth: 3.8,
    ebitdaMargin: 25,
    grossMargin: 40,
    recurringRevenue: 10,
    ownerDependency: 50,
    topClientPct: 20,
    dso: 25,
    evEbitdaMultiple: 4,
    revenuePerFte: 220000,
    sourceNotes: ['Top 30 Playbook: $21.2B 2023 revenue, 17,000 entities, $27.6B projected by 2030.', 'Top 30 Playbook investor insight: 20-30% margins and 3-5x EBITDA valuations.'],
  },
  {
    id: 'hair-restoration',
    name: 'Hair Restoration',
    basis: 'Hair restoration clinics, aesthetic medical services, and cash-pay treatment operations.',
    revenueGrowth: 7.3,
    ebitdaMargin: 35,
    grossMargin: 60,
    recurringRevenue: 35,
    ownerDependency: 35,
    topClientPct: 10,
    dso: 10,
    evEbitdaMultiple: 5,
    revenuePerFte: 260000,
    sourceNotes: ['Top 30 Playbook: $1.9B 2023 revenue, 86,000 entities, $3.1B projected by 2030.', 'Top 30 Playbook investor insight: 30-40% margins and 4-6x EBITDA valuations.'],
  },
  {
    id: 'pool-services',
    name: 'Pool Services',
    basis: 'Pool maintenance routes, repair, renovation, equipment replacement, and seasonal service.',
    revenueGrowth: 4.9,
    ebitdaMargin: 25,
    grossMargin: 45,
    recurringRevenue: 65,
    ownerDependency: 45,
    topClientPct: 15,
    dso: 20,
    evEbitdaMultiple: 4,
    revenuePerFte: 160000,
    sourceNotes: ['Top 30 Playbook: $8.1B 2023 revenue, 89,000 entities, $10.3B projected by 2029.', 'Top 30 Playbook investor insight: 20-30% margins and 3-5x EBITDA valuations.'],
  },
  {
    id: 'hydration-services',
    name: 'Hydration Services',
    basis: 'IV hydration, vitamin infusion, mobile wellness, and cash-pay health optimization services.',
    revenueGrowth: 10.1,
    ebitdaMargin: 30,
    grossMargin: 60,
    recurringRevenue: 50,
    ownerDependency: 35,
    topClientPct: 10,
    dso: 10,
    evEbitdaMultiple: 4,
    revenuePerFte: 200000,
    sourceNotes: ['Top 30 Playbook: $842M 2024 revenue, $1.5B projected by 2030.', 'Top 30 Playbook investor insight: 25-35% margins and 3-5x EBITDA valuations.'],
  },
  {
    id: 'septic-porta-potty',
    name: 'Septic & Porta Potty',
    basis: 'Septic pumping, portable sanitation, recurring routes, event, and commercial service.',
    revenueGrowth: 5,
    ebitdaMargin: 30,
    grossMargin: 50,
    recurringRevenue: 45,
    ownerDependency: 45,
    topClientPct: 20,
    dso: 25,
    evEbitdaMultiple: 3.75,
    revenuePerFte: 180000,
    sourceNotes: ['Top 30 Playbook: $9.7B 2023 revenue, 9,000 entities, $12.4B projected by 2029.', 'Top 30 Playbook investor insight: 25-35% margins and 3-4.5x EBITDA valuations.'],
  },
  {
    id: 'equipment-rental',
    name: 'Equipment Rental',
    basis: 'Construction, homeowner, and commercial equipment rental businesses with fleet utilization economics.',
    revenueGrowth: 2.9,
    ebitdaMargin: 30,
    grossMargin: 50,
    recurringRevenue: 50,
    ownerDependency: 40,
    topClientPct: 20,
    dso: 35,
    evEbitdaMultiple: 4,
    revenuePerFte: 250000,
    sourceNotes: ['Top 30 Playbook: $59.5B 2024 revenue, 31,000 entities, $70.8B projected by 2030.', 'Top 30 Playbook investor insight: 25-35% margins and 3-5x EBITDA valuations.'],
  },
  {
    id: 'urgent-care',
    name: 'Urgent Care',
    basis: 'Retail urgent care clinics, walk-in medical services, payer operations, and clinical staffing.',
    revenueGrowth: 17,
    ebitdaMargin: 25,
    grossMargin: 45,
    recurringRevenue: 70,
    ownerDependency: 35,
    topClientPct: 10,
    dso: 40,
    evEbitdaMultiple: 4.5,
    revenuePerFte: 210000,
    sourceNotes: ['Top 30 Playbook: $46.4B 2023 revenue, 14,000 entities, $163.4B projected by 2032.', 'Top 30 Playbook investor insight: 20-30% profit margins.'],
  },
  {
    id: 'fencing',
    name: 'Fencing',
    basis: 'Residential and commercial fencing, repair, install, and outdoor improvement contracting.',
    revenueGrowth: 6.1,
    ebitdaMargin: 22.5,
    grossMargin: 35,
    recurringRevenue: 10,
    ownerDependency: 50,
    topClientPct: 20,
    dso: 25,
    evEbitdaMultiple: 3.75,
    revenuePerFte: 200000,
    sourceNotes: ['Top 30 Playbook: $8.8B 2023 revenue, 6,000 entities, $14.1B projected by 2032.', 'Top 30 Playbook investor insight: 20-25% margins and 3-4.5x EBITDA valuations.'],
  },
  {
    id: 'towing-repair',
    name: 'Towing & Repair',
    basis: 'Towing, roadside assistance, fleet contracts, repair, and 24/7 dispatch operations.',
    revenueGrowth: 5.8,
    ebitdaMargin: 27.5,
    grossMargin: 45,
    recurringRevenue: 30,
    ownerDependency: 50,
    topClientPct: 20,
    dso: 20,
    evEbitdaMultiple: 4,
    revenuePerFte: 180000,
    sourceNotes: ['Top 30 Playbook: $12.9B 2024 revenue, 43,000 entities, $17.1B projected by 2029.', 'Top 30 Playbook investor insight: 20-35% margins and 3-5x EBITDA valuations.'],
  },
  {
    id: 'med-spa',
    name: 'Med Spa',
    basis: 'Aesthetic medical clinics, injectables, lasers, memberships, and cash-pay wellness services.',
    revenueGrowth: 14.8,
    ebitdaMargin: 32.5,
    grossMargin: 60,
    recurringRevenue: 55,
    ownerDependency: 35,
    topClientPct: 10,
    dso: 10,
    evEbitdaMultiple: 4.25,
    revenuePerFte: 250000,
    sourceNotes: ['Top 30 Playbook: $17.2B 2023 revenue, 10,000 entities, $59.4B projected by 2033.', 'Top 30 Playbook investor insight: 25-40% margins and 3.5-5x EBITDA valuations.'],
  },
  {
    id: 'janitorial-services',
    name: 'Janitorial Services',
    basis: 'Janitorial routes, facility cleaning, contract service, and low-inventory recurring operations.',
    revenueGrowth: 1,
    ebitdaMargin: 27.5,
    grossMargin: 45,
    recurringRevenue: 80,
    ownerDependency: 45,
    topClientPct: 20,
    dso: 35,
    evEbitdaMultiple: 3.75,
    revenuePerFte: 110000,
    sourceNotes: ['Top 30 Playbook: $106.7B 2024 revenue, 1,230,000 entities, $111.9B projected by 2029.', 'Top 30 Playbook investor insight: 20-35% margins and 3-4.5x EBITDA valuations.'],
  },
  {
    id: 'garage-door-services',
    name: 'Garage Door Services',
    basis: 'Garage door repair, installation, maintenance plans, and urgent residential/light commercial service.',
    revenueGrowth: 6.2,
    ebitdaMargin: 30,
    grossMargin: 45,
    recurringRevenue: 30,
    ownerDependency: 45,
    topClientPct: 15,
    dso: 20,
    evEbitdaMultiple: 4.25,
    revenuePerFte: 190000,
    sourceNotes: ['Top 30 Playbook: $6.6B 2023 revenue, 5,000 entities, $11.3B projected by 2032.', 'Top 30 Playbook investor insight: 25-35% margins and 3.5-5x EBITDA valuations.'],
  },
  {
    id: 'commercial-cleaning',
    name: 'Commercial Cleaning',
    basis: 'Office, medical, retail, school, and contract-driven commercial cleaning companies.',
    revenueGrowth: 4.7,
    ebitdaMargin: 25,
    grossMargin: 42,
    recurringRevenue: 85,
    ownerDependency: 45,
    topClientPct: 20,
    dso: 35,
    evEbitdaMultiple: 4,
    revenuePerFte: 115000,
    sourceNotes: ['Top 30 Playbook: $90B 2022 revenue, 1,200,000 entities, $130.3B projected by 2030.', 'Top 30 Playbook investor insight: 20-30% margins and 3-5x EBITDA valuations.'],
  },
  {
    id: 'niche-markets',
    name: 'Niche Markets',
    basis: 'Specialized local service niches where trust, routes, regulation, or technical know-how create defensible moats.',
    revenueGrowth: 6,
    ebitdaMargin: 30,
    grossMargin: 50,
    recurringRevenue: 40,
    ownerDependency: 55,
    topClientPct: 20,
    dso: 30,
    evEbitdaMultiple: 3.75,
    revenuePerFte: 180000,
    sourceNotes: ['Top 30 Playbook: listed as the 30th industry category on the Top 30 Business Industries page.', 'Top 30 Playbook investor insight: niche services can produce 25-35% margins and 3-4.5x EBITDA valuations.'],
  },
]

const lifepointQuestionResponses: Record<string, QuestionResponse> = {
  'leadership-senior-management-team-is-there-a-formal-senior-management-team-recognized-by-employees': {
    score: 3,
    answer: 'Founder-led. There is not yet a formal senior management team that could run advisory, sales, finance, and operations independently.',
    evidence: 'Advisor interview placeholder. Confirm with org chart and role map.',
    status: 'sample',
  },
  'leadership-succession-planning-is-there-a-written-succession-plan-in-place': {
    score: 2,
    answer: 'No written CEO succession plan is currently modeled in the sample data.',
    evidence: 'Missing actual intake answer. This should be answered during the Value Engine interview.',
    status: 'missing',
  },
  'sales-sales-operations-describe-the-tracking-and-reporting-of-sales-results-against-targets-and': {
    score: 5,
    answer: 'Sales motion exists, but the process appears relationship-led and not fully documented into a repeatable non-owner system.',
    evidence: 'Sample answer based on current owner-dependency assumption.',
    status: 'sample',
  },
  'finance-planning-analysis-and-reporting-are-financials-prepared-and-reviewed-each-month-p-and-l-b-s-cash-flow': {
    score: 8,
    answer: 'Financial reporting is assumed to be strong because Lifepoint has advisory discipline and monthly reporting expectations.',
    evidence: 'Sample answer. Replace with uploaded QBO reporting cadence and close date.',
    status: 'sample',
  },
}

const clients: Record<ClientId, Client> = {
  lifepoint: {
    id: 'lifepoint',
    name: 'Lifepoint Financial Design',
    industry: 'Professional Services',
    advisors: ['Mike Metzger, CFP, CVGA'],
    lastUpdated: 'June 2026',
    dataQuality: 'demo',
    data: {
      financials: {
        revenue: 420000,
        totalExpenses: 294000,
        ebitda: 126000,
        ebitdaMargin: 30,
        ownerAddbacks: 60000,
        normalizedEbitda: 186000,
        cash: 95000,
        ar: 12000,
        payroll: 168000,
        currentAssets: 107000,
        currentLiabilities: 27000,
        workingCapital: 80000,
        operatingCashFlow: 118000,
        debt: 0,
        dso: 10,
        recurringRevenue: 42,
        customerCount: 28,
        newClientsThisMonth: 3,
        churnRate: 5,
        laborPct: 40,
        runway: 24,
        ownerPctRevenue: 85,
        topClientPct: 22,
        grossMargin: 68,
        pipelineCoverage: 1.8,
        revenuePerClient: 15000,
      },
      assessment: {
        planning: { 'Strategic plan': 6, 'Target market clarity': 7, 'Market position': 6, 'Growth outlook': 7, 'Exit plan': 4 },
        leadership: { 'Owner dependency': 3, 'Management team': 4, 'Key-person risk': 4, Succession: 3, Culture: 7 },
        sales: { 'Revenue concentration': 5, 'Sales process': 5, Pipeline: 5, 'Pricing power': 6, 'Recurring revenue': 5 },
        marketing: { 'Market position': 7, 'Brand awareness': 6, 'Digital presence': 7, 'Referral system': 8, 'Content strategy': 6 },
        people: { 'Key talent': 4, 'Hiring process': 6, Training: 6, Compensation: 7, Culture: 7 },
        operations: { Processes: 5, Technology: 7, Vendors: 7, Efficiency: 6, Scalability: 5 },
        finance: { 'Financial controls': 8, Reporting: 8, 'Cash management': 7, Budgeting: 7, 'Tax optimization': 7 },
        legal: { Contracts: 8, Compliance: 8, 'IP protection': 7, 'Entity structure': 8, 'Risk management': 7 },
      },
      questionResponses: lifepointQuestionResponses,
      advisorObjectives: defaultAdvisorObjectives,
      monthlyHistory: [
        { month: 'Jan', revenue: 380000, ebitda: 110000, ebitdaMargin: 29, vesScore: 5.2, value: 1488000 },
        { month: 'Feb', revenue: 395000, ebitda: 118000, ebitdaMargin: 30, vesScore: 5.3, value: 1536000 },
        { month: 'Mar', revenue: 400000, ebitda: 120000, ebitdaMargin: 30, vesScore: 5.4, value: 1580000 },
        { month: 'Apr', revenue: 410000, ebitda: 123000, ebitdaMargin: 30, vesScore: 5.5, value: 1625000 },
        { month: 'May', revenue: 415000, ebitda: 125000, ebitdaMargin: 30, vesScore: 5.6, value: 1672000 },
        { month: 'Jun', revenue: 420000, ebitda: 126000, ebitdaMargin: 30, vesScore: 5.7, value: 1720000 },
      ],
    },
  },
}

const clientStorageKey = 'value-intelligence-hub.clients.v1'
const authStorageKey = 'value-intelligence-hub.auth.v1'
const authSessionKey = 'value-intelligence-hub.session-email.v1'

function syncAuthStateClientIds(state: AuthState, clientIds: ClientId[]): AuthState {
  const uniqueClientIds = Array.from(new Set(clientIds))
  return {
    ...state,
    allClientIds: uniqueClientIds,
    accounts: Object.fromEntries(
      Object.entries(state.accounts).map(([email, account]) => [
        email,
        {
          ...account,
          clientIds: account.role === 'owner' ? uniqueClientIds : account.clientIds.filter((clientId) => uniqueClientIds.includes(clientId)),
        },
      ]),
    ),
  }
}

function readStoredAuthState(clientIds: ClientId[]): AuthState {
  const initial = buildInitialAuthState(clientIds)
  if (typeof window === 'undefined') return initial
  try {
    const stored = window.localStorage.getItem(authStorageKey)
    if (!stored) return initial
    const parsed = JSON.parse(stored) as AuthState
    if (!parsed?.accounts || !parsed?.invitations) return initial
    return syncAuthStateClientIds(parsed, clientIds)
  } catch {
    return initial
  }
}

function readStoredSession(authState: AuthState): Session | null {
  if (typeof window === 'undefined') return null
  const email = window.localStorage.getItem(authSessionKey)
  return email ? signIn(authState, email) : null
}

function roleLabel(role: PortalRole) {
  if (role === 'owner') return 'Owner'
  if (role === 'advisor') return 'Advisor'
  return 'Client'
}

function readStoredClients() {
  if (typeof window === 'undefined') return clients
  try {
    const stored = window.localStorage.getItem(clientStorageKey)
    if (!stored) return clients
    const parsed = JSON.parse(stored) as Record<ClientId, Client>
    if (!parsed || typeof parsed !== 'object') return clients
    const merged = { ...clients, ...parsed }
    return Object.fromEntries(
      Object.entries(merged).map(([id, client]) => [
        id,
        {
          ...client,
          data: {
            ...client.data,
            financials: { ...blankFinancials, ...client.data.financials },
            qboImportLog: client.data.qboImportLog ?? [],
            crmImportLog: client.data.crmImportLog ?? [],
            advisorObjectives: mergeAdvisorObjectives(client.data.advisorObjectives),
            decisionLabScenarios: client.data.decisionLabScenarios ?? [],
          },
        },
      ]),
    )
  } catch {
    return clients
  }
}

const blankFinancials: Financials = {
  revenue: 0,
  totalExpenses: 0,
  ebitda: 0,
  ebitdaMargin: 0,
  ownerAddbacks: 0,
  normalizedEbitda: 0,
  cash: 0,
  ar: 0,
  payroll: 0,
  currentAssets: 0,
  currentLiabilities: 0,
  workingCapital: 0,
  operatingCashFlow: 0,
  debt: 0,
  dso: 0,
  recurringRevenue: 0,
  customerCount: 0,
  newClientsThisMonth: 0,
  churnRate: 0,
  laborPct: 0,
  runway: 0,
  ownerPctRevenue: 100,
  topClientPct: 0,
  grossMargin: 0,
  pipelineCoverage: 0,
  revenuePerClient: 0,
}

function createStarterAssessment(): AssessmentData {
  return Object.fromEntries(
    dimensions.map((dimension) => [
      dimension.id,
      Object.fromEntries(['Baseline', 'Evidence', 'Repeatability', 'Risk', 'Owner independence'].map((item) => [item, 5])),
    ]),
  )
}

function createClientId(name: string, existingIds: string[]) {
  const base = safeFileName(name) || 'company'
  let id = base
  let index = 2
  while (existingIds.includes(id)) {
    id = `${base}-${index}`
    index += 1
  }
  return id
}

function createNewClient({ name, industryId, advisor }: CompanyForm, existingIds: string[]): Client {
  const benchmark = getIndustryBenchmark(industryId)
  const id = createClientId(name, existingIds)
  return {
    id,
    name: name.trim(),
    industry: benchmark.name,
    advisors: [advisor.trim() || 'Lifepoint advisor'],
    lastUpdated: 'Awaiting first import',
    dataQuality: 'partial',
    data: {
      financials: { ...blankFinancials },
      assessment: createStarterAssessment(),
      questionResponses: {},
      advisorObjectives: defaultAdvisorObjectives,
      qboImportLog: [],
      crmImportLog: [],
      monthlyHistory: [{ month: 'Start', revenue: 0, ebitda: 0, ebitdaMargin: 0, vesScore: 5, value: 0 }],
    },
  }
}

function mergeAdvisorObjectives(saved?: AdvisorObjective[]) {
  const savedById = new Map((saved ?? []).map((objective) => [objective.id, objective]))
  return defaultAdvisorObjectives.map((objective) => ({ ...objective, ...savedById.get(objective.id) }))
}

function money(value: number | null | undefined) {
  if (value == null) return 'Not applicable'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: Math.abs(value) >= 1000000 ? 'compact' : 'standard',
    maximumFractionDigits: Math.abs(value) >= 1000000 ? 1 : 0,
  }).format(value)
}

function number(value: number, suffix = '') {
  return `${Math.round(value * 10) / 10}${suffix}`
}

function businessPositionSummary(financials: Financials) {
  const profitable = financials.normalizedEbitda > 0
  const cashStable = financials.operatingCashFlow >= 0 && financials.runway >= 3
  if (profitable && cashStable) return 'The business currently shows positive normalized EBITDA and stable near-term cash capacity.'
  if (!profitable && !cashStable) return 'The business currently has nonpositive normalized EBITDA and visible cash pressure, so an alternate valuation method and cash stabilization plan are required.'
  if (!profitable) return 'The business currently has nonpositive normalized EBITDA, so the EV/EBITDA method is not applicable and an alternate valuation method is required.'
  return 'The business currently shows positive normalized EBITDA, but cash pressure should be addressed before treating the forecast as durable.'
}

const financialFieldLabels: Partial<Record<keyof Financials, string>> = {
  revenue: 'Revenue',
  totalExpenses: 'Total expenses',
  ebitda: 'EBITDA / net income',
  ebitdaMargin: 'EBITDA margin',
  normalizedEbitda: 'Normalized EBITDA',
  cash: 'Cash',
  ar: 'A/R',
  payroll: 'Payroll',
  currentAssets: 'Current assets',
  currentLiabilities: 'Current liabilities',
  workingCapital: 'Working capital',
  operatingCashFlow: 'Operating cash flow',
  debt: 'Debt',
  dso: 'DSO',
  customerCount: 'Customer count',
  newClientsThisMonth: 'New clients',
  churnRate: 'Churn rate',
  laborPct: 'Labor %',
  runway: 'Cash runway',
  recurringRevenue: 'Recurring revenue',
  topClientPct: 'Top client concentration',
  grossMargin: 'Gross margin',
  pipelineCoverage: 'Pipeline coverage',
  revenuePerClient: 'Revenue per client',
}

function formatFinancialField(key: keyof Financials, value: number) {
  if ([
    'revenue',
    'totalExpenses',
    'ebitda',
    'normalizedEbitda',
    'cash',
    'ar',
    'payroll',
    'currentAssets',
    'currentLiabilities',
    'workingCapital',
    'operatingCashFlow',
    'debt',
    'revenuePerClient',
  ].includes(key)) {
    return money(value)
  }
  if (['ebitdaMargin', 'recurringRevenue', 'churnRate', 'laborPct', 'ownerPctRevenue', 'topClientPct', 'grossMargin'].includes(key)) {
    return `${number(value)}%`
  }
  if (key === 'dso') return `${number(value)} days`
  if (key === 'runway') return `${number(value)} months`
  if (key === 'pipelineCoverage') return `${number(value)}x`
  return number(value)
}

function getFinancialChanges(before: Financials, after: Financials, keys: Array<keyof Financials>) {
  return keys
    .filter((key) => before[key] !== after[key])
    .map((key) => ({
      label: financialFieldLabels[key] ?? key,
      before: formatFinancialField(key, before[key]),
      after: formatFinancialField(key, after[key]),
    }))
}

function average(values: Record<string, number>) {
  const nums = Object.values(values)
  if (!nums.length) return 0
  return nums.reduce((sum, value) => sum + value, 0) / nums.length
}

function scoreTone(score: number) {
  if (score >= 7.5) return 'strong'
  if (score >= 6) return 'steady'
  if (score >= 4) return 'watch'
  return 'risk'
}

function scoreLabel(score: number) {
  if (score >= 7.5) return 'Strong'
  if (score >= 6) return 'Solid'
  if (score >= 4) return 'Exposed'
  return 'Priority'
}

function scoreColor(score: number) {
  if (score >= 7.5) return '#15803d'
  if (score >= 6) return '#2563eb'
  if (score >= 4) return '#b45309'
  return '#b91c1c'
}

function getDimensionScores(assessment: AssessmentData) {
  return dimensions.map((dimension) => ({
    ...dimension,
    score: average(assessment[dimension.id]),
    items: Object.entries(assessment[dimension.id]).map(([label, score]) => ({ label, score })),
  }))
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function calculateHealthScore(financials: Financials, vesScore: number) {
  return Math.round(
    (vesScore / 10) * 20 +
      (clamp(financials.ebitdaMargin, 0, 30) / 30) * 18 +
      (clamp(financials.grossMargin, 0, 60) / 60) * 10 +
      (Math.min(financials.runway, 6) / 6) * 14 +
      (financials.workingCapital > 0 ? 8 : 0) +
      (financials.operatingCashFlow > 0 ? 8 : 0) +
      ((100 - clamp(financials.dso, 0, 90)) / 100) * 8 +
      ((100 - clamp(financials.topClientPct, 0, 80)) / 100) * 7 +
      ((100 - clamp(financials.ownerPctRevenue, 0, 100)) / 100) * 7,
  )
}

function getQuestionResponse(client: Client, questionId: string, dimensionId: string): QuestionResponse {
  const response = client.data.questionResponses[questionId]
  if (response) return response

  const dimensionScore = average(client.data.assessment[dimensionId] ?? { default: 0 })
  return {
    score: Math.round(dimensionScore),
    answer: 'Not answered yet. This is where the client intake answer will live once the Value Engine interview is completed or imported.',
    evidence: 'No confirmed answer attached.',
    status: 'missing',
  }
}

function buildForecasts(financials: Financials, vesScore: number, benchmark: IndustryBenchmark, dataQuality: Client['dataQuality']) {
  const periods = [
    { label: 'Next 30 days', months: 1 },
    { label: 'Next quarter', months: 3 },
    { label: 'Next 6 months', months: 6 },
    { label: 'Next year', months: 12 },
  ]

  return periods.map((period) => {
    const lift = period.months / 12
    const assumptions = calculateForecastAssumptions({ financials, benchmark, months: period.months })
    const revenue = financials.revenue * (1 + (assumptions.revenueGrowthRate / 100) * lift)
    const margin = clamp(financials.ebitdaMargin + assumptions.marginExpansion, 0, 60)
    const normalizedEbitda = revenue * (margin / 100) + financials.ownerAddbacks
    const ownerDependency = projectReducedPercentage(financials.ownerPctRevenue, assumptions.ownerDependencyReduction)
    const recurringRevenue = clamp(financials.recurringRevenue + assumptions.recurringRevenueLift, 0, 100)
    const dso = clamp(financials.dso - assumptions.dsoReduction, 0, 90)
    const topClientPct = projectReducedPercentage(financials.topClientPct, assumptions.topClientReduction)
    const projectedVes = clamp(vesScore + 1.1 * lift, 0, 10)
    const forecastFinancials = {
      ...financials,
      revenue,
      ebitda: revenue * (margin / 100),
      ebitdaMargin: margin,
      normalizedEbitda,
      dso,
      topClientPct,
      ownerPctRevenue: ownerDependency,
      recurringRevenue,
      revenueGrowth: assumptions.revenueGrowthRate,
    }
    const multipleMethodology = calculateIndustryAnchoredMultiple({
      financials: forecastFinancials,
      benchmark,
      vesScore: projectedVes,
      dataQuality,
    })
    const multiple = multipleMethodology.adjusted
    const value = calculateEnterpriseValue(normalizedEbitda, multiple)
    const monthlyCashFlow = (financials.operatingCashFlow || financials.ebitda || normalizedEbitda) / 12
    const monthlyExpense = Math.max((financials.totalExpenses || financials.revenue - financials.ebitda || financials.revenue * 0.7) / 12, 1)
    const cash = Math.max(0, financials.cash + monthlyCashFlow * period.months)
    const runway = Math.round((cash / monthlyExpense) * 10) / 10
    const workingCapital = financials.workingCapital + Math.max(monthlyCashFlow, 0) * period.months * 0.2
    const healthScore = calculateHealthScore(
      {
        ...forecastFinancials,
        cash,
        runway,
        workingCapital,
      },
      projectedVes,
    )

    return {
      ...period,
      assumptions,
      revenue,
      margin,
      normalizedEbitda,
      ownerDependency,
      recurringRevenue,
      dso,
      topClientPct,
      projectedVes,
      multiple,
      value,
      cash,
      runway,
      healthScore,
    }
  })
}

function riskTone(score: number): RiskTone {
  if (score >= 75) return 'red'
  if (score >= 45) return 'yellow'
  return 'green'
}

function describeRiskTone(tone: RiskTone) {
  if (tone === 'red') return 'High risk'
  if (tone === 'yellow') return 'Watch'
  return 'Healthy'
}

function annualTrend(history: MonthlySnapshot[], key: keyof Pick<MonthlySnapshot, 'revenue' | 'ebitdaMargin' | 'healthScore'>) {
  const values = history
    .map((snapshot) => snapshot[key])
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  if (values.length < 2) return 0
  const first = values.at(-4) ?? values[0]
  const last = values.at(-1) ?? first
  return key === 'revenue' ? percentGrowth(first, last) : last - first
}

function revenueVolatility(history: MonthlySnapshot[]) {
  const revenues = history.map((snapshot) => snapshot.revenue).filter((value) => value > 0)
  if (revenues.length < 3) return 0
  const changes = revenues.slice(1).map((value, index) => percentGrowth(revenues[index], value))
  const mean = changes.reduce((sum, value) => sum + value, 0) / changes.length
  const variance = changes.reduce((sum, value) => sum + (value - mean) ** 2, 0) / changes.length
  return Math.sqrt(variance)
}

function buildCfoAdvisory({
  client,
  forecasts,
  vesScore,
  currentValue,
  currentMultiple,
  multipleMethodology,
}: {
  client: Client
  forecasts: ReturnType<typeof buildForecasts>
  vesScore: number
  currentValue: number | null
  currentMultiple: number
  multipleMethodology: MultipleMethodology
}): CfoAdvisoryModel {
  const financials = client.data.financials
  const history = buildVisibleHistory(client)
  const currentHealth = calculateHealthScore(financials, vesScore)
  const monthlyCashFlow = financials.operatingCashFlow ? financials.operatingCashFlow / 12 : (financials.revenue - financials.totalExpenses) / 12
  const monthlyBurn = Math.max(-monthlyCashFlow, 0)
  const breakEvenGap = monthlyCashFlow >= 0 ? 0 : monthlyBurn
  const dangerMonths = monthlyBurn > 0 ? financials.cash / monthlyBurn : 0
  const cashDangerDate =
    monthlyBurn > 0
      ? `${dangerMonths.toFixed(1)} months`
      : financials.runway
        ? `No burn; ${number(financials.runway)} months expense runway`
        : 'No burn date modeled'
  const revTrend = annualTrend(history, 'revenue')
  const marginTrend = annualTrend(history, 'ebitdaMargin')
  const volatility = revenueVolatility(history)
  const currentRatio = financials.currentLiabilities ? financials.currentAssets / financials.currentLiabilities : 0
  const debtToEbitda = financials.normalizedEbitda > 0 ? financials.debt / financials.normalizedEbitda : financials.debt ? 99 : 0
  const missingInputs = getMissingQboInputs(financials)

  const signals: RiskSignal[] = [
    {
      id: 'cash',
      label: 'Cash runway',
      score: financials.runway < 3 || monthlyCashFlow < 0 ? 88 : financials.runway < 6 ? 58 : 22,
      tone: riskTone(financials.runway < 3 || monthlyCashFlow < 0 ? 88 : financials.runway < 6 ? 58 : 22),
      metric: `${number(financials.runway)} months`,
      summary: monthlyCashFlow < 0 ? `Cash is declining by about ${money(monthlyBurn)} per month.` : 'Cash flow is not currently burning cash.',
      action: 'Protect collections, confirm monthly close data, and decide how much growth investment cash can support.',
    },
    {
      id: 'revenue',
      label: 'Revenue momentum',
      score: revTrend < -3 || volatility > 12 ? 82 : revTrend < 3 || volatility > 7 ? 55 : 24,
      tone: riskTone(revTrend < -3 || volatility > 12 ? 82 : revTrend < 3 || volatility > 7 ? 55 : 24),
      metric: `${revTrend.toFixed(1)}% trend`,
      summary: volatility > 7 ? `Revenue is moving with ${volatility.toFixed(1)}% volatility.` : 'Revenue trend is stable enough for a base forecast.',
      action: 'Tie the next-quarter forecast to pipeline coverage, pricing, and client retention assumptions.',
    },
    {
      id: 'margin',
      label: 'Margin compression',
      score: financials.ebitdaMargin < 10 || marginTrend < -3 ? 84 : financials.ebitdaMargin < 18 || marginTrend < 0 ? 56 : 20,
      tone: riskTone(financials.ebitdaMargin < 10 || marginTrend < -3 ? 84 : financials.ebitdaMargin < 18 || marginTrend < 0 ? 56 : 20),
      metric: `${number(financials.ebitdaMargin, '%')} EBITDA`,
      summary: marginTrend < 0 ? `Margin has moved down ${Math.abs(marginTrend).toFixed(1)} points in the visible history.` : 'Margin is not showing a compression pattern.',
      action: 'Review pricing, scope creep, labor ratio, direct costs, and unpriced delivery work.',
    },
    {
      id: 'working-capital',
      label: 'Working capital',
      score: financials.workingCapital < 0 || financials.dso > 60 || (currentRatio > 0 && currentRatio < 1) ? 86 : financials.dso > 35 || currentRatio < 1.5 ? 54 : 22,
      tone: riskTone(financials.workingCapital < 0 || financials.dso > 60 || (currentRatio > 0 && currentRatio < 1) ? 86 : financials.dso > 35 || currentRatio < 1.5 ? 54 : 22),
      metric: `${number(financials.dso)} DSO`,
      summary: financials.workingCapital < 0 ? 'Short-term obligations exceed current operating assets.' : 'Working capital is not the first visible constraint.',
      action: 'Use A/R aging, payment terms, and current liabilities to catch cash stress before the P&L shows it.',
    },
    {
      id: 'concentration',
      label: 'Client concentration',
      score: financials.topClientPct > 35 ? 86 : financials.topClientPct > 20 ? 58 : 24,
      tone: riskTone(financials.topClientPct > 35 ? 86 : financials.topClientPct > 20 ? 58 : 24),
      metric: `${number(financials.topClientPct, '%')} top client`,
      summary: financials.topClientPct > 20 ? 'One relationship can materially move revenue, cash flow, and valuation.' : 'Top-client exposure is within a healthier range.',
      action: 'Reduce dependence on the largest client by adding right-fit accounts and packaging repeatable offers.',
    },
    {
      id: 'owner-dependency',
      label: 'Owner dependency',
      score: financials.ownerPctRevenue > 75 ? 90 : financials.ownerPctRevenue > 50 ? 62 : 25,
      tone: riskTone(financials.ownerPctRevenue > 75 ? 90 : financials.ownerPctRevenue > 50 ? 62 : 25),
      metric: `${number(financials.ownerPctRevenue, '%')} owner-led`,
      summary: financials.ownerPctRevenue > 50 ? 'The business still depends heavily on the owner for revenue, delivery, or decisions.' : 'Owner dependency is not suppressing the model as heavily.',
      action: 'Document owner-led workflows, assign backups, and move client trust into the company system.',
    },
    {
      id: 'recurring-revenue',
      label: 'Revenue durability',
      score: financials.recurringRevenue < 25 ? 78 : financials.recurringRevenue < 50 ? 52 : 20,
      tone: riskTone(financials.recurringRevenue < 25 ? 78 : financials.recurringRevenue < 50 ? 52 : 20),
      metric: `${number(financials.recurringRevenue, '%')} recurring`,
      summary: financials.recurringRevenue < 50 ? 'Forecast confidence is limited until more revenue is contracted or repeatable.' : 'Recurring revenue supports forecast visibility.',
      action: 'Move more work into monthly packages, renewals, retainers, or other visible recurring structures.',
    },
    {
      id: 'debt',
      label: 'Debt pressure',
      score: debtToEbitda > 3 ? 84 : debtToEbitda > 1.5 ? 55 : 18,
      tone: riskTone(debtToEbitda > 3 ? 84 : debtToEbitda > 1.5 ? 55 : 18),
      metric: `${debtToEbitda.toFixed(1)}x EBITDA`,
      summary: debtToEbitda > 1.5 ? 'Debt service may limit reinvestment flexibility.' : 'Debt is not a major visible limiter.',
      action: 'Compare debt service to monthly cash flow before adding headcount or major growth spend.',
    },
    {
      id: 'forecast-confidence',
      label: 'Forecast confidence',
      score: client.dataQuality === 'demo' || missingInputs.length >= 4 ? 86 : client.dataQuality === 'partial' || missingInputs.length ? 58 : 20,
      tone: riskTone(client.dataQuality === 'demo' || missingInputs.length >= 4 ? 86 : client.dataQuality === 'partial' || missingInputs.length ? 58 : 20),
      metric: client.dataQuality === 'actual' ? 'Actual inputs' : `${missingInputs.length} missing`,
      summary: missingInputs.length ? `Forecast needs ${missingInputs.slice(0, 2).join(' and ')}${missingInputs.length > 2 ? ' plus more inputs' : ''}.` : 'Forecast inputs are complete enough for advisory use.',
      action: 'Load QBO reports, customer data, recurring revenue, and confirmed Value Engine answers before relying on the projection.',
    },
  ]

  const riskSignals = signals.sort((a, b) => b.score - a.score)
  const primaryRisk = riskSignals[0]
  const secondaryRisk = riskSignals[1] ?? primaryRisk
  const bearMultiple = calculateBearCaseMultiple(currentMultiple, multipleMethodology.floor, multipleMethodology.adjustments)
  const upsideForecast = forecasts.at(-1)
  const valuationRange: ValuationScenario[] = [
    {
      label: 'Bear',
      value: calculateEnterpriseValue(financials.normalizedEbitda, bearMultiple),
      multiple: bearMultiple,
      summary: 'Current normalized EBITDA with a lower multiple for unresolved operating or data risk.',
    },
    {
      label: 'Base',
      value: currentValue,
      multiple: currentMultiple,
      summary: 'Current normalized EBITDA times the selected industry benchmark, adjusted for company-specific quality and risk.',
    },
    {
      label: 'Upside',
      value: upsideForecast?.value ?? currentValue,
      multiple: upsideForecast?.multiple ?? currentMultiple,
      summary: '12-month case if margin, recurring revenue, transferability, and forecast assumptions improve.',
    },
  ]
  const confidence: ForwardHealthPeriod['confidence'] = client.dataQuality === 'actual' ? 'High' : client.dataQuality === 'partial' ? 'Medium' : 'Low'
  const forwardHealth: ForwardHealthPeriod[] = [
    {
      label: 'Current',
      healthScore: currentHealth,
      cash: financials.cash,
      runway: financials.runway,
      revenue: financials.revenue,
      margin: financials.ebitdaMargin,
      value: currentValue,
      confidence,
    },
    ...forecasts.map((forecast) => ({
      label: forecast.label,
      healthScore: forecast.healthScore,
      cash: forecast.cash,
      runway: forecast.runway,
      revenue: forecast.revenue,
      margin: forecast.margin,
      value: forecast.value,
      confidence,
    })),
  ]

  return {
    forwardHealth,
    riskSignals,
    valuationRange,
    multipleMethodology,
    primaryRisk,
    secondaryRisk,
    whatBreaksFirst: `If the current pattern continues, the first likely constraint is ${primaryRisk.label.toLowerCase()}: ${primaryRisk.summary} The second watch item is ${secondaryRisk.label.toLowerCase()}: ${secondaryRisk.summary}`,
    cashDangerDate,
    monthlyCashFlow,
    breakEvenGap,
    revenueVolatility: volatility,
  }
}

function getKpiRows(financials: Financials) {
  const qboConfidence = financials.revenue || financials.cash || financials.ar ? 'QBO import' : 'Needs QBO'
  const calculatedConfidence = financials.revenue ? 'Calculated from QBO' : 'Needs QBO'
  return [
    { label: 'Annual revenue', value: money(financials.revenue), source: 'QBO P&L', confidence: qboConfidence, target: money(Math.max(financials.revenue * 1.2, 520000)), gap: financials.revenue ? money(Math.max(financials.revenue * 0.2, 0)) : 'Needs P&L', action: 'Confirm revenue trend, pricing, and service-line mix from monthly P&L exports.' },
    { label: 'Total expenses', value: money(financials.totalExpenses), source: 'QBO P&L', confidence: financials.totalExpenses ? 'QBO import' : 'Needs P&L', target: financials.revenue ? `<${money(financials.revenue * 0.72)}` : 'Needs revenue', gap: financials.totalExpenses && financials.revenue ? `${number((financials.totalExpenses / financials.revenue) * 100)}% of revenue` : 'Needs P&L', action: 'Use expense ratio to flag margin drag before it becomes a cash problem.' },
    { label: 'Normalized EBITDA', value: money(financials.normalizedEbitda), source: 'QBO + add-backs', confidence: qboConfidence, target: money(Math.max(financials.revenue * 0.25, 1)), gap: financials.revenue ? `${number(financials.ebitdaMargin)}% margin` : 'Needs P&L', action: 'Protect margin while separating true operating profit from owner add-backs.' },
    { label: 'EBITDA margin', value: `${financials.ebitdaMargin}%`, source: 'Calculated', confidence: calculatedConfidence, target: '25%+', gap: financials.ebitdaMargin >= 25 ? 'On target' : `${number(Math.max(25 - financials.ebitdaMargin, 0))} pts`, action: 'Standardize scope, reduce unpriced customization, and track delivery hours by client.' },
    { label: 'Gross margin', value: `${financials.grossMargin}%`, source: 'QBO P&L', confidence: financials.grossMargin ? 'QBO import' : 'Needs P&L', target: 'Industry-specific', gap: financials.grossMargin ? 'Review vs benchmark' : 'Needs COGS/gross profit', action: 'Use gross margin to identify pricing, labor, or direct cost issues.' },
    { label: 'Cash', value: money(financials.cash), source: 'QBO Balance Sheet', confidence: financials.cash ? 'QBO import' : 'Needs Balance Sheet', target: '3-6 months runway', gap: financials.runway ? `${number(financials.runway)} months runway` : 'Needs cash and expenses', action: 'Anchor operating decisions in actual cash capacity, not profit alone.' },
    { label: 'Working capital', value: money(financials.workingCapital), source: 'QBO Balance Sheet', confidence: financials.currentAssets || financials.currentLiabilities ? 'Calculated from QBO' : 'Needs Balance Sheet', target: '>0', gap: financials.workingCapital >= 0 ? 'Positive' : money(Math.abs(financials.workingCapital)), action: 'Watch whether short-term assets comfortably cover short-term obligations.' },
    { label: 'Recurring revenue', value: `${financials.recurringRevenue}%`, source: 'CRM/manual', confidence: 'Needs import', target: '70%', gap: '28 pts', action: 'Move clients into clear monthly advisory tiers with renewal dates.' },
    { label: 'Owner dependency', value: `${financials.ownerPctRevenue}%`, source: 'Advisor interview', confidence: 'Needs confirmation', target: '<50%', gap: '35 pts', action: 'Document sales process, build referral partner pipeline, and delegate delivery components.' },
    { label: 'Top client concentration', value: `${financials.topClientPct}%`, source: 'Sales by Customer', confidence: financials.topClientPct ? 'QBO import' : 'Needs Sales by Customer', target: '<15%', gap: financials.topClientPct ? `${Math.max(financials.topClientPct - 15, 0)} pts` : 'Needs customer report', action: 'Add clients in target segment and avoid letting one relationship dominate growth.' },
    { label: 'DSO', value: `${financials.dso} days`, source: 'A/R + revenue', confidence: financials.dso ? 'Calculated from QBO' : 'Needs A/R + P&L', target: '<20 days', gap: financials.dso && financials.dso <= 20 ? 'On target' : financials.dso ? `${financials.dso - 20} days` : 'Needs reports', action: 'Keep collections tight and watch any client drifting past terms.' },
    { label: 'Cash runway', value: `${financials.runway} months`, source: 'Balance Sheet + P&L', confidence: financials.runway ? 'Calculated from QBO' : 'Needs cash + expenses', target: '6+ months', gap: financials.runway >= 6 ? 'On target' : financials.runway ? `${number(6 - financials.runway)} months` : 'Needs reports', action: 'Use cash strength to fund process documentation and marketing systems.' },
    { label: 'Labor ratio', value: `${financials.laborPct}%`, source: 'QBO P&L payroll rows', confidence: financials.laborPct ? 'Calculated from QBO' : 'Needs payroll rows', target: 'Industry-specific', gap: financials.laborPct ? 'Review vs benchmark' : 'Needs payroll data', action: 'Use labor ratio to see whether staffing model is supporting margin.' },
    { label: 'Operating cash flow', value: money(financials.operatingCashFlow), source: 'QBO Cash Flow', confidence: financials.operatingCashFlow ? 'QBO import' : 'Needs Cash Flow', target: '>0', gap: financials.operatingCashFlow >= 0 ? 'Positive' : money(Math.abs(financials.operatingCashFlow)), action: 'Compare cash flow to EBITDA to spot collections, debt, or owner distribution pressure.' },
    { label: 'Pipeline coverage', value: `${financials.pipelineCoverage}x`, source: 'CRM/manual', confidence: 'Needs import', target: '3.0x', gap: '1.2x', action: 'Track qualified opportunities against next-quarter revenue target.' },
    { label: 'Revenue per client', value: money(financials.revenuePerClient), source: 'QBO Sales by Customer', confidence: financials.revenuePerClient ? 'Calculated from QBO' : 'Needs Sales by Customer', target: money(Math.max(financials.revenuePerClient * 1.25, 1)), gap: financials.revenuePerClient ? money(financials.revenuePerClient * 0.25) : 'Needs customer report', action: 'Package higher-value tiers and review underpriced relationships.' },
  ]
}

function getIndustryBenchmark(id: IndustryBenchmarkId) {
  return industryBenchmarks.find((industry) => industry.id === id) ?? industryBenchmarks[0]
}

function getIndustryIdByName(name: string): IndustryBenchmarkId {
  return getIndustryBenchmark(
    (industryBenchmarks.find((industry) => industry.name === name)?.id ?? 'professional-services') as IndustryBenchmarkId,
  ).id
}

function percentGrowth(current: number, next: number) {
  if (!current) return 0
  return ((next - current) / current) * 100
}

function compareMetric({
  actual,
  benchmark,
  higherIsBetter = true,
  unit = '%',
}: {
  actual: number
  benchmark: number
  higherIsBetter?: boolean
  unit?: '%' | '$' | 'days' | 'x'
}) {
  const spread = actual - benchmark
  const favorable = higherIsBetter ? spread >= 0 : spread <= 0
  const close = Math.abs(spread) <= Math.max(Math.abs(benchmark) * 0.08, 1)
  const tone = close ? 'neutral' : favorable ? 'ahead' : 'behind'
  const formattedSpread = unit === '$' ? money(Math.abs(spread)) : `${Math.abs(Math.round(spread * 10) / 10)}${unit === '%' ? ' pts' : unit === 'x' ? 'x' : ` ${unit}`}`
  return {
    spread,
    tone,
    label: close ? 'Near industry' : favorable ? `${formattedSpread} better` : `${formattedSpread} behind`,
  }
}

function getBenchmarkComparisons(financials: Financials, model: ReturnType<typeof useClientModel>, benchmark: IndustryBenchmark) {
  const oneYear = model.forecasts.at(-1)
  const forecastGrowth = oneYear ? percentGrowth(financials.revenue, oneYear.revenue) : 0
  const industryValue = calculateEnterpriseValue(financials.normalizedEbitda, benchmark.evEbitdaMultiple)
  const targetGap = industryValue != null && model.currentValue != null ? industryValue - model.currentValue : null

  return [
    {
      label: 'EBITDA margin',
      actual: `${financials.ebitdaMargin}%`,
      benchmark: `${benchmark.ebitdaMargin}%`,
      insight: compareMetric({ actual: financials.ebitdaMargin, benchmark: benchmark.ebitdaMargin }),
      decision: financials.ebitdaMargin >= benchmark.ebitdaMargin ? 'Margin is not the main constraint.' : 'Pricing, scope, and delivery leverage need attention.',
    },
    {
      label: '12-month revenue growth',
      actual: `${forecastGrowth.toFixed(1)}%`,
      benchmark: `${benchmark.revenueGrowth}%`,
      insight: compareMetric({ actual: forecastGrowth, benchmark: benchmark.revenueGrowth }),
      decision: forecastGrowth >= benchmark.revenueGrowth ? 'Growth case is above industry baseline.' : 'Pipeline or pricing assumptions need strengthening.',
    },
    {
      label: 'Recurring revenue',
      actual: `${financials.recurringRevenue}%`,
      benchmark: `${benchmark.recurringRevenue}%`,
      insight: compareMetric({ actual: financials.recurringRevenue, benchmark: benchmark.recurringRevenue }),
      decision: financials.recurringRevenue >= benchmark.recurringRevenue ? 'Revenue durability compares well.' : 'Package more work into recurring or contracted revenue.',
    },
    {
      label: 'Owner dependency',
      actual: `${financials.ownerPctRevenue}%`,
      benchmark: `<${benchmark.ownerDependency}%`,
      insight: compareMetric({ actual: financials.ownerPctRevenue, benchmark: benchmark.ownerDependency, higherIsBetter: false }),
      decision: financials.ownerPctRevenue <= benchmark.ownerDependency ? 'Transferability is within industry target.' : 'Document and delegate sales/delivery before chasing multiple expansion.',
    },
    {
      label: 'Top client concentration',
      actual: `${financials.topClientPct}%`,
      benchmark: `<${benchmark.topClientPct}%`,
      insight: compareMetric({ actual: financials.topClientPct, benchmark: benchmark.topClientPct, higherIsBetter: false }),
      decision: financials.topClientPct <= benchmark.topClientPct ? 'Concentration is acceptable.' : 'Add smaller accounts or reduce dependence on the largest relationship.',
    },
    {
      label: 'DSO',
      actual: `${financials.dso} days`,
      benchmark: `<${benchmark.dso} days`,
      insight: compareMetric({ actual: financials.dso, benchmark: benchmark.dso, higherIsBetter: false, unit: 'days' }),
      decision: financials.dso <= benchmark.dso ? 'Collections are not creating industry-relative drag.' : 'Collections process is constraining cash conversion.',
    },
    {
      label: 'Valuation multiple',
      actual: `${model.currentMultiple.toFixed(1)}x`,
      benchmark: `${benchmark.evEbitdaMultiple.toFixed(1)}x`,
      insight: compareMetric({ actual: model.currentMultiple, benchmark: benchmark.evEbitdaMultiple, unit: 'x' }),
      decision: targetGap == null ? 'EV/EBITDA is not applicable with nonpositive normalized EBITDA.' : targetGap > 0 ? `${money(targetGap)} implied gap to industry multiple.` : 'Current multiple clears the selected industry benchmark.',
    },
  ]
}

function useClientModel(client: Client, benchmark: IndustryBenchmark = getIndustryBenchmark(getIndustryIdByName(client.industry))) {
  return useMemo(() => {
    const dimensionScores = getDimensionScores(client.data.assessment)
    const vesScore = dimensionScores.reduce((sum, item) => sum + item.score, 0) / dimensionScores.length
    const financials = client.data.financials
    const multipleMethodology = calculateIndustryAnchoredMultiple({
      financials,
      benchmark,
      vesScore,
      dataQuality: client.dataQuality,
    })
    const currentMultiple = multipleMethodology.adjusted
    const currentValue = calculateEnterpriseValue(financials.normalizedEbitda, currentMultiple)
    const targetMultiple = multipleMethodology.ceiling
    const targetValue = calculateEnterpriseValue(financials.normalizedEbitda, targetMultiple)
    const sorted = [...dimensionScores].sort((a, b) => a.score - b.score)
    const last = client.data.monthlyHistory.at(-1)
    const previous = client.data.monthlyHistory.at(-2)
    const healthScore = calculateHealthScore(financials, vesScore)
    const forecasts = buildForecasts(financials, vesScore, benchmark, client.dataQuality)
    const cfoAdvisory = buildCfoAdvisory({
      client,
      forecasts,
      vesScore,
      currentValue,
      currentMultiple,
      multipleMethodology,
    })

    return {
      dimensionScores,
      vesScore,
      currentMultiple,
      multipleMethodology,
      currentValue,
      targetMultiple,
      targetValue,
      valueGap: targetValue != null && currentValue != null ? targetValue - currentValue : null,
      priority: sorted[0],
      secondPriority: sorted[1],
      strongest: [...dimensionScores].sort((a, b) => b.score - a.score)[0],
      valueChange: last?.valuationMethod === 'industry-anchored-v1' && previous?.valuationMethod === 'industry-anchored-v1' && last.value != null && previous.value != null ? last.value - previous.value : 0,
      vesChange: last && previous ? last.vesScore - previous.vesScore : 0,
      healthScore,
      forecasts,
      cfoAdvisory,
      kpis: getKpiRows(financials),
    }
  }, [benchmark, client])
}

function buildMonthlySnapshot(client: Client, label: string, note?: string): MonthlySnapshot {
  const { financials } = client.data
  const dimensionScores = getDimensionScores(client.data.assessment)
  const vesScore = dimensionScores.reduce((sum, item) => sum + item.score, 0) / Math.max(dimensionScores.length, 1)
  const benchmark = getIndustryBenchmark(getIndustryIdByName(client.industry))
  const multipleMethodology = calculateIndustryAnchoredMultiple({
    financials,
    benchmark,
    vesScore,
    dataQuality: client.dataQuality,
  })
  const value = calculateEnterpriseValue(financials.normalizedEbitda, multipleMethodology.adjusted)

  return {
    month: label,
    revenue: financials.revenue,
    ebitda: financials.ebitda,
    ebitdaMargin: financials.ebitdaMargin,
    vesScore,
    value,
    valuationMethod: 'industry-anchored-v1',
    healthScore: calculateHealthScore(financials, vesScore),
    grossMargin: financials.grossMargin,
    dso: financials.dso,
    runway: financials.runway,
    recurringRevenue: financials.recurringRevenue,
    ownerPctRevenue: financials.ownerPctRevenue,
    topClientPct: financials.topClientPct,
    dimensionScores: Object.fromEntries(dimensionScores.map((item) => [item.id, Math.round(item.score * 10) / 10])),
    note,
  }
}

function buildVisibleHistory(client: Client) {
  const live = buildMonthlySnapshot(client, 'Current', 'Live model')
  const history = client.data.monthlyHistory.filter((snapshot) => snapshot.valuationMethod === 'industry-anchored-v1')
  if (!history.length) return [live]
  const last = history.at(-1)
  const sameAsLive =
    last &&
    last.value != null &&
    live.value != null &&
    Math.abs(last.value - live.value) < 1 &&
    Math.abs(last.vesScore - live.vesScore) < 0.05 &&
    last.revenue === live.revenue

  if (sameAsLive) {
    return [...history.slice(0, -1), { ...live, month: last.month, note: last.note ?? live.note }].slice(-10)
  }
  return [...history, live].slice(-10)
}

function getSnapshotDelta(current?: number | null, previous?: number | null) {
  if (current == null || previous == null) return undefined
  return current - previous
}

function deltaTone(delta: number | undefined, higherIsBetter = true) {
  if (delta === undefined || Math.abs(delta) < 0.05) return 'flat'
  const favorable = higherIsBetter ? delta > 0 : delta < 0
  return favorable ? 'up' : 'down'
}

function DeltaBadge({
  delta,
  format,
  higherIsBetter = true,
}: {
  delta: number | undefined
  format: (value: number) => string
  higherIsBetter?: boolean
}) {
  if (delta === undefined) return <em className="delta-badge flat">No prior</em>
  const tone = deltaTone(delta, higherIsBetter)
  return (
    <em className={`delta-badge ${tone}`}>
      {delta > 0 ? '+' : ''}
      {format(delta)}
    </em>
  )
}

function applyDimensionLift(assessment: AssessmentData, dimensionId: string, lift: number) {
  const currentDimension = assessment[dimensionId] ?? { Baseline: 5 }
  return {
    ...assessment,
    [dimensionId]: Object.fromEntries(
      Object.entries(currentDimension).map(([label, score]) => [label, Math.round(clamp(score + lift, 0, 10) * 10) / 10]),
    ),
  }
}

function appendValuationSnapshot(client: Client, label: string, note?: string) {
  const snapshot = buildMonthlySnapshot(client, label, note)
  return {
    ...client,
    data: {
      ...client.data,
      monthlyHistory: [...client.data.monthlyHistory, snapshot].slice(-10),
    },
  }
}

function applyObjectiveCompletion(client: Client, objectiveId: string, completed: boolean) {
  const objectives = mergeAdvisorObjectives(client.data.advisorObjectives)
  const objective = objectives.find((item) => item.id === objectiveId)
  if (!objective) return client

  const wasCompleted = Boolean(objective.completedAt)
  if (wasCompleted === completed) return client

  const direction = completed ? 1 : -1
  const nextObjectives = objectives.map((item) =>
    item.id === objectiveId
      ? {
          ...item,
          completedAt: completed
            ? new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
            : undefined,
        }
      : item,
  )
  const nextFinancials: Financials = {
    ...client.data.financials,
    recurringRevenue: clamp(
      client.data.financials.recurringRevenue + (objective.impact.recurringRevenueLift ?? 0) * direction,
      0,
      100,
    ),
    ownerPctRevenue: clamp(
      client.data.financials.ownerPctRevenue - (objective.impact.ownerDependencyDrop ?? 0) * direction,
      0,
      100,
    ),
    pipelineCoverage: Math.round(
      clamp(client.data.financials.pipelineCoverage + (objective.impact.pipelineCoverageLift ?? 0) * direction, 0, 10) * 10,
    ) / 10,
  }
  const nextClient: Client = {
    ...client,
    lastUpdated: new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    dataQuality: client.dataQuality === 'demo' ? 'demo' : 'partial',
    data: {
      ...client.data,
      financials: nextFinancials,
      assessment: applyDimensionLift(client.data.assessment, objective.dimensionId, objective.impact.scoreLift * direction),
      advisorObjectives: nextObjectives,
    },
  }
  const completedCount = nextObjectives.filter((item) => item.completedAt).length
  return appendValuationSnapshot(nextClient, `${completedCount}/${nextObjectives.length}`, `${completed ? 'Completed' : 'Reopened'}: ${objective.title}`)
}

function updateValueEngineAnswer({
  client,
  dimensionId,
  questionId,
  questionLabel,
  subarea,
  response,
}: {
  client: Client
  dimensionId: string
  questionId: string
  questionLabel: string
  subarea: string
  response: QuestionResponse
}) {
  const currentResponse = getQuestionResponse(client, questionId, dimensionId)
  const scoreChanged = currentResponse.score !== response.score
  const itemLabel = `${subarea}: ${questionLabel.slice(0, 54)}`
  const nextClient: Client = {
    ...client,
    lastUpdated: new Date().toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    dataQuality: client.dataQuality === 'demo' ? 'demo' : 'partial',
    data: {
      ...client.data,
      questionResponses: {
        ...client.data.questionResponses,
        [questionId]: response,
      },
      assessment: {
        ...client.data.assessment,
        [dimensionId]: {
          ...(client.data.assessment[dimensionId] ?? {}),
          [itemLabel]: response.score,
        },
      },
    },
  }

  if (!scoreChanged) return nextClient
  return appendValuationSnapshot(nextClient, new Date().toLocaleString('en-US', { month: 'short' }), `Value Engine: ${subarea}`)
}

function safeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function parseMoneyCell(value: unknown) {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  const normalized = String(value).trim()
  if (!normalized) return undefined
  const negative = /^\(.+\)$/.test(normalized)
  const parsed = Number(normalized.replace(/[,$()%\s]/g, ''))
  if (!Number.isFinite(parsed)) return undefined
  return negative ? -parsed : parsed
}

function isPercentCell(value: unknown) {
  return typeof value === 'string' && value.includes('%')
}

function normalizeReportText(value: unknown) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function getRowLabel(row: unknown[]) {
  return normalizeReportText(
    row
      .slice(0, Math.max(1, row.length - 1))
      .filter((cell) => parseMoneyCell(cell) === undefined)
      .join(' '),
  )
}

function getTotalColumnIndex(rows: unknown[][]) {
  const headerRows = rows.slice(0, 12)
  for (const row of headerRows) {
    const labels = row.map(normalizeReportText)
    const totalIndex = labels.findLastIndex((label) => ['total', 'total amount', 'amount total'].includes(label))
    if (totalIndex >= 0) return totalIndex
  }
  return undefined
}

function lastNumericValue(row: unknown[], preferredIndex?: number) {
  if (preferredIndex !== undefined) {
    const preferred = parseMoneyCell(row[preferredIndex])
    if (preferred !== undefined && !isPercentCell(row[preferredIndex])) return preferred
  }

  for (let index = row.length - 1; index >= 0; index -= 1) {
    if (isPercentCell(row[index])) continue
    const value = parseMoneyCell(row[index])
    if (value !== undefined) return value
  }

  for (let index = row.length - 1; index >= 0; index -= 1) {
    const value = parseMoneyCell(row[index])
    if (value !== undefined) return value
  }
  return undefined
}

function findReportValue(rows: unknown[][], aliases: string[]) {
  const totalColumnIndex = getTotalColumnIndex(rows)
  const loweredAliases = aliases.map(normalizeReportText)
  for (const row of rows) {
    const rowLabel = getRowLabel(row)
    if (loweredAliases.some((alias) => rowLabel.includes(alias))) {
      const value = lastNumericValue(row, totalColumnIndex)
      if (value !== undefined) return value
    }
  }
  return undefined
}

function sumReportValues(rows: unknown[][], aliases: string[]) {
  const totalColumnIndex = getTotalColumnIndex(rows)
  const loweredAliases = aliases.map(normalizeReportText)
  const matches = rows
    .filter((row) => {
      const rowLabel = getRowLabel(row)
      return loweredAliases.some((alias) => rowLabel.includes(alias)) && !rowLabel.startsWith('total ')
    })
    .map((row) => lastNumericValue(row, totalColumnIndex))
    .filter((value): value is number => value !== undefined)

  if (!matches.length) return undefined
  return matches.reduce((sum, value) => sum + value, 0)
}

function sumSectionValues(rows: unknown[][], startLabels: string[], stopLabels: string[]) {
  const totalColumnIndex = getTotalColumnIndex(rows)
  const starts = startLabels.map(normalizeReportText)
  const stops = stopLabels.map(normalizeReportText)
  let inside = false
  let total = 0
  let count = 0

  for (const row of rows) {
    const rowLabel = getRowLabel(row)
    if (!rowLabel) continue

    if (!inside && starts.some((label) => rowLabel === label || rowLabel.endsWith(` ${label}`))) {
      inside = true
      continue
    }

    if (!inside) continue

    if (stops.some((label) => rowLabel.includes(label))) break
    if (rowLabel.startsWith('total ') || rowLabel.includes('gross profit') || rowLabel.includes('net income')) continue

    const value = lastNumericValue(row, totalColumnIndex)
    if (value !== undefined) {
      total += value
      count += 1
    }
  }

  return count ? total : undefined
}

function getQboReportType(rows: unknown[][]) {
  const reportText = normalizeReportText(rows.slice(0, 18).flat().join(' '))
  if (reportText.includes('sales by customer')) return 'Sales by Customer'
  if (reportText.includes('accounts receivable aging') || reportText.includes('a r aging')) return 'A/R Aging'
  if (reportText.includes('statement of cash flows') || reportText.includes('cash flow')) return 'Cash Flow'
  if (reportText.includes('balance sheet')) return 'Balance Sheet'
  if (reportText.includes('profit and loss') || reportText.includes('income statement')) return 'P&L'
  return 'QBO CSV'
}

function getSalesByCustomerStats(rows: unknown[][]) {
  const totalColumnIndex = getTotalColumnIndex(rows)
  const customerRows = rows
    .map((row) => ({ label: String(row[0] ?? '').trim(), value: lastNumericValue(row, totalColumnIndex) }))
    .filter((row) => row.label && row.value !== undefined && !/total|not specified|income/i.test(row.label))

  if (!customerRows.length) return {}

  const total = customerRows.reduce((sum, row) => sum + Math.max(row.value ?? 0, 0), 0)
  const top = Math.max(...customerRows.map((row) => row.value ?? 0))
  return {
    customerCount: customerRows.length,
    topClientPct: total > 0 ? Math.round((top / total) * 100) : undefined,
    revenuePerClient: total > 0 ? Math.round(total / customerRows.length) : undefined,
  }
}

function findHeaderIndex(rows: unknown[][]) {
  return rows.findIndex((row) => {
    const labels = row.map(normalizeReportText)
    const textCount = labels.filter(Boolean).length
    const hasNameField = labels.some((label) => /client|customer|contact|employee|staff|opportunity|deal|lead/.test(label))
    const hasMetricField = labels.some((label) => /revenue|sales|spend|amount|value|pay|wage|salary|status|stage|created|date|recurring|active/.test(label))
    return textCount >= 2 && hasNameField && hasMetricField
  })
}

function getTableRecords(rows: unknown[][]) {
  const headerIndex = findHeaderIndex(rows)
  if (headerIndex < 0) return []
  const headers = rows[headerIndex].map(normalizeReportText)
  return rows.slice(headerIndex + 1).map((row) => ({ row, headers })).filter(({ row }) => row.some((cell) => String(cell ?? '').trim()))
}

function getRecordCell(record: { row: unknown[]; headers: string[] }, aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeReportText)
  const index = record.headers.findIndex((header) => normalizedAliases.some((alias) => header === alias || header.includes(alias)))
  return index >= 0 ? record.row[index] : undefined
}

function getRecordMoney(record: { row: unknown[]; headers: string[] }, aliases: string[]) {
  return parseMoneyCell(getRecordCell(record, aliases))
}

function getRecordText(record: { row: unknown[]; headers: string[] }, aliases: string[]) {
  const value = getRecordCell(record, aliases)
  return normalizeReportText(value)
}

function isActiveCustomer(record: { row: unknown[]; headers: string[] }) {
  const status = getRecordText(record, ['status', 'client status', 'customer status', 'contact status'])
  const active = getRecordText(record, ['active', 'is active'])
  if (status) return !/inactive|cancel|lost|churn|former|archived|deleted/.test(status)
  if (active) return /yes|true|active|1/.test(active)
  return true
}

function getCrmReportType(rows: unknown[][], fileName: string) {
  const reportText = normalizeReportText(`${fileName} ${rows.slice(0, 12).flat().join(' ')}`)
  if (/payroll|gross pay|employee|wage|salary|labor/.test(reportText)) return 'Payroll / labor'
  if (/pipeline|opportunit|deal|lead|stage/.test(reportText)) return 'CRM pipeline'
  if (/customer|client|contact|retention|churn|recurring|subscription|member/.test(reportText)) return 'CRM customer'
  return 'CRM / Ops CSV'
}

function applyCrmRowsToClient(client: Client, rows: unknown[][], fileName: string) {
  const records = getTableRecords(rows)
  const current = client.data.financials
  const nextFinancials: Financials = { ...current }
  const imported: string[] = []
  const touched = new Set<keyof Financials>()
  const reportType = getCrmReportType(rows, fileName)

  if (!records.length) {
    return {
      client,
      imported,
      changes: [],
    }
  }

  const customerRecords = records.filter((record) => {
    const name = getRecordText(record, ['client', 'client name', 'customer', 'customer name', 'contact', 'contact name', 'name', 'email'])
    const isEmployee = getRecordText(record, ['employee', 'staff', 'team member'])
    return Boolean(name) && !isEmployee
  })
  const activeCustomers = customerRecords.filter(isActiveCustomer)
  const customerRevenueRows = customerRecords
    .map((record) => getRecordMoney(record, ['revenue', 'total revenue', 'sales', 'total sales', 'spend', 'total spend', 'lifetime value', 'ltv', 'amount']))
    .filter((value): value is number => value !== undefined && value > 0)

  if (activeCustomers.length) {
    nextFinancials.customerCount = activeCustomers.length
    touched.add('customerCount')
    imported.push(`Active client count (${reportType})`)
  }

  if (customerRevenueRows.length) {
    const totalCustomerRevenue = customerRevenueRows.reduce((sum, value) => sum + value, 0)
    const topCustomerRevenue = Math.max(...customerRevenueRows)
    nextFinancials.topClientPct = Math.round((topCustomerRevenue / totalCustomerRevenue) * 100)
    nextFinancials.revenuePerClient = Math.round(totalCustomerRevenue / customerRevenueRows.length)
    touched.add('topClientPct')
    touched.add('revenuePerClient')
    imported.push(`Revenue per client (${reportType})`)
    imported.push(`Top client concentration (${reportType})`)
  } else if (nextFinancials.revenue && activeCustomers.length) {
    nextFinancials.revenuePerClient = Math.round(nextFinancials.revenue / activeCustomers.length)
    touched.add('revenuePerClient')
    imported.push(`Revenue per client from active client count (${reportType})`)
  }

  const newClientCount = records.filter((record) => {
    const marker = getRecordText(record, ['new client', 'new customer', 'new'])
    return /yes|true|new|1/.test(marker)
  }).length
  if (newClientCount) {
    nextFinancials.newClientsThisMonth = newClientCount
    touched.add('newClientsThisMonth')
    imported.push(`New clients (${reportType})`)
  }

  const inactiveCount = customerRecords.filter((record) => !isActiveCustomer(record)).length
  if (customerRecords.length && inactiveCount) {
    nextFinancials.churnRate = Math.round((inactiveCount / customerRecords.length) * 100)
    touched.add('churnRate')
    imported.push(`Churn / inactive rate (${reportType})`)
  }

  const recurringRevenue = records
    .map((record) => getRecordMoney(record, ['recurring revenue', 'mrr', 'arr', 'subscription revenue', 'membership revenue']))
    .filter((value): value is number => value !== undefined && value > 0)
    .reduce((sum, value) => sum + value, 0)
  const totalRevenueFromRows = customerRevenueRows.reduce((sum, value) => sum + value, 0)
  if (recurringRevenue && (current.revenue || totalRevenueFromRows)) {
    nextFinancials.recurringRevenue = Math.round((recurringRevenue / Math.max(current.revenue || totalRevenueFromRows, 1)) * 100)
    touched.add('recurringRevenue')
    imported.push(`Recurring revenue (${reportType})`)
  } else {
    const recurringRows = customerRecords.filter((record) => /yes|true|recurring|subscription|member|retainer/.test(getRecordText(record, ['recurring', 'subscription', 'membership', 'retainer', 'plan'])))
    if (customerRecords.length && recurringRows.length) {
      nextFinancials.recurringRevenue = Math.round((recurringRows.length / customerRecords.length) * 100)
      touched.add('recurringRevenue')
      imported.push(`Recurring client share (${reportType})`)
    }
  }

  const openPipeline = records
    .filter((record) => !/lost|closed lost|inactive|cancel/.test(getRecordText(record, ['stage', 'status', 'deal status', 'opportunity status'])))
    .map((record) => getRecordMoney(record, ['pipeline value', 'deal value', 'opportunity value', 'amount', 'estimated value', 'forecast value']))
    .filter((value): value is number => value !== undefined && value > 0)
    .reduce((sum, value) => sum + value, 0)
  if (openPipeline && current.revenue) {
    nextFinancials.pipelineCoverage = Math.round((openPipeline / Math.max(current.revenue / 4, 1)) * 10) / 10
    touched.add('pipelineCoverage')
    imported.push(`Pipeline coverage (${reportType})`)
  }

  const payrollRows = records
    .map((record) => getRecordMoney(record, ['gross pay', 'payroll', 'wages', 'salary', 'salaries', 'labor cost', 'compensation', 'earnings']))
    .filter((value): value is number => value !== undefined && value > 0)
  if (payrollRows.length) {
    nextFinancials.payroll = Math.round(payrollRows.reduce((sum, value) => sum + value, 0))
    touched.add('payroll')
    imported.push(`Payroll / labor cost (${reportType})`)
    if (nextFinancials.revenue) {
      nextFinancials.laborPct = Math.round((nextFinancials.payroll / nextFinancials.revenue) * 100)
      touched.add('laborPct')
      imported.push(`Labor ratio (${reportType})`)
    }
  }

  const month = new Date().toLocaleString('en-US', { month: 'short' })
  const historyWithoutCurrentMonth = client.data.monthlyHistory.filter((item) => item.month !== month)
  const nextDataQuality: Client['dataQuality'] = touched.size >= 3 ? 'actual' : 'partial'
  const clientWithFinancials: Client = {
    ...client,
    dataQuality: nextDataQuality,
    data: {
      ...client.data,
      financials: nextFinancials,
    },
  }
  const nextSnapshot = buildMonthlySnapshot(clientWithFinancials, month, `${reportType} import`)

  return {
    client: {
      ...client,
      lastUpdated: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      dataQuality: nextDataQuality,
      data: {
        ...client.data,
        financials: nextFinancials,
        monthlyHistory: [...historyWithoutCurrentMonth, nextSnapshot],
      },
    } satisfies Client,
    imported,
    changes: getFinancialChanges(current, nextFinancials, Array.from(touched)),
  }
}

function getMissingQboInputs(financials: Financials) {
  const missing: string[] = []
  if (!financials.revenue || !financials.totalExpenses) missing.push('P&L with Total Income and Total Expenses')
  if (!financials.grossMargin) missing.push('P&L with Gross Profit or COGS')
  if (!financials.cash || (!financials.currentAssets && !financials.currentLiabilities)) missing.push('Balance Sheet with cash and current assets/liabilities')
  if (!financials.ar) missing.push('Balance Sheet or A/R Aging with Accounts Receivable')
  if (!financials.operatingCashFlow) missing.push('Statement of Cash Flows with operating cash flow')
  if (!financials.customerCount || !financials.topClientPct) missing.push('Sales by Customer Summary')
  if (!financials.payroll) missing.push('P&L payroll, wages, salary, or contract labor rows')
  return missing
}

function parseCsvFile(file: File) {
  return new Promise<unknown[][]>((resolve, reject) => {
    Papa.parse<unknown[]>(file, {
      skipEmptyLines: true,
      complete: (result) => {
        resolve(result.data.filter((row) => Array.isArray(row) && row.some((cell) => String(cell ?? '').trim())))
      },
      error: reject,
    })
  })
}

function applyQboRowsToClient(client: Client, rows: unknown[][], fileName: string) {
  const current = client.data.financials
  const imported: string[] = []
  const nextFinancials: Financials = { ...current }
  const touched = new Set<keyof Financials>()
  const reportType = getQboReportType(rows)
  const reportText = normalizeReportText(`${fileName} ${rows.slice(0, 18).flat().join(' ')}`)
  const looksLikeSalesByCustomer = /sales by customer|customer summary|customer/.test(reportText)
  const assign = (key: keyof Financials, value: number | undefined, label: string) => {
    if (value === undefined || Number.isNaN(value)) return
    nextFinancials[key] = Math.round(value)
    touched.add(key)
    imported.push(`${label} (${reportType})`)
  }

  const revenue =
    findReportValue(rows, ['total income', 'total revenue', 'total sales', 'total sales of product income', 'total service fee income']) ??
    sumSectionValues(rows, ['income', 'revenue'], ['cost of goods sold', 'cost of sales', 'gross profit', 'expenses', 'other income'])
  const grossProfit = findReportValue(rows, ['gross profit'])
  const cogs = findReportValue(rows, ['total cost of goods sold', 'total cogs', 'cost of goods sold', 'total cost of sales'])
  const totalExpenses =
    findReportValue(rows, ['total expenses', 'total operating expenses']) ??
    sumSectionValues(rows, ['expenses', 'operating expenses'], ['net operating income', 'other income', 'other expenses', 'net income'])
  const netIncome = findReportValue(rows, ['normalized ebitda', 'ebitda', 'net operating income', 'net income', 'net profit'])
  const interest = Math.abs(findReportValue(rows, ['interest expense', 'total interest expense']) ?? 0)
  const taxes = Math.abs(findReportValue(rows, ['income tax expense', 'tax expense', 'taxes']) ?? 0)
  const depreciation = Math.abs(findReportValue(rows, ['depreciation', 'amortization', 'depreciation and amortization']) ?? 0)
  const computedEbitda = netIncome !== undefined ? netIncome + interest + taxes + depreciation : undefined
  const cash = findReportValue(rows, [
    'total bank accounts',
    'cash and cash equivalents',
    'total cash',
    'checking',
    'savings',
    'money market',
  ])
  const ar = findReportValue(rows, ['total accounts receivable', 'accounts receivable', 'accounts receivable a r', 'a r'])
  const payroll =
    findReportValue(rows, ['total payroll', 'total payroll expenses', 'total wages', 'total salaries', 'total salaries and wages']) ??
    sumReportValues(rows, ['payroll', 'wages', 'salaries', 'contract labor', 'employee benefits', 'payroll taxes'])
  const currentAssets = findReportValue(rows, ['total current assets'])
  const currentLiabilities = findReportValue(rows, ['total current liabilities'])
  const workingCapital = findReportValue(rows, ['working capital'])
  const operatingCashFlow = findReportValue(rows, [
    'net cash provided by operating activities',
    'net cash from operating activities',
    'net cash provided by used in operating activities',
  ])
  const debt =
    findReportValue(rows, ['total long term liabilities', 'total notes payable', 'total loans payable', 'total credit cards']) ??
    sumReportValues(rows, ['loan payable', 'notes payable', 'line of credit', 'credit card'])
  const salesStats = looksLikeSalesByCustomer ? getSalesByCustomerStats(rows) : {}

  assign('revenue', revenue, 'Revenue')
  assign('totalExpenses', totalExpenses, 'Total expenses')
  assign('ebitda', computedEbitda, interest || taxes || depreciation ? 'EBITDA with add-backs' : 'EBITDA / net income')
  assign('cash', cash, 'Cash')
  assign('ar', ar, 'A/R')
  assign('payroll', payroll, 'Payroll')
  assign('currentAssets', currentAssets, 'Current assets')
  assign('currentLiabilities', currentLiabilities, 'Current liabilities')
  assign('workingCapital', workingCapital, 'Working capital')
  assign('operatingCashFlow', operatingCashFlow, 'Operating cash flow')
  assign('debt', debt, 'Debt')
  assign('customerCount', salesStats.customerCount, 'Customer count')
  assign('topClientPct', salesStats.topClientPct, 'Top client concentration')
  assign('revenuePerClient', salesStats.revenuePerClient, 'Revenue per client')

  if (revenue && grossProfit !== undefined) {
    nextFinancials.grossMargin = Math.round((grossProfit / revenue) * 100)
    touched.add('grossMargin')
    imported.push(`Gross margin (${reportType})`)
  } else if (revenue && cogs !== undefined) {
    nextFinancials.grossMargin = Math.round(((revenue - cogs) / revenue) * 100)
    touched.add('grossMargin')
    imported.push(`Gross margin (${reportType})`)
  }

  if (revenue && nextFinancials.ebitda) {
    nextFinancials.ebitdaMargin = Math.round((nextFinancials.ebitda / revenue) * 100)
    touched.add('ebitdaMargin')
    imported.push(`EBITDA margin (${reportType})`)
  }

  nextFinancials.normalizedEbitda = nextFinancials.ebitda + nextFinancials.ownerAddbacks
  if (nextFinancials.normalizedEbitda !== current.normalizedEbitda) touched.add('normalizedEbitda')

  if (nextFinancials.revenue && nextFinancials.customerCount) {
    nextFinancials.revenuePerClient = Math.round(nextFinancials.revenue / nextFinancials.customerCount)
    touched.add('revenuePerClient')
  }

  if (!nextFinancials.workingCapital && nextFinancials.currentAssets && nextFinancials.currentLiabilities) {
    nextFinancials.workingCapital = nextFinancials.currentAssets - nextFinancials.currentLiabilities
    touched.add('workingCapital')
    imported.push(`Working capital (${reportType})`)
  }

  if (nextFinancials.revenue && nextFinancials.ar) {
    nextFinancials.dso = Math.round((nextFinancials.ar / (nextFinancials.revenue / 12)) * 30)
    touched.add('dso')
  }

  if (nextFinancials.revenue && nextFinancials.payroll) {
    nextFinancials.laborPct = Math.round((nextFinancials.payroll / nextFinancials.revenue) * 100)
    touched.add('laborPct')
  }

  if (nextFinancials.cash && nextFinancials.revenue) {
    const expenseBase = nextFinancials.totalExpenses || nextFinancials.revenue - nextFinancials.ebitda
    const monthlyExpense = Math.max(expenseBase / 12, 1)
    nextFinancials.runway = Math.round((nextFinancials.cash / monthlyExpense) * 10) / 10
    touched.add('runway')
  }

  const month = new Date().toLocaleString('en-US', { month: 'short' })
  const historyWithoutCurrentMonth = client.data.monthlyHistory.filter((item) => item.month !== month)
  const nextDataQuality: Client['dataQuality'] = imported.length >= 5 ? 'actual' : 'partial'
  const clientWithFinancials: Client = {
    ...client,
    dataQuality: nextDataQuality,
    data: {
      ...client.data,
      financials: nextFinancials,
    },
  }
  const nextSnapshot = buildMonthlySnapshot(clientWithFinancials, month, `${reportType} import`)

  return {
    client: {
      ...client,
      lastUpdated: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      dataQuality: nextDataQuality,
      data: {
        ...client.data,
        financials: nextFinancials,
        monthlyHistory: [...historyWithoutCurrentMonth, nextSnapshot],
      },
    } satisfies Client,
    imported,
    changes: getFinancialChanges(current, nextFinancials, Array.from(touched)),
  }
}

function addPdfText(doc: jsPDF, text: string, x: number, y: number, maxWidth = 170, size = 10, style: 'normal' | 'bold' = 'normal') {
  doc.setFont('helvetica', style)
  doc.setFontSize(size)
  const lines = doc.splitTextToSize(text, maxWidth)
  const requiredSpace = lines.length * (size * 0.42) + 3
  const cursor = ensurePdfSpace(doc, y, requiredSpace)
  doc.text(lines, x, cursor)
  return cursor + requiredSpace
}

function ensurePdfSpace(doc: jsPDF, y: number, needed = 28) {
  if (y + needed < 282) return y
  doc.addPage()
  return 18
}

function addPdfSection(doc: jsPDF, title: string, y: number) {
  y = ensurePdfSpace(doc, y, 20)
  doc.setFillColor(241, 245, 249)
  doc.rect(14, y - 6, 182, 10, 'F')
  doc.setTextColor(15, 23, 42)
  return addPdfText(doc, title, 18, y, 170, 11, 'bold') + 2
}

function addPdfBullets(doc: jsPDF, bullets: string[], y: number) {
  let cursor = y
  bullets.forEach((bullet) => {
    cursor = ensurePdfSpace(doc, cursor, 16)
    cursor = addPdfText(doc, `- ${bullet}`, 20, cursor, 166, 9)
  })
  return cursor
}

function addPdfKpiRows(doc: jsPDF, rows: Array<{ label: string; value: string; note: string }>, y: number) {
  let cursor = y
  rows.forEach((row) => {
    const noteLines = doc.splitTextToSize(row.note, 92)
    const rowHeight = Math.max(14, noteLines.length * 4.2 + 5)
    cursor = ensurePdfSpace(doc, cursor, rowHeight)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(row.label, 18, cursor)
    doc.text(row.value, 75, cursor)
    doc.setFont('helvetica', 'normal')
    doc.text(noteLines, 104, cursor)
    cursor += rowHeight
  })
  return cursor + 2
}

function downloadAdvisorPdf(client: Client, model: ReturnType<typeof useClientModel>, benchmark: IndustryBenchmark) {
  const oneYear = model.forecasts.at(-1)
  const actionRows = model.kpis.filter((kpi) => kpi.gap !== 'On target').slice(0, 6)
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  let y = 18

  y = addPdfText(doc, `${client.name} Advisor Report`, 14, y, 180, 18, 'bold')
  y = addPdfText(doc, `${client.lastUpdated} | Data status: ${client.dataQuality === 'demo' ? 'Demo values until actual QBO/CRM exports are imported' : client.dataQuality}`, 14, y, 180, 9)
  y = addPdfSection(doc, 'Current Health And Valuation', y + 3)
  y = addPdfKpiRows(
    doc,
    [
      { label: 'Health score', value: `${model.healthScore}/100`, note: 'Blends VES, margin, runway, recurring revenue, owner dependency, and concentration.' },
      { label: '90-day health', value: `${model.cfoAdvisory.forwardHealth.find((item) => item.label === 'Next quarter')?.healthScore ?? model.healthScore}/100`, note: 'Projected health if the current trend and advisor assumptions hold.' },
      { label: 'Estimated enterprise value', value: money(model.currentValue), note: `${model.currentMultiple.toFixed(1)}x normalized EBITDA, anchored to the selected ${benchmark.name} benchmark.` },
      { label: 'Methodology-ceiling EV', value: money(model.targetValue), note: `${model.targetMultiple.toFixed(1)}x current normalized EBITDA at the methodology ceiling. This is not the 12-month upside forecast.` },
      { label: 'Gap to methodology ceiling', value: money(model.valueGap), note: 'Illustrative gap using current earnings and the model ceiling, separate from the 12-month upside case.' },
    ],
    y,
  )

  y = addPdfSection(doc, 'Forward CFO Advisory Read', y)
  y = addPdfBullets(doc, [
    `What breaks first: ${model.cfoAdvisory.primaryRisk.label}. ${model.cfoAdvisory.primaryRisk.summary}`,
    `Second risk: ${model.cfoAdvisory.secondaryRisk.label}. ${model.cfoAdvisory.secondaryRisk.summary}`,
    `Cash danger date: ${model.cfoAdvisory.cashDangerDate}.`,
    `Enterprise-value range: ${model.cfoAdvisory.valuationRange.map((scenario) => `${scenario.label} ${money(scenario.value)}`).join(' / ')}.`,
  ], y)

  y = addPdfSection(doc, 'Forecast Source Chain', y)
  y = addPdfBullets(doc, [
    'Baseline revenue, EBITDA, margin, cash, A/R, and runway come from QBO monthly exports.',
    'Customer concentration, revenue per client, and client count come from Sales by Customer and CRM/client-list data.',
    'Recurring revenue, pipeline coverage, and owner dependency require CRM/manual advisory inputs until system integrations exist.',
    'The valuation multiple starts with the selected industry benchmark, then adjusts for profitability, revenue quality, transferability, risk, and data confidence.',
    'The forecast should be rebuilt each month after new QBO, CRM, and assessment answers are loaded.',
  ], y)

  y = addPdfSection(doc, `Industry Benchmark: ${benchmark.name}`, y)
  y = addPdfBullets(doc, [
    `Industry EBITDA margin: ${benchmark.ebitdaMargin}% vs company ${client.data.financials.ebitdaMargin}%.`,
    `Industry revenue growth baseline: ${benchmark.revenueGrowth}%.`,
    `Industry recurring revenue target: ${benchmark.recurringRevenue}%.`,
    `Industry owner dependency target: below ${benchmark.ownerDependency}%.`,
    `Industry EV/EBITDA multiple: ${benchmark.evEbitdaMultiple.toFixed(1)}x.`,
  ], y)

  y = addPdfSection(doc, 'Rolling Forecast', y)
  y = addPdfBullets(
    doc,
    model.forecasts.map((item) => `${item.label}: ${money(item.value)} enterprise value, ${money(item.revenue)} revenue, ${item.margin.toFixed(1)}% EBITDA margin, ${item.projectedVes.toFixed(1)}/10 VES.`),
    y,
  )

  y = addPdfSection(doc, 'Enterprise Value Versus Owner Proceeds', y)
  y = addPdfText(
    doc,
    'These figures estimate enterprise value, not owner proceeds. A transaction would normally subtract debt, add excess cash, and then account for taxes, fees, working-capital targets, and other closing adjustments.',
    18,
    y,
    170,
    9,
  )

  y = addPdfSection(doc, 'Meeting Agenda', y)
  y = addPdfBullets(doc, [
    `Open with the methodology range: estimated enterprise value is ${money(model.currentValue)} and the current-earnings methodology ceiling is ${money(model.targetValue)}.`,
    `Name the lowest driver: ${model.priority.label} is ${model.priority.score.toFixed(1)}/10.`,
    'Ask which part of the business would slow down fastest if the owner stepped away for 30 days.',
    'Close with three commitments: document one workflow, create one non-owner lead source, and convert one offer into recurring revenue.',
  ], y)

  y = addPdfSection(doc, 'Priority Actions', y)
  y = addPdfBullets(doc, [
    ...model.cfoAdvisory.riskSignals.slice(0, 3).map((signal) => `${signal.label}: ${signal.action}`),
    ...actionRows.map((row) => `${row.label}: gap ${row.gap}. ${row.action}`),
  ], y)

  y = addPdfSection(doc, '12-Month Upside Case', y)
  y = addPdfText(
    doc,
    oneYear
      ? `If the action plan holds, the model projects ${money(oneYear.value)} of enterprise value, ${money(oneYear.revenue)} annual revenue, ${oneYear.margin.toFixed(1)}% EBITDA margin, and ${oneYear.projectedVes.toFixed(1)}/10 VES.`
      : 'No forecast available.',
    18,
    y,
    170,
    10,
  )

  doc.save(`${safeFileName(client.name)}-advisor-report.pdf`)
}

function downloadValuationMethodologyPdf(client: Client, model: ReturnType<typeof useClientModel>, benchmark: IndustryBenchmark) {
  const { financials } = client.data
  const nextYear = model.forecasts.at(-1)
  const methodology = model.cfoAdvisory.multipleMethodology
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  let y = 18

  y = addPdfText(doc, `${client.name} Valuation Methodology`, 14, y, 180, 18, 'bold')
  y = addPdfText(doc, 'Plain-English explanation of how the Value Intelligence Hub creates the valuation range', 14, y, 180, 9)

  y = addPdfSection(doc, 'The Short Version', y + 3)
  y = addPdfText(
    doc,
    `The valuation is not a guess and it is not a single magic number. It starts with normalized EBITDA from the company's financials, anchors the multiple to the selected ${benchmark.name} industry benchmark, then adjusts that multiple for the company-specific facts a real buyer or lender would care about.`,
    18,
    y,
    170,
    10,
  )

  y = addPdfSection(doc, 'Core Formula', y)
  y = addPdfKpiRows(
    doc,
    [
      { label: 'Earnings base', value: money(financials.normalizedEbitda), note: 'Normalized EBITDA from QBO/imported financials plus confirmed owner add-backs.' },
      { label: 'Industry anchor', value: `${benchmark.evEbitdaMultiple.toFixed(1)}x`, note: `Selected ${benchmark.name} EV/EBITDA benchmark, not a generic one-size-fits-all multiple.` },
      { label: 'Model multiple', value: `${model.currentMultiple.toFixed(1)}x`, note: 'Industry anchor adjusted for company size, growth when reliable, margin, recurring revenue, owner dependency, concentration, collections speed, data quality, and Value Engine score.' },
      { label: 'Estimated enterprise value', value: money(model.currentValue), note: 'Normalized EBITDA multiplied by the adjusted model multiple. This is before debt, excess cash, transaction costs, and closing adjustments.' },
    ],
    y,
  )

  y = addPdfSection(doc, 'Where The Inputs Come From', y)
  y = addPdfBullets(doc, [
    'QBO/client financials supply revenue, expenses, EBITDA, cash, A/R, working capital, debt, payroll, and operating cash flow.',
    'Industry research supplies the starting multiple and benchmark targets for growth, margin, recurring revenue, owner dependency, concentration, and collections.',
    'Advisor/client inputs supply the qualitative facts QBO cannot see, including owner dependency, process maturity, leadership depth, transferability, and recurring revenue quality.',
    'The Value Engine score turns those qualitative facts into a consistent business-quality adjustment instead of relying only on gut feel.',
  ], y)

  y = addPdfSection(doc, 'Industry Benchmark Sources', y)
  y = addPdfBullets(doc, [
    ...benchmark.sourceNotes,
    'Benchmarks are directional reference points. We refresh them as more current, size-specific, and industry-specific transaction evidence becomes available.',
  ], y)

  y = addPdfSection(doc, 'How The Multiple Is Adjusted', y)
  y = addPdfBullets(
    doc,
    methodology.adjustments.map((item) => item.label === 'Industry benchmark'
      ? `${item.label}: ${methodology.base.toFixed(1)}x starting point. ${item.reason}`
      : `${item.label}: ${item.amount >= 0 ? '+' : ''}${item.amount.toFixed(1)}x. ${item.reason}`),
    y,
  )

  y = addPdfSection(doc, 'Why We Show A Range', y)
  y = addPdfBullets(doc, [
    `Bear case: ${money(model.cfoAdvisory.valuationRange[0].value)} at ${model.cfoAdvisory.valuationRange[0].multiple.toFixed(1)}x, reflecting risk discounts if weak areas do not improve.`,
    `Base case: ${money(model.cfoAdvisory.valuationRange[1].value)} at ${model.cfoAdvisory.valuationRange[1].multiple.toFixed(1)}x, reflecting the current company profile.`,
    `Upside case: ${money(model.cfoAdvisory.valuationRange[2].value)} at ${model.cfoAdvisory.valuationRange[2].multiple.toFixed(1)}x, reflecting the 12-month improvement case.`,
    'A range is more credible than one exact number because buyers, lenders, and successors price risk differently.',
  ], y)

  y = addPdfSection(doc, 'What Can Move The Valuation Higher', y)
  y = addPdfBullets(doc, [
    'Cleaner monthly financials and confirmed add-backs improve confidence in the earnings base.',
    'Higher EBITDA margin proves the business can turn revenue into cash flow.',
    'More recurring or contracted revenue makes the forecast more dependable.',
    'Lower owner dependency makes the business easier to transfer or scale.',
    'Lower client concentration reduces the risk that one relationship can damage value.',
    'Better systems, leadership, and documented workflows improve the Value Engine score.',
  ], y)

  y = addPdfSection(doc, 'Professional Caveat', y)
  y = addPdfText(
    doc,
    nextYear
      ? `This report is an advisory estimate of enterprise value for planning and decision-making. It is designed to show what drives value and what could improve it. Owner proceeds may differ after debt, excess cash, transaction costs, taxes, and closing adjustments. If normalized EBITDA is zero or negative, this EBITDA-multiple method requires an alternate valuation approach. It is not a formal appraisal, fairness opinion, tax valuation, or offer to buy the company. The model should be refreshed as actual QBO reports, client data, and operating evidence improve. Current 12-month upside case: ${money(nextYear.value)}.`
      : 'This report is an advisory estimate of enterprise value for planning and decision-making. Owner proceeds may differ after debt, excess cash, transaction costs, taxes, and closing adjustments. If normalized EBITDA is zero or negative, this EBITDA-multiple method requires an alternate valuation approach. It is not a formal appraisal, fairness opinion, tax valuation, or offer to buy the company. The model should be refreshed as actual QBO reports, client data, and operating evidence improve.',
    18,
    y,
    170,
    10,
  )

  doc.save(`${safeFileName(client.name)}-valuation-methodology.pdf`)
}

function downloadClientPdf(client: Client, model: ReturnType<typeof useClientModel>, benchmark: IndustryBenchmark) {
  const { financials } = client.data
  const nextQuarter = model.forecasts.find((item) => item.label === 'Next quarter')
  const nextYear = model.forecasts.at(-1)
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  let y = 18

  y = addPdfText(doc, `${client.name} Client Decision Report`, 14, y, 180, 18, 'bold')
  y = addPdfText(doc, `${client.lastUpdated} | Decision-use report for owners and leadership`, 14, y, 180, 9)
  y = addPdfSection(doc, 'Executive Read', y + 3)
  y = addPdfText(
    doc,
    `${businessPositionSummary(financials)} Estimated enterprise value is ${money(model.currentValue)}. The current-earnings methodology ceiling is ${money(model.targetValue)}, while the separate 12-month upside forecast is ${money(nextYear?.value)}.`,
    18,
    y,
    170,
    10,
  )

  y = addPdfSection(doc, 'Decision Dashboard', y)
  y = addPdfKpiRows(
    doc,
    [
      { label: 'Health score', value: `${model.healthScore}/100`, note: 'Overall current health and future-health profile.' },
      { label: '90-day health', value: `${model.cfoAdvisory.forwardHealth.find((item) => item.label === 'Next quarter')?.healthScore ?? model.healthScore}/100`, note: 'Projected company health for the next quarter.' },
      { label: 'Revenue', value: money(financials.revenue), note: 'Scale base for growth, pricing, and capacity decisions.' },
      { label: 'EBITDA margin', value: `${financials.ebitdaMargin}%`, note: 'Profit quality and capacity to self-fund improvements.' },
      { label: 'Recurring revenue', value: `${financials.recurringRevenue}%`, note: 'Revenue durability and forecast visibility.' },
      { label: 'Owner dependency', value: `${financials.ownerPctRevenue}%`, note: 'Main transferability and valuation risk.' },
      { label: 'Top client concentration', value: `${financials.topClientPct}%`, note: 'Revenue concentration risk.' },
    ],
    y,
  )

  y = addPdfSection(doc, 'Forward Risk Signals', y)
  y = addPdfBullets(doc, [
    model.cfoAdvisory.whatBreaksFirst,
    `Cash danger date: ${model.cfoAdvisory.cashDangerDate}.`,
    `Forecasted enterprise-value range: ${model.cfoAdvisory.valuationRange.map((scenario) => `${scenario.label} ${money(scenario.value)}`).join(' / ')}.`,
    'Enterprise value is not owner proceeds. A transaction normally subtracts debt, adds excess cash, and then accounts for taxes, fees, working-capital targets, and other closing adjustments.',
  ], y)

  y = addPdfSection(doc, 'Forecast For Decisions', y)
  y = addPdfBullets(doc, [
    nextQuarter ? `Next quarter: projected enterprise value ${money(nextQuarter.value)}, revenue ${money(nextQuarter.revenue)}, margin ${nextQuarter.margin.toFixed(1)}%.` : 'Next quarter forecast unavailable.',
    nextYear ? `Next year: projected enterprise value ${money(nextYear.value)}, revenue ${money(nextYear.revenue)}, margin ${nextYear.margin.toFixed(1)}%.` : 'Next year forecast unavailable.',
    'Use this to decide whether to invest in process documentation, marketing systems, hiring/delegation, and recurring offer packaging.',
  ], y)

  y = addPdfSection(doc, `Industry Comparison: ${benchmark.name}`, y)
  y = addPdfBullets(doc, [
    `EBITDA margin: company ${financials.ebitdaMargin}% vs industry ${benchmark.ebitdaMargin}%.`,
    `12-month forecast growth: company ${nextYear ? percentGrowth(financials.revenue, nextYear.revenue).toFixed(1) : 'missing'}% vs industry ${benchmark.revenueGrowth}%.`,
    `Recurring revenue: company ${financials.recurringRevenue}% vs industry ${benchmark.recurringRevenue}%.`,
    `Owner dependency: company ${financials.ownerPctRevenue}% vs target below ${benchmark.ownerDependency}%.`,
    `Top client concentration: company ${financials.topClientPct}% vs target below ${benchmark.topClientPct}%.`,
  ], y)

  y = addPdfSection(doc, 'What To Decide This Month', y)
  y = addPdfBullets(doc, [
    'Which owner-led responsibility should be documented and delegated first?',
    'Which client/service line should become the repeatable recurring package?',
    'Which KPI will be reviewed monthly as the primary forward-health indicator?',
    'Which data source needs to be cleaned up before the next report?',
  ], y)

  y = addPdfSection(doc, 'Risk And Opportunity', y)
  y = addPdfBullets(doc, [
    `Largest risk: ${model.priority.label} at ${model.priority.score.toFixed(1)}/10.`,
    `Strongest area: ${model.strongest.label} at ${model.strongest.score.toFixed(1)}/10.`,
    'Biggest opportunity: turn strong advisory delivery into repeatable systems that survive beyond the founder.',
    `Data caveat: current ${client.name} values may include placeholders until actual monthly exports are imported.`,
  ], y)

  y = addPdfSection(doc, 'Next 30 Days', y)
  y = addPdfBullets(doc, [
    'Upload QBO P&L, Balance Sheet, A/R Aging, Cash Flow, and Sales by Customer exports.',
    'Complete missing Value Engine answers and attach evidence to low scores.',
    'Document one client delivery workflow from intake through monthly meeting.',
    'Define one measurable recurring advisory offer and the KPI that proves it is working.',
  ], y)

  doc.save(`${safeFileName(client.name)}-client-decision-report.pdf`)
}

function MetricCard({
  label,
  value,
  sub,
  tone = 'blue',
}: {
  label: string
  value: string
  sub: string
  tone?: 'blue' | 'green' | 'amber' | 'slate'
}) {
  return (
    <section className={`metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{sub}</p>
    </section>
  )
}

function QboImportAudit({ status }: { status: UploadStatus }) {
  return (
    <div className="qbo-import-audit">
      {status.changes && status.changes.length > 0 && (
        <div className="qbo-change-list">
          {status.changes.slice(0, 8).map((change) => (
            <article key={`${change.label}-${change.before}-${change.after}`}>
              <span>{change.label}</span>
              <p><b>Before</b>{change.before}</p>
              <p><b>After</b>{change.after}</p>
            </article>
          ))}
        </div>
      )}
      {status.skipped && status.skipped.length > 0 && (
        <div className="qbo-skipped-list">
          <strong>Not imported</strong>
          {status.skipped.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      )}
      {status.missing && status.missing.length > 0 && (
        <div className="qbo-skipped-list">
          <strong>Still needed</strong>
          {status.missing.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function ViewPreferenceControls<T extends string>({
  title,
  description,
  options,
  selectedSections,
  defaultSections,
  focusSections,
  onToggle,
  onPreset,
}: {
  title: string
  description: string
  options: ViewPreferenceOption<T>[]
  selectedSections: T[]
  defaultSections: T[]
  focusSections: T[]
  onToggle: (section: T) => void
  onPreset: (sections: T[]) => void
}) {
  return (
    <section className="panel-visibility-card">
      <div className="panel-visibility-header">
        <div>
          <span>Panel visibility</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className="view-preset-actions">
          <button type="button" onClick={() => onPreset(defaultSections)}>Show all</button>
          <button type="button" onClick={() => onPreset(focusSections)}>Focus mode</button>
        </div>
      </div>
      <div className="panel-toggle-strip">
        {options.map((option) => {
          const checked = selectedSections.includes(option.id)
          return (
            <button
              key={option.id}
              type="button"
              className={checked ? 'panel-toggle active' : 'panel-toggle'}
              onClick={() => onToggle(option.id)}
              aria-pressed={checked}
              title={option.description}
            >
              <span className="toggle-switch" aria-hidden="true">
                <span />
              </span>
              {option.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function LastQboImportPanel({
  log,
  emptyTitle = 'No QBO import recorded yet.',
  emptyText = 'Upload one or more QBO CSV reports and this panel will show exactly which dashboard numbers changed.',
}: {
  log?: QboImportLog[]
  emptyTitle?: string
  emptyText?: string
}) {
  const latest = log?.[0]
  if (!latest) {
    return (
      <div className="last-import empty">
        <strong>{emptyTitle}</strong>
        <p>{emptyText}</p>
      </div>
    )
  }

  return (
    <div className="last-import">
      <header>
        <div>
          <span>Last import</span>
          <strong>{latest.date}</strong>
        </div>
        <small>{latest.files.length} file{latest.files.length === 1 ? '' : 's'}</small>
      </header>
      <div className="import-file-row">
        {latest.files.map((file) => (
          <span key={file}>{file}</span>
        ))}
      </div>
      <div className="qbo-change-list compact">
        {latest.changes.length ? (
          latest.changes.slice(0, 6).map((change) => (
            <article key={`${latest.id}-${change.label}`}>
              <span>{change.label}</span>
              <p><b>Before</b>{change.before}</p>
              <p><b>After</b>{change.after}</p>
            </article>
          ))
        ) : (
          <article>
            <span>No visible number changes</span>
            <p>The report was recognized, but uploaded values matched what was already shown.</p>
          </article>
        )}
      </div>
      {(latest.skipped ?? []).length > 0 && (
        <div className="qbo-skipped-list">
          <strong>Skipped</strong>
          {(latest.skipped ?? []).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      )}
      {(latest.missing ?? []).length > 0 && (
        <div className="qbo-skipped-list">
          <strong>Still needed</strong>
          {(latest.missing ?? []).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function Panel({
  title,
  subtitle,
  icon: Icon,
  children,
  className = '',
  action,
}: {
  title: string
  subtitle?: string
  icon?: typeof BarChart3
  children: ReactNode
  className?: string
  action?: ReactNode
}) {
  return (
    <section className={`panel ${className}`}>
      <header className="panel-header">
        <div>
          {Icon && <Icon size={19} />}
          <h2>{title}</h2>
        </div>
        <div className="panel-meta">
          {subtitle && <p>{subtitle}</p>}
          {action}
        </div>
      </header>
      {children}
    </section>
  )
}

function ValuationMarketChart({ client, model }: { client: Client; model: ReturnType<typeof useClientModel> }) {
  const series = buildVisibleHistory(client).filter((item): item is MonthlySnapshot & { value: number } => item.value != null)
  if (!series.length || model.currentValue == null) {
    return <p className="methodology-note">EV/EBITDA is not applicable while normalized EBITDA is zero or negative. Use an alternate valuation method.</p>
  }
  const width = 860
  const height = 320
  const padX = 52
  const padY = 34
  const chartBottom = height - 72
  const minRaw = Math.min(...series.map((item) => item.value))
  const maxRaw = Math.max(...series.map((item) => item.value))
  const spread = Math.max(maxRaw - minRaw, Math.max(maxRaw, 1) * 0.08)
  const minValue = Math.max(0, minRaw - spread * 0.18)
  const maxValue = maxRaw + spread * 0.18
  const x = (index: number) => padX + (index / Math.max(series.length - 1, 1)) * (width - padX * 2)
  const y = (value: number) => chartBottom - ((value - minValue) / Math.max(maxValue - minValue, 1)) * (chartBottom - padY)
  const points = series.map((item, index) => [x(index), y(item.value)])
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point[0]},${point[1]}`).join(' ')
  const areaPath = `${path} L${points.at(-1)?.[0] ?? padX},${chartBottom} L${points[0]?.[0] ?? padX},${chartBottom} Z`
  const previous = series.at(-2)
  const change = previous ? model.currentValue - previous.value : 0
  const changePct = previous?.value ? (change / previous.value) * 100 : 0
  const completedObjectives = mergeAdvisorObjectives(client.data.advisorObjectives).filter((objective) => objective.completedAt).length
  const maxDelta = Math.max(...series.map((item, index) => Math.abs(item.value - (series[index - 1]?.value ?? item.value))), 1)

  return (
    <div className="market-valuation">
      <div className="market-header">
        <div>
          <span>VIH / Estimated enterprise value</span>
          <strong>{money(model.currentValue)}</strong>
        </div>
        <div className={change >= 0 ? 'market-change up' : 'market-change down'}>
          <ArrowUpRight size={17} />
          <strong>{change >= 0 ? '+' : '-'}{money(Math.abs(change))}</strong>
          <span>{changePct >= 0 ? '+' : ''}{changePct.toFixed(1)}%</span>
        </div>
      </div>
      <svg className="market-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Stock-style valuation growth chart">
        {[0, 0.25, 0.5, 0.75, 1].map((step) => {
          const lineY = padY + step * (chartBottom - padY)
          const value = maxValue - step * (maxValue - minValue)
          return (
            <g key={step}>
              <line x1={padX} x2={width - padX} y1={lineY} y2={lineY} />
              <text className="market-axis" x={width - padX + 10} y={lineY + 4}>
                {money(value)}
              </text>
            </g>
          )
        })}
        <path className="market-area" d={areaPath} />
        <path className="market-line" d={path} />
        {series.map((item, index) => {
          const point = points[index]
          const prior = series[index - 1]?.value ?? item.value
          const delta = item.value - prior
          const barHeight = Math.max(5, (Math.abs(delta) / maxDelta) * 34)
          return (
            <g key={`${item.month}-${index}`}>
              <rect
                className={delta >= 0 ? 'market-volume up' : 'market-volume down'}
                x={point[0] - 8}
                y={height - 34 - barHeight}
                width="16"
                height={barHeight}
                rx="3"
              />
              <circle cx={point[0]} cy={point[1]} r={index === series.length - 1 ? 6 : 4} />
              <text className="market-label" x={point[0]} y={height - 8}>
                {item.month}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="market-stats">
        <article>
          <span>Current multiple</span>
          <strong>{model.currentMultiple.toFixed(1)}x</strong>
        </article>
        <article>
          <span>Value Engine</span>
          <strong>{model.vesScore.toFixed(1)}/10</strong>
        </article>
        <article>
          <span>Objectives complete</span>
          <strong>{completedObjectives}/{defaultAdvisorObjectives.length}</strong>
        </article>
        <article>
          <span>Methodology-ceiling EV</span>
          <strong>{money(model.targetValue)}</strong>
        </article>
      </div>
    </div>
  )
}

function CompanyTrajectoryPanel({ client, model }: { client: Client; model: ReturnType<typeof useClientModel> }) {
  const history = buildVisibleHistory(client)
  const current = history.at(-1) ?? buildMonthlySnapshot(client, 'Current')
  const previous = history.at(-2)
  const dimensionPrevious = previous?.dimensionScores
  const dimensionCurrent = current.dimensionScores ?? Object.fromEntries(model.dimensionScores.map((item) => [item.id, item.score]))
  const trendCards = [
    {
      label: 'Estimated enterprise value',
      value: money(current.value),
      delta: getSnapshotDelta(current.value, previous?.value),
      format: money,
    },
    {
      label: 'Value Engine',
      value: `${current.vesScore.toFixed(1)}/10`,
      delta: getSnapshotDelta(current.vesScore, previous?.vesScore),
      format: (value: number) => `${value.toFixed(1)} pts`,
    },
    {
      label: 'Health score',
      value: current.healthScore !== undefined ? `${current.healthScore}/100` : 'Not tracked',
      delta: getSnapshotDelta(current.healthScore, previous?.healthScore),
      format: (value: number) => `${Math.round(value)} pts`,
    },
    {
      label: 'Revenue',
      value: money(current.revenue),
      delta: getSnapshotDelta(current.revenue, previous?.revenue),
      format: money,
    },
  ]

  return (
    <div className="trajectory-panel">
      <div className="trajectory-cards">
        {trendCards.map((card) => (
          <article key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <DeltaBadge delta={card.delta} format={card.format} />
          </article>
        ))}
      </div>
      <div className="trajectory-table">
        {history.slice(-6).map((snapshot, index, visible) => {
          const prior = visible[index - 1]
          return (
            <article key={`${snapshot.month}-${index}`}>
              <div>
                <span>Period</span>
                <strong>{snapshot.month}</strong>
                <small>{snapshot.note ?? 'Snapshot'}</small>
              </div>
              <div>
                <span>Enterprise value</span>
                <strong>{money(snapshot.value)}</strong>
                <DeltaBadge delta={getSnapshotDelta(snapshot.value, prior?.value)} format={money} />
              </div>
              <div>
                <span>VES</span>
                <strong>{snapshot.vesScore.toFixed(1)}</strong>
                <DeltaBadge delta={getSnapshotDelta(snapshot.vesScore, prior?.vesScore)} format={(value) => `${value.toFixed(1)}`} />
              </div>
              <div>
                <span>Health</span>
                <strong>{snapshot.healthScore !== undefined ? snapshot.healthScore : 'NA'}</strong>
                <DeltaBadge delta={getSnapshotDelta(snapshot.healthScore, prior?.healthScore)} format={(value) => `${Math.round(value)}`} />
              </div>
              <div>
                <span>Revenue</span>
                <strong>{money(snapshot.revenue)}</strong>
                <DeltaBadge delta={getSnapshotDelta(snapshot.revenue, prior?.revenue)} format={money} />
              </div>
              <div>
                <span>Runway / DSO</span>
                <strong>{snapshot.runway !== undefined ? `${number(snapshot.runway)} mo` : 'NA'}</strong>
                <small>{snapshot.dso !== undefined ? `${number(snapshot.dso)} days DSO` : 'DSO not tracked'}</small>
              </div>
            </article>
          )
        })}
      </div>
      <div className="dimension-movement">
        {dimensions.map((dimension) => {
          const currentScore = dimensionCurrent[dimension.id]
          const previousScore = dimensionPrevious?.[dimension.id]
          return (
            <article key={dimension.id}>
              <span>{dimension.label}</span>
              <strong>{currentScore !== undefined ? currentScore.toFixed(1) : 'NA'}</strong>
              <DeltaBadge delta={getSnapshotDelta(currentScore, previousScore)} format={(value) => `${value.toFixed(1)}`} />
            </article>
          )
        })}
      </div>
    </div>
  )
}

function AdvisorObjectivesPanel({
  client,
  portalMode,
  onToggle,
}: {
  client: Client
  portalMode: PortalMode
  onToggle: (objectiveId: string, completed: boolean) => void
}) {
  const objectives = mergeAdvisorObjectives(client.data.advisorObjectives)
  const completedCount = objectives.filter((objective) => objective.completedAt).length
  const progress = (completedCount / Math.max(objectives.length, 1)) * 100

  return (
    <div className="objective-panel">
      <div className="objective-summary">
        <div>
          <span>{portalMode === 'advisor' ? 'Advisor portal' : 'Client portal'}</span>
          <strong>{completedCount}/{objectives.length} objectives complete</strong>
        </div>
        <div className="objective-progress" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="objective-list">
        {objectives.map((objective) => {
          const completed = Boolean(objective.completedAt)
          const dimension = dimensions.find((item) => item.id === objective.dimensionId)
          return (
            <article key={objective.id} className={completed ? 'complete' : ''}>
              <div>
                <span>{dimension?.label ?? objective.dimensionId}</span>
                <strong>{objective.title}</strong>
                <p>{objective.detail}</p>
                <small>
                  {completed ? `Completed ${objective.completedAt}` : `Owner: ${objective.owner}`} | Valuation lift: +{objective.impact.scoreLift.toFixed(2)} VES
                </small>
              </div>
              {portalMode === 'advisor' ? (
                <button type="button" className={completed ? 'complete' : ''} onClick={() => onToggle(objective.id, !completed)}>
                  {completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  {completed ? 'Done' : 'Complete'}
                </button>
              ) : (
                <span className={`objective-status ${completed ? 'complete' : ''}`}>{completed ? 'Complete' : 'In progress'}</span>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}

function RadarChart({ scores }: { scores: ReturnType<typeof getDimensionScores> }) {
  const cx = 180
  const cy = 180
  const radius = 126
  const points = scores.map((item, index) => {
    const angle = (Math.PI * 2 * index) / scores.length - Math.PI / 2
    const dist = (item.score / 10) * radius
    return [cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist]
  })
  const polygon = points.map((point) => point.join(',')).join(' ')

  return (
    <svg className="radar-chart" viewBox="0 0 360 390" role="img" aria-label="Value Engine radar chart">
      {[2, 4, 6, 8, 10].map((level) => {
        const ring = dimensions
          .map((_, index) => {
            const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2
            const dist = (level / 10) * radius
            return [cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist].join(',')
          })
          .join(' ')
        return <polygon key={level} className="radar-ring" points={ring} />
      })}
      {dimensions.map((dimension, index) => {
        const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2
        const x = cx + Math.cos(angle) * (radius + 32)
        const y = cy + Math.sin(angle) * (radius + 32)
        return (
          <g key={dimension.id}>
            <line x1={cx} y1={cy} x2={cx + Math.cos(angle) * radius} y2={cy + Math.sin(angle) * radius} />
            <text x={x} y={y} textAnchor={x < cx - 10 ? 'end' : x > cx + 10 ? 'start' : 'middle'}>
              {dimension.label}
            </text>
          </g>
        )
      })}
      <polygon className="radar-score" points={polygon} />
      {points.map((point, index) => (
        <circle key={scores[index].id} cx={point[0]} cy={point[1]} r="5" fill={scoreColor(scores[index].score)} />
      ))}
    </svg>
  )
}

function HeatMap({ scores }: { scores: ReturnType<typeof getDimensionScores> }) {
  return (
    <div className="heatmap">
      {scores.map((dimension) => {
        const Icon = dimension.icon
        return (
          <article key={dimension.id} className={`heat-row ${scoreTone(dimension.score)}`}>
            <div className="heat-name">
              <span style={{ color: dimension.color }}>
                <Icon size={18} />
              </span>
              <div>
                <strong>{dimension.label}</strong>
                <small>{scoreLabel(dimension.score)}</small>
              </div>
            </div>
            <div className="heat-bar" aria-hidden="true">
              <span style={{ width: `${dimension.score * 10}%`, backgroundColor: scoreColor(dimension.score) }} />
            </div>
            <div className="heat-score">{dimension.score.toFixed(1)}</div>
          </article>
        )
      })}
    </div>
  )
}

function DimensionDetail({ scores }: { scores: ReturnType<typeof getDimensionScores> }) {
  return (
    <div className="dimension-grid">
      {scores.map((dimension) => (
        <article key={dimension.id} className="dimension-card">
          <header>
            <strong>{dimension.label}</strong>
            <span style={{ color: scoreColor(dimension.score) }}>{dimension.score.toFixed(1)}</span>
          </header>
          <ul>
            {dimension.items.map((item) => (
              <li key={item.label}>
                <span>{item.label}</span>
                <b>{item.score}</b>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  )
}

function QuestionEditor({
  question,
  response,
  editable,
  onSave,
}: {
  question: AssessmentQuestion
  response: QuestionResponse
  editable: boolean
  onSave: (response: QuestionResponse) => void
}) {
  const [draft, setDraft] = useState(response)

  useEffect(() => {
    setDraft(response)
  }, [response])

  if (!editable) {
    return (
      <article className={`question-card ${response.status}`}>
        <header>
          <span>{question.subarea}</span>
          <strong>{response.score}/10</strong>
        </header>
        <h3>{question.text}</h3>
        <p>{response.answer}</p>
        <small>{response.evidence}</small>
      </article>
    )
  }

  return (
    <article className={`question-card editable ${draft.status}`}>
      <header>
        <span>{question.subarea}</span>
        <strong>{draft.score}/10</strong>
      </header>
      <h3>{question.text}</h3>
      <label className="score-editor">
        <span>Score</span>
        <input
          type="range"
          min="0"
          max="10"
          step="1"
          value={draft.score}
          onChange={(event) => setDraft((current) => ({ ...current, score: Number(event.target.value) }))}
        />
      </label>
      <label className="answer-field">
        <span>Answer</span>
        <textarea
          value={draft.answer}
          onChange={(event) => setDraft((current) => ({ ...current, answer: event.target.value }))}
          rows={4}
        />
      </label>
      <label className="answer-field">
        <span>Evidence</span>
        <textarea
          value={draft.evidence}
          onChange={(event) => setDraft((current) => ({ ...current, evidence: event.target.value }))}
          rows={2}
        />
      </label>
      <div className="question-actions">
        <label>
          <span>Status</span>
          <select
            value={draft.status}
            onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as QuestionResponse['status'] }))}
          >
            <option value="missing">Missing</option>
            <option value="sample">Sample</option>
            <option value="confirmed">Confirmed</option>
          </select>
        </label>
        <button type="button" onClick={() => onSave(draft)}>
          <CheckCircle2 size={16} />
          Save answer
        </button>
      </div>
    </article>
  )
}

function AssessmentBrowser({
  client,
  activeDimension,
  onDimensionChange,
  portalMode,
  onAnswerSave,
}: {
  client: Client
  activeDimension: string
  onDimensionChange: (dimensionId: string) => void
  portalMode: PortalMode
  onAnswerSave: (params: {
    dimensionId: string
    questionId: string
    questionLabel: string
    subarea: string
    response: QuestionResponse
  }) => void
}) {
  const dimension = assessmentDimensions.find((item) => item.id === activeDimension) ?? assessmentDimensions[0]
  const editable = portalMode === 'advisor'

  return (
    <div className="assessment-browser">
      <div className="dimension-tabs" role="tablist" aria-label="Assessment dimensions">
        {assessmentDimensions.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === activeDimension ? 'active' : ''}
            onClick={() => onDimensionChange(item.id)}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className="question-bank-summary">
        <strong>{dimension.name}</strong>
        <span>{dimension.questions.length} questions in this category</span>
        <p>
          The full question bank is loaded here. Confirmed answers will replace missing placeholders as each client completes the intake or as prior assessment files are imported.
        </p>
      </div>
      <div className="question-list">
        {dimension.questions.slice(0, 16).map((question) => {
          const response = getQuestionResponse(client, question.id, dimension.id)
          return (
            <QuestionEditor
              key={question.id}
              question={question}
              response={response}
              editable={editable}
              onSave={(nextResponse) =>
                onAnswerSave({
                  dimensionId: dimension.id,
                  questionId: question.id,
                  questionLabel: question.text,
                  subarea: question.subarea,
                  response: nextResponse,
                })
              }
            />
          )
        })}
      </div>
    </div>
  )
}

function IndustryBenchmarkPanel({
  financials,
  model,
  selectedIndustryId,
  onIndustryChange,
}: {
  financials: Financials
  model: ReturnType<typeof useClientModel>
  selectedIndustryId: IndustryBenchmarkId
  onIndustryChange: (industryId: IndustryBenchmarkId) => void
}) {
  const benchmark = getIndustryBenchmark(selectedIndustryId)
  const comparisons = getBenchmarkComparisons(financials, model, benchmark)

  return (
    <div className="industry-benchmark-panel">
      <div className="benchmark-control">
        <label>
          <span>Compare against</span>
          <select value={selectedIndustryId} onChange={(event) => onIndustryChange(event.target.value as IndustryBenchmarkId)}>
            {industryBenchmarks.map((industry) => (
              <option key={industry.id} value={industry.id}>
                {industry.name}
              </option>
            ))}
          </select>
        </label>
        <div>
          <strong>{benchmark.name}</strong>
          <p>{benchmark.basis}</p>
        </div>
      </div>
      <div className="industry-comparison-grid">
        {comparisons.map((item) => (
          <article key={item.label} className={item.insight.tone}>
            <header>
              <span>{item.label}</span>
              <strong>{item.insight.label}</strong>
            </header>
            <div className="comparison-values">
              <p><b>Company</b>{item.actual}</p>
              <p><b>Industry</b>{item.benchmark}</p>
            </div>
            <small>{item.decision}</small>
          </article>
        ))}
      </div>
      <div className="benchmark-sources">
        <strong>Benchmark sources used</strong>
        <div>
          {benchmark.sourceNotes.map((source) => (
            <span key={source}>{source}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function ForecastIndustryComparison({
  financials,
  model,
  benchmark,
}: {
  financials: Financials
  model: ReturnType<typeof useClientModel>
  benchmark: IndustryBenchmark
}) {
  const oneYear = model.forecasts.at(-1)
  const forecastGrowth = oneYear ? percentGrowth(financials.revenue, oneYear.revenue) : 0
  const industryValue = calculateEnterpriseValue(financials.normalizedEbitda, benchmark.evEbitdaMultiple)
  const currentValueDelta = model.currentValue != null && industryValue != null ? model.currentValue - industryValue : null
  const forecastRule = forecastGrowth + (oneYear?.margin ?? financials.ebitdaMargin)

  return (
    <div className="forecast-industry-comparison">
      <article>
        <span>Selected industry</span>
        <strong>{benchmark.name}</strong>
        <p>{benchmark.basis}</p>
      </article>
      <article>
        <span>Forecast growth vs industry</span>
        <strong>{forecastGrowth.toFixed(1)}% vs {benchmark.revenueGrowth}%</strong>
        <p>{forecastGrowth >= benchmark.revenueGrowth ? 'Projected growth clears the industry baseline.' : 'Forecast growth trails the industry baseline.'}</p>
      </article>
      <article>
        <span>Forecast margin vs industry</span>
        <strong>{oneYear?.margin.toFixed(1) ?? financials.ebitdaMargin}% vs {benchmark.ebitdaMargin}%</strong>
        <p>{(oneYear?.margin ?? financials.ebitdaMargin) >= benchmark.ebitdaMargin ? 'Projected margin is above industry average.' : 'Projected margin still trails industry average.'}</p>
      </article>
      <article>
        <span>Industry multiple value</span>
        <strong>{money(industryValue)}</strong>
        <p>{currentValueDelta == null ? 'EV/EBITDA is not applicable with nonpositive normalized EBITDA.' : currentValueDelta >= 0 ? `${money(currentValueDelta)} above industry multiple case.` : `${money(Math.abs(currentValueDelta))} below industry multiple case.`}</p>
      </article>
      <article>
        <span>Growth + margin score</span>
        <strong>{forecastRule.toFixed(1)}%</strong>
        <p>Useful for SaaS/recurring models; compares the balance of forecast growth and profitability.</p>
      </article>
    </div>
  )
}

function CfoCommandCenter({ model }: { model: ReturnType<typeof useClientModel> }) {
  const { cfoAdvisory } = model
  const nextQuarter = cfoAdvisory.forwardHealth.find((item) => item.label === 'Next quarter')

  return (
    <div className="cfo-command">
      <article className={`cfo-primary-risk ${cfoAdvisory.primaryRisk.tone}`}>
        <span>What breaks first</span>
        <strong>{cfoAdvisory.primaryRisk.label}</strong>
        <p>{cfoAdvisory.whatBreaksFirst}</p>
      </article>
      <article>
        <span>90-day health</span>
        <strong>{nextQuarter ? `${nextQuarter.healthScore}/100` : 'Missing'}</strong>
        <p>{nextQuarter ? `${nextQuarter.confidence} confidence, ${money(nextQuarter.cash)} projected cash.` : 'Forecast unavailable.'}</p>
      </article>
      <article>
        <span>Cash danger date</span>
        <strong>{cfoAdvisory.cashDangerDate}</strong>
        <p>{cfoAdvisory.breakEvenGap ? `${money(cfoAdvisory.breakEvenGap)} monthly break-even gap.` : `${money(cfoAdvisory.monthlyCashFlow)} monthly cash flow modeled.`}</p>
      </article>
      <article>
        <span>Risk load</span>
        <strong>{cfoAdvisory.riskSignals.filter((signal) => signal.tone === 'red').length} high</strong>
        <p>{cfoAdvisory.riskSignals.filter((signal) => signal.tone === 'yellow').length} watch items, {cfoAdvisory.revenueVolatility.toFixed(1)}% revenue volatility.</p>
      </article>
    </div>
  )
}

function ForwardHealthTable({ model }: { model: ReturnType<typeof useClientModel> }) {
  return (
    <div className="forward-health-table">
      {model.cfoAdvisory.forwardHealth.map((period) => (
        <article key={period.label} className={scoreTone(period.healthScore / 10)}>
          <div>
            <span>Period</span>
            <strong>{period.label}</strong>
            <small>{period.confidence} confidence</small>
          </div>
          <div>
            <span>Health</span>
            <strong>{period.healthScore}/100</strong>
          </div>
          <div>
            <span>Revenue</span>
            <strong>{money(period.revenue)}</strong>
          </div>
          <div>
            <span>Margin</span>
            <strong>{number(period.margin, '%')}</strong>
          </div>
          <div>
            <span>Runway</span>
            <strong>{number(period.runway)} mo</strong>
          </div>
          <div>
            <span>Enterprise value</span>
            <strong>{money(period.value)}</strong>
          </div>
        </article>
      ))}
    </div>
  )
}

function RiskRadarPanel({ model }: { model: ReturnType<typeof useClientModel> }) {
  return (
    <div className="risk-radar-grid">
      {model.cfoAdvisory.riskSignals.map((signal) => (
        <article key={signal.id} className={signal.tone}>
          <header>
            <span>{describeRiskTone(signal.tone)}</span>
            <strong>{signal.label}</strong>
            <b>{signal.metric}</b>
          </header>
          <div className="risk-meter" aria-hidden="true">
            <span style={{ width: `${signal.score}%` }} />
          </div>
          <p>{signal.summary}</p>
          <small>{signal.action}</small>
        </article>
      ))}
    </div>
  )
}

function ValuationRangePanel({ model }: { model: ReturnType<typeof useClientModel> }) {
  const values = model.cfoAdvisory.valuationRange.map((scenario) => scenario.value).filter((value): value is number => value != null)
  if (!values.length) {
    return <p className="methodology-note">EV/EBITDA is not applicable while normalized EBITDA is zero or negative. Use an alternate valuation method.</p>
  }
  const min = Math.min(...values)
  const max = Math.max(...values)

  return (
    <div className="valuation-range-panel">
      {model.cfoAdvisory.valuationRange.map((scenario) => {
        const left = scenario.value == null ? 0 : ((scenario.value - min) / Math.max(max - min, 1)) * 72
        return (
          <article key={scenario.label} className={scenario.label.toLowerCase()}>
            <span>{scenario.label} case</span>
            <strong>{money(scenario.value)}</strong>
            <p>{scenario.multiple.toFixed(1)}x multiple. {scenario.summary}</p>
            <div className="valuation-track" aria-hidden="true">
              <i style={{ left: `${left}%` }} />
            </div>
          </article>
        )
      })}
    </div>
  )
}

function KpiTable({ model }: { model: ReturnType<typeof useClientModel> }) {
  return (
    <div className="kpi-table">
      {model.kpis.map((row) => (
        <article key={row.label} className={row.gap === 'On target' ? 'on-target' : ''}>
          <div>
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
          <div>
            <span>Source</span>
            <p>{row.source}</p>
          </div>
          <div>
            <span>Target / Gap</span>
            <p>{row.target} / {row.gap}</p>
          </div>
          <div>
            <span>Advisor action</span>
            <p>{row.action}</p>
          </div>
          <small>{row.confidence}</small>
        </article>
      ))}
    </div>
  )
}

function QboGuide() {
  const [openReport, setOpenReport] = useState(qboReports[0].id)

  return (
    <div className="qbo-list">
      {qboReports.map((report) => (
        <article key={report.id} className="qbo-card">
          <button type="button" onClick={() => setOpenReport(openReport === report.id ? '' : report.id)}>
            <div>
              <strong>{report.name}</strong>
              <span>{report.timing}</span>
            </div>
            <ChevronDown className={openReport === report.id ? 'open' : ''} size={18} />
          </button>
          {openReport === report.id && (
            <div className="qbo-detail">
              <p>{report.purpose}</p>
              <ol>
                {report.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <div className="pill-row">
                {report.mapped.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
          )}
        </article>
      ))}
    </div>
  )
}

function ValuationMethodologyPanel({ model, benchmark }: { model: ReturnType<typeof useClientModel>; benchmark: IndustryBenchmark }) {
  return (
    <div className="valuation-methodology-panel">
      <article className="methodology-formula">
        <span>Core formula</span>
        <strong>Normalized EBITDA × industry-anchored multiple</strong>
        <p>
          The model starts with {benchmark.name} at {benchmark.evEbitdaMultiple.toFixed(1)}x, then adjusts to {model.currentMultiple.toFixed(1)}x for company-specific quality, risk, data confidence, and transferability.
        </p>
      </article>
      <div className="methodology-adjustments">
        {model.cfoAdvisory.multipleMethodology.adjustments.map((adjustment) => (
          <article key={adjustment.label}>
            <span>{adjustment.label}</span>
            <strong>
              {adjustment.label === 'Industry benchmark'
                ? `${model.cfoAdvisory.multipleMethodology.base.toFixed(1)}x base`
                : `${adjustment.amount >= 0 ? '+' : ''}${adjustment.amount.toFixed(1)}x`}
            </strong>
            <p>{adjustment.reason}</p>
          </article>
        ))}
      </div>
      <p className="methodology-note">
        This is a planning estimate, not a formal appraisal or offer. The range should be refreshed when financials, add-backs, industry evidence, or operating facts change.
      </p>
    </div>
  )
}

function ForecastTable({ model }: { model: ReturnType<typeof useClientModel> }) {
  return (
    <div className="forecast-table">
      {model.forecasts.map((item) => (
        <article key={item.label}>
          <header>
            <span>{item.label}</span>
            <strong>{money(item.value)}</strong>
            <small>Projected enterprise value</small>
          </header>
          <div>
            <p><b>Revenue</b>{money(item.revenue)}</p>
            <p><b>EBITDA margin</b>{number(item.margin, '%')}</p>
            <p><b>VES</b>{number(item.projectedVes, '/10')}</p>
            <p><b>Owner dependency</b>{number(item.ownerDependency, '%')}</p>
            <p><b>Recurring revenue</b>{number(item.recurringRevenue, '%')}</p>
            <p><b>Top client</b>{number(item.topClientPct, '%')}</p>
          </div>
        </article>
      ))}
    </div>
  )
}

function ForecastSourceMap({ client, model }: { client: Client; model: ReturnType<typeof useClientModel> }) {
  const { financials } = client.data
  const sources = [
    {
      title: 'QBO financial baseline',
      source: 'P&L, Balance Sheet, A/R Aging, Cash Flow',
      current: `${money(financials.revenue)} revenue, ${money(financials.normalizedEbitda)} normalized EBITDA, ${financials.ebitdaMargin}% margin`,
      forecastUse: 'Sets the starting point for revenue, EBITDA, cash runway, DSO, and working-capital health.',
    },
    {
      title: 'Customer and revenue quality',
      source: 'Sales by Customer, CRM/client list, recurring revenue schedule',
      current: `${financials.customerCount} clients, ${financials.topClientPct}% top-client concentration, ${financials.recurringRevenue}% recurring revenue`,
      forecastUse: 'Controls concentration risk, revenue durability, and how much confidence the next-quarter forecast deserves.',
    },
    {
      title: 'Value Engine answers',
      source: '289-question assessment plus advisor evidence',
      current: `${model.vesScore.toFixed(1)}/10 VES, lowest driver is ${model.priority.label}`,
      forecastUse: 'Adjusts the selected industry multiple for transferability, systems, leadership, owner dependency, and execution quality.',
    },
    {
      title: 'Industry valuation benchmark',
      source: `${model.cfoAdvisory.multipleMethodology.base.toFixed(1)}x ${model.cfoAdvisory.multipleMethodology.methodology[0]}`,
      current: `${model.currentMultiple.toFixed(1)}x after company-specific adjustments`,
      forecastUse: 'Anchors the valuation multiple to industry research before applying quality, risk, and data-confidence adjustments.',
    },
    {
      title: 'Advisor assumptions',
      source: 'Explicit model assumptions reviewed each month',
      current: 'Revenue growth, margin expansion, recurring revenue, owner dependency, DSO, and concentration assumptions are benchmark-aware.',
      forecastUse: 'Creates the 30-day, quarter, 6-month, and 12-month case until actual monthly trend data replaces assumptions.',
    },
  ]

  return (
    <div className="forecast-source-map">
      {sources.map((item) => (
        <article key={item.title}>
          <span>{item.source}</span>
          <strong>{item.title}</strong>
          <p>{item.current}</p>
          <small>{item.forecastUse}</small>
        </article>
      ))}
    </div>
  )
}

function ForecastAssumptionTable({ model }: { model: ReturnType<typeof useClientModel> }) {
  const nextYear = model.forecasts.at(-1)
  const rows = [
    {
      driver: 'Revenue growth',
      currentSource: 'QBO P&L by month + prior-year comparison',
      assumption: nextYear ? `${nextYear.assumptions.revenueGrowthRate}% annual growth, anchored to selected industry benchmark and revenue quality` : 'Needs forecast model',
      decisionUse: 'Pricing, sales capacity, marketing spend, and hiring timing.',
    },
    {
      driver: 'EBITDA margin',
      currentSource: 'QBO P&L + add-back schedule',
      assumption: nextYear ? `${nextYear.assumptions.marginExpansion} point margin improvement in the 12-month case` : 'Needs forecast model',
      decisionUse: 'Whether the business can fund growth without eroding cash.',
    },
    {
      driver: 'Recurring revenue',
      currentSource: 'CRM, billing export, contract/retainer schedule',
      assumption: nextYear ? `${nextYear.assumptions.recurringRevenueLift} point lift from packaging work into recurring offers` : 'Needs forecast model',
      decisionUse: 'Revenue durability, lender confidence, and buyer quality of revenue.',
    },
    {
      driver: 'Owner dependency',
      currentSource: 'Advisor interview, org chart, sales ownership, delivery map',
      assumption: nextYear ? `${nextYear.assumptions.ownerDependencyReduction} point reduction from documented workflows and delegation` : 'Needs forecast model',
      decisionUse: 'Transferability, valuation multiple, and succession readiness.',
    },
    {
      driver: 'Value multiple',
      currentSource: 'Industry benchmark + Value Engine + company risk profile',
      assumption: `Starts at ${model.cfoAdvisory.multipleMethodology.base.toFixed(1)}x industry benchmark and adjusts to ${model.currentMultiple.toFixed(1)}x for the current profile`,
      decisionUse: 'Shows whether operational fixes are actually creating enterprise value.',
    },
  ]

  return (
    <div className="assumption-table">
      {rows.map((row) => (
        <article key={row.driver}>
          <div>
            <span>Driver</span>
            <strong>{row.driver}</strong>
          </div>
          <div>
            <span>Pulls from</span>
            <p>{row.currentSource}</p>
          </div>
          <div>
            <span>Current assumption</span>
            <p>{row.assumption}</p>
          </div>
          <div>
            <span>Decision use</span>
            <p>{row.decisionUse}</p>
          </div>
        </article>
      ))}
    </div>
  )
}

function AdvisorTalkingPoints({ model }: { model: ReturnType<typeof useClientModel> }) {
  const oneYear = model.forecasts.at(-1)
  const currentPosition = model.currentValue == null
    ? 'EV/EBITDA is not applicable because normalized EBITDA is nonpositive; use an alternate valuation method.'
    : `Estimated enterprise value is ${money(model.currentValue)}. The current-earnings methodology ceiling is ${money(model.targetValue)}, separate from the 12-month upside case.`

  return (
    <div className="talking-points">
      <article>
        <h3>Open the meeting with</h3>
        <p>
          {currentPosition}
        </p>
      </article>
      <article>
        <h3>Flag clearly</h3>
        <p>
          {model.priority.label} is the lowest category at {model.priority.score.toFixed(1)}/10. That is what a buyer, lender, or partner would discount first.
        </p>
      </article>
      <article>
        <h3>Ask directly</h3>
        <p>
          "Which part of the business would slow down fastest if the owner stepped away for 30 days: sales, delivery, client communication, or decisions?"
        </p>
      </article>
      <article>
        <h3>Close with</h3>
        <p>
          {oneYear
            ? `The 12-month upside case reaches ${money(oneYear.value)} of enterprise value if the business improves recurring revenue, lowers owner dependency, and holds margin.`
            : 'The next move is documenting the repeatable advisory model and assigning measurable owners.'}
        </p>
      </article>
      <footer>
        <Lock size={16} />
        Advisor-only notes are hidden from client portal mode.
      </footer>
    </div>
  )
}

function GapPlan({ model }: { model: ReturnType<typeof useClientModel> }) {
  const actions = [
    { horizon: '30 days', gap: 'Assessment answers', move: 'Complete missing Value Engine answers and attach evidence for every low score.' },
    { horizon: '30 days', gap: 'Data confidence', move: 'Upload QBO financials plus CRM/Ops customer, pipeline, retention, recurring revenue, and payroll exports.' },
    { horizon: 'Quarter', gap: 'Owner dependency', move: 'Document sales process, advisory delivery workflow, and client meeting cadence.' },
    { horizon: '6 months', gap: 'Recurring revenue', move: 'Move service mix into defined monthly packages with renewal tracking.' },
    { horizon: '12 months', gap: 'Multiple expansion', move: `Lift VES from ${model.vesScore.toFixed(1)} to ${model.forecasts.at(-1)?.projectedVes.toFixed(1) ?? '6.8'} and defend a higher buyer multiple.` },
  ]

  return (
    <div className="gap-plan">
      {actions.map((action) => (
        <article key={`${action.horizon}-${action.gap}`}>
          <span>{action.horizon}</span>
          <strong>{action.gap}</strong>
          <p>{action.move}</p>
        </article>
      ))}
    </div>
  )
}

function MonthlyReport({
  client,
  model,
  industryBenchmark,
}: {
  client: Client
  model: ReturnType<typeof useClientModel>
  industryBenchmark: IndustryBenchmark
}) {
  const { financials } = client.data
  const nextQuarter = model.forecasts.find((item) => item.label === 'Next quarter')
  const nextYear = model.forecasts.at(-1)
  const nextQuarterHealth = model.cfoAdvisory.forwardHealth.find((item) => item.label === 'Next quarter')
  const decisionKpis = model.kpis.filter((kpi) => ['Recurring revenue', 'Owner dependency', 'Pipeline coverage', 'Revenue per client'].includes(kpi.label))
  const forecastGrowth = nextYear ? percentGrowth(financials.revenue, nextYear.revenue) : 0

  return (
    <article className="monthly-report">
      <header>
        <div>
          <span>Monthly Client Decision Report</span>
          <h2>{client.name}</h2>
          <p>{client.lastUpdated}</p>
        </div>
        <ShieldCheck size={28} />
      </header>
      <section className="brief-grid">
        <div>
          <span>Health score</span>
          <strong>{model.healthScore}/100</strong>
        </div>
        <div>
          <span>Estimated enterprise value</span>
          <strong>{money(model.currentValue)}</strong>
        </div>
        <div>
          <span>Gap to methodology ceiling</span>
          <strong>{money(model.valueGap)}</strong>
        </div>
        <div>
          <span>90-day health</span>
          <strong>{nextQuarterHealth ? `${nextQuarterHealth.healthScore}/100` : 'Missing'}</strong>
        </div>
      </section>
      <section className="brief-copy">
        <h3>Executive Summary</h3>
        <p>
          {client.name} is being tracked for profitability, cash stability, transferability, recurring revenue, and owner dependency. The model shows estimated enterprise value of {money(model.currentValue)} and a current-earnings methodology-ceiling gap of {money(model.valueGap)}. The separate 12-month upside enterprise-value case is {money(nextYear?.value)}. The first likely constraint is {model.cfoAdvisory.primaryRisk.label.toLowerCase()}.
        </p>
      </section>
      <section className="report-section">
        <h3>Forward Health And Risk</h3>
        <div className="report-kpi-grid">
          {[
            ['What breaks first', model.cfoAdvisory.primaryRisk.label, model.cfoAdvisory.primaryRisk.summary],
            ['Cash danger date', model.cfoAdvisory.cashDangerDate, model.cfoAdvisory.breakEvenGap ? `${money(model.cfoAdvisory.breakEvenGap)} monthly break-even gap.` : `${money(model.cfoAdvisory.monthlyCashFlow)} monthly cash flow modeled.`],
            ['Secondary risk', model.cfoAdvisory.secondaryRisk.label, model.cfoAdvisory.secondaryRisk.summary],
            ['Forecast confidence', nextQuarterHealth?.confidence ?? 'Low', `${model.cfoAdvisory.riskSignals.filter((signal) => signal.tone === 'red').length} high-risk signals currently visible.`],
          ].map(([label, value, note]) => (
            <article key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <p>{note}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="report-section">
        <h3>Decision Dashboard</h3>
        <div className="report-kpi-grid">
          {[
            ['Revenue', money(financials.revenue), 'Scale base for pricing, capacity, and growth decisions.'],
            ['Normalized EBITDA', money(financials.normalizedEbitda), 'Earnings power before buyer multiple or risk discount.'],
            ['Recurring revenue', `${financials.recurringRevenue}%`, 'Durability and predictability of revenue.'],
            ['Owner dependency', `${financials.ownerPctRevenue}%`, 'Main transferability and succession risk.'],
            ['Top client concentration', `${financials.topClientPct}%`, 'Revenue concentration risk.'],
            ['Cash runway', `${financials.runway} months`, 'Ability to fund the action plan without stress.'],
          ].map(([label, value, note]) => (
            <article key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <p>{note}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="report-section">
        <h3>Forecast For Decisions</h3>
        <div className="report-forecast-grid">
          <article>
            <span>Next-quarter enterprise value</span>
            <strong>{nextQuarter ? money(nextQuarter.value) : 'Missing'}</strong>
            <p>{nextQuarter ? `${money(nextQuarter.revenue)} revenue, ${nextQuarter.margin.toFixed(1)}% EBITDA margin, ${nextQuarter.projectedVes.toFixed(1)}/10 VES.` : 'Forecast unavailable.'}</p>
          </article>
          <article>
            <span>Next-year enterprise value</span>
            <strong>{nextYear ? money(nextYear.value) : 'Missing'}</strong>
            <p>{nextYear ? `${money(nextYear.revenue)} revenue, ${nextYear.margin.toFixed(1)}% EBITDA margin, ${nextYear.projectedVes.toFixed(1)}/10 VES.` : 'Forecast unavailable.'}</p>
          </article>
        </div>
        <p className="report-note">
          Forecasts pull from QBO financials, Sales by Customer/CRM data, Value Engine answers, and visible advisor assumptions. They should be rebuilt every month when the new data is uploaded.
        </p>
        <p className="report-note">
          Enterprise value is not owner proceeds. A transaction normally subtracts debt, adds excess cash, and then accounts for taxes, fees, working-capital targets, and other closing adjustments.
        </p>
      </section>
      <section className="report-section">
        <h3>Industry Comparison</h3>
        <div className="report-kpi-grid">
          {[
            ['EBITDA margin', `${financials.ebitdaMargin}%`, `${industryBenchmark.name} average: ${industryBenchmark.ebitdaMargin}%`],
            ['12-month growth', `${forecastGrowth.toFixed(1)}%`, `${industryBenchmark.name} baseline: ${industryBenchmark.revenueGrowth}%`],
            ['Recurring revenue', `${financials.recurringRevenue}%`, `${industryBenchmark.name} target: ${industryBenchmark.recurringRevenue}%`],
            ['Owner dependency', `${financials.ownerPctRevenue}%`, `Target below ${industryBenchmark.ownerDependency}%`],
            ['Top client', `${financials.topClientPct}%`, `Target below ${industryBenchmark.topClientPct}%`],
            ['Valuation multiple', `${model.currentMultiple.toFixed(1)}x`, `${industryBenchmark.name} benchmark: ${industryBenchmark.evEbitdaMultiple.toFixed(1)}x`],
          ].map(([label, value, note]) => (
            <article key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <p>{note}</p>
            </article>
          ))}
        </div>
        <p className="report-note">Benchmarks are directional and should be refreshed as new research or better industry-specific data becomes available.</p>
      </section>
      <section className="report-section">
        <h3>What This Means</h3>
        <div className="decision-list">
          <article>
            <strong>Best current signal</strong>
            <p>{model.strongest.label} is the strongest Value Engine category at {model.strongest.score.toFixed(1)}/10. Preserve this while fixing weaker transferability drivers.</p>
          </article>
          <article>
            <strong>Biggest risk</strong>
            <p>{model.priority.label} is the lowest category at {model.priority.score.toFixed(1)}/10. This is the first area a buyer, lender, or partner would question.</p>
          </article>
          <article>
            <strong>Decision to make</strong>
            <p>Pick one owner-led workflow to document and delegate before next month. The value gap will not close through reporting alone.</p>
          </article>
        </div>
      </section>
      <section className="report-section">
        <h3>Key KPI Gaps</h3>
        <div className="report-kpi-list">
          {decisionKpis.map((kpi) => (
            <article key={kpi.label}>
              <div>
                <span>{kpi.label}</span>
                <strong>{kpi.value}</strong>
              </div>
              <p><b>Target:</b> {kpi.target} / <b>Gap:</b> {kpi.gap}</p>
              <p>{kpi.action}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="report-section">
        <h3>Next 30 Days</h3>
        <ol className="report-actions">
          <li>Upload current QBO reports plus CRM/Ops reports so financial, customer, and labor figures become actual monthly numbers.</li>
          <li>Complete missing Value Engine answers and attach evidence to the lowest scores.</li>
          <li>Document one client delivery workflow from intake through monthly review.</li>
          <li>Define one recurring advisory package and the KPI that proves it is working.</li>
        </ol>
      </section>
    </article>
  )
}

function PortalLogin({
  loginForm,
  acceptForm,
  authError,
  clientCount,
  onLoginFormChange,
  onAcceptFormChange,
  onLogin,
  onAcceptInvite,
}: {
  loginForm: LoginForm
  acceptForm: AcceptInviteForm
  authError: string | null
  clientCount: number
  onLoginFormChange: (form: LoginForm) => void
  onAcceptFormChange: (form: AcceptInviteForm) => void
  onLogin: (event: FormEvent<HTMLFormElement>) => void
  onAcceptInvite: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <main className="auth-shell">
      <section className="auth-hero">
        <span>Value Intelligence Hub</span>
        <h1>Business value, CFO advisory, and client reporting in one secure portal.</h1>
        <p>
          The hosted version separates advisor tools from the client experience. Advisors manage companies, uploads, Value Engine answers, forecasts, and reports. Clients get a focused portal with their score, priorities, and monthly readout.
        </p>
        <div className="auth-proof-grid">
          <article>
            <strong>{clientCount}</strong>
            <small>company workspace{clientCount === 1 ? '' : 's'} ready</small>
          </article>
          <article>
            <strong>2</strong>
            <small>portal roles: advisor and client</small>
          </article>
          <article>
            <strong>Invite-only</strong>
            <small>account creation path</small>
          </article>
        </div>
      </section>

      <section className="auth-card-stack">
        <form className="auth-card" onSubmit={onLogin}>
          <div>
            <span>Advisor sign in</span>
            <h2>Sign in to the workspace</h2>
            <p>For this local build, use Mike or Troy's seeded email. Supabase will replace this with real password auth at launch.</p>
          </div>
          <label>
            Email
            <input
              value={loginForm.email}
              onChange={(event) => onLoginFormChange({ email: event.target.value })}
              placeholder="mike@lifepointfd.com"
              type="email"
            />
          </label>
          <button type="submit">Sign in</button>
          <small>Seeded: mike@lifepointfd.com or troy@cvga.com</small>
        </form>

        <form className="auth-card muted" onSubmit={onAcceptInvite}>
          <div>
            <span>Create account</span>
            <h2>Accept an invite</h2>
            <p>Clients and advisors create credentials from an invite token. In production this becomes the email invite link.</p>
          </div>
          <label>
            Invite token
            <input
              value={acceptForm.token}
              onChange={(event) => onAcceptFormChange({ ...acceptForm, token: event.target.value })}
              placeholder="invite-company-owner-..."
            />
          </label>
          <label>
            Name
            <input
              value={acceptForm.name}
              onChange={(event) => onAcceptFormChange({ ...acceptForm, name: event.target.value })}
              placeholder="Full name"
            />
          </label>
          <label>
            Password
            <input
              value={acceptForm.password}
              onChange={(event) => onAcceptFormChange({ ...acceptForm, password: event.target.value })}
              placeholder="At least 8 characters"
              type="password"
            />
          </label>
          <button type="submit">Create account</button>
        </form>

        {authError && <p className="auth-error">{authError}</p>}
      </section>
    </main>
  )
}

function InviteManager({
  inviteForm,
  inviteNotice,
  clientOptions,
  onInviteFormChange,
  onCreateInvite,
}: {
  inviteForm: InviteForm
  inviteNotice: InviteNotice | null
  clientOptions: Client[]
  onInviteFormChange: (form: InviteForm) => void
  onCreateInvite: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <form className="invite-form" onSubmit={onCreateInvite}>
      <span>Invite user</span>
      <input
        value={inviteForm.email}
        onChange={(event) => onInviteFormChange({ ...inviteForm, email: event.target.value })}
        placeholder="email@company.com"
        type="email"
        aria-label="Invite email"
      />
      <select
        value={inviteForm.role}
        onChange={(event) => onInviteFormChange({ ...inviteForm, role: event.target.value as InviteForm['role'] })}
        aria-label="Invite role"
      >
        <option value="client">Client</option>
        <option value="advisor">Advisor</option>
      </select>
      <select
        value={inviteForm.clientId}
        onChange={(event) => onInviteFormChange({ ...inviteForm, clientId: event.target.value })}
        aria-label="Invite company access"
        disabled={inviteForm.role === 'advisor'}
      >
        {clientOptions.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </select>
      <button type="submit" disabled={!inviteForm.email.trim()}>
        Create invite
      </button>
      {inviteNotice && (
        <div className="invite-notice">
          <strong>{roleLabel(inviteNotice.role)} invite created</strong>
          <p>{inviteNotice.email}</p>
          <code>{inviteNotice.token}</code>
        </div>
      )}
    </form>
  )
}

export default function App() {
  const [clientDirectory, setClientDirectory] = useState<Record<ClientId, Client>>(readStoredClients)
  const [authState, setAuthState] = useState<AuthState>(() => readStoredAuthState(Object.keys(readStoredClients())))
  const [session, setSession] = useState<Session | null>(() => readStoredSession(readStoredAuthState(Object.keys(readStoredClients()))))
  const [activeClientId, setActiveClientId] = useState<ClientId>('lifepoint')
  const [activeView, setActiveView] = useState<View>('dashboard')
  const [portalModePreference, setPortalModePreference] = useState<PortalMode>('advisor')
  const [activeAssessmentDimension, setActiveAssessmentDimension] = useState('planning')
  const [selectedIndustryId, setSelectedIndustryId] = useState<IndustryBenchmarkId>('professional-services')
  const [visibleKpiSections, setVisibleKpiSections] = useState<KpiViewSection[]>(defaultKpiViewSections)
  const [visibleForecastSections, setVisibleForecastSections] = useState<ForecastViewSection[]>(defaultForecastViewSections)
  const [companyForm, setCompanyForm] = useState<CompanyForm>({
    name: '',
    industryId: 'professional-services',
    advisor: 'Mike Metzger, CFP, CVGA',
  })
  const [loginForm, setLoginForm] = useState<LoginForm>({ email: 'mike@lifepointfd.com' })
  const [acceptForm, setAcceptForm] = useState<AcceptInviteForm>({ token: '', name: '', password: '' })
  const [inviteForm, setInviteForm] = useState<InviteForm>({ email: '', role: 'client', clientId: 'lifepoint' })
  const [inviteNotice, setInviteNotice] = useState<InviteNotice | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null)
  const qboFileInputRef = useRef<HTMLInputElement | null>(null)
  const crmFileInputRef = useRef<HTMLInputElement | null>(null)
  const visibleClientIds = visibleClientsForSession(authState, session)
  const visibleClients = visibleClientIds.map((clientId) => clientDirectory[clientId]).filter(Boolean)
  const client = visibleClients.find((item) => item.id === activeClientId) ?? visibleClients[0] ?? Object.values(clientDirectory)[0]
  const valuationIndustryBenchmark = getIndustryBenchmark(getIndustryIdByName(client.industry))
  const selectedIndustryBenchmark = getIndustryBenchmark(selectedIndustryId)
  const model = useClientModel(client, valuationIndustryBenchmark)
  const { financials } = client.data
  const canUseAdvisorTools = session?.role === 'owner' || session?.role === 'advisor'
  const portalMode: PortalMode = canUseAdvisorTools ? portalModePreference : 'client'

  useEffect(() => {
    window.localStorage.setItem(clientStorageKey, JSON.stringify(clientDirectory))
  }, [clientDirectory])

  useEffect(() => {
    const nextClientIds = Object.keys(clientDirectory)
    setAuthState((current) => syncAuthStateClientIds(current, nextClientIds))
  }, [clientDirectory])

  useEffect(() => {
    window.localStorage.setItem(authStorageKey, JSON.stringify(authState))
  }, [authState])

  useEffect(() => {
    if (!session) return
    window.localStorage.setItem(authSessionKey, session.email)
    const allowedClientIds = visibleClientsForSession(authState, session)
    if (allowedClientIds.length && !allowedClientIds.includes(activeClientId)) {
      const nextClient = clientDirectory[allowedClientIds[0]]
      setActiveClientId(allowedClientIds[0])
      setSelectedIndustryId(getIndustryIdByName(nextClient?.industry ?? 'Professional Services'))
    }
  }, [activeClientId, authState, clientDirectory, session])

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextSession = signIn(authState, loginForm.email)
    if (!nextSession) {
      setAuthError('No account found. Ask an advisor to create an invite first.')
      return
    }
    setSession(nextSession)
    setPortalModePreference(nextSession.role === 'client' ? 'client' : 'advisor')
    setAuthError(null)
    const allowedClientIds = visibleClientsForSession(authState, nextSession)
    if (allowedClientIds[0]) selectClient(allowedClientIds[0])
  }

  const handleAcceptInvite = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const nextState = acceptInvitation(authState, acceptForm)
      const inviteEmail = nextState.invitations[acceptForm.token]?.email
      const nextSession = inviteEmail ? signIn(nextState, inviteEmail) : null
      setAuthState(nextState)
      setSession(nextSession)
      setPortalModePreference(nextSession?.role === 'client' ? 'client' : 'advisor')
      setAcceptForm({ token: '', name: '', password: '' })
      setAuthError(null)
      const allowedClientIds = visibleClientsForSession(nextState, nextSession)
      if (allowedClientIds[0]) selectClient(allowedClientIds[0])
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Invite could not be accepted')
    }
  }

  const handleLogout = () => {
    window.localStorage.removeItem(authSessionKey)
    setSession(null)
    setPortalModePreference('advisor')
  }

  const handleCreateInvite = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!session || !canUseAdvisorTools) return
    const clientIds = inviteForm.role === 'advisor' ? visibleClientIds : [inviteForm.clientId]
    const nextInvite = createInvitation(authState, {
      email: inviteForm.email,
      role: inviteForm.role,
      clientIds,
      invitedBy: session.email,
    })
    setAuthState(nextInvite.state)
    setInviteNotice(nextInvite.invitation)
    setInviteForm((current) => ({ ...current, email: '' }))
  }

  const selectClient = (clientId: ClientId) => {
    const nextClient = clientDirectory[clientId]
    setActiveClientId(clientId)
    setSelectedIndustryId(getIndustryIdByName(nextClient?.industry ?? 'Professional Services'))
  }

  const addCompany = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canUseAdvisorTools || !companyForm.name.trim()) return

    const newClient = createNewClient(companyForm, Object.keys(clientDirectory))
    setClientDirectory((current) => ({ ...current, [newClient.id]: newClient }))
    setAuthState((current) => {
      const nextState = syncAuthStateClientIds(current, [...Object.keys(clientDirectory), newClient.id])
      if (!session || session.role === 'client') return nextState
      const account = nextState.accounts[session.email]
      if (!account) return nextState
      return {
        ...nextState,
        accounts: {
          ...nextState.accounts,
          [session.email]: {
            ...account,
            clientIds: Array.from(new Set([...account.clientIds, newClient.id])),
          },
        },
      }
    })
    if (session && session.role !== 'client') {
      setSession({ ...session, clientIds: Array.from(new Set([...session.clientIds, newClient.id])) })
    }
    setActiveClientId(newClient.id)
    setSelectedIndustryId(companyForm.industryId)
    setUploadStatus({ tone: 'warning', message: `${newClient.name} added. Upload QBO CSVs to replace the starter blank baseline.` })
    setCompanyForm((current) => ({ ...current, name: '' }))
  }

  const handleQboUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (!canUseAdvisorTools) return
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return

    const input = event.target
    void (async () => {
      let workingClient = client
      const recognized: string[] = []
      const changes: ImportChange[] = []
      const skipped: string[] = []

      for (const file of files) {
        const rows = await parseCsvFile(file)
        if (!rows.length) {
          skipped.push(`${file.name}: no readable rows`)
          continue
        }

        const { client: updatedClient, imported, changes: fileChanges } = applyQboRowsToClient(workingClient, rows, file.name)
        const uniqueImports = Array.from(new Set(imported))
        if (!uniqueImports.length) {
          skipped.push(`${file.name}: no recognized QBO metric rows`)
          continue
        }

        recognized.push(...uniqueImports.map((item) => `${file.name}: ${item}`))
        changes.push(...fileChanges)
        workingClient = updatedClient
      }

      if (!recognized.length) {
        setUploadStatus({
          tone: 'warning',
          message: 'I could read the file, but I could not detect QBO metric rows like Total Income, Net Income, Cash, A/R, payroll, or customer totals.',
          skipped,
        })
        input.value = ''
        return
      }

      const missing = getMissingQboInputs(workingClient.data.financials)
      const importLog: QboImportLog = {
        id: `${Date.now()}`,
        date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
        files: files.map((file) => file.name),
        recognized: Array.from(new Set(recognized)),
        changes,
        skipped,
        missing,
      }
      const updatedClient: Client = {
        ...workingClient,
        dataQuality: missing.length ? 'partial' : 'actual',
        data: {
          ...workingClient.data,
          qboImportLog: [importLog, ...(workingClient.data.qboImportLog ?? [])].slice(0, 6),
        },
      }

      setClientDirectory((current) => ({ ...current, [updatedClient.id]: updatedClient }))
      setUploadStatus({
        tone: changes.length ? 'success' : 'warning',
        message: changes.length
          ? `QBO import changed ${changes.length} number${changes.length === 1 ? '' : 's'} across ${files.length} file${files.length === 1 ? '' : 's'}.`
          : `QBO rows were recognized, but they did not change any displayed numbers. The uploaded values appear to match the current dashboard values.`,
        changes,
        skipped,
        missing,
      })
      input.value = ''
    })().catch((error: unknown) => {
      setUploadStatus({ tone: 'warning', message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` })
      input.value = ''
    })
  }

  const handleCrmUpload = (event: ChangeEvent<HTMLInputElement>) => {
    if (!canUseAdvisorTools) return
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return

    const input = event.target
    void (async () => {
      let workingClient = client
      const recognized: string[] = []
      const changes: ImportChange[] = []
      const skipped: string[] = []

      for (const file of files) {
        const rows = await parseCsvFile(file)
        if (!rows.length) {
          skipped.push(`${file.name}: no readable rows`)
          continue
        }

        const { client: updatedClient, imported, changes: fileChanges } = applyCrmRowsToClient(workingClient, rows, file.name)
        const uniqueImports = Array.from(new Set(imported))
        if (!uniqueImports.length) {
          skipped.push(`${file.name}: no recognized CRM, customer, pipeline, payroll, or ops metric columns`)
          continue
        }

        recognized.push(...uniqueImports.map((item) => `${file.name}: ${item}`))
        changes.push(...fileChanges)
        workingClient = updatedClient
      }

      if (!recognized.length) {
        setUploadStatus({
          tone: 'warning',
          message: 'I could read the file, but I could not detect CRM/Ops columns like client name, active status, revenue/spend, pipeline value, recurring revenue, churn, or payroll.',
          skipped,
        })
        input.value = ''
        return
      }

      const missing = getMissingQboInputs(workingClient.data.financials)
      const importLog: QboImportLog = {
        id: `${Date.now()}`,
        date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
        files: files.map((file) => file.name),
        recognized: Array.from(new Set(recognized)),
        changes,
        skipped,
        missing,
      }
      const updatedClient: Client = {
        ...workingClient,
        dataQuality: missing.length ? 'partial' : 'actual',
        data: {
          ...workingClient.data,
          crmImportLog: [importLog, ...(workingClient.data.crmImportLog ?? [])].slice(0, 6),
        },
      }

      setClientDirectory((current) => ({ ...current, [updatedClient.id]: updatedClient }))
      setUploadStatus({
        tone: changes.length ? 'success' : 'warning',
        message: changes.length
          ? `CRM/Ops import changed ${changes.length} number${changes.length === 1 ? '' : 's'} across ${files.length} file${files.length === 1 ? '' : 's'}.`
          : `CRM/Ops rows were recognized, but they did not change any displayed numbers. The uploaded values appear to match the current dashboard values.`,
        changes,
        skipped,
        missing,
      })
      input.value = ''
    })().catch((error: unknown) => {
      setUploadStatus({ tone: 'warning', message: `CRM/Ops upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` })
      input.value = ''
    })
  }

  const handleObjectiveToggle = (objectiveId: string, completed: boolean) => {
    if (!canUseAdvisorTools) return
    setClientDirectory((current) => {
      const currentClient = current[activeClientId]
      if (!currentClient) return current
      return {
        ...current,
        [activeClientId]: applyObjectiveCompletion(currentClient, objectiveId, completed),
      }
    })
  }

  const handleValueEngineAnswerSave = (params: {
    dimensionId: string
    questionId: string
    questionLabel: string
    subarea: string
    response: QuestionResponse
  }) => {
    if (!canUseAdvisorTools) return
    setClientDirectory((current) => {
      const currentClient = current[activeClientId]
      if (!currentClient) return current
      return {
        ...current,
        [activeClientId]: updateValueEngineAnswer({
          client: currentClient,
          ...params,
        }),
      }
    })
    setUploadStatus({ tone: 'success', message: 'Value Engine answer saved. The dashboard trajectory now reflects any score change.' })
  }

  const handleSaveDecisionLabScenario = (scenario: DecisionLabScenarioRecord) => {
    setClientDirectory((current) => {
      const currentClient = current[activeClientId]
      if (!currentClient) return current
      const existing = currentClient.data.decisionLabScenarios ?? []
      const scenarios = existing.some((item) => item.id === scenario.id)
        ? existing.map((item) => item.id === scenario.id ? scenario : item)
        : [...existing, scenario]
      return {
        ...current,
        [activeClientId]: {
          ...currentClient,
          data: { ...currentClient.data, decisionLabScenarios: scenarios },
        },
      }
    })
  }

  const handleShareDecisionLabScenario = (scenario: DecisionLabScenarioRecord) => {
    setClientDirectory((current) => {
      const currentClient = current[activeClientId]
      if (!currentClient) return current
      const existing = currentClient.data.decisionLabScenarios ?? []
      const scenarios = existing.some((item) => item.id === scenario.id)
        ? existing.map((item) => item.id === scenario.id ? scenario : item)
        : [...existing, scenario]
      return {
        ...current,
        [activeClientId]: {
          ...currentClient,
          data: {
            ...currentClient.data,
            decisionLabScenarios: scenarios,
            sharedDecisionLabScenarioId: scenario.id,
          },
        },
      }
    })
  }

  const toggleKpiSection = (section: KpiViewSection) => {
    setVisibleKpiSections((current) => {
      if (current.includes(section)) {
        return current.filter((item) => item !== section)
      }
      return [...current, section]
    })
  }

  const toggleForecastSection = (section: ForecastViewSection) => {
    setVisibleForecastSections((current) => {
      if (current.includes(section)) {
        return current.filter((item) => item !== section)
      }
      return [...current, section]
    })
  }

  if (!session) {
    return (
      <PortalLogin
        loginForm={loginForm}
        acceptForm={acceptForm}
        authError={authError}
        clientCount={Object.keys(clientDirectory).length}
        onLoginFormChange={setLoginForm}
        onAcceptFormChange={setAcceptForm}
        onLogin={handleLogin}
        onAcceptInvite={handleAcceptInvite}
      />
    )
  }

  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: Building2 },
    { id: 'value-engine', label: 'Value Engine', icon: Radar },
    { id: 'decision-lab', label: 'Decision Lab', icon: FlaskConical },
    { id: 'kpis', label: 'KPIs', icon: BarChart3 },
    { id: 'forecast', label: 'Forecast', icon: LineChart },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  ] satisfies Array<{ id: View; label: string; icon: typeof Building2 }>

  return (
    <div className="app-shell">
      <aside className="side-nav">
        <div className="brand-block">
          <BriefcaseBusiness size={25} />
          <div>
            <strong>Value Intelligence Hub</strong>
            <span>Lifepoint advisory workspace</span>
          </div>
        </div>

        <div className="account-card">
          <span>{roleLabel(session.role)} portal</span>
          <strong>{session.name}</strong>
          <small>{session.email}</small>
          <button type="button" onClick={handleLogout}>Sign out</button>
        </div>

        <label className="client-picker">
          <span>Client</span>
          <select value={activeClientId} onChange={(event) => selectClient(event.target.value)}>
            {visibleClients.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <nav>
          {nav.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                type="button"
                className={activeView === item.id ? 'active' : ''}
                onClick={() => setActiveView(item.id)}
              >
                <Icon size={18} />
                {item.label}
              </button>
            )
          })}
        </nav>

        {canUseAdvisorTools && (
          <>
            <form className="new-company-form" onSubmit={addCompany}>
              <span>New company</span>
              <input
                value={companyForm.name}
                onChange={(event) => setCompanyForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Company name"
                aria-label="Company name"
              />
              <select
                value={companyForm.industryId}
                onChange={(event) => setCompanyForm((current) => ({ ...current, industryId: event.target.value as IndustryBenchmarkId }))}
                aria-label="Company industry"
              >
                {industryBenchmarks.map((industry) => (
                  <option key={industry.id} value={industry.id}>
                    {industry.name}
                  </option>
                ))}
              </select>
              <button type="submit" disabled={!companyForm.name.trim()}>
                <Plus size={16} />
                Add company
              </button>
            </form>

            <InviteManager
              inviteForm={inviteForm}
              inviteNotice={inviteNotice}
              clientOptions={visibleClients}
              onInviteFormChange={setInviteForm}
              onCreateInvite={handleCreateInvite}
            />
          </>
        )}

        <div className="nav-summary">
          <span>Estimated enterprise value</span>
          <strong>{money(model.currentValue)}</strong>
          <p>{model.valueGap == null ? 'Alternate valuation method required' : model.valueGap > 0 ? `${money(model.valueGap)} gap to ${model.targetMultiple.toFixed(1)}x methodology ceiling` : 'Methodology ceiling reached'}</p>
        </div>
      </aside>

      <main className="main-view">
        <header className="topbar">
          <div>
            <span className="eyebrow">{client.industry} / {client.lastUpdated}</span>
            <h1>{client.name}</h1>
            <p>
              Business health, Value Engine answers, monthly KPI forecasting, gap analysis, and advisor-ready reporting.
            </p>
          </div>
          <div className="topbar-actions">
            {canUseAdvisorTools ? (
              <>
                <div className="mode-toggle" aria-label="Portal mode">
                  <button type="button" className={portalMode === 'advisor' ? 'active' : ''} onClick={() => setPortalModePreference('advisor')}>
                    Advisor
                  </button>
                  <button type="button" className={portalMode === 'client' ? 'active' : ''} onClick={() => setPortalModePreference('client')}>
                    Client preview
                  </button>
                </div>
                <input
                  ref={qboFileInputRef}
                  className="file-input"
                  type="file"
                  accept=".csv,text/csv"
                  multiple
                  onChange={handleQboUpload}
                />
                <button type="button" className="upload-action" onClick={() => qboFileInputRef.current?.click()}>
                  <Upload size={17} />
                  Upload QBO CSV
                </button>
                <input
                  ref={crmFileInputRef}
                  className="file-input"
                  type="file"
                  accept=".csv,text/csv"
                  multiple
                  onChange={handleCrmUpload}
                />
                <button type="button" className="upload-action secondary" onClick={() => crmFileInputRef.current?.click()}>
                  <Upload size={17} />
                  Upload CRM / Ops
                </button>
              </>
            ) : (
              <div className="client-portal-pill">
                <Lock size={16} />
                Client portal
              </div>
            )}
          </div>
        </header>

        {uploadStatus && (
          <section className={`upload-status ${uploadStatus.tone}`}>
            <FileSpreadsheet size={18} />
            <div>
              <p>{uploadStatus.message}</p>
              <QboImportAudit status={uploadStatus} />
            </div>
          </section>
        )}

        {client.dataQuality === 'demo' && (
          <section className="data-warning">
            <AlertTriangle size={18} />
            <div>
              <strong>Demo data is loaded.</strong>
              <p>The {client.name} KPI values are placeholders until actual QBO, CRM, and assessment responses are imported. The app now shows source and confidence so fake precision does not sneak into client work.</p>
            </div>
          </section>
        )}

        {activeView === 'dashboard' && (
          <div className="page-stack">
            <div className="metric-grid">
              <MetricCard label="Business Health" value={`${model.healthScore}/100`} sub="Current health blend of KPI quality, margin, cash, transferability, and VES" tone="green" />
              <MetricCard label="Value Engine Score" value={`${model.vesScore.toFixed(1)}/10`} sub={`Up ${model.vesChange.toFixed(1)} this month`} tone="blue" />
              <MetricCard label="Annual Revenue" value={money(financials.revenue)} sub={`${financials.customerCount} active clients, ${client.dataQuality} data`} tone="slate" />
              <MetricCard label="Gap to Methodology Ceiling" value={money(model.valueGap)} sub={`${model.currentMultiple.toFixed(1)}x current vs ${model.targetMultiple.toFixed(1)}x ceiling`} tone="amber" />
            </div>

            <Panel title="CFO Advisory Read" subtitle="Forward health, cash timing, and first likely constraint" icon={Gauge}>
              <CfoCommandCenter model={model} />
            </Panel>

            <Panel title="Last QBO Import" subtitle="What changed after the most recent upload" icon={FileSpreadsheet}>
              <LastQboImportPanel log={client.data.qboImportLog} />
            </Panel>

            <Panel title="Last CRM / Ops Import" subtitle="Customer, pipeline, retention, recurring revenue, and payroll signals" icon={Database}>
              <LastQboImportPanel
                log={client.data.crmImportLog}
                emptyTitle="No CRM/Ops import recorded yet."
                emptyText="Upload customer, pipeline, retention, recurring revenue, or payroll CSVs to improve non-QBO operating metrics."
              />
            </Panel>

            <section className="focus-band">
              <div>
                <span>Highest leverage this month</span>
                <h2>Turn the dashboard into a monthly operating conversation.</h2>
                <p>
                  The app now separates current health, future health, missing data, and specific gap-closing actions. For {client.name}, the first real job is confirming actual QBO/CRM numbers and completing the Value Engine answers.
                </p>
              </div>
              <div className="focus-score">
                <small>{model.priority.label}</small>
                <strong>{model.priority.score.toFixed(1)}</strong>
                <span>priority score</span>
              </div>
            </section>

            <Panel title="Estimated Enterprise Value" subtitle="Live movement under the current industry-anchored methodology" icon={LineChart}>
              <ValuationMarketChart client={client} model={model} />
            </Panel>

            <Panel title="Company Health Trajectory" subtitle="Month-over-month Value Engine, KPI, health, and enterprise-value movement" icon={BarChart3}>
              <CompanyTrajectoryPanel client={client} model={model} />
            </Panel>

            <div className="two-column">
              <Panel
                title={portalMode === 'advisor' ? 'Advisor Objectives' : 'Objective Progress'}
                subtitle={portalMode === 'advisor' ? 'Completing objectives moves the shared valuation model' : 'Same progress shown from the client portal'}
                icon={ListChecks}
              >
                <AdvisorObjectivesPanel client={client} portalMode={portalMode} onToggle={handleObjectiveToggle} />
              </Panel>
              <Panel title="Value Engine Radar" subtitle="Eight-category transferability profile" icon={Radar}>
                <RadarChart scores={model.dimensionScores} />
              </Panel>
            </div>

            <Panel title="Gap To Goal" subtitle="Current issue, horizon, and action path" icon={ListChecks}>
              <GapPlan model={model} />
            </Panel>

            <Panel title="Value Engine Heat Map" subtitle="Score bands across the 8 categories" icon={Gauge}>
              <HeatMap scores={model.dimensionScores} />
            </Panel>
          </div>
        )}

        {activeView === 'value-engine' && (
          <div className="page-stack">
            <div className="two-column">
              <Panel title="Score Detail" subtitle="Eight-category summary from current assessment model" icon={ClipboardCheck}>
                <DimensionDetail scores={model.dimensionScores} />
              </Panel>
              {portalMode === 'advisor' ? (
                <Panel title="Advisor Talking Points" subtitle="Updates from current month, lowest scores, and forecast" icon={MessageSquareText}>
                  <AdvisorTalkingPoints model={model} />
                </Panel>
              ) : (
                <Panel title="Client View" subtitle="Simplified client-facing narrative" icon={Users}>
                  <div className="client-note">
                    <h3>Your strongest area is {model.strongest.label}.</h3>
                    <p>Your biggest opportunity is {model.priority.label}. The goal this month is to turn that into a specific 30-day action plan.</p>
                  </div>
                </Panel>
              )}
            </div>
            <Panel title="Value Engine Questions And Answers" subtitle={`${assessmentDimensions.reduce((sum, item) => sum + item.questions.length, 0)} questions loaded from the assessment bank`} icon={Database}>
              <AssessmentBrowser
                client={client}
                activeDimension={activeAssessmentDimension}
                onDimensionChange={setActiveAssessmentDimension}
                portalMode={portalMode}
                onAnswerSave={handleValueEngineAnswerSave}
              />
            </Panel>
          </div>
        )}

        {activeView === 'decision-lab' && (
          <div className="page-stack">
            <DecisionLab
              clientId={client.id}
              companyName={client.name}
              portalMode={portalMode}
              scores={model.dimensionScores.map((item) => ({ id: item.id, label: item.label, score: item.score, color: item.color }))}
              financials={financials}
              benchmark={valuationIndustryBenchmark}
              dataQuality={client.dataQuality}
              savedScenarios={client.data.decisionLabScenarios ?? []}
              sharedScenarioId={client.data.sharedDecisionLabScenarioId}
              onSave={handleSaveDecisionLabScenario}
              onShare={handleShareDecisionLabScenario}
            />
          </div>
        )}

        {activeView === 'kpis' && (
          <div className="page-stack">
            <ViewPreferenceControls
              title="Choose KPI panels"
              description="Turn KPI sections on or off so the workspace matches the conversation you want to have."
              options={kpiViewOptions}
              selectedSections={visibleKpiSections}
              defaultSections={defaultKpiViewSections}
              focusSections={focusKpiViewSections}
              onToggle={toggleKpiSection}
              onPreset={setVisibleKpiSections}
            />
            {visibleKpiSections.includes('data-confidence') && (
              <Panel title="Data Confidence" subtitle="What is real, what is demo, and what needs an import" icon={Database}>
                <div className="confidence-grid">
                  <article>
                    <strong>Actual data needed</strong>
                    <p>QBO exports, CRM/customer reports, pipeline reports, payroll/labor reports, recurring revenue schedule, add-back schedule, and completed assessment responses.</p>
                  </article>
                  <article>
                    <strong>Current sample state</strong>
                    <p>{client.name} is loaded so workflows and reports can be tested before real monthly data is connected.</p>
                  </article>
                  <article>
                    <strong>Advisor standard</strong>
                    <p>Every KPI should show source, confidence, target, gap, and next action before it appears in a client meeting.</p>
                  </article>
                </div>
              </Panel>
            )}
            {visibleKpiSections.includes('kpi-table') && (
              <Panel title="Key KPI Operating Table" subtitle="Financial, operational, transferability, and future-health indicators" icon={Gauge}>
                <KpiTable model={model} />
              </Panel>
            )}
            {visibleKpiSections.includes('industry-benchmarking') && (
              <Panel title="Industry Benchmarking" subtitle="Toggle industries and compare company KPIs against built-in averages" icon={BarChart3}>
                <IndustryBenchmarkPanel
                  financials={financials}
                  model={model}
                  selectedIndustryId={selectedIndustryId}
                  onIndustryChange={setSelectedIndustryId}
                />
              </Panel>
            )}
          </div>
        )}

        {activeView === 'forecast' && (
          <div className="page-stack">
            <ViewPreferenceControls
              title="Choose forecast panels"
              description="Turn forecast sections on or off when you want a tighter readout or a full modeling view."
              options={forecastViewOptions}
              selectedSections={visibleForecastSections}
              defaultSections={defaultForecastViewSections}
              focusSections={focusForecastViewSections}
              onToggle={toggleForecastSection}
              onPreset={setVisibleForecastSections}
            />
            {visibleForecastSections.includes('forward-health') && (
              <Panel title="Forward Health Score" subtitle="Current, 30-day, 90-day, 6-month, and 12-month company health" icon={Gauge}>
                <ForwardHealthTable model={model} />
              </Panel>
            )}

            {visibleForecastSections.includes('risk-radar') && (
              <Panel title="Risk Radar" subtitle="Cash, revenue, margin, concentration, debt, owner dependency, and data confidence" icon={Radar}>
                <RiskRadarPanel model={model} />
              </Panel>
            )}

            {visibleForecastSections.includes('valuation-range') && (
              <Panel title="Forecasted Enterprise Value Range" subtitle="Industry benchmark multiple adjusted for company-specific quality and risk" icon={Target}>
                <ValuationRangePanel model={model} />
                <ValuationMethodologyPanel model={model} benchmark={valuationIndustryBenchmark} />
              </Panel>
            )}

            {visibleForecastSections.includes('source-map') && (
              <Panel title="Where Forecast Numbers Come From" subtitle="Input source, current value, and forecast use" icon={Database}>
                <ForecastSourceMap client={client} model={model} />
              </Panel>
            )}

            {visibleForecastSections.includes('rolling-forecast') && (
              <Panel title="Rolling Forecast" subtitle="Projected next 30 days, quarter, 6 months, and year" icon={LineChart}>
                <ForecastTable model={model} />
              </Panel>
            )}

            {visibleForecastSections.includes('forecast-vs-industry') && (
              <Panel title="Forecast Vs Industry" subtitle="12-month projection compared with the selected industry average" icon={BarChart3}>
                <ForecastIndustryComparison financials={financials} model={model} benchmark={selectedIndustryBenchmark} />
              </Panel>
            )}

            {visibleForecastSections.includes('assumptions') && (
              <Panel title="Forecast Assumptions" subtitle="The levers behind the projection" icon={Target}>
                <ForecastAssumptionTable model={model} />
                <div className="forecast-grid">
                  <article>
                    <span>Current position</span>
                    <p>Estimated enterprise value is {money(model.currentValue)} using normalized EBITDA and a {model.currentMultiple.toFixed(1)}x industry-anchored multiple.</p>
                  </article>
                  <article>
                    <span>Growth case</span>
                    <p>Base forecast uses benchmark-aware revenue growth, margin expansion, recurring revenue, owner-dependency, collections, and concentration assumptions.</p>
                  </article>
                  <article>
                    <span>What changes the math</span>
                    <p>Recurring revenue, lower owner dependency, documented delivery, and lower concentration improve the buyer multiple.</p>
                  </article>
                  <article>
                    <span>Risk to name</span>
                    <p>The model should be rebuilt each month from actual QBO/CRM data, not treated as a static projection.</p>
                  </article>
                </div>
              </Panel>
            )}

            {visibleForecastSections.includes('multiple-sensitivity') && (
              <Panel title="Multiple Sensitivity" subtitle="Normalized EBITDA across buyer multiple cases" icon={Target}>
                <div className="multiple-grid">
                  {buildSensitivityMultiples(model.currentMultiple, model.targetMultiple).map((multiple) => (
                    <article key={multiple} className={Math.abs(model.currentMultiple - multiple) < 0.05 ? 'current' : Math.abs(model.targetMultiple - multiple) < 0.05 ? 'target' : ''}>
                      <span>{multiple}x</span>
                      <strong>{money(calculateEnterpriseValue(financials.normalizedEbitda, multiple))}</strong>
                    </article>
                  ))}
                </div>
              </Panel>
            )}
          </div>
        )}

        {activeView === 'reports' && (
          <div className="page-stack">
            {portalMode === 'advisor' && (
              <Panel title="QBO Monthly Upload Guide" subtitle="Exact reports needed each month" icon={FileSpreadsheet}>
                <QboGuide />
              </Panel>
            )}
            {portalMode === 'advisor' && (
              <Panel
                title="Advisor Report"
                subtitle="Downloadable monthly prep packet"
                icon={MessageSquareText}
                action={
                  <button
                    type="button"
                    className="download-action"
                    onClick={() => downloadAdvisorPdf(client, model, valuationIndustryBenchmark)}
                  >
                    <Download size={16} />
                    PDF
                  </button>
                }
              >
                <AdvisorTalkingPoints model={model} />
                <GapPlan model={model} />
              </Panel>
            )}
            <Panel
              title="Monthly Client Report"
              subtitle="Owner decision report for client portal or email"
              icon={CalendarCheck}
              action={
                <button type="button" className="download-action" onClick={() => downloadClientPdf(client, model, valuationIndustryBenchmark)}>
                  <Download size={16} />
                  PDF
                </button>
              }
            >
              <MonthlyReport client={client} model={model} industryBenchmark={valuationIndustryBenchmark} />
            </Panel>
            <Panel
              title="How We Estimate Business Value"
              subtitle="Client-shareable explanation of the valuation methodology"
              icon={CircleDollarSign}
              action={
                <button type="button" className="download-action" onClick={() => downloadValuationMethodologyPdf(client, model, valuationIndustryBenchmark)}>
                  <Download size={16} />
                  PDF
                </button>
              }
            >
              <ValuationMethodologyPanel model={model} benchmark={valuationIndustryBenchmark} />
            </Panel>
          </div>
        )}
      </main>
    </div>
  )
}
