import {
  Activity,
  Banknote,
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  FileSpreadsheet,
  Gavel,
  HeartPulse,
  LineChart,
  Megaphone,
  Scissors,
  Users,
} from 'lucide-react'
import type { ComponentType } from 'react'

export type IndustryId =
  | 'professional-services'
  | 'law-firm'
  | 'salon-spa'
  | 'medical-practice'
  | 'agency'
  | 'contractor'
  | 'saas'

export type KpiSource = 'qbo' | 'crm' | 'payroll' | 'manual' | 'calculated'

export type KpiDefinition = {
  id: string
  name: string
  source: KpiSource
  unit: '$' | '%' | 'days' | 'x' | 'count' | 'score'
  formula: string
  benchmark: string
  valueDriver: string
  sourceReports: string[]
  automated: 'full' | 'partial' | 'manual'
  weight: number
}

export type IndustryProfile = {
  id: IndustryId
  name: string
  icon: ComponentType<{ size?: number; strokeWidth?: number }>
  thesis: string
  primarySources: string[]
  kpiIds: string[]
}

export type AssessmentQuestion = {
  id: string
  text: string
  guidance: string
  dimension: string
  subarea: string
  weight: number
}

export type AssessmentDimension = {
  id: string
  name: string
  icon: ComponentType<{ size?: number; strokeWidth?: number }>
  subareas: string[]
  questions: AssessmentQuestion[]
}

export const universalKpis: KpiDefinition[] = [
  {
    id: 'revenue',
    name: 'Revenue',
    source: 'qbo',
    unit: '$',
    formula: 'Total income from P&L',
    benchmark: 'Growth trend and quality of revenue',
    valueDriver: 'Scale',
    sourceReports: ['Profit and Loss'],
    automated: 'full',
    weight: 8,
  },
  {
    id: 'gross-margin',
    name: 'Gross margin',
    source: 'calculated',
    unit: '%',
    formula: '(Revenue - COGS) / revenue',
    benchmark: 'Industry-specific',
    valueDriver: 'Pricing power',
    sourceReports: ['Profit and Loss'],
    automated: 'full',
    weight: 8,
  },
  {
    id: 'normalized-ebitda',
    name: 'Normalized EBITDA',
    source: 'qbo',
    unit: '$',
    formula: 'Net income plus interest, taxes, D&A, and owner adjustments',
    benchmark: 'Positive and expanding',
    valueDriver: 'Earnings power',
    sourceReports: ['Profit and Loss', 'Add-back schedule'],
    automated: 'partial',
    weight: 10,
  },
  {
    id: 'ebitda-margin',
    name: 'EBITDA margin',
    source: 'calculated',
    unit: '%',
    formula: 'Normalized EBITDA / revenue',
    benchmark: '15% to 35% depending on industry',
    valueDriver: 'Profit quality',
    sourceReports: ['Profit and Loss'],
    automated: 'partial',
    weight: 10,
  },
  {
    id: 'revenue-growth',
    name: 'Revenue growth',
    source: 'calculated',
    unit: '%',
    formula: '(Current period revenue - prior period revenue) / prior period revenue',
    benchmark: 'Sustainable 10%+ growth',
    valueDriver: 'Growth',
    sourceReports: ['Profit and Loss by month', 'Prior-year Profit and Loss'],
    automated: 'full',
    weight: 7,
  },
  {
    id: 'cash-runway',
    name: 'Cash runway',
    source: 'calculated',
    unit: 'days',
    formula: 'Cash / average monthly operating expense * 30',
    benchmark: '90+ days',
    valueDriver: 'Resilience',
    sourceReports: ['Balance Sheet', 'Profit and Loss'],
    automated: 'full',
    weight: 6,
  },
  {
    id: 'dso',
    name: 'Days sales outstanding',
    source: 'calculated',
    unit: 'days',
    formula: 'Accounts receivable / monthly revenue * 30',
    benchmark: 'Lower is better',
    valueDriver: 'Working capital',
    sourceReports: ['A/R Aging', 'Balance Sheet', 'Profit and Loss'],
    automated: 'full',
    weight: 6,
  },
  {
    id: 'labor-ratio',
    name: 'Labor ratio',
    source: 'qbo',
    unit: '%',
    formula: 'Payroll and contractor labor / revenue',
    benchmark: 'Industry-specific',
    valueDriver: 'Operating leverage',
    sourceReports: ['Profit and Loss', 'Payroll summary'],
    automated: 'partial',
    weight: 7,
  },
  {
    id: 'recurring-revenue',
    name: 'Recurring revenue',
    source: 'crm',
    unit: '%',
    formula: 'Recurring or contracted revenue / total revenue',
    benchmark: 'Higher is better',
    valueDriver: 'Revenue durability',
    sourceReports: ['CRM', 'Billing export', 'Contract list'],
    automated: 'partial',
    weight: 9,
  },
  {
    id: 'customer-concentration',
    name: 'Customer concentration',
    source: 'manual',
    unit: '%',
    formula: 'Top customer or top five customers / revenue',
    benchmark: 'Top customer below 15%',
    valueDriver: 'Risk reduction',
    sourceReports: ['Sales by customer', 'CRM', 'Manual estimate'],
    automated: 'partial',
    weight: 9,
  },
  {
    id: 'owner-dependency',
    name: 'Owner dependency',
    source: 'manual',
    unit: '%',
    formula: 'Revenue or operations that would be impaired if owner stepped away',
    benchmark: 'Below 30%',
    valueDriver: 'Transferability',
    sourceReports: ['Advisor interview', 'Sales by owner', 'Org chart'],
    automated: 'manual',
    weight: 10,
  },
]

export const industryKpis: Record<IndustryId, KpiDefinition[]> = {
  'professional-services': [
    {
      id: 'realization-rate',
      name: 'Realization rate',
      source: 'crm',
      unit: '%',
      formula: 'Collected revenue / billable value',
      benchmark: '90%+',
      valueDriver: 'Pricing discipline',
      sourceReports: ['Time and billing export'],
      automated: 'partial',
      weight: 7,
    },
    {
      id: 'revenue-per-fte',
      name: 'Revenue per FTE',
      source: 'calculated',
      unit: '$',
      formula: 'Revenue / full-time equivalent headcount',
      benchmark: 'Industry-specific trend',
      valueDriver: 'Productivity',
      sourceReports: ['Profit and Loss', 'Payroll or headcount'],
      automated: 'partial',
      weight: 7,
    },
  ],
  'law-firm': [
    {
      id: 'case-acquisition-cost',
      name: 'Case acquisition cost',
      source: 'crm',
      unit: '$',
      formula: 'Marketing spend / new matters opened',
      benchmark: 'Trend by practice area',
      valueDriver: 'Marketing efficiency',
      sourceReports: ['P&L', 'Matter intake export'],
      automated: 'partial',
      weight: 8,
    },
    {
      id: 'case-cycle-time',
      name: 'Case cycle time',
      source: 'crm',
      unit: 'days',
      formula: 'Average days from open to close',
      benchmark: 'Shorter with stable outcome quality',
      valueDriver: 'Cash conversion',
      sourceReports: ['Case management system'],
      automated: 'partial',
      weight: 7,
    },
    {
      id: 'settlement-pipeline',
      name: 'Settlement pipeline',
      source: 'crm',
      unit: '$',
      formula: 'Expected fees from active matters',
      benchmark: 'Growing and diversified',
      valueDriver: 'Forward visibility',
      sourceReports: ['Case management system'],
      automated: 'partial',
      weight: 8,
    },
  ],
  'salon-spa': [
    {
      id: 'utilization',
      name: 'Utilization',
      source: 'crm',
      unit: '%',
      formula: 'Booked service hours / available service hours',
      benchmark: '65% to 80%',
      valueDriver: 'Capacity use',
      sourceReports: ['Boulevard staff performance'],
      automated: 'partial',
      weight: 8,
    },
    {
      id: 'rebooking-rate',
      name: 'Rebooking rate',
      source: 'crm',
      unit: '%',
      formula: 'Appointments rebooked before checkout / total appointments',
      benchmark: '65%+',
      valueDriver: 'Revenue durability',
      sourceReports: ['Boulevard staff performance'],
      automated: 'partial',
      weight: 8,
    },
    {
      id: 'average-ticket',
      name: 'Average ticket',
      source: 'crm',
      unit: '$',
      formula: 'Service and retail sales / appointment count',
      benchmark: 'Rising without retention drop',
      valueDriver: 'Pricing and mix',
      sourceReports: ['Boulevard sales summary'],
      automated: 'partial',
      weight: 7,
    },
  ],
  'medical-practice': [
    {
      id: 'provider-utilization',
      name: 'Provider utilization',
      source: 'crm',
      unit: '%',
      formula: 'Booked provider hours / available provider hours',
      benchmark: '75%+',
      valueDriver: 'Capacity use',
      sourceReports: ['Practice management system'],
      automated: 'partial',
      weight: 8,
    },
    {
      id: 'patient-retention',
      name: 'Patient retention',
      source: 'crm',
      unit: '%',
      formula: 'Returning active patients / total active patients',
      benchmark: 'Stable or rising',
      valueDriver: 'Revenue durability',
      sourceReports: ['Practice management system'],
      automated: 'partial',
      weight: 8,
    },
  ],
  agency: [
    {
      id: 'net-revenue-retention',
      name: 'Net revenue retention',
      source: 'crm',
      unit: '%',
      formula: 'Current revenue from prior cohort / prior cohort revenue',
      benchmark: '100%+',
      valueDriver: 'Account expansion',
      sourceReports: ['CRM', 'Billing export'],
      automated: 'partial',
      weight: 9,
    },
    {
      id: 'pipeline-coverage',
      name: 'Pipeline coverage',
      source: 'crm',
      unit: 'x',
      formula: 'Qualified pipeline / next-quarter revenue target',
      benchmark: '3x+',
      valueDriver: 'Forward visibility',
      sourceReports: ['CRM opportunity export'],
      automated: 'partial',
      weight: 8,
    },
  ],
  contractor: [
    {
      id: 'backlog-coverage',
      name: 'Backlog coverage',
      source: 'crm',
      unit: 'x',
      formula: 'Committed backlog / monthly revenue run rate',
      benchmark: '3 to 6 months',
      valueDriver: 'Revenue visibility',
      sourceReports: ['Job management system'],
      automated: 'partial',
      weight: 9,
    },
    {
      id: 'job-margin-variance',
      name: 'Job margin variance',
      source: 'crm',
      unit: '%',
      formula: 'Actual gross margin - estimated gross margin',
      benchmark: 'Low variance',
      valueDriver: 'Execution quality',
      sourceReports: ['Job costing export'],
      automated: 'partial',
      weight: 8,
    },
  ],
  saas: [
    {
      id: 'net-revenue-retention-saas',
      name: 'Net revenue retention',
      source: 'crm',
      unit: '%',
      formula: 'Expansion adjusted retained revenue / starting revenue',
      benchmark: '100%+',
      valueDriver: 'Durability',
      sourceReports: ['Billing platform', 'CRM'],
      automated: 'partial',
      weight: 10,
    },
    {
      id: 'gross-logo-retention',
      name: 'Gross logo retention',
      source: 'crm',
      unit: '%',
      formula: 'Retained customer count / starting customer count',
      benchmark: '85%+',
      valueDriver: 'Churn control',
      sourceReports: ['Billing platform', 'CRM'],
      automated: 'partial',
      weight: 9,
    },
  ],
}

export const industries: IndustryProfile[] = [
  {
    id: 'professional-services',
    name: 'Professional Services',
    icon: BriefcaseBusiness,
    thesis: 'Value comes from margin quality, client durability, team leverage, and lower owner dependency.',
    primarySources: ['QBO', 'CRM', 'billing system', 'advisor interview'],
    kpiIds: ['realization-rate', 'revenue-per-fte'],
  },
  {
    id: 'law-firm',
    name: 'Law Firm',
    icon: Gavel,
    thesis: 'Value depends on matter economics, intake quality, cash conversion, referral sources, and attorney leverage.',
    primarySources: ['QBO', 'case management', 'CRM', 'marketing spend'],
    kpiIds: ['case-acquisition-cost', 'case-cycle-time', 'settlement-pipeline'],
  },
  {
    id: 'salon-spa',
    name: 'Salon and Spa',
    icon: Scissors,
    thesis: 'Value grows through chair utilization, rebooking, ticket lift, staff retention, and reducing owner involvement.',
    primarySources: ['QBO', 'Boulevard', 'payroll', 'advisor interview'],
    kpiIds: ['utilization', 'rebooking-rate', 'average-ticket'],
  },
  {
    id: 'medical-practice',
    name: 'Medical Practice',
    icon: HeartPulse,
    thesis: 'Value follows provider productivity, patient retention, payer mix, capacity, compliance, and repeatable operations.',
    primarySources: ['QBO', 'practice management', 'payroll'],
    kpiIds: ['provider-utilization', 'patient-retention'],
  },
  {
    id: 'agency',
    name: 'Agency',
    icon: Megaphone,
    thesis: 'Value depends on recurring retainers, account expansion, delivery margin, pipeline coverage, and team utilization.',
    primarySources: ['QBO', 'CRM', 'project management', 'billing'],
    kpiIds: ['net-revenue-retention', 'pipeline-coverage'],
  },
  {
    id: 'contractor',
    name: 'Contractor',
    icon: Building2,
    thesis: 'Value comes from backlog, job margin control, project execution, working capital, and management depth.',
    primarySources: ['QBO', 'job costing', 'CRM', 'payroll'],
    kpiIds: ['backlog-coverage', 'job-margin-variance'],
  },
  {
    id: 'saas',
    name: 'SaaS',
    icon: Activity,
    thesis: 'Value is driven by retention, recurring revenue quality, efficient acquisition, margin structure, and growth rate.',
    primarySources: ['QBO', 'Stripe', 'CRM', 'product analytics'],
    kpiIds: ['net-revenue-retention-saas', 'gross-logo-retention'],
  },
]

export { assessmentDimensions } from './assessmentBank'

export const sourceIcon = {
  qbo: FileSpreadsheet,
  crm: LineChart,
  payroll: Users,
  manual: ClipboardCheck,
  calculated: Banknote,
} satisfies Record<KpiSource, ComponentType<{ size?: number; strokeWidth?: number }>>

export const scenarioLevers = [
  { id: 'margin', name: 'Margin expansion', driver: 'EBITDA margin lift', defaultImpact: 4 },
  { id: 'growth', name: 'Revenue growth', driver: 'Sustainable annual growth', defaultImpact: 10 },
  { id: 'recurring', name: 'Recurring revenue', driver: 'Durability and visibility', defaultImpact: 12 },
  { id: 'owner', name: 'Owner dependency reduction', driver: 'Transferability', defaultImpact: 18 },
  { id: 'concentration', name: 'Customer concentration cleanup', driver: 'Risk discount reduction', defaultImpact: 10 },
  { id: 'working-capital', name: 'Working capital improvement', driver: 'Cash conversion', defaultImpact: 6 },
]
