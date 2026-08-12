import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const appSource = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8')

describe('advisor view preferences', () => {
  it('adds KPI and forecast visibility toggles with safe default-on sections', () => {
    expect(appSource).toContain('type KpiViewSection')
    expect(appSource).toContain('type ForecastViewSection')
    expect(appSource).toContain('const defaultKpiViewSections')
    expect(appSource).toContain('const defaultForecastViewSections')

    for (const section of ['Data confidence', 'KPI table', 'Industry benchmarking']) {
      expect(appSource).toContain(section)
    }

    for (const section of [
      'Forward health',
      'Risk radar',
      'Valuation range',
      'Source map',
      'Rolling forecast',
      'Forecast vs industry',
      'Assumptions',
      'Multiple sensitivity',
    ]) {
      expect(appSource).toContain(section)
    }

    expect(appSource).toContain('Advisor view controls')
    expect(appSource).toContain('Show all')
    expect(appSource).toContain('Focus mode')
  })
})
