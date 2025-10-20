// wdio.conf.js (ESM)
import fs from 'node:fs'
import { URL } from 'node:url'
import allure from 'allure-commandline'
import testConfig from './config/config.js'

// ---- Environment & flags ----------------------------------------------------
const envName = process.env.environment ?? process.env.ENVIRONMENT ?? 'dev' // default to 'dev'
export const cucumberTag = envName

const debug = !!process.env.DEBUG

// ---- Base URL ---------------------------------------------------------------
const baseUrl = `https://apha-integration-bridge.api.${envName}.cdp-int.defra.cloud`

// ---- Specs selection --------------------------------------------------------
// If a per-env folder exists (e.g. ./test/features/dev), use it. Otherwise, run all.
const perEnvSpecsDir = `./test/features/${envName}`
const specs = fs.existsSync(perEnvSpecsDir)
  ? [`${perEnvSpecsDir}/*.feature`]
  : ['./test/features/**/*.feature']

// ---- Proxy (Chrome) ---------------------------------------------------------
let chromeProxyConfig = {}
if (process.env.HTTP_PROXY) {
  const url = new URL(process.env.HTTP_PROXY)
  const hostPort = url.port ? `${url.hostname}:${url.port}` : url.hostname
  chromeProxyConfig = {
    proxy: {
      proxyType: 'manual',
      httpProxy: hostPort,
      sslProxy: hostPort
    }
  }
}

// ---- Capabilities -----------------------------------------------------------
const headlessArgs = [
  '--no-sandbox',
  '--disable-infobars',
  '--headless',
  '--disable-gpu',
  '--window-size=1920,1080',
  '--enable-features=NetworkService,NetworkServiceInProcess',
  '--password-store=basic',
  '--use-mock-keychain',
  '--dns-prefetch-disable',
  '--disable-background-networking',
  '--disable-remote-fonts',
  '--ignore-certificate-errors',
  '--disable-dev-shm-usage'
]

const capabilities = debug
  ? [
      {
        browserName: 'chrome'
      }
    ]
  : [
      {
        ...chromeProxyConfig,
        browserName: 'chrome',
        'goog:chromeOptions': {
          args: headlessArgs
        },
        maxInstances: 1
      }
    ]

// ---- Config -----------------------------------------------------------------
export const config = {
  runner: 'local',
  headless: !debug,

  // Base URL & WD
  baseUrl,
  hostname: process.env.CHROMEDRIVER_URL || '127.0.0.1',
  port: Number(process.env.CHROMEDRIVER_PORT || 4444),

  // Specs & Cucumber
  specs,
  exclude: [],
  maxInstances: 1,
  framework: 'cucumber',
  cucumberOpts: {
    require: ['./test/step-definitions/*.js'],
    format: ['pretty', 'progress', 'summary'],
    tags: [`@${cucumberTag}`],
    timeout: 60_000
  },

  // Caps
  capabilities,

  // Logging / timeouts
  logLevel: testConfig.logLevel,
  logLevels: {
    webdriver: 'error'
  },
  bail: testConfig.bail,
  waitforTimeout: testConfig.waitForTimeout,
  waitforInterval: testConfig.waitforInterval,
  connectionRetryTimeout: testConfig.connectionRetryTimeout,
  connectionRetryCount: testConfig.connectionRetryCount,

  services: [['chromedriver', {}]],
  // Reporters
  reporters: [
    'spec',
    [
      'allure',
      {
        outputDir: 'allure-results',
        disableWebdriverStepsReporting: true,
        disableWebdriverScreenshotsReporting: true,
        useCucumberStepReporter: true
      }
    ]
  ],

  afterTest: async function (_test, _context, { error }) {
    if (error) {
      await browser.takeScreenshot()
    }
  },

  onComplete: function (_exitCode, _config, _capabilities, results) {
    if (results?.failed && results.failed > 0) {
      fs.writeFileSync('FAILED', JSON.stringify(results))
    }

    const reportError = new Error('Could not generate Allure report')
    const proc = allure([
      'generate',
      'allure-results',
      '--clean',
      '--name',
      `APHA-Test-Results-on-environment-${cucumberTag}`
    ])

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(reportError), 60 * 1000)
      proc.on('exit', (code) => {
        clearTimeout(timeout)
        if (code !== 0) return reject(reportError)
        resolve()
      })
    })
  }
}
