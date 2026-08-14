import { useState } from 'react'
import { ArrowRight, Check, RotateCcw, Sparkles } from 'lucide-react'
import { calculatePublicDemoScenario, publicDemoImprovements } from './publicDemoModel'

const contactUrl = 'https://lifepointfd.com/get-started-here/'

function money(value: number | null) {
  if (value == null) return 'Not applicable'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function PublicValueDemo() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const { companyName, financials, selectedImprovements, scenario } = calculatePublicDemoScenario(selectedIds)
  const hasScenario = selectedImprovements.length > 0

  const toggleImprovement = (id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id)
      return [...current, id]
    })
  }

  return (
    <section className="vih-public-demo" id="demo">
      <div className="vih-container">
        <div className="vih-section-heading centered wide vih-demo-heading">
          <span className="vih-kicker">TRY A SMALL PIECE OF THE HUB</span>
          <h2>Explore a sample business.</h2>
          <p>Choose any or all three improvements and see how stronger operating evidence could affect a fictional company’s Value Engine score, modeled multiple, and projected enterprise value.</p>
        </div>

        <div className="vih-demo-shell">
          <div className="vih-demo-topbar">
            <div>
              <span className="vih-demo-mark"><Sparkles size={17} /></span>
              <div><small>ILLUSTRATIVE SAMPLE COMPANY</small><strong>{companyName}</strong></div>
            </div>
            <div className="vih-demo-company-facts">
              <span><small>Revenue</small><strong>{money(financials.revenue)}</strong></span>
              <span><small>Normalized EBITDA</small><strong>{money(financials.normalizedEbitda)}</strong></span>
              <span><small>Industry</small><strong>Professional services</strong></span>
            </div>
          </div>

          <div className="vih-demo-grid">
            <div className="vih-demo-choices">
              <header>
                <div><small>STEP 1</small><h3>Select up to three improvements</h3></div>
                <span>{selectedImprovements.length}/3 selected</span>
              </header>
              <p className="vih-demo-instruction">Each card models a substantial, evidence-backed transformation in that category. Select a card to add it to the scenario.</p>
              <div className="vih-demo-choice-list">
                {publicDemoImprovements.map((improvement) => {
                  const selected = selectedIds.includes(improvement.id)
                  return (
                    <button
                      type="button"
                      className={selected ? 'selected' : ''}
                      aria-pressed={selected}
                      key={improvement.id}
                      onClick={() => toggleImprovement(improvement.id)}
                    >
                      <span className="vih-demo-check">{selected ? <Check size={16} /> : '+'}</span>
                      <span><strong>{improvement.title}</strong><small>{improvement.description}</small></span>
                      <em>4.0 → 9.5</em>
                    </button>
                  )
                })}
              </div>
              <button className="vih-demo-reset" type="button" onClick={() => setSelectedIds([])} disabled={!hasScenario}>
                <RotateCcw size={14} /> Reset sample
              </button>
            </div>

            <div className="vih-demo-results" aria-live="polite">
              <header><small>STEP 2</small><h3>See the directional effect</h3></header>
              <div className="vih-demo-result-cards">
                <article>
                  <span>Value Engine score</span>
                  <div><strong>{scenario.current.valueEngineScore.toFixed(1)}</strong><i>→</i><strong>{scenario.proposed.valueEngineScore.toFixed(1)}</strong></div>
                  <small>{hasScenario ? `+${scenario.scoreDelta.toFixed(1)} points` : 'Choose an improvement'}</small>
                </article>
                <article>
                  <span>Modeled multiple</span>
                  <div><strong>{scenario.current.methodology.adjusted.toFixed(1)}x</strong><i>→</i><strong>{scenario.proposed.methodology.adjusted.toFixed(1)}x</strong></div>
                  <small>{hasScenario ? `+${scenario.multipleDelta.toFixed(1)}x` : 'Normalized EBITDA held constant'}</small>
                </article>
                <article className="value">
                  <span>Projected enterprise value</span>
                  <div><strong>{money(scenario.current.enterpriseValue)}</strong><i>→</i><strong>{money(scenario.proposed.enterpriseValue)}</strong></div>
                  <small>{hasScenario && scenario.enterpriseValueDelta != null ? `Illustrative change: +${money(scenario.enterpriseValueDelta)}` : 'Illustrative company value'}</small>
                </article>
              </div>

              {hasScenario ? (
                <div className="vih-demo-evidence">
                  <div className="vih-demo-evidence-list">
                    <small>What must become true</small>
                    {selectedImprovements.map((improvement) => (
                      <article key={improvement.id}>
                        <strong>{improvement.title}</strong>
                        <ul>{improvement.evidence.map((item) => <li key={item}><Check size={13} />{item}</li>)}</ul>
                      </article>
                    ))}
                  </div>
                  <div className="vih-demo-priority">
                    <small>90-day priority</small>
                    <strong>{selectedImprovements[0].priority}</strong>
                  </div>
                </div>
              ) : (
                <div className="vih-demo-placeholder">
                  <Sparkles size={22} />
                  <strong>Choose an improvement to create a scenario.</strong>
                  <p>The financial facts stay fixed. Only the selected Value Engine category scores change.</p>
                </div>
              )}
            </div>
          </div>

          <div className="vih-demo-footer">
            <div>
              <strong>Illustrative sample company.</strong>
              <span>No information is entered or saved. Decision support, not a formal appraisal. Enterprise value is not owner proceeds.</span>
            </div>
            <a className="vih-button" href={contactUrl}>Start a Founder Value Leak Review <ArrowRight size={17} /></a>
          </div>
        </div>
      </div>
    </section>
  )
}
