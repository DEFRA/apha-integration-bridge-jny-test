import { Given, Then } from '@cucumber/cucumber'
import axios from 'axios'
import { expect } from 'chai'

import { cfg, makeUri } from '../../config/properties.js'
import { assertHttpExceptionResponse } from '../utils/response-assertions.js'
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

function expectHeader(headers, name, expectedValue) {
  expect(headers).to.have.property(name)
  expect(headers[name]).to.equal(expectedValue)
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

  switch (normalisedAuthCase) {
    case 'valid cognito jwt': {
      const tokenGen =
        world.tokenGen || (await token(tokenUrl, clientId, secretId))
      headers.Authorization = `Bearer ${tokenGen}`
      world.tokenGen = tokenGen
      break
    }
    case 'malformed jwt':
      headers.Authorization = 'Bearer not-a-jwt'
      break
    case 'jwt not signed by cognito':
      headers.Authorization = `Bearer ${cognitoShapedJwtThatIsNotSignedByCognito()}`
      break
    case 'missing authorization header':
      break
    default:
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

Given(
  'the user requests an unmatched gateway route without authentication',
  async function () {
    const uri = makeUri(baseUrl)

    try {
      this.response = await axios.get(uri, {
        headers: { Accept: 'application/json' }
      })
    } catch (error) {
      this.response = toResponseLike(error, uri)
    }

    this.endpoint = '/'
  }
)

Then(
  'the API returns HTTPException status {string} code {string} with error code {string}',
  async function (statusCode, code, errorCode) {
    assertHttpExceptionResponse(this.response, {
      expectedStatus: Number(statusCode),
      expectedCode: code,
      expectedFirstErrorCode: errorCode
    })
  }
)

Then('the API response status should be {string}', async function (statusCode) {
  const res = this.response

  if (!res) throw new Error('No response captured at all (unexpected).')
  expect(res.status.toString()).to.equal(statusCode)
})

Then('the API response should include security headers', async function () {
  const res = this.response

  if (!res) throw new Error('No response captured at all (unexpected).')

  const expectedHeaders = {
    'cache-control': 'no-store',
    pragma: 'no-cache',
    'content-security-policy':
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    'referrer-policy': 'no-referrer',
    'cross-origin-opener-policy': 'same-origin',
    'cross-origin-resource-policy': 'same-origin',
    'permissions-policy':
      'camera=(), microphone=(), geolocation=(), browsing-topics=()',
    'x-xss-protection': '0'
  }

  for (const [name, value] of Object.entries(expectedHeaders)) {
    expectHeader(res.headers, name, value)
  }
})
