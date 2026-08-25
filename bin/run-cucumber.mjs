#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const CUCUMBER_BIN = 'node_modules/@cucumber/cucumber/bin/cucumber.js'
const CUCUMBER_JSON = 'allure-results/cucumber-report.json'
const LOADER_IMPORT =
  'data:text/javascript,import { register } from "node:module"; import { pathToFileURL } from "node:url"; register("esm-module-alias/loader", pathToFileURL("./"));'
const DEFAULT_FEATURE_ROOT = 'test/features'
export const SUPPORTED_ENVIRONMENTS = [
  'local',
  'dev',
  'test',
  'perf-test',
  'ext-test',
  'prod'
]
const CASE_MANAGEMENT_FEATURES = [
  'test/features/common/case.feature',
  'test/features/common/users-find-by-email.feature'
]

export function parseRunnerArgs(rawArgs) {
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

export function pickEnvironment(envNameOverride, environment = process.env) {
  const fromEnv = String(envNameOverride || '').trim()
    ? envNameOverride
    : environment.ENV_NAME ||
      environment.environment ||
      environment.ENVIRONMENT ||
      environment.npm_config_environment

  const envName = String(fromEnv || 'dev').trim()
  if (!SUPPORTED_ENVIRONMENTS.includes(envName)) {
    throw new Error(
      `Unsupported environment "${envName}". Expected one of: ${SUPPORTED_ENVIRONMENTS.join(', ')}.`
    )
  }
  return envName
}

export function normaliseTags(rawTags, envName) {
  const fallback = `@${envName}`
  const raw = String(rawTags || '').trim()
  let tags

  if (!raw) tags = fallback
  else if (raw.includes('@')) tags = raw
  else if (/\b(and|or|not)\b/i.test(raw)) tags = raw
  else if (/[()]/.test(raw)) tags = raw
  else tags = `@${raw}`

  return envName === 'ext-test'
    ? `(${tags}) and not (@requires-pii-authorised-client or @requires-stable-environment-data)`
    : tags
}

export function parseList(rawValue) {
  return String(rawValue || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function normaliseFilePath(filePath) {
  return filePath.replace(/\\/g, '/')
}

function listFeatureFiles(rootDir) {
  const featureFiles = []
  const entries = fs.readdirSync(rootDir, { withFileTypes: true })

  for (const entry of entries) {
    const resolvedPath = path.join(rootDir, entry.name)
    if (entry.isDirectory()) {
      featureFiles.push(...listFeatureFiles(resolvedPath))
      continue
    }

    if (entry.isFile() && entry.name.endsWith('.feature')) {
      featureFiles.push(normaliseFilePath(resolvedPath))
    }
  }

  return featureFiles.sort()
}

function splitFeatureTargets(rawArgs) {
  const featureTargets = []
  const passthroughArgs = []

  for (const arg of rawArgs) {
    if (arg.includes('.feature')) {
      featureTargets.push(arg)
      continue
    }

    passthroughArgs.push(arg)
  }

  return { featureTargets, passthroughArgs }
}

export function resolveFeatureTargets(
  envName,
  explicitFeatureTargets,
  environment = process.env
) {
  if (explicitFeatureTargets.length > 0) {
    return explicitFeatureTargets
  }

  const includeOverride = parseList(environment.CUCUMBER_FEATURES)
  const excludeOverride = new Set(
    parseList(environment.CUCUMBER_EXCLUDE_FEATURES).map(normaliseFilePath)
  )

  if (includeOverride.length > 0) {
    return includeOverride.filter(
      (featurePath) => !excludeOverride.has(normaliseFilePath(featurePath))
    )
  }

  const caseManagementEnabled = environment.CASE_MANAGEMENT_ENABLED === 'true'
  const envExclusions = caseManagementEnabled ? [] : CASE_MANAGEMENT_FEATURES
  const excludedFeatures = new Set(
    [...envExclusions, ...excludeOverride].map(normaliseFilePath)
  )

  return listFeatureFiles(DEFAULT_FEATURE_ROOT).filter(
    (featurePath) => !excludedFeatures.has(featurePath)
  )
}

export function collectSummaryFromJson(pathToReport) {
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

export function runCucumber(rawArgs = process.argv.slice(2)) {
  fs.rmSync('FAILED', { force: true })

  const { envNameOverride, cucumberArgs } = parseRunnerArgs(rawArgs)
  const envName = pickEnvironment(envNameOverride)
  const tags = normaliseTags(process.env.CUCUMBER_TAGS, envName)
  const {
    featureTargets: explicitFeatureTargets,
    passthroughArgs: cucumberPassthroughArgs
  } = splitFeatureTargets(cucumberArgs)
  const featureTargets = resolveFeatureTargets(envName, explicitFeatureTargets)

  if (featureTargets.length === 0) {
    throw new Error('No feature files were selected for this test run.')
  }

  const missingTargets = featureTargets.filter(
    (target) => !fs.existsSync(target)
  )
  if (missingTargets.length > 0) {
    throw new Error(`Feature files not found: ${missingTargets.join(', ')}`)
  }

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
    ...featureTargets,
    ...cucumberPassthroughArgs
  ]

  const run = spawnSync('node', args, {
    stdio: 'inherit',
    env: { ...process.env, ENV_NAME: envName }
  })

  const summary = collectSummaryFromJson(CUCUMBER_JSON)
  const noScenarios = summary?.scenarioCounts.total === 0
  const status = noScenarios ? 1 : (run.status ?? 1)
  printFriendlySummary(CUCUMBER_JSON)

  if (noScenarios) {
    process.stderr.write(
      '[runner] No scenarios matched the selected features and tags.\n'
    )
  }

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

  return status
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.exit(runCucumber())
  } catch (error) {
    process.stderr.write(`[runner] ${error.message}\n`)
    process.exit(1)
  }
}
