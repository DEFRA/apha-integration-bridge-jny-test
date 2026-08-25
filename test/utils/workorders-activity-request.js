import axios from 'axios'

import { cfg, makeUri } from '../../config/properties.js'
import { resolveScenarioString, resolveScenarioValue } from './scenario-data.js'
import { strProcessor, token } from './token.js'

const baseUrl = cfg.baseUrl
const { tokenUrl, clientId, clientSecret: secretId } = cfg.cognito
const writeClient = cfg.cognito.workordersWriteClient

function toResponseLike(error, uri) {
  if (error?.response) return error.response
  return {
    status: 0,
    data: {
      code: 'NETWORK_ERROR',
      message: error?.message || 'Network error with no HTTP response',
      uri
    }
  }
}

export async function sendWorkorderActivityPatchRequest({
  world,
  endpointArg,
  bodyArg,
  includeBody = true,
  tokenMode = 'valid'
}) {
  const endpoint = resolveScenarioString(strProcessor(endpointArg))
  const body = includeBody ? resolveScenarioValue(bodyArg) : undefined
  const cachedToken = writeClient
    ? world.workordersWriteToken ||
      (await token(tokenUrl, writeClient.clientId, writeClient.clientSecret))
    : world.tokenGen || (await token(tokenUrl, clientId, secretId))
  const tokenGen =
    tokenMode === 'invalid'
      ? 'sss'
      : tokenMode === 'tampered'
        ? `${cachedToken}a`
        : cachedToken
  const uri = makeUri(baseUrl, endpoint)

  try {
    world.response = await axios.patch(uri, body, {
      headers: {
        Authorization: `Bearer ${tokenGen}`,
        Accept: 'application/json',
        ...(includeBody ? { 'Content-Type': 'application/json' } : {})
      }
    })
  } catch (error) {
    world.response = toResponseLike(error, uri)
  }

  world.endpoint = endpoint
  world.tokenGen = tokenGen
  if (tokenMode === 'valid' && writeClient) {
    world.workordersWriteToken = tokenGen
  }
}
