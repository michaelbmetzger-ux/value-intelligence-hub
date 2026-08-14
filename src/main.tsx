import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ValueIntelligenceSite from './ValueIntelligenceSite.tsx'
import { valueIntelligenceStructuredData } from './valueIntelligenceSeo.ts'

const title = 'Fractional CFO & Business Value Growth | Value Intelligence Hub'
const description = 'Fractional CFO leadership, monthly company-health insight, forecasting, and business value-growth advisory for founder-led service businesses.'
const canonicalUrl = 'https://value.lifepointfd.com/'
const socialImageUrl = `${canonicalUrl}value-intelligence/assets/value-intelligence-hub-social.jpg`

const setMeta = (selector: string, attribute: string, value: string) => {
  document.querySelector(selector)?.setAttribute(attribute, value)
}

document.title = title
setMeta('meta[name="description"]', 'content', description)
setMeta('meta[name="robots"]', 'content', 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1')
setMeta('meta[property="og:title"]', 'content', title)
setMeta('meta[property="og:description"]', 'content', description)
setMeta('meta[property="og:url"]', 'content', canonicalUrl)
setMeta('meta[property="og:type"]', 'content', 'website')
setMeta('meta[property="og:image"]', 'content', socialImageUrl)
setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image')
setMeta('meta[name="twitter:title"]', 'content', title)
setMeta('meta[name="twitter:description"]', 'content', description)
setMeta('meta[name="twitter:image"]', 'content', socialImageUrl)
document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonicalUrl)

const structuredData = document.createElement('script')
structuredData.type = 'application/ld+json'
structuredData.text = JSON.stringify(valueIntelligenceStructuredData)
document.head.appendChild(structuredData)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ValueIntelligenceSite />
  </StrictMode>,
)
