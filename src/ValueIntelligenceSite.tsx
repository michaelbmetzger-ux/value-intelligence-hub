import { useState } from 'react'
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  CircleDollarSign,
  ClipboardCheck,
  Compass,
  Gauge,
  LineChart,
  Menu,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import './ValueIntelligenceSite.css'
import PublicValueDemo from './PublicValueDemo'
import { valueIntelligenceFaqs } from './valueIntelligenceSeo'

const contactUrl = 'https://lifepointfd.com/get-started-here/'

const valueLeaks = [
  {
    icon: Users,
    title: 'Owner dependence',
    copy: 'See where sales, delivery, relationships, and decisions still rely too heavily on you.',
  },
  {
    icon: CircleDollarSign,
    title: 'Margin and cash drag',
    copy: 'Connect profit, cash conversion, customer mix, and working capital to the choices in front of you.',
  },
  {
    icon: Target,
    title: 'Transferability risk',
    copy: 'Identify the systems, leadership, recurring revenue, and operating discipline that may strengthen value.',
  },
]

const cfoPillars = [
  {
    icon: BriefcaseBusiness,
    title: 'Fractional CFO leadership',
    copy: 'Forward-looking financial leadership for cash, forecasting, margins, pricing, hiring, capital, and major owner decisions.',
  },
  {
    icon: TrendingUp,
    title: 'Value-growth work',
    copy: 'A deliberate plan to strengthen earnings quality, transferability, management depth, recurring revenue, and strategic options.',
  },
  {
    icon: Gauge,
    title: 'Value Intelligence Hub',
    copy: 'The monthly operating system that keeps company health, value drivers, risks, priorities, and progress visible.',
  },
]

const visibilityItems = [
  'Business health and forward-looking risk',
  'Normalized earnings and estimated enterprise value',
  'Industry benchmarks and company-specific adjustments',
  'Owner dependence, concentration, recurring revenue, and cash conversion',
  'A prioritized 90-day action plan',
  'The connection between company value and owner freedom',
]

const monthlySignals = [
  { label: 'Revenue quality', value: 82, state: 'healthy' },
  { label: 'Margin strength', value: 74, state: 'watch' },
  { label: 'Cash conversion', value: 68, state: 'watch' },
  { label: 'Customer concentration', value: 57, state: 'risk' },
  { label: 'Owner independence', value: 61, state: 'risk' },
]

const process = [
  {
    number: '01',
    title: 'Connect the facts',
    copy: 'We organize the financial, customer, operating, and owner-level information that normally lives in separate places.',
  },
  {
    number: '02',
    title: 'Read company health',
    copy: 'The Hub turns those inputs into one view of trends, risks, performance, cash, and transferable value.',
  },
  {
    number: '03',
    title: 'Apply CFO judgment',
    copy: 'We interpret what changed, model the decisions, and identify the few issues that deserve management attention.',
  },
  {
    number: '04',
    title: 'Move the work forward',
    copy: 'Each monthly review ends with clear priorities, owners, and next steps connected to a 90-day value-growth plan.',
  },
]

function ProductPreview() {
  return (
    <div className="vih-product-frame" aria-label="Illustrative Value Intelligence Hub dashboard preview">
      <div className="vih-product-topbar">
        <div className="vih-product-brand">
          <span className="vih-product-mark">VI</span>
          <div>
            <strong>Value Intelligence Hub</strong>
            <small>Monthly CFO operating view</small>
          </div>
        </div>
        <span className="vih-demo-tag">Illustrative data</span>
      </div>
      <div className="vih-product-body">
        <aside className="vih-product-nav" aria-hidden="true">
          <span className="active"><Gauge size={15} /> Overview</span>
          <span><BarChart3 size={15} /> KPIs</span>
          <span><LineChart size={15} /> Forecast</span>
          <span><Target size={15} /> Value</span>
        </aside>
        <div className="vih-product-main">
          <div className="vih-product-heading">
            <div>
              <small>OWNER VIEW / MONTHLY REVIEW</small>
              <strong>One picture. Clear priorities.</strong>
            </div>
            <span>Professional Services</span>
          </div>
          <div className="vih-metric-row">
            <article>
              <small>BUSINESS HEALTH</small>
              <strong>84<span>/100</span></strong>
              <em className="positive">Stable</em>
            </article>
            <article>
              <small>EST. ENTERPRISE VALUE</small>
              <strong>$837K</strong>
              <em>4.5x normalized EBITDA</em>
            </article>
            <article>
              <small>OWNER DEPENDENCE</small>
              <strong>62%</strong>
              <em className="attention">Priority risk</em>
            </article>
          </div>
          <div className="vih-product-lower">
            <article className="vih-chart-card">
              <div className="vih-card-label">
                <div>
                  <small>VALUE TRAJECTORY</small>
                  <strong>What changes the outcome</strong>
                </div>
                <span>12 months</span>
              </div>
              <svg viewBox="0 0 480 164" role="img" aria-label="Illustrative rising enterprise value trajectory">
                <defs>
                  <linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#14b8a6" stopOpacity=".24" />
                    <stop offset="1" stopColor="#14b8a6" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path className="grid" d="M20 32H460M20 76H460M20 120H460" />
                <path className="area" d="M20 132 C84 126 112 112 164 116 S252 93 300 84 S378 52 460 30 L460 150 L20 150 Z" />
                <path className="line" d="M20 132 C84 126 112 112 164 116 S252 93 300 84 S378 52 460 30" />
                <circle cx="460" cy="30" r="5" />
              </svg>
              <div className="vih-chart-axis"><span>Now</span><span>90 days</span><span>6 months</span><span>12 months</span></div>
            </article>
            <article className="vih-priority-card">
              <small>NEXT 90 DAYS</small>
              <strong>Reduce owner dependence</strong>
              <p>Document and delegate the client-delivery handoff before adding capacity.</p>
              <div><span>01</span><p>Map owner-led workflows</p></div>
              <div><span>02</span><p>Assign operating owner</p></div>
              <div><span>03</span><p>Track proof monthly</p></div>
            </article>
          </div>
        </div>
      </div>
    </div>
  )
}

function MonthlyHealthGraphic() {
  return (
    <div className="vih-health-board" aria-label="Illustrative monthly company-health review">
      <div className="vih-health-header">
        <div>
          <small>MONTHLY COMPANY-HEALTH REVIEW</small>
          <strong>Where the business is stronger, weaker, or changing</strong>
        </div>
        <span><CalendarDays size={14} /> June</span>
      </div>
      <div className="vih-health-score">
        <div className="vih-score-ring">
          <svg viewBox="0 0 120 120" role="img" aria-label="Illustrative company health score of 84 out of 100">
            <circle className="track" cx="60" cy="60" r="49" />
            <circle className="progress" cx="60" cy="60" r="49" />
          </svg>
          <div><strong>84</strong><span>/100</span><small>COMPANY HEALTH</small></div>
        </div>
        <div className="vih-health-summary">
          <span className="vih-status stable">STABLE, WITH TWO PRIORITIES</span>
          <p>Margin held, cash improved, and the forecast remains on plan. Customer concentration and owner-led delivery need attention before the next growth push.</p>
        </div>
      </div>
      <div className="vih-signal-list">
        {monthlySignals.map((signal) => (
          <div key={signal.label}>
            <span>{signal.label}</span>
            <div><i className={signal.state} style={{ width: `${signal.value}%` }}></i></div>
            <strong>{signal.value}</strong>
          </div>
        ))}
      </div>
      <div className="vih-monthly-decision">
        <span><Compass size={17} /></span>
        <div><small>THIS MONTH'S CFO QUESTION</small><strong>Can we add capacity without adding more owner dependence?</strong></div>
      </div>
    </div>
  )
}

export default function ValueIntelligenceSite() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="vih-site">
      <header className="vih-nav-shell">
        <a className="vih-logo" href="#top" aria-label="Lifepoint Value Intelligence Hub home">
          <img src="/value-intelligence/assets/lifepoint-logo.png" alt="Lifepoint Financial Design" />
          <span></span>
          <div><strong>Value Intelligence</strong><small>HUB</small></div>
        </a>
        <button className="vih-menu-button" type="button" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((current) => !current)}>
          {menuOpen ? <X /> : <Menu />}
        </button>
        <nav className={menuOpen ? 'open' : ''} aria-label="Marketing website">
          <a href="#cfo" onClick={() => setMenuOpen(false)}>Fractional CFO</a>
          <a href="#monthly" onClick={() => setMenuOpen(false)}>Monthly insight</a>
          <a href="#demo" onClick={() => setMenuOpen(false)}>Demo</a>
          <a href="#value-growth" onClick={() => setMenuOpen(false)}>Value growth</a>
          <a href="#advisors" onClick={() => setMenuOpen(false)}>Advisors</a>
          <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
          <a className="vih-nav-login" href="/">Client login</a>
          <a className="vih-button small" href={contactUrl}>Start a conversation <ArrowRight size={16} /></a>
        </nav>
      </header>

      <main id="top">
        <section className="vih-hero">
          <div className="vih-hero-glow one"></div>
          <div className="vih-hero-glow two"></div>
          <div className="vih-container vih-hero-grid">
            <div className="vih-hero-copy">
              <span className="vih-eyebrow"><span></span> Fractional CFO + business value growth</span>
              <h1>See what your business is building.<br /><em>And what is holding it back.</em></h1>
              <p className="vih-lead">Lifepoint combines fractional CFO leadership with the Value Intelligence Hub to give founders monthly insight into company health, forward decisions, and the work that may strengthen transferable value.</p>
              <div className="vih-hero-actions">
                <a className="vih-button" href={contactUrl}>Start with a Founder Value Leak Review <ArrowRight size={18} /></a>
                <a className="vih-text-link" href="#demo">Try the 60-second demo <ArrowRight size={17} /></a>
              </div>
              <div className="vih-trust-line">
                <span><Check size={15} /> CFO judgment, not just reporting</span>
                <span><Check size={15} /> Monthly company-health insight</span>
                <span><Check size={15} /> Clear 90-day priorities</span>
              </div>
            </div>
            <div className="vih-hero-product"><ProductPreview /></div>
          </div>
        </section>

        <section className="vih-cfo-system" id="cfo">
          <div className="vih-container">
            <div className="vih-section-heading centered wide">
              <span className="vih-kicker">MORE THAN A DASHBOARD</span>
              <h2>Fractional CFO leadership is the service. The Hub is the operating system.</h2>
              <p>A dashboard can show a number. It cannot decide whether to hire, change pricing, preserve cash, restructure debt, or fix an operating risk. That takes financial leadership, a repeatable decision process, and follow-through.</p>
            </div>
            <div className="vih-cfo-pillars">
              {cfoPillars.map((pillar, index) => {
                const Icon = pillar.icon
                return (
                  <article key={pillar.title}>
                    <div className="vih-pillar-number">0{index + 1}</div>
                    <span className="vih-icon"><Icon size={23} /></span>
                    <h3>{pillar.title}</h3>
                    <p>{pillar.copy}</p>
                  </article>
                )
              })}
            </div>
            <div className="vih-system-result"><span>TOGETHER</span><strong>Better visibility → better decisions → stronger execution → greater owner optionality</strong></div>
          </div>
        </section>

        <section className="vih-monthly" id="monthly">
          <div className="vih-container vih-monthly-grid">
            <div className="vih-monthly-copy">
              <span className="vih-kicker light">MONTHLY COMPANY-HEALTH INSIGHT</span>
              <h2>Know what changed, why it matters, and what management should do next.</h2>
              <p>Each month, the Hub brings current financial and operating signals into one owner-level review. Lifepoint applies fractional CFO judgment to the data, updates the forecast, and turns the findings into decisions and assigned work.</p>
              <div className="vih-monthly-steps">
                <article><span>01</span><div><strong>Read the signals</strong><p>Revenue, margin, cash, forecast, concentration, capacity, and risk.</p></div></article>
                <article><span>02</span><div><strong>Interpret the change</strong><p>What moved, what caused it, and whether it alters the plan.</p></div></article>
                <article><span>03</span><div><strong>Make the decision</strong><p>What to do now, who owns it, and what evidence we expect next month.</p></div></article>
              </div>
            </div>
            <MonthlyHealthGraphic />
          </div>
        </section>

        <PublicValueDemo />

        <section className="vih-bridge" id="why">
          <div className="vih-container">
            <div className="vih-section-heading split">
              <div>
                <span className="vih-kicker">THE GAP BETWEEN REPORTING AND DECISIONS</span>
                <h2>Accurate numbers tell you what happened.<br />CFO insight helps you decide what happens next.</h2>
              </div>
              <p>Your bookkeeper sees the books. Your CPA sees the tax return. Your financial advisor sees the household. Lifepoint connects those facts to forward business decisions and long-term owner wealth.</p>
            </div>
            <div className="vih-leak-grid">
              {valueLeaks.map((item) => {
                const Icon = item.icon
                return (
                  <article key={item.title}>
                    <span className="vih-icon"><Icon size={22} /></span>
                    <h3>{item.title}</h3>
                    <p>{item.copy}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="vih-inside" id="value-growth">
          <div className="vih-container vih-inside-grid">
            <div className="vih-inside-copy">
              <span className="vih-kicker light">VALUE GROWTH, MONTH BY MONTH</span>
              <h2>Build a financially stronger, less risky, more transferable company.</h2>
              <p>Value growth is not a project reserved for the year before a sale. It is operating work: improving earnings quality, reducing avoidable risk, building management depth, and making the company less dependent on its owner.</p>
              <ul>
                {visibilityItems.map((item) => <li key={item}><span><Check size={15} /></span>{item}</li>)}
              </ul>
              <small className="vih-disclosure">The Hub provides decision support and an indicative valuation range. It is not a formal appraisal, fairness opinion, or guarantee of transaction value or owner proceeds.</small>
            </div>
            <div className="vih-value-stack">
              <article className="top">
                <span>01</span>
                <div><small>PROTECT THE ENGINE</small><strong>Cash discipline, reliable reporting, forecast visibility, and healthy margins</strong></div>
              </article>
              <div className="vih-stack-arrow">↓</div>
              <article>
                <span>02</span>
                <div><small>STRENGTHEN TRANSFERABILITY</small><strong>Management depth, repeatable systems, recurring revenue, and lower concentration</strong></div>
              </article>
              <div className="vih-stack-arrow">↓</div>
              <article>
                <span>03</span>
                <div><small>INCREASE OPTIONALITY</small><strong>Better choices around growth, distributions, capital, transition, and a possible future sale</strong></div>
              </article>
              <div className="vih-stack-arrow">↓</div>
              <article className="accent">
                <span>04</span>
                <div><small>CONNECT TO OWNER WEALTH</small><strong>Align company value, taxes, liquidity, family goals, and financial independence</strong></div>
              </article>
            </div>
          </div>
        </section>

        <section className="vih-process" id="process">
          <div className="vih-container">
            <div className="vih-section-heading centered">
              <span className="vih-kicker">THE MONTHLY CFO CADENCE</span>
              <h2>From scattered facts to focused action.</h2>
              <p>The Hub supports an ongoing fractional CFO process, not a one-time report that disappears into a folder.</p>
            </div>
            <div className="vih-process-grid">
              {process.map((item) => (
                <article key={item.number}>
                  <span>{item.number}</span>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="vih-insight-brief">
          <div className="vih-container vih-brief-grid">
            <div>
              <span className="vih-kicker">WHAT AN OWNER RECEIVES</span>
              <h2>A monthly insight brief built for decisions, not financial jargon.</h2>
              <p>Instead of sending a dense packet and expecting the owner to interpret it, Lifepoint summarizes the health of the company in plain language and leads the conversation around what deserves action.</p>
            </div>
            <div className="vih-brief-card">
              <div className="vih-brief-title"><ClipboardCheck size={19} /><div><small>JUNE OWNER BRIEF</small><strong>Three things that matter now</strong></div></div>
              <article className="good"><span>01</span><div><strong>Cash improved faster than forecast.</strong><p>Collections accelerated and created room for the planned hire.</p></div></article>
              <article className="watch"><span>02</span><div><strong>Gross margin slipped two points.</strong><p>Project mix changed. Review pricing before adding delivery capacity.</p></div></article>
              <article className="risk"><span>03</span><div><strong>The owner still controls key handoffs.</strong><p>Document and reassign the client-transition workflow this quarter.</p></div></article>
              <footer><span>NEXT DECISION</span><strong>Hire now or stabilize delivery first?</strong></footer>
            </div>
          </div>
        </section>

        <section className="vih-fit" id="fit">
          <div className="vih-container vih-fit-grid">
            <div>
              <span className="vih-kicker light">WHO IT HELPS</span>
              <h2>For owners who need more than bookkeeping, tax preparation, or a generic KPI dashboard.</h2>
              <p>The service is designed for founder-led service businesses where financial complexity is growing and the company is a major part of the owner's personal wealth.</p>
              <a className="vih-button light-button" href={contactUrl}>Talk through your business <ArrowRight size={18} /></a>
            </div>
            <div className="vih-fit-list">
              <article><Building2 size={21} /><div><strong>You are growing, but complexity is growing too.</strong><p>More revenue has not automatically produced more cash, clarity, or freedom.</p></div></article>
              <article><Gauge size={21} /><div><strong>You have financial reports, but not an operating view.</strong><p>The numbers arrive without a clear answer about what management should do next.</p></div></article>
              <article><ShieldCheck size={21} /><div><strong>You want options before you need them.</strong><p>You may sell, transition, or hold long term. A stronger and less owner-dependent business creates more choice.</p></div></article>
            </div>
          </div>
        </section>

        <section className="vih-advisors" id="advisors">
          <div className="vih-container">
            <div className="vih-section-heading centered wide">
              <span className="vih-kicker">Meet the advisors</span>
              <h2>Business value and personal wealth belong in the same conversation.</h2>
              <p>Mike and Troy bring complementary experience across financial planning, tax strategy, fractional CFO leadership, valuation, and value growth. The result is a more complete view of the business and what it needs to create for its owner.</p>
            </div>
            <div className="vih-advisor-grid">
              <article className="vih-advisor-card mike">
                <header>
                  <div className="vih-advisor-monogram" aria-hidden="true">MM</div>
                  <div>
                    <span>FOUNDER, LIFEPOINT FINANCIAL DESIGN</span>
                    <h3>Mike Metzger</h3>
                    <p className="vih-advisor-credentials">CFP® · CVGA®</p>
                  </div>
                </header>
                <div className="vih-advisor-bio">
                  <p>For nearly two decades, Mike has helped clients make clearer decisions about money, risk, and long-term wealth. As a CFP® professional and founder of Lifepoint Financial Design, his work centers on business owners whose company is both an operating enterprise and one of their largest personal assets.</p>
                  <p>Mike helps founders connect cash flow, profitability, business value, tax strategy, and personal wealth so those decisions support the same plan. His work includes modeling major business choices, coordinating tax and wealth strategies, planning for liquidity and financial independence, and translating company performance into practical owner decisions.</p>
                  <p>As both an advisor and a business owner, Mike understands that a stronger company only matters if it creates better choices outside the business too. He helps owners turn growth and enterprise value into a more deliberate plan for family wealth, freedom, and what comes next.</p>
                </div>
              </article>

              <article className="vih-advisor-card troy">
                <header>
                  <div className="vih-advisor-monogram" aria-hidden="true">TH</div>
                  <div>
                    <span>FRACTIONAL CFO + VALUE GROWTH ADVISOR</span>
                    <h3>Troy Hildenbrand</h3>
                    <p className="vih-advisor-credentials">CPA, CA, CTP, CVGA, CEPA, CM&amp;AA</p>
                  </div>
                </header>
                <div className="vih-advisor-bio">
                  <p>Troy is a fractional CFO, CPA, valuation professional, and value growth advisor with more than two decades of experience helping owner-led businesses improve financial performance, strengthen cash flow, and build stronger, more valuable companies.</p>
                  <p>His background includes work with the TSX Venture Exchange, giving him a useful perspective on how sophisticated investors, capital providers, and buyers evaluate a business. Today, he brings those disciplines together to help lower middle market owners strengthen the financial, operational, and strategic foundations of their companies.</p>
                  <p>Troy’s work is built around creating options. That may mean growing, stepping back from day-to-day operations, developing management, bringing in outside capital, transitioning ownership, or preparing for a future transaction when the timing is right.</p>
                </div>
              </article>
            </div>
            <div className="vih-advisor-principle">
              <span><Users size={19} /></span>
              <p><strong>One owner-level picture.</strong> Company performance, transferable value, tax decisions, and personal wealth are reviewed as connected parts of the same plan.</p>
            </div>
          </div>
        </section>

        <section className="vih-faq" id="faq">
          <div className="vih-container vih-faq-grid">
            <div className="vih-faq-intro">
              <span className="vih-kicker">DIRECT ANSWERS</span>
              <h2>Frequently asked questions</h2>
              <p>Plain-language answers about fractional CFO services, business value growth, and the Value Intelligence Hub.</p>
            </div>
            <div className="vih-faq-list">
              {valueIntelligenceFaqs.map((faq) => (
                <details key={faq.question}>
                  <summary>{faq.question}<span>+</span></summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="vih-cta">
          <div className="vih-container vih-cta-box">
            <div>
              <span className="vih-kicker">A PRACTICAL FIRST STEP</span>
              <h2>Find the three places your business may be leaking value.</h2>
              <p>Start with a Founder Value Leak Review. We will connect business risks to the financial picture and outline the next 90 days.</p>
            </div>
            <a className="vih-button" href={contactUrl}>Schedule a fit call <ArrowRight size={18} /></a>
          </div>
        </section>
      </main>

      <footer className="vih-footer">
        <div className="vih-container vih-footer-main">
          <a className="vih-logo footer" href="#top">
            <img src="/value-intelligence/assets/lifepoint-logo.png" alt="Lifepoint Financial Design" />
            <span></span>
            <div><strong>Value Intelligence</strong><small>HUB</small></div>
          </a>
          <div className="vih-footer-copy">
            <p>Fractional CFO leadership, monthly company-health insight, and business value growth in one advisory process.</p>
            <a href={contactUrl}>Start a conversation <ArrowRight size={15} /></a>
          </div>
        </div>
        <div className="vih-container vih-footer-bottom">
          <p>Value Intelligence Hub is an advisory tool from Lifepoint Financial Design.</p>
          <div><a href="https://lifepointfd.com/privacy-policy/">Privacy</a><a href="https://lifepointfd.com/">Lifepoint Financial Design</a><a href="/">Client login</a></div>
        </div>
      </footer>
    </div>
  )
}
