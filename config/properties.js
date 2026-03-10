import local from './env/local.js'
import dev from './env/dev.js'
import testEnv from './env/test.js'
import perfTest from './env/perf-test.js'
import prod from './env/prod.js'

const ENV_DEFAULT = 'dev'
const COGNITO_REGION = 'eu-west-2'
const COGNITO_BASE = `auth.${COGNITO_REGION}.amazoncognito.com`
const SECRET_ENV_BY_ENV = {
  dev: 'DEV_SECRET',
  test: 'TEST_SECRET',
  'perf-test': 'PERF_SECRET',
  prod: 'PROD_SECRET'
}

function pickEnvConfig(name) {
  const map = {
    local,
    dev,
    test: testEnv,
    'perf-test': perfTest,
    prod
  }
  return map[name] || map[ENV_DEFAULT]
}

function normaliseBaseUrl(raw) {
  const s = String(raw ?? '').trim()
  if (!s) return ''
  let u
  try {
    u = new URL(s)
  } catch {
    throw new Error(
      `Invalid baseUrl "${s}". It must be an absolute URL incl. protocol, e.g. "http://localhost:9000".`
    )
  }
  u.pathname = u.pathname.replace(/\/+$/, '')
  return u.toString()
}

function buildTokenUrl({ tokenEnv }) {
  const override =
    process.env.COGNITO_DOMAIN && String(process.env.COGNITO_DOMAIN).trim()
  if (override) {
    const url = new URL(override)
    return `${url.origin}`
  }
  if (tokenEnv) {
    return `https://apha-integration-bridge-${tokenEnv}.${COGNITO_BASE}`
  }
  return `https://apha-integration-bridge.${COGNITO_BASE}`
}

function isUnsetOrPlaceholder(value) {
  const cleaned = String(value ?? '').trim()
  return !cleaned || /^REPLACE_ME/i.test(cleaned)
}

export function makeUri(base, ...segments) {
  const clean = segments
    .filter((s) => s !== undefined && s !== null)
    .map((s) => String(s).trim())
    .filter((s) => s.length > 0)
    .join('/')
  const rel = clean.length ? `/${clean}` : '/'
  return new URL(rel, base).toString()
}

class Properties {
  constructor() {
    // Determine env name
    const envName = String(
      process.env.ENV_NAME ||
        process.env.environment ||
        process.env.ENVIRONMENT ||
        ENV_DEFAULT
    ).trim()

    const picked = pickEnvConfig(envName)

    // Choose baseUrl with priority: BASE_URL override -> env file
    const baseUrlCandidate = process.env.BASE_URL || picked.baseUrl

    const baseUrl = normaliseBaseUrl(baseUrlCandidate)
    if (!baseUrl) {
      throw new Error(
        'Missing baseUrl. Set it in your env file or BASE_URL env variable.'
      )
    }

    const clientId = (
      process.env.COGNITO_CLIENT_ID ||
      picked.clientId ||
      ''
    ).trim()
    const clientSecret = (
      process.env.COGNITO_CLIENT_SECRET ||
      picked.clientSecret ||
      ''
    ).trim()
    const expectedSecretEnv = SECRET_ENV_BY_ENV[envName]

    if (isUnsetOrPlaceholder(clientId)) {
      throw new Error(
        `[config] Missing Cognito client ID for "${envName}". Set COGNITO_CLIENT_ID or update config/env/${picked.name}.js`
      )
    }

    if (isUnsetOrPlaceholder(clientSecret)) {
      const expectedSecretHint = expectedSecretEnv
        ? ` or ${expectedSecretEnv}`
        : ''
      throw new Error(
        `[config] Missing Cognito client secret for "${envName}". Set COGNITO_CLIENT_SECRET${expectedSecretHint}.`
      )
    }

    const tokenUrl = buildTokenUrl(picked)

    this.config = {
      envName,
      isLocal: /^(1|true|yes)$/i.test(
        String(process.env.IS_LOCAL || '').trim()
      ),
      baseUrl,
      cognito: {
        tokenEnv: picked.tokenEnv ?? '',
        tokenUrl,
        clientId,
        clientSecret
      }
    }
  }

  getConfig() {
    return this.config
  }
}

const properties = new Properties()
export const cfg = properties.getConfig()
export { properties }
