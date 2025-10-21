import merge from 'deepmerge'
import { config as base } from './wdio.conf.js'

export const cucumberTag = 'prod'

const overwriteArrayMerge = (_dst, src) => src

const overrides = {
  baseUrl: 'https://apha-integration-bridge.api.prod.cdp-int.defra.cloud',
  automationProtocol: 'webdriver',
  maxInstances: 1
}

const merged = merge(base, overrides, { arrayMerge: overwriteArrayMerge })

delete merged.hostname
delete merged.port
delete merged.path
delete merged.protocol

export const config = merged
