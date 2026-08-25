import assert from 'node:assert/strict'
import test from 'node:test'

import { deriveScenarioStatus, summarise } from '../../bin/generate-report.mjs'

const steps = (...statuses) =>
  statuses.map((status) => ({ result: { status } }))

test('scenario status uses the strictest step result', () => {
  assert.equal(deriveScenarioStatus(steps('passed', 'failed')), 'failed')
  assert.equal(deriveScenarioStatus(steps('passed', 'skipped')), 'skipped')
  assert.equal(deriveScenarioStatus(steps('passed', 'undefined')), 'skipped')
  assert.equal(deriveScenarioStatus(steps('passed', 'pending')), 'skipped')
  assert.equal(deriveScenarioStatus(steps('passed', 'ambiguous')), 'skipped')
  assert.equal(deriveScenarioStatus(steps('passed', 'passed')), 'passed')
  assert.equal(deriveScenarioStatus([]), 'unknown')
})

test('report summary counts each scenario status consistently', () => {
  const summary = summarise([
    {
      name: 'Example feature',
      elements: [
        { type: 'scenario', name: 'passes', steps: steps('passed') },
        { type: 'scenario', name: 'skips', steps: steps('passed', 'skipped') },
        { type: 'scenario', name: 'unknown', steps: [] },
        { type: 'scenario', name: 'fails', steps: steps('failed') }
      ]
    }
  ])

  assert.deepEqual(summary.totals, {
    features: 1,
    scenarios: 4,
    passed: 1,
    failed: 1,
    skipped: 1,
    unknown: 1
  })
  assert.equal(summary.failedScenarios.length, 1)
})
