import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const appSource = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8')

describe('advisor view preferences', () => {
  it('keeps sidebar navigation separate from compact on/off panel switches', () => {
    expect(appSource).toContain('type KpiViewSection')
    expect(appSource).toContain('type ForecastViewSection')
    expect(appSource).toContain('const defaultKpiViewSections')
    expect(appSource).toContain('const defaultForecastViewSections')

    for (const navLabel of ['Dashboard', 'Value Engine', 'KPIs', 'Forecast', 'Reports']) {
      expect(appSource).toContain(`label: '${navLabel}'`)
    }

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

    expect(appSource).toContain('Panel visibility')
    expect(appSource).toContain('panel-toggle-strip')
    expect(appSource).toContain('toggle-switch')
    expect(appSource).not.toContain('view-toggle-grid')
  })
})
