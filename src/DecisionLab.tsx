import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, FlaskConical, Lock, RotateCcw, Save, Share2, Target } from 'lucide-react'
import {
  calculateDecisionLabScenario,
  type DecisionLabCategoryScore,
} from './decisionLabModel'
import type {
  DataQuality,
  FinancialInputs,
  IndustryBenchmarkInputs,
  MultipleMethodology,
} from './valuationModel'

export type DecisionLabScenarioRecord = {
  id: string
  name: string
  createdAt: string
  proposedScores: Record<string, number>
  sharedAt?: string
}

type DecisionLabProps = {
  clientId: string
  companyName: string
  portalMode: 'advisor' | 'client'
  scores: Array<{ id: string; label: string; score: number; color: string }>
  financials: FinancialInputs
  benchmark: IndustryBenchmarkInputs
  dataQuality: DataQuality
  savedScenarios: DecisionLabScenarioRecord[]
  sharedScenarioId?: string
  onSave: (scenario: DecisionLabScenarioRecord) => void
  onShare: (scenario: DecisionLabScenarioRecord) => void
}

const evidenceRequirements: Record<string, string[]> = {
  planning: ['A written strategic plan with measurable priorities', 'A documented growth and ownership-transition path', 'Monthly evidence that decisions follow the plan'],
  leadership: ['Named leaders can make decisions without the owner', 'A current responsibility and succession map', 'Proof that client delivery continues during owner absence'],
  sales: ['A documented, measurable sales process', 'Pipeline coverage and conversion tracked consistently', 'Revenue generation that does not depend on one rainmaker'],
  marketing: ['A repeatable lead-generation system', 'Documented positioning and ideal-client focus', 'Lead-source and acquisition performance tracked over time'],
  people: ['Key roles are filled with accountable talent', 'Hiring, onboarding, and development are documented', 'Retention and performance do not depend on the owner'],
  operations: ['Core delivery workflows are documented', 'Quality and capacity are measured', 'Work can be delivered consistently without owner intervention'],
  finance: ['Timely, accurate monthly financial reporting', 'Cash, margin, and forecast controls are in use', 'Normalized earnings are supported by documented evidence'],
  legal: ['Current contracts protect customer and company relationships', 'Entity, compliance, and IP records are current', 'Material legal risks are identified and managed'],
}

function money(value: number | null) {
  if (value == null) return 'Not applicable'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function signed(value: number, suffix = '') {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}${suffix}`
}

function adjustment(methodology: MultipleMethodology, label: string) {
  return methodology.adjustments.find((item) => item.label === label)?.amount ?? 0
}

function makeRecord(companyName: string, proposedScores: Record<string, number>): DecisionLabScenarioRecord {
  const now = new Date()
  return {
    id: `decision-lab-${now.getTime()}`,
    name: `${companyName} value-growth scenario`,
    createdAt: now.toISOString(),
    proposedScores,
  }
}

function MethodologyBridge({ current, proposed }: { current: MultipleMethodology; proposed: MultipleMethodology }) {
  const currentValueEngine = adjustment(current, 'Value Engine quality')
  const proposedValueEngine = adjustment(proposed, 'Value Engine quality')
  const currentBoundary = current.adjustments.find((item) => item.label === 'Methodology ceiling' || item.label === 'Methodology floor')?.amount ?? 0
  const proposedBoundary = proposed.adjustments.find((item) => item.label === 'Methodology ceiling' || item.label === 'Methodology floor')?.amount ?? 0
  const currentOther = current.adjustments
    .filter((item) => !['Industry benchmark', 'Value Engine quality', 'Methodology ceiling', 'Methodology floor'].includes(item.label))
    .reduce((sum, item) => sum + item.amount, 0)
  const proposedOther = proposed.adjustments
    .filter((item) => !['Industry benchmark', 'Value Engine quality', 'Methodology ceiling', 'Methodology floor'].includes(item.label))
    .reduce((sum, item) => sum + item.amount, 0)
  const rows = [
    { label: 'Industry EV/EBITDA benchmark', current: current.base, proposed: proposed.base },
    { label: 'Other company-specific adjustments', current: currentOther, proposed: proposedOther },
    { label: 'Value Engine quality adjustment', current: currentValueEngine, proposed: proposedValueEngine, highlight: true },
    ...(currentBoundary !== 0 || proposedBoundary !== 0
      ? [{ label: 'Methodology floor / ceiling reconciliation', current: currentBoundary, proposed: proposedBoundary }]
      : []),
  ]

  return (
    <div className="decision-methodology">
      <div className="decision-methodology-header">
        <span>Valuation methodology bridge</span>
        <span>Current</span>
        <span>Scenario</span>
      </div>
      {rows.map((row) => (
        <div className={row.highlight ? 'highlight' : ''} key={row.label}>
          <strong>{row.label}</strong>
          <span>{row.label.startsWith('Industry') ? `${row.current.toFixed(1)}x` : signed(row.current, 'x')}</span>
          <span>{row.label.startsWith('Industry') ? `${row.proposed.toFixed(1)}x` : signed(row.proposed, 'x')}</span>
        </div>
      ))}
      <div className="decision-methodology-total">
        <strong>Modeled EV/EBITDA multiple</strong>
        <span>{current.adjusted.toFixed(1)}x</span>
        <span>{proposed.adjusted.toFixed(1)}x</span>
      </div>
    </div>
  )
}

export function DecisionLab({
  clientId,
  companyName,
  portalMode,
  scores,
  financials,
  benchmark,
  dataQuality,
  savedScenarios,
  sharedScenarioId,
  onSave,
  onShare,
}: DecisionLabProps) {
  const sharedScenario = savedScenarios.find((item) => item.id === sharedScenarioId)
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('draft')
  const [draftScores, setDraftScores] = useState<Record<string, number>>(() => Object.fromEntries(scores.map((item) => [item.id, item.score])))
  const [notice, setNotice] = useState<string | null>(null)
  const scoreSignature = JSON.stringify(scores.map((item) => [item.id, item.score]))
  const baselineScores = useMemo<Record<string, number>>(
    () => Object.fromEntries(JSON.parse(scoreSignature) as Array<[string, number]>),
    [scoreSignature],
  )

  useEffect(() => {
    setSelectedScenarioId('draft')
    setDraftScores(baselineScores)
    setNotice(null)
  }, [baselineScores, clientId])

  const activeRecord = portalMode === 'client'
    ? sharedScenario
    : savedScenarios.find((item) => item.id === selectedScenarioId)
  const proposedScores = activeRecord?.proposedScores ?? draftScores
  const scenarioScores: DecisionLabCategoryScore[] = scores.map((item) => ({
    id: item.id,
    label: item.label,
    currentScore: item.score,
    proposedScore: proposedScores[item.id] ?? item.score,
  }))
  const scenario = useMemo(() => calculateDecisionLabScenario({
    scores: scenarioScores,
    financials,
    benchmark,
    dataQuality,
  }), [benchmark, dataQuality, financials, scenarioScores])
  const proposedScoreRecord = Object.fromEntries(scenario.scores.map((item) => [item.id, item.proposedScore]))

  const updateDraftScore = (id: string, nextScore: number) => {
    setSelectedScenarioId('draft')
    setDraftScores({ ...proposedScores, [id]: nextScore })
    setNotice(null)
  }

  const reset = () => {
    setSelectedScenarioId('draft')
    setDraftScores(baselineScores)
    setNotice('Scenario reset. Evidence-supported scores and valuation history were unchanged.')
  }

  const save = () => {
    const record = makeRecord(companyName, proposedScoreRecord)
    onSave(record)
    setSelectedScenarioId(record.id)
    setNotice('Scenario saved privately in the advisor portal.')
  }

  const share = () => {
    const existing = savedScenarios.find((item) => item.id === selectedScenarioId)
    const record = { ...(existing ?? makeRecord(companyName, proposedScoreRecord)), sharedAt: new Date().toISOString() }
    if (!existing) onSave(record)
    onShare(record)
    setSelectedScenarioId(record.id)
    setNotice('Scenario shared with the client portal. Actual scores were not changed.')
  }

  if (portalMode === 'client' && !sharedScenario) {
    return (
      <section className="decision-empty">
        <Lock size={24} />
        <div>
          <h2>No scenario has been shared with you yet.</h2>
          <p>Your advisor can model one or two value-growth priorities and publish a scenario here when it is ready for discussion.</p>
        </div>
      </section>
    )
  }

  return (
    <div className="decision-lab">
      <section className="decision-hero">
        <div>
          <span><FlaskConical size={16} /> {portalMode === 'advisor' ? 'Advisor modeling workspace' : 'Advisor-shared value-growth scenario'}</span>
          <h2>{portalMode === 'advisor' ? 'Test what stronger business quality could support.' : 'See how focused improvements could affect enterprise value.'}</h2>
          <p>
            This lab holds normalized EBITDA and every non-Value-Engine input constant. It changes only the eight-category score and the transparent Value Engine quality adjustment inside the industry-anchored methodology.
          </p>
        </div>
        <div className="decision-disclosure">
          <Lock size={18} />
          <p><strong>Decision support, not a formal appraisal.</strong> Hypothetical scores never overwrite the assessment or valuation history.</p>
        </div>
      </section>

      {portalMode === 'advisor' && (
        <section className="decision-toolbar">
          <label>
            <span>Scenario</span>
            <select value={selectedScenarioId} onChange={(event) => {
              const id = event.target.value
              setSelectedScenarioId(id)
              if (id === 'draft') setDraftScores(baselineScores)
              setNotice(null)
            }}>
              <option value="draft">New scenario</option>
              {savedScenarios.map((item) => <option key={item.id} value={item.id}>{item.name}{item.sharedAt ? ' • shared' : ''}</option>)}
            </select>
          </label>
          <div>
            <button type="button" className="decision-button secondary" onClick={reset}><RotateCcw size={16} /> Reset to current</button>
            <button type="button" className="decision-button secondary" onClick={save} disabled={!scenario.changedCategories.length}><Save size={16} /> Save scenario</button>
            <button type="button" className="decision-button" onClick={share} disabled={!scenario.changedCategories.length}><Share2 size={16} /> Share with client</button>
          </div>
        </section>
      )}

      {notice && <div className="decision-notice"><CheckCircle2 size={17} /> {notice}</div>}

      <section className="decision-scorecards">
        <article>
          <span>Value Engine score</span>
          <div><strong>{scenario.current.valueEngineScore.toFixed(1)}</strong><small>current</small></div>
          <div className="decision-arrow">→</div>
          <div><strong>{scenario.proposed.valueEngineScore.toFixed(1)}</strong><small>scenario</small></div>
          <b>{signed(scenario.scoreDelta, ' pts')}</b>
        </article>
        <article>
          <span>Modeled multiple</span>
          <div><strong>{scenario.current.methodology.adjusted.toFixed(1)}x</strong><small>current</small></div>
          <div className="decision-arrow">→</div>
          <div><strong>{scenario.proposed.methodology.adjusted.toFixed(1)}x</strong><small>scenario</small></div>
          <b>{signed(scenario.multipleDelta, 'x')}</b>
        </article>
        <article className="enterprise-value-card">
          <span>Projected enterprise value</span>
          <div><strong>{money(scenario.current.enterpriseValue)}</strong><small>current</small></div>
          <div className="decision-arrow">→</div>
          <div><strong>{money(scenario.proposed.enterpriseValue)}</strong><small>scenario</small></div>
          <b>{scenario.enterpriseValueDelta == null ? 'Not applicable' : `${scenario.enterpriseValueDelta >= 0 ? '+' : '-'}${money(Math.abs(scenario.enterpriseValueDelta))}`}</b>
        </article>
      </section>

      {scenario.ceilingLimited && (
        <section className="decision-warning"><Target size={18} /><p>The proposed scores reach the methodology ceiling. Additional score improvement does not increase this modeled multiple unless other facts or the market benchmark change.</p></section>
      )}

      <div className="decision-layout">
        <section className="decision-controls">
          <header>
            <div><span>Eight-category scenario</span><h3>{portalMode === 'advisor' ? 'Adjust one or two priorities' : 'Advisor-selected priorities'}</h3></div>
            <small>{scenario.changedCategories.length} {scenario.changedCategories.length === 1 ? 'category' : 'categories'} changed</small>
          </header>
          <div className="decision-category-list">
            {scenario.scores.map((item) => {
              const source = scores.find((score) => score.id === item.id)
              const changed = item.proposedScore !== item.currentScore
              return (
                <article className={changed ? 'changed' : ''} key={item.id}>
                  <div className="decision-category-heading">
                    <span className="decision-category-dot" style={{ background: source?.color }} />
                    <div><strong>{item.label}</strong><small>Current {item.currentScore.toFixed(1)}</small></div>
                    <b>{item.proposedScore.toFixed(1)}</b>
                  </div>
                  {portalMode === 'advisor' ? (
                    <div className="decision-range-row">
                      <button type="button" aria-label={`Decrease ${item.label}`} onClick={() => updateDraftScore(item.id, Math.max(0, item.proposedScore - 0.5))}>−</button>
                      <input aria-label={`${item.label} scenario score`} type="range" min="0" max="10" step="0.1" value={item.proposedScore} onChange={(event) => updateDraftScore(item.id, Number(event.target.value))} />
                      <button type="button" aria-label={`Increase ${item.label}`} onClick={() => updateDraftScore(item.id, Math.min(10, item.proposedScore + 0.5))}>+</button>
                    </div>
                  ) : (
                    <div className="decision-readonly-bar"><span style={{ width: `${item.proposedScore * 10}%`, background: source?.color }} /></div>
                  )}
                </article>
              )
            })}
          </div>
        </section>

        <section className="decision-evidence">
          <header><span>What must become true</span><h3>Evidence before the score becomes official</h3></header>
          {scenario.changedCategories.length ? scenario.changedCategories.map((item) => (
            <article key={item.id}>
              <div><strong>{item.label}</strong><span>{item.currentScore.toFixed(1)} → {item.proposedScore.toFixed(1)}</span></div>
              <ul>{(evidenceRequirements[item.id] ?? []).map((requirement) => <li key={requirement}>{requirement}</li>)}</ul>
            </article>
          )) : (
            <p className="decision-placeholder">Move one or two category scores to reveal the proof points needed to support the improvement.</p>
          )}
        </section>
      </div>

      <section className="decision-analysis-grid">
        <article>
          <span>Direct Value Engine impact</span>
          <h3>Included in the calculation</h3>
          <p>The eight category scores are averaged equally. The proposed average changes the Value Engine quality adjustment, which can change the modeled EV/EBITDA multiple.</p>
        </article>
        <article>
          <span>Potential operating impact</span>
          <h3>Not automatically assumed</h3>
          <p>Stronger leadership, sales, or operations may later improve margins, recurring revenue, concentration, or owner dependency. Those effects require separate evidence and explicit assumptions to avoid double counting.</p>
        </article>
      </section>

      <MethodologyBridge current={scenario.current.methodology} proposed={scenario.proposed.methodology} />

      <section className="decision-footer-note">
        <p><strong>Normalized EBITDA held constant:</strong> {money(financials.normalizedEbitda)}. Estimated owner proceeds are not modeled in this lab. Enterprise value must be bridged separately for debt, surplus cash, transaction costs, taxes, working-capital adjustments, and other closing items.</p>
      </section>
    </div>
  )
}
