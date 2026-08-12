const { jsPDF } = require('jspdf')
const fs = require('node:fs')
const path = require('node:path')

const output = path.resolve(__dirname, '..', 'Lifepoint-How-We-Estimate-Business-Value.pdf')
const doc = new jsPDF({ unit: 'pt', format: 'letter' })

const C = {
  navy: [15, 23, 42],
  blue: [37, 99, 235],
  blueDark: [30, 64, 175],
  bluePale: [239, 246, 255],
  slate: [71, 85, 105],
  muted: [100, 116, 139],
  line: [203, 213, 225],
  panel: [248, 250, 252],
  green: [22, 101, 52],
  amber: [180, 83, 9],
  red: [185, 28, 28],
  white: [255, 255, 255],
}

const W = 612
const H = 792
const M = 48
let pageNumber = 1

function color(rgb) { doc.setTextColor(...rgb) }
function fill(rgb) { doc.setFillColor(...rgb) }
function stroke(rgb) { doc.setDrawColor(...rgb) }

function header(title) {
  color(C.blue)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('LIFEPOINT FINANCIAL DESIGN', M, 35)
  color(C.muted)
  doc.setFont('helvetica', 'normal')
  doc.text(title.toUpperCase(), W - M, 35, { align: 'right' })
  stroke(C.line)
  doc.setLineWidth(0.6)
  doc.line(M, 46, W - M, 46)
}

function footer() {
  stroke(C.line)
  doc.line(M, H - 40, W - M, H - 40)
  color(C.muted)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('Planning estimate. Not a formal appraisal, fairness opinion, tax valuation, or offer.', M, H - 24)
  doc.text(String(pageNumber), W - M, H - 24, { align: 'right' })
}

function newPage(title) {
  footer()
  doc.addPage()
  pageNumber += 1
  header(title)
}

function text(textValue, x, y, width, size = 10, style = 'normal', textColor = C.slate, leading = 1.35) {
  color(textColor)
  doc.setFont('helvetica', style)
  doc.setFontSize(size)
  const lines = doc.splitTextToSize(textValue, width)
  doc.text(lines, x, y, { lineHeightFactor: leading })
  return y + lines.length * size * leading
}

function sectionTitle(kicker, title, y) {
  color(C.blue)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(kicker.toUpperCase(), M, y)
  y += 20
  color(C.navy)
  doc.setFontSize(20)
  doc.text(title, M, y)
  return y + 20
}

function panel(x, y, width, height, options = {}) {
  fill(options.fill || C.panel)
  stroke(options.stroke || C.line)
  doc.setLineWidth(options.lineWidth || 0.8)
  doc.roundedRect(x, y, width, height, options.radius || 7, options.radius || 7, 'FD')
}

function pill(label, x, y, width, rgb = C.bluePale, textRgb = C.blueDark) {
  fill(rgb)
  doc.roundedRect(x, y, width, 24, 12, 12, 'F')
  color(textRgb)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text(label, x + width / 2, y + 16, { align: 'center' })
}

function bullet(textValue, x, y, width, accent = C.blue) {
  fill(accent)
  doc.circle(x + 4, y - 3, 3, 'F')
  return text(textValue, x + 16, y, width - 16, 10, 'normal', C.slate, 1.35) + 5
}

function adjustmentRow(y, label, direction, reason, tone) {
  const toneColor = tone === 'up' ? C.green : tone === 'down' ? C.red : C.slate
  panel(M, y, W - 2 * M, 47)
  text(label, M + 14, y + 18, 150, 9, 'bold', C.navy)
  text(direction, M + 180, y + 18, 70, 9, 'bold', toneColor)
  text(reason, M + 260, y + 16, 240, 8.5, 'normal', C.slate, 1.25)
  return y + 53
}

// Page 1: cover
fill(C.navy)
doc.rect(0, 0, W, H, 'F')
fill(C.blue)
doc.rect(0, 0, 14, H, 'F')
color([147, 197, 253])
doc.setFont('helvetica', 'bold')
doc.setFontSize(10)
doc.text('LIFEPOINT FINANCIAL DESIGN', 56, 75)
color(C.white)
doc.setFontSize(34)
doc.text(['How We Estimate', 'Business Value'], 56, 145, { lineHeightFactor: 1.08 })
text(
  'A clear, evidence-based framework for turning financial performance, industry context, and company-specific risk into a practical valuation range.',
  56, 250, 485, 15, 'normal', [203, 213, 225], 1.45,
)

panel(56, 360, 500, 170, { fill: [30, 41, 59], stroke: [51, 65, 85], radius: 10 })
text('THE CORE FORMULA', 78, 392, 200, 9, 'bold', [147, 197, 253])
text('Normalized EBITDA', 78, 430, 220, 23, 'bold', C.white)
text('×', 300, 430, 30, 23, 'bold', [147, 197, 253])
text('Industry-anchored multiple', 330, 430, 210, 18, 'bold', C.white)
text(
  'We start with sustainable earnings, anchor the multiple to relevant market evidence, then adjust for the strengths and risks a buyer would evaluate.',
  78, 475, 445, 11, 'normal', [203, 213, 225], 1.4,
)

pill('TRANSPARENT', 56, 575, 108, [30, 64, 175], C.white)
pill('REPEATABLE', 176, 575, 104, [30, 64, 175], C.white)
pill('DECISION-USEFUL', 292, 575, 134, [30, 64, 175], C.white)
pill('REFRESHABLE', 438, 575, 118, [30, 64, 175], C.white)
text('Prepared for client education and strategic planning', 56, 705, 400, 10, 'normal', [148, 163, 184])
color([148, 163, 184])
doc.setFontSize(9)
doc.text('August 2026', 556, 705, { align: 'right' })

// Page 2
newPage('The methodology')
let y = sectionTitle('Step 1', 'Establish sustainable earnings', 80)
y = text(
  'Revenue alone does not determine value. The starting point is normalized EBITDA, an estimate of the operating earnings a new owner could reasonably expect after removing unusual, nonrecurring, or owner-specific items.',
  M, y, W - 2 * M, 11, 'normal', C.slate, 1.45,
) + 18

panel(M, y, W - 2 * M, 90, { fill: C.bluePale, stroke: [191, 219, 254] })
text('Reported operating earnings', M + 18, y + 27, 180, 12, 'bold', C.navy)
text('+ verified owner add-backs', M + 205, y + 27, 165, 12, 'bold', C.blueDark)
text('= normalized EBITDA', M + 375, y + 27, 125, 12, 'bold', C.navy)
text('The quality of the valuation is only as strong as the quality of this earnings base.', M + 18, y + 60, 470, 10, 'normal', C.slate)
y += 118

y = sectionTitle('Step 2', 'Choose the right industry anchor', y)
y = text(
  'Next, we select an EV/EBITDA benchmark that matches the company’s industry and business model. This prevents a one-size-fits-all multiple from being applied to businesses with very different economics and risks.',
  M, y, W - 2 * M, 11, 'normal', C.slate, 1.45,
) + 14

y = bullet('We review current industry research, public-market context, and available transaction ranges.', M, y, W - 2 * M)
y = bullet('We use the benchmark as a starting point, not as the final answer.', M, y, W - 2 * M)
y = bullet('We document the selected industry and the source notes used in the model.', M, y, W - 2 * M)
y += 12

y = sectionTitle('Step 3', 'Adjust for this company’s facts', y)
text(
  'Two companies in the same industry can deserve different multiples. We therefore adjust the industry anchor for the operating qualities that affect durability, transferability, cash generation, and buyer confidence.',
  M, y, W - 2 * M, 11, 'normal', C.slate, 1.45,
)

// Page 3
newPage('Company-specific adjustments')
y = sectionTitle('Adjustment framework', 'What can move the multiple', 80)
text('The model makes each adjustment visible so the conclusion can be challenged, updated, and explained.', M, y, W - 2 * M, 10, 'normal', C.slate)
y += 32

text('FACTOR', M + 14, y, 150, 8, 'bold', C.muted)
text('TYPICAL EFFECT', M + 180, y, 80, 8, 'bold', C.muted)
text('WHY IT MATTERS', M + 260, y, 240, 8, 'bold', C.muted)
y += 12
y = adjustmentRow(y, 'Company size', 'Premium / discount', 'Scale affects marketability, buyer depth, financing, and key-person sensitivity.', 'neutral')
y = adjustmentRow(y, 'Revenue growth', 'Premium / discount', 'Reliable growth above or below the industry baseline can change buyer expectations.', 'neutral')
y = adjustmentRow(y, 'EBITDA margin', 'Premium / discount', 'Stronger margins indicate better earnings quality and operating leverage.', 'neutral')
y = adjustmentRow(y, 'Recurring revenue', 'Usually premium', 'Repeatable revenue improves visibility and reduces uncertainty.', 'up')
y = adjustmentRow(y, 'Owner dependency', 'Usually discount', 'A business that depends heavily on one owner is harder to transfer.', 'down')
y = adjustmentRow(y, 'Customer concentration', 'Usually discount', 'Reliance on one or two customers increases the risk of an earnings shock.', 'down')
y = adjustmentRow(y, 'Collections speed', 'Premium / discount', 'Faster collections improve cash conversion and the quality of reported earnings.', 'neutral')
y = adjustmentRow(y, 'Data confidence', 'Usually discount if weak', 'Incomplete or estimated inputs require more caution and a wider range.', 'down')
y = adjustmentRow(y, 'Value Engine quality', 'Premium / discount', 'Systems, leadership, processes, and transferability affect buyer confidence.', 'neutral')

// Page 4
newPage('From inputs to a range')
y = sectionTitle('The conclusion', 'Why we show a valuation range', 80)
y = text(
  'A precise-looking single number can create false confidence. Buyers, lenders, and successors can price the same risks differently, so we present three connected cases rather than pretending there is one indisputable answer.',
  M, y, W - 2 * M, 11, 'normal', C.slate, 1.45,
) + 18

const cards = [
  ['BEAR CASE', 'Risk-discounted', 'Uses current normalized EBITDA with a lower multiple for unresolved operating or data risk.', C.red],
  ['BASE CASE', 'Current position', 'Uses normalized EBITDA and the current industry-anchored, company-adjusted multiple.', C.blueDark],
  ['UPSIDE CASE', 'Improvement case', 'Reflects explicit 12-month assumptions for earnings, quality, and risk improvement.', C.green],
]
let x = M
for (const [label, title, body, accent] of cards) {
  panel(x, y, 164, 170)
  fill(accent)
  doc.rect(x, y, 164, 6, 'F')
  text(label, x + 14, y + 32, 136, 8, 'bold', accent)
  text(title, x + 14, y + 61, 136, 14, 'bold', C.navy)
  text(body, x + 14, y + 91, 136, 9, 'normal', C.slate, 1.35)
  x += 176
}
y += 198

y = sectionTitle('How to use it', 'The valuation is a decision tool', y)
y = bullet('Understand which risks are suppressing value today.', M, y, W - 2 * M)
y = bullet('Prioritize the operating improvements most likely to increase earnings quality or the multiple.', M, y, W - 2 * M)
y = bullet('Track whether completed work is actually closing the value gap.', M, y, W - 2 * M)
y = bullet('Refresh the model when financials, add-backs, industry evidence, or company facts change.', M, y, W - 2 * M)
y += 4

text('Enterprise value is not the same as owner proceeds. A transaction would normally bridge from enterprise value to equity value by subtracting debt and adding excess cash, then accounting for transaction costs, taxes, working-capital targets, and other closing adjustments.', M, y, W - 2 * M, 8.5, 'normal', C.slate, 1.25)
y += 44

panel(M, y, W - 2 * M, 125, { fill: [255, 247, 237], stroke: [254, 215, 170] })
text('IMPORTANT PROFESSIONAL CONTEXT', M + 18, y + 25, 300, 9, 'bold', C.amber)
text(
  'This methodology produces an advisory estimate of enterprise value for planning and decision-making. If normalized EBITDA is zero or negative, EV/EBITDA is not applicable and a different valuation method is required. It is not a formal appraisal, fairness opinion, tax valuation, or offer to buy the company. A transaction, legal, tax, or compliance use may require a credentialed valuation professional and additional diligence.',
  M + 18, y + 50, W - 2 * M - 36, 10, 'normal', C.slate, 1.35,
)

footer()
fs.writeFileSync(output, Buffer.from(doc.output('arraybuffer')))
console.log(JSON.stringify({ output, bytes: fs.statSync(output).size, pages: doc.getNumberOfPages() }))
