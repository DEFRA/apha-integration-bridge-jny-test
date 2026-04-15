import { Given, Then } from '@cucumber/cucumber'
import axios from 'axios'
import { expect } from 'chai'

import { cfg, makeUri } from '../../config/properties.js'
import {
  resolveScenarioString,
  resolveScenarioValue
} from '../utils/scenario-data.js'
import { token, strProcessor } from '../utils/token.js'

const baseUrl = cfg.baseUrl
const { tokenUrl, clientId, clientSecret: secretId } = cfg.cognito

const resolveStringArg = (raw) => resolveScenarioString(strProcessor(raw))
const resolveValueArg = (raw) => resolveScenarioValue(raw)

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

function encodeJwtPart(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

function cognitoShapedJwtThatIsNotSignedByCognito() {
  const now = Math.floor(Date.now() / 1000)
  const header = {
    alg: 'RS256',
    kid: 'journey-test-key-not-in-cognito-jwks',
    typ: 'JWT'
  }
  const payload = {
    client_id: clientId,
    exp: now + 300,
    iat: now,
    iss: 'https://cognito-idp.eu-west-2.amazonaws.com/journey-test',
    scope: 'journey-test.invalid-scope',
    token_use: 'access'
  }

  return `${encodeJwtPart(header)}.${encodeJwtPart(payload)}.invalid-signature`
}

async function insufficientScopeToken() {
  const insufficientScopeClientId = String(
    process.env.COGNITO_INSUFFICIENT_SCOPE_CLIENT_ID || ''
  ).trim()
  const insufficientScopeClientSecret = String(
    process.env.COGNITO_INSUFFICIENT_SCOPE_CLIENT_SECRET || ''
  ).trim()
  const insufficientScope = String(
    process.env.COGNITO_INSUFFICIENT_SCOPE || ''
  ).trim()

  if (!insufficientScopeClientId || !insufficientScopeClientSecret) {
    throw new Error(
      'Set COGNITO_INSUFFICIENT_SCOPE_CLIENT_ID and COGNITO_INSUFFICIENT_SCOPE_CLIENT_SECRET to run the @auth-scope scenario.'
    )
  }

  return token(
    tokenUrl,
    insufficientScopeClientId,
    insufficientScopeClientSecret,
    {
      scope: insufficientScope || undefined
    }
  )
}

function expiredCognitoToken() {
  const expiredToken = String(
    process.env.COGNITO_EXPIRED_ACCESS_TOKEN || ''
  ).trim()

  if (!expiredToken) {
    throw new Error(
      'Set COGNITO_EXPIRED_ACCESS_TOKEN to run the @auth-expired scenario.'
    )
  }

  return expiredToken
}

function errorMessageFrom(data) {
  if (typeof data === 'string') return data
  return data?.message ?? data?.Message ?? data?.error ?? data?.errorMessage
}

async function sendAuthorisedLocationsFindRequest({
  world,
  endpt,
  ids,
  authCase
}) {
  const endpoint = resolveStringArg(endpt)
  const uri = makeUri(baseUrl, endpoint, '')
  const normalisedAuthCase = authCase.toLowerCase()
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }

  if (normalisedAuthCase === 'valid cognito jwt') {
    const tokenGen =
      world.tokenGen || (await token(tokenUrl, clientId, secretId))
    headers.Authorization = `Bearer ${tokenGen}`
    world.tokenGen = tokenGen
  } else if (normalisedAuthCase === 'malformed jwt') {
    headers.Authorization = 'Bearer not-a-jwt'
  } else if (normalisedAuthCase === 'jwt not signed by cognito') {
    headers.Authorization = `Bearer ${cognitoShapedJwtThatIsNotSignedByCognito()}`
  } else if (
    normalisedAuthCase === 'valid cognito jwt without required scope'
  ) {
    headers.Authorization = `Bearer ${await insufficientScopeToken()}`
  } else if (normalisedAuthCase === 'expired cognito jwt') {
    headers.Authorization = `Bearer ${expiredCognitoToken()}`
  } else if (normalisedAuthCase !== 'missing authorization header') {
    throw new Error(`Unsupported auth case "${authCase}"`)
  }

  try {
    world.response = await axios.request({
      method: 'post',
      url: uri,
      headers,
      data: { ids: resolveValueArg(ids) }
    })
  } catch (error) {
    world.response = toResponseLike(error, uri)
  }

  world.endpoint = endpoint
  world.authCase = authCase
}

Given(
  'the user submits {string} authorised locations find POST request with ids {string} using {string}',
  async function (endpt, ids, authCase) {
    await sendAuthorisedLocationsFindRequest({
      world: this,
      endpt,
      ids,
      authCase
    })
  }
)

Then(
  'the authorised endpoint returns {string} with error message {string}',
  async function (statusCode, message) {
    const res = this.response

    if (!res) throw new Error('No response captured at all (unexpected).')
    if (res.status === 0) {
      throw new Error(
        `Expected ${statusCode} but got NETWORK_ERROR (0). URI=${res.data?.uri} :: ${res.data?.message}`
      )
    }

    expect(res.status.toString()).to.equal(statusCode)
    expect(errorMessageFrom(res.data)).to.equal(message)
  }
)
