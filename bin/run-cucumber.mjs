#!/usr/bin/env node

import fs from 'node:fs'
import { spawnSync } from 'node:child_process'

const CUCUMBER_BIN = 'node_modules/@cucumber/cucumber/bin/cucumber.js'
const CUCUMBER_JSON = 'allure-results/cucumber-report.json'
const LOADER_IMPORT =
  'data:text/javascript,import { register } from "node:module"; import { pathToFileURL } from "node:url"; register("esm-module-alias/loader", pathToFileURL("./"));'

function pickEnvironment() {
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

const envName = pickEnvironment()
const tags = normaliseTags(process.env.CUCUMBER_TAGS, envName)
const nodeMajorVersion = Number.parseInt(process.versions.node.split('.')[0], 10)

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
  'summary',
  '--format',
  `json:${CUCUMBER_JSON}`,
  '--tags',
  tags,
  'test/features/**/*.feature',
  ...process.argv.slice(2)
]

const run = spawnSync('node', args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    ENV_NAME: process.env.ENV_NAME || envName
  }
})

const status = run.status ?? 1

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
