import axios from 'axios'

import { cfg, makeUri } from '../../config/properties.js'
import { token, strProcessor } from './token.js'
import { resolveScenarioString, resolveScenarioValue } from './scenario-data.js'
import { tokenForPiiAuthorisedClient } from './pii-authorisation.js'

const baseUrl = cfg.baseUrl
const { tokenUrl, clientId, clientSecret: secretId } = cfg.cognito

export const resolveFindStringArg = (raw) =>
  resolveScenarioString(strProcessor(raw))
export const resolveFindValueArg = (raw) => resolveScenarioValue(raw)

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

export async function sendFindPostRequest({
  world,
  endpt,
  body,
  page,
  pageSize,
  includeBody = true,
  usePiiAuthorisedClient = false,
  tokenMode = 'valid'
}) {
  const endpoint = resolveFindStringArg(endpt)
  const cachedToken = usePiiAuthorisedClient
    ? await tokenForPiiAuthorisedClient(world)
    : world.tokenGen || (await token(tokenUrl, clientId, secretId))

  let tokenGen = cachedToken
  if (tokenMode === 'invalid') {
    tokenGen = 'sss'
  } else if (tokenMode === 'tampered') {
    tokenGen = `${cachedToken}a`
  }

  const query = {}
  if (page !== undefined) {
    query.page = resolveFindStringArg(page)
  }
  if (pageSize !== undefined) {
    query.pageSize = resolveFindStringArg(pageSize)
  }

  const uri = makeUri(baseUrl, endpoint, '')
  const requestConfig = {
    method: 'post',
    url: uri,
    params: Object.keys(query).length > 0 ? query : undefined,
    headers: {
      Authorization: `Bearer ${tokenGen}`,
      Accept: 'application/json',
      ...(includeBody ? { 'Content-Type': 'application/json' } : {})
    },
    ...(includeBody ? { data: body } : {})
  }

  try {
    world.response = await axios.request(requestConfig)
  } catch (error) {
    world.response = toResponseLike(error, uri)
  }

  world.endpoint = endpoint
  world.query = query
  world.tokenGen = tokenGen
}
