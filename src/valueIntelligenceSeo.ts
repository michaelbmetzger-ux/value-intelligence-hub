export const valueIntelligenceFaqs = [
  {
    question: 'What does a fractional CFO do?',
    answer: 'A fractional CFO gives a growing business senior financial leadership without requiring a full-time CFO. The work can include cash-flow planning, forecasting, scenario modeling, pricing and margin analysis, capital planning, management reporting, and financial decision support for the owner and leadership team.',
  },
  {
    question: 'How is the Value Intelligence Hub different from a normal financial dashboard?',
    answer: 'A normal dashboard reports metrics. The Value Intelligence Hub connects financial performance with operating risk, transferable value, owner dependence, customer concentration, and current priorities. Lifepoint uses it during the monthly CFO process to explain what changed, why it matters, and what management should do next.',
  },
  {
    question: 'What is business value-growth advisory?',
    answer: 'Business value-growth advisory is ongoing work to make a company financially stronger, less risky, and more transferable. It can include improving recurring revenue, margins, cash conversion, management depth, operating systems, customer diversification, and earnings quality. The goal is greater owner optionality, whether the owner plans to sell or hold the company.',
  },
  {
    question: 'What happens in the monthly company-health review?',
    answer: 'The monthly company-health review compares current results with the plan, updates key performance and risk signals, examines cash and forecast changes, reviews progress on value-growth priorities, and sets the next management actions. The conversation focuses on decisions rather than reading financial statements line by line.',
  },
  {
    question: 'Is the Hub a formal business valuation?',
    answer: 'No. The Hub provides decision support and an indicative estimate of enterprise value based on normalized earnings, industry benchmarks, and company-specific factors. It is not a formal appraisal, fairness opinion, or guarantee of transaction value or owner proceeds.',
  },
  {
    question: 'Who is the service designed for?',
    answer: 'The service is designed for founder-led service businesses that need better financial visibility, forward planning, stronger management discipline, and a practical path to increasing transferability and owner freedom.',
  },
]

export const valueIntelligenceStructuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Lifepoint Financial Design - Fractional CFO and Business Value Growth',
    description: 'Fractional CFO leadership, business value-growth advisory, and monthly company-health insight through the Value Intelligence Hub for founder-led service businesses.',
    url: 'https://value.lifepointfd.com/',
    areaServed: 'United States',
    provider: {
      '@type': 'Organization',
      name: 'Lifepoint Financial Design',
      url: 'https://lifepointfd.com/',
    },
    serviceType: [
      'Fractional CFO services',
      'Business value growth advisory',
      'Management reporting and forecasting',
      'Business valuation decision support',
    ],
    audience: {
      '@type': 'BusinessAudience',
      audienceType: 'Founder-led service businesses',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Mike Metzger',
    jobTitle: 'Founder and CERTIFIED FINANCIAL PLANNER™ professional',
    description: 'CFP® and CVGA® professional with nearly two decades of experience helping business owners connect company performance, tax strategy, personal wealth, and long-term financial decisions.',
    worksFor: {
      '@type': 'Organization',
      name: 'Lifepoint Financial Design',
      url: 'https://lifepointfd.com/',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Troy Hildenbrand',
    jobTitle: 'Fractional CFO, CPA and Value Growth Advisor',
    description: 'Fractional CFO, CPA, valuation professional, and value growth advisor with more than two decades of experience helping owner-led businesses improve financial performance and build enterprise value.',
    worksFor: {
      '@type': 'Organization',
      name: 'TGH CFO',
      url: 'https://tghcfo.wixsite.com/website',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: valueIntelligenceFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  },
]
