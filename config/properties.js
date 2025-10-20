import local from './env/local.js'
import dev from './env/dev.js'
import testEnv from './env/test.js'
import perfTest from './env/perf-test.js'
import prod from './env/prod.js'

const ENV_DEFAULT = 'dev'
const COGNITO_REGION = 'eu-west-2'
const COGNITO_BASE = `auth.${COGNITO_REGION}.amazoncognito.com`

const pickEnvConfig = (name) => {
  const map = {
    local,
    dev,
    test: testEnv,
    'perf-test': perfTest,
    prod
  }
  return map[name] || map[ENV_DEFAULT]
}

const normaliseBaseUrl = (raw) => {
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

const buildTokenUrl = ({ tokenEnv }) => {
  const override =
    process.env.COGNITO_DOMAIN && String(process.env.COGNITO_DOMAIN).trim()
  if (override) {
    const url = new URL(override)
    return `${url.origin}`
  }
  return tokenEnv
    ? `https://apha-integration-bridge-${tokenEnv}.${COGNITO_BASE}`
    : `https://apha-integration-bridge.${COGNITO_BASE}`
}

// Safe URI builder for API paths
export const makeUri = (base, ...segments) => {
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
    const wdioCfg = global.browser?.config ?? {}

    // Determine env name priority: ENV_NAME > WDIO cucumberTag > default
    const envName =
      (process.env.ENV_NAME && String(process.env.ENV_NAME)) ||
      (wdioCfg.cucumberTag && String(wdioCfg.cucumberTag)) ||
      ENV_DEFAULT

    const picked = pickEnvConfig(envName)

    // Base URL priority: env file > WDIO > env var
    const baseUrl = normaliseBaseUrl(
      picked.baseUrl ?? wdioCfg.baseUrl ?? process.env.BASE_URL
    )
    if (!baseUrl) {
      throw new Error(
        'Missing baseUrl. Set it in your env file, WDIO config.baseUrl, or BASE_URL env.'
      )
    }

    // Allow overrides via CI
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

    this.config = {
      envName,
      isLocal: Boolean(wdioCfg.isLocal ?? process.env.IS_LOCAL === 'true'),
      baseUrl,
      cognito: {
        tokenEnv: picked.tokenEnv ?? '',
        tokenUrl: buildTokenUrl(picked),
        clientId,
        clientSecret
      }
    }
  }

  getConfig = () => this.config
}

const properties = new Properties()
export const cfg = properties.getConfig()
export { properties }
