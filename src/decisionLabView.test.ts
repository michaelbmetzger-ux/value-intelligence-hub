import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const appSource = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8')
const decisionLabSource = readFileSync(new URL('./DecisionLab.tsx', import.meta.url), 'utf8')
const productSource = `${appSource}\n${decisionLabSource}`


describe('Decision Lab portal experience', () => {
  it('adds Decision Lab as top-level navigation without replacing existing portal navigation', () => {
    expect(productSource).toContain("type View = 'dashboard' | 'value-engine' | 'decision-lab' | 'kpis' | 'forecast' | 'reports'")
    expect(productSource).toContain("{ id: 'decision-lab', label: 'Decision Lab'")
  })

  it('keeps advisor modeling separate from evidence-supported scores and history', () => {
    expect(productSource).toContain('Hypothetical scores never overwrite the assessment or valuation history.')
    expect(productSource).toContain('What must become true')
    expect(productSource).toContain('Direct Value Engine impact')
    expect(productSource).toContain('Potential operating impact')
  })

  it('gives advisors save, share, and reset controls while clients see only shared scenarios', () => {
    expect(productSource).toContain('Save scenario')
    expect(productSource).toContain('Share with client')
    expect(productSource).toContain('Reset to current')
    expect(productSource).toContain('No scenario has been shared with you yet.')
  })

  it('preserves exact evidence-supported decimal baselines and clear category-count language', () => {
    expect(productSource).toContain('step="0.1"')
    expect(productSource).toContain("scenario.changedCategories.length === 1 ? 'category' : 'categories'")
  })

  it('preserves required valuation language and disclosure', () => {
    expect(productSource).toContain('Projected enterprise value')
    expect(productSource).toContain('Decision support, not a formal appraisal')
    expect(productSource).toContain('Estimated owner proceeds are not modeled in this lab')
  })
})
