import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const demoSource = readFileSync(new URL('./PublicValueDemo.tsx', import.meta.url), 'utf8')

describe('public Value Intelligence demo experience', () => {
  it('uses the real scenario model with three sample-company choices', () => {
    expect(demoSource).toContain('calculatePublicDemoScenario')
    expect(demoSource).toContain('publicDemoImprovements.map')
    expect(demoSource).toContain('aria-pressed')
    expect(demoSource).toContain('Select up to two improvements')
  })

  it('shows a meaningful result and the evidence required to support it', () => {
    expect(demoSource).toContain('Projected enterprise value')
    expect(demoSource).toContain('Modeled multiple')
    expect(demoSource).toContain('What must become true')
    expect(demoSource).toContain('90-day priority')
  })

  it('keeps the public demo fictional, unsaved, and properly disclosed', () => {
    expect(demoSource).toContain('Illustrative sample company')
    expect(demoSource).toContain('No information is entered or saved')
    expect(demoSource).toContain('Decision support, not a formal appraisal')
    expect(demoSource).toContain('Enterprise value is not owner proceeds')
    expect(demoSource).not.toContain('type="number"')
    expect(demoSource).not.toContain('localStorage')
  })

  it('converts interest into the existing Founder Value Leak Review', () => {
    expect(demoSource).toContain('Start a Founder Value Leak Review')
    expect(demoSource).toContain('https://lifepointfd.com/get-started-here/')
  })
})
