#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const inputPath = path.resolve('allure-results/cucumber-report.json')
const reportDir = path.resolve('allure-report')
const reportPath = path.join(reportDir, 'index.html')

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const now = new Date().toISOString()

function isScenarioElement(element) {
  const type = String(element?.type || '').toLowerCase()
  return type === 'scenario' || type === 'scenario_outline'
}

function readReportJson() {
  if (!fs.existsSync(inputPath)) return []
  const raw = fs.readFileSync(inputPath, 'utf8')
  if (!raw.trim()) return []

  const parsed = JSON.parse(raw)
  return Array.isArray(parsed) ? parsed : []
}

function deriveScenarioStatus(steps = []) {
  const statuses = steps
    .map((step) => step?.result?.status)
    .filter((status) => typeof status === 'string')

  if (statuses.some((status) => status === 'failed')) return 'failed'
  if (statuses.some((status) => status === 'passed')) return 'passed'
  if (
    statuses.some((status) =>
      ['pending', 'undefined', 'ambiguous', 'skipped'].includes(status)
    )
  ) {
    return 'skipped'
  }
  return 'unknown'
}

function summarise(features) {
  const summary = {
    generatedAt: now,
    totals: {
      features: features.length,
      scenarios: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      unknown: 0
    },
    failedScenarios: []
  }

  for (const feature of features) {
    const featureName = feature?.name || '(unnamed feature)'
    const scenarios = (
      Array.isArray(feature?.elements) ? feature.elements : []
    ).filter(isScenarioElement)

    for (const scenario of scenarios) {
      const status = deriveScenarioStatus(scenario?.steps || [])
      summary.totals.scenarios += 1
      summary.totals[status] += 1

      if (status !== 'failed') continue

      const firstFailed = (scenario.steps || []).find(
        (step) => step?.result?.status === 'failed'
      )

      summary.failedScenarios.push({
        feature: featureName,
        scenario: scenario?.name || '(unnamed scenario)',
        error:
          firstFailed?.result?.error_message || 'No failure message provided'
      })
    }
  }

  return summary
}

function renderHtml(summary) {
  const totalScenarios = summary.totals.scenarios
  const passedScenarios = summary.totals.passed
  const failedScenarios = summary.totals.failed
  const skippedScenarios = summary.totals.skipped
  const unknownScenarios = summary.totals.unknown
  const passRate = totalScenarios
    ? Math.round((passedScenarios / totalScenarios) * 100)
    : 0
  const passWidth = totalScenarios
    ? (passedScenarios / totalScenarios) * 100
    : 0
  const failWidth = totalScenarios
    ? (failedScenarios / totalScenarios) * 100
    : 0
  const skipWidth = totalScenarios
    ? (skippedScenarios / totalScenarios) * 100
    : 0
  const unknownWidth = totalScenarios
    ? (unknownScenarios / totalScenarios) * 100
    : 0
  const overallTone = failedScenarios > 0 ? 'tone-failed' : 'tone-passed'

  const cards = [
    { label: 'Features', value: summary.totals.features, className: 'neutral' },
    { label: 'Scenarios', value: totalScenarios, className: 'neutral' },
    { label: 'Passed', value: passedScenarios, className: 'passed' },
    { label: 'Failed', value: failedScenarios, className: 'failed' },
    { label: 'Skipped', value: skippedScenarios, className: 'skipped' },
    { label: 'Unknown', value: unknownScenarios, className: 'unknown' }
  ]
    .map(
      ({ label, value, className }) => `<article class="metric ${className}">
  <p class="metric-label">${escapeHtml(label)}</p>
  <p class="metric-value">${escapeHtml(value)}</p>
</article>`
    )
    .join('\n')

  const failures =
    summary.failedScenarios.length === 0
      ? '<p class="all-good">No failed scenarios.</p>'
      : summary.failedScenarios
          .map(
            (item) =>
              `<article class="failure">
  <h3>${escapeHtml(item.scenario)}</h3>
  <p class="failure-meta">${escapeHtml(item.feature)}</p>
  <pre>${escapeHtml(item.error)}</pre>
</article>`
          )
          .join('\n')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Journey Test Report</title>
  <style>
    :root {
      --bg-0: #0c1228;
      --bg-1: #101a3f;
      --panel: #ffffff;
      --ink: #0f172a;
      --muted: #64748b;
      --passed: #1f9d55;
      --failed: #dc2626;
      --skipped: #d97706;
      --unknown: #475569;
      --neutral: #1d4ed8;
      --soft-border: #e2e8f0;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Avenir Next", "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      color: var(--ink);
      background: radial-gradient(circle at 10% 0%, #1a2b68 0, var(--bg-1) 30%, var(--bg-0) 80%);
      min-height: 100vh;
    }
    .page {
      max-width: 1060px;
      margin: 0 auto;
      padding: 2.25rem 1rem 3rem;
    }
    .hero {
      color: #f8fafc;
      margin-bottom: 1.25rem;
      animation: fade-in 0.45s ease-out;
    }
    .hero h1 {
      margin: 0;
      font-size: clamp(1.8rem, 2.6vw, 2.4rem);
      letter-spacing: 0.01em;
    }
    .hero .meta {
      margin-top: 0.4rem;
      color: #cbd5e1;
      font-size: 0.95rem;
    }
    .summary {
      background: var(--panel);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 20px 45px rgba(15, 23, 42, 0.32);
      padding: 1rem;
      margin-bottom: 1rem;
      animation: rise-in 0.45s ease-out;
    }
    .summary-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.9rem;
    }
    .pass-rate {
      border-radius: 999px;
      font-weight: 700;
      font-size: 0.9rem;
      padding: 0.3rem 0.7rem;
      color: #fff;
      background: ${overallTone === 'tone-passed' ? 'var(--passed)' : 'var(--failed)'};
    }
    .stack {
      width: 100%;
      height: 12px;
      border-radius: 999px;
      overflow: hidden;
      display: flex;
      border: 1px solid var(--soft-border);
      background: #e2e8f0;
      margin-bottom: 0.9rem;
    }
    .seg { height: 100%; }
    .seg.passed { background: var(--passed); width: ${passWidth.toFixed(2)}%; }
    .seg.failed { background: var(--failed); width: ${failWidth.toFixed(2)}%; }
    .seg.skipped { background: var(--skipped); width: ${skipWidth.toFixed(2)}%; }
    .seg.unknown { background: var(--unknown); width: ${unknownWidth.toFixed(2)}%; }
    .metrics {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
    }
    .metric {
      border-radius: 12px;
      border: 1px solid var(--soft-border);
      padding: 0.8rem;
      background: #fff;
    }
    .metric-label {
      margin: 0;
      color: var(--muted);
      font-size: 0.82rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .metric-value {
      margin: 0.3rem 0 0;
      font-size: 1.5rem;
      font-weight: 800;
      line-height: 1;
    }
    .metric.passed { border-color: #bbf7d0; background: #f0fdf4; }
    .metric.passed .metric-value { color: var(--passed); }
    .metric.failed { border-color: #fecaca; background: #fef2f2; }
    .metric.failed .metric-value { color: var(--failed); }
    .metric.skipped { border-color: #fed7aa; background: #fff7ed; }
    .metric.skipped .metric-value { color: var(--skipped); }
    .metric.unknown { border-color: #cbd5e1; background: #f8fafc; }
    .metric.unknown .metric-value { color: var(--unknown); }
    .metric.neutral { border-color: #bfdbfe; background: #eff6ff; }
    .metric.neutral .metric-value { color: var(--neutral); }
    section.failures {
      background: var(--panel);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 16px 36px rgba(15, 23, 42, 0.28);
      padding: 1rem;
      animation: rise-in 0.5s ease-out;
    }
    section.failures h2 {
      margin: 0 0 0.9rem;
      font-size: 1.25rem;
    }
    .all-good {
      margin: 0;
      padding: 0.8rem;
      border-radius: 10px;
      border: 1px solid #bbf7d0;
      background: #f0fdf4;
      color: #14532d;
      font-weight: 600;
    }
    .failure {
      border: 1px solid #fecaca;
      border-radius: 10px;
      padding: 0.8rem;
      margin: 0 0 0.8rem;
      background: #fff1f2;
    }
    .failure:last-child { margin-bottom: 0; }
    .failure h3 {
      margin: 0;
      color: #7f1d1d;
      font-size: 1rem;
    }
    .failure-meta {
      margin: 0.15rem 0 0.55rem;
      color: #9f1239;
      font-size: 0.85rem;
      font-weight: 600;
    }
    pre {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      margin: 0;
      padding: 0.7rem;
      border-radius: 8px;
      background: #0f172a;
      color: #e2e8f0;
      font-size: 0.82rem;
      line-height: 1.35;
    }
    @media (min-width: 760px) {
      .metrics {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    @keyframes rise-in {
      from { transform: translateY(8px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  </style>
</head>
<body>
  <main class="page">
    <header class="hero">
      <h1>Journey Test Report</h1>
      <p class="meta">Generated at ${escapeHtml(summary.generatedAt)}</p>
    </header>

    <section class="summary">
      <div class="summary-top">
        <strong>Run Summary</strong>
        <span class="pass-rate">${escapeHtml(passRate)}% pass rate</span>
      </div>
      <div class="stack" aria-label="Scenario status distribution">
        <span class="seg passed"></span>
        <span class="seg failed"></span>
        <span class="seg skipped"></span>
        <span class="seg unknown"></span>
      </div>
      <div class="metrics">
        ${cards}
      </div>
    </section>

    <section class="failures">
      <h2>Failures</h2>
      ${failures}
    </section>
  </main>
</body>
</html>`
}

const features = readReportJson()
const summary = summarise(features)

fs.rmSync(reportDir, { recursive: true, force: true })
fs.mkdirSync(reportDir, { recursive: true })
fs.writeFileSync(
  path.join(reportDir, 'summary.json'),
  JSON.stringify(summary, null, 2)
)
fs.writeFileSync(reportPath, renderHtml(summary))

// eslint-disable-next-line no-console
console.log(`[report] generated ${reportPath}`)
