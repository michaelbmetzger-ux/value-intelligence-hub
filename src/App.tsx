import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Database,
  FileUp,
  Gauge,
  Layers3,
  LineChartIcon,
  ListChecks,
  Plus,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import './App.css'
import { assessmentDimensions, industries, scenarioLevers, sourceIcon, type IndustryId } from './data'
import {
  buildForecast,
  buildKpiValues,
  calculateDimensionScores,
  calculateOverallScore,
  formatValue,
  getKpisForIndustry,
  parseUploadedReport,
  scoreLabel,
  valuationMultipleFromScore,
  type AssessmentScores,
  type ForecastInputs,
  type ImportReview,
} from './engine'

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const demoReport = `Profit and Loss
Total Income,3500000
Cost of Goods Sold,1420000
Gross Profit,2080000
Payroll Expenses,1225000
Net Income,620000
Total Expenses,2880000`

function App() {
  const [industryId, setIndustryId] = useState<IndustryId>('professional-services')
  const [activeView, setActiveView] = useState<'overview' | 'import' | 'assessment' | 'forecast'>('overview')
  const [assessmentScores, setAssessmentScores] = useState<AssessmentScores>(() => seedAssessment())
  const [review, setReview] = useState<ImportReview>(() =>
    parseUploadedReport('sample-profit-loss.csv', demoReport, getKpisForIndustry('professional-services')),
  )
  const [forecastInputs, setForecastInputs] = useState<ForecastInputs>({
    revenue: 3500000,
    ebitdaMargin: 18,
    currentMultiple: 3.8,
    years: 3,
    annualGrowth: 12,
    marginExpansion: 5,
    multipleExpansion: 1.2,
  })

  const industry = industries.find((item) => item.id === industryId) ?? industries[0]
  const kpis = useMemo(() => getKpisForIndustry(industryId), [industryId])
  const kpiValues = useMemo(() => buildKpiValues(kpis, review), [kpis, review])
  const dimensionScores = useMemo(() => calculateDimensionScores(assessmentScores), [assessmentScores])
  const overallScore = useMemo(() => calculateOverallScore(assessmentScores), [assessmentScores])
  const forecast = useMemo(() => buildForecast(forecastInputs), [forecastInputs])
  const currentValue = forecast[0]?.value ?? 0
  const exitValue = forecast[forecast.length - 1]?.value ?? 0
  const missingCount = kpiValues.filter((value) => value.confidence === 'missing').length
  const importedCount = kpiValues.filter((value) => value.source === 'imported' || value.source === 'calculated').length

  function handleIndustryChange(nextIndustry: IndustryId) {
    setIndustryId(nextIndustry)
    const nextKpis = getKpisForIndustry(nextIndustry)
    setReview(parseUploadedReport('sample-profit-loss.csv', demoReport, nextKpis))
  }

  async function handleFile(file: File) {
    const text = await file.text()
    setReview(parseUploadedReport(file.name, text, kpis))
    setActiveView('import')
  }

  function updateScore(questionId: string, value: number) {
    setAssessmentScores((current) => ({ ...current, [questionId]: value }))
    const multiple = valuationMultipleFromScore(calculateOverallScore({ ...assessmentScores, [questionId]: value }))
    setForecastInputs((current) => ({ ...current, currentMultiple: Number(multiple.toFixed(1)) }))
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">Lifepoint</div>
          <div className="brand-sub">Value Intelligence Hub</div>
        </div>

        <label className="field-label" htmlFor="industry">
          Industry profile
        </label>
        <select
          id="industry"
          className="select"
          value={industryId}
          onChange={(event) => handleIndustryChange(event.target.value as IndustryId)}
        >
          {industries.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <nav className="nav">
          <NavButton active={activeView === 'overview'} icon={Gauge} label="Command Center" onClick={() => setActiveView('overview')} />
          <NavButton active={activeView === 'import'} icon={FileUp} label="Import Engine" onClick={() => setActiveView('import')} />
          <NavButton active={activeView === 'assessment'} icon={ListChecks} label="Value Engine" onClick={() => setActiveView('assessment')} />
          <NavButton active={activeView === 'forecast'} icon={LineChartIcon} label="Forecast Lab" onClick={() => setActiveView('forecast')} />
        </nav>

        <div className="sidebar-panel">
          <div className="panel-title">Build status</div>
          <StatusRow label="KPI definitions" value={kpis.length.toString()} />
          <StatusRow label="Matched metrics" value={importedCount.toString()} />
          <StatusRow label="Open gaps" value={missingCount.toString()} tone={missingCount ? 'warn' : 'good'} />
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="eyebrow">Client value growth operating system</div>
            <h1>{industry.name}</h1>
            <p>{industry.thesis}</p>
          </div>
          <label className="upload-button">
            <FileUp size={17} />
            Upload report
            <input
              type="file"
              accept=".csv,.txt"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void handleFile(file)
              }}
            />
          </label>
        </header>

        {activeView === 'overview' && (
          <Overview
            overallScore={overallScore}
            currentValue={currentValue}
            exitValue={exitValue}
            dimensionScores={dimensionScores}
            kpis={kpis}
            kpiValues={kpiValues}
            review={review}
            setActiveView={setActiveView}
          />
        )}

        {activeView === 'import' && (
          <ImportEngine
            review={review}
            kpis={kpis}
            kpiValues={kpiValues}
            industryName={industry.name}
            handleFile={handleFile}
          />
        )}

        {activeView === 'assessment' && (
          <AssessmentEngine scores={assessmentScores} updateScore={updateScore} dimensionScores={dimensionScores} overallScore={overallScore} />
        )}

        {activeView === 'forecast' && (
          <ForecastLab
            inputs={forecastInputs}
            setInputs={setForecastInputs}
            forecast={forecast}
            currentValue={currentValue}
            exitValue={exitValue}
            overallScore={overallScore}
          />
        )}
      </main>
    </div>
  )
}

function Overview({
  overallScore,
  currentValue,
  exitValue,
  dimensionScores,
  kpis,
  kpiValues,
  review,
  setActiveView,
}: {
  overallScore: number
  currentValue: number
  exitValue: number
  dimensionScores: ReturnType<typeof calculateDimensionScores>
  kpis: ReturnType<typeof getKpisForIndustry>
  kpiValues: ReturnType<typeof buildKpiValues>
  review: ImportReview
  setActiveView: (view: 'overview' | 'import' | 'assessment' | 'forecast') => void
}) {
  const topGaps = kpiValues
    .filter((value) => value.confidence === 'missing')
    .slice(0, 4)
    .map((value) => kpis.find((kpi) => kpi.id === value.id))
    .filter(Boolean)

  return (
    <div className="stack">
      <section className="metric-grid">
        <Metric title="Value Engine Score" value={`${overallScore.toFixed(1)}/10`} detail={scoreLabel(overallScore)} tone="blue" />
        <Metric title="Current value estimate" value={money.format(currentValue)} detail="EBITDA times quality-adjusted multiple" tone="green" />
        <Metric title="3-year value path" value={money.format(exitValue)} detail={`${money.format(exitValue - currentValue)} modeled lift`} tone="amber" />
        <Metric title="Import quality" value={`${review.findings.filter((finding) => finding.matchedKpiId).length}/${kpis.length}`} detail="Matched KPI inputs" tone="violet" />
      </section>

      <section className="two-col">
        <div className="card large">
          <CardHeader icon={Layers3} title="Value driver map" action="Full assessment structure" />
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dimensionScores}>
                <CartesianGrid stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 10]} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <CardHeader icon={ShieldAlert} title="Open data gaps" action="Next imports" />
          <div className="gap-list">
            {topGaps.map((kpi) => (
              <div className="gap-item" key={kpi!.id}>
                <div>
                  <strong>{kpi!.name}</strong>
                  <span>{kpi!.sourceReports.join(', ')}</span>
                </div>
                <ChevronRight size={16} />
              </div>
            ))}
          </div>
          <button className="secondary-action" type="button" onClick={() => setActiveView('import')}>
            Review import map
            <ArrowUpRight size={15} />
          </button>
        </div>
      </section>

      <section className="three-col">
        <WorkflowCard
          icon={Database}
          title="1. Import"
          body="Upload QBO, CRM, payroll, or operating reports. The engine maps what it can and shows what source is still needed."
          onClick={() => setActiveView('import')}
        />
        <WorkflowCard
          icon={ListChecks}
          title="2. Diagnose"
          body="Score the Value Engine across planning, leadership, sales, marketing, people, operations, finance, and legal."
          onClick={() => setActiveView('assessment')}
        />
        <WorkflowCard
          icon={LineChartIcon}
          title="3. Forecast"
          body="Connect operating improvements to EBITDA, multiple expansion, risk reduction, and enterprise value."
          onClick={() => setActiveView('forecast')}
        />
      </section>
    </div>
  )
}

function ImportEngine({
  review,
  kpis,
  kpiValues,
  industryName,
  handleFile,
}: {
  review: ImportReview
  kpis: ReturnType<typeof getKpisForIndustry>
  kpiValues: ReturnType<typeof buildKpiValues>
  industryName: string
  handleFile: (file: File) => Promise<void>
}) {
  return (
    <div className="stack">
      <section className="card import-hero">
        <div>
          <CardHeader icon={FileUp} title="Import Engine" action={review.reportType.replace('-', ' ')} />
          <h2>Upload the report. The engine tells you what it found, what it trusted, and what is still missing.</h2>
          <p>
            For {industryName}, QBO covers the financial layer. Operating and leading indicators come from the industry pack sources.
          </p>
        </div>
        <label className="dropzone">
          <Plus size={20} />
          <span>Drop or select CSV/TXT</span>
          <input
            type="file"
            accept=".csv,.txt"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleFile(file)
            }}
          />
        </label>
      </section>

      <section className="two-col wide-left">
        <div className="card">
          <CardHeader icon={Check} title="Matched fields" action={`${review.findings.filter((finding) => finding.matchedKpiId).length} matched`} />
          <div className="table">
            <div className="table-row header">
              <span>Report line</span>
              <span>KPI</span>
              <span>Value</span>
              <span>Confidence</span>
            </div>
            {review.findings.slice(0, 12).map((finding) => {
              const kpi = kpis.find((item) => item.id === finding.matchedKpiId)
              return (
                <div className="table-row" key={`${finding.label}-${finding.value}`}>
                  <span>{finding.label}</span>
                  <span>{kpi?.name ?? 'Unmapped'}</span>
                  <span>{money.format(finding.value)}</span>
                  <span className={`pill ${finding.confidence}`}>{finding.confidence}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <CardHeader icon={ShieldAlert} title="Missing KPI inputs" action={`${review.missing.length} open`} />
          <div className="missing-list">
            {review.missing.slice(0, 10).map((kpi) => {
              const Icon = sourceIcon[kpi.source]
              return (
                <div className="missing-item" key={kpi.id}>
                  <Icon size={16} />
                  <div>
                    <strong>{kpi.name}</strong>
                    <span>{kpi.sourceReports.join(', ')}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="card">
        <CardHeader icon={Gauge} title="KPI registry" action={`${kpis.length} active definitions`} />
        <div className="kpi-grid">
          {kpis.map((kpi) => {
            const value = kpiValues.find((item) => item.id === kpi.id)
            const Icon = sourceIcon[kpi.source]
            return (
              <div className="kpi-card" key={kpi.id}>
                <div className="kpi-top">
                  <Icon size={16} />
                  <span className={`pill ${value?.confidence ?? 'missing'}`}>{value?.confidence ?? 'missing'}</span>
                </div>
                <strong>{kpi.name}</strong>
                <div className="kpi-value">{formatValue(value?.value, kpi.unit)}</div>
                <p>{kpi.formula}</p>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function AssessmentEngine({
  scores,
  updateScore,
  dimensionScores,
  overallScore,
}: {
  scores: AssessmentScores
  updateScore: (questionId: string, value: number) => void
  dimensionScores: ReturnType<typeof calculateDimensionScores>
  overallScore: number
}) {
  const [activeDimensionId, setActiveDimensionId] = useState(assessmentDimensions[0]?.id ?? 'planning')
  const activeDimension = assessmentDimensions.find((dimension) => dimension.id === activeDimensionId) ?? assessmentDimensions[0]
  const activeScore = dimensionScores.find((dimension) => dimension.id === activeDimension.id)
  const totalPrompts = assessmentDimensions.reduce((sum, dimension) => sum + dimension.questions.length, 0)
  const explicitQuestions = assessmentDimensions.reduce(
    (sum, dimension) => sum + dimension.questions.filter((question) => question.text.endsWith('?')).length,
    0,
  )

  return (
    <div className="stack">
      <section className="assessment-header">
        <div>
          <div className="eyebrow">Value Engine Score</div>
          <h2>{overallScore.toFixed(1)}/10</h2>
          <p>
            Full deep-dive bank imported: {totalPrompts} assessment prompts, including {explicitQuestions} explicit questions, organized by the TGH/CVGA dimensions.
          </p>
        </div>
        <div className="dimension-strip">
          {dimensionScores.map((dimension) => (
            <button
              className={`dimension-chip ${dimension.id === activeDimension.id ? 'active' : ''}`}
              key={dimension.id}
              type="button"
              onClick={() => setActiveDimensionId(dimension.id)}
            >
              <span>{dimension.name}</span>
              <strong>{dimension.score.toFixed(1)}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="card" key={activeDimension.id}>
        <CardHeader
          icon={activeDimension.icon}
          title={`${activeDimension.name} (${activeScore?.answered ?? 0}/${activeScore?.total ?? activeDimension.questions.length})`}
          action={activeDimension.subareas.join(' / ')}
        />
        <div className="question-grid">
          {activeDimension.questions.map((question) => (
            <div className="question-card" key={question.id}>
              <div className="question-top">
                <span>{question.subarea}</span>
                <strong>{scores[question.id] ?? 0}/10</strong>
              </div>
              <h3>{question.text}</h3>
              <p>{question.guidance}</p>
              <input
                type="range"
                min={0}
                max={10}
                value={scores[question.id] ?? 0}
                onChange={(event) => updateScore(question.id, Number(event.target.value))}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function ForecastLab({
  inputs,
  setInputs,
  forecast,
  currentValue,
  exitValue,
  overallScore,
}: {
  inputs: ForecastInputs
  setInputs: React.Dispatch<React.SetStateAction<ForecastInputs>>
  forecast: ReturnType<typeof buildForecast>
  currentValue: number
  exitValue: number
  overallScore: number
}) {
  return (
    <div className="stack">
      <section className="metric-grid">
        <Metric title="Today" value={money.format(currentValue)} detail={`${inputs.currentMultiple.toFixed(1)}x EBITDA`} tone="blue" />
        <Metric title="Modeled exit" value={money.format(exitValue)} detail={`${inputs.years}-year projection`} tone="green" />
        <Metric title="Value lift" value={money.format(exitValue - currentValue)} detail="Modeled enterprise value creation" tone="amber" />
        <Metric title="VES quality input" value={`${overallScore.toFixed(1)}/10`} detail="Feeds current multiple logic" tone="violet" />
      </section>

      <section className="two-col wide-left">
        <div className="card large">
          <CardHeader icon={LineChartIcon} title="Forecast curve" action="Revenue, EBITDA, and value" />
          <div className="chart-wrap tall">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecast}>
                <defs>
                  <linearGradient id="valueFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="year" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => `$${Math.round(Number(value) / 1000000)}M`} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => money.format(Number(value ?? 0))} />
                <Area type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} fill="url(#valueFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <CardHeader icon={Sparkles} title="Scenario levers" action="Decision inputs" />
          <Slider label="Annual revenue growth" value={inputs.annualGrowth} suffix="%" min={0} max={35} onChange={(value) => setInputs((current) => ({ ...current, annualGrowth: value }))} />
          <Slider label="EBITDA margin today" value={inputs.ebitdaMargin} suffix="%" min={0} max={45} onChange={(value) => setInputs((current) => ({ ...current, ebitdaMargin: value }))} />
          <Slider label="Margin expansion" value={inputs.marginExpansion} suffix=" pts" min={0} max={15} onChange={(value) => setInputs((current) => ({ ...current, marginExpansion: value }))} />
          <Slider label="Multiple expansion" value={inputs.multipleExpansion} suffix="x" min={0} max={4} step={0.1} onChange={(value) => setInputs((current) => ({ ...current, multipleExpansion: value }))} />
        </div>
      </section>

      <section className="card">
        <CardHeader icon={ListChecks} title="Value growth decisions" action="Prioritized operating moves" />
        <div className="lever-grid">
          {scenarioLevers.map((lever) => (
            <div className="lever-card" key={lever.id}>
              <div className="lever-impact">+{lever.defaultImpact}%</div>
              <strong>{lever.name}</strong>
              <p>{lever.driver}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function Metric({ title, value, detail, tone }: { title: string; value: string; detail: string; tone: 'blue' | 'green' | 'amber' | 'violet' }) {
  return (
    <div className={`metric-card ${tone}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </div>
  )
}

function NavButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: React.ComponentType<{ size?: number }>
  label: string
  onClick: () => void
}) {
  return (
    <button className={`nav-button ${active ? 'active' : ''}`} type="button" onClick={onClick}>
      <Icon size={17} />
      {label}
    </button>
  )
}

function CardHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: React.ComponentType<{ size?: number }>
  title: string
  action: string
}) {
  return (
    <div className="card-header">
      <div>
        <Icon size={17} />
        <span>{title}</span>
      </div>
      <small>{action}</small>
    </div>
  )
}

function WorkflowCard({
  icon: Icon,
  title,
  body,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number }>
  title: string
  body: string
  onClick: () => void
}) {
  return (
    <button className="workflow-card" type="button" onClick={onClick}>
      <Icon size={20} />
      <strong>{title}</strong>
      <span>{body}</span>
    </button>
  )
}

function StatusRow({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'good' | 'warn' }) {
  return (
    <div className="status-row">
      <span>{label}</span>
      <strong className={tone}>{value}</strong>
    </div>
  )
}

function Slider({
  label,
  value,
  suffix,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string
  value: number
  suffix: string
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}) {
  return (
    <label className="slider">
      <span>
        {label}
        <strong>
          {value}
          {suffix}
        </strong>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  )
}

function seedAssessment(): AssessmentScores {
  return Object.fromEntries(
    assessmentDimensions.flatMap((dimension) =>
      dimension.questions.map((question, index) => [question.id, Math.max(3, Math.min(8, 5 + ((index + dimension.id.length) % 4) - 1))]),
    ),
  )
}

export default App
