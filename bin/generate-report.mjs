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
    const scenarios = (Array.isArray(feature?.elements) ? feature.elements : []).filter(
      isScenarioElement
    )

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
        error: firstFailed?.result?.error_message || 'No failure message provided'
      })
    }
  }

  return summary
}

function renderHtml(summary) {
  const rows = [
    ['Features', summary.totals.features],
    ['Scenarios', summary.totals.scenarios],
    ['Passed', summary.totals.passed],
    ['Failed', summary.totals.failed],
    ['Skipped', summary.totals.skipped],
    ['Unknown', summary.totals.unknown]
  ]
    .map(
      ([label, value]) =>
        `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`
    )
    .join('\n')

  const failures =
    summary.failedScenarios.length === 0
      ? '<p>No failed scenarios.</p>'
      : summary.failedScenarios
          .map(
            (item) =>
              `<article>
  <h3>${escapeHtml(item.feature)} :: ${escapeHtml(item.scenario)}</h3>
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
    body { font-family: Helvetica, Arial, sans-serif; margin: 2rem; color: #1f2937; }
    h1 { margin: 0 0 0.5rem; }
    table { border-collapse: collapse; margin: 1rem 0 2rem; min-width: 320px; }
    th, td { border: 1px solid #d1d5db; padding: 0.5rem 0.75rem; text-align: left; }
    th { background: #f3f4f6; width: 180px; }
    article { border: 1px solid #ef4444; border-radius: 6px; padding: 0.75rem; margin: 0 0 1rem; background: #fef2f2; }
    pre { white-space: pre-wrap; overflow-wrap: anywhere; margin: 0.5rem 0 0; }
    .meta { color: #6b7280; font-size: 0.9rem; }
  </style>
</head>
<body>
  <h1>Journey Test Report</h1>
  <p class="meta">Generated at ${escapeHtml(summary.generatedAt)}</p>
  <table>
    <tbody>
      ${rows}
    </tbody>
  </table>
  <h2>Failures</h2>
  ${failures}
</body>
</html>`
}

const features = readReportJson()
const summary = summarise(features)

fs.rmSync(reportDir, { recursive: true, force: true })
fs.mkdirSync(reportDir, { recursive: true })
fs.writeFileSync(path.join(reportDir, 'summary.json'), JSON.stringify(summary, null, 2))
fs.writeFileSync(reportPath, renderHtml(summary))

console.log(`[report] generated ${reportPath}`)
