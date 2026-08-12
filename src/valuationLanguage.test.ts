import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const appSource = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8')

describe('client-facing enterprise-value language', () => {
  it('labels forecast-card currency as projected enterprise value', () => {
    expect(appSource).toContain('<small>Projected enterprise value</small>')
  })

  it('labels monthly-report forecast currency as enterprise value', () => {
    expect(appSource).toContain('<span>Next-quarter enterprise value</span>')
    expect(appSource).toContain('<span>Next-year enterprise value</span>')
  })

  it('carries the owner-proceeds bridge beside live report forecasts', () => {
    expect(appSource).toContain('Enterprise value is not owner proceeds. A transaction normally subtracts debt, adds excess cash, and then accounts for taxes, fees, working-capital targets, and other closing adjustments.')
  })

  it('does not describe EV/EBITDA output as generic value', () => {
    expect(appSource).not.toContain('Value is tracking at')
  })
})
