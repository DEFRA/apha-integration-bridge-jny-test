import merge from 'deepmerge'
import { config as base } from './wdio.conf.js'

const debug = !!process.env.DEBUG

export const cucumberTag = 'dev'

const overwriteArrayMerge = (_dst, src) => src

const overrides = {
  injectGlobals: false,

  specs: ['./test/features/dev/*.feature'],
  baseUrl: 'https://apha-integration-bridge.api.dev.cdp-int.defra.cloud',

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
    tags: ['@dev']
  }
}

const merged = merge(base, overrides, { arrayMerge: overwriteArrayMerge })

delete merged.hostname
delete merged.port
delete merged.path
delete merged.protocol

export const config = merged
