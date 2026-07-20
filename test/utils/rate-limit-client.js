import axios from 'axios'

import { cfg, makeUri } from '../../config/properties.js'
import { token } from './token.js'
import { resolveFindStringArg, resolveFindValueArg } from './find-request.js'

const { tokenUrl } = cfg.cognito

function envPrefix() {
  return cfg.envName.toUpperCase().replaceAll('-', '_')
}

function credentialEnvNames(clientName) {
  const prefix = envPrefix()
  return {
    clientId: [`${prefix}_${clientName}_CLIENT_ID`, `${clientName}_CLIENT_ID`],
    clientSecret: [
      `${prefix}_${clientName}_CLIENT_SECRET`,
      `${clientName}_CLIENT_SECRET`
    ]
  }
}

function firstEnvValue(names) {
  for (const name of names) {
    const value = String(process.env[name] || '').trim()
    if (value) return value
  }
  return ''
}

function credentialsFor(clientName) {
  const names = credentialEnvNames(clientName)
  const clientId = firstEnvValue(names.clientId)
  const clientSecret = firstEnvValue(names.clientSecret)

  if (!clientId || !clientSecret) {
    throw new Error(
      `Missing ${clientName} credentials. Set ${names.clientId[0]}/${names.clientSecret[0]} or ${names.clientId[1]}/${names.clientSecret[1]}.`
    )
  }

  return { clientId, clientSecret }
}

async function tokenFor(world, clientName) {
  world.rateLimitTokens = world.rateLimitTokens || {}
  world.rateLimitTokens[clientName] =
    world.rateLimitTokens[clientName] ||
    (await token(
      tokenUrl,
      credentialsFor(clientName).clientId,
      credentialsFor(clientName).clientSecret
    ))

  return world.rateLimitTokens[clientName]
}

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

export function maxRateLimitAttempts() {
  return Number(process.env.RATE_LIMIT_MAX_ATTEMPTS || 25)
}

export function expectedRateLimitHeaderValue() {
  return String(process.env.RATE_LIMIT_EXPECTED_LIMIT || '').trim()
}

export async function sendRateLimitFindRequest({
  world,
  clientName,
  endpt,
  ids
}) {
  const endpoint = resolveFindStringArg(endpt)
  const uri = makeUri(cfg.baseUrl, endpoint, '')
  const accessToken = await tokenFor(world, clientName)

  try {
    return await axios.post(
      uri,
      { ids: resolveFindValueArg(ids) },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      }
    )
  } catch (error) {
    return toResponseLike(error, uri)
  }
}
