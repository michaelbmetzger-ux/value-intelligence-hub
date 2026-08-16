import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const appSource = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8')
const benchmarkBlock = appSource.match(/const industryBenchmarks: IndustryBenchmark\[\] = \[([\s\S]*?)\n\]/)?.[1] ?? ''
const industryIds = Array.from(benchmarkBlock.matchAll(/id: '([^']+)'/g), (match) => match[1])
const industryNames = Array.from(benchmarkBlock.matchAll(/name: '([^']+)'/g), (match) => match[1])

const existingIndustries = [
  'Professional Services',
  'Law Firm',
  'Salon & Spa',
  'Medical Practice',
  'Marketing Agency',
  'Contractor',
  'SaaS',
]

const top30PlaybookIndustries = [
  'Pest Control',
  'Home Healthcare',
  'Kitchen & Bath Remodeling',
  'Salon Suites',
  'Roofing & Solar',
  'ADU Contracting',
  'HVAC',
  'Paving',
  'Non-Emergency Medical Transport',
  'Plumbing',
  'Print Marketing',
  'Chimney & Fireplace',
  'Electrical',
  'Water Filtration',
  'Landscaping',
  'Laundry Service',
  'Flooring & Epoxy',
  'Hair Restoration',
  'Pool Services',
  'Hydration Services',
  'Septic & Porta Potty',
  'Equipment Rental',
  'Urgent Care',
  'Fencing',
  'Towing & Repair',
  'Med Spa',
  'Janitorial Services',
  'Garage Door Services',
  'Commercial Cleaning',
  'Niche Markets',
]

describe('industry benchmark dropdowns', () => {
  it('keeps existing benchmark industries and adds Top 30 Playbook industries without duplicates', () => {
    for (const industry of [...existingIndustries, ...top30PlaybookIndustries]) {
      expect(industryNames).toContain(industry)
    }

    expect(new Set(industryIds).size).toBe(industryIds.length)
    expect(new Set(industryNames.map((name) => name.toLowerCase())).size).toBe(industryNames.length)
    expect(industryNames).toHaveLength(existingIndustries.length + top30PlaybookIndustries.length)
  })
})
