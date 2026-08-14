import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const mainSource = readFileSync(new URL('./main.tsx', import.meta.url), 'utf8')
const siteSource = readFileSync(new URL('./ValueIntelligenceSite.tsx', import.meta.url), 'utf8')
const siteStyles = readFileSync(new URL('./ValueIntelligenceSite.css', import.meta.url), 'utf8')
const seoSource = readFileSync(new URL('./valueIntelligenceSeo.ts', import.meta.url), 'utf8')
const htmlSource = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const robotsSource = readFileSync(new URL('../public/robots.txt', import.meta.url), 'utf8')
const sitemapSource = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8')

describe('Value Intelligence Hub marketing site', () => {
  it('uses a separate route from the client portal', () => {
    expect(mainSource).toContain("window.location.pathname.startsWith('/value-intelligence')")
    expect(mainSource).toContain('<ValueIntelligenceSite />')
  })

  it('positions the Hub as the operating system for fractional CFO and value-growth work', () => {
    expect(siteSource).toContain('fractional CFO')
    expect(siteSource).toContain('value growth')
    expect(siteSource).toContain('monthly company-health review')
    expect(siteSource).toContain('See what your business is building')
    expect(siteSource).toContain('Founder Value Leak Review')
  })

  it('supports readable search and AI discovery with direct answers and structured data', () => {
    expect(siteSource).toContain('Frequently asked questions')
    expect(seoSource).toContain("What does a fractional CFO do?")
    expect(seoSource).toContain("'@type': 'FAQPage'")
    expect(seoSource).toContain("'@type': 'ProfessionalService'")
    expect(mainSource).toContain('Fractional CFO & Business Value Growth')
    expect(mainSource).toContain('application/ld+json')
    expect(mainSource).toContain("https://lifepointfd.com/value-intelligence")
    expect(mainSource).toContain("noindex,nofollow,noarchive")
    expect(htmlSource).toContain('index,follow,max-image-preview:large')
    expect(htmlSource).toContain('value-intelligence-hub-social.jpg')
    expect(robotsSource).toContain('Allow: /value-intelligence')
    expect(robotsSource).toContain('Disallow: /')
    expect(sitemapSource).toContain('<loc>https://lifepointfd.com/value-intelligence</loc>')
  })

  it('does not present the estimate as a formal valuation', () => {
    expect(siteSource).toContain('not a formal appraisal')
  })

  it('uses Lifepoint’s existing contact path for the primary CTA', () => {
    expect(siteSource).toContain('https://lifepointfd.com/get-started-here/')
  })

  it('gives the navigation logo and Value Intelligence wordmark clear separation', () => {
    expect(siteStyles).toContain('.vih-nav-shell .vih-logo { gap: 22px; }')
  })

  it('offers a safe public sample-business demo without collecting company data', () => {
    expect(siteSource).toContain("import PublicValueDemo from './PublicValueDemo'")
    expect(siteSource).toContain('<PublicValueDemo />')
    expect(siteSource).toContain('href="#demo"')
  })

  it('introduces Mike and Troy with business-owner-specific experience', () => {
    expect(siteSource).toContain('Meet the advisors')
    expect(siteSource).toContain('Mike Metzger')
    expect(siteSource).toContain('For nearly two decades')
    expect(siteSource).toContain('CFP®')
    expect(siteSource).toContain('tax strategy')
    expect(siteSource).toContain('personal wealth')
    expect(siteSource).toContain('Troy Hildenbrand')
    expect(siteSource).toContain('more than two decades')
    expect(siteSource).toContain('TSX Venture Exchange')
    expect(siteSource).toContain('CPA, CA, CTP, CVGA, CEPA, CM&amp;AA')
    expect(siteSource).toContain('href="#advisors"')
  })

  it('makes both advisors discoverable in structured data', () => {
    expect(seoSource).toContain("'@type': 'Person'")
    expect(seoSource).toContain("name: 'Mike Metzger'")
    expect(seoSource).toContain("name: 'Troy Hildenbrand'")
  })
})
