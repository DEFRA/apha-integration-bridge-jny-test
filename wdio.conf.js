import fs from 'node:fs'
import testConfig from './config/config.js'
import allure from 'allure-commandline'

export const cucumberTag =
  process.env.environment || process.env.ENVIRONMENT || 'dev'

const oneMinute = 60 * 1000

let chromeProxyConfig = {}
if (process.env.HTTP_PROXY) {
  const url = new URL(process.env.HTTP_PROXY)
  chromeProxyConfig = {
    proxy: {
      proxyType: 'manual',
      httpProxy: `${url.host}:${url.port}`,
      sslProxy: `${url.host}:${url.port}`
    }
  }
}

export const config = {
  runner: 'local',
  headless: true,
  baseUrl: `https://apha-integration-bridge.api.${cucumberTag}.cdp-int.defra.cloud`,
  hostname: process.env.CHROMEDRIVER_URL || '127.0.0.1',
  port: process.env.CHROMEDRIVER_PORT || 4444,

  specs: ['./test/features/**/*.feature'],
  cucumberOpts: {
    require: ['./test/step-definitions/*.js'],
    format: ['pretty', 'progress', 'summary'],
    tags: [`@${cucumberTag}`],
    timeout: 60000
  },
  exclude: [],
  maxInstances: 1,

  capabilities: [
    {
      ...chromeProxyConfig,
      browserName: 'chrome',
      'goog:chromeOptions': {
        args: [
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
      }
    }
  ],

  logLevel: testConfig.logLevel,
  logLevels: { webdriver: 'error' },
  bail: testConfig.bail,
  waitforTimeout: testConfig.waitForTimeout,
  waitforInterval: testConfig.waitforInterval,
  connectionRetryTimeout: testConfig.connectionRetryTimeout,
  connectionRetryCount: testConfig.connectionRetryCount,
  framework: 'cucumber',
  execArgv: ['--loader', 'esm-module-alias/loader'],

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
    if (error) await browser.takeScreenshot()
  },

  onComplete: function (_exitCode, _config, _capabilities, results) {
    // Required for portal status
    if (results?.failed && results.failed > 0) {
      fs.writeFileSync('FAILED', JSON.stringify(results))
    }

    // Generate Allure site only if there are results
    if (!fs.existsSync('allure-results')) {
      console.log('[allure] skip: allure-results/ not found')
      return
    }

    const reportError = new Error('Could not generate Allure report')
    const generation = allure([
      'generate',
      'allure-results',
      '--clean',
      '--name',
      `APHA-Test-Results-on-environment-${cucumberTag}`
    ])

    return new Promise((resolve, reject) => {
      const generationTimeout = setTimeout(() => reject(reportError), oneMinute)
      generation.on('exit', (code) => {
        clearTimeout(generationTimeout)
        if (code !== 0) return reject(reportError)
        console.log('[allure] report generated -> allure-report/')
        resolve()
      })
    })
  }
}
