import { Given, Then } from '@cucumber/cucumber'
import { expect } from 'chai'

import {
  expectedRateLimitHeaderValue,
  maxRateLimitAttempts,
  sendRateLimitFindRequest
} from '../utils/rate-limit-client.js'
import { assertOkResponse } from '../utils/response-assertions.js'

const rateLimitedClient = 'RATE_LIMITED'
const controlClient = 'RATE_CONTROL'
const rateLimitHeaders = [
  'x-ratelimit-limit',
  'x-ratelimit-remaining',
  'x-ratelimit-reset'
]

Given(
  'the rate limit control client submits {string} locations find POST request with ids {string}',
  async function (endpt, ids) {
    this.response = await sendRateLimitFindRequest({
      world: this,
      clientName: controlClient,
      endpt,
      ids
    })
  }
)

Given(
  'the rate limited client has exceeded its rate limit using {string} locations find POST request with ids {string}',
  async function (endpt, ids) {
    const responses = await Promise.all(
      Array.from({ length: maxRateLimitAttempts() }, () =>
        sendRateLimitFindRequest({
          world: this,
          clientName: rateLimitedClient,
          endpt,
          ids
        })
      )
    )

    this.rateLimitedResponses = responses
    this.rateLimitedResponse = responses.find(
      (response) => response.status === 429
    )

    if (!this.rateLimitedResponse) {
      throw new Error(
        `Expected ${rateLimitedClient} client to receive 429 within a ${responses.length} request burst. ` +
          'For dev config RATE_LIMIT_POINTS=10 and RATE_LIMIT_DURATION=1, the default RATE_LIMIT_MAX_ATTEMPTS=25 should be enough. ' +
          'If this still fails, confirm rate limiting is deployed/enabled for the selected environment and client.'
      )
    }
  }
)

Then('the API response should include rate limit headers', function () {
  assertRateLimitHeaders(this.response)
})

Then(
  'the rate limited client should have received a too many requests response',
  function () {
    const response = this.rateLimitedResponse

    expect(response, 'Expected captured rate limited response').to.be.an(
      'object'
    )
    expect(response.status).to.equal(429)
    assertRateLimitHeaders(response)
    assertRateLimitBody(response.data)
  }
)

Then('the control client request should be successful', function () {
  assertOkResponse(this.response)
})

function assertRateLimitHeaders(response) {
  expect(response, 'Expected response').to.be.an('object')
  expect(response.headers, 'Expected response headers').to.not.equal(undefined)

  for (const header of rateLimitHeaders) {
    const value = headerValue(response.headers, header)
    expect(
      value,
      `Expected ${header} header. Available headers: ${availableHeaders(response.headers)}`
    ).to.not.equal(undefined)
    expect(String(value).trim().length).to.be.greaterThan(0)
  }

  const expectedLimit = expectedRateLimitHeaderValue()
  if (expectedLimit) {
    expect(String(headerValue(response.headers, 'x-ratelimit-limit'))).to.equal(
      expectedLimit
    )
  }
}

function headerValue(headers, name) {
  return typeof headers.get === 'function' ? headers.get(name) : headers[name]
}

function availableHeaders(headers) {
  if (typeof headers.toJSON === 'function') {
    return Object.keys(headers.toJSON()).join(', ')
  }

  return Object.keys(headers || {}).join(', ')
}

function assertRateLimitBody(body) {
  const bodyText =
    typeof body === 'string' ? body : JSON.stringify(body || {}).toLowerCase()

  expect(bodyText).to.satisfy(
    (text) =>
      text.includes('rate') ||
      text.includes('limit') ||
      text.includes('too many')
  )
}
