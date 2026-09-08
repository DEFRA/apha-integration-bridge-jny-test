import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {
  collectSummaryFromJson,
  normaliseTags,
  parseRunnerArgs,
  pickEnvironment,
  resolveFeatureTargets
} from '../../bin/run-cucumber.mjs'

test('runner arguments separate the environment from Cucumber arguments', () => {
  assert.deepEqual(parseRunnerArgs(['--env=test', '--name', 'matching']), {
    envNameOverride: 'test',
    cucumberArgs: ['--name', 'matching']
  })
})

test('environment selection follows documented precedence', () => {
  const environment = {
    ENV_NAME: 'test',
    environment: 'prod',
    ENVIRONMENT: 'perf-test',
    npm_config_environment: 'local'
  }

  assert.equal(pickEnvironment('', environment), 'test')
  assert.equal(pickEnvironment('dev', environment), 'dev')
  assert.equal(pickEnvironment('', {}), 'dev')
})

test('unsupported environments are rejected', () => {
  assert.throws(
    () => pickEnvironment('staging', {}),
    /Unsupported environment "staging"/
  )
})

test('ext-test is a supported environment', () => {
  assert.equal(pickEnvironment('ext-test', {}), 'ext-test')
  assert.equal(
    normaliseTags('', 'ext-test'),
    '(@ext-test) and not (@requires-pii-authorised-client or @requires-stable-environment-data)'
  )
  assert.equal(
    normaliseTags('@ext-test and @smoke', 'ext-test'),
    '(@ext-test and @smoke) and not (@requires-pii-authorised-client or @requires-stable-environment-data)'
  )
})

test('tags default to the selected environment and preserve expressions', () => {
  assert.equal(normaliseTags('', 'dev'), '@dev')
  assert.equal(normaliseTags('test', 'dev'), '@test')
  assert.equal(normaliseTags('@dev and not @wip', 'dev'), '@dev and not @wip')
})

test('stable case creation runs by default while optional case-management features require explicit enabling', () => {
  const defaults = resolveFeatureTargets('dev', [], {})
  const enabled = resolveFeatureTargets('dev', [], {
    CASE_MANAGEMENT_ENABLED: 'true'
  })

  assert.equal(
    defaults.includes('test/features/common/case-create.feature'),
    true
  )
  assert.equal(defaults.includes('test/features/common/case.feature'), false)
  assert.equal(
    defaults.includes('test/features/common/users-find-by-email.feature'),
    false
  )
  assert.equal(enabled.includes('test/features/common/case.feature'), true)
})

test('feature include and exclude overrides are combined', () => {
  const targets = resolveFeatureTargets('dev', [], {
    CUCUMBER_FEATURES:
      'test/features/common/workorders.feature,test/features/common/cph.feature',
    CUCUMBER_EXCLUDE_FEATURES: 'test/features/common/cph.feature'
  })

  assert.deepEqual(targets, ['test/features/common/workorders.feature'])
})

test('JSON summary treats mixed passed and skipped steps as skipped', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'journey-summary-'))
  const report = path.join(directory, 'report.json')
  fs.writeFileSync(
    report,
    JSON.stringify([
      {
        elements: [
          {
            type: 'scenario',
            steps: [
              { result: { status: 'passed' } },
              { result: { status: 'skipped' } }
            ]
          }
        ]
      }
    ])
  )

  assert.deepEqual(collectSummaryFromJson(report).scenarioCounts, {
    total: 1,
    passed: 0,
    failed: 0,
    skipped: 1
  })
})
