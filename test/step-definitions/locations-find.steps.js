import { Given, Then } from '@cucumber/cucumber'
import { expect } from 'chai'

import {
  assertBadRequestResponse,
  assertOkResponseWithDataArray
} from '../utils/response-assertions.js'
import {
  assertLocationPiiMasked,
  assertLocationPiiUnmasked
} from '../utils/pii-find-assertions.js'
import {
  assertLocationShape,
  assertLocationsFindSuccess
} from '../utils/locations-find-assertions.js'
import {
  resolveFindValueArg,
  sendFindPostRequest
} from '../utils/find-request.js'

Given(
  'the user submits {string} locations find POST request with ids {string}',
  async function (endpt, ids) {
    await sendFindPostRequest({
      world: this,
      endpt,
      body: { ids: resolveFindValueArg(ids) }
    })
  }
)

Given(
  'the user submits {string} locations find POST request with ids {string} page {string} pageSize {string}',
  async function (endpt, ids, page, pageSize) {
    await sendFindPostRequest({
      world: this,
      endpt,
      body: { ids: resolveFindValueArg(ids) },
      page,
      pageSize
    })
  }
)

Given(
  'the user submits {string} locations find POST request with ids {string} using invalid token',
  async function (endpt, ids) {
    await sendFindPostRequest({
      world: this,
      endpt,
      body: { ids: resolveFindValueArg(ids) },
      tokenMode: 'invalid'
    })
  }
)

Given(
  'the user submits {string} locations find POST request with ids {string} using tampered token',
  async function (endpt, ids) {
    await sendFindPostRequest({
      world: this,
      endpt,
      body: { ids: resolveFindValueArg(ids) },
      tokenMode: 'tampered'
    })
  }
)

Given(
  'the user submits {string} locations find POST request with no body',
  async function (endpt) {
    await sendFindPostRequest({
      world: this,
      endpt,
      includeBody: false
    })
  }
)

Given(
  'the user submits {string} locations find POST request with raw body {string}',
  async function (endpt, rawBody) {
    await sendFindPostRequest({
      world: this,
      endpt,
      body: resolveFindValueArg(rawBody)
    })
  }
)

Given(
  'the user submits {string} locations find POST request with ids {string} using PII-authorised client',
  async function (endpt, ids) {
    await sendFindPostRequest({
      world: this,
      endpt,
      body: { ids: resolveFindValueArg(ids) },
      usePiiAuthorisedClient: true
    })
  }
)

Then(
  'the locations find API should return a validation error response',
  async function () {
    const res = this.response

    assertBadRequestResponse(res, { validateOptionalCodes: true })
  }
)

Then(
  'the locations find API should return matching locations for ids {string}',
  async function (ids) {
    const submittedIds = resolveFindValueArg(ids)
    const res = this.response

    const locations = assertLocationsFindSuccess(res)
    expect(locations.length).to.be.greaterThan(0)

    const returnedIds = locations.map((location) => location.id)
    const uniqueReturnedIds = new Set(returnedIds)

    expect(uniqueReturnedIds.size).to.equal(
      returnedIds.length,
      'returned location ids must be unique'
    )

    for (const location of locations) {
      expect(
        submittedIds,
        `Expected returned location id "${location.id}" to be in submitted ids`
      ).to.include(location.id)
      assertLocationShape(location)
    }
  }
)

Then(
  'the locations find API should return masked PII fields',
  async function () {
    assertLocationPiiMasked(assertOkResponseWithDataArray(this.response))
  }
)

Then(
  'the locations find API should return unmasked PII fields',
  async function () {
    assertLocationPiiUnmasked(assertOkResponseWithDataArray(this.response))
  }
)
