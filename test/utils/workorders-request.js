import axios from 'axios'

import { cfg, makeUri } from '../../config/properties.js'
import { token, strProcessor } from './token.js'
import { resolveScenarioString } from './scenario-data.js'

const baseUrl = cfg.baseUrl
const { tokenUrl, clientId, clientSecret: secretId } = cfg.cognito

export const resolveWorkordersArg = (raw) =>
  resolveScenarioString(strProcessor(raw))

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

function buildSearchParams(params) {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        searchParams.append(key, item)
      }
      continue
    }

    if (value !== undefined) {
      searchParams.append(key, value)
    }
  }

  return searchParams
}

export async function sendWorkordersGetRequest({
  world,
  endpt,
  page,
  pageSize,
  startDate,
  endDate,
  startUpdatedDate,
  endUpdatedDate,
  country,
  status,
  tokenMode = 'valid'
}) {
  const endpoint = resolveWorkordersArg(endpt)
  const cachedToken =
    world.tokenGen || (await token(tokenUrl, clientId, secretId))
  let tokenGen = cachedToken

  if (tokenMode === 'invalid') {
    tokenGen = 'sss'
  } else if (tokenMode === 'tampered') {
    tokenGen = `${cachedToken}a`
  }

  const query = {
    page: resolveWorkordersArg(page),
    pageSize: resolveWorkordersArg(pageSize)
  }

  if (startDate !== undefined) {
    query.startActivationDate = resolveWorkordersArg(startDate)
  }
  if (endDate !== undefined) {
    query.endActivationDate = resolveWorkordersArg(endDate)
  }
  if (startUpdatedDate !== undefined) {
    query.startUpdatedDate = resolveWorkordersArg(startUpdatedDate)
  }
  if (endUpdatedDate !== undefined) {
    query.endUpdatedDate = resolveWorkordersArg(endUpdatedDate)
  }
  if (Array.isArray(country)) {
    query.country = country.map(resolveWorkordersArg)
  } else if (country !== undefined) {
    query.country = resolveWorkordersArg(country)
  }
  if (status !== undefined) {
    query.status = resolveWorkordersArg(status)
  }

  const uri = makeUri(baseUrl, endpoint, '')

  try {
    world.response = await axios.get(uri, {
      params: buildSearchParams(query),
      headers: {
        Authorization: `Bearer ${tokenGen}`,
        Accept: 'application/json'
      }
    })
  } catch (error) {
    world.response = toResponseLike(error, uri)
  }

  world.endpoint = endpoint
  world.query = query
  world.tokenGen = tokenGen
}
