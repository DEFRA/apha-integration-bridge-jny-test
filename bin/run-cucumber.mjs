#!/usr/bin/env node

import fs from 'node:fs'
import { spawnSync } from 'node:child_process'

const CUCUMBER_BIN = 'node_modules/@cucumber/cucumber/bin/cucumber.js'
const CUCUMBER_JSON = 'allure-results/cucumber-report.json'
const LOADER_IMPORT =
  'data:text/javascript,import { register } from "node:module"; import { pathToFileURL } from "node:url"; register("esm-module-alias/loader", pathToFileURL("./"));'

function parseRunnerArgs(rawArgs) {
  let envNameOverride = ''
  const cucumberArgs = []

  for (let i = 0; i < rawArgs.length; i += 1) {
    const arg = rawArgs[i]

    if (arg.startsWith('--env=')) {
      envNameOverride = arg.slice('--env='.length)
      continue
    }

    if (arg === '--env') {
      envNameOverride = rawArgs[i + 1] || ''
      i += 1
      continue
    }

    cucumberArgs.push(arg)
  }

  return { envNameOverride, cucumberArgs }
}

function pickEnvironment(envNameOverride) {
  if (String(envNameOverride || '').trim()) {
    return String(envNameOverride).trim()
  }

  const fromEnv =
    process.env.ENV_NAME ||
    process.env.environment ||
    process.env.ENVIRONMENT ||
    process.env.npm_config_environment

  return String(fromEnv || 'dev').trim()
}

function normaliseTags(rawTags, envName) {
  const fallback = `@${envName}`
  const raw = String(rawTags || '').trim()

  if (!raw) return fallback
  if (raw.includes('@')) return raw
  if (/\b(and|or|not)\b/i.test(raw)) return raw
  if (/[()]/.test(raw)) return raw

  return `@${raw}`
}

function collectSummaryFromJson(pathToReport) {
  if (!fs.existsSync(pathToReport)) return null

  const raw = fs.readFileSync(pathToReport, 'utf8').trim()
  if (!raw) return null

  const features = JSON.parse(raw)
  if (!Array.isArray(features)) return null

  const scenarioCounts = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }

  const stepCounts = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  }

  for (const feature of features) {
    const elements = Array.isArray(feature?.elements) ? feature.elements : []

    for (const element of elements) {
      const type = String(element?.type || '').toLowerCase()
      if (type !== 'scenario') continue

      const steps = Array.isArray(element?.steps) ? element.steps : []
      scenarioCounts.total += 1

      let hasFailedStep = false
      let hasNonPassedStep = false

      for (const step of steps) {
        const status = String(step?.result?.status || 'unknown').toLowerCase()
        stepCounts.total += 1

        if (status === 'passed') {
          stepCounts.passed += 1
          continue
        }

        hasNonPassedStep = true

        if (status === 'failed') {
          stepCounts.failed += 1
          hasFailedStep = true
        } else {
          stepCounts.skipped += 1
        }
      }

      if (hasFailedStep) {
        scenarioCounts.failed += 1
      } else if (hasNonPassedStep) {
        scenarioCounts.skipped += 1
      } else {
        scenarioCounts.passed += 1
      }
    }
  }

  return { scenarioCounts, stepCounts }
}

function printFriendlySummary(pathToReport) {
  try {
    const summary = collectSummaryFromJson(pathToReport)
    if (!summary) return

    const { scenarioCounts, stepCounts } = summary
    process.stdout.write('\n')
    process.stdout.write(
      `[summary] scenarios (test cases): ${scenarioCounts.passed}/${scenarioCounts.total} passed`
    )
    if (scenarioCounts.failed > 0) {
      process.stdout.write(`, ${scenarioCounts.failed} failed`)
    }
    if (scenarioCounts.skipped > 0) {
      process.stdout.write(`, ${scenarioCounts.skipped} skipped`)
    }
    process.stdout.write('\n')
    process.stdout.write(
      `[summary] steps (Given/When/Then lines): ${stepCounts.passed}/${stepCounts.total} passed`
    )
    if (stepCounts.failed > 0) {
      process.stdout.write(`, ${stepCounts.failed} failed`)
    }
    if (stepCounts.skipped > 0) {
      process.stdout.write(`, ${stepCounts.skipped} skipped`)
    }
    process.stdout.write('\n')
  } catch {
    // Keep test execution resilient if the summary report cannot be parsed.
  }
}

const { envNameOverride, cucumberArgs } = parseRunnerArgs(process.argv.slice(2))
const envName = pickEnvironment(envNameOverride)
const tags = normaliseTags(process.env.CUCUMBER_TAGS, envName)
const nodeMajorVersion = Number.parseInt(
  process.versions.node.split('.')[0],
  10
)

fs.mkdirSync('allure-results', { recursive: true })

const args = [
  ...(nodeMajorVersion >= 20
    ? ['--import', LOADER_IMPORT]
    : ['--loader', 'esm-module-alias/loader']),
  CUCUMBER_BIN,
  '--import',
  'test/step-definitions/*.js',
  '--format',
  'progress',
  '--format',
  `json:${CUCUMBER_JSON}`,
  '--tags',
  tags,
  'test/features/**/*.feature',
  ...cucumberArgs
]

const run = spawnSync('node', args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    ENV_NAME: process.env.ENV_NAME || envName
  }
})

const status = run.status ?? 1
printFriendlySummary(CUCUMBER_JSON)

if (status !== 0) {
  const failure = {
    status,
    envName,
    tags,
    command: `node ${args.join(' ')}`,
    timestamp: new Date().toISOString()
  }
  fs.writeFileSync('FAILED', JSON.stringify(failure))
}

process.exit(status)
