import merge from 'deepmerge'

import { cfg } from '../../config/properties.js'
import base from '../data/scenario-values/base.js'
import dev from '../data/scenario-values/dev.js'
import test from '../data/scenario-values/test.js'
import perfTest from '../data/scenario-values/perf-test.js'
import prod from '../data/scenario-values/prod.js'
import local from '../data/scenario-values/local.js'

const envValues = {
  local,
  dev,
  test,
  'perf-test': perfTest,
  prod
}

const activeEnv = cfg.envName || 'dev'
const overwriteArrayMerge = (_dst, src) => src

const scenarioValues = merge(base, envValues[activeEnv] || {}, {
  arrayMerge: overwriteArrayMerge
})

const tokenPattern = /^\{\{\s*([^{}]+?)\s*\}\}$/

function getByPath(data, path) {
  return path
    .split('.')
    .reduce(
      (acc, key) => (acc !== undefined && acc !== null ? acc[key] : undefined),
      data
    )
}

function cloneValue(value) {
  if (value && typeof value === 'object') {
    return structuredClone(value)
  }
  return value
}

export function getScenarioValue(path) {
  const value = getByPath(scenarioValues, path)

  if (value === undefined) {
    throw new Error(
      `Missing scenario value for key "${path}" in environment "${activeEnv}"`
    )
  }

  return cloneValue(value)
}

export function resolveScenarioValue(rawValue) {
  const raw = String(rawValue ?? '')
  const match = raw.match(tokenPattern)

  if (!match) return rawValue

  return getScenarioValue(match[1])
}

export function resolveScenarioString(rawValue) {
  const resolved = resolveScenarioValue(rawValue)
  return typeof resolved === 'string' ? resolved : String(resolved)
}
