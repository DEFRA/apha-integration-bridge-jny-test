// wdio.local.conf.js
import merge from 'deepmerge'
import { config as base } from './wdio.conf.js'
import allure from 'allure-commandline'

const debug = !!process.env.DEBUG
const oneMinute = 60 * 1000

const resolvedTag =
  (process.env.CUCUMBER_TAGS &&
    process.env.CUCUMBER_TAGS.trim().replace(/^@?/, '')) ||
  (process.env.ENV_NAME && process.env.ENV_NAME.trim()) ||
  (process.env.ENVIRONMENT && process.env.ENVIRONMENT.trim()) ||
  'dev'

export const cucumberTag = resolvedTag

const overwriteArrayMerge = (_dst, src) => src
const normalizeReporters = (rpts) =>
  Array.isArray(rpts)
    ? rpts.map((r) =>
        Array.isArray(r) && r.length === 1 && typeof r[0] === 'string'
          ? r[0]
          : r
      )
    : rpts

const overrides = {
  isLocal: true,
  injectGlobals: false,

  exclude: [],

  automationProtocol: 'webdriver',

  maxInstances: 1,

  capabilities: debug
    ? [{ browserName: 'chrome' }]
    : [
        {
          maxInstances: 1,
          browserName: 'chrome',
          'goog:chromeOptions': {
            args: [
              '--headless',
              '--no-sandbox',
              '--disable-infobars',
              '--disable-gpu',
              '--window-size=1920,1080'
            ]
          }
        }
      ],

  cucumberOpts: {
    ...(base.cucumberOpts || {}),
    tags: [`@${cucumberTag}`]
  },

  reporters: normalizeReporters(base.reporters),

  onComplete(exitCode, config, capabilities, results) {
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
        resolve()
      })
    })
  }
}

const merged = merge(base, overrides, { arrayMerge: overwriteArrayMerge })

delete merged.hostname
delete merged.port
delete merged.path
delete merged.protocol

if (!merged.baseUrl || /\.undefined\./.test(String(merged.baseUrl))) {
  merged.baseUrl = 'https://apha-integration-bridge.api.dev.cdp-int.defra.cloud'
}

export const config = merged
